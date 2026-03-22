import type { Style } from './types';

/** Standard 16 ANSI color names mapped to foreground codes. */
const FG_COLORS: Record<string, number> = {
  black: 30,
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  magenta: 35,
  cyan: 36,
  white: 37,
  brightBlack: 90,
  brightRed: 91,
  brightGreen: 92,
  brightYellow: 93,
  brightBlue: 94,
  brightMagenta: 95,
  brightCyan: 96,
  brightWhite: 97,
};

/** Standard 16 ANSI color names mapped to background codes. */
const BG_COLORS: Record<string, number> = {
  black: 40,
  red: 41,
  green: 42,
  yellow: 43,
  blue: 44,
  magenta: 45,
  cyan: 46,
  white: 47,
  brightBlack: 100,
  brightRed: 101,
  brightGreen: 102,
  brightYellow: 103,
  brightBlue: 104,
  brightMagenta: 105,
  brightCyan: 106,
  brightWhite: 107,
};

export type ColorLevel = 'none' | '16' | '256' | 'truecolor';

/** Parse a hex color string (#RRGGBB or #RGB) into [r, g, b]. */
function parseHex(hex: string): [number, number, number] {
  const h = hex.startsWith('#') ? hex.slice(1) : hex;
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Convert RGB to the nearest 256-color palette index. */
function rgbTo256(r: number, g: number, b: number): number {
  // Check if it's a grayscale color
  if (r === g && g === b) {
    if (r < 8) return 16;
    if (r > 248) return 231;
    return Math.round((r - 8) / 247 * 24) + 232;
  }
  // Map to the 6x6x6 color cube (indices 16-231)
  const ri = Math.round(r / 255 * 5);
  const gi = Math.round(g / 255 * 5);
  const bi = Math.round(b / 255 * 5);
  return 16 + 36 * ri + 6 * gi + bi;
}

/** Convert RGB to the nearest 16-color ANSI code (foreground). */
function rgbTo16Fg(r: number, g: number, b: number): number {
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  const isBright = brightness > 128;

  // Simple heuristic: find the closest named color
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 50 && brightness < 50) return isBright ? 90 : 30; // black
  if (max - min < 50) return isBright ? 97 : 37; // white
  if (r > g && r > b) return isBright ? 91 : 31; // red
  if (g > r && g > b) return isBright ? 92 : 32; // green
  if (b > r && b > g) return isBright ? 94 : 34; // blue
  if (r > b) return isBright ? 93 : 33; // yellow
  if (g > r) return isBright ? 96 : 36; // cyan
  return isBright ? 95 : 35; // magenta
}

/** Convert a 256-color palette index (16-255) to RGB. */
function index256ToRgb(index: number): [number, number, number] {
  if (index >= 232) {
    // Grayscale ramp: 232-255 → gray levels 8, 18, 28, ..., 238
    const gray = (index - 232) * 10 + 8;
    return [gray, gray, gray];
  }
  // 6×6×6 color cube: indices 16-231
  const idx = index - 16;
  const b = (idx % 6) * 51;
  const g = (Math.floor(idx / 6) % 6) * 51;
  const r = Math.floor(idx / 36) * 51;
  return [r, g, b];
}

/** Generate the foreground ANSI escape for a color string at the given level. */
function fgSequence(color: string, level: ColorLevel): string {
  if (level === 'none') return '';

  // Named 16-color
  if (FG_COLORS[color] !== undefined) {
    return `\x1b[${FG_COLORS[color]}m`;
  }

  // 256-color index (numeric string)
  const num = Number(color);
  if (!isNaN(num) && num >= 0 && num <= 255) {
    if (level === '16') {
      // Downgrade: 0-7 → basic, 8-15 → bright, 16-255 → closest via RGB
      if (num <= 7) return `\x1b[${30 + num}m`;
      if (num <= 15) return `\x1b[${82 + num}m`;
      const [r, g, b] = index256ToRgb(num);
      return `\x1b[${rgbTo16Fg(r, g, b)}m`;
    }
    return `\x1b[38;5;${num}m`;
  }

  // Hex RGB
  if (color.startsWith('#')) {
    const [r, g, b] = parseHex(color);
    if (level === 'truecolor') {
      return `\x1b[38;2;${r};${g};${b}m`;
    }
    if (level === '256') {
      return `\x1b[38;5;${rgbTo256(r, g, b)}m`;
    }
    // 16-color downgrade
    return `\x1b[${rgbTo16Fg(r, g, b)}m`;
  }

  return '';
}

/** Generate the background ANSI escape for a color string at the given level. */
function bgSequence(color: string, level: ColorLevel): string {
  if (level === 'none') return '';

  // Named 16-color
  if (BG_COLORS[color] !== undefined) {
    return `\x1b[${BG_COLORS[color]}m`;
  }

  // 256-color index
  const num = Number(color);
  if (!isNaN(num) && num >= 0 && num <= 255) {
    if (level === '16') {
      // Downgrade: 0-7 → basic bg, 8-15 → bright bg, 16-255 → closest via RGB
      if (num <= 7) return `\x1b[${40 + num}m`;
      if (num <= 15) return `\x1b[${92 + num}m`;
      const [r, g, b] = index256ToRgb(num);
      return `\x1b[${rgbTo16Fg(r, g, b) + 10}m`;
    }
    return `\x1b[48;5;${num}m`;
  }

  // Hex RGB
  if (color.startsWith('#')) {
    const [r, g, b] = parseHex(color);
    if (level === 'truecolor') {
      return `\x1b[48;2;${r};${g};${b}m`;
    }
    if (level === '256') {
      return `\x1b[48;5;${rgbTo256(r, g, b)}m`;
    }
    // 16-color — use closest bg color
    const fgCode = rgbTo16Fg(r, g, b);
    return `\x1b[${fgCode + 10}m`;
  }

  return '';
}

// Attribute sequences
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const ITALIC = '\x1b[3m';
const UNDERLINE = '\x1b[4m';
const STRIKETHROUGH = '\x1b[9m';
const RESET = '\x1b[0m';

/**
 * Apply a Style to text, generating the correct ANSI escape sequences
 * for the given color level.
 *
 * When colorLevel is 'none', color codes are skipped but text attributes
 * (bold, dim, italic, underline, strikethrough) are still applied.
 */
export function applyStyle(
  text: string,
  style: Style,
  colorLevel: ColorLevel,
): string {
  if (!style || Object.keys(style).length === 0) return text;

  let prefix = '';

  // Text attributes are always applied regardless of color level
  if (style.bold) prefix += BOLD;
  if (style.dim) prefix += DIM;
  if (style.italic) prefix += ITALIC;
  if (style.underline) prefix += UNDERLINE;
  if (style.strikethrough) prefix += STRIKETHROUGH;

  // Colors are only applied when color level permits
  if (style.fg) prefix += fgSequence(style.fg, colorLevel);
  if (style.bg) prefix += bgSequence(style.bg, colorLevel);

  if (prefix === '') return text;

  return prefix + text + RESET;
}

/** Regex that matches all ANSI escape sequences. */
// eslint-disable-next-line no-control-regex
const ANSI_REGEX = /\x1b\[[0-9;]*m/g;

/** Remove all ANSI escape codes from a string. */
export function stripAnsi(str: string): string {
  return str.replace(ANSI_REGEX, '');
}

/** Get the visible width of a string (excluding ANSI escapes). */
export function visibleLength(str: string): number {
  return stripAnsi(str).length;
}

// Re-export constants for direct use
export { BOLD, DIM, ITALIC, UNDERLINE, STRIKETHROUGH, RESET };
export { FG_COLORS, BG_COLORS };
export { parseHex, rgbTo256, rgbTo16Fg, index256ToRgb, fgSequence, bgSequence };
