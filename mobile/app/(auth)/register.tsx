import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { register } from '../../src/store/slices/authSlice';
import { Input, Button } from '../../src/components/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { t } from '../../src/i18n';

const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

export default function RegisterScreen() {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    birth_date: '',
    gender: '',
    user_type: 'both',
    is_guide: true,
    has_car: false,
    has_motorcycle: false,
    speaks_english: false,
    speaks_local: false,
    flexible_schedule: false,
    bio: '',
    social_link: '',
    mbti: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.email) newErrors.email = t.register.emailRequired;
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t.register.invalidEmail;
      if (!formData.password) newErrors.password = t.register.passwordRequired;
      else if (formData.password.length < 6) newErrors.password = t.register.passwordMinLength;
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = t.register.passwordMismatch;
      }
    } else if (currentStep === 2) {
      if (!formData.name) newErrors.name = t.register.nameRequired;
      if (!formData.birth_date) newErrors.birth_date = t.register.birthDateRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    const { confirmPassword, ...submitData } = formData;
    const result = await dispatch(register(submitData));
    
    if (register.fulfilled.match(result)) {
      Alert.alert(t.alerts.success, t.auth.registerSuccess);
      router.replace('/(tabs)');
    } else {
      Alert.alert(t.auth.registerFailed, (result.payload as string) || t.common.retry);
    }
  };

  const updateFormData = (key: string, value: any) => {
    setFormData({ ...formData, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: '' });
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((s) => (
        <View
          key={s}
          style={[styles.stepDot, step >= s && styles.stepDotActive]}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Input
        label={t.auth.email}
        value={formData.email}
        onChangeText={(v) => updateFormData('email', v)}
        placeholder={t.auth.emailPlaceholder}
        keyboardType="email-address"
        icon="mail"
        error={errors.email}
      />
      <Input
        label={t.auth.password}
        value={formData.password}
        onChangeText={(v) => updateFormData('password', v)}
        placeholder={t.auth.passwordPlaceholder}
        secureTextEntry
        icon="lock"
        error={errors.password}
      />
      <Input
        label={t.auth.confirmPassword}
        value={formData.confirmPassword}
        onChangeText={(v) => updateFormData('confirmPassword', v)}
        placeholder={t.auth.passwordPlaceholder}
        secureTextEntry
        icon="lock"
        error={errors.confirmPassword}
      />
      <Button title={t.common.next} onPress={handleNext} size="large" />
    </View>
  );

  const genderLabels: Record<string, string> = {
    male: t.register.male,
    female: t.register.female,
    other: t.register.other,
  };

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Input
        label={t.register.name}
        value={formData.name}
        onChangeText={(v) => updateFormData('name', v)}
        placeholder={t.register.namePlaceholder}
        icon="user"
        error={errors.name}
      />
      <Input
        label={t.register.birthDate}
        value={formData.birth_date}
        onChangeText={(v) => updateFormData('birth_date', v)}
        placeholder={t.register.birthDatePlaceholder}
        icon="calendar"
        error={errors.birth_date}
      />
      <Input
        label={t.register.socialLink}
        value={formData.social_link}
        onChangeText={(v) => updateFormData('social_link', v)}
        placeholder={t.register.socialLinkPlaceholder}
        icon="instagram"
        autoCapitalize="none"
      />
      
      <View style={styles.genderSection}>
        <Text style={styles.sectionLabel}>{t.register.gender}</Text>
        <View style={styles.genderButtons}>
          {['male', 'female', 'other'].map((g) => (
            <TouchableOpacity
              key={g}
              style={[
                styles.genderButton,
                formData.gender === g && styles.genderButtonActive,
              ]}
              onPress={() => updateFormData('gender', g)}
            >
              <Text
                style={[
                  styles.genderButtonText,
                  formData.gender === g && styles.genderButtonTextActive,
                ]}
              >
                {genderLabels[g]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.buttonRow}>
        <Button title={t.common.back} onPress={handleBack} variant="outline" style={{ flex: 1 }} />
        <Button title={t.common.next} onPress={handleNext} style={{ flex: 1 }} />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t.register.aboutMe}</Text>
        <Text style={styles.sectionHint}>{t.register.aboutMeHint}</Text>
        
        <View style={styles.characteristicsGrid}>
          <CheckboxItem
            label={t.register.hasCar}
            checked={formData.has_car}
            onToggle={() => updateFormData('has_car', !formData.has_car)}
            icon="truck"
          />
          <CheckboxItem
            label={t.register.hasMotorcycle}
            checked={formData.has_motorcycle}
            onToggle={() => updateFormData('has_motorcycle', !formData.has_motorcycle)}
            icon="zap"
          />
          <CheckboxItem
            label={t.register.speaksEnglish}
            checked={formData.speaks_english}
            onToggle={() => updateFormData('speaks_english', !formData.speaks_english)}
            icon="globe"
          />
          <CheckboxItem
            label={t.register.speaksLocal}
            checked={formData.speaks_local}
            onToggle={() => updateFormData('speaks_local', !formData.speaks_local)}
            icon="message-circle"
          />
          <CheckboxItem
            label={t.register.flexibleSchedule}
            checked={formData.flexible_schedule}
            onToggle={() => updateFormData('flexible_schedule', !formData.flexible_schedule)}
            icon="clock"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t.register.mbti}</Text>
        <Text style={styles.sectionHint}>{t.register.mbtiHint}</Text>
        <View style={styles.mbtiGrid}>
          {MBTI_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.mbtiButton,
                formData.mbti === type && styles.mbtiButtonActive,
              ]}
              onPress={() => updateFormData('mbti', type)}
            >
              <Text
                style={[
                  styles.mbtiButtonText,
                  formData.mbti === type && styles.mbtiButtonTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Input
        label={t.register.bio}
        value={formData.bio}
        onChangeText={(v) => updateFormData('bio', v)}
        placeholder={t.register.bioPlaceholder}
        multiline
        numberOfLines={3}
      />

      <View style={styles.buttonRow}>
        <Button title={t.common.back} onPress={handleBack} variant="outline" style={{ flex: 1 }} />
        <Button
          title={t.register.complete}
          onPress={handleSubmit}
          loading={isLoading}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#FFF5F5', '#F0FDFA']} style={styles.gradient}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>{t.register.joinTitle}</Text>
              <Text style={styles.subtitle}>{t.register.stepOf.replace('{step}', String(step))}</Text>
              {renderStepIndicator()}
            </View>

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t.auth.hasAccount}</Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>{t.auth.signInNow}</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function CheckboxItem({
  label,
  checked,
  onToggle,
  icon,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  icon: keyof typeof Feather.glyphMap;
}) {
  return (
    <TouchableOpacity style={styles.checkboxItem} onPress={onToggle}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Feather name="check" size={14} color="#FFFFFF" />}
      </View>
      <Feather name={icon} size={18} color="#6B7280" style={{ marginRight: 8 }} />
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F2937' },
  subtitle: { fontSize: 16, color: '#6B7280', marginTop: 4 },
  stepIndicator: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  stepDot: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
  },
  stepDotActive: { backgroundColor: '#FF6B6B' },
  stepContent: { gap: 4 },
  section: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  characteristicsGrid: {
    gap: 4,
  },
  genderSection: { marginBottom: 16 },
  genderButtons: { flexDirection: 'row', gap: 8 },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  genderButtonActive: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  genderButtonText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  genderButtonTextActive: { color: '#FF6B6B' },
  typeButtons: { flexDirection: 'row', gap: 8 },
  typeButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    gap: 4,
  },
  typeButtonActive: { borderColor: '#FF6B6B', backgroundColor: '#FFF5F5' },
  typeButtonText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  typeButtonTextActive: { color: '#FF6B6B' },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' },
  checkboxLabel: { fontSize: 14, color: '#374151', flex: 1 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: { fontSize: 14, color: '#6B7280' },
  footerLink: { fontSize: 14, color: '#FF6B6B', fontWeight: '600' },
  mbtiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  mbtiButton: {
    width: '22%',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  mbtiButtonActive: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  mbtiButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  mbtiButtonTextActive: {
    color: '#FF6B6B',
  },
});
