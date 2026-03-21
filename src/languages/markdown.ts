import type { HighlightToken } from '../types';
import { tokenize, type TokenPattern } from '../highlighter';

function buildPatterns(): TokenPattern[] {
  return [
    // Setext headings (before paragraph detection)
    { pattern: /^[=]{2,}$|^[-]{2,}$/, category: 'keyword' },
    // ATX headings: # through ######
    { pattern: /^#{1,6}\s+[^\n]*/, category: 'keyword' },
    // Fenced code blocks (simplified — just the fence line)
    { pattern: /^```[^\n]*|^~~~[^\n]*/, category: 'string' },
    // Horizontal rules: --- *** ___
    { pattern: /^(?:[-*_][ \t]*){3,}$/, category: 'operator' },
    // Bold+italic: ***text***
    { pattern: /\*{3}(?:[^*]|\*(?!\*\*))*\*{3}/, category: 'keyword' },
    // Bold: **text** or __text__
    { pattern: /\*{2}(?:[^*]|\*(?!\*))*\*{2}/, category: 'keyword' },
    { pattern: /__(?:[^_]|_(?!_))*__/, category: 'keyword' },
    // Italic: *text* or _text_
    { pattern: /\*(?:[^*])*\*/, category: 'string' },
    { pattern: /_(?:[^_])*_/, category: 'string' },
    // Strikethrough: ~~text~~
    { pattern: /~~(?:[^~]|~(?!~))*~~/, category: 'operator' },
    // Inline code: `code`
    { pattern: /`[^`]+`/, category: 'constant' },
    // Links: [text](url) or [text][ref]
    { pattern: /\[[^\]]*\]\([^)]*\)/, category: 'variable' },
    { pattern: /\[[^\]]*\]\[[^\]]*\]/, category: 'variable' },
    // Reference definitions: [ref]: url
    { pattern: /^\[[^\]]+\]:\s+\S+/, category: 'variable' },
    // Images: ![alt](url)
    { pattern: /!\[[^\]]*\]\([^)]*\)/, category: 'type' },
    // Unordered list markers
    { pattern: /^[ \t]*[*+-]\s/, category: 'property' },
    // Ordered list markers
    { pattern: /^[ \t]*\d+[.)]\s/, category: 'property' },
    // Blockquote markers
    { pattern: /^[ \t]*>\s?/, category: 'comment' },
    // HTML inline: <tag>
    { pattern: /<[a-zA-Z/][^>]*>/, category: 'tag' },
    // Whitespace
    { pattern: /\s+/, category: 'plain' },
    // Everything else
    { pattern: /[^\s]+/, category: 'plain' },
  ];
}

let patterns: TokenPattern[] | null = null;

export function tokenizeMarkdown(code: string): HighlightToken[] {
  if (!patterns) {
    patterns = buildPatterns();
  }
  return tokenize(code, patterns);
}
