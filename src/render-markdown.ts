import { Marked, type Tokens } from 'marked';
import type { Theme, Style, CustomHighlighter } from './types';
import type { ColorLevel } from './ansi';
import { applyStyle, stripAnsi, visibleLength } from './ansi';
import { getBoxChars, type BoxChars } from './terminal';
import { wordWrap } from './wrap';
import { highlightWithFallback } from './highlighter';

/** Fully resolved renderer configuration with no optional values. */
export interface ResolvedConfig {
  theme: Theme;
  colorLevel: ColorLevel;
  width: number;
  unicode: boolean;
  wordWrapEnabled: boolean;
  margin: number;
  nonTTY: boolean;
  codeBackground: boolean;
  codeLineNumbers: boolean;
  codeLanguageLabel: boolean;
  codePadding: number;
  showLinkUrls: boolean;
  tableStyle: 'unicode' | 'ascii' | 'none';
  highlighter?: CustomHighlighter;
}

/** Unescape HTML entities that marked may leave in token text. */
function unescapeHtml(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** Get the bullet character for a given nesting depth. */
function getBullet(depth: number, box: BoxChars): string {
  switch (depth) {
    case 0: return box.bullet;
    case 1: return box.circle;
    case 2: return box.square;
    default: return box.arrow;
  }
}

/** Get the ordered list label for a given index at a given depth. */
function getOrderedLabel(index: number, depth: number): string {
  if (depth === 0) {
    return `${index + 1}.`;
  }
  // Sub-items use a, b, c, etc.
  return String.fromCharCode(97 + (index % 26)) + '.';
}

/** Map a TokenCategory to the corresponding Theme style key. */
function categoryToStyle(category: import('./types').TokenCategory, theme: Theme): Style {
  switch (category) {
    case 'keyword': return theme.syntaxKeyword;
    case 'string': return theme.syntaxString;
    case 'number': return theme.syntaxNumber;
    case 'comment': return theme.syntaxComment;
    case 'operator': return theme.syntaxOperator;
    case 'type': return theme.syntaxType;
    case 'function': return theme.syntaxFunction;
    case 'variable': return theme.syntaxVariable;
    case 'constant': return theme.syntaxConstant;
    case 'punctuation': return theme.syntaxPunctuation;
    case 'attribute': return theme.syntaxAttribute;
    case 'tag': return theme.syntaxTag;
    case 'property': return theme.syntaxProperty;
    case 'plain': return {};
  }
}

/** Apply syntax highlighting to a single line of code. */
function highlightLine(
  line: string,
  lang: string,
  theme: Theme,
  colorLevel: ColorLevel,
  customHighlighter?: import('./types').CustomHighlighter,
): string {
  if (!lang) return line;

  const tokens = highlightWithFallback(line, lang, customHighlighter);

  // If the entire result is a single plain token, no highlighting was applied
  if (tokens.length === 1 && tokens[0].category === 'plain') {
    return line;
  }

  return tokens.map(token => {
    if (token.category === 'plain') return token.text;
    const style = categoryToStyle(token.category, theme);
    return applyStyle(token.text, style, colorLevel);
  }).join('');
}

/** Render a code block with background, language label, optional line numbers, and padding. */
function renderCodeBlock(
  text: string,
  lang: string,
  config: ResolvedConfig,
  theme: Theme,
  colorLevel: ColorLevel,
  contentWidth: number,
): string {
  const lines = text.split('\n');
  const pad = ' '.repeat(config.codePadding);
  const lineCount = lines.length;
  const lineNumWidth = config.codeLineNumbers ? String(lineCount).length : 0;

  // Build the language label line (right-aligned, dimmed)
  let langLine = '';
  if (config.codeLanguageLabel && lang) {
    const label = applyStyle(lang, theme.codeLanguageLabel, colorLevel);
    const labelPlain = lang;
    const spaces = Math.max(contentWidth - labelPlain.length, 0);
    langLine = ' '.repeat(spaces) + label;
    if (config.codeBackground) {
      // Apply background to the full-width language label line
      const bgLine = ' '.repeat(spaces) + labelPlain;
      const bgSpaces = Math.max(contentWidth - bgLine.length, 0);
      langLine = applyStyle(' '.repeat(spaces) + lang + ' '.repeat(bgSpaces), { ...theme.codeLanguageLabel, bg: theme.codeBackground.bg }, colorLevel);
    }
  }

  // Build each code line
  const codeLines = lines.map((line, i) => {
    let lineContent = '';
    if (config.codeLineNumbers) {
      const num = String(i + 1).padStart(lineNumWidth, ' ');
      lineContent += applyStyle(num, theme.codeLineNumber, colorLevel) + ' ';
    }

    // Apply syntax highlighting to the line content
    const highlightedLine = highlightLine(line, lang, theme, colorLevel, config.highlighter);
    lineContent += pad + highlightedLine;

    if (config.codeBackground && theme.codeBackground.bg) {
      // Pad to full width for background fill
      const visLen = stripAnsi(lineContent).length + config.codePadding;
      const remaining = Math.max(contentWidth - visLen, 0);
      const fullLine = lineContent + ' '.repeat(remaining + config.codePadding);
      return applyStyle(fullLine, theme.codeBackground, colorLevel);
    }
    return lineContent;
  });

  // Build the empty padding lines (vertical padding)
  let emptyLine = '';
  if (config.codeBackground && theme.codeBackground.bg) {
    emptyLine = applyStyle(' '.repeat(contentWidth), theme.codeBackground, colorLevel);
  }

  const parts: string[] = [];
  if (langLine) parts.push(langLine);
  if (emptyLine) parts.push(emptyLine);
  parts.push(...codeLines);
  if (emptyLine) parts.push(emptyLine);

  return '\n' + parts.join('\n') + '\n\n';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface RendererContext { parser: any }

/** Render a list (ordered or unordered) with proper bullets/numbering and nesting. */
function renderList(
  token: Tokens.List,
  depth: number,
  config: ResolvedConfig,
  theme: Theme,
  colorLevel: ColorLevel,
  box: BoxChars,
  ctx: RendererContext,
): string {
  let body = '';

  for (let i = 0; i < token.items.length; i++) {
    const item = token.items[i];
    const indent = '  '.repeat(depth);

    // Build the bullet or number prefix
    let prefix: string;
    if (token.ordered) {
      const label = getOrderedLabel(i, depth);
      prefix = applyStyle(label, theme.listNumber, colorLevel);
    } else {
      const bullet = getBullet(depth, box);
      prefix = applyStyle(bullet, theme.listBullet, colorLevel);
    }

    // Separate list sub-tokens into text tokens and nested list tokens
    // Filter out checkbox tokens for task items — we handle them separately
    const textTokens: Tokens.Generic[] = [];
    const nestedLists: Tokens.List[] = [];
    for (const t of item.tokens) {
      if (t.type === 'list') {
        nestedLists.push(t as Tokens.List);
      } else if (t.type === 'checkbox' && item.task) {
        // Skip — handled below with custom check/box characters
      } else {
        textTokens.push(t as Tokens.Generic);
      }
    }

    // Render the text content of this item
    let text = ctx.parser.parse(textTokens);
    // Remove trailing newlines from the parsed text
    text = text.replace(/\n+$/, '');
    // For multi-line text, only take the first line for the bullet line
    const textLines = text.split('\n');
    const firstLine = textLines[0];

    // Handle task list checkboxes
    if (item.task) {
      const checkChar = item.checked
        ? applyStyle(box.checkmark, { fg: 'green' }, colorLevel)
        : applyStyle(box.checkbox, { dim: true }, colorLevel);
      body += indent + checkChar + ' ' + firstLine + '\n';
    } else {
      body += indent + prefix + ' ' + firstLine + '\n';
    }

    // Continuation lines (if multi-line text)
    const continuationIndent = indent + '  ';
    for (let j = 1; j < textLines.length; j++) {
      if (textLines[j].trim() !== '') {
        body += continuationIndent + textLines[j] + '\n';
      }
    }

    // Render nested lists
    for (const nested of nestedLists) {
      body += renderList(nested, depth + 1, config, theme, colorLevel, box, ctx);
    }
  }

  return body;
}

/** Pad a string to a target width respecting alignment. */
function alignText(text: string, width: number, alignment: 'left' | 'center' | 'right'): string {
  const len = visibleLength(text);
  const padding = Math.max(width - len, 0);
  switch (alignment) {
    case 'right':
      return ' '.repeat(padding) + text;
    case 'center': {
      const left = Math.floor(padding / 2);
      const right = padding - left;
      return ' '.repeat(left) + text + ' '.repeat(right);
    }
    default:
      return text + ' '.repeat(padding);
  }
}

/** Render a table with box-drawing borders, auto-sized columns, and bold headers. */
function renderTable(
  token: Tokens.Table,
  config: ResolvedConfig,
  theme: Theme,
  colorLevel: ColorLevel,
  box: BoxChars,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: { parser: any },
): string {
  if (config.tableStyle === 'none') {
    // Render without borders — just aligned text
    const headerTexts = token.header.map(cell => ctx.parser.parseInline(cell.tokens));
    const rowTexts = token.rows.map(row =>
      row.map(cell => ctx.parser.parseInline(cell.tokens)),
    );

    // Calculate column widths
    const colCount = headerTexts.length;
    const colWidths: number[] = [];
    for (let c = 0; c < colCount; c++) {
      let max = visibleLength(headerTexts[c]);
      for (const row of rowTexts) {
        if (c < row.length) {
          max = Math.max(max, visibleLength(row[c]));
        }
      }
      colWidths.push(max);
    }

    const alignments = token.header.map(cell => cell.align || 'left');

    const lines: string[] = [];
    // Header
    const headerCols = headerTexts.map((text, c) =>
      applyStyle(alignText(text, colWidths[c], alignments[c] as 'left' | 'center' | 'right'), theme.tableHeader, colorLevel),
    );
    lines.push(headerCols.join('  '));

    // Body rows
    for (const row of rowTexts) {
      const cols = row.map((text, c) =>
        alignText(text, colWidths[c], alignments[c] as 'left' | 'center' | 'right'),
      );
      lines.push(cols.join('  '));
    }

    return '\n' + lines.join('\n') + '\n\n';
  }

  // Unicode or ASCII table with box-drawing borders
  // tableStyle 'ascii' forces ASCII regardless of config.unicode
  const tableBox = config.tableStyle === 'ascii' ? getBoxChars(false) : box;

  const headerTexts = token.header.map(cell => ctx.parser.parseInline(cell.tokens));
  const rowTexts = token.rows.map(row =>
    row.map(cell => ctx.parser.parseInline(cell.tokens)),
  );

  const colCount = headerTexts.length;
  const colWidths: number[] = [];
  for (let c = 0; c < colCount; c++) {
    let max = visibleLength(headerTexts[c]);
    for (const row of rowTexts) {
      if (c < row.length) {
        max = Math.max(max, visibleLength(row[c]));
      }
    }
    colWidths.push(max);
  }

  const alignments = token.header.map(cell => cell.align || 'left');

  const h = tableBox.horizontal;
  const v = applyStyle(tableBox.vertical, theme.tableBorder, colorLevel);

  // Build border lines
  function borderLine(left: string, mid: string, right: string): string {
    const segments = colWidths.map(w => h.repeat(w + 2));
    return applyStyle(left + segments.join(mid) + right, theme.tableBorder, colorLevel);
  }

  const topBorder = borderLine(tableBox.topLeft, tableBox.topTee, tableBox.topRight);
  const midBorder = borderLine(tableBox.leftTee, tableBox.cross, tableBox.rightTee);
  const bottomBorder = borderLine(tableBox.bottomLeft, tableBox.bottomTee, tableBox.bottomRight);

  const lines: string[] = [];
  lines.push(topBorder);

  // Header row
  const headerCols = headerTexts.map((text, c) => {
    const aligned = alignText(text, colWidths[c], alignments[c] as 'left' | 'center' | 'right');
    return ' ' + applyStyle(aligned, theme.tableHeader, colorLevel) + ' ';
  });
  lines.push(v + headerCols.join(v) + v);

  // Header-body separator
  lines.push(midBorder);

  // Body rows
  for (const row of rowTexts) {
    const cols = row.map((text, c) => {
      const aligned = alignText(text, colWidths[c], alignments[c] as 'left' | 'center' | 'right');
      return ' ' + aligned + ' ';
    });
    lines.push(v + cols.join(v) + v);
  }

  lines.push(bottomBorder);

  return '\n' + lines.join('\n') + '\n\n';
}

/** Create a configured Marked instance with our ANSI terminal renderer. */
export function createMarkdownRenderer(config: ResolvedConfig): Marked {
  const { theme, colorLevel } = config;
  const box = getBoxChars(config.unicode);
  const contentWidth = Math.max(config.width - config.margin * 2, 20);

  const marked = new Marked();

  marked.use({
    gfm: true,
    breaks: false,
    renderer: {
      heading({ tokens, depth }: Tokens.Heading): string {
        const text = this.parser.parseInline(tokens);
        const headingKey = `heading${depth}` as keyof Theme;
        const headingStyle = theme[headingKey] as Style;
        const styled = applyStyle(text, headingStyle, colorLevel);

        let result = '\n' + styled;

        if (depth === 1) {
          const underline = box.doubleHorizontal.repeat(contentWidth);
          result += '\n' + applyStyle(underline, theme.headingUnderline, colorLevel);
        } else if (depth === 2) {
          const underline = box.horizontal.repeat(contentWidth);
          result += '\n' + applyStyle(underline, theme.headingUnderline, colorLevel);
        }

        return result + '\n\n';
      },

      paragraph({ tokens }: Tokens.Paragraph): string {
        const text = this.parser.parseInline(tokens);
        const wrapped = config.wordWrapEnabled
          ? wordWrap(text, contentWidth)
          : text;
        return wrapped + '\n\n';
      },

      strong({ tokens }: Tokens.Strong): string {
        const text = this.parser.parseInline(tokens);
        return applyStyle(text, theme.bold, colorLevel);
      },

      em({ tokens }: Tokens.Em): string {
        const text = this.parser.parseInline(tokens);
        return applyStyle(text, theme.italic, colorLevel);
      },

      del({ tokens }: Tokens.Del): string {
        const text = this.parser.parseInline(tokens);
        return applyStyle(text, theme.strikethrough, colorLevel);
      },

      codespan({ text }: Tokens.Codespan): string {
        return applyStyle(unescapeHtml(text), theme.inlineCode, colorLevel);
      },

      text(token: Tokens.Text | Tokens.Escape): string {
        if ('tokens' in token && token.tokens) {
          return this.parser.parseInline(token.tokens);
        }
        return unescapeHtml(token.text);
      },

      br(): string {
        return '\n';
      },

      space(): string {
        return '\n';
      },

      // Stub implementations for elements not yet implemented in this phase.
      // These will be properly implemented in later phases.

      code({ text, lang }: Tokens.Code): string {
        return renderCodeBlock(text, lang || '', config, theme, colorLevel, contentWidth);
      },

      blockquote({ tokens }: Tokens.Blockquote): string {
        const inner = this.parser.parse(tokens);
        const lines = inner.replace(/\n+$/, '').split('\n');
        const border = applyStyle(box.vertical, theme.blockquoteBorder, colorLevel);
        const result = lines.map(line => {
          const dimmedLine = applyStyle(stripAnsi(line), theme.blockquoteText, colorLevel);
          return '  ' + border + ' ' + dimmedLine;
        }).join('\n');
        return result + '\n\n';
      },

      list(token: Tokens.List): string {
        return renderList(token, 0, config, theme, colorLevel, box, this);
      },

      listitem(item: Tokens.ListItem): string {
        // This should not be called directly — renderList handles items
        const text = this.parser.parse(item.tokens);
        return '  - ' + text.trim() + '\n';
      },

      checkbox({ checked }: Tokens.Checkbox): string {
        return checked ? '[x] ' : '[ ] ';
      },

      hr(): string {
        const line = box.horizontal.repeat(contentWidth);
        return '\n' + applyStyle(line, theme.horizontalRule, colorLevel) + '\n\n';
      },

      table(token: Tokens.Table): string {
        return renderTable(token, config, theme, colorLevel, box, this);
      },

      tablerow({ text }: Tokens.TableRow): string {
        return text + '\n';
      },

      tablecell(token: Tokens.TableCell): string {
        return this.parser.parseInline(token.tokens) + '\t';
      },

      link({ href, tokens }: Tokens.Link): string {
        const text = this.parser.parseInline(tokens);
        const styledText = applyStyle(text, theme.link, colorLevel);

        // Bare URL: text matches href — display once, underlined
        const plainText = stripAnsi(text);
        if (plainText === href) {
          return styledText;
        }

        // Named link: underlined text + URL in parentheses (dimmed)
        if (config.showLinkUrls && href) {
          const styledUrl = applyStyle('(' + href + ')', theme.linkUrl, colorLevel);
          return styledText + ' ' + styledUrl;
        }

        return styledText;
      },

      image({ text }: Tokens.Image): string {
        const placeholder = text ? `[Image: ${text}]` : '[Image]';
        return applyStyle(placeholder, { dim: true, italic: true }, colorLevel);
      },

      html({ text }: Tokens.HTML | Tokens.Tag): string {
        return text;
      },

      def(): string {
        return '';
      },
    },
  });

  return marked;
}

/** Render markdown to an ANSI-formatted terminal string. */
export function renderMarkdown(markdown: string, config: ResolvedConfig): string {
  const marked = createMarkdownRenderer(config);
  const result = marked.parse(markdown);
  if (typeof result !== 'string') {
    throw new Error('Async rendering not supported');
  }
  // Clean up excessive blank lines and trim edges
  let output = result
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+/, '')
    .replace(/\n{2,}$/, '\n');

  // Apply left margin to all lines
  if (config.margin > 0) {
    const marginStr = ' '.repeat(config.margin);
    output = output
      .split('\n')
      .map(line => line === '' ? '' : marginStr + line)
      .join('\n');
  }

  // Strip ANSI codes for non-TTY output
  if (config.nonTTY) {
    output = stripAnsi(output);
  }

  return output;
}
