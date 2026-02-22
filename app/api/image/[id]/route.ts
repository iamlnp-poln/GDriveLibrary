
import { NextRequest, NextResponse } from 'next/server';
import { getFileStream } from '../../../../lib/google';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await params;
  const fileId = resolvedParams.id;

  try {
    const { stream, contentType } = await getFileStream(fileId);
    
    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error proxying image:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
