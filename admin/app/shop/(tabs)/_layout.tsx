import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PortalGuard } from '@/src/portals/PortalGuard';
import { UniversalCommandPalette } from '@/src/portals/UniversalCommandPalette';
import { FONT } from '@/constants/theme';

export default function ShopTabsLayout() {
  return (
    <PortalGuard portalId="SHOP">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#0284c7',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            backgroundColor: '#071224',
            borderTopColor: 'rgba(2, 132, 199, 0.2)',
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
            title: 'Commerce',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'bag-handle' : 'bag-handle-outline'} size={21} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="products"
          options={{
            title: 'Catalog',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'cube' : 'cube-outline'} size={21} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders Desk',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'cart' : 'cart-outline'} size={21} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="sellers"
          options={{
            title: 'Sellers',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'business' : 'business-outline'} size={21} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="coupons"
          options={{
            title: 'VIP Coupons',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'pricetag' : 'pricetag-outline'} size={21} color={color} />
            ),
          }}
        />
      </Tabs>
      <UniversalCommandPalette activePortalId="SHOP" />
    </PortalGuard>
  );
}
