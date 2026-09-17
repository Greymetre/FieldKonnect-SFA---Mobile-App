import { ActionSheetIOS, Alert, Linking, NativeModules, Platform } from 'react-native';

// iOS email apps that accept a recipient in their URL scheme. Each scheme must
// also be listed under LSApplicationQueriesSchemes in Info.plist.
const IOS_EMAIL_APPS = [
  { name: 'Mail', check: 'message://', url: (to: string) => `mailto:${to}` },
  { name: 'Gmail', check: 'googlegmail://', url: (to: string) => `googlegmail://co?to=${to}` },
  { name: 'Outlook', check: 'ms-outlook://', url: (to: string) => `ms-outlook://compose?to=${to}` },
  { name: 'Yahoo Mail', check: 'ymail://', url: (to: string) => `ymail://mail/compose?to=${to}` },
  { name: 'Spark', check: 'readdle-spark://', url: (to: string) => `readdle-spark://compose?recipient=${to}` },
];

const noEmailApp = () => Alert.alert('No email app', 'Please install an email app to send an email.');

/** Lets the user choose which installed email app to use when more than one is available. */
export const composeEmail = async (email: string) => {
  const to = encodeURIComponent(String(email || '').trim());
  if (!to) return;

  if (Platform.OS === 'android') {
    try {
      await NativeModules.AppInfo.composeEmail(decodeURIComponent(to));
    } catch {
      Linking.openURL(`mailto:${to}`).catch(noEmailApp);
    }
    return;
  }

  const installed: typeof IOS_EMAIL_APPS = [];
  for (const app of IOS_EMAIL_APPS) {
    // canOpenURL can throw if a scheme is not whitelisted; treat that as not installed.
    if (await Linking.canOpenURL(app.check).catch(() => false)) installed.push(app);
  }
  if (installed.length === 0) {
    Linking.openURL(`mailto:${to}`).catch(noEmailApp);
    return;
  }
  if (installed.length === 1) {
    Linking.openURL(installed[0].url(to)).catch(noEmailApp);
    return;
  }
  ActionSheetIOS.showActionSheetWithOptions(
    { title: 'Send email with', options: [...installed.map(app => app.name), 'Cancel'], cancelButtonIndex: installed.length },
    index => {
      if (index < installed.length) Linking.openURL(installed[index].url(to)).catch(noEmailApp);
    },
  );
};
