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
import { formatShortNumber } from '../../utils/misc';

type Period = 'MTD' | 'YTD';
type FilterKey = 'state' | 'user';
type DateFilterKey = 'months' | 'year' | 'financialYear';
type FilterItem = { id?: number | string; name: string };
type DealerRow = {
  dealer: string;
  city: string;
  state: string;
  sales_value: number;
  last_year_sales_value: number;
  growth_percentage: number;
};
type DealerSection = {
  title: string;
  total: number;
  lastYearTotal: number;
  growthPercentage: number;
  data: DealerRow[];
};

const API_BASE = 'https://duke.fieldkonnect.in/api';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const now = new Date();
const currentYear = now.getFullYear();
const currentFinancialYearStart = now.getMonth() >= 3 ? currentYear : currentYear - 1;
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, index) => currentYear - index);
const FINANCIAL_YEAR_OPTIONS = Array.from(
  { length: 6 },
  (_, index) => `${currentFinancialYearStart - index}-${currentFinancialYearStart - index + 1}`,
);
const COLUMN_WIDTHS = [240, 170, 180, 230, 210, 130];
const TABLE_WIDTH = COLUMN_WIDTHS.reduce((sum, width) => sum + width, 0);

const DealerDistributorPerformanceViewAllScreen = ({ navigation }: any) => {
  const [period, setPeriod] = useState<Period>('YTD');
  const [sections, setSections] = useState<DealerSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<FilterKey | null>(null);
  const [activeDateModal, setActiveDateModal] = useState<DateFilterKey | null>(null);
  const [selectedMonths, setSelectedMonths] = useState([MONTHS[now.getMonth()]]);
  const [draftMonths, setDraftMonths] = useState([MONTHS[now.getMonth()]]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState(FINANCIAL_YEAR_OPTIONS[0]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<{ state: string; user: number | string | null }>({
    state: '',
    user: null,
  });
  const [filterData, setFilterData] = useState<{ states: FilterItem[]; users: FilterItem[] }>({
    states: [],
    users: [],
  });

  useEffect(() => {
    const fetchPerformance = async () => {
      const token = store.getState()?.auth?.token;
      const params = [`period=${period.toLowerCase()}`];
      if (period === 'MTD') {
        selectedMonths.forEach(month => params.push(`months[]=${month}`));
        params.push(`year=${selectedYear}`);
      } else {
        params.push(`financial_year=${encodeURIComponent(selectedFinancialYear)}`);
      }
      if (filters.state) params.push(`state=${encodeURIComponent(filters.state)}`);
      if (filters.user != null) params.push(`user_id=${encodeURIComponent(String(filters.user))}`);

      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/sales/dealer-distributor-performance?${params.join('&')}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        const json = await response.json();
        if (!response.ok || !json?.success) throw new Error(json?.message || 'Unable to load data');
        setSections((json.data?.states || []).map((state: any) => ({
          title: state.state || 'Unassigned',
          total: Number(state.total_sales_value) || 0,
          lastYearTotal: Number(state.total_last_year_sales_value) || 0,
          growthPercentage: Number(state.growth_percentage) || 0,
          data: state.dealers || [],
        })));
        setFilterData({
          states: json.data?.filters?.states || [],
          users: json.data?.filters?.users || [],
        });
      } catch (error: any) {
        setSections([]);
        Toast.show({ type: 'error', text1: 'Unable to load dealer performance', text2: error?.message });
      } finally {
        setLoading(false);
      }
    };
    fetchPerformance();
  }, [filters, period, selectedFinancialYear, selectedMonths, selectedYear]);

  const modalItems = activeModal ? filterData[`${activeModal}s` as 'states' | 'users'] : [];
  const visibleModalItems = modalItems.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
  const selectedUserName = filterData.users.find(user => user.id === filters.user)?.name || 'User';

  const selectFilter = (item: FilterItem) => {
    setFilters(current => ({
      ...current,
      [activeModal as FilterKey]: activeModal === 'user' ? item.id ?? null : item.name,
    }));
    setActiveModal(null);
  };

  const toggleMonth = (month: string) => {
    setDraftMonths(current => current.includes(month)
      ? (current.length === 1 ? current : current.filter(item => item !== month))
      : MONTHS.filter(item => [...current, month].includes(item)));
  };

  const renderRow = (values: React.ReactNode[], rowStyle?: object) => (
    <View style={[styles.tableRow, rowStyle]}>
      {values.map((value, index) => (
        <View key={index} style={[styles.cell, { width: COLUMN_WIDTHS[index] }]}>
          {typeof value === 'string' || typeof value === 'number'
            ? <AppText size={13} color="#25283a">{value}</AppText>
            : value}
        </View>
      ))}
    </View>
  );

  const growthText = (value: number) => {
    const growth = Number(value) || 0;
    return (
      <AppText
        size={13}
        family="InterSemiBold"
        color={growth > 0 ? '#16803c' : growth < 0 ? '#d12f2f' : '#6b7280'}
      >
        {growth > 0 ? '+' : ''}{growth.toFixed(2)}%
      </AppText>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Image source={require('../../assets/images/Dummy/back.png')} style={styles.backImage} />
        </Pressable>
        <AppText size={14} color="#cdd1ed">Dealer / Distributor</AppText>
        <AppText size={25} color={colors.white} family="InterBold">Sales Performance</AppText>
      </View>

      <View style={styles.filters}>
        {(['state', 'user'] as FilterKey[]).map(key => (
          <Pressable key={key} style={styles.filterButton} onPress={() => {
            setSearch('');
            setActiveModal(key);
          }}>
            <AppText size={13} family="InterSemiBold" color="#25283a">
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </AppText>
            <Image source={require('../../assets/images/Dummy/downarrow.png')} style={styles.downArrow} />
          </Pressable>
        ))}
      </View>

      <View style={styles.chips}>
        {filters.state ? <FilterChip label={filters.state} onRemove={() => setFilters(v => ({ ...v, state: '' }))} /> : null}
        {filters.user != null ? <FilterChip label={selectedUserName} onRemove={() => setFilters(v => ({ ...v, user: null }))} /> : null}
      </View>

      <View style={styles.periodTabs}>
        {(['YTD', 'MTD'] as Period[]).map(item => (
          <Pressable key={item} style={[styles.periodTab, period === item && styles.activePeriodTab]}
            onPress={() => setPeriod(item)}>
            <AppText size={14} family="InterBold" color={period === item ? '#fff' : '#8990a5'}>{item}</AppText>
          </Pressable>
        ))}
      </View>

      <View style={styles.dateFilters}>
        {period === 'MTD' ? (
          <>
            <DateFilterButton label="Month" value={selectedMonths.join(', ')} onPress={() => {
              setDraftMonths(selectedMonths);
              setActiveDateModal('months');
            }} />
            <DateFilterButton label="Year" value={String(selectedYear)} onPress={() => setActiveDateModal('year')} />
          </>
        ) : (
          <DateFilterButton label="Financial Year" value={selectedFinancialYear}
            onPress={() => setActiveDateModal('financialYear')} />
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          {renderRow([
            'Dealer / Distributor', 'City', 'State', 'CY Sale', 'LY Sale', 'Growth',
          ].map(header => (
            <AppText numLines={1} size={13} family="InterBold" color="#fff">{header}</AppText>
          )), styles.tableHeader)}
          {loading ? <ActivityIndicator style={styles.loader} color={colors.blue} size="large" /> : (
            <SectionList
              sections={sections}
              keyExtractor={(item, index) => `${item.dealer}-${item.city}-${item.state}-${index}`}
              stickySectionHeadersEnabled={false}
              ListEmptyComponent={<AppText style={styles.empty}>No dealer/distributor sales data available</AppText>}
              renderSectionHeader={({ section }) => (
                <AppText style={styles.stateHeader}>State - {section.title}</AppText>
              )}
              renderItem={({ item, index }) => renderRow([
                item.dealer || '-', item.city || '-', item.state || '-',
                `₹${formatShortNumber(Number(item.sales_value) || 0)}`,
                `₹${formatShortNumber(Number(item.last_year_sales_value) || 0)}`,
                growthText(item.growth_percentage),
              ], index % 2 ? styles.alternateRow : undefined)}
              renderSectionFooter={({ section }) => renderRow([
                `${section.title} total`, '', '', `₹${formatShortNumber(section.total)}`,
                `₹${formatShortNumber(section.lastYearTotal)}`,
                growthText(section.growthPercentage),
              ], styles.totalRow)}
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
          <TextInput value={search} onChangeText={setSearch} placeholder="Search..."
            placeholderTextColor="#999" style={styles.searchInput} />
          <ScrollView>{visibleModalItems.map((item, index) => (
            <Pressable key={String(item.id ?? item.name ?? index)} style={styles.modalRow} onPress={() => selectFilter(item)}>
              <Text style={styles.modalText}>{item.name}</Text>
            </Pressable>
          ))}</ScrollView>
        </View></View>
      </Modal>

      <Modal visible={activeDateModal != null} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.modalOverlay}><View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <AppText size={18} family="InterBold">
              Select {activeDateModal === 'financialYear' ? 'Financial Year' : activeDateModal === 'months' ? 'Months' : 'Year'}
            </AppText>
            <Pressable onPress={() => setActiveDateModal(null)}><AppText size={18}>✕</AppText></Pressable>
          </View>
          <ScrollView>
            {activeDateModal === 'months' && MONTHS.map(month => (
              <Pressable key={month} style={styles.modalRow} onPress={() => toggleMonth(month)}>
                <Text style={styles.modalText}>{month}</Text>
                <Text style={[styles.checkmark, draftMonths.includes(month) && styles.selectedCheckmark]}>
                  {draftMonths.includes(month) ? '✓' : ''}
                </Text>
              </Pressable>
            ))}
            {activeDateModal === 'year' && YEAR_OPTIONS.map(year => (
              <Pressable key={year} style={styles.modalRow} onPress={() => {
                setSelectedYear(year); setActiveDateModal(null);
              }}><Text style={styles.modalText}>{year}</Text></Pressable>
            ))}
            {activeDateModal === 'financialYear' && FINANCIAL_YEAR_OPTIONS.map(year => (
              <Pressable key={year} style={styles.modalRow} onPress={() => {
                setSelectedFinancialYear(year); setActiveDateModal(null);
              }}><Text style={styles.modalText}>{year}</Text></Pressable>
            ))}
          </ScrollView>
          {activeDateModal === 'months' ? (
            <Pressable style={styles.doneButton} onPress={() => {
              setSelectedMonths(draftMonths); setActiveDateModal(null);
            }}><AppText size={14} family="InterBold" color="#fff">Apply</AppText></Pressable>
          ) : null}
        </View></View>
      </Modal>
    </View>
  );
};

const FilterChip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <Pressable style={styles.chip} onPress={onRemove}><AppText size={12}>{label} ✕</AppText></Pressable>
);
const DateFilterButton = ({ label, value, onPress }: { label: string; value: string; onPress: () => void }) => (
  <Pressable style={styles.dateFilterButton} onPress={onPress}>
    <View style={styles.dateFilterText}>
      <AppText size={11} color="#8990a5">{label}</AppText>
      <AppText size={13} family="InterSemiBold" color="#25283a">{value}</AppText>
    </View>
    <Image source={require('../../assets/images/Dummy/downarrow.png')} style={styles.downArrow} />
  </Pressable>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fb' },
  header: { backgroundColor: colors.blue, paddingHorizontal: 16, paddingTop: 48, paddingBottom: 18 },
  backBtn: { marginBottom: 12, width: 32 },
  backImage: { width: 22, height: 22, resizeMode: 'contain' },
  filters: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14, gap: 10 },
  filterButton: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#fff', borderWidth: 1,
    borderColor: '#e4e6ee', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10 },
  downArrow: { width: 12, height: 7, resizeMode: 'contain' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 8, gap: 6 },
  chip: { backgroundColor: '#e8eaf7', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  periodTabs: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, backgroundColor: '#eef0f7', borderRadius: 22, padding: 3 },
  periodTab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 20 },
  activePeriodTab: { backgroundColor: colors.blue },
  dateFilters: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  dateFilterButton: { flex: 1, minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e4e6ee', borderRadius: 12, paddingHorizontal: 14 },
  dateFilterText: { flex: 1, gap: 2 },
  tableRow: { flexDirection: 'row', minHeight: 48, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eceef4' },
  tableHeader: { minHeight: 52, backgroundColor: colors.blue },
  cell: { justifyContent: 'center', paddingHorizontal: 14 },
  alternateRow: { backgroundColor: '#fafaff' },
  stateHeader: { width: TABLE_WIDTH, padding: 13, backgroundColor: '#e6e8f6', color: '#39488f', fontFamily: fonts.InterBold },
  totalRow: { backgroundColor: '#eef0fb' },
  loader: { marginTop: 50 },
  empty: { width: 500, padding: 30, textAlign: 'center', color: '#777' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  searchInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10,
    color: '#111', fontFamily: fonts.InterRegular, marginBottom: 10 },
  modalRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalText: { color: '#222', fontFamily: fonts.InterRegular },
  checkmark: { width: 24, textAlign: 'center', color: '#fff', fontFamily: fonts.InterBold },
  selectedCheckmark: { color: colors.blue },
  doneButton: { marginTop: 14, backgroundColor: colors.blue, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
});

export default DealerDistributorPerformanceViewAllScreen;
