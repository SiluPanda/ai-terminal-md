import type { HighlightToken } from '../types';
import { tokenize, type TokenPattern } from '../highlighter';

const KEYWORDS = [
  'BEGIN', 'END', '__ENCODING__', '__FILE__', '__LINE__',
  'alias', 'and', 'begin', 'break', 'case', 'class', 'def',
  'defined?', 'do', 'else', 'elsif', 'end', 'ensure', 'for',
  'if', 'in', 'module', 'next', 'nil', 'not', 'or', 'redo',
  'rescue', 'retry', 'return', 'self', 'super', 'then', 'undef',
  'unless', 'until', 'when', 'while', 'yield',
];

const CONSTANTS = ['true', 'false', 'nil'];

function buildPatterns(): TokenPattern[] {
  return [
    // Here documents (simplified): <<~HEREDOC or <<HEREDOC
    // Comments
    { pattern: /#[^\n]*/, category: 'comment' },
    // Block/multiline strings: heredoc — just detect the start as plain for simplicity
    // %q{} and %Q{} string literals
    { pattern: /%[qQ]\{[^}]*\}/, category: 'string' },
    { pattern: /%[qQ]\[[^\]]*\]/, category: 'string' },
    { pattern: /%[qQ]<[^>]*>/, category: 'string' },
    // Double-quoted strings
    { pattern: /"(?:[^"\\]|\\.)*"/, category: 'string' },
    // Single-quoted strings
    { pattern: /'(?:[^'\\]|\\.)*'/, category: 'string' },
    // Backtick command execution
    { pattern: /`(?:[^`\\]|\\.)*`/, category: 'string' },
    // Regex literals: /pattern/flags
    { pattern: /\/(?![/*])(?:[^/\\\n]|\\.)+\/[imxouesn]*/, category: 'string' },
    // Symbols: :name or :"name"
    { pattern: /:[a-zA-Z_]\w*[?!]?/, category: 'constant' },
    { pattern: /:"(?:[^"\\]|\\.)*"/, category: 'constant' },
    // Numbers: hex, binary, octal, float, integer with underscore
    { pattern: /0[xX][0-9a-fA-F][0-9a-fA-F_]*/, category: 'number' },
    { pattern: /0[bB][01][01_]*/, category: 'number' },
    { pattern: /0[oO]?[0-7][0-7_]*/, category: 'number' },
    { pattern: /\d[\d_]*\.[\d_]*(?:[eE][+-]?\d[\d_]*)?/, category: 'number' },
    { pattern: /\d[\d_]*(?:[eE][+-]?\d[\d_]*)?/, category: 'number' },
    // Constants (start with uppercase)
    { pattern: /\b[A-Z][A-Z0-9_]+\b/, category: 'type' },
    // Built-in constants
    { pattern: new RegExp(`\\b(?:${CONSTANTS.join('|')})\\b`), category: 'constant' },
    // Keywords
    { pattern: new RegExp(`\\b(?:${KEYWORDS.join('|')})\\b`), category: 'keyword' },
    // Global variables: $name
    { pattern: /\$[a-zA-Z_]\w*|\$[0-9&`'~!@#$%^*()+=\\|/<>,.;:?]/, category: 'variable' },
    // Instance variables: @name
    { pattern: /@[a-zA-Z_]\w*/, category: 'variable' },
    // Class variables: @@name
    { pattern: /@@[a-zA-Z_]\w*/, category: 'variable' },
    // Method calls with ? or ! suffixes
    { pattern: /\b[a-zA-Z_]\w*[?!](?=\s*[({])/, category: 'function' },
    // Function calls
    { pattern: /\b[a-zA-Z_]\w*(?=\s*\()/, category: 'function' },
    // Operators
    { pattern: /<<=|>>=|<=>|===|==|!=|<=|>=|<<|>>|&&|\|\|/, category: 'operator' },
    { pattern: /[+\-*/%=<>!&|^~?:.]/, category: 'operator' },
    // Punctuation
    { pattern: /[{}()[\];,]/, category: 'punctuation' },
    // Identifiers and whitespace
    { pattern: /[a-zA-Z_]\w*[?!]?/, category: 'plain' },
    { pattern: /\s+/, category: 'plain' },
  ];
}

let patterns: TokenPattern[] | null = null;

export function tokenizeRuby(code: string): HighlightToken[] {
  if (!patterns) {
    patterns = buildPatterns();
  }
  return tokenize(code, patterns);
}
