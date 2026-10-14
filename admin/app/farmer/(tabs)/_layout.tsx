import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PortalGuard } from '@/src/portals/PortalGuard';
import { UniversalCommandPalette } from '@/src/portals/UniversalCommandPalette';
import { FONT } from '@/constants/theme';

export default function FarmerTabsLayout() {
  return (
    <PortalGuard portalId="FARMER">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#16a34a',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            backgroundColor: '#07170c',
            borderTopColor: 'rgba(22, 163, 74, 0.25)',
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
            title: 'Agri-Hub',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'leaf' : 'leaf-outline'} size={21} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="farmers"
          options={{
            title: 'Farmers',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'people' : 'people-outline'} size={21} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="workforce"
          options={{
            title: 'Workforce',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'construct' : 'construct-outline'} size={21} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="crop-intelligence"
          options={{
            title: 'Crop AI',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'analytics' : 'analytics-outline'} size={21} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="satellite-map"
          options={{
            title: 'Radar',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'planet' : 'planet-outline'} size={21} color={color} />
            ),
          }}
        />
      </Tabs>
      <UniversalCommandPalette activePortalId="FARMER" />
    </PortalGuard>
  );
}
