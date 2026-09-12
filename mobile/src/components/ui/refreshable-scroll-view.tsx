import React from "react";
import {
  RefreshControl,
  ScrollView,
  type ScrollViewProps,
} from "react-native";

export interface RefreshableScrollViewProps
  extends Omit<ScrollViewProps, "refreshControl"> {
  refreshing: boolean;
  onRefresh: () => void | Promise<unknown>;
  refreshColor?: string;
}

export const RefreshableScrollView = React.forwardRef<
  ScrollView,
  RefreshableScrollViewProps
>(function RefreshableScrollView(
  {
    refreshing,
    onRefresh,
    refreshColor = "#0D9488",
    ...scrollViewProps
  },
  ref,
) {
  return (
    <ScrollView
      ref={ref}
      {...scrollViewProps}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            void onRefresh();
          }}
          colors={[refreshColor]}
          tintColor={refreshColor}
        />
      }
    />
  );
});

RefreshableScrollView.displayName = "RefreshableScrollView";
