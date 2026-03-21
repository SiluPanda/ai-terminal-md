import { describe, it, expect } from 'vitest';
import { parseAIElements } from '../parser';

describe('parseAIElements()', () => {
  describe('thinking blocks', () => {
    it('detects <thinking> tags', () => {
      const { cleanedMarkdown, elements } = parseAIElements('<thinking>I am reasoning</thinking>');
      expect(elements.size).toBe(1);
      const el = [...elements.values()][0];
      expect(el.type).toBe('thinking');
      if (el.type === 'thinking') {
        expect(el.content).toBe('I am reasoning');
        expect(el.tagName).toBe('thinking');
      }
      // Placeholder in cleaned markdown
      expect(cleanedMarkdown).toContain('\x00AI:');
      expect(cleanedMarkdown).not.toContain('<thinking>');
    });

    it('detects <antThinking> tags', () => {
      const { elements } = parseAIElements('<antThinking>deep thought</antThinking>');
      expect(elements.size).toBe(1);
      const el = [...elements.values()][0];
      expect(el.type).toBe('thinking');
    });

    it('detects <reflection> tags', () => {
      const { elements } = parseAIElements('<reflection>self-review</reflection>');
      expect(elements.size).toBe(1);
      const el = [...elements.values()][0];
      expect(el.type).toBe('thinking');
    });

    it('detects <scratchpad> tags', () => {
      const { elements } = parseAIElements('<scratchpad>scratch work</scratchpad>');
      expect(elements.size).toBe(1);
      const el = [...elements.values()][0];
      expect(el.type).toBe('thinking');
    });

    it('detects <reasoning> tags', () => {
      const { elements } = parseAIElements('<reasoning>step by step</reasoning>');
      expect(elements.size).toBe(1);
      const el = [...elements.values()][0];
      expect(el.type).toBe('thinking');
    });

    it('detects <thought> tags', () => {
      const { elements } = parseAIElements('<thought>a quick thought</thought>');
      expect(elements.size).toBe(1);
      const el = [...elements.values()][0];
      expect(el.type).toBe('thinking');
    });

    it('handles multiline thinking content', () => {
      const { elements } = parseAIElements('<thinking>\nLine 1\nLine 2\n</thinking>');
      const el = [...elements.values()][0];
      expect(el.type).toBe('thinking');
      if (el.type === 'thinking') {
        expect(el.content).toContain('Line 1');
        expect(el.content).toContain('Line 2');
      }
    });
  });

  describe('artifact blocks', () => {
    it('detects <antArtifact> tags with attributes', () => {
      const input = '<antArtifact type="code" title="My Script" identifier="script-1">const x = 1;</antArtifact>';
      const { elements } = parseAIElements(input);
      expect(elements.size).toBe(1);
      const el = [...elements.values()][0];
      expect(el.type).toBe('artifact');
      if (el.type === 'artifact') {
        expect(el.artifactType).toBe('code');
        expect(el.title).toBe('My Script');
        expect(el.identifier).toBe('script-1');
        expect(el.content).toBe('const x = 1;');
      }
    });

    it('detects plain <artifact> tags', () => {
      const { elements } = parseAIElements('<artifact>some content</artifact>');
      expect(elements.size).toBe(1);
      const el = [...elements.values()][0];
      expect(el.type).toBe('artifact');
      if (el.type === 'artifact') {
        expect(el.content).toBe('some content');
      }
    });

    it('antArtifact is processed before generic artifact', () => {
      const input = '<antArtifact type="text" title="Doc">hello</antArtifact>';
      const { elements } = parseAIElements(input);
      expect(elements.size).toBe(1);
    });
  });

  describe('tool use blocks', () => {
    it('detects <tool_use> with JSON arguments', () => {
      const input = `<tool_use>
<tool_name>search</tool_name>
<arguments>{"query": "typescript", "limit": 10}</arguments>
</tool_use>`;
      const { elements } = parseAIElements(input);
      expect(elements.size).toBe(1);
      const el = [...elements.values()][0];
      expect(el.type).toBe('tool-use');
      if (el.type === 'tool-use') {
        expect(el.toolName).toBe('search');
        expect(el.arguments['query']).toBe('typescript');
        expect(el.arguments['limit']).toBe(10);
      }
    });

    it('detects <function_call> tags', () => {
      const input = `<function_call>
<tool_name>get_weather</tool_name>
<parameters>{"city": "NYC"}</parameters>
</function_call>`;
      const { elements } = parseAIElements(input);
      expect(elements.size).toBe(1);
      const el = [...elements.values()][0];
      expect(el.type).toBe('tool-use');
      if (el.type === 'tool-use') {
        expect(el.toolName).toBe('get_weather');
      }
    });

    it('detects <tool_call> tags', () => {
      const input = '<tool_call><name>my_tool</name><arguments>{"a":1}</arguments></tool_call>';
      const { elements } = parseAIElements(input);
      expect(elements.size).toBe(1);
      const el = [...elements.values()][0];
      expect(el.type).toBe('tool-use');
    });
  });

  describe('tool result blocks', () => {
    it('detects <tool_result> tags', () => {
      const input = '<tool_result tool="search">Found 5 results</tool_result>';
      const { elements } = parseAIElements(input);
      expect(elements.size).toBe(1);
      const el = [...elements.values()][0];
      expect(el.type).toBe('tool-result');
      if (el.type === 'tool-result') {
        expect(el.isError).toBe(false);
        expect(el.content).toBe('Found 5 results');
      }
    });

    it('detects error tool results', () => {
      const input = '<tool_result is_error="true">Something went wrong</tool_result>';
      const { elements } = parseAIElements(input);
      const el = [...elements.values()][0];
      expect(el.type).toBe('tool-result');
      if (el.type === 'tool-result') {
        expect(el.isError).toBe(true);
      }
    });

    it('detects <function_result> tags', () => {
      const input = '<function_result>42</function_result>';
      const { elements } = parseAIElements(input);
      expect(elements.size).toBe(1);
      const el = [...elements.values()][0];
      expect(el.type).toBe('tool-result');
    });
  });

  describe('semantic wrapper tags', () => {
    it('strips <result> wrapper and returns content', () => {
      const input = '<result>This is the final answer</result>';
      const { elements } = parseAIElements(input);
      expect(elements.size).toBe(1);
      const el = [...elements.values()][0];
      expect(el.type).toBe('semantic-wrapper');
      if (el.type === 'semantic-wrapper') {
        expect(el.tagName).toBe('result');
        expect(el.content).toBe('This is the final answer');
      }
    });

    it('strips <answer> wrapper', () => {
      const { elements } = parseAIElements('<answer>42</answer>');
      const el = [...elements.values()][0];
      expect(el.type).toBe('semantic-wrapper');
    });

    it('strips <output> wrapper', () => {
      const { elements } = parseAIElements('<output>done</output>');
      const el = [...elements.values()][0];
      expect(el.type).toBe('semantic-wrapper');
    });

    it('strips <response> wrapper', () => {
      const { elements } = parseAIElements('<response>hello</response>');
      const el = [...elements.values()][0];
      expect(el.type).toBe('semantic-wrapper');
    });
  });

  describe('citations', () => {
    it('detects standalone [1] citation', () => {
      const { elements } = parseAIElements('See [1] for details');
      expect(elements.size).toBe(1);
      const el = [...elements.values()][0];
      expect(el.type).toBe('citation');
      if (el.type === 'citation') {
        expect(el.index).toBe(1);
        expect(el.label).toBe('1');
      }
    });

    it('detects multiple citations', () => {
      const { elements } = parseAIElements('References [1] and [2]');
      expect(elements.size).toBe(2);
    });

    it('does NOT detect markdown links as citations', () => {
      // [text](url) should not be parsed as a citation
      const { elements } = parseAIElements('[link text](https://example.com)');
      expect(elements.size).toBe(0);
    });

    it('does NOT detect multi-digit citations matching links', () => {
      const { elements } = parseAIElements('[10](https://example.com)');
      // [10] followed by ( — should NOT be a citation
      expect(elements.size).toBe(0);
    });
  });

  describe('multiple elements', () => {
    it('extracts multiple elements from one string', () => {
      const input = '<thinking>plan</thinking>\nHere is the answer: <result>42</result>\nSee [1].';
      const { elements } = parseAIElements(input);
      expect(elements.size).toBe(3);
      const types = [...elements.values()].map(e => e.type);
      expect(types).toContain('thinking');
      expect(types).toContain('semantic-wrapper');
      expect(types).toContain('citation');
    });

    it('leaves non-AI content intact', () => {
      const { cleanedMarkdown } = parseAIElements('# Hello\n\nSome **bold** text.');
      expect(cleanedMarkdown).toContain('# Hello');
      expect(cleanedMarkdown).toContain('bold');
    });
  });
});
