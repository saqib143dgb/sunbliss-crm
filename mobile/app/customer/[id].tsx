import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/src/components/Screen';
import { CustomerDetail, getCustomerDetail } from '@/src/services/crm';
import { theme } from '@/src/theme';

function money(value: number | null | undefined) {
  return `AED ${Number(value || 0).toLocaleString('en-AE', { maximumFractionDigits: 0 })}`;
}

function normalizedWhatsApp(phone: string) {
  return phone.replace(/[^0-9]/g, '');
}

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const customerId = Number(id);
  const [data, setData] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(customerId)) {
      setError('Invalid customer record.');
      return;
    }
    getCustomerDetail(customerId)
      .then(setData)
      .catch((err: any) => setError(err?.message || 'Could not load customer.'));
  }, [customerId]);

  const summaries = useMemo(() => {
    if (!data) return [];
    return data.units.map((unit) => {
      const rows = data.schedule.filter((row) => row.unit_id === unit.id);
      const scheduled = rows.reduce((sum, row) => sum + Number(row.due_amount || 0), 0);
      const paid = rows.reduce((sum, row) => sum + Number(row.paid_amount || 0), 0);
      return { unit, rows, scheduled, paid, remaining: Math.max(scheduled - paid, 0), sale: data.sales.find((sale) => sale.unit_id === unit.id) };
    });
  }, [data]);

  return (
    <Screen contentStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹ Back</Text></Pressable>

      {!data && !error ? <ActivityIndicator color={theme.colors.gold} style={styles.loader} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {data ? (
        <>
          <Text style={styles.eyebrow}>CUSTOMER</Text>
          <Text style={styles.title}>{data.customer.customer_name}</Text>
          {data.customer.co_applicant ? <Text style={styles.coApplicant}>Co-applicant · {data.customer.co_applicant}</Text> : null}

          <View style={styles.contactCard}>
            <Text style={styles.sectionLabel}>Contact</Text>
            {data.customer.phone ? (
              <View style={styles.contactRow}>
                <Text style={styles.contactValue}>{data.customer.phone}</Text>
                <View style={styles.contactActions}>
                  <Pressable onPress={() => Linking.openURL(`tel:${data.customer.phone}`)} style={styles.miniButton}><Text style={styles.miniButtonText}>Call</Text></Pressable>
                  <Pressable onPress={() => Linking.openURL(`https://wa.me/${normalizedWhatsApp(data.customer.phone!)}`)} style={styles.miniButton}><Text style={styles.miniButtonText}>WhatsApp</Text></Pressable>
                </View>
              </View>
            ) : null}
            {data.customer.email ? <Text style={styles.secondary}>{data.customer.email}</Text> : null}
            {data.customer.nationality ? <Text style={styles.secondary}>{data.customer.nationality}</Text> : null}
          </View>

          <Text style={styles.sectionTitle}>Units & financial position</Text>
          {summaries.map(({ unit, rows, paid, remaining, sale }) => (
            <View key={unit.id} style={styles.unitCard}>
              <View style={styles.unitHeader}>
                <View>
                  <Text style={styles.unitNo}>{unit.unit_no}</Text>
                  <Text style={styles.unitMeta}>{[unit.unit_type, unit.floor ? `Floor ${unit.floor}` : null].filter(Boolean).join(' · ')}</Text>
                </View>
                <Text style={styles.status}>{unit.status || '—'}</Text>
              </View>

              <View style={styles.moneyRow}>
                <View style={styles.moneyCell}><Text style={styles.moneyLabel}>Sale value</Text><Text style={styles.moneyValue}>{money(unit.total_price)}</Text></View>
                <View style={styles.moneyCell}><Text style={styles.moneyLabel}>Scheduled paid</Text><Text style={styles.moneyValue}>{money(paid)}</Text></View>
                <View style={[styles.moneyCell, styles.moneyCellLast]}><Text style={styles.moneyLabel}>Schedule remaining</Text><Text style={styles.moneyValue}>{money(remaining)}</Text></View>
              </View>

              <View style={styles.complianceRow}>
                <Text style={styles.compliance}>SPA · {sale?.spa_status || '—'}</Text>
                <Text style={styles.compliance}>Oqood · {sale?.oqood_status || '—'}</Text>
                <Text style={styles.compliance}>DLD · {sale?.dld_status || '—'}</Text>
              </View>

              <View style={styles.scheduleBlock}>
                <Text style={styles.scheduleHeading}>Payment schedule</Text>
                {rows.filter((row) => Number(row.due_amount || 0) !== 0 || Number(row.paid_amount || 0) !== 0 || row.due_date).map((row, index, visible) => (
                  <View key={row.id} style={[styles.scheduleRow, index < visible.length - 1 && styles.scheduleBorder]}>
                    <View style={styles.scheduleMain}>
                      <Text style={styles.stage}>{row.stage_name}</Text>
                      <Text style={styles.dueDate}>{row.revised_due_date || row.due_date || 'No due date'}{row.revised_due_date ? ' · revised' : ''}</Text>
                    </View>
                    <View style={styles.scheduleAmounts}>
                      <Text style={styles.dueAmount}>{money(row.due_amount)}</Text>
                      <Text style={styles.paidAmount}>Paid {money(row.paid_amount)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  back: { alignSelf: 'flex-start', borderWidth: 1, borderColor: theme.colors.ink, borderRadius: theme.radius.pill, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 20 },
  backText: { fontSize: 12, fontWeight: '800', color: theme.colors.ink },
  loader: { marginTop: 70 },
  error: { marginTop: 20, color: theme.colors.danger, fontSize: 13 },
  eyebrow: { fontSize: 10.5, color: theme.colors.gold, fontWeight: '800', letterSpacing: 1.8 },
  title: { marginTop: 5, fontSize: 27, lineHeight: 32, color: theme.colors.ink, fontWeight: '700', letterSpacing: -0.7 },
  coApplicant: { marginTop: 6, fontSize: 12, color: theme.colors.muted },
  contactCard: { marginTop: 18, padding: 15, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.md, backgroundColor: theme.colors.card },
  sectionLabel: { fontSize: 11, color: theme.colors.muted, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  contactRow: { marginTop: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  contactValue: { flex: 1, fontSize: 14, color: theme.colors.ink, fontWeight: '700' },
  contactActions: { flexDirection: 'row', gap: 6 },
  miniButton: { borderRadius: theme.radius.pill, backgroundColor: theme.colors.goldSoft, paddingHorizontal: 9, paddingVertical: 6 },
  miniButtonText: { fontSize: 10.5, fontWeight: '800', color: theme.colors.ink },
  secondary: { marginTop: 7, fontSize: 12.5, color: theme.colors.muted },
  sectionTitle: { marginTop: 27, marginBottom: 10, fontSize: 17, color: theme.colors.ink, fontWeight: '700' },
  unitCard: { marginBottom: 12, borderWidth: 1, borderColor: theme.colors.line, borderRadius: theme.radius.md, backgroundColor: theme.colors.card, overflow: 'hidden' },
  unitHeader: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  unitNo: { fontSize: 19, fontWeight: '800', color: theme.colors.ink },
  unitMeta: { marginTop: 3, fontSize: 11.5, color: theme.colors.muted },
  status: { overflow: 'hidden', borderRadius: theme.radius.pill, backgroundColor: theme.colors.goldSoft, paddingHorizontal: 9, paddingVertical: 5, fontSize: 10, fontWeight: '800', color: theme.colors.ink },
  moneyRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.line },
  moneyCell: { flex: 1, paddingVertical: 11, paddingHorizontal: 10, borderRightWidth: 1, borderRightColor: theme.colors.line },
  moneyCellLast: { borderRightWidth: 0 },
  moneyLabel: { fontSize: 9.5, color: theme.colors.muted, lineHeight: 13 },
  moneyValue: { marginTop: 4, fontSize: 11.5, color: theme.colors.ink, fontWeight: '800' },
  complianceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 12 },
  compliance: { overflow: 'hidden', borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.colors.line, paddingHorizontal: 8, paddingVertical: 5, fontSize: 10, color: theme.colors.ink, fontWeight: '600' },
  scheduleBlock: { borderTopWidth: 1, borderTopColor: theme.colors.line, paddingHorizontal: 13, paddingBottom: 3 },
  scheduleHeading: { paddingTop: 12, paddingBottom: 6, fontSize: 11, color: theme.colors.muted, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  scheduleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 10 },
  scheduleBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.line },
  scheduleMain: { flex: 1 },
  stage: { fontSize: 12.5, color: theme.colors.ink, fontWeight: '700' },
  dueDate: { marginTop: 3, fontSize: 10.5, color: theme.colors.muted },
  scheduleAmounts: { alignItems: 'flex-end' },
  dueAmount: { fontSize: 11.5, color: theme.colors.ink, fontWeight: '800' },
  paidAmount: { marginTop: 3, fontSize: 10.5, color: theme.colors.success, fontWeight: '600' },
});
