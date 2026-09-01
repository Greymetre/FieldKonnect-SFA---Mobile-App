import { BASE_URL } from '../../api/AxiosClient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  SectionList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AppText from '../../components/AppText/AppText';
import store from '../../components/redux/Store';
import Toast from 'react-native-toast-message';
import { colors } from '../../utils/Colors';
import { fonts } from '../../utils/typography';

type Period = 'today' | 'mtd' | 'ytd';
type FilterKey = 'zone' | 'user' | 'type';
type FilterItem = { id?: number | string; name: string };
type ActivityCounts = Record<string, number>;
type ActivityRow = { id: number; name: string; activities: ActivityCounts; total: number };
type ActivitySection = { title: string; data: ActivityRow[] };

const API_URL = `${BASE_URL}api/attendance/promotional-activities-report`;
const ACTIVITY_COLUMNS = [
  { key: 'mechanic_meet', label: 'Mech\nmeet' },
  { key: 'borer_meet', label: 'Borer\nmeet' },
  { key: 'retailer_meet', label: 'Retailer\nmeet' },
  { key: 'tractor_show', label: 'Tractor\nshow' },
  { key: 'promotional_item_distribution', label: 'Promo\nitem' },
  { key: 'dealer_board', label: 'Dealer\nboard' },
  { key: 'wall_painting', label: 'Wall\npaint' },
  { key: 'dealer_factory_visit', label: 'Factory\nvisit' },
];
const EMPLOYEE_WIDTH = 210;
const VALUE_WIDTH = 100;
const TABLE_WIDTH = EMPLOYEE_WIDTH + (ACTIVITY_COLUMNS.length + 1) * VALUE_WIDTH;

const PromotionalActivitiesViewAllScreen = ({ navigation }: any) => {
  const [period, setPeriod] = useState<Period>('today');
  const [sections, setSections] = useState<ActivitySection[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<FilterKey | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{ zone: string; user: number | string | null; type: string }>({
    zone: '', user: null, type: '',
  });
  const [filterData, setFilterData] = useState<{ zones: FilterItem[]; users: FilterItem[]; types: FilterItem[] }>({
    zones: [], users: [], types: [],
  });

  useEffect(() => {
    const fetchReport = async () => {
      const token = store.getState()?.auth?.token;
      const params = [`period=${period}`];
      if (filters.zone) params.push(`zone=${encodeURIComponent(filters.zone)}`);
      if (filters.user != null) params.push(`user_id=${encodeURIComponent(String(filters.user))}`);
      if (filters.type) params.push(`type=${encodeURIComponent(filters.type)}`);
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}?${params.join('&')}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        const json = await response.json();
        if (!response.ok || !json?.success) throw new Error(json?.message || 'Unable to load data');
        setSections((json.data?.zones || []).map((zone: any) => ({
          title: zone.zone || 'Unassigned',
          data: zone.users || [],
        })));
        setFilterData({
          zones: (json.data?.filters?.zones || []).map((zone: string) => ({ name: zone })),
          users: json.data?.filters?.users || [],
          types: json.data?.filters?.types || [],
        });
      } catch (error: any) {
        setSections([]);
        Toast.show({ type: 'error', text1: 'Unable to load promotional activities', text2: error?.message });
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [filters, period]);

  const modalItems = activeModal ? filterData[`${activeModal}s` as keyof typeof filterData] : [];
  const visibleModalItems = modalItems.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
  const selectedUserName = filterData.users.find(item => item.id === filters.user)?.name || 'User';
  const selectedTypeName = filterData.types.find(item => item.id === filters.type)?.name || 'Type';

  const selectFilter = (item: FilterItem) => {
    setFilters(current => ({
      ...current,
      [activeModal as FilterKey]: activeModal === 'zone' ? item.name : item.id ?? '',
    }));
    setActiveModal(null);
  };

  const totalsFor = (rows: ActivityRow[]) => {
    const activities = ACTIVITY_COLUMNS.reduce<ActivityCounts>((total, column) => {
      total[column.key] = rows.reduce((sum, row) => sum + (Number(row.activities?.[column.key]) || 0), 0);
      return total;
    }, {});
    return { activities, total: Object.values(activities).reduce((sum, value) => sum + value, 0) };
  };

  const renderRow = (row: ActivityRow, alternate = false) => (
    <View style={[styles.tableRow, alternate && styles.alternateRow]}>
      <View style={[styles.cell, { width: EMPLOYEE_WIDTH }]}><AppText size={13}>{row.name}</AppText></View>
      {ACTIVITY_COLUMNS.map(column => (
        <View key={column.key} style={[styles.cell, styles.numberCell]}>
          <AppText size={13}>{Number(row.activities?.[column.key]) || 0}</AppText>
        </View>
      ))}
      <View style={[styles.cell, styles.numberCell]}><AppText size={13} family="InterSemiBold">{row.total}</AppText></View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image source={require('../../assets/images/Dummy/back.png')} style={styles.backImage} />
        </Pressable>
        <AppText size={14} color="#cdd1ed">Promotional Activities</AppText>
        <AppText size={25} color="#fff" family="InterBold">Performance Report</AppText>
      </View>

      <View style={styles.filters}>
        {(['zone', 'user', 'type'] as FilterKey[]).map(key => (
          <Pressable key={key} style={styles.filterButton} onPress={() => { setSearch(''); setActiveModal(key); }}>
            <AppText size={13} family="InterSemiBold">{key.charAt(0).toUpperCase() + key.slice(1)}</AppText>
            <Image source={require('../../assets/images/Dummy/downarrow.png')} style={styles.downArrow} />
          </Pressable>
        ))}
      </View>
      <View style={styles.chips}>
        {filters.zone ? <FilterChip label={filters.zone} onRemove={() => setFilters(v => ({ ...v, zone: '' }))} /> : null}
        {filters.user != null ? <FilterChip label={selectedUserName} onRemove={() => setFilters(v => ({ ...v, user: null }))} /> : null}
        {filters.type ? <FilterChip label={selectedTypeName} onRemove={() => setFilters(v => ({ ...v, type: '' }))} /> : null}
      </View>

      <View style={styles.periodTabs}>
        {([
          ['today', 'Today'], ['mtd', 'MTD'], ['ytd', 'YTD'],
        ] as Array<[Period, string]>).map(([value, label]) => (
          <Pressable key={value} style={[styles.periodTab, period === value && styles.activePeriodTab]}
            onPress={() => setPeriod(value)}>
            <AppText size={14} family="InterBold" color={period === value ? '#fff' : '#8990a5'}>{label}</AppText>
          </Pressable>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          <View style={styles.tableHeader}>
            <View style={[styles.headerCell, { width: EMPLOYEE_WIDTH }]}><AppText color="#fff" family="InterBold">Employee</AppText></View>
            {ACTIVITY_COLUMNS.map(column => (
              <View key={column.key} style={[styles.headerCell, styles.numberCell]}>
                <AppText align="center" color="#fff" family="InterBold" size={13}>{column.label}</AppText>
              </View>
            ))}
            <View style={[styles.headerCell, styles.numberCell]}><AppText color="#fff" family="InterBold">Total</AppText></View>
          </View>
          {loading ? <ActivityIndicator style={styles.loader} color={colors.blue} size="large" /> : (
            <SectionList
              sections={sections}
              keyExtractor={item => String(item.id)}
              stickySectionHeadersEnabled={false}
              ListEmptyComponent={<AppText style={styles.empty}>No promotional activity data available</AppText>}
              renderSectionHeader={({ section }) => <AppText style={styles.zoneHeader}>Zone - {section.title}</AppText>}
              renderItem={({ item, index }) => renderRow(item, index % 2 === 1)}
              renderSectionFooter={({ section }) => {
                const totals = totalsFor(section.data);
                return renderRow({ id: 0, name: `${section.title} total`, ...totals });
              }}
            />
          )}
        </View>
      </ScrollView>

      <Modal visible={activeModal != null} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.modalOverlay}><View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <AppText size={18} family="InterBold">Select {activeModal}</AppText>
            <Pressable onPress={() => setActiveModal(null)}><AppText size={18}>✕</AppText></Pressable>
          </View>
          <TextInput value={search} onChangeText={setSearch} placeholder="Search..." placeholderTextColor="#999" style={styles.searchInput} />
          <ScrollView>{visibleModalItems.map((item, index) => (
            <Pressable key={String(item.id ?? item.name ?? index)} style={styles.modalRow} onPress={() => selectFilter(item)}>
              <Text style={styles.modalText}>{item.name}</Text>
            </Pressable>
          ))}</ScrollView>
        </View></View>
      </Modal>
    </View>
  );
};

const FilterChip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <Pressable style={styles.chip} onPress={onRemove}><AppText size={12}>{label} ✕</AppText></Pressable>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fb' },
  header: { backgroundColor: colors.blue, paddingHorizontal: 16, paddingTop: 48, paddingBottom: 18 },
  backButton: { width: 32, marginBottom: 12 },
  backImage: { width: 22, height: 22, resizeMode: 'contain' },
  filters: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14, gap: 10 },
  filterButton: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#fff', borderWidth: 1,
    borderColor: '#e4e6ee', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10 },
  downArrow: { width: 12, height: 7, resizeMode: 'contain' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 8, gap: 6 },
  chip: { backgroundColor: '#e8eaf7', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  periodTabs: { flexDirection: 'row', margin: 16, backgroundColor: '#eef0f7', borderRadius: 22, padding: 3 },
  periodTab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 20 },
  activePeriodTab: { backgroundColor: colors.blue },
  tableHeader: { width: TABLE_WIDTH, minHeight: 72, flexDirection: 'row', backgroundColor: '#35538f' },
  headerCell: { justifyContent: 'center', paddingHorizontal: 14 },
  tableRow: { width: TABLE_WIDTH, minHeight: 48, flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eceef4' },
  alternateRow: { backgroundColor: '#fafaff' },
  cell: { justifyContent: 'center', paddingHorizontal: 14 },
  numberCell: { width: VALUE_WIDTH, alignItems: 'center' },
  zoneHeader: { width: TABLE_WIDTH, padding: 13, backgroundColor: '#e6e8f6', color: '#39488f', fontFamily: fonts.InterBold },
  loader: { marginTop: 50 },
  empty: { width: 500, padding: 30, textAlign: 'center', color: '#777' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  searchInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10,
    color: '#111', fontFamily: fonts.InterRegular, marginBottom: 10 },
  modalRow: { minHeight: 50, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalText: { color: '#222', fontFamily: fonts.InterRegular },
});

export default PromotionalActivitiesViewAllScreen;
