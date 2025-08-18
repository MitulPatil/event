import React, { useState } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

import { CustomButton, FormField } from '../components';
import { createEvent } from '../lib/appwrite';
import { sendLocalEventNotification } from '../lib/notificationService';
import { useGlobalContext } from '../context/GlobalProvider';
import { router } from 'expo-router';

const CreateEvent = () => {
  const { user } = useGlobalContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    date: new Date(),
    venue: '',
  });

  const submit = async () => {
    if (!form.name || !form.description || !form.venue) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const eventData = {
        ...form,
        date: form.date.toISOString(),
        adminId: user.$id,
      };

      const newEvent = await createEvent(eventData);
      
      // Send local notification
      await sendLocalEventNotification(newEvent);
      
      Alert.alert('Success', 'Event created and notifications sent!');
      router.push('/home');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || form.date;
    setShowDatePicker(Platform.OS === 'ios');
    setForm({ ...form, date: currentDate });
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView className="px-4 my-6">
        <Text className="text-2xl text-white font-psemibold">
          Create New Event
        </Text>

        <FormField
          title="Event Name"
          value={form.name}
          placeholder="Enter event name"
          handleChangeText={(e) => setForm({ ...form, name: e })}
          otherStyles="mt-7"
        />

        <FormField
          title="Description"
          value={form.description}
          placeholder="Enter event description"
          handleChangeText={(e) => setForm({ ...form, description: e })}
          otherStyles="mt-7"
          multiline={true}
          numberOfLines={4}
        />

        <View className="mt-7">
          <Text className="text-base text-gray-100 font-pmedium mb-2">
            Event Date & Time
          </Text>
          <CustomButton
            title={form.date.toLocaleDateString() + ' ' + form.date.toLocaleTimeString()}
            handlePress={() => setShowDatePicker(true)}
            containerStyles="bg-black-200 border border-black-200"
            textStyles="text-gray-100"
          />
        </View>

        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={form.date}
            mode="datetime"
            is24Hour={true}
            display="default"
            onChange={onDateChange}
          />
        )}

        <FormField
          title="Venue"
          value={form.venue}
          placeholder="Enter event venue"
          handleChangeText={(e) => setForm({ ...form, venue: e })}
          otherStyles="mt-7"
        />

        <CustomButton
          title="Create Event"
          handlePress={submit}
          containerStyles="mt-7"
          isLoading={isSubmitting}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateEvent;
