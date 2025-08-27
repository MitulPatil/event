import React, { createContext, useContext, useEffect, useState } from "react";
import * as Notifications from 'expo-notifications';

import { getCurrentUser, testAppwriteConnection, diagnoseCreatorIssues, fixOrphanedPosts } from "../lib/appwrite";
import { registerForPushNotificationsAsync } from "../lib/notificationService";
import { setupVerificationLinkHandler } from "../lib/handleVerificationLink";

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expoPushToken, setExpoPushToken] = useState('');

  useEffect(() => {
    // Setup Appwrite email verification deep link handler
    setupVerificationLinkHandler();
    getCurrentUser()
      .then((res) => {
        if (res) {
          setIsLogged(true);
          setUser(res);
          
          // Run diagnostics when user is logged in (only in debug mode)
          if (process.env.EXPO_PUBLIC_DEBUG_MODE === 'true') {
            console.log("🔍 Running creator relationship diagnostics...");
            
            // Test Appwrite connection
            testAppwriteConnection()
              .then(result => {
                console.log("🔗 Appwrite connection test:", result);
              })
              .catch(error => {
                console.log("❌ Appwrite connection test failed:", error);
              });

            // Diagnose creator issues
            setTimeout(() => {
              diagnoseCreatorIssues()
                .then(result => {
                  console.log("🩺 Creator diagnosis completed:", result);
                  
                  // If there are issues, log them prominently
                  if (result.diagnosis && result.diagnosis.orphanedPosts.length > 0) {
                    console.log("⚠️ CREATOR ISSUES DETECTED:");
                    console.log("🚨 Orphaned posts found:", result.diagnosis.orphanedPosts);
                    console.log("💡 To fix automatically, call fixOrphanedPosts() from the console");
                  }
                })
                .catch(error => {
                  console.log("❌ Creator diagnosis failed:", error);
                });
            }, 2000); // Run after 2 seconds to allow app to settle
          }
        } else {
          setIsLogged(false);
          setUser(null);
        }
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setLoading(false);
      });

    // Register for push notifications
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
      }
    });

    // Setup notification listeners
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  return (
    <GlobalContext.Provider
      value={{
        isLogged,
        setIsLogged,
        user,
        setUser,
        loading,
        expoPushToken,
        // Debug functions (only available in debug mode)
        ...(process.env.EXPO_PUBLIC_DEBUG_MODE === 'true' && {
          debugFunctions: {
            testConnection: testAppwriteConnection,
            diagnoseCreators: diagnoseCreatorIssues,
            fixOrphanedPosts: fixOrphanedPosts
          }
        })
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
