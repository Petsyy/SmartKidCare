import React from "react";
import { Pressable, Text, View } from "react-native";
import { AlertTriangle, RefreshCw } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { reportHandledError } from "@/src/lib/error-reporting";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportHandledError("react.error-boundary", error, {
      componentStack: info.componentStack ?? undefined,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView
          className={`flex-1 bg-gray-50 ${this.props.className ?? ""}`}
        >
          <View className="flex-1 items-center justify-center px-6 py-10">
            <View
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
              className="w-full max-w-md items-center rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
                <AlertTriangle size={32} color="#ef4444" strokeWidth={2.25} />
              </View>

              <Text className="mt-5 text-center text-2xl font-bold text-gray-900">
                Something went wrong
              </Text>
              <Text className="mt-2 text-center text-base leading-6 text-gray-500">
                We couldn&apos;t load this screen. Please try again. If the
                problem continues, restart the app.
              </Text>

              <Pressable
                onPress={this.handleReset}
                accessibilityRole="button"
                accessibilityLabel="Try loading the screen again"
                className="mt-6 min-h-14 w-full flex-row items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-4 active:bg-teal-700"
                style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
              >
                <RefreshCw size={20} color="#ffffff" strokeWidth={2.5} />
                <Text className="text-base font-bold text-white">Try again</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
