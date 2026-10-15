import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

interface SnackbarOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
  duration?: number;
}

interface SnackbarContextValue {
  showSnackbar: (options: SnackbarOptions) => void;
  dismissSnackbar: () => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [snackbar, setSnackbar] = useState<SnackbarOptions | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissSnackbar = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setSnackbar(null);
  }, []);

  const showSnackbar = useCallback((options: SnackbarOptions) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSnackbar(options);
    timerRef.current = setTimeout(() => {
      setSnackbar(null);
      timerRef.current = null;
    }, options.duration ?? 6000);
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar, dismissSnackbar }}>
      {children}
      {snackbar ? (
        <View className="absolute bottom-24 left-4 right-4 z-50 flex-row items-center rounded-2xl bg-gray-900 px-4 py-3 shadow-lg">
          <Text className="flex-1 text-base font-medium text-white">{snackbar.message}</Text>
          {snackbar.actionLabel ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={snackbar.actionLabel}
              onPress={async () => {
                const action = snackbar.onAction;
                dismissSnackbar();
                await action?.();
              }}
              className="min-h-11 justify-center px-3"
            >
              <Text className="font-bold text-teal-300">{snackbar.actionLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) throw new Error("useSnackbar must be used within SnackbarProvider");
  return context;
}
