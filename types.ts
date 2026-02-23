
export interface GDriveLink {
  id: string;
  shortId: string;
  folderId: string;
  title: string;
  createdAt: number;
  isPickingMode?: boolean; // Nếu true: không cho tải, có watermark, có nút thả tim
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
