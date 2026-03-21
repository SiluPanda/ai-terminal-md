import { Marked, type Tokens } from 'marked';
import type { Theme, Style } from './types';
import type { ColorLevel } from './ansi';
import { applyStyle } from './ansi';
import { getBoxChars } from './terminal';
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

      code({ text, lang: _lang }: Tokens.Code): string {
        // Basic code block — syntax highlighting comes in Phase 4
        const lines = text.split('\n');
        const pad = ' '.repeat(config.codePadding);
        const codeLines = lines.map(line => pad + line);
        const block = codeLines.join('\n');
        return '\n' + block + '\n\n';
      },

      blockquote({ tokens }: Tokens.Blockquote): string {
        const inner = this.parser.parse(tokens);
        const lines = inner.replace(/\n+$/, '').split('\n');
        const border = applyStyle(box.vertical, theme.blockquoteBorder, colorLevel);
        const result = lines.map(line => border + ' ' + line).join('\n');
        return result + '\n\n';
      },

      list(token: Tokens.List): string {
        let body = '';
        for (const item of token.items) {
          body += this.listitem(item);
        }
        return body + '\n';
      },

      listitem(item: Tokens.ListItem): string {
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

      link({ href: _href, tokens }: Tokens.Link): string {
        const text = this.parser.parseInline(tokens);
        return text;
      },

      image({ text }: Tokens.Image): string {
        return text ? `[Image: ${text}]` : '[Image]';
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
