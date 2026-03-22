import { describe, it, expect } from 'vitest';
import {
  renderThinking,
  renderArtifact,
  renderToolUse,
  renderToolResult,
  renderSemanticWrapper,
  renderCitation,
  renderAIElement,
} from '../render-ai';
import type { ResolvedConfig } from '../render-markdown';
import { getTheme } from '../theme';
import { stripAnsi } from '../ansi';

/** Minimal resolved config for testing — no colors to keep assertions simple. */
function makeConfig(overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
  return {
    theme: getTheme('dark'),
    colorLevel: 'none',
    width: 80,
    unicode: true,
    wordWrapEnabled: true,
    margin: 0,
    nonTTY: true,
    codeBackground: false,
    codeLineNumbers: false,
    codeLanguageLabel: true,
    codePadding: 1,
    showLinkUrls: true,
    tableStyle: 'unicode',
    ...overrides,
  };
}

describe('renderThinking()', () => {
  const el = { type: 'thinking' as const, content: 'I am thinking hard', tagName: 'thinking' };

  it('returns empty string when mode=hide', () => {
    expect(renderThinking(el, 'hide', makeConfig())).toBe('');
  });

  it('contains content when mode=show', () => {
    const result = renderThinking(el, 'show', makeConfig());
    expect(stripAnsi(result)).toContain('I am thinking hard');
  });

  it('contains "Thinking" header when mode=dim', () => {
    const result = renderThinking(el, 'dim', makeConfig());
    expect(stripAnsi(result)).toContain('Thinking');
    expect(stripAnsi(result)).toContain('I am thinking hard');
  });

  it('contains border character │ in mode=show', () => {
    const result = renderThinking(el, 'show', makeConfig());
    expect(stripAnsi(result)).toContain('│');
  });

  it('returns string for multiline content', () => {
    const multiEl = { ...el, content: 'Line 1\nLine 2\nLine 3' };
    const result = renderThinking(multiEl, 'show', makeConfig());
    expect(stripAnsi(result)).toContain('Line 1');
    expect(stripAnsi(result)).toContain('Line 3');
  });
});

describe('renderArtifact()', () => {
  const el = {
    type: 'artifact' as const,
    artifactType: 'code',
    title: 'My Script',
    identifier: 'script-1',
    content: 'const x = 1;',
  };

  it('returns empty string when mode=hide', () => {
    expect(renderArtifact(el, 'hide', makeConfig())).toBe('');
  });

  it('contains title in panel mode', () => {
    const result = renderArtifact(el, 'panel', makeConfig());
    expect(stripAnsi(result)).toContain('My Script');
  });

  it('contains content in panel mode', () => {
    const result = renderArtifact(el, 'panel', makeConfig());
    expect(stripAnsi(result)).toContain('const x = 1;');
  });

  it('contains box-drawing characters in panel mode', () => {
    const result = renderArtifact(el, 'panel', makeConfig());
    const plain = stripAnsi(result);
    expect(plain).toContain('╭');
    expect(plain).toContain('╰');
  });

  it('inline mode contains "Artifact:" label', () => {
    const result = renderArtifact(el, 'inline', makeConfig());
    expect(stripAnsi(result)).toContain('Artifact:');
    expect(stripAnsi(result)).toContain('My Script');
  });

  it('inline mode contains content', () => {
    const result = renderArtifact(el, 'inline', makeConfig());
    expect(stripAnsi(result)).toContain('const x = 1;');
  });

  it('uses identifier as fallback title', () => {
    const noTitle = { ...el, title: undefined };
    const result = renderArtifact(noTitle, 'panel', makeConfig());
    expect(stripAnsi(result)).toContain('script-1');
  });
});

describe('renderToolUse()', () => {
  const el = {
    type: 'tool-use' as const,
    toolName: 'search',
    arguments: { query: 'typescript', limit: 10 },
  };

  it('returns empty string when mode=hide', () => {
    expect(renderToolUse(el, 'hide', makeConfig())).toBe('');
  });

  it('contains tool name in box mode', () => {
    const result = renderToolUse(el, 'box', makeConfig());
    expect(stripAnsi(result)).toContain('search');
  });

  it('contains argument keys in box mode', () => {
    const result = renderToolUse(el, 'box', makeConfig());
    expect(stripAnsi(result)).toContain('query');
    expect(stripAnsi(result)).toContain('limit');
  });

  it('contains box borders in box mode', () => {
    const result = renderToolUse(el, 'box', makeConfig());
    const plain = stripAnsi(result);
    expect(plain).toContain('┌');
    expect(plain).toContain('└');
  });

  it('inline mode contains [Tool: ...] format', () => {
    const result = renderToolUse(el, 'inline', makeConfig());
    expect(stripAnsi(result)).toContain('[Tool: search(');
  });

  it('inline mode is compact single line', () => {
    const result = renderToolUse(el, 'inline', makeConfig());
    const lines = stripAnsi(result).split('\n').filter(l => l.trim());
    expect(lines.length).toBe(1);
  });
});

describe('renderToolResult()', () => {
  const successEl = {
    type: 'tool-result' as const,
    toolName: 'search',
    isError: false,
    content: 'Found 5 results',
  };
  const errorEl = {
    type: 'tool-result' as const,
    toolName: 'search',
    isError: true,
    content: 'Connection timeout',
  };

  it('returns empty string when mode=hide', () => {
    expect(renderToolResult(successEl, 'hide', makeConfig())).toBe('');
  });

  it('contains ✓ for success', () => {
    const result = renderToolResult(successEl, 'box', makeConfig());
    expect(stripAnsi(result)).toContain('✓');
  });

  it('contains ✗ for error', () => {
    const result = renderToolResult(errorEl, 'box', makeConfig());
    expect(stripAnsi(result)).toContain('✗');
  });

  it('contains content in box mode', () => {
    const result = renderToolResult(successEl, 'box', makeConfig());
    expect(stripAnsi(result)).toContain('Found 5 results');
  });

  it('inline mode contains success marker and content', () => {
    const result = renderToolResult(successEl, 'inline', makeConfig());
    const plain = stripAnsi(result);
    expect(plain).toContain('✓');
    expect(plain).toContain('Found 5 results');
  });
});

describe('renderSemanticWrapper()', () => {
  const el = {
    type: 'semantic-wrapper' as const,
    tagName: 'result',
    content: 'The final answer is 42',
  };

  it('strip mode returns content without tags', () => {
    const result = renderSemanticWrapper(el, 'strip', makeConfig());
    expect(stripAnsi(result)).toContain('The final answer is 42');
    expect(stripAnsi(result)).not.toContain('<result>');
  });

  it('label mode includes tag name label', () => {
    const result = renderSemanticWrapper(el, 'label', makeConfig());
    expect(stripAnsi(result)).toContain('[result]');
    expect(stripAnsi(result)).toContain('The final answer is 42');
  });
});

describe('renderCitation()', () => {
  const el = {
    type: 'citation' as const,
    index: 1,
    label: '1',
  };

  it('hide mode returns empty string', () => {
    expect(renderCitation(el, 'hide', makeConfig())).toBe('');
  });

  it('plain mode returns [label]', () => {
    expect(renderCitation(el, 'plain', makeConfig())).toBe('[1]');
  });

  it('color mode returns styled [label]', () => {
    // With colorLevel=none, styling is a no-op, still returns [1]
    const result = renderCitation(el, 'color', makeConfig());
    expect(stripAnsi(result)).toBe('[1]');
  });

  it('color mode with truecolor wraps in ANSI codes', () => {
    const colorConfig = makeConfig({ colorLevel: 'truecolor', nonTTY: false });
    const result = renderCitation(el, 'color', colorConfig);
    // Should contain ANSI escape codes
    expect(result).toContain('\x1b[');
    expect(stripAnsi(result)).toBe('[1]');
  });
});

describe('box width consistency', () => {
  it('artifact panel top and bottom borders have the same width', () => {
    const el = {
      type: 'artifact' as const,
      artifactType: 'code',
      title: 'Test',
      identifier: 'test-1',
      content: 'line 1\nline 2',
    };
    const result = renderArtifact(el, 'panel', makeConfig());
    const lines = stripAnsi(result).split('\n').filter(l => l.trim());
    const topLine = lines[0];
    const bottomLine = lines[lines.length - 1];
    expect(topLine.length).toBe(bottomLine.length);
  });

  it('tool use box top and bottom borders have the same width', () => {
    const el = {
      type: 'tool-use' as const,
      toolName: 'search',
      arguments: { q: 'test' },
    };
    const result = renderToolUse(el, 'box', makeConfig());
    const lines = stripAnsi(result).split('\n').filter(l => l.trim());
    const topLine = lines[0];
    const bottomLine = lines[lines.length - 1];
    expect(topLine.length).toBe(bottomLine.length);
  });

  it('tool result box top and bottom borders have the same width', () => {
    const el = {
      type: 'tool-result' as const,
      toolName: 'search',
      isError: false,
      content: 'ok',
    };
    const result = renderToolResult(el, 'box', makeConfig());
    const lines = stripAnsi(result).split('\n').filter(l => l.trim());
    const topLine = lines[0];
    const bottomLine = lines[lines.length - 1];
    expect(topLine.length).toBe(bottomLine.length);
  });
});

describe('renderAIElement() dispatch', () => {
  it('dispatches thinking to renderThinking with default dim mode', () => {
    const el = { type: 'thinking' as const, content: 'thought', tagName: 'thinking' };
    const result = renderAIElement(el, makeConfig());
    expect(stripAnsi(result)).toContain('thought');
  });

  it('dispatches artifact to renderArtifact with default panel mode', () => {
    const el = { type: 'artifact' as const, content: 'code', title: 'T' };
    const result = renderAIElement(el, makeConfig());
    expect(stripAnsi(result)).toContain('T');
  });

  it('dispatches tool-use to renderToolUse with default box mode', () => {
    const el = { type: 'tool-use' as const, toolName: 'foo', arguments: {} };
    const result = renderAIElement(el, makeConfig());
    expect(stripAnsi(result)).toContain('foo');
  });

  it('dispatches tool-result to renderToolResult with default box mode', () => {
    const el = { type: 'tool-result' as const, isError: false, content: 'ok' };
    const result = renderAIElement(el, makeConfig());
    expect(stripAnsi(result)).toContain('ok');
  });

  it('dispatches semantic-wrapper to renderSemanticWrapper with default strip mode', () => {
    const el = { type: 'semantic-wrapper' as const, tagName: 'result', content: 'done' };
    const result = renderAIElement(el, makeConfig());
    expect(stripAnsi(result)).toContain('done');
  });

  it('dispatches citation to renderCitation with default color mode', () => {
    const el = { type: 'citation' as const, index: 3, label: '3' };
    const result = renderAIElement(el, makeConfig());
    expect(stripAnsi(result)).toBe('[3]');
  });
});
