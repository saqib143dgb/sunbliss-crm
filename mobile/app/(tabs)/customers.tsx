import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/src/components/Screen';
import { CustomerListItem, getCustomers } from '@/src/services/crm';
import { theme } from '@/src/theme';

export default function CustomersScreen() {
  const [rows, setRows] = useState<CustomerListItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setRows(await getCustomers());
    } catch (err: any) {
      setError(err?.message || 'Could not load customers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const customerMatch = [row.customer_name, row.email, row.phone, row.nationality]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
      return customerMatch || row.units?.some((unit) => unit.unit_no.toLowerCase().includes(q));
    });
  }, [rows, search]);

  return (
    <Screen contentStyle={styles.content}>
      <Text style={styles.eyebrow}>UNITS & CUSTOMERS</Text>
      <Text style={styles.title}>Customers</Text>
      <Text style={styles.subtitle}>Search by customer, email, phone or unit number.</Text>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search customer or unit"
        placeholderTextColor="#918C82"
        autoCorrect={false}
        style={styles.search}
      />

      {loading ? <ActivityIndicator color={theme.colors.gold} style={styles.loader} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.list}>
        {filtered.map((customer) => (
          <Pressable key={customer.id} onPress={() => router.push(`/customer/${customer.id}`)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{customer.customer_name}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
            <Text style={styles.contact} numberOfLines={1}>{customer.phone || customer.email || 'No contact recorded'}</Text>
            <View style={styles.unitsRow}>
              {(customer.units || []).slice(0, 3).map((unit) => <Text key={unit.id} style={styles.unitPill}>{unit.unit_no}</Text>)}
              {(customer.units || []).length > 3 ? <Text style={styles.more}>+{customer.units.length - 3}</Text> : null}
            </View>
          </Pressable>
        ))}
        {!loading && filtered.length === 0 ? <Text style={styles.empty}>No matching customer found.</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 110 },
  eyebrow: { fontSize: 10.5, color: theme.colors.gold, fontWeight: '800', letterSpacing: 1.8 },
  title: { marginTop: 5, fontSize: 31, color: theme.colors.ink, fontWeight: '750', letterSpacing: -1 },
  subtitle: { marginTop: 5, fontSize: 12.5, color: theme.colors.muted },
  search: { marginTop: 18, minHeight: 48, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.pill, backgroundColor: theme.colors.card, paddingHorizontal: 17, color: theme.colors.ink, fontSize: 15 },
  loader: { marginTop: 44 },
  error: { marginTop: 16, color: theme.colors.danger, fontSize: 12.5 },
  list: { gap: 10, marginTop: 16 },
  card: { borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.md, backgroundColor: theme.colors.card, padding: 15 },
  pressed: { opacity: 0.72 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  name: { flex: 1, fontSize: 15.5, fontWeight: '750', color: theme.colors.ink },
  chevron: { fontSize: 27, lineHeight: 28, color: theme.colors.gold },
  contact: { marginTop: 4, fontSize: 12, color: theme.colors.muted },
  unitsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 12 },
  unitPill: { overflow: 'hidden', borderRadius: theme.radius.pill, backgroundColor: theme.colors.goldSoft, paddingHorizontal: 9, paddingVertical: 5, color: theme.colors.ink, fontSize: 10.5, fontWeight: '800' },
  more: { fontSize: 11, color: theme.colors.muted, fontWeight: '700' },
  empty: { marginTop: 24, textAlign: 'center', fontSize: 13, color: theme.colors.muted },
});
