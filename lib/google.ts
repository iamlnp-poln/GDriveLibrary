
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

export async function getDriveClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !privateKey) {
    throw new Error('Google Service Account credentials are missing in environment variables.');
  }
  
  // Using the options object pattern to satisfy TypeScript definitions in newer googleapis versions
  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: SCOPES,
  });

  return google.drive({ version: 'v3', auth });
}

export async function listFolderFiles(folderId: string) {
  try {
    const drive = await getDriveClient();
    
    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: 'files(id, name, mimeType, size, thumbnailLink, webContentLink)',
      pageSize: 1000,
    });

    return response.data.files || [];
  } catch (error: any) {
    console.error('Google Drive API Error (listFolderFiles):', error);
    throw new Error(error.message || 'Failed to list files from Google Drive');
  }
}

export async function getFileStream(fileId: string) {
  try {
    const drive = await getDriveClient();
    
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    return {
      stream: response.data,
      contentType: response.headers['content-type']
    };
  } catch (error: any) {
    console.error('Google Drive API Error (getFileStream):', error);
    throw new Error(error.message || 'Failed to stream file from Google Drive');
  }
}
