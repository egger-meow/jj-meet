import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAppDispatch, useAppSelector } from '../src/store/hooks';
import { updateProfile } from '../src/store/slices/userSlice';
import { PhotoGrid } from '../src/components/PhotoGrid';

export default function EditProfileScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    is_guide: user?.is_guide || false,
    has_car: user?.has_car || false,
    has_motorcycle: user?.has_motorcycle || false,
    speaks_english: user?.speaks_english || false,
    speaks_local: user?.speaks_local || false,
    flexible_schedule: user?.flexible_schedule || false,
    social_link: user?.social_link || '',
  });

  const [photos, setPhotos] = useState<{ url: string; publicId?: string }[]>(
    user?.photos || []
  );
  const [profilePhoto, setProfilePhoto] = useState(user?.profile_photo || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddPhoto = useCallback(async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setIsUploading(true);
      try {
        const newPhoto = { url: result.assets[0].uri };
        if (!profilePhoto) {
          setProfilePhoto(newPhoto.url);
        } else {
          setPhotos([...photos, newPhoto]);
        }
      } finally {
        setIsUploading(false);
      }
    }
  }, [photos, profilePhoto]);

  const handleRemovePhoto = useCallback((index: number) => {
    if (index === 0 && profilePhoto) {
      if (photos.length > 0) {
        setProfilePhoto(photos[0].url);
        setPhotos(photos.slice(1));
      } else {
        setProfilePhoto('');
      }
    } else {
      const adjustedIndex = profilePhoto ? index - 1 : index;
      setPhotos(photos.filter((_, i) => i !== adjustedIndex));
    }
  }, [photos, profilePhoto]);

  const handleSetProfilePhoto = useCallback((index: number) => {
    const adjustedIndex = profilePhoto ? index - 1 : index;
    const newProfilePhoto = photos[adjustedIndex];
    const remainingPhotos = photos.filter((_, i) => i !== adjustedIndex);
    
    if (profilePhoto) {
      setPhotos([{ url: profilePhoto }, ...remainingPhotos]);
    } else {
      setPhotos(remainingPhotos);
    }
    setProfilePhoto(newProfilePhoto.url);
  }, [photos, profilePhoto]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await dispatch(updateProfile({
        ...formData,
        profile_photo: profilePhoto,
        photos,
      })).unwrap();
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          <Text style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <Text style={styles.sectionHint}>
              Add up to 6 photos. Your first photo will be your main profile picture.
            </Text>
            <PhotoGrid
              photos={photos}
              profilePhoto={profilePhoto}
              maxPhotos={6}
              onAddPhoto={handleAddPhoto}
              onRemovePhoto={handleRemovePhoto}
              onSetProfilePhoto={handleSetProfilePhoto}
              isUploading={isUploading}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Me</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Your name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                placeholder="Tell others about yourself..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Social Link (Instagram, etc.)</Text>
              <TextInput
                style={styles.input}
                value={formData.social_link}
                onChangeText={(text) => setFormData({ ...formData, social_link: text })}
                placeholder="https://instagram.com/username"
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>I Can Offer</Text>
            
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Feather name="compass" size={20} color="#FF6B6B" />
                <Text style={styles.toggleLabel}>Available as Local Guide</Text>
              </View>
              <Switch
                value={formData.is_guide}
                onValueChange={(value) => setFormData({ ...formData, is_guide: value })}
                trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
                thumbColor={formData.is_guide ? '#FF6B6B' : '#9CA3AF'}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Feather name="truck" size={20} color="#3B82F6" />
                <Text style={styles.toggleLabel}>I have a car</Text>
              </View>
              <Switch
                value={formData.has_car}
                onValueChange={(value) => setFormData({ ...formData, has_car: value })}
                trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                thumbColor={formData.has_car ? '#3B82F6' : '#9CA3AF'}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Feather name="zap" size={20} color="#F59E0B" />
                <Text style={styles.toggleLabel}>I have a motorcycle</Text>
              </View>
              <Switch
                value={formData.has_motorcycle}
                onValueChange={(value) => setFormData({ ...formData, has_motorcycle: value })}
                trackColor={{ false: '#E5E7EB', true: '#FCD34D' }}
                thumbColor={formData.has_motorcycle ? '#F59E0B' : '#9CA3AF'}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Feather name="globe" size={20} color="#10B981" />
                <Text style={styles.toggleLabel}>I speak English</Text>
              </View>
              <Switch
                value={formData.speaks_english}
                onValueChange={(value) => setFormData({ ...formData, speaks_english: value })}
                trackColor={{ false: '#E5E7EB', true: '#6EE7B7' }}
                thumbColor={formData.speaks_english ? '#10B981' : '#9CA3AF'}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Feather name="message-circle" size={20} color="#8B5CF6" />
                <Text style={styles.toggleLabel}>I speak local language</Text>
              </View>
              <Switch
                value={formData.speaks_local}
                onValueChange={(value) => setFormData({ ...formData, speaks_local: value })}
                trackColor={{ false: '#E5E7EB', true: '#C4B5FD' }}
                thumbColor={formData.speaks_local ? '#8B5CF6' : '#9CA3AF'}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Feather name="clock" size={20} color="#EC4899" />
                <Text style={styles.toggleLabel}>Flexible schedule</Text>
              </View>
              <Switch
                value={formData.flexible_schedule}
                onValueChange={(value) => setFormData({ ...formData, flexible_schedule: value })}
                trackColor={{ false: '#E5E7EB', true: '#F9A8D4' }}
                thumbColor={formData.flexible_schedule ? '#EC4899' : '#9CA3AF'}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  saveButtonDisabled: {
    color: '#9CA3AF',
  },
  content: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 8,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#374151',
  },
});
