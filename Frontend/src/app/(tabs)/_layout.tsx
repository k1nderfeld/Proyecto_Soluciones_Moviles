import React from 'react';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BootScreen } from '@/components/ui/BootScreen';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';

import type { ColorValue } from 'react-native';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const icon = (active: IconName, inactive: IconName) => {
  const TabBarIcon = ({
    color,
    size,
    focused,
  }: {
    color: ColorValue | null;
    size: number;
    focused: boolean;
  }) => (
    <Ionicons
      name={focused ? active : inactive}
      size={size}
      color={typeof color === 'number' ? undefined : (color ?? undefined)}
    />
  );
  TabBarIcon.displayName = `TabBarIcon(${active})`;
  return TabBarIcon;
};

export default function TabsLayout() {
  const { isLoading, hasSession } = useAuth();

  if (isLoading) return <BootScreen />;
  if (!hasSession) return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: 'Inicio', tabBarIcon: icon('home', 'home-outline') }}
      />
      <Tabs.Screen
        name="catalog"
        options={{ title: 'Catálogo', tabBarIcon: icon('book', 'book-outline') }}
      />
      <Tabs.Screen
        name="recognize"
        options={{ title: 'Reconocer', tabBarIcon: icon('camera', 'camera-outline') }}
      />
      <Tabs.Screen
        name="collection"
        options={{ title: 'Colección', tabBarIcon: icon('albums', 'albums-outline') }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: 'Progreso', tabBarIcon: icon('stats-chart', 'stats-chart-outline') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Perfil', tabBarIcon: icon('person', 'person-outline') }}
      />
    </Tabs>
  );
}
