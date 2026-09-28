import { useCallback } from "react";
import { BackHandler, Platform } from "react-native";
import { useFocusEffect, useRouter, type Href } from "expo-router";

export function useAndroidBackRoute(destination: Href, enabled = true) {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      if (!enabled || Platform.OS !== "android") return undefined;

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          router.replace(destination);
          return true;
        },
      );

      return () => subscription.remove();
    }, [destination, enabled, router]),
  );
}
