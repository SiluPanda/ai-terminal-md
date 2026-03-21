import type { ColorLevel } from './ansi';

/**
 * Detect terminal color support level using the priority chain:
 * 1. FORCE_COLOR env var
 * 2. NO_COLOR env var
 * 3. COLORTERM env var
 * 4. TERM 256color check
 * 5. stdout.isTTY
 * 6. Fallback to 'none'
 */
export function detectColorLevel(): ColorLevel {
  const env = process.env;

  // FORCE_COLOR takes highest priority
  if (env.FORCE_COLOR !== undefined) {
    switch (env.FORCE_COLOR) {
      case '0': return 'none';
      case '1': return '16';
      case '2': return '256';
      case '3': return 'truecolor';
      default: return '16'; // any truthy value enables basic color
    }
  }

  // NO_COLOR disables all color (per no-color.org)
  if (env.NO_COLOR !== undefined) {
    return 'none';
  }

  // COLORTERM for truecolor detection
  if (env.COLORTERM === 'truecolor' || env.COLORTERM === '24bit') {
    return 'truecolor';
  }

  // TERM 256color check
  if (env.TERM && env.TERM.includes('256color')) {
    return '256';
  }

  // TTY check — basic 16-color support
  if (process.stdout.isTTY) {
    return '16';
  }

  return 'none';
}

/**
 * Detect Unicode box-drawing character support.
 * Checks LANG/LC_ALL/LC_CTYPE for UTF-8, TERM for modern terminal,
 * WT_SESSION on Windows, defaults to true.
 */
export function detectUnicode(): boolean {
  const env = process.env;

  // Check locale environment variables for UTF-8
  const locale = env.LC_ALL || env.LC_CTYPE || env.LANG || '';
  if (/utf-?8/i.test(locale)) {
    return true;
  }

  // Check for modern terminal emulators
  if (env.TERM === 'xterm-256color' || (env.TERM && env.TERM.includes('256color'))) {
    return true;
  }

  // Windows Terminal support
  if (process.platform === 'win32' && env.WT_SESSION) {
    return true;
  }

  // Default: enable Unicode (most modern terminals support it)
  return true;
}

/**
 * Return terminal width from process.stdout.columns,
 * or default to 80 if undefined/non-TTY.
 */
export function getWidth(): number {
  return process.stdout.columns || 80;
}

/**
 * Return whether stdout is a TTY, defaulting to false.
 */
export function isTTY(): boolean {
  return !!process.stdout.isTTY;
}

/** Unicode box-drawing characters and their ASCII fallbacks. */
export interface BoxChars {
  horizontal: string;
  vertical: string;
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
  leftTee: string;
  rightTee: string;
  topTee: string;
  bottomTee: string;
  cross: string;
  roundTopLeft: string;
  roundTopRight: string;
  roundBottomLeft: string;
  roundBottomRight: string;
  doubleHorizontal: string;
  bullet: string;
  circle: string;
  square: string;
  arrow: string;
  checkmark: string;
  checkbox: string;
}

const UNICODE_CHARS: BoxChars = {
  horizontal: '─',
  vertical: '│',
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  leftTee: '├',
  rightTee: '┤',
  topTee: '┬',
  bottomTee: '┴',
  cross: '┼',
  roundTopLeft: '╭',
  roundTopRight: '╮',
  roundBottomLeft: '╰',
  roundBottomRight: '╯',
  doubleHorizontal: '═',
  bullet: '●',
  circle: '○',
  square: '■',
  arrow: '▸',
  checkmark: '✓',
  checkbox: '☐',
};

const ASCII_CHARS: BoxChars = {
  horizontal: '-',
  vertical: '|',
  topLeft: '+',
  topRight: '+',
  bottomLeft: '+',
  bottomRight: '+',
  leftTee: '+',
  rightTee: '+',
  topTee: '+',
  bottomTee: '+',
  cross: '+',
  roundTopLeft: '+',
  roundTopRight: '+',
  roundBottomLeft: '+',
  roundBottomRight: '+',
  doubleHorizontal: '=',
  bullet: '*',
  circle: '-',
  square: '+',
  arrow: '>',
  checkmark: '[x]',
  checkbox: '[ ]',
};

/**
 * Get the box-drawing character set based on Unicode capability.
 */
export function getBoxChars(unicode: boolean): BoxChars {
  return unicode ? UNICODE_CHARS : ASCII_CHARS;
}
