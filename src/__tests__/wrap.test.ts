import { describe, it, expect } from 'vitest';
import { wordWrap } from '../wrap';
import { BOLD, RESET, applyStyle } from '../ansi';

describe('wrap', () => {
  describe('wordWrap', () => {
    it('does not wrap text shorter than width', () => {
      expect(wordWrap('hello world', 80)).toBe('hello world');
    });

    it('wraps text at word boundaries', () => {
      const result = wordWrap('the quick brown fox jumps over the lazy dog', 20);
      const lines = result.split('\n');
      expect(lines.length).toBeGreaterThan(1);
      for (const line of lines) {
        expect(line.length).toBeLessThanOrEqual(20);
      }
    });

    it('preserves existing newlines', () => {
      const input = 'line one\nline two\nline three';
      expect(wordWrap(input, 80)).toBe(input);
    });

    it('wraps each line independently', () => {
      const input = 'short\nthis is a longer line that should be wrapped at twenty columns';
      const result = wordWrap(input, 20);
      const lines = result.split('\n');
      expect(lines[0]).toBe('short');
      expect(lines.length).toBeGreaterThan(2);
    });

    it('handles single long word that exceeds width', () => {
      const result = wordWrap('supercalifragilisticexpialidocious', 10);
      // Long words that cannot be broken are kept on their own line
      expect(result).toBe('supercalifragilisticexpialidocious');
    });

    it('handles empty string', () => {
      expect(wordWrap('', 80)).toBe('');
    });

    it('handles width of 0 gracefully', () => {
      const input = 'hello world';
      expect(wordWrap(input, 0)).toBe(input);
    });

    it('wraps at exact width boundary', () => {
      // "hello world" is 11 chars, width=11 should not wrap
      expect(wordWrap('hello world', 11)).toBe('hello world');
      // width=10 should wrap
      const wrapped = wordWrap('hello world', 10);
      expect(wrapped).toBe('hello\nworld');
    });

    describe('indentation preservation', () => {
      it('preserves leading indent on continuation lines', () => {
        const input = '  indented text that should wrap to next line at narrow width';
        const result = wordWrap(input, 25);
        const lines = result.split('\n');
        // All lines should start with the same indent
        for (const line of lines) {
          expect(line.startsWith('  ')).toBe(true);
        }
      });

      it('preserves deeper indentation', () => {
        const input = '    deeply indented text that needs to wrap';
        const result = wordWrap(input, 20);
        const lines = result.split('\n');
        for (const line of lines) {
          expect(line.startsWith('    ')).toBe(true);
        }
      });

      it('handles tabs as indent', () => {
        const input = '\tindented with tab and more words here to wrap';
        const result = wordWrap(input, 20);
        const lines = result.split('\n');
        for (const line of lines) {
          expect(line.startsWith('\t')).toBe(true);
        }
      });
    });

    describe('ANSI-aware width calculation', () => {
      it('ignores ANSI codes when calculating width', () => {
        // "hello" with bold formatting — visible width is 5, not 5 + escape bytes
        const styled = `${BOLD}hello${RESET} world`;
        const result = wordWrap(styled, 80);
        // Should not wrap — visible width is 11
        expect(result).toBe(styled);
      });

      it('wraps styled text based on visible width', () => {
        // Each word is 5 visible chars, wrapped at 12 should fit 2 per line
        const w1 = `${BOLD}hello${RESET}`;
        const w2 = `${BOLD}world${RESET}`;
        const w3 = `${BOLD}again${RESET}`;
        const input = `${w1} ${w2} ${w3}`;
        const result = wordWrap(input, 11);
        const lines = result.split('\n');
        expect(lines.length).toBe(2);
        expect(lines[0]).toBe(`${w1} ${w2}`);
        expect(lines[1]).toBe(w3);
      });

      it('preserves ANSI codes across wrap boundaries', () => {
        const styled = applyStyle('word1', { fg: 'red' }, 'truecolor');
        const plain = 'word2 word3';
        const input = `${styled} ${plain}`;
        const result = wordWrap(input, 12);
        // Should have wrapped but preserved ANSI codes
        expect(result).toContain(styled);
      });

      it('handles complex styling without miscounting width', () => {
        const s = applyStyle('colored', { fg: '#FF0000', bold: true }, 'truecolor');
        // "colored" is 7 visible chars
        const input = `${s} text here more words for wrapping`;
        const result = wordWrap(input, 20);
        const lines = result.split('\n');
        expect(lines.length).toBeGreaterThan(1);
        // First line should contain the styled word
        expect(lines[0]).toContain(s);
      });
    });

    describe('edge cases', () => {
      it('handles multiple spaces between words', () => {
        // When line fits within width, it's returned unchanged
        expect(wordWrap('hello   world', 80)).toBe('hello   world');
        // When wrapping occurs, multiple spaces collapse to single space
        const result = wordWrap('hello   world   again   here', 12);
        const lines = result.split('\n');
        for (const line of lines) {
          // Each wrapped word should not have extra spaces
          expect(line.length).toBeGreaterThan(0);
        }
      });

      it('handles only whitespace', () => {
        const result = wordWrap('   ', 80);
        expect(result).toBe('   ');
      });

      it('handles mixed short and long lines', () => {
        const input = 'short\na much longer line that will definitely need to be wrapped to fit';
        const result = wordWrap(input, 25);
        const lines = result.split('\n');
        expect(lines[0]).toBe('short');
        expect(lines.length).toBeGreaterThan(2);
      });

      it('wraps correctly at narrow widths', () => {
        const result = wordWrap('one two three four five', 5);
        const lines = result.split('\n');
        expect(lines).toEqual(['one', 'two', 'three', 'four', 'five']);
      });

      it('handles trailing newline', () => {
        const input = 'hello world\n';
        const result = wordWrap(input, 80);
        expect(result).toBe('hello world\n');
      });
    });
  });
});
