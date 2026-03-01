import { Share, ToastAndroid } from 'react-native';

export const share = async (message?: string) => {
  if (!message) {
    ToastAndroid.show('Nothing to share', ToastAndroid.SHORT);
    return;
  }
  try {
    await Share.share({
      message,
    });
  } catch (error: any) {
    ToastAndroid.show(error.message, ToastAndroid.SHORT);
  }
};
