import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Server-side image proxy — fetches an image from any URL and returns it as a
 * blob, bypassing browser CORS restrictions on Firebase Storage / CDN URLs.
 *
 * Usage: GET /api/proxy-image?url=<encoded-image-url>
 */
export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url');

  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Only proxy http/https URLs — block relative paths and data URIs
  if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
    return NextResponse.json({ error: 'Only absolute http/https URLs are supported' }, { status: 400 });
  }

  try {
    const upstream = await fetch(rawUrl, {
      headers: {
        // Mimic a browser request so CDNs don't block server fetches
        'User-Agent': 'Mozilla/5.0 (compatible; EmailBuilder/1.0)',
        'Accept': 'image/*,*/*;q=0.8',
      },
      // 10-second timeout
      signal: AbortSignal.timeout(10_000),
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const contentType = upstream.headers.get('content-type') || 'image/png';
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[proxy-image] Failed to fetch:', rawUrl, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch image' },
      { status: 500 }
    );
  }
}
