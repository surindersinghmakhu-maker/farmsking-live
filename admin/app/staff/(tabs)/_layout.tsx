import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PortalGuard } from '@/src/portals/PortalGuard';
import { UniversalCommandPalette } from '@/src/portals/UniversalCommandPalette';
import { FONT } from '@/constants/theme';

export default function StaffTabsLayout() {
  return (
    <PortalGuard portalId="STAFF">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#6366f1',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            backgroundColor: '#0c0a21',
            borderTopColor: 'rgba(99, 102, 241, 0.25)',
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
            title: 'Operations',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'compass' : 'compass-outline'} size={21} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="managers"
          options={{
            title: 'Managers',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={21} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="trainers"
          options={{
            title: 'Trainers',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'school' : 'school-outline'} size={21} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="operators"
          options={{
            title: 'Operators',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'swap-horizontal' : 'swap-horizontal-outline'} size={21} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="partners"
          options={{
            title: 'Partners',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'people' : 'people-outline'} size={21} color={color} />
            ),
          }}
        />
      </Tabs>
      <UniversalCommandPalette activePortalId="STAFF" />
    </PortalGuard>
  );
}
