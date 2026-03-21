import type { HighlightToken } from '../types';
import { tokenize, type TokenPattern } from '../highlighter';

const KEYWORDS = [
  'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
  'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if',
  'inline', 'int', 'long', 'register', 'restrict', 'return', 'short',
  'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union',
  'unsigned', 'void', 'volatile', 'while',
  // C++ keywords
  'alignas', 'alignof', 'and', 'and_eq', 'asm', 'bitand', 'bitor', 'bool',
  'catch', 'class', 'compl', 'concept', 'consteval', 'constexpr', 'constinit',
  'co_await', 'co_return', 'co_yield', 'decltype', 'delete', 'dynamic_cast',
  'explicit', 'export', 'false', 'friend', 'mutable', 'namespace', 'new',
  'noexcept', 'not', 'not_eq', 'nullptr', 'operator', 'or', 'or_eq',
  'override', 'private', 'protected', 'public', 'reinterpret_cast', 'requires',
  'static_assert', 'static_cast', 'template', 'this', 'thread_local', 'throw',
  'true', 'try', 'typeid', 'typename', 'using', 'virtual', 'wchar_t', 'xor',
  'xor_eq',
];

const CONSTANTS = ['true', 'false', 'null', 'NULL', 'nullptr'];

const TYPES = [
  'int8_t', 'int16_t', 'int32_t', 'int64_t',
  'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t',
  'size_t', 'ssize_t', 'ptrdiff_t', 'intptr_t', 'uintptr_t',
  'FILE', 'DIR', 'time_t', 'clock_t',
  'string', 'vector', 'map', 'set', 'pair', 'tuple',
  'unique_ptr', 'shared_ptr', 'weak_ptr',
  'std',
];

function buildPatterns(): TokenPattern[] {
  return [
    // Block comments
    { pattern: /\/\*[\s\S]*?\*\//, category: 'comment' },
    // Line comments
    { pattern: /\/\/[^\n]*/, category: 'comment' },
    // Preprocessor directives
    { pattern: /#\s*(?:include|define|ifdef|ifndef|endif|if|else|elif|undef|pragma|error|warning|line)\b[^\n]*/, category: 'attribute' },
    // Strings
    { pattern: /L?"(?:[^"\\]|\\.)*"/, category: 'string' },
    // Char literals
    { pattern: /L?'(?:[^'\\]|\\.)'/, category: 'string' },
    // Numbers: hex, octal, float, integer with suffix
    { pattern: /0[xX][0-9a-fA-F][0-9a-fA-F]*(?:[uUlL]*)/, category: 'number' },
    { pattern: /0[0-7]+(?:[uUlL]*)/, category: 'number' },
    { pattern: /\d+\.?\d*(?:[eE][+-]?\d+)?(?:[fFlL]*)/, category: 'number' },
    { pattern: /\.\d+(?:[eE][+-]?\d+)?(?:[fFlL]*)/, category: 'number' },
    // Constants
    { pattern: new RegExp(`\\b(?:${CONSTANTS.join('|')})\\b`), category: 'constant' },
    // Keywords
    { pattern: new RegExp(`\\b(?:${KEYWORDS.join('|')})\\b`), category: 'keyword' },
    // Standard library types
    { pattern: new RegExp(`\\b(?:${TYPES.join('|')})\\b`), category: 'type' },
    // All-caps macros / constants: FOO_BAR
    { pattern: /\b[A-Z][A-Z0-9_]{2,}\b/, category: 'constant' },
    // Function calls
    { pattern: /\b[a-zA-Z_]\w*(?=\s*\()/, category: 'function' },
    // Pointer operators
    { pattern: /->|::|\.\.\./, category: 'operator' },
    // Multi-char operators
    { pattern: />>=|<<=|==|!=|<=|>=|&&|\|\||<<|>>|\+\+|--|::/, category: 'operator' },
    // Single-char operators
    { pattern: /[+\-*/%=<>!&|^~?:.]/, category: 'operator' },
    // Punctuation
    { pattern: /[{}()[\];,]/, category: 'punctuation' },
    // Identifiers and whitespace
    { pattern: /[a-zA-Z_]\w*/, category: 'plain' },
    { pattern: /\s+/, category: 'plain' },
  ];
}

let patterns: TokenPattern[] | null = null;

export function tokenizeC(code: string): HighlightToken[] {
  if (!patterns) {
    patterns = buildPatterns();
  }
  return tokenize(code, patterns);
}
