import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/providers/AuthProvider';
import { theme } from '@/src/theme';

export default function LoginScreen() {
  const { signIn, accessError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || !password) {
      setMessage('Enter your email and password.');
      return;
    }
    setBusy(true);
    setMessage(null);
    const error = await signIn(email, password);
    if (error) setMessage(error);
    setBusy(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.hero}>
          <View style={styles.mark}><Text style={styles.markText}>P</Text></View>
          <Text style={styles.eyebrow}>SUNBLISS RESIDENCES</Text>
          <Text style={styles.title}>Sales & Collections</Text>
          <Text style={styles.subtitle}>Secure CRM access for authorized team members.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in</Text>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="name@company.com"
            placeholderTextColor="#9B968C"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="username"
            style={styles.input}
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#9B968C"
            secureTextEntry
            textContentType="password"
            style={styles.input}
            onSubmitEditing={submit}
          />
          {(message || accessError) ? <Text style={styles.error}>{message || accessError}</Text> : null}
          <Pressable onPress={submit} disabled={busy} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, busy && styles.buttonDisabled]}>
            {busy ? <ActivityIndicator color={theme.colors.ink} /> : <Text style={styles.buttonText}>Sign In</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: theme.colors.paper },
  hero: { paddingHorizontal: 24, paddingTop: 54, paddingBottom: 28, alignItems: 'center' },
  mark: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: theme.colors.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  markText: { fontSize: 30, fontWeight: '700', color: theme.colors.gold },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2.1, color: theme.colors.gold },
  title: { marginTop: 8, fontSize: 31, fontWeight: '700', letterSpacing: -1, color: theme.colors.ink },
  subtitle: { marginTop: 8, maxWidth: 310, textAlign: 'center', fontSize: 13, lineHeight: 19, color: theme.colors.muted },
  card: { marginHorizontal: 18, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.line, backgroundColor: theme.colors.card, padding: 20 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.ink, marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '600', color: theme.colors.muted, marginBottom: 7 },
  input: { minHeight: 50, borderWidth: 1, borderColor: theme.colors.line, borderRadius: 13, paddingHorizontal: 14, marginBottom: 15, backgroundColor: theme.colors.white, color: theme.colors.ink, fontSize: 16 },
  error: { color: theme.colors.danger, fontSize: 12.5, lineHeight: 18, marginBottom: 12 },
  button: { minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.gold, marginTop: 2 },
  buttonPressed: { opacity: 0.88 },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: theme.colors.ink, fontWeight: '800', fontSize: 15 },
});
