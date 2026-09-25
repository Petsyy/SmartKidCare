import React from "react";
import { Pressable, Text, Animated } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import AnimatedReanimated, { FadeInDown } from "react-native-reanimated";
import { ShieldPlus } from "lucide-react-native";
import ChildCard from "./child-card";

type ChildCardProps = React.ComponentProps<typeof ChildCard>;

interface SwipeableChildCardProps extends ChildCardProps {
  index: number;
  onAddGuardian?: () => void;
}

export function SwipeableChildCard({
  index,
  onAddGuardian,
  ...childCardProps
}: SwipeableChildCardProps) {
  
  const guardianCount = childCardProps.guardianCount ?? 0;
  const isInactive = childCardProps.isInactive;
  
  const renderRightActions = (progress: any, dragX: any) => {
    // Hide swipe action if they already have max guardians, no handler is provided, or if inactive
    if (guardianCount >= 5 || !onAddGuardian || isInactive) return null;

    const trans = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={{
          width: 90,
          transform: [{ translateX: trans }],
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={onAddGuardian}
          className="bg-teal-600 w-20 h-[95%] rounded-2xl items-center justify-center mt-1 shadow-sm"
        >
          <ShieldPlus size={24} color="white" />
          <Text className="text-white text-[10px] font-bold mt-1 text-center uppercase tracking-wider">
            Add
          </Text>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <AnimatedReanimated.View
      entering={FadeInDown.delay(index * 100).springify()}
      className="mb-3"
    >
      <Swipeable
        renderRightActions={renderRightActions}
        friction={2}
        rightThreshold={40}
        overshootRight={false}
      >
        <ChildCard {...childCardProps} />
      </Swipeable>
    </AnimatedReanimated.View>
  );
}
