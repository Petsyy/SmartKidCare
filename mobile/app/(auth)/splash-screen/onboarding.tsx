import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { useRef, useState } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    title: "Track Daily Attendance",
    description:
      "View your child's attendance status in a simple calendar present, absent, late, or excused.",
    image: require("@assets/images/splash.jpg"),
  },
  {
    id: "2",
    title: "Monitor Feeding Status",
    description:
      "Know if your child finished their meal, missed feeding, or ate partially updated by teachers.",
    image: require("@assets/images/splash2.jpg"),
  },
  {
    id: "3",
    title: "Stay Updated Anytime",
    description:
      "Receive real-time updates, reminders, and announcements from the Child Development Center.",
    image: require("@assets/images/splash3.jpg"),
  },
];

export default function Onboarding() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const handleFinish = () => {
    router.replace("/login");
  };

  return (
    <View className="flex-1 bg-[#E6F4F1]">
      {currentIndex < slides.length - 1 && (
        <TouchableOpacity
          className="absolute top-14 right-4 z-10 p-2"
          onPress={handleFinish}
        >
          <Text className="text-gray-600 font-bold">Skip</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={{ width }} className="items-center justify-center px-6">
            <Image
              source={item.image}
              className="w-64 h-64 rounded-2xl mb-8"
              resizeMode="contain"
            />

            <Text className="text-3xl font-bold text-center mb-3">
              {item.title}
            </Text>

            <Text className="text-xl text-center text-gray-600 leading-7">
              {item.description}
            </Text>

            <View className="flex-row justify-center mt-6 mb-10 gap-2">
              {slides.map((_, index) => (
                <View
                  key={index}
                  className={`rounded-full transition-all duration-300 ${
                    currentIndex === index
                      ? "bg-green-500 w-8 h-3"
                      : "bg-gray-300 w-3 h-3"
                  }`}
                />
              ))}
            </View>
          </View>
        )}
      />

      <View className="absolute bottom-14 w-full items-center px-6">
        <View className="w-full h-16 justify-center">
          {currentIndex === slides.length - 1 && (
            <TouchableOpacity
              className="w-full rounded-xl overflow-hidden"
              onPress={handleFinish}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#10b981", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="w-full py-4 items-center justify-center"
              >
                <Text className="text-white text-center font-semibold text-base">
                  Get Started
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
