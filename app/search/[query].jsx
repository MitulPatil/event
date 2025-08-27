import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import useAppwrite from "../../lib/useAppwrite";
import { searchPosts, searchEvents } from "../../lib/appwrite";
import { EmptyState, SearchInput, VideoCard } from "../../components";
import { useGlobalContext } from "../../context/GlobalProvider";

const Search = () => {
  const { query } = useLocalSearchParams();
  const { user } = useGlobalContext(); // Get current logged-in user
  const [activeTab, setActiveTab] = useState("videos"); // "videos" or "events"
  const { data: posts, refetch: refetchPosts } = useAppwrite(() => searchPosts(query));
  const { data: events, refetch: refetchEvents } = useAppwrite(() => searchEvents(query));

  useEffect(() => {
    refetchPosts();
    refetchEvents();
  }, [query]);

  // Helper function to get user avatar or return null for initials
  const getUserAvatar = () => {
    if (user?.avatar && typeof user.avatar === 'string' && user.avatar.trim() !== '') {
      return user.avatar;
    }
    return null; // Return null to show initials instead
  };

  const renderVideoCard = ({ item }) => {
    console.log("🔍 Search: Rendering video card with current user info:", {
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
  };

  const renderEventCard = ({ item }) => (
    <View className="p-4 mb-3 bg-black-100 rounded-lg mx-4">
      <Text className="text-white font-psemibold text-lg mb-2">
        📅 {item.name}
      </Text>
      <Text className="text-gray-300 font-pregular text-sm mb-2">
        📝 {item.description}
      </Text>
      <Text className="text-gray-400 font-pregular text-xs mb-1">
        🗓️ {new Date(item.date).toLocaleDateString()}
      </Text>
      <Text className="text-gray-400 font-pregular text-xs">
        📍 {item.venue}
      </Text>
    </View>
  );

  const currentData = activeTab === "videos" ? posts : events;
  const currentRefetch = activeTab === "videos" ? refetchPosts : refetchEvents;

  return (
    <SafeAreaView className="bg-primary h-full">
      <FlatList
        data={currentData}
        keyExtractor={(item) => item.$id}
        renderItem={activeTab === "videos" ? renderVideoCard : renderEventCard}
        ListHeaderComponent={() => (
          <>
            <View className="flex my-6 px-4">
              <Text className="font-pmedium text-gray-100 text-sm">
                Search Results
              </Text>
              <Text className="text-2xl font-psemibold text-white mt-1">
                {query}
              </Text>

              <View className="mt-6 mb-4">
                <SearchInput initialQuery={query} refetch={currentRefetch} />
              </View>

              {/* Tab Selector */}
              <View className="flex-row mb-4">
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-l-lg ${
                    activeTab === "videos" ? "bg-secondary" : "bg-black-200"
                  }`}
                  onPress={() => setActiveTab("videos")}
                >
                  <Text className={`text-center font-psemibold ${
                    activeTab === "videos" ? "text-black" : "text-gray-100"
                  }`}>
                    Videos ({posts?.length || 0})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-r-lg ${
                    activeTab === "events" ? "bg-secondary" : "bg-black-200"
                  }`}
                  onPress={() => setActiveTab("events")}
                >
                  <Text className={`text-center font-psemibold ${
                    activeTab === "events" ? "text-black" : "text-gray-100"
                  }`}>
                    Events ({events?.length || 0})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            title={`No ${activeTab === "videos" ? "Videos" : "Events"} Found`}
            subtitle={`No ${activeTab === "videos" ? "videos" : "events"} found for this search query`}
          />
        )}
      />
    </SafeAreaView>
  );
};

export default Search;
