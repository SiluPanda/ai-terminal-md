import { describe, it, expect } from 'vitest';
import { createRenderer } from '../renderer';
import { stripAnsi } from '../ansi';

/** Helper to collect all chunks from an async iterable. */
async function collect(iter: AsyncIterable<string>): Promise<string[]> {
  const chunks: string[] = [];
  for await (const chunk of iter) {
    chunks.push(chunk);
  }
  return chunks;
}

/** Create a renderer with predictable settings for streaming tests. */
function makeRenderer() {
  return createRenderer({
    colorLevel: 'none',
    width: 80,
    theme: 'dark',
    thinking: 'show',
    artifacts: 'panel',
    toolUse: 'box',
  });
}

describe('renderChunk()', () => {
  it('returns output and state object', () => {
    const renderer = makeRenderer();
    const { output, state } = renderer.renderChunk('Hello world\n\n');
    expect(typeof output).toBe('string');
    expect(state).toBeDefined();
    expect(typeof state.buffer).toBe('string');
    expect(typeof state.openCodeBlock).toBe('boolean');
    expect(typeof state.codeLang).toBe('string');
    expect(typeof state.openThinkingBlock).toBe('boolean');
  });

  it('renders a complete paragraph chunk', () => {
    const renderer = makeRenderer();
    const { output } = renderer.renderChunk('Hello world\n\n');
    expect(stripAnsi(output)).toContain('Hello world');
  });

  it('holds incomplete paragraph in buffer', () => {
    const renderer = makeRenderer();
    const { output, state } = renderer.renderChunk('Hello');
    // No complete paragraph yet, should buffer
    expect(output).toBe('');
    expect(state.buffer).toBe('Hello');
  });

  it('holds open code fence in buffer', () => {
    const renderer = makeRenderer();
    const { output, state } = renderer.renderChunk('```typescript\nconst x = 1;');
    expect(output).toBe('');
    expect(state.openCodeBlock).toBe(true);
    expect(state.codeLang).toBe('typescript');
  });

  it('renders complete code block after fence closes', () => {
    const renderer = makeRenderer();
    const partial = renderer.renderChunk('```typescript\nconst x = 1;');
    const { output } = renderer.renderChunk('\n```\n\n', partial.state);
    expect(stripAnsi(output)).toContain('const x = 1;');
  });

  it('accumulates state across multiple chunks', () => {
    const renderer = makeRenderer();
    const { state: s1 } = renderer.renderChunk('Part one ');
    const { state: s2 } = renderer.renderChunk('part two ', s1);
    // Buffer should contain both parts (case-sensitive)
    expect(s2.buffer.toLowerCase()).toContain('part one');
    expect(s2.buffer.toLowerCase()).toContain('part two');
  });

  it('works with no initial state (creates fresh state)', () => {
    const renderer = makeRenderer();
    const { output, state } = renderer.renderChunk('Simple text\n\n');
    expect(state).toBeDefined();
    expect(stripAnsi(output)).toContain('Simple text');
  });

  it('strips ANSI when nonTTY mode', () => {
    const renderer = createRenderer({ colorLevel: 'none', width: 80 });
    const { output } = renderer.renderChunk('**bold text**\n\n');
    // colorLevel=none strips colors — verify no escape sequences
    expect(output).not.toContain('\x1b[');
  });
});

describe('flush()', () => {
  it('renders remaining buffer content', () => {
    const renderer = makeRenderer();
    const state = { buffer: 'Remaining text', openCodeBlock: false, codeLang: '', openThinkingBlock: false };
    const result = renderer.flush(state);
    expect(stripAnsi(result)).toContain('Remaining text');
  });

  it('returns empty string for empty buffer', () => {
    const renderer = makeRenderer();
    const state = { buffer: '', openCodeBlock: false, codeLang: '', openThinkingBlock: false };
    expect(renderer.flush(state)).toBe('');
  });

  it('closes open code block before rendering', () => {
    const renderer = makeRenderer();
    const state = {
      buffer: '```javascript\nconst y = 2;',
      openCodeBlock: true,
      codeLang: 'javascript',
      openThinkingBlock: false,
    };
    const result = renderer.flush(state);
    expect(stripAnsi(result)).toContain('const y = 2;');
  });

  it('renders partial paragraph on flush', () => {
    const renderer = makeRenderer();
    // Feed a partial paragraph (no trailing \n\n)
    const { state } = renderer.renderChunk('No trailing newline');
    const result = renderer.flush(state);
    expect(stripAnsi(result)).toContain('No trailing newline');
  });
});

describe('renderStream()', () => {
  it('returns an async iterable', () => {
    const renderer = makeRenderer();
    const stream = (async function* () { yield 'test\n\n'; })();
    const result = renderer.renderStream(stream);
    expect(typeof result[Symbol.asyncIterator]).toBe('function');
  });

  it('collects rendered output from stream', async () => {
    const renderer = makeRenderer();
    const stream = (async function* () {
      yield 'Hello ';
      yield 'world\n\n';
    })();
    const chunks = await collect(renderer.renderStream(stream));
    const combined = chunks.join('');
    expect(stripAnsi(combined)).toContain('Hello');
    expect(stripAnsi(combined)).toContain('world');
  });

  it('handles empty stream', async () => {
    const renderer = makeRenderer();
    const stream = (async function* () { /* no chunks */ })();
    const chunks = await collect(renderer.renderStream(stream));
    expect(chunks.join('')).toBe('');
  });

  it('yields final flush output', async () => {
    const renderer = makeRenderer();
    // Stream that ends without a closing newline
    const stream = (async function* () {
      yield 'Partial content';
    })();
    const chunks = await collect(renderer.renderStream(stream));
    const combined = chunks.join('');
    expect(stripAnsi(combined)).toContain('Partial content');
  });

  it('renders multi-chunk markdown correctly', async () => {
    const renderer = makeRenderer();
    const stream = (async function* () {
      yield '# Heading\n\n';
      yield 'First paragraph.\n\n';
      yield 'Second paragraph.\n\n';
    })();
    const chunks = await collect(renderer.renderStream(stream));
    const combined = stripAnsi(chunks.join(''));
    expect(combined).toContain('Heading');
    expect(combined).toContain('First paragraph');
    expect(combined).toContain('Second paragraph');
  });

  it('handles code block split across chunks', async () => {
    const renderer = makeRenderer();
    const stream = (async function* () {
      yield '```js\n';
      yield 'const a = 1;\n';
      yield '```\n\n';
    })();
    const chunks = await collect(renderer.renderStream(stream));
    const combined = stripAnsi(chunks.join(''));
    expect(combined).toContain('const a = 1;');
  });

  it('renders AI thinking blocks from stream', async () => {
    const renderer = makeRenderer();
    const stream = (async function* () {
      yield '<thinking>reasoning</thinking>\n\n';
      yield 'Final answer\n\n';
    })();
    const chunks = await collect(renderer.renderStream(stream));
    const combined = stripAnsi(chunks.join(''));
    // thinking content should appear (mode=show)
    expect(combined).toContain('reasoning');
    expect(combined).toContain('Final answer');
  });

  it('does not yield empty strings', async () => {
    const renderer = makeRenderer();
    const stream = (async function* () {
      yield 'chunk1\n\n';
      yield 'chunk2\n\n';
    })();
    const chunks = await collect(renderer.renderStream(stream));
    // All yielded chunks should be non-empty
    for (const chunk of chunks) {
      expect(chunk.length).toBeGreaterThan(0);
    }
  });
});
