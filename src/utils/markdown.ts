import TurndownService from 'turndown'

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-'
})

turndownService.addRule('pre', function(content: string) {
  return '\n\n' + content + '\n\n'
})

turndownService.addRule('figure', function(content: string) {
  return '\n' + content + '\n'
})

export function htmlToMarkdown(html: string): string {
  if (!html) return ''
  
  if (!html.includes('<') && !html.includes('>')) {
    return html
  }
  
  try {
    return turndownService.turndown(html)
  } catch (error) {
    console.error('HTML to Markdown conversion error:', error)
    return html
  }
}

export function isHtmlContent(content: string): boolean {
  if (!content) return false
  return content.includes('<') && content.includes('>')
}

export function isMarkdownContent(content: string): boolean {
  if (!content) return false
  return !isHtmlContent(content) && (content.includes('#') || content.includes('**') || content.includes('`') || content.includes('- '))
}
