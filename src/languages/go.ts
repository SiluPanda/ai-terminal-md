import type { HighlightToken } from '../types';
import { tokenize, type TokenPattern } from '../highlighter';

const KEYWORDS = [
  'break', 'case', 'chan', 'const', 'continue', 'default', 'defer',
  'else', 'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import',
  'interface', 'map', 'package', 'range', 'return', 'select', 'struct',
  'switch', 'type', 'var',
];

const CONSTANTS = ['true', 'false', 'nil', 'iota'];

const TYPES = [
  'bool', 'byte', 'complex64', 'complex128', 'error', 'float32', 'float64',
  'int', 'int8', 'int16', 'int32', 'int64', 'rune', 'string',
  'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'uintptr',
];

const BUILTINS = [
  'append', 'cap', 'close', 'complex', 'copy', 'delete', 'imag', 'len',
  'make', 'new', 'panic', 'print', 'println', 'real', 'recover',
];

function buildPatterns(): TokenPattern[] {
  return [
    // Block comments
    { pattern: /\/\*[\s\S]*?\*\//, category: 'comment' },
    // Line comments
    { pattern: /\/\/[^\n]*/, category: 'comment' },
    // Raw strings (backtick)
    { pattern: /`[^`]*`/, category: 'string' },
    // Interpreted strings
    { pattern: /"(?:[^"\\]|\\.)*"/, category: 'string' },
    // Rune literals
    { pattern: /'(?:[^'\\]|\\.)'/, category: 'string' },
    // Numbers: hex, binary, octal, float, imaginary
    { pattern: /0[xX][0-9a-fA-F][0-9a-fA-F_]*/, category: 'number' },
    { pattern: /0[bB][01][01_]*/, category: 'number' },
    { pattern: /0[oO][0-7][0-7_]*/, category: 'number' },
    { pattern: /\d[\d_]*\.[\d_]*(?:[eE][+-]?\d[\d_]*)?[i]?/, category: 'number' },
    { pattern: /\d[\d_]*[i]/, category: 'number' },
    { pattern: /\d[\d_]*/, category: 'number' },
    // Constants
    { pattern: new RegExp(`\\b(?:${CONSTANTS.join('|')})\\b`), category: 'constant' },
    // Keywords
    { pattern: new RegExp(`\\b(?:${KEYWORDS.join('|')})\\b`), category: 'keyword' },
    // Built-in functions
    { pattern: new RegExp(`\\b(?:${BUILTINS.join('|')})(?=\\s*\\()`), category: 'function' },
    // Types
    { pattern: new RegExp(`\\b(?:${TYPES.join('|')})\\b`), category: 'type' },
    // Function calls
    { pattern: /\b[a-zA-Z_]\w*(?=\s*\()/, category: 'function' },
    // Operators
    { pattern: /:=|<-|==|!=|<=|>=|&&|\|\||<<|>>|&\^/, category: 'operator' },
    { pattern: /[+\-*/%=<>!&|^~?:.]/, category: 'operator' },
    // Punctuation
    { pattern: /[{}()[\];,]/, category: 'punctuation' },
    // Identifiers and whitespace
    { pattern: /[a-zA-Z_]\w*/, category: 'plain' },
    { pattern: /\s+/, category: 'plain' },
  ];
}

let patterns: TokenPattern[] | null = null;

export function tokenizeGo(code: string): HighlightToken[] {
  if (!patterns) {
    patterns = buildPatterns();
  }
  return tokenize(code, patterns);
}
