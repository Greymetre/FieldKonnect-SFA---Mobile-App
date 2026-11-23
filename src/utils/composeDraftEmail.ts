import { ActionSheetIOS, Alert, Linking, Platform } from 'react-native';

// iOS email apps that accept recipients and a body in their URL scheme. Each
// scheme must also be listed under LSApplicationQueriesSchemes in Info.plist.
const IOS_EMAIL_APPS = [
  { name: 'Mail', check: 'message://', url: (to: string, body: string) => `mailto:${to}?body=${body}` },
  { name: 'Gmail', check: 'googlegmail://', url: (to: string, body: string) => `googlegmail://co?to=${to}&body=${body}` },
  { name: 'Outlook', check: 'ms-outlook://', url: (to: string, body: string) => `ms-outlook://compose?to=${to}&body=${body}` },
  { name: 'Yahoo Mail', check: 'ymail://', url: (to: string, body: string) => `ymail://mail/compose?to=${to}&body=${body}` },
];

const noEmailApp = () => Alert.alert('No email app', 'Please install an email app to send an email.');

/**
 * Opens a new email to one or more recipients with the approved draft as the
 * body. Android shows the system app chooser; iOS lets the user pick among the
 * installed email apps when there is more than one.
 */
export const composeDraftEmail = async (recipients: string[], body: string) => {
  const to = recipients.map(email => String(email || '').trim()).filter(Boolean).map(encodeURIComponent).join(',');
  if (!to) return;
  const encodedBody = encodeURIComponent(body || '');

  if (Platform.OS === 'android') {
    Linking.openURL(`mailto:${to}?body=${encodedBody}`).catch(noEmailApp);
    return;
  }

  const installed: typeof IOS_EMAIL_APPS = [];
  for (const app of IOS_EMAIL_APPS) {
    if (await Linking.canOpenURL(app.check).catch(() => false)) installed.push(app);
  }
  if (installed.length <= 1) {
    Linking.openURL((installed[0] || IOS_EMAIL_APPS[0]).url(to, encodedBody)).catch(noEmailApp);
    return;
  }
  ActionSheetIOS.showActionSheetWithOptions(
    { title: 'Send email with', options: [...installed.map(app => app.name), 'Cancel'], cancelButtonIndex: installed.length },
    index => {
      if (index < installed.length) Linking.openURL(installed[index].url(to, encodedBody)).catch(noEmailApp);
    },
  );
};
