import type { Theme, ThemeName, Style } from './types';

/**
 * Dark theme — optimized for dark terminal backgrounds.
 * Uses bright colors for headers, magenta/green/yellow for syntax,
 * dim colors for secondary elements, white for body text.
 */
const dark: Theme = {
  // Headers
  heading1: { fg: 'brightWhite', bold: true },
  heading2: { fg: 'brightCyan', bold: true },
  heading3: { fg: 'yellow', bold: true },
  heading4: { fg: 'green', bold: true },
  heading5: { fg: 'white', bold: true, dim: true },
  heading6: { bold: true, dim: true },
  headingUnderline: { dim: true },

  // Text
  body: {},
  bold: { bold: true },
  italic: { italic: true },
  strikethrough: { strikethrough: true },
  link: { underline: true, fg: 'cyan' },
  linkUrl: { dim: true },

  // Code
  codeBackground: { bg: '#1e1e1e' },
  codeLanguageLabel: { dim: true },
  codeLineNumber: { dim: true },
  inlineCode: { bg: '#3a3a3a' },

  // Syntax Highlighting
  syntaxKeyword: { fg: 'magenta' },
  syntaxString: { fg: 'green' },
  syntaxNumber: { fg: 'yellow' },
  syntaxComment: { dim: true },
  syntaxOperator: { fg: 'cyan' },
  syntaxType: { fg: 'blue' },
  syntaxFunction: { fg: 'brightYellow' },
  syntaxVariable: { fg: 'white' },
  syntaxConstant: { fg: 'red' },
  syntaxPunctuation: { fg: 'white', dim: true },
  syntaxAttribute: { fg: 'cyan' },
  syntaxTag: { fg: 'red' },
  syntaxProperty: { fg: 'cyan' },

  // Blocks
  blockquoteBorder: { dim: true },
  blockquoteText: { dim: true },
  horizontalRule: { dim: true },
  listBullet: { fg: 'cyan' },
  listNumber: { fg: 'cyan' },
  tableBorder: { dim: true },
  tableHeader: { bold: true },

  // AI Elements
  thinkingHeader: { fg: 'brightBlack', bold: true },
  thinkingBorder: { fg: 'brightBlack' },
  thinkingText: { dim: true },
  artifactBorder: { fg: 'blue' },
  artifactTitle: { fg: 'blue', bold: true },
  toolUseBorder: { fg: 'yellow' },
  toolUseHeader: { fg: 'yellow', bold: true },
  toolUseKey: { fg: 'cyan' },
  toolUseValue: {},
  toolResultBorder: { fg: 'green' },
  toolResultHeader: { fg: 'green', bold: true },
  toolResultSuccess: { fg: 'green' },
  toolResultError: { fg: 'red' },
  citation: { fg: 'cyan', bold: true },
  semanticLabel: { dim: true, italic: true },
};

/**
 * Light theme — optimized for light terminal backgrounds.
 * Uses darker colors, avoids yellow/bright white, uses black for body text.
 */
const light: Theme = {
  // Headers
  heading1: { fg: 'blue', bold: true },
  heading2: { fg: 'cyan', bold: true },
  heading3: { fg: 'magenta', bold: true },
  heading4: { fg: 'green', bold: true },
  heading5: { bold: true, dim: true },
  heading6: { bold: true, dim: true },
  headingUnderline: { dim: true },

  // Text
  body: { fg: 'black' },
  bold: { bold: true },
  italic: { italic: true },
  strikethrough: { strikethrough: true },
  link: { underline: true, fg: 'blue' },
  linkUrl: { dim: true },

  // Code
  codeBackground: { bg: '#e8e8e8' },
  codeLanguageLabel: { dim: true },
  codeLineNumber: { dim: true },
  inlineCode: { bg: '#d0d0d0' },

  // Syntax Highlighting
  syntaxKeyword: { fg: 'magenta' },
  syntaxString: { fg: 'green' },
  syntaxNumber: { fg: 'red' },
  syntaxComment: { dim: true },
  syntaxOperator: { fg: 'cyan' },
  syntaxType: { fg: 'blue' },
  syntaxFunction: { fg: 'magenta' },
  syntaxVariable: { fg: 'black' },
  syntaxConstant: { fg: 'red' },
  syntaxPunctuation: { dim: true },
  syntaxAttribute: { fg: 'cyan' },
  syntaxTag: { fg: 'red' },
  syntaxProperty: { fg: 'cyan' },

  // Blocks
  blockquoteBorder: { dim: true },
  blockquoteText: { dim: true },
  horizontalRule: { dim: true },
  listBullet: { fg: 'blue' },
  listNumber: { fg: 'blue' },
  tableBorder: { dim: true },
  tableHeader: { bold: true },

  // AI Elements
  thinkingHeader: { dim: true, bold: true },
  thinkingBorder: { dim: true },
  thinkingText: { dim: true },
  artifactBorder: { fg: 'blue' },
  artifactTitle: { fg: 'blue', bold: true },
  toolUseBorder: { fg: 'magenta' },
  toolUseHeader: { fg: 'magenta', bold: true },
  toolUseKey: { fg: 'blue' },
  toolUseValue: {},
  toolResultBorder: { fg: 'green' },
  toolResultHeader: { fg: 'green', bold: true },
  toolResultSuccess: { fg: 'green' },
  toolResultError: { fg: 'red' },
  citation: { fg: 'blue', bold: true },
  semanticLabel: { dim: true, italic: true },
};

/**
 * Minimal theme — reduced color usage.
 * Uses only bold, dim, and underline. No foreground color changes for body text.
 * Code blocks use background but no syntax highlighting colors.
 */
const minimal: Theme = {
  // Headers
  heading1: { bold: true },
  heading2: { bold: true },
  heading3: { bold: true },
  heading4: { bold: true },
  heading5: { bold: true, dim: true },
  heading6: { bold: true, dim: true },
  headingUnderline: { dim: true },

  // Text
  body: {},
  bold: { bold: true },
  italic: { italic: true },
  strikethrough: { strikethrough: true },
  link: { underline: true },
  linkUrl: { dim: true },

  // Code
  codeBackground: { bg: '#2a2a2a' },
  codeLanguageLabel: { dim: true },
  codeLineNumber: { dim: true },
  inlineCode: { bg: '#3a3a3a' },

  // Syntax Highlighting — no colors, just dim for comments
  syntaxKeyword: { bold: true },
  syntaxString: {},
  syntaxNumber: {},
  syntaxComment: { dim: true },
  syntaxOperator: {},
  syntaxType: { underline: true },
  syntaxFunction: { bold: true },
  syntaxVariable: {},
  syntaxConstant: { bold: true },
  syntaxPunctuation: { dim: true },
  syntaxAttribute: { underline: true },
  syntaxTag: { bold: true },
  syntaxProperty: {},

  // Blocks
  blockquoteBorder: { dim: true },
  blockquoteText: { dim: true },
  horizontalRule: { dim: true },
  listBullet: { bold: true },
  listNumber: { bold: true },
  tableBorder: { dim: true },
  tableHeader: { bold: true },

  // AI Elements
  thinkingHeader: { bold: true, dim: true },
  thinkingBorder: { dim: true },
  thinkingText: { dim: true },
  artifactBorder: { dim: true },
  artifactTitle: { bold: true },
  toolUseBorder: { dim: true },
  toolUseHeader: { bold: true },
  toolUseKey: { bold: true },
  toolUseValue: {},
  toolResultBorder: { dim: true },
  toolResultHeader: { bold: true },
  toolResultSuccess: { bold: true },
  toolResultError: { bold: true },
  citation: { bold: true },
  semanticLabel: { dim: true, italic: true },
};

/**
 * Monochrome theme — no colors at all.
 * Uses only bold, dim, underline, italic, and strikethrough.
 * All elements distinguished by text decoration, not color.
 */
const monochrome: Theme = {
  // Headers
  heading1: { bold: true },
  heading2: { bold: true, underline: true },
  heading3: { bold: true },
  heading4: { bold: true },
  heading5: { bold: true, dim: true },
  heading6: { dim: true },
  headingUnderline: {},

  // Text
  body: {},
  bold: { bold: true },
  italic: { italic: true },
  strikethrough: { strikethrough: true },
  link: { underline: true },
  linkUrl: { dim: true },

  // Code
  codeBackground: {},
  codeLanguageLabel: { dim: true },
  codeLineNumber: { dim: true },
  inlineCode: { bold: true },

  // Syntax Highlighting — no colors, text decoration only
  syntaxKeyword: { bold: true },
  syntaxString: { italic: true },
  syntaxNumber: {},
  syntaxComment: { dim: true },
  syntaxOperator: {},
  syntaxType: { underline: true },
  syntaxFunction: { bold: true },
  syntaxVariable: {},
  syntaxConstant: { bold: true },
  syntaxPunctuation: { dim: true },
  syntaxAttribute: { italic: true },
  syntaxTag: { bold: true },
  syntaxProperty: { italic: true },

  // Blocks
  blockquoteBorder: { dim: true },
  blockquoteText: { dim: true },
  horizontalRule: { dim: true },
  listBullet: {},
  listNumber: {},
  tableBorder: { dim: true },
  tableHeader: { bold: true },

  // AI Elements
  thinkingHeader: { bold: true, dim: true },
  thinkingBorder: { dim: true },
  thinkingText: { dim: true },
  artifactBorder: { dim: true },
  artifactTitle: { bold: true },
  toolUseBorder: { dim: true },
  toolUseHeader: { bold: true },
  toolUseKey: { bold: true },
  toolUseValue: {},
  toolResultBorder: { dim: true },
  toolResultHeader: { bold: true },
  toolResultSuccess: { bold: true },
  toolResultError: { bold: true, underline: true },
  citation: { bold: true },
  semanticLabel: { dim: true, italic: true },
};

/** Map of built-in theme names to theme objects. */
const themes: Record<ThemeName, Theme> = { dark, light, minimal, monochrome };

/**
 * Resolve a theme specification to a complete Theme object.
 *
 * Accepts a ThemeName string (returns the built-in theme) or a partial theme
 * object with an optional baseTheme field. When a partial theme is provided,
 * unspecified elements inherit from the base theme (defaults to 'dark').
 */
export function resolveTheme(
  theme?: ThemeName | (Partial<Theme> & { baseTheme?: ThemeName }),
): Theme {
  if (theme === undefined) {
    return detectTheme();
  }

  if (typeof theme === 'string') {
    return themes[theme];
  }

  // Partial theme with optional baseTheme
  const { baseTheme = 'dark', ...overrides } = theme;
  const base = themes[baseTheme];
  return { ...base, ...overrides } as Theme;
}

/**
 * Auto-detect the appropriate theme based on the terminal environment.
 *
 * Detection methods:
 * 1. AI_TERMINAL_MD_THEME env var — explicit override
 * 2. COLORFGBG env var — background value >= 8 means light, otherwise dark
 * 3. Default: dark
 */
export function detectTheme(): Theme {
  const envTheme = process.env.AI_TERMINAL_MD_THEME;
  if (envTheme && isThemeName(envTheme)) {
    return themes[envTheme];
  }

  const colorfgbg = process.env.COLORFGBG;
  if (colorfgbg) {
    const parts = colorfgbg.split(';');
    const bg = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(bg) && bg >= 8) {
      return themes.light;
    }
    return themes.dark;
  }

  return themes.dark;
}

/** Type guard for ThemeName. */
function isThemeName(value: string): value is ThemeName {
  return value === 'dark' || value === 'light' || value === 'minimal' || value === 'monochrome';
}

/** Get a built-in theme by name. */
export function getTheme(name: ThemeName): Theme {
  return themes[name];
}

/**
 * Check whether a Style contains any color (fg or bg) properties.
 * Useful for verifying monochrome theme compliance.
 */
export function hasColor(style: Style): boolean {
  return style.fg !== undefined || style.bg !== undefined;
}
