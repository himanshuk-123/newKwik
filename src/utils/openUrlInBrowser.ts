import { Linking, ToastAndroid } from 'react-native';

export const openUrlInBrowser = async (url?: string) => {
  if (!url) {
    ToastAndroid.show('Invalid URL', ToastAndroid.SHORT);
    return;
  }

  try {
    await Linking.openURL(url);
  } catch (error) {
    console.error('Failed to open URL:', url, error);
    ToastAndroid.show('Cannot open URL', ToastAndroid.SHORT);
  }
};
