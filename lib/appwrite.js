import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
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

    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );

    if (!newAccount) throw Error;

  // Send verification email with deep link for mobile app
  await account.createVerification('eventpulse://verify');

    const avatarUrl = avatars.getInitials(username);

    await signIn(email, password);

    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email: email,
        username: username,
        avatar: avatarUrl,
      }
    );

    return newUser;
  } catch (error) {
    throw new Error(error);
  }
}


// Sign In
export async function signIn(email, password) {
  try {
    const session = await account.createEmailSession(email, password);

    return session;
  } catch (error) {
    throw new Error(error);
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
    if (!currentAccount) throw Error;

    console.log("Current account:", currentAccount);

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    console.log("Current user query result:", currentUser);

    if (!currentUser) throw Error;

    return currentUser.documents[0];
  } catch (error) {
    console.log("Error in getCurrentUser:", error);
    return null;
  }
}

// Sign Out
export async function signOut() {
  try {
    const session = await account.deleteSession("current");

    return session;
  } catch (error) {
    throw new Error(error);
  }
}

// Upload File
export async function uploadFile(file, type) {
  if (!file) return;

  const { mimeType, uri, name } = file;
  // Fetch the file as a blob/buffer for Appwrite upload
  let fileData = file;
  if (uri && typeof uri === 'string' && uri.startsWith('file://')) {
    // React Native fetch for local files
    const response = await fetch(uri);
    fileData = await response.blob();
  }

  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      fileData,
      name || undefined
    );

    // Return a direct preview URL string
    return getFilePreview(uploadedFile.$id, type);
  } catch (error) {
    throw new Error(error);
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
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, "image"),
      uploadFile(form.video, "video"),
    ]);

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

    return newPost;
  } catch (error) {
    throw new Error(error);
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

    console.log("Posts fetched successfully:", posts);
    return posts.documents;
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

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Get video posts that matches search query
export async function searchPosts(query) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.videoCollectionId,
      [Query.search("title", query)]
    );

    if (!posts) throw new Error("Something went wrong");

    return posts.documents;
  } catch (error) {
    throw new Error(error);
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

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Create Event (Admin only)
export async function createEvent(form) {
  try {
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
    );

    // Send notification to all users when event is created
    await sendEventNotificationToAllUsers(newEvent);
    
    return newEvent;
  } catch (error) {
    throw new Error(error);
  }
}

// Send notification to all users about new event
export async function sendEventNotificationToAllUsers(event) {
  try {
    // Get all users
    const users = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId
    );

    // Create notification for each user
    const notificationPromises = users.documents.map(user => 
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
    console.log("Notifications sent to all users");
  } catch (error) {
    console.log("Error sending notifications:", error);
    throw new Error(error);
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
