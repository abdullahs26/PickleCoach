import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons size={28} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="gameHistory"
        options={{
          title: "Game History",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons size={28} name="view-grid" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="statistic"
        options={{
          title: "Statistics",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons size={28} name="chart-bar" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
