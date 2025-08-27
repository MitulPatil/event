# 🎬 Event Pulse

A modern mobile application for sharing and discovering event videos, built with React Native and Expo. Event Pulse allows users to upload, share, and explore videos from various events with a sleek, user-friendly interface.

![Event Pulse](assets/images/logo.png)

## 📱 Features

### 🔐 Authentication & User Management
- **Secure Registration & Login** with email verification
- **User Profiles** with customizable avatars and bio
- **Session Management** with automatic login persistence
- **Role-based Access Control** for different user types

### 🎥 Video Management
- **Video Upload** with title, description, and thumbnail
- **Video Streaming** with smooth playback controls
- **Video Discovery** through categories and trending sections
- **Search Functionality** with real-time results
- **Bookmark System** to save favorite videos

### 🌟 Social Features
- **User Profiles** showcasing uploaded videos
- **Creator Information** display on video cards
- **Video Interactions** and engagement tracking
- **Personalized Feed** based on user preferences

### 🔔 Smart Notifications
- **Push Notifications** for new content and updates
- **Deep Link Support** for direct content access
- **Background Notification Handling**

## 🛠️ Technology Stack

### **Frontend Framework**
- **React Native (0.76.7)** - Cross-platform mobile development
- **Expo (52.0.0)** - Development platform and tooling
- **Expo Router (4.0.19)** - File-based navigation system

### **Styling & UI**
- **NativeWind (2.0.11)** - Tailwind CSS for React Native
- **React Native Animatable** - Smooth animations
- **React Native Reanimated (3.16.7)** - High-performance animations
- **Custom Fonts** - Poppins font family integration

### **Backend & Database**
- **Appwrite** - Backend-as-a-Service (BaaS)
  - Database management
  - File storage
  - User authentication
  - Real-time subscriptions

### **Media & Assets**
- **Expo AV** - Video and audio playback
- **Expo Document Picker** - File selection
- **React Native WebView** - Web content integration

### **State Management**
- **React Context API** - Global state management
- **Custom Hooks** - Reusable logic abstraction

## 📂 Project Structure

```
event_pulse/
├── app/                    # Main application screens
│   ├── (auth)/            # Authentication screens
│   │   ├── sign-in.jsx    # Login screen
│   │   └── sign-up.jsx    # Registration screen
│   ├── (tabs)/            # Tab-based navigation
│   │   ├── home.jsx       # Home feed
│   │   ├── create.jsx     # Video upload
│   │   ├── profile.jsx    # User profile
│   │   └── bookmark.jsx   # Saved videos
│   └── search/            # Search functionality
├── components/            # Reusable UI components
│   ├── VideoCard.jsx     # Video display component
│   ├── FormField.jsx     # Input field component
│   ├── CustomButton.jsx  # Styled button component
│   └── ...
├── context/              # Global state management
│   └── GlobalProvider.js # React Context provider
├── lib/                  # Utility functions
│   ├── appwrite.js      # Backend integration
│   └── useAppwrite.js   # Custom data hooks
├── constants/           # App constants
├── assets/             # Static assets
└── ...
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android) or Xcode (for iOS)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MitulPatil/event.git
   cd event_pulse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy the example environment file and configure your Appwrite credentials:
   ```bash
   # Copy the example file
   cp .env.example .env
   ```
   
   Edit the `.env` file and add your Appwrite credentials:
   ```env
   # Appwrite Configuration
   EXPO_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
   EXPO_PUBLIC_APPWRITE_PLATFORM=com.projects.eventpulse
   EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_APPWRITE_STORAGE_ID=your_storage_bucket_id
   EXPO_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
   EXPO_PUBLIC_APPWRITE_USER_COLLECTION_ID=your_user_collection_id
   EXPO_PUBLIC_APPWRITE_VIDEO_COLLECTION_ID=your_video_collection_id
   EXPO_PUBLIC_APPWRITE_EVENTS_COLLECTION_ID=your_events_collection_id
   EXPO_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID=your_notifications_collection_id
   
   # App Configuration
   EXPO_PUBLIC_APP_NAME=Event Pulse
   EXPO_PUBLIC_APP_VERSION=1.0.0
   EXPO_PUBLIC_DEBUG_MODE=true
   ```

   **🔗 How to get your Appwrite credentials:**
   1. Go to your [Appwrite Console](https://cloud.appwrite.io/)
   2. Select your project
   3. Copy the **Project ID** from Settings → General
   4. Go to Database → Your Database → Copy the **Database ID**
   5. Go to Storage → Your Bucket → Copy the **Bucket ID**
   6. Go to Database → Collections and copy each Collection ID:
      - Users Collection ID
      - Videos Collection ID  
      - Events Collection ID
      - Notifications Collection ID

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on your preferred platform**
   ```bash
   # For Android
   npm run android
   
   # For iOS
   npm run ios
   
   # For Web
   npm run web
   ```

## 📱 Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run on web browser

## 🏗️ Architecture

### **Navigation Structure**
- **File-based Routing** with Expo Router
- **Tab Navigation** for main app sections
- **Stack Navigation** for authentication flow
- **Deep Linking** support for direct content access

### **State Management**
- **Global Context** for user authentication and app-wide state
- **Local State** for component-specific data
- **Custom Hooks** for data fetching and API integration

### **Data Flow**
```
User Action → Component → Context/Hook → Appwrite API → Database
                ↓
UI Update ← State Update ← Response ← API Response
```

## 🔧 Configuration

### **Environment Variables**
All sensitive configuration is managed through environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_APPWRITE_ENDPOINT` | Appwrite server endpoint | ✅ |
| `EXPO_PUBLIC_APPWRITE_PROJECT_ID` | Your Appwrite project ID | ✅ |
| `EXPO_PUBLIC_APPWRITE_DATABASE_ID` | Database ID for your collections | ✅ |
| `EXPO_PUBLIC_APPWRITE_STORAGE_ID` | Storage bucket ID for files | ✅ |
| `EXPO_PUBLIC_APPWRITE_USER_COLLECTION_ID` | Users collection ID | ✅ |
| `EXPO_PUBLIC_APPWRITE_VIDEO_COLLECTION_ID` | Videos collection ID | ✅ |
| `EXPO_PUBLIC_APPWRITE_EVENTS_COLLECTION_ID` | Events collection ID | ✅ |
| `EXPO_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID` | Notifications collection ID | ✅ |
| `EXPO_PUBLIC_APP_NAME` | Application display name | ❌ |
| `EXPO_PUBLIC_DEBUG_MODE` | Enable debug logging | ❌ |

### **Babel Configuration**
The project uses Babel for code transformation:
- **babel-preset-expo** - Expo-specific transformations
- **nativewind/babel** - Tailwind CSS compilation
- **react-native-reanimated/plugin** - Animation optimizations

### **Tailwind Configuration**
Custom Tailwind setup for React Native with:
- **Custom Colors** matching app theme
- **Typography** using Poppins font family
- **Responsive Design** utilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Mitul Patil**
- GitHub: [@MitulPatil](https://github.com/MitulPatil)

## 🙏 Acknowledgments

- **Expo Team** for the amazing development platform
- **Appwrite** for the robust backend services
- **React Native Community** for the extensive ecosystem
- **Tailwind CSS** for the utility-first styling approach

---

Built with ❤️ using React Native and Expo