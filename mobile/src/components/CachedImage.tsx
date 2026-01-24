// Optimized Image component with caching using expo-image
import React, { memo } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View, StyleProp, ImageStyle, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface CachedImageProps {
  uri: string | undefined | null;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  placeholder?: 'user' | 'image';
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  transition?: number;
}

// Blurhash placeholder for smooth loading
const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

const CachedImage: React.FC<CachedImageProps> = memo(({
  uri,
  style,
  containerStyle,
  placeholder = 'image',
  contentFit = 'cover',
  transition = 200,
}) => {
  if (!uri) {
    return (
      <View style={[styles.placeholder, containerStyle, style]}>
        <Feather 
          name={placeholder === 'user' ? 'user' : 'image'} 
          size={40} 
          color="#D1D5DB" 
        />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit={contentFit}
      transition={transition}
      placeholder={{ blurhash }}
      cachePolicy="memory-disk"
      recyclingKey={uri}
    />
  );
});

CachedImage.displayName = 'CachedImage';

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CachedImage;
