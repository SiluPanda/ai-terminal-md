import type { AITerminalRenderer, RendererConfig, StreamState } from './types';
import type { ColorLevel } from './ansi';
import { resolveTheme, detectTheme } from './theme';
import { detectColorLevel, detectUnicode, getWidth, isTTY as detectIsTTY } from './terminal';
import { renderMarkdown, type ResolvedConfig } from './render-markdown';

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
  };
}

class TerminalRenderer implements AITerminalRenderer {
  readonly config: Readonly<RendererConfig>;
  private readonly resolved: ResolvedConfig;

  constructor(config?: RendererConfig) {
    this.config = Object.freeze({ ...config });
    this.resolved = resolveConfig(config);
  }

  render(markdown: string): string {
    return renderMarkdown(markdown, this.resolved);
  }

  renderStream(_stream: AsyncIterable<string>): AsyncIterable<string> {
    throw new Error('Streaming not yet implemented');
  }

  renderChunk(_chunk: string, _state?: StreamState): { output: string; state: StreamState } {
    throw new Error('Streaming not yet implemented');
  }

  flush(_state: StreamState): string {
    throw new Error('Streaming not yet implemented');
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
