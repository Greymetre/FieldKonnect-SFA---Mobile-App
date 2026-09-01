import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';
import { Dropdown } from 'react-native-element-dropdown';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { changeLeadTaskStatusApi, changeManagementTaskStatusApi, getLeadTaskDropdownsApi, getLeadTasksApi, getOtherTasksApi } from '../../api/query/LeadApi';
import AppText from '../../components/AppText/AppText';
import CustomerCalendar from '../../components/CustomCalendar/CalendarPopupView';
import { colors } from '../../utils/Colors';
import { fonts } from '../../utils/typography';

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' }, { label: 'Pending', value: 'pending' },
  { label: 'Open', value: 'open' }, { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
];
const formatDate = (date: Date | null) => date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';
const displayDate = (date: Date | null) => date ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
const titleCase = (value: any) => String(value || 'Pending').replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase());

const normalizeTask = (item: any, tab: 'lead' | 'management') => tab === 'lead' ? {
  id: item.id, category: 'lead', lead: item?.lead?.company_name || 'Unnamed Lead', contact: item?.contact?.name || 'No contact',
  mobile: item?.contact?.phone_number || '', assigned: item?.assign_user?.name || item?.assignUser?.name || 'Unassigned',
  description: item?.description || 'No description', priority: titleCase(item?.priority), status: titleCase(item?.status),
} : {
  id: item.id, category: 'management', lead: item?.title || item?.task_type || item?.lead?.company_name || 'Task Management',
  contact: item?.customers?.name || item?.project?.name || item?.task_department?.name || 'General task', mobile: item?.customers?.mobile || '',
  assigned: item?.users?.name || 'Unassigned', description: item?.descriptions || 'No description',
  priority: item?.task_priority?.name || 'Normal', status: titleCase(item?.task_status),
};

const TaskList = ({ route }: any) => {
  const requestedTab = route?.params?.initialTab === 'management' ? 'management' : 'lead';
  const [tab, setTab] = useState<'lead' | 'management'>(requestedTab);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [summaryTasks, setSummaryTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingTaskId, setChangingTaskId] = useState<any>(null);
  const [completionTask, setCompletionTask] = useState<any>(null);
  const [completionRemark, setCompletionRemark] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [draftUser, setDraftUser] = useState<any>('');
  const [draftStatus, setDraftStatus] = useState('');
  const [draftStart, setDraftStart] = useState<Date | null>(null);
  const [draftEnd, setDraftEnd] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [rangeType, setRangeType] = useState('custom');
  const sheetRef = useRef<ActionSheetRef>(null);

  useEffect(() => {
    setTab(requestedTab);
  }, [requestedTab]);

  useEffect(() => { const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350); return () => clearTimeout(timer); }, [search]);
  useEffect(() => { getLeadTaskDropdownsApi().then(response => setUsers(response?.data?.data?.users || [])).catch(() => setUsers([])); }, []);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { pageSize: 100 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedUser) params.user_id = selectedUser;
      if (startDate && endDate) { params.start_date = formatDate(startDate); params.end_date = formatDate(endDate); }
      const taskApi = tab === 'lead' ? getLeadTasksApi : getOtherTasksApi;
      const listParams = selectedStatus ? { ...params, status_id: selectedStatus } : params;
      const [response, summaryResponse] = selectedStatus
        ? await Promise.all([taskApi(listParams), taskApi(params)])
        : [await taskApi(params), null];
      setTasks((response?.data?.data || []).map((item: any) => normalizeTask(item, tab)));
      setSummaryTasks(((summaryResponse || response)?.data?.data || []).map((item: any) => normalizeTask(item, tab)));
    } catch (error: any) {
      console.log('Task listing error:', error?.response || error);
      setTasks([]);
      setSummaryTasks([]);
    } finally { setLoading(false); }
  }, [debouncedSearch, endDate, selectedStatus, selectedUser, startDate, tab]);
  useFocusEffect(useCallback(() => { loadTasks(); }, [loadTasks]));

  const userOptions = useMemo(() => [{ label: 'All Users', value: '' }, ...users.map(item => ({ label: item.name, value: item.id }))], [users]);
  const counts = useMemo(() => ({ total: summaryTasks.length, pending: summaryTasks.filter(item => item.status.toLowerCase() === 'pending').length, open: summaryTasks.filter(item => item.status.toLowerCase() === 'open').length, progress: summaryTasks.filter(item => item.status.toLowerCase() === 'in progress').length, completed: summaryTasks.filter(item => item.status.toLowerCase() === 'completed').length }), [summaryTasks]);
  const activeFilters = Number(Boolean(selectedUser)) + Number(Boolean(selectedStatus)) + Number(Boolean(startDate && endDate));
  const openFilters = () => { setDraftUser(selectedUser); setDraftStatus(selectedStatus); setDraftStart(startDate); setDraftEnd(endDate); sheetRef.current?.show(); };
  const clearFilters = () => { setDraftUser(''); setDraftStatus(''); setDraftStart(null); setDraftEnd(null); setSelectedUser(''); setSelectedStatus(''); setStartDate(null); setEndDate(null); sheetRef.current?.hide(); };
  const applyFilters = () => { setSelectedUser(draftUser); setSelectedStatus(draftStatus); setStartDate(draftStart); setEndDate(draftEnd); sheetRef.current?.hide(); };
  const openDatePicker = () => { sheetRef.current?.hide(); setTimeout(() => setShowCalendar(true), 300); };
  const setCalendarVisible = (visible: boolean) => { setShowCalendar(visible); if (!visible) setTimeout(() => sheetRef.current?.show(), 250); };
  const confirmTaskStatusChange = (task: any) => {
    const currentStatus = task.status.toLowerCase();
    if (!['pending', 'open', 'in progress'].includes(currentStatus) || changingTaskId !== null) return;
    if (currentStatus === 'in progress') {
      setCompletionRemark('');
      setCompletionTask(task);
      return;
    }
    const nextStatus = currentStatus === 'pending' ? 'open' : 'in_progress';
    const nextStatusLabel = currentStatus === 'pending' ? 'Open' : 'In Progress';
    Alert.alert(`${nextStatusLabel} Task`, 'Are you sure you want to proceed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: async () => {
        try {
          setChangingTaskId(task.id);
          if (tab === 'lead') await changeLeadTaskStatusApi(task.id, nextStatus);
          else await changeManagementTaskStatusApi(task.id, nextStatus, `Task changed to ${nextStatusLabel} from mobile app.`);
          await loadTasks();
          Alert.alert('Status Updated', `Task status changed from ${task.status} to ${nextStatusLabel}.`);
        } catch (error: any) {
          const message = error?.response?.data?.message;
          Alert.alert('Update Failed', typeof message === 'string' ? message : 'Unable to change task status.');
        } finally { setChangingTaskId(null); }
      } },
    ]);
  };

  const completeTask = async () => {
    const remark = completionRemark.trim();
    if (!remark) {
      Alert.alert('Remark Required', 'Please enter a remark before completing the task.');
      return;
    }
    const task = completionTask;
    try {
      setChangingTaskId(task.id);
      if (tab === 'lead') await changeLeadTaskStatusApi(task.id, 'completed', remark);
      else await changeManagementTaskStatusApi(task.id, 'completed', remark);
      setCompletionTask(null);
      setCompletionRemark('');
      await loadTasks();
      Alert.alert('Status Updated', 'Task status changed from In Progress to Completed.');
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert('Update Failed', typeof message === 'string' ? message : 'Unable to complete the task.');
    } finally { setChangingTaskId(null); }
  };

  return <View style={styles.container}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.searchRow}><View style={styles.searchBox}><TaskIcon type="search" /><TextInput value={search} onChangeText={setSearch} placeholder="Search tasks" placeholderTextColor="#8A92A4" style={styles.searchInput} /></View><Pressable style={styles.filterButton} onPress={openFilters}><TaskIcon type="filter" color="white" />{activeFilters > 0 && <View style={styles.filterCount}><AppText size={10} color={colors.blue} family="InterBold">{activeFilters}</AppText></View>}</Pressable></View>
      <View style={styles.tabs}><TaskTab active={tab === 'lead'} icon="lead" label="Lead Tasks" onPress={() => setTab('lead')} /><TaskTab active={tab === 'management'} icon="task" label="Task Management" onPress={() => setTab('management')} /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryRow}><Summary count={counts.total} label="Total" active={selectedStatus === ''} onPress={() => setSelectedStatus('')} /><Summary count={counts.pending} label="Pending" active={selectedStatus === 'pending'} onPress={() => setSelectedStatus('pending')} /><Summary count={counts.open} label="Open" active={selectedStatus === 'open'} onPress={() => setSelectedStatus('open')} /><Summary count={counts.progress} label="In Progress" active={selectedStatus === 'in_progress'} onPress={() => setSelectedStatus('in_progress')} /><Summary count={counts.completed} label="Completed" active={selectedStatus === 'completed'} onPress={() => setSelectedStatus('completed')} /></ScrollView>
      <View style={styles.listHeader}><AppText size={17} color="#202432" family="InterBold">{tab === 'lead' ? 'Lead Tasks' : 'Management Tasks'}</AppText><View style={styles.countBadge}><AppText size={12} color={colors.blue} family="InterBold">{tasks.length} tasks</AppText></View></View>
      {loading ? <View style={styles.loading}><ActivityIndicator size="large" color={colors.blue} /></View> : tasks.length ? tasks.map(item => <TaskCard key={item.id} item={item} changing={changingTaskId === item.id} onStatusPress={() => confirmTaskStatusChange(item)} />) : <View style={styles.empty}><View style={styles.emptyIcon}><TaskIcon type="task" size={28} /></View><AppText size={15} color="#30384A" family="InterBold">No tasks found</AppText><AppText size={13} color="#8A92A4" family="InterRegular">Try changing your search or filters.</AppText></View>}
    </ScrollView>
    <ActionSheet ref={sheetRef} gestureEnabled containerStyle={styles.sheet}><View style={styles.sheetBody}><View style={styles.sheetHeader}><View><AppText size={19} color="#202432" family="InterBold">Filter Tasks</AppText><AppText size={12} color="#858DA0" family="InterRegular">Narrow tasks by user, status and date</AppText></View><Pressable style={styles.close} onPress={() => sheetRef.current?.hide()}><AppText size={24} color="#667086">×</AppText></Pressable></View><FilterLabel text="User" /><Dropdown style={styles.dropdown} data={userOptions} labelField="label" valueField="value" value={draftUser} onChange={item => setDraftUser(item.value)} placeholder="Select user" placeholderStyle={styles.placeholder} selectedTextStyle={styles.selectedText} /><FilterLabel text="Status" /><Dropdown style={styles.dropdown} data={STATUS_OPTIONS} labelField="label" valueField="value" value={draftStatus} onChange={item => setDraftStatus(item.value)} placeholder="Select status" placeholderStyle={styles.placeholder} selectedTextStyle={styles.selectedText} /><FilterLabel text="Date Range" /><Pressable style={styles.dateField} onPress={openDatePicker}><TaskIcon type="calendar" /><AppText size={14} color={draftStart && draftEnd ? '#202432' : '#8A92A4'} family="InterMedium">{draftStart && draftEnd ? `${displayDate(draftStart)} - ${displayDate(draftEnd)}` : 'Select date range'}</AppText></Pressable><View style={styles.sheetActions}><Pressable style={styles.clearButton} onPress={clearFilters}><AppText size={15} color={colors.blue} family="InterBold">Clear</AppText></Pressable><Pressable style={styles.applyButton} onPress={applyFilters}><AppText size={15} color="white" family="InterBold">Apply Filters</AppText></Pressable></View></View></ActionSheet>
    <CustomerCalendar showCal={showCalendar} setShowCal={setCalendarVisible} range={rangeType} minimumDate={null} initialStartDate={draftStart} initialEndDate={draftEnd} setRange={setRangeType} onApplyClick={(start, end, type) => { setDraftStart(start); setDraftEnd(end); setRangeType(type || 'custom'); }} />
    <Modal visible={Boolean(completionTask)} transparent animationType="fade" onRequestClose={() => !changingTaskId && setCompletionTask(null)}>
      <View style={(styles as any).modalOverlay}><View style={(styles as any).remarkModal}>
        <View style={(styles as any).remarkHeader}><View style={(styles as any).remarkIcon}><TaskIcon type="task" size={24} /></View><View style={{ flex: 1 }}><AppText size={18} color="#202432" family="InterBold">Complete Task</AppText><AppText size={12} color="#7A8499" family="InterRegular">Update task status to completed</AppText></View></View>
        <AppText size={15} color="#30384A" family="InterSemiBold" style={(styles as any).confirmText}>Are you sure you want to proceed?</AppText>
        <AppText size={13} color="#566078" family="InterSemiBold" style={(styles as any).remarkLabel}>Remark *</AppText>
        <TextInput value={completionRemark} onChangeText={setCompletionRemark} placeholder="Enter completion remark" placeholderTextColor="#9AA1B1" multiline maxLength={500} textAlignVertical="top" style={(styles as any).remarkInput} editable={!changingTaskId} />
        <AppText size={11} color="#9299A8" family="InterRegular" style={(styles as any).characterCount}>{completionRemark.length}/500</AppText>
        <View style={(styles as any).remarkActions}><Pressable style={(styles as any).cancelRemarkButton} onPress={() => { setCompletionTask(null); setCompletionRemark(''); }} disabled={Boolean(changingTaskId)}><AppText size={15} color={colors.blue} family="InterBold">Cancel</AppText></Pressable><Pressable style={(styles as any).confirmRemarkButton} onPress={completeTask} disabled={Boolean(changingTaskId)}>{changingTaskId ? <ActivityIndicator size="small" color="white" /> : <AppText size={15} color="white" family="InterBold">Yes</AppText>}</Pressable></View>
      </View></View>
    </Modal>
  </View>;
};

const TaskTab = ({ active, icon, label, onPress }: any) => <Pressable style={[styles.tab, active && styles.activeTab]} onPress={onPress}><TaskIcon type={icon} color={active ? 'white' : colors.blue} /><AppText size={14} color={active ? 'white' : colors.blue} family="InterBold">{label}</AppText></Pressable>;
const Summary = ({ count, label, active = false, onPress }: any) => <Pressable style={[styles.summaryCard, active && styles.summaryActive]} onPress={onPress}><AppText size={19} color={active ? 'white' : colors.blue} family="InterBold">{count}</AppText><AppText size={12} color={active ? 'white' : '#667086'} family="InterSemiBold">{label}</AppText></Pressable>;
const FilterLabel = ({ text }: any) => <AppText size={13} color="#566078" family="InterSemiBold" style={styles.filterLabel}>{text}</AppText>;
const TaskCard = ({ item, changing, onStatusPress }: any) => { const actionable = ['pending', 'open', 'in progress'].includes(item.status.toLowerCase()); return <View style={styles.taskCard}><View style={styles.cardTop}><View style={styles.leadIcon}><TaskIcon type={item.category === 'lead' ? 'lead' : 'task'} size={22} /></View><View style={{ flex: 1, minWidth: 0 }}><AppText size={17} color={colors.blue} family="InterBold" numLines={1}>{item.lead}</AppText><AppText size={13} color="#687086" family="InterMedium" numLines={1}>{item.contact}</AppText></View><Pressable style={[styles.statusBadge, actionable && styles.statusBadgeAction]} onPress={onStatusPress} disabled={!actionable || changing}>{changing ? <ActivityIndicator size="small" color={colors.blue} /> : <AppText size={11} color={colors.blue} family="InterBold">{item.status}</AppText>}</Pressable></View><View style={styles.divider} /><View style={styles.infoRow}><Info icon="user" label="Assigned To" value={item.assigned} /><Info icon="priority" label="Priority" value={item.priority} /></View>{item.mobile ? <><View style={styles.divider} /><Info icon="phone" label="Mobile Number" value={item.mobile} /></> : null}<View style={styles.descriptionBox}><TaskIcon type="note" size={19} /><AppText size={14} color="#4F586D" family="InterRegular" style={{ flex: 1 }}>{item.description}</AppText></View></View>; };
const Info = ({ icon, label, value }: any) => <View style={styles.info}><View style={styles.smallIcon}><TaskIcon type={icon} size={17} /></View><View style={{ flex: 1 }}><AppText size={11} color="#9299A8" family="InterSemiBold">{label}</AppText><AppText size={13} color="#30384A" family="InterSemiBold" numLines={1}>{value}</AppText></View></View>;
const TaskIcon = ({ type, size = 20, color = colors.blue }: any) => { const line = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }; const icons: Record<string, React.ReactNode> = { search: <><Circle cx="10" cy="10" r="6" {...line} /><Path d="M15 15l5 5" {...line} /></>, filter: <Path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" {...line} />, task: <><Rect x="4" y="3" width="16" height="18" rx="2" {...line} /><Path d="M8 8l1 1 2-2m2 1h3M8 14l1 1 2-2m2 1h3" {...line} /></>, lead: <><Circle cx="9" cy="8" r="3" {...line} /><Path d="M3 19c.5-4 2.5-6 6-6s5.5 2 6 6m1-7l2 2 4-5" {...line} /></>, user: <><Circle cx="12" cy="8" r="3" {...line} /><Path d="M5 20c.5-4 2.8-6 7-6s6.5 2 7 6" {...line} /></>, priority: <Path d="M5 21V4m0 1h12l-2 4 2 4H5" {...line} />, phone: <Path d="M7 3l3 4-2 2c1.5 3 3.5 5 7 7l2-2 4 3-1 3c-.4 1-1.5 1.5-2.5 1.2C9 18.5 5.5 15 2.8 6.5 2.5 5.5 3 4.4 4 4l3-1z" {...line} />, note: <><Path d="M4 3h16v14l-4 4H4V3z" {...line} /><Path d="M16 21v-4h4M8 8h8m-8 4h6" {...line} /></>, calendar: <><Rect x="3" y="5" width="18" height="16" rx="2" {...line} /><Path d="M7 3v4m10-4v4M3 10h18" {...line} /></> }; return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">{icons[type]}</Svg>; };

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#F4F6FA' }, content: { padding: 16, paddingBottom: 35 }, searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, searchBox: { flex: 1, height: 50, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderRadius: 13, borderWidth: 1, borderColor: '#D8DEE9', backgroundColor: 'white' }, searchInput: { flex: 1, color: '#202432', fontSize: 15, fontFamily: fonts.InterRegular }, filterButton: { width: 50, height: 50, borderRadius: 13, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' }, filterCount: { position: 'absolute', right: -4, top: -5, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: 'white', borderWidth: 1, borderColor: colors.blue, alignItems: 'center', justifyContent: 'center' }, tabs: { flexDirection: 'row', gap: 10, marginTop: 15 }, tab: { flex: 1, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 13, backgroundColor: 'white', borderWidth: 1, borderColor: colors.blue + '35' }, activeTab: { backgroundColor: colors.blue, borderColor: colors.blue }, summaryRow: { gap: 9, paddingVertical: 15 }, summaryCard: { width: 96, height: 68, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 13, backgroundColor: 'white', borderWidth: 1, borderColor: colors.blue + '25' }, summaryActive: { backgroundColor: colors.blue }, listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, countBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: colors.blue + '0D' }, loading: { minHeight: 250, alignItems: 'center', justifyContent: 'center' }, taskCard: { marginBottom: 14, padding: 15, borderRadius: 17, backgroundColor: 'white', borderWidth: 1, borderColor: '#E6E9F0', elevation: 3, shadowColor: '#17203A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8 }, cardTop: { flexDirection: 'row', alignItems: 'center', gap: 11 }, leadIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: colors.blue + '0D', alignItems: 'center', justifyContent: 'center' }, statusBadge: { minWidth: 62, maxWidth: 90, minHeight: 30, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: colors.blue + '0D', borderWidth: 1, borderColor: colors.blue + '22', alignItems: 'center', justifyContent: 'center' }, statusBadgeAction: { borderColor: colors.blue + '55' }, divider: { height: 1, marginVertical: 12, backgroundColor: '#E8EBF0' }, infoRow: { flexDirection: 'row', gap: 10 }, info: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 }, smallIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.blue + '0A', alignItems: 'center', justifyContent: 'center' }, descriptionBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 13, padding: 12, borderRadius: 12, backgroundColor: '#F8F9FC' }, empty: { minHeight: 250, alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 17, backgroundColor: 'white' }, emptyIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: colors.blue + '0D', alignItems: 'center', justifyContent: 'center' }, sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24 }, sheetBody: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 }, sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }, close: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }, filterLabel: { marginTop: 14, marginBottom: 7 }, dropdown: { height: 52, borderWidth: 1, borderColor: '#D8DEE9', borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#F8F9FC' }, placeholder: { color: '#7A8499', fontSize: 14, fontFamily: fonts.InterRegular }, selectedText: { color: '#202432', fontSize: 14, fontFamily: fonts.InterMedium }, dateField: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#D8DEE9', borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#F8F9FC' }, sheetActions: { flexDirection: 'row', gap: 12, marginTop: 24 }, clearButton: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: colors.blue, alignItems: 'center', justifyContent: 'center' }, applyButton: { flex: 1.5, height: 50, borderRadius: 12, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' } });

Object.assign(styles, {
  modalOverlay: { flex: 1, backgroundColor: 'rgba(18, 25, 42, 0.55)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  remarkModal: { width: '100%', maxWidth: 420, padding: 20, borderRadius: 20, backgroundColor: 'white', shadowColor: '#101828', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 20, elevation: 10 },
  remarkHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#E8EBF0' },
  remarkIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.blue + '0D', alignItems: 'center', justifyContent: 'center' },
  confirmText: { marginTop: 18 },
  remarkLabel: { marginTop: 18, marginBottom: 8 },
  remarkInput: { minHeight: 112, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#D8DEE9', borderRadius: 13, backgroundColor: '#F8F9FC', color: '#202432', fontSize: 14, fontFamily: fonts.InterRegular },
  characterCount: { marginTop: 5, textAlign: 'right' },
  remarkActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelRemarkButton: { flex: 1, height: 49, borderRadius: 12, borderWidth: 1, borderColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  confirmRemarkButton: { flex: 1, height: 49, borderRadius: 12, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
});

export default TaskList;
