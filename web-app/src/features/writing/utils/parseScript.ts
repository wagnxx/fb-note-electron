/**
 * Parse a short-video script text into sections.
 *
 * Rules:
 * - Normalize line endings to LF.
 * - A sequence of >= `blankLineThreshold` empty lines separates sections (default 2).
 * - A line containing only `---` (allowing surrounding whitespace) acts as a strong section delimiter;
 *   text between two `---` separators is treated as one section (separator has higher priority).
 * - Sections have leading/trailing blank lines trimmed (leading blank lines are removed to satisfy requirement).
 * - Empty sections are omitted by default (configurable).
 */

export type ParseOptions = {
  blankLineThreshold?: number // default 2 (>=2 consecutive blank lines split sections)
  separatorRegex?: RegExp // default /^\\s*---\\s*$/
  keepEmptySections?: boolean // default false
}

export function parseScriptIntoSections(text: string, opts: ParseOptions = {}) {
  const { blankLineThreshold = 2, separatorRegex = /^\s*---\s*$/, keepEmptySections = false } = opts

  if (!text || typeof text !== 'string') return []

  // Normalize CRLF -> LF
  const normalized = text.replace(/\r\n/g, '\n')
  const lines = normalized.split('\n')

  const sections: string[] = []
  let buf: string[] = []

  const trimSection = (s: string) => {
    // Remove leading blank lines and trailing blank lines
    return s.replace(/^(?:\s*\n)+/, '').replace(/(?:\n\s*)+$/, '')
  }

  const flushBuf = () => {
    if (buf.length === 0) {
      if (keepEmptySections) sections.push('')
      return
    }
    const joined = buf.join('\n')
    const trimmed = trimSection(joined)
    buf = []
    if (trimmed.length > 0 || keepEmptySections) sections.push(trimmed)
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    // Separator line (strong delimiter)
    if (separatorRegex.test(line)) {
      // Flush current buffer as a section
      flushBuf()

      // Collect everything until next separator (exclusive)
      i++
      const sepBuf: string[] = []
      while (i < lines.length && !separatorRegex.test(lines[i])) {
        sepBuf.push(lines[i])
        i++
      }
      const sepJoined = sepBuf.join('\n')
      const sepTrimmed = trimSection(sepJoined)
      if (sepTrimmed.length > 0 || keepEmptySections) {
        sections.push(sepTrimmed)
      }
      // continue without i++ because while loop checks current line
      continue
    }

    // Handle blank lines threshold splitting
    if (/^\s*$/.test(line)) {
      // count consecutive blank lines
      let j = i
      let blankCount = 0
      while (j < lines.length && /^\s*$/.test(lines[j])) {
        blankCount++
        j++
      }

      if (blankCount >= blankLineThreshold) {
        // split section here
        flushBuf()
        i = j
        continue
      } else {
        // Keep those blank lines inside the buffer (as single blank lines)
        for (let k = 0; k < blankCount; k++) buf.push('')
        i = j
        continue
      }
    }

    // Normal content
    buf.push(line)
    i++
  }

  // Final flush
  flushBuf()

  return sections
}

export default parseScriptIntoSections
