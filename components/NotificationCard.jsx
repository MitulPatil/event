import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { icons } from '../constants';
import { getEventById } from '../lib/appwrite';

const NotificationCard = ({ notification, onPress, onMarkAsRead }) => {
  const [eventDetails, setEventDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (notification.eventId && notification.type === 'event_created') {
      loadEventDetails();
    }
  }, [notification.eventId]);

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      const event = await getEventById(notification.eventId);
      setEventDetails(event);
    } catch (error) {
      console.log('Error loading event details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <TouchableOpacity 
      className={`p-4 mb-3 rounded-lg border ${
        notification.isRead ? 'bg-gray-800 border-gray-700' : 'bg-blue-900 border-blue-600'
      }`}
      onPress={onPress}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-3">
          <Text className="text-white font-psemibold text-base mb-1">
            {notification.title}
          </Text>
          
          <Text className="text-gray-300 font-pregular text-sm mb-2">
            {notification.description}
          </Text>

          {eventDetails && (
            <View className="bg-secondary-100 rounded-lg p-3 mb-2 border-l-4 border-orange-500">
              <Text className="text-orange-400 font-psemibold text-sm mb-2">
                🎉 EVENT DETAILS
              </Text>
              <Text className="text-white font-psemibold text-base mb-2">
                📅 {eventDetails.name}
              </Text>
              <Text className="text-gray-200 font-pregular text-sm mb-2">
                📝 {eventDetails.description}
              </Text>
              <Text className="text-gray-200 font-pregular text-sm mb-1">
                🗓️ {formatEventDate(eventDetails.date)}
              </Text>
              <Text className="text-gray-200 font-pregular text-sm">
                📍 {eventDetails.venue}
              </Text>
            </View>
          )}

          {!eventDetails && notification.eventVenue && (
            <View className="bg-secondary-100 rounded-lg p-3 mb-2 border-l-4 border-orange-500">
              <Text className="text-orange-400 font-psemibold text-sm mb-2">
                🎉 EVENT DETAILS
              </Text>
              <Text className="text-gray-200 font-pregular text-sm mb-1">
                �️ {formatEventDate(notification.date)}
              </Text>
              <Text className="text-gray-200 font-pregular text-sm">
                📍 {notification.eventVenue}
              </Text>
            </View>
          )}

          {loading && (
            <View className="bg-gray-700 rounded-lg p-3 mb-2">
              <Text className="text-gray-400 font-pregular text-sm">
                Loading event details...
              </Text>
            </View>
          )}

          <Text className="text-gray-400 font-pregular text-xs">
            {formatDate(notification.$createdAt)}
          </Text>
        </View>

        <View className="flex-row items-center">
          {!notification.isRead && (
            <TouchableOpacity 
              onPress={() => onMarkAsRead(notification.$id)}
              className="ml-2"
            >
              <View className="bg-blue-600 rounded-full p-2">
                <Image 
                  source={icons.eye} 
                  className="w-4 h-4" 
                  resizeMode="contain"
                  tintColor="white"
                />
              </View>
            </TouchableOpacity>
          )}
          
          {!notification.isRead && (
            <View className="w-3 h-3 bg-blue-500 rounded-full ml-2" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default NotificationCard;
