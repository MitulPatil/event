import { useState } from "react";
import { ResizeMode, Video } from "expo-av";
import { View, Text, TouchableOpacity, Image } from "react-native";

import { icons } from "../constants";

const VideoCard = ({ title, creator, avatar, thumbnail, video, prompt }) => {
  const [play, setPlay] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Debug logging to see what data we're receiving
  console.log("🎬 VideoCard props:", { 
    title, 
    creator, 
    avatar: !!avatar, 
    avatarUrl: avatar,
    thumbnail: !!thumbnail, 
    video: !!video, 
    prompt: !!prompt 
  });

  // Get the first letter for avatar fallback
  const getAvatarLetter = () => {
    if (creator && typeof creator === 'string') {
      return creator.charAt(0).toUpperCase();
    }
    return "U"; // Default to "U" for User
  };

  return (
    <View className="flex flex-col items-center px-4 mb-14">
      <View className="flex flex-row gap-3 items-start">
        <View className="flex justify-center items-center flex-row flex-1">
          <View className="w-[46px] h-[46px] rounded-lg border border-secondary flex justify-center items-center p-0.5">
            {avatar && !avatarError ? (
              <Image
                source={{ uri: avatar }}
                className="w-full h-full rounded-lg"
                resizeMode="cover"
                onError={(error) => {
                  console.log("Avatar failed to load:", avatar, error);
                  setAvatarError(true);
                }}
                onLoad={() => {
                  console.log("Avatar loaded successfully:", avatar);
                  setAvatarError(false);
                }}
              />
            ) : (
              <View className="w-full h-full rounded-lg bg-secondary-100 flex justify-center items-center">
                <Text className="text-primary font-psemibold text-lg">
                  {getAvatarLetter()}
                </Text>
              </View>
            )}
          </View>

          <View className="flex justify-center flex-1 ml-3 gap-y-1">
            <Text
              className="font-psemibold text-sm text-white"
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text
              className="text-xs text-gray-100 font-pregular"
              numberOfLines={1}
            >
              {creator || "Unknown User"}
            </Text>
          </View>
        </View>

        <View className="pt-2">
          <Image source={icons.menu} className="w-5 h-5" resizeMode="contain" />
        </View>
      </View>

      {play ? (
        <Video
          source={{ uri: video }}
          className="w-full h-60 rounded-xl mt-3"
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls
          shouldPlay
          onPlaybackStatusUpdate={(status) => {
            if (status.didJustFinish) {
              setPlay(false);
            }
          }}
        />
      ) : (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setPlay(true)}
          className="w-full h-60 rounded-xl mt-3 relative flex justify-center items-center"
        >
          <Image
            source={{ uri: thumbnail }}
            className="w-full h-full rounded-xl mt-3"
            resizeMode="cover"
          />

          <Image
            source={icons.play}
            className="w-12 h-12 absolute"
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}
      
      {/* Video Description Section */}
      {prompt && (
        <View className="w-full mt-3 px-2">
          <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)}>
            <Text className="text-white font-pmedium text-sm mb-1">
              Description
            </Text>
            <Text 
              className="text-gray-300 font-pregular text-sm leading-5"
              numberOfLines={showFullDescription ? undefined : 3}
            >
              {prompt}
            </Text>
            {prompt.length > 150 && (
              <Text className="text-secondary text-xs mt-1 font-pmedium">
                {showFullDescription ? "Show less" : "Show more"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default VideoCard;
