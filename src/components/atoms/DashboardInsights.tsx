import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import AppText from '../AppText/AppText';
import { rw } from '../../utils/responsive';

type ZoneItem = { zone?: string; name?: string; target?: number; achievement?: number; percentage?: number; percent?: number; pct?: number; achievement_percentage?: number };
type StateItem = { state?: string; name?: string; sales_value?: number; sales_value_lacs?: number; percentage?: number };
type HighlightItem = { label?: string; title?: string; description?: string; desc?: string; icon?: string; iconBg?: string };
type AlertItem = { title?: string; description?: string; desc?: string; severity?: 'high' | 'medium' | 'low'; icon?: string; zone?: string; type?: string; destination?: 'attendance' | 'target' | 'user_activity' | 'inactive_customers' };
type InactiveCustomer = { id?: number | string; name?: string; mobile?: string };

const STATIC_HIGHLIGHTS: HighlightItem[] = [
  { label: 'Gradation Of The Month', title: 'Ramesh Kumar — Rating 95%', desc: 'Top performer across all zones · MTD', iconBg: '#3fb6e0', icon: '📌' },
  { label: 'Top Customer', title: 'Shree Balaji Traders', desc: 'Highest order value MTD — ₹4.8 L', iconBg: '#4a4ab0', icon: '🏬' },
  { label: 'Special Offer', title: 'Monsoon Dealer Bonanza', desc: 'Extra 2% incentive on HDPE Pipe orders this month', iconBg: '#eb9b1e', icon: '➤' },
  { label: 'Milestone', title: '10+ customers onboarded', desc: 'Crossed a new customer milestone this quarter', iconBg: '#1fb87a', icon: '★' },
  { label: 'New Launch', title: 'uPVC UDS pipe — now in West zone', desc: 'Available for order starting this week', iconBg: '#2f8fe0', icon: '🖥️' },
  { label: 'Product Of The Month', title: 'F4.0"(110mm) Sprinkler Irrigation System', desc: '220 units sold MTD — highest selling SKU', iconBg: '#d6634a', icon: '📊' },
  { label: 'Fastest Growing Zone', title: 'West zone — up 24% MTD', desc: 'Best zone-on-zone growth this month', iconBg: '#0e9f8f', icon: '📈' },
];

const STATIC_ALERTS: AlertItem[] = [
  { title: 'High Mis Punch — West Zone', desc: '5 mis-punches recorded today, most from West zone. Needs immediate review.', severity: 'high', icon: '⚠️' },
  { title: 'South Zone Lagging On Target', desc: 'Only 34% of MTD target achieved with 14 days left in the month.', severity: 'high', icon: '⚠️' },
  { title: 'Inactive Customers Rising', desc: '8 customers have placed no order in the last 30 days — churn risk.', severity: 'medium', icon: '🔴' },
  { title: 'High Outstanding Dues', desc: '₹12.40 L outstanding from 9 customers, overdue by 30+ days.', severity: 'high', icon: '₹' },
  { title: 'Low Visit Compliance', desc: 'Only 62% of planned customer visits completed this week across zones.', severity: 'medium', icon: '📍' },
];

export const ZonePerformanceCard = ({ data }: { data: any }) => {
  const zones: ZoneItem[] = data?.zone_performance_mtd || data?.zone_performance || [];
  const visibleZones = zones.filter(item => {
    const zoneName = String(item.zone || item.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
    return zoneName !== 'ho' && zoneName !== 'head office';
  });
  const sorted = [...visibleZones].sort((a, b) =>
    (b.percentage ?? b.percent ?? b.pct ?? b.achievement_percentage ?? 0) -
    (a.percentage ?? a.percent ?? a.pct ?? a.achievement_percentage ?? 0),
  );

  if (!sorted.length) {
    return (
      <View style={styles.card}>
        <AppText size={13} color="#6b7280" align="center">No zone performance data available</AppText>
      </View>
    );
  }

  const topPercentage = Number(
    sorted[0]?.percentage ?? sorted[0]?.percent ?? sorted[0]?.pct ?? sorted[0]?.achievement_percentage ?? 0,
  );

  return (
    <View style={styles.card}>
      <>
          <View style={styles.topZone}>
            <View style={styles.icon}><AppText size={18}>🏆</AppText></View>
            <View style={{ flex: 1 }}>
              <AppText size={11} color="#6b7280" family="InterMedium">Top Performing Zone</AppText>
              <AppText size={14} color="#1f2437" family="InterSemiBold">
                {sorted[0]?.zone || sorted[0]?.name} Zone — {Math.round(topPercentage)}% MTD Achievement
              </AppText>
            </View>
          </View>
          {sorted.map((item, index) => {
            const percentage = Math.max(0, Number(item.percentage ?? item.percent ?? item.pct ?? item.achievement_percentage ?? 0));
            const barWidth = Math.min(100, percentage);
            return (
              <View key={`${item.zone || item.name}-${index}`} style={styles.zoneRow}>
                <View style={styles.rowBetween}>
                  <View style={styles.row}>
                    <View style={[styles.rank, index === 0 && styles.rankTop]}><AppText size={11} color="white" family="InterSemiBold">{index + 1}</AppText></View>
                    <AppText size={13} color="#1f2437" family="InterSemiBold">{item.zone || item.name}</AppText>
                  </View>
                  <AppText size={13} color={index === 0 ? '#1f8a4c' : '#3b478c'} family="InterSemiBold">{Math.round(percentage)}%</AppText>
                </View>
                <View style={styles.track}><View style={[styles.fill, { width: `${barWidth}%`, backgroundColor: index === 0 ? '#1f8a4c' : '#8b93ff' }]} /></View>
              </View>
            );
          })}
      </>
    </View>
  );
};

export const StatePerformanceCard = ({ data }: { data: any }) => {
  const states: StateItem[] = Array.isArray(data?.state_performance_mtd) ? data.state_performance_mtd : [];

  if (!states.length) {
    return (
      <View style={styles.card}>
        <AppText size={13} color="#6b7280" align="center">No state performance data available</AppText>
      </View>
    );
  }
  const topSalesValue = Number(states[0]?.sales_value || 0);

  return (
    <View style={styles.card}>
      <View style={styles.topZone}>
        <View style={styles.icon}><AppText size={18}>🏆</AppText></View>
        <View style={{ flex: 1 }}>
          <AppText size={11} color="#6b7280" family="InterMedium">Top Performing State</AppText>
          <AppText size={14} color="#1f2437" family="InterSemiBold">
            {states[0]?.state || states[0]?.name} — ₹{Number(states[0]?.sales_value_lacs || 0).toFixed(2)}L MTD Sales
          </AppText>
        </View>
      </View>

      {states.slice(0, 10).map((item, index) => {
        const percentage = Math.max(0, Number(item.percentage || 0));
        const relativePerformance = topSalesValue > 0
          ? (Number(item.sales_value || 0) / topSalesValue) * 100
          : 0;
        return (
          <View key={`${item.state || item.name}-${index}`} style={styles.zoneRow}>
            <View style={styles.rowBetween}>
              <View style={[styles.row, { flex: 1 }]}>
                <View style={[styles.rank, index === 0 && styles.rankTop]}>
                  <AppText size={11} color="white" family="InterSemiBold">{index + 1}</AppText>
                </View>
                <AppText size={13} color="#1f2437" family="InterSemiBold" style={{ flex: 1 }}>
                  {item.state || item.name}
                </AppText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <AppText size={13} color={index === 0 ? '#1f8a4c' : '#3b478c'} family="InterSemiBold">
                  ₹{Number(item.sales_value_lacs || 0).toFixed(2)}L
                </AppText>
                <AppText size={10} color="#8a8fa3">{percentage.toFixed(1)}% of MTD sales</AppText>
              </View>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.min(100, relativePerformance)}%`, backgroundColor: index === 0 ? '#1f8a4c' : '#8b93ff' }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
};

export const DashboardHighlights = ({ data }: { data: any }) => {
  const highlights: HighlightItem[] = data?.highlights?.length ? data.highlights : data?.dashboard_highlights?.length ? data.dashboard_highlights : STATIC_HIGHLIGHTS;
  return (
    <View>
      {highlights.map((item, index) => (
        <View key={`${item.title}-${index}`} style={styles.highlightCard}>
          <View style={[styles.icon, { backgroundColor: item.iconBg || '#0e9f8f' }]}><AppText size={16}>{item.icon || '↗'}</AppText></View>
          <View style={{ flex: 1 }}>
            {!!item.label && <AppText size={10} color="#8a8fa3" family="InterSemiBold">{item.label.toUpperCase()}</AppText>}
            <AppText size={14} color="#1f2437" family="InterSemiBold">{item.title}</AppText>
            <AppText size={12} color="#6b7280">{item.description || item.desc}</AppText>
          </View>
        </View>
      ))}
    </View>
  );
};

export const DashboardAlerts = ({ data, onAlertPress }: { data: any; onAlertPress?: (alert: AlertItem) => void }) => {
  const [showInactiveCustomers, setShowInactiveCustomers] = useState(false);
  const [inactiveCustomerTab, setInactiveCustomerTab] = useState<'primary' | 'secondary'>('primary');
  const highest = data?.mispunch_alert;
  const count = Number(highest?.count || 0);
  const zone = String(highest?.zone || '').replace(/\s+zone$/i, '').trim();
  const misPunchAlert: AlertItem = zone && count > 0
    ? {
        title: `High Mis Punch — ${zone} Zone`,
        desc: `${count} mis-punch${count === 1 ? '' : 'es'} recorded MTD, the highest among all zones. Needs immediate review.`,
        severity: 'high',
        icon: '⚠️',
        zone,
        type: highest?.status || 'not_punch_in',
        destination: 'attendance',
      }
    : {
        title: data ? 'No Mis Punches Recorded' : 'High Mis Punch',
        desc: data
          ? 'No missed punches have been recorded MTD across zones.'
          : 'Checking the latest attendance data by zone…',
        severity: data ? 'low' : 'high',
        icon: data ? '✓' : '⚠️',
      };

  const targetZones: ZoneItem[] = data?.zone_performance_mtd || data?.zone_performance || [];
  const laggingZone = targetZones
    .filter(item => {
      const name = String(item.zone || item.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
      return name !== 'ho' && name !== 'head office' && Number(item.target || 0) > 0;
    })
    .sort((a, b) =>
      Number(a.percentage ?? a.percent ?? a.pct ?? a.achievement_percentage ?? 0) -
      Number(b.percentage ?? b.percent ?? b.pct ?? b.achievement_percentage ?? 0),
    )[0];
  const laggingZoneName = String(laggingZone?.zone || laggingZone?.name || '').replace(/\s+zone$/i, '').trim();
  const laggingPercentage = Number(
    laggingZone?.percentage ?? laggingZone?.percent ?? laggingZone?.pct ?? laggingZone?.achievement_percentage ?? 0,
  );
  const laggingTargetAlert: AlertItem = laggingZoneName
    ? {
        title: `${laggingZoneName} Zone Lagging On Target`,
        desc: `Only ${Math.round(laggingPercentage)}% of the MTD target has been achieved — the lowest among all zones.`,
        severity: 'high',
        icon: '⚠️',
        zone: laggingZoneName,
        destination: 'target',
      }
    : {
        title: 'Target Performance Unavailable',
        desc: 'No eligible MTD zone target data is available.',
        severity: 'medium',
        icon: '!',
      };

  const inactiveCustomerData = data?.inactive_customers_30_days;
  const primaryInactiveCustomers: InactiveCustomer[] = Array.isArray(inactiveCustomerData?.primary?.customers)
    ? inactiveCustomerData.primary.customers
    : Array.isArray(inactiveCustomerData?.customers)
      ? inactiveCustomerData.customers
      : [];
  const secondaryInactiveCustomers: InactiveCustomer[] = Array.isArray(inactiveCustomerData?.secondary?.customers)
    ? inactiveCustomerData.secondary.customers
    : [];
  const primaryInactiveCount = Number(inactiveCustomerData?.primary?.count ?? primaryInactiveCustomers.length);
  const secondaryInactiveCount = Number(inactiveCustomerData?.secondary?.count ?? secondaryInactiveCustomers.length);
  const inactiveCustomerCount = Number(inactiveCustomerData?.count ?? primaryInactiveCount + secondaryInactiveCount);
  const visibleInactiveCustomers = inactiveCustomerTab === 'primary'
    ? primaryInactiveCustomers
    : secondaryInactiveCustomers;
  const visibleInactiveCount = inactiveCustomerTab === 'primary'
    ? primaryInactiveCount
    : secondaryInactiveCount;
  const inactiveCustomerAlert: AlertItem = {
    title: 'Inactive Customers Rising',
    desc: `${inactiveCustomerCount} customer${inactiveCustomerCount === 1 ? '' : 's'} did not place any order in the last 30 days${inactiveCustomerCount > 0 ? ' — tap to view.' : '.'}`,
    severity: inactiveCustomerCount > 0 ? 'medium' : 'low',
    icon: inactiveCustomerCount > 0 ? '🔴' : '✓',
    destination: 'inactive_customers',
  };

  const visitCompliance = data?.lowest_visit_compliance_mtd;
  const visitZone = String(visitCompliance?.zone || '').replace(/\s+zone$/i, '').trim();
  const plannedVisits = Number(visitCompliance?.planned_visits || 0);
  const completedVisits = Number(visitCompliance?.completed_visits || 0);
  const visitPercentage = Number(visitCompliance?.percentage || 0);
  const lowVisitComplianceAlert: AlertItem = visitZone && plannedVisits > 0
    ? {
        title: `Low Visit Compliance — ${visitZone} Zone`,
        desc: `${Math.round(visitPercentage)}% MTD compliance — ${completedVisits} of ${plannedVisits} planned customer visits completed, the lowest among all zones.`,
        severity: 'medium',
        icon: '📍',
        zone: visitZone,
        destination: 'user_activity',
      }
    : {
        title: 'Visit Compliance Unavailable',
        desc: 'No eligible MTD planned-visit data is available.',
        severity: 'low',
        icon: '📍',
      };

  const alerts: AlertItem[] = [
    misPunchAlert,
    laggingTargetAlert,
    inactiveCustomerAlert,
    STATIC_ALERTS[3],
    lowVisitComplianceAlert,
  ];
  return (
    <View>
      {alerts.map((item, index) => {
        const severity = item.severity || 'low';
        const color = severity === 'high' ? '#d5453f' : severity === 'medium' ? '#e0942f' : '#3b6fc9';
        const soft = severity === 'high' ? '#fbe7e6' : severity === 'medium' ? '#fbeedd' : '#e6eefb';
        const showsCustomerSheet = item.destination === 'inactive_customers';
        const isActionable = showsCustomerSheet || Boolean(item.zone && item.destination && onAlertPress);
        const AlertContainer: any = isActionable ? Pressable : View;
        return (
          <AlertContainer
            key={`${item.title}-${index}`}
            style={[styles.alertCard, { borderLeftColor: color }]}
            onPress={isActionable ? () => {
              if (showsCustomerSheet) {
                setInactiveCustomerTab('primary');
                setShowInactiveCustomers(true);
                return;
              }
              onAlertPress?.(item);
            } : undefined}
          >
            <View style={[styles.icon, { backgroundColor: soft }]}><AppText size={16}>{item.icon || '!'}</AppText></View>
            <View style={{ flex: 1 }}>
              <View style={styles.rowBetween}>
                <AppText size={13} color="#1f2437" family="InterSemiBold" style={{ flex: 1 }}>{item.title}</AppText>
                <View style={[styles.severity, { backgroundColor: soft }]}><AppText size={9} color={color} family="InterSemiBold">{severity.toUpperCase()}</AppText></View>
              </View>
              <AppText size={12} color="#6b7280">{item.description || item.desc}</AppText>
            </View>
          </AlertContainer>
        );
      })}

      <Modal
        visible={showInactiveCustomers}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowInactiveCustomers(false)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowInactiveCustomers(false)} />
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <AppText size={18} color="#1f2437" family="InterBold">Inactive Customers</AppText>
                <AppText size={12} color="#6b7280">No orders placed in the last 30 days</AppText>
              </View>
              <Pressable style={styles.sheetClose} onPress={() => setShowInactiveCustomers(false)}>
                <AppText size={18} color="#4b5563">✕</AppText>
              </Pressable>
            </View>

            <View style={styles.customerTabs}>
              {(['primary', 'secondary'] as const).map(tab => {
                const selected = inactiveCustomerTab === tab;
                const tabCount = tab === 'primary' ? primaryInactiveCount : secondaryInactiveCount;
                return (
                  <Pressable
                    key={tab}
                    style={[styles.customerTab, selected && styles.customerTabActive]}
                    onPress={() => setInactiveCustomerTab(tab)}
                  >
                    <AppText size={13} color={selected ? '#fff' : '#4a4ab0'} family="InterSemiBold">
                      {tab === 'primary' ? 'Primary' : 'Secondary'} ({tabCount})
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.sheetCount}>
              <AppText size={12} color="#b5473e" family="InterSemiBold">
                {visibleInactiveCount} CUSTOMER{visibleInactiveCount === 1 ? '' : 'S'}
              </AppText>
            </View>

            <FlatList
              style={styles.customerScroll}
              data={visibleInactiveCustomers}
              keyExtractor={(customer, index) => `${customer.id || customer.name}-${index}`}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.customerList}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              renderItem={({ item: customer, index }) => (
                <View style={styles.customerRow}>
                  <View style={styles.customerNumber}>
                    <AppText size={12} color="#4a4ab0" family="InterSemiBold">{index + 1}</AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText size={14} color="#1f2437" family="InterMedium">
                      {customer.name || 'Unnamed customer'}
                    </AppText>
                    <AppText size={12} color="#6b7280">
                      {customer.mobile || 'Mobile number unavailable'}
                    </AppText>
                  </View>
                </View>
              )}
              ListEmptyComponent={(
                <AppText size={13} color="#6b7280" align="center">No inactive customers found.</AppText>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { marginHorizontal: rw(19), marginTop: rw(12), backgroundColor: 'white', borderRadius: 16, padding: rw(18), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 },
  topZone: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#e6f6ec', borderRadius: 12, padding: 12, marginBottom: 18 },
  icon: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  zoneRow: { marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rank: { width: 22, height: 22, borderRadius: 7, backgroundColor: '#8b93ff', alignItems: 'center', justifyContent: 'center' },
  rankTop: { backgroundColor: '#1f8a4c' },
  track: { height: 6, borderRadius: 99, backgroundColor: '#e3e5ee', marginTop: 7, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99 },
  highlightCard: { marginHorizontal: rw(19), marginTop: rw(10), backgroundColor: 'white', borderRadius: 14, padding: 14, flexDirection: 'row', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  alertCard: { marginHorizontal: rw(19), marginTop: rw(10), backgroundColor: 'white', borderRadius: 12, padding: 14, borderLeftWidth: 4, flexDirection: 'row', gap: 12 },
  severity: { borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2, marginLeft: 8 },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheetContainer: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: rw(19), paddingTop: 10, paddingBottom: 28, height: '72%' },
  sheetHandle: { width: 42, height: 4, borderRadius: 99, backgroundColor: '#d3d5df', alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f2f6', alignItems: 'center', justifyContent: 'center' },
  sheetCount: { alignSelf: 'flex-start', backgroundColor: '#fbe7e6', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, marginTop: 14 },
  customerTabs: { flexDirection: 'row', backgroundColor: '#eef0f8', borderRadius: 12, padding: 4, marginTop: 16 },
  customerTab: { flex: 1, borderRadius: 9, paddingVertical: 9, alignItems: 'center', justifyContent: 'center' },
  customerTabActive: { backgroundColor: '#4a4ab0' },
  customerScroll: { flex: 1, marginTop: 4 },
  customerList: { paddingTop: 10, paddingBottom: 12 },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eceef4' },
  customerNumber: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#e8eaf7', alignItems: 'center', justifyContent: 'center' },
});
