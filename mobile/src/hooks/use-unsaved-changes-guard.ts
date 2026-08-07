import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import {
  useNavigation,
  usePreventRemove,
  type NavigationAction,
} from "@react-navigation/native";

type UnsavedChangesGuardOptions = {
  hasUnsavedChanges: boolean;
  isSaving?: boolean;
  onSave: () => Promise<unknown>;
  title?: string;
  message?: string;
  saveLabel?: string;
};

export function useUnsavedChangesGuard({
  hasUnsavedChanges,
  isSaving = false,
  onSave,
  title = "Unsaved Progress",
  message = "You have unsaved progress. Save it as a draft before leaving?",
  saveLabel = "Save Draft",
}: UnsavedChangesGuardOptions) {
  const navigation = useNavigation();
  const pendingAction = useRef<NavigationAction | null>(null);
  const [allowRemoval, setAllowRemoval] = useState(false);

  useEffect(() => {
    if (!allowRemoval || !pendingAction.current) return;

    const action = pendingAction.current;
    pendingAction.current = null;
    navigation.dispatch(action);
  }, [allowRemoval, navigation]);

  usePreventRemove(hasUnsavedChanges && !allowRemoval, ({ data }) => {
    if (isSaving) return;

    const leave = () => {
      pendingAction.current = data.action;
      setAllowRemoval(true);
    };

    Alert.alert(title, message, [
      { text: "Keep Editing", style: "cancel" },
      { text: "Leave Without Saving", style: "destructive", onPress: leave },
      {
        text: saveLabel,
        onPress: () => {
          void onSave().then(leave).catch(() => undefined);
        },
      },
    ]);
  });
}
