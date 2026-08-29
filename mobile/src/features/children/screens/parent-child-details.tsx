import { useEffect } from "react";
import { useRouter } from "expo-router";

/**
 * This screen has been consolidated into the My Child tab.
 * Any navigation here redirects back to the children list.
 */
export default function ParentChildDetailsScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/(parent)/children");
  }, [router]);

  return null;
}
