import { useState } from "react";
import { router } from "expo-router";
import { ResizeMode, Video } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

import { icons } from "../../constants";
import { createVideoPost, createEvent } from "../../lib/appwrite";
import { sendLocalEventNotification } from "../../lib/notificationService";
import { CustomButton, FormField } from "../../components";
import { useGlobalContext } from "../../context/GlobalProvider";

const Create = () => {
  const { user } = useGlobalContext();
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("video"); // "video" or "event"
  const [showDatePicker, setShowDatePicker] = useState(false);
  
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

  const openPicker = async (selectType) => {
    const result = await DocumentPicker.getDocumentAsync({
      type:
        selectType === "image"
          ? ["image/png", "image/jpg"]
          : ["video/mp4", "video/gif"],
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
      (videoForm.prompt === "") |
      (videoForm.title === "") |
      !videoForm.thumbnail |
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
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setUploading(true);
    try {
      const eventData = {
        ...eventForm,
        date: eventForm.date.toISOString(),
        adminId: user.$id,
      };

      const newEvent = await createEvent(eventData);
      
      // Send local notification
      await sendLocalEventNotification(newEvent);
      
      Alert.alert('Success', 'Event created and notifications sent to all users!');
      
      // Reset form
      setEventForm({
        name: "",
        description: "",
        date: new Date(),
        venue: "",
      });
      
      router.push('/home');
    } catch (error) {
      Alert.alert('Error', error.message);
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

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || eventForm.date;
    setShowDatePicker(Platform.OS === 'ios');
    setEventForm({ ...eventForm, date: currentDate });
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
        <CustomButton
          title={eventForm.date.toLocaleDateString() + ' ' + eventForm.date.toLocaleTimeString()}
          handlePress={() => setShowDatePicker(true)}
          containerStyles="bg-black-200 border border-black-200"
          textStyles="text-gray-100"
        />
      </View>

      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={eventForm.date}
          mode="datetime"
          is24Hour={true}
          display="default"
          onChange={onDateChange}
        />
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
        {/* Tab Selector */}
        <View className="flex-row bg-black-100 rounded-lg p-1 mb-6">
          <TouchableOpacity
            className={`flex-1 py-3 rounded-lg ${
              activeTab === "video" ? "bg-secondary" : "bg-transparent"
            }`}
            onPress={() => setActiveTab("video")}
          >
            <Text className={`text-center font-psemibold ${
              activeTab === "video" ? "text-primary" : "text-gray-100"
            }`}>
              Upload Video
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className={`flex-1 py-3 rounded-lg ${
              activeTab === "event" ? "bg-secondary" : "bg-transparent"
            }`}
            onPress={() => setActiveTab("event")}
          >
            <Text className={`text-center font-psemibold ${
              activeTab === "event" ? "text-primary" : "text-gray-100"
            }`}>
              Create Event
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-2xl text-white font-psemibold mb-6">
          {activeTab === "video" ? "Upload Video" : "Create New Event"}
        </Text>

        {activeTab === "video" ? renderVideoForm() : renderEventForm()}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Create;
