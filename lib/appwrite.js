import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Permission,
  Query,
  Role,
  Storage,
} from "react-native-appwrite";

export const appwriteConfig = {
  endpoint: "https://fra.cloud.appwrite.io/v1",
  platform: "com.projects.eventpulse",
  projectId: "67b86b52000e47ff77fb",
  storageId: "67b870a3001b721ecbd1",
  databaseId: "67b86e1000337d75ac77",
  userCollectionId: "67b86e30002c3bd94409",
  videoCollectionId: "67b86e5d001c35f13458",
  eventsCollectionId: "686e81f9000c0d1420f0",
  notificationsCollectionId: "686e849c003dd437410e"
};

const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)
  .setPlatform(appwriteConfig.platform);

const account = new Account(client);
const storage = new Storage(client);
const avatars = new Avatars(client);
const databases = new Databases(client);

function isStrongPassword(password) {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
}

// Register user
export async function createUser(email, password, username) {
  try {
    // Enforce strong password
    if (!isStrongPassword(password)) {
      throw new Error(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      );
    }

    console.log("Creating account for:", email, username);

    // First, ensure no active session exists
    try {
      await account.deleteSession('current');
      console.log("Cleared existing session");
    } catch (sessionError) {
      console.log("No existing session to clear");
    }

    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );

    if (!newAccount) throw new Error("Failed to create account");

    console.log("Account created successfully:", newAccount);

    // Skip verification email for now to avoid URL issues
    // Send verification email with deep link for mobile app
    try {
      // await account.createVerification('eventpulse://verify');
      console.log("Skipping email verification for now");
    } catch (verificationError) {
      console.log("Verification email failed:", verificationError);
      // Don't throw error for verification failure - continue with user creation
    }

    const avatarUrl = avatars.getInitials(username);

    // Sign in the user
    console.log("Signing in the new user...");
    await signIn(email, password);

    console.log("Creating user document in database...");

    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email: email,
        username: username,
        avatar: avatarUrl,
        role: "user", // Default role is "user", can be upgraded to "admin" manually
      }
    );

    console.log("User document created successfully:", newUser);

    // Wait a moment and then get the current user to ensure everything is set up
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return newUser;
  } catch (error) {
    console.log("Error in createUser:", error);
    throw new Error(error.message || "Failed to create user");
  }
}


// Sign In
export async function signIn(email, password) {
  try {
    // First, clear any existing session
    try {
      await account.deleteSession('current');
      console.log("Cleared existing session before sign in");
    } catch (sessionError) {
      console.log("No existing session to clear");
    }

    const session = await account.createEmailSession(email, password);
    console.log("Session created successfully");

    return session;
  } catch (error) {
    console.log("Error in signIn:", error);
    throw new Error(error.message || "Failed to sign in");
  }
}

// Get Account
export async function getAccount() {
  try {
    const currentAccount = await account.get();

    return currentAccount;
  } catch (error) {
    throw new Error(error);
  }
}

// Get Current User
export async function getCurrentUser() {
  try {
    const currentAccount = await getAccount();
    
    if (!currentAccount) {
      console.log("No current account found");
      return null;
    }

    console.log("Current account:", currentAccount);

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    console.log("Current user query result:", currentUser);

    if (!currentUser || !currentUser.documents || currentUser.documents.length === 0) {
      console.log("No user document found for accountId:", currentAccount.$id);
      return null;
    }

    console.log("User found:", currentUser.documents[0]);
    return currentUser.documents[0];
  } catch (error) {
    console.log("Error in getCurrentUser:", error);
    console.log("Error details:", JSON.stringify(error, null, 2));
    return null;
  }
}

// Sign Out
export async function signOut() {
  try {
    const session = await account.deleteSession("current");
    console.log("Signed out successfully");
    return session;
  } catch (error) {
    console.log("Error signing out:", error);
    throw new Error(error.message || "Failed to sign out");
  }
}

// Clear all sessions (useful for debugging)
export async function clearAllSessions() {
  try {
    await account.deleteSessions();
    console.log("All sessions cleared");
  } catch (error) {
    console.log("Error clearing sessions:", error);
  }
}

// Upload File
export async function uploadFile(file, type) {
  if (!file) return;

  console.log("Starting file upload:", { 
    name: file.name, 
    size: file.size, 
    type: file.mimeType,
    uri: file.uri 
  });

  try {
    console.log("Uploading to Appwrite storage using direct file object...");
    
    // Try uploading the file object directly
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      file  // Pass the entire file object directly
    );

    console.log("File uploaded successfully:", uploadedFile.$id);
    return getFilePreview(uploadedFile.$id, type);
    
  } catch (error) {
    console.log("Direct upload failed, trying with file data:", error);
    
    // Fallback: Try creating a proper file object
    try {
      const fileToUpload = {
        name: file.name || `file_${Date.now()}.${type === 'video' ? 'mp4' : 'jpg'}`,
        type: file.mimeType || (type === 'video' ? 'video/mp4' : 'image/jpeg'),
        uri: file.uri,
        size: file.size
      };

      console.log("Trying upload with structured file object:", fileToUpload);
      
      const uploadedFile = await storage.createFile(
        appwriteConfig.storageId,
        ID.unique(),
        fileToUpload
      );

      console.log("Structured upload successful:", uploadedFile.$id);
      return getFilePreview(uploadedFile.$id, type);
      
    } catch (fallbackError) {
      console.log("All upload methods failed:", fallbackError);
      throw new Error(`Upload failed: ${fallbackError.message || 'Unknown error'}`);
    }
  }
}

// Get File Preview
export async function getFilePreview(fileId, type) {
  try {
    if (type === "video") {
      // getFileView returns a URL string
      return storage.getFileView(appwriteConfig.storageId, fileId).toString();
    } else if (type === "image") {
      // getFilePreview returns a URL string
      return storage.getFilePreview(
        appwriteConfig.storageId,
        fileId,
        800, // reasonable size for mobile
        800,
        "top",
        100
      ).toString();
    } else {
      throw new Error("Invalid file type");
    }
  } catch (error) {
    throw new Error(error);
  }
}

// Create Video Post
export async function createVideoPost(form) {
  try {
    console.log("Starting video post creation...");
    console.log("Form data:", {
      title: form.title,
      prompt: form.prompt,
      userId: form.userId,
      hasVideo: !!form.video,
      hasThumbnail: !!form.thumbnail
    });

    console.log("Uploading thumbnail...");
    const thumbnailUrl = await uploadFile(form.thumbnail, "image");
    console.log("Thumbnail uploaded:", thumbnailUrl);

    console.log("Uploading video...");
    const videoUrl = await uploadFile(form.video, "video");
    console.log("Video uploaded:", videoUrl);

    console.log("Creating database document...");
    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      ID.unique(),
      {
        title: form.title,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        prompt: form.prompt,
        creator: form.userId,
      }
    );

    console.log("Video post created successfully:", newPost.$id);
    return newPost;
  } catch (error) {
    console.log("Error in createVideoPost:", error);
    console.log("Error details:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to create video post: ${error.message}`);
  }
}

// Get all video Posts
export async function getAllPosts() {
  try {
    console.log("Fetching all posts with config:", {
      databaseId: appwriteConfig.databaseId,
      videoCollectionId: appwriteConfig.videoCollectionId
    });
    
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.orderDesc("$createdAt")]
    );

    console.log("Raw posts fetched:", posts);

    // Manually populate creator data for each post
    const postsWithCreators = await Promise.all(
      posts.documents.map(async (post) => {
        try {
          // Fetch creator details using the creator ID
          const creatorData = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            post.creator
          );
          
          return {
            ...post,
            creator: creatorData
          };
        } catch (error) {
          console.log("Error fetching creator for post:", post.$id, error);
          // Return post with default creator info if fetch fails
          return {
            ...post,
            creator: {
              username: "Unknown User",
              avatar: null
            }
          };
        }
      })
    );

    console.log("Posts with creators fetched successfully:", postsWithCreators);
    return postsWithCreators;
  } catch (error) {
    console.log("Error in getAllPosts:", error);
    throw new Error(error);
  }
}

// Get video posts created by user
export async function getUserPosts(userId) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.equal("creator", userId)]
    );

    // Manually populate creator data for each post
    const postsWithCreators = await Promise.all(
      posts.documents.map(async (post) => {
        try {
          const creatorData = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            post.creator
          );
          
          return {
            ...post,
            creator: creatorData
          };
        } catch (error) {
          console.log("Error fetching creator for post:", post.$id, error);
          return {
            ...post,
            creator: {
              username: "Unknown User",
              avatar: null
            }
          };
        }
      })
    );

    return postsWithCreators;
  } catch (error) {
    throw new Error(error);
  }
}

// Get video posts that matches search query
export async function searchPosts(query) {
  try {
    // First try fulltext search
    try {
      const posts = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.videoCollectionId,
        [Query.search("title", query)]
      );
      return posts.documents;
    } catch (fullTextError) {
      console.log("Fulltext search failed, using alternative method:", fullTextError.message);
      
      // Fallback: Get all posts and filter client-side
      const allPosts = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.videoCollectionId,
        [Query.orderDesc("$createdAt")]
      );
      
      // Filter posts that contain the search query in title (case-insensitive)
      const filteredPosts = allPosts.documents.filter(post => 
        post.title && post.title.toLowerCase().includes(query.toLowerCase())
      );
      
      return filteredPosts;
    }
  } catch (error) {
    console.log("Search error:", error);
    throw new Error("Search failed. Please try again.");
  }
}

// Search events by name or description
export async function searchEvents(query) {
  try {
    // Get all events and filter client-side since fulltext might not be available
    const allEvents = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.eventsCollectionId,
      [Query.orderDesc("$createdAt")]
    );
    
    // Filter events that contain the search query in name, description, or venue
    const filteredEvents = allEvents.documents.filter(event => 
      (event.name && event.name.toLowerCase().includes(query.toLowerCase())) ||
      (event.description && event.description.toLowerCase().includes(query.toLowerCase())) ||
      (event.venue && event.venue.toLowerCase().includes(query.toLowerCase()))
    );
    
    return filteredEvents;
  } catch (error) {
    console.log("Event search error:", error);
    throw new Error("Event search failed. Please try again.");
  }
}

// Get latest created video posts
export async function getLatestPosts() {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(7)]
    );

    // Manually populate creator data for each post
    const postsWithCreators = await Promise.all(
      posts.documents.map(async (post) => {
        try {
          const creatorData = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            post.creator
          );
          
          return {
            ...post,
            creator: creatorData
          };
        } catch (error) {
          console.log("Error fetching creator for post:", post.$id, error);
          return {
            ...post,
            creator: {
              username: "Unknown User",
              avatar: null
            }
          };
        }
      })
    );

    return postsWithCreators;
  } catch (error) {
    throw new Error(error);
  }
}

// Create Event
// Create Event (Admin only)
export async function createEvent(form) {
  try {
    console.log("Creating event with user ID:", form.adminId);
    
    // Check if user has admin permissions
    const permissions = await canUserCreateEvents(form.adminId);
    
    if (!permissions.canCreate) {
      throw new Error("Access denied. Only administrators can create events.");
    }
    
    console.log("User authorized to create events:", permissions.user.username);
    
    const newEvent = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.eventsCollectionId,
      ID.unique(),
      {
        name: form.name,
        description: form.description,
        date: form.date,
        venue: form.venue,
        createdBy: form.adminId,
        status: "active",
      }
      // Remove the permissions array - let Appwrite use collection-level permissions
    );

    console.log("Event created successfully:", newEvent);

    // Send notification to all users when event is created
    console.log("Sending notifications to all users...");
    await sendEventNotificationToAllUsers(newEvent);
    
    // Also send local push notification to current user
    try {
      const { sendLocalEventNotification } = require('./notificationService');
      await sendLocalEventNotification(newEvent);
      console.log("Local push notification sent successfully");
    } catch (localNotifError) {
      console.log("Local notification failed:", localNotifError);
      // Don't fail event creation if local notification fails
    }
    
    // Verify notifications were sent (optional verification)
    setTimeout(async () => {
      try {
        const verification = await verifyEventNotifications(newEvent.$id);
        if (verification.success) {
          console.log("✅ All notifications verified successfully");
        } else {
          console.log("⚠️ Some notifications may have failed, consider resending");
        }
      } catch (error) {
        console.log("Verification check failed:", error);
      }
    }, 2000); // Check after 2 seconds
    
    return newEvent;
  } catch (error) {
    console.log("Error creating event:", error);
    throw new Error(error.message || "Failed to create event");
  }
}

// Send notification to all users about new event
export async function sendEventNotificationToAllUsers(event) {
  try {
    console.log("Starting to send notifications for event:", event.name);
    
    // Get all users with pagination to ensure we get everyone
    let allUsers = [];
    let offset = 0;
    const limit = 100; // Process in batches of 100
    
    while (true) {
      const users = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        [
          Query.limit(limit),
          Query.offset(offset)
        ]
      );
      
      if (users.documents.length === 0) {
        break; // No more users
      }
      
      allUsers = [...allUsers, ...users.documents];
      offset += limit;
      
      // If we got less than the limit, we've reached the end
      if (users.documents.length < limit) {
        break;
      }
    }

    console.log(`Found ${allUsers.length} users to notify`);

    if (allUsers.length === 0) {
      console.log("No users found to send notifications to");
      return;
    }

    // Create notification for each user in batches to avoid overwhelming the server
    const batchSize = 10;
    const notificationBatches = [];
    
    for (let i = 0; i < allUsers.length; i += batchSize) {
      const batch = allUsers.slice(i, i + batchSize);
      notificationBatches.push(batch);
    }

    console.log(`Sending notifications in ${notificationBatches.length} batches`);

    // Process each batch
    for (let batchIndex = 0; batchIndex < notificationBatches.length; batchIndex++) {
      const batch = notificationBatches[batchIndex];
      console.log(`Processing batch ${batchIndex + 1}/${notificationBatches.length} with ${batch.length} users`);
      
      const notificationPromises = batch.map(async (user) => {
        try {
          const notification = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.notificationsCollectionId,
            ID.unique(),
            {
              userId: user.$id,
              eventId: event.$id,
              title: `New Event: ${event.name}`,
              description: event.description,
              eventVenue: event.venue,
              date: event.date,
              isRead: false,
            }
          );
          console.log(`Notification sent to user: ${user.username || user.email}`);
          return notification;
        } catch (error) {
          console.log(`Failed to send notification to user ${user.username || user.email}:`, error);
          // Don't throw error for individual failures, continue with others
          return null;
        }
      });

      // Wait for current batch to complete before starting next batch
      const batchResults = await Promise.allSettled(notificationPromises);
      
      // Count successful notifications in this batch
      const successCount = batchResults.filter(result => result.status === 'fulfilled' && result.value !== null).length;
      const failureCount = batchResults.filter(result => result.status === 'rejected' || result.value === null).length;
      
      console.log(`Batch ${batchIndex + 1} completed: ${successCount} successful, ${failureCount} failed`);
      
      // Small delay between batches to avoid rate limiting
      if (batchIndex < notificationBatches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`Notification process completed for event: ${event.name}`);
    console.log(`Total users processed: ${allUsers.length}`);
    
  } catch (error) {
    console.log("Error sending notifications:", error);
    // Don't throw error as event creation should still succeed even if notifications fail
    console.log("Event was created successfully, but some notifications may have failed");
  }
}

// Verify notifications were sent to all users for a specific event
export async function verifyEventNotifications(eventId) {
  try {
    // Get all users
    const users = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId
    );

    // Get all notifications for this event
    const notifications = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.notificationsCollectionId,
      [Query.equal("eventId", eventId)]
    );

    const totalUsers = users.documents.length;
    const totalNotifications = notifications.documents.length;
    
    console.log(`Event ${eventId} notification verification:`);
    console.log(`Total users: ${totalUsers}`);
    console.log(`Total notifications sent: ${totalNotifications}`);
    
    if (totalUsers === totalNotifications) {
      console.log("✅ All users received notifications");
      return { success: true, totalUsers, totalNotifications };
    } else {
      console.log("⚠️ Some users may not have received notifications");
      
      // Find users who didn't receive notifications
      const notifiedUserIds = notifications.documents.map(n => n.userId);
      const missedUsers = users.documents.filter(user => !notifiedUserIds.includes(user.$id));
      
      console.log(`Missed users:`, missedUsers.map(u => u.username || u.email));
      
      return { 
        success: false, 
        totalUsers, 
        totalNotifications, 
        missedUsers: missedUsers.length,
        missedUsersList: missedUsers 
      };
    }
  } catch (error) {
    console.log("Error verifying notifications:", error);
    throw new Error("Failed to verify notifications");
  }
}

// Resend notifications to users who missed them
export async function resendMissedNotifications(eventId) {
  try {
    const verification = await verifyEventNotifications(eventId);
    
    if (verification.success) {
      console.log("All users already have notifications");
      return { message: "All users already notified", sent: 0 };
    }

    // Get the event details
    const event = await getEventById(eventId);
    
    // Send notifications to missed users
    const notificationPromises = verification.missedUsersList.map(user =>
      databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.notificationsCollectionId,
        ID.unique(),
        {
          userId: user.$id,
          eventId: event.$id,
          title: `New Event: ${event.name}`,
          description: event.description,
          eventVenue: event.venue,
          date: event.date,
          isRead: false,
        }
      )
    );

    await Promise.all(notificationPromises);
    
    console.log(`Resent notifications to ${verification.missedUsers} users`);
    return { 
      message: `Notifications resent to ${verification.missedUsers} users`, 
      sent: verification.missedUsers 
    };
  } catch (error) {
    console.log("Error resending notifications:", error);
    throw new Error("Failed to resend notifications");
  }
}

// Get notification statistics for monitoring
export async function getNotificationStats() {
  try {
    // Get total users
    const users = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId
    );

    // Get total notifications
    const notifications = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.notificationsCollectionId
    );

    // Get unread notifications
    const unreadNotifications = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.notificationsCollectionId,
      [Query.equal("isRead", false)]
    );

    // Get recent notifications (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentNotifications = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.notificationsCollectionId,
      [Query.greaterThan("$createdAt", weekAgo.toISOString())]
    );

    const stats = {
      totalUsers: users.documents.length,
      totalNotifications: notifications.documents.length,
      unreadNotifications: unreadNotifications.documents.length,
      recentNotifications: recentNotifications.documents.length,
      readRate: notifications.documents.length > 0 
        ? ((notifications.documents.length - unreadNotifications.documents.length) / notifications.documents.length * 100).toFixed(2)
        : 0
    };

    console.log("Notification Statistics:", stats);
    return stats;
  } catch (error) {
    console.log("Error getting notification stats:", error);
    throw new Error("Failed to get notification statistics");
  }
}

// Send push notifications to all users (requires push tokens)
export async function sendPushNotificationToAllUsers(event) {
  try {
    console.log("Preparing to send push notifications to all users");
    
    // Get all users with their push tokens
    const users = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId
    );

    // Filter users who have push tokens
    const usersWithTokens = users.documents.filter(user => user.pushToken);
    
    console.log(`Found ${usersWithTokens.length} users with push tokens out of ${users.documents.length} total users`);

    if (usersWithTokens.length === 0) {
      console.log("No users have push tokens registered");
      return { sent: 0, total: users.documents.length };
    }

    // Prepare notification payload
    const message = {
      to: usersWithTokens.map(user => user.pushToken),
      sound: 'default',
      title: `New Event: ${event.name}`,
      body: `${event.description} at ${event.venue}`,
      data: { 
        eventId: event.$id,
        type: 'new_event',
        eventName: event.name,
        eventVenue: event.venue,
        eventDate: event.date
      },
    };

    // Note: This is a placeholder for actual push notification service
    // You would need to integrate with Expo's push notification service
    // or Firebase Cloud Messaging to actually send the notifications
    
    console.log("Push notification payload prepared:", message);
    console.log("⚠️ Note: Actual push notification sending requires Expo Push Service integration");
    
    return { 
      sent: usersWithTokens.length, 
      total: users.documents.length,
      message: "Push notification payload prepared (requires push service integration)"
    };
    
  } catch (error) {
    console.log("Error preparing push notifications:", error);
    throw new Error("Failed to prepare push notifications");
  }
}

// Update user's push token for notifications
export async function updateUserPushToken(userId, pushToken) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      throw new Error("User not found");
    }

    // Update the user document with push token
    const updatedUser = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      currentUser.$id,
      {
        pushToken: pushToken,
        lastTokenUpdate: new Date().toISOString()
      }
    );

    console.log("Push token updated for user:", currentUser.username);
    return updatedUser;
  } catch (error) {
    console.log("Error updating push token:", error);
    throw new Error("Failed to update push token");
  }
}

// Test Appwrite connectivity
export async function testAppwriteConnection() {
  try {
    console.log("Testing Appwrite connection...");
    
    // Test 1: Check if we can get current account
    const account = await getAccount();
    console.log("✅ Account access working:", account.email);
    
    // Test 2: Check if we can access database
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.limit(1)]
    );
    console.log("✅ Database access working, found", posts.documents.length, "posts");
    
    // Test 3: Check storage access (without uploading)
    console.log("✅ Storage configuration:", {
      endpoint: appwriteConfig.endpoint,
      storageId: appwriteConfig.storageId
    });
    
    return {
      success: true,
      message: "All Appwrite services accessible"
    };
    
  } catch (error) {
    console.log("❌ Appwrite connection test failed:", error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
}

// Test notification system - create a test event and verify all notifications
export async function testNotificationSystem() {
  try {
    console.log("🧪 Starting notification system test...");
    
    // Get current user (must be admin)
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can run notification tests");
    }

    // Create a test event
    const testEvent = {
      name: "Test Event - Notification System",
      description: "This is a test event to verify the notification system is working properly.",
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      venue: "Test Venue",
      adminId: currentUser.accountId
    };

    console.log("Creating test event...");
    const newEvent = await createEvent(testEvent);
    console.log("✅ Test event created:", newEvent.$id);

    // Wait a moment for notifications to be sent
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Verify notifications
    console.log("Verifying notifications...");
    const verification = await verifyEventNotifications(newEvent.$id);
    
    if (verification.success) {
      console.log("✅ All users received notifications successfully!");
    } else {
      console.log("❌ Some users did not receive notifications");
      console.log("Attempting to resend missed notifications...");
      
      const resendResult = await resendMissedNotifications(newEvent.$id);
      console.log("Resend result:", resendResult.message);
    }

    // Get notification statistics
    const stats = await getNotificationStats();
    console.log("Current notification statistics:", stats);

    console.log("🎉 Notification system test completed!");
    
    return {
      testEventId: newEvent.$id,
      verification,
      stats,
      success: verification.success
    };

  } catch (error) {
    console.log("❌ Notification system test failed:", error);
    throw new Error(`Test failed: ${error.message}`);
  }
}

// Validate database schema - check if all required fields exist
export async function validateDatabaseSchema() {
  try {
    console.log("🔍 Validating database schema...");
    
    const issues = [];
    
    // Test user creation with new fields
    try {
      const testUser = await getCurrentUser();
      if (testUser) {
        console.log("✅ Users collection accessible");
        
        // Check if role field exists
        if (testUser.role === undefined) {
          issues.push("❌ Users collection missing 'role' field");
        } else {
          console.log("✅ Users collection has 'role' field");
        }
        
        // Check if pushToken field exists  
        if (testUser.pushToken === undefined) {
          issues.push("⚠️ Users collection missing 'pushToken' field (optional)");
        } else {
          console.log("✅ Users collection has 'pushToken' field");
        }
        
        // Check if lastTokenUpdate field exists
        if (testUser.lastTokenUpdate === undefined) {
          issues.push("⚠️ Users collection missing 'lastTokenUpdate' field (optional)");
        } else {
          console.log("✅ Users collection has 'lastTokenUpdate' field");
        }
      }
    } catch (error) {
      issues.push("❌ Cannot access Users collection: " + error.message);
    }
    
    // Test events collection
    try {
      const events = await getAllEvents();
      console.log("✅ Events collection accessible");
    } catch (error) {
      issues.push("❌ Cannot access Events collection: " + error.message);
    }
    
    // Test notifications collection
    try {
      if (testUser) {
        const notifications = await getUserNotifications(testUser.$id);
        console.log("✅ Notifications collection accessible");
      }
    } catch (error) {
      issues.push("❌ Cannot access Notifications collection: " + error.message);
    }
    
    // Print results
    console.log("\n📊 Database Schema Validation Results:");
    console.log("=".repeat(50));
    
    if (issues.length === 0) {
      console.log("🎉 All database schemas are properly configured!");
    } else {
      console.log("⚠️ Issues found:");
      issues.forEach(issue => console.log(issue));
      console.log("\n📋 Required Actions:");
      console.log("1. Go to Appwrite Console → Database");
      console.log("2. Add missing fields to Users collection:");
      console.log("   - role (String, required, default: 'user')");  
      console.log("   - pushToken (String, optional)");
      console.log("   - lastTokenUpdate (DateTime, optional)");
    }
    
    return {
      valid: issues.length === 0,
      issues: issues
    };
    
  } catch (error) {
    console.log("❌ Database validation failed:", error);
    return {
      valid: false,
      issues: ["Database validation failed: " + error.message]
    };
  }
}

// Get all events
export async function getAllEvents() {
  try {
    const events = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.eventsCollectionId,
      [Query.orderDesc("$createdAt")]
    );

    return events.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get notifications for a specific user
export async function getUserNotifications(userId) {
  try {
    const notifications = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.notificationsCollectionId,
      [
        Query.equal("userId", userId),
        Query.orderDesc("$createdAt")
      ]
    );

    return notifications.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId) {
  try {
    const updatedNotification = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.notificationsCollectionId,
      notificationId,
      {
        isRead: true,
      }
    );

    return updatedNotification;
  } catch (error) {
    throw new Error(error);
  }
}

// Delete notification
export async function deleteNotification(notificationId) {
  try {
    console.log("Deleting notification:", notificationId);
    
    const deletedNotification = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.notificationsCollectionId,
      notificationId
    );

    console.log("Notification deleted successfully");
    return deletedNotification;
  } catch (error) {
    console.log("Error deleting notification:", error);
    throw new Error(`Failed to delete notification: ${error.message}`);
  }
}

// Get unread notification count for a user
export async function getUnreadNotificationCount(userId) {
  try {
    const notifications = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.notificationsCollectionId,
      [
        Query.equal("userId", userId),
        Query.equal("isRead", false)
      ]
    );

    return notifications.documents.length;
  } catch (error) {
    throw new Error(error);
  }
}

// Get event by ID
export async function getEventById(eventId) {
  try {
    const event = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.eventsCollectionId,
      eventId
    );

    return event;
  } catch (error) {
    throw new Error(error);
  }
}

// Check if user can create events
export async function checkUserPermissions() {
  try {
    const currentAccount = await getAccount();
    console.log("Current user account for permissions:", currentAccount);
    console.log("User ID:", currentAccount.$id);
    console.log("User verified:", currentAccount.emailVerification);
    return currentAccount;
  } catch (error) {
    console.log("Error checking user permissions:", error);
    throw new Error("User not authenticated");
  }
}

// Check if user has admin role and can create events
export async function canUserCreateEvents(userId) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      throw new Error("User not found");
    }

    console.log("Checking event creation permissions for user:", currentUser);
    
    // Check if user has admin role
    const isAdmin = currentUser.role === "admin";
    
    console.log("User role:", currentUser.role);
    console.log("Can create events:", isAdmin);
    
    return {
      canCreate: isAdmin,
      userRole: currentUser.role,
      user: currentUser
    };
  } catch (error) {
    console.log("Error checking event creation permissions:", error);
    throw new Error("Failed to check permissions");
  }
}

// Update user role (for admin to promote users)
export async function updateUserRole(userId, newRole) {
  try {
    // First get the current user to check if they are admin
    const currentUser = await getCurrentUser();
    
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only administrators can update user roles");
    }

    // Find the user document by accountId
    const userQuery = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", userId)]
    );

    if (!userQuery.documents || userQuery.documents.length === 0) {
      throw new Error("User not found");
    }

    const userDoc = userQuery.documents[0];

    // Update the user's role
    const updatedUser = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userDoc.$id,
      {
        role: newRole
      }
    );

    console.log("User role updated successfully:", updatedUser);
    return updatedUser;
  } catch (error) {
    console.log("Error updating user role:", error);
    throw new Error(error.message || "Failed to update user role");
  }
}

// For development/testing: Promote current user to admin
export async function promoteCurrentUserToAdmin() {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      throw new Error("No user logged in");
    }

    const updatedUser = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      currentUser.$id,
      {
        role: "admin"
      }
    );

    console.log("Current user promoted to admin:", updatedUser);
    return updatedUser;
  } catch (error) {
    console.log("Error promoting user to admin:", error);
    throw new Error(error.message || "Failed to promote user");
  }
}
