import { NativeModules } from 'react-native';
import appPackage from '../../package.json';

type AppInfoConstants = {
  versionName?: string;
  versionCode?: number;
};

const appInfo = NativeModules.AppInfo as AppInfoConstants | undefined;

/**
 * Android gets this value from BuildConfig.VERSION_NAME, which Gradle creates
 * from android/app/build.gradle. The package version is only a development
 * fallback for a JS reload performed before the native app is rebuilt.
 */
export const APP_VERSION =
  appInfo?.versionName
    ? String(appInfo.versionName).trim()
    : appPackage.version;

export const APP_BUILD_NUMBER = appInfo?.versionCode !== undefined
  ? String(appInfo.versionCode).trim()
  : '0';

export const ANDROID_APP_VERSION = APP_VERSION;

export const compareVersions = (left: unknown, right: unknown): number => {
  const toParts = (version: unknown) =>
    String(version ?? '')
      .trim()
      .split('.')
      .map(part => Number.parseInt(part, 10) || 0);

  const leftParts = toParts(left);
  const rightParts = toParts(right);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;

    if (leftPart > rightPart) return 1;
    if (leftPart < rightPart) return -1;
  }

  return 0;
};
