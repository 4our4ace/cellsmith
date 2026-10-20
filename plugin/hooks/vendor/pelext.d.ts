export type PeleRender = (source: string, options?: Record<string, unknown>) => {
    svg: string;
    type: string;
    width: number;
};
export type PelePalette = {
    canvas: string;
    text?: string;
    muted?: string;
    line?: string;
    border?: string;
    accent?: string;
    critical?: string;
    highlight?: string;
    series: string[];
    hues: string[];
};
export type PeleSpan = {
    text: string;
    fg?: string;
    bg?: string;
    bold?: boolean;
    inverse?: boolean;
};
export type PeleArt = {
    type: string;
    rows: PeleSpan[][];
    art: string;
    width: number;
};
export declare const drawPele: (render: PeleRender, source: string, palette: PelePalette, columns: number) => PeleArt | null;
export declare const toAnsi: (art: PeleArt) => string[];
