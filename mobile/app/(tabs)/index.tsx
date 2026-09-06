import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/src/components/Screen';
import { KpiCard } from '@/src/components/KpiCard';
import { getOverview, OverviewData } from '@/src/services/crm';
import { useAuth } from '@/src/providers/AuthProvider';
import { theme } from '@/src/theme';

export default function OverviewScreen() {
  const { profile, signOut } = useAuth();
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await getOverview());
    } catch (err: any) {
      setError(err?.message || 'Could not load CRM overview.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>SUNBLISS CRM</Text>
          <Text style={styles.title}>Overview</Text>
          <Text style={styles.welcome}>{profile?.full_name || 'Authorized user'} · {profile?.role === 'manager' ? 'Manager' : 'CRM Officer'}</Text>
        </View>
        <Pressable onPress={signOut} style={styles.signOut}><Text style={styles.signOutText}>Sign out</Text></Pressable>
      </View>

      {!data && !error ? <ActivityIndicator color={theme.colors.gold} style={styles.loader} /> : null}
      {error ? <View style={styles.errorCard}><Text style={styles.errorText}>{error}</Text><Pressable onPress={load}><Text style={styles.retry}>Retry</Text></Pressable></View> : null}

      {data ? (
        <>
          <View style={styles.grid}>
            <KpiCard label="Customers" value={data.customerCount} emphasis />
            <KpiCard label="Units" value={data.unitCount} />
            <KpiCard label="Open actions" value={data.openActions} />
            <KpiCard label="Overdue installments" value={data.overdueInstallments} />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your next actions</Text>
            <Text style={styles.sectionMeta}>{data.actions.length} shown</Text>
          </View>

          <View style={styles.listCard}>
            {data.actions.length === 0 ? <Text style={styles.empty}>No pending actions assigned to you.</Text> : data.actions.map((action, index) => (
              <View key={action.id} style={[styles.actionRow, index < data.actions.length - 1 && styles.rowBorder]}>
                <View style={styles.actionMain}>
                  <Text style={styles.unit}>{action.unitNo}</Text>
                  <Text style={styles.actionLabel}>{action.actionLabel}</Text>
                </View>
                <View style={styles.actionMeta}>
                  <Text style={styles.date}>{action.dueDate}</Text>
                  <Text style={styles.priority}>{action.priority}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 110 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 },
  eyebrow: { fontSize: 10.5, color: theme.colors.gold, fontWeight: '800', letterSpacing: 1.8 },
  title: { marginTop: 5, fontSize: 31, color: theme.colors.ink, fontWeight: '700', letterSpacing: -1 },
  welcome: { marginTop: 5, fontSize: 12, color: theme.colors.muted },
  signOut: { borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.pill, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: theme.colors.card },
  signOutText: { fontSize: 11, color: theme.colors.ink, fontWeight: '700' },
  loader: { marginTop: 60 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 10 },
  sectionTitle: { fontSize: 17, color: theme.colors.ink, fontWeight: '700' },
  sectionMeta: { fontSize: 11, color: theme.colors.muted },
  listCard: { borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.md, backgroundColor: theme.colors.card, overflow: 'hidden' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, padding: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.line },
  actionMain: { flex: 1 },
  unit: { fontSize: 12, fontWeight: '800', color: theme.colors.gold },
  actionLabel: { marginTop: 4, fontSize: 13.5, lineHeight: 18, color: theme.colors.ink, fontWeight: '600' },
  actionMeta: { alignItems: 'flex-end' },
  date: { fontSize: 11.5, color: theme.colors.ink, fontWeight: '700' },
  priority: { marginTop: 5, fontSize: 10.5, color: theme.colors.muted, textTransform: 'capitalize' },
  empty: { padding: 18, fontSize: 13, color: theme.colors.muted },
  errorCard: { borderWidth: 1, borderColor: '#E4B9B3', backgroundColor: theme.colors.dangerSoft, padding: 16, borderRadius: theme.radius.md },
  errorText: { fontSize: 12.5, color: theme.colors.danger, lineHeight: 18 },
  retry: { marginTop: 9, fontSize: 12, fontWeight: '800', color: theme.colors.ink },
});
