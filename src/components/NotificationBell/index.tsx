import React, {useCallback, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {NavigationProp, ParamListBase, useFocusEffect, useNavigation} from '@react-navigation/native';
import Svg, {Path} from 'react-native-svg';
import AppText from '../AppText/AppText';
import {getNotifications} from '../../api/query/NotificationApi';

const BellIcon = () => (
  <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
    <Path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" stroke="#FFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const NotificationBell = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(useCallback(() => {
    getNotifications(1, 1, false).then(result => setUnreadCount(result.total)).catch(() => undefined);
  }, []));

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Notifications, ${unreadCount} unread`} hitSlop={10} onPress={() => navigation.navigate('Notifications')} style={styles.button}>
      <BellIcon />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <AppText color="#FFF" size={10} family="InterBold">{unreadCount > 99 ? '99+' : unreadCount}</AppText>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {width: 38, height: 38, alignItems: 'center', justifyContent: 'center'},
  badge: {position: 'absolute', right: -1, top: -1, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: '#E53935', borderWidth: 1.5, borderColor: '#395299', alignItems: 'center', justifyContent: 'center'},
});

export default NotificationBell;
