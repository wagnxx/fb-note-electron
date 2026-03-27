/**
 * Strip common Markdown syntax while preserving plain text and line breaks.
 * - Removes heading markers (#), bold/italic markers, links/images (keeps link text),
 *   blockquotes, list markers, inline/backtick code markers, and fences.
 * - Preserves newlines so rendered text keeps paragraph/line structure.
 */
export default function stripMarkdown(text: string): string {
  if (!text || typeof text !== 'string') return ''

  let s = text.replace(/\r\n/g, '\n')

  // Remove fenced code blocks but keep inner content
  s = s.replace(/```(?:\n)?([\s\S]*?)```/g, (_, inner) => inner || '')

  // Inline code
  s = s.replace(/`([^`]+)`/g, '$1')

  // Headings: remove leading # characters
  s = s.replace(/^\s{0,3}#{1,6}\s*/gm, '')

  // Bold / italic (both **bold** and __bold__ and *italic* and _italic_)
  s = s.replace(/\*\*(.+?)\*\*/g, '$1')
  s = s.replace(/__(.+?)__/g, '$1')
  s = s.replace(/\*(.+?)\*/g, '$1')
  s = s.replace(/_(.+?)_/g, '$1')

  // Images: ![alt](url) -> alt
  s = s.replace(/!\[([^\]]*)\]\([^\)]*\)/g, '$1')

  // Links: [text](url) -> text
  s = s.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')

  // Blockquotes
  s = s.replace(/^\s*>\s?/gm, '')

  // List markers (unordered and ordered)
  s = s.replace(/^\s*[-*+]\s+/gm, '')
  s = s.replace(/^\s*\d+\.\s+/gm, '')

  // Horizontal rules
  s = s.replace(/^(-{3,}|\*{3,}|_{3,})\s*$/gm, '')

  // Remove remaining stray markers like multiple tildes/backticks/asterisks
  s = s.replace(/[~`*]{1,3}/g, '')

  // Trim trailing spaces at line ends
  s = s.replace(/[ \t]+$/gm, '')

  // Trim overall whitespace
  return s.replace(/^\s+/, '').replace(/\s+$/, '')
}
