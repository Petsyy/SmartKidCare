import { colors } from "./theme";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";


export function getTabBarScreenOptions(
  bottomInset: number,
): BottomTabNavigationOptions {
  const tabBarHeight = 64 + bottomInset;

  return {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textMuted,
    tabBarHideOnKeyboard: true,
    tabBarActiveBackgroundColor: colors.primaryLight,
    sceneStyle: {
      backgroundColor: colors.background,
    },
    tabBarStyle: {
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      height: tabBarHeight,
      paddingTop: 12,
      paddingBottom: bottomInset + 8,
      paddingHorizontal: 12,
      elevation: 8,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
    },
    tabBarItemStyle: {
      marginHorizontal: 6,
      marginVertical: 4,
      borderRadius: 20,
    },
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: "600" as const,
      letterSpacing: 0.3,
      marginTop: 2,
    },
    tabBarIconStyle: {
      marginBottom: 0,
    },
  };
}

export function getTabBarStyle(bottomInset: number) {
  const tabBarHeight = 64 + bottomInset;
  return {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: tabBarHeight,
    paddingTop: 12,
    paddingBottom: bottomInset + 8,
    paddingHorizontal: 12,
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  };
}
