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

type UserType = 'tourist' | 'local' | 'both';

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
    user_type: 'tourist' as UserType,
    is_guide: false,
    has_car: false,
    has_motorcycle: false,
    bio: '',
    social_link: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 6) newErrors.password = 'Min 6 characters';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (currentStep === 2) {
      if (!formData.name) newErrors.name = 'Name is required';
      if (!formData.birth_date) newErrors.birth_date = 'Birth date is required';
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
      Alert.alert('Success', 'Welcome to JJ-Meet!');
      router.replace('/(tabs)');
    } else {
      Alert.alert('Registration Failed', (result.payload as string) || 'Please try again');
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
        label="Email"
        value={formData.email}
        onChangeText={(v) => updateFormData('email', v)}
        placeholder="your@email.com"
        keyboardType="email-address"
        icon="mail"
        error={errors.email}
      />
      <Input
        label="Password"
        value={formData.password}
        onChangeText={(v) => updateFormData('password', v)}
        placeholder="••••••••"
        secureTextEntry
        icon="lock"
        error={errors.password}
      />
      <Input
        label="Confirm Password"
        value={formData.confirmPassword}
        onChangeText={(v) => updateFormData('confirmPassword', v)}
        placeholder="••••••••"
        secureTextEntry
        icon="lock"
        error={errors.confirmPassword}
      />
      <Button title="Next" onPress={handleNext} size="large" />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Input
        label="Name"
        value={formData.name}
        onChangeText={(v) => updateFormData('name', v)}
        placeholder="Your name"
        icon="user"
        error={errors.name}
      />
      <Input
        label="Birth Date"
        value={formData.birth_date}
        onChangeText={(v) => updateFormData('birth_date', v)}
        placeholder="YYYY-MM-DD"
        icon="calendar"
        error={errors.birth_date}
      />
      <Input
        label="Instagram / Social Link (for verification)"
        value={formData.social_link}
        onChangeText={(v) => updateFormData('social_link', v)}
        placeholder="instagram.com/yourusername"
        icon="instagram"
        autoCapitalize="none"
      />
      
      <View style={styles.genderSection}>
        <Text style={styles.sectionLabel}>Gender</Text>
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
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.buttonRow}>
        <Button title="Back" onPress={handleBack} variant="outline" style={{ flex: 1 }} />
        <Button title="Next" onPress={handleNext} style={{ flex: 1 }} />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>I am a</Text>
        <View style={styles.typeButtons}>
          {(['tourist', 'local', 'both'] as UserType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                formData.user_type === type && styles.typeButtonActive,
              ]}
              onPress={() => updateFormData('user_type', type)}
            >
              <Feather
                name={type === 'tourist' ? 'map-pin' : type === 'local' ? 'home' : 'globe'}
                size={20}
                color={formData.user_type === type ? '#FF6B6B' : '#6B7280'}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  formData.user_type === type && styles.typeButtonTextActive,
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Options</Text>
        <CheckboxItem
          label="I can be a local guide"
          checked={formData.is_guide}
          onToggle={() => updateFormData('is_guide', !formData.is_guide)}
          icon="compass"
        />
        <CheckboxItem
          label="I have a car"
          checked={formData.has_car}
          onToggle={() => updateFormData('has_car', !formData.has_car)}
          icon="truck"
        />
        <CheckboxItem
          label="I have a motorcycle"
          checked={formData.has_motorcycle}
          onToggle={() => updateFormData('has_motorcycle', !formData.has_motorcycle)}
          icon="zap"
        />
      </View>

      <Input
        label="Bio (optional)"
        value={formData.bio}
        onChangeText={(v) => updateFormData('bio', v)}
        placeholder="Tell us about yourself..."
        multiline
        numberOfLines={3}
      />

      <View style={styles.buttonRow}>
        <Button title="Back" onPress={handleBack} variant="outline" style={{ flex: 1 }} />
        <Button
          title="Complete"
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
              <Text style={styles.title}>Join JJ-Meet</Text>
              <Text style={styles.subtitle}>Step {step} of 3</Text>
              {renderStepIndicator()}
            </View>

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Sign in</Text>
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
    marginBottom: 12,
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
});
