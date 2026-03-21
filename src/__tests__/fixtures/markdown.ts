/**
 * Reusable markdown input strings and expected output patterns
 * for standard markdown rendering tests.
 */

// --- Headers ---

export const HEADERS = {
  h1: '# Main Title',
  h2: '## Section Title',
  h3: '### Subsection',
  h4: '#### Detail',
  h5: '##### Minor',
  h6: '###### Tiny',
  allLevels: [
    '# Heading 1',
    '',
    '## Heading 2',
    '',
    '### Heading 3',
    '',
    '#### Heading 4',
    '',
    '##### Heading 5',
    '',
    '###### Heading 6',
  ].join('\n'),
  withInlineFormatting: '# Hello **World** and *Universe*',
  withInlineCode: '## Using `render()` function',
};

// --- Inline formatting ---

export const INLINE = {
  bold: '**bold text**',
  boldUnderscore: '__bold text__',
  italic: '*italic text*',
  italicUnderscore: '_italic text_',
  strikethrough: '~~struck text~~',
  boldItalic: '***bold and italic***',
  boldItalicAlt: '**_bold and italic_**',
  inlineCode: '`console.log("hello")`',
  mixed: 'This has **bold**, *italic*, ~~struck~~, and `code` all together.',
  nestedBoldInItalic: '*italic **bold italic** italic*',
};

// --- Paragraphs ---

export const PARAGRAPHS = {
  simple: 'Hello world, this is a paragraph.',
  twoConsecutive: [
    'First paragraph with some text.',
    '',
    'Second paragraph with more text.',
  ].join('\n'),
  long: 'This is a very long paragraph that should be word-wrapped when the terminal width is narrow enough to require it. It contains enough words to span multiple lines at most reasonable terminal widths.',
  withFormatting: 'A paragraph with **bold**, *italic*, `code`, and [links](https://example.com).',
};

// --- Code blocks ---

export const CODE_BLOCKS = {
  simple: '```\nhello world\n```',
  withLanguage: '```javascript\nconst x = 1;\nconsole.log(x);\n```',
  python: '```python\ndef greet(name):\n    return f"Hello, {name}"\n```',
  multiLine: '```\nline 1\nline 2\nline 3\nline 4\nline 5\n```',
  withIndentation: '```\n  indented\n    more indented\n      deeply indented\n```',
  empty: '```\n```',
  longLine: '```\n' + 'x'.repeat(200) + '\n```',
  htmlEntities: '```\na &amp; b < c > d\n```',
};

// --- Lists ---

export const UNORDERED_LISTS = {
  simple: '- item one\n- item two\n- item three',
  nested: '- parent\n  - child\n    - grandchild\n      - great-grandchild',
  withFormatting: '- **bold** item\n- *italic* item\n- `code` item',
};

export const ORDERED_LISTS = {
  simple: '1. first\n2. second\n3. third',
  nested: '1. first\n   1. sub one\n   2. sub two\n2. second',
  long: Array.from({ length: 10 }, (_, i) => `${i + 1}. item ${i + 1}`).join('\n'),
  withFormatting: '1. **bold** item\n2. `code` item',
};

export const TASK_LISTS = {
  simple: '- [x] Done task\n- [ ] Todo task',
  allChecked: '- [x] Done 1\n- [x] Done 2\n- [x] Done 3',
  allUnchecked: '- [ ] Todo 1\n- [ ] Todo 2\n- [ ] Todo 3',
  mixed: '- [x] Done\n- Regular item\n- [ ] Todo',
};

// --- Links ---

export const LINKS = {
  named: '[Click here](https://example.com)',
  bare: 'https://example.com',
  withFormatting: '[**bold link**](https://example.com)',
  noHref: '[text]()',
  inParagraph: 'Visit [the docs](https://docs.example.com) for details.',
};

// --- Blockquotes ---

export const BLOCKQUOTES = {
  simple: '> This is a quote',
  multiLine: '> Line one\n> Line two\n> Line three',
  nested: '> outer\n> > inner',
  withFormatting: '> **bold** quote with *italic*',
  withEmptyLine: '> Line one\n>\n> Line three',
};

// --- Tables ---

export const TABLES = {
  simple: '| Name | Age |\n|---|---|\n| Alice | 30 |\n| Bob | 25 |',
  threeColumns: '| Name | Age | City |\n|---|---|---|\n| Alice | 30 | NY |\n| Bob | 25 | LA |',
  leftAlign: '| Name |\n|:---|\n| Alice |',
  rightAlign: '| Value |\n|---:|\n| 42 |',
  centerAlign: '| Value |\n|:---:|\n| Hi |',
  singleColumn: '| Name |\n|---|\n| Alice |\n| Bob |',
  withFormatting: '| Name | Note |\n|---|---|\n| **Alice** | *nice* |',
  emptyCell: '| A | B |\n|---|---|\n|  | 2 |',
};

// --- Horizontal rules ---

export const HORIZONTAL_RULES = {
  dashes: '---',
  asterisks: '***',
  underscores: '___',
  betweenParagraphs: 'Before\n\n---\n\nAfter',
};

// --- Images ---

export const IMAGES = {
  withAlt: '![A beautiful sunset](https://example.com/sunset.jpg)',
  noAlt: '![](https://example.com/photo.jpg)',
  inParagraph: 'See this: ![diagram](https://example.com/diagram.png) for reference.',
};

// --- Complete documents ---

export const DOCUMENTS = {
  simple: [
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
  ].join('\n'),

  full: [
    '# Document Title',
    '',
    'This is the introduction.',
    '',
    '## Features',
    '',
    '- **Feature 1** - Description',
    '- **Feature 2** - Description',
    '- **Feature 3** - Description',
    '',
    '### Code Example',
    '',
    '```javascript',
    'const greeting = "Hello";',
    'console.log(greeting);',
    '```',
    '',
    '> This is an important note.',
    '',
    '| Option | Default | Description |',
    '|--------|---------|-------------|',
    '| theme  | dark    | Color theme |',
    '| width  | 80      | Term width  |',
    '',
    '---',
    '',
    'Visit [our docs](https://example.com) for more.',
    '',
    '- [x] Completed task',
    '- [ ] Pending task',
    '',
    '![Screenshot](https://example.com/screenshot.png)',
  ].join('\n'),
};

// --- Expected patterns (for assertion helpers) ---

export const EXPECTED = {
  h1UnderlineChar: '═',
  h1UnderlineCharAscii: '=',
  h2UnderlineChar: '─',
  h2UnderlineCharAscii: '-',
  bulletL0: '●',
  bulletL1: '○',
  bulletL2: '■',
  bulletL3: '▸',
  bulletL0Ascii: '*',
  bulletL1Ascii: '-',
  bulletL2Ascii: '+',
  bulletL3Ascii: '>',
  checkmark: '✓',
  checkbox: '☐',
  checkmarkAscii: '[x]',
  checkboxAscii: '[ ]',
  hrChar: '─',
  hrCharAscii: '-',
  blockquoteBorder: '│',
  blockquoteBorderAscii: '|',
  tableBorderV: '│',
  tableCornerTL: '┌',
  tableCornerTR: '┐',
  tableCornerBL: '└',
  tableCornerBR: '┘',
  imagePlaceholder: '[Image]',
  imageWithAlt: (alt: string) => `[Image: ${alt}]`,
};
