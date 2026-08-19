import { Platform } from 'react-native';
import { apiClient } from './client';

export interface UploadResponse {
  id: string;
  fileUrl: string;
}

/** Uploads a device photo (from expo-image-picker) to the backend and returns its public URL. */
export async function uploadPhoto(localUri: string): Promise<UploadResponse> {
  const filename = localUri.split('/').pop()?.split('?')[0] ?? `photo-${Date.now()}.jpg`;
  const match = /\.(\w+)$/.exec(filename);
  const ext = match?.[1]?.toLowerCase() ?? 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

  const formData = new FormData();
  if (Platform.OS === 'web') {
    // On web, expo-image-picker returns a blob:/data: URI — FormData needs a real Blob/File, not the
    // {uri,name,type} shape React Native's native FormData polyfill accepts.
    const response = await fetch(localUri);
    const blob = await response.blob();
    formData.append('file', blob, filename);
  } else {
    formData.append('file', {
      uri: localUri,
      name: filename,
      type: mimeType,
    } as unknown as Blob);
  }

  const { data } = await apiClient.post<UploadResponse>('/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
