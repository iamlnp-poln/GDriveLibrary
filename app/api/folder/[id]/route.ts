
import { NextRequest, NextResponse } from 'next/server';
import { listFolderFiles } from '../../../../lib/google';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: folderId } = await params;

  if (!folderId) {
    return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 });
  }

  try {
    const files = await listFolderFiles(folderId);
    return NextResponse.json(files);
  } catch (error: any) {
    console.error('Error listing folder files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folder contents', details: error.message },
      { status: 500 }
    );
  }
}
