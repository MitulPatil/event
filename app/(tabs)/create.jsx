import React, { useState, useEffect } from "react";
import { router } from "expo-router";
import { ResizeMode, Video } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";

import {
  View,
  Text,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";

import { icons } from "../../constants";
import {
  createVideoPost,
  createEvent,
  checkUserPermissions,
  canUserCreateEvents,
  promoteCurrentUserToAdmin,
  validateDatabaseSchema,
} from "../../lib/appwrite";
import { sendLocalEventNotification } from "../../lib/notificationService";
import { CustomButton, FormField } from "../../components";
import { useGlobalContext } from "../../context/GlobalProvider";

const Create = () => {
  const { user } = useGlobalContext();
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("video"); // "video" or "event"
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState("date"); // "date" or "time"
  const [canCreateEvents, setCanCreateEvents] = useState(false);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);

  // Video form state
  const [videoForm, setVideoForm] = useState({
    title: "",
    video: null,
    thumbnail: null,
    prompt: "",
  });

  // Event form state
  const [eventForm, setEventForm] = useState({
    name: "",
    description: "",
    date: new Date(),
    venue: "",
  });

  // Check user permissions on component mount
  useEffect(() => {
    const checkEventPermissions = async () => {
      if (user && user.$id) {
        try {
          const permissions = await canUserCreateEvents(user.$id);
          setCanCreateEvents(permissions.canCreate);
          console.log("User can create events:", permissions.canCreate);
          console.log("User role:", permissions.userRole);
        } catch (error) {
          console.log("Error checking permissions:", error);
          setCanCreateEvents(false);
        } finally {
          setIsCheckingPermissions(false);
        }
      }
    };

    checkEventPermissions();
  }, [user]);

  // Function to promote current user to admin (for testing)
  const handlePromoteToAdmin = async () => {
    try {
      setIsCheckingPermissions(true);
      await promoteCurrentUserToAdmin();
      Alert.alert(
        "Success",
        "You have been promoted to admin! Restart the app to see changes.",
      );

      // Refresh permissions
      const permissions = await canUserCreateEvents(user.$id);
      setCanCreateEvents(permissions.canCreate);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsCheckingPermissions(false);
    }
  };

  // Function to validate database schema
  const handleValidateDatabase = async () => {
    try {
      setIsCheckingPermissions(true);
      const validation = await validateDatabaseSchema();

      if (validation.valid) {
        Alert.alert(
          "Database Status",
          "✅ All database schemas are properly configured!",
        );
      } else {
        Alert.alert(
          "Database Issues Found",
          `❌ Issues found:\n\n${validation.issues.join(
            "\n\n",
          )}\n\nCheck console for detailed instructions.`,
          [{ text: "OK" }],
        );
      }
    } catch (error) {
      Alert.alert("Error", `Database validation failed: ${error.message}`);
    } finally {
      setIsCheckingPermissions(false);
    }
  };

  const openPicker = async (selectType) => {
    const result = await DocumentPicker.getDocumentAsync({
      type:
        selectType === "image"
          ? ["image/png", "image/jpg", "image/jpeg", "image/heic"]
          : ["video/mp4", "video/gif", "video/mkv"],
    });

    if (!result.canceled) {
      if (selectType === "image") {
        setVideoForm({
          ...videoForm,
          thumbnail: result.assets[0],
        });
      }

      if (selectType === "video") {
        setVideoForm({
          ...videoForm,
          video: result.assets[0],
        });
      }
    } else {
      setTimeout(() => {
        Alert.alert("Document picked", JSON.stringify(result, null, 2));
      }, 100);
    }
  };

  const submitVideo = async () => {
    if (
      (videoForm.prompt === "") ||
      (videoForm.title === "") ||
      !videoForm.thumbnail ||
      !videoForm.video
    ) {
      return Alert.alert("Please provide all fields");
    }

    setUploading(true);
    try {
      await createVideoPost({
        ...videoForm,
        userId: user.$id,
      });

      Alert.alert("Success", "Post uploaded successfully");
      router.push("/home");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setVideoForm({
        title: "",
        video: null,
        thumbnail: null,
        prompt: "",
      });
      setUploading(false);
    }
  };

  const submitEvent = async () => {
    if (!eventForm.name || !eventForm.description || !eventForm.venue) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setUploading(true);
    try {
      const eventData = {
        ...eventForm,
        date: eventForm.date.toISOString(),
        adminId: user.$id,
      };

      console.log("Creating event with data:", eventData);
      const newEvent = await createEvent(eventData);

      // Send local notification
      try {
        await sendLocalEventNotification(newEvent);
        console.log("Local notification sent successfully");
      } catch (localError) {
        console.log("Local notification failed:", localError);
      }

      Alert.alert(
        "Success",
        `Event "${newEvent.name}" created successfully!\n\nNotifications are being sent to all users in the background.`,
        [
          {
            text: "View Events",
            onPress: () => router.push("/home"),
          },
          {
            text: "Create Another",
            onPress: () => {
              // Reset form for another event
              setEventForm({
                name: "",
                description: "",
                date: new Date(),
                venue: "",
              });
            },
          },
        ],
      );

      // Don't automatically redirect - let user choose
    } catch (error) {
      console.log("Event creation error:", error);
      Alert.alert("Error", `Failed to create event: ${error.message}`);
    } finally {
      setEventForm({
        name: "",
        description: "",
        date: new Date(),
        venue: "",
      });
      setUploading(false);
    }
  };

  const showDatePickerModal = () => {
    if (Platform.OS === "android") {
      setPickerMode("date");
      setShowDatePicker(true);
    } else {
      setShowDatePicker(true);
    }
  };

  const showTimePickerModal = () => {
    if (Platform.OS === "android") {
      setPickerMode("time");
      setShowTimePicker(true);
    }
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === "ios") {
      // iOS handles datetime in one picker
      if (event?.type === "dismissed") {
        setShowDatePicker(false);
        return;
      }
      if (selectedDate) {
        setEventForm({ ...eventForm, date: selectedDate });
      }
    } else {
      // Android - handle date and time separately
      setShowDatePicker(false);

      if (event?.type === "dismissed") {
        return;
      }

      if (selectedDate && pickerMode === "date") {
        const newDateTime = new Date(eventForm.date);
        newDateTime.setFullYear(selectedDate.getFullYear());
        newDateTime.setMonth(selectedDate.getMonth());
        newDateTime.setDate(selectedDate.getDate());
        setEventForm({ ...eventForm, date: newDateTime });
      }
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);

    if (event?.type === "dismissed") {
      return;
    }

    if (selectedTime) {
      const newDateTime = new Date(eventForm.date);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setEventForm({ ...eventForm, date: newDateTime });
    }
  };

  const renderVideoForm = () => (
    <>
      <FormField
        title="Video Title"
        value={videoForm.title}
        placeholder="Give your video a catchy title..."
        handleChangeText={(e) => setVideoForm({ ...videoForm, title: e })}
        otherStyles="mt-7"
      />

      <View className="mt-7 space-y-2">
        <Text className="text-base text-gray-100 font-pmedium">
          Upload Video
        </Text>

        <TouchableOpacity onPress={() => openPicker("video")}>
          {videoForm.video ? (
            <Video
              source={{ uri: videoForm.video.uri }}
              className="w-full h-64 rounded-2xl"
              useNativeControls
              resizeMode={ResizeMode.COVER}
              isLooping
            />
          ) : (
            <View className="w-full h-40 px-4 bg-black-100 rounded-2xl border border-black-200 flex justify-center items-center">
              <View className="w-14 h-14 border border-dashed border-secondary-100 flex justify-center items-center">
                <Image
                  source={icons.upload}
                  resizeMode="contain"
                  alt="upload"
                  className="w-1/2 h-1/2"
                />
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View className="mt-7 space-y-2">
        <Text className="text-base text-gray-100 font-pmedium">
          Thumbnail Image
        </Text>

        <TouchableOpacity onPress={() => openPicker("image")}>
          {videoForm.thumbnail ? (
            <Image
              source={{ uri: videoForm.thumbnail.uri }}
              resizeMode="cover"
              className="w-full h-64 rounded-2xl"
            />
          ) : (
            <View className="w-full h-16 px-4 bg-black-100 rounded-2xl border-2 border-black-200 flex justify-center items-center flex-row space-x-2">
              <Image
                source={icons.upload}
                resizeMode="contain"
                alt="upload"
                className="w-5 h-5"
              />
              <Text className="text-sm text-gray-100 font-pmedium">
                Choose a file
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FormField
        title="AI Prompt"
        value={videoForm.prompt}
        placeholder="The AI prompt of your video...."
        handleChangeText={(e) => setVideoForm({ ...videoForm, prompt: e })}
        otherStyles="mt-7"
      />

      <CustomButton
        title="Submit & Publish"
        handlePress={submitVideo}
        containerStyles="mt-7"
        isLoading={uploading}
      />
    </>
  );

  const renderEventForm = () => (
    <>
      <FormField
        title="Event Name"
        value={eventForm.name}
        placeholder="Enter event name"
        handleChangeText={(e) => setEventForm({ ...eventForm, name: e })}
        otherStyles="mt-7"
      />

      <FormField
        title="Description"
        value={eventForm.description}
        placeholder="Enter event description"
        handleChangeText={(e) => setEventForm({ ...eventForm, description: e })}
        otherStyles="mt-7"
        multiline={true}
        numberOfLines={4}
      />

      <View className="mt-7">
        <Text className="text-base text-gray-100 font-pmedium mb-2">
          Event Date & Time
        </Text>

        {Platform.OS === "ios" ? (
          // iOS - Single datetime picker
          <CustomButton
            title={
              eventForm.date.toLocaleDateString() +
              " " +
              eventForm.date.toLocaleTimeString()
            }
            handlePress={showDatePickerModal}
            containerStyles="bg-black-200 border border-black-200"
            textStyles="text-gray-100"
          />
        ) : (
          // Android - Separate date and time buttons
          <View className="space-y-3">
            <View className="flex-row space-x-3">
              <View className="flex-1">
                <Text className="text-sm text-gray-300 mb-1">Date</Text>
                <CustomButton
                  title={eventForm.date.toLocaleDateString()}
                  handlePress={() => {
                    setPickerMode("date");
                    setShowDatePicker(true);
                  }}
                  containerStyles="bg-black-200 border border-black-200"
                  textStyles="text-gray-100 text-sm"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-300 mb-1">Time</Text>
                <CustomButton
                  title={eventForm.date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  handlePress={() => {
                    setPickerMode("time");
                    setShowTimePicker(true);
                  }}
                  containerStyles="bg-black-200 border border-black-200"
                  textStyles="text-gray-100 text-sm"
                />
              </View>
            </View>
            <View className="bg-gray-700 p-3 rounded-lg">
              <Text className="text-gray-300 text-xs">
                📅 {eventForm.date.toLocaleDateString()} at{" "}
                {eventForm.date.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <View className="mt-4">
          {Platform.OS === "ios" ? (
            <>
              <DateTimePicker
                value={eventForm.date}
                mode={pickerMode}
                is24Hour={true}
                display="default"
                onChange={pickerMode === "date" ? onDateChange : onTimeChange}
                minimumDate={new Date()}
              />
              <CustomButton
                title="Done"
                handlePress={() => setShowDatePicker(false)}
                containerStyles="mt-4 bg-secondary"
                textStyles="text-black"
              />
            </>
          ) : (
            <DateTimePicker
              testID="datePicker"
              value={eventForm.date}
              mode="date"
              is24Hour={true}
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>
      )}

      {/* Time Picker - Android only */}
      {showTimePicker && Platform.OS === "android" && (
        <View className="mt-4">
          <DateTimePicker
            testID="timePicker"
            value={eventForm.date}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={onTimeChange}
          />
        </View>
      )}

      <FormField
        title="Venue"
        value={eventForm.venue}
        placeholder="Enter event venue"
        handleChangeText={(e) => setEventForm({ ...eventForm, venue: e })}
        otherStyles="mt-7"
      />

      <CustomButton
        title="Create Event"
        handlePress={submitEvent}
        containerStyles="mt-7"
        isLoading={uploading}
      />
    </>
  );

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView className="px-4 my-6">
        {/* Loading state while checking permissions */}
        {isCheckingPermissions ? (
          <View className="flex-1 justify-center items-center py-20">
            <Text className="text-white text-lg">Checking permissions...</Text>
          </View>
        ) : (
          <>
            {/* Tab Selector */}
            <View className="flex-row bg-black-100 rounded-lg p-1 mb-6">
              <TouchableOpacity
                className={`${canCreateEvents ? "flex-1" : "flex-1"} py-3 rounded-lg ${
                  activeTab === "video" ? "bg-secondary" : "bg-transparent"
                }`}
                onPress={() => setActiveTab("video")}
              >
                <Text
                  className={`text-center font-psemibold ${
                    activeTab === "video" ? "text-primary" : "text-gray-100"
                  }`}
                >
                  Upload Video
                </Text>
              </TouchableOpacity>

              {/* Only show event tab if user has admin permissions */}
              {canCreateEvents && (
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-lg ${
                    activeTab === "event" ? "bg-secondary" : "bg-transparent"
                  }`}
                  onPress={() => setActiveTab("event")}
                >
                  <Text
                    className={`text-center font-psemibold ${
                      activeTab === "event" ? "text-primary" : "text-gray-100"
                    }`}
                  >
                    Create Event
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {!canCreateEvents && (
              <View className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
                <Text className="text-red-400 text-center font-pmedium mb-4">
                  ⚠️ Event creation is restricted to administrators only
                </Text>

                {/* Development buttons - remove in production */}
                <View className="space-y-3">
                  <CustomButton
                    title="🔧 Promote to Admin (Testing)"
                    handlePress={handlePromoteToAdmin}
                    containerStyles="bg-yellow-600 min-h-[50px]"
                    textStyles="text-black font-psemibold"
                    isLoading={isCheckingPermissions}
                  />

                  <CustomButton
                    title="🔍 Check Database Schema"
                    handlePress={handleValidateDatabase}
                    containerStyles="bg-blue-600 min-h-[50px]"
                    textStyles="text-white font-psemibold"
                    isLoading={isCheckingPermissions}
                  />
                </View>
              </View>
            )}

            <Text className="text-2xl text-white font-psemibold mb-6">
              {activeTab === "video" ? "Upload Video" : "Create New Event"}
            </Text>

            {activeTab === "video"
              ? renderVideoForm()
              : canCreateEvents
                ? renderEventForm()
                : renderVideoForm()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Create;
