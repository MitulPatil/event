import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList, Image, RefreshControl, Text, View } from "react-native";

import { images } from "../../constants";
import useAppwrite from "../../lib/useAppwrite";
import { getAllPosts, getLatestPosts } from "../../lib/appwrite";
import { EmptyState, SearchInput, Trending, VideoCard } from "../../components";
import { useGlobalContext } from "../../context/GlobalProvider";

const Home = () => {
  const { data: posts, refetch } = useAppwrite(getAllPosts);
  const { data: latestPosts } = useAppwrite(getLatestPosts);
  const { user } = useGlobalContext(); // Get current logged-in user

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Debug: Log current user information
  console.log("🏠 Home: Current user info:", {
    hasUser: !!user,
    username: user?.username,
    email: user?.email,
    avatar: user?.avatar,
    userId: user?.$id
  });

  // Helper function to get user avatar or generate initials
  const getUserAvatar = () => {
    if (user?.avatar && typeof user.avatar === 'string' && user.avatar.trim() !== '') {
      return user.avatar;
    }
    return null; // Return null to show initials instead
  };

  // one flatlist
  // with list header
  // and horizontal flatlist

  //  we cannot do that with just scrollview as there's both horizontal and vertical scroll (two flat lists, within trending)

  return (
    <SafeAreaView className="bg-primary">
      <FlatList
        data={posts}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => {
          // Use current logged-in user information instead of post creator
          console.log("🏠 Home: Rendering post with current user info:", {
            postId: item.$id,
            title: item.title,
            currentUser: user?.username,
            currentUserAvatar: getUserAvatar()
          });
          
          return (
            <VideoCard
              title={item.title}
              thumbnail={item.thumbnail}
              video={item.video}
              creator={user?.username || "Guest User"}
              avatar={getUserAvatar()}
              prompt={item.prompt}
            />
          );
        }}
        ListHeaderComponent={() => (
          <View className="flex my-6 px-4 space-y-6">
            <View className="flex justify-between items-start flex-row mb-6">
              <View className="flex justify-between flex-row w-full items-center">
                <View>
                  <Text className="font-pmedium text-lg text-gray-100">
                    Welcome Back
                  </Text>
                  <Text className="text-2xl font-psemibold text-white">
                    {user?.username || "Guest"}
                  </Text>
                </View>
                <Image
                  source={images.logoSmall}
                  className="w-12 h-9"
                  resizeMode="contain"
                />
              </View>

              
            </View>

            <SearchInput />

            <View className="w-full flex-1 pt-5 pb-8">
              <Text className="text-lg font-pregular text-gray-100 mb-3">
                Latest Videos
              </Text>

              <Trending posts={latestPosts ?? []} />
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            title="No Videos Found"
            subtitle="No videos created yet"
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
};

export default Home;
