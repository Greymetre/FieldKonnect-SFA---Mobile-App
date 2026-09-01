import { Platform } from 'react-native';
import { createMMKV } from 'react-native-mmkv';

const deviceIdentityStorage = createMMKV({ id: 'field-connect-device-identity' });
const UNIQUE_ID_KEY = 'unique-device-id';

export const getDeviceName = () => {
  const constants = Platform.constants as Record<string, any>;
  const androidName = [constants.Brand, constants.Model].filter(Boolean).join(' ');

  if (androidName) return androidName;

  if (Platform.OS === 'ios') {
    return constants.interfaceIdiom || constants.systemName || 'iOS';
  }

  return Platform.OS;
};

export const getUniqueDeviceId = () => {
  const storedId = deviceIdentityStorage.getString(UNIQUE_ID_KEY);
  if (storedId) return storedId;

  const randomPart = `${Math.random().toString(36).slice(2)}${Math.random()
    .toString(36)
    .slice(2)}`;
  const uniqueId = `${Platform.OS}-${Date.now().toString(36)}-${randomPart}`;

  deviceIdentityStorage.set(UNIQUE_ID_KEY, uniqueId);
  return uniqueId;
};
