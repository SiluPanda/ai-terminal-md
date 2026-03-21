import { visibleLength, stripAnsi } from './ansi';

/**
 * Word-wrap text to fit within a given width.
 *
 * - Breaks at word boundaries (spaces).
 * - Preserves existing newlines.
 * - Continuation lines preserve the same indent level as the first line.
 * - ANSI escape sequences are treated as zero-width for width calculations.
 *
 * @param text - The text to wrap.
 * @param width - Maximum visible width per line.
 * @returns Wrapped text.
 */
export function wordWrap(text: string, width: number): string {
  if (width <= 0) return text;

  const lines = text.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    if (visibleLength(line) <= width) {
      result.push(line);
      continue;
    }

    const indent = getIndent(line);
    const indentWidth = indent.length;
    const wrappedLines = wrapLine(line, width, indent, indentWidth);
    result.push(...wrappedLines);
  }

  return result.join('\n');
}

/**
 * Extract the leading whitespace (indent) from a plain-text view of a line.
 * Returns the actual characters from the original string that constitute the indent.
 */
function getIndent(line: string): string {
  const plain = stripAnsi(line);
  const match = plain.match(/^(\s+)/);
  if (!match) return '';

  // Find the corresponding position in the original string
  // by scanning past ANSI codes
  const targetLen = match[1].length;
  let plainIdx = 0;
  let origIdx = 0;
  // eslint-disable-next-line no-control-regex
  const ansiRegex = /\x1b\[[0-9;]*m/g;
  let ansiMatch: RegExpExecArray | null;
  const ansiPositions: Array<{ start: number; end: number }> = [];

  while ((ansiMatch = ansiRegex.exec(line)) !== null) {
    ansiPositions.push({ start: ansiMatch.index, end: ansiMatch.index + ansiMatch[0].length });
  }

  let ansiIdx = 0;
  while (plainIdx < targetLen && origIdx < line.length) {
    // Skip any ANSI sequences at this position
    while (ansiIdx < ansiPositions.length && origIdx === ansiPositions[ansiIdx].start) {
      origIdx = ansiPositions[ansiIdx].end;
      ansiIdx++;
    }
    if (origIdx < line.length) {
      plainIdx++;
      origIdx++;
    }
  }

  return line.slice(0, origIdx);
}

/**
 * Wrap a single line that exceeds the width.
 * ANSI-aware: escape sequences don't count toward visible width.
 */
function wrapLine(line: string, width: number, indent: string, indentWidth: number): string[] {
  const words = splitWords(line.trimStart());
  const result: string[] = [];
  let currentLine = indent;
  let currentWidth = indentWidth;
  let isFirstLine = true;

  // For first line, use original indent; for continuation, use same indent
  const firstIndent = indent;
  const contIndent = indent;
  const contIndentWidth = indentWidth;

  for (const word of words) {
    const wordWidth = visibleLength(word);

    if (currentWidth === (isFirstLine ? indentWidth : contIndentWidth)) {
      // First word on the line — always add it (even if it overflows)
      currentLine += word;
      currentWidth += wordWidth;
    } else if (currentWidth + 1 + wordWidth <= width) {
      // Word fits with a space
      currentLine += ' ' + word;
      currentWidth += 1 + wordWidth;
    } else {
      // Word doesn't fit — wrap to new line
      result.push(currentLine);
      isFirstLine = false;
      currentLine = contIndent + word;
      currentWidth = contIndentWidth + wordWidth;
    }
  }

  if (currentLine.length > 0 || (currentLine === firstIndent && words.length === 0)) {
    result.push(currentLine);
  }

  return result;
}

/**
 * Split text into words, preserving ANSI codes attached to words.
 * Splits on spaces only.
 */
function splitWords(text: string): string[] {
  if (text === '') return [];

  const words: string[] = [];
  let current = '';
  let inAnsi = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === '\x1b') {
      inAnsi = true;
      current += ch;
      continue;
    }

    if (inAnsi) {
      current += ch;
      if (ch === 'm') {
        inAnsi = false;
      }
      continue;
    }

    if (ch === ' ') {
      if (current !== '') {
        words.push(current);
        current = '';
      }
      continue;
    }

    current += ch;
  }

  if (current !== '') {
    words.push(current);
  }

  return words;
}
