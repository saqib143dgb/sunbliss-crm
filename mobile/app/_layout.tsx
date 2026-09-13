import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/src/providers/AuthProvider';
import { theme } from '@/src/theme';

function RootNavigator() {
  const { isLoading, isAuthorized } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.eyebrow}>SUNBLISS RESIDENCES</Text>
        <Text style={styles.brand}>CRM</Text>
        <ActivityIndicator size="small" color={theme.colors.gold} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.paper } }}>
      <Stack.Protected guard={!isAuthorized}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={isAuthorized}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="customer/[id]" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: theme.colors.paper },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2.2, color: theme.colors.gold },
  brand: { fontSize: 34, fontWeight: '700', letterSpacing: -1, color: theme.colors.ink, marginBottom: 10 },
});
