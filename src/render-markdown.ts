import { Marked, type Tokens } from 'marked';
import type { Theme, Style } from './types';
import type { ColorLevel } from './ansi';
import { applyStyle, stripAnsi } from './ansi';
import { getBoxChars, type BoxChars } from './terminal';
import { wordWrap } from './wrap';

/** Fully resolved renderer configuration with no optional values. */
export interface ResolvedConfig {
  theme: Theme;
  colorLevel: ColorLevel;
  width: number;
  unicode: boolean;
  wordWrapEnabled: boolean;
  margin: number;
  codeBackground: boolean;
  codeLineNumbers: boolean;
  codeLanguageLabel: boolean;
  codePadding: number;
  showLinkUrls: boolean;
  tableStyle: 'unicode' | 'ascii' | 'none';
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
    lineContent += pad + line;

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

      table(): string {
        // Tables will be implemented in a later phase
        return '';
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
  return result
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+/, '')
    .replace(/\n{2,}$/, '\n');
}
