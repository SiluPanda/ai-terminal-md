import type { HighlightToken } from '../types';
import { tokenizeJavaScript, tokenizeTypeScript } from './javascript';
import { tokenizeRust } from './rust';
import { tokenizeGo } from './go';
import { tokenizeJava } from './java';
import { tokenizeRuby } from './ruby';
import { tokenizeShell } from './shell';
import { tokenizeSQL } from './sql';
import { tokenizeHTML, tokenizeCSS } from './web';
import { tokenizeJSON, tokenizeYAML } from './data';
import { tokenizeMarkdown } from './markdown';
import { tokenizeC } from './c';
import { tokenizePHP } from './php';

/** A tokenizer function that takes code and returns highlighted tokens. */
export type LanguageTokenizer = (code: string) => HighlightToken[];

/** Map of fence tag aliases to canonical language names. */
const aliases: Record<string, string> = {
  js: 'javascript',
  javascript: 'javascript',
  ts: 'typescript',
  typescript: 'typescript',
  py: 'python',
  python: 'python',
  rs: 'rust',
  rust: 'rust',
  go: 'go',
  golang: 'go',
  java: 'java',
  rb: 'ruby',
  ruby: 'ruby',
  bash: 'shell',
  sh: 'shell',
  shell: 'shell',
  zsh: 'shell',
  sql: 'sql',
  html: 'html',
  htm: 'html',
  css: 'css',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  markdown: 'markdown',
  md: 'markdown',
  c: 'c',
  cpp: 'c',
  'c++': 'c',
  h: 'c',
  hpp: 'c',
  php: 'php',
};

/** Tokenizer registry mapping canonical names to tokenizer functions. */
const tokenizers: Record<string, LanguageTokenizer | undefined> = {
  javascript: tokenizeJavaScript,
  typescript: tokenizeTypeScript,
  rust: tokenizeRust,
  go: tokenizeGo,
  java: tokenizeJava,
  ruby: tokenizeRuby,
  shell: tokenizeShell,
  sql: tokenizeSQL,
  html: tokenizeHTML,
  css: tokenizeCSS,
  json: tokenizeJSON,
  yaml: tokenizeYAML,
  markdown: tokenizeMarkdown,
  c: tokenizeC,
  php: tokenizePHP,
};

/**
 * Get the tokenizer function for a given fence tag.
 * Returns undefined if the language is not recognized or has no tokenizer yet.
 */
export function getLanguageTokenizer(tag: string): LanguageTokenizer | undefined {
  const normalized = tag.toLowerCase().trim();
  const canonical = aliases[normalized];
  if (!canonical) return undefined;
  return tokenizers[canonical];
}

/**
 * Check whether a language tag is recognized (has an alias mapping).
 */
export function isLanguageSupported(tag: string): boolean {
  const normalized = tag.toLowerCase().trim();
  return normalized in aliases;
}

/**
 * Register a tokenizer for a canonical language name.
 * Used to add language support at runtime.
 */
export function registerTokenizer(canonical: string, tokenizer: LanguageTokenizer): void {
  tokenizers[canonical] = tokenizer;
}
