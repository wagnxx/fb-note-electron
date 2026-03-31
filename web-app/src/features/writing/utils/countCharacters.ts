/**
 * Count characters using the "remove all whitespace" rule (consistent with 番茄):
 * - Normalize CRLF to LF.
 * - Remove all Unicode whitespace (\s) and return the remaining length.
 */
export default function countCharacters(text: string | undefined | null): number {
  if (!text || typeof text !== 'string') return 0

  // Normalize CRLF -> LF then remove all whitespace
  return text.replace(/\r\n/g, '\n').replace(/\s/g, '').length
}
