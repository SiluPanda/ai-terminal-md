# ai-terminal-md -- Specification

## 1. Overview

`ai-terminal-md` is a terminal markdown renderer purpose-built for AI-generated content. It accepts markdown text -- including AI-specific patterns like `<thinking>` blocks, `<artifact>` panels, tool use indicators, and structured reasoning steps -- and produces ANSI-formatted terminal output with syntax-highlighted code blocks, styled headers, formatted tables, and visually distinct rendering for each AI-specific element. It provides both a synchronous API for rendering complete markdown strings and a streaming API for rendering token-by-token output from LLM APIs without re-rendering the entire response on each chunk.

The gap this package fills is specific and well-defined. `marked-terminal` is the most popular terminal markdown renderer in the npm ecosystem, with millions of weekly downloads. It takes standard markdown, parses it with `marked`, and applies ANSI styling for terminal display: bold headers, colored code blocks, indented blockquotes, box-drawn tables. It handles the CommonMark specification well. But AI responses are not standard markdown. When Claude returns a response with an extended thinking block (`<thinking>Let me analyze this step by step...</thinking>`), `marked-terminal` renders the raw XML tags as literal text -- the user sees `<thinking>` in their terminal instead of a dimmed, collapsible reasoning section. When an AI response contains an `<artifact>` block with a titled code panel, `marked-terminal` renders it as inline XML noise. When the response includes tool use indicators (`<tool_use>`, `<tool_result>`), the user sees raw markup instead of formatted function call and result boxes. When an agent framework streams a response token by token, `marked-terminal` requires the complete markdown string to render -- it cannot incrementally render partial content without re-parsing and re-rendering everything from the beginning.

Other terminal markdown tools have similar limitations. `glow` (a Rust CLI markdown viewer) renders beautiful static markdown but has no API, no streaming support, and no awareness of AI patterns. `mdcat` renders markdown in the terminal with image support but likewise does not handle AI-specific elements. `chalk-markdown` and `cli-markdown` are lightweight alternatives that handle basic formatting but not the structured patterns that AI responses produce. `terminal-kit` provides raw terminal control primitives but is not a markdown renderer. None of these tools understand that AI responses have a predictable structure that deserves dedicated rendering: a thinking section should be visually separated from the answer, a tool call should look like a function invocation, an artifact should appear as a bordered panel with a title bar, and code blocks should be syntax-highlighted in the language the AI specified.

`ai-terminal-md` addresses this gap. It parses markdown with full CommonMark support, detects AI-specific XML patterns within the markdown, and renders each element with appropriate terminal styling. Thinking blocks are rendered as dimmed text with a "Thinking" header, configurable to be shown, hidden, or collapsed. Artifacts are rendered as bordered panels with a title bar showing the artifact type and title. Tool use blocks are rendered as function call boxes showing the tool name and arguments, with tool results in a separate result box. Standard markdown elements -- headers, code blocks, tables, lists, links, blockquotes, horizontal rules -- are all rendered with ANSI styling optimized for terminal readability. Code blocks are syntax-highlighted using a built-in highlighter that supports 15+ languages. The streaming API renders tokens as they arrive, maintaining a state machine that tracks open elements (an unclosed code fence, a growing list, a thinking block mid-stream) and produces incremental terminal output without re-rendering previous content.

The result is that a developer building a CLI chatbot, a terminal-based AI assistant, or a response viewer gets rendered output that matches the semantic structure of AI responses. Instead of raw XML tags and unstyled text, the user sees a polished terminal display where thinking is visually separated from answers, code is highlighted, tool calls are formatted as invocations, and the output streams smoothly as tokens arrive.

---

## 2. Goals and Non-Goals

### Goals

- Provide a `render(markdown, options?)` function that accepts a markdown string containing AI-specific patterns and returns an ANSI-formatted string suitable for terminal display.
- Provide a `createRenderer(config)` factory function that returns a configured `AITerminalRenderer` instance with preset options, avoiding repeated option parsing when rendering multiple responses.
- Render AI-specific elements with dedicated, visually distinct styling:
  - **Thinking blocks** (`<thinking>...</thinking>`): dimmed text with a labeled header, configurable visibility (show, hide, or dim).
  - **Artifact blocks** (`<artifact>...</artifact>`): bordered panel with a title bar showing type and title attributes.
  - **Tool use blocks** (`<tool_use>...</tool_use>`): function call box with tool name, arguments rendered as key-value pairs.
  - **Tool result blocks** (`<tool_result>...</tool_result>`): result box with status and content.
  - **XML semantic wrappers** (`<result>`, `<answer>`, `<output>`): strip the wrapper tags and render the inner content, optionally with a subtle highlight.
  - **Citations** (`[1]`, `[Source: ...]`): colored inline references.
  - **Reasoning steps**: numbered steps with visual hierarchy and indentation.
- Render all standard CommonMark markdown elements with ANSI terminal styling: headers (bold, colored, sized by level), code blocks (background color, syntax highlighting, optional language label and line numbers), inline code (colored background), tables (box-drawing characters, column alignment, auto-sizing), lists (bullet and numbered with proper nesting), links (underlined with optional URL display), bold/italic/strikethrough, blockquotes (left border with dimmed text), horizontal rules (full-width line), and images (placeholder text).
- Provide syntax highlighting for code blocks in 15+ languages: JavaScript, TypeScript, Python, Rust, Go, Java, Ruby, Shell/Bash, SQL, HTML, CSS, JSON, YAML, Markdown, C/C++, and PHP. Support a pluggable highlighter interface for additional languages.
- Provide a streaming rendering API: `renderer.renderStream(stream)` for `AsyncIterable` input and `renderer.renderChunk(chunk, state?)` for manual incremental rendering. The streaming API handles partial markdown elements (unclosed code fences, growing lists, open thinking blocks) without re-rendering previous content.
- Support theme customization: built-in themes (default dark, light, minimal, monochrome) and custom theme definitions with per-element color configuration.
- Adapt to terminal capabilities: detect terminal width for word wrapping, detect color support (no color, 16-color, 256-color, truecolor), detect Unicode support for box-drawing characters (with ASCII fallback), and handle non-TTY output (strip ANSI codes when piping to files or other processes).
- Provide a CLI (`ai-terminal-md`) that reads markdown from stdin or a file and writes rendered output to stdout, enabling shell pipeline integration.
- Keep dependencies minimal: use `marked` for CommonMark parsing (the standard, battle-tested markdown parser) and implement all rendering, highlighting, and AI pattern detection without additional runtime dependencies.
- Target Node.js 18 and above.
- Ship complete TypeScript type definitions for all public APIs.

### Non-Goals

- **Not a full terminal UI framework.** `ai-terminal-md` renders markdown to a styled string. It does not provide interactive widgets, scrollable regions, input handling, or layout management. For terminal UIs, use `ink`, `blessed`, or `terminal-kit`.
- **Not a markdown editor or live preview.** `ai-terminal-md` renders markdown to terminal output. It does not provide editing capabilities, cursor positioning within markdown, or live preview as you type.
- **Not an LLM client.** `ai-terminal-md` does not make API calls to any LLM provider. It renders text that you provide. Bring your own OpenAI, Anthropic, or other client.
- **Not an output normalizer.** `ai-terminal-md` renders AI-specific patterns visually but does not strip, extract, or clean them. For extracting JSON from AI responses, stripping preambles, or repairing malformed output, use `llm-output-normalizer` from this monorepo. The two packages complement each other: `llm-output-normalizer` cleans AI output for programmatic consumption; `ai-terminal-md` renders AI output for human viewing.
- **Not a web markdown renderer.** `ai-terminal-md` produces ANSI escape codes for terminal display. It does not produce HTML, React components, or browser-renderable output. For web rendering, use `marked`, `remark`, or `react-markdown`.
- **Not a general-purpose syntax highlighter.** The built-in highlighter covers common languages with regex-based token matching optimized for terminal display. It is not a full language parser and does not aim for IDE-level accuracy. For comprehensive syntax highlighting, use `cli-highlight` (which wraps highlight.js) or `shiki`.
- **Not a pager or scrollback manager.** `ai-terminal-md` outputs rendered text. It does not manage scrollback buffers, provide pagination for long output, or implement "press space to continue" behavior. For paging, pipe the output through `less -R` (the `-R` flag preserves ANSI colors).

---

## 3. Target Users and Use Cases

### CLI AI Tool Developers

Developers building command-line tools that interact with LLM APIs and display responses in the terminal -- chatbots, code generation tools, question-answering systems, AI assistants. These tools receive markdown-formatted responses from models that include thinking blocks, code in multiple languages, structured reasoning, and tool call results. Without `ai-terminal-md`, they either dump raw markdown (with visible `#` characters, `<thinking>` tags, and unformatted code) or use `marked-terminal` (which handles standard markdown but renders AI-specific elements as literal text). With `ai-terminal-md`, the response is rendered with proper visual hierarchy: thinking is dimmed, code is highlighted, tool calls are boxed, and the answer stands out.

### AI Agent Framework Authors

Developers building agent frameworks (LangChain-style orchestrators, ReAct loops, multi-step planners) that run in the terminal and need to display intermediate reasoning, tool calls, and final answers. The agent's execution trace includes thinking blocks (the model's reasoning), tool use blocks (function calls the model made), tool results (the return values), and the final synthesized answer. `ai-terminal-md` renders each of these with distinct visual treatment, giving the developer and their users a clear view of the agent's execution.

### AI Response Viewer and Debugger Authors

Developers building tools that display saved AI responses for review, debugging, or comparison. Responses stored as raw text (with thinking blocks, artifacts, and tool use markup) need to be rendered for human inspection. `ai-terminal-md` provides the rendering layer that turns stored AI output into readable, formatted terminal display.

### Shell Pipeline Users

Engineers who pipe AI output through terminal tools. `echo "prompt" | llm-call | ai-terminal-md` renders the AI response with full styling in the terminal. When piped to a file (`ai-terminal-md < response.txt > rendered.txt`), ANSI codes are automatically stripped for clean text output.

### AI-Powered Documentation and Tutorial Builders

Developers who generate documentation or tutorials using AI and want to preview the output in the terminal before publishing. AI-generated documentation often contains code blocks in multiple languages, tables, nested lists, and structured sections. `ai-terminal-md` renders all of these with appropriate terminal styling.

---

## 4. Core Concepts

### Renderer

A renderer is a configured instance that converts markdown text to ANSI-formatted terminal strings. It holds configuration for theme, terminal capabilities, AI element visibility, and syntax highlighting preferences. A renderer is created via `createRenderer(config)` or used implicitly through the top-level `render()` function (which uses a default renderer). Reusing a renderer instance across multiple `render()` calls avoids repeated configuration parsing and capability detection.

### AI Markdown Extensions

AI markdown extensions are the non-standard elements that AI responses contain beyond CommonMark. These are the patterns that `marked-terminal` and other generic renderers do not handle:

- **Thinking blocks**: XML-delimited reasoning sections (`<thinking>`, `<antThinking>`, `<reflection>`, `<scratchpad>`) that contain the model's chain-of-thought reasoning. These are semantically distinct from the answer and should be rendered differently.
- **Artifacts**: XML-delimited content panels (`<artifact>`) with metadata attributes (type, title) that represent standalone outputs the model produced.
- **Tool use blocks**: XML-delimited function call representations (`<tool_use>`) with a tool name and structured arguments.
- **Tool result blocks**: XML-delimited function return values (`<tool_result>`) with status and content.
- **Semantic wrappers**: XML tags (`<result>`, `<answer>`, `<output>`, `<response>`) that models use to delimit their "actual" answer from surrounding commentary. The tags are stripped; the content is rendered.
- **Citations**: Inline reference markers (`[1]`, `[2]`, `[Source: URL]`) that models use to cite sources.

### Theme

A theme defines the color and styling assignments for every renderable element. A theme maps element types (heading level 1, code block background, thinking block text, tool use border) to ANSI style codes (foreground color, background color, bold, dim, underline, italic, strikethrough). Built-in themes provide ready-to-use color schemes for common terminal backgrounds (dark and light). Custom themes allow per-element overrides.

### Streaming Rendering

Streaming rendering is the process of producing terminal output incrementally as markdown text arrives token by token from an LLM API. Unlike batch rendering (which receives the complete markdown string and renders it in one pass), streaming rendering must handle incomplete elements: a code fence that has an opening `` ``` `` but no closing fence yet, a list that is still growing, a thinking block that has opened but not closed. The streaming renderer maintains a state machine that tracks which elements are currently open and produces output that can be appended to the terminal without erasing or re-rendering previous content.

### Terminal Capabilities

Terminal capabilities describe what the output terminal supports: color depth (no color, 16 ANSI colors, 256 colors, or 24-bit truecolor), Unicode support (whether box-drawing characters render correctly or need ASCII fallback), terminal width (for word wrapping and table sizing), and TTY status (whether the output is an interactive terminal or a pipe/file). The renderer detects these capabilities at initialization and adapts its output accordingly.

---

## 5. AI-Specific Elements

### 5.1 Thinking Blocks

**What they are**: Thinking blocks are XML-delimited sections that contain the model's internal reasoning process. They appear in responses from models with extended thinking enabled (Anthropic Claude with extended thinking, models fine-tuned with chain-of-thought prompting). The content inside thinking blocks is the model's reasoning steps -- working through a problem, considering alternatives, verifying its own logic -- before producing the final answer.

**Detection patterns**:

| Tag | Source |
|---|---|
| `<thinking>...</thinking>` | Most common; Anthropic Claude extended thinking, generic CoT |
| `<antThinking>...</antThinking>` | Anthropic internal reasoning markup |
| `<reflection>...</reflection>` | Reflection-based reasoning patterns |
| `<scratchpad>...</scratchpad>` | Scratchpad reasoning from fine-tuned models |
| `<reasoning>...</reasoning>` | Generic reasoning wrapper |
| `<inner_monologue>...</inner_monologue>` | Agent framework inner monologue |
| `<thought>...</thought>` | Alternative thinking tag |

Detection uses case-insensitive regex matching for opening tags. Nested content (including other XML elements inside thinking blocks) is handled by matching the outermost opening and closing tag pair. Multiple thinking blocks in a single response are each rendered independently.

**Rendering**:

Thinking blocks are rendered with a labeled header and dimmed body text, visually separated from the surrounding content by blank lines. The rendering uses a "Thinking" label prefix, dim text color for the body, and a subtle left border.

```
  Thinking
  │ Let me analyze this step by step.
  │ First, I need to consider the input format.
  │ The user wants JSON output, so I should structure
  │ my response accordingly.
```

The header ("Thinking") is rendered in dim italic. The body text is rendered in dim color with a left border character (`│`). Each line of the thinking block is indented by two spaces and prefixed with the border character.

**Configuration options**:

| Option | Type | Default | Description |
|---|---|---|---|
| `thinking` | `'show' \| 'hide' \| 'dim'` | `'dim'` | Visibility mode for thinking blocks |

- `'show'`: Render thinking blocks at full brightness, same as regular text but with the header and border.
- `'hide'`: Omit thinking blocks entirely from the output. The block is parsed and skipped.
- `'dim'`: Render thinking blocks with dimmed text. This is the default -- thinking is visible but visually subordinate to the answer.

**Example**:

Input:
```
<thinking>
The user wants a factorial function. I'll use recursion with a base case.
</thinking>

Here's the factorial function:

```python
def factorial(n):
    return 1 if n <= 1 else n * factorial(n - 1)
```
```

Rendered output (with `thinking: 'dim'`):
```
  Thinking
  │ The user wants a factorial function. I'll use recursion with a base case.

Here's the factorial function:

  def factorial(n):                                          python
      return 1 if n <= 1 else n * factorial(n - 1)
```

(The code block would be syntax-highlighted with colors; shown here as plain text for illustration.)

---

### 5.2 Artifact Blocks

**What they are**: Artifacts are XML-delimited content panels that represent standalone outputs produced by the model. They originate from Anthropic Claude's artifact system, where the model produces a titled, typed content block (e.g., a code file, a JSON configuration, an HTML document) as a distinct deliverable. Artifacts have metadata attributes: `type` (MIME type or category), `title` (human-readable name), and optionally `identifier` (unique ID for referencing).

**Detection pattern**: `<artifact` opening tag with optional attributes, followed by content, followed by `</artifact>`. Attributes are extracted from the opening tag: `type="..."`, `title="..."`, `identifier="..."`.

**Rendering**:

Artifacts are rendered as bordered panels with a title bar. The title bar shows the artifact title and type. The content inside the artifact is rendered using standard markdown rendering rules (so an artifact containing a code block gets syntax highlighting).

```
╭─ Deployment Config (application/json) ───────────────────────╮
│ {                                                            │
│   "service": "web-api",                                      │
│   "replicas": 3,                                             │
│   "region": "us-east-1"                                      │
│ }                                                            │
╰──────────────────────────────────────────────────────────────╯
```

The border uses Unicode box-drawing characters (`╭`, `╮`, `╰`, `╯`, `│`, `─`) by default, falling back to ASCII (`+`, `-`, `|`) when Unicode is not supported. The title bar is rendered in bold. The content is indented by two characters inside the border. Content lines are wrapped to fit within the border width, which is determined by the terminal width minus a margin.

**Configuration options**:

| Option | Type | Default | Description |
|---|---|---|---|
| `artifacts` | `'panel' \| 'inline' \| 'hide'` | `'panel'` | How to render artifacts |

- `'panel'`: Full bordered panel with title bar (default).
- `'inline'`: Render the content without borders, with just a title label above it.
- `'hide'`: Omit artifacts entirely.

**Example**:

Input:
```
I've created the configuration:

<artifact type="application/json" title="Server Config">
{
  "port": 8080,
  "host": "0.0.0.0"
}
</artifact>
```

Rendered output:
```
I've created the configuration:

╭─ Server Config (application/json) ───────────────────────────╮
│ {                                                            │
│   "port": 8080,                                              │
│   "host": "0.0.0.0"                                          │
│ }                                                            │
╰──────────────────────────────────────────────────────────────╯
```

---

### 5.3 Tool Use Blocks

**What they are**: Tool use blocks represent function calls made by the model during tool-calling interactions. When an LLM invokes a tool (function calling, MCP tool use), the request contains a tool name and structured arguments. In serialized AI responses (logs, chat history, agent traces), these appear as XML-delimited blocks.

**Detection patterns**:

| Pattern | Content |
|---|---|
| `<tool_use>...</tool_use>` | Contains `<tool_name>` and `<arguments>` or `<parameters>` |
| `<function_call>...</function_call>` | Alternative format with `<name>` and `<arguments>` |
| `<tool_call>...</tool_call>` | Alternative format |

The parser extracts the tool name and arguments from the inner content. Arguments are expected to be JSON or key-value pairs.

**Rendering**:

Tool use blocks are rendered as a function call box with the tool name as a header, followed by the arguments formatted as a key-value list.

```
┌─ Tool Call: search_web ──────────────────────────────────────┐
│  query: "TypeScript generics tutorial"                       │
│  limit: 5                                                    │
│  language: "en"                                              │
└──────────────────────────────────────────────────────────────┘
```

The border uses single-line box-drawing characters (`┌`, `┐`, `└`, `┘`, `│`, `─`). The header shows "Tool Call:" followed by the tool name in bold. Arguments are rendered as indented key-value pairs with the key in a distinct color (cyan by default) and the value in the default text color. JSON object arguments are pretty-printed; primitive arguments are displayed inline.

**Configuration options**:

| Option | Type | Default | Description |
|---|---|---|---|
| `toolUse` | `'box' \| 'inline' \| 'hide'` | `'box'` | How to render tool use blocks |

- `'box'`: Bordered box with tool name header (default).
- `'inline'`: Render as `[Tool: tool_name(arg1, arg2)]` inline text.
- `'hide'`: Omit tool use blocks entirely.

---

### 5.4 Tool Result Blocks

**What they are**: Tool result blocks contain the return value of a tool call. They appear in serialized AI responses paired with the corresponding tool use block.

**Detection patterns**:

| Pattern | Content |
|---|---|
| `<tool_result>...</tool_result>` | Contains the tool's return value |
| `<function_result>...</function_result>` | Alternative format |

**Rendering**:

Tool result blocks are rendered as a result box with a "Result" header and the content inside.

```
┌─ Result ─────────────────────────────────────────────────────┐
│  {                                                           │
│    "results": [                                              │
│      {"title": "TypeScript Generics Guide", "url": "..."},  │
│      {"title": "Advanced Generics", "url": "..."}           │
│    ]                                                         │
│  }                                                           │
└──────────────────────────────────────────────────────────────┘
```

The header uses "Result" in green to indicate success. If the tool result contains an error indicator (a `status` attribute with value `"error"` or content starting with `"Error:"`), the header is rendered in red with "Error" instead of "Result". The content is syntax-highlighted if it appears to be JSON.

**Configuration options**:

| Option | Type | Default | Description |
|---|---|---|---|
| `toolResult` | `'box' \| 'inline' \| 'hide'` | `'box'` | How to render tool result blocks |

---

### 5.5 XML Semantic Wrappers

**What they are**: Semantic wrappers are XML tags that models use to delimit their "actual" output from surrounding commentary. Unlike thinking blocks (which contain reasoning to visually subordinate) and artifacts (which contain standalone content to visually elevate), semantic wrappers are structural noise -- they mark content boundaries but do not carry visual semantics beyond "this is the answer."

**Detection patterns**:

| Tag | Usage |
|---|---|
| `<result>...</result>` | "Here is the result" wrapper |
| `<answer>...</answer>` | "Here is the answer" wrapper |
| `<output>...</output>` | "Here is the output" wrapper |
| `<response>...</response>` | Response wrapper from fine-tuned models |

**Rendering**:

The wrapper tags are stripped. The inner content is rendered normally using standard markdown rendering rules. Optionally, a subtle visual indicator (a thin left border or a brief "Answer:" label) can be shown to mark the boundary of the wrapped content.

**Configuration options**:

| Option | Type | Default | Description |
|---|---|---|---|
| `semanticWrappers` | `'strip' \| 'label' \| 'keep'` | `'strip'` | How to handle semantic wrapper tags |

- `'strip'`: Remove the tags entirely, render inner content normally (default).
- `'label'`: Remove the tags but add a subtle label above the content (e.g., "Answer:").
- `'keep'`: Render the raw tags as literal text (pass-through).

---

### 5.6 Citations

**What they are**: Citations are inline reference markers that models include when citing sources. They typically appear as bracketed numbers (`[1]`, `[2]`) or bracketed descriptive labels (`[Source: URL]`, `[Wikipedia]`).

**Detection patterns**:

| Pattern | Example |
|---|---|
| `\[\d+\]` | `[1]`, `[23]` |
| `\[Source:.*?\]` | `[Source: https://example.com]` |
| `\[\w[\w\s]*\]` following a sentence | `[Wikipedia]`, `[MDN Docs]` |

**Rendering**:

Citations are rendered as colored inline markers. Numeric citations are rendered in superscript-style (if the terminal supports Unicode superscript digits) or as colored bracketed numbers. The citation color is distinct from the surrounding text (blue by default) to make references visually scannable.

```
The algorithm has O(n log n) time complexity [1] and is widely used
in production systems [2].
```

In the rendered output, `[1]` and `[2]` are displayed in blue (or another configured citation color).

**Configuration options**:

| Option | Type | Default | Description |
|---|---|---|---|
| `citations` | `'color' \| 'plain' \| 'hide'` | `'color'` | How to render citations |

---

### 5.7 Reasoning Steps

**What they are**: Reasoning steps are numbered sequences that models produce when working through multi-step problems. They appear as numbered lists with nested content -- sub-steps, code blocks, and explanatory text within each step.

**Detection**: Reasoning steps are detected as numbered lists where each item is substantive (multiple sentences or nested content) and the list represents a logical sequence (steps in a process, phases of analysis). This is a heuristic applied on top of standard numbered list rendering: when a numbered list's items are individually complex (contain multiple paragraphs, code blocks, or sub-lists), the renderer applies enhanced visual hierarchy.

**Rendering**:

Each step is rendered with a step number in bold, followed by the step content with increased indentation. Nested content within each step (code blocks, sub-lists) is indented relative to the step. Steps are separated by a blank line for readability.

```
 1. Parse the input string
    Split the input on newline characters and trim whitespace
    from each line.

 2. Validate the format
    Check that each line matches the expected pattern:

      const pattern = /^\d+:\s+.+$/;

 3. Transform the data
    Map each validated line to a structured object with
    the index and content fields.
```

Step numbers are rendered in bold with a distinct color (yellow by default). The step content is indented to align with the text after the number, not the number itself.

---

## 6. Standard Markdown Rendering

### 6.1 Headers

Headers are rendered with bold text and level-specific colors. Higher-level headers (H1, H2) are more visually prominent than lower-level headers (H5, H6).

| Level | Style | Example Output |
|---|---|---|
| `# H1` | Bold, bright white, full-width underline | **HEADING ONE** followed by `═══════` |
| `## H2` | Bold, bright cyan | **Heading Two** |
| `### H3` | Bold, yellow | **Heading Three** |
| `#### H4` | Bold, green | **Heading Four** |
| `##### H5` | Bold, dim white | **Heading Five** |
| `###### H6` | Bold, dim | **Heading Six** |

H1 headers are followed by a full-width double-line underline (`═`) to provide maximum visual distinction for document titles. H2 headers are followed by a single-line underline (`─`). H3 through H6 have no underline.

Headers are preceded by one blank line and followed by one blank line (unless they are the first element in the output).

### 6.2 Code Blocks

Code blocks are the most visually complex standard element. They are rendered with:

1. **Background**: A subtle background color applied to the entire block (dark gray on dark terminals, light gray on light terminals). This visually separates code from prose.
2. **Syntax highlighting**: If a language tag is present on the code fence (`` ```python ``, `` ```typescript ``), the code is syntax-highlighted using the built-in highlighter. See section 7 for highlighting details.
3. **Language label**: The language name is displayed at the top-right corner of the code block, dimmed.
4. **Line numbers**: Optionally displayed on the left margin, dimmed. Disabled by default; enabled via `codeLineNumbers: true`.
5. **Padding**: One space of horizontal padding on each side. One blank line of vertical padding above and below the code content (inside the background region).

Rendered example (colors described, not shown):
```
                                                          python
  def fibonacci(n):
      if n <= 1:
          return n
      a, b = 0, 1
      for _ in range(2, n + 1):
          a, b = b, a + b
      return b
```

The language label ("python") is right-aligned, dimmed. Keywords (`def`, `if`, `return`, `for`, `in`) are colored per the syntax highlighting theme. Strings, numbers, and operators have distinct colors.

**Code block configuration**:

| Option | Type | Default | Description |
|---|---|---|---|
| `codeBackground` | `boolean` | `true` | Apply background color to code blocks |
| `codeLineNumbers` | `boolean` | `false` | Show line numbers |
| `codeLanguageLabel` | `boolean` | `true` | Show language label |
| `codePadding` | `number` | `1` | Horizontal padding (spaces) inside code blocks |

### 6.3 Inline Code

Inline code is rendered with a distinct background color and a slight contrast from the surrounding text. The background color is a muted tone (dim white on dark terminals) that makes inline code stand out from prose without being as prominent as a full code block.

Example: The function `calculateTotal()` returns an integer.

### 6.4 Tables

Tables are rendered using Unicode box-drawing characters with column alignment and auto-sizing.

```
┌──────────┬───────┬────────────┐
│ Name     │ Age   │ City       │
├──────────┼───────┼────────────┤
│ Alice    │ 30    │ New York   │
│ Bob      │ 25    │ London     │
│ Charlie  │ 35    │ Tokyo      │
└──────────┴───────┴────────────┘
```

**Table rendering details**:

- **Column width**: Auto-calculated from the widest content in each column, up to a maximum width proportional to the terminal width. Content that exceeds the maximum column width is word-wrapped within the cell.
- **Alignment**: Honors markdown alignment syntax (`:---` left, `:---:` center, `---:` right). Default is left-aligned.
- **Header row**: The first row is rendered in bold. The separator between the header and body rows uses `├─┼─┤` characters.
- **Unicode fallback**: When Unicode box-drawing is not supported, falls back to ASCII: `+`, `-`, `|`.
- **Wide tables**: Tables wider than the terminal are not truncated; they overflow the terminal width. This matches the behavior of `glow` and `mdcat`.

**Table configuration**:

| Option | Type | Default | Description |
|---|---|---|---|
| `tableStyle` | `'unicode' \| 'ascii' \| 'none'` | `'unicode'` | Border style for tables |

### 6.5 Lists

**Unordered lists**: Rendered with bullet characters. Nested levels use different bullet styles for visual hierarchy.

| Nesting Level | Bullet | Example |
|---|---|---|
| Level 0 | `●` (or `*` in ASCII mode) | `● First item` |
| Level 1 | `○` (or `-` in ASCII mode) | `  ○ Nested item` |
| Level 2 | `■` (or `+` in ASCII mode) | `    ■ Deeply nested` |
| Level 3+ | `▸` (or `>` in ASCII mode) | `      ▸ Even deeper` |

Each nesting level adds two spaces of indentation.

**Ordered lists**: Rendered with the number followed by a period. Nested ordered lists continue their own numbering sequence.

```
 1. First item
 2. Second item
    a. Sub-item one
    b. Sub-item two
 3. Third item
```

**Task lists**: `- [x]` items are rendered with a check mark (`✓`) in green; `- [ ]` items are rendered with an empty box (`☐`) in dim.

### 6.6 Links

Links are rendered with the link text underlined and the URL displayed in parentheses, dimmed. When the link text and URL are the same (bare URL), the URL is displayed once, underlined.

```
Visit the documentation (https://docs.example.com) for details.
```

**Link configuration**:

| Option | Type | Default | Description |
|---|---|---|---|
| `showLinkUrls` | `boolean` | `true` | Show URLs after link text |

### 6.7 Emphasis and Decoration

| Markdown | Rendering |
|---|---|
| `**bold**` | Bold ANSI (`\x1b[1m`) |
| `*italic*` | Italic ANSI (`\x1b[3m`) -- renders as underline on terminals that do not support italic |
| `~~strikethrough~~` | Strikethrough ANSI (`\x1b[9m`) |
| `**_bold italic_**` | Bold + italic combined |

### 6.8 Blockquotes

Blockquotes are rendered with a left border and dimmed text:

```
  │ This is a blockquote. It may contain multiple
  │ lines of text, and the border extends along the
  │ full height.
  │
  │ Nested blockquotes add additional border characters:
  │ │ This is a nested blockquote.
```

The border character is `│` in a dim color. Each nesting level adds an additional `│` with a space separator. The text content is dimmed relative to the surrounding body text.

### 6.9 Horizontal Rules

Horizontal rules (`---`, `***`, `___`) are rendered as a full-width line using the `─` character (or `-` in ASCII mode), dimmed.

```
────────────────────────────────────────────────────────────────
```

The line spans the full terminal width.

### 6.10 Images

Images cannot be displayed in standard terminals. They are rendered as a placeholder:

```
[Image: alt text description]
```

The placeholder is rendered in dim italic. If the image has no alt text, it renders as `[Image]`.

---

## 7. Syntax Highlighting

### Approach

Code blocks with a language tag are syntax-highlighted using a built-in regex-based tokenizer. The tokenizer recognizes common language constructs -- keywords, strings, numbers, comments, operators, types, and punctuation -- and assigns each token a color from the active theme. This approach is intentionally simpler than full AST-based highlighting (like `shiki` or `tree-sitter`): it covers the common cases that matter for terminal readability without the dependency cost or startup time of a full parser.

### Built-In Language Support

| Language | Fence Tags | Token Categories |
|---|---|---|
| JavaScript | `js`, `javascript` | Keywords, strings, template literals, numbers, comments, regex, operators |
| TypeScript | `ts`, `typescript` | JavaScript tokens + type keywords (`interface`, `type`, `enum`, `as`, `implements`) |
| Python | `python`, `py` | Keywords, strings (single/double/triple-quoted), f-strings, numbers, comments, decorators |
| Rust | `rust`, `rs` | Keywords, strings, lifetime annotations, numbers, comments, macros, attributes |
| Go | `go`, `golang` | Keywords, strings, rune literals, numbers, comments, package names |
| Java | `java` | Keywords, strings, numbers, comments, annotations |
| Ruby | `ruby`, `rb` | Keywords, strings, symbols, numbers, comments, regex, heredocs |
| Shell/Bash | `bash`, `sh`, `shell`, `zsh` | Keywords, strings, variables, comments, command substitution |
| SQL | `sql` | Keywords (SELECT, FROM, WHERE, etc.), strings, numbers, comments, operators |
| HTML | `html`, `htm` | Tags, attributes, attribute values, comments, entities |
| CSS | `css` | Selectors, properties, values, colors, comments, at-rules |
| JSON | `json` | Keys, string values, numbers, booleans, null |
| YAML | `yaml`, `yml` | Keys, string values, numbers, booleans, comments, anchors |
| Markdown | `markdown`, `md` | Headers, bold, italic, code, links, lists |
| C/C++ | `c`, `cpp`, `c++`, `h`, `hpp` | Keywords, strings, numbers, comments, preprocessor directives |
| PHP | `php` | Keywords, strings, variables, numbers, comments |

### Token Color Categories

The highlighter assigns each token to one of these semantic categories, and the theme maps each category to an ANSI color:

| Category | Example Tokens | Default Dark Theme Color |
|---|---|---|
| `keyword` | `function`, `class`, `return`, `if`, `else`, `import` | Magenta |
| `string` | `"hello"`, `'world'`, `` `template` `` | Green |
| `number` | `42`, `3.14`, `0xFF`, `1e10` | Yellow |
| `comment` | `// comment`, `/* block */`, `# comment` | Dim/Gray |
| `operator` | `+`, `-`, `=`, `=>`, `===`, `&&` | Cyan |
| `type` | `string`, `number`, `boolean`, `int`, `void` | Blue |
| `function` | Function names in call position | Bright yellow |
| `variable` | `$var`, `self`, `this` | White (default) |
| `constant` | `true`, `false`, `null`, `undefined`, `None` | Red |
| `punctuation` | `{`, `}`, `(`, `)`, `;`, `,` | Dim white |
| `attribute` | `@decorator`, `#[attr]`, HTML attributes | Cyan |
| `tag` | HTML/XML tag names | Red |
| `property` | Object property names, CSS properties | Cyan |
| `plain` | Unrecognized tokens | Default text color |

### Pluggable Highlighter Interface

Callers can provide a custom highlighter function for languages not covered by the built-in tokenizer or for higher-fidelity highlighting.

```typescript
interface CustomHighlighter {
  /**
   * Returns an array of highlighted tokens for the given code string.
   * Each token has a text and a semantic category.
   */
  highlight(code: string, language: string): HighlightToken[];
}

interface HighlightToken {
  text: string;
  category: TokenCategory;
}

type TokenCategory =
  | 'keyword' | 'string' | 'number' | 'comment' | 'operator'
  | 'type' | 'function' | 'variable' | 'constant' | 'punctuation'
  | 'attribute' | 'tag' | 'property' | 'plain';
```

The custom highlighter is provided via the `highlighter` option on the renderer config. When a custom highlighter is provided, it is called for every code block before falling back to the built-in tokenizer. If the custom highlighter returns an empty array or throws, the built-in tokenizer is used as a fallback.

### Unknown Languages

When a code block has a language tag that is not recognized by either the custom highlighter or the built-in tokenizer, the code is rendered as plain monospace text with the code block background color but no syntax coloring. The language label is still displayed.

---

## 8. Streaming Rendering

### Problem

AI responses are streamed token by token or chunk by chunk via SSE or WebSocket connections. A typical streaming interaction delivers individual words or punctuation marks: `"The"`, `" algorithm"`, `" has"`, `" O"`, `"("`, `"n"`, `")"`, `" time"`. The renderer must produce terminal output incrementally as these tokens arrive. It cannot wait for the complete response because the response may take seconds or minutes, and the user expects to see text appearing in real time.

The challenge is that markdown is not tokenizable at the character level. A `#` character might be the start of a header or a literal hash sign in the middle of a sentence. A `` ` `` character might be the start of an inline code span, the start of a code fence, or a literal backtick. A `<` character might be the start of an HTML tag, an AI-specific XML element, or a less-than operator. The streaming renderer must buffer enough context to make correct decisions about these ambiguities while still producing output as quickly as possible.

### State Machine

The streaming renderer maintains a state machine that tracks which markdown elements are currently open. The state machine has these states:

| State | Description | Entered By | Exited By |
|---|---|---|---|
| `text` | Normal paragraph text | Default / closing any block | Opening any block element |
| `code-fence` | Inside a fenced code block | `` ``` `` or `~~~` on a new line | Matching closing fence |
| `code-inline` | Inside inline code | `` ` `` | Matching closing `` ` `` |
| `thinking` | Inside a thinking block | `<thinking>` (or variant) | `</thinking>` (or variant) |
| `artifact` | Inside an artifact block | `<artifact` | `</artifact>` |
| `tool-use` | Inside a tool use block | `<tool_use>` | `</tool_use>` |
| `tool-result` | Inside a tool result block | `<tool_result>` | `</tool_result>` |
| `heading` | Processing a heading line | `#` at line start | End of line |
| `blockquote` | Inside a blockquote | `>` at line start | Non-`>` line |
| `list` | Inside a list | `- `, `* `, or `1. ` at line start | Double blank line or non-list line at same indent |
| `table` | Inside a table | `|` at line start | Non-`|` line |

### Incremental Output Strategy

The streaming renderer uses a line-based buffering strategy:

1. **Token accumulation**: As tokens arrive, they are appended to a line buffer.
2. **Line detection**: When a newline character (`\n`) is received, the completed line is available for rendering.
3. **Line classification**: The completed line is classified based on the current state and the line's content:
   - If in `text` state and the line starts with `#`: switch to `heading` state, render the header.
   - If in `text` state and the line starts with `` ``` ``: switch to `code-fence` state, begin the code block.
   - If in `text` state and the line starts with `<thinking>`: switch to `thinking` state, render the thinking header.
   - If in `code-fence` state and the line matches the closing fence: exit `code-fence`, render the code block closing.
   - And so on for all state transitions.
4. **Immediate output**: Completed lines that can be definitively classified are rendered and flushed to the output immediately. Text lines in `text` state are rendered with inline formatting (bold, italic, code spans, links) and flushed.
5. **Deferred output**: Lines that are ambiguous (e.g., the first line of what might be a table, which cannot be confirmed until the second line with `|---|` is seen) are buffered until disambiguation.

### Partial Element Handling

| Element | Partial State | Behavior |
|---|---|---|
| Code fence not closed | In `code-fence` state | Accumulate lines, apply highlighting as each line completes. When the closing fence arrives, render the language label. |
| Thinking block not closed | In `thinking` state | Render thinking lines as they arrive, dimmed with border. When closing tag arrives, add trailing blank line. |
| List growing | In `list` state | Render each list item as it completes. Nested items are detected by indentation. |
| Table in progress | In `table` state | Buffer until the header separator row (`|---|`) is seen, then render the table header and subsequent rows. |
| Inline code not closed | In `code-inline` state | Buffer until the closing backtick or end of line. If end of line with no closing backtick, render the buffered text with inline code styling. |
| Bold/italic not closed | Tracked as inline state | Render with styling applied; if never closed, the styling extends to end of block. |

### Cursor Management

The streaming renderer operates in append-only mode: it writes new content to the terminal without moving the cursor back to modify previously written content. This is essential for streaming because the output is being displayed in real time -- the user is reading the top of the response while the bottom is still being generated.

The only exception is the code block language label. When a code fence is opened (`` ```python ``), the language label ("python") would ideally appear at the top-right of the code block. But in streaming mode, the top of the code block has already been written by the time the content is complete. There are two strategies:

1. **Eager label**: Render the language label on the fence-opening line, before the code content. This is the default in streaming mode.
2. **Deferred label**: Skip the label during streaming and render it at the end. This requires cursor movement and is only used in non-streaming mode.

### API

```typescript
/**
 * Render a stream of markdown chunks incrementally.
 * Returns an async iterable of ANSI-formatted output strings.
 */
renderer.renderStream(
  stream: AsyncIterable<string>,
): AsyncIterable<string>;

/**
 * Render a single chunk of markdown incrementally.
 * Returns the rendered output and the updated state.
 * The caller must pass the returned state back on the next call.
 */
renderer.renderChunk(
  chunk: string,
  state?: StreamState,
): { output: string; state: StreamState };
```

The `renderStream` method is the high-level API: pass in an async iterable of string chunks (e.g., from an LLM streaming API), and receive an async iterable of rendered ANSI strings that can be written to the terminal.

The `renderChunk` method is the low-level API: pass in a single chunk and the previous state, receive the rendered output and the new state. This gives the caller full control over the rendering loop.

`StreamState` is an opaque object that the caller should not inspect or modify. It contains the state machine's current state, the line buffer, pending inline formatting state, and any deferred content waiting for disambiguation.

```typescript
interface StreamState {
  /** Opaque internal state. Do not modify. */
  readonly _internal: unknown;
}
```

---

## 9. API Surface

### Installation

```bash
npm install ai-terminal-md
```

### Core Exports

```typescript
import {
  render,
  createRenderer,
} from 'ai-terminal-md';
```

### `render(markdown, options?)`

Top-level function that renders a complete markdown string to an ANSI-formatted terminal string. Uses a default renderer with the provided options.

```typescript
function render(markdown: string, options?: RenderOptions): string;
```

**Example**:

```typescript
import { render } from 'ai-terminal-md';

const output = render(`
# Hello World

This is **bold** and *italic*.

\`\`\`javascript
console.log("Hello!");
\`\`\`
`);

process.stdout.write(output);
```

### `createRenderer(config?)`

Factory function that creates a configured `AITerminalRenderer` instance.

```typescript
function createRenderer(config?: RendererConfig): AITerminalRenderer;
```

**Example**:

```typescript
import { createRenderer } from 'ai-terminal-md';

const renderer = createRenderer({
  theme: 'light',
  thinking: 'hide',
  codeLineNumbers: true,
  width: 100,
});

const output1 = renderer.render(markdown1);
const output2 = renderer.render(markdown2);
```

### `AITerminalRenderer` Interface

```typescript
interface AITerminalRenderer {
  /**
   * Render a complete markdown string to an ANSI-formatted string.
   *
   * @param markdown - The markdown string to render. May contain
   *   AI-specific elements (thinking blocks, artifacts, tool use).
   * @returns ANSI-formatted string ready for terminal output.
   */
  render(markdown: string): string;

  /**
   * Render a stream of markdown chunks incrementally.
   * Returns an async iterable of ANSI-formatted output strings.
   *
   * @param stream - An async iterable of markdown text chunks
   *   (e.g., from an LLM streaming API).
   * @returns An async iterable of rendered ANSI strings.
   */
  renderStream(stream: AsyncIterable<string>): AsyncIterable<string>;

  /**
   * Render a single chunk of markdown incrementally.
   * Returns the rendered output and the updated state.
   *
   * @param chunk - A markdown text chunk.
   * @param state - The state from the previous renderChunk call.
   *   Pass undefined for the first chunk.
   * @returns The rendered output and the new state.
   */
  renderChunk(
    chunk: string,
    state?: StreamState,
  ): { output: string; state: StreamState };

  /**
   * Flush any buffered content from a streaming session.
   * Call this when the stream ends to render any remaining
   * buffered content (e.g., an unclosed code block).
   *
   * @param state - The final state from the last renderChunk call.
   * @returns The rendered remaining content.
   */
  flush(state: StreamState): string;

  /**
   * The current renderer configuration.
   * Read-only.
   */
  readonly config: Readonly<RendererConfig>;
}
```

### Configuration Types

```typescript
interface RendererConfig {
  // ── Theme ────────────────────────────────────────────────────

  /**
   * Color theme. A built-in theme name or a custom theme object.
   * Default: 'dark'.
   */
  theme?: ThemeName | Theme;

  // ── Terminal ─────────────────────────────────────────────────

  /**
   * Terminal width in columns. Used for word wrapping, table sizing,
   * and horizontal rule width.
   * Default: auto-detected from process.stdout.columns, or 80.
   */
  width?: number;

  /**
   * Color support level. Determines which ANSI color codes are used.
   * Default: auto-detected from terminal capabilities.
   */
  colorLevel?: 'none' | '16' | '256' | 'truecolor';

  /**
   * Whether to use Unicode characters for borders, bullets, and
   * decorative elements. When false, uses ASCII fallback characters.
   * Default: auto-detected from terminal capabilities.
   */
  unicode?: boolean;

  // ── AI Elements ──────────────────────────────────────────────

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

  // ── Code Blocks ──────────────────────────────────────────────

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
   * Custom syntax highlighter. Called for every code block.
   * Falls back to built-in highlighter if not provided or
   * if the custom highlighter returns an empty array.
   */
  highlighter?: CustomHighlighter;

  // ── Standard Elements ────────────────────────────────────────

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

  // ── Word Wrapping ────────────────────────────────────────────

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

type ThemeName = 'dark' | 'light' | 'minimal' | 'monochrome';

/** Rendering options for the top-level render() function. */
interface RenderOptions extends RendererConfig {
  // RenderOptions is identical to RendererConfig.
  // It exists as a separate type for API clarity:
  // render() accepts RenderOptions; createRenderer() accepts RendererConfig.
}
```

### Stream State Type

```typescript
interface StreamState {
  /** Opaque internal state. Do not modify. */
  readonly _internal: unknown;
}
```

---

## 10. Themes

### Built-In Themes

**`dark`** (default): Optimized for dark terminal backgrounds (black or dark gray). Uses bright colors for headers and syntax highlighting, dim colors for borders and secondary elements, and standard white for body text.

**`light`**: Optimized for light terminal backgrounds (white or light gray). Uses darker colors for headers and syntax highlighting, avoids colors that are hard to read on white backgrounds (yellow, bright white), and uses standard black for body text.

**`minimal`**: Reduced color usage. Uses only bold, dim, and underline ANSI attributes. No foreground color changes for body text. Code blocks use background color but no syntax highlighting. Suitable for terminals with limited color support or users who prefer minimal visual distraction.

**`monochrome`**: No colors at all. Uses only bold, dim, underline, italic, and strikethrough ANSI attributes. All elements are distinguished by text decoration rather than color. Suitable for non-color terminals, piped output, or accessibility scenarios where color conveys no information.

### Theme Structure

```typescript
interface Theme {
  // ── Headers ────────────────────────────────────────────────
  heading1: Style;
  heading2: Style;
  heading3: Style;
  heading4: Style;
  heading5: Style;
  heading6: Style;
  headingUnderline: Style;

  // ── Text ───────────────────────────────────────────────────
  body: Style;
  bold: Style;
  italic: Style;
  strikethrough: Style;
  link: Style;
  linkUrl: Style;

  // ── Code ───────────────────────────────────────────────────
  codeBackground: Style;
  codeLanguageLabel: Style;
  codeLineNumber: Style;
  inlineCode: Style;

  // ── Syntax Highlighting ────────────────────────────────────
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

  // ── Blocks ─────────────────────────────────────────────────
  blockquoteBorder: Style;
  blockquoteText: Style;
  horizontalRule: Style;
  listBullet: Style;
  listNumber: Style;
  tableBorder: Style;
  tableHeader: Style;

  // ── AI Elements ────────────────────────────────────────────
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

interface Style {
  /** Foreground color. ANSI color name, 256-color index, or hex RGB. */
  fg?: string;

  /** Background color. ANSI color name, 256-color index, or hex RGB. */
  bg?: string;

  /** Bold text. */
  bold?: boolean;

  /** Dim text. */
  dim?: boolean;

  /** Italic text (renders as underline on terminals without italic support). */
  italic?: boolean;

  /** Underlined text. */
  underline?: boolean;

  /** Strikethrough text. */
  strikethrough?: boolean;
}
```

### Custom Themes

Callers can provide a partial theme object that overrides specific elements from a base theme:

```typescript
const renderer = createRenderer({
  theme: {
    // Start with the dark theme as a base (implicit default)
    heading1: { fg: 'brightRed', bold: true },
    syntaxKeyword: { fg: '#FF6B6B' },  // truecolor hex
    thinkingText: { dim: true, italic: true },
  },
});
```

When a partial theme is provided, unspecified elements use the `dark` theme's defaults. To base a custom theme on a different built-in theme, use the `baseTheme` option:

```typescript
const renderer = createRenderer({
  theme: {
    baseTheme: 'light',
    heading1: { fg: 'blue', bold: true },
  },
});
```

### Theme Auto-Detection

When no theme is specified, the renderer attempts to detect the terminal's background color to choose between `dark` and `light` themes. Detection methods:

1. `COLORFGBG` environment variable (set by some terminals, e.g., rxvt, xterm): if the background value is >= 8, assume light; otherwise dark.
2. `TERM_PROGRAM` environment variable: known light-default terminals (none common currently).
3. Default: `dark` (the majority of developer terminals use dark backgrounds).

---

## 11. Terminal Adaptation

### Width Detection and Word Wrapping

Terminal width is detected from `process.stdout.columns` (or the configured `width` option). Text is word-wrapped to fit within this width. Word wrapping respects:

- **Block indentation**: Blockquotes, list items, and nested elements have indentation. The available width for text is the terminal width minus the indentation.
- **Code blocks**: Code is never word-wrapped. Lines that exceed the terminal width overflow (matching the behavior of `cat` and `less`). This preserves code formatting.
- **Tables**: Table cell content is wrapped within the cell's allocated width.
- **AI elements**: Content inside bordered panels (artifacts, tool use) is wrapped to fit within the panel width (terminal width minus border characters and padding).

If `process.stdout.columns` is undefined (not a TTY), the default width is 80.

### Color Support Detection

Color support is detected in this priority order:

1. `config.colorLevel` explicitly set: use that value.
2. `FORCE_COLOR` environment variable: `0` disables color, `1` enables 16-color, `2` enables 256-color, `3` enables truecolor.
3. `NO_COLOR` environment variable set (any value): disable color (per `no-color.org` convention).
4. `COLORTERM` environment variable: `truecolor` or `24bit` enables truecolor.
5. `TERM` environment variable contains `256color`: enable 256-color.
6. `stdout.isTTY` is true: enable 16-color.
7. Otherwise: no color.

When color is disabled, all ANSI color escape codes are omitted. Bold, dim, underline, italic, and strikethrough attributes are still applied (they do not require color support).

### Unicode Support Detection

Unicode box-drawing character support is detected by checking:

1. `config.unicode` explicitly set: use that value.
2. `LANG`, `LC_ALL`, or `LC_CTYPE` environment variable contains `UTF-8` or `utf8`: enable Unicode.
3. `TERM` environment variable is `xterm-256color` or similar modern terminal: enable Unicode.
4. `process.platform` is `'win32'` and `process.env.WT_SESSION` is set (Windows Terminal): enable Unicode.
5. Default: enable Unicode (most modern terminals support it).

When Unicode is disabled, box-drawing characters fall back to ASCII:

| Unicode | ASCII Fallback |
|---|---|
| `─` | `-` |
| `│` | `\|` |
| `┌` `┐` `└` `┘` | `+` |
| `├` `┤` `┬` `┴` `┼` | `+` |
| `╭` `╮` `╰` `╯` | `+` |
| `═` | `=` |
| `●` | `*` |
| `○` | `-` |
| `■` | `+` |
| `▸` | `>` |
| `✓` | `[x]` |
| `☐` | `[ ]` |

### Non-TTY Mode

When `stdout.isTTY` is false (output is piped to a file or another process), the renderer:

- Strips all ANSI escape codes from the output (no colors, no bold, no dim).
- Preserves structural formatting: indentation, line breaks, borders (using ASCII characters).
- This produces clean, readable plain text suitable for file output or further processing.

Non-TTY mode is automatically detected. It can be forced by setting `colorLevel: 'none'` in the config.

---

## 12. Configuration

### All Options with Defaults

```typescript
const defaults: RendererConfig = {
  // Theme
  theme: 'dark',                    // auto-detected between dark/light

  // Terminal
  width: undefined,                 // auto-detected from process.stdout.columns
  colorLevel: undefined,            // auto-detected from environment
  unicode: undefined,               // auto-detected from environment

  // AI Elements
  thinking: 'dim',                  // show thinking blocks dimmed
  artifacts: 'panel',               // bordered panel with title bar
  toolUse: 'box',                   // bordered box with tool name
  toolResult: 'box',                // bordered box with result
  semanticWrappers: 'strip',        // strip wrapper tags
  citations: 'color',               // colored inline markers

  // Code Blocks
  codeBackground: true,             // apply background to code blocks
  codeLineNumbers: false,           // no line numbers
  codeLanguageLabel: true,          // show language label
  codePadding: 1,                   // 1 space horizontal padding
  highlighter: undefined,           // use built-in highlighter

  // Standard Elements
  tableStyle: 'unicode',            // Unicode box-drawing borders
  showLinkUrls: true,               // show URLs after link text

  // Word Wrapping
  wordWrap: true,                   // wrap text to terminal width
  margin: 0,                        // no left margin
};
```

### Environment Variables

| Variable | Purpose | Values |
|---|---|---|
| `NO_COLOR` | Disable all ANSI colors | Any value (standard convention) |
| `FORCE_COLOR` | Force color output | `0` (disable), `1` (16-color), `2` (256-color), `3` (truecolor) |
| `COLORTERM` | Terminal color capability | `truecolor`, `24bit` |
| `AI_TERMINAL_MD_THEME` | Override default theme | `dark`, `light`, `minimal`, `monochrome` |
| `AI_TERMINAL_MD_THINKING` | Override thinking block visibility | `show`, `hide`, `dim` |
| `AI_TERMINAL_MD_WIDTH` | Override terminal width | Integer (e.g., `120`) |

Environment variables take lower priority than explicit config options. They provide a way for users to set preferences globally without modifying application code.

---

## 13. CLI

### Installation and Invocation

```bash
# Global install
npm install -g ai-terminal-md
ai-terminal-md < response.md

# npx (no install)
npx ai-terminal-md < response.md

# Pipe LLM output
llm-call "explain quicksort" | ai-terminal-md
```

### CLI Binary Name

`ai-terminal-md`

### Commands and Flags

```
ai-terminal-md [options] [file]

Input:
  [file]                   Read from file instead of stdin.
                           If omitted, reads from stdin.

Theme options:
  --theme <name>           Color theme: dark, light, minimal, monochrome.
                           Default: auto-detected.

AI element options:
  --thinking <mode>        Thinking block visibility: show, hide, dim.
                           Default: dim.
  --artifacts <mode>       Artifact rendering: panel, inline, hide.
                           Default: panel.
  --tool-use <mode>        Tool use rendering: box, inline, hide.
                           Default: box.

Code options:
  --line-numbers           Show line numbers in code blocks.
  --no-highlight           Disable syntax highlighting.
  --no-background          Disable code block background.

Layout options:
  --width <n>              Terminal width override. Default: auto-detected.
  --margin <n>             Left margin in spaces. Default: 0.
  --no-wrap                Disable word wrapping.

Output options:
  --no-color               Disable ANSI colors (same as NO_COLOR=1).
  --ascii                  Use ASCII characters instead of Unicode.

General:
  --version                Print version and exit.
  --help                   Print help and exit.
```

### Exit Codes

| Code | Meaning |
|---|---|
| `0` | Success. Input was rendered to stdout. |
| `1` | Read error. Input file not found or stdin read failure. |
| `2` | Configuration error. Invalid flag value. |

### Usage Examples

```bash
# Render a saved AI response
ai-terminal-md response.md

# Pipe through pager for long output
ai-terminal-md response.md | less -R

# Render with thinking blocks hidden
ai-terminal-md --thinking hide response.md

# Render for light terminal
ai-terminal-md --theme light < response.md

# Render in a CI environment (ASCII, no color)
ai-terminal-md --ascii --no-color < response.md

# Live render streamed LLM output
llm-stream "write a Python web server" | ai-terminal-md

# Render and save as plain text (non-TTY strips ANSI)
ai-terminal-md response.md > rendered.txt
```

---

## 14. Integration

### Integration with ai-spinner

`ai-spinner` provides real-time progress indicators during LLM operations (token counts, TPS, cost). `ai-terminal-md` renders the completed response. The two packages are used in sequence: `ai-spinner` shows progress while the response is being generated; `ai-terminal-md` renders the response after generation is complete.

```typescript
import { createSpinner } from 'ai-spinner';
import { render } from 'ai-terminal-md';
import Anthropic from '@anthropic-ai/sdk';

const spinner = createSpinner({ model: 'claude-sonnet-4-20250514' });
const client = new Anthropic();

spinner.start('Generating response...');

const stream = await client.messages.stream({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4096,
  messages: [{ role: 'user', content: 'Explain monads in Haskell' }],
});

const instrumented = spinner.wrapStream(stream);

let responseText = '';
for await (const event of instrumented) {
  if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
    responseText += event.delta.text;
  }
}

spinner.succeed('Response generated');

// Render the complete response with AI-aware markdown rendering
console.log(render(responseText));
```

For streaming display (showing the response as it generates instead of waiting for completion), combine `ai-spinner` for the waiting phase and `ai-terminal-md`'s streaming renderer for the display phase:

```typescript
import { createSpinner } from 'ai-spinner';
import { createRenderer } from 'ai-terminal-md';

const spinner = createSpinner({ model: 'gpt-4o' });
const renderer = createRenderer({ thinking: 'dim' });

spinner.start('Waiting for response...');

const stream = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages,
  stream: true,
});

let firstChunk = true;
for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    if (firstChunk) {
      spinner.stop();  // Clear the spinner before rendering
      firstChunk = false;
    }
    // Stream-render each chunk
    // (using renderStream would be cleaner; shown with renderChunk for illustration)
  }
}
```

### Integration with llm-output-normalizer

`llm-output-normalizer` cleans AI output for programmatic consumption (extracting JSON, stripping preambles, repairing malformed data). `ai-terminal-md` renders AI output for human viewing. They serve different purposes but can be used together when both display and extraction are needed:

```typescript
import { normalize } from 'llm-output-normalizer';
import { render } from 'ai-terminal-md';

const rawOutput = await callLLM('Generate a user profile as JSON');

// For display: render the full response with all AI elements visible
console.log(render(rawOutput));

// For programmatic use: extract the JSON
const { json } = normalize(rawOutput, { mode: 'json' });
await saveToDatabase(json);
```

### Integration with stream-tokens

`stream-tokens` (if present in the monorepo) provides LLM streaming utilities. `ai-terminal-md`'s `renderStream` can consume any `AsyncIterable<string>`, making it compatible with any streaming source:

```typescript
import { createRenderer } from 'ai-terminal-md';

const renderer = createRenderer();

// Any async iterable of string chunks works
const rendered = renderer.renderStream(llmStream);

for await (const output of rendered) {
  process.stdout.write(output);
}
```

---

## 15. Testing Strategy

### Unit Tests

**Markdown rendering tests**:
- Each standard markdown element has a test that provides input markdown and asserts the rendered output contains the expected ANSI-formatted text.
- `# Heading` renders with bold and the configured heading color.
- `**bold**` renders with `\x1b[1m` bold attribute.
- `*italic*` renders with `\x1b[3m` italic attribute.
- `` `inline code` `` renders with the inline code background.
- Code blocks with language tags render with syntax highlighting applied.
- Tables render with box-drawing characters, correct column widths, and alignment.
- Lists render with correct bullets, numbering, and indentation per nesting level.
- Links render with underlined text and URL in parentheses.
- Blockquotes render with left border and dimmed text.
- Horizontal rules render as full-width lines.

**AI element rendering tests**:
- `<thinking>content</thinking>` renders with dimmed text, border, and "Thinking" header when `thinking: 'dim'`.
- `<thinking>content</thinking>` is omitted when `thinking: 'hide'`.
- `<thinking>content</thinking>` renders at full brightness when `thinking: 'show'`.
- `<artifact type="..." title="...">content</artifact>` renders as bordered panel with title bar.
- `<tool_use>` with tool name and arguments renders as function call box.
- `<tool_result>` renders as result box with green header for success, red for error.
- `<result>content</result>` strips the tags when `semanticWrappers: 'strip'`.
- `[1]` and `[2]` render in citation color when `citations: 'color'`.
- All thinking tag variants (`<antThinking>`, `<reflection>`, `<scratchpad>`, etc.) are detected and rendered correctly.

**Syntax highlighting tests**:
- JavaScript code block: `function`, `const`, `return` are highlighted as keywords; strings and numbers get their respective colors.
- Python code block: `def`, `class`, `import` are keywords; triple-quoted strings are highlighted correctly.
- JSON code block: keys and string values have distinct colors.
- Unknown language: code is rendered as plain monospace text with background but no syntax coloring.
- Custom highlighter: when provided, the custom highlighter's output is used; fallback to built-in when custom returns empty.

**Theme tests**:
- `dark` theme: heading1 uses bright white, code keywords use magenta.
- `light` theme: heading1 uses dark blue, body text uses black.
- `monochrome` theme: no color codes in output; only bold/dim/underline attributes.
- Custom theme: specified overrides are applied; unspecified elements use the base theme.

**Terminal adaptation tests**:
- Width 40: text wraps at 40 characters.
- Width 120: text wraps at 120 characters.
- `colorLevel: 'none'`: no ANSI color codes in output.
- `unicode: false`: box-drawing characters are replaced with ASCII equivalents.
- Non-TTY output: ANSI codes are stripped.

**Configuration tests**:
- Each config option changes the rendered output as documented.
- Environment variables override defaults when config options are not set.
- Explicit config options override environment variables.

### Streaming Tests

**Incremental rendering tests**:
- Feed a complete paragraph character by character. Verify the concatenated output matches the batch-rendered output.
- Feed a code block token by token (`` ` ``, `` ` ``, `` ` ``, `p`, `y`, `t`, `h`, `o`, `n`, `\n`, `d`, `e`, `f`, ...). Verify the code block is rendered with syntax highlighting.
- Feed a thinking block incrementally. Verify the thinking header appears when the opening tag is complete, thinking content renders dimmed, and the block closes correctly.
- Feed a markdown response with mixed elements (heading, paragraph, code block, thinking block, list). Verify the streaming output is semantically equivalent to batch rendering.

**Partial element tests**:
- Open a code fence without closing it. Call `flush()`. Verify the unclosed code block content is rendered.
- Open a thinking block without closing it. Call `flush()`. Verify the thinking content is rendered with a note about truncation.
- Start a list that keeps growing. Verify each new list item is rendered as it arrives.

**State machine tests**:
- Verify state transitions: `text` -> `code-fence` on `` ``` ``, `code-fence` -> `text` on closing `` ``` ``.
- Verify state transitions: `text` -> `thinking` on `<thinking>`, `thinking` -> `text` on `</thinking>`.
- Verify that inline formatting state (bold, italic) is tracked correctly across chunks.

### CLI Tests

- `echo "# Hello" | ai-terminal-md`: output contains bold "Hello" (or equivalent ANSI).
- `ai-terminal-md test-file.md`: reads file, produces rendered output.
- `ai-terminal-md --theme monochrome`: no color codes in output.
- `ai-terminal-md --thinking hide`: thinking blocks are not present in output.
- `ai-terminal-md --line-numbers`: code blocks have line numbers.
- `ai-terminal-md --no-color`: no ANSI escape codes in output.
- `ai-terminal-md nonexistent.md`: exit code 1.
- `ai-terminal-md --invalid-flag`: exit code 2.

### Test Framework

Tests use Vitest, matching the project configuration. The output stream is captured as a string for assertion. ANSI escape codes in test assertions are matched using helper functions that check for the presence of specific codes rather than exact byte sequences (to avoid brittle tests that break when colors are tweaked).

Helper utilities:
- `stripAnsi(str)`: removes all ANSI escape codes, returning plain text. Used to verify textual content independent of styling.
- `hasAnsiCode(str, code)`: checks whether a specific ANSI code is present. Used to verify that bold, dim, colors, etc. are applied.
- `renderAndStrip(markdown, options)`: convenience function that renders and strips, returning plain text.

---

## 16. Performance

### Batch Rendering

The rendering pipeline for a complete markdown string:

1. **Parse**: Parse the markdown with `marked`. This produces an AST of tokens.
2. **Pre-process**: Scan for AI-specific XML elements and extract them from the token stream, replacing them with structured representations.
3. **Render**: Walk the token tree and produce ANSI-formatted output for each token.
4. **Highlight**: For code blocks, apply syntax highlighting.
5. **Wrap**: Apply word wrapping to text blocks.

Target performance:

| Input Size | Content | Expected Time |
|---|---|---|
| 500 bytes | Short paragraph with heading | < 0.5ms |
| 5KB | Multi-section response with code | < 2ms |
| 20KB | Long response with multiple code blocks, tables, thinking | < 10ms |
| 100KB | Very long response (stress test) | < 50ms |

### Streaming Rendering

Streaming rendering overhead per chunk:

- **Line buffer append**: O(1) string concatenation.
- **Line classification**: O(n) where n is the line length. One regex check per line.
- **State machine transition**: O(1) lookup.
- **Render one line**: O(n) for ANSI formatting and word wrapping.

Total per-chunk overhead: under 0.1ms for typical chunks (5-50 characters). For a stream delivering 50 tokens per second, the total rendering overhead is under 5ms per second -- imperceptible.

### Syntax Highlighting

The built-in regex-based highlighter processes code line by line. Each line is matched against the language's token patterns in a single pass. Highlighting a 50-line code block takes under 1ms. For very long code blocks (500+ lines), highlighting may take up to 10ms.

### Memory

The renderer maintains:
- Parsed theme: ~2KB of style objects.
- Streaming state: ~1KB for the state machine and line buffer.
- No growing memory: rendered output is flushed immediately, not accumulated.

Total memory per renderer instance: under 5KB. Memory does not grow during streaming.

---

## 17. Dependencies

### Runtime Dependencies

| Dependency | Purpose | Why |
|---|---|---|
| `marked` | CommonMark markdown parsing | `marked` is the most widely used markdown parser in the npm ecosystem, with battle-tested CommonMark compliance and an extensible renderer API. Re-implementing markdown parsing would be thousands of lines of code with inevitable spec compliance gaps. |

### Why Not marked-terminal

`marked-terminal` is a `marked` renderer that produces ANSI-formatted output. `ai-terminal-md` could theoretically extend `marked-terminal` instead of writing its own renderer. It does not, for these reasons:

1. `marked-terminal` depends on `chalk` (for color), `cli-table3` (for tables), `cli-highlight` (for syntax highlighting via highlight.js), and `node-emoji`. These transitive dependencies add significant install size and startup time. `ai-terminal-md` generates ANSI codes directly and uses a lightweight built-in highlighter.
2. `marked-terminal`'s renderer is not designed for extension. Adding AI-specific element handling would require monkey-patching internal rendering methods, which is fragile across version updates.
3. `marked-terminal` does not support streaming rendering. Its architecture assumes a complete markdown string as input.

### Why marked Instead of Zero Dependencies

Markdown parsing is a complex specification (CommonMark is 30+ pages of edge cases). `marked` provides correct parsing for all of CommonMark, including tricky cases like nested list indentation, setext headers, link reference definitions, and lazy continuation lines. Implementing this from scratch would be a multi-thousand-line effort with ongoing maintenance burden for spec compliance. Using `marked` for parsing and implementing only the rendering layer in-house is the right separation of concerns.

### Development Dependencies

| Dependency | Purpose |
|---|---|
| `typescript` | TypeScript compiler |
| `vitest` | Test runner |
| `eslint` | Linter |
| `@types/node` | Node.js type definitions |

### Peer Dependencies

None.

---

## 18. File Structure

```
ai-terminal-md/
  package.json
  tsconfig.json
  SPEC.md
  README.md
  src/
    index.ts                       -- Public API exports: render, createRenderer, types
    renderer.ts                    -- AITerminalRenderer class: orchestrates parsing and rendering
    render-markdown.ts             -- Standard markdown element rendering (headers, code, lists, etc.)
    render-ai.ts                   -- AI-specific element rendering (thinking, artifacts, tool use)
    parser.ts                      -- AI pattern detection and extraction from markdown AST
    highlighter.ts                 -- Built-in syntax highlighter: regex tokenizer, language definitions
    streaming.ts                   -- Streaming renderer: state machine, chunk processing, line buffering
    theme.ts                       -- Theme definitions, theme loading, style application
    terminal.ts                    -- Terminal capability detection: color, Unicode, width, TTY
    ansi.ts                        -- ANSI escape code generation: colors, attributes, cursor
    wrap.ts                        -- Word wrapping: line breaking, indentation preservation
    types.ts                       -- All TypeScript type definitions and interfaces
    languages/
      index.ts                     -- Language registry: tag-to-tokenizer mapping
      javascript.ts                -- JavaScript/TypeScript token patterns
      python.ts                    -- Python token patterns
      rust.ts                      -- Rust token patterns
      go.ts                        -- Go token patterns
      java.ts                      -- Java token patterns
      ruby.ts                      -- Ruby token patterns
      shell.ts                     -- Shell/Bash token patterns
      sql.ts                       -- SQL token patterns
      web.ts                       -- HTML/CSS token patterns
      data.ts                      -- JSON/YAML token patterns
      c.ts                         -- C/C++ token patterns
      php.ts                       -- PHP token patterns
      markdown.ts                  -- Markdown token patterns (for nested markdown highlighting)
    cli.ts                         -- CLI entry point: flag parsing, stdin/file reading, rendering
    __tests__/
      render.test.ts               -- Batch rendering tests for standard markdown
      render-ai.test.ts            -- AI-specific element rendering tests
      highlighter.test.ts          -- Syntax highlighting tests per language
      streaming.test.ts            -- Streaming renderer tests
      theme.test.ts                -- Theme application and custom theme tests
      terminal.test.ts             -- Terminal capability detection tests
      wrap.test.ts                 -- Word wrapping tests
      cli.test.ts                  -- CLI integration tests
      fixtures/
        markdown.ts                -- Standard markdown test fixtures
        ai-elements.ts             -- AI-specific element test fixtures
        code-blocks.ts             -- Code block and highlighting test fixtures
        streaming.ts               -- Streaming test fixtures (chunked input sequences)
  dist/                            -- Compiled output (generated by tsc)
```

---

## 19. Implementation Roadmap

### Phase 1: Core Rendering

Implement the foundation: markdown parsing, standard element rendering, and the basic API.

1. **`types.ts`**: Define all TypeScript interfaces: `RendererConfig`, `RenderOptions`, `Theme`, `Style`, `AITerminalRenderer`, `StreamState`, `CustomHighlighter`, `HighlightToken`, `TokenCategory`.

2. **`ansi.ts`**: Implement ANSI escape code generation. Functions for applying foreground color, background color, bold, dim, italic, underline, strikethrough, and reset. Support 16-color, 256-color, and truecolor output.

3. **`terminal.ts`**: Implement terminal capability detection: color level, Unicode support, terminal width, TTY detection. Export utility functions: `detectColorLevel()`, `detectUnicode()`, `getWidth()`, `isTTY()`.

4. **`theme.ts`**: Implement the four built-in themes (dark, light, minimal, monochrome). Implement theme loading with custom theme merging and base theme inheritance. Implement theme auto-detection.

5. **`wrap.ts`**: Implement word wrapping. Handle indentation preservation, code block exemption, and CJK character width.

6. **`render-markdown.ts`**: Implement rendering for all standard markdown elements: headers, paragraphs, bold, italic, strikethrough, inline code, code blocks (without highlighting), blockquotes, lists, links, tables, horizontal rules, images. Use `marked` for parsing and the `Renderer` API for output.

7. **`renderer.ts`**: Implement the `AITerminalRenderer` class. Wire up `marked` parsing, markdown rendering, theme application, and terminal adaptation. Implement the `render(markdown)` method.

8. **`index.ts`**: Export `render`, `createRenderer`, and all public types.

Milestone: `render(markdown)` works for standard CommonMark. Headers are colored, code blocks have backgrounds, tables have borders, lists have bullets. `npm run test`, `npm run lint`, and `npm run build` all pass.

### Phase 2: Syntax Highlighting

9. **`highlighter.ts`**: Implement the regex-based tokenizer framework. Define the `TokenCategory` mapping. Implement the `highlight(code, language)` function that dispatches to language-specific tokenizers.

10. **`languages/*.ts`**: Implement token patterns for all 15+ built-in languages. Each file exports a token pattern list for its language.

11. **`render-markdown.ts` update**: Integrate syntax highlighting into code block rendering. When a code block has a language tag, tokenize the code and apply theme colors per token category.

Milestone: Code blocks are syntax-highlighted. `` ```javascript `` blocks show colored keywords, strings, and numbers.

### Phase 3: AI Elements

12. **`parser.ts`**: Implement AI pattern detection. Scan the markdown for thinking blocks, artifacts, tool use blocks, tool result blocks, semantic wrappers, and citations. Extract these elements and produce structured representations for the renderer.

13. **`render-ai.ts`**: Implement rendering for each AI-specific element: thinking blocks (dimmed with header and border), artifacts (bordered panel with title bar), tool use (function call box), tool results (result box), semantic wrappers (strip/label/keep), citations (colored markers).

14. **`renderer.ts` update**: Integrate AI element parsing and rendering into the main render pipeline. AI elements are detected before markdown parsing (since they are XML that `marked` does not understand), extracted, and rendered separately, then spliced back into the output at the correct positions.

Milestone: AI-specific elements are rendered with dedicated styling. Thinking blocks are dimmed, artifacts are paneled, tool calls are boxed.

### Phase 4: Streaming

15. **`streaming.ts`**: Implement the streaming renderer. Build the state machine with all states (text, code-fence, thinking, artifact, tool-use, etc.). Implement `renderChunk()` with line buffering and incremental output. Implement `renderStream()` as a convenience wrapper around `renderChunk()`. Implement `flush()` for stream finalization.

16. **`renderer.ts` update**: Wire streaming methods into the `AITerminalRenderer` interface.

Milestone: `renderer.renderStream(asyncIterable)` produces incremental rendered output. Code blocks are highlighted as they stream. Thinking blocks are dimmed as they stream.

### Phase 5: CLI and Polish

17. **`cli.ts`**: Implement the CLI. Parse flags, read from stdin or file, create a renderer with the configured options, render the input, write to stdout. Handle errors and exit codes.

18. **Edge case handling**: Empty input, very long lines, deeply nested lists, tables with many columns, code blocks with no language tag, mixed AI elements and standard markdown, Unicode edge cases (CJK characters, emoji, combining marks).

19. **Non-TTY optimization**: Verify clean plain text output when piped to files. Verify ANSI stripping is complete.

20. **Performance verification**: Benchmark batch rendering and streaming rendering against target times. Optimize hot paths if needed.

21. **Documentation**: Write the README with quickstart examples, API reference, theme gallery, and CLI usage guide.

Milestone: All phases complete. `npm run test`, `npm run lint`, and `npm run build` all pass. Package is ready for v0.1.0 publication.

---

## 20. Example Use Cases

### Example 1: CLI AI Chatbot

A command-line chatbot that renders AI responses with full styling.

```typescript
import { createRenderer } from 'ai-terminal-md';
import { createSpinner } from 'ai-spinner';
import Anthropic from '@anthropic-ai/sdk';

const renderer = createRenderer({ thinking: 'dim' });
const spinner = createSpinner({ model: 'claude-sonnet-4-20250514' });
const client = new Anthropic();

async function chat(userMessage: string): Promise<void> {
  spinner.start('Thinking...');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    thinking: { type: 'enabled', budget_tokens: 2048 },
    messages: [{ role: 'user', content: userMessage }],
  });

  spinner.succeed('Response generated');

  // The response may contain thinking blocks and markdown
  const text = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n');

  // Render with AI-aware markdown
  console.log(renderer.render(text));
}

await chat('Explain the difference between monads and functors in Haskell');
```

**Terminal output** (colors and styling shown as descriptions):

```
  Thinking
  │ The user wants a comparison between monads and functors.
  │ I should explain the type class hierarchy and the key
  │ difference: monads support sequencing (bind/>>=) while
  │ functors only support mapping (fmap).

━━ Monads vs Functors ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A Functor lets you apply a function to a wrapped value:

                                                        haskell
  class Functor f where
      fmap :: (a -> b) -> f a -> f b

A Monad extends Functor with the ability to chain operations
that themselves produce wrapped values:

                                                        haskell
  class Monad m where
      return :: a -> m a
      (>>=)  :: m a -> (a -> m b) -> m b

The key insight: `>>=` (bind) lets the **next computation
depend on the result of the previous one**, which `fmap` cannot do.
```

### Example 2: Streaming AI Response Display

Display a streaming AI response in real time with proper markdown rendering.

```typescript
import { createRenderer } from 'ai-terminal-md';
import OpenAI from 'openai';

const renderer = createRenderer();
const openai = new OpenAI();

const stream = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Write a Python quicksort implementation' }],
  stream: true,
});

// Convert OpenAI stream to AsyncIterable<string>
async function* textStream() {
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) yield content;
  }
}

// Stream-render with full markdown styling
for await (const rendered of renderer.renderStream(textStream())) {
  process.stdout.write(rendered);
}
```

### Example 3: Agent Trace Viewer

Display an agent's execution trace with tool calls and results.

```typescript
import { render } from 'ai-terminal-md';

// Agent trace stored as a markdown string with AI-specific elements
const agentTrace = `
## Agent Execution

The agent analyzed the query and determined it needs to search the web.

<tool_use>
<tool_name>search_web</tool_name>
<arguments>{"query": "TypeScript 5.0 new features", "limit": 3}</arguments>
</tool_use>

<tool_result>
{"results": [
  {"title": "TypeScript 5.0 Release Notes", "url": "https://devblogs.microsoft.com/typescript/..."},
  {"title": "What's New in TypeScript 5.0", "url": "https://www.totaltypescript.com/..."}
]}
</tool_result>

Based on the search results, here are the key new features in TypeScript 5.0:

1. **Decorators** - Standard ECMAScript decorators are now supported
2. **const Type Parameters** - New \`const\` modifier for type parameters
3. **Enum Improvements** - All enums are now union enums

\`\`\`typescript
// Example: const type parameter
function asConst<const T>(value: T): T {
  return value;
}

const result = asConst([1, 2, 3]);
// type: readonly [1, 2, 3]
\`\`\`
`;

console.log(render(agentTrace));
```

### Example 4: Piping LLM Output Through the CLI

```bash
# Generate a response and render it
echo "Explain TCP/IP in simple terms" | llm-api-call | ai-terminal-md

# Render a saved response with thinking blocks hidden
ai-terminal-md --thinking hide saved-response.md

# Render for a light terminal, with line numbers on code
ai-terminal-md --theme light --line-numbers response.md

# Save rendered plain text (ANSI stripped because stdout is not a TTY)
ai-terminal-md response.md > formatted-response.txt

# Render and page through with less
ai-terminal-md response.md | less -R
```

### Example 5: Custom Theme for Brand Consistency

```typescript
import { createRenderer } from 'ai-terminal-md';

const renderer = createRenderer({
  theme: {
    baseTheme: 'dark',
    heading1: { fg: '#FF6B6B', bold: true },
    heading2: { fg: '#4ECDC4', bold: true },
    syntaxKeyword: { fg: '#C792EA' },
    syntaxString: { fg: '#C3E88D' },
    syntaxFunction: { fg: '#82AAFF' },
    toolUseBorder: { fg: '#F78C6C' },
    artifactBorder: { fg: '#89DDFF' },
    thinkingText: { fg: '#676E95', italic: true },
  },
});

console.log(renderer.render(aiResponse));
```
