import { describe, it, expect } from 'vitest';
import type {
  Style,
  Theme,
  ThemeName,
  TokenCategory,
  HighlightToken,
  CustomHighlighter,
  RendererConfig,
  RenderOptions,
  StreamState,
} from '../types';

describe('types', () => {
  describe('Style', () => {
    it('allows all optional fields', () => {
      const style: Style = {};
      expect(style).toEqual({});
    });

    it('accepts full style definition', () => {
      const style: Style = {
        fg: 'red',
        bg: '#FF0000',
        bold: true,
        dim: false,
        italic: true,
        underline: false,
        strikethrough: true,
      };
      expect(style.fg).toBe('red');
      expect(style.bold).toBe(true);
    });

    it('accepts hex color strings', () => {
      const style: Style = { fg: '#FF6B6B', bg: '#1A1A2E' };
      expect(style.fg).toBe('#FF6B6B');
    });

    it('accepts 256-color index strings', () => {
      const style: Style = { fg: '196', bg: '232' };
      expect(style.fg).toBe('196');
    });
  });

  describe('ThemeName', () => {
    it('accepts valid theme names', () => {
      const names: ThemeName[] = ['dark', 'light', 'minimal', 'monochrome'];
      expect(names).toHaveLength(4);
    });
  });

  describe('TokenCategory', () => {
    it('accepts all valid categories', () => {
      const categories: TokenCategory[] = [
        'keyword', 'string', 'number', 'comment', 'operator',
        'type', 'function', 'variable', 'constant', 'punctuation',
        'attribute', 'tag', 'property', 'plain',
      ];
      expect(categories).toHaveLength(14);
    });
  });

  describe('HighlightToken', () => {
    it('requires text and category', () => {
      const token: HighlightToken = { text: 'const', category: 'keyword' };
      expect(token.text).toBe('const');
      expect(token.category).toBe('keyword');
    });
  });

  describe('CustomHighlighter', () => {
    it('defines highlight method', () => {
      const highlighter: CustomHighlighter = {
        highlight(code: string, _language: string): HighlightToken[] {
          return [{ text: code, category: 'plain' }];
        },
      };
      const tokens = highlighter.highlight('x = 1', 'python');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].category).toBe('plain');
    });
  });

  describe('RendererConfig', () => {
    it('allows empty config (all defaults)', () => {
      const config: RendererConfig = {};
      expect(config).toEqual({});
    });

    it('accepts all config options', () => {
      const config: RendererConfig = {
        theme: 'dark',
        width: 120,
        colorLevel: 'truecolor',
        unicode: true,
        thinking: 'dim',
        artifacts: 'panel',
        toolUse: 'box',
        toolResult: 'box',
        semanticWrappers: 'strip',
        citations: 'color',
        codeBackground: true,
        codeLineNumbers: false,
        codeLanguageLabel: true,
        codePadding: 2,
        tableStyle: 'unicode',
        showLinkUrls: true,
        wordWrap: true,
        margin: 2,
      };
      expect(config.width).toBe(120);
      expect(config.colorLevel).toBe('truecolor');
    });

    it('accepts custom theme with partial overrides', () => {
      const config: RendererConfig = {
        theme: {
          baseTheme: 'light',
          heading1: { fg: 'blue', bold: true },
        },
      };
      expect(config.theme).toBeDefined();
    });

    it('accepts custom highlighter in config', () => {
      const config: RendererConfig = {
        highlighter: {
          highlight: () => [],
        },
      };
      expect(config.highlighter).toBeDefined();
    });
  });

  describe('RenderOptions', () => {
    it('extends RendererConfig', () => {
      const options: RenderOptions = { theme: 'minimal', width: 80 };
      // RenderOptions is assignable to RendererConfig
      const config: RendererConfig = options;
      expect(config.theme).toBe('minimal');
    });
  });

  describe('StreamState', () => {
    it('has buffer, openCodeBlock, codeLang, openThinkingBlock fields', () => {
      const state: StreamState = {
        buffer: '',
        openCodeBlock: false,
        codeLang: '',
        openThinkingBlock: false,
      };
      expect(state.buffer).toBe('');
      expect(state.openCodeBlock).toBe(false);
      expect(state.codeLang).toBe('');
      expect(state.openThinkingBlock).toBe(false);
    });
  });

  describe('Theme', () => {
    it('requires all element style keys', () => {
      const theme: Theme = {
        heading1: { fg: 'brightWhite', bold: true },
        heading2: { fg: 'brightCyan', bold: true },
        heading3: { fg: 'yellow', bold: true },
        heading4: { fg: 'green', bold: true },
        heading5: { fg: 'white', bold: true, dim: true },
        heading6: { bold: true, dim: true },
        headingUnderline: { dim: true },
        body: {},
        bold: { bold: true },
        italic: { italic: true },
        strikethrough: { strikethrough: true },
        link: { underline: true },
        linkUrl: { dim: true },
        codeBackground: { bg: 'brightBlack' },
        codeLanguageLabel: { dim: true },
        codeLineNumber: { dim: true },
        inlineCode: { bg: 'brightBlack' },
        syntaxKeyword: { fg: 'magenta' },
        syntaxString: { fg: 'green' },
        syntaxNumber: { fg: 'yellow' },
        syntaxComment: { fg: 'brightBlack', dim: true },
        syntaxOperator: { fg: 'cyan' },
        syntaxType: { fg: 'blue' },
        syntaxFunction: { fg: 'yellow' },
        syntaxVariable: {},
        syntaxConstant: { fg: 'brightRed' },
        syntaxPunctuation: { dim: true },
        syntaxAttribute: { fg: 'cyan' },
        syntaxTag: { fg: 'red' },
        syntaxProperty: { fg: 'cyan' },
        blockquoteBorder: { dim: true },
        blockquoteText: { dim: true },
        horizontalRule: { dim: true },
        listBullet: { fg: 'cyan' },
        listNumber: { fg: 'cyan' },
        tableBorder: { dim: true },
        tableHeader: { bold: true },
        thinkingHeader: { dim: true, italic: true },
        thinkingBorder: { dim: true },
        thinkingText: { dim: true },
        artifactBorder: { fg: 'cyan' },
        artifactTitle: { bold: true },
        toolUseBorder: { fg: 'yellow' },
        toolUseHeader: { bold: true },
        toolUseKey: { fg: 'cyan' },
        toolUseValue: {},
        toolResultBorder: { fg: 'green' },
        toolResultHeader: { bold: true },
        toolResultSuccess: { fg: 'green' },
        toolResultError: { fg: 'red' },
        citation: { fg: 'cyan' },
        semanticLabel: { dim: true, italic: true },
      };
      expect(Object.keys(theme)).toHaveLength(52);
    });
  });
});
