/**
 * Configuration Usage Examples
 * This file shows how to use the new environment variables and configuration helpers
 */

import { APP, APPWRITE, API, log, getSafeConfig } from '../lib/config';

// Example 1: Using app configuration
export function AppHeader() {
  return (
    <View>
      <Text>{APP.NAME} v{APP.VERSION}</Text>
    </View>
  );
}

// Example 2: Using logging helper
export function debugLog(message, data) {
  log('debug', message, data);
}

// Example 3: Using API configuration
export function validateFileUpload(file) {
  if (file.size > API.MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is ${API.MAX_FILE_SIZE / 1000000}MB`);
  }
  
  if (!API.ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error(`File type not allowed. Supported types: ${API.ALLOWED_FILE_TYPES.join(', ')}`);
  }
  
  return true;
}

// Example 4: Development vs Production behavior
export function getAppBehavior() {
  if (APP.DEBUG_MODE) {
    return {
      showDebugInfo: true,
      enableConsoleLogging: true,
      skipSomeValidations: true
    };
  } else {
    return {
      showDebugInfo: false,
      enableConsoleLogging: false,
      skipSomeValidations: false
    };
  }
}

// Example 5: Safe configuration display for settings screen
export function SettingsScreen() {
  const safeConfig = getSafeConfig();
  
  return (
    <View>
      <Text>App Version: {safeConfig.app.VERSION}</Text>
      <Text>Debug Mode: {safeConfig.app.DEBUG_MODE ? 'Enabled' : 'Disabled'}</Text>
      <Text>Appwrite Project: {safeConfig.appwrite.projectId}</Text>
      <Text>API Timeout: {safeConfig.api.TIMEOUT}ms</Text>
    </View>
  );
}

// Example 6: Environment-specific deep linking
export function createDeepLink(path) {
  return `${APP.SCHEME}://${path}`;
}

export default {
  AppHeader,
  debugLog,
  validateFileUpload,
  getAppBehavior,
  SettingsScreen,
  createDeepLink
};
