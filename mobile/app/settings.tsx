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
import { t, languages, getCurrentLanguage, setLanguage, LanguageCode } from '../src/i18n';

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [notifications, setNotifications] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [showDistance, setShowDistance] = useState(true);
  const [currentLang, setCurrentLang] = useState<LanguageCode>(getCurrentLanguage());

  const handleLanguageChange = async () => {
    const langOptions = Object.entries(languages).map(([code, { nativeName }]) => ({
      text: nativeName,
      onPress: async () => {
        await setLanguage(code as LanguageCode);
        setCurrentLang(code as LanguageCode);
        Alert.alert('Language Changed', 'Please restart the app to apply changes.');
      },
    }));
    
    Alert.alert(
      'Select Language / 選擇語言',
      undefined,
      [...langOptions, { text: t.common.cancel, style: 'cancel' }]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      t.profile.logOut,
      t.settings.logOutConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.profile.logOut,
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
      t.settings.deactivateAccount,
      t.settings.deactivateConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.settings.deactivateAccount,
          style: 'destructive',
          onPress: () => {
            Alert.alert(t.alerts.success, t.settings.deactivateAccount);
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t.settings.deleteAccount,
      t.settings.deleteConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: () => {
            Alert.alert(t.common.confirm, t.settings.deleteConfirm, [
              { text: t.common.cancel, style: 'cancel' },
            ]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: t.settings.title, headerShown: true }} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.account}</Text>
          <SettingsItem
            icon="user"
            label={t.profile.editProfile}
            onPress={() => {}}
          />
          <SettingsItem
            icon="globe"
            label={`Language / 語言: ${languages[currentLang].nativeName}`}
            onPress={handleLanguageChange}
          />
          <SettingsItem
            icon="lock"
            label={t.settings.changePassword}
            onPress={() => {}}
          />
          <SettingsItem
            icon="shield"
            label={t.settings.privacySafety}
            onPress={() => {}}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.notifications}</Text>
          <SettingsToggle
            icon="bell"
            label={t.settings.pushNotifications}
            value={notifications}
            onToggle={setNotifications}
          />
          <SettingsItem
            icon="mail"
            label={t.settings.emailPreferences}
            onPress={() => {}}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.discovery}</Text>
          <SettingsToggle
            icon="map-pin"
            label={t.settings.locationServices}
            value={locationEnabled}
            onToggle={setLocationEnabled}
          />
          <SettingsToggle
            icon="navigation"
            label={t.settings.showDistance}
            value={showDistance}
            onToggle={setShowDistance}
          />
          <SettingsItem
            icon="sliders"
            label={t.settings.discoveryPreferences}
            onPress={() => {}}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.support}</Text>
          <SettingsItem
            icon="help-circle"
            label={t.settings.helpCenter}
            onPress={() => {}}
          />
          <SettingsItem
            icon="message-square"
            label={t.settings.contactUs}
            onPress={() => {}}
          />
          <SettingsItem
            icon="file-text"
            label={t.settings.termsOfService}
            onPress={() => {}}
          />
          <SettingsItem
            icon="shield"
            label={t.settings.privacyPolicy}
            onPress={() => {}}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.accountActions}</Text>
          <SettingsItem
            icon="pause-circle"
            label={t.settings.deactivateAccount}
            onPress={handleDeactivate}
            danger
          />
          <SettingsItem
            icon="trash-2"
            label={t.settings.deleteAccount}
            onPress={handleDeleteAccount}
            danger
          />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Feather name="log-out" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>{t.profile.logOut}</Text>
        </TouchableOpacity>

        <Text style={styles.version}>{t.settings.version} 1.0.0</Text>
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
