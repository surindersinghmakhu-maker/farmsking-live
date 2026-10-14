import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PortalGuard } from '@/src/portals/PortalGuard';
import { UniversalCommandPalette } from '@/src/portals/UniversalCommandPalette';
import { FONT } from '@/constants/theme';

export default function GardenTabsLayout() {
  return (
    <PortalGuard portalId="GARDEN">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#ec4899',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            backgroundColor: '#120710',
            borderTopColor: 'rgba(236, 72, 153, 0.2)',
            height: Platform.OS === 'web' ? 62 : 68,
            paddingBottom: Platform.OS === 'web' ? 8 : 12,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontFamily: FONT.bold,
            fontSize: 11,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'GreenSpace™',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'flower' : 'flower-outline'} size={21} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="gardeners"
          options={{
            title: 'Gardeners',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'people' : 'people-outline'} size={21} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="advisors"
          options={{
            title: 'Advisors',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'ribbon' : 'ribbon-outline'} size={21} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="doses"
          options={{
            title: 'Plant Doses',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'medkit' : 'medkit-outline'} size={21} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="flora-store"
          options={{
            title: 'Flora Store',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'basket' : 'basket-outline'} size={21} color={color} />
            ),
          }}
        />
      </Tabs>
      <UniversalCommandPalette activePortalId="GARDEN" />
    </PortalGuard>
  );
}
