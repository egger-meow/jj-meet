import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

export interface ImagePickerResult {
  uri: string;
  width: number;
  height: number;
  type?: string;
  fileName?: string;
  fileSize?: number;
}

class CameraService {
  async requestCameraPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access in your device settings to take photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  }

  async requestMediaLibraryPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Photo Library Permission Required',
        'Please enable photo library access in your device settings to select photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  }

  async takePhoto(): Promise<ImagePickerResult | null> {
    const hasPermission = await this.requestCameraPermission();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: asset.mimeType,
      fileName: asset.fileName || `photo_${Date.now()}.jpg`,
      fileSize: asset.fileSize,
    };
  }

  async pickFromLibrary(options?: {
    allowsMultiple?: boolean;
    aspect?: [number, number];
  }): Promise<ImagePickerResult[] | null> {
    const hasPermission = await this.requestMediaLibraryPermission();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: !options?.allowsMultiple,
      allowsMultipleSelection: options?.allowsMultiple || false,
      aspect: options?.aspect || [1, 1],
      quality: 0.8,
      selectionLimit: options?.allowsMultiple ? 6 : 1,
    });

    if (result.canceled || !result.assets?.length) {
      return null;
    }

    return result.assets.map((asset) => ({
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: asset.mimeType,
      fileName: asset.fileName || `photo_${Date.now()}.jpg`,
      fileSize: asset.fileSize,
    }));
  }

  async selectProfilePhoto(): Promise<ImagePickerResult | null> {
    return new Promise((resolve) => {
      Alert.alert(
        'Select Profile Photo',
        'Choose how you want to add a photo',
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              const photo = await this.takePhoto();
              resolve(photo);
            },
          },
          {
            text: 'Choose from Library',
            onPress: async () => {
              const photos = await this.pickFromLibrary();
              resolve(photos?.[0] || null);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ]
      );
    });
  }
}

export const cameraService = new CameraService();
