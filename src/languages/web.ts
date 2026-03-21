import type { HighlightToken } from '../types';
import { tokenize, type TokenPattern } from '../highlighter';

// ── HTML Tokenizer ────────────────────────────────────────────────

const HTML_VOID_TAGS = [
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
  'meta', 'param', 'source', 'track', 'wbr',
];

function buildHTMLPatterns(): TokenPattern[] {
  return [
    // HTML comments: <!-- -->
    { pattern: /<!--[\s\S]*?-->/, category: 'comment' },
    // DOCTYPE
    { pattern: /<!DOCTYPE[^>]*>/i, category: 'keyword' },
    // Self-closing tags: <br/>, <img .../>
    {
      pattern: new RegExp(`<(?:${HTML_VOID_TAGS.join('|')})(\\s[^>]*)?\\s*/?>`, 'i'),
      category: 'tag',
    },
    // Opening tags: capture tag name as 'tag', attributes inline
    { pattern: /<\/[a-zA-Z][a-zA-Z0-9-]*>/, category: 'tag' },
    { pattern: /<[a-zA-Z][a-zA-Z0-9-]*/, category: 'tag' },
    // Tag closing: > or />
    { pattern: /\/?>/, category: 'punctuation' },
    // Attribute values (double-quoted)
    { pattern: /"[^"]*"/, category: 'string' },
    // Attribute values (single-quoted)
    { pattern: /'[^']*'/, category: 'string' },
    // HTML entities
    { pattern: /&(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);/, category: 'constant' },
    // Attribute names (simple heuristic: word = or word ending before space/> )
    { pattern: /\b[a-zA-Z][a-zA-Z0-9_:-]*(?=\s*=)/, category: 'property' },
    // Identifiers and whitespace
    { pattern: /[a-zA-Z_]\w*/, category: 'plain' },
    { pattern: /\s+/, category: 'plain' },
    // Other characters
    { pattern: /[^<>&"'\s\w]+/, category: 'plain' },
  ];
}

// ── CSS Tokenizer ─────────────────────────────────────────────────

const CSS_AT_RULES = [
  'charset', 'color-profile', 'counter-style', 'font-face', 'font-feature-values',
  'import', 'keyframes', 'layer', 'media', 'namespace', 'page', 'property',
  'supports', 'viewport',
];

function buildCSSPatterns(): TokenPattern[] {
  return [
    // Block comments
    { pattern: /\/\*[\s\S]*?\*\//, category: 'comment' },
    // At-rules: @media, @import, etc.
    { pattern: new RegExp(`@(?:${CSS_AT_RULES.join('|')})\\b`, 'i'), category: 'keyword' },
    // String values
    { pattern: /"(?:[^"\\]|\\.)*"/, category: 'string' },
    { pattern: /'(?:[^'\\]|\\.)*'/, category: 'string' },
    // Hex colors
    { pattern: /#[0-9a-fA-F]{3,8}\b/, category: 'number' },
    // Numbers with units: 12px, 1.5em, 100%, -3rem
    { pattern: /-?\d+\.?\d*(?:px|em|rem|vw|vh|vmin|vmax|%|pt|pc|cm|mm|in|ex|ch|deg|rad|turn|s|ms|fr|dpi|dpcm|dppx)?/, category: 'number' },
    // !important
    { pattern: /!important\b/, category: 'keyword' },
    // CSS custom properties: --var-name
    { pattern: /--[a-zA-Z][\w-]*/, category: 'variable' },
    // var() function
    { pattern: /\bvar(?=\s*\()/, category: 'function' },
    // CSS functions: rgb(), url(), etc.
    { pattern: /\b[a-zA-Z][\w-]*(?=\s*\()/, category: 'function' },
    // Pseudo-classes and pseudo-elements: :hover, ::before
    { pattern: /::?[a-zA-Z][\w-]*/, category: 'keyword' },
    // Property names (inside rule blocks, before :)
    { pattern: /[a-zA-Z][\w-]*(?=\s*:)/, category: 'property' },
    // ID selectors: #id
    { pattern: /#[a-zA-Z_][\w-]*/, category: 'constant' },
    // Class selectors: .class
    { pattern: /\.[a-zA-Z_][\w-]*/, category: 'type' },
    // Attribute selectors: [attr]
    { pattern: /\[[\w-]+(?:[~|^$*]?=(?:"[^"]*"|'[^']*'|[^\]]*))?\]/, category: 'property' },
    // Operators/combinators
    { pattern: /[>+~|*]/, category: 'operator' },
    { pattern: /[:;,{}()]/, category: 'punctuation' },
    // Identifiers and whitespace
    { pattern: /[a-zA-Z_][\w-]*/, category: 'plain' },
    { pattern: /\s+/, category: 'plain' },
  ];
}

let htmlPatterns: TokenPattern[] | null = null;
let cssPatterns: TokenPattern[] | null = null;

export function tokenizeHTML(code: string): HighlightToken[] {
  if (!htmlPatterns) {
    htmlPatterns = buildHTMLPatterns();
  }
  return tokenize(code, htmlPatterns);
}

export function tokenizeCSS(code: string): HighlightToken[] {
  if (!cssPatterns) {
    cssPatterns = buildCSSPatterns();
  }
  return tokenize(code, cssPatterns);
}
