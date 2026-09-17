import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import AppText from '../../components/AppText/AppText';
import CustomerCalendar from '../../components/CustomCalendar/CalendarPopupView';
import IosDateRangePicker from '../../components/DatePicker/IosDateRangePicker';
import { getMyCallHistoryApi } from '../../api/query/LeadApi';
import { colors } from '../../utils/Colors';
import { fonts } from '../../utils/typography';

const PAGE_SIZE = 20;

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

const apiDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const shortDate = (date: Date) => date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const DIRECTION_FILTERS = [['', 'All Calls'], ['outbound', 'Outbound'], ['inbound', 'Inbound']];
const STATUS_FILTERS = [['all', 'All'], ['connected', 'Connected'], ['not_connected', 'Not Connected']];

const CallHistory = ({ navigation }: any) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'not_connected'>('all');
  const [direction, setDirection] = useState<'' | 'outbound' | 'inbound'>('');
  const [logs, setLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState({ attempts: 0, connected: 0, not_connected: 0, duration: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const requestRef = useRef(0);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDates, setShowDates] = useState(false);
  const [draftStart, setDraftStart] = useState<Date | null>(null);
  const [draftEnd, setDraftEnd] = useState<Date | null>(null);
  const [rangeType, setRangeType] = useState('custom');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  // All calls, newest first, loaded page by page. Filters are applied on the server.
  const loadHistory = useCallback(async (pageToLoad = 1) => {
    const requestId = ++requestRef.current;
    const firstPage = pageToLoad === 1;
    try {
      if (firstPage) setLoading(true); else setLoadingMore(true);
      const params: Record<string, any> = { period: 'all', search: debouncedSearch, page: pageToLoad, page_size: PAGE_SIZE };
      if (direction) params.direction = direction;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (startDate && endDate) {
        params.start_date = apiDate(startDate);
        params.end_date = apiDate(endDate);
      }
      const response = await getMyCallHistoryApi(params);
      if (requestId !== requestRef.current) return;
      const pageLogs = response?.data?.data || [];
      const pagination = response?.data?.pagination || {};
      setLogs(previous => (firstPage ? pageLogs : [...previous, ...pageLogs]));
      setPage(pageToLoad);
      setHasMore(Number(pagination.current_page || pageToLoad) < Number(pagination.last_page || 1));
      setTotal(Number(pagination.total ?? pageLogs.length));
      if (firstPage) setSummary(response?.data?.summary || { attempts: 0, connected: 0, not_connected: 0, duration: 0 });
    } catch (error: any) {
      if (requestId !== requestRef.current) return;
      Alert.alert('Unable to load calls', error?.response?.data?.message || 'Please try again.');
      if (firstPage) setLogs([]);
      setHasMore(false);
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [debouncedSearch, direction, endDate, startDate, statusFilter]);

  useFocusEffect(useCallback(() => { loadHistory(1); }, [loadHistory]));

  const loadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    loadHistory(page + 1);
  };

  const openDates = () => {
    setDraftStart(startDate);
    setDraftEnd(endDate);
    setShowDates(true);
  };

  const applyDates = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
    setShowDates(false);
  };

  const playRecording = (url?: string) => {
    if (!url) return;
    Linking.openURL(url).catch(() => Alert.alert('Playback failed', 'Unable to open this recording.'));
  };

  const hasDates = Boolean(startDate && endDate);

  const renderCall = ({ item }: any) => {
    const inbound = item.direction === 'inbound';
    return (
      <View style={styles.callCard}>
        <View style={styles.callTopRow}>
          <View style={[styles.callAvatar, inbound && styles.callAvatarInbound]}>
            <CallIcon type={inbound ? 'inbound' : 'outbound'} color={inbound ? '#7C3AED' : colors.blue} />
          </View>
          <View style={styles.callTitle}>
            <AppText size={15} color="#15213A" family="InterBold" numLines={1}>{item.customer_name}</AppText>
            <AppText size={12} color="#75819A" family="InterMedium" numLines={1} style={styles.callSubtitle}>{item.company_name || item.number}</AppText>
          </View>
          <View style={[styles.statusBadge, item.connected ? styles.connectedBadge : styles.notConnectedBadge]}>
            <View style={[styles.statusDot, { backgroundColor: item.connected ? '#12B981' : '#F05268' }]} />
            <AppText size={10} color={item.connected ? '#07865E' : '#C73C52'} family="InterBold">{item.connected ? 'CONNECTED' : 'MISSED'}</AppText>
          </View>
        </View>

        <View style={styles.metaRow}>
          <MetaPill icon="calendar" text={dateLabel(item.started_at)} />
          <MetaPill icon="clock" text={durationLabel(item.duration)} />
          <View style={[styles.directionPill, inbound && styles.directionPillInbound]}>
            <AppText size={11} color={inbound ? '#7C3AED' : colors.blue} family="InterBold">{inbound ? 'Inbound' : 'Outbound'}</AppText>
          </View>
        </View>

        {item.remark ? (
          <View style={styles.remarkBox}>
            <AppText size={13} color="#52617C" family="InterMedium" lineHeight={19}>{item.remark}</AppText>
          </View>
        ) : null}

        <View style={styles.cardActions}>
          <Pressable style={[styles.cardAction, !item.recording_play_url && styles.cardActionDisabled]} disabled={!item.recording_play_url} onPress={() => playRecording(item.recording_play_url)}>
            <CallIcon type="play" color={item.recording_play_url ? colors.blue : '#A7B0C0'} size={16} />
            <AppText size={13} color={item.recording_play_url ? colors.blue : '#A7B0C0'} family="InterBold">{item.recording_play_url ? 'Play Recording' : 'No Recording'}</AppText>
          </Pressable>
          {item.lead_id ? (
            <Pressable style={[styles.cardAction, styles.cardActionPrimary]} onPress={() => navigation.navigate('CallDetails', { call: item })}>
              <AppText size={13} color="white" family="InterBold">View Details</AppText>
              <AppText size={16} color="white" family="InterBold">›</AppText>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.fixedContent}>
        <View style={styles.summaryRow}>
          <Summary label="Calls" value={summary.attempts} color="#15213A" />
          <Summary label="Connected" value={summary.connected} color="#12B981" />
          <Summary label="Missed" value={summary.not_connected} color="#F05268" />
          <Summary label="Talk Time" value={durationLabel(summary.duration)} color={colors.blue} />
        </View>

        <View style={styles.searchBox}>
          <CallIcon type="search" color="#75819A" />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search by name, company or number" placeholderTextColor="#8B95A9" style={styles.searchInput} />
          {search ? <Pressable hitSlop={8} onPress={() => setSearch('')}><AppText size={18} color="#8B95A9">×</AppText></Pressable> : null}
        </View>

        <Pressable style={[styles.dateButton, hasDates && styles.dateButtonActive]} onPress={openDates}>
          <CallIcon type="calendar" color={hasDates ? colors.blue : '#75819A'} />
          <AppText size={13} color={hasDates ? '#15213A' : '#8B95A9'} family="InterSemiBold" style={{ flex: 1 }}>
            {hasDates ? `${shortDate(startDate as Date)}  –  ${shortDate(endDate as Date)}` : 'Select date range'}
          </AppText>
          {hasDates ? (
            <Pressable hitSlop={8} onPress={() => applyDates(null, null)}><AppText size={12} color={colors.blue} family="InterBold">Clear</AppText></Pressable>
          ) : <AppText size={16} color="#8B95A9">›</AppText>}
        </Pressable>

        <Segmented options={DIRECTION_FILTERS} value={direction} onChange={setDirection} />
        <Segmented options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
      </View>

      {loading ? <ActivityIndicator size="large" color={colors.blue} style={styles.loader} /> : (
        <FlatList
          data={logs}
          keyExtractor={item => String(item.id)}
          renderItem={renderCall}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={total ? <AppText size={12} color="#75819A" family="InterSemiBold" style={styles.listCount}>{logs.length < total ? `Showing ${logs.length} of ${total} calls` : `${total} ${total === 1 ? 'call' : 'calls'}`}</AppText> : null}
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={colors.blue} style={styles.loadMore} /> : null}
          ListEmptyComponent={(
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><CallIcon type="outbound" color={colors.blue} size={26} /></View>
              <AppText size={15} color="#15213A" family="InterBold">No call records found</AppText>
              <AppText size={13} color="#75819A" family="InterMedium" align="center">Try another date range or filter.</AppText>
            </View>
          )}
        />
      )}

      {Platform.OS === 'ios' ? (
        <Modal visible={showDates} transparent animationType="slide" onRequestClose={() => setShowDates(false)}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setShowDates(false)}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <View style={styles.sheetHandle} />
              <AppText size={18} color="#15213A" family="InterBold" style={styles.sheetTitle}>Select Date Range</AppText>
              <IosDateRangePicker startDate={draftStart} endDate={draftEnd} onChange={(start, end) => { setDraftStart(start); setDraftEnd(end); }} />
              <View style={styles.sheetActions}>
                <Pressable style={styles.sheetSecondary} onPress={() => applyDates(null, null)}><AppText size={14} color={colors.blue} family="InterBold">Clear</AppText></Pressable>
                <Pressable style={[styles.sheetPrimary, !(draftStart && draftEnd) && styles.cardActionDisabled]} disabled={!(draftStart && draftEnd)} onPress={() => applyDates(draftStart, draftEnd)}><AppText size={14} color="white" family="InterBold">Apply</AppText></Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : (
        <CustomerCalendar showCal={showDates} setShowCal={setShowDates} range={rangeType} setRange={setRangeType} minimumDate={null} initialStartDate={startDate} initialEndDate={endDate} onApplyClick={(start, end, type) => { setRangeType(type || 'custom'); applyDates(start, end); }} />
      )}
    </View>
  );
};

const Segmented = ({ options, value, onChange }: any) => (
  <View style={styles.segmented}>
    {options.map(([optionValue, label]: string[]) => {
      const active = value === optionValue;
      return (
        <Pressable key={optionValue || 'all'} style={[styles.segment, active && styles.segmentActive]} onPress={() => onChange(optionValue)}>
          <AppText size={12} color={active ? 'white' : '#5E6A82'} family="InterBold">{label}</AppText>
        </Pressable>
      );
    })}
  </View>
);

const MetaPill = ({ icon, text }: any) => (
  <View style={styles.metaPill}>
    <CallIcon type={icon} color="#75819A" size={13} />
    <AppText size={11} color="#5E6A82" family="InterSemiBold">{text}</AppText>
  </View>
);

const Summary = ({ label, value, color }: any) => (
  <View style={styles.summaryCard}>
    <AppText size={17} color={color} family="InterBold" numLines={1}>{value}</AppText>
    <AppText size={10} color="#7A859C" family="InterBold" style={styles.summaryText} numLines={1}>{label.toUpperCase()}</AppText>
  </View>
);

const CallIcon = ({ type, color, size = 18 }: { type: string; color: string; size?: number }) => {
  const line = { stroke: color, strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const handset = 'M7 3l3 4-2 2c1.5 3 3.5 5 7 7l2-2 4 3-1 3c-.4 1-1.5 1.5-2.5 1.2C9 18.5 5.5 15 2.8 6.5 2.5 5.5 3 4.4 4 4l3-1z';
  const icons: Record<string, React.ReactNode> = {
    outbound: <><Path d={handset} {...line} /><Path d="M15 3h6v6M21 3l-6 6" {...line} /></>,
    inbound: <><Path d={handset} {...line} /><Path d="M21 9h-6V3M15 9l6-6" {...line} /></>,
    search: <><Circle cx="11" cy="11" r="7" {...line} /><Path d="M20 20l-4-4" {...line} /></>,
    calendar: <><Rect x="3" y="5" width="18" height="16" rx="2" {...line} /><Path d="M7 3v4m10-4v4M3 10h18" {...line} /></>,
    clock: <><Circle cx="12" cy="12" r="9" {...line} /><Path d="M12 7v5l3 2" {...line} /></>,
    play: <Path d="M7 4l13 8-13 8V4z" fill={color} />,
  };
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">{icons[type]}</Svg>;
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F6FB' },
  fixedContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, gap: 10, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E3EAF4' },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryCard: { flex: 1, height: 62, paddingHorizontal: 4, borderRadius: 13, backgroundColor: '#F5F8FD', alignItems: 'center', justifyContent: 'center' },
  summaryText: { marginTop: 3, letterSpacing: 0.4 },
  searchBox: { height: 46, borderRadius: 12, borderWidth: 1, borderColor: '#DCE4F0', backgroundColor: '#F8FAFD', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 9 },
  searchInput: { flex: 1, color: '#15213A', fontFamily: fonts.InterMedium, fontSize: 14, paddingVertical: 0 },
  dateButton: { height: 46, borderRadius: 12, borderWidth: 1, borderColor: '#DCE4F0', backgroundColor: '#F8FAFD', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 9 },
  dateButtonActive: { borderColor: colors.blue + '66', backgroundColor: colors.blue + '0A' },
  segmented: { flexDirection: 'row', padding: 3, borderRadius: 12, backgroundColor: '#EEF2F8' },
  segment: { flex: 1, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: colors.blue },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 36, flexGrow: 1 },
  listCount: { marginBottom: 10 },
  loadMore: { marginVertical: 16 },
  loader: { marginTop: 60 },
  callCard: { marginBottom: 10, padding: 14, borderRadius: 16, backgroundColor: 'white', borderWidth: 1, borderColor: '#E3EAF4', elevation: 1, shadowColor: '#24446F', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  callTopRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  callAvatar: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#EAF1FD', alignItems: 'center', justifyContent: 'center' },
  callAvatarInbound: { backgroundColor: '#F1EAFE' },
  callTitle: { flex: 1, minWidth: 0 },
  callSubtitle: { marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10 },
  connectedBadge: { backgroundColor: '#E7F9F3' },
  notConnectedBadge: { backgroundColor: '#FFF0F2' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 12 },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: '#F3F6FB' },
  directionPill: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: '#EAF1FD' },
  directionPillInbound: { backgroundColor: '#F1EAFE' },
  remarkBox: { marginTop: 10, padding: 10, borderRadius: 10, backgroundColor: '#F8FAFD', borderLeftWidth: 3, borderLeftColor: colors.blue + '55' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  cardAction: { flex: 1, height: 40, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#EDF4FE' },
  cardActionPrimary: { backgroundColor: colors.blue },
  cardActionDisabled: { opacity: 0.55 },
  empty: { flex: 1, minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 30 },
  emptyIcon: { width: 56, height: 56, marginBottom: 4, borderRadius: 18, backgroundColor: '#EAF1FD', alignItems: 'center', justifyContent: 'center' },
  sheetBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20,27,43,0.5)' },
  sheet: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 34, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: 'white' },
  sheetHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#D5DCE7', marginBottom: 12 },
  sheetTitle: { marginBottom: 12 },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  sheetSecondary: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  sheetPrimary: { flex: 1.5, height: 48, borderRadius: 12, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
});

export default CallHistory;
