export const formatSecondsToHHmmss = (seconds: number, sep?: string): string => {
  const seqSymbol = sep || ':'
  const hrs = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, '0')
  const mins = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, '0')
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')
  return `${hrs}${seqSymbol}${mins}${seqSymbol}${secs}`
}
