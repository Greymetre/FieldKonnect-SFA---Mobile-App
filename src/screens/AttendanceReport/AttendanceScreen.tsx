

import { BASE_URL } from '../../api/AxiosClient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  FlatList,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';

import { styles } from '../ExpenseReport/styles'; // adjust path
import AppText from '../../components/AppText/AppText';
import { ArrowDownIcon, EyeballIcon, ThreeDotIcon, PlusAddIcon } from '../../assets/svgs/SvgsFile';
import { rw } from '../../utils/responsive';
import { colors } from '../../utils/Colors';
import store, { useAppSelector } from '../../components/redux/Store';
import {
  useGetTodayBeatPlanData,
  useGetTourPlanData,
  useGetUserCityListApi,
} from '../../api/query/CustomerApi';
import Toast from 'react-native-toast-message';
import { shadowStyle } from '../../utils/typography';
import { PermissionsAndroid } from 'react-native';
import { SCREEN_HEIGHT } from '../../utils/misc';
import { Dropdown } from 'react-native-element-dropdown';
import ActionSheet, { ActionSheetRef, FlatList as ActionSheetFlatList } from 'react-native-actions-sheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import useLocationHook from '../../api/hooks/uselocationhook';
import { startLiveLocationTracking, stopLiveLocationTracking } from '../../services/liveLocationService';
import { getTourObjectivesApi, normalizeTourObjectives } from '../../api/query/TourPlanApi';
import { useFocusEffect } from '@react-navigation/native';

interface DropdownItem {
  label: string;
  value: string;
}

interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface AttendanceItem {
  id?: string | number;
  punchin_id?: string | number;
  name?: string;
  punchin_date?: string;
  punchin_time?: string;
  punch_out?: string;
  status?: string;
}

interface BeatItem {
  id: number;
  beat_id: number;
  beat_date: string;
  beats: {
    id: number;
    beat_name: string;
    description?: string;
    city_id?: string;
    // ... other fields
  };
}

interface TourPlanItem {
  id: number;
  date: string;
  town: string;
  district: number | string;
  objectives: string;
  type: string;
  status: string;
}

interface ObjectiveItem {
  label: string;
  value: string;
}

const isOtherObjective = (value: string) => ['other', 'others'].includes(value.trim().toLowerCase());

const AttendanceScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const routeItem: AttendanceItem | undefined | any = route?.params?.item;
  const isPunchOutMode = !!routeItem;
  const { user } = useAppSelector((state) => state.auth);
  const { coords } = useLocationHook();
  console.log(coords, 'coordscoordscoordscoords')
  // Form states
  const [type, setType] = useState<string>('');
  const [todayPlanNotes, setTodayPlanNotes] = useState<string>('');
  const [punchSummary, setPunchSummary] = useState<string>('');
  const [selectedCities, setSelectedCities] = useState<DropdownItem[]>([]); // ← multi-select
  const [selectedObjectives, setSelectedObjectives] = useState<ObjectiveItem[]>([]);
  // Modal & search
  const [showCityModal, setShowCityModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [cities, setCities] = useState<DropdownItem[]>([]);

  // Temp selection inside bottom sheet
  const [tempSelectedObjectives, setTempSelectedObjectives] = useState<ObjectiveItem[]>([]);

  // Location
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState<boolean>(true);

  useEffect(() => {
    if (coords) {
      setLocation({
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        // accuracy: ,
      });
      setLocationLoading(false);
    }
  }, [coords])


  // Tour Plan
  const [tourPlan, setTourPlan] = useState<TourPlanItem | null | any>(null);
  const [tourLoading, setTourLoading] = useState(false);
  const [tourError, setTourError] = useState<string | null>(null);
  const [tourPlans, setTourPlans] = useState<TourPlanItem[]>([]);

  const { mutateAsync: getTodayPlanData } = useGetTourPlanData();
  const { mutateAsync: getTodayBeatPlanData } = useGetTodayBeatPlanData();
  const { mutateAsync: getCities } = useGetUserCityListApi();

  // Add near other states
  const [beats, setBeats] = useState<DropdownItem[]>([]);
  const [selectedBeats, setSelectedBeats] = useState<DropdownItem[]>([]);
  const [showBeatModal, setShowBeatModal] = useState(false);
  const [beatSearchText, setBeatSearchText] = useState('');
  const [customObjective, setCustomObjective] = useState<string>('');
  const [objectiveOptions, setObjectiveOptions] = useState<ObjectiveItem[]>([]);
  const [objectivesLoading, setObjectivesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Action Sheet ref for objectives
  const objectivesSheetRef = useRef<ActionSheetRef>(null);

  const typeOptions: DropdownItem[] = [
    { label: 'Office Meeting', value: 'Office Meeting' },
    { label: 'Local Market Visit', value: 'Local Market Visit' },
    { label: 'Tour', value: 'Tour' },
    { label: 'Project Visit', value: 'Project Visit' },
    { label: 'Customer Visit', value: 'Customer Visit' },
    { label: 'Other Visit', value: 'Other Visit' },
  ];

  // ────────────────────────────────────────────────
  // Fetch current location
  // ────────────────────────────────────────────────
  const fetchLocation = async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'App needs location for attendance.',
            buttonNeutral: 'Ask Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setLocationError('Location permission denied');
          setLocationLoading(false);
          return;
        }
      }

      Geolocation.getCurrentPosition(
        (pos) => {
          console.log(pos, 'fasdfasdfasdfasdfasdfasdf')
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
          setLocationLoading(false);
        },
        (err) => {
          setLocationError(err.message || 'Failed to get location');
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (err) {
      setLocationError('Location error');
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
    fetchObjectives();
  }, []);

  const fetchObjectives = async () => {
    try {
      setObjectivesLoading(true);
      const res = await getTourObjectivesApi();
      setObjectiveOptions(normalizeTourObjectives(res?.data));
    } catch (error) {
      console.log('Tour objectives error:', error);
      Toast.show({ type: 'error', text1: 'Failed to load objectives' });
    } finally {
      setObjectivesLoading(false);
    }
  };

  const findCityByName = (cityName: string): DropdownItem | undefined => {
    return cities.find(
      (c) => c.label.toLowerCase().trim() === cityName.toLowerCase().trim()
    );
  };

  useEffect(() => {
    if (isPunchOutMode) return;

    // Only run when we have both cities and tour plans loaded
    if (cities.length > 0 && tourPlans.length > 0) {
      autoSelectFromTourPlans();
    }
  }, [cities, tourPlans, isPunchOutMode]);


  const autoSelectFromTourPlans = () => {
    if (!tourPlans.length || !cities.length) return;

    // ─── Objectives ───────────────────────────────────────
    const allObjectives: ObjectiveItem[] = [];

    tourPlans.forEach((plan) => {
      if (!plan.objectives) return;
      const objs = plan.objectives
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      objs.forEach((obj) => {
        if (!allObjectives.some((o) => o.value === obj)) {
          allObjectives.push({ label: obj, value: obj });
        }
      });
    });

    // Also add static ones if you want them always available (but not auto-selected)
    // const staticOnes = [
    //   { label: 'Retailer Visit', value: 'Retailer Visit' },
    //   // ...
    // ];
    // But usually better → only auto-select what's in tour plan

    setSelectedObjectives(allObjectives);

    // ─── Cities ───────────────────────────────────────────
    const autoCities: DropdownItem[] = [];

    tourPlans.forEach((plan) => {
      if (!plan.town_name) return;

      const matchingCity = findCityByName(plan.town_name);
      if (matchingCity && !autoCities.some((c) => c.value === matchingCity.value)) {
        autoCities.push(matchingCity);
      }
    });

    if (autoCities.length > 0) {
      setSelectedCities(autoCities);
    }
  };

  // ────────────────────────────────────────────────
  // Load cities for modal
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (isPunchOutMode) return;
    const fetchCities = async () => {
      try {
        const res = await getCities();
        if (res?.data?.status === 'success') {
          setCities(
            res.data.data.map((c: any) => ({
              label: c.city_name,
              value: c.id.toString(), // ensure string
            }))
          );
        }
      } catch (err) {
        console.log('Cities fetch error:', err);
      }
    };
    fetchCities();
  }, [isPunchOutMode]);

  // ────────────────────────────────────────────────
  // Load today's tour plan
  // ────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (isPunchOutMode) return;
      loadTourPlan();
      loadBeatPlan();
      // The loaders use the latest mutation functions when the screen regains focus.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPunchOutMode])
  );

  const loadTourPlan = async () => {
    setTourLoading(true);
    setTourError(null);

    const getLocalDate = () => {
      const now = new Date();
      // Force IST offset (UTC+5:30 = 330 minutes)
      const istOffsetMs = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(now.getTime() + istOffsetMs);

      return istDate.toISOString().split('T')[0];
    };
    try {
      const today = getLocalDate() || new Date().toISOString().split('T')[0];

      const payload = {
        start_date: today,
        end_date: today,
        user_id: store.getState()?.auth?.user?.id || '1',
      };

      const res = await getTodayPlanData(payload);
      if (res?.data?.status === 'success' && Array.isArray(res.data.data?.data) && res?.data?.data?.data?.length > 0) {
        const approvedPlans = res.data.data.data.filter((plan: any) => {
          const status = (plan.status || '').trim().toLowerCase();
          return status !== 'rejected';
        });
        setTourPlans(approvedPlans);
        setTourPlan(approvedPlans.length > 0 ? approvedPlans[0] : null);
      } else {
        setTourPlan(null);
        setTourPlans([]);
      }
    } catch (err: any) {
      setTourError('Could not load today\'s tour plan');
    } finally {
      setTourLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  // Multi-select helpers
  // ────────────────────────────────────────────────
  const toggleCity = (city: DropdownItem) => {
    setSelectedCities((prev) => {
      if (prev.some((c) => c.value === city.value)) {
        return prev.filter((c) => c.value !== city.value);
      }
      return [...prev, city];
    });
  };

  const loadBeatPlan = async () => {
    try {
      const res = await getTodayBeatPlanData();
      if (res?.data?.status === 'success' && Array.isArray(res?.data?.data)) {
        const beatData = res.data.data as BeatItem[];

        const formattedBeats = beatData
          .filter(item => item.beats?.beat_name) // safety
          .map(item => ({
            label: item.beats.beat_name,
            value: item.beats.id.toString(),     // we send beat.id, not the assignment id
            // optional: originalId: item.id,    // if you ever need the assignment row id
          }));
        setBeats(formattedBeats);
      } else {
        setBeats([]);
      }
    } catch (err: any) {
      console.log(err);
    }
  };

  const toggleBeat = (beat: DropdownItem) => {
    setSelectedBeats((prev) => {
      if (prev.some((b) => b.value === beat.value)) {
        return prev.filter((b) => b.value !== beat.value);
      }
      return [...prev, beat];
    });
  };

  const removeBeat = (beat: DropdownItem) => {
    setSelectedBeats((prev) => prev.filter((b) => b.value !== beat.value));
  };

  const removeCity = (city: DropdownItem) => {
    setSelectedCities((prev) => prev.filter((c) => c.value !== city.value));
  };

  // ────────────────────────────────────────────────
  // Objectives logic
  // ────────────────────────────────────────────────
  const getAllObjectives = (): ObjectiveItem[] => {
    const combined: ObjectiveItem[] = [];
    const seen = new Set<string>();
    const objectiveKey = (value: string) => {
      const normalized = value.trim().toLowerCase();
      return normalized === 'other' || normalized === 'others' ? 'others' : normalized;
    };
    const addObjective = (item: ObjectiveItem) => {
      const key = objectiveKey(item.value);
      if (!key || seen.has(key)) return;
      seen.add(key);
      combined.push(item);
    };

    objectiveOptions.forEach(addObjective);

    if (!tourPlans.length) return combined;

    const dynamicRaw = tourPlans
      .map(p => (p.objectives || '').trim())
      .filter(Boolean)
      .join(', ');

    const dynamicList = dynamicRaw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    dynamicList.forEach(obj => addObjective({ label: obj, value: obj }));

    return combined;
  };

  const openObjectivesSheet = () => {
    setTempSelectedObjectives([...selectedObjectives]);
    objectivesSheetRef.current?.show();
  };

  const confirmObjectives = () => {
    if (tempSelectedObjectives.some(o => isOtherObjective(o.value)) && !customObjective.trim()) {
      Toast.show({ type: 'error', text1: 'Please specify the objective' });
      return;
    }
    setSelectedObjectives([...tempSelectedObjectives]);
    objectivesSheetRef.current?.hide();
  };

  const toggleObjective = (item: ObjectiveItem) => {
    setTempSelectedObjectives(prev => {
      if (prev.some(i => i.value === item.value)) {
        return prev.filter(i => i.value !== item.value);
      }
      return [...prev, item];
    });
  };

  const removeObjective = (item: ObjectiveItem) => {
    setSelectedObjectives(prev => prev.filter(i => i.value !== item.value));
  };

  // ────────────────────────────────────────────────
  // Submit handler
  // ────────────────────────────────────────────────
  const showTourPlanRequiredAlert = () => {
    Alert.alert(
      'Tour Plan Required',
      'A tour plan is required before you can punch in. No tour plan has been created for today. Please create today\'s tour plan, then return to complete your punch-in.',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Create Tour Plan', onPress: () => navigation.navigate('CreatePlan', { item: user?.id }) },
      ]
    );
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const token = store.getState().auth?.token;
    if (!token) {
      Toast.show({ type: 'error', text1: 'No authentication token found' });
      return;
    }

    if (!isPunchOutMode) {
      if (tourLoading) {
        Toast.show({ type: 'info', text1: 'Checking today\'s tour plan. Please wait.' });
        return;
      }
      if (tourError) {
        Toast.show({
          type: 'error',
          text1: 'Unable to verify today\'s tour plan',
          text2: 'Please try again before punching in.',
        });
        return;
      }
      if (tourPlans.length === 0) {
        showTourPlanRequiredAlert();
        return;
      }
    }

    if (!location) {
      Toast.show({ type: 'error', text1: 'Location not available' });
      return;
    }

    if (!isPunchOutMode) {
      if (selectedObjectives.length === 0) {
        Toast.show({ type: 'error', text1: 'Please select at least one objective' });
        return;
      }
      if (selectedCities.length === 0) {
        Toast.show({ type: 'error', text1: 'Please select at least one city' });
        return;
      }
    }

    setSubmitting(true);

    const formData = new FormData();

    if (isPunchOutMode) {
      if (!routeItem?.punchin_id) {
        Toast.show({ type: 'error', text1: 'Missing attendance record ID' });
        setSubmitting(false);
        return;
      }

      formData.append('punchin_id', String(routeItem.punchin_id));
      formData.append('punchout_latitude', location.latitude.toFixed(6));
      formData.append('punchout_longitude', location.longitude.toFixed(6));
      formData.append('punchout_summary', punchSummary.trim() || 'Day completed');

      const success = await submitAttendance(`${BASE_URL}api/userPunchout`, formData, 'Punch-out successful!');
      if (success) {
        await stopLiveLocationTracking({ captureFinalLocation: true }).catch(error => {
          console.log('Failed to stop live location after punch-out:', error);
        });
      }
    } else {

      if (selectedBeats?.length > 0) {
        // In handleSubmit() → punch-in branch
        formData.append('beats', selectedBeats.map(b => b.value).join(','));
        // formData.append('beats', tourPlan?.beatId.toString());
      }
      // if (tourPlan?.id) {
      //   formData.append('tourid', tourPlan?.id.toString());
      // }

      if (tourPlans.length > 0) {
        const tourIds = tourPlans
          .map(plan => plan.id)
          .filter(id => id != null && !isNaN(Number(id)))
          .join(',');

        if (tourIds) {
          formData.append('tourid', tourIds);
        }
      }

      formData.append('punchin_latitude', location.latitude.toFixed(6));
      formData.append('punchin_longitude', location.longitude.toFixed(6));
      formData.append('type', selectedObjectives.map(o => isOtherObjective(o.value) ? customObjective.trim() : o.value).join(', '));
      formData.append('city', selectedCities.map((c) => c.label).join(', ')); // ← comma separated
      formData.append('punchin_summary', 'Followed tour plan');
      console.log(formData, 'formDataformData')
      const success = await submitAttendance(`${BASE_URL}api/userPunchin`, formData, 'Punch-in successful!');
      if (success) {
        await startLiveLocationTracking({ showDisclosure: false }).catch(error => {
          console.log('Failed to start live location after punch-in:', error);
        });
      }
    }
  };

  const submitAttendance = async (url: string, formData: FormData, successMessage: string) => {
    try {
      const token = store.getState().auth?.token;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      const json = await response.json();

      if (response.ok) {
        Toast.show({ type: 'success', text1: successMessage });
        navigation.goBack();
        return true;
      } else {
        Toast.show({ type: 'error', text1: json.message || 'Submission failed' });
        return false;
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Network error. Please try again.' });
      console.error(err);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCities = cities.filter((city) =>
    city.label.toLowerCase().includes(searchText.toLowerCase().trim())
  );

  const isFormValid = isPunchOutMode
    ? !!location && !submitting
    : selectedObjectives.length > 0 && selectedCities.length > 0 && !!location && !submitting;
  const needsTourPlan = !isPunchOutMode && !tourLoading && !tourError && tourPlans.length === 0;

  const goToCreateTourPlan = () => {
    navigation.navigate('CreatePlan', { item: user?.id });
  };



  // ────────────────────────────────────────────────
  // Render today's tour plan section
  // ────────────────────────────────────────────────
  const renderTourPlanSection = () => {
    if (tourLoading) return <ActivityIndicator size="small" color={colors.blue} style={{ marginTop: 12 }} />;
    if (tourError) return <AppText size={13} color="red" family="InterMedium">{tourError}</AppText>;

    if (!tourPlan) {
      return (
        <View style={{ marginTop: rw(8) }}>
          <AppText size={13} color="#666">
            No tour plan scheduled for today.
          </AppText>
        </View>
      );
    }


    const townNames = tourPlans
      .map((plan) => plan?.town_name || plan.town || 'Unknown')
      .filter(Boolean); // remove empty
    const uniqueTowns = [...new Set(townNames)];

    return (
      <View
        style={{
          marginTop: rw(8),
          padding: rw(12),
          backgroundColor: '#f8f9fa',
          borderRadius: rw(8),
          borderWidth: 1,
          borderColor: '#e0e0e0',
        }}
      >
        <AppText size={15} family="InterSemiBold" color="#000">
          {uniqueTowns.join(', ') || '—'}
        </AppText>
        <AppText size={13} family="InterMedium" color="#444">
          {tourPlan.date || '—'}
        </AppText>
        {/* {tourPlan.objectives && (
          <AppText size={13} color={colors.blue}>
            {tourPlan.objectives}
          </AppText>
        )} */}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={[styles.container, { paddingHorizontal: rw(18) }]}
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        {isPunchOutMode ? (
          <>
            <View style={[styles.listItem, shadowStyle, { marginTop: 24 }]}>
              <View style={[styles.row]}>
                <View style={{ flex: 1 }}>
                  <AppText color="black" family="InterSemiBold" size={16}>
                    {user?.name}
                  </AppText>
                </View>
                <View style={[styles.row, { gap: 19 }]}>
                  <AppText color="#888888" family="InterMedium" size={13}>
                    {routeItem?.punchin_date}
                  </AppText>
                </View>
              </View>
              <View style={styles.line} />
              <View style={[styles.row, { flex: 1, justifyContent: 'space-between' }]}>
                <View style={[styles.firstPunchIN, { flex: 1 }]}>
                  <AppText color="#888888" family="InterRegular" size={13}>
                    Punch In -{' '}
                    <AppText color="black" family="InterSemiBold" size={14}>
                      {routeItem?.punchin_time}
                    </AppText>
                  </AppText>
                </View>
              </View>
            </View>

            {/* <View style={{ marginTop: rw(24) }}>
              <AppText size={14} color="#000" family="InterBold">
                Punch Out Summary
              </AppText>
              <TextInput
                style={[styles.todayInput, { marginTop: rw(8), minHeight: rw(100) }]}
                placeholder="Day completed - heading home..."
                placeholderTextColor="#718096"
                multiline
                numberOfLines={5}
                value={punchSummary}
                onChangeText={setPunchSummary}
              />
            </View> */}

            <View style={{ marginTop: rw(60) }}>
              <AppText size={25} color="#000" family="InterBold" align="center">
                Punch Out
              </AppText>
            </View>
          </>
        ) : (
          <>
            {tourLoading ? (
              <View style={{ marginTop: rw(24), alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.blue} />
                <AppText size={13} color="#64748B" style={{ marginTop: rw(8) }}>
                  Checking today&apos;s tour plan...
                </AppText>
              </View>
            ) : tourError ? (
              <View style={{ marginTop: rw(20), padding: rw(16), backgroundColor: '#FFF7ED', borderRadius: rw(10), borderWidth: 1, borderColor: '#FDBA74' }}>
                <AppText size={15} color="#9A3412" family="InterSemiBold">Unable to verify today&apos;s tour plan</AppText>
                <AppText size={13} color="#9A3412" style={{ marginTop: rw(6) }}>Please check your connection and reopen this screen before punching in.</AppText>
              </View>
            ) : needsTourPlan ? (
              <View style={{ marginTop: rw(20), padding: rw(18), backgroundColor: '#FFF7ED', borderRadius: rw(12), borderWidth: 1, borderColor: '#F97316' }}>
                <AppText size={17} color="#9A3412" family="InterBold">Tour Plan Required</AppText>
                <AppText size={14} color="#7C2D12" family="InterRegular" style={{ marginTop: rw(8), lineHeight: rw(21) }}>
                  You have not created a tour plan for today. Please create today&apos;s tour plan before punching in.
                </AppText>
                <Pressable
                  onPress={goToCreateTourPlan}
                  style={{ marginTop: rw(16), height: rw(46), borderRadius: rw(8), backgroundColor: colors.blue, justifyContent: 'center', alignItems: 'center' }}
                >
                  <AppText size={15} color="white" family="InterBold">CREATE TOUR PLAN</AppText>
                </Pressable>
              </View>
            ) : tourPlan ? (
              <View style={{ marginTop: rw(20) }}>
                <AppText size={14} color="#000" family="InterBold">
                  Today's Tour Plan
                </AppText>
                {renderTourPlanSection()}
              </View>
            ) : null}

            <View style={{ marginTop: rw(24) }}>
              <AppText size={14} color="#000" family="InterBold">
                Objectives *
              </AppText>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: rw(8),
                  gap: rw(10),
                }}
              >
                <Pressable
                  style={[
                    styles.UserBox,
                    {
                      flex: 1,
                      padding: rw(12),
                      backgroundColor: selectedObjectives.length > 0 ? '#f0f8ff' : '#f9f9f9',
                    },
                  ]}
                  onPress={openObjectivesSheet}
                >
                  <AppText
                    size={14}
                    color={selectedObjectives.length > 0 ? '#000' : '#718096'}
                  >
                    {selectedObjectives.length > 0
                      ? `${selectedObjectives.length} selected`
                      : 'Select objectives'}
                  </AppText>
                </Pressable>

                <Pressable
                  onPress={openObjectivesSheet}
                  style={{
                    paddingHorizontal: rw(16),
                    paddingVertical: rw(10),
                    backgroundColor: colors.blue + '22',
                    borderRadius: rw(8),
                    borderWidth: 1,
                    borderColor: colors.blue,
                  }}
                >
                  <AppText size={13} color={colors.blue} family="InterMedium">
                    Edit
                  </AppText>
                </Pressable>
              </View>

              {selectedObjectives.length > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    marginTop: rw(12),
                    gap: rw(8),
                  }}
                >
                  {selectedObjectives.map(obj => (
                    <View
                      key={obj.value}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: `${colors.blue}22`,
                        paddingHorizontal: rw(12),
                        paddingVertical: rw(6),
                        borderRadius: rw(20),
                        borderWidth: 1,
                        borderColor: colors.blue,
                      }}
                    >
                      <AppText size={13} color={colors.blue} family="InterMedium">
                        {isOtherObjective(obj.value) ? customObjective : obj.label}
                      </AppText>
                      <Pressable onPress={() => removeObjective(obj)} hitSlop={10}>
                        <AppText size={17} color={colors.blue} style={{ marginLeft: rw(6) }}>
                          ×
                        </AppText>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={{ marginTop: rw(24) }}>
              <AppText size={14} color="#000" family="InterBold">
                Cities *
              </AppText>

              <Pressable
                style={[
                  styles.UserBox,
                  {
                    marginTop: rw(8),
                    paddingHorizontal: rw(12),
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  },
                ]}
                onPress={() => setShowCityModal(true)}
              >
                <AppText size={14} color={selectedCities.length > 0 ? '#000' : '#718096'}>
                  {selectedCities.length > 0 ? `${selectedCities.length} selected` : 'Select Cities'}
                </AppText>
                <ArrowDownIcon />
              </Pressable>

              {selectedCities.length > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    marginTop: rw(12),
                    gap: rw(8),
                  }}
                >
                  {selectedCities.map((city) => (
                    <View
                      key={city.value}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: `${colors.blue}22`,
                        paddingHorizontal: rw(12),
                        paddingVertical: rw(6),
                        borderRadius: rw(20),
                        borderWidth: 1,
                        borderColor: colors.blue,
                      }}
                    >
                      <AppText size={13} color={colors.blue} family="InterMedium">
                        {city.label}
                      </AppText>
                      <Pressable onPress={() => removeCity(city)} hitSlop={8} style={{ marginLeft: rw(6) }}>
                        <AppText size={16} color={colors.blue}>
                          ×
                        </AppText>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
            {
              beats && beats?.length > 0 && (
                <View style={{ marginTop: rw(24) }}>
                  <AppText size={14} color="#000" family="InterBold">
                    Beats *
                  </AppText>

                  <Pressable
                    style={[
                      styles.UserBox,
                      {
                        marginTop: rw(8),
                        paddingHorizontal: rw(12),
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      },
                    ]}
                    onPress={() => setShowBeatModal(true)}
                  >
                    <AppText size={14} color={selectedBeats.length > 0 ? '#000' : '#718096'}>
                      {selectedBeats.length > 0
                        ? `${selectedBeats.length} selected`
                        : 'Select Beat(s)'}
                    </AppText>
                    <ArrowDownIcon />
                  </Pressable>

                  {selectedBeats.length > 0 && (
                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        marginTop: rw(12),
                        gap: rw(8),
                      }}
                    >
                      {selectedBeats.map((beat) => (
                        <View
                          key={beat.value}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: `${colors.blue}22`,
                            paddingHorizontal: rw(12),
                            paddingVertical: rw(6),
                            borderRadius: rw(20),
                            borderWidth: 1,
                            borderColor: colors.blue,
                          }}
                        >
                          <AppText size={13} color={colors.blue} family="InterMedium">
                            {beat.label}
                          </AppText>
                          <Pressable onPress={() => removeBeat(beat)} hitSlop={8} style={{ marginLeft: rw(6) }}>
                            <AppText size={16} color={colors.blue}>×</AppText>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )
            }


            {/* <View style={{ marginTop: rw(24) }}>
              <AppText size={14} color="#000" family="InterBold">
                Punch In Summary
              </AppText>
              <TextInput
                style={[styles.todayInput, { marginTop: rw(8), minHeight: rw(100) }]}
                placeholder="Tasks planned / notes for today..."
                placeholderTextColor="#718096"
                multiline
                numberOfLines={5}
                value={todayPlanNotes}
                onChangeText={setTodayPlanNotes}
              />
            </View> */}

            <View style={{ marginTop: rw(80) }}>
              <AppText size={25} color="#000" family="InterBold" align="center">
                Punch In
              </AppText>
            </View>
          </>
        )}
      </ScrollView>

      <ActionSheet
        ref={objectivesSheetRef}
        gestureEnabled
        containerStyle={{
          borderTopLeftRadius: rw(20),
          borderTopRightRadius: rw(20),
          paddingHorizontal: rw(20),
          paddingTop: rw(16),
          paddingBottom: rw(20) + (Platform.OS === 'ios' ? 34 : 0),
        }}
        indicatorStyle={{ width: rw(40), backgroundColor: '#ccc' }}
      >
        <AppText
          size={18}
          family="InterSemiBold"
          color="#000"
          align="center"
          style={{ marginBottom: rw(20) }}
        >
          Select Objectives ({tempSelectedObjectives.length})
        </AppText>

        <ActionSheetFlatList<ObjectiveItem>
          data={getAllObjectives()}
          keyExtractor={item => item.value}
          style={{ maxHeight: SCREEN_HEIGHT * 0.55 }}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          renderItem={({ item }) => {
            const isSelected = tempSelectedObjectives.some(s => s.value === item.value);
            return (
              <Pressable
                onPress={() => toggleObjective(item)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: rw(14),
                  borderBottomWidth: 1,
                  borderBottomColor: '#f0f0f0',
                }}
              >
                <View
                  style={{
                    width: rw(26),
                    height: rw(26),
                    borderRadius: rw(8),
                    borderWidth: 2,
                    borderColor: isSelected ? colors.blue : '#ccc',
                    backgroundColor: isSelected ? colors.blue : 'transparent',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: rw(14),
                  }}
                >
                  {isSelected && <AppText size={20} color="white">✓</AppText>}
                </View>
                <AppText size={15} color="#000" family="InterRegular">
                  {item.label}
                </AppText>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            objectivesLoading ? (
              <ActivityIndicator color={colors.blue} style={{ marginTop: rw(40) }} />
            ) : (
              <AppText size={15} color="#999" align="center" style={{ marginTop: rw(40) }}>
                No objectives available
              </AppText>
            )
          }
        />

        {tempSelectedObjectives.some(o => isOtherObjective(o.value)) && (
          <View style={{ marginTop: rw(16), marginBottom: rw(8) }}>
            <AppText size={14} color="#555" family="InterMedium" style={{ marginBottom: rw(8) }}>
              Please specify:
            </AppText>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: rw(8),
                paddingHorizontal: rw(12),
                paddingVertical: rw(10),
                fontSize: rw(15),
                backgroundColor: '#fafafa',
              }}
              placeholder="Type custom objective..."
              value={customObjective}
              onChangeText={setCustomObjective}
              autoCapitalize="sentences"
            />
          </View>
        )}


        <View style={{ flexDirection: 'row', gap: rw(12), marginTop: rw(24) }}>
          <Pressable
            onPress={() => objectivesSheetRef.current?.hide()}
            style={{
              flex: 1,
              paddingVertical: rw(14),
              backgroundColor: '#f0f0f0',
              borderRadius: rw(12),
              alignItems: 'center',
            }}
          >
            <AppText size={16} color="#333" family="InterBold">
              Cancel
            </AppText>
          </Pressable>

          <Pressable
            onPress={confirmObjectives}
            style={{
              flex: 1,
              paddingVertical: rw(14),
              backgroundColor: colors.blue,
              borderRadius: rw(12),
              alignItems: 'center',
            }}
          >
            <AppText size={16} color="white" family="InterBold">
              Done
            </AppText>
          </Pressable>
        </View>
      </ActionSheet>
      {/* Multi-select City Modal */}
      <Modal
        visible={showCityModal}
        animationType="slide"
        transparent={true}
        statusBarTranslucent
        onRequestClose={() => setShowCityModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowCityModal(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{
                  backgroundColor: 'white',
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  padding: rw(20),
                  height: SCREEN_HEIGHT * 0.75,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: rw(20) }}>
                  <AppText size={18} family="InterSemiBold" color="black">
                    Select Cities {selectedCities.length > 0 ? `(${selectedCities.length})` : ''}
                  </AppText>
                  <Pressable onPress={() => setShowCityModal(false)}>
                    <AppText size={16} color={colors.blue} family="InterMedium">
                      Done
                    </AppText>
                  </Pressable>
                </View>

                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#ddd',
                    borderRadius: 8,
                    paddingHorizontal: rw(12),
                    paddingVertical: rw(10),
                    fontSize: rw(16),
                    marginBottom: rw(16),
                    backgroundColor: '#f9f9f9',
                  }}
                  placeholder="Search city..."
                  value={searchText}
                  onChangeText={setSearchText}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <FlatList
                  data={filteredCities}
                  keyExtractor={(item) => item.value}
                  contentContainerStyle={{ paddingBottom: rw(20) }}
                  renderItem={({ item }) => {
                    const isSelected = selectedCities.some((c) => c.value === item.value);
                    return (
                      <Pressable
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: rw(14),
                          borderBottomWidth: 1,
                          borderBottomColor: '#eee',
                        }}
                        onPress={() => toggleCity(item)}
                      >
                        <View
                          style={{
                            width: rw(24),
                            height: rw(24),
                            borderRadius: rw(6),
                            borderWidth: 2,
                            borderColor: isSelected ? colors.blue : '#ccc',
                            backgroundColor: isSelected ? colors.blue : 'transparent',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: rw(12),
                          }}
                        >
                          {isSelected && (
                            <View style={{ top: -4 }}>
                              <AppText size={18} color="white" family="InterBold">
                                ✓
                              </AppText>
                            </View>
                          )}
                        </View>
                        <AppText size={16} color="black" family="InterRegular" >
                          {item.label}
                        </AppText>
                      </Pressable>
                    );
                  }}
                  ListEmptyComponent={
                    <AppText size={16} color="#999" >
                      No cities found matching "{searchText}"
                    </AppText>
                  }
                  keyboardShouldPersistTaps="handled"
                />
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showBeatModal}
        animationType="fade"
        transparent={true}
        statusBarTranslucent
        onRequestClose={() => setShowBeatModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowBeatModal(false)}>
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: rw(20),
          }}>
            <TouchableWithoutFeedback>
              <View style={{
                backgroundColor: 'white',
                borderRadius: rw(16),
                width: '100%',
                maxHeight: SCREEN_HEIGHT * 0.75,
                padding: rw(20),
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 10,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: rw(16) }}>
                  <AppText size={18} family="InterSemiBold" color="black">
                    Select Beats {selectedBeats.length > 0 ? `(${selectedBeats.length})` : ''}
                  </AppText>
                  <Pressable onPress={() => setShowBeatModal(false)}>
                    <AppText size={16} color={colors.blue} family="InterMedium">
                      Done
                    </AppText>
                  </Pressable>
                </View>

                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#ddd',
                    borderRadius: 8,
                    paddingHorizontal: rw(12),
                    paddingVertical: rw(10),
                    fontSize: rw(16),
                    marginBottom: rw(16),
                    backgroundColor: '#f9f9f9',
                  }}
                  placeholder="Search beat..."
                  value={beatSearchText}
                  onChangeText={setBeatSearchText}
                  autoCapitalize="none"
                />

                <FlatList
                  data={beats.filter(b =>
                    b.label.toLowerCase().includes(beatSearchText.toLowerCase().trim())
                  )}
                  keyExtractor={(item) => item.value}
                  style={{ maxHeight: SCREEN_HEIGHT * 0.55 }}
                  renderItem={({ item }) => {
                    const isSelected = selectedBeats.some((b) => b.value === item.value);
                    return (
                      <Pressable
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: rw(14),
                          borderBottomWidth: 1,
                          borderBottomColor: '#eee',
                        }}
                        onPress={() => toggleBeat(item)}
                      >
                        <View
                          style={{
                            width: rw(24),
                            height: rw(24),
                            borderRadius: rw(6),
                            borderWidth: 2,
                            borderColor: isSelected ? colors.blue : '#ccc',
                            backgroundColor: isSelected ? colors.blue : 'transparent',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: rw(12),
                          }}
                        >
                          {isSelected && (
                            <AppText size={18} color="white" family="InterBold">✓</AppText>
                          )}
                        </View>
                        <AppText size={16} color="black" family="InterRegular">
                          {item.label}
                        </AppText>
                      </Pressable>
                    );
                  }}
                  ListEmptyComponent={
                    <AppText size={16} color="#999" style={{ textAlign: 'center', marginTop: rw(20) }}>
                      No beats found
                    </AppText>
                  }
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Submit Button */}
      <Pressable
        style={[
          styles.submit,
          {
            height: rw(48),
            marginHorizontal: rw(20),
            marginBottom: Platform.OS == "ios" ? 5 : rw(20),
            opacity: isFormValid || needsTourPlan ? 1 : 0.6,
          },
          styles.center,
        ]}
        onPress={handleSubmit}
        disabled={(!isFormValid && !needsTourPlan) || submitting}
      >
        {submitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <AppText size={16} color="white" family="InterBold">
            {isPunchOutMode ? 'PUNCH OUT' : 'SUBMIT'}
          </AppText>
        )}
      </Pressable>
      {/* <View style={{height: 30}} /> */}
    </SafeAreaView>
  );
};

export default AttendanceScreen;
