import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_SIZE = (SCREEN_WIDTH - 48 - 16) / 3;

interface Photo {
  url: string;
  publicId?: string;
}

interface PhotoGridProps {
  photos: Photo[];
  profilePhoto?: string;
  maxPhotos?: number;
  onAddPhoto: () => void;
  onRemovePhoto: (index: number) => void;
  onSetProfilePhoto: (index: number) => void;
  isUploading?: boolean;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  profilePhoto,
  maxPhotos = 6,
  onAddPhoto,
  onRemovePhoto,
  onSetProfilePhoto,
  isUploading = false,
}) => {
  const allPhotos = profilePhoto ? [{ url: profilePhoto }, ...photos] : photos;
  const emptySlots = Math.max(0, maxPhotos - allPhotos.length);

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {allPhotos.map((photo, index) => (
          <View key={photo.url || index} style={styles.photoContainer}>
            <Image source={{ uri: photo.url }} style={styles.photo} />
            
            {index === 0 && (
              <View style={styles.mainBadge}>
                <Feather name="star" size={12} color="#FFFFFF" />
              </View>
            )}
            
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemovePhoto(index)}
            >
              <Feather name="x" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            
            {index !== 0 && (
              <TouchableOpacity
                style={styles.setMainButton}
                onPress={() => onSetProfilePhoto(index)}
              >
                <Feather name="star" size={14} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        
        {emptySlots > 0 && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAddPhoto}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#FF6B6B" />
            ) : (
              <Feather name="plus" size={32} color="#9CA3AF" />
            )}
          </TouchableOpacity>
        )}
        
        {Array.from({ length: Math.max(0, emptySlots - 1) }).map((_, index) => (
          <View key={`empty-${index}`} style={styles.emptySlot}>
            <Feather name="image" size={24} color="#D1D5DB" />
          </View>
        ))}
      </View>
      
      <View style={styles.hint}>
        <Feather name="info" size={14} color="#9CA3AF" />
        <View style={styles.hintTextContainer}>
          <View style={styles.hintRow}>
            <Feather name="star" size={12} color="#FF6B6B" />
            <View style={styles.hintText}>
              <Feather name="arrow-right" size={12} color="#9CA3AF" />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoContainer: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.3,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mainBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setMainButton: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  addButton: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.3,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  emptySlot: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.3,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  hintTextContainer: {
    marginLeft: 8,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hintText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default PhotoGrid;
