// Accessibility utilities for JJ-Meet
import { AccessibilityInfo, Platform } from 'react-native';

// Accessibility roles for different component types
export const A11yRoles = {
  BUTTON: 'button' as const,
  LINK: 'link' as const,
  IMAGE: 'image' as const,
  TEXT: 'text' as const,
  HEADER: 'header' as const,
  CHECKBOX: 'checkbox' as const,
  SWITCH: 'switch' as const,
  TAB: 'tab' as const,
  TABLIST: 'tablist' as const,
  MENU: 'menu' as const,
  MENUITEM: 'menuitem' as const,
  ALERT: 'alert' as const,
};

// Common accessibility labels
export const A11yLabels = {
  // Navigation
  back: 'Go back',
  close: 'Close',
  menu: 'Open menu',
  settings: 'Settings',
  
  // Discovery
  like: 'Like this profile',
  pass: 'Pass on this profile',
  superLike: 'Super like this profile',
  undo: 'Undo last swipe',
  refresh: 'Refresh profiles',
  
  // Profile
  editProfile: 'Edit your profile',
  uploadPhoto: 'Upload a photo',
  deletePhoto: 'Delete this photo',
  
  // Chat
  sendMessage: 'Send message',
  attachImage: 'Attach an image',
  
  // Common
  loading: 'Loading, please wait',
  error: 'An error occurred',
};

// Generate accessibility props for touchable elements
export const getButtonA11yProps = (label: string, hint?: string) => ({
  accessible: true,
  accessibilityRole: A11yRoles.BUTTON,
  accessibilityLabel: label,
  accessibilityHint: hint,
});

// Generate accessibility props for images
export const getImageA11yProps = (description: string) => ({
  accessible: true,
  accessibilityRole: A11yRoles.IMAGE,
  accessibilityLabel: description,
});

// Generate accessibility props for headers
export const getHeaderA11yProps = (text: string) => ({
  accessible: true,
  accessibilityRole: A11yRoles.HEADER,
  accessibilityLabel: text,
});

// Generate accessibility props for switches/toggles
export const getSwitchA11yProps = (label: string, isOn: boolean) => ({
  accessible: true,
  accessibilityRole: A11yRoles.SWITCH,
  accessibilityLabel: label,
  accessibilityState: { checked: isOn },
});

// Check if screen reader is enabled
export const isScreenReaderEnabled = async (): Promise<boolean> => {
  return await AccessibilityInfo.isScreenReaderEnabled();
};

// Check if reduce motion is enabled
export const isReduceMotionEnabled = async (): Promise<boolean> => {
  return await AccessibilityInfo.isReduceMotionEnabled();
};

// Announce message for screen readers
export const announceForAccessibility = (message: string): void => {
  AccessibilityInfo.announceForAccessibility(message);
};

// Focus on element (for screen readers)
export const setAccessibilityFocus = (ref: React.RefObject<any>): void => {
  if (ref.current && Platform.OS === 'ios') {
    AccessibilityInfo.setAccessibilityFocus(ref.current);
  }
};

// Minimum touch target size (WCAG 2.1 Level AA)
export const MIN_TOUCH_TARGET = 44;

// Color contrast utilities
export const ContrastColors = {
  // High contrast text on backgrounds
  textOnLight: '#1F2937', // Gray-800
  textOnDark: '#F9FAFB', // Gray-50
  
  // Primary action colors with good contrast
  primary: '#DC2626', // Red-600 (contrast ratio 4.5:1 on white)
  primaryDark: '#B91C1C', // Red-700
  
  // Success/Error with good contrast
  success: '#059669', // Emerald-600
  error: '#DC2626', // Red-600
  warning: '#D97706', // Amber-600
  
  // Link color with good contrast
  link: '#2563EB', // Blue-600
};

// Semantic color names for accessibility
export const SemanticColors = {
  interactive: ContrastColors.primary,
  interactiveHover: ContrastColors.primaryDark,
  textPrimary: ContrastColors.textOnLight,
  textSecondary: '#6B7280', // Gray-500
  textDisabled: '#9CA3AF', // Gray-400
  background: '#FFFFFF',
  backgroundSecondary: '#F3F4F6', // Gray-100
  border: '#E5E7EB', // Gray-200
  borderFocus: ContrastColors.primary,
};

export default {
  Roles: A11yRoles,
  Labels: A11yLabels,
  getButtonA11yProps,
  getImageA11yProps,
  getHeaderA11yProps,
  getSwitchA11yProps,
  isScreenReaderEnabled,
  isReduceMotionEnabled,
  announceForAccessibility,
  setAccessibilityFocus,
  MIN_TOUCH_TARGET,
  ContrastColors,
  SemanticColors,
};
