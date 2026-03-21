import { describe, it, expect, afterEach } from 'vitest';
import { render, createRenderer } from '../renderer';
import { resolveConfig } from '../renderer';
import { stripAnsi, BOLD } from '../ansi';

describe('renderer', () => {
  describe('render() convenience function', () => {
    it('renders markdown to ANSI string', () => {
      const result = render('# Hello', {
        colorLevel: 'truecolor',
        width: 80,
      });
      expect(result).toContain('Hello');
      expect(result).toContain(BOLD);
    });

    it('returns string for simple input', () => {
      const result = render('Hello world', { colorLevel: 'none' });
      expect(typeof result).toBe('string');
      expect(stripAnsi(result)).toContain('Hello world');
    });

    it('works with no options', () => {
      const result = render('test');
      expect(typeof result).toBe('string');
    });
  });

  describe('createRenderer()', () => {
    it('returns an object implementing AITerminalRenderer', () => {
      const renderer = createRenderer({ colorLevel: 'none', width: 80 });
      expect(renderer).toBeDefined();
      expect(typeof renderer.render).toBe('function');
      expect(typeof renderer.renderStream).toBe('function');
      expect(typeof renderer.renderChunk).toBe('function');
      expect(typeof renderer.flush).toBe('function');
      expect(renderer.config).toBeDefined();
    });

    it('render() produces ANSI output', () => {
      const renderer = createRenderer({
        colorLevel: 'truecolor',
        width: 80,
        theme: 'dark',
      });
      const result = renderer.render('# Test');
      expect(result).toContain('Test');
      expect(result).toContain(BOLD);
    });

    it('config is frozen', () => {
      const renderer = createRenderer({ width: 80 });
      expect(Object.isFrozen(renderer.config)).toBe(true);
    });

    it('renderStream throws not implemented', () => {
      const renderer = createRenderer();
      const stream = (async function* () { yield 'test'; })();
      expect(() => renderer.renderStream(stream)).toThrow('not yet implemented');
    });

    it('renderChunk throws not implemented', () => {
      const renderer = createRenderer();
      expect(() => renderer.renderChunk('test')).toThrow('not yet implemented');
    });

    it('flush throws not implemented', () => {
      const renderer = createRenderer();
      expect(() => renderer.flush({ _internal: null })).toThrow('not yet implemented');
    });
  });

  describe('resolveConfig()', () => {
    it('uses dark theme by default', () => {
      const config = resolveConfig();
      expect(config.theme.heading1.fg).toBe('brightWhite');
    });

    it('resolves named theme', () => {
      const config = resolveConfig({ theme: 'light' });
      expect(config.theme.heading1.fg).toBe('blue');
    });

    it('uses explicit width over auto-detected', () => {
      const config = resolveConfig({ width: 120 });
      expect(config.width).toBe(120);
    });

    it('uses explicit colorLevel', () => {
      const config = resolveConfig({ colorLevel: 'none' });
      expect(config.colorLevel).toBe('none');
    });

    it('defaults wordWrap to true', () => {
      const config = resolveConfig();
      expect(config.wordWrapEnabled).toBe(true);
    });

    it('sets wordWrap to false when disabled', () => {
      const config = resolveConfig({ wordWrap: false });
      expect(config.wordWrapEnabled).toBe(false);
    });

    it('defaults margin to 0', () => {
      const config = resolveConfig();
      expect(config.margin).toBe(0);
    });

    it('uses explicit margin', () => {
      const config = resolveConfig({ margin: 4 });
      expect(config.margin).toBe(4);
    });

    it('defaults codeBackground to true', () => {
      const config = resolveConfig();
      expect(config.codeBackground).toBe(true);
    });

    it('defaults codeLineNumbers to false', () => {
      const config = resolveConfig();
      expect(config.codeLineNumbers).toBe(false);
    });

    it('defaults codePadding to 1', () => {
      const config = resolveConfig();
      expect(config.codePadding).toBe(1);
    });

    it('defaults showLinkUrls to true', () => {
      const config = resolveConfig();
      expect(config.showLinkUrls).toBe(true);
    });

    it('defaults tableStyle to unicode', () => {
      const config = resolveConfig();
      expect(config.tableStyle).toBe('unicode');
    });

    it('defaults unicode to auto-detected value', () => {
      const config = resolveConfig();
      expect(typeof config.unicode).toBe('boolean');
    });
  });

  describe('AI_TERMINAL_MD_WIDTH env var', () => {
    const originalEnv = process.env.AI_TERMINAL_MD_WIDTH;

    afterEach(() => {
      if (originalEnv === undefined) {
        delete process.env.AI_TERMINAL_MD_WIDTH;
      } else {
        process.env.AI_TERMINAL_MD_WIDTH = originalEnv;
      }
    });

    it('uses width from env var when no explicit width', () => {
      process.env.AI_TERMINAL_MD_WIDTH = '100';
      const config = resolveConfig();
      expect(config.width).toBe(100);
    });

    it('explicit width overrides env var', () => {
      process.env.AI_TERMINAL_MD_WIDTH = '100';
      const config = resolveConfig({ width: 60 });
      expect(config.width).toBe(60);
    });
  });
});
