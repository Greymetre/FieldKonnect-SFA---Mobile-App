import React, { useMemo } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import AppText from '../../components/AppText/AppText';
import { colors } from '../../utils/Colors';

/**
 * Lead activity timeline (notes, tasks, calls, opportunities, visits) shared by
 * Lead Details and the lead list cards. Call logs, opportunities and tasks open
 * their own screens.
 */
const ACTIVITY_META: Record<string, { label: string; icon: string }> = {
  log: { label: 'Log', icon: 'activity' },
  call_log: { label: 'Call Log', icon: 'phone' },
  task: { label: 'Task', icon: 'task' },
  note: { label: 'Note', icon: 'note' },
  opportunity: { label: 'Opportunity', icon: 'opportunity' },
  checkin: { label: 'Check In', icon: 'checkin' },
  checkout: { label: 'Check Out', icon: 'checkout' },
};

const visitDuration = (value: any) => {
  const [hours = 0, minutes = 0] = String(value || '').split(':').map(Number);
  if (!hours && !minutes) return '';
  return hours ? `${hours}h ${minutes}m` : `${minutes} min`;
};

const formatActivityTime = (value: any) => {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

export const normalizeActivity = (item: any, index: number) => {
  const meta = ACTIVITY_META[item?.type] || { label: 'Activity', icon: 'activity' };
  const description = item?.message || item?.note || item?.remark || item?.task_name || item?.title || item?.name || item?.description || 'Lead activity updated.';
  const owner = item?.createdby?.name || item?.assignUser?.name || item?.user?.name || item?.created_by_name || '';
  const isVisit = item?.type === 'checkin' || item?.type === 'checkout';
  // Call logs have a numeric connection status, so show the call direction as the tag instead.
  const callDirection = item?.type === 'call_log' ? (item?.direction === 'inbound' ? 'Inbound' : 'Outbound') : '';
  return {
    id: `${item?.type || 'activity'}-${item?.id || index}`,
    kind: item?.type,
    recordId: item?.id,
    type: meta.label,
    icon: meta.icon,
    // Check-out shows the visit note as the description and the location below it.
    description: item?.type === 'checkin' ? 'Visit started' : description,
    address: isVisit ? item?.address || '' : '',
    owner,
    time: formatActivityTime(item?.created_at),
    tag: callDirection || (item?.type === 'checkout' ? visitDuration(item?.duration) : item?.priority || item?.status || ''),
    date: item?.created_at_formatted || 'Date unavailable',
  };
};

type Props = {
  visible: boolean;
  onClose: () => void;
  activity: any[];
  navigation: any;
  loading?: boolean;
};

const LeadActivityModal = ({ visible, onClose, activity, navigation, loading = false }: Props) => {
  const activityGroups = useMemo(() => {
    const grouped = activity.map(normalizeActivity).reduce((result: Record<string, any[]>, item: any) => {
      (result[item.date] ||= []).push(item);
      return result;
    }, {});
    return Object.entries(grouped).map(([date, items]) => ({ date, items }));
  }, [activity]);

  // Call logs, opportunities and tasks open their own screen; other entries are not tappable.
  const openActivityItem = (item: any) => {
    const target = item.kind === 'call_log' ? ['CallDetails', { callLogId: item.recordId }]
      : item.kind === 'opportunity' ? ['OpportunityList', { opportunityId: item.recordId }]
        : item.kind === 'task' ? ['TaskList', { initialTab: 'lead', taskId: item.recordId }]
          : null;
    if (!target || !item.recordId) return undefined;
    return () => {
      onClose();
      navigation.navigate(target[0], target[1]);
    };
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => onClose()}>
      <View style={styles.modalBackdrop}>
        <View style={styles.activityModal}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleIcon}><ActivityIcon type="activity" color="white" /></View>
            <View style={{ flex: 1 }}>
              <AppText size={19} color="#202432" family="InterBold">Lead Activity</AppText>
              <AppText size={12} color="#858DA0" family="InterRegular">Complete lead history by date</AppText>
            </View>
            <Pressable style={styles.modalClose} onPress={() => onClose()}><ActivityIcon type="close" size={19} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.activityContent} showsVerticalScrollIndicator={false}>
            {loading ? <View style={styles.activityLoading}><ActivityIndicator size="large" color={colors.blue} /></View> : activityGroups.length ? activityGroups.map(group => (
              <View key={group.date} style={styles.activityGroup}>
                <View style={styles.dateBadge}><ActivityIcon type="calendar" size={17} /><AppText size={13} color={colors.blue} family="InterBold">{group.date}</AppText></View>
                <View style={styles.activityTimeline}>
                  {group.items.map((item, index) => <ActivityLogCard key={item.id} item={item} last={index === group.items.length - 1} onPress={openActivityItem(item)} />)}
                </View>
              </View>
            )) : <View style={styles.activityEmpty}><View style={styles.activityEmptyIcon}><ActivityIcon type="activity" size={28} /></View><AppText size={16} color="#30384A" family="InterBold">No activity found</AppText><AppText size={13} color="#8991A3" family="InterRegular" align="center">Lead updates, calls, visits, notes and tasks will appear here.</AppText></View>}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const ActivityLogCard = ({ item, last, onPress }: any) => (
  <View style={styles.activityEntryRow}>
    <View style={styles.timelineRail}>
      <View style={styles.timelineDot} />
      {!last && <View style={styles.timelineLine} />}
    </View>
    <Pressable style={({ pressed }) => [styles.activityEntry, onPress && pressed && styles.activityEntryPressed]} onPress={onPress} disabled={!onPress}>
      <View style={styles.activityEntryIcon}><ActivityIcon type={item.icon} size={21} /></View>
      <View style={{ flex: 1 }}>
        <View style={styles.activityEntryHeader}>
          <AppText size={15} color="#202432" family="InterBold">{item.type}</AppText>
          {item.tag && <View style={styles.activityTag}><AppText size={10} color={colors.blue} family="InterBold" numLines={1}>{item.tag}</AppText></View>}
          <AppText size={11} color="#9198A8" family="InterMedium" style={{ marginLeft: 'auto' }}>{item.time}</AppText>
        </View>
        <AppText size={14} color="#4F586D" family="InterRegular" style={styles.activityDescription}>{item.description}</AppText>
        {item.address ? (
          <View style={styles.activityAddress}>
            <ActivityIcon type="location" size={14} color="#8991A3" />
            <AppText size={12} color="#8991A3" family="InterRegular" style={{ flex: 1 }}>{item.address}</AppText>
          </View>
        ) : null}
        {item.owner ? <View style={styles.activityOwner}><ActivityIcon type="user" size={14} /><AppText size={12} color={colors.blue} family="InterSemiBold">{item.owner}</AppText></View> : null}
      </View>
      {onPress ? <AppText size={20} color="#B0B7C5" family="InterMedium" style={styles.activityChevron}>›</AppText> : null}
    </Pressable>
  </View>
);

const ActivityIcon = ({ type, size = 21, color = colors.blue }: any) => {
  const line = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const icons: Record<string, React.ReactNode> = {
    phone: <Path d="M7 3l3 4-2 2c1.6 3.5 3.5 5.4 7 7l2-2 4 3-1 3c-.4 1-1.5 1.5-2.5 1.2C9 18.5 5.5 15 2.8 6.5 2.5 5.5 3 4.4 4 4l3-1z" {...line} />,
    location: <><Path d="M12 22s7-6 7-13a7 7 0 10-14 0c0 7 7 13 7 13z" {...line} /><Circle cx="12" cy="9" r="2" {...line} /></>,
    note: <><Path d="M4 3h16v14l-4 4H4V3z" {...line} /><Path d="M16 21v-4h4M8 8h8m-8 4h6" {...line} /></>,
    checkin: <><Path d="M4 3h10v18H4z" {...line} /><Path d="M20 12H9m3-3l-3 3 3 3" {...line} /></>,
    checkout: <><Path d="M10 3h10v18H10z" {...line} /><Path d="M4 12h11m-3-3l3 3-3 3" {...line} /></>,
    activity: <><Path d="M4 12h4l2-6 4 12 2-6h4" {...line} /></>,
    task: <><Rect x="4" y="3" width="16" height="18" rx="2" {...line} /><Path d="M8 8l1 1 2-2m2 1h3M8 14l1 1 2-2m2 1h3" {...line} /></>,
    opportunity: <><Circle cx="12" cy="9" r="5" {...line} /><Path d="M9 15h6m-5 3h4m-2-14V2" {...line} /></>,
    calendar: <><Rect x="3" y="5" width="18" height="16" rx="2" {...line} /><Path d="M7 3v4m10-4v4M3 10h18" {...line} /></>,
    user: <><Circle cx="12" cy="8" r="4" {...line} /><Path d="M4 21c.6-5 3-7 8-7s7.4 2 8 7" {...line} /></>,
    close: <Path d="M6 6l12 12M18 6L6 18" {...line} />,
  };
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">{icons[type] || icons.activity}</Svg>;
};

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20,27,43,0.52)' },
  activityModal: { height: '88%', overflow: 'hidden', borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#F7F8FB' },
  modalHeader: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E8EBF1' },
  modalTitleIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  modalClose: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.blue + '0D', borderWidth: 1, borderColor: colors.blue + '25', alignItems: 'center', justifyContent: 'center' },
  activityContent: { padding: 16, paddingBottom: 32 },
  activityGroup: { marginBottom: 18 },
  dateBadge: { alignSelf: 'flex-start', height: 36, flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 11, paddingHorizontal: 12, borderRadius: 11, backgroundColor: colors.blue + '0D', borderWidth: 1, borderColor: colors.blue + '22' },
  activityTimeline: { gap: 0 },
  activityEmpty: { minHeight: 300, alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 35 },
  activityEmptyIcon: { width: 62, height: 62, marginBottom: 3, borderRadius: 20, backgroundColor: colors.blue + '0D', alignItems: 'center', justifyContent: 'center' },
  activityEntryRow: { flexDirection: 'row' },
  timelineRail: { width: 20, alignItems: 'center' },
  timelineDot: { width: 10, height: 10, marginTop: 22, borderRadius: 5, backgroundColor: colors.blue, borderWidth: 2, borderColor: '#DCE5FF' },
  timelineLine: { width: 2, flex: 1, minHeight: 72, backgroundColor: colors.blue + '22' },
  activityEntry: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginBottom: 12, padding: 14, borderRadius: 15, backgroundColor: 'white', borderWidth: 1, borderColor: '#E6E9F0', elevation: 2, shadowColor: '#17203A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  activityEntryIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.blue + '0D', alignItems: 'center', justifyContent: 'center' },
  activityEntryHeader: { minHeight: 22, flexDirection: 'row', alignItems: 'center', gap: 7 },
  activityTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9, backgroundColor: colors.blue + '10', borderWidth: 1, borderColor: colors.blue + '25' },
  activityDescription: { marginTop: 5, lineHeight: 19 },
  activityOwner: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  activityAddress: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: 5 },
  activityEntryPressed: { opacity: 0.7 },
  activityChevron: { alignSelf: 'center', marginLeft: 2 },
  activityLoading: { minHeight: 300, alignItems: 'center', justifyContent: 'center' },
});

export default LeadActivityModal;
