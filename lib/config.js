/**
 * App Configuration Helper
 * Centralized access to environment variables with validation
 */

// Appwrite Configuration
export const APPWRITE = {
  ENDPOINT: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  PLATFORM: process.env.EXPO_PUBLIC_APPWRITE_PLATFORM,
  PROJECT_ID: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  STORAGE_ID: process.env.EXPO_PUBLIC_APPWRITE_STORAGE_ID,
  DATABASE_ID: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  COLLECTIONS: {
    USERS: process.env.EXPO_PUBLIC_APPWRITE_USER_COLLECTION_ID,
    VIDEOS: process.env.EXPO_PUBLIC_APPWRITE_VIDEO_COLLECTION_ID,
    EVENTS: process.env.EXPO_PUBLIC_APPWRITE_EVENTS_COLLECTION_ID,
    NOTIFICATIONS: process.env.EXPO_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID,
  }
};

// App Configuration
export const APP = {
  NAME: process.env.EXPO_PUBLIC_APP_NAME || 'Event Pulse',
  VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  SCHEME: process.env.EXPO_PUBLIC_DEEP_LINK_SCHEME || 'eventpulse',
  DEBUG_MODE: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
  LOG_LEVEL: process.env.EXPO_PUBLIC_LOG_LEVEL || 'info',
};

// API Configuration
export const API = {
  TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT) || 30000,
  MAX_FILE_SIZE: parseInt(process.env.EXPO_PUBLIC_MAX_FILE_SIZE) || 50000000, // 50MB
  ALLOWED_FILE_TYPES: process.env.EXPO_PUBLIC_ALLOWED_FILE_TYPES?.split(',') || [
    'video/mp4', 'image/jpeg', 'image/png'
  ],
};

// Push Notifications Configuration
export const NOTIFICATIONS = {
  EXPO_PUSH_KEY: process.env.EXPO_PUBLIC_PUSH_NOTIFICATION_KEY,
  FCM_SERVER_KEY: process.env.EXPO_PUBLIC_FCM_SERVER_KEY,
};

// Development helpers
export const isDev = APP.DEBUG_MODE;
export const isProduction = !APP.DEBUG_MODE;

// Configuration validation
export function validateConfig() {
  const errors = [];

  // Required Appwrite fields
  const requiredAppwriteFields = [
    ['ENDPOINT', APPWRITE.ENDPOINT],
    ['PLATFORM', APPWRITE.PLATFORM],
    ['PROJECT_ID', APPWRITE.PROJECT_ID],
    ['STORAGE_ID', APPWRITE.STORAGE_ID],
    ['DATABASE_ID', APPWRITE.DATABASE_ID],
    ['USER_COLLECTION_ID', APPWRITE.COLLECTIONS.USERS],
    ['VIDEO_COLLECTION_ID', APPWRITE.COLLECTIONS.VIDEOS],
    ['EVENTS_COLLECTION_ID', APPWRITE.COLLECTIONS.EVENTS],
    ['NOTIFICATIONS_COLLECTION_ID', APPWRITE.COLLECTIONS.NOTIFICATIONS],
  ];

  requiredAppwriteFields.forEach(([name, value]) => {
    if (!value) {
      errors.push(`Missing EXPO_PUBLIC_APPWRITE_${name}`);
    }
  });

  if (errors.length > 0) {
    const errorMessage = `Configuration validation failed:\n${errors.join('\n')}`;
    console.error('❌', errorMessage);
    
    if (isProduction) {
      throw new Error(errorMessage);
    } else {
      console.warn('⚠️ Running with incomplete configuration in development mode');
    }
    
    return false;
  }

  console.log('✅ Configuration validation passed');
  return true;
}

// Logging helper
export function log(level, message, ...args) {
  if (!APP.DEBUG_MODE) return;
  
  const levels = ['error', 'warn', 'info', 'debug'];
  const currentLevelIndex = levels.indexOf(APP.LOG_LEVEL);
  const messageLevelIndex = levels.indexOf(level);
  
  if (messageLevelIndex <= currentLevelIndex) {
    console[level](`[${APP.NAME}]`, message, ...args);
  }
}

// Export a function to get safe config for display (without sensitive data)
export function getSafeConfig() {
  return {
    app: APP,
    appwrite: {
      endpoint: APPWRITE.ENDPOINT,
      platform: APPWRITE.PLATFORM,
      projectId: APPWRITE.PROJECT_ID ? '***' + APPWRITE.PROJECT_ID.slice(-4) : 'Not set',
      databaseId: APPWRITE.DATABASE_ID ? '***' + APPWRITE.DATABASE_ID.slice(-4) : 'Not set',
      storageId: APPWRITE.STORAGE_ID ? '***' + APPWRITE.STORAGE_ID.slice(-4) : 'Not set',
    },
    api: API,
  };
}

// Initialize configuration validation on module load
validateConfig();
