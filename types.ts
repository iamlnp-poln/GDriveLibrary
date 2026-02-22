
export interface GDriveLink {
  id: string;
  shortId: string;
  folderId: string;
  title: string;
  createdAt: number;
}

export interface GDriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webContentLink?: string;
  size?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
