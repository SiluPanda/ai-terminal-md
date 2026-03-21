import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  detectColorLevel,
  detectUnicode,
  getWidth,
  isTTY,
  getBoxChars,
} from '../terminal';

describe('terminal', () => {
  const originalEnv = process.env;
  beforeEach(() => {
    process.env = { ...originalEnv };
    // Clear relevant env vars
    delete process.env.FORCE_COLOR;
    delete process.env.NO_COLOR;
    delete process.env.COLORTERM;
    delete process.env.TERM;
    delete process.env.LANG;
    delete process.env.LC_ALL;
    delete process.env.LC_CTYPE;
    delete process.env.WT_SESSION;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('detectColorLevel', () => {
    it('returns "none" when FORCE_COLOR=0', () => {
      process.env.FORCE_COLOR = '0';
      expect(detectColorLevel()).toBe('none');
    });

    it('returns "16" when FORCE_COLOR=1', () => {
      process.env.FORCE_COLOR = '1';
      expect(detectColorLevel()).toBe('16');
    });

    it('returns "256" when FORCE_COLOR=2', () => {
      process.env.FORCE_COLOR = '2';
      expect(detectColorLevel()).toBe('256');
    });

    it('returns "truecolor" when FORCE_COLOR=3', () => {
      process.env.FORCE_COLOR = '3';
      expect(detectColorLevel()).toBe('truecolor');
    });

    it('FORCE_COLOR takes priority over NO_COLOR', () => {
      process.env.FORCE_COLOR = '3';
      process.env.NO_COLOR = '';
      expect(detectColorLevel()).toBe('truecolor');
    });

    it('returns "none" when NO_COLOR is set (any value)', () => {
      process.env.NO_COLOR = '';
      expect(detectColorLevel()).toBe('none');
    });

    it('returns "none" when NO_COLOR is set to "1"', () => {
      process.env.NO_COLOR = '1';
      expect(detectColorLevel()).toBe('none');
    });

    it('returns "truecolor" when COLORTERM=truecolor', () => {
      process.env.COLORTERM = 'truecolor';
      expect(detectColorLevel()).toBe('truecolor');
    });

    it('returns "truecolor" when COLORTERM=24bit', () => {
      process.env.COLORTERM = '24bit';
      expect(detectColorLevel()).toBe('truecolor');
    });

    it('returns "256" when TERM contains 256color', () => {
      process.env.TERM = 'xterm-256color';
      expect(detectColorLevel()).toBe('256');
    });

    it('returns "256" for screen-256color', () => {
      process.env.TERM = 'screen-256color';
      expect(detectColorLevel()).toBe('256');
    });

    it('NO_COLOR takes priority over COLORTERM', () => {
      process.env.NO_COLOR = '';
      process.env.COLORTERM = 'truecolor';
      expect(detectColorLevel()).toBe('none');
    });

    it('COLORTERM takes priority over TERM', () => {
      process.env.COLORTERM = 'truecolor';
      process.env.TERM = 'xterm-256color';
      expect(detectColorLevel()).toBe('truecolor');
    });

    it('returns "16" when stdout.isTTY is true and no color env vars', () => {
      // This test depends on the actual TTY state of the test runner.
      // We test the priority chain logic via env vars above.
      // If isTTY is false in CI, this would return 'none'.
      const result = detectColorLevel();
      if (process.stdout.isTTY) {
        expect(result).toBe('16');
      } else {
        expect(result).toBe('none');
      }
    });

    it('returns "16" for unknown FORCE_COLOR values', () => {
      process.env.FORCE_COLOR = 'yes';
      expect(detectColorLevel()).toBe('16');
    });
  });

  describe('detectUnicode', () => {
    it('returns true when LANG contains UTF-8', () => {
      process.env.LANG = 'en_US.UTF-8';
      expect(detectUnicode()).toBe(true);
    });

    it('returns true when LC_ALL contains utf8', () => {
      process.env.LC_ALL = 'en_US.utf8';
      expect(detectUnicode()).toBe(true);
    });

    it('returns true when LC_CTYPE contains UTF-8', () => {
      process.env.LC_CTYPE = 'en_US.UTF-8';
      expect(detectUnicode()).toBe(true);
    });

    it('returns true for xterm-256color TERM', () => {
      process.env.TERM = 'xterm-256color';
      expect(detectUnicode()).toBe(true);
    });

    it('returns true by default (most modern terminals support it)', () => {
      // Clear all relevant env vars
      delete process.env.LANG;
      delete process.env.LC_ALL;
      delete process.env.LC_CTYPE;
      delete process.env.TERM;
      expect(detectUnicode()).toBe(true);
    });

    it('returns true for Windows Terminal (WT_SESSION set)', () => {
      // Simulate win32 platform check — we test the env var logic
      process.env.WT_SESSION = 'some-session-id';
      expect(detectUnicode()).toBe(true);
    });
  });

  describe('getWidth', () => {
    it('returns process.stdout.columns when available', () => {
      const width = getWidth();
      if (process.stdout.columns) {
        expect(width).toBe(process.stdout.columns);
      } else {
        expect(width).toBe(80);
      }
    });

    it('returns a positive number', () => {
      expect(getWidth()).toBeGreaterThan(0);
    });
  });

  describe('isTTY', () => {
    it('returns a boolean', () => {
      expect(typeof isTTY()).toBe('boolean');
    });

    it('matches process.stdout.isTTY', () => {
      expect(isTTY()).toBe(!!process.stdout.isTTY);
    });
  });

  describe('getBoxChars', () => {
    it('returns Unicode characters when unicode is true', () => {
      const chars = getBoxChars(true);
      expect(chars.horizontal).toBe('─');
      expect(chars.vertical).toBe('│');
      expect(chars.topLeft).toBe('┌');
      expect(chars.topRight).toBe('┐');
      expect(chars.bottomLeft).toBe('└');
      expect(chars.bottomRight).toBe('┘');
      expect(chars.leftTee).toBe('├');
      expect(chars.rightTee).toBe('┤');
      expect(chars.topTee).toBe('┬');
      expect(chars.bottomTee).toBe('┴');
      expect(chars.cross).toBe('┼');
      expect(chars.roundTopLeft).toBe('╭');
      expect(chars.roundTopRight).toBe('╮');
      expect(chars.roundBottomLeft).toBe('╰');
      expect(chars.roundBottomRight).toBe('╯');
      expect(chars.doubleHorizontal).toBe('═');
      expect(chars.bullet).toBe('●');
      expect(chars.circle).toBe('○');
      expect(chars.square).toBe('■');
      expect(chars.arrow).toBe('▸');
      expect(chars.checkmark).toBe('✓');
      expect(chars.checkbox).toBe('☐');
    });

    it('returns ASCII characters when unicode is false', () => {
      const chars = getBoxChars(false);
      expect(chars.horizontal).toBe('-');
      expect(chars.vertical).toBe('|');
      expect(chars.topLeft).toBe('+');
      expect(chars.topRight).toBe('+');
      expect(chars.bottomLeft).toBe('+');
      expect(chars.bottomRight).toBe('+');
      expect(chars.leftTee).toBe('+');
      expect(chars.rightTee).toBe('+');
      expect(chars.topTee).toBe('+');
      expect(chars.bottomTee).toBe('+');
      expect(chars.cross).toBe('+');
      expect(chars.roundTopLeft).toBe('+');
      expect(chars.roundTopRight).toBe('+');
      expect(chars.roundBottomLeft).toBe('+');
      expect(chars.roundBottomRight).toBe('+');
      expect(chars.doubleHorizontal).toBe('=');
      expect(chars.bullet).toBe('*');
      expect(chars.circle).toBe('-');
      expect(chars.square).toBe('+');
      expect(chars.arrow).toBe('>');
      expect(chars.checkmark).toBe('[x]');
      expect(chars.checkbox).toBe('[ ]');
    });

    it('Unicode and ASCII sets have the same keys', () => {
      const uKeys = Object.keys(getBoxChars(true)).sort();
      const aKeys = Object.keys(getBoxChars(false)).sort();
      expect(uKeys).toEqual(aKeys);
    });
  });
});
