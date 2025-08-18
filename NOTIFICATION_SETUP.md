# EventPulse Notification Feature Setup Guide

## Overview
This notification system allows admins to create events and automatically sends notifications to all users. The system includes:

- **In-app notifications** stored in Appwrite database
- **Push notifications** using Expo Notifications
- **Real-time notification badges** on the notifications tab
- **Event creation form** for admins

## Required Appwrite Collections

You need to create these collections in your Appwrite database:

### 1. Events Collection
- **Collection ID**: Replace `YOUR_EVENTS_COLLECTION_ID` in `lib/appwrite.js`
- **Attributes**:
  - `name` (string, required) - Event name
  - `description` (text, required) - Event description  
  - `date` (datetime, required) - Event date and time
  - `venue` (string, required) - Event venue/location
  - `createdBy` (string, required) - Admin user ID who created the event
  - `status` (string, default: "active") - Event status

### 2. Notifications Collection  
- **Collection ID**: Replace `YOUR_NOTIFICATIONS_COLLECTION_ID` in `lib/appwrite.js`
- **Attributes**:
  - `userId` (string, required) - User who receives the notification
  - `eventId` (string, required) - Related event ID
  - `title` (string, required) - Notification title
  - `message` (text, required) - Notification message
  - `type` (string, default: "event_created") - Notification type
  - `isRead` (boolean, default: false) - Read status
  - `eventName` (string, required) - Event name for display
  - `eventDescription` (text, required) - Event description for display
  - `eventDate` (datetime, required) - Event date for display
  - `eventVenue` (string, required) - Event venue for display

## Permissions Setup

### Events Collection Permissions:
- **Create**: Admin users only
- **Read**: All users
- **Update**: Admin users only  
- **Delete**: Admin users only

### Notifications Collection Permissions:
- **Create**: Admin users only
- **Read**: Users can read their own notifications (`userId` = `$userId`)
- **Update**: Users can update their own notifications (`userId` = `$userId`)
- **Delete**: Admin users only

## Features Implemented

### 1. Event Creation (Admin)
- Located in the "Create" tab with toggle between Video Upload and Event Creation
- Form includes: Event name, description, date/time picker, venue
- Automatically sends notifications to all users when event is created

### 2. Notifications Screen
- Replaced the bookmark tab with a notifications screen
- Shows all notifications for the current user
- Displays event details (name, description, date, venue) in a card format
- Mark as read functionality
- Real-time unread count badge on tab

### 3. Push Notifications
- Local notifications when new events are created
- Permission handling for iOS and Android
- Background notification support

### 4. Notification Badge
- Shows unread notification count on the notifications tab
- Updates automatically every 30 seconds
- Disappears when all notifications are read

## Setup Instructions

1. **Update Appwrite Collection IDs**:
   ```javascript
   // In lib/appwrite.js, replace these placeholder IDs:
   eventsCollectionId: "YOUR_EVENTS_COLLECTION_ID",
   notificationsCollectionId: "YOUR_NOTIFICATIONS_COLLECTION_ID",
   ```

2. **Create Collections in Appwrite**:
   - Follow the collection schemas above
   - Set appropriate permissions for each collection

3. **Test the Feature**:
   - Run the app: `npx expo start`
   - Go to Create tab → Event Creation
   - Fill out event form and submit
   - Check notifications tab for new notification
   - Verify notification badge appears

## Usage Flow

### For Admins:
1. Navigate to Create tab
2. Switch to "Create Event" tab
3. Fill out event details
4. Submit to create event and send notifications

### For Users:
1. Receive push notification when new event is created
2. See notification badge on notifications tab
3. Navigate to notifications to view event details
4. Tap notification to mark as read

## File Structure

```
lib/
├── appwrite.js              # Updated with event and notification functions
├── notificationService.js   # Push notification handling
└── useAppwrite.js          # Updated with better error logging

components/
├── NotificationCard.jsx     # Individual notification display
└── CreateEvent.jsx         # Event creation form (embedded in create.jsx)

app/
├── (tabs)/
│   ├── bookmark.jsx        # Now the notifications screen
│   ├── create.jsx          # Updated with event creation
│   └── _layout.jsx         # Added notification badge
└── context/
    └── GlobalProvider.js   # Added notification permissions

```

## Troubleshooting

1. **Notifications not appearing**: Check Appwrite permissions and collection IDs
2. **Push notifications not working**: Ensure physical device is used for testing
3. **Badge not updating**: Check if user is properly authenticated
4. **Date picker issues**: Make sure @react-native-community/datetimepicker is installed

## Future Enhancements

- **Admin panel** for managing events
- **Event RSVP system** 
- **Push notification scheduling** for event reminders
- **Event categories** and filtering
- **Email notifications** integration
- **Calendar integration** for events
