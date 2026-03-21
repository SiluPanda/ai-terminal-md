import type { AITerminalRenderer, RendererConfig, StreamState } from './types';
import type { ColorLevel } from './ansi';
import { resolveTheme, detectTheme } from './theme';
import { detectColorLevel, detectUnicode, getWidth, isTTY as detectIsTTY } from './terminal';
import { renderMarkdown, type ResolvedConfig } from './render-markdown';
import { parseAIElements } from './parser';
import { renderAIElementWithModes } from './render-ai';
import { stripAnsi } from './ansi';

/** Resolve user-provided config into a fully resolved config with no optionals. */
export function resolveConfig(config?: RendererConfig): ResolvedConfig {
  const theme = config?.theme !== undefined
    ? resolveTheme(config.theme)
    : detectTheme();

  const colorLevel: ColorLevel = config?.colorLevel ?? detectColorLevel();

  const envWidth = parseInt(process.env.AI_TERMINAL_MD_WIDTH || '', 10);
  const width = config?.width ?? (isNaN(envWidth) ? getWidth() : envWidth);

  const unicode = config?.unicode ?? detectUnicode();

  // Non-TTY mode: when stdout is not a TTY, strip ANSI codes
  // colorLevel 'none' also implies non-TTY behavior
  const nonTTY = config?.colorLevel === 'none' || (!detectIsTTY() && config?.colorLevel === undefined);

  return {
    theme,
    colorLevel,
    width,
    unicode,
    wordWrapEnabled: config?.wordWrap !== false,
    margin: config?.margin ?? 0,
    nonTTY,
    codeBackground: config?.codeBackground !== false,
    codeLineNumbers: config?.codeLineNumbers ?? false,
    codeLanguageLabel: config?.codeLanguageLabel !== false,
    codePadding: config?.codePadding ?? 1,
    showLinkUrls: config?.showLinkUrls !== false,
    tableStyle: config?.tableStyle ?? 'unicode',
    highlighter: config?.highlighter,
  };
}

/** Create an initial empty StreamState. */
function initialState(): StreamState {
  return {
    buffer: '',
    openCodeBlock: false,
    codeLang: '',
    openThinkingBlock: false,
  };
}

/** Regex that matches a fenced code block opening line. */
const CODE_FENCE_OPEN = /^(`{3,}|~{3,})([\w-]*)\s*$/;
/** Regex that matches a fenced code block closing line. */
const CODE_FENCE_CLOSE = /^(`{3,}|~{3,})\s*$/;

const THINKING_OPEN_RE = /^<(thinking|antThinking|reflection|scratchpad|reasoning|inner_monologue|thought)(?:\s[^>]*)?>/i;
const THINKING_CLOSE_RE = /^<\/(thinking|antThinking|reflection|scratchpad|reasoning|inner_monologue|thought)>/i;

interface LineState {
  openCodeBlock: boolean;
  codeLang: string;
  openThinkingBlock: boolean;
  /** Line index where the last unclosed block started (-1 if none). */
  lastOpenLineIndex: number;
}

/**
 * Scan lines tracking code-fence and thinking-block open/close state.
 * Records the line index where the last unclosed block started, so callers
 * can split the content at that boundary.
 */
function scanLines(lines: string[]): LineState {
  let openCodeBlock = false;
  let codeLang = '';
  let openThinkingBlock = false;
  let lastOpenLineIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!openCodeBlock) {
      if (THINKING_CLOSE_RE.test(line) && openThinkingBlock) {
        openThinkingBlock = false;
        lastOpenLineIndex = -1;
      } else if (THINKING_OPEN_RE.test(line)) {
        openThinkingBlock = true;
        lastOpenLineIndex = i;
      }

      const fenceMatch = line.match(CODE_FENCE_OPEN);
      if (fenceMatch) {
        openCodeBlock = true;
        codeLang = fenceMatch[2] || '';
        lastOpenLineIndex = i;
      }
    } else if (CODE_FENCE_CLOSE.test(line)) {
      openCodeBlock = false;
      codeLang = '';
      lastOpenLineIndex = -1;
    }
  }

  return { openCodeBlock, codeLang, openThinkingBlock, lastOpenLineIndex };
}

/**
 * Attempt to extract and render as many complete "segments" from the buffer
 * as possible, returning the rendered output and the remaining buffer.
 *
 * Strategy: render complete paragraphs (separated by blank lines), but hold
 * back any incomplete code fence or thinking blocks until they are closed.
 */
function flushCompleteSegments(
  buffer: string,
  resolved: ResolvedConfig,
  config: RendererConfig,
): { rendered: string; remaining: string; openCodeBlock: boolean; codeLang: string; openThinkingBlock: boolean } {
  let rendered = '';
  const lines = buffer.split('\n');

  const state = scanLines(lines);

  if (state.lastOpenLineIndex !== -1) {
    // There is an unclosed block. Render everything before it; hold the rest.
    const safeLines = lines.slice(0, state.lastOpenLineIndex);
    const heldLines = lines.slice(state.lastOpenLineIndex);
    const safeContent = safeLines.join('\n');
    const heldContent = heldLines.join('\n');

    if (safeContent.trim()) {
      rendered = renderWithAI(safeContent + '\n\n', resolved, config);
    }

    return {
      rendered,
      remaining: heldContent,
      openCodeBlock: state.openCodeBlock,
      codeLang: state.codeLang,
      openThinkingBlock: state.openThinkingBlock,
    };
  }

  // No unclosed blocks. Hold back the last incomplete paragraph unless
  // the buffer ends with a blank line (paragraph separator).
  const endsWithBlankLine = buffer.endsWith('\n\n');
  if (!endsWithBlankLine) {
    // Hold back from the last paragraph break
    const lastDoubleNewline = buffer.lastIndexOf('\n\n');
    if (lastDoubleNewline === -1) {
      // No complete paragraph yet — hold everything
      return { rendered: '', remaining: buffer, openCodeBlock: false, codeLang: '', openThinkingBlock: false };
    }
    const safeContent = buffer.slice(0, lastDoubleNewline + 2);
    const remaining = buffer.slice(lastDoubleNewline + 2);
    rendered = renderWithAI(safeContent, resolved, config);
    return { rendered, remaining, openCodeBlock: false, codeLang: '', openThinkingBlock: false };
  }

  // Buffer ends cleanly — render everything
  rendered = renderWithAI(buffer, resolved, config);
  return { rendered, remaining: '', openCodeBlock: false, codeLang: '', openThinkingBlock: false };
}

/** Render markdown with AI element parsing, respecting RendererConfig modes. */
function renderWithAI(markdown: string, resolved: ResolvedConfig, config: RendererConfig): string {
  const { cleanedMarkdown, elements } = parseAIElements(markdown);

  // Render the cleaned markdown (placeholders are treated as literal text by marked,
  // but they're \x00-delimited and won't appear in normal text)
  let output = renderMarkdown(cleanedMarkdown, resolved);

  // Replace placeholders with rendered AI elements
  // eslint-disable-next-line no-control-regex
  const placeholderRe = /\x00AI:([0-9a-f-]+)\x00/g;
  output = output.replace(placeholderRe, (_match, id: string) => {
    const el = elements.get(id);
    if (!el) return '';
    return renderAIElementWithModes(
      el,
      resolved,
      config.thinking ?? 'dim',
      config.artifacts ?? 'panel',
      config.toolUse ?? 'box',
      config.toolResult ?? 'box',
      config.semanticWrappers ?? 'strip',
      config.citations ?? 'color',
    );
  });

  return output;
}

class TerminalRenderer implements AITerminalRenderer {
  readonly config: Readonly<RendererConfig>;
  private readonly resolved: ResolvedConfig;

  constructor(config?: RendererConfig) {
    this.config = Object.freeze({ ...config });
    this.resolved = resolveConfig(config);
  }

  render(markdown: string): string {
    return renderWithAI(markdown, this.resolved, this.config);
  }

  renderChunk(chunk: string, state?: StreamState): { output: string; state: StreamState } {
    const current: StreamState = state ?? initialState();

    // Append chunk to buffer
    const newBuffer = current.buffer + chunk;

    const result = flushCompleteSegments(newBuffer, this.resolved, this.config);

    let output = result.rendered;
    if (this.resolved.nonTTY) {
      output = stripAnsi(output);
    }

    const newState: StreamState = {
      buffer: result.remaining,
      openCodeBlock: result.openCodeBlock,
      codeLang: result.codeLang,
      openThinkingBlock: result.openThinkingBlock,
    };

    return { output, state: newState };
  }

  flush(state: StreamState): string {
    if (!state.buffer) return '';

    let content = state.buffer;

    // Close any open code block to make it parseable
    if (state.openCodeBlock) {
      content += '\n```\n';
    }

    let output = renderWithAI(content, this.resolved, this.config);

    if (this.resolved.nonTTY) {
      output = stripAnsi(output);
    }

    return output;
  }

  async *renderStream(stream: AsyncIterable<string>): AsyncIterable<string> {
    let state: StreamState = initialState();

    for await (const chunk of stream) {
      const { output, state: nextState } = this.renderChunk(chunk, state);
      state = nextState;
      if (output) yield output;
    }

    const final = this.flush(state);
    if (final) yield final;
  }
}

/** Create a configured renderer instance. */
export function createRenderer(config?: RendererConfig): AITerminalRenderer {
  return new TerminalRenderer(config);
}

/** Render markdown to an ANSI-formatted string (convenience function). */
export function render(markdown: string, options?: RendererConfig): string {
  const renderer = createRenderer(options);
  return renderer.render(markdown);
}
