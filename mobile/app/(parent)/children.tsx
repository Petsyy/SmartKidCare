import { useEffect, useState } from "react";
import {
  Text,
  View,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMyChildren, Child } from "@/src/api/parent.api";
import ChildCard from "@/src/components/ChildCard";

export default function ChildScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChildren = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) throw new Error("No authentication token");

        const data = await getMyChildren(token);
        setChildren(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadChildren();
  }, []);


  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-500">{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* HEADER */}
      <View
        style={{ paddingTop: insets.top + 12 }}
        className="bg-teal-600 px-5 pb-5"
      >
        <Text className="text-3xl font-extrabold text-white">
          My Children
        </Text>
        <Text className="text-lg text-teal-100 mt-1">
          Children linked to your account
        </Text>
      </View>


      {/* LIST */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-5">
          {children.length === 0 ? (
            <Text className="text-center text-gray-500 mt-10">
              No children linked to your account.
            </Text>
          ) : (
            <View className="flex flex-col">
              {children.map((child, index) => (
                <View key={child._id} className={index < children.length - 1 ? "mb-4" : ""}>
                  <ChildCard
                  name={`${child.firstName} ${child.middleName ? child.middleName + " " : ""
                    }${child.lastName}`}
                  age={child.age}
                  gender={child.gender}

                  // temporary / demo values
                  attendance="Present"
                  feeding="Finished"
                  lastUpdated="Today 10:30 AM"

                  onPress={() => {
                    router.push(`/(parent)/parent-child-details/${child._id}`);
                  }}
                />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
