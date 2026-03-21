import type { HighlightToken } from '../types';
import { tokenize, type TokenPattern } from '../highlighter';

const KEYWORDS = [
  'ADD', 'ALL', 'ALTER', 'AND', 'AS', 'ASC', 'BETWEEN', 'BY', 'CASE',
  'CAST', 'CHECK', 'COLUMN', 'CONSTRAINT', 'COUNT', 'CREATE', 'CROSS',
  'DATABASE', 'DEFAULT', 'DELETE', 'DESC', 'DISTINCT', 'DROP', 'ELSE',
  'END', 'EXCEPT', 'EXISTS', 'EXPLAIN', 'FALSE', 'FOREIGN', 'FROM',
  'FULL', 'GROUP', 'HAVING', 'IN', 'INNER', 'INSERT', 'INTERSECT', 'INTO',
  'IS', 'JOIN', 'KEY', 'LEFT', 'LIKE', 'LIMIT', 'NOT', 'NULL', 'OFFSET',
  'ON', 'OR', 'ORDER', 'OUTER', 'PRIMARY', 'REFERENCES', 'RIGHT',
  'ROLLBACK', 'SELECT', 'SET', 'TABLE', 'THEN', 'TOP', 'TRUNCATE', 'TRUE',
  'UNION', 'UNIQUE', 'UPDATE', 'VALUES', 'VIEW', 'WHEN', 'WHERE', 'WITH',
  // PostgreSQL extras
  'RETURNING', 'ILIKE', 'SIMILAR', 'RECURSIVE', 'LATERAL', 'FILTER',
  'OVER', 'PARTITION', 'WINDOW', 'ROWS', 'RANGE', 'PRECEDING', 'FOLLOWING',
  'CURRENT', 'UNBOUNDED',
];

const TYPES = [
  'BIGINT', 'BINARY', 'BLOB', 'BOOLEAN', 'CHAR', 'DATE', 'DATETIME',
  'DECIMAL', 'DOUBLE', 'FLOAT', 'INT', 'INTEGER', 'JSON', 'MEDIUMINT',
  'NUMERIC', 'REAL', 'SMALLINT', 'TEXT', 'TIME', 'TIMESTAMP', 'TINYINT',
  'UUID', 'VARCHAR',
];

// Case-insensitive keyword pattern
function caseInsensitivePattern(words: string[]): RegExp {
  return new RegExp(`\\b(?:${words.join('|')})\\b`, 'i');
}

function buildPatterns(): TokenPattern[] {
  return [
    // Block comments
    { pattern: /\/\*[\s\S]*?\*\//, category: 'comment' },
    // Line comments: -- comment
    { pattern: /--[^\n]*/, category: 'comment' },
    // Single-quoted string literals
    { pattern: /'(?:[^'\\]|\\.)*'/, category: 'string' },
    // Double-quoted identifiers
    { pattern: /"(?:[^"\\]|\\.)*"/, category: 'string' },
    // Backtick identifiers (MySQL)
    { pattern: /`[^`]*`/, category: 'string' },
    // Numbers: decimal, float
    { pattern: /\d+\.\d*(?:[eE][+-]?\d+)?/, category: 'number' },
    { pattern: /\.\d+(?:[eE][+-]?\d+)?/, category: 'number' },
    { pattern: /\d+(?:[eE][+-]?\d+)?/, category: 'number' },
    // Types (case-insensitive)
    { pattern: caseInsensitivePattern(TYPES), category: 'type' },
    // Keywords (case-insensitive)
    { pattern: caseInsensitivePattern(KEYWORDS), category: 'keyword' },
    // Parameters: :name or @name or ?
    { pattern: /:\w+|@\w+|\?/, category: 'variable' },
    // Operators
    { pattern: /!=|<>|<=|>=|::/, category: 'operator' },
    { pattern: /[+\-*/%=<>!&|^~]/, category: 'operator' },
    // Punctuation
    { pattern: /[{}()[\];,.]/, category: 'punctuation' },
    // Identifiers and whitespace
    { pattern: /[a-zA-Z_]\w*/, category: 'plain' },
    { pattern: /\s+/, category: 'plain' },
  ];
}

let patterns: TokenPattern[] | null = null;

export function tokenizeSQL(code: string): HighlightToken[] {
  if (!patterns) {
    patterns = buildPatterns();
  }
  return tokenize(code, patterns);
}
