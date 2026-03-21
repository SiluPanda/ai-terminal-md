import type { HighlightToken } from '../types';
import { tokenize, type TokenPattern } from '../highlighter';

const KEYWORDS = [
  'abstract', 'and', 'array', 'as', 'break', 'callable', 'case', 'catch',
  'class', 'clone', 'const', 'continue', 'declare', 'default', 'die', 'do',
  'echo', 'else', 'elseif', 'empty', 'enddeclare', 'endfor', 'endforeach',
  'endif', 'endswitch', 'endwhile', 'enum', 'eval', 'exit', 'extends',
  'final', 'finally', 'fn', 'for', 'foreach', 'function', 'global', 'goto',
  'if', 'implements', 'include', 'include_once', 'instanceof', 'insteadof',
  'interface', 'isset', 'list', 'match', 'namespace', 'new', 'or', 'print',
  'private', 'protected', 'public', 'readonly', 'require', 'require_once',
  'return', 'static', 'switch', 'throw', 'trait', 'try', 'unset', 'use',
  'var', 'while', 'xor', 'yield',
];

const CONSTANTS = ['true', 'false', 'null', 'TRUE', 'FALSE', 'NULL'];

const TYPES = [
  'int', 'float', 'string', 'bool', 'array', 'object', 'callable',
  'iterable', 'void', 'never', 'mixed', 'self', 'parent', 'static',
  'null', 'false', 'true',
];

function buildPatterns(): TokenPattern[] {
  return [
    // PHP open/close tags
    { pattern: /<\?php\b|<\?=|\?>/, category: 'keyword' },
    // Block comments (including DocBlocks)
    { pattern: /\/\*[\s\S]*?\*\//, category: 'comment' },
    // Line comments
    { pattern: /\/\/[^\n]*|#[^\n]*/, category: 'comment' },
    // Heredoc (simplified — just detect the start)
    { pattern: /<<<['"]?[A-Z_a-z]\w*['"]?/, category: 'string' },
    // Double-quoted strings (with variable interpolation — simplified)
    { pattern: /"(?:[^"\\$]|\\.|\$[a-zA-Z_]\w*|\$\{[^}]*\})*"/, category: 'string' },
    // Single-quoted strings (no interpolation)
    { pattern: /'(?:[^'\\]|\\.)*'/, category: 'string' },
    // Attributes: #[Attribute] (PHP 8)
    { pattern: /#\[[\s\S]*?\]/, category: 'attribute' },
    // Annotations in docblocks: @param, @return, etc.
    { pattern: /@[a-zA-Z_]\w*/, category: 'attribute' },
    // Numbers: hex, binary, octal, float, integer with underscore
    { pattern: /0[xX][0-9a-fA-F][0-9a-fA-F_]*/, category: 'number' },
    { pattern: /0[bB][01][01_]*/, category: 'number' },
    { pattern: /0[oO][0-7][0-7_]*/, category: 'number' },
    { pattern: /\d[\d_]*\.[\d_]*(?:[eE][+-]?\d[\d_]*)?/, category: 'number' },
    { pattern: /\d[\d_]*/, category: 'number' },
    // Constants
    { pattern: new RegExp(`\\b(?:${CONSTANTS.join('|')})\\b`), category: 'constant' },
    // Keywords
    { pattern: new RegExp(`\\b(?:${KEYWORDS.join('|')})\\b`, 'i'), category: 'keyword' },
    // Types (for type hints)
    { pattern: new RegExp(`\\b(?:${TYPES.join('|')})\\b`), category: 'type' },
    // Variables: $name, $this, $self
    { pattern: /\$[a-zA-Z_]\w*|\$\{[^}]*\}/, category: 'variable' },
    // Namespace separator
    { pattern: /\\[a-zA-Z_]\w*(?:\\[a-zA-Z_]\w*)*/, category: 'type' },
    // Function calls
    { pattern: /\b[a-zA-Z_]\w*(?=\s*\()/, category: 'function' },
    // Null coalescing, arrow fn
    { pattern: /\?\?=?|->|=>|::|===|!==|==|!=|<=|>=|&&|\|\|/, category: 'operator' },
    { pattern: /[+\-*/%=<>!&|^~?:.]/, category: 'operator' },
    // Punctuation
    { pattern: /[{}()[\];,]/, category: 'punctuation' },
    // Identifiers and whitespace
    { pattern: /[a-zA-Z_]\w*/, category: 'plain' },
    { pattern: /\s+/, category: 'plain' },
  ];
}

let patterns: TokenPattern[] | null = null;

export function tokenizePHP(code: string): HighlightToken[] {
  if (!patterns) {
    patterns = buildPatterns();
  }
  return tokenize(code, patterns);
}
