import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Image, FlatList, TouchableOpacity, Text } from "react-native";

import { icons } from "../../constants";
import useAppwrite from "../../lib/useAppwrite";
import { getUserPosts, signOut } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import { EmptyState, InfoBox, VideoCard } from "../../components";

const Profile = () => {
  const { user, setUser, setIsLogged } = useGlobalContext();
  const { data: posts } = useAppwrite(() => getUserPosts(user.$id));

  const logout = async () => {
    await signOut();
    setUser(null);
    setIsLogged(false);

    router.replace("/sign-in");
  };

  // Helper function to get user avatar or return null for initials
  const getUserAvatar = () => {
    if (user?.avatar && typeof user.avatar === 'string' && user.avatar.trim() !== '') {
      return user.avatar;
    }
    return null; // Return null to show initials instead
  };

  // Debug: Log current user information
  console.log("👤 Profile: Current user info:", {
    hasUser: !!user,
    username: user?.username,
    email: user?.email,
    avatar: user?.avatar,
    userId: user?.$id,
    postsCount: posts?.length || 0
  });

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList
        data={posts}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => {
          // Use current logged-in user information for all posts in profile
          console.log("👤 Profile: Rendering post with current user info:", {
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
        ListEmptyComponent={() => (
          <EmptyState
            title="No Videos Found"
            subtitle="No videos found for this profile"
          />
        )}
        ListHeaderComponent={() => (
          <View className="w-full flex justify-center items-center mt-6 mb-12 px-4">
            <TouchableOpacity
              onPress={logout}
              className="flex w-full items-end mb-10"
            >
              <Image
                source={icons.logout}
                resizeMode="contain"
                className="w-6 h-6"
              />
            </TouchableOpacity>

            <View className="w-16 h-16 border border-secondary rounded-lg flex justify-center items-center">
              {getUserAvatar() ? (
                <Image
                  source={{ uri: getUserAvatar() }}
                  className="w-[90%] h-[90%] rounded-lg"
                  resizeMode="cover"
                  onError={() => console.log("Profile avatar failed to load:", getUserAvatar())}
                />
              ) : (
                <View className="w-[90%] h-[90%] rounded-lg bg-secondary-100 flex justify-center items-center">
                  <Text className="text-primary font-psemibold text-xl">
                    {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
                  </Text>
                </View>
              )}
            </View>

            <InfoBox
              title={user?.username}
              containerStyles="mt-5"
              titleStyles="text-lg"
            />

            <View className="mt-5 flex flex-row">
              <InfoBox
                title={posts.length || 0}
                subtitle="Posts"
                titleStyles="text-xl"
                containerStyles="mr-10"
              />
              <InfoBox
                title="1.2k"
                subtitle="Followers"
                titleStyles="text-xl"
              />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default Profile;
