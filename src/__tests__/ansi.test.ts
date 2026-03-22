import { describe, it, expect } from 'vitest';
import {
  applyStyle,
  stripAnsi,
  visibleLength,
  BOLD,
  DIM,
  ITALIC,
  UNDERLINE,
  STRIKETHROUGH,
  RESET,
  FG_COLORS,
  BG_COLORS,
  parseHex,
  rgbTo256,
  rgbTo16Fg,
  index256ToRgb,
  fgSequence,
  bgSequence,
} from '../ansi';
import type { Style } from '../types';

describe('ansi', () => {
  describe('FG_COLORS', () => {
    it('contains all 16 standard foreground colors', () => {
      expect(Object.keys(FG_COLORS)).toHaveLength(16);
      expect(FG_COLORS['black']).toBe(30);
      expect(FG_COLORS['white']).toBe(37);
      expect(FG_COLORS['brightBlack']).toBe(90);
      expect(FG_COLORS['brightWhite']).toBe(97);
    });
  });

  describe('BG_COLORS', () => {
    it('contains all 16 standard background colors', () => {
      expect(Object.keys(BG_COLORS)).toHaveLength(16);
      expect(BG_COLORS['black']).toBe(40);
      expect(BG_COLORS['white']).toBe(47);
      expect(BG_COLORS['brightBlack']).toBe(100);
      expect(BG_COLORS['brightWhite']).toBe(107);
    });
  });

  describe('constants', () => {
    it('exports correct ANSI attribute codes', () => {
      expect(BOLD).toBe('\x1b[1m');
      expect(DIM).toBe('\x1b[2m');
      expect(ITALIC).toBe('\x1b[3m');
      expect(UNDERLINE).toBe('\x1b[4m');
      expect(STRIKETHROUGH).toBe('\x1b[9m');
      expect(RESET).toBe('\x1b[0m');
    });
  });

  describe('parseHex', () => {
    it('parses 6-digit hex color', () => {
      expect(parseHex('#FF6B6B')).toEqual([255, 107, 107]);
    });

    it('parses 3-digit hex color', () => {
      expect(parseHex('#F00')).toEqual([255, 0, 0]);
    });

    it('handles hex without #', () => {
      expect(parseHex('00FF00')).toEqual([0, 255, 0]);
    });

    it('parses black', () => {
      expect(parseHex('#000000')).toEqual([0, 0, 0]);
    });

    it('parses white', () => {
      expect(parseHex('#FFFFFF')).toEqual([255, 255, 255]);
    });
  });

  describe('rgbTo256', () => {
    it('maps black to index 16', () => {
      expect(rgbTo256(0, 0, 0)).toBe(16);
    });

    it('maps white to index 231', () => {
      expect(rgbTo256(255, 255, 255)).toBe(231);
    });

    it('maps grayscale to grayscale ramp', () => {
      const idx = rgbTo256(128, 128, 128);
      expect(idx).toBeGreaterThanOrEqual(232);
      expect(idx).toBeLessThanOrEqual(255);
    });

    it('maps pure red to red in color cube', () => {
      const idx = rgbTo256(255, 0, 0);
      // Should be 16 + 36*5 + 6*0 + 0 = 196
      expect(idx).toBe(196);
    });

    it('maps pure green to green in color cube', () => {
      const idx = rgbTo256(0, 255, 0);
      // Should be 16 + 36*0 + 6*5 + 0 = 46
      expect(idx).toBe(46);
    });

    it('maps pure blue to blue in color cube', () => {
      const idx = rgbTo256(0, 0, 255);
      // Should be 16 + 36*0 + 6*0 + 5 = 21
      expect(idx).toBe(21);
    });
  });

  describe('rgbTo16Fg', () => {
    it('maps dark colors to non-bright ANSI codes', () => {
      const code = rgbTo16Fg(128, 0, 0); // dark red
      expect(code).toBe(31); // red
    });

    it('maps bright colors to bright ANSI codes', () => {
      const code = rgbTo16Fg(255, 100, 100); // bright red-ish
      expect(code).toBe(91); // brightRed
    });

    it('maps very dark to black', () => {
      const code = rgbTo16Fg(10, 10, 10);
      expect(code).toBe(30); // black
    });
  });

  describe('index256ToRgb', () => {
    it('converts color cube index to RGB', () => {
      // index 196 = 16 + 36*5 + 6*0 + 0 = pure red (255, 0, 0)
      expect(index256ToRgb(196)).toEqual([255, 0, 0]);
    });

    it('converts grayscale index to RGB', () => {
      // index 232 = first grayscale = (232-232)*10+8 = 8
      expect(index256ToRgb(232)).toEqual([8, 8, 8]);
      // index 255 = last grayscale = (255-232)*10+8 = 238
      expect(index256ToRgb(255)).toEqual([238, 238, 238]);
    });

    it('converts mid-range color cube index', () => {
      // index 16 = 16 + 36*0 + 6*0 + 0 = black in cube (0, 0, 0)
      expect(index256ToRgb(16)).toEqual([0, 0, 0]);
    });
  });

  describe('fgSequence', () => {
    it('returns empty string for none color level', () => {
      expect(fgSequence('red', 'none')).toBe('');
    });

    it('generates 16-color named foreground', () => {
      expect(fgSequence('red', '16')).toBe('\x1b[31m');
      expect(fgSequence('brightCyan', '16')).toBe('\x1b[96m');
    });

    it('generates 256-color foreground', () => {
      expect(fgSequence('196', '256')).toBe('\x1b[38;5;196m');
    });

    it('generates truecolor foreground from hex', () => {
      expect(fgSequence('#FF0000', 'truecolor')).toBe('\x1b[38;2;255;0;0m');
    });

    it('downgrades hex to 256-color when level is 256', () => {
      const seq = fgSequence('#FF0000', '256');
      expect(seq.startsWith('\x1b[38;5;')).toBe(true);
      expect(seq.endsWith('m')).toBe(true);
    });

    it('downgrades hex to 16-color when level is 16', () => {
      const seq = fgSequence('#FF0000', '16');
      expect(seq.startsWith('\x1b[')).toBe(true);
      expect(seq.endsWith('m')).toBe(true);
    });

    it('returns empty string for unknown color', () => {
      expect(fgSequence('notacolor', '16')).toBe('');
    });

    it('downgrades 256-color indices 16-255 to valid 16-color codes', () => {
      // Index 196 = red in color cube; downgrade should produce a valid ANSI code (30-37 or 90-97)
      const seq = fgSequence('196', '16');
      // eslint-disable-next-line no-control-regex
      const match = seq.match(/^\x1b\[(\d+)m$/);
      expect(match).not.toBeNull();
      const code = Number(match![1]);
      expect(code >= 30 && code <= 37 || code >= 90 && code <= 97).toBe(true);
    });

    it('downgrades grayscale 256-color to valid 16-color codes', () => {
      const seq = fgSequence('240', '16');
      // eslint-disable-next-line no-control-regex
      const match = seq.match(/^\x1b\[(\d+)m$/);
      expect(match).not.toBeNull();
      const code = Number(match![1]);
      expect(code >= 30 && code <= 37 || code >= 90 && code <= 97).toBe(true);
    });
  });

  describe('bgSequence', () => {
    it('returns empty string for none color level', () => {
      expect(bgSequence('red', 'none')).toBe('');
    });

    it('generates 16-color named background', () => {
      expect(bgSequence('red', '16')).toBe('\x1b[41m');
      expect(bgSequence('brightBlue', '256')).toBe('\x1b[104m');
    });

    it('generates 256-color background', () => {
      expect(bgSequence('232', '256')).toBe('\x1b[48;5;232m');
    });

    it('generates truecolor background from hex', () => {
      expect(bgSequence('#00FF00', 'truecolor')).toBe('\x1b[48;2;0;255;0m');
    });

    it('downgrades 256-color bg indices 16-255 to valid 16-color codes', () => {
      const seq = bgSequence('196', '16');
      // eslint-disable-next-line no-control-regex
      const match = seq.match(/^\x1b\[(\d+)m$/);
      expect(match).not.toBeNull();
      const code = Number(match![1]);
      expect(code >= 40 && code <= 47 || code >= 100 && code <= 107).toBe(true);
    });
  });

  describe('applyStyle', () => {
    it('returns text unchanged for empty style', () => {
      expect(applyStyle('hello', {}, 'truecolor')).toBe('hello');
    });

    it('applies bold', () => {
      const result = applyStyle('hello', { bold: true }, 'truecolor');
      expect(result).toBe(`${BOLD}hello${RESET}`);
    });

    it('applies dim', () => {
      const result = applyStyle('hello', { dim: true }, 'truecolor');
      expect(result).toBe(`${DIM}hello${RESET}`);
    });

    it('applies italic', () => {
      const result = applyStyle('hello', { italic: true }, 'truecolor');
      expect(result).toBe(`${ITALIC}hello${RESET}`);
    });

    it('applies underline', () => {
      const result = applyStyle('hello', { underline: true }, 'truecolor');
      expect(result).toBe(`${UNDERLINE}hello${RESET}`);
    });

    it('applies strikethrough', () => {
      const result = applyStyle('hello', { strikethrough: true }, 'truecolor');
      expect(result).toBe(`${STRIKETHROUGH}hello${RESET}`);
    });

    it('combines multiple attributes', () => {
      const result = applyStyle('hello', { bold: true, italic: true }, 'truecolor');
      expect(result).toBe(`${BOLD}${ITALIC}hello${RESET}`);
    });

    it('applies foreground color', () => {
      const result = applyStyle('hello', { fg: 'red' }, 'truecolor');
      expect(result).toContain('\x1b[31m');
      expect(result).toContain('hello');
      expect(result.endsWith(RESET)).toBe(true);
    });

    it('applies background color', () => {
      const result = applyStyle('hello', { bg: 'blue' }, 'truecolor');
      expect(result).toContain('\x1b[44m');
      expect(result).toContain('hello');
    });

    it('applies color with attributes', () => {
      const style: Style = { fg: 'cyan', bold: true, dim: true };
      const result = applyStyle('test', style, '16');
      expect(result).toContain(BOLD);
      expect(result).toContain(DIM);
      expect(result).toContain('\x1b[36m'); // cyan fg
      expect(result).toContain('test');
    });

    it('applies hex truecolor', () => {
      const result = applyStyle('hi', { fg: '#FF6B6B' }, 'truecolor');
      expect(result).toContain('\x1b[38;2;255;107;107m');
    });

    it('applies text attributes even with none color level', () => {
      const result = applyStyle('hi', { bold: true, fg: 'red' }, 'none');
      expect(result).toContain(BOLD);
      expect(result).not.toContain('\x1b[31m');
    });

    it('skips color codes but keeps attributes with none level', () => {
      const style: Style = { bold: true, italic: true, fg: '#FF0000', bg: 'blue' };
      const result = applyStyle('text', style, 'none');
      expect(result).toBe(`${BOLD}${ITALIC}text${RESET}`);
    });
  });

  describe('stripAnsi', () => {
    it('removes bold/reset codes', () => {
      expect(stripAnsi(`${BOLD}hello${RESET}`)).toBe('hello');
    });

    it('removes color codes', () => {
      expect(stripAnsi('\x1b[31mhello\x1b[0m')).toBe('hello');
    });

    it('removes 256-color codes', () => {
      expect(stripAnsi('\x1b[38;5;196mhello\x1b[0m')).toBe('hello');
    });

    it('removes truecolor codes', () => {
      expect(stripAnsi('\x1b[38;2;255;0;0mhello\x1b[0m')).toBe('hello');
    });

    it('removes multiple codes', () => {
      const styled = `${BOLD}${DIM}\x1b[31mhello\x1b[0m world${RESET}`;
      expect(stripAnsi(styled)).toBe('hello world');
    });

    it('returns plain text unchanged', () => {
      expect(stripAnsi('hello world')).toBe('hello world');
    });

    it('handles empty string', () => {
      expect(stripAnsi('')).toBe('');
    });
  });

  describe('visibleLength', () => {
    it('returns length of plain text', () => {
      expect(visibleLength('hello')).toBe(5);
    });

    it('excludes ANSI codes from length', () => {
      expect(visibleLength(`${BOLD}hello${RESET}`)).toBe(5);
    });

    it('handles complex styled text', () => {
      const styled = applyStyle('test', { fg: '#FF0000', bold: true }, 'truecolor');
      expect(visibleLength(styled)).toBe(4);
    });

    it('returns 0 for empty string', () => {
      expect(visibleLength('')).toBe(0);
    });
  });
});
