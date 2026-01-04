import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../src/store/hooks';
import { logout } from '../src/store/slices/authSlice';

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [notifications, setNotifications] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [showDistance, setShowDistance] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await dispatch(logout());
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleDeactivate = () => {
    Alert.alert(
      'Deactivate Account',
      'Your profile will be hidden from other users. You can reactivate anytime by logging in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deactivated', 'Your account has been deactivated.');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Confirm Deletion', 'Type DELETE to confirm', [
              { text: 'Cancel', style: 'cancel' },
            ]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Settings', headerShown: true }} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <SettingsItem
            icon="user"
            label="Edit Profile"
            onPress={() => {}}
          />
          <SettingsItem
            icon="lock"
            label="Change Password"
            onPress={() => {}}
          />
          <SettingsItem
            icon="shield"
            label="Privacy & Safety"
            onPress={() => {}}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <SettingsToggle
            icon="bell"
            label="Push Notifications"
            value={notifications}
            onToggle={setNotifications}
          />
          <SettingsItem
            icon="mail"
            label="Email Preferences"
            onPress={() => {}}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discovery</Text>
          <SettingsToggle
            icon="map-pin"
            label="Location Services"
            value={locationEnabled}
            onToggle={setLocationEnabled}
          />
          <SettingsToggle
            icon="navigation"
            label="Show Distance"
            value={showDistance}
            onToggle={setShowDistance}
          />
          <SettingsItem
            icon="sliders"
            label="Discovery Preferences"
            onPress={() => {}}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <SettingsItem
            icon="help-circle"
            label="Help Center"
            onPress={() => {}}
          />
          <SettingsItem
            icon="message-square"
            label="Contact Us"
            onPress={() => {}}
          />
          <SettingsItem
            icon="file-text"
            label="Terms of Service"
            onPress={() => {}}
          />
          <SettingsItem
            icon="shield"
            label="Privacy Policy"
            onPress={() => {}}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          <SettingsItem
            icon="pause-circle"
            label="Deactivate Account"
            onPress={handleDeactivate}
            danger
          />
          <SettingsItem
            icon="trash-2"
            label="Delete Account"
            onPress={handleDeleteAccount}
            danger
          />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Feather name="log-out" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsItem({
  icon,
  label,
  onPress,
  danger = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <Feather name={icon} size={20} color={danger ? '#EF4444' : '#6B7280'} />
      <Text style={[styles.settingsLabel, danger && styles.dangerText]}>{label}</Text>
      <Feather name="chevron-right" size={20} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

function SettingsToggle({
  icon,
  label,
  value,
  onToggle,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <View style={styles.settingsItem}>
      <Feather name={icon} size={20} color="#6B7280" />
      <Text style={styles.settingsLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E5E7EB', true: '#FECACA' }}
        thumbColor={value ? '#FF6B6B' : '#F3F4F6'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingsLabel: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  dangerText: {
    color: '#EF4444',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 24,
    marginBottom: 40,
  },
});
