/** ANSI style definition for a single visual element. */
export interface Style {
  /** Foreground color. ANSI color name, 256-color index, or hex RGB. */
  fg?: string;
  /** Background color. ANSI color name, 256-color index, or hex RGB. */
  bg?: string;
  /** Bold text. */
  bold?: boolean;
  /** Dim text. */
  dim?: boolean;
  /** Italic text. */
  italic?: boolean;
  /** Underlined text. */
  underline?: boolean;
  /** Strikethrough text. */
  strikethrough?: boolean;
}

/** Complete theme defining styles for every renderable element. */
export interface Theme {
  // Headers
  heading1: Style;
  heading2: Style;
  heading3: Style;
  heading4: Style;
  heading5: Style;
  heading6: Style;
  headingUnderline: Style;

  // Text
  body: Style;
  bold: Style;
  italic: Style;
  strikethrough: Style;
  link: Style;
  linkUrl: Style;

  // Code
  codeBackground: Style;
  codeLanguageLabel: Style;
  codeLineNumber: Style;
  inlineCode: Style;

  // Syntax Highlighting
  syntaxKeyword: Style;
  syntaxString: Style;
  syntaxNumber: Style;
  syntaxComment: Style;
  syntaxOperator: Style;
  syntaxType: Style;
  syntaxFunction: Style;
  syntaxVariable: Style;
  syntaxConstant: Style;
  syntaxPunctuation: Style;
  syntaxAttribute: Style;
  syntaxTag: Style;
  syntaxProperty: Style;

  // Blocks
  blockquoteBorder: Style;
  blockquoteText: Style;
  horizontalRule: Style;
  listBullet: Style;
  listNumber: Style;
  tableBorder: Style;
  tableHeader: Style;

  // AI Elements
  thinkingHeader: Style;
  thinkingBorder: Style;
  thinkingText: Style;
  artifactBorder: Style;
  artifactTitle: Style;
  toolUseBorder: Style;
  toolUseHeader: Style;
  toolUseKey: Style;
  toolUseValue: Style;
  toolResultBorder: Style;
  toolResultHeader: Style;
  toolResultSuccess: Style;
  toolResultError: Style;
  citation: Style;
  semanticLabel: Style;
}

/** Built-in theme names. */
export type ThemeName = 'dark' | 'light' | 'minimal' | 'monochrome';

/** Token category for syntax highlighting. */
export type TokenCategory =
  | 'keyword'
  | 'string'
  | 'number'
  | 'comment'
  | 'operator'
  | 'type'
  | 'function'
  | 'variable'
  | 'constant'
  | 'punctuation'
  | 'attribute'
  | 'tag'
  | 'property'
  | 'plain';

/** A single highlighted token with its text and semantic category. */
export interface HighlightToken {
  text: string;
  category: TokenCategory;
}

/** Pluggable syntax highlighter interface. */
export interface CustomHighlighter {
  highlight(code: string, language: string): HighlightToken[];
}

/** Configuration for creating a renderer instance. */
export interface RendererConfig {
  /**
   * Color theme. A built-in theme name or a custom theme object.
   * Default: 'dark'.
   */
  theme?: ThemeName | Partial<Theme> & { baseTheme?: ThemeName };

  /**
   * Terminal width in columns.
   * Default: auto-detected from process.stdout.columns, or 80.
   */
  width?: number;

  /**
   * Color support level.
   * Default: auto-detected from terminal capabilities.
   */
  colorLevel?: 'none' | '16' | '256' | 'truecolor';

  /**
   * Whether to use Unicode characters for borders, bullets, and decorative elements.
   * Default: auto-detected from terminal capabilities.
   */
  unicode?: boolean;

  /**
   * How to render thinking blocks.
   * 'show': full brightness with header and border.
   * 'dim': dimmed text with header and border (default).
   * 'hide': omit entirely.
   */
  thinking?: 'show' | 'hide' | 'dim';

  /**
   * How to render artifact blocks.
   * 'panel': bordered panel with title bar (default).
   * 'inline': title label above content, no border.
   * 'hide': omit entirely.
   */
  artifacts?: 'panel' | 'inline' | 'hide';

  /**
   * How to render tool use blocks.
   * 'box': bordered box with tool name header (default).
   * 'inline': compact inline representation.
   * 'hide': omit entirely.
   */
  toolUse?: 'box' | 'inline' | 'hide';

  /**
   * How to render tool result blocks.
   * 'box': bordered box with result header (default).
   * 'inline': compact inline representation.
   * 'hide': omit entirely.
   */
  toolResult?: 'box' | 'inline' | 'hide';

  /**
   * How to handle semantic wrapper tags (<result>, <answer>, etc.).
   * 'strip': remove tags, render inner content (default).
   * 'label': remove tags, add a subtle label.
   * 'keep': render tags as literal text.
   */
  semanticWrappers?: 'strip' | 'label' | 'keep';

  /**
   * How to render citations.
   * 'color': colored inline markers (default).
   * 'plain': no special styling.
   * 'hide': remove citations from output.
   */
  citations?: 'color' | 'plain' | 'hide';

  /**
   * Whether to apply background color to code blocks.
   * Default: true.
   */
  codeBackground?: boolean;

  /**
   * Whether to show line numbers in code blocks.
   * Default: false.
   */
  codeLineNumbers?: boolean;

  /**
   * Whether to show the language label on code blocks.
   * Default: true.
   */
  codeLanguageLabel?: boolean;

  /**
   * Horizontal padding (spaces) inside code blocks.
   * Default: 1.
   */
  codePadding?: number;

  /**
   * Custom syntax highlighter.
   * Default: built-in highlighter.
   */
  highlighter?: CustomHighlighter;

  /**
   * Border style for tables.
   * 'unicode': box-drawing characters (default).
   * 'ascii': ASCII characters (+, -, |).
   * 'none': no borders, space-separated columns.
   */
  tableStyle?: 'unicode' | 'ascii' | 'none';

  /**
   * Whether to show URLs after link text.
   * Default: true.
   */
  showLinkUrls?: boolean;

  /**
   * Whether to word-wrap text to fit the terminal width.
   * Default: true.
   */
  wordWrap?: boolean;

  /**
   * Left margin (number of spaces) for all rendered content.
   * Default: 0.
   */
  margin?: number;
}

/** Rendering options for the top-level render() function. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RenderOptions extends RendererConfig {
  // Identical to RendererConfig — exists as a separate type for API clarity.
}

/** Opaque state for streaming rendering. */
export interface StreamState {
  readonly _internal: unknown;
}

/** Public renderer interface. */
export interface AITerminalRenderer {
  /** Render a complete markdown string to an ANSI-formatted string. */
  render(markdown: string): string;

  /** Render a stream of markdown chunks incrementally. */
  renderStream(stream: AsyncIterable<string>): AsyncIterable<string>;

  /** Render a single chunk of markdown incrementally. */
  renderChunk(
    chunk: string,
    state?: StreamState,
  ): { output: string; state: StreamState };

  /** Flush any buffered content from a streaming session. */
  flush(state: StreamState): string;

  /** The current renderer configuration (read-only). */
  readonly config: Readonly<RendererConfig>;
}
