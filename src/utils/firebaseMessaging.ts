import {PermissionsAndroid, Platform} from 'react-native';
import {
  AuthorizationStatus, getInitialNotification, getMessaging,
  getToken, onMessage, onNotificationOpenedApp, registerDeviceForRemoteMessages,
  requestPermission, type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import notifee, {AndroidImportance, AndroidStyle, EventType} from '@notifee/react-native';

const CHANNEL_ID = 'field-connect-notifications';

const requestNotificationPermission = async () => {
  if (Platform.OS === 'android') {
    if (Platform.Version < 33) return true;
    return (await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)) === PermissionsAndroid.RESULTS.GRANTED;
  }
  const status = await requestPermission(getMessaging());
  return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
};

export const getFcmToken = async (): Promise<string | null> => {
  try {
    const messaging = getMessaging();
    await requestNotificationPermission();
    if (Platform.OS === 'ios') {
      await registerDeviceForRemoteMessages(messaging);
    }
    return (await getToken(messaging)) || null;
  } catch (error) {
    console.warn('Unable to retrieve FCM token:', error);
    return null;
  }
};

const displayForegroundNotification = async (message: FirebaseMessagingTypes.RemoteMessage) => {
  const title = message.notification?.title || String(message.data?.title || 'FieldKonnect');
  const body = message.notification?.body || String(message.data?.body || 'You have a new notification.');
  const image = message.notification?.android?.imageUrl
    || message.notification?.apple?.imageUrl
    || (message.data?.image ? String(message.data.image) : undefined);
  const channelId = await notifee.createChannel({id: CHANNEL_ID, name: 'FieldConnect Notifications', importance: AndroidImportance.HIGH});
  await notifee.displayNotification({
    title, body, data: message.data,
    android: {
      channelId,
      importance: AndroidImportance.HIGH,
      style: image
        ? {type: AndroidStyle.BIGPICTURE, picture: image}
        : {type: AndroidStyle.BIGTEXT, text: body},
      pressAction: {id: 'default'},
    },
    ios: image ? {attachments: [{url: image}]} : undefined,
  });
};

export const subscribeToForegroundNotifications = () =>
  onMessage(getMessaging(), message => displayForegroundNotification(message).catch(error => console.warn('Unable to display notification:', error)));

export const subscribeToNotificationPresses = (onPress: () => void) => {
  const messaging = getMessaging();
  const unsubscribeFirebase = onNotificationOpenedApp(messaging, onPress);
  const unsubscribeNotifee = notifee.onForegroundEvent(({type}) => {
    if (type === EventType.PRESS) onPress();
  });
  getInitialNotification(messaging).then(message => { if (message) onPress(); }).catch(() => undefined);
  notifee.getInitialNotification().then(message => { if (message) onPress(); }).catch(() => undefined);
  return () => { unsubscribeFirebase(); unsubscribeNotifee(); };
};
