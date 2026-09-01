import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import AppText from '../../components/AppText/AppText';
import { getMyCallHistoryApi } from '../../api/query/LeadApi';
import { colors } from '../../utils/Colors';
import { fonts } from '../../utils/typography';

const periods = [
  { label: 'Today', value: 'today' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

const durationLabel = (seconds: number) => {
  const value = Number(seconds || 0);
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = value % 60;
  return hours ? `${hours}h ${minutes}m` : minutes ? `${minutes}m ${secs}s` : `${secs}s`;
};

const dateLabel = (value?: string) => value
  ? new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  : '-';

const CallHistory = ({ navigation }: any) => {
  const [period, setPeriod] = useState('today');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'not_connected'>('all');
  const [logs, setLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState({ attempts: 0, connected: 0, not_connected: 0, duration: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getMyCallHistoryApi({ period, search: debouncedSearch });
      setLogs(response?.data?.data || []);
      setSummary(response?.data?.summary || { attempts: 0, connected: 0, not_connected: 0, duration: 0 });
    } catch (error: any) {
      Alert.alert('Unable to load calls', error?.response?.data?.message || 'Please try again.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, period]);

  useFocusEffect(useCallback(() => { loadHistory(); }, [loadHistory]));

  const visibleLogs = useMemo(() => logs.filter(item => {
    if (statusFilter === 'connected') return item.connected;
    if (statusFilter === 'not_connected') return !item.connected;
    return true;
  }), [logs, statusFilter]);

  const playRecording = (url?: string) => {
    if (!url) return;
    Linking.openURL(url).catch(() => Alert.alert('Playback failed', 'Unable to open this recording.'));
  };

  return (
    <View style={styles.screen}>
      <View style={styles.fixedContent}>
        <View style={styles.periodRow}>
          {periods.map(item => (
            <Pressable key={item.value} style={[styles.periodButton, period === item.value && styles.periodButtonActive]} onPress={() => setPeriod(item.value)}>
              <AppText size={13} color={period === item.value ? 'white' : '#66728D'} family="InterBold">{item.label}</AppText>
            </Pressable>
          ))}
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryRow}>
            <Summary label="Attempts" value={summary.attempts} color="#15213A" />
            <Summary label="Connected" value={summary.connected} color="#12B981" />
          </View>
          <View style={styles.summaryRow}>
            <Summary label="Not Connected" value={summary.not_connected} color="#F05268" />
            <Summary label="Duration" value={durationLabel(summary.duration)} color={colors.blue} />
          </View>
        </View>

        <View style={styles.searchBox}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M21 21l-4.35-4.35m2.35-5.65a8 8 0 11-16 0 8 8 0 0116 0z" stroke="#75819A" strokeWidth={2} strokeLinecap="round" /></Svg>
          <TextInput value={search} onChangeText={setSearch} placeholder="Search call records" placeholderTextColor="#8B95A9" style={styles.searchInput} />
        </View>

        <View style={styles.filterRow}>
          {[['all', 'All'], ['connected', 'Connected'], ['not_connected', 'Not Connected']].map(([value, label]) => (
            <Pressable key={value} style={[styles.filterChip, statusFilter === value && styles.filterChipActive]} onPress={() => setStatusFilter(value as any)}>
              <AppText size={12} color={statusFilter === value ? colors.blue : '#75819A'} family="InterBold">{label}</AppText>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {loading ? <ActivityIndicator size="large" color={colors.blue} style={styles.loader} /> : visibleLogs.length ? visibleLogs.map(item => (
          <View key={item.id} style={styles.callCard}>
            <View style={styles.callTopRow}>
              <View style={styles.nameRow}><PhoneIcon color={colors.blue} /><AppText size={16} color="#15213A" family="InterBold" numLines={1}>{item.customer_name}</AppText></View>
              <View style={[styles.statusBadge, item.connected ? styles.connectedBadge : styles.notConnectedBadge]}>
                <AppText size={11} color={item.connected ? '#07865E' : '#C73C52'} family="InterBold">{item.connected ? 'CONNECTED' : 'NOT CONNECTED'}</AppText>
              </View>
            </View>
            <AppText size={13} color="#75819A" family="InterMedium" style={styles.meta}>{dateLabel(item.started_at)}  ·  {durationLabel(item.duration)}</AppText>
            <AppText size={13} color="#56627B" family="InterMedium" style={styles.company}>{item.company_name || item.number}</AppText>
            {item.remark ? <AppText size={14} color="#52617C" family="InterMedium" style={styles.remark}>{item.remark}</AppText> : null}
            {item.recording_play_url ? (
              <Pressable style={styles.player} onPress={() => playRecording(item.recording_play_url)}>
                <View style={styles.playCircle}><AppText size={13} color="white" family="InterBold">▶</AppText></View>
                <View style={styles.wave}><View style={styles.waveLine} /><View style={[styles.waveLine, { height: 18 }]} /><View style={styles.waveLine} /><View style={[styles.waveLine, { height: 22 }]} /><View style={styles.waveLine} /></View>
                <AppText size={12} color="#75819A" family="InterSemiBold">{durationLabel(item.duration)}</AppText>
              </Pressable>
            ) : <View style={styles.noRecording}><AppText size={12} color="#8B95A9" family="InterMedium">No recording available</AppText></View>}
            {item.lead_id ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`View details for ${item.customer_name}`}
                style={styles.viewDetails}
                onPress={() => navigation.navigate('CallDetails', { call: item })}
              >
                <AppText size={14} color={colors.blue} family="InterBold">View Customer Details</AppText>
                <AppText size={22} color={colors.blue} family="InterMedium">›</AppText>
              </Pressable>
            ) : null}
          </View>
        )) : <View style={styles.empty}><AppText size={15} color="#75819A" family="InterMedium">No call records found</AppText></View>}
      </ScrollView>
    </View>
  );
};

const PhoneIcon = ({ color }: { color: string }) => <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M6.62 10.79a15.46 15.46 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" fill={color} /></Svg>;

const Summary = ({ label, value, color }: any) => <View style={styles.summaryCard}><AppText size={21} color={color} family="InterBold">{value}</AppText><AppText size={11} color="#7A859C" family="InterBold" style={styles.summaryText}>{label.toUpperCase()}</AppText></View>;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F6FB' },
  fixedContent: { backgroundColor: '#F3F6FB', paddingHorizontal: 16, paddingTop: 12, borderBottomWidth: 1, borderBottomColor: '#DFE7F2' },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 36 },
  periodRow: { flexDirection: 'row', gap: 8 }, periodButton: { flex: 1, height: 38, borderRadius: 12, borderWidth: 1, borderColor: '#D9E2F1', backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }, periodButtonActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  summaryGrid: { gap: 8, marginTop: 10 }, summaryRow: { flexDirection: 'row', gap: 8 }, summaryCard: { flex: 1, height: 70, borderRadius: 14, borderWidth: 1, borderColor: '#D9E4F3', backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }, summaryText: { marginTop: 2, letterSpacing: .5, textAlign: 'center' },
  searchBox: { height: 44, marginTop: 10, borderRadius: 12, borderWidth: 1, borderColor: '#D9E4F3', backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 9 }, searchInput: { flex: 1, color: '#15213A', fontFamily: fonts.InterMedium, fontSize: 14, paddingVertical: 0 },
  filterRow: { flexDirection: 'row', gap: 7, marginTop: 9, marginBottom: 10 }, filterChip: { flex: 1, alignItems: 'center', paddingHorizontal: 7, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: '#D9E4F3', backgroundColor: 'white' }, filterChipActive: { borderColor: colors.blue, backgroundColor: '#EAF3FF' },
  loader: { marginTop: 60 }, callCard: { borderRadius: 16, borderWidth: 1, borderColor: '#D8E4F4', backgroundColor: 'white', padding: 12, marginBottom: 8 },
  callTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, nameRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 14, borderWidth: 1 }, connectedBadge: { backgroundColor: '#E7F9F3', borderColor: '#8CDEC4' }, notConnectedBadge: { backgroundColor: '#FFF0F2', borderColor: '#F5B0BB' },
  meta: { marginTop: 8 }, company: { marginTop: 5 }, remark: { marginTop: 9, lineHeight: 19 }, player: { height: 46, borderRadius: 13, backgroundColor: '#EDF4FE', marginTop: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  playCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', paddingLeft: 2 }, wave: { flex: 1, height: 24, flexDirection: 'row', alignItems: 'center', gap: 4 }, waveLine: { width: 3, height: 12, borderRadius: 2, backgroundColor: '#74A9E9' },
  noRecording: { height: 40, borderRadius: 12, backgroundColor: '#F4F6F9', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  viewDetails: { minHeight: 40, marginTop: 9, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E0E8F4', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 7 },
  empty: { minHeight: 180, alignItems: 'center', justifyContent: 'center' },
});

export default CallHistory;
