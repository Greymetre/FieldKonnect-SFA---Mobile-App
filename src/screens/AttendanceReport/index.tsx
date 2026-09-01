import { View, Text, ScrollView, FlatList, Pressable, Modal, Alert, ActivityIndicator, TextInput, Linking, Platform, StyleSheet } from 'react-native'
import { BASE_URL } from '../../api/AxiosClient';
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { rw } from '../../utils/responsive'
import AppText from '../../components/AppText/AppText'
import { ArrowDownIcon, CalenderIcon, CrossIcon, EyeballIcon, LOcationIcon, ThreeDotIcon } from '../../assets/svgs/SvgsFile'
import { colors } from '../../utils/Colors'
import { shadowStyle } from '../../utils/typography'
import { styles } from '../ExpenseReport/styles'
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';
import { useChangeAttendanceStatus, useGetAllAttanceReport, useGetAttendanceData } from '../../api/query/CustomerApi'
import { useFocusEffect } from '@react-navigation/native'
import { Dropdown } from 'react-native-element-dropdown'
import CustomerCalendar from '../../components/CustomCalendar/CalendarPopupView'
import { useAppSelector } from '../../components/redux/Store'
import { SCREEN_HEIGHT } from '../../utils/misc'
import { SafeAreaView } from 'react-native-safe-area-context'

interface FilterOption {
  label: string;
  value: string;
  id?: number | string | null;
  zone?: string;
  zone_id?: number | string | null;
}

type AttendanceStatusKey = 'approved' | 'pending' | 'rejected';

const EMPTY_STATUS_COUNTS: Record<AttendanceStatusKey, number> = {
  approved: 0,
  pending: 0,
  rejected: 0,
};

const AttendanceReport = ({ navigation, route }: any) => {
  const [loader, setLoader] = useState(false);
  const [loader1, setLoader1] = useState(false);
  const [punchInStatus, setPunchInStatus] = useState(0);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [hirarchyLevelCheck, setHirarchyLevelCheck] = useState<any>(null);
  const [attendanceDataVisit, setAttendanceDataVisit] = useState<any>(null);
  const [leaveCheck, setLeaveCheck] = useState<boolean>(false);
  const [remark, setRemark] = useState<string>('');
  const [remarkError, setRemarkError] = useState<string>('');
  const { user } = useAppSelector(
    (state) => state.auth
  );
  const remarkInputRef = useRef<TextInput>(null);
  const statusCountRequestRef = useRef(0);

  // Dropdown & filter states
  const [users, setUsers] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState(EMPTY_STATUS_COUNTS);
  const [zones, setZones] = useState<FilterOption[]>([]);
  const [selectedZone, setSelectedZone] = useState<FilterOption | null>(null);
  const [isZoneFocus, setIsZoneFocus] = useState(false);
  const [designationOptions, setDesignationOptions] = useState<any[]>([]);
  const [selectedDesignations, setSelectedDesignations] = useState<string[]>([]);
  const [tempSelectedDesignations, setTempSelectedDesignations] = useState<string[]>([]);
  const [showDesignationModal, setShowDesignationModal] = useState(false);
  const [hasAppliedDefaultDesignations, setHasAppliedDefaultDesignations] = useState(false);
  const [attendanceType, setAttendanceType] = useState<'normal' | 'leave' | 'holiday'>('normal');
  const [showCal, setShowCal] = useState(false);

  const [rangeType, setRange] = useState('currentMonth');

  const [startDate, setStartDate] = useState<any>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    return start;
  });

  const [endDate, setEndDate] = useState<any>(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return end;
  });

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
    setRange(type || 'custom');

    setShowCal(false);
    setPage(1);
    setHasMore(true);
    handleAttendanceList(
      attendanceType,
      selectedUserId,
      selectedStatus,
      normalizedStart,
      normalizedEnd,
      1,
      false
    )
  };

  const actionSheetRef = useRef<ActionSheetRef>(null);
  const actionSheetRef1 = useRef<ActionSheetRef>(null);
  const { mutateAsync: mutateGetAllAttendance } = useGetAllAttanceReport();
  const { mutateAsync: mutateGetAttendanceData } = useGetAttendanceData();
  const { mutateAsync: changeStatus, isPending: isSubmitting } = useChangeAttendanceStatus();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const hasLoadedDefaultFilteredAttendance = useRef(false);

  const PAGE_SIZE = 10;
  const token = useAppSelector((state) => state.auth.token);

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

  const fetchDesignations = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${BASE_URL}api/designations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      const result = await response.json();
      const data = result?.data || [];

      if (result?.status === true && data.length > 0) {
        const formatted = data.map((item: any) => ({
          label: item.designation_name,
          value: item.id.toString(),
        }));

        setDesignationOptions(formatted);

        const defaultDesignations = formatted.filter((item: any) => {
          const name = item.label.toLowerCase().trim();
          return name === 'asr' || name === 'dsr';
        });

        if (defaultDesignations.length > 0 && !hasAppliedDefaultDesignations) {
          const defaultValues = defaultDesignations.map((item: any) => item.value);
          setTempSelectedDesignations(defaultValues);
          setSelectedDesignations(defaultValues);
        }
        setHasAppliedDefaultDesignations(true);
      } else {
        setDesignationOptions([]);
      }
    } catch (err) {
      console.error('Failed to fetch designations:', err);
      setDesignationOptions([]);
    }
  }, [token, hasAppliedDefaultDesignations]);

  const fetchZoneBranchFilters = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${BASE_URL}api/user-attendance-zone-branch`,
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
    } catch (err) {
      console.error('Failed to fetch zone filters:', err);
    }
  }, [token, formatFilterOption]);

  const resetAttendanceList = () => {
    setAttendanceList([]);
    setUsers([]);
    setPage(1);
    setHasMore(true);
  };

  const getActiveReportFilters = (overrides?: any) => {
    const zone = overrides?.zone !== undefined ? overrides.zone : selectedZone;
    const designations = overrides?.designations !== undefined ? overrides.designations : selectedDesignations;

    return { zone, designations };
  };

  const getStatusKey = (value: any): AttendanceStatusKey | null => {
    const name = String(value || '').toLowerCase();
    if (name.includes('approv')) return 'approved';
    if (name.includes('pend')) return 'pending';
    if (name.includes('reject')) return 'rejected';
    return null;
  };

  const updateStatusCounts = (responseData: any) => {
    const next = { ...EMPTY_STATUS_COUNTS };
    let foundCount = false;
    const summaries = [
      responseData?.status_counts,
      responseData?.status_count,
      responseData?.attendance_counts,
      responseData?.counts,
      responseData?.summary,
    ];

    const setCount = (key: AttendanceStatusKey | null, value: any) => {
      const count = Number(value);
      if (key && Number.isFinite(count)) {
        next[key] = count;
        foundCount = true;
      }
    };

    summaries.forEach(summary => {
      if (Array.isArray(summary)) {
        summary.forEach(item => setCount(
          getStatusKey(item?.name || item?.status || item?.label),
          item?.count ?? item?.total ?? item?.value,
        ));
      } else if (summary && typeof summary === 'object') {
        Object.entries(summary).forEach(([key, value]: [string, any]) => {
          setCount(
            getStatusKey(key) || getStatusKey(value?.name || value?.status || value?.label),
            value?.count ?? value?.total ?? value,
          );
        });
      }
    });

    (responseData?.all_status || []).forEach((item: any) => {
      setCount(
        getStatusKey(item?.name || item?.status || item?.label),
        item?.count ?? item?.total ?? item?.attendance_count,
      );
    });

    Object.entries(responseData || {}).forEach(([key, value]) => {
      if (key.toLowerCase().includes('count')) setCount(getStatusKey(key), value);
    });

    if (foundCount) setStatusCounts(next);
  };

  const fetchStatusCounts = async (baseQuery: string, availableStatuses: any[]) => {
    const requestId = ++statusCountRequestRef.current;
    const fallbackIds: Record<AttendanceStatusKey, string> = { approved: '1', pending: '0', rejected: '2' };
    const queryWithoutPaginationOrStatus = baseQuery
      .replace(/&page=\d+/, '')
      .replace(/&pageSize=\d+/, '')
      .replace(/&status=[^&]*/, '');

    try {
      const entries = await Promise.all(
        (['approved', 'pending', 'rejected'] as AttendanceStatusKey[]).map(async key => {
          const option = availableStatuses.find(
            item => getStatusKey(item?.name || item?.status || item?.label) === key,
          );
          const statusId = String(option?.id ?? fallbackIds[key]);
          const countQuery = `${queryWithoutPaginationOrStatus}&status=${encodeURIComponent(statusId)}&page=1&pageSize=10000`;
          const response = await mutateGetAllAttendance(countQuery);
          const data = response?.data || {};
          const records = Array.isArray(data?.data) ? data.data : [];
          const serverTotal =
            data?.total_count ??
            data?.total ??
            data?.records_total ??
            data?.pagination?.total;

          if (Number.isFinite(Number(serverTotal))) {
            return [key, Number(serverTotal)] as const;
          }

          const pageCount = Number(data?.page_count ?? data?.pagination?.last_page ?? 1);
          if (pageCount > 1 && records.length > 0) {
            const lastPageResponse = await mutateGetAllAttendance(
              countQuery.replace('&page=1&', `&page=${pageCount}&`),
            );
            const lastPageRecords = Array.isArray(lastPageResponse?.data?.data)
              ? lastPageResponse.data.data
              : [];
            return [key, ((pageCount - 1) * records.length) + lastPageRecords.length] as const;
          }

          return [key, records.length] as const;
        }),
      );

      if (requestId === statusCountRequestRef.current) {
        setStatusCounts(Object.fromEntries(entries) as Record<AttendanceStatusKey, number>);
      }
    } catch (error) {
      console.log('Failed to fetch attendance status counts:', error);
    }
  };

  const statusChips = (['approved', 'pending', 'rejected'] as AttendanceStatusKey[]).map(key => {
    const statusOption = statuses.find(item => getStatusKey(item?.name || item?.status || item?.label) === key);
    const fallbackIds: Record<AttendanceStatusKey, string> = { approved: '1', pending: '0', rejected: '2' };
    const labels: Record<AttendanceStatusKey, string> = { approved: 'Approve', pending: 'Pending', rejected: 'Rejected' };
    return {
      key,
      label: labels[key],
      id: String(statusOption?.id ?? fallbackIds[key]),
      count: statusCounts[key],
    };
  });

  useFocusEffect(
    useCallback(() => {
      const showLeave = route?.params?.reportType === 'leave';
      const parseRouteDate = (value?: string) => {
        if (!value) return null;
        const parts = value.split('-').map(Number);
        if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
        return new Date(parts[0], parts[1] - 1, parts[2]);
      };
      const routeStart = parseRouteDate(route?.params?.startDate);
      const routeEnd = parseRouteDate(route?.params?.endDate);
      const selectedStart = showLeave && routeStart ? new Date(routeStart.getTime()) : startDate;
      const selectedEnd = showLeave && (routeEnd || routeStart)
        ? new Date((routeEnd || routeStart as Date).getTime())
        : endDate;

      setAttendanceType(showLeave ? 'leave' : 'normal');
      if (showLeave && routeStart) {
        selectedStart.setHours(0, 0, 0, 0);
        selectedEnd.setHours(23, 59, 59, 999);
        setStartDate(selectedStart);
        setEndDate(selectedEnd);
        setRange('custom');
      }
      setPage(1);
      setHasMore(true);
      handleAttendanceList(
        showLeave ? 'leave' : 'normal',
        null,
        null,
        selectedStart,
        selectedEnd,
        1,
        false
      );
    }, [route?.params?.reportType, route?.params?.startDate, route?.params?.endDate])
  );

  useEffect(() => {
    fetchDesignations();
    fetchZoneBranchFilters();
  }, [fetchDesignations, fetchZoneBranchFilters]);

  useEffect(() => {
    if (!hasAppliedDefaultDesignations || hasLoadedDefaultFilteredAttendance.current) return;

    hasLoadedDefaultFilteredAttendance.current = true;
    handleAttendanceList(
      attendanceType,
      selectedUserId,
      selectedStatus,
      startDate,
      endDate,
      1,
      false
    );
  }, [hasAppliedDefaultDesignations]);





  const handleAttendanceList = async (
    type: 'normal' | 'leave' | 'holiday' = 'normal',
    userId: string | null = null,
    status: string | null = null,
    start?: any,
    end?: any,
    pageNumber: number = 1,
    loadMore: boolean = false,
    reportFilters?: {
      zone?: FilterOption | null;
      designations?: string[];
    }
  ) => {

    if (loadMore) {
      setIsFetchingMore(true);
    } else {
      setLoader1(true);
    }

    try {

      let query = `?type=${type}`;

      // pagination
      query += `&page=${pageNumber}`;
      query += `&pageSize=${PAGE_SIZE}`;

      if (userId) {
        query += `&search_name=${userId}`;
      }

      if (status !== null && status !== '') {
        query += `&status=${status}`;
      }

      const activeFilters = getActiveReportFilters(reportFilters);

      if (activeFilters.zone?.label) {
        query += `&zone=${encodeURIComponent(activeFilters.zone.label)}`;
      }

      if (activeFilters.zone?.id) {
        query += `&zone_id=${encodeURIComponent(String(activeFilters.zone.id))}`;
      }

      if (activeFilters.designations?.length > 0) {
        query += `&designation=${encodeURIComponent(activeFilters.designations.join(','))}`;
      }

      if (start && end) {
        query += `&start_date=${formatYYYYMMDD(start)}`;
        query += `&end_date=${formatYYYYMMDD(end)}`;
      } else {
        if (startDate && endDate) {
          query += `&start_date=${formatYYYYMMDD(startDate)}`;
          query += `&end_date=${formatYYYYMMDD(endDate)}`;
        }
      }

      console.log(query, 'FINAL QUERY');

      const res = await mutateGetAllAttendance(query);

      if (res?.data?.status === 'success') {

        updateStatusCounts(res.data);

        const newData = res?.data?.data || [];

        // append data if load more
        if (loadMore) {
          setAttendanceList(prev => [...prev, ...newData]);
        } else {
          setAttendanceList(newData);
        }

        // dropdowns only once
        if (!loadMore && res?.data?.users?.length > 0) {
          setUsers([{ id: null, name: 'All Users' }, ...res.data.users]);
        }

        if (statuses.length === 0 && res?.data?.all_status?.length > 0) {
          setStatuses([
            { id: null, name: 'All Statuses' },
            ...res.data.all_status,
          ]);
        }

        if (!loadMore && type !== 'holiday' && !res?.data?.status_counts) {
          const availableStatuses = res?.data?.all_status?.length > 0
            ? res.data.all_status
            : statuses;
          void fetchStatusCounts(query, availableStatuses);
        }

        // pagination logic
        const totalPages = res?.data?.page_count || 1;

        setHasMore(pageNumber < totalPages);
        setPage(pageNumber);

      } else {

        if (!loadMore) {
          setAttendanceList([]);
        }

        setHasMore(false);
      }

    } catch (error) {
      console.log('Error fetching attendance list:', error);
    } finally {

      setLoader1(false);
      setIsFetchingMore(false);
    }
  };

  const handleGetAttendanceData = async (id: string | number) => {
    setLoader(true);
    try {
      const res = await mutateGetAttendanceData(id);
      if (res?.data?.status === 'success') {
        const data = res?.data?.data;
        setAttendanceData(data);
        setAttendanceDataVisit(res?.data)

        const isLeave =
          data?.working_type === 'Full Day Leave' ||
          data?.working_type === 'First Half Leave' ||
          data?.working_type === 'Second Half Leave';

        setLeaveCheck(isLeave);
        // setPunchInStatus(data?.attendance_status || 3);
        setPunchInStatus(data?.attendance_status || 3);
        setRemark(data?.remark_status)
      }
    } catch (error) {
      console.log('Error fetching attendance detail:', error);
    } finally {
      setLoader(false);
    }
  };

  const loadMoreData = () => {

    if (isFetchingMore || !hasMore) {
      return;
    }

    const nextPage = page + 1;

    handleAttendanceList(
      attendanceType,
      selectedUserId,
      selectedStatus,
      startDate,
      endDate,
      nextPage,
      true
    );
  };

  // Attendance type change handler
  const onTypeChange = (type: 'normal' | 'leave' | 'holiday') => {

    setAttendanceType(type);
    if (type === 'holiday') setSelectedStatus(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filterStart = new Date(today.getFullYear(), today.getMonth(), 1);
    filterStart.setHours(0, 0, 0, 0);

    const filterEnd = type === 'normal'
      ? new Date(today)
      : new Date(today.getFullYear(), today.getMonth() + 2, 0);
    filterEnd.setHours(23, 59, 59, 999);

    setStartDate(filterStart);
    setEndDate(filterEnd);
    setRange(type === 'normal' ? 'currentMonth' : 'custom');
    setPage(1);
    setHasMore(true);

    handleAttendanceList(
      type,
      selectedUserId,
      selectedStatus,
      filterStart,
      filterEnd,
      1,
      false
    );
  };

  // User dropdown change
  const onUserChange = (item: any) => {

    const userId = item?.id ? String(item.id) : null;

    setSelectedUserId(userId);

    setPage(1);
    setHasMore(true);

    handleAttendanceList(
      attendanceType,
      userId,
      selectedStatus,
      startDate,
      endDate,
      1,
      false
    );
  };

  // Status dropdown change
  const onStatusChange = (item: any) => {

    const statusId = item?.id !== null && item?.id !== undefined && item?.id !== ''
      ? String(item.id)
      : null;

    setSelectedStatus(statusId);

    setPage(1);
    setHasMore(true);

    handleAttendanceList(
      attendanceType,
      selectedUserId,
      statusId,
      startDate,
      endDate,
      1,
      false
    );
  };

  const onZoneChange = (item: FilterOption) => {
    setSelectedZone(item);
    setSelectedUserId(null);
    resetAttendanceList();

    handleAttendanceList(
      attendanceType,
      null,
      selectedStatus,
      startDate,
      endDate,
      1,
      false,
      { zone: item }
    );
  };

  const toggleDesignation = (value: string) => {
    setTempSelectedDesignations(prev =>
      prev.includes(value)
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };

  const handleApplyDesignationFilter = () => {
    setSelectedDesignations(tempSelectedDesignations);
    setSelectedUserId(null);
    resetAttendanceList();
    setShowDesignationModal(false);

    handleAttendanceList(
      attendanceType,
      null,
      selectedStatus,
      startDate,
      endDate,
      1,
      false,
      { designations: tempSelectedDesignations }
    );
  };

  const clearAllFilters = () => {
    setSelectedUserId(null);
    setSelectedStatus(null);
    setSelectedZone(null);
    setTempSelectedDesignations([]);
    setSelectedDesignations([]);
    setShowDesignationModal(false);
    resetAttendanceList();

    handleAttendanceList(
      attendanceType,
      null,
      null,
      startDate,
      endDate,
      1,
      false,
      { zone: null, designations: [] }
    );
  };

  const formatYYYYMMDD = (date: any): string => {
    if (!date) return '';

    const d = new Date(date);

    if (isNaN(d.getTime())) return '';

    // Use LOCAL year, month, day — ignore timezone / UTC completely
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0'); // 01 to 12
    const day = String(d.getDate()).padStart(2, '0');     // 01 to 31

    return `${year}-${month}-${day}`;
  };



  const renderItem = useCallback(
    ({ item }: any) => {
      const isLeave =
        item?.working_type === 'Full Day Leave' ||
        item?.working_type === 'First Half Leave' ||
        item?.working_type === 'Second Half Leave';
      const isHoliday = item?.is_holiday === true;

      return (
        <Pressable
          style={[styles.listItem, shadowStyle]}
          onPress={() => {
            if (isHoliday) return;
            actionSheetRef.current?.show();
            if (item?.hierarchy_level <= 2) {
              setHirarchyLevelCheck(item);
            }
            handleGetAttendanceData(item.attendance_id);
          }}
        >
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <AppText color="black" family="InterSemiBold" size={16}>
                {item?.name || 'Unknown'}
              </AppText>
            </View>
            <View style={[styles.row, { gap: 19 }]}>
              <AppText color="#888888" family="InterMedium" size={13}>
                {item?.date || '-'}
              </AppText>
              <View
              >
                <EyeballIcon />
              </View>
              <View>
                <ThreeDotIcon />
              </View>
            </View>
          </View>

          <View style={styles.line} />

          <View
            style={[
              styles.row,
              { justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' },
            ]}
          >
            <View style={styles.firstPunchIN}>
              <AppText color="#888888" family="InterRegular" size={13}>
                {isHoliday ? 'Holiday Date' : isLeave ? 'Leave Date' : 'Punch In'}
              </AppText>
              <AppText color="black" family="InterSemiBold" size={14}>
                {isHoliday || isLeave ? item?.date : item?.punch_in || '-'}
              </AppText>
            </View>

            <View style={styles.firstPunchIN}>
              <AppText color="#888888" family="InterRegular" size={13}>
                {isHoliday ? 'Holiday' : isLeave ? 'Leave Type' : 'Punch Out'}
              </AppText>
              <AppText color="black" family="InterSemiBold" size={14}>
                {isHoliday || isLeave ? item?.working_type : item?.punch_out || '-'}
              </AppText>
            </View>

            <View style={styles.firstPunchIN}>
              <AppText color="#888888" family="InterRegular" size={13}>
                Status
              </AppText>
              <AppText
                color={
                  item?.status === 'Holiday'
                    ? colors.blue
                    : item?.status === 'Pending'
                    ? '#E78422'
                    : item?.status === 'Approve'
                      ? '#1bc804'
                      : '#d31111'
                }
                family="InterSemiBold"
                size={14}
              >
                {item?.status || 'Unknown'}
              </AppText>
            </View>
          </View>
        </Pressable>
      );
    },
    []
  );

  const getTourTownNames = () => {
    const tours = attendanceDataVisit?.tour_details;

    if (!tours || tours.length === 0) {
      return 'N/A'; // fallback
    }

    return tours
      .map((item: any) => item?.town_name)
      .filter(Boolean)
      .join(', ');
  };

  const getTourObjective = () => {
    const tours = attendanceDataVisit?.tour_details;

    if (!tours || tours.length === 0) {
      return 'N/A'; // fallback
    }

    return tours
      .map((item: any) => item?.objective)
      .filter(Boolean)
      .join(', ');
  };


  const handleLocation = async () => {
    const addr = attendanceData?.punchin_address?.trim();

    let query = '';

    // Prefer coordinates if available
    if (attendanceData?.punchin_latitude && attendanceData?.punchin_longitude) {
      query = `${attendanceData?.punchin_longitude},${attendanceData?.punchin_latitude}`;
    }

    // Fallback to address
    if (!query && addr) {
      query = encodeURIComponent(addr);
    }

    if (!query) {
      Alert.alert('No Location', 'No GPS or address available.');
      return;
    }

    // ────────────────────────────────────────────────
    // Android: try geo: URI first (works with most map apps)
    // iOS: use maps://
    // Fallback: browser
    // ────────────────────────────────────────────────

    const scheme = Platform.OS === 'android' ? 'geo:0,0?q=' : 'maps://?q=';
    const nativeUrl = scheme + query;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

    try {
      // Try native map app first
      if (await Linking.canOpenURL(nativeUrl)) {
        await Linking.openURL(nativeUrl);
        return;
      }

      // If native fails → open in browser
      await Linking.openURL(webUrl);
    } catch (err) {
      console.log('Map open failed:', err);

      Alert.alert(
        'Cannot Open Map',
        'No map application is available.\n\nThe location will open in your browser instead.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open in Browser',
            onPress: () => Linking.openURL(webUrl).catch(() => { }),
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View
        style={[styles.container, { paddingHorizontal: rw(18) },]}
      // showsVerticalScrollIndicator={false}
      >
        {/* Filters */}
        <View style={{ marginTop: 16, }}>
          <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 12 }]}>
            <AppText size={15} color="black" family="InterBold">Filters</AppText>
            {(selectedZone || selectedUserId || selectedStatus || selectedDesignations.length > 0) && (
              <Pressable onPress={clearAllFilters} style={localStyles.clearAllButton}>
                <AppText color="#EF4444" size={13} family="InterMedium">Clear</AppText>
              </Pressable>
            )}
          </View>

          <View style={[styles.row, { gap: 13, marginBottom: 12 }]}>
            <Dropdown
              style={[localStyles.dropdown, shadowStyle, isZoneFocus && { borderColor: colors.blue }]}
              placeholderStyle={localStyles.placeholderStyle}
              selectedTextStyle={localStyles.selectedTextStyle}
              inputSearchStyle={localStyles.inputSearchStyle}
              data={zones}
              search
              maxHeight={320}
              labelField="label"
              valueField="value"
              placeholder="Select Zone"
              searchPlaceholder="Search zone..."
              value={selectedZone?.value}
              onFocus={() => setIsZoneFocus(true)}
              onBlur={() => setIsZoneFocus(false)}
              onChange={onZoneChange}
              renderRightIcon={() => <ArrowDownIcon />}
            />

            <Pressable
              style={[localStyles.dropdown, shadowStyle, styles.row, { justifyContent: 'space-between' }]}
              onPress={() => setShowDesignationModal(true)}
            >
              <AppText
                color={tempSelectedDesignations.length > 0 ? 'black' : '#718096'}
                size={14}
                family="InterRegular"
                numberOfLines={1}
              >
                {tempSelectedDesignations.length > 0
                  ? `${tempSelectedDesignations.length} selected`
                  : 'Select Designation'}
              </AppText>
              <ArrowDownIcon />
            </Pressable>
          </View>

          {tempSelectedDesignations.length > 0 && (
            <Pressable style={[localStyles.chipContainer, { marginBottom: 12 }]} onPress={() => setShowDesignationModal(true)}>
              {designationOptions
                .filter(item => tempSelectedDesignations.includes(item.value))
                .map(item => (
                  <View key={item.value} style={localStyles.designationChip}>
                    <AppText size={13} color="black">{item.label}</AppText>
                  </View>
                ))}
            </Pressable>
          )}

          <View style={[styles.row, { gap: 13 }]}>
            <Dropdown
              style={[localStyles.dropdown, shadowStyle]}
              placeholderStyle={localStyles.placeholderStyle}
              selectedTextStyle={localStyles.selectedTextStyle}
              inputSearchStyle={localStyles.inputSearchStyle}
              data={users}
              search
              maxHeight={320}
              labelField="name"
              valueField="id"
              placeholder="Select User"
              searchPlaceholder="Search user..."
              value={selectedUserId}
              onChange={onUserChange}
            />

            <Dropdown
              style={[localStyles.dropdown, shadowStyle]}
              placeholderStyle={localStyles.placeholderStyle}
              selectedTextStyle={localStyles.selectedTextStyle}
              data={statuses}
              maxHeight={220}
              labelField="name"
              valueField="id"
              placeholder="Select Status"
              value={selectedStatus}
              onChange={onStatusChange}
            />
          </View>
          {/* <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 8,
            }}
          >
            <Pressable onPress={resetFilters}>
              <AppText color={colors.blue} size={14} family="InterMedium">
                Reset Filters
              </AppText>
            </Pressable>


          </View> */}
        </View>

        {/* Placeholder for future date picker */}
        <View style={[styles.row, { marginTop: 16, gap: 13 }]}>
          <Pressable style={[styles.dateTimeBox, styles.row,]} onPress={() => setShowCal(true)}>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              {
                (startDate && endDate) ? (
                  <AppText size={12} color="black" family="InterRegular">
                    {formatYYYYMMDD(startDate)} : {formatYYYYMMDD(endDate)}
                  </AppText>
                ) : (
                  <AppText size={14} color="#718096" family="InterRegular">
                    Select Date Range
                  </AppText>
                )
              }

            </View>
            <View style={[styles.calenderICon, styles.center]}>
              <CalenderIcon size={16} color={colors.blue} />
            </View>
          </Pressable>
          <View style={localStyles.typeSelector}>
            {([
              { label: 'A', value: 'normal' },
              { label: 'L', value: 'leave' },
              { label: 'H', value: 'holiday' },
            ] as const).map(option => (
              <Pressable
                key={option.value}
                onPress={() => onTypeChange(option.value)}
                style={[
                  localStyles.typeOption,
                  attendanceType === option.value && localStyles.typeOptionActive,
                ]}
              >
                <AppText
                  size={13}
                  family="InterMedium"
                  color={attendanceType === option.value ? colors.blue : '#797C86'}
                >
                  {option.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        {attendanceType !== 'holiday' && (
          <View style={localStyles.statusChipRow}>
            {statusChips.map(chip => {
              const isActive = selectedStatus === chip.id;
              return (
                <Pressable
                  key={chip.key}
                  onPress={() => onStatusChange({ id: isActive ? null : chip.id })}
                  style={[
                    localStyles.statusChip,
                    chip.key === 'approved' && localStyles.approveStatusChip,
                    chip.key === 'pending' && localStyles.pendingStatusChip,
                    chip.key === 'rejected' && localStyles.rejectStatusChip,
                    isActive && chip.key === 'approved' && localStyles.approveStatusChipActive,
                    isActive && chip.key === 'pending' && localStyles.pendingStatusChipActive,
                    isActive && chip.key === 'rejected' && localStyles.rejectStatusChipActive,
                  ]}
                >
                  <AppText
                    size={13}
                    family="InterSemiBold"
                    color={isActive
                      ? 'white'
                      : chip.key === 'approved'
                        ? '#339D4F'
                        : chip.key === 'pending'
                          ? '#E78422'
                          : '#D31111'}
                  >
                    {chip.label} ({chip.count})
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={{ height: 20 }} />

        {loader1 ? (
          <ActivityIndicator
            size="large"
            color={colors.blue}
            style={{ marginTop: 60 }}
          />
        ) : attendanceList.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <AppText size={16} color="#718096" family="InterMedium">
              No {attendanceType === 'normal' ? 'attendance' : attendanceType} records found
            </AppText>
          </View>
        ) : (
          <FlatList
            data={attendanceList}
            keyExtractor={(item, index) => String(item?.attendance_id ?? item?.leave_id ?? item?.id ?? index)}
            renderItem={renderItem}

            onEndReached={loadMoreData}
            onEndReachedThreshold={0.5}

            ListFooterComponent={() => (
              <>
                {isFetchingMore && (
                  <ActivityIndicator
                    size="small"
                    color={colors.blue}
                    style={{ marginVertical: 20 }}
                  />
                )}

                {!hasMore && attendanceList.length > 0 && (
                  <AppText
                    size={13}
                    color="#718096"
                    family="InterMedium"
                    style={{
                      textAlign: 'center',
                      marginVertical: 20,
                    }}
                  >
                    No more records
                  </AppText>
                )}

                <View style={{ height: 140 }} />
              </>
            )}
          />
        )}
        <CustomerCalendar
          {...{ showCal, setShowCal }}
          // minimumDate={new Date()}
          initialStartDate={startDate}
          initialEndDate={endDate}
          setStartDates={setStartDate}
          setEndDates={setEndDate}
          setRange={setRange}
          range={rangeType}
          onApplyClick={handleApply}
          minimumDate={null}
          calendarType="reminder"
        />
      </View>
      <Modal
        visible={showDesignationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDesignationModal(false)}
        statusBarTranslucent
      >
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.designationModal}>
            <AppText size={18} family="InterBold" style={localStyles.modalTitle}>
              Select Designations
            </AppText>

            <ScrollView>
              {designationOptions.length > 0 ? (
                designationOptions.map(item => {
                  const isSelected = tempSelectedDesignations.includes(item.value);
                  return (
                    <Pressable
                      key={item.value}
                      onPress={() => toggleDesignation(item.value)}
                      style={localStyles.designationOption}
                    >
                      <View style={[
                        localStyles.designationCheckbox,
                        isSelected && localStyles.designationCheckboxSelected,
                      ]}>
                        {isSelected && <AppText color="white" size={16}>✓</AppText>}
                      </View>
                      <AppText size={15}>{item.label}</AppText>
                    </Pressable>
                  );
                })
              ) : (
                <AppText style={localStyles.emptyDesignationText}>No designations available</AppText>
              )}
            </ScrollView>

            <View style={localStyles.modalActions}>
              <Pressable
                onPress={() => {
                  setTempSelectedDesignations(selectedDesignations);
                  setShowDesignationModal(false);
                }}
                style={localStyles.cancelButton}
              >
                <AppText color="black" family="InterMedium">Cancel</AppText>
              </Pressable>
              <Pressable onPress={handleApplyDesignationFilter} style={localStyles.applyButton}>
                <AppText color="white" family="InterMedium">Apply</AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <ActionSheet
        ref={actionSheetRef}
        gestureEnabled={false}
        isModal={false}
        useBottomSafeAreaPadding
        keyboardHandlerEnabled={false}
        containerStyle={{
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          backgroundColor: 'white',
          // paddingBottom: 20,
          maxHeight: SCREEN_HEIGHT * 0.9,
          height: 'auto'

        }}
        onClose={() => {
          setHirarchyLevelCheck(null);
          setAttendanceData(null)
        }}
        indicatorStyle={{
          height: 0,
          backgroundColor: 'transparent',
        }}
        closeOnTouchBackdrop={true}

      >
        <View style={[{}]}>
          <View style={[styles.modalheader]}>
            <AppText size={16} color='white' family='InterSemiBold'>{leaveCheck ? "Leave" : "Attendance"} Detail</AppText>
            <Pressable style={{ position: "absolute", right: 15 }} onPress={() => {
              actionSheetRef.current?.hide();
              // setIsModalVisible(false)
            }}>
              <CrossIcon />
            </Pressable>
          </View>
          <ScrollView style={{ width: '100%', maxHeight: SCREEN_HEIGHT * 0.7 }} showsVerticalScrollIndicator={false} keyboardDismissMode='on-drag'>
              <View style={styles.mainOCntainer} >
              <View style={[styles.row, { gap: 21 }]}>
                <View style={styles.firstViewModal}>
                  <AppText size={14} family='InterMedium' color='#333333'>Employe Code</AppText>
                  <AppText size={14} family='InterBold' color='black'>{attendanceData?.users?.employee_codes}</AppText>
                </View>
                <View style={[styles.firstViewModal, { flex: 0.45 }]}>
                  <AppText size={14} family='InterMedium' color='#333333'>Employe Name</AppText>
                  <AppText size={14} family='InterBold' color='black'>{attendanceData?.users?.name}</AppText>
                </View>
              </View>
              {
                !leaveCheck && attendanceDataVisit?.city_names_string && (
                  <View style={[styles.row, { gap: 21, marginTop: 15 }]}>
                    <View style={styles.firstViewModal}>
                      <AppText size={14} family='InterMedium' color='#333333'>Punch In City</AppText>
                      <AppText size={14} family='InterBold' color='black'>{attendanceDataVisit?.city_names_string}</AppText>
                    </View>
                    <View style={[styles.firstViewModal, { flex: 0.45 }]}>
                      <AppText size={14} family='InterMedium' color='#333333'>Punch In Date</AppText>
                      <AppText size={14} family='InterBold' color='black'>{attendanceData?.punchin_date}</AppText>
                    </View>
                  </View>
                )
              }
              {/* <View style={[styles.firstViewModal, { flex: 0.45 }]}>
                <AppText size={14} family='InterMedium' color='#333333'>Employe Code</AppText>
                <AppText size={14} family='InterBold' color='black'>{attendanceData?.users?.employee_codes}</AppText>
              </View> */}
              {
                leaveCheck && (
                  <View style={[styles.row, { gap: 21, marginTop: 15 }]}>
                    <View style={styles.firstViewModal}>
                      <AppText size={14} family='InterMedium' color='#333333'>Leave Date</AppText>
                      <AppText size={14} family='InterBold' color='black'>{attendanceData?.punchin_date}</AppText>
                    </View>
                  </View>
                )
              }
              {
                !leaveCheck && (
                  <>
                    <View style={[styles.row, { gap: 21, marginTop: 15 }]}>

                      <View style={styles.firstViewModal}>
                        <AppText size={14} family='InterMedium' color='#333333'>
                          {attendanceDataVisit?.city_names_string ? 'Punch In Time' : 'Punch In Date'}
                        </AppText>
                        <AppText size={14} family='InterBold' color='black'>
                          {attendanceDataVisit?.city_names_string ? attendanceData?.punchin_time : attendanceData?.punchin_date}
                        </AppText>
                      </View>
                      <View style={[styles.firstViewModal, { flex: 0.45 }]}>
                        <AppText size={14} family='InterMedium' color='#333333'>
                          {attendanceDataVisit?.city_names_string ? 'Punch Out Date' : 'Punch In Time'}
                        </AppText>
                        <AppText size={14} family='InterBold' color='black'>
                          {attendanceDataVisit?.city_names_string ? attendanceData?.punchout_date : attendanceData?.punchin_time}
                        </AppText>
                      </View>
                    </View>
                    <View style={[styles.row, { gap: 21, marginTop: 15 }]}>
                      <View style={styles.firstViewModal}>
                        <AppText size={14} family='InterMedium' color='#333333'>
                          {attendanceDataVisit?.city_names_string ? 'Working Time' : 'Punch Out Date'}
                        </AppText>
                        <AppText size={14} family='InterBold' color='black'>
                          {attendanceDataVisit?.city_names_string ? attendanceData?.worked_time : attendanceData?.punchout_date}
                        </AppText>
                      </View>
                      <View style={[styles.firstViewModal, { flex: 0.45 }]}>
                        <AppText size={14} family='InterMedium' color='#333333'>
                          {attendanceDataVisit?.city_names_string ? 'Punch Out Time' : 'Working Time'}
                        </AppText>
                        <AppText size={14} family='InterBold' color='black'>
                          {attendanceDataVisit?.city_names_string ? attendanceData?.punchout_time : attendanceData?.worked_time}
                        </AppText>
                      </View>
                    </View>
                    <View style={[styles.row, { gap: 21, marginTop: 15 }]}>
                      {!attendanceDataVisit?.city_names_string && (
                        <View style={styles.firstViewModal}>
                          <AppText size={14} family='InterMedium' color='#333333'>Punch Out Time</AppText>
                          <AppText size={14} family='InterBold' color='black'>{attendanceData?.punchout_time}</AppText>
                        </View>
                      )}
                      <View style={[styles.firstViewModal, attendanceDataVisit?.city_names_string ? {} : { flex: 0.45 }]}>
                        <AppText size={14} family='InterMedium' color='#333333'>Tour Plan City</AppText>
                        <AppText size={14} family='InterBold' color='black'>
                          {getTourTownNames()}
                        </AppText>
                      </View>
                      {attendanceDataVisit?.city_names_string && (
                        <View style={[styles.firstViewModal, { flex: 0.45 }]}>
                          <AppText size={14} family='InterMedium' color='#333333'>Tour Plan Objective</AppText>
                          <AppText size={14} family='InterBold' color='black'>{getTourObjective()}</AppText>
                        </View>
                      )}
                    </View>
                  </>
                )
              }

              <View style={[styles.row, { gap: 21, marginTop: 15 }]}>
                <View style={styles.firstViewModal}>
                  <AppText size={14} family='InterMedium' color='#333333'>{leaveCheck ? "Leave Type" : "Objective"}</AppText>
                  <AppText size={14} family='InterBold' color='black'>{attendanceData?.working_type}</AppText>
                </View>
                {
                  !leaveCheck && (
                    <Pressable style={[styles.firstViewModal, { flex: 0.45 }]} onPress={handleLocation}>
                      <AppText size={14} family='InterMedium' color='#333333'>Punch In Location</AppText>
                      <View style={[styles.row, { gap: 5 }]}>
                        <LOcationIcon />
                        <AppText size={14} family='InterMedium' color={colors.blue}>View</AppText>
                      </View>
                    </Pressable>
                  )
                }

              </View>

              {
                leaveCheck && (
                  <View style={[styles.row, { gap: 21, marginTop: 15 }]}>
                    <View style={styles.firstViewModal}>
                      <AppText size={14} family='InterMedium' color='#333333'>Leave Reason</AppText>
                      <AppText size={14} family='InterBold' color='black'>{attendanceData?.punchin_summary}</AppText>
                    </View>


                  </View>
                )
              }

              {
                !leaveCheck && (
                  <>
                    {/* <View style={[styles.row, { gap: 21, marginTop: 15 }]}>
                    <View style={[styles.firstViewModal]}>
                      <AppText size={14} family='InterMedium' color='#333333'>Punch Out Location</AppText>
                      <View style={[styles.row, { gap: 5 }]}>
                        <LOcationIcon />
                        <AppText size={14} family='InterMedium' color={colors.blue}></AppText>
                      </View>
                    </View>
                  </View> */}
                    {/* <View style={[styles.row, { gap: 21, marginTop: 15 }]}>
                    <View style={[styles.firstViewModal]}>
                      <AppText size={14} family='InterMedium' color='#333333'>Punch In Summary</AppText>
                      <AppText size={14} family='InterBold' color='black'>{attendanceData?.punchin_summary}</AppText>
                    </View>
                  </View> */}
                    <View style={[styles.row, { gap: 21, marginTop: 15 }]}>
                      <View style={[styles.firstViewModal, { flex: 1 }]}>
                        <AppText size={14} family='InterMedium' color='#333333'>Punch In Address</AppText>
                        <AppText size={14} family='InterBold' color='black'>{attendanceData?.punchin_address}</AppText>
                      </View>
                    </View>
                  </>
                )
              }
              {
                !leaveCheck && !attendanceDataVisit?.city_names_string && (
                  <>
                    <View style={[styles.row, { gap: 21, marginTop: 15 }]}>
                      <View style={[styles.firstViewModal, { flex: 1 }]}>
                        <AppText size={14} family='InterMedium' color='#333333'>Tour Plan Objective</AppText>
                        <AppText size={14} family='InterBold' color='black'>{getTourObjective()}</AppText>
                      </View>
                    </View>
                  </>
                )
              }
              {
                (attendanceData?.attendance_status == 1 || attendanceData?.attendance_status == 2 || hirarchyLevelCheck) ? (
                  <View style={[styles.approveRejectView, styles.row, { gap: 20 }]}>
                    <View style={[styles.approveView, styles.row]}>
                      <Pressable
                        style={[styles.circle, styles.center]}
                        onPress={() => {

                          // Prevent self-approval
                          if (user?.id === attendanceData?.user_id || !hirarchyLevelCheck) {
                            return;
                          }

                          const isCurrentlyApproved = punchInStatus === 1;
                          const actionText = isCurrentlyApproved ? 'unapprove' : 'approve';

                          Alert.alert(
                            "Confirm action",
                            `Are you sure you want to ${actionText} this attendance record?`,
                            [
                              {
                                text: "Cancel",
                                style: "cancel",
                              },
                              {
                                text: isCurrentlyApproved ? "Unapprove" : "Approve",
                                style: isCurrentlyApproved ? "destructive" : "default",
                                onPress: () => {
                                  // Only change status if user confirms
                                  setPunchInStatus(isCurrentlyApproved ? 3 : 1);
                                  setRemark('');
                                  setRemarkError('');
                                },
                              },
                            ],
                            { cancelable: true }
                          );
                        }}
                      >
                        <View
                          style={[
                            styles.circleInner,
                            punchInStatus === 1 && { backgroundColor: "#339D4F", borderRadius: 12 },
                          ]}
                        />
                      </Pressable>
                      <AppText size={14} color='#339D4F' family='InterRegular'>Approved</AppText>
                    </View>

                    <View style={[styles.approveView, styles.row]}>
                      <Pressable style={[styles.circle, styles.center, { borderColor: "#FF3333" }]} onPress={() => {
                        if (user?.id == attendanceData?.user_id || !hirarchyLevelCheck) {
                          return
                        }
                        if (punchInStatus == 2) {
                          setPunchInStatus(3)
                        } else {
                          setPunchInStatus(2)
                          actionSheetRef1.current?.show()
                          setTimeout(() => {
                            remarkInputRef.current?.focus();
                          }, 200);
                        }
                      }}>
                        <View style={[styles.circleInner, punchInStatus == 2 && { backgroundColor: "#FF3333", borderRadius: 12, }]} />
                      </Pressable>
                      <AppText size={14} color='#FF3333' family='InterRegular'>Rejected</AppText>
                    </View>
                  </View>
                ) : (
                  <View style={{ height: 30 }} />
                )
              }


              {punchInStatus === 2 && (
                <View style={{ marginBottom: 20 }}>
                  <AppText size={14} color="#333333" family="InterMedium">
                    Remark <AppText color="red">*</AppText>
                  </AppText>

                  <Pressable
                    style={{
                      marginTop: 8,
                      borderWidth: 1,
                      borderColor: remarkError ? 'red' : '#d1d5db',
                      borderRadius: 8,
                      backgroundColor: '#f9fafb',
                    }}
                    onPress={() => {
                      if (user?.id == attendanceData?.user_id || !hirarchyLevelCheck) {
                        return
                      }
                      actionSheetRef1.current?.show()
                      setTimeout(() => {
                        remarkInputRef.current?.focus();
                      }, 200);
                    }}
                  >
                    <TextInput
                      // multiline
                      // numberOfLines={3}
                      editable={false}
                      value={remark}
                      onChangeText={(text) => {
                        setRemark(text);
                        if (remarkError) setRemarkError(''); // clear error on typing
                      }}
                      placeholder="Enter reason for rejection..."
                      placeholderTextColor="#9ca3af"
                      style={{
                        padding: 12,
                        fontSize: 14,
                        color: '#1f2937',
                        textAlignVertical: 'top',
                      }}
                      onPress={() => {
                        if (user?.id == attendanceData?.user_id || !hirarchyLevelCheck) {
                          return
                        }
                        actionSheetRef1.current?.show()
                        setTimeout(() => {
                          remarkInputRef.current?.focus();
                        }, 200);
                      }}
                    />
                  </Pressable>

                  {remarkError ? (
                    <AppText size={12} color="red" family="InterRegular" style={{ marginTop: 4 }}>
                      {remarkError}
                    </AppText>
                  ) : null}
                </View>
              )}

            </View>
          </ScrollView>
          <Pressable
            style={[
              styles.submit,
              { height: 44, marginHorizontal: 20, },
              styles.center,
              isSubmitting && { opacity: 0.6 },
            ]}
            disabled={isSubmitting}

            onPress={async () => {
              if (user?.id == attendanceData?.user_id || !hirarchyLevelCheck) {
                setRemark('');
                setRemarkError('');
                setPunchInStatus(3);     // reset selection
                actionSheetRef.current?.hide();
                return
              }
              if (!attendanceData?.id) {
                Alert.alert("Error", "No attendance record selected");
                return;
              }

              if (punchInStatus === 3) {
                Alert.alert("No change", "Please select Approve or Reject.");
                return;
              }

              // ── Validation for Reject case ────────────────────────
              if (punchInStatus === 2) {
                if (!remark.trim()) {
                  setRemarkError("Remark is required when rejecting");
                  return;
                }
                if (remark.trim().length < 1) {
                  setRemarkError("Remark must be at least 5 characters");
                  return;
                }
              }

              try {
                // Prepare payload
                const payload: any = {
                  attendance_id: attendanceData?.id,
                  status: punchInStatus,           // 1 = Approve, 2 = Reject
                };

                // Only send remark when rejecting
                if (punchInStatus === 2) {
                  payload.remark_status = remark.trim();
                }

                await changeStatus(payload);

                Alert.alert(
                  "Success",
                  `Attendance record has been ${punchInStatus === 1 ? "approved" : "rejected"}.`,
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        // Reset local states when closing
                        setRemark('');
                        setRemarkError('');
                        setPunchInStatus(3);     // reset selection
                        actionSheetRef.current?.hide();

                        // Refresh list
                        handleAttendanceList(
                          attendanceType,
                          selectedUserId,
                          selectedStatus,
                          startDate,
                          endDate
                        );
                      },
                    },
                  ]
                );
              } catch (err: any) {
                console.log("Status change failed:", err);
                Alert.alert(
                  "Failed",
                  err?.response?.data?.message || "Could not update attendance status."
                );
              }
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <AppText size={16} color="white" family="InterBold">
                Submit
              </AppText>
            )}
          </Pressable>
          {/* {Platform.OS == "ios" && <View style={{height: 50}} />} */}
        </View>
      </ActionSheet>
      <ActionSheet
        ref={actionSheetRef1}
        gestureEnabled={false}
        containerStyle={{
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          backgroundColor: 'white',
          // paddingBottom: 20,
          height: 'auto'

        }}
        onClose={() => {
          // if (remark.length < 1) {
          //   setPunchInStatus(2)
          // }

        }}
        indicatorStyle={{
          height: 0,
          backgroundColor: 'transparent',
        }}
        closeOnTouchBackdrop={true}

      >
        <View style={[{}]}>
          <View style={[styles.modalheader]}>
            <AppText size={16} color='white' family='InterSemiBold'>Type Remark</AppText>
            <Pressable style={{ position: "absolute", right: 15 }} onPress={() => {
              actionSheetRef1?.current?.hide();
              // setIsModalVisible(false)
            }}>
              <CrossIcon />
            </Pressable>
          </View>
          <View style={{ marginVertical: 20, paddingHorizontal: 20 }}>
            <AppText size={14} color="#333333" family="InterMedium">
              Remark <AppText color="red">*</AppText>
            </AppText>

            <View
              style={{
                marginTop: 8,
                borderWidth: 1,
                borderColor: remarkError ? 'red' : '#d1d5db',
                borderRadius: 8,
                backgroundColor: '#f9fafb',
              }}
            >
              <TextInput
                // multiline
                // numberOfLines={3}
                ref={remarkInputRef}
                value={remark}
                onChangeText={(text) => {
                  setRemark(text);
                  if (remarkError) setRemarkError(''); // clear error on typing
                }}
                placeholder="Enter reason for rejection..."
                placeholderTextColor="#9ca3af"
                style={{
                  padding: 12,
                  fontSize: 14,
                  color: '#1f2937',
                  textAlignVertical: 'top',
                }}
              />
            </View>

            {remarkError ? (
              <AppText size={12} color="red" family="InterRegular" style={{ marginTop: 4 }}>
                {remarkError}
              </AppText>
            ) : null}
          </View>
          <Pressable
            style={[
              styles.submit,
              { height: 44, marginHorizontal: 20 },
              styles.center,
              isSubmitting && { opacity: 0.6 },
            ]}
            disabled={isSubmitting}

            onPress={async () => {
              if (user?.id == attendanceData?.user_id) {
                setRemark('');
                setRemarkError('');
                setPunchInStatus(3);     // reset selection
                actionSheetRef.current?.hide();
                return
              }
              if (!attendanceData?.id) {
                Alert.alert("Error", "No attendance record selected");
                return;
              }

              if (punchInStatus === 3) {
                Alert.alert("No change", "Please select Approve or Reject.");
                return;
              }

              // ── Validation for Reject case ────────────────────────
              if (punchInStatus === 2) {
                if (!remark.trim()) {
                  setRemarkError("Remark is required when rejecting");
                  return;
                }
                if (remark.trim().length < 1) {
                  setRemarkError("Remark must be at least 5 characters");
                  return;
                }
              }

              try {
                // Prepare payload
                const payload: any = {
                  attendance_id: attendanceData?.id,
                  status: punchInStatus,           // 1 = Approve, 2 = Reject
                };

                // Only send remark when rejecting
                if (punchInStatus === 2) {
                  payload.remark_status = remark.trim();
                }

                await changeStatus(payload);

                Alert.alert(
                  "Success",
                  `Attendance record has been ${punchInStatus === 1 ? "approved" : "rejected"}.`,
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        // Reset local states when closing
                        setRemark('');
                        setRemarkError('');
                        setPunchInStatus(3);     // reset selection
                        actionSheetRef.current?.hide();
                        actionSheetRef1.current?.hide();

                        // Refresh list
                        handleAttendanceList(
                          attendanceType,
                          selectedUserId,
                          selectedStatus,
                          startDate,
                          endDate
                        );
                      },
                    },
                  ]
                );
              } catch (err: any) {
                console.log("Status change failed:", err);
                Alert.alert(
                  "Failed",
                  err?.response?.data?.message || "Could not update attendance status."
                );
              }
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <AppText size={16} color="white" family="InterBold">
                Submit
              </AppText>
            )}
          </Pressable>
          <View style={{ height: 30 }} />
        </View>
      </ActionSheet>
    </SafeAreaView>
  )
}

// Local styles for dropdowns (add to your styles file or keep here)
const localStyles = StyleSheet.create({
  typeSelector: {
    width: '40%',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 82, 153, 0.09)',
    borderRadius: 25,
    padding: 3,
  },
  typeOption: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  typeOptionActive: {
    backgroundColor: 'white',
  },
  statusChipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  statusChip: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d8dcec',
    backgroundColor: 'white',
  },
  approveStatusChip: {
    borderColor: '#339D4F',
    backgroundColor: '#339D4F18',
  },
  pendingStatusChip: {
    borderColor: '#E78422',
    backgroundColor: '#E7842218',
  },
  rejectStatusChip: {
    borderColor: '#D31111',
    backgroundColor: '#D3111118',
  },
  approveStatusChipActive: {
    backgroundColor: '#339D4F',
  },
  pendingStatusChipActive: {
    backgroundColor: '#E78422',
  },
  rejectStatusChipActive: {
    backgroundColor: '#D31111',
  },
  dropdown: {
    height: 50,
    backgroundColor: 'rgba(57, 82, 153, 0.07)',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flex: 1,
  },
  placeholderStyle: {
    fontSize: 14,
    color: '#718096',
  },
  selectedTextStyle: {
    fontSize: 14,
    color: 'black',
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 14,
  },
  clearAllButton: {
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'white',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  designationChip: {
    backgroundColor: colors.blue + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  designationModal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    marginBottom: 15,
  },
  designationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  designationCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    backgroundColor: 'transparent',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  designationCheckboxSelected: {
    borderColor: colors.blue,
    backgroundColor: colors.blue,
  },
  emptyDesignationText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#718096',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.blue,
    alignItems: 'center',
  },
});

export default AttendanceReport
