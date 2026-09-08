import { NextRequest, NextResponse } from 'next/server';
import { generateVsbPdfBuffer } from '@/lib/vsb-pdf-chromium';
import type { VsbPdfPageSpec } from '@/lib/vsb-pdf-export';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      pages?: VsbPdfPageSpec[];
      fileName?: string;
    };

    const pages = Array.isArray(body.pages) ? body.pages : [];
    if (!pages.length) {
      return NextResponse.json({ error: 'No pages supplied for PDF generation.' }, { status: 400 });
    }

    const pdfBuffer = await generateVsbPdfBuffer(pages, request.nextUrl.origin);
    const fileName = (body.fileName || 'generated.pdf').toLowerCase().endsWith('.pdf')
      ? body.fileName || 'generated.pdf'
      : `${body.fileName || 'generated'}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('[api/generate-pdf] Failed to generate PDF:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown PDF generation error.' },
      { status: 500 },
    );
  }
}
