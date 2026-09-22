import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/src/theme';

export function KpiCard({ label, value, emphasis = false }: { label: string; value: string | number; emphasis?: boolean }) {
  return (
    <View style={[styles.card, emphasis && styles.emphasis]}>
      <Text style={[styles.label, emphasis && styles.emphasisText]}>{label}</Text>
      <Text style={[styles.value, emphasis && styles.emphasisText]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48.5%',
    minHeight: 102,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
    padding: 15,
    justifyContent: 'space-between',
  },
  emphasis: { backgroundColor: theme.colors.ink, borderColor: theme.colors.ink },
  label: { fontSize: 12, color: theme.colors.muted, fontWeight: '600' },
  value: { fontSize: 28, color: theme.colors.ink, fontWeight: '700', letterSpacing: -0.8 },
  emphasisText: { color: theme.colors.white },
});
