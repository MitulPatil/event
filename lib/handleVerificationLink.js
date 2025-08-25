import * as Linking from 'expo-linking';
import { Alert } from 'react-native';
import { Account, Client } from 'react-native-appwrite';

// Appwrite client setup (reuse your config values)
const client = new Client();
client
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('67b86b52000e47ff77fb')
  .setPlatform('com.projects.eventpulse');
const account = new Account(client);

// Listen for deep link and handle verification
let verificationListener = null;
export function setupVerificationLinkHandler() {
  if (verificationListener) return; // Prevent multiple listeners
  verificationListener = Linking.addEventListener('url', async ({ url }) => {
    const { queryParams } = Linking.parse(url);
    const { userId, secret } = queryParams;
    if (userId && secret) {
      try {
        // Optionally, show a loading indicator here
        await account.updateVerification(userId, secret);
        Alert.alert('Success', 'Your email has been verified! You can now log in.');
      } catch (e) {
        Alert.alert('Verification failed', 'The verification link is invalid or expired.');
      }
    }
  });
}