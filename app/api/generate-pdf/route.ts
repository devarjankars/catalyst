import { NextRequest, NextResponse } from 'next/server';
import { generateVsbPdfBuffer } from '@/lib/vsb-pdf-chromium';
import type { VsbPdfPageSpec } from '@/lib/vsb-pdf-export';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// 300s for Vercel Pro / Enterprise; Hobby plan caps at 60s automatically.
// Complex multi-page PDFs (especially 3-column desktop view) can take 60-120s.
export const maxDuration = 300;

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
