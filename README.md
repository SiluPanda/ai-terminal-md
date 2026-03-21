# ai-terminal-md

Terminal renderer optimized for AI markdown patterns. Renders markdown with full ANSI color support, syntax highlighting, and first-class handling of AI-specific XML elements (thinking blocks, artifacts, tool use, citations, and more).

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

## API Reference

### `render(markdown, options?)`

Convenience function. Renders a complete markdown string to an ANSI-formatted string.

```typescript
import { render } from 'ai-terminal-md';

const out = render('# Title\n\nBody text.', { theme: 'dark', width: 80 });
```

### `createRenderer(config?)`

Creates a reusable renderer instance. Returns an `AITerminalRenderer` object.

```typescript
import { createRenderer } from 'ai-terminal-md';

const renderer = createRenderer({ theme: 'dark', thinking: 'dim' });
```

### `renderer.render(markdown)`

Render a complete markdown string synchronously.

### `renderer.renderChunk(chunk, state?)`

Render a single chunk of streaming markdown. Returns `{ output, state }`. Pass the returned `state` into the next call to maintain streaming context.

```typescript
let state;
for (const chunk of chunks) {
  const result = renderer.renderChunk(chunk, state);
  process.stdout.write(result.output);
  state = result.state;
}
// Flush any remaining buffered content
process.stdout.write(renderer.flush(state));
```

### `renderer.flush(state)`

Render whatever is left in the streaming buffer. Call this after the last chunk to ensure all content is output. Returns a string.

### `renderer.renderStream(stream)`

Render an `AsyncIterable<string>` of markdown chunks. Returns an `AsyncIterable<string>` of rendered output chunks. Internally calls `renderChunk` for each incoming chunk and `flush` at the end.

```typescript
for await (const rendered of renderer.renderStream(aiStream)) {
  process.stdout.write(rendered);
}
```

## Configuration Options

Pass these as the `options` argument to `render()` or `createRenderer()`.

| Option | Type | Default | Description |
|---|---|---|---|
| `theme` | `'dark' \| 'light' \| 'minimal' \| 'monochrome'` | `'dark'` | Color theme |
| `width` | `number` | auto-detected | Terminal width in columns |
| `colorLevel` | `'none' \| '16' \| '256' \| 'truecolor'` | auto-detected | ANSI color support level |
| `unicode` | `boolean` | auto-detected | Use Unicode box-drawing characters |
| `thinking` | `'show' \| 'dim' \| 'hide'` | `'dim'` | How to render thinking blocks |
| `artifacts` | `'panel' \| 'inline' \| 'hide'` | `'panel'` | How to render artifact blocks |
| `toolUse` | `'box' \| 'inline' \| 'hide'` | `'box'` | How to render tool use blocks |
| `toolResult` | `'box' \| 'inline' \| 'hide'` | `'box'` | How to render tool result blocks |
| `semanticWrappers` | `'strip' \| 'label' \| 'keep'` | `'strip'` | How to handle semantic wrapper tags |
| `citations` | `'color' \| 'plain' \| 'hide'` | `'color'` | How to render citation markers |
| `codeBackground` | `boolean` | `true` | Apply background color to code blocks |
| `codeLineNumbers` | `boolean` | `false` | Show line numbers in code blocks |
| `codeLanguageLabel` | `boolean` | `true` | Show language label on code blocks |
| `codePadding` | `number` | `1` | Horizontal padding inside code blocks |
| `wordWrap` | `boolean` | `true` | Word-wrap text to terminal width |
| `margin` | `number` | `0` | Left margin (spaces) for all content |
| `showLinkUrls` | `boolean` | `true` | Show URLs after link text |
| `tableStyle` | `'unicode' \| 'ascii' \| 'none'` | `'unicode'` | Border style for tables |

## Supported AI Elements

The renderer automatically detects and renders the following AI-specific XML elements embedded in markdown:

### Thinking Blocks

Tags: `<thinking>`, `<antThinking>`, `<reflection>`, `<scratchpad>`, `<reasoning>`, `<inner_monologue>`, `<thought>`

Controlled by the `thinking` option:
- `'dim'` (default) — dimmed text with a "Thinking" header and left border
- `'show'` — full brightness with header and border
- `'hide'` — omit entirely

### Artifacts

Tags: `<antArtifact type="..." title="..." identifier="...">`, `<artifact>`

Controlled by the `artifacts` option:
- `'panel'` (default) — bordered panel with title bar using box-drawing characters
- `'inline'` — "Artifact: title" label above content
- `'hide'` — omit entirely

### Tool Use

Tags: `<tool_use>`, `<function_call>`, `<tool_call>` (with nested `<tool_name>` and `<arguments>`/`<parameters>`)

Controlled by the `toolUse` option:
- `'box'` (default) — bordered box with tool name header and formatted JSON arguments
- `'inline'` — compact `[Tool: name(arg=val)]` format
- `'hide'` — omit entirely

### Tool Results

Tags: `<tool_result>`, `<function_result>`

Controlled by the `toolResult` option:
- `'box'` (default) — bordered box with success/error icon and tool name
- `'inline'` — compact format with `✓` or `✗` prefix
- `'hide'` — omit entirely

### Semantic Wrappers

Tags: `<result>`, `<answer>`, `<output>`, `<response>`

Controlled by the `semanticWrappers` option:
- `'strip'` (default) — remove tags, render inner content
- `'label'` — add a subtle `[tagname]` label above the content
- `'keep'` — pass tags through as literal text

### Citations

Pattern: `[1]`, `[2]`, etc. (standalone — not markdown links)

Controlled by the `citations` option:
- `'color'` (default) — colored inline markers
- `'plain'` — no special styling
- `'hide'` — remove from output
