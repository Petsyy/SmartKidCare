import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMyChildren, Child } from "../../src/api/parent.api";
import { Activity, Bold } from "lucide-react-native";
import { Text, ActivityIndicator, View } from "react-native";

export default function ChildScreen() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChildren = async () => {
      try {

        const token = await AsyncStorage.getItem("token");
        if (!token) throw new Error("No authentication token");

        const children = await getMyChildren(token);
        setChildren(children);
      } catch (error) {
        console.error("Error loading children:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChildren();
  }, []);

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>{error}</Text>;

  return (
    <View>
      {children.length === 0 ? (
        <Text>No children linked to your account.</Text>
      ) : (
        children.map((child) => (
          <View key={child._id} style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: "bold" }}>
              {child.firstName} {child.middleName ? child.middleName + " " : ""}{child.lastName}
            </Text>
            <Text>Age: {child.age}</Text>
            <Text>Gender: {child.gender}</Text>
            <Text>School Year: {child.schoolYear}</Text>
          </View>
        ))
      )}
    </View>
  )

}
