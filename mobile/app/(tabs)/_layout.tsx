import { Tabs } from 'expo-router';
import { theme } from '@/src/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.ink,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 9 },
        tabBarStyle: {
          height: 78,
          paddingTop: 8,
          paddingBottom: 14,
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.line,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Overview' }} />
      <Tabs.Screen name="customers" options={{ title: 'Customers' }} />
    </Tabs>
  );
}
