import type { HighlightToken } from '../types';
import { tokenize, type TokenPattern } from '../highlighter';

// ── JSON Tokenizer ────────────────────────────────────────────────

function buildJSONPatterns(): TokenPattern[] {
  return [
    // Object keys: "key":
    { pattern: /"(?:[^"\\]|\\.)*"(?=\s*:)/, category: 'property' },
    // String values
    { pattern: /"(?:[^"\\]|\\.)*"/, category: 'string' },
    // Numbers: integer, float, scientific
    { pattern: /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/, category: 'number' },
    // Booleans and null
    { pattern: /\btrue\b/, category: 'constant' },
    { pattern: /\bfalse\b/, category: 'constant' },
    { pattern: /\bnull\b/, category: 'constant' },
    // Structural characters
    { pattern: /[{}[\]:,]/, category: 'punctuation' },
    // Whitespace
    { pattern: /\s+/, category: 'plain' },
  ];
}

// ── YAML Tokenizer ────────────────────────────────────────────────

function buildYAMLPatterns(): TokenPattern[] {
  return [
    // Comments
    { pattern: /#[^\n]*/, category: 'comment' },
    // Document markers
    { pattern: /^---$|^\.\.\.$/, category: 'keyword' },
    // Anchors: &anchor *alias
    { pattern: /[&*][a-zA-Z_][\w-]*/, category: 'variable' },
    // Tags: !!str, !tag
    { pattern: /!!?[a-zA-Z][\w,;/?:@&=+$\-.!~*'()%]*/, category: 'type' },
    // Double-quoted strings
    { pattern: /"(?:[^"\\]|\\.)*"/, category: 'string' },
    // Single-quoted strings
    { pattern: /'(?:[^'\\]|'')*'/, category: 'string' },
    // Block scalars: | and >
    { pattern: /[|>][+-]?(?:\d+)?/, category: 'keyword' },
    // Numbers: integer, float, hex, octal, scientific
    { pattern: /0[xX][0-9a-fA-F]+/, category: 'number' },
    { pattern: /0[oO][0-7]+/, category: 'number' },
    { pattern: /-?\d+\.?\d*(?:[eE][+-]?\d+)?/, category: 'number' },
    // Booleans (YAML 1.1 and 1.2)
    { pattern: /\b(?:true|True|TRUE|false|False|FALSE|yes|Yes|YES|no|No|NO|on|On|ON|off|Off|OFF)\b/, category: 'constant' },
    // Null values
    { pattern: /\b(?:null|Null|NULL|~)\b/, category: 'constant' },
    // Keys: unquoted text followed by colon
    { pattern: /[^:#{}[\],\s][^:{}[\],\n]*(?=\s*:)/, category: 'property' },
    // List item markers
    { pattern: /^-\s/, category: 'punctuation' },
    // Structural characters
    { pattern: /[{}[\]:,]/, category: 'punctuation' },
    // Identifiers and whitespace
    { pattern: /[^\s{}[\]:,#|>&*!]+/, category: 'plain' },
    { pattern: /\s+/, category: 'plain' },
  ];
}

let jsonPatterns: TokenPattern[] | null = null;
let yamlPatterns: TokenPattern[] | null = null;

export function tokenizeJSON(code: string): HighlightToken[] {
  if (!jsonPatterns) {
    jsonPatterns = buildJSONPatterns();
  }
  return tokenize(code, jsonPatterns);
}

export function tokenizeYAML(code: string): HighlightToken[] {
  if (!yamlPatterns) {
    yamlPatterns = buildYAMLPatterns();
  }
  return tokenize(code, yamlPatterns);
}
