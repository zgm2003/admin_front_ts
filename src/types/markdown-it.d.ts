declare module 'markdown-it' {
  interface MarkdownItOptions {
    html?: boolean
    linkify?: boolean
    typographer?: boolean
    highlight?: (str: string, lang: string) => string
  }

  interface MarkdownIt {
    render(src: string): string
    inline: {
      ruler: {
        before(beforeName: string, ruleName: string, rule: (state: MarkdownItInlineState, silent: boolean) => boolean): void
      }
    }
    utils: {
      escapeHtml(str: string): string
    }
  }

  interface MarkdownItInlineState {
    src: string
    pos: number
    push(type: string, tag: string, nesting: number): { content: string }
  }

  interface MarkdownItConstructor {
    new (options?: MarkdownItOptions): MarkdownIt
    (options?: MarkdownItOptions): MarkdownIt
  }

  const MarkdownIt: MarkdownItConstructor
  export default MarkdownIt
}
