// Offline Support Service for JJ-Meet
import * as SecureStore from 'expo-secure-store';
import { NetInfo } from '@react-native-community/netinfo';

// Storage keys
const STORAGE_KEYS = {
  USER_PROFILE: 'offline_user_profile',
  MATCHES: 'offline_matches',
  MESSAGE_QUEUE: 'offline_message_queue',
  LAST_SYNC: 'offline_last_sync',
} as const;

interface QueuedMessage {
  id: string;
  matchId: string;
  content: string;
  createdAt: string;
  status: 'pending' | 'sent' | 'failed';
}

// Check network status
export const isOnline = async (): Promise<boolean> => {
  try {
    // Simple check - try to reach the API
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/health`, {
      method: 'HEAD',
      cache: 'no-store',
    });
    return response.ok;
  } catch {
    return false;
  }
};

// Cache user profile locally
export const cacheUserProfile = async (profile: Record<string, unknown>): Promise<void> => {
  try {
    await SecureStore.setItemAsync(
      STORAGE_KEYS.USER_PROFILE,
      JSON.stringify(profile)
    );
  } catch (error) {
    console.warn('[Offline] Failed to cache user profile:', error);
  }
};

// Get cached user profile
export const getCachedUserProfile = async (): Promise<Record<string, unknown> | null> => {
  try {
    const cached = await SecureStore.getItemAsync(STORAGE_KEYS.USER_PROFILE);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.warn('[Offline] Failed to get cached user profile:', error);
    return null;
  }
};

// Cache matches locally
export const cacheMatches = async (matches: unknown[]): Promise<void> => {
  try {
    await SecureStore.setItemAsync(
      STORAGE_KEYS.MATCHES,
      JSON.stringify(matches)
    );
  } catch (error) {
    console.warn('[Offline] Failed to cache matches:', error);
  }
};

// Get cached matches
export const getCachedMatches = async (): Promise<unknown[]> => {
  try {
    const cached = await SecureStore.getItemAsync(STORAGE_KEYS.MATCHES);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.warn('[Offline] Failed to get cached matches:', error);
    return [];
  }
};

// Queue message for sending when online
export const queueMessage = async (matchId: string, content: string): Promise<QueuedMessage> => {
  const message: QueuedMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    matchId,
    content,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  try {
    const queue = await getMessageQueue();
    queue.push(message);
    await SecureStore.setItemAsync(
      STORAGE_KEYS.MESSAGE_QUEUE,
      JSON.stringify(queue)
    );
  } catch (error) {
    console.warn('[Offline] Failed to queue message:', error);
  }

  return message;
};

// Get queued messages
export const getMessageQueue = async (): Promise<QueuedMessage[]> => {
  try {
    const cached = await SecureStore.getItemAsync(STORAGE_KEYS.MESSAGE_QUEUE);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.warn('[Offline] Failed to get message queue:', error);
    return [];
  }
};

// Process queued messages (call when online)
export const processMessageQueue = async (
  sendMessage: (matchId: string, content: string) => Promise<boolean>
): Promise<{ sent: number; failed: number }> => {
  const queue = await getMessageQueue();
  let sent = 0;
  let failed = 0;

  const updatedQueue: QueuedMessage[] = [];

  for (const message of queue) {
    if (message.status === 'pending') {
      try {
        const success = await sendMessage(message.matchId, message.content);
        if (success) {
          sent++;
          message.status = 'sent';
        } else {
          failed++;
          message.status = 'failed';
          updatedQueue.push(message);
        }
      } catch {
        failed++;
        message.status = 'failed';
        updatedQueue.push(message);
      }
    }
  }

  // Save updated queue (only failed messages)
  await SecureStore.setItemAsync(
    STORAGE_KEYS.MESSAGE_QUEUE,
    JSON.stringify(updatedQueue)
  );

  if (sent > 0 || failed > 0) {
    console.log(`[Offline] Processed queue: ${sent} sent, ${failed} failed`);
  }

  return { sent, failed };
};

// Clear all offline data
export const clearOfflineData = async (): Promise<void> => {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.USER_PROFILE),
      SecureStore.deleteItemAsync(STORAGE_KEYS.MATCHES),
      SecureStore.deleteItemAsync(STORAGE_KEYS.MESSAGE_QUEUE),
      SecureStore.deleteItemAsync(STORAGE_KEYS.LAST_SYNC),
    ]);
    console.log('[Offline] Cleared all offline data');
  } catch (error) {
    console.warn('[Offline] Failed to clear offline data:', error);
  }
};

// Get last sync timestamp
export const getLastSync = async (): Promise<Date | null> => {
  try {
    const cached = await SecureStore.getItemAsync(STORAGE_KEYS.LAST_SYNC);
    return cached ? new Date(cached) : null;
  } catch {
    return null;
  }
};

// Update last sync timestamp
export const updateLastSync = async (): Promise<void> => {
  try {
    await SecureStore.setItemAsync(
      STORAGE_KEYS.LAST_SYNC,
      new Date().toISOString()
    );
  } catch (error) {
    console.warn('[Offline] Failed to update last sync:', error);
  }
};

export default {
  isOnline,
  cacheUserProfile,
  getCachedUserProfile,
  cacheMatches,
  getCachedMatches,
  queueMessage,
  getMessageQueue,
  processMessageQueue,
  clearOfflineData,
  getLastSync,
  updateLastSync,
};
