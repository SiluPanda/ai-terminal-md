import type { HighlightToken } from '../types';
import { tokenize, type TokenPattern } from '../highlighter';

/** JavaScript keywords. */
const JS_KEYWORDS = [
  'abstract', 'arguments', 'async', 'await', 'break', 'case', 'catch', 'class',
  'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'enum',
  'export', 'extends', 'finally', 'for', 'from', 'function', 'get', 'if',
  'import', 'in', 'instanceof', 'let', 'new', 'of', 'return', 'set', 'static',
  'super', 'switch', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with',
  'yield',
];

/** Additional TypeScript keywords. */
const TS_KEYWORDS = [
  'as', 'declare', 'implements', 'infer', 'interface', 'is', 'keyof',
  'module', 'namespace', 'never', 'override', 'readonly', 'satisfies',
  'type', 'unknown',
];

/** JavaScript constants. */
const JS_CONSTANTS = ['true', 'false', 'null', 'undefined', 'NaN', 'Infinity'];

/** Common built-in type names. */
const JS_TYPES = [
  'Array', 'Boolean', 'Date', 'Error', 'Function', 'Map', 'Number', 'Object',
  'Promise', 'RegExp', 'Set', 'String', 'Symbol', 'WeakMap', 'WeakSet',
  'bigint', 'boolean', 'number', 'object', 'string', 'symbol', 'void', 'any',
  'never', 'unknown',
];

/** Build the token patterns for JavaScript. */
function buildJSPatterns(): TokenPattern[] {
  return [
    // Block comments
    { pattern: /\/\*[\s\S]*?\*\//, category: 'comment' },
    // Line comments
    { pattern: /\/\/[^\n]*/, category: 'comment' },
    // Template literals (simplified — doesn't handle nested expressions perfectly)
    { pattern: /`(?:[^`\\]|\\.)*`/, category: 'string' },
    // Double-quoted strings
    { pattern: /"(?:[^"\\]|\\.)*"/, category: 'string' },
    // Single-quoted strings
    { pattern: /'(?:[^'\\]|\\.)*'/, category: 'string' },
    // Regex literals (simplified heuristic — after operator or start-of-line)
    { pattern: /\/(?![/*])(?:[^/\\]|\\.)+\/[gimsuy]*/, category: 'string' },
    // Numbers: hex, binary, octal, decimal, float, scientific
    { pattern: /0[xX][0-9a-fA-F][0-9a-fA-F_]*n?/, category: 'number' },
    { pattern: /0[bB][01][01_]*n?/, category: 'number' },
    { pattern: /0[oO][0-7][0-7_]*n?/, category: 'number' },
    { pattern: /\d[\d_]*\.[\d_]*(?:[eE][+-]?\d[\d_]*)?/, category: 'number' },
    { pattern: /\.[\d][\d_]*(?:[eE][+-]?\d[\d_]*)?/, category: 'number' },
    { pattern: /\d[\d_]*[eE][+-]?\d[\d_]*/, category: 'number' },
    { pattern: /\d[\d_]*n?/, category: 'number' },
    // Constants (before keyword check)
    { pattern: new RegExp(`\\b(?:${JS_CONSTANTS.join('|')})\\b`), category: 'constant' },
    // Keywords
    { pattern: new RegExp(`\\b(?:${JS_KEYWORDS.join('|')})\\b`), category: 'keyword' },
    // Types (capitalized built-in names)
    { pattern: new RegExp(`\\b(?:${JS_TYPES.join('|')})\\b`), category: 'type' },
    // Function calls: identifier followed by (
    { pattern: /\b[a-zA-Z_$][\w$]*(?=\s*\()/, category: 'function' },
    // Variables: this, self
    { pattern: /\b(?:this|self)\b/, category: 'variable' },
    // Arrow operator
    { pattern: /=>/, category: 'operator' },
    // Multi-char operators
    { pattern: /===|!==|==|!=|<=|>=|&&|\|\||<<|>>>|>>|\?\?|\?\.|\.\.\.|\*\*/, category: 'operator' },
    // Single-char operators
    { pattern: /[+\-*/%=<>!&|^~?:]/, category: 'operator' },
    // Punctuation
    { pattern: /[{}()[\];,.]/, category: 'punctuation' },
    // Identifiers (plain)
    { pattern: /[a-zA-Z_$][\w$]*/, category: 'plain' },
    // Whitespace
    { pattern: /\s+/, category: 'plain' },
  ];
}

/** Build the token patterns for TypeScript (extends JavaScript). */
function buildTSPatterns(): TokenPattern[] {
  const allKeywords = [...JS_KEYWORDS, ...TS_KEYWORDS];
  const allTypes = [...JS_TYPES];

  return [
    // Block comments
    { pattern: /\/\*[\s\S]*?\*\//, category: 'comment' },
    // Line comments
    { pattern: /\/\/[^\n]*/, category: 'comment' },
    // Template literals
    { pattern: /`(?:[^`\\]|\\.)*`/, category: 'string' },
    // Double-quoted strings
    { pattern: /"(?:[^"\\]|\\.)*"/, category: 'string' },
    // Single-quoted strings
    { pattern: /'(?:[^'\\]|\\.)*'/, category: 'string' },
    // Regex literals
    { pattern: /\/(?![/*])(?:[^/\\]|\\.)+\/[gimsuy]*/, category: 'string' },
    // Numbers
    { pattern: /0[xX][0-9a-fA-F][0-9a-fA-F_]*n?/, category: 'number' },
    { pattern: /0[bB][01][01_]*n?/, category: 'number' },
    { pattern: /0[oO][0-7][0-7_]*n?/, category: 'number' },
    { pattern: /\d[\d_]*\.[\d_]*(?:[eE][+-]?\d[\d_]*)?/, category: 'number' },
    { pattern: /\.[\d][\d_]*(?:[eE][+-]?\d[\d_]*)?/, category: 'number' },
    { pattern: /\d[\d_]*[eE][+-]?\d[\d_]*/, category: 'number' },
    { pattern: /\d[\d_]*n?/, category: 'number' },
    // Constants
    { pattern: new RegExp(`\\b(?:${JS_CONSTANTS.join('|')})\\b`), category: 'constant' },
    // Keywords (JS + TS)
    { pattern: new RegExp(`\\b(?:${allKeywords.join('|')})\\b`), category: 'keyword' },
    // Decorators / annotations
    { pattern: /@[a-zA-Z_$][\w$]*/, category: 'attribute' },
    // Types
    { pattern: new RegExp(`\\b(?:${allTypes.join('|')})\\b`), category: 'type' },
    // Generic type parameters: <T>, <T extends U>
    // Function calls
    { pattern: /\b[a-zA-Z_$][\w$]*(?=\s*\()/, category: 'function' },
    // Variables
    { pattern: /\b(?:this|self)\b/, category: 'variable' },
    // Arrow operator
    { pattern: /=>/, category: 'operator' },
    // Multi-char operators
    { pattern: /===|!==|==|!=|<=|>=|&&|\|\||<<|>>>|>>|\?\?|\?\.|\.\.\.|\*\*/, category: 'operator' },
    // Single-char operators
    { pattern: /[+\-*/%=<>!&|^~?:]/, category: 'operator' },
    // Punctuation
    { pattern: /[{}()[\];,.]/, category: 'punctuation' },
    // Identifiers
    { pattern: /[a-zA-Z_$][\w$]*/, category: 'plain' },
    // Whitespace
    { pattern: /\s+/, category: 'plain' },
  ];
}

let jsPatterns: TokenPattern[] | null = null;
let tsPatterns: TokenPattern[] | null = null;

/** Tokenize JavaScript code. */
export function tokenizeJavaScript(code: string): HighlightToken[] {
  if (!jsPatterns) {
    jsPatterns = buildJSPatterns();
  }
  return tokenize(code, jsPatterns);
}

/** Tokenize TypeScript code (JavaScript + type keywords). */
export function tokenizeTypeScript(code: string): HighlightToken[] {
  if (!tsPatterns) {
    tsPatterns = buildTSPatterns();
  }
  return tokenize(code, tsPatterns);
}
