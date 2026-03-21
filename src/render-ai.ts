import type { ResolvedConfig } from './render-markdown';
import type {
  AIElement,
  ThinkingElement,
  ArtifactElement,
  ToolUseElement,
  ToolResultElement,
  SemanticWrapperElement,
  CitationElement,
} from './parser';
import { applyStyle, stripAnsi, visibleLength } from './ansi';

/** Build a simple horizontal line of a given width using a character. */
function hline(char: string, width: number): string {
  return char.repeat(Math.max(width, 1));
}

/** Pad a string to exactly `width` visible chars (truncate or pad right). */
function padTo(str: string, width: number): string {
  const len = visibleLength(str);
  if (len >= width) return str;
  return str + ' '.repeat(width - len);
}

/** Wrap content lines with a left-border │ character. */
function borderLines(
  lines: string[],
  borderStr: string,
  width: number,
): string {
  return lines
    .map(line => borderStr + ' ' + padTo(line, width - visibleLength(stripAnsi(borderStr)) - 2))
    .join('\n');
}

/** ─────────────────── THINKING ─────────────────── */

export function renderThinking(
  element: ThinkingElement,
  mode: string,
  config: ResolvedConfig,
): string {
  if (mode === 'hide') return '';

  const { theme, colorLevel } = config;

  const headerText = '▸ Thinking';
  const isDim = mode === 'dim';

  const headerStyle = isDim ? theme.thinkingHeader : { ...theme.thinkingHeader, dim: false };
  const borderStyle = isDim ? theme.thinkingBorder : { ...theme.thinkingBorder, dim: false };
  const textStyle = isDim ? theme.thinkingText : {};

  const styledHeader = applyStyle(headerText, headerStyle, colorLevel);
  const styledBorder = applyStyle('│', borderStyle, colorLevel);

  const contentLines = element.content.split('\n');
  const borderedContent = contentLines
    .map(line => {
      const styledLine = isDim ? applyStyle(line, textStyle, colorLevel) : line;
      return styledBorder + ' ' + styledLine;
    })
    .join('\n');

  return '\n' + styledHeader + '\n' + borderedContent + '\n\n';
}

/** ─────────────────── ARTIFACT ─────────────────── */

export function renderArtifact(
  element: ArtifactElement,
  mode: string,
  config: ResolvedConfig,
): string {
  if (mode === 'hide') return '';

  const { theme, colorLevel, width } = config;
  const contentWidth = Math.max(width - 4, 20);

  const titleText = element.title ?? element.identifier ?? 'Artifact';
  const typeLabel = element.artifactType ? ` [${element.artifactType}]` : '';

  if (mode === 'inline') {
    const label = applyStyle(`Artifact: ${titleText}${typeLabel}`, theme.artifactTitle, colorLevel);
    return '\n' + label + '\n' + element.content + '\n\n';
  }

  // panel mode (default)
  const borderStyle = theme.artifactBorder;
  const titleStyle = theme.artifactTitle;

  // Build top border: ╭─ Title [type] ─╮
  const styledTitle = applyStyle(` ${titleText}${typeLabel} `, titleStyle, colorLevel);
  const plainTitleLen = visibleLength(styledTitle);
  const dashCount = Math.max(contentWidth - plainTitleLen - 2, 0);
  const leftDashes = '─'.repeat(Math.floor(dashCount / 2));
  const rightDashes = '─'.repeat(dashCount - Math.floor(dashCount / 2));

  const topBorder = applyStyle('╭' + leftDashes, borderStyle, colorLevel)
    + styledTitle
    + applyStyle(rightDashes + '╮', borderStyle, colorLevel);

  const bottomBorder = applyStyle('╰' + '─'.repeat(contentWidth) + '╯', borderStyle, colorLevel);
  const styledSide = applyStyle('│', borderStyle, colorLevel);

  const contentLines = element.content.split('\n');
  const borderedLines = contentLines.map(line => {
    const remaining = Math.max(contentWidth - visibleLength(line), 0);
    return styledSide + ' ' + line + ' '.repeat(remaining) + ' ' + styledSide;
  });

  return '\n' + topBorder + '\n' + borderedLines.join('\n') + '\n' + bottomBorder + '\n\n';
}

/** ─────────────────── TOOL USE ─────────────────── */

export function renderToolUse(
  element: ToolUseElement,
  mode: string,
  config: ResolvedConfig,
): string {
  if (mode === 'hide') return '';

  const { theme, colorLevel, width } = config;
  const contentWidth = Math.max(width - 4, 20);

  if (mode === 'inline') {
    const entries = Object.entries(element.arguments);
    const argsStr = entries.map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ');
    const text = `[Tool: ${element.toolName}(${argsStr})]`;
    return applyStyle(text, theme.toolUseHeader, colorLevel) + '\n';
  }

  // box mode (default)
  const borderStyle = theme.toolUseBorder;
  const headerStyle = theme.toolUseHeader;
  const keyStyle = theme.toolUseKey;
  const valStyle = theme.toolUseValue;

  const headerText = ` Tool Call: ${element.toolName} `;
  const styledHeader = applyStyle(headerText, headerStyle, colorLevel);
  const plainHeaderLen = visibleLength(styledHeader);
  const dashCount = Math.max(contentWidth - plainHeaderLen - 2, 0);
  const leftDashes = '─'.repeat(Math.floor(dashCount / 2));
  const rightDashes = '─'.repeat(dashCount - Math.floor(dashCount / 2));

  const topBorder = applyStyle('┌' + leftDashes, borderStyle, colorLevel)
    + styledHeader
    + applyStyle(rightDashes + '┐', borderStyle, colorLevel);

  const bottomBorder = applyStyle('└' + '─'.repeat(contentWidth) + '┘', borderStyle, colorLevel);
  const styledSide = applyStyle('│', borderStyle, colorLevel);

  // Render args as JSON lines
  const argsText = JSON.stringify(element.arguments, null, 2);
  const argsLines = argsText.split('\n').map(line => {
    // Colorize keys vs values
    const keyMatch = line.match(/^(\s*)"([^"]+)"(\s*:\s*)(.*)/);
    if (keyMatch) {
      const [, indent, key, colon, rest] = keyMatch;
      return styledSide + ' '
        + indent
        + applyStyle(`"${key}"`, keyStyle, colorLevel)
        + colon
        + applyStyle(rest, valStyle, colorLevel);
    }
    return styledSide + ' ' + line;
  });

  return '\n' + topBorder + '\n' + argsLines.join('\n') + '\n' + bottomBorder + '\n\n';
}

/** ─────────────────── TOOL RESULT ─────────────────── */

export function renderToolResult(
  element: ToolResultElement,
  mode: string,
  config: ResolvedConfig,
): string {
  if (mode === 'hide') return '';

  const { theme, colorLevel, width } = config;
  const contentWidth = Math.max(width - 4, 20);

  const statusIcon = element.isError ? '✗' : '✓';
  const statusStyle = element.isError ? theme.toolResultError : theme.toolResultSuccess;
  const toolLabel = element.toolName ? ` ${element.toolName}` : '';

  if (mode === 'inline') {
    const statusStr = applyStyle(statusIcon, statusStyle, colorLevel);
    const text = `${statusStr} Tool Result${toolLabel}: ${element.content}`;
    return text + '\n';
  }

  // box mode (default)
  const borderStyle = theme.toolResultBorder;
  const headerStyle = theme.toolResultHeader;

  const styledStatus = applyStyle(statusIcon, statusStyle, colorLevel);
  const headerText = ` Tool Result${toolLabel} `;
  const styledHeader = styledStatus + applyStyle(headerText, headerStyle, colorLevel);
  const plainHeaderLen = 1 + visibleLength(applyStyle(headerText, headerStyle, colorLevel));
  const dashCount = Math.max(contentWidth - plainHeaderLen - 2, 0);
  const leftDashes = '─'.repeat(Math.floor(dashCount / 2));
  const rightDashes = '─'.repeat(dashCount - Math.floor(dashCount / 2));

  const topBorder = applyStyle('┌' + leftDashes, borderStyle, colorLevel)
    + styledHeader
    + applyStyle(rightDashes + '┐', borderStyle, colorLevel);

  const bottomBorder = applyStyle('└' + '─'.repeat(contentWidth) + '┘', borderStyle, colorLevel);
  const styledSide = applyStyle('│', borderStyle, colorLevel);

  const contentLines = element.content.split('\n').map(line => styledSide + ' ' + line);

  return '\n' + topBorder + '\n' + contentLines.join('\n') + '\n' + bottomBorder + '\n\n';
}

/** ─────────────────── SEMANTIC WRAPPER ─────────────────── */

export function renderSemanticWrapper(
  element: SemanticWrapperElement,
  mode: string,
  config: ResolvedConfig,
): string {
  // 'keep' would have meant the tags are left in — but at this point
  // we've already extracted them, so just return content.
  if (mode === 'label') {
    const label = applyStyle(`[${element.tagName}]`, config.theme.semanticLabel, config.colorLevel);
    return label + '\n' + element.content + '\n\n';
  }
  // 'strip' and default: return content only
  return element.content + '\n\n';
}

/** ─────────────────── CITATION ─────────────────── */

export function renderCitation(
  element: CitationElement,
  mode: string,
  config: ResolvedConfig,
): string {
  if (mode === 'hide') return '';
  if (mode === 'plain') return `[${element.label}]`;
  // 'color' (default)
  return applyStyle(`[${element.label}]`, config.theme.citation, config.colorLevel);
}

/** Dispatch to the correct renderer based on element type and config settings. */
export function renderAIElement(element: AIElement, config: ResolvedConfig): string {
  // The mode for each element type is stored in the wider RendererConfig.
  // We access it through the resolved config via the thinkingMode/artifactMode etc.
  // Since ResolvedConfig doesn't carry these yet (they're in RendererConfig), we
  // default to the "show" / "panel" / "box" / "strip" / "color" modes here.
  // The renderer.ts layer will pass the correct mode via the renderAIElementWithMode helper.
  switch (element.type) {
    case 'thinking':
      return renderThinking(element, 'dim', config);
    case 'artifact':
      return renderArtifact(element, 'panel', config);
    case 'tool-use':
      return renderToolUse(element, 'box', config);
    case 'tool-result':
      return renderToolResult(element, 'box', config);
    case 'semantic-wrapper':
      return renderSemanticWrapper(element, 'strip', config);
    case 'citation':
      return renderCitation(element, 'color', config);
  }
}

/** Dispatch with explicit mode overrides from RendererConfig. */
export function renderAIElementWithModes(
  element: AIElement,
  config: ResolvedConfig,
  thinking: string,
  artifacts: string,
  toolUse: string,
  toolResult: string,
  semanticWrappers: string,
  citations: string,
): string {
  switch (element.type) {
    case 'thinking':
      return renderThinking(element, thinking, config);
    case 'artifact':
      return renderArtifact(element, artifacts, config);
    case 'tool-use':
      return renderToolUse(element, toolUse, config);
    case 'tool-result':
      return renderToolResult(element, toolResult, config);
    case 'semantic-wrapper':
      return renderSemanticWrapper(element, semanticWrappers, config);
    case 'citation':
      return renderCitation(element, citations, config);
  }
}

// Re-export padding helper for use in tests
export { hline, padTo, borderLines };
