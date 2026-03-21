import { randomUUID } from 'crypto';

export type AIElementType =
  | 'thinking'
  | 'artifact'
  | 'tool-use'
  | 'tool-result'
  | 'semantic-wrapper'
  | 'citation';

export interface ThinkingElement {
  type: 'thinking';
  content: string;
  tagName: string;
}

export interface ArtifactElement {
  type: 'artifact';
  artifactType?: string;
  title?: string;
  identifier?: string;
  content: string;
}

export interface ToolUseElement {
  type: 'tool-use';
  toolName: string;
  arguments: Record<string, unknown>;
}

export interface ToolResultElement {
  type: 'tool-result';
  toolName?: string;
  isError: boolean;
  content: string;
}

export interface SemanticWrapperElement {
  type: 'semantic-wrapper';
  tagName: string;
  content: string;
}

export interface CitationElement {
  type: 'citation';
  index: number;
  label: string;
}

export type AIElement =
  | ThinkingElement
  | ArtifactElement
  | ToolUseElement
  | ToolResultElement
  | SemanticWrapperElement
  | CitationElement;

export interface ParseResult {
  cleanedMarkdown: string;
  elements: Map<string, AIElement>;
}

/** Thinking tag names (case-insensitive). */
const THINKING_TAGS = [
  'thinking',
  'antThinking',
  'reflection',
  'scratchpad',
  'reasoning',
  'inner_monologue',
  'thought',
];

/** Semantic wrapper tag names (case-insensitive). */
const SEMANTIC_WRAPPER_TAGS = ['result', 'answer', 'output', 'response'];

/** Tool use container tag names (case-insensitive). */
const TOOL_USE_TAGS = ['tool_use', 'function_call', 'tool_call'];

/** Tool result container tag names (case-insensitive). */
const TOOL_RESULT_TAGS = ['tool_result', 'function_result'];

/** Build a regex that matches <tagName>...</tagName> (case-insensitive, dotall). */
function buildTagRegex(tagName: string, withAttrs = false): RegExp {
  const opening = withAttrs
    ? `<${tagName}((?:\\s+[^>]*)?)>`
    : `<${tagName}(?:\\s[^>]*)?>`;
  return new RegExp(`${opening}([\\s\\S]*?)<\\/${tagName}>`, 'gi');
}

/** Extract an attribute value from an HTML-like attribute string. */
function extractAttr(attrs: string, name: string): string | undefined {
  const m = attrs.match(new RegExp(`${name}=["']([^"']*)["']`, 'i'));
  return m ? m[1] : undefined;
}

/** Parse tool arguments/parameters from a block of XML-ish text. */
function parseToolArguments(content: string): Record<string, unknown> {
  // Try to find a JSON blob in <arguments> or <parameters>
  const jsonBlockRe = /<(?:arguments|parameters)>([\s\S]*?)<\/(?:arguments|parameters)>/i;
  const jsonMatch = content.match(jsonBlockRe);
  if (jsonMatch) {
    const raw = jsonMatch[1].trim();
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Fall through to key-value extraction
    }
  }

  // Try to extract bare key-value tags, e.g. <key>value</key>
  const args: Record<string, unknown> = {};
  const kvRe = /<([a-zA-Z_][a-zA-Z0-9_]*)>([\s\S]*?)<\/\1>/g;
  let m: RegExpExecArray | null;
  while ((m = kvRe.exec(content)) !== null) {
    const key = m[1];
    // Skip the container tags themselves
    if (['arguments', 'parameters', 'tool_name', 'name'].includes(key.toLowerCase())) continue;
    const val = m[2].trim();
    // Attempt to parse as JSON
    try {
      args[key] = JSON.parse(val);
    } catch {
      args[key] = val;
    }
  }
  return args;
}

/** Extract tool name from XML-ish content. */
function extractToolName(content: string): string {
  const nameRe = /<(?:tool_name|name)>([\s\S]*?)<\/(?:tool_name|name)>/i;
  const m = content.match(nameRe);
  return m ? m[1].trim() : 'unknown';
}

/** Check whether a tool result is an error. */
function isToolError(content: string): boolean {
  const errAttrRe = /is_error\s*=\s*["']?(true|1|yes)["']?/i;
  const errTagRe = /<is_error>(true|1|yes)<\/is_error>/i;
  const statusRe = /<status>(error|failed|failure)<\/status>/i;
  return errAttrRe.test(content) || errTagRe.test(content) || statusRe.test(content);
}

/**
 * Parse AI-specific XML elements from markdown, replacing each match with
 * a null-byte placeholder keyed by UUID.
 *
 * Order of extraction matters — process more-specific tags before generic
 * ones to avoid overlap.
 */
export function parseAIElements(markdown: string): ParseResult {
  const elements = new Map<string, AIElement>();
  let text = markdown;

  function placeholder(el: AIElement): string {
    const id = randomUUID();
    elements.set(id, el);
    return `\x00AI:${id}\x00`;
  }

  // 1. antArtifact (most specific — process before generic <artifact>)
  const antArtifactRe = /<antArtifact((?:\s+[^>]*)?)>([\s\S]*?)<\/antArtifact>/gi;
  text = text.replace(antArtifactRe, (_full, attrs: string, content: string) => {
    const el: ArtifactElement = {
      type: 'artifact',
      artifactType: extractAttr(attrs, 'type'),
      title: extractAttr(attrs, 'title'),
      identifier: extractAttr(attrs, 'identifier'),
      content: content.trim(),
    };
    return placeholder(el);
  });

  // 2. Generic <artifact>
  const artifactRe = /<artifact((?:\s+[^>]*)?)>([\s\S]*?)<\/artifact>/gi;
  text = text.replace(artifactRe, (_full, attrs: string, content: string) => {
    const el: ArtifactElement = {
      type: 'artifact',
      artifactType: extractAttr(attrs, 'type'),
      title: extractAttr(attrs, 'title'),
      identifier: extractAttr(attrs, 'identifier'),
      content: content.trim(),
    };
    return placeholder(el);
  });

  // 3. Tool use tags
  for (const tag of TOOL_USE_TAGS) {
    const re = buildTagRegex(tag);
    text = text.replace(re, (_full, content: string) => {
      const toolName = extractToolName(content);
      const args = parseToolArguments(content);
      const el: ToolUseElement = {
        type: 'tool-use',
        toolName,
        arguments: args,
      };
      return placeholder(el);
    });
  }

  // 4. Tool result tags
  for (const tag of TOOL_RESULT_TAGS) {
    const tagRe = new RegExp(`<${tag}((?:\\s+[^>]*)?)>([\\s\\S]*?)<\\/${tag}>`, 'gi');
    text = text.replace(tagRe, (_full, attrs: string, content: string) => {
      const toolName = extractAttr(attrs, 'tool') ?? extractAttr(attrs, 'name') ?? extractToolName(content);
      const el: ToolResultElement = {
        type: 'tool-result',
        toolName,
        isError: isToolError(attrs + ' ' + content),
        content: content.trim(),
      };
      return placeholder(el);
    });
  }

  // 5. Thinking tags (case-insensitive)
  for (const tag of THINKING_TAGS) {
    const re = new RegExp(`<(${tag})(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'gi');
    text = text.replace(re, (_full, tagName: string, content: string) => {
      const el: ThinkingElement = {
        type: 'thinking',
        content: content.trim(),
        tagName: tagName.toLowerCase(),
      };
      return placeholder(el);
    });
  }

  // 6. Semantic wrapper tags
  for (const tag of SEMANTIC_WRAPPER_TAGS) {
    const re = new RegExp(`<(${tag})(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'gi');
    text = text.replace(re, (_full, tagName: string, content: string) => {
      const el: SemanticWrapperElement = {
        type: 'semantic-wrapper',
        tagName: tagName.toLowerCase(),
        content: content.trim(),
      };
      return placeholder(el);
    });
  }

  // 7. Standalone citations: [1], [2], etc. — but NOT markdown links [text](url)
  //    Match [digits] not followed by (
  const citationRe = /\[(\d+)\](?!\()/g;
  text = text.replace(citationRe, (_full, digits: string) => {
    const index = parseInt(digits, 10);
    const el: CitationElement = {
      type: 'citation',
      index,
      label: digits,
    };
    return placeholder(el);
  });

  return { cleanedMarkdown: text, elements };
}
