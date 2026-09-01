import { View, ScrollView, StatusBar, Switch, FlatList, Pressable, TouchableOpacity, Modal, useWindowDimensions, Modal as RNModal, TextInput, ActivityIndicator, Alert, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { styles } from './styles'
import { rw } from '../../utils/responsive'
import { FirstUserIcon, LogoIcon, SecondUserIcon } from '../../assets/svgs/HomePageSvgs'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppText from '../../components/AppText/AppText'
import { CrossIcon } from '../../assets/svgs/SvgsFile'
import { colors } from '../../utils/Colors'
import { dashboardTiles } from '../../components/Comman/CommanFunction'
import TileCard from '../../components/atoms/TileCard'
import { NavigationProp, ParamListBase, useFocusEffect, useNavigation } from '@react-navigation/native'
import { useDispatch } from 'react-redux'
import { setActiveBg } from '../../components/redux/slice/AuthSlice'
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet'
import store, { useAppSelector } from '../../components/redux/Store'
import axios from 'axios'
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { PanGestureHandlerGestureEvent } from 'react-native-gesture-handler'
import LinearGradient from 'react-native-linear-gradient'
import ProfileTab from './ProfileTab'
import Toast from 'react-native-toast-message'
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown'
import useLocationHook from '../../api/hooks/uselocationhook'
import CustomerCalendar from '../../components/CustomCalendar/CalendarPopupView'
import { fonts } from '../../utils/typography'
import { SCREEN_HEIGHT } from '../../utils/misc'
import AttendanceCard from '../../components/atoms/AttendanceCard'
import { attendanceData } from '../../utils/CommanFunction'
import TargetAchievementCard from '../../components/atoms/TargetAchievementCard'
import FieldActivitiesCard from '../../components/atoms/FieldActivitiesCard'
import RetailersOverviewCard from '../../components/atoms/RetailersOverviewCard'
import TopProductsCard from '../../components/atoms/TopProductsCard'
import { DashboardAlerts, DashboardHighlights, StatePerformanceCard, ZonePerformanceCard } from '../../components/atoms/DashboardInsights'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { startLiveLocationTracking, stopLiveLocationTracking } from '../../services/liveLocationService'
import { APP_VERSION, compareVersions } from '../../utils/appVersion'
import NotificationBell from '../../components/NotificationBell'
import PrimaryShineChip from '../../components/atoms/PrimaryShineChip'
import DealerDistributorPerformanceCard from '../../components/atoms/DealerDistributorPerformanceCard'
import { BASE_URL } from '../../api/AxiosClient'

interface DropdownItem {
  label: string;
  value: string | number;
}

interface CustomerTypeItem {
  id: string;
  title: string;
  value: string;
  customerTypeId: string;
}

const Home = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const dispatch = useDispatch();
  const actionSheetRef = useRef<ActionSheetRef>(null);
  const [pressType, setPressType] = useState<string | null>(null)
  const { user } = useAppSelector(
    (state) => state.auth
  );

  const [isPunchedIn, setIsPunchedIn] = useState<any>(false);
  const [todayPunchInData, setTodayPunchInData] = useState<any>(null);
  const [loadingPunchStatus, setLoadingPunchStatus] = useState(true);
  const [loaderLeave, setLoaderLeave] = useState(false);
  const [errorLeave, setErrorLeave] = useState('');

  // ─── Leave Modal States ─────────────────────────────────────────────
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveBalances, setLeaveBalances] = useState<any>(null);
  const [homeData, setHomeData] = useState<any>(null);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [homeLoading, setHomeLoading] = useState(false);
  const [performanceTab, setPerformanceTab] = useState<'zone' | 'state'>('zone');

  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const { coords, } = useLocationHook();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedBalType, setSelectedBalType] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [users, setUsers] = useState<DropdownItem[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<DropdownItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<DropdownItem | null>(null);
  const [userSearchText, setUserSearchText] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [customerTypes, setCustomerTypes] = useState<CustomerTypeItem[]>([]);
  const [customerTypesLoading, setCustomerTypesLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [showCal, setShowCal] = useState(false);
  const [rangeType, setRange] = useState('currentMonth');

  const [stats, setStats] = useState<{
    total_customers: number;
    total_orders: number;
    total_order_value: number;
    total_quantity?: number; // optional
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = navigation.addListener('tabPress', (e: any) => {
        // This runs when user taps on the Home tab button
        if (isDrawerOpen) {
          e.preventDefault();
          handleDrawerClose();
        }
        // If drawer is closed, do nothing → normal behavior (stay on Home)
      });

      return unsubscribe; // cleanup
    }, [isDrawerOpen])   // re-run when drawer state changes
  );

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
  };

  const startLiveLocationFromPunchStatus = () => {
    startLiveLocationTracking({
      showDisclosure: false,
      captureImmediately: true,
    }).catch(error => {
      console.log('Failed to start live location from punch status:', error);
    });
  };

  const stopLiveLocationFromPunchStatus = () => {
    stopLiveLocationTracking({ captureFinalLocation: false }).catch(error => {
      console.log('Failed to stop live location from punch status:', error);
    });
  };

  const leaveTypes = [
    { label: 'Full Day Leave', value: 'Full Day Leave' },
    { label: 'First Half Leave', value: 'First Half Leave' },
    { label: 'Second Half Leave', value: 'Second Half Leave' },
    // { label: 'Leave', value: 'Leave' },
  ];

  const casualBalance = Number(leaveBalances?.casual ?? 0);
  const compOffBalance = Number(leaveBalances?.comp_off ?? 0);
  const balanceTypes = [
    { label: `Casual Leave (${casualBalance})`, value: 'casual' },
    { label: `Comp-off (${compOffBalance})`, value: 'comp_off' },
  ];
  // Your token – in real app use secure storage / redux / context

  const fetchPunchInStatus = async () => {
    try {
      setLoadingPunchStatus(true);
      const token = store.getState()?.auth?.token;

      const res = await axios.get(`${BASE_URL}api/getPunchin`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = res.data;

      if (data.status === 'success' && data.data?.length > 0) {
        const latest = data.data[0]; // assuming latest or only one for today
        // You may want to also check punchin_date === today's date
        const isToday =
          latest.punchin_date ==
          new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(new Date());

        if (isToday && latest?.punchin_date && !latest?.punchout_date) {
          setIsPunchedIn(true);
          startLiveLocationFromPunchStatus();

        } else {
          setIsPunchedIn(false);
          setTodayPunchInData(null);
          stopLiveLocationFromPunchStatus();
        }
        if (latest?.punchout_date && latest?.punchin_date && isToday) {
          setIsPunchedIn("end");
          stopLiveLocationFromPunchStatus();
        }
        setTodayPunchInData(latest);
      } else {
        setIsPunchedIn(false);
        setTodayPunchInData(null);
        stopLiveLocationFromPunchStatus();
      }
    } catch (err) {
      console.error('Failed to fetch punch-in status:', err);
      setIsPunchedIn(false);
      setTodayPunchInData(null);
    } finally {
      setLoadingPunchStatus(false);
    }
  }

  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchPunchInStatus();
      fetchHomeData();
      checkAppVersion();
    }, [])
  );


  useEffect(() => {
    if (showUserModal) {
      fetchUsers(1);
    }
  }, [showUserModal]);

  // ─── Fetch Leave Balances ───────────────────────────────────────────
  const fetchHomeData = async () => {
    try {
      setHomeLoading(true);
      const token = store.getState()?.auth?.token;

      const res = await axios.get(`${BASE_URL}api/attendance/today-summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.data?.status === "success") {
        setHomeData(res.data.data);
      }
    } catch (err) {
      console.log('Failed to fetch home data:', err);
    } finally {
      setHomeLoading(false);
    }
  };
  const fetchLeaveBalances = async () => {
    try {
      setLoadingBalances(true);
      const token = store.getState()?.auth?.token;

      const res = await axios.get(`${BASE_URL}api/leaves/balance`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.data?.status === true) {
        setLeaveBalances(res.data.data || res.data);
      }
    } catch (err) {
      console.log('Failed to fetch leave balances:', err);
    } finally {
      setLoadingBalances(false);
    }
  };

  // ─── Submit Leave Request ───────────────────────────────────────────
  const submitLeaveRequest = async () => {
    if (!selectedType || !selectedBalType || !reason.trim()) {
      // alert('Please fill all required fields');
      Toast.show({ type: "info", text1: "Please fill all required fields" })
      return;
    }
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const inclusiveDays = Math.floor(
      (new Date(toDate).setHours(0, 0, 0, 0) - new Date(fromDate).setHours(0, 0, 0, 0)) /
      millisecondsPerDay,
    ) + 1;
    if (inclusiveDays <= 0) {
      const message = 'To date cannot be before from date';
      setErrorLeave(message);
      Toast.show({ type: 'error', text1: message });
      return;
    }
    const isHalfDay = selectedType === 'First Half Leave' || selectedType === 'Second Half Leave';
    if (isHalfDay && inclusiveDays !== 1) {
      const message = 'Half-day leave must start and end on the same date';
      setErrorLeave(message);
      Toast.show({ type: 'error', text1: message });
      return;
    }
    const requiredBalance = isHalfDay ? 0.5 : inclusiveDays;
    const availableBalance = selectedBalType === 'comp_off' ? compOffBalance : casualBalance;
    if (availableBalance < requiredBalance) {
      const balanceLabel = selectedBalType === 'comp_off' ? 'Comp-off' : 'Casual Leave';
      const message = `Insufficient ${balanceLabel} balance. Available: ${availableBalance}, Required: ${requiredBalance}`;
      setErrorLeave(message);
      Toast.show({ type: 'error', text1: message });
      return;
    }
    setErrorLeave('');
    setLoaderLeave(true)
    try {
      const token = store.getState()?.auth?.token;
      const userId = user?.id;

      const payload = {
        user_id: userId,
        from_date: fromDate.toISOString().split('T')[0],
        to_date: toDate.toISOString().split('T')[0],
        type: selectedType,
        // addLeaves validates these exact display values, while the balance
        // endpoint uses the canonical keys casual and comp_off.
        bal_type: selectedBalType === 'comp_off' ? 'Comp-off Balance' : 'Casual Balance',
        reason: reason.trim(),
      };


      const res = await axios.post(`${BASE_URL}api/addLeaves`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setLoaderLeave(false)
      console.log(res?.data, 'errororoororororr')
      if (res.data?.status === 'success') {
        Toast.show({ type: "success", text1: "Leave request submitted successfully" })
        // alert('Leave request submitted successfully!');
        setShowLeaveModal(false);
        setSelectedType(null);
        setSelectedBalType(null);
        setReason('');
        fetchLeaveBalances(); // refresh balances
      } else {
        Toast.show({ type: "error", text1: res.data?.message || 'Failed to submit leave' })
        // alert(res.data?.message || 'Failed to submit leave');
      }
      setErrorLeave('')
    } catch (err: any) {
      console.log('Leave submit error:', err?.response);
      Toast.show({ type: "error", text1: err.response?.data?.message || 'Error submitting leave request' })
      setErrorLeave(err.response?.data?.message || 'Error submitting leave request')
      setLoaderLeave(false)
      // alert(err.response?.data?.message || 'Error submitting leave request');
    }
  };

  // ─── Handle toggle press ────────────────────────────────────────
  const handleToggleAttendance = () => {
    if (isPunchedIn) {
      // Already punched in → show details / punch-out screen
      navigation.navigate('AttendanceScreen', {
        item: todayPunchInData,   // pass current punch-in record
      });
    } else {
      // Not punched in → go to punch-in flow
      navigation.navigate('AttendanceScreen');
    }
  };

  const isDistributorType = (title: string) =>
    title?.toLowerCase?.().includes('distributor');

  const handleSelectType = (type: CustomerTypeItem) => {
    actionSheetRef.current?.hide();
    console.log('Selected customer type:', type);

    if (pressType == 'add') {
      navigation.navigate('AddSecondaryCustomer', {
        type: type.value,
        customerTypeId: type.customerTypeId,
        customerTypeName: type.title,
      })
    } else {
      navigation.navigate("CustomerList", {
        customerTypeId: type.customerTypeId,
        customerTypeName: type.title,
      })
    }
  };

  function getFirstName(fullName: string | null | undefined) {
    if (!fullName || typeof fullName !== 'string') return '';

    // Split by any whitespace and take first non-empty part
    const parts = fullName.trim().split(/\s+/);
    return parts[0] || '';
  }

  //animation code starts
  const { height } = useWindowDimensions();
  const { width } = useWindowDimensions();
  const y = useSharedValue(height);
  const x = useSharedValue(0);
  const isScrolling = useSharedValue(0);

  const unlockGestureHandler = (event: PanGestureHandlerGestureEvent) => {
    x.value = Math.max(0, Math.min(event.nativeEvent.absoluteX, width));
    isScrolling.value = 1;
  };

  const onGestureEnd = (event: PanGestureHandlerGestureEvent) => {
    isScrolling.value = 0;
    if (event.nativeEvent.absoluteX > width / 2) {
      // Open drawer
      x.value = withTiming(width, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    } else {
      // Close drawer
      x.value = withTiming(0, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  };

  const blurContainerStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: isScrolling.value ? 2 : -1, // Change z-index based on scroll state
    pointerEvents: isScrolling.value ? 'auto' : 'none', // Disable interaction when not scrolling
  }));


  const animatedProfileStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          x.value,
          [0, width],
          [-width, 0],
          'clamp'
        ),
      },
    ],
  }));



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
  const homeScreenStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          x.value,
          [0, width],
          [1, 0.85],
          'clamp'
        ),
      },
    ],
  }));

  const handleDrawerPress = () => {
    // Animate x value to full width
    x.value = withTiming(width, {
      duration: 500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    setIsDrawerOpen(true)
    dispatch(setActiveBg(true))
    // Set scrolling state to show blur
    // isScrolling.value = 1;
  };

  const handleDrawerClose = () => {
    x.value = withTiming(0, {
      duration: 500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    setIsDrawerOpen(false)
    dispatch(setActiveBg(false))
    // isScrolling.value = 0;
  };

  const normalizeCustomerTypes = (payload: any): CustomerTypeItem[] => {
    const rawList =
      payload?.data?.data ??
      payload?.data?.customer_types ??
      payload?.data?.types ??
      payload?.data ??
      payload?.customer_types ??
      payload?.types ??
      payload;

    if (!Array.isArray(rawList)) return [];

    return rawList
      .map((item: any, index: number) => {
        const title = String(
          item?.customertype_name ??
          item?.name ??
          item?.title ??
          item?.customer_type ??
          item?.type ??
          item?.label ??
          item?.value ??
          ''
        ).trim();

        const value = String(
          item?.customertype_name ??
          item?.type ??
          item?.value ??
          item?.customer_type ??
          item?.name ??
          item?.title ??
          title
        ).trim();

        if (!title || !value) return null;

        return {
          id: String(item?.id ?? item?.customertype ?? item?.value ?? `${value}-${index}`),
          title,
          value,
          customerTypeId: String(item?.id ?? item?.customer_type_id ?? item?.customertype ?? item?.value ?? ''),
        };
      })
      .filter((item): item is CustomerTypeItem => Boolean(item?.customerTypeId));
  };

  const fetchCustomerTypes = async () => {
    try {
      setCustomerTypesLoading(true);
      const token = store.getState()?.auth?.token;

      const res = await axios.get(`${BASE_URL}api/getCustomerTypeList`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const types = normalizeCustomerTypes(res?.data);
      setCustomerTypes(types);

      if (!types.length) {
        Toast.show({
          type: 'info',
          text1: 'No customer types found',
          position: 'top',
        });
      }
    } catch (error) {
      console.log('Customer type list error:', error);
      setCustomerTypes([]);
      Toast.show({
        type: 'error',
        text1: 'Failed to load customer types',
        position: 'top',
      });
    } finally {
      setCustomerTypesLoading(false);
    }
  };

  const openCustomerTypeSheet = (type: 'add' | 'view') => {
    setPressType(type);
    setCustomerTypes([]);
    actionSheetRef.current?.show();
    fetchCustomerTypes();
  };


  const fetchUsers = async (pageNum = 1) => {
    const token = store.getState().auth?.token;

    if (!token || loading || (!hasMore && pageNum !== 1)) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${BASE_URL}api/getMyHierarchyUsers?type=RETAILER`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const json = await response.json();

      const userData = json?.users || [];

      const userList: DropdownItem[] = userData.map((u: any) => ({
        label: u.name,
        value: u.id,
      }));

      const updatedUsers =
        pageNum === 1 ? userList : [...users, ...userList];

      setUsers(userList);

      // setPage(pageNum);
      // setHasMore(json.data.current_page < json.data.last_page);

    } catch (err) {
      console.error('Fetch users error:', err);
      Toast.show({ type: 'error', text1: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  const loadMoreUsers = () => {
    if (!loading && hasMore && !userSearchText) {
      fetchUsers(page + 1);
    }
  };

  useEffect(() => {
    const search = userSearchText.toLowerCase().trim();

    if (!search) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user =>
      user.label.toLowerCase().includes(search)
    );

    setFilteredUsers(filtered);
  }, [userSearchText, users]);


  const checkAppVersion = async () => {
    try {

      const token = store.getState()?.auth?.token;

      const response = await axios.get(
        `${BASE_URL}api/getAppVersion`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      // ======================================
      // CURRENT APP VERSION
      // ======================================
      const CURRENT_VERSION = APP_VERSION;

      // ======================================
      // SERVER VERSION
      // ======================================
      const SERVER_VERSION =
        Platform.OS === 'ios'
          ? response?.data?.data?.ios_version
          : response?.data?.data?.android_version;

      console.log('Current Version:', CURRENT_VERSION);
      console.log('Server Version:', SERVER_VERSION);

      // ======================================
      // VERSION CHECK
      // ======================================
      if (SERVER_VERSION && compareVersions(SERVER_VERSION, CURRENT_VERSION) > 0) {

        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'ForceUpdateScreen',
            },
          ],
        });

        return;
      }

    } catch (error) {
      console.log('Version check error:', error);
    }
  };

  return (
    <View style={[styles.container,]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={"light-content"}
      />
      <Animated.View style={[
        {
          position: 'absolute',
          width: '100%',
          height: '100%',
          zIndex: 1,
        },
        animatedProfileStyle
      ]}>
        <LinearGradient colors={['transparent', 'transparent']} style={{ flex: 1, height: height, width: "100%", position: 'absolute', }} />
        <ProfileTab handleDrawerClose={handleDrawerClose} />

        <Animated.View style={[blurContainerStyle]}>

        </Animated.View>

      </Animated.View>
      <View style={{ flex: 1 }}>
        <Animated.View style={[{ flex: 1, }, homeScreenStyle]}>
          <ScrollView style={[styles.container, { marginBottom: 100 }]} showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps='handled'>
            <View style={styles.blueContaier} />
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
              <View style={[styles.header, styles.row]}>
                <Pressable onPress={handleDrawerPress}>
                  <LogoIcon />
                </Pressable>
                <View style={[styles.row, styles.button]}>
                  <Pressable
                    style={styles.applyLeaveButton}
                    onPress={() => {
                      setErrorLeave('')
                      setShowLeaveModal(true);
                      fetchLeaveBalances();
                    }}>
                    <AppText color={colors.blue} size={10} family='InterSemiBold' align='center'>Apply Leave</AppText>
                  </Pressable>
                  <NotificationBell />
                  {loadingPunchStatus ? (
                    <AppText size={14} color="white">...</AppText>
                  ) : (
                    <>
                      {
                        isPunchedIn == "end" ? (
                          <>
                            <Pressable style={{ height: 30, paddingHorizontal: 12, borderRadius: 19, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
                              <AppText color={colors.blue} size={12} family='InterMedium'>Day Ended</AppText>
                            </Pressable>
                          </>
                        ) : (
                          <Switch
                            value={isPunchedIn}
                            onValueChange={() => handleToggleAttendance()}
                            trackColor={{ false: '#767577', true: '#81b0ff' }}
                            thumbColor={isPunchedIn ? '#36fd36' : '#f4f3f4'}
                          />
                        )
                      }

                    </>
                  )}
                </View>
              </View>
              <View style={styles.helloName}>
                <AppText size={24} color='white' family='InterLight'>Hello!
                  <AppText size={26} color='white' family='InterSemiBold'> {getFirstName(user?.name)}</AppText>
                </AppText>
              </View>

              <View style={styles.topOptionView}>
                <FlatList
                  data={dashboardTiles}
                  numColumns={3}
                  keyExtractor={(item) => item.id}
                  columnWrapperStyle={{ justifyContent: "space-between" }}
                  contentContainerStyle={{ padding: rw(12), gap: 12, marginTop: rw(21), backgroundColor: 'white', marginHorizontal: 19, borderRadius: 10 }}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <TileCard item={item} onpress={(item: any) => {
                      if (item?.id == 2 || item?.id == 3) {
                        if (item?.id == 2) {
                          openCustomerTypeSheet('add');
                        }
                        if (item?.id == 3) {
                          openCustomerTypeSheet('view');
                        }
                      } else {
                        navigation.navigate(item?.navigateTo)
                      }

                    }} />
                  )}
                />
              </View>

              <View style={styles.mainContainer}>
                <View style={[styles.row, { justifyContent: 'space-between' }]}>
                  <View style={[styles.row, { gap: 10 }]}>
                    <AppText color={colors.black} size={18} family="InterSemiBold">Attendance</AppText>
                    <PrimaryShineChip label="TODAY" />
                  </View>
                  <Pressable onPress={() => navigation?.navigate("AttendanceViewAllScreen")} hitSlop={10}>
                    <AppText color={colors.blue} family={'InterMedium'} size={13}>View All →</AppText>
                  </Pressable>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              >
                {attendanceData.map((item: any, index: number) => (
                  <AttendanceCard
                    key={item.id}
                    item={item}
                    index={index}
                    data={homeData}
                    onPress={(selectedItem: any) => {
                      console.log('Attendance card pressed:', selectedItem.label);
                      // You can navigate or show details here
                      // Example: navigation.navigate('AttendanceDetail', { type: selectedItem.label });
                    }}
                  />
                ))}
              </ScrollView>

              <View style={styles.mainContainer}>
                <View style={[styles.row, { justifyContent: 'space-between' }]}>
                  <View style={[styles.row, { gap: 6, alignItems: 'baseline' }]}>
                    <AppText color={colors.black} size={18} family="InterSemiBold">Target VS Achievement</AppText>
                    <PrimaryShineChip />
                  </View>
                  <Pressable onPress={() => navigation.navigate("TargetArchieViewAllScreen")} hitSlop={10}>
                    <AppText color={colors.blue} family={'InterMedium'} size={13}>View All →</AppText>
                  </Pressable>
                </View>
              </View>
              <TargetAchievementCard
                homeData={homeData}
                onViewAllPress={() => console.log('View All pressed')}
              />
              <View style={styles.mainContainer}>
                <View style={[styles.row, { gap: 6 }]}>
                  <AppText color={colors.black} size={18} family="InterSemiBold" style={{ flex: 1 }}>Zone and State Performance</AppText>
                  <PrimaryShineChip />
                  <View style={styles.todayContainer}>
                    <AppText color={colors.blue} family="InterMedium" size={11}>MTD</AppText>
                  </View>
                </View>
                <View style={styles.performanceTabs}>
                  {(['zone', 'state'] as const).map(tab => {
                    const selected = performanceTab === tab;
                    return (
                      <Pressable
                        key={tab}
                        style={[styles.performanceTab, selected && styles.performanceTabActive]}
                        onPress={() => setPerformanceTab(tab)}
                      >
                        <AppText
                          color={selected ? colors.white : colors.blue}
                          family="InterSemiBold"
                          size={13}
                        >
                          {tab === 'zone' ? 'Zone' : 'State'}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              {performanceTab === 'zone' ? (
                <ZonePerformanceCard data={homeData} />
              ) : (
                <StatePerformanceCard data={homeData} />
              )}
              <View style={styles.mainContainer}>
                <View style={[styles.row, { gap: 6, alignItems: 'baseline' }]}>
                  <AppText color={colors.black} size={18} family="InterSemiBold">Customer Order</AppText>
                </View>
              </View>
              <RetailersOverviewCard data={homeData} />
              <View style={styles.mainContainer}>
                <View style={[styles.row, { justifyContent: 'space-between' }]}>
                  <AppText color={colors.black} size={18} family="InterSemiBold">
                    Dealer/Distributor Performance
                  </AppText>
                  <Pressable
                    onPress={() => navigation.navigate('DealerDistributorPerformanceViewAllScreen')}
                    hitSlop={10}
                  >
                    <AppText color={colors.blue} family="InterMedium" size={13}>View All →</AppText>
                  </Pressable>
                </View>
              </View>
              <DealerDistributorPerformanceCard data={homeData} />
              <View style={styles.mainContainer}>
                <AppText color={colors.black} size={18} family="InterSemiBold">Top Performing SKUs</AppText>
              </View>
              {homeData && <TopProductsCard data={homeData} />}
              <View style={styles.mainContainer}>
                <View style={[styles.row, { justifyContent: 'space-between' }]}>
                  <View style={[styles.row, { gap: 10 }]}>
                    <AppText color={colors.black} size={18} family="InterSemiBold">Promotional Activities</AppText>
                  </View>
                  <Pressable
                    onPress={() => navigation.navigate('PromotionalActivitiesViewAllScreen')}
                    hitSlop={10}
                  >
                    <AppText color={colors.blue} family={'InterMedium'} size={13}>View All →</AppText>
                  </Pressable>
                </View>
              </View>
              <FieldActivitiesCard data={homeData} />
              <View style={styles.mainContainer}>
                <AppText color={colors.black} size={18} family="InterSemiBold">Highlights</AppText>
              </View>
              <DashboardHighlights data={homeData} />
              <View style={styles.mainContainer}>
                <View style={[styles.row, { gap: 10 }]}>
                  <AppText color={colors.black} size={18} family="InterSemiBold">Alerts</AppText>
                  <View style={styles.todayContainer}>
                    <AppText color={colors.blue} family="InterMedium" size={11}>MTD</AppText>
                  </View>
                </View>
              </View>
              <DashboardAlerts
                data={homeData}
                onAlertPress={(alert) => {
                  if (alert.destination === 'target') {
                    navigation.navigate('TargetArchieViewAllScreen', { zone: alert.zone });
                    return;
                  }
                  if (alert.destination === 'user_activity') {
                    navigation.navigate('UserActivityPage', { zone: alert.zone });
                    return;
                  }
                  navigation.navigate('AttendanceViewAllScreen', {
                    zone: alert.zone,
                    type: alert.type,
                  });
                }}
              />

              <View style={{ height: 40 }} />
            </SafeAreaView>
          </ScrollView>
        </Animated.View>
      </View>
      {/* ─── Leave Request Modal ──────────────────────────────────────────── */}
      <RNModal
        visible={showLeaveModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowLeaveModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)', }}>
          <View
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              paddingBottom: 40,
              maxHeight: '90%',
              minHeight: '90%',
              height: '90%'
            }}
          >
            <KeyboardAwareScrollView
              style={{ flex: 1 }}
              bottomOffset={50}
              // contentContainerStyle={{ padding: 16 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <AppText size={20} family="InterSemiBold" color={colors.blue}>
                  Leave Request
                </AppText>
                <TouchableOpacity onPress={() => setShowLeaveModal(false)}>
                  <CrossIcon />
                </TouchableOpacity>
              </View>

              {/* Leave Balances */}
              {/* <AppText underline='underline' size={16} family="InterBold" style={{ marginBottom: 12 }}>
                Current Leave Balances
              </AppText> */}

              {loadingBalances ? (
                <AppText>Loading balances...</AppText>
              ) : leaveBalances ? (
                <View style={[{ marginBottom: 24, flexWrap: 'wrap' }, styles.row]}>
                  {/* <View
                    style={{
                      flexDirection: 'row',
                      paddingVertical: 8,
                      width: '48%',
                      borderBottomWidth: 1,
                      borderBottomColor: '#f0f0f0',
                    }}
                  >
                    <AppText size={14} color='black' family='InterMedium'>{'Earned Leave:- '}</AppText>
                    <AppText size={14} color='black' family='InterBold'>{leaveBalances?.earned}</AppText>
                  </View> */}
                  {/* <View
                    style={{
                      flexDirection: 'row',
                      paddingVertical: 8,
                      width: '48%',
                      borderBottomWidth: 1,
                      borderBottomColor: '#f0f0f0',
                    }}
                  >
                    <AppText size={14} color='black' family='InterMedium'>{'Casual Leave:- '}</AppText>
                    <AppText size={14} color='black' family='InterBold'>{leaveBalances?.casual}</AppText>
                  </View> */}
                  {/* <View
                    style={{
                      flexDirection: 'row',
                      paddingVertical: 8,
                      width: '48%',
                      borderBottomWidth: 1,
                      borderBottomColor: '#f0f0f0',
                    }}
                  >
                    <AppText size={14} color='black' family='InterMedium'>{'Sick Leave:- '}</AppText>
                    <AppText size={14} color='black' family='InterBold'>{leaveBalances?.sick}</AppText>
                  </View> */}
                  {/* <View
                    style={{
                      flexDirection: 'row',
                      paddingVertical: 8,
                      width: '48%',
                      borderBottomWidth: 1,
                      borderBottomColor: '#f0f0f0',
                    }}
                  >
                    <AppText size={14} color='black' family='InterMedium'>{'Comp-off Leave:- '}</AppText>
                    <AppText size={14} color='black' family='InterBold'>{leaveBalances?.comp_off}</AppText>
                  </View> */}
                  {/* {Object.entries(leaveBalances).map(([key, value]: [string, any]) => (
                  <View
                    key={key}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingVertical: 8,
                      width:'48%',
                      borderBottomWidth: 1,
                      borderBottomColor: '#f0f0f0',
                    }}
                  >
                    <AppText>{key.replace(/([A-Z])/g, ' $1').trim()}</AppText>
                    <AppText family="InterSemiBold">{value}</AppText>
                  </View>
                ))} */}
                </View>
              ) : (
                <AppText color="gray">No balance data available</AppText>
              )}

              {/* Form */}
              <AppText size={15} family="InterMedium" style={{ marginBottom: 8 }}>
                From Date
              </AppText>
              <Pressable
                onPress={() => setShowFromPicker(true)}
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <AppText>{fromDate.toISOString().split('T')[0]}</AppText>
              </Pressable>

              {showFromPicker && (
                <DateTimePicker
                  value={fromDate}
                  mode="date"
                  display="default"
                  onChange={(_, date) => {
                    setShowFromPicker(false);
                    if (date) setFromDate(date);
                  }}
                />
              )}

              <AppText size={15} family="InterMedium" style={{ marginBottom: 8 }}>
                To Date
              </AppText>
              <Pressable
                onPress={() => setShowToPicker(true)}
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <AppText>{toDate.toISOString().split('T')[0]}</AppText>
              </Pressable>

              {showToPicker && (
                <DateTimePicker
                  value={toDate}
                  mode="date"
                  display="default"
                  onChange={(_, date) => {
                    setShowToPicker(false);
                    if (date) setToDate(date);
                  }}
                />
              )}

              <AppText size={15} family="InterMedium" style={{ marginBottom: 8 }}>
                Leave Type
              </AppText>
              <Dropdown
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}
                data={leaveTypes}
                labelField="label"
                valueField="value"
                placeholder="Select leave type"
                value={selectedType}
                onChange={(item) => setSelectedType(item.value)}
              />

              <AppText size={15} family="InterMedium" style={{ marginBottom: 8 }}>
                Balance Type
              </AppText>
              <Dropdown
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}
                data={balanceTypes}
                labelField="label"
                valueField="value"
                placeholder="Select balance type"
                value={selectedBalType}
                onChange={(item) => {
                  setSelectedBalType(item.value);
                  setErrorLeave('');
                }}
              />

              <AppText size={15} family="InterMedium" style={{ marginBottom: 8 }}>
                Reason
              </AppText>
              <TextInput
                multiline
                numberOfLines={4}
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 8,
                  padding: 12,
                  textAlignVertical: 'top',
                  minHeight: 80,
                  marginBottom: 24,
                }}
                value={reason}
                onChangeText={setReason}
                placeholder="Enter reason for leave..."
              />

              {/* Buttons */}
              {
                errorLeave && (
                  <AppText style={{ marginBottom: 10 }} color="red" family='InterSemiBold' size={14}>{errorLeave}</AppText>
                )
              }
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setShowLeaveModal(false)}
                  style={{
                    flex: 1,
                    padding: 14,
                    backgroundColor: '#f0f0f0',
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <AppText family="InterMedium">Cancel</AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={submitLeaveRequest}
                  style={{
                    flex: 1,
                    padding: 14,
                    backgroundColor: colors.blue,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                  disabled={loaderLeave}
                >
                  {
                    loaderLeave ? (
                      <ActivityIndicator size={'small'} color={'white'} />
                    ) : (
                      <AppText color="white" family="InterSemiBold">
                        Submit Request
                      </AppText>
                    )
                  }

                </TouchableOpacity>
              </View>
            </KeyboardAwareScrollView>
          </View>
        </View>
      </RNModal>

      <CustomerCalendar
        {...{ showCal, setShowCal }}
        minimumDate={new Date()}
        initialStartDate={startDate}
        initialEndDate={endDate}
        setStartDates={setStartDate}
        setEndDates={setEndDate}
        setRange={setRange}
        range={rangeType}
        onApplyClick={handleApply}
      />

      <ActionSheet
        ref={actionSheetRef}
        gestureEnabled
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: '#fff',
          paddingBottom: 20,
        }}
        indicatorStyle={{
          backgroundColor: '#D1D5DB',
          width: 40,
          height: 5,
        }}
        onClose={() => {
          setPressType(null)
        }}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          {/* Title */}
          <AppText
            size={18}
            color="#111827"
            family="InterSemiBold"
            align="center"
          >
            Select Customer Type
          </AppText>

          {/* Options */}
          {customerTypesLoading ? (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <ActivityIndicator color={colors.blue} />
            </View>
          ) : customerTypes.length ? (
            customerTypes.map((type) => {
              const Icon = isDistributorType(type.value) ? <FirstUserIcon /> : <SecondUserIcon />;

              return (
                <TouchableOpacity
                  key={type.id}
                  activeOpacity={0.7}
                  onPress={() => handleSelectType(type)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F3F4F6',
                  }}
                >
                  <View style={{ marginRight: 16 }}>{Icon}</View>

                  <AppText
                    size={16}
                    color="#1F2937"
                    family="InterMedium"
                  >
                    {type.title}
                  </AppText>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <AppText size={15} color="#6B7280" family="InterMedium">
                No customer types found
              </AppText>
            </View>
          )}

          {
            Platform.OS == "android" && (
              <View style={{ height: 20 }} />
            )
          }

          {/* Cancel button */}
          {/* <TouchableOpacity
            onPress={() => actionSheetRef.current?.hide()}
            style={{
              marginTop: 20,
              paddingVertical: 16,
              backgroundColor: '#F3F4F6',
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <AppText size={16} color="#EF4444" family="InterSemiBold">
              Cancel
            </AppText>
          </TouchableOpacity> */}
          <Pressable style={[{ alignSelf: 'center', height: 40, width: 40, borderRadius: 34, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', position: 'absolute', top: -70 }]} onPress={() => actionSheetRef.current?.hide()}>
            <CrossIcon />
          </Pressable>

        </View>
      </ActionSheet>

      <Modal
        visible={showUserModal}
        animationType="slide"
        transparent={true}
        statusBarTranslucent
        onRequestClose={() => setShowUserModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowUserModal(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{
                  backgroundColor: 'white',
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  padding: 20,
                  height: SCREEN_HEIGHT * 0.75,
                  maxHeight: SCREEN_HEIGHT * 0.75,
                  minHeight: SCREEN_HEIGHT * 0.75,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                  <AppText size={18} family="InterSemiBold" color="black">
                    Select User
                  </AppText>
                  <TouchableOpacity onPress={() => setShowUserModal(false)}>
                    <AppText size={16} color={colors.blue} family="InterMedium">
                      Close
                    </AppText>
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', alignItems: "center", gap: 20 }}>
                  <TextInput
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: '#ddd',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 16,
                      marginBottom: 16,
                      backgroundColor: '#f9f9f9',
                      fontFamily: fonts.InterMedium,
                    }}
                    placeholder="Search user..."
                    value={userSearchText}
                    onChangeText={setUserSearchText}
                  />
                  <Pressable onPress={() => {
                    setSelectedUser(null);
                    setShowUserModal(false);
                    setUserSearchText('');
                  }}
                    style={{ marginBottom: 20 }}>
                    <AppText size={16} underline='underline' family='InterMedium' color='black'>Clear Filter</AppText>
                  </Pressable>
                </View>

                <FlatList
                  data={filteredUsers}
                  keyExtractor={item => String(item.value)}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                      onPress={() => {
                        setSelectedUser(item);
                        setShowUserModal(false);
                        setUserSearchText('');
                      }}
                    >
                      <AppText size={16} color="black" family="InterRegular">
                        {item.label}
                      </AppText>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <AppText size={16} color="#999">
                      No user found
                    </AppText>
                  }
                  onEndReached={loadMoreUsers}
                  onEndReachedThreshold={0.5}

                  ListFooterComponent={
                    loading ? (
                      <ActivityIndicator
                        size="large"
                        color={colors.blue}
                        style={{ marginVertical: 20 }}
                      />
                    ) : null
                  }



                />
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </View>
  )
}

export default Home
