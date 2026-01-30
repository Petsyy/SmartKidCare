import React from "react";
import { View, Text, Pressable, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Baby, Users, ChevronRight, ChevronLeft, Sparkles, ShieldCheck } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

type RoleCardProps = {
  title: string;
  description: string;
  icon: any;
  colors: [string, string];
  badge?: string;
  chip?: string;
  onPress: () => void;
};

export default function RoleSelection() {
  const router = useRouter();

  const RoleCard = ({ title, description, icon: Icon, colors, badge, chip, onPress }: RoleCardProps) => (
    <Pressable
      onPress={onPress}
      className="w-full mb-5"
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.95 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 26,
          paddingVertical: 18,
          paddingHorizontal: 18,
        }}
      >
        {/* Top Row: Badge */}
        <View className="flex-row items-center justify-between mb-3">
          {badge ? (
            <View className="self-start rounded-full bg-white/20 px-3 py-1 border border-white/25">
              <Text className="text-white text-xs font-semibold">{badge}</Text>
            </View>
          ) : (
            <View />
          )}

          <View className="flex-row items-center">
            <Text className="text-white/80 text-xs mr-1">Continue</Text>
            <ChevronRight size={18} color="white" opacity={0.85} />
          </View>
        </View>

        {/* Main Row */}
        <View className="flex-row items-start">
          <View className="mr-4 mt-1">
            <View className="h-14 w-14 rounded-2xl bg-white/20 border border-white/25 items-center justify-center">
              <Icon size={30} color="white" />
            </View>
          </View>

          <View className="flex-1">
            <Text className="text-white text-xl font-extrabold">{title}</Text>
            <Text className="text-white/85 text-base mt-1 leading-5">
              {description}
            </Text>

            {!!chip && (
              <View className="mt-3 self-start rounded-full bg-white/20 px-3 py-1 border border-white/25">
                <Text className="text-white text-xs font-semibold">{chip}</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Decorative Background */}
      <View className="absolute inset-0">
        <View
          style={{
            position: "absolute",
            width: width * 0.9,
            height: width * 0.9,
            borderRadius: width,
            top: -width * 0.35,
            left: -width * 0.2,
            backgroundColor: "rgba(16,185,129,0.12)",
          }}
        />
        <View
          style={{
            position: "absolute",
            width: width * 0.85,
            height: width * 0.85,
            borderRadius: width,
            bottom: -width * 0.35,
            right: -width * 0.25,
            backgroundColor: "rgba(56,189,248,0.12)",
          }}
        />
        <View
          style={{
            position: "absolute",
            width: width * 0.6,
            height: width * 0.6,
            borderRadius: width,
            top: width * 0.35,
            right: -width * 0.25,
            backgroundColor: "rgba(99,102,241,0.10)",
          }}
        />
      </View>

      {/* Back Button */}
      <View className="px-6 pt-3">
        <Pressable
          onPress={() => router.back()}
          className="w-11 h-11 rounded-full bg-white/90 border border-gray-200 items-center justify-center shadow-sm"
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <ChevronLeft size={20} color="#16a34a" />
        </Pressable>
      </View>

      <View className="flex-1 px-6 justify-center">
        {/* Header */}
        <View className="items-center mb-8">
          <Text className="text-4xl font-extrabold text-gray-900">
            SmartKidCare
          </Text>

          <Text className="text-gray-500 text-base mt-3 text-center leading-6">
            Choose your account type to continue.{"\n"}
            Secure monitoring for attendance and lunch feeding.
          </Text>
        </View>

        {/* Role Cards */}
        <RoleCard
          title="I am a Parent"
          description="Monitor your child’s daily attendance and lunch feeding updates."
          icon={Baby}
          colors={["#16a34a", "#22c55e"]}
          badge="For Guardians"
          chip="Daily progress & updates"
          onPress={() => router.push("/(auth)/parent-registration")}
        />

        <RoleCard
          title="I am a Worker"
          description="Record attendance, lunch feeding logs, and communicate with parents."
          icon={Users}
          colors={["#0284c7", "#38bdf8"]}
          badge="For Staff"
          chip="Tasks, logs & alerts"
          onPress={() => router.push("/(auth)/worker-registration")}
        />

        {/* Footer */}
        <View className="mt-2 items-center">
          <Text className="text-sm text-gray-400 text-center leading-5">
            By continuing, you agree to SmartKidCare policies and secure data handling.
          </Text>

          <Pressable className="mt-3">
            <Text className="text-sm font-semibold text-emerald-700">
              Need help choosing?
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
