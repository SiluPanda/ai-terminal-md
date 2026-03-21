import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveTheme, detectTheme, getTheme, hasColor } from '../theme';
import type { Theme, ThemeName, Style } from '../types';

/** All keys that a complete Theme must have. */
const allThemeKeys: (keyof Theme)[] = [
  'heading1', 'heading2', 'heading3', 'heading4', 'heading5', 'heading6',
  'headingUnderline',
  'body', 'bold', 'italic', 'strikethrough', 'link', 'linkUrl',
  'codeBackground', 'codeLanguageLabel', 'codeLineNumber', 'inlineCode',
  'syntaxKeyword', 'syntaxString', 'syntaxNumber', 'syntaxComment',
  'syntaxOperator', 'syntaxType', 'syntaxFunction', 'syntaxVariable',
  'syntaxConstant', 'syntaxPunctuation', 'syntaxAttribute', 'syntaxTag',
  'syntaxProperty',
  'blockquoteBorder', 'blockquoteText', 'horizontalRule',
  'listBullet', 'listNumber', 'tableBorder', 'tableHeader',
  'thinkingHeader', 'thinkingBorder', 'thinkingText',
  'artifactBorder', 'artifactTitle',
  'toolUseBorder', 'toolUseHeader', 'toolUseKey', 'toolUseValue',
  'toolResultBorder', 'toolResultHeader', 'toolResultSuccess', 'toolResultError',
  'citation', 'semanticLabel',
];

function assertCompleteTheme(theme: Theme): void {
  for (const key of allThemeKeys) {
    expect(theme[key]).toBeDefined();
    expect(typeof theme[key]).toBe('object');
  }
}

describe('theme', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.AI_TERMINAL_MD_THEME;
    delete process.env.COLORFGBG;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('dark theme', () => {
    it('is a complete theme with all required keys', () => {
      assertCompleteTheme(getTheme('dark'));
    });

    it('has bright white bold heading1', () => {
      const theme = getTheme('dark');
      expect(theme.heading1.fg).toBe('brightWhite');
      expect(theme.heading1.bold).toBe(true);
    });

    it('has bright cyan bold heading2', () => {
      const theme = getTheme('dark');
      expect(theme.heading2.fg).toBe('brightCyan');
      expect(theme.heading2.bold).toBe(true);
    });

    it('has yellow bold heading3', () => {
      const theme = getTheme('dark');
      expect(theme.heading3.fg).toBe('yellow');
      expect(theme.heading3.bold).toBe(true);
    });

    it('has green bold heading4', () => {
      const theme = getTheme('dark');
      expect(theme.heading4.fg).toBe('green');
      expect(theme.heading4.bold).toBe(true);
    });

    it('has dim white bold heading5', () => {
      const theme = getTheme('dark');
      expect(theme.heading5.bold).toBe(true);
      expect(theme.heading5.dim).toBe(true);
    });

    it('has dim bold heading6', () => {
      const theme = getTheme('dark');
      expect(theme.heading6.bold).toBe(true);
      expect(theme.heading6.dim).toBe(true);
    });

    it('uses magenta for keywords', () => {
      expect(getTheme('dark').syntaxKeyword.fg).toBe('magenta');
    });

    it('uses green for strings', () => {
      expect(getTheme('dark').syntaxString.fg).toBe('green');
    });

    it('uses yellow for numbers', () => {
      expect(getTheme('dark').syntaxNumber.fg).toBe('yellow');
    });

    it('uses dim for comments', () => {
      expect(getTheme('dark').syntaxComment.dim).toBe(true);
    });

    it('uses cyan for operators', () => {
      expect(getTheme('dark').syntaxOperator.fg).toBe('cyan');
    });

    it('uses blue for types', () => {
      expect(getTheme('dark').syntaxType.fg).toBe('blue');
    });

    it('has dimmed thinking text', () => {
      expect(getTheme('dark').thinkingText.dim).toBe(true);
    });
  });

  describe('light theme', () => {
    it('is a complete theme with all required keys', () => {
      assertCompleteTheme(getTheme('light'));
    });

    it('uses blue bold heading1 (not bright white)', () => {
      const theme = getTheme('light');
      expect(theme.heading1.fg).toBe('blue');
      expect(theme.heading1.bold).toBe(true);
    });

    it('uses black for body text', () => {
      expect(getTheme('light').body.fg).toBe('black');
    });

    it('avoids yellow for heading3 (hard to read on light bg)', () => {
      expect(getTheme('light').heading3.fg).not.toBe('yellow');
    });

    it('uses lighter backgrounds for code', () => {
      const theme = getTheme('light');
      expect(theme.codeBackground.bg).toBeDefined();
      expect(theme.inlineCode.bg).toBeDefined();
    });
  });

  describe('minimal theme', () => {
    it('is a complete theme with all required keys', () => {
      assertCompleteTheme(getTheme('minimal'));
    });

    it('uses only bold/dim for headings, no fg color', () => {
      const theme = getTheme('minimal');
      for (let i = 1; i <= 6; i++) {
        const heading = theme[`heading${i}` as keyof Theme] as Style;
        expect(heading.fg).toBeUndefined();
      }
    });

    it('has no fg color on body text', () => {
      expect(getTheme('minimal').body.fg).toBeUndefined();
    });

    it('still uses background for code blocks', () => {
      expect(getTheme('minimal').codeBackground.bg).toBeDefined();
    });

    it('uses bold not color for syntax keywords', () => {
      const kw = getTheme('minimal').syntaxKeyword;
      expect(kw.bold).toBe(true);
      expect(kw.fg).toBeUndefined();
    });

    it('has no fg colors on syntax highlighting elements', () => {
      const theme = getTheme('minimal');
      const syntaxKeys = [
        'syntaxKeyword', 'syntaxString', 'syntaxNumber', 'syntaxComment',
        'syntaxOperator', 'syntaxType', 'syntaxFunction', 'syntaxVariable',
        'syntaxConstant', 'syntaxPunctuation', 'syntaxAttribute', 'syntaxTag',
        'syntaxProperty',
      ] as const;
      for (const key of syntaxKeys) {
        expect(theme[key].fg).toBeUndefined();
      }
    });
  });

  describe('monochrome theme', () => {
    it('is a complete theme with all required keys', () => {
      assertCompleteTheme(getTheme('monochrome'));
    });

    it('has no color codes at all', () => {
      const theme = getTheme('monochrome');
      for (const key of allThemeKeys) {
        const style = theme[key];
        expect(style.fg).toBeUndefined();
        expect(style.bg).toBeUndefined();
      }
    });

    it('distinguishes elements by text decoration only', () => {
      const theme = getTheme('monochrome');
      expect(theme.heading1.bold).toBe(true);
      expect(theme.syntaxString.italic).toBe(true);
      expect(theme.syntaxType.underline).toBe(true);
      expect(theme.syntaxComment.dim).toBe(true);
    });

    it('uses bold for inline code (no background)', () => {
      const theme = getTheme('monochrome');
      expect(theme.inlineCode.bold).toBe(true);
      expect(theme.inlineCode.bg).toBeUndefined();
    });
  });

  describe('resolveTheme', () => {
    it('returns dark theme by default when no env vars set', () => {
      const theme = resolveTheme();
      expect(theme.heading1.fg).toBe('brightWhite');
    });

    it('returns a built-in theme by name', () => {
      const theme = resolveTheme('light');
      expect(theme.heading1.fg).toBe('blue');
      expect(theme.body.fg).toBe('black');
    });

    it('returns each built-in theme by name', () => {
      const names: ThemeName[] = ['dark', 'light', 'minimal', 'monochrome'];
      for (const name of names) {
        const theme = resolveTheme(name);
        assertCompleteTheme(theme);
      }
    });

    it('merges partial theme onto dark base by default', () => {
      const theme = resolveTheme({
        heading1: { fg: 'red', bold: true },
      });
      // Custom override applied
      expect(theme.heading1.fg).toBe('red');
      // Other values from dark base
      expect(theme.heading2.fg).toBe('brightCyan');
      expect(theme.syntaxKeyword.fg).toBe('magenta');
    });

    it('merges partial theme onto specified base theme', () => {
      const theme = resolveTheme({
        baseTheme: 'light',
        heading1: { fg: 'red', bold: true },
      });
      // Custom override applied
      expect(theme.heading1.fg).toBe('red');
      // Other values from light base
      expect(theme.body.fg).toBe('black');
    });

    it('returns complete theme even with minimal overrides', () => {
      const theme = resolveTheme({ heading1: { bold: true } });
      assertCompleteTheme(theme);
    });

    it('overrides multiple elements at once', () => {
      const theme = resolveTheme({
        heading1: { fg: '#FF0000', bold: true },
        syntaxKeyword: { fg: '#FF6B6B' },
        thinkingText: { dim: true, italic: true },
      });
      expect(theme.heading1.fg).toBe('#FF0000');
      expect(theme.syntaxKeyword.fg).toBe('#FF6B6B');
      expect(theme.thinkingText.italic).toBe(true);
    });

    it('uses dark theme as base when baseTheme is omitted in partial', () => {
      const dark = getTheme('dark');
      const theme = resolveTheme({ heading1: { fg: 'red' } });
      expect(theme.heading2).toEqual(dark.heading2);
      expect(theme.body).toEqual(dark.body);
    });
  });

  describe('detectTheme', () => {
    it('returns dark theme by default', () => {
      const theme = detectTheme();
      expect(theme.heading1.fg).toBe('brightWhite');
    });

    it('returns theme from AI_TERMINAL_MD_THEME env var', () => {
      process.env.AI_TERMINAL_MD_THEME = 'light';
      const theme = detectTheme();
      expect(theme.heading1.fg).toBe('blue');
      expect(theme.body.fg).toBe('black');
    });

    it('returns minimal theme from env var', () => {
      process.env.AI_TERMINAL_MD_THEME = 'minimal';
      const theme = detectTheme();
      expect(theme.heading1.fg).toBeUndefined();
      expect(theme.heading1.bold).toBe(true);
    });

    it('returns monochrome theme from env var', () => {
      process.env.AI_TERMINAL_MD_THEME = 'monochrome';
      const theme = detectTheme();
      for (const key of allThemeKeys) {
        expect(theme[key].fg).toBeUndefined();
        expect(theme[key].bg).toBeUndefined();
      }
    });

    it('ignores invalid AI_TERMINAL_MD_THEME values', () => {
      process.env.AI_TERMINAL_MD_THEME = 'neon';
      const theme = detectTheme();
      // Falls through to default dark
      expect(theme.heading1.fg).toBe('brightWhite');
    });

    it('detects light theme from COLORFGBG with bg >= 8', () => {
      process.env.COLORFGBG = '0;15';
      const theme = detectTheme();
      expect(theme.heading1.fg).toBe('blue');
      expect(theme.body.fg).toBe('black');
    });

    it('detects dark theme from COLORFGBG with bg < 8', () => {
      process.env.COLORFGBG = '15;0';
      const theme = detectTheme();
      expect(theme.heading1.fg).toBe('brightWhite');
    });

    it('detects light theme from COLORFGBG with bg = 8', () => {
      process.env.COLORFGBG = '0;8';
      const theme = detectTheme();
      expect(theme.heading1.fg).toBe('blue');
    });

    it('handles COLORFGBG with three parts (rxvt format)', () => {
      process.env.COLORFGBG = '0;0;15';
      const theme = detectTheme();
      // Last part is 15 (>= 8) → light
      expect(theme.body.fg).toBe('black');
    });

    it('falls back to dark on malformed COLORFGBG', () => {
      process.env.COLORFGBG = 'invalid';
      const theme = detectTheme();
      expect(theme.heading1.fg).toBe('brightWhite');
    });

    it('AI_TERMINAL_MD_THEME takes priority over COLORFGBG', () => {
      process.env.AI_TERMINAL_MD_THEME = 'monochrome';
      process.env.COLORFGBG = '0;15'; // Would indicate light
      const theme = detectTheme();
      // monochrome wins
      for (const key of allThemeKeys) {
        expect(theme[key].fg).toBeUndefined();
      }
    });
  });

  describe('getTheme', () => {
    it('returns dark theme', () => {
      const theme = getTheme('dark');
      expect(theme.heading1.fg).toBe('brightWhite');
    });

    it('returns light theme', () => {
      const theme = getTheme('light');
      expect(theme.heading1.fg).toBe('blue');
    });

    it('returns minimal theme', () => {
      const theme = getTheme('minimal');
      expect(theme.heading1.bold).toBe(true);
      expect(theme.heading1.fg).toBeUndefined();
    });

    it('returns monochrome theme', () => {
      const theme = getTheme('monochrome');
      expect(theme.heading1.bold).toBe(true);
      expect(theme.heading1.fg).toBeUndefined();
    });
  });

  describe('hasColor', () => {
    it('returns false for style with no fg or bg', () => {
      expect(hasColor({ bold: true, dim: true })).toBe(false);
    });

    it('returns true for style with fg', () => {
      expect(hasColor({ fg: 'red' })).toBe(true);
    });

    it('returns true for style with bg', () => {
      expect(hasColor({ bg: '#1e1e1e' })).toBe(true);
    });

    it('returns true for style with both fg and bg', () => {
      expect(hasColor({ fg: 'cyan', bg: '#000' })).toBe(true);
    });

    it('returns false for empty style', () => {
      expect(hasColor({})).toBe(false);
    });
  });
});
