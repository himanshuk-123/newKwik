import { apiCall } from './ApiClient';
import { ToastAndroid } from 'react-native';
import { run } from '../database/db';

interface ProfileImageResponse {
  Error: string;
  MESSAGE: string;
  ProfileImage?: string;
  PROFILEIMAGE?: string;
  ImagePath?: string;
}

/**
 * Upload profile image via API, then update local DB
 */
export const uploadProfileImageApi = async (
  token: string,
  base64String: string,
): Promise<string> => {
  try {
    const response = await apiCall<ProfileImageResponse>(
      'DocumentUploadProfileImage',
      token,
      {
        Version: '2',
        ProfileImage: base64String,
      },
    );

    // Check for error response
    if (response?.Error && response.Error !== '0') {
      const errorMsg = response?.MESSAGE || 'Failed to upload profile image';
      ToastAndroid.show(errorMsg, ToastAndroid.LONG);
      throw new Error(errorMsg);
    }

    const imagePath =
      response?.ProfileImage || response?.PROFILEIMAGE || response?.ImagePath || '';

    // Update local DB
    if (imagePath) {
      await run('UPDATE users SET profile_image = ?, updated_at = CURRENT_TIMESTAMP', [imagePath]);
    }

    ToastAndroid.show('Profile image updated successfully', ToastAndroid.LONG);
    return imagePath;
  } catch (error: any) {
    console.error('[uploadProfileImageApi] Error:', error);
    if (!error.message?.includes('Failed to upload')) {
      ToastAndroid.show(
        error?.message || 'Failed to upload profile image',
        ToastAndroid.LONG,
      );
    }
    throw error;
  }
};
