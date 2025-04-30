declare module 'pdfjs-dist/web/pdf_viewer' {
  import type { PDFPageProxy } from 'pdfjs-dist'
  import type { PageViewport } from 'pdfjs-dist/types/src/display/display_utils'

  export class TextLayerBuilder {
    constructor(params: {
      textLayerDiv: HTMLDivElement
      pageIndex: number
      viewport: PageViewport
      enhanceTextSelection?: boolean
    })

    setTextContent(content: Awaited<ReturnType<PDFPageProxy['getTextContent']>>): void
    render(): void
  }
}
