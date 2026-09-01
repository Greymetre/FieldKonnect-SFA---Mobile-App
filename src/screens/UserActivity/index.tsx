import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  View,
  TouchableOpacity,
  Pressable,
  Alert,
  Modal,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { ArrowDownIcon, CalenderIcon, EyeIcon } from '../../assets/svgs/SvgsFile';
import AppText from '../../components/AppText/AppText';
import { styles } from './styles';
import { rw } from '../../utils/responsive';
import { colors } from '../../utils/Colors';
import store from '../../components/redux/Store';
import SummaryCard from '../../components/atoms/SummaryCard';
import { summaryStats1 } from '../../components/Comman/CommanFunction';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import CustomerCalendar from '../../components/CustomCalendar/CalendarPopupView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface User {
  id: number;
  name: string;
  branch?: string;
  branch_id?: number | string;
  zone?: string;
  zone_id?: number | string;
}

interface FilterOption {
  label: string;
  value: string;
  id?: number | string | null;
  zone?: string;
  zone_id?: number | string | null;
}

interface ActivityItem {
  user_id: number;
  name: string;
  date: string;
  reporting?: {
    name?: string;
    mobile?: string;
  };
  reporting_manager?: {
    name?: string;
    mobile?: string;
  };
  reporting_manager_name?: string;
  reporting_manager_mobile?: string;
  reportingManagerName?: string;
  reportingManagerMobile?: string;
  manager_name?: string;
  manager_mobile?: string;
}

const UserActivityScreen = ({ navigation, route }: any) => {
  const initialZone = String(route?.params?.zone || '').replace(/\s+zone$/i, '').trim();
  const [users, setUsers] = useState<User[]>([]);
  const [zones, setZones] = useState<FilterOption[]>([]);
  const [branches, setBranches] = useState<FilterOption[]>([]);
  const [activityData, setActivityData] = useState<ActivityItem[]>([]);

  const [selectedZone, setSelectedZone] = useState<FilterOption | null>(
    initialZone ? { label: initialZone, value: initialZone, id: null } : null,
  );
  const [selectedBranch, setSelectedBranch] = useState<FilterOption | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedDesignations, setSelectedDesignations] = useState<string[]>([]);
  const [designationOptions, setDesignationOptions] = useState<any[]>([]);

  // Temporary states for filters (changes apply only after clicking Apply in modal)
  const [tempSelectedDesignations, setTempSelectedDesignations] = useState<string[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isUserFocus, setIsUserFocus] = useState(false);
  const [isZoneFocus, setIsZoneFocus] = useState(false);
  const [isBranchFocus, setIsBranchFocus] = useState(false);
  const [showCal, setShowCal] = useState(false);
  const [showDesignationModal, setShowDesignationModal] = useState(false);

  const [rangeType, setRange] = useState('currentMonth');

  const [startDate, setStartDate] = useState<Date>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    return start;
  });

  const [endDate, setEndDate] = useState<Date>(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return end;
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState<any>(null);


  const formatFilterOption = useCallback((item: any): FilterOption => {
    if (typeof item === 'string') {
      return { label: item, value: item, id: null };
    }

    const label =
      item?.name ||
      item?.zone ||
      item?.zone_name ||
      item?.branch ||
      item?.branch_name ||
      item?.label ||
      '';

    const id = item?.id ?? item?.value ?? null;

    return {
      label: String(label),
      value: String(id ?? label),
      id,
      zone: item?.zone || item?.zone_name || item?.zone?.name || item?.zone?.zone_name,
      zone_id: item?.zone_id || item?.zone?.id || null,
    };
  }, []);

  const branchOptions = useMemo(() => {
    if (!selectedZone) return branches;

    return branches.filter((branch) => {
      if (!branch.zone && !branch.zone_id) return true;
      return (
        branch.zone_id?.toString() === selectedZone.id?.toString() ||
        branch.zone?.toLowerCase() === selectedZone.label.toLowerCase()
      );
    });
  }, [branches, selectedZone]);

  useEffect(() => {
    const zoneName = String(route?.params?.zone || '').replace(/\s+zone$/i, '').trim();
    if (!zoneName) return;

    setSelectedZone(current => {
      const matchedZone = zones.find(zone => zone.label.toLowerCase() === zoneName.toLowerCase());
      return matchedZone || (
        current?.label.toLowerCase() === zoneName.toLowerCase()
          ? current
          : { label: zoneName, value: zoneName, id: null }
      );
    });
    setSelectedBranch(null);
    setSelectedUser(null);
    setCurrentPage(1);
  }, [route?.params?.zone, zones]);

  // Format date to YYYY-MM-DD
  const formatYYYYMMDD = (date: Date): string => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleApply = (start: Date | null, end: Date | null, type: string) => {
    if (!start || !end) {
      Alert.alert("Invalid range", "Please select both start and end dates.");
      return;
    }
    const normalizedStart = new Date(start);
    normalizedStart.setHours(0, 0, 0, 0);
    const normalizedEnd = new Date(end);
    normalizedEnd.setHours(23, 59, 59, 999);

    setStartDate(normalizedStart);
    setEndDate(normalizedEnd);
    setCurrentPage(1);
    setRange(type || 'custom');
    setShowCal(false);

  };

  // Fetch Designations from API (No fallback)
  const fetchDesignations = useCallback(async () => {
    try {
      const token = store.getState()?.auth?.token;
      if (!token) return;

      const response = await axios.get(
        'https://duke.fieldkonnect.in/api/designations',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (response.data?.status === true && response.data.data?.length > 0) {
        const formatted = response.data.data.map((item: any) => ({
          label: item.designation_name,
          value: item.id.toString(),
        }));

        setDesignationOptions(formatted);

        // Auto-select ASR and DSR by name on first load
        const defaultDesignations = formatted.filter((desg: any) => {
          const name = desg.label.toLowerCase().trim();
          return name === 'asr' || name === 'dsr';
        });

        if (defaultDesignations.length > 0) {
          const defaultValues = defaultDesignations.map((desg: any) => desg.value);
          setTempSelectedDesignations(defaultValues);
          setSelectedDesignations(defaultValues);
        }
      } else {
        setDesignationOptions([]);
      }
    } catch (err) {
      console.error('Failed to fetch designations:', err);
      setDesignationOptions([]);
    }
  }, []);


  const fetchZoneBranchFilters = useCallback(async () => {
    try {
      const token = store.getState()?.auth?.token;
      if (!token) return;

      const response = await fetch(
        'https://duke.fieldkonnect.in/api/user-attendance-zone-branch',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      const result = await response.json();
      const filterData = result?.data || result || {};

      setZones((filterData.zones || []).map(formatFilterOption).filter((item: FilterOption) => item.label));
      setBranches((filterData.branches || []).map(formatFilterOption).filter((item: FilterOption) => item.label));
    } catch (err) {
      console.error('Failed to fetch zone/branch filters:', err);
    }
  }, [formatFilterOption]);

  // Fetch Activity Data - Uses final applied filters
  const fetchData = useCallback(async (page = 1, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (page === 1) setLoading(true);

      setError(null);

      const token = store.getState()?.auth?.token;
      if (!token) {
        setError("No authentication token found");
        return;
      }
      console.log({
        start_date: formatYYYYMMDD(startDate),
        end_date: formatYYYYMMDD(endDate)
      }, 'sadjfhaksjhdfkja', page)
      const response = await fetch(
        'https://duke.fieldkonnect.in/api/reporting/users',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            search_name: selectedUser?.id || null,
            zone: selectedZone?.label || null,
            zone_id: selectedZone?.id || null,
            branch: selectedBranch?.label || null,
            branch_id: selectedBranch?.id || null,
            designation: selectedDesignations.length > 0 ? selectedDesignations.join(',') : null,
            start_date: formatYYYYMMDD(startDate),
            end_date: formatYYYYMMDD(endDate),
            page: page,
            pageSize: 20,
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.status === "success") {
        console.log(result.users, 'result.usersresult.users')
        setUsers(result.users || []);
        if (result.branches?.length) {
          setBranches(result.branches.map(formatFilterOption).filter((item: FilterOption) => item.label));
        }

        if (page === 1) {
          setActivityData(result.data || []);
        } else {
          setActivityData(prev => [...prev, ...result.data]);
        }

        setCurrentPage(result.pagination?.current_page || 1);
        setTotalPages(result.pagination?.last_page || 1);
        setHasMore(result.pagination?.has_more || false);
      } else {
        setError(result.message || 'Failed to load data');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedUser?.id, selectedZone, selectedBranch, selectedDesignations, startDate, endDate, formatFilterOption]);

  const loadMore = () => {
    if (loading || !hasMore || currentPage >= totalPages) return;
    fetchData(currentPage + 1);
  };

  const onRefresh = () => {
    setCurrentPage(1);
    fetchData(1, true);
  };

  const fetchHierarchyStats = useCallback(async () => {
    try {
      const token = store.getState()?.auth?.token;
      if (!token) return;

      const response = await axios.get(
        `https://duke.fieldkonnect.in/api/getHierarchyOrderStats`,
        {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          params: {
            startdate: formatYYYYMMDD(startDate),
            enddate: formatYYYYMMDD(endDate),
            user_id: selectedUser?.id,
            zone: selectedZone?.label,
            zone_id: selectedZone?.id,
            branch: selectedBranch?.label,
            branch_id: selectedBranch?.id,
            designation: selectedDesignations.length > 0 ? selectedDesignations.join(',') : undefined,
          },
        }
      );

      if (response.data?.status === 'success') {
        setStats(response.data.data);
      }
    } catch (err: any) {
      console.error('Stats fetch error:', err);
      Toast.show({ type: 'error', text1: 'Failed to load dashboard stats' });
    }
  }, [selectedUser?.id, selectedZone, selectedBranch, selectedDesignations, startDate, endDate]);

  // Apply Filters from Modal
  const handleApplyFilters = () => {
    setSelectedDesignations(tempSelectedDesignations);
    setCurrentPage(1);
    setShowDesignationModal(false);
  };

  // Effects
  useEffect(() => {
    fetchDesignations();
    fetchZoneBranchFilters();
  }, [fetchDesignations, fetchZoneBranchFilters]);

  useEffect(() => {
    setCurrentPage(1);
    fetchData(1);
  }, [fetchData]);

  useEffect(() => {
    fetchHierarchyStats();
  }, [fetchHierarchyStats]);

  const clearAllFilters = () => {
    setSelectedZone(null);
    setSelectedBranch(null);
    setSelectedUser(null);
    setTempSelectedDesignations([]);
    setSelectedDesignations([]);
    setCurrentPage(1);
  };
  const toggleDesignation = (value: string) => {
    setTempSelectedDesignations(prev =>
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  const renderItem = useCallback(({ item }: { item: ActivityItem }) => (
    <Pressable
      style={[styles.listItem, styles.row]}
      onPress={() => navigation.navigate('IndividualPage', { item })}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <AppText color='black' size={16} family='InterBold'>
          {item.name}
        </AppText>
        <AppText color='black' size={14} family='InterRegular' opacity={0.8}>
          {item.date}
        </AppText>
      </View>
      <View style={[styles.row, { gap: 9 }]}>
        <View style={[styles.iconView, styles.center]}>
          <EyeIcon />
        </View>
      </View>
    </Pressable>
  ), [navigation]);

  // const filteredData = selectedUser
  //   ? activityData.filter(item => item.user_id === selectedUser.id)
  //   : activityData;

  return (
    <View style={styles.container}>
      <View
        style={[styles.container, { paddingHorizontal: rw(18) }]}
      // showsVerticalScrollIndicator={false}
      >
        {/* Filters */}
        <View style={{ gap: 15, marginTop: 15 }}>


          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <AppText size={15} color="black" family="InterBold">Filters</AppText>
            {(selectedZone || selectedBranch || selectedUser || selectedDesignations.length > 0) && (
              <TouchableOpacity onPress={clearAllFilters} style={styles.clearAllButton}>
                <AppText color="#EF4444" size={13} family="InterMedium">Clear</AppText>
              </TouchableOpacity>
            )}
          </View>

          {/* Zone & Branch Dropdowns */}
          <View style={[styles.row, { gap: 13, alignItems: 'center' }]}>
            <View style={{ flex: 1, height: 45 }}>
              <Dropdown
                style={[styles.UserBox, isZoneFocus && { borderColor: colors.blue }]}
                placeholderStyle={{ color: '#718096', fontSize: 14 }}
                selectedTextStyle={{ color: 'black', fontSize: 14 }}
                data={zones}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select Zone"
                searchPlaceholder="Search zone..."
                value={selectedZone?.value}
                onFocus={() => setIsZoneFocus(true)}
                onBlur={() => setIsZoneFocus(false)}
                onChange={(item: FilterOption) => {
                  setSelectedZone(item);
                  setSelectedBranch(null);
                                setCurrentPage(1);
                }}
                renderRightIcon={() => <ArrowDownIcon />}
              />
            </View>
            <View style={{ flex: 1, height: 45 }}>
              <Dropdown
                style={[styles.UserBox, isBranchFocus && { borderColor: colors.blue }]}
                placeholderStyle={{ color: '#718096', fontSize: 14 }}
                selectedTextStyle={{ color: 'black', fontSize: 14 }}
                data={branchOptions}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select Branch"
                searchPlaceholder="Search branch..."
                value={selectedBranch?.value}
                onFocus={() => setIsBranchFocus(true)}
                onBlur={() => setIsBranchFocus(false)}
                onChange={(item: FilterOption) => {
                  setSelectedBranch(item);
                  setCurrentPage(1);
                }}
                renderRightIcon={() => <ArrowDownIcon />}
              />
            </View>
          </View>
          {/* User Dropdown */}
          <View style={[styles.row, { gap: 13, alignItems: 'center' }]}>
            <View style={{ flex: 1, height: 45 }}>
              <Dropdown
                style={[styles.UserBox, isUserFocus && { borderColor: colors.blue }]}
                placeholderStyle={{ color: '#718096', fontSize: 14 }}
                selectedTextStyle={{ color: 'black', fontSize: 14 }}
                data={users}
                search
                maxHeight={300}
                labelField="name"
                valueField="id"
                placeholder="Select User"
                searchPlaceholder="Search user..."
                value={selectedUser?.id}
                onFocus={() => setIsUserFocus(true)}
                onBlur={() => setIsUserFocus(false)}
                onChange={(item: User) => {
                  setSelectedUser(item);
                  setCurrentPage(1);
                }}
                renderRightIcon={() => <ArrowDownIcon />}
              />
            </View>
          </View>

          {/* Designation Button */}
          <View style={{ gap: 8 }}>
            <View style={[styles.row, { gap: 13, alignItems: 'center' }]}>
              <TouchableOpacity
                style={[styles.UserBox, styles.row, { justifyContent: 'space-between', paddingHorizontal: rw(16) }]}
                onPress={() => setShowDesignationModal(true)}
              >
                <AppText
                  color={tempSelectedDesignations.length > 0 ? 'black' : '#718096'}
                  size={14}
                >
                  {"Select Designation"}
                </AppText>
                <ArrowDownIcon />
              </TouchableOpacity>
            </View>
            {tempSelectedDesignations.length > 0 && (
              <Pressable style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: rw(4) }} onPress={() => setShowDesignationModal(true)}>
                {designationOptions
                  .filter(item => tempSelectedDesignations.includes(item.value))
                  .map((item) => (
                    <View
                      key={item.value}
                      style={{
                        backgroundColor: colors.blue + '20',
                        paddingHorizontal: rw(12),
                        paddingVertical: rw(6),
                        borderRadius: 6,
                      }}
                    >
                      <AppText size={13} color="black">
                        {item.label}
                      </AppText>
                    </View>
                  ))}
              </Pressable>
            )}
          </View>
        </View>

        {/* Date Range Selector */}
        <Pressable style={[styles.dateTimeBox2, styles.row]} onPress={() => setShowCal(true)}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <AppText size={12} color="black" family="InterRegular">
              {formatYYYYMMDD(startDate)} : {formatYYYYMMDD(endDate)}
            </AppText>
          </View>
          <View style={[styles.calenderICon, styles.center]}>
            <CalenderIcon size={16} color={colors.blue} />
          </View>
        </Pressable>

        {/* Summary Cards */}


        {/* Loading & Error */}
        {loading && (
          <View style={{ marginTop: 50, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.blue} />
            <AppText style={{ marginTop: 12 }}>Loading activity...</AppText>
          </View>
        )}

        {error && !loading && (
          <View style={{ marginTop: 50, alignItems: 'center' }}>
            <AppText color="red" size={15}>{error}</AppText>
          </View>
        )}

        {/* Activity List */}
        <FlatList
          data={activityData || []}
          keyExtractor={(item, index) => `${item.user_id}-${item.date}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={{ marginTop: 20, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListFooterComponent={
            loading && currentPage > 1 ? (
              <View style={{ padding: 20, alignItems: 'center', height: 90 }}>
                <ActivityIndicator size="small" color={colors.blue} />
              </View>
            ) : (
              <View style={{ padding: 20, alignItems: 'center', height: 90 }}>
              </View>
            )
          }
          ListHeaderComponent={() => (
            <FlatList
              data={summaryStats1}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: rw(12), marginBottom: 12 }}
              renderItem={({ item }) => (
                <SummaryCard
                  item={item}
                  orderValue={stats?.total_order_value?.toLocaleString()}
                  quantity={stats?.total_quantity}
                  totalCustomer={stats?.total_created_customers || 0}
                  totalCheckIn={stats?.total_checkins}
                />
              )}
            />
          )}
          ListEmptyComponent={
            <View style={{ marginTop: 60, alignItems: 'center' }}>
              <AppText size={16} color="#718096">
                {selectedUser || selectedZone || selectedBranch || selectedDesignations.length > 0
                  ? `No activity found for selected filters`
                  : "No activity data available for selected date range"}
              </AppText>
            </View>
          }
        />
      </View>

      {/* Designation Selection Modal with Apply Button */}
      <Modal
        visible={showDesignationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDesignationModal(false)}
        statusBarTranslucent
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: 'white',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            maxHeight: '70%',
            paddingBottom: useSafeAreaInsets()?.bottom
          }}>
            <AppText size={18} family="InterBold" style={{ marginBottom: 15 }}>
              Select Designations
            </AppText>

            <ScrollView>
              {designationOptions.length > 0 ? (
                designationOptions.map((item) => {
                  const isSelected = tempSelectedDesignations.includes(item.value);
                  return (
                    <TouchableOpacity
                      key={item.value}
                      onPress={() => toggleDesignation(item.value)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: '#f0f0f0',
                      }}
                    >
                      <View style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: isSelected ? colors.blue : '#ccc',
                        backgroundColor: isSelected ? colors.blue : 'transparent',
                        marginRight: 12,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        {isSelected && <AppText color="white" size={16}>✓</AppText>}
                      </View>
                      <AppText size={15}>{item.label}</AppText>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <AppText style={{ textAlign: 'center', marginTop: 20, color: '#718096' }}>
                  No designations available
                </AppText>
              )}
            </ScrollView>

            {/* Apply & Cancel Buttons Inside Modal */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => {
                  setTempSelectedDesignations(selectedDesignations); // Reset to previous applied
                  setShowDesignationModal(false);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 8,
                  backgroundColor: '#f1f1f1',
                  alignItems: 'center',
                }}
              >
                <AppText color="black" family="InterMedium">Cancel</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleApplyFilters}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 8,
                  backgroundColor: colors.blue,
                  alignItems: 'center',
                }}
              >
                <AppText color="white" family="InterMedium">Apply</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </Modal>

      {/* Calendar Modal */}
      <CustomerCalendar
        showCal={showCal}
        setShowCal={setShowCal}
        initialStartDate={startDate}
        initialEndDate={endDate}
        setStartDates={setStartDate}
        setEndDates={setEndDate}
        setRange={setRange}
        range={rangeType}
        onApplyClick={handleApply}
        minimumDate={null}
        calendarType="history"
      />
    </View>
  );
};

export default UserActivityScreen;
