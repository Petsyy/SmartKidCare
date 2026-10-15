import { useCallback, useEffect, useRef } from "react";
import { useRouter, type Href } from "expo-router";

export function useSafeBack(fallbackRoute: Href) {
  const router = useRouter();
  const navigatingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;

    if (router.canGoBack()) router.back();
    else router.replace(fallbackRoute);

    timerRef.current = setTimeout(() => {
      navigatingRef.current = false;
      timerRef.current = null;
    }, 500);
  }, [fallbackRoute, router]);
}
