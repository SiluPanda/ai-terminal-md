import type { HighlightToken, TokenCategory, CustomHighlighter } from './types';
import { getLanguageTokenizer, type LanguageTokenizer } from './languages/index';

/**
 * A single token pattern definition for a language tokenizer.
 * The regex is matched against the remaining code string at each position.
 */
export interface TokenPattern {
  pattern: RegExp;
  category: TokenCategory;
}

/**
 * Tokenize code into highlighted tokens using a set of ordered patterns.
 * Patterns are tested in order at each position. The first match wins.
 * Unmatched characters are grouped into 'plain' tokens.
 */
export function tokenize(code: string, patterns: TokenPattern[]): HighlightToken[] {
  const tokens: HighlightToken[] = [];
  let pos = 0;
  let plainBuffer = '';

  function flushPlain(): void {
    if (plainBuffer.length > 0) {
      tokens.push({ text: plainBuffer, category: 'plain' });
      plainBuffer = '';
    }
  }

  while (pos < code.length) {
    let matched = false;

    for (const { pattern, category } of patterns) {
      // Reset lastIndex for sticky-like behavior
      pattern.lastIndex = 0;
      const remaining = code.slice(pos);
      const match = pattern.exec(remaining);

      if (match && match.index === 0 && match[0].length > 0) {
        flushPlain();
        tokens.push({ text: match[0], category });
        pos += match[0].length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      plainBuffer += code[pos];
      pos++;
    }
  }

  flushPlain();
  return tokens;
}

/**
 * Highlight code using the built-in tokenizer for the given language.
 * Returns an array of tokens with semantic categories.
 * If the language is not recognized, returns a single plain token.
 */
export function highlight(code: string, language: string): HighlightToken[] {
  const tokenizer = getLanguageTokenizer(language);
  if (!tokenizer) {
    return [{ text: code, category: 'plain' }];
  }
  return tokenizer(code);
}

/**
 * Highlight code with optional custom highlighter fallback to built-in.
 * 1. If a custom highlighter is provided, try it first.
 * 2. If it returns an empty array or throws, fall back to built-in.
 * 3. If no custom highlighter, use built-in directly.
 */
export function highlightWithFallback(
  code: string,
  language: string,
  customHighlighter?: CustomHighlighter,
): HighlightToken[] {
  if (customHighlighter) {
    try {
      const result = customHighlighter.highlight(code, language);
      if (result && result.length > 0) {
        return result;
      }
    } catch {
      // Fall through to built-in
    }
  }
  return highlight(code, language);
}

export type { LanguageTokenizer };
