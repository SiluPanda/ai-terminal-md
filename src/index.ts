// ai-terminal-md - Terminal renderer optimized for AI markdown patterns

// Type exports
export type {
  Style,
  Theme,
  ThemeName,
  TokenCategory,
  HighlightToken,
  CustomHighlighter,
  RendererConfig,
  RenderOptions,
  StreamState,
  AITerminalRenderer,
} from './types';

// ANSI utilities
export { applyStyle, stripAnsi, visibleLength } from './ansi';

// Terminal capability detection
export {
  detectColorLevel,
  detectUnicode,
  getWidth,
  isTTY,
  getBoxChars,
} from './terminal';
export type { BoxChars } from './terminal';

// Word wrapping
export { wordWrap } from './wrap';

// Theme system
export { resolveTheme, detectTheme, getTheme, hasColor } from './theme';

// Renderer
export { render, createRenderer } from './renderer';
