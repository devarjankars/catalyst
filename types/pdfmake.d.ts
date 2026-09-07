/**
 * Minimal type declarations for the untyped client-side PDF modules used by the
 * VSB PDF export (pdfmake / html-to-pdfmake ships without bundled types).
 */

declare module 'pdfmake/build/pdfmake' {
  interface PdfMakeCreateResult {
    getBlob(): Promise<Blob>;
    getBuffer(): Promise<Uint8Array>;
    getBase64(): Promise<string>;
    getDataUrl(): Promise<string>;
    download(fileName?: string): Promise<void>;
  }

  const pdfMake: {
    vfs?: Record<string, string>;
    fonts?: any;
    createPdf(docDefinition: any, options?: any): PdfMakeCreateResult;
    addVirtualFileSystem(vfs: Record<string, string>): void;
    addFonts(fonts: any): void;
    setFonts(fonts: any): void;
    addFontContainer(container: { vfs: Record<string, string>; fonts: any }): void;
  };

  export default pdfMake;
  export type PdfMake = typeof pdfMake;
}

declare module 'pdfmake/build/vfs_fonts' {
  /** Map of font file name → base64-encoded font data. */
  const vfs: Record<string, string>;
  export default vfs;
}

declare module 'html-to-pdfmake' {
  interface HtmlToPdfmakeOptions {
    defaultStyles?: Record<string, any>;
    tableAutoSize?: boolean;
    imagesByReference?: boolean;
    removeExtraBlanks?: boolean;
    showHidden?: boolean;
    removeTagClasses?: boolean;
    ignoreStyles?: string[];
    window?: any;
  }
  /** Convert an HTML string to a pdfmake content definition. */
  function htmlToPdfmake(htmlText: string, options?: HtmlToPdfmakeOptions): any;
  export default htmlToPdfmake;
}