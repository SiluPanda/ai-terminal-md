import { describe, it, expect } from 'vitest';
import { tokenize, highlight, highlightWithFallback, type TokenPattern } from '../highlighter';
import { tokenizeJavaScript, tokenizeTypeScript } from '../languages/javascript';
import { tokenizePython } from '../languages/python';
import { tokenizeJSON } from '../languages/data';
import { getLanguageTokenizer, isLanguageSupported } from '../languages/index';
import type { CustomHighlighter } from '../types';
import { renderMarkdown, type ResolvedConfig } from '../render-markdown';
import { stripAnsi } from '../ansi';
import { getTheme } from '../theme';

/** Create a test config. */
function testConfig(overrides?: Partial<ResolvedConfig>): ResolvedConfig {
  return {
    theme: getTheme('dark'),
    colorLevel: 'truecolor',
    width: 80,
    unicode: true,
    wordWrapEnabled: true,
    margin: 0,
    nonTTY: false,
    codeBackground: true,
    codeLineNumbers: false,
    codeLanguageLabel: true,
    codePadding: 1,
    showLinkUrls: true,
    tableStyle: 'unicode',
    ...overrides,
  };
}

// ── Tokenizer Framework Tests ────────────────────────────────────────

describe('tokenize (framework)', () => {
  const simplePatterns: TokenPattern[] = [
    { pattern: /"[^"]*"/, category: 'string' },
    { pattern: /\d+/, category: 'number' },
    { pattern: /\b(?:if|else|return)\b/, category: 'keyword' },
    { pattern: /[a-zA-Z_]\w*/, category: 'plain' },
    { pattern: /\s+/, category: 'plain' },
    { pattern: /[{}();=]/, category: 'punctuation' },
  ];

  it('tokenizes a simple expression', () => {
    const tokens = tokenize('x = 42', simplePatterns);
    expect(tokens).toEqual([
      { text: 'x', category: 'plain' },
      { text: ' ', category: 'plain' },
      { text: '=', category: 'punctuation' },
      { text: ' ', category: 'plain' },
      { text: '42', category: 'number' },
    ]);
  });

  it('tokenizes keywords', () => {
    const tokens = tokenize('if (x) return 1', simplePatterns);
    const categories = tokens.filter(t => t.text.trim()).map(t => [t.text, t.category]);
    expect(categories).toContainEqual(['if', 'keyword']);
    expect(categories).toContainEqual(['return', 'keyword']);
  });

  it('tokenizes strings', () => {
    const tokens = tokenize('"hello" + "world"', simplePatterns);
    const strings = tokens.filter(t => t.category === 'string');
    expect(strings).toHaveLength(2);
    expect(strings[0].text).toBe('"hello"');
    expect(strings[1].text).toBe('"world"');
  });

  it('returns empty array for empty input', () => {
    const tokens = tokenize('', simplePatterns);
    expect(tokens).toEqual([]);
  });

  it('falls back to plain for unmatched characters', () => {
    const tokens = tokenize('@#$', simplePatterns);
    expect(tokens).toEqual([{ text: '@#$', category: 'plain' }]);
  });

  it('groups consecutive unmatched characters into a single plain token', () => {
    const tokens = tokenize('~!~', simplePatterns);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].category).toBe('plain');
  });
});

// ── Language Dispatch Tests ────────────────────────────────────────

describe('language dispatch', () => {
  it('resolves js to javascript tokenizer', () => {
    const tokenizer = getLanguageTokenizer('js');
    expect(tokenizer).toBeDefined();
    expect(tokenizer).toBe(getLanguageTokenizer('javascript'));
  });

  it('resolves ts to typescript tokenizer', () => {
    const tokenizer = getLanguageTokenizer('ts');
    expect(tokenizer).toBeDefined();
    expect(tokenizer).toBe(getLanguageTokenizer('typescript'));
  });

  it('resolves case-insensitively', () => {
    expect(getLanguageTokenizer('JavaScript')).toBe(getLanguageTokenizer('js'));
    expect(getLanguageTokenizer('TYPESCRIPT')).toBe(getLanguageTokenizer('ts'));
  });

  it('returns undefined for unknown languages', () => {
    expect(getLanguageTokenizer('brainfuck')).toBeUndefined();
    expect(getLanguageTokenizer('')).toBeUndefined();
  });

  it('isLanguageSupported returns true for known tags', () => {
    expect(isLanguageSupported('js')).toBe(true);
    expect(isLanguageSupported('typescript')).toBe(true);
    expect(isLanguageSupported('python')).toBe(true);
  });

  it('isLanguageSupported returns false for unknown tags', () => {
    expect(isLanguageSupported('brainfuck')).toBe(false);
  });

  it('returns a tokenizer for python', () => {
    const tokenizer = getLanguageTokenizer('python');
    expect(tokenizer).toBeDefined();
  });
});

// ── Custom Highlighter Integration Tests ────────────────────────────

describe('custom highlighter integration', () => {
  it('uses custom highlighter when it returns tokens', () => {
    const custom: CustomHighlighter = {
      highlight: (_code: string, _lang: string) => [
        { text: 'custom', category: 'keyword' },
        { text: ' output', category: 'plain' },
      ],
    };
    const tokens = highlightWithFallback('anything', 'js', custom);
    expect(tokens[0]).toEqual({ text: 'custom', category: 'keyword' });
  });

  it('falls back to built-in when custom returns empty array', () => {
    const custom: CustomHighlighter = {
      highlight: () => [],
    };
    const tokens = highlightWithFallback('const x = 1', 'js', custom);
    const keywords = tokens.filter(t => t.category === 'keyword');
    expect(keywords.length).toBeGreaterThan(0);
  });

  it('falls back to built-in when custom throws', () => {
    const custom: CustomHighlighter = {
      highlight: () => { throw new Error('fail'); },
    };
    const tokens = highlightWithFallback('const x = 1', 'js', custom);
    const keywords = tokens.filter(t => t.category === 'keyword');
    expect(keywords.length).toBeGreaterThan(0);
  });

  it('uses built-in when no custom highlighter is provided', () => {
    const tokens = highlightWithFallback('const x = 1', 'js');
    const keywords = tokens.filter(t => t.category === 'keyword');
    expect(keywords.length).toBeGreaterThan(0);
  });
});

// ── Unknown Language Handling Tests ────────────────────────────────

describe('unknown language handling', () => {
  it('returns single plain token for unknown language', () => {
    const tokens = highlight('some code here', 'unknown-lang');
    expect(tokens).toEqual([{ text: 'some code here', category: 'plain' }]);
  });

  it('returns single plain token for empty language', () => {
    const tokens = highlight('code', '');
    expect(tokens).toEqual([{ text: 'code', category: 'plain' }]);
  });
});

// ── JavaScript Tokenizer Tests ────────────────────────────────────

describe('JavaScript tokenizer', () => {
  it('highlights function keyword', () => {
    const tokens = tokenizeJavaScript('function foo() {}');
    const kw = tokens.find(t => t.text === 'function');
    expect(kw).toBeDefined();
    expect(kw!.category).toBe('keyword');
  });

  it('highlights const keyword', () => {
    const tokens = tokenizeJavaScript('const x = 1;');
    const kw = tokens.find(t => t.text === 'const');
    expect(kw).toBeDefined();
    expect(kw!.category).toBe('keyword');
  });

  it('highlights return keyword', () => {
    const tokens = tokenizeJavaScript('return value;');
    const kw = tokens.find(t => t.text === 'return');
    expect(kw!.category).toBe('keyword');
  });

  it('highlights import/export keywords', () => {
    const tokens = tokenizeJavaScript("import { x } from 'y'");
    expect(tokens.find(t => t.text === 'import')!.category).toBe('keyword');
    expect(tokens.find(t => t.text === 'from')!.category).toBe('keyword');
  });

  it('highlights double-quoted strings', () => {
    const tokens = tokenizeJavaScript('"hello world"');
    const str = tokens.find(t => t.category === 'string');
    expect(str).toBeDefined();
    expect(str!.text).toBe('"hello world"');
  });

  it('highlights single-quoted strings', () => {
    const tokens = tokenizeJavaScript("'hello'");
    const str = tokens.find(t => t.category === 'string');
    expect(str!.text).toBe("'hello'");
  });

  it('highlights template literals', () => {
    const tokens = tokenizeJavaScript('`hello ${name}`');
    const str = tokens.find(t => t.category === 'string');
    expect(str).toBeDefined();
  });

  it('highlights strings with escape sequences', () => {
    const tokens = tokenizeJavaScript('"hello\\nworld"');
    const str = tokens.find(t => t.category === 'string');
    expect(str!.text).toBe('"hello\\nworld"');
  });

  it('highlights integer numbers', () => {
    const tokens = tokenizeJavaScript('42');
    expect(tokens.find(t => t.category === 'number')!.text).toBe('42');
  });

  it('highlights float numbers', () => {
    const tokens = tokenizeJavaScript('3.14');
    expect(tokens.find(t => t.category === 'number')!.text).toBe('3.14');
  });

  it('highlights hex numbers', () => {
    const tokens = tokenizeJavaScript('0xFF');
    expect(tokens.find(t => t.category === 'number')!.text).toBe('0xFF');
  });

  it('highlights scientific notation', () => {
    const tokens = tokenizeJavaScript('1e10');
    expect(tokens.find(t => t.category === 'number')!.text).toBe('1e10');
  });

  it('highlights line comments', () => {
    const tokens = tokenizeJavaScript('x = 1 // comment');
    const comment = tokens.find(t => t.category === 'comment');
    expect(comment).toBeDefined();
    expect(comment!.text).toBe('// comment');
  });

  it('highlights block comments', () => {
    const tokens = tokenizeJavaScript('/* block */ x');
    const comment = tokens.find(t => t.category === 'comment');
    expect(comment!.text).toBe('/* block */');
  });

  it('highlights multi-line block comments', () => {
    const tokens = tokenizeJavaScript('/* line1\nline2 */');
    const comment = tokens.find(t => t.category === 'comment');
    expect(comment!.text).toBe('/* line1\nline2 */');
  });

  it('highlights operators', () => {
    const tokens = tokenizeJavaScript('a === b');
    const ops = tokens.filter(t => t.category === 'operator');
    expect(ops.length).toBeGreaterThan(0);
    expect(ops.some(t => t.text === '===')).toBe(true);
  });

  it('highlights arrow operator', () => {
    const tokens = tokenizeJavaScript('x => x + 1');
    expect(tokens.some(t => t.text === '=>' && t.category === 'operator')).toBe(true);
  });

  it('highlights punctuation', () => {
    const tokens = tokenizeJavaScript('foo(a, b)');
    const puncts = tokens.filter(t => t.category === 'punctuation');
    expect(puncts.map(t => t.text)).toContain('(');
    expect(puncts.map(t => t.text)).toContain(')');
    expect(puncts.map(t => t.text)).toContain(',');
  });

  it('highlights function calls', () => {
    const tokens = tokenizeJavaScript('console.log("hi")');
    const fns = tokens.filter(t => t.category === 'function');
    expect(fns.some(t => t.text === 'log')).toBe(true);
  });

  it('highlights constants', () => {
    const tokens = tokenizeJavaScript('true false null undefined');
    const consts = tokens.filter(t => t.category === 'constant');
    expect(consts.map(t => t.text)).toContain('true');
    expect(consts.map(t => t.text)).toContain('false');
    expect(consts.map(t => t.text)).toContain('null');
    expect(consts.map(t => t.text)).toContain('undefined');
  });

  it('highlights this as variable', () => {
    const tokens = tokenizeJavaScript('this.value');
    expect(tokens.find(t => t.text === 'this')!.category).toBe('variable');
  });

  it('tokenizes a complete function correctly', () => {
    const code = `function add(a, b) {
  return a + b;
}`;
    const tokens = tokenizeJavaScript(code);
    expect(tokens.find(t => t.text === 'function')!.category).toBe('keyword');
    expect(tokens.find(t => t.text === 'add')!.category).toBe('function');
    expect(tokens.find(t => t.text === 'return')!.category).toBe('keyword');
    // Verify all text concatenated matches original
    const reconstructed = tokens.map(t => t.text).join('');
    expect(reconstructed).toBe(code);
  });

  it('preserves original text when tokens are joined', () => {
    const code = 'const x = "hello" + 42;';
    const tokens = tokenizeJavaScript(code);
    expect(tokens.map(t => t.text).join('')).toBe(code);
  });
});

// ── TypeScript Tokenizer Tests ────────────────────────────────────

describe('TypeScript tokenizer', () => {
  it('highlights TypeScript-specific keywords', () => {
    const code = 'interface Foo { readonly bar: string }';
    const tokens = tokenizeTypeScript(code);
    expect(tokens.find(t => t.text === 'interface')!.category).toBe('keyword');
    expect(tokens.find(t => t.text === 'readonly')!.category).toBe('keyword');
  });

  it('highlights type keyword', () => {
    const tokens = tokenizeTypeScript('type Foo = string | number');
    expect(tokens.find(t => t.text === 'type')!.category).toBe('keyword');
  });

  it('highlights as keyword', () => {
    const tokens = tokenizeTypeScript('x as string');
    expect(tokens.find(t => t.text === 'as')!.category).toBe('keyword');
  });

  it('highlights enum keyword', () => {
    const tokens = tokenizeTypeScript('enum Direction { Up, Down }');
    expect(tokens.find(t => t.text === 'enum')!.category).toBe('keyword');
  });

  it('highlights keyof keyword', () => {
    const tokens = tokenizeTypeScript('keyof T');
    expect(tokens.find(t => t.text === 'keyof')!.category).toBe('keyword');
  });

  it('highlights implements keyword', () => {
    const tokens = tokenizeTypeScript('class Foo implements Bar {}');
    expect(tokens.find(t => t.text === 'implements')!.category).toBe('keyword');
  });

  it('highlights decorators', () => {
    const tokens = tokenizeTypeScript('@Component class Foo {}');
    const attr = tokens.find(t => t.category === 'attribute');
    expect(attr).toBeDefined();
    expect(attr!.text).toBe('@Component');
  });

  it('still highlights JavaScript keywords', () => {
    const tokens = tokenizeTypeScript('const x = function() { return 1; }');
    expect(tokens.find(t => t.text === 'const')!.category).toBe('keyword');
    expect(tokens.find(t => t.text === 'function')!.category).toBe('keyword');
    expect(tokens.find(t => t.text === 'return')!.category).toBe('keyword');
  });

  it('preserves original text when tokens are joined', () => {
    const code = 'interface Foo<T> { bar: T; }';
    const tokens = tokenizeTypeScript(code);
    expect(tokens.map(t => t.text).join('')).toBe(code);
  });
});

// ── Integration: Code Block Rendering with Highlighting ─────────

describe('code block rendering with syntax highlighting', () => {
  it('applies syntax highlighting to JS code blocks', () => {
    const md = '```javascript\nconst x = 1;\n```';
    const result = renderMarkdown(md, testConfig());
    // Should contain magenta ANSI code for keywords (dark theme: magenta = \x1b[35m)
    expect(result).toContain('\x1b[35m');
    // Strip ANSI and verify the code text is present
    expect(stripAnsi(result)).toContain('const x = 1;');
  });

  it('applies syntax highlighting to TS code blocks', () => {
    const md = '```typescript\ninterface Foo { bar: string }\n```';
    const result = renderMarkdown(md, testConfig());
    expect(result).toContain('\x1b[35m'); // magenta for keywords
    expect(stripAnsi(result)).toContain('interface Foo');
  });

  it('renders unknown language without syntax coloring', () => {
    const md = '```brainfuck\n+++[-]\n```';
    const result = renderMarkdown(md, testConfig());
    // Should still have background but no syntax-specific colors (just code background)
    expect(stripAnsi(result)).toContain('+++[-]');
  });

  it('renders code block without language tag as plain text', () => {
    const md = '```\nplain text\n```';
    const result = renderMarkdown(md, testConfig());
    expect(stripAnsi(result)).toContain('plain text');
  });

  it('still shows language label with syntax highlighting', () => {
    const md = '```javascript\nconst x = 1;\n```';
    const result = renderMarkdown(md, testConfig());
    expect(stripAnsi(result)).toContain('javascript');
  });

  it('uses custom highlighter when provided', () => {
    const custom: CustomHighlighter = {
      highlight: (_code: string, _lang: string) => [
        { text: 'CUSTOM', category: 'keyword' },
      ],
    };
    const md = '```js\nwhatever\n```';
    const result = renderMarkdown(md, testConfig({ highlighter: custom }));
    // Custom highlighter replaces the code content token-wise
    expect(stripAnsi(result)).toContain('CUSTOM');
  });

  it('falls back to built-in when custom highlighter throws', () => {
    const custom: CustomHighlighter = {
      highlight: () => { throw new Error('boom'); },
    };
    const md = '```js\nconst x = 1;\n```';
    const result = renderMarkdown(md, testConfig({ highlighter: custom }));
    // Should still work — falls back to built-in
    expect(result).toContain('\x1b[35m'); // magenta for const keyword
  });

  it('preserves code block background with highlighting', () => {
    const md = '```javascript\nconst x = 1;\n```';
    const result = renderMarkdown(md, testConfig());
    // Dark theme code background: #1e1e1e → 48;2;30;30;30
    expect(result).toContain('\x1b[48;2;30;30;30m');
  });

  it('works with codeBackground disabled', () => {
    const md = '```javascript\nconst x = 1;\n```';
    const result = renderMarkdown(md, testConfig({ codeBackground: false }));
    // Should still have syntax coloring
    expect(result).toContain('\x1b[35m');
    // But no background
    expect(result).not.toContain('\x1b[48;2;30;30;30m');
  });

  it('works with line numbers and syntax highlighting', () => {
    const md = '```javascript\nconst a = 1;\nconst b = 2;\n```';
    const result = renderMarkdown(md, testConfig({ codeLineNumbers: true }));
    const plain = stripAnsi(result);
    expect(plain).toContain('1');
    expect(plain).toContain('2');
    expect(plain).toContain('const a = 1;');
  });
});

// ── Python Tokenizer Tests ────────────────────────────────────────

describe('Python tokenizer', () => {
  it('highlights def keyword', () => {
    const tokens = tokenizePython('def foo():');
    expect(tokens.find(t => t.text === 'def')!.category).toBe('keyword');
  });

  it('highlights class keyword', () => {
    const tokens = tokenizePython('class Foo:');
    expect(tokens.find(t => t.text === 'class')!.category).toBe('keyword');
  });

  it('highlights import keyword', () => {
    const tokens = tokenizePython('import os');
    expect(tokens.find(t => t.text === 'import')!.category).toBe('keyword');
  });

  it('highlights from/import together', () => {
    const tokens = tokenizePython('from os import path');
    expect(tokens.find(t => t.text === 'from')!.category).toBe('keyword');
    expect(tokens.find(t => t.text === 'import')!.category).toBe('keyword');
  });

  it('highlights triple-double-quoted strings', () => {
    const tokens = tokenizePython('"""hello\nworld"""');
    const str = tokens.find(t => t.category === 'string');
    expect(str).toBeDefined();
    expect(str!.text).toBe('"""hello\nworld"""');
  });

  it('highlights triple-single-quoted strings', () => {
    const tokens = tokenizePython("'''docstring'''");
    const str = tokens.find(t => t.category === 'string');
    expect(str).toBeDefined();
    expect(str!.text).toBe("'''docstring'''");
  });

  it('highlights f-string prefix with triple quotes', () => {
    const tokens = tokenizePython('f"""hello {name}"""');
    const str = tokens.find(t => t.category === 'string');
    expect(str).toBeDefined();
  });

  it('highlights decorators as attributes', () => {
    const tokens = tokenizePython('@staticmethod\ndef foo(): pass');
    const attr = tokens.find(t => t.category === 'attribute');
    expect(attr).toBeDefined();
    expect(attr!.text).toBe('@staticmethod');
  });

  it('highlights dotted decorators as attributes', () => {
    const tokens = tokenizePython('@app.route("/")');
    const attr = tokens.find(t => t.category === 'attribute');
    expect(attr).toBeDefined();
    expect(attr!.text).toBe('@app.route');
  });

  it('highlights True/False/None as constants', () => {
    const tokens = tokenizePython('x = True\ny = False\nz = None');
    const consts = tokens.filter(t => t.category === 'constant').map(t => t.text);
    expect(consts).toContain('True');
    expect(consts).toContain('False');
    expect(consts).toContain('None');
  });

  it('highlights comments', () => {
    const tokens = tokenizePython('x = 1  # this is a comment');
    const comment = tokens.find(t => t.category === 'comment');
    expect(comment).toBeDefined();
    expect(comment!.text).toBe('# this is a comment');
  });

  it('preserves original text when tokens are joined', () => {
    const code = 'def add(a, b):\n    return a + b\n';
    const tokens = tokenizePython(code);
    expect(tokens.map(t => t.text).join('')).toBe(code);
  });
});

// ── JSON Tokenizer Tests ──────────────────────────────────────────

describe('JSON tokenizer', () => {
  it('highlights keys as property (distinct from string values)', () => {
    const tokens = tokenizeJSON('{"name": "Alice"}');
    const key = tokens.find(t => t.text === '"name"');
    expect(key).toBeDefined();
    expect(key!.category).toBe('property');
  });

  it('highlights string values as string', () => {
    const tokens = tokenizeJSON('{"name": "Alice"}');
    const val = tokens.find(t => t.text === '"Alice"');
    expect(val).toBeDefined();
    expect(val!.category).toBe('string');
  });

  it('highlights numeric values as number', () => {
    const tokens = tokenizeJSON('{"count": 42}');
    const num = tokens.find(t => t.category === 'number');
    expect(num).toBeDefined();
    expect(num!.text).toBe('42');
  });

  it('highlights negative numbers', () => {
    const tokens = tokenizeJSON('{"temp": -3.14}');
    const num = tokens.find(t => t.category === 'number');
    expect(num).toBeDefined();
    expect(num!.text).toBe('-3.14');
  });

  it('highlights true as constant', () => {
    const tokens = tokenizeJSON('{"ok": true}');
    const c = tokens.find(t => t.text === 'true');
    expect(c).toBeDefined();
    expect(c!.category).toBe('constant');
  });

  it('highlights false as constant', () => {
    const tokens = tokenizeJSON('{"ok": false}');
    const c = tokens.find(t => t.text === 'false');
    expect(c).toBeDefined();
    expect(c!.category).toBe('constant');
  });

  it('highlights null as constant', () => {
    const tokens = tokenizeJSON('{"x": null}');
    const c = tokens.find(t => t.text === 'null');
    expect(c).toBeDefined();
    expect(c!.category).toBe('constant');
  });

  it('keys and values have different categories', () => {
    const tokens = tokenizeJSON('{"key": "value"}');
    const key = tokens.find(t => t.text === '"key"');
    const val = tokens.find(t => t.text === '"value"');
    expect(key!.category).not.toBe(val!.category);
    expect(key!.category).toBe('property');
    expect(val!.category).toBe('string');
  });

  it('preserves original text when tokens are joined', () => {
    const code = '{"a": 1, "b": true, "c": null}';
    const tokens = tokenizeJSON(code);
    expect(tokens.map(t => t.text).join('')).toBe(code);
  });
});

// ── Smoke Tests: All 16 Language Tokenizers ───────────────────────

describe('language tokenizer smoke tests', () => {
  const cases: Array<{ tag: string; sample: string }> = [
    { tag: 'javascript', sample: 'const x = 1; // js' },
    { tag: 'typescript', sample: 'interface Foo { bar: string }' },
    { tag: 'python',     sample: 'def foo(): pass' },
    { tag: 'rust',       sample: 'fn main() { let x = 1; }' },
    { tag: 'go',         sample: 'func main() { var x int = 1 }' },
    { tag: 'java',       sample: 'public class Foo { void bar() {} }' },
    { tag: 'ruby',       sample: 'def foo; end' },
    { tag: 'shell',      sample: 'if [ -f file ]; then echo ok; fi' },
    { tag: 'sql',        sample: 'SELECT id FROM users WHERE active = true' },
    { tag: 'html',       sample: '<div class="foo">hello</div>' },
    { tag: 'css',        sample: '.foo { color: red; }' },
    { tag: 'json',       sample: '{"key": "value", "n": 1}' },
    { tag: 'yaml',       sample: 'name: Alice\nage: 30' },
    { tag: 'markdown',   sample: '# Header\n**bold** and `code`' },
    { tag: 'c',          sample: '#include <stdio.h>\nint main() { return 0; }' },
    { tag: 'php',        sample: '<?php function foo() { return 1; }' },
  ];

  for (const { tag, sample } of cases) {
    it(`${tag}: produces at least one non-plain token`, () => {
      const tokenizer = getLanguageTokenizer(tag);
      expect(tokenizer, `no tokenizer found for ${tag}`).toBeDefined();
      const tokens = tokenizer!(sample);
      expect(tokens.length).toBeGreaterThan(0);
      const hasNonPlain = tokens.some(t => t.category !== 'plain');
      expect(hasNonPlain, `all tokens are plain for ${tag}`).toBe(true);
    });

    it(`${tag}: joined tokens reconstruct original input`, () => {
      const tokenizer = getLanguageTokenizer(tag)!;
      const tokens = tokenizer(sample);
      expect(tokens.map(t => t.text).join('')).toBe(sample);
    });
  }
});
