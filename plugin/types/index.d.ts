export type CellsmithMarkdownArgs<Surface> = {
  surface: Surface
  text: string
  columns: number
}

export type Cellsmith<Surface, Drawing> = {
  markdown: (args: CellsmithMarkdownArgs<Surface>) => Promise<Drawing | undefined>
}

declare module 'claude-code' {
  interface EngineInterface {
    cellsmith: Cellsmith<RenderSurface, RenderElement>
  }
  interface PluginState {
    cellsmith: { formulas: Record<string, unknown>; dir: string }
  }
}
