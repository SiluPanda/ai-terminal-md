import type { HighlightToken } from '../types';
import { tokenize, type TokenPattern } from '../highlighter';

const KEYWORDS = [
  'abstract', 'assert', 'break', 'case', 'catch', 'class', 'const',
  'continue', 'default', 'do', 'else', 'enum', 'extends', 'final',
  'finally', 'for', 'goto', 'if', 'implements', 'import', 'instanceof',
  'interface', 'native', 'new', 'package', 'private', 'protected', 'public',
  'return', 'sealed', 'static', 'strictfp', 'super', 'switch', 'synchronized',
  'this', 'throw', 'throws', 'transient', 'try', 'var', 'volatile', 'while',
  'record', 'permits', 'yield',
];

const CONSTANTS = ['true', 'false', 'null'];

const TYPES = [
  'boolean', 'byte', 'char', 'double', 'float', 'int', 'long', 'short', 'void',
  'String', 'Integer', 'Long', 'Double', 'Float', 'Boolean', 'Byte', 'Short',
  'Character', 'Object', 'Class', 'Throwable', 'Exception', 'RuntimeException',
  'System', 'Math', 'StringBuilder', 'StringBuffer', 'List', 'Map', 'Set',
  'ArrayList', 'HashMap', 'HashSet', 'Optional',
];

function buildPatterns(): TokenPattern[] {
  return [
    // Block comments (including javadoc)
    { pattern: /\/\*[\s\S]*?\*\//, category: 'comment' },
    // Line comments
    { pattern: /\/\/[^\n]*/, category: 'comment' },
    // Text blocks (Java 13+): triple-quote strings
    { pattern: /"""[\s\S]*?"""/, category: 'string' },
    // Strings
    { pattern: /"(?:[^"\\]|\\.)*"/, category: 'string' },
    // Char literals
    { pattern: /'(?:[^'\\]|\\.)'/, category: 'string' },
    // Annotations
    { pattern: /@[a-zA-Z_]\w*/, category: 'attribute' },
    // Numbers: hex, binary, long suffix, float/double suffix
    { pattern: /0[xX][0-9a-fA-F][0-9a-fA-F_]*[lL]?/, category: 'number' },
    { pattern: /0[bB][01][01_]*[lL]?/, category: 'number' },
    { pattern: /\d[\d_]*\.[\d_]*(?:[eE][+-]?\d[\d_]*)?[fFdD]?/, category: 'number' },
    { pattern: /\d[\d_]*[lLfFdD]?/, category: 'number' },
    // Constants
    { pattern: new RegExp(`\\b(?:${CONSTANTS.join('|')})\\b`), category: 'constant' },
    // Keywords
    { pattern: new RegExp(`\\b(?:${KEYWORDS.join('|')})\\b`), category: 'keyword' },
    // Types
    { pattern: new RegExp(`\\b(?:${TYPES.join('|')})\\b`), category: 'type' },
    // Function calls
    { pattern: /\b[a-zA-Z_]\w*(?=\s*\()/, category: 'function' },
    // Operators
    { pattern: />>>=|>>>|<<=|>>=|==|!=|<=|>=|&&|\|\||<<|>>|\+\+|--/, category: 'operator' },
    { pattern: /[+\-*/%=<>!&|^~?:.]/, category: 'operator' },
    // Punctuation
    { pattern: /[{}()[\];,]/, category: 'punctuation' },
    // Identifiers and whitespace
    { pattern: /[a-zA-Z_]\w*/, category: 'plain' },
    { pattern: /\s+/, category: 'plain' },
  ];
}

let patterns: TokenPattern[] | null = null;

export function tokenizeJava(code: string): HighlightToken[] {
  if (!patterns) {
    patterns = buildPatterns();
  }
  return tokenize(code, patterns);
}
