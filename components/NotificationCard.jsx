import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { icons } from '../constants';

const NotificationCard = ({ notification, onPress, onMarkAsRead }) => {
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
            {notification.message}
          </Text>

          {notification.eventName && (
            <View className="bg-secondary-100 rounded-lg p-3 mb-2">
              <Text className="text-white font-psemibold text-sm mb-1">
                📅 {notification.eventName}
              </Text>
              <Text className="text-gray-200 font-pregular text-xs mb-1">
                📝 {notification.eventDescription}
              </Text>
              <Text className="text-gray-200 font-pregular text-xs mb-1">
                🗓️ {formatDate(notification.eventDate)}
              </Text>
              <Text className="text-gray-200 font-pregular text-xs">
                📍 {notification.eventVenue}
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
