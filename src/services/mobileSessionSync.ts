import {AppState, Platform} from 'react-native';
import {createMMKV} from 'react-native-mmkv';
import axiosClient from '../api/AxiosClient';
import {API_ENDPOINT} from '../api/ApiUrls';
import store from '../components/redux/Store';
import {APP_BUILD_NUMBER, APP_VERSION} from '../utils/appVersion';
import {getDeviceName, getUniqueDeviceId} from '../utils/deviceIdentity';
import {getFcmToken} from '../utils/firebaseMessaging';

const storage = createMMKV({id: 'field-connect-mobile-session-sync'});
const LAST_FINGERPRINT = 'last-fingerprint';
const LAST_SYNCED_AT = 'last-synced-at';
const RESYNC_INTERVAL = 6 * 60 * 60 * 1000;
let syncPromise: Promise<void> | null = null;

export const syncMobileSession = async (force = false): Promise<void> => {
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    const {token, user} = store.getState().auth;
    if (!token || !user) return;

    const fcmToken = await getFcmToken();
    const fingerprint = [APP_VERSION, APP_BUILD_NUMBER, Platform.OS, getUniqueDeviceId(), fcmToken || ''].join('|');
    const lastFingerprint = storage.getString(LAST_FINGERPRINT);
    const lastSyncedAt = storage.getNumber(LAST_SYNCED_AT) || 0;

    if (!force && fingerprint === lastFingerprint && Date.now() - lastSyncedAt < RESYNC_INTERVAL) return;

    await axiosClient.post(API_ENDPOINT.SYNC_MOBILE_SESSION, {
      app_version: APP_VERSION,
      build_number: APP_BUILD_NUMBER,
      device_type: Platform.OS,
      device_name: getDeviceName(),
      unique_id: getUniqueDeviceId(),
      fcm_token: fcmToken || undefined,
    });

    storage.set(LAST_FINGERPRINT, fingerprint);
    storage.set(LAST_SYNCED_AT, Date.now());
  })().catch(error => {
    console.warn('Unable to synchronize mobile session:', error);
  }).finally(() => {
    syncPromise = null;
  });

  return syncPromise;
};

export const subscribeToMobileSessionSync = () => {
  const subscription = AppState.addEventListener('change', state => {
    if (state === 'active') syncMobileSession();
  });
  return () => subscription.remove();
};
