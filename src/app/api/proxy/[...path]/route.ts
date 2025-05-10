import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/${path}`;

  try {
    const response = await fetch(apiUrl);
    const blob = await response.blob();

    return new NextResponse(blob, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse('Error fetching image', { status: 500 });
  }
} 