import React, {useCallback, useMemo, useState} from 'react';
import {ActivityIndicator, Pressable, RefreshControl, SectionList, StyleSheet, View} from 'react-native';
import {NavigationProp, ParamListBase, useFocusEffect, useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AppText from '../../components/AppText/AppText';
import {colors} from '../../utils/Colors';
import {AppNotification, getNotifications, markNotificationRead} from '../../api/query/NotificationApi';
import NotificationRow from '../../components/NotificationRow';
import {groupNotificationsByDate} from '../../utils/notificationSections';

type NotificationFilter = 'all' | 'read' | 'unread';

const Notifications = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [readingId, setReadingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const sections = useMemo(() => groupNotificationsByDate(items), [items]);

  const load = useCallback(async (requestedPage = 1) => {
    const read = filter === 'read' ? true : filter === 'unread' ? false : undefined;
    const result = await getNotifications(requestedPage, 30, read);
    setItems(current => requestedPage === 1 ? result.data : [...current, ...result.data]);
    setPage(result.current_page);
    setLastPage(result.last_page);
  }, [filter]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load(1).catch(() => setItems([])).finally(() => setLoading(false));
  }, [load]));

  const navigateFromNotification = (notification: AppNotification) => {
    const model = notification.model?.trim().toLowerCase();
    const notificationType = notification.type?.trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (model === 'general_notification') {
      navigation.navigate('BottomTab', {
        screen: 'News',
        params: {selectedNotification: notification},
      });
      return;
    }
    if (model === 'lead' || model === 'leads' || model === 'lead_notification') {
      if (notification.model_id !== null && notification.model_id !== undefined) {
        navigation.navigate('LeadDetails', {lead: {id: notification.model_id}});
      } else {
        navigation.navigate('LeadKonnect');
      }
      return;
    }
    if (model === 'opportunity' || model === 'lead_opportunity' || notificationType === 'opportunity' || notificationType === 'new_opportunity') {
      navigation.navigate('OpportunityList');
      return;
    }
    if (model === 'task' || model === 'lead_task' || notificationType === 'lead_task') {
      navigation.navigate('TaskList', {initialTab: 'lead'});
      return;
    }
    if (model === 'task_management' || model === 'management_task' || model === 'assigned_task' || notificationType === 'task_management') {
      navigation.navigate('TaskList', {initialTab: 'management'});
      return;
    }
    if (!model || notification.model_id === null || notification.model_id === undefined) {
      navigation.navigate('BottomTab');
      return;
    }
    const id = notification.model_id;
    switch (model) {
      case 'order':
      case 'order_history':
        navigation.navigate('OrderHistoryDetailsScreen', {orderId: id});
        return;
      case 'expense':
      case 'expense_management':
        navigation.navigate('ExpenseDetails', {expense_id: id, mode: 'approval'});
        return;
      case 'attendance':
        navigation.navigate('AttendanceReport', {attendanceId: id});
        return;
      case 'leave': {
        const leaveDates = notification.data?.match(/\d{4}-\d{2}-\d{2}/g) ?? [];
        navigation.navigate('AttendanceReport', {
          leaveId: id,
          reportType: 'leave',
          startDate: notification.from_date || leaveDates[0] || null,
          endDate: notification.to_date || leaveDates[1] || leaveDates[0] || null,
        });
        return;
      }
      case 'tour':
      case 'tour_plan':
        navigation.navigate('TourPlanPage', {tourId: id});
        return;
      case 'customer':
      case 'distributor':
      case 'secondary_customer':
        navigation.navigate('CustomerList', {customerId: id});
        return;
      default:
        navigation.navigate('BottomTab');
    }
  };

  const handlePress = async (item: AppNotification) => {
    if (readingId !== null) return;
    if (!item.read) {
      setReadingId(item.id);
      try {
        await markNotificationRead(item.id);
        setItems(current => current.map(value => value.id === item.id ? {...value, read: true} : value));
      } catch {
        // Still allow the destination to open if marking read fails.
      } finally {
        setReadingId(null);
      }
    }
    navigateFromNotification(item);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.blue} /></View>;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.filters}>
        {(['all', 'read', 'unread'] as NotificationFilter[]).map(value => (
          <Pressable
            key={value}
            accessibilityRole="button"
            onPress={() => setFilter(value)}
            style={[styles.filterChip, filter === value && styles.activeFilterChip]}>
            <AppText
              size={14}
              family="InterMedium"
              color={filter === value ? '#FFF' : colors.blue}>
              {value === 'all' ? 'All' : value === 'read' ? 'Read' : 'Unread'}
            </AppText>
          </Pressable>
        ))}
      </View>
      <SectionList
        sections={sections}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={[styles.content, items.length === 0 && styles.emptyContent]}
        stickySectionHeadersEnabled={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => {
          setRefreshing(true);
          try { await load(1); } finally { setRefreshing(false); }
        }} />}
        onEndReached={async () => {
          if (loadingMore || page >= lastPage) return;
          setLoadingMore(true);
          try { await load(page + 1); } finally { setLoadingMore(false); }
        }}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={<View style={styles.center}><AppText size={17} family="InterSemiBold" color={colors.blue}>No notifications yet</AppText><AppText size={13} color="#707070">New updates will appear here.</AppText></View>}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.blue} style={styles.footer} /> : null}
        renderSectionHeader={({section}) => (
          <AppText size={17} color="#172451" family="InterBold" style={styles.sectionTitle}>{section.title}</AppText>
        )}
        renderItem={({item}) => (
          <View style={styles.rowSpacing}>
            <NotificationRow
              notification={item}
              onPress={() => handlePress(item)}
              rightAccessory={readingId === item.id ? <ActivityIndicator size="small" color={colors.blue} /> : undefined}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bgColor},
  filters: {flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingTop: 14, paddingBottom: 2},
  filterChip: {height: 40, minWidth: 72, paddingHorizontal: 18, borderRadius: 22, borderWidth: 1, borderColor: '#CAD3EA', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF'},
  activeFilterChip: {backgroundColor: colors.blue, borderColor: colors.blue},
  content: {paddingHorizontal: 12, paddingBottom: 12},
  emptyContent: {flexGrow: 1},
  sectionTitle: {marginTop: 18, marginBottom: 10, marginLeft: 2},
  rowSpacing: {marginBottom: 10},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.bgColor},
  footer: {paddingVertical: 16},
});

export default Notifications;
