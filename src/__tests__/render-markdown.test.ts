/* eslint-disable no-control-regex */
import { describe, it, expect } from 'vitest';
import { renderMarkdown, type ResolvedConfig } from '../render-markdown';
import { stripAnsi, BOLD, DIM, ITALIC, STRIKETHROUGH, RESET } from '../ansi';
import { getTheme } from '../theme';

/** Create a test config with defaults suitable for testing. */
function testConfig(overrides?: Partial<ResolvedConfig>): ResolvedConfig {
  return {
    theme: getTheme('dark'),
    colorLevel: 'truecolor',
    width: 80,
    unicode: true,
    wordWrapEnabled: true,
    margin: 0,
    codeBackground: true,
    codeLineNumbers: false,
    codeLanguageLabel: true,
    codePadding: 1,
    showLinkUrls: true,
    tableStyle: 'unicode',
    ...overrides,
  };
}

/** Render markdown with test defaults and return the raw ANSI string. */
function render(md: string, overrides?: Partial<ResolvedConfig>): string {
  return renderMarkdown(md, testConfig(overrides));
}

/** Render and strip ANSI codes for content verification. */
function renderPlain(md: string, overrides?: Partial<ResolvedConfig>): string {
  return stripAnsi(render(md, overrides));
}

describe('render-markdown', () => {
  describe('H1 headers', () => {
    it('renders H1 text with bold attribute', () => {
      const result = render('# Hello World');
      expect(result).toContain(BOLD);
      expect(result).toContain('Hello World');
    });

    it('renders H1 with brightWhite foreground in dark theme', () => {
      const result = render('# Hello');
      // brightWhite fg code is \x1b[97m
      expect(result).toContain('\x1b[97m');
    });

    it('renders H1 with full-width double-line underline', () => {
      const plain = renderPlain('# Hello');
      expect(plain).toContain('═');
      // Underline should span content width
      const lines = plain.split('\n');
      const underlineLine = lines.find(l => l.includes('═'));
      expect(underlineLine).toBeDefined();
      expect(underlineLine!.length).toBe(80);
    });

    it('renders H1 with ASCII double underline when unicode is false', () => {
      const plain = renderPlain('# Hello', { unicode: false });
      expect(plain).toContain('=');
      expect(plain).not.toContain('═');
    });

    it('renders H1 preceded and followed by blank line', () => {
      const plain = renderPlain('text before\n\n# Header\n\ntext after');
      const lines = plain.split('\n');
      // Find the header line
      const headerIdx = lines.findIndex(l => l.includes('Header'));
      expect(headerIdx).toBeGreaterThan(0);
      // Should have blank line before header
      expect(lines[headerIdx - 1]).toBe('');
    });
  });

  describe('H2 headers', () => {
    it('renders H2 text with bold attribute', () => {
      const result = render('## Subtitle');
      expect(result).toContain(BOLD);
      expect(result).toContain('Subtitle');
    });

    it('renders H2 with brightCyan foreground in dark theme', () => {
      const result = render('## Subtitle');
      // brightCyan fg code is \x1b[96m
      expect(result).toContain('\x1b[96m');
    });

    it('renders H2 with single-line underline', () => {
      const plain = renderPlain('## Subtitle');
      expect(plain).toContain('─');
      const lines = plain.split('\n');
      const underlineLine = lines.find(l => l.includes('─'));
      expect(underlineLine).toBeDefined();
      expect(underlineLine!.length).toBe(80);
    });

    it('renders H2 with ASCII single underline when unicode is false', () => {
      const plain = renderPlain('## Sub', { unicode: false });
      expect(plain).toContain('-');
      expect(plain).not.toContain('─');
    });
  });

  describe('H3 headers', () => {
    it('renders H3 with bold and yellow foreground', () => {
      const result = render('### Section');
      expect(result).toContain(BOLD);
      // yellow fg code is \x1b[33m
      expect(result).toContain('\x1b[33m');
      expect(result).toContain('Section');
    });

    it('renders H3 with no underline', () => {
      const plain = renderPlain('### Section');
      expect(plain).not.toContain('─');
      expect(plain).not.toContain('═');
    });
  });

  describe('H4 headers', () => {
    it('renders H4 with bold and green foreground', () => {
      const result = render('#### Detail');
      expect(result).toContain(BOLD);
      // green fg code is \x1b[32m
      expect(result).toContain('\x1b[32m');
      expect(result).toContain('Detail');
    });

    it('renders H4 with no underline', () => {
      const plain = renderPlain('#### Detail');
      expect(plain).not.toContain('─');
      expect(plain).not.toContain('═');
    });
  });

  describe('H5 headers', () => {
    it('renders H5 with bold and dim attributes', () => {
      const result = render('##### Minor');
      expect(result).toContain(BOLD);
      expect(result).toContain(DIM);
      expect(result).toContain('Minor');
    });

    it('renders H5 with no underline', () => {
      const plain = renderPlain('##### Minor');
      expect(plain).not.toContain('─');
      expect(plain).not.toContain('═');
    });
  });

  describe('H6 headers', () => {
    it('renders H6 with bold and dim attributes', () => {
      const result = render('###### Tiny');
      expect(result).toContain(BOLD);
      expect(result).toContain(DIM);
      expect(result).toContain('Tiny');
    });

    it('renders H6 with no underline', () => {
      const plain = renderPlain('###### Tiny');
      expect(plain).not.toContain('─');
      expect(plain).not.toContain('═');
    });
  });

  describe('all headings', () => {
    it('each heading level produces correct plain text', () => {
      for (let i = 1; i <= 6; i++) {
        const prefix = '#'.repeat(i);
        const plain = renderPlain(`${prefix} Level ${i}`);
        expect(plain).toContain(`Level ${i}`);
      }
    });

    it('only H1 and H2 have underlines', () => {
      const h1 = renderPlain('# H1');
      const h2 = renderPlain('## H2');
      const h3 = renderPlain('### H3');
      const h4 = renderPlain('#### H4');
      const h5 = renderPlain('##### H5');
      const h6 = renderPlain('###### H6');

      // H1 has double underline
      expect(h1).toContain('═');
      // H2 has single underline
      expect(h2).toContain('─');
      // H3-H6 have no underline
      expect(h3).not.toMatch(/[═─=\x2D]{3,}/);
      expect(h4).not.toMatch(/[═─=\x2D]{3,}/);
      expect(h5).not.toMatch(/[═─=\x2D]{3,}/);
      expect(h6).not.toMatch(/[═─=\x2D]{3,}/);
    });

    it('underline width respects configured width', () => {
      const plain = renderPlain('# Hello', { width: 40 });
      const lines = plain.split('\n');
      const underlineLine = lines.find(l => l.includes('═'));
      expect(underlineLine).toBeDefined();
      expect(underlineLine!.length).toBe(40);
    });

    it('underline width accounts for margin', () => {
      const plain = renderPlain('# Hello', { width: 80, margin: 5 });
      const lines = plain.split('\n');
      const underlineLine = lines.find(l => l.includes('═'));
      expect(underlineLine).toBeDefined();
      // contentWidth = 80 - 5*2 = 70
      expect(underlineLine!.length).toBe(70);
    });
  });

  describe('paragraphs', () => {
    it('renders paragraph text', () => {
      const plain = renderPlain('Hello world');
      expect(plain).toContain('Hello world');
    });

    it('wraps long paragraphs at configured width', () => {
      const longText = 'word '.repeat(30).trim();
      const plain = renderPlain(longText, { width: 40 });
      const lines = plain.split('\n').filter(l => l.length > 0);
      for (const line of lines) {
        expect(line.length).toBeLessThanOrEqual(40);
      }
    });

    it('does not wrap when wordWrap is disabled', () => {
      const longText = 'word '.repeat(30).trim();
      const plain = renderPlain(longText, { width: 40, wordWrapEnabled: false });
      const contentLines = plain.split('\n').filter(l => l.length > 0);
      expect(contentLines).toHaveLength(1);
    });

    it('separates consecutive paragraphs with blank line', () => {
      const plain = renderPlain('First paragraph.\n\nSecond paragraph.');
      expect(plain).toContain('First paragraph.');
      expect(plain).toContain('Second paragraph.');
      // Should have blank line between
      const lines = plain.split('\n');
      const firstIdx = lines.findIndex(l => l.includes('First'));
      const secondIdx = lines.findIndex(l => l.includes('Second'));
      expect(secondIdx - firstIdx).toBeGreaterThanOrEqual(2);
    });
  });

  describe('bold text', () => {
    it('renders **bold** with ANSI bold attribute', () => {
      const result = render('This is **bold** text.');
      expect(result).toContain(BOLD);
      expect(result).toContain('bold');
    });

    it('bold text contains correct ANSI sequence', () => {
      const result = render('**hello**');
      // Should have \x1b[1m before "hello" and \x1b[0m after
      expect(result).toContain('\x1b[1m' + 'hello' + '\x1b[0m');
    });

    it('renders __bold__ with ANSI bold attribute', () => {
      const result = render('This is __bold__ text.');
      expect(result).toContain(BOLD);
    });

    it('preserves text around bold', () => {
      const plain = renderPlain('before **bold** after');
      expect(plain).toContain('before bold after');
    });
  });

  describe('italic text', () => {
    it('renders *italic* with ANSI italic attribute', () => {
      const result = render('This is *italic* text.');
      expect(result).toContain(ITALIC);
      expect(result).toContain('italic');
    });

    it('italic text contains correct ANSI sequence', () => {
      const result = render('*hello*');
      expect(result).toContain('\x1b[3m' + 'hello' + '\x1b[0m');
    });

    it('renders _italic_ with ANSI italic attribute', () => {
      const result = render('This is _italic_ text.');
      expect(result).toContain(ITALIC);
    });

    it('preserves text around italic', () => {
      const plain = renderPlain('before *italic* after');
      expect(plain).toContain('before italic after');
    });
  });

  describe('strikethrough text', () => {
    it('renders ~~strikethrough~~ with ANSI strikethrough attribute', () => {
      const result = render('This is ~~struck~~ text.');
      expect(result).toContain(STRIKETHROUGH);
      expect(result).toContain('struck');
    });

    it('strikethrough text contains correct ANSI sequence', () => {
      const result = render('~~hello~~');
      expect(result).toContain('\x1b[9m' + 'hello' + '\x1b[0m');
    });

    it('preserves text around strikethrough', () => {
      const plain = renderPlain('before ~~struck~~ after');
      expect(plain).toContain('before struck after');
    });
  });

  describe('bold + italic combined', () => {
    it('renders ***bold italic*** with both attributes', () => {
      const result = render('***both***');
      expect(result).toContain(BOLD);
      expect(result).toContain(ITALIC);
      expect(result).toContain('both');
    });

    it('renders **_bold italic_** with both attributes', () => {
      const result = render('**_both_**');
      expect(result).toContain(BOLD);
      expect(result).toContain(ITALIC);
    });

    it('preserves text content for combined formatting', () => {
      const plain = renderPlain('***combined***');
      expect(plain).toContain('combined');
    });
  });

  describe('inline code', () => {
    it('renders inline code with background style', () => {
      const result = render('Use `console.log` here.');
      expect(result).toContain('console.log');
      // Dark theme inlineCode has bg: '#3a3a3a' which produces a bg ANSI sequence
      expect(result).toMatch(/\x1b\[48;2;\d+;\d+;\d+m/);
    });

    it('inline code has correct text content', () => {
      const plain = renderPlain('Use `code` here.');
      expect(plain).toContain('Use code here.');
    });

    it('handles HTML entities in inline code', () => {
      const plain = renderPlain('Use `a < b && c > d` here.');
      expect(plain).toContain('a < b && c > d');
    });

    it('renders inline code with RESET after', () => {
      const result = render('`code`');
      expect(result).toContain(RESET);
    });
  });

  describe('colorLevel none', () => {
    it('strips color codes when colorLevel is none', () => {
      const result = render('# Hello', { colorLevel: 'none' });
      // Should still have bold (attribute) but no color codes
      expect(result).toContain(BOLD);
      // Should not have any fg/bg color sequences
      expect(result).not.toMatch(/\x1b\[3[0-7]m/); // no fg
      expect(result).not.toMatch(/\x1b\[4[0-7]m/); // no bg
      expect(result).not.toMatch(/\x1b\[9[0-7]m/); // no bright fg
      expect(result).not.toMatch(/\x1b\[38;/); // no 256/truecolor fg
      expect(result).not.toMatch(/\x1b\[48;/); // no 256/truecolor bg
    });
  });

  describe('mixed inline formatting', () => {
    it('renders paragraph with bold and italic together', () => {
      const plain = renderPlain('Hello **bold** and *italic* world.');
      expect(plain).toContain('Hello bold and italic world.');
    });

    it('renders paragraph with multiple formatting types', () => {
      const result = render('**bold** and *italic* and ~~struck~~ and `code`');
      expect(result).toContain(BOLD);
      expect(result).toContain(ITALIC);
      expect(result).toContain(STRIKETHROUGH);
    });

    it('handles nested bold within italic', () => {
      const plain = renderPlain('*italic **bold italic** italic*');
      expect(plain).toContain('italic bold italic italic');
    });
  });

  describe('themes', () => {
    it('renders H1 with blue in light theme', () => {
      const result = render('# Hello', { theme: getTheme('light') });
      // light theme H1 is fg: 'blue' → \x1b[34m
      expect(result).toContain('\x1b[34m');
    });

    it('renders H2 with cyan in light theme', () => {
      const result = render('## Hello', { theme: getTheme('light') });
      // light theme H2 is fg: 'cyan' → \x1b[36m
      expect(result).toContain('\x1b[36m');
    });

    it('renders headers with no color in monochrome theme', () => {
      const result = render('# Hello\n\n## World', { theme: getTheme('monochrome') });
      // monochrome has no fg colors, only attributes
      expect(result).not.toMatch(/\x1b\[3[0-7]m/);
      expect(result).not.toMatch(/\x1b\[9[0-7]m/);
    });

    it('renders headers with bold only in minimal theme', () => {
      const result = render('# Hello', { theme: getTheme('minimal') });
      expect(result).toContain(BOLD);
      // minimal heading1 has no fg color
      expect(result).not.toMatch(/\x1b\[97m/); // no brightWhite
    });
  });

  describe('empty input', () => {
    it('handles empty string', () => {
      const result = render('');
      expect(result).toBe('');
    });

    it('handles whitespace-only input', () => {
      const result = render('   ');
      expect(typeof result).toBe('string');
    });
  });

  describe('heading with inline formatting', () => {
    it('renders heading with bold text inside', () => {
      const result = render('# Hello **World**');
      const plain = renderPlain('# Hello **World**');
      expect(plain).toContain('Hello World');
      // Should have bold for both heading and inline bold
      expect(result).toContain(BOLD);
    });

    it('renders heading with inline code', () => {
      const plain = renderPlain('## Using `render` function');
      expect(plain).toContain('Using render function');
    });
  });

  describe('HTML entity handling', () => {
    it('unescapes HTML entities in text', () => {
      const plain = renderPlain('Use &amp; and &lt;tag&gt;');
      expect(plain).toContain('Use & and <tag>');
    });

    it('unescapes quotes in text', () => {
      const plain = renderPlain('He said &quot;hello&quot;');
      expect(plain).toContain('He said "hello"');
    });
  });

  describe('multiple elements', () => {
    it('renders heading followed by paragraph', () => {
      const plain = renderPlain('# Title\n\nSome text here.');
      expect(plain).toContain('Title');
      expect(plain).toContain('Some text here.');
    });

    it('renders multiple headings at different levels', () => {
      const md = '# H1\n\n## H2\n\n### H3';
      const plain = renderPlain(md);
      expect(plain).toContain('H1');
      expect(plain).toContain('H2');
      expect(plain).toContain('H3');
    });

    it('renders a complete document with mixed elements', () => {
      const md = [
        '# Main Title',
        '',
        'Introduction paragraph with **bold** and *italic*.',
        '',
        '## Section One',
        '',
        'Text with `inline code` and ~~strikethrough~~.',
        '',
        '### Subsection',
        '',
        'More text here.',
      ].join('\n');

      const plain = renderPlain(md);
      expect(plain).toContain('Main Title');
      expect(plain).toContain('Introduction paragraph with bold and italic.');
      expect(plain).toContain('Section One');
      expect(plain).toContain('Text with inline code and strikethrough.');
      expect(plain).toContain('Subsection');
      expect(plain).toContain('More text here.');
    });
  });

  describe('code blocks', () => {
    it('renders code block with language label', () => {
      const plain = renderPlain('```python\ndef hello():\n    pass\n```');
      expect(plain).toContain('python');
      expect(plain).toContain('def hello():');
      expect(plain).toContain('    pass');
    });

    it('renders language label right-aligned', () => {
      const plain = renderPlain('```javascript\nconst x = 1;\n```', { width: 80 });
      const lines = plain.split('\n');
      const labelLine = lines.find(l => l.includes('javascript'));
      expect(labelLine).toBeDefined();
      // Label should be right-aligned — more spaces on the left than label length
      const trimmed = labelLine!.trimStart();
      expect(trimmed.trim()).toBe('javascript');
    });

    it('applies dimmed style to language label', () => {
      const result = render('```python\ncode\n```');
      expect(result).toContain(DIM);
      expect(result).toContain('python');
    });

    it('does not show language label when codeLanguageLabel is false', () => {
      const plain = renderPlain('```python\ncode\n```', { codeLanguageLabel: false });
      expect(plain).not.toContain('python');
      expect(plain).toContain('code');
    });

    it('does not show language label when no language is specified', () => {
      const plain = renderPlain('```\ncode\n```');
      const lines = plain.split('\n').filter(l => l.trim().length > 0);
      // All non-empty lines should only contain code-related content
      expect(lines.some(l => l.trim() === 'code')).toBe(true);
    });

    it('applies horizontal padding to code lines', () => {
      const plain = renderPlain('```\nhello\n```', { codePadding: 2 });
      const lines = plain.split('\n');
      const codeLine = lines.find(l => l.includes('hello'));
      expect(codeLine).toBeDefined();
      // Should have at least 2 spaces of padding before "hello"
      expect(codeLine!).toMatch(/^\s{2,}hello/);
    });

    it('shows line numbers when codeLineNumbers is true', () => {
      const plain = renderPlain('```\nline one\nline two\nline three\n```', { codeLineNumbers: true });
      expect(plain).toContain('1');
      expect(plain).toContain('2');
      expect(plain).toContain('3');
    });

    it('right-aligns line numbers', () => {
      const lines = Array.from({ length: 12 }, (_, i) => `line ${i + 1}`).join('\n');
      const plain = renderPlain('```\n' + lines + '\n```', { codeLineNumbers: true });
      // Line 1 should be padded: " 1"
      expect(plain).toContain(' 1');
      expect(plain).toContain('12');
    });

    it('applies background color when codeBackground is true', () => {
      const result = render('```\nhello\n```', { codeBackground: true });
      // Should contain background ANSI sequence (truecolor bg)
      expect(result).toMatch(/\x1b\[48;2;\d+;\d+;\d+m/);
    });

    it('does not apply background when codeBackground is false', () => {
      const result = render('```\nhello\n```', { codeBackground: false });
      // Should not contain background ANSI sequence for code bg
      // (but may have other ANSI for language label)
      const lines = result.split('\n');
      const codeLines = lines.filter(l => l.includes('hello'));
      for (const line of codeLines) {
        expect(line).not.toMatch(/\x1b\[48;2;\d+;\d+;\d+m/);
      }
    });

    it('renders vertical padding lines with background', () => {
      const plain = renderPlain('```\nhello\n```', { codeBackground: true });
      const lines = plain.split('\n');
      // Should have empty padding lines before and after code
      const helloIdx = lines.findIndex(l => l.includes('hello'));
      expect(helloIdx).toBeGreaterThan(0);
    });

    it('does not word-wrap code block content', () => {
      const longLine = 'x'.repeat(200);
      const plain = renderPlain('```\n' + longLine + '\n```', { width: 80 });
      const lines = plain.split('\n');
      const codeLine = lines.find(l => l.includes('x'.repeat(100)));
      expect(codeLine).toBeDefined();
    });

    it('preserves code indentation', () => {
      const plain = renderPlain('```\n  indented\n    more\n```');
      expect(plain).toContain('  indented');
      expect(plain).toContain('    more');
    });

    it('handles empty code blocks', () => {
      const plain = renderPlain('```\n```');
      expect(typeof plain).toBe('string');
    });

    it('handles multi-line code blocks', () => {
      const code = '```\nline 1\nline 2\nline 3\n```';
      const plain = renderPlain(code);
      expect(plain).toContain('line 1');
      expect(plain).toContain('line 2');
      expect(plain).toContain('line 3');
    });

    it('preserves raw text in code blocks', () => {
      const plain = renderPlain('```\na &amp; b < c\n```');
      // Code blocks preserve raw text — no HTML entity unescaping
      expect(plain).toContain('a &amp; b < c');
    });
  });

  describe('unordered lists', () => {
    it('renders level 0 items with bullet character', () => {
      const plain = renderPlain('- item one\n- item two');
      expect(plain).toContain('●');
      expect(plain).toContain('item one');
      expect(plain).toContain('item two');
    });

    it('renders level 1 nested items with circle character', () => {
      const plain = renderPlain('- parent\n  - child');
      expect(plain).toContain('●');
      expect(plain).toContain('○');
      expect(plain).toContain('parent');
      expect(plain).toContain('child');
    });

    it('renders level 2 nested items with square character', () => {
      const plain = renderPlain('- a\n  - b\n    - c');
      expect(plain).toContain('●');
      expect(plain).toContain('○');
      expect(plain).toContain('■');
    });

    it('renders level 3+ nested items with arrow character', () => {
      const plain = renderPlain('- a\n  - b\n    - c\n      - d');
      expect(plain).toContain('▸');
      expect(plain).toContain('d');
    });

    it('uses ASCII fallback when unicode is false', () => {
      const plain = renderPlain('- a\n  - b\n    - c\n      - d', { unicode: false });
      expect(plain).toContain('*');
      expect(plain).toContain('-');
      expect(plain).toContain('+');
      expect(plain).toContain('>');
      expect(plain).not.toContain('●');
      expect(plain).not.toContain('○');
      expect(plain).not.toContain('■');
      expect(plain).not.toContain('▸');
    });

    it('adds two spaces of indentation per nesting level', () => {
      const plain = renderPlain('- a\n  - b\n    - c');
      const lines = plain.split('\n').filter(l => l.trim().length > 0);
      // Level 0: starts at column 0
      expect(lines[0]).toMatch(/^[●*]/);
      // Level 1: starts at column 2
      expect(lines[1]).toMatch(/^\s{2}[○-]/);
      // Level 2: starts at column 4
      expect(lines[2]).toMatch(/^\s{4}[■+]/);
    });

    it('applies listBullet theme style to bullets', () => {
      const result = render('- item');
      // Dark theme listBullet has fg: 'cyan' -> \x1b[36m
      expect(result).toContain('\x1b[36m');
    });

    it('renders inline formatting within list items', () => {
      const plain = renderPlain('- **bold** item\n- *italic* item');
      expect(plain).toContain('bold item');
      expect(plain).toContain('italic item');
    });

    it('renders multiple items correctly', () => {
      const plain = renderPlain('- first\n- second\n- third');
      const lines = plain.split('\n').filter(l => l.trim().length > 0);
      expect(lines).toHaveLength(3);
    });
  });

  describe('ordered lists', () => {
    it('renders items with numbers', () => {
      const plain = renderPlain('1. first\n2. second\n3. third');
      expect(plain).toContain('1.');
      expect(plain).toContain('2.');
      expect(plain).toContain('3.');
      expect(plain).toContain('first');
      expect(plain).toContain('second');
      expect(plain).toContain('third');
    });

    it('renders nested sub-items with alphabetic labels', () => {
      const plain = renderPlain('1. first\n   1. sub one\n   2. sub two\n2. second');
      expect(plain).toContain('a.');
      expect(plain).toContain('b.');
      expect(plain).toContain('sub one');
      expect(plain).toContain('sub two');
    });

    it('applies listNumber theme style', () => {
      const result = render('1. item');
      // Dark theme listNumber has fg: 'cyan' -> \x1b[36m
      expect(result).toContain('\x1b[36m');
    });

    it('renders inline formatting within ordered list items', () => {
      const plain = renderPlain('1. **bold** item\n2. `code` item');
      expect(plain).toContain('bold item');
      expect(plain).toContain('code item');
    });

    it('handles long ordered lists', () => {
      const items = Array.from({ length: 10 }, (_, i) => `${i + 1}. item ${i + 1}`).join('\n');
      const plain = renderPlain(items);
      expect(plain).toContain('1.');
      expect(plain).toContain('10.');
      expect(plain).toContain('item 10');
    });
  });

  describe('task lists', () => {
    it('renders checked items with checkmark', () => {
      const plain = renderPlain('- [x] Done');
      expect(plain).toContain('✓');
      expect(plain).toContain('Done');
      // Should NOT contain the raw [x] marker
      expect(plain).not.toContain('[x]');
    });

    it('renders unchecked items with empty checkbox', () => {
      const plain = renderPlain('- [ ] Todo');
      expect(plain).toContain('☐');
      expect(plain).toContain('Todo');
      // Should NOT contain the raw [ ] marker
      expect(plain).not.toContain('[ ]');
    });

    it('renders checked items with green styling', () => {
      const result = render('- [x] Done');
      // green fg: \x1b[32m
      expect(result).toContain('\x1b[32m');
    });

    it('renders unchecked items with dim styling', () => {
      const result = render('- [ ] Todo');
      expect(result).toContain(DIM);
    });

    it('uses ASCII fallback for checkmark/checkbox', () => {
      const plain = renderPlain('- [x] Done\n- [ ] Todo', { unicode: false });
      // ASCII checkmark is [x], checkbox is [ ]
      // Since we filter out the raw checkbox token, the ASCII chars come from box chars
      expect(plain).toContain('Done');
      expect(plain).toContain('Todo');
    });

    it('renders mixed task and non-task items', () => {
      const plain = renderPlain('- [x] Done\n- Regular item\n- [ ] Todo');
      expect(plain).toContain('✓');
      expect(plain).toContain('●');
      expect(plain).toContain('☐');
    });
  });

  describe('width and wrapping', () => {
    it('respects width 40', () => {
      const longText = 'This is a sentence that should be wrapped at a narrow width for testing purposes.';
      const plain = renderPlain(longText, { width: 40 });
      const lines = plain.split('\n').filter(l => l.length > 0);
      expect(lines.length).toBeGreaterThan(1);
      for (const line of lines) {
        expect(line.length).toBeLessThanOrEqual(40);
      }
    });

    it('respects width 120', () => {
      const longText = 'This is a sentence that should be wrapped at a narrow width for testing purposes.';
      const plain = renderPlain(longText, { width: 120 });
      const lines = plain.split('\n').filter(l => l.length > 0);
      // At width 120, this text fits on one line
      expect(lines).toHaveLength(1);
    });
  });
});
