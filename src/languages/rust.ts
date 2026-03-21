import type { HighlightToken } from '../types';
import { tokenize, type TokenPattern } from '../highlighter';

const KEYWORDS = [
  'as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn',
  'else', 'enum', 'extern', 'false', 'fn', 'for', 'if', 'impl', 'in',
  'let', 'loop', 'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return',
  'self', 'Self', 'static', 'struct', 'super', 'trait', 'true', 'type',
  'union', 'unsafe', 'use', 'where', 'while',
];

const CONSTANTS = ['true', 'false', 'None', 'Some', 'Ok', 'Err'];

const TYPES = [
  'bool', 'char', 'f32', 'f64', 'i8', 'i16', 'i32', 'i64', 'i128',
  'isize', 'str', 'u8', 'u16', 'u32', 'u64', 'u128', 'usize',
  'String', 'Vec', 'Option', 'Result', 'Box', 'Rc', 'Arc', 'HashMap',
  'HashSet', 'BTreeMap', 'BTreeSet',
];

function buildPatterns(): TokenPattern[] {
  return [
    // Block comments (including doc comments)
    { pattern: /\/\*[\s\S]*?\*\//, category: 'comment' },
    // Line comments (including doc comments /// and //)
    { pattern: /\/\/[^\n]*/, category: 'comment' },
    // Strings: raw strings r#"..."# (simplified)
    { pattern: /r#+"[^"]*"#*/, category: 'string' },
    // Regular strings
    { pattern: /"(?:[^"\\]|\\.)*"/, category: 'string' },
    // Character literals (including lifetime-like: 'a skips to avoid confusion)
    { pattern: /'(?:[^'\\]|\\.)'/, category: 'string' },
    // Lifetime annotations: 'a 'static 'lifetime
    { pattern: /'[a-zA-Z_]\w*\b/, category: 'type' },
    // Attributes: #[...] and #![...]
    { pattern: /#!?\[(?:[^\]]*)\]/, category: 'attribute' },
    // Macros: name!
    { pattern: /\b[a-zA-Z_]\w*!(?=\s*[({["])/, category: 'function' },
    // Numbers: hex, binary, octal, float, integer with type suffix
    { pattern: /0[xX][0-9a-fA-F][0-9a-fA-F_]*(?:_?[ui]\d+)?/, category: 'number' },
    { pattern: /0[bB][01][01_]*(?:_?[ui]\d+)?/, category: 'number' },
    { pattern: /0[oO][0-7][0-7_]*(?:_?[ui]\d+)?/, category: 'number' },
    { pattern: /\d[\d_]*\.[\d_]*(?:[eE][+-]?\d[\d_]*)?(?:_?f\d+)?/, category: 'number' },
    { pattern: /\d[\d_]*(?:_?[uif]\d+)?/, category: 'number' },
    // Constants
    { pattern: new RegExp(`\\b(?:${CONSTANTS.join('|')})\\b`), category: 'constant' },
    // Keywords
    { pattern: new RegExp(`\\b(?:${KEYWORDS.join('|')})\\b`), category: 'keyword' },
    // Types
    { pattern: new RegExp(`\\b(?:${TYPES.join('|')})\\b`), category: 'type' },
    // Function calls
    { pattern: /\b[a-zA-Z_]\w*(?=\s*\()/, category: 'function' },
    // Operators
    { pattern: /=>|->|::|\.\.=|\.\.|<<|>>|==|!=|<=|>=|&&|\|\|/, category: 'operator' },
    { pattern: /[+\-*/%=<>!&|^~?:@]/, category: 'operator' },
    // Punctuation
    { pattern: /[{}()[\];,.]/, category: 'punctuation' },
    // Identifiers and whitespace
    { pattern: /[a-zA-Z_]\w*/, category: 'plain' },
    { pattern: /\s+/, category: 'plain' },
  ];
}

let patterns: TokenPattern[] | null = null;

export function tokenizeRust(code: string): HighlightToken[] {
  if (!patterns) {
    patterns = buildPatterns();
  }
  return tokenize(code, patterns);
}
