import type { HighlightToken } from '../types';
import { tokenize, type TokenPattern } from '../highlighter';

const KEYWORDS = [
  'if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done',
  'case', 'esac', 'in', 'function', 'return', 'exit', 'break', 'continue',
  'select', 'until', 'time', 'coproc', 'local', 'declare', 'typeset',
  'readonly', 'export', 'unset', 'set', 'shift', 'trap', 'wait',
];

const BUILTINS = [
  'echo', 'printf', 'read', 'source', 'alias', 'unalias', 'cd', 'pwd',
  'pushd', 'popd', 'dirs', 'exec', 'eval', 'getopts', 'hash', 'help',
  'jobs', 'kill', 'let', 'mapfile', 'readarray', 'test', 'true', 'false',
  'type', 'ulimit', 'umask',
];

function buildPatterns(): TokenPattern[] {
  return [
    // Comments
    { pattern: /#[^\n]*/, category: 'comment' },
    // Double-quoted strings (allow variable interpolation — simplified)
    { pattern: /"(?:[^"\\`$]|\\.|\$(?:[{(][^})]*[})]|[a-zA-Z_?@!#*0-9]+))*"/, category: 'string' },
    // Single-quoted strings (no interpolation)
    { pattern: /'[^']*'/, category: 'string' },
    // ANSI-C quoting: $'...'
    { pattern: /\$'(?:[^'\\]|\\.)*'/, category: 'string' },
    // Command substitution: $(...)
    { pattern: /\$\([^)]*\)/, category: 'variable' },
    // Backtick command substitution
    { pattern: /`[^`]*`/, category: 'variable' },
    // Process substitution: <(...) >(...)
    { pattern: /[<>]\([^)]*\)/, category: 'variable' },
    // Variables: ${VAR}, $VAR, $1, $@, $#, etc.
    { pattern: /\$\{[^}]*\}/, category: 'variable' },
    { pattern: /\$[a-zA-Z_?@!#*0-9]+/, category: 'variable' },
    // Numbers
    { pattern: /\d+/, category: 'number' },
    // Keywords
    { pattern: new RegExp(`\\b(?:${KEYWORDS.join('|')})\\b`), category: 'keyword' },
    // Built-in commands
    { pattern: new RegExp(`\\b(?:${BUILTINS.join('|')})\\b`), category: 'function' },
    // Redirection operators
    { pattern: />>|<<|[<>]&?\d*/, category: 'operator' },
    // Operators
    { pattern: /==|!=|-eq|-ne|-lt|-le|-gt|-ge|-z|-n|-f|-d|-e/, category: 'operator' },
    { pattern: /[|&;!]/, category: 'operator' },
    // Punctuation
    { pattern: /[{}()[\]]/, category: 'punctuation' },
    // Option flags like -v, --verbose
    { pattern: /--?[a-zA-Z][-a-zA-Z0-9]*/, category: 'constant' },
    // Identifiers and whitespace
    { pattern: /[a-zA-Z_]\w*/, category: 'plain' },
    { pattern: /\s+/, category: 'plain' },
  ];
}

let patterns: TokenPattern[] | null = null;

export function tokenizeShell(code: string): HighlightToken[] {
  if (!patterns) {
    patterns = buildPatterns();
  }
  return tokenize(code, patterns);
}
