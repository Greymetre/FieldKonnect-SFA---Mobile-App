import { BASE_URL } from '../../api/AxiosClient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
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

type Period = 'MTD' | 'YTD';
type FilterKey = 'zone' | 'designation' | 'user';
type DateFilterKey = 'months' | 'year' | 'financialYear';

type FilterItem = {
  id?: number | string;
  name?: string;
  label?: string;
};

type SalesRow = {
  id: number | string;
  name: string;
  reporting: { id?: number | string; name: string; mobile?: string } | null;
  designation: string;
  working_days: number;
  total_working_days: number;
  total_customers: number;
  target_value_lacs: number;
  achievement_value_lacs: number;
  achievement_percent: number;
  today_sales_value_lacs: number;
  visits: number;
  unique_visits: number;
};

type SalesSection = {
  title: string;
  data: SalesRow[];
};

const API_BASE = `${BASE_URL}api`;
const COLUMN_WIDTHS = [220, 180, 180, 120, 130, 170, 160, 90, 160, 110, 140];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const now = new Date();
const currentYear = now.getFullYear();
const currentFinancialYearStart = now.getMonth() >= 3 ? currentYear : currentYear - 1;
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, index) => currentYear - index);
const FINANCIAL_YEAR_OPTIONS = Array.from(
  { length: 6 },
  (_, index) => `${currentFinancialYearStart - index}-${currentFinancialYearStart - index + 1}`,
);

const number = (value: unknown) => Number(value) || 0;
const rupeesToLacs = (value: unknown) => number(value) / 100000;
const money = (value: unknown) => `₹${number(value).toFixed(2)}L`;

const TargetArchieViewAllScreen = ({ navigation, route }: any) => {
  const initialZone = String(route?.params?.zone || '').replace(/\s+zone$/i, '').trim();
  const [period, setPeriod] = useState<Period>('MTD');
  const [sections, setSections] = useState<SalesSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<FilterKey | null>(null);
  const [activeDateModal, setActiveDateModal] = useState<DateFilterKey | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([MONTHS[now.getMonth()]]);
  const [draftMonths, setDraftMonths] = useState<string[]>([MONTHS[now.getMonth()]]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState(FINANCIAL_YEAR_OPTIONS[0]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    zone: initialZone,
    designation: '',
    user: null as number | string | null,
  });
  const [filterData, setFilterData] = useState<{
    zones: FilterItem[];
    designations: FilterItem[];
    users: FilterItem[];
  }>({ zones: [], designations: [], users: [] });

  useEffect(() => {
    const zone = String(route?.params?.zone || '').replace(/\s+zone$/i, '').trim();
    if (zone) setFilters(current => ({ ...current, zone }));
  }, [route?.params?.zone]);

  useEffect(() => {
    const fetchFilters = async () => {
      const token = store.getState()?.auth?.token;
      try {
        const response = await fetch(`${API_BASE}/user-attendance-zone-branch`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        const json = await response.json();
        const data = json?.data || {};
        setFilterData({
          zones: data.zones || [],
          designations: data.designations || [],
          users: data.users || [],
        });
      } catch (error) {
        console.log('Target filters error:', error);
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    const fetchSalesSummary = async () => {
      const token = store.getState()?.auth?.token;
      const params = [`period=${period.toLowerCase()}`];
      if (period === 'MTD') {
        selectedMonths.forEach(month => params.push(`months[]=${month}`));
        params.push(`year=${selectedYear}`);
      } else {
        params.push(`financial_year=${encodeURIComponent(selectedFinancialYear)}`);
      }
      if (filters.zone) params.push(`zone=${encodeURIComponent(filters.zone)}`);
      if (filters.designation) {
        params.push(`designation=${encodeURIComponent(filters.designation)}`);
      }
      if (filters.user != null) params.push(`user_id=${encodeURIComponent(String(filters.user))}`);

      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/sales/sales-summary?${params.join('&')}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        const json = await response.json();
        if (!response.ok || !json?.success) throw new Error(json?.message || 'Unable to load data');

        const formatted: SalesSection[] = (json.data?.zones || []).map((zone: any) => ({
          title: zone.zone || 'Unassigned',
          data: (zone.users || []).map((user: any) => ({
            id: user.id,
            name: user.name || '-',
            reporting: user.reporting || null,
            designation: user.designation || '-',
            working_days: number(user.working_days),
            total_working_days: number(user.total_working_days),
            total_customers: number(user.total_customers ?? user.registered_retailers),
            // sales-summary currently returns target in lacs as `target`. Keep the
            // normalized field first so this remains compatible with the newer API.
            target_value_lacs: number(user.target_value_lacs ?? user.target),
            achievement_value_lacs: user.achievement_value_lacs != null
              ? number(user.achievement_value_lacs)
              : rupeesToLacs(user.month_order_value),
            achievement_percent: user.achievement_value_lacs != null
              ? number(user.achievement_percent)
              : number(user.target) > 0
                ? (rupeesToLacs(user.month_order_value) / number(user.target)) * 100
                : 0,
            today_sales_value_lacs: user.today_sales_value_lacs != null
              ? number(user.today_sales_value_lacs)
              : rupeesToLacs(user.today_order_value),
            visits: number(user.visits ?? user.month_visits),
            unique_visits: number(user.unique_visits ?? user.month_unique_retailer_visits),
          })),
        }));
        setSections(formatted);
      } catch (error: any) {
        setSections([]);
        Toast.show({ type: 'error', text1: 'Unable to load sales summary', text2: error?.message });
      } finally {
        setLoading(false);
      }
    };
    fetchSalesSummary();
  }, [filters, period, selectedFinancialYear, selectedMonths, selectedYear]);

  const filterLabel = (item: FilterItem | string) => {
    if (typeof item === 'string') return item;
    return item.name || item.label || '';
  };

  const modalItems = activeModal ? filterData[`${activeModal}s` as keyof typeof filterData] : [];
  const visibleModalItems = modalItems.filter(item =>
    filterLabel(item).toLowerCase().includes(search.toLowerCase()),
  );

  const selectFilter = (item: FilterItem) => {
    const label = filterLabel(item);
    setFilters(current => ({
      ...current,
      [activeModal as FilterKey]: activeModal === 'user' ? item.id ?? null : label,
    }));
    setActiveModal(null);
  };

  const toggleMonth = (month: string) => {
    setDraftMonths(current => {
      if (current.includes(month)) {
        return current.length === 1 ? current : current.filter(item => item !== month);
      }
      return MONTHS.filter(item => [...current, month].includes(item));
    });
  };

  const callReportingHead = (reporting: SalesRow['reporting']) => {
    if (!reporting?.mobile || reporting.mobile.length < 10) {
      Toast.show({ type: 'error', text1: 'Invalid Number', text2: 'Reporting head number is unavailable.' });
      return;
    }
    Linking.openURL(`tel:${reporting.mobile}`).catch(() => {
      Toast.show({ type: 'error', text1: 'Unable to open dialer' });
    });
  };

  const totalsFor = (rows: SalesRow[]) => rows.reduce(
    (total, row) => ({
      total_customers: total.total_customers + row.total_customers,
      target_value_lacs: total.target_value_lacs + row.target_value_lacs,
      achievement_value_lacs: total.achievement_value_lacs + row.achievement_value_lacs,
      today_sales_value_lacs: total.today_sales_value_lacs + row.today_sales_value_lacs,
      visits: total.visits + row.visits,
      unique_visits: total.unique_visits + row.unique_visits,
    }),
    { total_customers: 0, target_value_lacs: 0, achievement_value_lacs: 0,
      today_sales_value_lacs: 0, visits: 0, unique_visits: 0 },
  );

  const renderCells = (values: React.ReactNode[], rowStyle?: object) => (
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

  const headers = [
    'Name', 'Reporting Head', 'Designation', 'Working Days', 'Total Customer',
    `${period === 'MTD' ? 'Monthly' : 'Yearly'} Target Value`,
    `Achievement ${period}`, `%${period}`, 'Today Sales Value', `${period} Visit`,
    `${period} Unique Visit`,
  ];

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Image source={require('../../assets/images/Dummy/back.png')} style={styles.backImage} />
        </Pressable>
        <AppText size={14} color="#cdd1ed">Target VS Achievement</AppText>
        <AppText size={25} color={colors.white} family="InterBold">Sales Performance</AppText>
      </View>

      <View style={styles.filters}>
        {(['zone', 'designation', 'user'] as FilterKey[]).map(key => (
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
        {filters.zone ? <FilterChip label={filters.zone} onRemove={() => setFilters(v => ({ ...v, zone: '' }))} /> : null}
        {filters.designation ? <FilterChip label={filters.designation} onRemove={() => setFilters(v => ({ ...v, designation: '' }))} /> : null}
        {filters.user != null ? (
          <FilterChip
            label={filterLabel(filterData.users.find(user => user.id === filters.user) || 'User')}
            onRemove={() => setFilters(v => ({ ...v, user: null }))}
          />
        ) : null}
      </View>

      <View style={styles.periodTabs}>
        {(['MTD', 'YTD'] as Period[]).map(item => (
          <Pressable key={item} style={[styles.periodTab, period === item && styles.activePeriodTab]}
            onPress={() => setPeriod(item)}>
            <AppText size={14} family="InterBold" color={period === item ? '#fff' : '#8990a5'}>{item}</AppText>
          </Pressable>
        ))}
      </View>

      <View style={styles.dateFilters}>
        {period === 'MTD' ? (
          <>
            <DateFilterButton
              label="Month"
              value={selectedMonths.join(', ')}
              onPress={() => {
                setDraftMonths(selectedMonths);
                setActiveDateModal('months');
              }}
            />
            <DateFilterButton
              label="Year"
              value={String(selectedYear)}
              onPress={() => setActiveDateModal('year')}
            />
          </>
        ) : (
          <DateFilterButton
            label="Financial Year"
            value={selectedFinancialYear}
            onPress={() => setActiveDateModal('financialYear')}
          />
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          {renderCells(headers.map(header => (
            <AppText size={13} family="InterBold" color="#fff">{header}</AppText>
          )), styles.tableHeader)}
          {loading ? (
            <ActivityIndicator style={styles.loader} color={colors.blue} size="large" />
          ) : (
            <SectionList
              sections={sections}
              keyExtractor={item => String(item.id)}
              stickySectionHeadersEnabled={false}
              ListEmptyComponent={<AppText style={styles.empty}>No target and achievement data available</AppText>}
              renderSectionHeader={({ section }) => (
                <AppText style={styles.zoneHeader}>Zone - {section.title}</AppText>
              )}
              renderItem={({ item, index }) => renderCells([
                item.name,
                <AppText size={13} color="#2563d9" underline="underline"
                  onPress={() => callReportingHead(item.reporting)}>{item.reporting?.name || '-'}</AppText>,
                item.designation,
                `${item.working_days}/${item.total_working_days}`,
                item.total_customers,
                money(item.target_value_lacs),
                money(item.achievement_value_lacs),
                `${item.achievement_percent.toFixed(0)}%`,
                money(item.today_sales_value_lacs),
                item.visits,
                item.unique_visits,
              ], index % 2 ? styles.alternateRow : undefined)}
              renderSectionFooter={({ section }) => {
                const totals = totalsFor(section.data);
                const percent = totals.target_value_lacs > 0
                  ? (totals.achievement_value_lacs / totals.target_value_lacs) * 100 : 0;
                return renderCells([
                  `${section.title.charAt(0).toUpperCase()} total`, '', '', '', totals.total_customers,
                  money(totals.target_value_lacs), money(totals.achievement_value_lacs),
                  `${percent.toFixed(0)}%`, money(totals.today_sales_value_lacs), totals.visits,
                  totals.unique_visits,
                ], styles.totalRow);
              }}
            />
          )}
        </View>
      </ScrollView>

      <Modal visible={activeModal != null} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <AppText size={18} family="InterBold">Select {activeModal}</AppText>
              <Pressable onPress={() => setActiveModal(null)}><AppText size={18}>✕</AppText></Pressable>
            </View>
            <TextInput value={search} onChangeText={setSearch} placeholder="Search..."
              placeholderTextColor="#999" style={styles.searchInput} />
            <ScrollView>
              {visibleModalItems.map((item, index) => (
                <Pressable key={String(item.id ?? filterLabel(item) ?? index)} style={styles.modalRow}
                  onPress={() => selectFilter(item)}>
                  <Text style={styles.modalText}>{filterLabel(item)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={activeDateModal != null} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <AppText size={18} family="InterBold">
                Select {activeDateModal === 'financialYear' ? 'Financial Year' : activeDateModal === 'months' ? 'Months' : 'Year'}
              </AppText>
              <Pressable onPress={() => setActiveDateModal(null)}><AppText size={18}>✕</AppText></Pressable>
            </View>
            <ScrollView>
              {activeDateModal === 'months' && MONTHS.map(month => {
                const selected = draftMonths.includes(month);
                return (
                  <Pressable key={month} style={styles.modalRow} onPress={() => toggleMonth(month)}>
                    <Text style={styles.modalText}>{month}</Text>
                    <Text style={[styles.checkmark, selected && styles.selectedCheckmark]}>{selected ? '✓' : ''}</Text>
                  </Pressable>
                );
              })}
              {activeDateModal === 'year' && YEAR_OPTIONS.map(year => (
                <Pressable key={year} style={styles.modalRow} onPress={() => {
                  setSelectedYear(year);
                  setActiveDateModal(null);
                }}>
                  <Text style={styles.modalText}>{year}</Text>
                  <Text style={[styles.checkmark, selectedYear === year && styles.selectedCheckmark]}>
                    {selectedYear === year ? '✓' : ''}
                  </Text>
                </Pressable>
              ))}
              {activeDateModal === 'financialYear' && FINANCIAL_YEAR_OPTIONS.map(financialYear => (
                <Pressable key={financialYear} style={styles.modalRow} onPress={() => {
                  setSelectedFinancialYear(financialYear);
                  setActiveDateModal(null);
                }}>
                  <Text style={styles.modalText}>{financialYear}</Text>
                  <Text style={[styles.checkmark, selectedFinancialYear === financialYear && styles.selectedCheckmark]}>
                    {selectedFinancialYear === financialYear ? '✓' : ''}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            {activeDateModal === 'months' ? (
              <Pressable style={styles.doneButton} onPress={() => {
                setSelectedMonths(draftMonths);
                setActiveDateModal(null);
              }}>
                <AppText size={14} family="InterBold" color="#fff">Apply</AppText>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const FilterChip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <Pressable style={styles.chip} onPress={onRemove}>
    <AppText size={12}>{label} ✕</AppText>
  </Pressable>
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
  filterButton: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#e4e6ee', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10 },
  downArrow: { width: 12, height: 7, resizeMode: 'contain' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 8, gap: 6 },
  chip: { backgroundColor: '#e8eaf7', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  periodTabs: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, backgroundColor: '#eef0f7', borderRadius: 22, padding: 3 },
  periodTab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 20 },
  activePeriodTab: { backgroundColor: colors.blue },
  dateFilters: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  dateFilterButton: { flex: 1, minHeight: 52, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e4e6ee',
    borderRadius: 12, paddingHorizontal: 14 },
  dateFilterText: { flex: 1, gap: 2 },
  tableRow: { flexDirection: 'row', minHeight: 48, backgroundColor: '#fff', borderBottomWidth: 1,
    borderBottomColor: '#eceef4' },
  tableHeader: { minHeight: 52, backgroundColor: colors.blue },
  cell: { justifyContent: 'center', paddingHorizontal: 14 },
  alternateRow: { backgroundColor: '#fafaff' },
  zoneHeader: { width: COLUMN_WIDTHS.reduce((sum, value) => sum + value, 0), padding: 13,
    backgroundColor: '#e6e8f6', color: '#39488f', fontFamily: fonts.InterBold },
  totalRow: { backgroundColor: '#eef0fb' },
  loader: { marginTop: 50 },
  empty: { width: 500, padding: 30, textAlign: 'center', color: '#777' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  searchInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 9, paddingHorizontal: 12,
    paddingVertical: 10, color: '#111', fontFamily: fonts.InterRegular, marginBottom: 10 },
  modalRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalText: { color: '#222', fontFamily: fonts.InterRegular },
  checkmark: { width: 24, textAlign: 'center', color: '#fff', fontFamily: fonts.InterBold },
  selectedCheckmark: { color: colors.blue },
  doneButton: { marginTop: 14, backgroundColor: colors.blue, borderRadius: 10, paddingVertical: 13,
    alignItems: 'center' },
});

export default TargetArchieViewAllScreen;
