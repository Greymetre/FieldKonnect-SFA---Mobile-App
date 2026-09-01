import { Alert, AppState, Linking, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import NetInfo, { NetInfoSubscription } from '@react-native-community/netinfo';
import store from '../components/redux/Store';
import axiosClient from '../api/AxiosClient';
import { updateLiveLocation } from '../api/liveLocationApi';
import {
  clearLiveLocationTrackingState,
  enqueueLiveLocation,
  getLiveLocationTrackingState,
  getQueuedLiveLocations,
  removeQueuedLiveLocations,
  setLiveLocationTrackingState,
} from '../storage/liveLocationQueue';
import { formatDateTimeForApi } from '../utils/dateTime';
import { createMMKV } from 'react-native-mmkv';

const LOCATION_SYNC_INTERVAL_MS = 3 * 60 * 1000;
const ANDROID_PERMISSION_SETUP_SHOWN_KEY = 'android_live_location_permission_setup_shown_v1';
const IOS_PERMISSION_SETUP_SHOWN_KEY = 'ios_live_location_permission_setup_shown_v1';

const { LocationTracking, FieldKonnectNotifications } = NativeModules;
const permissionStorage = createMMKV({ id: 'live-location-permission-storage' });

let configured = false;
let starting = false;
let flushing = false;
let foregroundInterval: ReturnType<typeof setInterval> | null = null;
let iosWatchId: number | null = null;
let netInfoUnsubscribe: NetInfoSubscription | null = null;
let appStateSubscription: { remove: () => void } | null = null;
let backgroundPermissionAlertShown = false;

type GeoPosition = {
  coords: {
    latitude: number;
    longitude: number;
  };
};

type IosNotificationModule = {
  requestAuthorization?: () => Promise<boolean>;
  showNotification?: (title: string, message: string) => Promise<boolean>;
};

const devLog = (...args: unknown[]) => {
  if (__DEV__) {
    console.log('[LiveLocation]', ...args);
  }
};

const androidApiLevel = () => Number(Platform.Version);

const configureGeolocation = () => {
  if (configured) return;

  Geolocation.setRNConfiguration({
    skipPermissionRequests: false,
    authorizationLevel: 'always',
    enableBackgroundLocationUpdates: true,
    locationProvider: 'auto',
  });
  configured = true;
};

const showTrackingDisclosure = () =>
  new Promise<boolean>(resolve => {
    Alert.alert(
      'Background location tracking',
      'FieldKonnect SFA collects location data to enable attendance and field activity tracking even when the app is closed or not in use. Tracking starts after punch-in, is sent securely to your organization, and stops after punch-out.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Continue', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });

const requestAndroidPermission = async () => {
  const alreadyHasBackgroundLocation =
    androidApiLevel() < 29 ||
    (await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
    ));

  if (!alreadyHasBackgroundLocation) {
    const acceptedDisclosure = await showTrackingDisclosure();
    if (!acceptedDisclosure) return false;
  }

  const foreground = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  ]);
  const hasFine =
    foreground[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
    PermissionsAndroid.RESULTS.GRANTED;
  const hasCoarse =
    foreground[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
    PermissionsAndroid.RESULTS.GRANTED;
  const hasForegroundLocation = hasFine || hasCoarse;

  if (androidApiLevel() >= 29 && hasForegroundLocation) {
    const hasBackground = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
    );

    if (!hasBackground) {
      const background = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      );

      if (
        background !== PermissionsAndroid.RESULTS.GRANTED &&
        !backgroundPermissionAlertShown
      ) {
        backgroundPermissionAlertShown = true;
        Alert.alert(
          'Background location required',
          'For live tracking after punch-in, open app settings and set Location permission to "Allow all the time".',
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
      }
    }
  }

  if (androidApiLevel() >= 33) {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
  }

  return hasForegroundLocation;
};

const showAndroidSettingsGuide = () =>
  new Promise<void>(resolve => {
    Alert.alert(
      'Required Android settings',
      'For live tracking after punch-in, please enable these settings:\n\n1. Location: Allow all the time\n2. Notifications: Allow\n3. Battery: Unrestricted or Allow background activity\n4. Pause app activity if unused: Off',
      [
        { text: 'Later', style: 'cancel', onPress: () => resolve() },
        {
          text: 'Open Settings',
          onPress: () => {
            Linking.openSettings();
            resolve();
          },
        },
      ],
      { cancelable: true, onDismiss: () => resolve() },
    );
  });

const requestIosPermission = () =>
  new Promise<boolean>(resolve => {
    Geolocation.requestAuthorization(
      () => resolve(true),
      () => resolve(false),
    );
  });

const requestIosNotificationPermission = async () => {
  if (Platform.OS !== 'ios') return true;

  try {
    const notifications = FieldKonnectNotifications as IosNotificationModule | undefined;
    if (!notifications?.requestAuthorization) return false;
    return await notifications.requestAuthorization();
  } catch (error) {
    devLog('iOS notification permission failed', error);
    return false;
  }
};

const showIosLocationNotification = async (title: string, message: string) => {
  if (Platform.OS !== 'ios') return;

  try {
    const notifications = FieldKonnectNotifications as IosNotificationModule | undefined;
    await notifications?.showNotification?.(title, message);
  } catch (error) {
    devLog('iOS notification failed', error);
  }
};

const getCurrentPosition = () =>
  new Promise<GeoPosition>((resolve, reject) => {
    Geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 30000,
      maximumAge: 120000,
    });
  });

const todayInIndia = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

const hasActivePunchInToday = async () => {
  const token = store.getState().auth?.token;
  if (!token) return false;

  try {
    const response = await axiosClient.get('api/getPunchin');
    const latest = response?.data?.data?.[0];
    return Boolean(
      response?.data?.status === 'success' &&
        latest?.punchin_date === todayInIndia() &&
        latest?.punchin_date &&
        !latest?.punchout_date,
    );
  } catch (error) {
    devLog('Punch-in status check failed', error);
    return false;
  }
};

const queueIosPosition = (position: GeoPosition) => {
  const state = getLiveLocationTrackingState();
  enqueueLiveLocation({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    time: formatDateTimeForApi(new Date()),
  });
  setLiveLocationTrackingState({
    ...state,
    active: true,
    lastCapturedAt: new Date().toISOString(),
  });
};

const canCaptureNow = () => {
  const state = getLiveLocationTrackingState();
  if (!state.active) return false;
  if (!state.lastCapturedAt) return true;

  return Date.now() - new Date(state.lastCapturedAt).getTime() >= LOCATION_SYNC_INTERVAL_MS;
};

const captureIosLocation = async (force = false) => {
  const state = getLiveLocationTrackingState();
  if (!state.active) return false;
  if (!force && !canCaptureNow()) return false;

  try {
    const position = await getCurrentPosition();
    queueIosPosition(position);
    devLog('Location captured');
    void syncPendingLocations();
    return true;
  } catch (error) {
    devLog('Location capture failed', error);
    return false;
  }
};

const startIosTimer = () => {
  if (foregroundInterval) return;
  foregroundInterval = setInterval(() => {
    void captureIosLocation();
  }, LOCATION_SYNC_INTERVAL_MS);
};

const startIosWatcher = () => {
  if (iosWatchId !== null) return;

  iosWatchId = Geolocation.watchPosition(
    position => {
      if (!canCaptureNow()) return;
      queueIosPosition(position);
      devLog('Location captured from iOS watcher');
      void syncPendingLocations();
    },
    error => {
      devLog('iOS location watcher failed', error);
    },
    {
      enableHighAccuracy: false,
      distanceFilter: 0,
      interval: LOCATION_SYNC_INTERVAL_MS,
      fastestInterval: LOCATION_SYNC_INTERVAL_MS,
      useSignificantChanges: false,
    },
  );
};

const stopIosTimer = () => {
  if (!foregroundInterval) return;
  clearInterval(foregroundInterval);
  foregroundInterval = null;
};

const stopIosWatcher = () => {
  if (iosWatchId === null) return;
  Geolocation.clearWatch(iosWatchId);
  iosWatchId = null;
};

const attachNetInfoListener = () => {
  if (netInfoUnsubscribe) return;

  netInfoUnsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable !== false) {
      void syncPendingLocations();
    }
  });
};

const attachAppStateListener = () => {
  if (appStateSubscription) return;

  appStateSubscription = AppState.addEventListener('change', state => {
    if (Platform.OS !== 'ios') return;
    if (!getLiveLocationTrackingState().active) return;

    if (state === 'active') {
      configureGeolocation();
      startIosTimer();
      startIosWatcher();
      void captureIosLocation(false);
      void syncPendingLocations();
      return;
    }

    if (state === 'background') {
      void captureIosLocation(false);
      void syncPendingLocations();
    }
  });
};

export const runAndroidFirstTimeLiveLocationSetup = async () => {
  if (Platform.OS === 'ios') {
    if (permissionStorage.getBoolean(IOS_PERMISSION_SETUP_SHOWN_KEY)) return;

    permissionStorage.set(IOS_PERMISSION_SETUP_SHOWN_KEY, true);
    configureGeolocation();
    await requestIosNotificationPermission();
    await requestIosPermission();
    return;
  }

  if (Platform.OS !== 'android') return;
  if (permissionStorage.getBoolean(ANDROID_PERMISSION_SETUP_SHOWN_KEY)) return;

  permissionStorage.set(ANDROID_PERMISSION_SETUP_SHOWN_KEY, true);
  await requestAndroidPermission();
  await showAndroidSettingsGuide();
};

export const startLocationTrackingAfterPunchIn = async (userData?: unknown, token?: string) => {
  if (starting) return false;

  if (Platform.OS === 'android') {
    const granted = await requestAndroidPermission();
    if (!granted) return false;

    const authToken = token || store.getState().auth?.token;
    if (!LocationTracking?.startLocationTrackingAfterPunchIn || !authToken) {
      devLog('Native Android location module or token missing');
      return false;
    }

    starting = true;
    try {
      await LocationTracking.startLocationTrackingAfterPunchIn(userData || {}, authToken);
      devLog('Punch-in tracking started');
      return true;
    } finally {
      starting = false;
    }
  }

  if (Platform.OS === 'ios') {
    // iOS background location is best-effort. If the user force-kills from the app switcher,
    // Apple may stop further updates until the app is opened again.
    starting = true;
    try {
      configureGeolocation();
      const granted = await requestIosPermission();
      if (!granted) return false;
      await requestIosNotificationPermission();

      const existingState = getLiveLocationTrackingState();
      const shouldCaptureImmediately = !existingState.active && !existingState.lastCapturedAt;

      setLiveLocationTrackingState({
        ...existingState,
        active: true,
        startedAt: existingState.startedAt || new Date().toISOString(),
      });
      attachNetInfoListener();
      attachAppStateListener();
      startIosTimer();
      startIosWatcher();
      await captureIosLocation(shouldCaptureImmediately);
      await syncPendingLocations();
      return true;
    } finally {
      starting = false;
    }
  }

  return false;
};

export const stopLocationTrackingAfterPunchOut = async () => {
  if (Platform.OS === 'android') {
    await syncPendingLocations();
    if (LocationTracking?.stopLocationTrackingAfterPunchOut) {
      await LocationTracking.stopLocationTrackingAfterPunchOut();
    }
    return true;
  }

  if (Platform.OS === 'ios') {
    await captureIosLocation(true);
    await syncPendingLocations();
    clearLiveLocationTrackingState();
    stopIosTimer();
    stopIosWatcher();
    netInfoUnsubscribe?.();
    netInfoUnsubscribe = null;
    return true;
  }

  return false;
};

export const syncPendingLocations = async () => {
  if (Platform.OS === 'android') {
    if (LocationTracking?.syncPendingLocations) {
      await LocationTracking.syncPendingLocations();
      devLog('Pending locations synced');
      return true;
    }
    return false;
  }

  if (flushing) return false;
  const queue = getQueuedLiveLocations();
  if (queue.length === 0) return true;

  const netState = await NetInfo.fetch();
  if (!netState.isConnected || netState.isInternetReachable === false) {
    devLog('API hit failed and saved locally');
    void showIosLocationNotification(
      'Location API offline',
      `${queue.length} location(s) pending at ${formatDateTimeForApi(new Date())}`,
    );
    return false;
  }

  flushing = true;
  try {
    const sentIds = queue.map(item => item.id);
    const response = await updateLiveLocation(queue);
    if (isSuccessfulLocationResponse(response?.status, response?.data)) {
      removeQueuedLiveLocations(sentIds);
      devLog('API hit success');
      devLog('Pending locations synced');
      void showIosLocationNotification(
        'Location API success',
        `${queue.length} location(s) sent at ${formatDateTimeForApi(new Date())} | HTTP ${response?.status ?? '-'}`,
      );
      return true;
    }
    devLog('API hit failed and saved locally', response?.data);
    void showIosLocationNotification(
      'Location API failed',
      `${queue.length} location(s) kept pending at ${formatDateTimeForApi(new Date())} | HTTP ${response?.status ?? '-'}`,
    );
    return false;
  } catch (error) {
    devLog('API hit failed and saved locally', error);
    void showIosLocationNotification(
      'Location API error',
      `${queue.length} location(s) kept pending at ${formatDateTimeForApi(new Date())}`,
    );
    return false;
  } finally {
    flushing = false;
  }
};

const isSuccessfulLocationResponse = (code?: number, data?: unknown) => {
  if (typeof code === 'number' && (code < 200 || code > 299)) return false;
  if (!data) return true;

  if (typeof data === 'object') {
    const response = data as { status?: unknown; success?: unknown };
    const status = String(response.status ?? '').toLowerCase();
    const success = String(response.success ?? '').toLowerCase();
    return status === 'success' || success === 'true' || status === '';
  }

  return true;
};

export const getTrackingStatus = async () => {
  if (Platform.OS === 'android' && LocationTracking?.getTrackingStatus) {
    return LocationTracking.getTrackingStatus();
  }

  const state = getLiveLocationTrackingState();
  return {
    active: state.active,
    startedAt: state.startedAt,
    lastCapturedAt: state.lastCapturedAt,
    pendingCount: getQueuedLiveLocations().length,
  };
};

export const initializeLiveLocationTracking = async () => {
  attachNetInfoListener();
  attachAppStateListener();
  const user = store.getState().auth?.user;
  const token = store.getState().auth?.token ?? undefined;

  if (Platform.OS === 'android') {
    const status = await getTrackingStatus();
    if (status?.active || (await hasActivePunchInToday())) {
      await startLocationTrackingAfterPunchIn(user, token);
    } else {
      await syncPendingLocations();
    }
    return;
  }

  configureGeolocation();
  if (getLiveLocationTrackingState().active || (await hasActivePunchInToday())) {
    await startLocationTrackingAfterPunchIn(user, token);
  } else {
    await syncPendingLocations();
  }
};

export const removeLiveLocationListeners = () => {
  netInfoUnsubscribe?.();
  netInfoUnsubscribe = null;
  appStateSubscription?.remove();
  appStateSubscription = null;
};

export const startLiveLocationTracking = async (options?: {
  showDisclosure?: boolean;
  captureImmediately?: boolean;
}) => {
  const started = await startLocationTrackingAfterPunchIn(
    store.getState().auth?.user,
    store.getState().auth?.token ?? undefined,
  );

  if (started && options?.captureImmediately === false) {
    return true;
  }
  return started;
};

export const stopLiveLocationTracking = async (_options?: { captureFinalLocation?: boolean }) =>
  stopLocationTrackingAfterPunchOut();
