/**
 * Highlight search keywords in text
 * @param text - Original text
 * @param keyword - Keyword to highlight
 * @returns HTML string with keyword wrapped in <mark> tags
 */
export function highlightText(text: string, keyword: string): string {
  if (!text || !keyword) return text

  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedKeyword})`, 'gi')
  return text.replace(regex, '<mark class="search-highlight">$1</mark>')
}

/**
 * Highlight multiple keywords in text
 * @param text - Original text
 * @param keywords - Array of keywords to highlight
 * @returns HTML string with keywords wrapped in <mark> tags
 */
export function highlightMultiple(text: string, keywords: string[]): string {
  if (!text || !keywords.length) return text

  let result = text
  keywords.forEach(keyword => {
    if (keyword.trim()) {
      result = highlightText(result, keyword.trim())
    }
  })
  return result
}
