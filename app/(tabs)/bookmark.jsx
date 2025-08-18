import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '../../components';
import NotificationCard from '../../components/NotificationCard';
import { getUserNotifications, markNotificationAsRead, getUnreadNotificationCount } from '../../lib/appwrite';
import { useGlobalContext } from '../../context/GlobalProvider';
import useAppwrite from '../../lib/useAppwrite';

const Notifications = () => {
  const { user } = useGlobalContext();
  const { data: notifications, refetch } = useAppwrite(() => getUserNotifications(user?.$id));
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.$id) {
      loadUnreadCount();
    }
  }, [user, notifications]);

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadNotificationCount(user.$id);
      setUnreadCount(count);
    } catch (error) {
      console.log('Error loading unread count:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    await loadUnreadCount();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      await refetch();
      await loadUnreadCount();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const handleNotificationPress = async (notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.$id);
    }
    // You can add navigation to event details here if needed
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <View className="px-4 my-6">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl text-white font-psemibold">
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View className="bg-red-500 rounded-full px-3 py-1">
              <Text className="text-white font-psemibold text-sm">
                {unreadCount} New
              </Text>
            </View>
          )}
        </View>

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              onPress={() => handleNotificationPress(item)}
              onMarkAsRead={handleMarkAsRead}
            />
          )}
          ListEmptyComponent={() => (
            <EmptyState
              title="No Notifications"
              subtitle="You don't have any notifications yet"
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

export default Notifications;
