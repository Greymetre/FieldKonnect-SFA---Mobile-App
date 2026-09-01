import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { createLeadOpportunityApi, deleteLeadOpportunityApi, getAllLeadOpportunitiesApi, getLeadOpportunityOptionsApi } from '../../api/query/LeadApi';
import AppText from '../../components/AppText/AppText';
import { colors } from '../../utils/Colors';
import { fonts } from '../../utils/typography';

const formatCurrency = (value: any) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const apiDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const displayDate = (date: Date) => date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const parseApiDate = (value: any) => {
  const parts = String(value || '').split('-');
  if (parts.length !== 3) return new Date();
  const date = parts[0].length === 4 ? new Date(+parts[0], +parts[1] - 1, +parts[2]) : new Date(+parts[2], +parts[1] - 1, +parts[0]);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};
const validationMessage = (error: any, fallback: string) => {
  const message = error?.response?.data?.message;
  if (typeof message === 'string') return message;
  if (message && typeof message === 'object') return Object.values(message).flat().join('\n');
  return fallback;
};

const OpportunityList = () => {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [counters, setCounters] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [status, setStatus] = useState<any>(-1);
  const [user, setUser] = useState<any>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ amount: '', confidence: '50', assignedTo: '' as any, contactId: '' as any, note: '', status: '' as any });
  const [closeDate, setCloseDate] = useState(new Date());
  const [contacts, setContacts] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchOpportunities = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAllLeadOpportunitiesApi({ pageSize: 100, status, user_id: user || -1 });
      const data = response?.data?.data || {};
      setOpportunities(data.opportunities || []);
      setCounters(data.counter || []);
      setUsers(data.users || []);
    } catch (requestError: any) {
      setError(validationMessage(requestError, 'Unable to load opportunities. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [status, user]);

  useFocusEffect(useCallback(() => { fetchOpportunities(); }, [fetchOpportunities]));

  const userOptions = useMemo(() => [{ label: 'All users', value: '' }, ...users.map(item => ({ label: item.name, value: item.id }))], [users]);
  const totalValue = opportunities.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const openEdit = async (item: any) => {
    setEditing(item);
    setForm({ amount: String(item.amount || ''), confidence: String(item.confidence ?? 50), assignedTo: item.assigned_to, contactId: item.lead_contact_id, note: item.note || '', status: item.status });
    setCloseDate(parseApiDate(item.estimated_close_date));
    setFormError('');
    try {
      setOptionsLoading(true);
      const response = await getLeadOpportunityOptionsApi(item.lead_id);
      const data = response?.data?.data || {};
      setContacts((data.contacts || []).map((contact: any) => ({ label: contact.name, value: contact.id })));
      setStatuses((data.opportunity_statuses || []).map((option: any) => ({ label: option.status_name, value: option.id })));
    } catch (requestError: any) {
      setFormError(validationMessage(requestError, 'Unable to load edit options.'));
    } finally {
      setOptionsLoading(false);
    }
  };

  const saveEdit = async () => {
    const amount = Number(form.amount);
    const confidence = Number(form.confidence);
    if (!amount || confidence < 0 || confidence > 100 || !form.assignedTo || !form.contactId || !form.note.trim() || !form.status) {
      setFormError('Complete all fields and enter confidence between 0 and 100.');
      return;
    }
    try {
      setSaving(true);
      setFormError('');
      const response = await createLeadOpportunityApi({ opportunity_id: editing.id, lead_id: editing.lead_id, amount, confidence, assigned_to: form.assignedTo, lead_contact_id: form.contactId, note: form.note.trim(), estimated_close_date: apiDate(closeDate), status: form.status });
      if (response?.data?.status !== 'success') throw new Error(response?.data?.message || 'Update failed');
      setEditing(null);
      await fetchOpportunities();
      Alert.alert('Opportunity Updated', 'The opportunity details were saved successfully.');
    } catch (requestError: any) {
      setFormError(validationMessage(requestError, requestError?.message || 'Unable to update opportunity.'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (item: any) => Alert.alert('Delete Opportunity?', `This will permanently delete the opportunity for ${item?.lead_contact?.name || item?.lead?.company_name || 'this lead'}.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try {
        setDeletingId(item.id);
        const response = await deleteLeadOpportunityApi(item.id);
        if (response?.data?.status !== 'success') throw new Error(response?.data?.message || 'Delete failed');
        await fetchOpportunities();
      } catch (requestError: any) {
        Alert.alert('Delete Failed', validationMessage(requestError, requestError?.message || 'Unable to delete opportunity.'));
      } finally { setDeletingId(null); }
    } },
  ]);

  return <View style={styles.container}>
    <View style={styles.content}>
      <ScrollView horizontal style={styles.summaryScroll} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryRow}>
        {counters.map(item => {
          const active = String(status) === String(item.status_id);
          return <Pressable key={item.status_id} style={[styles.summaryCard, active && styles.summaryCardActive]} onPress={() => setStatus(item.status_id)}><AppText size={22} color={active ? 'white' : colors.blue} family="InterBold">{item.total_opportunities || 0}</AppText><AppText size={13} color={active ? 'white' : '#596276'} family="InterSemiBold">{item.status_name}</AppText></Pressable>;
        })}
      </ScrollView>
      <View style={styles.filterCard}><View style={styles.filterTitle}><View style={styles.filterIcon}><Icon type="user" size={18} /></View><AppText size={14} color="#283044" family="InterBold">Opportunity owner</AppText></View><Dropdown style={styles.dropdown} data={userOptions} labelField="label" valueField="value" value={user} onChange={item => setUser(item.value)} placeholder="Select user" placeholderStyle={styles.placeholder} selectedTextStyle={styles.selectedText} maxHeight={260} /></View>
      <View style={[styles.resultOverview, styles.resultOverviewInitial]}><View style={[styles.overviewMetric, styles.overviewMetricInitial]}><AppText size={12} color="#8A92A3" family="InterSemiBold" align="center">OPPORTUNITIES</AppText><AppText size={21} color="#202432" family="InterBold" align="center">{opportunities.length}</AppText></View><View style={[styles.overviewDivider, styles.overviewDividerInitial]} /><View style={[styles.overviewMetric, styles.overviewMetricInitial]}><AppText size={12} color="#8A92A3" family="InterSemiBold" align="center">TOTAL VALUE</AppText><AppText size={21} color={colors.blue} family="InterBold" align="center">{formatCurrency(totalValue)}</AppText></View></View>
      <View style={styles.listTitle}><AppText size={17} color="#202432" family="InterBold">Opportunity</AppText></View>
      <ScrollView style={styles.opportunityScroll} contentContainerStyle={styles.opportunityScrollContent} showsVerticalScrollIndicator={false}>
        {loading ? <View style={styles.state}><ActivityIndicator size="large" color={colors.blue} /><AppText size={13} color="#7B8496" family="InterMedium">Loading opportunities...</AppText></View> : error ? <View style={styles.state}><Icon type="opportunity" size={30} /><AppText size={14} color="#C43D36" family="InterMedium" align="center">{error}</AppText><Pressable style={styles.retry} onPress={fetchOpportunities}><AppText size={13} color="white" family="InterBold">Try Again</AppText></Pressable></View> : opportunities.length ? opportunities.map(item => <OpportunityCard key={item.id} item={item} accent={colors.blue} deleting={deletingId === item.id} onEdit={() => openEdit(item)} onDelete={() => confirmDelete(item)} />) : <View style={styles.state}><Icon type="opportunity" size={30} /><AppText size={16} color="#30384A" family="InterBold">No opportunities found</AppText><AppText size={13} color="#8A92A3" family="InterRegular">Try another status or assigned user.</AppText></View>}
      </ScrollView>
    </View>

    <Modal visible={Boolean(editing)} transparent animationType="fade" statusBarTranslucent onRequestClose={() => !saving && setEditing(null)}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={styles.modal}>
        <View style={styles.modalHeader}><View style={styles.titleIcon}><Icon type="edit" color="white" /></View><View style={{ flex: 1 }}><AppText size={19} color="#202432" family="InterBold">Edit Opportunity</AppText><AppText size={12} color="#858DA0" family="InterRegular">Update value and closure details</AppText></View><Pressable style={styles.close} disabled={saving} onPress={() => setEditing(null)}><Icon type="close" size={18} /></Pressable></View>
        <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
          <Label text="Amount" /><TextInput style={styles.input} value={form.amount} keyboardType="decimal-pad" onChangeText={amount => setForm(current => ({ ...current, amount: amount.replace(/[^0-9.]/g, '') }))} placeholder="Opportunity amount" placeholderTextColor="#A2A9B7" />
          <Label text="Confidence (%)" /><TextInput style={styles.input} value={form.confidence} keyboardType="number-pad" maxLength={3} onChangeText={confidence => setForm(current => ({ ...current, confidence: confidence.replace(/[^0-9]/g, '') }))} placeholder="0 - 100" placeholderTextColor="#A2A9B7" />
          <Label text="Assign To" /><Dropdown style={styles.dropdown} data={userOptions.filter(item => item.value !== '')} labelField="label" valueField="value" value={form.assignedTo} onChange={item => setForm(current => ({ ...current, assignedTo: item.value }))} placeholder={optionsLoading ? 'Loading...' : 'Select user'} placeholderStyle={styles.placeholder} selectedTextStyle={styles.selectedText} disable={optionsLoading} />
          <Label text="Lead Contact" /><Dropdown style={styles.dropdown} data={contacts} labelField="label" valueField="value" value={form.contactId} onChange={item => setForm(current => ({ ...current, contactId: item.value }))} placeholder={optionsLoading ? 'Loading...' : 'Select contact'} placeholderStyle={styles.placeholder} selectedTextStyle={styles.selectedText} disable={optionsLoading} />
          <Label text="Note" /><TextInput style={styles.noteInput} value={form.note} multiline textAlignVertical="top" onChangeText={note => setForm(current => ({ ...current, note: note.slice(0, 1000) }))} placeholder="Opportunity details" placeholderTextColor="#A2A9B7" />
          <Label text="Estimated Close Date" /><Pressable style={styles.dateField} onPress={() => setShowDatePicker(true)}><AppText size={14} color="#30384A" family="InterSemiBold">{displayDate(closeDate)}</AppText><Icon type="calendar" size={18} /></Pressable>
          {showDatePicker && <DateTimePicker value={closeDate} mode="date" minimumDate={new Date()} onChange={(_, value) => { setShowDatePicker(false); if (value) setCloseDate(value); }} />}
          <Label text="Status" /><Dropdown dropdownPosition="top" style={styles.dropdown} data={statuses} labelField="label" valueField="value" value={form.status} onChange={item => setForm(current => ({ ...current, status: item.value }))} placeholder={optionsLoading ? 'Loading...' : 'Select status'} placeholderStyle={styles.placeholder} selectedTextStyle={styles.selectedText} disable={optionsLoading} />
          {formError ? <AppText size={12} color="#C43D36" family="InterMedium" style={{ marginTop: 10 }}>{formError}</AppText> : null}
          <View style={styles.actions}><Pressable style={styles.cancel} disabled={saving} onPress={() => setEditing(null)}><AppText size={14} color={colors.blue} family="InterBold">Cancel</AppText></Pressable><Pressable style={styles.save} disabled={saving || optionsLoading} onPress={saveEdit}>{saving ? <ActivityIndicator color="white" /> : <Icon type="save" color="white" size={18} />}<AppText size={14} color="white" family="InterBold">{saving ? 'Saving...' : 'Save Changes'}</AppText></Pressable></View>
        </ScrollView>
      </View></KeyboardAvoidingView>
    </Modal>
  </View>;
};

const OpportunityCard = ({ item, accent, deleting, onEdit, onDelete }: any) => <View style={styles.card}>
  <View style={styles.cardTop}><View style={styles.avatar}><AppText size={20} color="white" family="InterBold">{(item?.lead_contact?.name || item?.lead?.company_name || 'O').charAt(0)}</AppText></View><View style={{ flex: 1, minWidth: 0 }}><AppText size={16} color="#202432" family="InterBold" numLines={1}>{item?.lead_contact?.name || 'Unnamed contact'}</AppText><AppText size={13} color="#737C8F" family="InterMedium" numLines={1} style={{ marginTop: 3 }}>{item?.lead?.company_name || 'Unnamed lead'}</AppText></View><Pressable accessibilityLabel="Edit opportunity" style={styles.iconButton} onPress={onEdit}><Icon type="edit" size={18} /></Pressable><Pressable accessibilityLabel="Delete opportunity" style={[styles.iconButton, styles.deleteButton]} disabled={deleting} onPress={onDelete}>{deleting ? <ActivityIndicator size="small" color="#D64545" /> : <Icon type="delete" color="#D64545" size={18} />}</Pressable></View>
  <View style={styles.noteBox}><Icon type="note" size={17} /><AppText size={13} color="#515A6D" family="InterRegular" style={{ flex: 1 }}>{item.note || 'No note added'}</AppText></View>
  <View style={styles.cardMetrics}><View style={styles.amountBlock}><AppText size={11} color="#8A92A3" family="InterSemiBold">VALUE</AppText><AppText size={19} color={colors.blue} family="InterBold">{formatCurrency(item.amount)}</AppText></View><View style={[styles.confidenceRing, { borderColor: accent + '70' }]}><AppText size={13} color={accent} family="InterBold">{item.confidence}%</AppText></View><View style={{ flex: 1 }}><AppText size={11} color="#8A92A3" family="InterSemiBold">EXPECTED CLOSE</AppText><View style={styles.inline}><Icon type="calendar" size={15} /><AppText size={13} color="#40495C" family="InterSemiBold">{item.estimated_close_date}</AppText></View></View></View>
  <View style={styles.cardFooter}><View style={[styles.statusBadge, { backgroundColor: accent + '14' }]}><AppText size={11} color={accent} family="InterBold">{item?.status_is?.status_name || 'Status'}</AppText></View><View style={styles.inline}><Icon type="user" size={15} /><AppText size={12} color="#717A8D" family="InterRegular">Assigned to </AppText><AppText size={12} color="#40495C" family="InterSemiBold">{item?.assign_user?.name || 'Unassigned'}</AppText></View></View>
</View>;

const Label = ({ text }: any) => <AppText size={13} color="#4F586D" family="InterSemiBold" style={styles.label}>{text} *</AppText>;
const Icon = ({ type, size = 20, color = colors.blue }: any) => { const line = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }; const icons: Record<string, React.ReactNode> = { user: <><Circle cx="12" cy="8" r="4" {...line} /><Path d="M4 21c.6-5 3-7 8-7s7.4 2 8 7" {...line} /></>, opportunity: <><Circle cx="12" cy="9" r="5" {...line} /><Path d="M9 15h6m-5 3h4m-2-14V2" {...line} /></>, note: <><Path d="M4 3h16v14l-4 4H4V3z" {...line} /><Path d="M16 21v-4h4M8 8h8m-8 4h6" {...line} /></>, calendar: <><Rect x="3" y="5" width="18" height="16" rx="2" {...line} /><Path d="M7 3v4m10-4v4M3 10h18" {...line} /></>, edit: <><Path d="M4 20h4L19 9l-4-4L4 16v4z" {...line} /><Path d="M13 7l4 4" {...line} /></>, delete: <><Path d="M4 7h16M9 7V4h6v3m-9 0l1 14h10l1-14M10 11v6m4-6v6" {...line} /></>, close: <Path d="M6 6l12 12M18 6L6 18" {...line} />, save: <><Path d="M4 3h14l2 2v16H4V3z" {...line} /><Path d="M8 3v6h8V3M8 21v-7h8v7" {...line} /></> }; return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">{icons[type]}</Svg>; };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' }, content: { flex: 1, padding: 16, paddingBottom: 0 }, summaryScroll: { flexGrow: 0, height: 97 }, summaryRow: { gap: 10, paddingBottom: 15 }, summaryCard: { width: 118, height: 82, alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 16, backgroundColor: 'white', borderWidth: 1, borderColor: colors.blue + '35', elevation: 2 }, summaryCardActive: { backgroundColor: colors.blue, borderColor: colors.blue }, filterCard: { padding: 15, borderRadius: 17, backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E8EF' }, filterTitle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }, filterIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue + '0D' }, dropdown: { height: 50, paddingHorizontal: 13, borderRadius: 12, borderWidth: 1, borderColor: '#D8DEE9', backgroundColor: '#F8F9FC' }, placeholder: { color: '#8A92A3', fontSize: 14, fontFamily: fonts.InterRegular }, selectedText: { color: '#30384A', fontSize: 14, fontFamily: fonts.InterSemiBold }, resultOverview: { minHeight: 104, flexDirection: 'row', alignItems: 'center', marginVertical: 14, paddingHorizontal: 12, borderRadius: 18, backgroundColor: colors.blue, elevation: 4, shadowColor: colors.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 9 }, overviewMetric: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }, overviewIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' }, overviewDivider: { width: 1, height: 54, backgroundColor: 'rgba(255,255,255,0.24)' }, listTitle: { marginBottom: 12 }, opportunityScroll: { flex: 1 }, opportunityScrollContent: { paddingBottom: 30 }, state: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 18, backgroundColor: 'white', padding: 24 }, retry: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.blue }, card: { marginBottom: 13, padding: 15, borderRadius: 18, backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E8EF', elevation: 3 }, cardTop: { flexDirection: 'row', alignItems: 'center', gap: 9 }, avatar: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' }, iconButton: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue + '0D', borderWidth: 1, borderColor: colors.blue + '20' }, deleteButton: { backgroundColor: '#D645450D', borderColor: '#D6454528' }, noteBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 13, padding: 10, borderRadius: 11, backgroundColor: '#F7F8FB' }, cardMetrics: { flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E8EBF1' }, amountBlock: { minWidth: 100 }, confidenceRing: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FB', borderWidth: 3 }, inline: { flexDirection: 'row', alignItems: 'center', gap: 5 }, cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 13, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#EDF0F4' }, statusBadge: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 9 }, backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18, backgroundColor: 'rgba(20,27,43,0.56)' }, modal: { width: '100%', maxWidth: 540, maxHeight: '92%', overflow: 'hidden', borderRadius: 22, backgroundColor: '#F8F9FC' }, modalHeader: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E8EBF1' }, titleIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' }, close: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue + '0D' }, modalBody: { padding: 18, paddingBottom: 24 }, label: { marginTop: 13, marginBottom: 7 }, input: { height: 50, paddingHorizontal: 13, borderRadius: 12, borderWidth: 1, borderColor: '#D8DEE9', backgroundColor: 'white', color: '#30384A', fontFamily: fonts.InterMedium }, noteInput: { minHeight: 82, padding: 13, borderRadius: 12, borderWidth: 1, borderColor: '#D8DEE9', backgroundColor: 'white', color: '#30384A', fontFamily: fonts.InterMedium }, dateField: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 13, borderRadius: 12, borderWidth: 1, borderColor: '#D8DEE9', backgroundColor: 'white' }, actions: { flexDirection: 'row', gap: 11, marginTop: 20 }, cancel: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: colors.blue, alignItems: 'center', justifyContent: 'center' }, save: { flex: 1.5, height: 50, flexDirection: 'row', gap: 7, borderRadius: 12, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  resultOverviewInitial: { minHeight: 82, gap: 0, paddingHorizontal: 0, borderRadius: 17, backgroundColor: colors.blue + '0A', borderWidth: 1, borderColor: colors.blue + '20', elevation: 0, shadowOpacity: 0 },
  overviewMetricInitial: { flex: 1, flexBasis: 0, flexDirection: 'column', gap: 0, paddingHorizontal: 10 },
  overviewDividerInitial: { height: 42, backgroundColor: colors.blue + '25' },
});
export default OpportunityList;
