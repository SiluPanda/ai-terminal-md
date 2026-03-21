import type { HighlightToken } from '../types';
import { tokenize, type TokenPattern } from '../highlighter';

const KEYWORDS = [
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return',
  'try', 'while', 'with', 'yield',
];

const CONSTANTS = ['True', 'False', 'None'];

const BUILTINS = [
  'abs', 'all', 'any', 'bin', 'bool', 'breakpoint', 'bytearray', 'bytes',
  'callable', 'chr', 'classmethod', 'compile', 'complex', 'delattr', 'dict',
  'dir', 'divmod', 'enumerate', 'eval', 'exec', 'filter', 'float', 'format',
  'frozenset', 'getattr', 'globals', 'hasattr', 'hash', 'help', 'hex', 'id',
  'input', 'int', 'isinstance', 'issubclass', 'iter', 'len', 'list',
  'locals', 'map', 'max', 'memoryview', 'min', 'next', 'object', 'oct',
  'open', 'ord', 'pow', 'print', 'property', 'range', 'repr', 'reversed',
  'round', 'set', 'setattr', 'slice', 'sorted', 'staticmethod', 'str',
  'sum', 'super', 'tuple', 'type', 'vars', 'zip',
];

function buildPatterns(): TokenPattern[] {
  return [
    // Triple-quoted strings (f-string, b-string, r-string variants)
    { pattern: /(?:[fFbBrRuU]{0,2})"""[\s\S]*?"""/, category: 'string' },
    { pattern: /(?:[fFbBrRuU]{0,2})'''[\s\S]*?'''/, category: 'string' },
    // Single-line strings
    { pattern: /(?:[fFbBrRuU]{0,2})"(?:[^"\\]|\\.)*"/, category: 'string' },
    { pattern: /(?:[fFbBrRuU]{0,2})'(?:[^'\\]|\\.)*'/, category: 'string' },
    // Comments
    { pattern: /#[^\n]*/, category: 'comment' },
    // Decorators
    { pattern: /@[a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*/, category: 'attribute' },
    // Numbers: complex, float, hex, binary, octal, decimal
    { pattern: /\d[\d_]*\.[\d_]*(?:[eE][+-]?\d[\d_]*)?[jJ]?/, category: 'number' },
    { pattern: /\.[\d][\d_]*(?:[eE][+-]?\d[\d_]*)?[jJ]?/, category: 'number' },
    { pattern: /0[xX][0-9a-fA-F][0-9a-fA-F_]*/, category: 'number' },
    { pattern: /0[bB][01][01_]*/, category: 'number' },
    { pattern: /0[oO][0-7][0-7_]*/, category: 'number' },
    { pattern: /\d[\d_]*[jJ]/, category: 'number' },
    { pattern: /\d[\d_]*/, category: 'number' },
    // Constants (subset of keywords)
    { pattern: new RegExp(`\\b(?:${CONSTANTS.join('|')})\\b`), category: 'constant' },
    // Keywords
    { pattern: new RegExp(`\\b(?:${KEYWORDS.join('|')})\\b`), category: 'keyword' },
    // Built-in functions
    { pattern: new RegExp(`\\b(?:${BUILTINS.join('|')})(?=\\s*\\()`), category: 'function' },
    // Function calls
    { pattern: /\b[a-zA-Z_]\w*(?=\s*\()/, category: 'function' },
    // Operators
    { pattern: /\*\*|\/\/|<<|>>|->|:=|==|!=|<=|>=/, category: 'operator' },
    { pattern: /[+\-*/%=<>!&|^~@]/, category: 'operator' },
    // Punctuation
    { pattern: /[{}()[\]:,.]/, category: 'punctuation' },
    // Identifiers and whitespace
    { pattern: /[a-zA-Z_]\w*/, category: 'plain' },
    { pattern: /\s+/, category: 'plain' },
  ];
}

let patterns: TokenPattern[] | null = null;

export function tokenizePython(code: string): HighlightToken[] {
  if (!patterns) {
    patterns = buildPatterns();
  }
  return tokenize(code, patterns);
}
