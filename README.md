# ai-terminal-md

Terminal markdown renderer optimized for AI-generated content.

[![npm version](https://img.shields.io/npm/v/ai-terminal-md.svg)](https://www.npmjs.com/package/ai-terminal-md)
[![npm downloads](https://img.shields.io/npm/dt/ai-terminal-md.svg)](https://www.npmjs.com/package/ai-terminal-md)
[![license](https://img.shields.io/npm/l/ai-terminal-md.svg)](https://github.com/SiluPanda/ai-terminal-md/blob/master/LICENSE)
[![node](https://img.shields.io/node/v/ai-terminal-md.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

`ai-terminal-md` renders markdown with full ANSI color support, syntax highlighting for 15+ languages, and first-class handling of AI-specific XML elements -- thinking blocks, artifacts, tool use, tool results, citations, and semantic wrappers. It provides both a synchronous API for rendering complete markdown strings and a streaming API for rendering token-by-token output from LLM APIs without re-rendering the entire response on each chunk.

Generic terminal markdown renderers like `marked-terminal` handle CommonMark well but render AI-specific patterns (`<thinking>`, `<artifact>`, `<tool_use>`) as literal text. `ai-terminal-md` understands these patterns and renders them with dedicated visual treatment: thinking blocks are dimmed and bordered, artifacts appear as titled panels, tool calls are formatted as invocation boxes with structured arguments, and citations are highlighted inline.

## Installation

```bash
npm install ai-terminal-md
```

## Quick Start

### Render a complete markdown string

```typescript
import { render } from 'ai-terminal-md';

const output = render('# Hello\n\nThis is **bold** text.');
process.stdout.write(output);
```

### Stream rendering (incremental)

```typescript
import { createRenderer } from 'ai-terminal-md';

const renderer = createRenderer({ theme: 'dark', width: 100 });

async function streamMarkdown(source: AsyncIterable<string>) {
  for await (const chunk of renderer.renderStream(source)) {
    process.stdout.write(chunk);
  }
}
```

### Manual chunk-by-chunk rendering

```typescript
import { createRenderer } from 'ai-terminal-md';

const renderer = createRenderer({ colorLevel: 'truecolor', width: 80 });

let state;
for (const chunk of chunks) {
  const result = renderer.renderChunk(chunk, state);
  process.stdout.write(result.output);
  state = result.state;
}
// Flush any remaining buffered content
process.stdout.write(renderer.flush(state));
```

## Features

- **Full CommonMark rendering** -- headers with underlines, bold, italic, strikethrough, links, images, blockquotes, horizontal rules, ordered and unordered lists with nesting, task lists, tables with box-drawing borders, and fenced code blocks.
- **AI element detection** -- automatically parses and renders `<thinking>`, `<antThinking>`, `<reflection>`, `<scratchpad>`, `<reasoning>`, `<inner_monologue>`, `<thought>`, `<artifact>`, `<antArtifact>`, `<tool_use>`, `<function_call>`, `<tool_call>`, `<tool_result>`, `<function_result>`, `<result>`, `<answer>`, `<output>`, `<response>`, and citation markers like `[1]`, `[2]`.
- **Syntax highlighting** -- built-in regex-based highlighter for JavaScript, TypeScript, Python, Rust, Go, Java, Ruby, Shell/Bash, SQL, HTML, CSS, JSON, YAML, Markdown, C/C++, and PHP. Pluggable `CustomHighlighter` interface for additional languages.
- **Streaming API** -- `renderStream()` for `AsyncIterable<string>` input and `renderChunk()` / `flush()` for manual incremental rendering. Handles partial code fences and open thinking blocks without re-rendering.
- **Four built-in themes** -- `dark`, `light`, `minimal`, and `monochrome`. Custom themes via partial overrides with any built-in theme as a base.
- **Terminal capability detection** -- auto-detects color support level (none, 16-color, 256-color, truecolor), Unicode support, terminal width, and TTY status. Respects `FORCE_COLOR`, `NO_COLOR`, `COLORTERM`, and `TERM` environment variables.
- **Non-TTY safety** -- automatically strips ANSI codes when stdout is not a TTY, making output safe for piping to files or other processes.
- **Configurable rendering** -- per-element display modes for every AI element type, code block options (background, line numbers, language label, padding), word wrapping, margins, table border styles, and link URL display.
- **Zero runtime dependencies beyond `marked`** -- all rendering, highlighting, and AI pattern detection implemented without additional dependencies.

## API Reference

### `render(markdown, options?)`

Convenience function that renders a complete markdown string to an ANSI-formatted string.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `markdown` | `string` | The markdown string to render. |
| `options` | `RenderOptions` | Optional configuration (see [Configuration](#configuration)). |

**Returns:** `string` -- the rendered ANSI-formatted string.

```typescript
import { render } from 'ai-terminal-md';

const output = render('# Title\n\nBody with **bold** and `code`.', {
  theme: 'dark',
  width: 80,
  colorLevel: 'truecolor',
});
process.stdout.write(output);
```

### `createRenderer(config?)`

Creates a reusable renderer instance. Returns an `AITerminalRenderer` object. Reusing a renderer avoids repeated configuration parsing and capability detection across multiple render calls.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `config` | `RendererConfig` | Optional configuration (see [Configuration](#configuration)). |

**Returns:** `AITerminalRenderer`

```typescript
import { createRenderer } from 'ai-terminal-md';

const renderer = createRenderer({
  theme: 'dark',
  thinking: 'dim',
  toolUse: 'box',
  width: 100,
});
```

### `AITerminalRenderer`

The renderer instance returned by `createRenderer()`.

#### `renderer.render(markdown)`

Render a complete markdown string synchronously.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `markdown` | `string` | The markdown string to render. |

**Returns:** `string`

```typescript
const output = renderer.render('# Hello\n\n<thinking>reasoning here</thinking>\n\nThe answer is 42.');
process.stdout.write(output);
```

#### `renderer.renderChunk(chunk, state?)`

Render a single chunk of streaming markdown. Pass the returned `state` into the next call to maintain streaming context. Incomplete elements (unclosed code fences, open thinking blocks, partial paragraphs) are buffered until they can be rendered.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `chunk` | `string` | The next piece of markdown text. |
| `state` | `StreamState` | Optional state from a previous `renderChunk` call. Omit for the first chunk. |

**Returns:** `{ output: string; state: StreamState }`

```typescript
let state;
for (const chunk of chunks) {
  const result = renderer.renderChunk(chunk, state);
  process.stdout.write(result.output);
  state = result.state;
}
process.stdout.write(renderer.flush(state));
```

#### `renderer.flush(state)`

Render any remaining content left in the streaming buffer. Call this after the last chunk to ensure all content is output. If a code block is still open, it is automatically closed before rendering.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `state` | `StreamState` | The state from the last `renderChunk` call. |

**Returns:** `string`

#### `renderer.renderStream(stream)`

Render an `AsyncIterable<string>` of markdown chunks. Returns an `AsyncIterable<string>` of rendered output chunks. Internally calls `renderChunk` for each incoming chunk and `flush` at the end. Empty strings are never yielded.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `stream` | `AsyncIterable<string>` | The source of markdown chunks. |

**Returns:** `AsyncIterable<string>`

```typescript
for await (const rendered of renderer.renderStream(llmStream)) {
  process.stdout.write(rendered);
}
```

#### `renderer.config`

The current renderer configuration (read-only, frozen).

**Type:** `Readonly<RendererConfig>`

### `StreamState`

A plain serializable object that tracks streaming state between `renderChunk` calls.

```typescript
interface StreamState {
  buffer: string;            // Accumulated content not yet rendered
  openCodeBlock: boolean;    // Whether a fenced code block is open
  codeLang: string;          // Language of the open code block
  openThinkingBlock: boolean; // Whether a thinking block is open
}
```

### ANSI Utilities

#### `applyStyle(text, style, colorLevel)`

Apply an ANSI `Style` to text at the given color level. Text attributes (bold, dim, italic, underline, strikethrough) are always applied. Color codes are applied only when the color level permits.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `text` | `string` | The text to style. |
| `style` | `Style` | The style definition. |
| `colorLevel` | `ColorLevel` | One of `'none'`, `'16'`, `'256'`, or `'truecolor'`. |

**Returns:** `string`

```typescript
import { applyStyle } from 'ai-terminal-md';

const styled = applyStyle('Hello', { fg: 'cyan', bold: true }, 'truecolor');
```

#### `stripAnsi(str)`

Remove all ANSI escape codes from a string.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `str` | `string` | The string to strip. |

**Returns:** `string`

#### `visibleLength(str)`

Get the visible width of a string, excluding ANSI escape sequences.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `str` | `string` | The string to measure. |

**Returns:** `number`

### Terminal Detection

#### `detectColorLevel()`

Detect terminal color support level. Checks environment variables in priority order: `FORCE_COLOR`, `NO_COLOR`, `COLORTERM`, `TERM` (256color), `stdout.isTTY`.

**Returns:** `ColorLevel` -- one of `'none'`, `'16'`, `'256'`, or `'truecolor'`.

#### `detectUnicode()`

Detect Unicode box-drawing character support. Checks `LANG`/`LC_ALL`/`LC_CTYPE` for UTF-8, `TERM` for modern terminals, and `WT_SESSION` on Windows.

**Returns:** `boolean`

#### `getWidth()`

Return terminal width from `process.stdout.columns`, defaulting to 80.

**Returns:** `number`

#### `isTTY()`

Return whether stdout is a TTY.

**Returns:** `boolean`

#### `getBoxChars(unicode)`

Get the box-drawing character set. Returns Unicode characters when `unicode` is `true`, ASCII fallbacks when `false`.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `unicode` | `boolean` | Whether to use Unicode characters. |

**Returns:** `BoxChars`

### Word Wrapping

#### `wordWrap(text, width)`

Word-wrap text to fit within a given width. Breaks at word boundaries, preserves existing newlines, maintains indent level on continuation lines, and treats ANSI escape sequences as zero-width.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `text` | `string` | The text to wrap. |
| `width` | `number` | Maximum visible width per line. |

**Returns:** `string`

### Theme Functions

#### `resolveTheme(theme?)`

Resolve a theme specification to a complete `Theme` object. Accepts a `ThemeName` string or a partial theme object with an optional `baseTheme` field.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `theme` | `ThemeName \| Partial<Theme> & { baseTheme?: ThemeName }` | Theme name or partial override. Defaults to auto-detected theme. |

**Returns:** `Theme`

```typescript
import { resolveTheme } from 'ai-terminal-md';

// Built-in theme
const dark = resolveTheme('dark');

// Custom theme extending light
const custom = resolveTheme({
  baseTheme: 'light',
  heading1: { fg: 'red', bold: true },
});
```

#### `detectTheme()`

Auto-detect the appropriate theme based on terminal environment. Checks `AI_TERMINAL_MD_THEME` env var first, then `COLORFGBG` for light/dark detection, and defaults to `dark`.

**Returns:** `Theme`

#### `getTheme(name)`

Get a built-in theme by name.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `ThemeName` | One of `'dark'`, `'light'`, `'minimal'`, `'monochrome'`. |

**Returns:** `Theme`

#### `hasColor(style)`

Check whether a `Style` contains any color (`fg` or `bg`) properties.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `style` | `Style` | The style to check. |

**Returns:** `boolean`

## Configuration

Pass these options to `render()` or `createRenderer()`.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | `'dark' \| 'light' \| 'minimal' \| 'monochrome' \| Partial<Theme>` | `'dark'` | Color theme. Pass a string for a built-in theme, or a partial `Theme` object with an optional `baseTheme` field for custom overrides. |
| `width` | `number` | auto-detected | Terminal width in columns. Falls back to `AI_TERMINAL_MD_WIDTH` env var, then `process.stdout.columns`, then 80. |
| `colorLevel` | `'none' \| '16' \| '256' \| 'truecolor'` | auto-detected | ANSI color support level. |
| `unicode` | `boolean` | auto-detected | Use Unicode box-drawing characters. Falls back to ASCII when `false`. |
| `thinking` | `'show' \| 'dim' \| 'hide'` | `'dim'` | How to render thinking blocks. |
| `artifacts` | `'panel' \| 'inline' \| 'hide'` | `'panel'` | How to render artifact blocks. |
| `toolUse` | `'box' \| 'inline' \| 'hide'` | `'box'` | How to render tool use blocks. |
| `toolResult` | `'box' \| 'inline' \| 'hide'` | `'box'` | How to render tool result blocks. |
| `semanticWrappers` | `'strip' \| 'label' \| 'keep'` | `'strip'` | How to handle semantic wrapper tags. |
| `citations` | `'color' \| 'plain' \| 'hide'` | `'color'` | How to render citation markers. |
| `codeBackground` | `boolean` | `true` | Apply background color to code blocks. |
| `codeLineNumbers` | `boolean` | `false` | Show line numbers in code blocks. |
| `codeLanguageLabel` | `boolean` | `true` | Show language label on code blocks. |
| `codePadding` | `number` | `1` | Horizontal padding (spaces) inside code blocks. |
| `highlighter` | `CustomHighlighter` | built-in | Custom syntax highlighter instance. |
| `wordWrap` | `boolean` | `true` | Word-wrap text to terminal width. |
| `margin` | `number` | `0` | Left margin (spaces) for all content. |
| `showLinkUrls` | `boolean` | `true` | Show URLs after link text. |
| `tableStyle` | `'unicode' \| 'ascii' \| 'none'` | `'unicode'` | Border style for tables. |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `AI_TERMINAL_MD_THEME` | Override the auto-detected theme. Accepts `dark`, `light`, `minimal`, `monochrome`. |
| `AI_TERMINAL_MD_WIDTH` | Override the auto-detected terminal width. |
| `FORCE_COLOR` | Force color level: `0` = none, `1` = 16, `2` = 256, `3` = truecolor. |
| `NO_COLOR` | Disable all color output (per [no-color.org](https://no-color.org)). |
| `COLORTERM` | Detected for truecolor support (`truecolor` or `24bit`). |
| `COLORFGBG` | Used for light/dark theme auto-detection. |

## Error Handling

`ai-terminal-md` is designed to be resilient. Unrecognized AI XML tags are passed through as literal text. Unrecognized code fence languages are rendered without syntax highlighting. Malformed tool use arguments fall back to key-value extraction or render as plain text.

The `renderMarkdown` function throws an `Error('Async rendering not supported')` if the underlying `marked` parser returns a promise instead of a string. This does not occur under normal usage since async rendering is not enabled.

When using a custom `highlighter`, if it throws an error or returns an empty array, the built-in highlighter is used as a fallback automatically.

When streaming, if a code block is never closed, `flush()` automatically closes it before rendering. Open thinking blocks in the buffer are rendered as-is on flush.

## Advanced Usage

### Custom Themes

Create a custom theme by extending any built-in theme:

```typescript
import { createRenderer } from 'ai-terminal-md';

const renderer = createRenderer({
  theme: {
    baseTheme: 'dark',
    heading1: { fg: '#ff6600', bold: true },
    syntaxKeyword: { fg: '#c678dd' },
    thinkingText: { fg: 'brightBlack', italic: true },
  },
});
```

Every property of the `Theme` interface can be overridden. Unspecified properties inherit from the base theme.

### Custom Syntax Highlighter

Provide a custom highlighter that implements the `CustomHighlighter` interface:

```typescript
import { createRenderer, type CustomHighlighter, type HighlightToken } from 'ai-terminal-md';

const myHighlighter: CustomHighlighter = {
  highlight(code: string, language: string): HighlightToken[] {
    if (language === 'myLang') {
      return [
        { text: 'keyword ', category: 'keyword' },
        { text: code.slice(8), category: 'plain' },
      ];
    }
    return []; // empty array falls back to built-in
  },
};

const renderer = createRenderer({ highlighter: myHighlighter });
```

Token categories: `keyword`, `string`, `number`, `comment`, `operator`, `type`, `function`, `variable`, `constant`, `punctuation`, `attribute`, `tag`, `property`, `plain`.

### Rendering AI Responses from an LLM Client

```typescript
import { createRenderer } from 'ai-terminal-md';

const renderer = createRenderer({
  theme: 'dark',
  thinking: 'dim',
  toolUse: 'box',
  toolResult: 'box',
  artifacts: 'panel',
  width: process.stdout.columns || 100,
});

// Streaming from an LLM API
async function displayResponse(stream: AsyncIterable<string>) {
  for await (const chunk of renderer.renderStream(stream)) {
    process.stdout.write(chunk);
  }
  process.stdout.write('\n');
}
```

### Non-TTY / Piped Output

When stdout is not a TTY (e.g., piping to a file), ANSI codes are automatically stripped. You can also force this behavior:

```typescript
import { render } from 'ai-terminal-md';

// Force plain text output
const plain = render('# Hello', { colorLevel: 'none' });
```

### Table Rendering Styles

```typescript
import { render } from 'ai-terminal-md';

const md = '| Name | Age |\n|------|-----|\n| Alice | 30 |\n| Bob | 25 |';

// Unicode box-drawing (default)
render(md, { tableStyle: 'unicode' });

// ASCII borders
render(md, { tableStyle: 'ascii' });

// No borders, space-separated
render(md, { tableStyle: 'none' });
```

### Supported AI Elements

The renderer automatically detects and renders the following AI-specific XML elements embedded in markdown:

**Thinking Blocks** -- Tags: `<thinking>`, `<antThinking>`, `<reflection>`, `<scratchpad>`, `<reasoning>`, `<inner_monologue>`, `<thought>`. Controlled by `thinking`: `'dim'` (default) renders dimmed text with a header and left border; `'show'` renders at full brightness; `'hide'` omits entirely.

**Artifacts** -- Tags: `<antArtifact>`, `<artifact>`. Supports `type`, `title`, and `identifier` attributes. Controlled by `artifacts`: `'panel'` (default) renders a bordered panel with title bar; `'inline'` renders a label above content; `'hide'` omits entirely.

**Tool Use** -- Tags: `<tool_use>`, `<function_call>`, `<tool_call>` with nested `<tool_name>` and `<arguments>`/`<parameters>`. Controlled by `toolUse`: `'box'` (default) renders a bordered box with tool name and formatted JSON arguments; `'inline'` renders compact `[Tool: name(args)]` format; `'hide'` omits entirely.

**Tool Results** -- Tags: `<tool_result>`, `<function_result>`. Detects error status via `is_error` attribute or `<status>error</status>` tag. Controlled by `toolResult`: `'box'` (default) renders a bordered box with success/error icon; `'inline'` renders compact format; `'hide'` omits entirely.

**Semantic Wrappers** -- Tags: `<result>`, `<answer>`, `<output>`, `<response>`. Controlled by `semanticWrappers`: `'strip'` (default) removes tags and renders inner content; `'label'` adds a subtle tag name label; `'keep'` passes tags through.

**Citations** -- Pattern: `[1]`, `[2]`, etc. (standalone, not markdown links). Controlled by `citations`: `'color'` (default) renders colored inline markers; `'plain'` applies no styling; `'hide'` removes from output.

## TypeScript

`ai-terminal-md` ships with complete TypeScript type definitions. All public types are exported from the package root:

```typescript
import type {
  Style,
  Theme,
  ThemeName,
  TokenCategory,
  HighlightToken,
  CustomHighlighter,
  RendererConfig,
  RenderOptions,
  StreamState,
  AITerminalRenderer,
} from 'ai-terminal-md';

import type { BoxChars } from 'ai-terminal-md';
```

The `Style` interface defines ANSI styling properties:

```typescript
interface Style {
  fg?: string;           // Foreground: ANSI name, 256-index, or hex (#RRGGBB)
  bg?: string;           // Background: ANSI name, 256-index, or hex (#RRGGBB)
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
}
```

The `Theme` interface defines styles for every renderable element, including headings, text formatting, code blocks, syntax highlighting categories, block-level elements, and all AI element types.

## License

MIT
