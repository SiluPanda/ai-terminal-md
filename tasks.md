# ai-terminal-md -- Task Breakdown

## Phase 0: Project Scaffolding and Setup

- [x] **Install runtime dependencies** — Add `marked` as a runtime dependency in package.json. This is the only runtime dep (CommonMark markdown parser). | Status: done
- [x] **Install dev dependencies** — Add `typescript`, `vitest`, `eslint`, `@types/node` as dev dependencies in package.json. | Status: done
- [x] **Configure ESLint** — Create `.eslintrc` or `eslint.config.*` with TypeScript support for the `src/` directory. | Status: done
- [x] **Create directory structure** — Create `src/languages/` and `src/__tests__/fixtures/` directories to match the file structure defined in the spec (section 18). | Status: done
- [x] **Add CLI bin entry to package.json** — Add `"bin": { "ai-terminal-md": "dist/cli.js" }` to package.json so the CLI binary is available after global install. | Status: done
- [x] **Verify build pipeline** — Run `npm run build`, `npm run lint`, and `npm run test` to confirm the toolchain works with the empty project before writing any logic. | Status: done

---

## Phase 1: Core Types, ANSI Utilities, and Terminal Detection

### 1.1 TypeScript Types (`src/types.ts`)

- [x] **Define `Style` interface** — Define the `Style` interface with optional fields: `fg`, `bg`, `bold`, `dim`, `italic`, `underline`, `strikethrough`. | Status: done
- [x] **Define `Theme` interface** — Define the `Theme` interface with all element style keys: headings (1-6), headingUnderline, body, bold, italic, strikethrough, link, linkUrl, code styles (codeBackground, codeLanguageLabel, codeLineNumber, inlineCode), syntax highlighting styles (syntaxKeyword, syntaxString, syntaxNumber, syntaxComment, syntaxOperator, syntaxType, syntaxFunction, syntaxVariable, syntaxConstant, syntaxPunctuation, syntaxAttribute, syntaxTag, syntaxProperty), block styles (blockquoteBorder, blockquoteText, horizontalRule, listBullet, listNumber, tableBorder, tableHeader), and AI element styles (thinkingHeader, thinkingBorder, thinkingText, artifactBorder, artifactTitle, toolUseBorder, toolUseHeader, toolUseKey, toolUseValue, toolResultBorder, toolResultHeader, toolResultSuccess, toolResultError, citation, semanticLabel). | Status: done
- [x] **Define `ThemeName` type** — Define `type ThemeName = 'dark' | 'light' | 'minimal' | 'monochrome'`. | Status: done
- [x] **Define `RendererConfig` interface** — Define the full configuration interface with all options: theme, width, colorLevel, unicode, thinking, artifacts, toolUse, toolResult, semanticWrappers, citations, codeBackground, codeLineNumbers, codeLanguageLabel, codePadding, highlighter, tableStyle, showLinkUrls, wordWrap, margin. Include JSDoc for each field with default values. | Status: done
- [x] **Define `RenderOptions` interface** — Define `RenderOptions` extending `RendererConfig` (identical but separate type for API clarity). | Status: done
- [x] **Define `AITerminalRenderer` interface** — Define the public renderer interface with methods: `render(markdown: string): string`, `renderStream(stream: AsyncIterable<string>): AsyncIterable<string>`, `renderChunk(chunk: string, state?: StreamState): { output: string; state: StreamState }`, `flush(state: StreamState): string`, and `readonly config: Readonly<RendererConfig>`. | Status: done
- [x] **Define `StreamState` interface** — Define the opaque `StreamState` interface with `readonly _internal: unknown`. | Status: done
- [x] **Define `TokenCategory` type** — Define `type TokenCategory = 'keyword' | 'string' | 'number' | 'comment' | 'operator' | 'type' | 'function' | 'variable' | 'constant' | 'punctuation' | 'attribute' | 'tag' | 'property' | 'plain'`. | Status: done
- [x] **Define `HighlightToken` interface** — Define with `text: string` and `category: TokenCategory`. | Status: done
- [x] **Define `CustomHighlighter` interface** — Define with `highlight(code: string, language: string): HighlightToken[]`. | Status: done

### 1.2 ANSI Escape Code Generation (`src/ansi.ts`)

- [x] **Implement 16-color foreground/background** — Write functions to generate ANSI escape sequences for the 16 standard terminal colors (black, red, green, yellow, blue, magenta, cyan, white and their bright variants) for both foreground and background. | Status: done
- [x] **Implement 256-color support** — Write functions to generate `\x1b[38;5;Nm` (fg) and `\x1b[48;5;Nm` (bg) sequences for 256-color palette indices. | Status: done
- [x] **Implement truecolor (24-bit RGB) support** — Write functions to generate `\x1b[38;2;R;G;Bm` (fg) and `\x1b[48;2;R;G;Bm` (bg) sequences from hex color strings like `#FF6B6B`. | Status: done
- [x] **Implement text attribute sequences** — Write functions for bold (`\x1b[1m`), dim (`\x1b[2m`), italic (`\x1b[3m`), underline (`\x1b[4m`), strikethrough (`\x1b[9m`), and reset (`\x1b[0m`). | Status: done
- [x] **Implement `applyStyle(text, style, colorLevel)` function** — Given text, a `Style` object, and the current color level, generate the correctly wrapped ANSI string. Handle color level downgrade (e.g., skip color codes when `colorLevel` is `'none'`, map truecolor to 256 when needed). | Status: done
- [x] **Implement `stripAnsi(str)` utility** — Remove all ANSI escape codes from a string using a regex. This is needed for non-TTY output and for test helpers. | Status: done

### 1.3 Terminal Capability Detection (`src/terminal.ts`)

- [x] **Implement `detectColorLevel()` function** — Detect terminal color support using the priority chain: explicit config > `FORCE_COLOR` env > `NO_COLOR` env > `COLORTERM` env > `TERM` 256color check > `stdout.isTTY` > fallback to none. | Status: done
- [x] **Implement `detectUnicode()` function** — Detect Unicode box-drawing support: check `LANG`/`LC_ALL`/`LC_CTYPE` for UTF-8, `TERM` for modern terminal, `WT_SESSION` on Windows, default to true. | Status: done
- [x] **Implement `getWidth()` function** — Return terminal width from `process.stdout.columns` or default to 80 if undefined/non-TTY. | Status: done
- [x] **Implement `isTTY()` function** — Return `process.stdout.isTTY` boolean, defaulting to false. | Status: done
- [x] **Implement box-drawing character mapping** — Create a mapping object that returns Unicode or ASCII characters based on the unicode capability flag. Map all characters specified in the spec: `─`/`-`, `│`/`|`, `┌┐└┘`/`+`, `├┤┬┴┼`/`+`, `╭╮╰╯`/`+`, `═`/`=`, `●`/`*`, `○`/`-`, `■`/`+`, `▸`/`>`, `✓`/`[x]`, `☐`/`[ ]`. | Status: done

### 1.4 Word Wrapping (`src/wrap.ts`)

- [x] **Implement basic word wrapping** — Wrap text to a given width, breaking at word boundaries (spaces). Preserve existing newlines. | Status: done
- [x] **Handle indentation preservation** — When wrapping text that has a leading indent, continuation lines should preserve the same indent level. | Status: done
- [x] **Exempt code blocks from wrapping** — Code block content must never be word-wrapped; lines overflow the terminal width. | Status: done
- [x] **Handle ANSI-aware width calculation** — When calculating line width for wrapping, ignore ANSI escape sequences (they are zero-width). | Status: done

---

## Phase 2: Themes

### 2.1 Theme Definitions (`src/theme.ts`)

- [x] **Implement `dark` theme** — Define all style values for the default dark theme: bright white H1, bright cyan H2, yellow H3, green H4, dim white H5/H6; magenta keywords, green strings, yellow numbers, dim gray comments, cyan operators, blue types; dimmed thinking text; etc. as described in spec sections 6 and 10. | Status: done
- [x] **Implement `light` theme** — Define all style values for light terminal backgrounds. Use darker colors, avoid yellow/bright white, use black for body text. | Status: done
- [x] **Implement `minimal` theme** — Define styles using only bold, dim, and underline attributes. No foreground color changes for body text. Code blocks use background but no syntax highlighting. | Status: done
- [x] **Implement `monochrome` theme** — Define styles using only bold, dim, underline, italic, and strikethrough. No color codes at all. Elements distinguished by text decoration. | Status: done
- [x] **Implement theme loading and merging** — Write a function that accepts a `ThemeName | Partial<Theme> & { baseTheme?: ThemeName }` and returns a complete `Theme`. Merge custom overrides onto the base theme, defaulting to dark. | Status: done
- [x] **Implement theme auto-detection** — When no theme is specified, detect dark/light via `COLORFGBG` env var. Check `AI_TERMINAL_MD_THEME` env var for override. Default to dark. | Status: done

---

## Phase 3: Standard Markdown Rendering

### 3.1 Markdown Renderer (`src/render-markdown.ts`)

- [x] **Set up `marked` custom renderer** — Create a custom `marked.Renderer` subclass (or use `marked`'s renderer hooks) that overrides rendering methods for each element type to produce ANSI-formatted strings. | Status: done
- [x] **Render H1 headers** — Bold, bright white text with full-width double-line underline (`═`). Preceded and followed by one blank line. | Status: done
- [x] **Render H2 headers** — Bold, bright cyan text with single-line underline (`─`). Preceded and followed by one blank line. | Status: done
- [x] **Render H3 headers** — Bold, yellow text. No underline. Preceded and followed by blank line. | Status: done
- [x] **Render H4 headers** — Bold, green text. No underline. Preceded and followed by blank line. | Status: done
- [x] **Render H5 headers** — Bold, dim white text. No underline. Preceded and followed by blank line. | Status: done
- [x] **Render H6 headers** — Bold, dim text. No underline. Preceded and followed by blank line. | Status: done
- [x] **Render paragraphs** — Body text with word wrapping applied per terminal width and margin settings. | Status: done
- [x] **Render bold text** — Apply bold ANSI attribute (`\x1b[1m`). | Status: done
- [x] **Render italic text** — Apply italic ANSI attribute (`\x1b[3m`). | Status: done
- [x] **Render strikethrough text** — Apply strikethrough ANSI attribute (`\x1b[9m`). | Status: done
- [x] **Render bold+italic combined** — Apply both bold and italic attributes together. | Status: done
- [x] **Render inline code** — Apply distinct background color (muted tone) to inline code spans. | Status: done
- [x] **Render code blocks (without syntax highlighting)** — Render fenced code blocks with: background color (configurable via `codeBackground`), language label at top-right (configurable via `codeLanguageLabel`), horizontal padding (configurable via `codePadding`), and optional line numbers (configurable via `codeLineNumbers`). Code is never word-wrapped. | Status: done
- [x] **Render unordered lists** — Use level-specific bullet characters: `●` (level 0), `○` (level 1), `■` (level 2), `▸` (level 3+). Two spaces indent per nesting level. Fall back to ASCII when unicode is disabled. | Status: done
- [x] **Render ordered lists** — Number followed by period. Nested ordered lists with their own numbering. Sub-items use `a.`, `b.`, etc. | Status: done
- [x] **Render task lists** — `[x]` renders as green `✓`, `[ ]` renders as dim `☐`. ASCII fallback: `[x]` and `[ ]`. | Status: done
- [x] **Render links** — Link text underlined, URL in parentheses dimmed (when `showLinkUrls` is true). Bare URLs displayed once, underlined. | Status: done
- [x] **Render blockquotes** — Left border with `│` in dim color. Text dimmed. Two-space indent. Nested blockquotes add additional `│` with space separator. | Status: done
- [x] **Render tables** — Box-drawing borders (Unicode by default, ASCII fallback). Auto-calculated column widths. Bold header row. Honor alignment syntax (`:---`, `:---:`, `---:`). Separator between header and body with `├─┼─┤`. Configurable via `tableStyle`. | Status: done
- [x] **Render horizontal rules** — Full-width line using `─` (or `-` in ASCII mode), dimmed. | Status: done
- [x] **Render images** — Placeholder text: `[Image: alt text]` in dim italic. If no alt text, render `[Image]`. | Status: done

### 3.2 Renderer Class (`src/renderer.ts`)

- [x] **Implement `AITerminalRenderer` class** — Create the class that holds resolved config (theme, terminal capabilities, all options). Wire up `marked` parsing and the custom markdown renderer. | Status: done
- [x] **Implement `render(markdown)` method** — Parse markdown with `marked`, apply the custom renderer, return ANSI-formatted string. | Status: done
- [x] **Implement config resolution** — Merge explicit config options with env var overrides and auto-detected defaults. Priority: explicit config > env vars > auto-detected. Handle `AI_TERMINAL_MD_THEME`, `AI_TERMINAL_MD_THINKING`, `AI_TERMINAL_MD_WIDTH` env vars. | Status: done
- [x] **Implement non-TTY mode** — When `stdout.isTTY` is false, strip all ANSI codes from output. Preserve structural formatting (indentation, line breaks, ASCII borders). | Status: done
- [x] **Implement margin support** — Apply left margin (configurable number of spaces) to all rendered content. | Status: done

### 3.3 Public API (`src/index.ts`)

- [x] **Export `render(markdown, options?)` function** — Top-level function that creates a default renderer with provided options and renders the markdown. | Status: done
- [x] **Export `createRenderer(config?)` factory** — Factory function that returns a configured `AITerminalRenderer` instance. | Status: done
- [x] **Export all public types** — Export `RendererConfig`, `RenderOptions`, `AITerminalRenderer`, `StreamState`, `Theme`, `ThemeName`, `Style`, `CustomHighlighter`, `HighlightToken`, `TokenCategory`. | Status: done

### 3.4 Phase 1 Tests

- [x] **Test H1-H6 header rendering** — Verify each heading level renders with the correct ANSI attributes (bold, correct color). Verify H1 has double-line underline, H2 has single-line underline, H3-H6 have none. | Status: done
- [x] **Test bold/italic/strikethrough rendering** — Verify `**bold**` produces `\x1b[1m`, `*italic*` produces `\x1b[3m`, `~~strike~~` produces `\x1b[9m`. | Status: done
- [x] **Test inline code rendering** — Verify `` `code` `` gets background color applied. | Status: done
- [x] **Test code block rendering** — Verify fenced code blocks get background color, language label, padding, and optional line numbers. Verify code is not word-wrapped. | Status: done
- [x] **Test unordered list rendering** — Verify correct bullet characters per nesting level. Verify indentation. | Status: done
- [x] **Test ordered list rendering** — Verify numbering and nested sub-item lettering. | Status: done
- [x] **Test task list rendering** — Verify `[x]` shows green check, `[ ]` shows empty box. | Status: done
- [x] **Test link rendering** — Verify underlined text and URL display. Test `showLinkUrls: false`. | Status: done
- [x] **Test blockquote rendering** — Verify left border, dimmed text, and nested blockquote additional borders. | Status: done
- [x] **Test table rendering** — Verify box-drawing borders, column alignment, auto-sizing, bold headers. Test all `tableStyle` options. | Status: done
- [x] **Test horizontal rule rendering** — Verify full-width line. | Status: done
- [x] **Test image placeholder rendering** — Verify `[Image: alt]` and `[Image]` output. | Status: done
- [x] **Test word wrapping** — Verify text wraps at configured width. Verify code blocks are exempt. | Status: done
- [x] **Test width adaptation** — Verify wrapping at width 40 vs width 120. | Status: done
- [x] **Test non-TTY output** — Verify ANSI codes are stripped when `isTTY` is false. | Status: done
- [x] **Test `colorLevel: 'none'`** — Verify no ANSI color codes in output. Bold/dim/underline attributes may still appear. | Status: done
- [x] **Test `unicode: false`** — Verify box-drawing characters are replaced with ASCII equivalents. | Status: done
- [x] **Test margin option** — Verify left margin spaces are applied to all content. | Status: done
- [x] **Create test fixtures for standard markdown** — Create `src/__tests__/fixtures/markdown.ts` with reusable markdown input strings and expected output patterns. | Status: done

---

## Phase 4: Syntax Highlighting

### 4.1 Highlighter Framework (`src/highlighter.ts`)

- [x] **Implement tokenizer framework** — Build the regex-based tokenizer that accepts code and a language identifier, dispatches to the language-specific token patterns, and returns `HighlightToken[]`. | Status: done
- [x] **Implement language dispatch** — Map language fence tags to tokenizer functions. Handle aliases (e.g., `js` -> JavaScript, `py` -> Python, `rs` -> Rust, etc.). | Status: done
- [x] **Implement custom highlighter integration** — When a `CustomHighlighter` is provided in config, call it first. If it returns an empty array or throws, fall back to the built-in tokenizer. | Status: done
- [x] **Handle unknown languages** — When the language tag is not recognized, return plain tokens (no syntax coloring). The code block still gets background and language label. | Status: done

### 4.2 Language Definitions (`src/languages/`)

- [x] **Create language registry (`src/languages/index.ts`)** — Export a map from fence tag strings to tokenizer functions. | Status: done
- [x] **Implement JavaScript tokenizer (`src/languages/javascript.ts`)** — Token patterns for: keywords (`function`, `const`, `let`, `var`, `class`, `return`, `if`, `else`, `import`, `export`, etc.), strings (single/double/template literals), numbers, comments (line and block), regex literals, operators. | Status: done
- [x] **Implement TypeScript tokenizer (`src/languages/javascript.ts`)** — Extend JavaScript patterns with type keywords: `interface`, `type`, `enum`, `as`, `implements`, `readonly`, `keyof`, `infer`, etc. Share the same file since TS is a superset of JS. | Status: done
- [x] **Implement Python tokenizer (`src/languages/python.ts`)** — Keywords (`def`, `class`, `import`, `from`, `if`, `elif`, `else`, `return`, `yield`, `async`, `await`, etc.), strings (single/double/triple-quoted, f-strings), numbers, comments (`#`), decorators (`@`). | Status: done
- [x] **Implement Rust tokenizer (`src/languages/rust.ts`)** — Keywords (`fn`, `let`, `mut`, `impl`, `struct`, `enum`, `match`, `pub`, `use`, etc.), strings, lifetime annotations (`'a`), numbers, comments, macros (`name!`), attributes (`#[...]`). | Status: done
- [x] **Implement Go tokenizer (`src/languages/go.ts`)** — Keywords (`func`, `var`, `const`, `type`, `struct`, `interface`, `go`, `chan`, `select`, `defer`, etc.), strings, rune literals, numbers, comments, package names. | Status: done
- [x] **Implement Java tokenizer (`src/languages/java.ts`)** — Keywords (`public`, `private`, `class`, `interface`, `extends`, `implements`, `static`, `void`, etc.), strings, numbers, comments, annotations (`@Override`). | Status: done
- [x] **Implement Ruby tokenizer (`src/languages/ruby.ts`)** — Keywords (`def`, `class`, `module`, `end`, `do`, `if`, `unless`, `while`, etc.), strings, symbols (`:name`), numbers, comments (`#`), regex, heredocs. | Status: done
- [x] **Implement Shell/Bash tokenizer (`src/languages/shell.ts`)** — Keywords (`if`, `then`, `else`, `fi`, `for`, `while`, `do`, `done`, `case`, `esac`, etc.), strings, variables (`$VAR`, `${VAR}`), comments (`#`), command substitution (`$(...)`, backticks). | Status: done
- [x] **Implement SQL tokenizer (`src/languages/sql.ts`)** — Keywords (`SELECT`, `FROM`, `WHERE`, `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `ALTER`, `DROP`, `JOIN`, etc., case-insensitive), strings, numbers, comments (`--`, `/* */`), operators. | Status: done
- [x] **Implement HTML tokenizer (`src/languages/web.ts`)** — Tags, attributes, attribute values, comments (`<!-- -->`), entities (`&amp;`). | Status: done
- [x] **Implement CSS tokenizer (`src/languages/web.ts`)** — Selectors, properties, values, colors (`#hex`, named), comments (`/* */`), at-rules (`@media`, `@import`). Share file with HTML. | Status: done
- [x] **Implement JSON tokenizer (`src/languages/data.ts`)** — Keys (distinct color), string values, numbers, booleans (`true`/`false`), `null`. | Status: done
- [x] **Implement YAML tokenizer (`src/languages/data.ts`)** — Keys, string values, numbers, booleans, comments (`#`), anchors (`&`, `*`). Share file with JSON. | Status: done
- [x] **Implement Markdown tokenizer (`src/languages/markdown.ts`)** — Headers (`#`), bold (`**`), italic (`*`), code (backticks), links, lists. For nested markdown inside code blocks. | Status: done
- [x] **Implement C/C++ tokenizer (`src/languages/c.ts`)** — Keywords (`int`, `char`, `void`, `struct`, `class`, `template`, `namespace`, `#include`, `#define`, etc.), strings, numbers, comments, preprocessor directives (`#`). | Status: done
- [x] **Implement PHP tokenizer (`src/languages/php.ts`)** — Keywords (`function`, `class`, `public`, `private`, `echo`, `namespace`, `use`, etc.), strings, variables (`$var`), numbers, comments. | Status: done

### 4.3 Integrate Highlighting into Code Blocks

- [x] **Update code block rendering with syntax highlighting** — In `render-markdown.ts`, when a code block has a language tag, tokenize the code using the highlighter and apply theme colors per `TokenCategory`. If no language tag or unknown language, render as plain monospace text with background. | Status: done

### 4.4 Syntax Highlighting Tests

- [x] **Test JavaScript keyword highlighting** — Verify `function`, `const`, `return` are highlighted as keywords (magenta in dark theme). | Status: done
- [x] **Test JavaScript string highlighting** — Verify single-quoted, double-quoted, and template literal strings are highlighted (green in dark theme). | Status: done
- [x] **Test Python highlighting** — Verify `def`, `class`, `import` are keywords; triple-quoted strings are highlighted; decorators are attributes. | Status: done
- [x] **Test JSON highlighting** — Verify keys and string values have distinct colors. Verify booleans and null are highlighted as constants. | Status: done
- [x] **Test unknown language fallback** — Verify code with unrecognized language tag renders as plain text with background but no color. | Status: done
- [x] **Test custom highlighter** — Verify custom highlighter output is used when provided. Verify fallback to built-in when custom returns empty array. Verify fallback when custom throws. | Status: done
- [x] **Test all 15+ languages have basic highlighting** — Smoke tests for each language tokenizer: provide a short code sample and verify tokens are produced with non-plain categories. | Status: done
- [x] **Create test fixtures for code blocks** — Create `src/__tests__/fixtures/code-blocks.ts` with code samples per language. | Status: done

---

## Phase 5: AI-Specific Element Rendering

### 5.1 AI Pattern Parser (`src/parser.ts`)

- [x] **Implement thinking block detection** — Detect all thinking tag variants: `<thinking>`, `<antThinking>`, `<reflection>`, `<scratchpad>`, `<reasoning>`, `<inner_monologue>`, `<thought>`. Case-insensitive regex matching. Handle nested content by matching outermost tag pairs. Support multiple thinking blocks in a single response. | Status: done
- [x] **Implement artifact block detection** — Detect `<artifact ...>...</artifact>`. Extract attributes: `type`, `title`, `identifier` from the opening tag. | Status: done
- [x] **Implement tool use block detection** — Detect `<tool_use>`, `<function_call>`, `<tool_call>` patterns. Extract tool name from `<tool_name>` or `<name>` child element. Extract arguments from `<arguments>` or `<parameters>` child element. Parse arguments as JSON or key-value pairs. | Status: done
- [x] **Implement tool result block detection** — Detect `<tool_result>`, `<function_result>` patterns. Detect error status from `status="error"` attribute or content starting with `"Error:"`. | Status: done
- [x] **Implement semantic wrapper detection** — Detect `<result>`, `<answer>`, `<output>`, `<response>` wrapper tags. | Status: done
- [x] **Implement citation detection** — Detect `[1]`, `[2]`, `[Source: ...]`, and `[LabelText]` patterns using regex. Distinguish citations from markdown link syntax. | Status: done
- [x] **Implement pre-processing pipeline** — Scan raw markdown for AI-specific XML elements before passing to `marked`. Extract AI elements, replace them with placeholder markers, and return a map of placeholder -> structured AI element data. | Status: done

### 5.2 AI Element Renderer (`src/render-ai.ts`)

- [x] **Render thinking blocks (dim mode)** — Render with "Thinking" header in dim italic, body in dim text with left `│` border, two-space indent per line. Separated by blank lines. | Status: done
- [x] **Render thinking blocks (show mode)** — Same structure as dim mode but at full brightness (no dim attribute on body text). | Status: done
- [x] **Render thinking blocks (hide mode)** — Omit entirely from output. Parse and skip. | Status: done
- [x] **Render artifact blocks (panel mode)** — Bordered panel with Unicode rounded corners (`╭╮╰╯`). Title bar showing artifact title and type in bold. Content indented by two characters inside border. Content rendered using standard markdown rules (inner code blocks get highlighting). Wrap content to fit within border width. | Status: done
- [x] **Render artifact blocks (inline mode)** — Title label above content (no border). Content rendered normally. | Status: done
- [x] **Render artifact blocks (hide mode)** — Omit entirely. | Status: done
- [x] **Render tool use blocks (box mode)** — Single-line box-drawing border (`┌┐└┘`). Header "Tool Call:" + tool name in bold. Arguments as indented key-value pairs: key in cyan, value in default color. JSON objects pretty-printed, primitives inline. | Status: done
- [x] **Render tool use blocks (inline mode)** — Compact inline: `[Tool: tool_name(arg1, arg2)]`. | Status: done
- [x] **Render tool use blocks (hide mode)** — Omit entirely. | Status: done
- [x] **Render tool result blocks (box mode)** — Single-line box border. Header "Result" in green for success, "Error" in red for error. Content syntax-highlighted if JSON. | Status: done
- [x] **Render tool result blocks (inline mode)** — Compact inline representation. | Status: done
- [x] **Render tool result blocks (hide mode)** — Omit entirely. | Status: done
- [x] **Render semantic wrappers (strip mode)** — Remove tags entirely, render inner content with standard markdown rules. | Status: done
- [x] **Render semantic wrappers (label mode)** — Remove tags, add subtle label above content (e.g., "Answer:"). | Status: done
- [x] **Render semantic wrappers (keep mode)** — Pass through raw tags as literal text. | Status: done
- [x] **Render citations (color mode)** — Color citation markers (blue by default) to make them visually scannable. | Status: done
- [x] **Render citations (plain mode)** — No special styling, render as plain text. | Status: done
- [x] **Render citations (hide mode)** — Remove citation markers from output. | Status: done
- [ ] **Render reasoning steps** — Detect numbered lists with substantive items. Apply enhanced visual hierarchy: bold step numbers in distinct color (yellow), increased indentation for step content, blank line separation between steps. Nested content (code blocks, sub-lists) indented relative to the step. | Status: not_done

### 5.3 Integrate AI Rendering into Main Pipeline

- [x] **Update `renderer.ts` with AI pre-processing** — Before markdown parsing, run the AI pattern parser to extract AI elements and replace with placeholders. After markdown rendering, splice AI-rendered elements back at placeholder positions. | Status: done
- [x] **Handle mixed AI and standard markdown** — Ensure AI elements interleaved with standard markdown (headings, paragraphs, code blocks) render correctly with proper spacing and no lost content. | Status: done

### 5.4 AI Element Tests

- [x] **Test thinking block dim rendering** — Verify `<thinking>content</thinking>` renders with dim text, border character, and "Thinking" header. | Status: done
- [x] **Test thinking block hide rendering** — Verify `<thinking>content</thinking>` is omitted when `thinking: 'hide'`. | Status: done
- [x] **Test thinking block show rendering** — Verify `<thinking>content</thinking>` renders at full brightness when `thinking: 'show'`. | Status: done
- [x] **Test all thinking tag variants** — Verify `<antThinking>`, `<reflection>`, `<scratchpad>`, `<reasoning>`, `<inner_monologue>`, `<thought>` are all detected and rendered. | Status: done
- [x] **Test artifact panel rendering** — Verify `<artifact type="..." title="...">content</artifact>` produces bordered panel with title bar showing type and title. | Status: done
- [x] **Test artifact attribute extraction** — Verify `type`, `title`, and `identifier` attributes are correctly parsed from the opening tag. | Status: done
- [ ] **Test artifact inner content rendering** — Verify code blocks inside artifacts get syntax highlighting. | Status: not_done
- [x] **Test tool use box rendering** — Verify `<tool_use>` with tool name and JSON arguments renders as function call box with key-value pairs. | Status: done
- [x] **Test tool use alternative patterns** — Verify `<function_call>` and `<tool_call>` variants are detected. | Status: done
- [x] **Test tool result success rendering** — Verify tool result renders with green "Result" header. | Status: done
- [x] **Test tool result error rendering** — Verify tool result with `status="error"` renders with red "Error" header. | Status: done
- [x] **Test semantic wrapper strip mode** — Verify `<result>content</result>` strips tags and renders inner content. | Status: done
- [x] **Test semantic wrapper label mode** — Verify label is added above content. | Status: done
- [ ] **Test semantic wrapper keep mode** — Verify raw tags are preserved as literal text. | Status: not_done
- [x] **Test citation color rendering** — Verify `[1]` and `[2]` render in citation color (blue in dark theme). | Status: done
- [x] **Test citation hide rendering** — Verify citations are removed from output when `citations: 'hide'`. | Status: done
- [x] **Test multiple thinking blocks** — Verify multiple `<thinking>` blocks in one response are each rendered independently. | Status: done
- [ ] **Test mixed AI and markdown content** — Verify a response containing thinking, code blocks, headings, tool calls, and regular text renders correctly with proper ordering and spacing. | Status: not_done
- [ ] **Create test fixtures for AI elements** — Create `src/__tests__/fixtures/ai-elements.ts` with reusable AI element markdown samples. | Status: not_done

---

## Phase 6: Streaming Rendering

### 6.1 Streaming State Machine (`src/streaming.ts`)

- [ ] **Define internal streaming state structure** — Define the internal state tracked by the streaming renderer: current state enum (`text`, `code-fence`, `code-inline`, `thinking`, `artifact`, `tool-use`, `tool-result`, `heading`, `blockquote`, `list`, `table`), line buffer, pending inline formatting state, deferred content buffer. | Status: not_done
- [ ] **Implement state transitions** — Implement all state transitions defined in the spec: `text` -> `code-fence` on opening fence, `code-fence` -> `text` on closing fence, `text` -> `thinking` on `<thinking>`, `thinking` -> `text` on `</thinking>`, and all other transitions listed in section 8. | Status: not_done
- [x] **Implement line buffering** — Accumulate incoming tokens into a line buffer. When `\n` is received, the completed line is available for processing. | Status: done
- [ ] **Implement line classification** — Classify completed lines based on current state and line content. Detect headings, code fences, AI XML tags, list markers, table pipes, blockquote markers. | Status: not_done
- [x] **Implement immediate output for unambiguous lines** — Render and flush lines that can be definitively classified: paragraph text, list items, heading lines (in text state), code lines (in code-fence state). | Status: done
- [x] **Implement deferred output for ambiguous lines** — Buffer lines that need more context for classification (e.g., first line of a potential table). | Status: done
- [ ] **Implement inline formatting tracking** — Track open bold/italic/code-inline spans across chunks. Apply styling even when the opening and closing markers arrive in different chunks. | Status: not_done

### 6.2 Streaming API Methods

- [x] **Implement `renderChunk(chunk, state?)` method** — Accept a chunk string and optional previous state. Process the chunk through the state machine. Return `{ output: string; state: StreamState }`. Create initial state if no state provided. | Status: done
- [x] **Implement `renderStream(stream)` method** — Accept `AsyncIterable<string>`, iterate through chunks calling `renderChunk`, yield rendered output strings. Call `flush` when the stream ends. | Status: done
- [x] **Implement `flush(state)` method** — Finalize a streaming session. Render any buffered content: unclosed code blocks, unclosed thinking blocks (with truncation note), pending table rows, remaining line buffer content. | Status: done

### 6.3 Streaming Partial Element Handling

- [x] **Handle streaming code fences** — Accumulate code lines and apply syntax highlighting per line as each line completes. Language label rendered eagerly on the fence-opening line in streaming mode. | Status: done
- [x] **Handle streaming thinking blocks** — Render thinking lines dimmed with border as they arrive. When closing tag arrives, add trailing blank line. | Status: done
- [ ] **Handle streaming lists** — Render each list item as it completes. Detect nesting by indentation. | Status: not_done
- [ ] **Handle streaming tables** — Buffer until header separator row (`|---|`) is seen, then render header and subsequent rows as they arrive. | Status: not_done
- [ ] **Handle streaming inline code** — Buffer until closing backtick or end of line. If end of line with no closing backtick, render buffered text with inline code styling. | Status: not_done
- [x] **Handle unclosed elements on flush** — Unclosed code fence: render accumulated code content. Unclosed thinking block: render with truncation note. Growing list: finalize list rendering. | Status: done

### 6.4 Wire Streaming into Renderer

- [x] **Add `renderStream`, `renderChunk`, `flush` to `AITerminalRenderer` class** — Wire the streaming module methods into the renderer class, passing through the resolved config and theme. | Status: done

### 6.5 Streaming Tests

- [ ] **Test character-by-character paragraph rendering** — Feed a complete paragraph one character at a time. Verify concatenated output matches batch rendering. | Status: not_done
- [x] **Test streaming code block rendering** — Feed a code block token by token (opening fence, language tag, newline, code lines, closing fence). Verify syntax highlighting is applied. | Status: done
- [x] **Test streaming thinking block rendering** — Feed a thinking block incrementally. Verify header appears when opening tag is complete, content renders dimmed, block closes correctly. | Status: done
- [x] **Test streaming mixed elements** — Feed a response with heading, paragraph, code block, thinking block, and list. Verify streaming output is semantically equivalent to batch rendering. | Status: done
- [x] **Test flush with unclosed code fence** — Open a code fence without closing. Call `flush()`. Verify buffered code content is rendered. | Status: done
- [ ] **Test flush with unclosed thinking block** — Open a thinking block without closing. Call `flush()`. Verify thinking content is rendered with truncation note. | Status: not_done
- [ ] **Test streaming list growth** — Start a list that keeps growing. Verify each new list item is rendered as it arrives. | Status: not_done
- [ ] **Test state machine transitions** — Verify `text` -> `code-fence` on opening fence, `code-fence` -> `text` on closing fence. Verify `text` -> `thinking` on `<thinking>`, `thinking` -> `text` on `</thinking>`. | Status: not_done
- [ ] **Test inline formatting across chunks** — Open bold in one chunk, close it in another. Verify bold styling is correctly applied across the boundary. | Status: not_done
- [x] **Test `renderStream` with AsyncIterable** — Create an async iterable of chunks and verify `renderStream` yields correct rendered output. | Status: done
- [ ] **Create streaming test fixtures** — Create `src/__tests__/fixtures/streaming.ts` with chunked input sequences for various scenarios. | Status: not_done

---

## Phase 7: CLI

### 7.1 CLI Implementation (`src/cli.ts`)

- [ ] **Implement CLI argument parser** — Parse command-line flags: `--theme`, `--thinking`, `--artifacts`, `--tool-use`, `--line-numbers`, `--no-highlight`, `--no-background`, `--width`, `--margin`, `--no-wrap`, `--no-color`, `--ascii`, `--version`, `--help`. Parse positional argument as file path. | Status: not_done
- [ ] **Implement stdin reading** — When no file argument is provided, read from stdin until EOF. | Status: not_done
- [ ] **Implement file reading** — When a file argument is provided, read the file contents. Handle file-not-found with exit code 1 and an error message to stderr. | Status: not_done
- [ ] **Implement `--help` output** — Print usage text matching the spec's CLI section (commands, flags, descriptions). Exit with code 0. | Status: not_done
- [ ] **Implement `--version` output** — Print the package version from package.json. Exit with code 0. | Status: not_done
- [ ] **Map CLI flags to RendererConfig** — Translate CLI flags to `RendererConfig` options: `--theme` -> `theme`, `--thinking` -> `thinking`, `--line-numbers` -> `codeLineNumbers: true`, `--no-highlight` -> disable syntax highlighting, `--no-background` -> `codeBackground: false`, `--width` -> `width` (parse integer), `--margin` -> `margin` (parse integer), `--no-wrap` -> `wordWrap: false`, `--no-color` -> `colorLevel: 'none'`, `--ascii` -> `unicode: false`. | Status: not_done
- [ ] **Implement rendering and output** — Create renderer with mapped config, render input markdown, write to stdout. | Status: not_done
- [ ] **Implement error handling for invalid flags** — If an invalid flag or invalid flag value is provided, print error to stderr and exit with code 2. | Status: not_done
- [ ] **Add hashbang line** — Ensure `cli.ts` compiles to `cli.js` with `#!/usr/bin/env node` at the top for direct execution. | Status: not_done
- [ ] **Handle streaming stdin for piped LLM output** — When stdin is a pipe (not a file), consider streaming rendering mode for real-time display of piped LLM output. | Status: not_done

### 7.2 CLI Tests

- [ ] **Test `echo "# Hello" | ai-terminal-md`** — Verify output contains bold "Hello" text. | Status: not_done
- [ ] **Test `ai-terminal-md test-file.md`** — Verify file is read and rendered output is produced. | Status: not_done
- [ ] **Test `--theme monochrome`** — Verify no color codes in output. | Status: not_done
- [ ] **Test `--thinking hide`** — Verify thinking blocks are not present in output. | Status: not_done
- [ ] **Test `--line-numbers`** — Verify code blocks include line numbers. | Status: not_done
- [ ] **Test `--no-color`** — Verify no ANSI escape codes in output. | Status: not_done
- [ ] **Test nonexistent file** — Verify exit code 1. | Status: not_done
- [ ] **Test invalid flag** — Verify exit code 2. | Status: not_done
- [ ] **Test `--version`** — Verify version string is printed. | Status: not_done
- [ ] **Test `--help`** — Verify help text is printed. | Status: not_done

---

## Phase 8: Theme Tests

- [x] **Test dark theme colors** — Verify H1 uses bright white, code keywords use magenta, strings use green in dark theme. | Status: done
- [x] **Test light theme colors** — Verify H1 uses dark blue, body text uses black in light theme. | Status: done
- [x] **Test monochrome theme** — Verify no color codes in output. Only bold/dim/underline attributes. | Status: done
- [x] **Test minimal theme** — Verify reduced color usage. Only bold, dim, underline attributes for text. | Status: done
- [x] **Test custom theme overrides** — Verify specified overrides are applied. Verify unspecified elements use the base theme defaults. | Status: done
- [x] **Test custom theme with `baseTheme`** — Verify a custom theme based on `light` inherits light theme defaults for unspecified elements. | Status: done
- [x] **Test theme auto-detection** — Verify `COLORFGBG` env var is checked. Verify `AI_TERMINAL_MD_THEME` env var overrides default. | Status: done

---

## Phase 9: Configuration and Environment Variable Tests

- [ ] **Test each config option changes output** — For every config option (`thinking`, `artifacts`, `toolUse`, `toolResult`, `semanticWrappers`, `citations`, `codeBackground`, `codeLineNumbers`, `codeLanguageLabel`, `codePadding`, `tableStyle`, `showLinkUrls`, `wordWrap`, `margin`), verify that changing the option changes the rendered output as documented. | Status: not_done
- [x] **Test `AI_TERMINAL_MD_THEME` env var** — Verify theme is set from env var when not in config. | Status: done
- [ ] **Test `AI_TERMINAL_MD_THINKING` env var** — Verify thinking mode is set from env var when not in config. | Status: not_done
- [x] **Test `AI_TERMINAL_MD_WIDTH` env var** — Verify width is set from env var when not in config. | Status: done
- [x] **Test `NO_COLOR` env var** — Verify color is disabled when `NO_COLOR` is set. | Status: done
- [x] **Test `FORCE_COLOR` env var** — Verify color level is set to the specified value (0/1/2/3). | Status: done
- [x] **Test explicit config overrides env vars** — Verify that when both config and env var are set, config wins. | Status: done

---

## Phase 10: Edge Cases and Robustness

- [x] **Handle empty input** — Verify `render("")` returns empty string without error. | Status: done
- [x] **Handle very long lines** — Verify lines exceeding terminal width are handled gracefully (wrapped for text, overflow for code). | Status: done
- [x] **Handle deeply nested lists** — Verify 4+ levels of nesting render with correct bullet progression and indentation. | Status: done
- [ ] **Handle tables with many columns** — Verify wide tables overflow terminal width without crashing. | Status: not_done
- [x] **Handle code blocks with no language tag** — Verify rendered with background but no syntax highlighting and no language label. | Status: done
- [ ] **Handle mixed AI elements and standard markdown** — Verify a complex document with thinking, artifacts, tool calls, headings, code, tables, and lists renders correctly with all elements properly formatted and ordered. | Status: not_done
- [ ] **Handle Unicode edge cases** — Test CJK characters (double-width), emoji, and combining marks in text and tables. Verify width calculation accounts for double-width characters. | Status: not_done
- [ ] **Handle nested AI elements** — Verify markdown inside thinking blocks, code inside artifacts, and other nested combinations render correctly. | Status: not_done
- [ ] **Handle malformed AI XML tags** — Verify unclosed `<thinking>` tags, malformed `<artifact` tags without closing `>`, and other edge cases degrade gracefully (render as literal text rather than crashing). | Status: not_done
- [ ] **Handle consecutive AI elements** — Verify back-to-back thinking blocks, multiple tool calls in sequence, and adjacent artifacts render with proper spacing. | Status: not_done

---

## Phase 11: Performance Verification

- [ ] **Benchmark batch rendering — small input** — Verify 500-byte input renders in < 0.5ms. | Status: not_done
- [ ] **Benchmark batch rendering — medium input** — Verify 5KB input renders in < 2ms. | Status: not_done
- [ ] **Benchmark batch rendering — large input** — Verify 20KB input with multiple code blocks, tables, and thinking blocks renders in < 10ms. | Status: not_done
- [ ] **Benchmark batch rendering — stress test** — Verify 100KB input renders in < 50ms. | Status: not_done
- [ ] **Benchmark streaming per-chunk overhead** — Verify per-chunk processing takes < 0.1ms for typical 5-50 character chunks. | Status: not_done
- [ ] **Benchmark syntax highlighting** — Verify highlighting a 50-line code block takes < 1ms. | Status: not_done
- [ ] **Verify memory footprint** — Verify renderer instance uses < 5KB of memory. Verify memory does not grow during streaming. | Status: not_done

---

## Phase 12: Test Infrastructure

- [x] **Create `stripAnsi` test helper** — Utility function that removes all ANSI escape codes from a string. Used in tests to verify textual content independent of styling. | Status: done
- [ ] **Create `hasAnsiCode` test helper** — Utility function that checks whether a specific ANSI code (e.g., bold, dim, a specific color) is present in a string. | Status: not_done
- [x] **Create `renderAndStrip` test helper** — Convenience function that renders markdown and strips ANSI, returning plain text for content verification. | Status: done
- [x] **Set up test fixtures directory** — Create `src/__tests__/fixtures/` with all fixture files referenced by tests. | Status: done

---

## Phase 13: Documentation

- [ ] **Write README.md** — Write comprehensive README with: package description, installation instructions, quickstart examples, full API reference (`render`, `createRenderer`, `AITerminalRenderer`), configuration options table, theme documentation (built-in themes, custom themes, theme gallery), AI element examples (thinking, artifacts, tool use), streaming API usage, CLI usage guide, environment variables, integration examples (ai-spinner, llm-output-normalizer). | Status: not_done
- [ ] **Add JSDoc to all public exports** — Ensure every exported function, interface, type, and class has JSDoc documentation matching the spec descriptions. | Status: not_done

---

## Phase 14: Final Validation and Publishing Prep

- [ ] **Run full test suite** — `npm run test` passes with all tests green. | Status: not_done
- [ ] **Run linter** — `npm run lint` passes with no errors. | Status: not_done
- [ ] **Run build** — `npm run build` succeeds, producing correct output in `dist/`. | Status: not_done
- [ ] **Verify type declarations** — Check that `dist/index.d.ts` exports all public types correctly. | Status: not_done
- [ ] **Verify CLI binary** — Run `node dist/cli.js --help` and `node dist/cli.js --version` to verify CLI works from compiled output. | Status: not_done
- [ ] **Verify non-TTY output** — Pipe output to a file and verify clean plain text (no ANSI codes). | Status: not_done
- [ ] **End-to-end smoke test** — Render a complete AI response (with thinking, code blocks, tool calls, artifacts, and standard markdown) and verify visually correct terminal output. | Status: not_done
- [ ] **Version bump** — Set version in package.json to the appropriate release version following semver. | Status: not_done
