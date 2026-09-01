import React, {ReactNode} from 'react';
import {Image, Pressable, StyleSheet, View} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';
import AppText from '../AppText/AppText';
import {AppNotification} from '../../api/query/NotificationApi';
import {colors} from '../../utils/Colors';

type Props = {
  notification: AppNotification;
  onPress: () => void;
  rightAccessory?: ReactNode;
};

const relativeTime = (value: string) => {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (elapsedSeconds < 60) return 'Just now';
  const minutes = Math.floor(elapsedSeconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(value).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'});
};

const ModelIcon = ({model}: {model: string}) => {
  const normalized = model.trim().toLowerCase();
  const common = {stroke: colors.blue, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};

  if (normalized === 'order' || normalized === 'order_history') {
    return <Svg width={30} height={30} viewBox="0 0 24 24" fill="none"><Path d="M3 4h2l2.1 10h9.8l2-7H6.2M9 19a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm9 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" {...common} /></Svg>;
  }
  if (normalized === 'tour' || normalized === 'tour_plan') {
    return <Svg width={30} height={30} viewBox="0 0 24 24" fill="none"><Path d="M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 8h3v3H8v-3Z" {...common} /></Svg>;
  }
  if (normalized === 'attendance') {
    return <Svg width={30} height={30} viewBox="0 0 24 24" fill="none"><Circle cx={9} cy={8} r={3} {...common} /><Path d="M3.5 19c.5-4 2.3-6 5.5-6 2.2 0 3.8.9 4.7 2.8M15 18l2 2 4-5" {...common} /></Svg>;
  }
  if (normalized === 'leave') {
    return <Svg width={30} height={30} viewBox="0 0 24 24" fill="none"><Path d="M6 3h8l4 4v14H6V3Zm8 0v5h4M9 12h6m-6 4h5" {...common} /></Svg>;
  }
  if (normalized === 'expense' || normalized === 'expense_management') {
    return <Svg width={30} height={30} viewBox="0 0 24 24" fill="none"><Path d="M4 7h16v12H4V7Zm0 3h16M8 4h8M9 14h4m-2-2v5" {...common} /></Svg>;
  }
  if (['customer', 'distributor', 'secondary_customer'].includes(normalized)) {
    return <Svg width={30} height={30} viewBox="0 0 24 24" fill="none"><Circle cx={9} cy={8} r={3} {...common} /><Circle cx={17} cy={9} r={2} {...common} /><Path d="M3 20c0-4 2-7 6-7s6 3 6 7m0-6c3 0 5 2 5 5" {...common} /></Svg>;
  }
  return <Svg width={30} height={30} viewBox="0 0 24 24" fill="none"><Path d="M6 17h12l-1.5-2V10a4.5 4.5 0 0 0-9 0v5L6 17Zm4 3h4" {...common} /></Svg>;
};

const NotificationRow = ({notification, onPress, rightAccessory}: Props) => {
  const isGeneral = notification.model?.trim().toLowerCase() === 'general_notification';

  return (
    <Pressable onPress={onPress} style={[styles.row, !notification.read && styles.unreadRow]}>
      <View style={styles.thumbnail}>
        {isGeneral && notification.image ? (
          <Image source={{uri: notification.image}} style={styles.image} resizeMode="cover" />
        ) : isGeneral ? (
          <View style={styles.placeholder}><AppText size={30} color="#FFF" family="InterBold">F</AppText></View>
        ) : (
          <View style={styles.modelIcon}><ModelIcon model={notification.model || ''} /></View>
        )}
      </View>
      <View style={styles.copy}>
        <View style={styles.titleLine}>
          <AppText size={16} color="#172451" family={notification.read ? 'InterSemiBold' : 'InterBold'} numLines={1} style={styles.title}>
            {notification.type || 'FieldKonnect'}
          </AppText>
          {!notification.read && <View style={styles.unreadDot} />}
        </View>
        <AppText size={14} color="#647093" numLines={1} style={styles.message}>{notification.data}</AppText>
        <AppText size={11} color="#8A94AF" style={styles.time}>{relativeTime(notification.created_at)}</AppText>
      </View>
      {!!rightAccessory && <View style={styles.accessory}>{rightAccessory}</View>}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {minHeight: 94, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 11, borderRadius: 14, borderWidth: 1, borderColor: '#E1E6F1', backgroundColor: '#FFF'},
  unreadRow: {backgroundColor: '#EAF0FF', borderColor: '#B8C7EC'},
  thumbnail: {width: 64, height: 64, borderRadius: 13, overflow: 'hidden', backgroundColor: '#E4EAF7'},
  image: {width: '100%', height: '100%'},
  placeholder: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue},
  modelIcon: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8EEFC'},
  copy: {minWidth: 0, flex: 1, marginLeft: 12},
  titleLine: {flexDirection: 'row', alignItems: 'center'},
  title: {minWidth: 0, flex: 1},
  unreadDot: {width: 8, height: 8, marginLeft: 7, borderRadius: 4, backgroundColor: '#F05257'},
  message: {marginTop: 3},
  time: {marginTop: 7},
  accessory: {marginLeft: 6, alignItems: 'center', justifyContent: 'center'},
});

export default NotificationRow;
