import { useState, useRef } from "react";
import { ResizeMode, Video } from "expo-av";
import * as Animatable from "react-native-animatable";
import {
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";

import { icons } from "../constants";

const zoomIn = {
  0: {
    scale: 0.9,
  },
  1: {
    scale: 1,
  },
};

const zoomOut = {
  0: {
    scale: 1,
  },
  1: {
    scale: 0.9,
  },
};

const TrendingItem = ({ activeItem, item }) => {
  const [play, setPlay] = useState(false);
  const videoRef = useRef(null);

  return (
    <Animatable.View
      className="mr-5"
      animation={activeItem === item.$id ? zoomIn : zoomOut}
      duration={500}
    >
      <TouchableOpacity
        className="relative flex justify-center items-center"
        activeOpacity={0.7}
        onPress={async () => {
          if (!play && videoRef.current) {
            await videoRef.current.playAsync();
            setPlay(true);
          }
        }}
        disabled={play}
      >
        <Video
          ref={videoRef}
          source={{ uri: item.video }}
          posterSource={{ uri: item.thumbnail }}
          usePoster
          posterStyle={{ resizeMode: 'cover' }}
          className="w-52 h-72 rounded-[33px] my-5 bg-white/10"
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls={play}
          shouldPlay={false}
          isLooping={false}
          progressUpdateIntervalMillis={500}
          preferredForwardBufferDuration={5}
          onReadyForDisplay={() => {
            console.log("Trending video ready");
          }}
          onLoad={() => {
            console.log("Trending video loaded");
          }}
          onPlaybackStatusUpdate={(status) => {
            if (status.didJustFinish) {
              setPlay(false);
              videoRef.current?.pauseAsync();
              videoRef.current?.setPositionAsync(0);
            }
          }}
        />

        {!play && (
          <Image
            source={icons.play}
            className="w-12 h-12 absolute"
            resizeMode="contain"
          />
        )}
      </TouchableOpacity>
    </Animatable.View>
  );
};

const Trending = ({ posts }) => {
  const [activeItem, setActiveItem] = useState(posts[0]);

  const viewableItemsChanged = ({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveItem(viewableItems[0].key);
    }
  };

  return (
    <FlatList
      data={posts}
      horizontal
      keyExtractor={(item) => item.$id}
      renderItem={({ item }) => (
        <TrendingItem activeItem={activeItem} item={item} />
      )}
      onViewableItemsChanged={viewableItemsChanged}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 70,
      }}
      contentOffset={{ x: 170 }}
    />
  );
};

export default Trending;
