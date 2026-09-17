import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Dropdown } from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { addLeadNoteApi, checkInLeadApi, checkOutLeadApi, createLeadOpportunityApi, createLeadTaskApi, getLeadCheckinsApi, getLeadDetailsApi, getLeadOpportunityOptionsApi, getLeadTaskDropdownsApi } from '../../api/query/LeadApi';
import useLocationHook from '../../api/hooks/uselocationhook';
import AppText from '../../components/AppText/AppText';
import IosPickerOverlay from '../../components/DatePicker/IosPickerOverlay';
import LeadActivityModal from './LeadActivityModal';
import { colors } from '../../utils/Colors';
import { fonts } from '../../utils/typography';
import { composeEmail } from '../../utils/composeEmail';

const mapLeadData = (lead: any) => ({
  id: lead?.id,
  firm: lead?.company_name || lead?.name || '',
  customer: lead?.contact_name || lead?.contact?.name || '',
  phone: lead?.phone_number || lead?.contact?.phone_number || '',
  email: lead?.email || lead?.contact?.email || '',
  address: lead?.address || lead?.location_address || '',
  pin: lead?.pincode || '',
  type: lead?.status?.display_name || lead?.status || 'Pending',
  source: lead?.lead_source || lead?.lead_source_lead || '',
  note: lead?.note || '',
  generated: lead?.lead_generation_date || lead?.created_at || '',
  lastAction: lead?.updated_at || '',
  converted: lead?.conversion_date || '',
  website: lead?.website || lead?.contact?.url || '',
  assignTo: lead?.assign_user_id || '',
  statusId: lead?.status_id ?? lead?.status?.id ?? 0,
  pincodeId: lead?.pincode_id || '',
  city: lead?.city || '',
  cityId: lead?.city_id || '',
  state: lead?.state || '',
  stateId: lead?.state_id || '',
  district: lead?.district || '',
  districtId: lead?.district_id || '',
  assignUserName: lead?.assign_user_name || '',
  designation: lead?.designation || lead?.contact?.title || '',
  alternateNumber: lead?.alternate_number || '',
  revenue: lead?.revenue_rs_cr ?? '',
  address1: lead?.address1 || '',
  address2: lead?.address2 || '',
  otherDetails: Array.isArray(lead?.other_details) ? lead.other_details : [],
  contacts: Array.isArray(lead?.contacts) ? lead.contacts : [],
  files: Array.isArray(lead?.files) ? lead.files : [],
});

const shown = (value: any, placeholder = 'Not available') => String(value || '').trim() || placeholder;
const fieldValue = (value: any) => {
  const text = String(value ?? '').trim();
  return text && text.toUpperCase() !== 'N/A' ? text : '';
};
const formatFileSize = (bytes: any) => `${(Number(bytes || 0) / 1024).toFixed(1)} KB`;

const formatTaskDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const displayTaskDate = (date: Date) => date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const formatTaskTime = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
const displayTaskTime = (date: Date) => date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const LeadDetails = ({ route, navigation }: any) => {
  const selectedLead = route?.params?.lead;
  const [data, setData] = useState(() => mapLeadData(selectedLead));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showActivity, setShowActivity] = useState(false);
  const [activity, setActivity] = useState<any[]>([]);
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteError, setNoteError] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkinId, setCheckinId] = useState<number | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutSummary, setCheckoutSummary] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const [taskForm, setTaskForm] = useState({ assignedTo: '' as any, description: '', priority: '' });
  const [taskDate, setTaskDate] = useState(new Date());
  const [taskTime, setTaskTime] = useState(new Date());
  const [taskUsers, setTaskUsers] = useState<any[]>([]);
  const [taskPriorities, setTaskPriorities] = useState<any[]>([]);
  const [taskOptionsLoading, setTaskOptionsLoading] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [taskError, setTaskError] = useState('');
  const [showTaskDatePicker, setShowTaskDatePicker] = useState(false);
  const [showTaskTimePicker, setShowTaskTimePicker] = useState(false);
  const [taskPickerMode, setTaskPickerMode] = useState<'date' | 'time' | null>(null);
  const [taskPickerValue, setTaskPickerValue] = useState(new Date());
  const [showOpportunity, setShowOpportunity] = useState(false);
  const [opportunityForm, setOpportunityForm] = useState({ amount: '', confidence: 50, assignedTo: '' as any, contactId: '' as any, note: '', status: '' as any });
  const [opportunityDate, setOpportunityDate] = useState(new Date());
  const [opportunityUsers, setOpportunityUsers] = useState<any[]>([]);
  const [opportunityContacts, setOpportunityContacts] = useState<any[]>([]);
  const [opportunityStatuses, setOpportunityStatuses] = useState<any[]>([]);
  const [opportunityOptionsLoading, setOpportunityOptionsLoading] = useState(false);
  const [savingOpportunity, setSavingOpportunity] = useState(false);
  const [opportunityError, setOpportunityError] = useState('');
  const [showOpportunityDatePicker, setShowOpportunityDatePicker] = useState(false);
  const { coords, loading: locationLoading, error: locationError, refreshLocation } = useLocationHook();

  const fetchDetails = useCallback(async () => {
    if (!selectedLead?.id) {
      setError('Lead information is unavailable.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const [response, checkinResponse] = await Promise.all([
        getLeadDetailsApi(selectedLead.id),
        getLeadCheckinsApi().catch(() => null),
      ]);
      setData(mapLeadData(response?.data?.data || selectedLead));
      setActivity(response?.data?.notes_tasks || []);
      const checkins = checkinResponse?.data?.data || [];
      const fallbackActiveCheckin = Array.isArray(checkins) ? checkins.find((item: any) => String(item?.lead_id) === String(selectedLead.id) && (!item?.checkout_date || item.checkout_date === '0000-00-00')) : null;
      setCheckinId(response?.data?.data?.active_checkin_id || fallbackActiveCheckin?.checkin_id || null);
    } catch (requestError: any) {
      console.log('Lead details error:', requestError?.response || requestError);
      setError('Unable to load the latest lead details.');
    } finally {
      setLoading(false);
    }
  }, [selectedLead]);

  useFocusEffect(useCallback(() => {
    fetchDetails();
  }, [fetchDetails]));

  const initial = (data.customer || data.firm || 'L').charAt(0).toUpperCase();

  const submitNote = async () => {
    const note = noteText.trim();
    if (!note) {
      setNoteError('Please enter a note before submitting.');
      return;
    }
    try {
      setSubmittingNote(true);
      setNoteError('');
      await addLeadNoteApi(selectedLead.id, note);
      await fetchDetails();
      setNoteText('');
      setShowNote(false);
    } catch (requestError: any) {
      const message = requestError?.response?.data?.message;
      setNoteError(typeof message === 'string' ? message : 'Unable to add note. Please try again.');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleCheckIn = async () => {
    if (checkingIn || checkinId) return;
    if (!coords) {
      Alert.alert(
        'Location required',
        locationLoading ? 'Your current location is still being detected. Please try again in a moment.' : locationError || 'Unable to get your current location.',
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Retry', onPress: refreshLocation }],
      );
      return;
    }
    try {
      setCheckingIn(true);
      const response = await checkInLeadApi({ lead_id: selectedLead.id, checkin_latitude: coords.latitude, checkin_longitude: coords.longitude });
      const id = response?.data?.checkin_id;
      if (response?.data?.status !== 'success' || !id) throw new Error(response?.data?.message || 'Check-in failed');
      setCheckinId(id);
      Alert.alert('Check In Successful', 'You are now checked in for this lead.');
    } catch (requestError: any) {
      const apiMessage = requestError?.response?.data?.message;
      const existingCheckinId = requestError?.response?.data?.checkin_id;
      if (existingCheckinId) setCheckinId(existingCheckinId);
      const message = typeof apiMessage === 'string' ? apiMessage : requestError?.message || 'Unable to check in. Please try again.';
      Alert.alert('Check In Failed', message);
    } finally {
      setCheckingIn(false);
    }
  };

  const openCheckout = () => {
    if (!checkinId) {
      Alert.alert('Check In Required', 'Please check in to this lead before checking out.');
      return;
    }
    setCheckoutSummary('');
    setCheckoutError('');
    refreshLocation();
    setShowCheckout(true);
  };

  const handleCheckOut = async () => {
    const description = checkoutSummary.trim();
    if (!description) {
      setCheckoutError('Please enter a checkout summary.');
      return;
    }
    if (locationLoading || !coords) {
      setCheckoutError(locationLoading ? 'Your current checkout location is still being detected.' : locationError || 'Current location is required to check out.');
      refreshLocation();
      return;
    }
    if (!checkinId) {
      setCheckoutError('No active check-in was found for this lead.');
      return;
    }
    try {
      setCheckingOut(true);
      setCheckoutError('');
      const response = await checkOutLeadApi({ checkin_id: checkinId, lead_id: selectedLead.id, checkout_latitude: coords.latitude, checkout_longitude: coords.longitude, description });
      if (response?.data?.status !== 'success') throw new Error(response?.data?.message || 'Checkout failed');
      setCheckinId(null);
      setCheckoutSummary('');
      setShowCheckout(false);
      await fetchDetails();
      Alert.alert('Check Out Successful', 'Your visit summary has been saved to lead activity.');
    } catch (requestError: any) {
      const apiMessage = requestError?.response?.data?.message;
      setCheckoutError(typeof apiMessage === 'string' ? apiMessage : requestError?.message || 'Unable to check out. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  const openTaskModal = async () => {
    const now = new Date();
    setTaskForm({ assignedTo: '', description: '', priority: '' });
    setTaskDate(now);
    setTaskTime(now);
    setTaskError('');
    setShowTask(true);
    try {
      setTaskOptionsLoading(true);
      const response = await getLeadTaskDropdownsApi();
      const options = response?.data?.data || {};
      setTaskUsers((options.users || []).map((item: any) => ({ label: item.name, value: item.id })));
      setTaskPriorities((options.priorities || []).map((item: any) => ({ label: item.name, value: item.id })));
    } catch {
      setTaskError('Unable to load task options. Please try again.');
    } finally {
      setTaskOptionsLoading(false);
    }
  };

  const openTaskPicker = (mode: 'date' | 'time') => {
    if (Platform.OS === 'ios') {
      setTaskPickerValue(mode === 'date' ? taskDate : taskTime);
      setTaskPickerMode(mode);
    } else if (mode === 'date') {
      setShowTaskDatePicker(true);
    } else {
      setShowTaskTimePicker(true);
    }
  };

  const applyTaskPicker = (value: Date) => {
    if (taskPickerMode === 'date') setTaskDate(value);
    if (taskPickerMode === 'time') setTaskTime(value);
    setTaskPickerMode(null);
  };

  const saveTask = async () => {
    if (!taskForm.assignedTo || !taskForm.description.trim() || !taskForm.priority) {
      setTaskError('Assigned user, description and priority are required.');
      return;
    }
    try {
      setSavingTask(true);
      setTaskError('');
      await createLeadTaskApi({ lead_id: selectedLead.id, assigned_to: taskForm.assignedTo, description: taskForm.description.trim(), priority: taskForm.priority, date: formatTaskDate(taskDate), time: formatTaskTime(taskTime) });
      setShowTask(false);
      await fetchDetails();
      Alert.alert('Task Created', 'The task was assigned successfully and added to Lead Activity.');
    } catch (requestError: any) {
      const apiMessage = requestError?.response?.data?.message;
      setTaskError(typeof apiMessage === 'string' ? apiMessage : 'Unable to create task. Please try again.');
    } finally {
      setSavingTask(false);
    }
  };

  const openOpportunityModal = async () => {
    setOpportunityForm({ amount: '', confidence: 50, assignedTo: '', contactId: '', note: '', status: '' });
    setOpportunityDate(new Date());
    setOpportunityError('');
    setShowOpportunity(true);
    try {
      setOpportunityOptionsLoading(true);
      const [opportunityResponse, taskResponse] = await Promise.all([
        getLeadOpportunityOptionsApi(selectedLead.id),
        getLeadTaskDropdownsApi(),
      ]);
      const options = opportunityResponse?.data?.data || {};
      const users = taskResponse?.data?.data?.users || [];
      setOpportunityContacts((options.contacts || []).map((item: any) => ({ label: item.name, value: item.id })));
      setOpportunityStatuses((options.opportunity_statuses || []).map((item: any) => ({ label: item.status_name, value: item.id })));
      setOpportunityUsers(users.map((item: any) => ({ label: item.name, value: item.id })));
    } catch {
      setOpportunityError('Unable to load opportunity options. Please try again.');
    } finally {
      setOpportunityOptionsLoading(false);
    }
  };

  const saveOpportunity = async () => {
    const amount = Number(opportunityForm.amount);
    if (!opportunityForm.amount || !Number.isFinite(amount) || amount <= 0 || !opportunityForm.assignedTo || !opportunityForm.contactId || !opportunityForm.note.trim() || !opportunityForm.status) {
      setOpportunityError('Amount, assigned user, contact, note and status are required.');
      return;
    }
    try {
      setSavingOpportunity(true);
      setOpportunityError('');
      const response = await createLeadOpportunityApi({
        lead_id: selectedLead.id,
        amount,
        confidence: opportunityForm.confidence,
        assigned_to: opportunityForm.assignedTo,
        lead_contact_id: opportunityForm.contactId,
        note: opportunityForm.note.trim(),
        estimated_close_date: formatTaskDate(opportunityDate),
        status: opportunityForm.status,
      });
      if (response?.data?.status !== 'success') throw new Error(response?.data?.message || 'Unable to create opportunity.');
      setShowOpportunity(false);
      await fetchDetails();
      Alert.alert('Opportunity Created', 'The opportunity was created successfully and added to lead activity.');
    } catch (requestError: any) {
      const apiMessage = requestError?.response?.data?.message;
      const message = typeof apiMessage === 'string' ? apiMessage : apiMessage && typeof apiMessage === 'object' ? Object.values(apiMessage).flat().join('\n') : requestError?.message;
      setOpportunityError(message || 'Unable to create opportunity. Please try again.');
    } finally {
      setSavingOpportunity(false);
    }
  };

  if (loading && !data.firm) {
    return <View style={styles.stateContainer}><ActivityIndicator size="large" color={colors.blue} /><AppText size={14} color="#687086" family="InterMedium">Loading lead details...</AppText></View>;
  }

  if (error && !data.firm) {
    return <View style={styles.stateContainer}><AppText size={15} color="#687086" family="InterMedium" align="center">{error}</AppText><Pressable style={styles.retryButton} onPress={fetchDetails}><AppText size={14} color="white" family="InterBold">Try Again</AppText></Pressable></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.profileCard}>
        <View style={styles.profileTopRow}>
          <View style={styles.avatar}><AppText size={34} color="white" family="InterBold">{initial}</AppText></View>
          <View style={styles.profileText}>
            <AppText size={21} color="white" family="InterBold" numLines={1}>{shown(data.customer, 'Unnamed contact')}</AppText>
            <AppText size={15} color="white" family="InterMedium" opacity={0.82} numLines={1}>{shown(data.firm, 'Unnamed firm')}</AppText>
            <View style={styles.statusChip}><AppText size={12} color="white" family="InterBold">{data.type}</AppText></View>
          </View>
          <Pressable style={styles.editButton} onPress={() => navigation.navigate('EditLead', { lead: data })}>
            <DetailIcon type="edit" size={18} color="white" />
            <AppText size={14} color="white" family="InterBold">Edit</AppText>
          </Pressable>
        </View>
        <View style={styles.profileFooter}>
          <View><AppText size={11} color="white" family="InterSemiBold" opacity={0.65}>SOURCE</AppText><AppText size={14} color="white" family="InterBold">{shown(data.source, 'Not set')}</AppText></View>
          <View style={styles.profileFooterDivider} />
          <View><AppText size={11} color="white" family="InterSemiBold" opacity={0.65}>CREATED</AppText><AppText size={14} color="white" family="InterBold">{shown(data.generated, 'Not set')}</AppText></View>
        </View>
      </View>

      <Section title="Lead Details">
        <FieldGrid fields={[
          { label: 'Lead Type', value: data.type },
          { label: 'Firm Name', value: data.firm },
          { label: 'Lead Source', value: data.source },
          { label: 'Assigned To', value: data.assignUserName },
          { label: 'Website', value: data.website, onPress: data.website ? () => Linking.openURL(/^https?:\/\//i.test(data.website) ? data.website : `https://${data.website}`) : undefined },
          { label: 'Lead Generation Date', value: data.generated },
          { label: 'Revenue (Rs Cr)', value: data.revenue },
        ]} />
      </Section>

      <Section title="Contact Details">
        <FieldGrid fields={[
          { label: 'Customer Name', value: data.customer },
          { label: 'Designation', value: data.designation },
          { label: 'Mobile Number', value: data.phone, onPress: data.phone ? () => Linking.openURL(`tel:${data.phone}`) : undefined },
          { label: 'Alternate Number', value: data.alternateNumber, onPress: data.alternateNumber ? () => Linking.openURL(`tel:${data.alternateNumber}`) : undefined },
          { label: 'Email Id', value: data.email, onPress: data.email ? () => composeEmail(data.email) : undefined },
        ]} />
      </Section>

      <Section title="Address Details">
        <FieldGrid fields={[
          { label: 'Address', value: data.address1, fullWidth: true },
          { label: 'Place', value: data.address2 },
          { label: 'State', value: data.state },
          { label: 'District', value: data.district },
          { label: 'City', value: data.city },
          { label: 'Pincode', value: data.pin },
        ]} />
      </Section>

      <Section title="Other Details">
        <FieldGrid fields={data.otherDetails.map((item: any) => ({ label: item?.label, value: item?.value }))} />
      </Section>

      <Section title="Note">
        <View style={styles.noteBox}>
          <DetailIcon type="note" />
          <AppText size={14} color={data.note ? '#4F586D' : '#A7ADBA'} family="InterRegular" style={styles.noteText}>{shown(data.note, 'No note added')}</AppText>
        </View>
      </Section>

      {data.contacts.length > 0 && (
        <Section title={`Contacts (${data.contacts.length})`}>
          {data.contacts.map((contact: any, index: number) => (
            <View key={contact?.id ?? index}>
              {index > 0 && <View style={styles.listDivider} />}
              <AppText size={15} color="#30384A" family="InterBold">{shown(contact?.name, 'Unnamed contact')}</AppText>
              {!!fieldValue(contact?.title) && <AppText size={13} color="#8991A3" family="InterMedium" style={styles.contactMeta}>{contact.title}</AppText>}
              {!!fieldValue(contact?.phone_number) && (
                <Pressable style={styles.contactLink} onPress={() => Linking.openURL(`tel:${contact.phone_number}`)}>
                  <DetailIcon type="phone" size={16} />
                  <AppText size={14} color={colors.blue} family="InterMedium">{contact.phone_number}</AppText>
                </Pressable>
              )}
              {!!fieldValue(contact?.email) && (
                <Pressable style={styles.contactLink} onPress={() => composeEmail(contact.email)}>
                  <DetailIcon type="email" size={16} />
                  <AppText size={14} color={colors.blue} family="InterMedium">{contact.email}</AppText>
                </Pressable>
              )}
            </View>
          ))}
        </Section>
      )}

      <Section title="Files">
        {data.files.length ? data.files.map((file: any, index: number) => (
          <View key={file?.id ?? index}>
            {index > 0 && <View style={styles.listDivider} />}
            <Pressable style={styles.fileRow} onPress={() => file?.url && Linking.openURL(file.url)}>
              <View style={styles.detailIcon}><DetailIcon type="note" size={18} /></View>
              <View style={styles.detailText}>
                <AppText size={14} color="#30384A" family="InterSemiBold" numLines={1}>{shown(file?.file_name, 'File')}</AppText>
                <AppText size={12} color="#8991A3" family="InterRegular" style={styles.contactMeta}>{`${String(file?.mime_type || '').toUpperCase()} • ${formatFileSize(file?.size)}`}</AppText>
              </View>
            </Pressable>
          </View>
        )) : <AppText size={14} color="#A7ADBA" family="InterRegular">No files uploaded</AppText>}
      </Section>

      <View style={styles.primaryActions}>
        <Pressable style={[styles.primaryAction, (checkingIn || checkinId) && styles.primaryActionDisabled]} onPress={handleCheckIn} disabled={checkingIn || Boolean(checkinId)}>
          {checkingIn ? <ActivityIndicator size="small" color={colors.blue} /> : <DetailIcon type="checkin" />}
          <AppText size={15} color={colors.blue} family="InterBold">{checkingIn ? 'Checking In...' : checkinId ? 'Checked In' : 'Check In'}</AppText>
        </Pressable>
        <Pressable style={[styles.primaryAction, !checkinId && styles.primaryActionDisabled]} onPress={openCheckout} disabled={!checkinId}>
          <DetailIcon type="checkout" /><AppText size={15} color={colors.blue} family="InterBold">Check Out</AppText>
        </Pressable>
      </View>

      <Section title="Lead Actions">
        <View style={styles.actionGrid}>
          <ActionTile icon="activity" label="Activity" onPress={() => setShowActivity(true)} />
          <ActionTile icon="note" label="Note" onPress={() => { setNoteText(''); setNoteError(''); setShowNote(true); }} />
          <ActionTile icon="task" label="Task" onPress={openTaskModal} />
          <ActionTile icon="opportunity" label="Opportunity" onPress={openOpportunityModal} />
        </View>
      </Section>

      <View style={styles.timelineRow}>
        <TimelineCard label="Lead Generated" value={shown(data.generated, 'N/A')} placeholder={!data.generated} />
        <TimelineCard label="Last Action" value={shown(data.lastAction, 'N/A')} placeholder={!data.lastAction} />
        <TimelineCard label="Converted" value={shown(data.converted, 'N/A')} placeholder={!data.converted} />
      </View>

      <LeadActivityModal visible={showActivity} onClose={() => setShowActivity(false)} activity={activity} navigation={navigation} />

      <Modal visible={showNote} transparent animationType="fade" statusBarTranslucent onRequestClose={() => !submittingNote && setShowNote(false)}>
        <KeyboardAvoidingView style={styles.noteModalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.noteModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleIcon}><DetailIcon type="note" color="white" /></View>
              <View style={{ flex: 1 }}>
                <AppText size={19} color="#202432" family="InterBold">Add Note</AppText>
                <AppText size={12} color="#858DA0" family="InterRegular">Record an important lead update</AppText>
              </View>
              <Pressable style={styles.modalClose} disabled={submittingNote} onPress={() => setShowNote(false)}><DetailIcon type="close" size={19} /></Pressable>
            </View>
            <View style={styles.noteModalBody}>
              <View style={[styles.noteInputWrap, noteError && styles.noteInputError]}>
                <View style={styles.noteInputHeader}><DetailIcon type="note" size={18} /><AppText size={12} color="#687086" family="InterSemiBold">NOTE DETAILS</AppText><AppText size={11} color="#9AA1B0" family="InterMedium" style={{ marginLeft: 'auto' }}>{noteText.length}/1000</AppText></View>
                <TextInput value={noteText} onChangeText={value => { setNoteText(value.slice(0, 1000)); if (noteError) setNoteError(''); }} placeholder="Write your note here..." placeholderTextColor="#A2A9B7" style={styles.noteInput} multiline textAlignVertical="top" autoFocus />
              </View>
              {noteError ? <AppText size={12} color="#C43D36" family="InterMedium" style={styles.noteErrorText}>{noteError}</AppText> : null}
              <View style={styles.noteHint}><DetailIcon type="activity" size={16} /><AppText size={12} color="#7E8799" family="InterRegular" style={{ flex: 1 }}>After submission, this note will be added to the lead activity timeline.</AppText></View>
              <Pressable style={[styles.noteSubmitButton, submittingNote && { opacity: 0.65 }]} onPress={submitNote} disabled={submittingNote}>
                {submittingNote ? <ActivityIndicator color="white" /> : <DetailIcon type="save" color="white" size={19} />}
                <AppText size={15} color="white" family="InterBold">{submittingNote ? 'Submitting...' : 'Submit Note'}</AppText>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showCheckout} transparent animationType="fade" statusBarTranslucent onRequestClose={() => !checkingOut && setShowCheckout(false)}>
        <KeyboardAvoidingView style={styles.noteModalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.noteModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleIcon}><DetailIcon type="checkout" color="white" /></View>
              <View style={{ flex: 1 }}>
                <AppText size={19} color="#202432" family="InterBold">Checkout Summary</AppText>
                <AppText size={12} color="#858DA0" family="InterRegular">Summarize the outcome of this lead visit</AppText>
              </View>
              <Pressable style={styles.modalClose} disabled={checkingOut} onPress={() => setShowCheckout(false)}><DetailIcon type="close" size={19} /></Pressable>
            </View>
            <View style={styles.noteModalBody}>
              <View style={[styles.noteInputWrap, checkoutError && styles.noteInputError]}>
                <View style={styles.noteInputHeader}><DetailIcon type="note" size={18} /><AppText size={12} color="#687086" family="InterSemiBold">VISIT SUMMARY</AppText><AppText size={11} color="#9AA1B0" family="InterMedium" style={{ marginLeft: 'auto' }}>{checkoutSummary.length}/1540</AppText></View>
                <TextInput value={checkoutSummary} onChangeText={value => { setCheckoutSummary(value.slice(0, 1540)); if (checkoutError) setCheckoutError(''); }} placeholder="Add discussion, outcome and next steps..." placeholderTextColor="#A2A9B7" style={styles.noteInput} multiline textAlignVertical="top" autoFocus />
              </View>
              {checkoutError ? <AppText size={12} color="#C43D36" family="InterMedium" style={styles.noteErrorText}>{checkoutError}</AppText> : null}
              <View style={styles.checkoutInfoRow}>
                <View style={styles.checkoutInfoIcon}><DetailIcon type="location" size={17} /></View>
                <View style={{ flex: 1 }}><AppText size={12} color="#30384A" family="InterSemiBold">Location verified at checkout</AppText><AppText size={11} color="#858DA0" family="InterRegular">The summary will also appear in Lead Activity.</AppText></View>
              </View>
              <Pressable style={[styles.noteSubmitButton, checkingOut && { opacity: 0.65 }]} onPress={handleCheckOut} disabled={checkingOut}>
                {checkingOut ? <ActivityIndicator color="white" /> : <DetailIcon type="checkout" color="white" size={19} />}
                <AppText size={15} color="white" family="InterBold">{checkingOut ? 'Checking Out...' : 'Complete Check Out'}</AppText>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showTask} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowTask(false)}>
        <KeyboardAvoidingView style={styles.noteModalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.taskModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleIcon}><DetailIcon type="task" color="white" /></View>
              <View style={{ flex: 1 }}>
                <AppText size={19} color="#202432" family="InterBold">Create Lead Task</AppText>
                <AppText size={12} color="#858DA0" family="InterRegular">Schedule a follow-up action for this lead</AppText>
              </View>
              <Pressable style={styles.modalClose} onPress={() => setShowTask(false)}><DetailIcon type="close" size={19} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.taskModalBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <TaskFieldLabel icon="user" label="Assign To" required />
              <Dropdown style={styles.taskDropdown} data={taskUsers} labelField="label" valueField="value" value={taskForm.assignedTo} onChange={item => { setTaskForm(current => ({ ...current, assignedTo: item.value })); setTaskError(''); }} placeholder={taskOptionsLoading ? 'Loading users...' : 'Select user'} placeholderStyle={styles.taskPlaceholder} selectedTextStyle={styles.taskSelectedText} disable={taskOptionsLoading} />

              <TaskFieldLabel icon="note" label="Task Description" required />
              <TextInput value={taskForm.description} onChangeText={description => { setTaskForm(current => ({ ...current, description: description.slice(0, 1000) })); setTaskError(''); }} placeholder="Describe the follow-up or action required..." placeholderTextColor="#A2A9B7" multiline textAlignVertical="top" style={styles.taskDescription} />

              <TaskFieldLabel icon="opportunity" label="Priority" required />
              <Dropdown style={styles.taskDropdown} data={taskPriorities} labelField="label" valueField="value" value={taskForm.priority} onChange={item => { setTaskForm(current => ({ ...current, priority: item.value })); setTaskError(''); }} placeholder={taskOptionsLoading ? 'Loading priorities...' : 'Select priority'} placeholderStyle={styles.taskPlaceholder} selectedTextStyle={styles.taskSelectedText} disable={taskOptionsLoading} />

              <View style={styles.taskScheduleRow}>
                <View style={{ flex: 1 }}><TaskFieldLabel icon="calendar" label="Due Date" required /><Pressable style={styles.taskScheduleField} onPress={() => openTaskPicker('date')}><AppText size={13} color="#30384A" family="InterSemiBold">{displayTaskDate(taskDate)}</AppText><DetailIcon type="calendar" size={18} /></Pressable></View>
                <View style={{ flex: 1 }}><TaskFieldLabel icon="clock" label="Due Time" required /><Pressable style={styles.taskScheduleField} onPress={() => openTaskPicker('time')}><AppText size={13} color="#30384A" family="InterSemiBold">{displayTaskTime(taskTime)}</AppText><DetailIcon type="clock" size={18} /></Pressable></View>
              </View>

              {Platform.OS === 'android' && showTaskDatePicker && <DateTimePicker value={taskDate} mode="date" minimumDate={new Date()} onChange={(_, value) => { setShowTaskDatePicker(false); if (value) setTaskDate(value); }} />}
              {Platform.OS === 'android' && showTaskTimePicker && <DateTimePicker value={taskTime} mode="time" onChange={(_, value) => { setShowTaskTimePicker(false); if (value) setTaskTime(value); }} />}

              <View style={styles.taskHint}><DetailIcon type="activity" size={16} /><AppText size={12} color="#7E8799" family="InterRegular" style={{ flex: 1 }}>The assigned user will receive this task for the selected date and time.</AppText></View>
              {taskError ? <AppText size={12} color="#C43D36" family="InterMedium" style={styles.taskErrorText}>{taskError}</AppText> : null}
              <View style={styles.taskActions}>
                <Pressable style={styles.taskCancelButton} disabled={savingTask} onPress={() => setShowTask(false)}><AppText size={15} color={colors.blue} family="InterBold">Cancel</AppText></Pressable>
                <Pressable style={[styles.taskSaveButton, savingTask && { opacity: 0.65 }]} onPress={saveTask} disabled={savingTask || taskOptionsLoading}>{savingTask ? <ActivityIndicator color="white" /> : <DetailIcon type="save" color="white" size={18} />}<AppText size={15} color="white" family="InterBold">{savingTask ? 'Saving...' : 'Save Task'}</AppText></Pressable>
              </View>
            </ScrollView>
          </View>
          <IosPickerOverlay
            visible={Platform.OS === 'ios' && Boolean(taskPickerMode)}
            title={taskPickerMode === 'time' ? 'Select Due Time' : 'Select Due Date'}
            mode={taskPickerMode === 'time' ? 'time' : 'date'}
            value={taskPickerValue}
            minimumDate={taskPickerMode === 'date' ? new Date() : undefined}
            onCancel={() => setTaskPickerMode(null)}
            onDone={applyTaskPicker}
          />
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showOpportunity} transparent animationType="fade" statusBarTranslucent onRequestClose={() => !savingOpportunity && setShowOpportunity(false)}>
        <KeyboardAvoidingView style={styles.noteModalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.opportunityModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleIcon}><DetailIcon type="opportunity" color="white" /></View>
              <View style={{ flex: 1 }}>
                <AppText size={19} color="#202432" family="InterBold">Create Opportunity</AppText>
                <AppText size={12} color="#858DA0" family="InterRegular">Add value and expected closure details</AppText>
              </View>
              <Pressable style={styles.modalClose} disabled={savingOpportunity} onPress={() => setShowOpportunity(false)}><DetailIcon type="close" size={19} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.taskModalBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <TaskFieldLabel icon="rupee" label="Opportunity Amount" required />
              <View style={styles.amountField}><AppText size={21} color={colors.blue} family="InterBold">₹</AppText><TextInput value={opportunityForm.amount} onChangeText={value => { setOpportunityForm(current => ({ ...current, amount: value.replace(/[^0-9.]/g, '') })); setOpportunityError(''); }} placeholder="Enter amount" placeholderTextColor="#A2A9B7" keyboardType="decimal-pad" style={styles.amountInput} /></View>

              <View style={styles.confidenceCard}>
                <View style={styles.confidenceHeader}><View><AppText size={13} color="#4F586D" family="InterSemiBold">Confidence</AppText><AppText size={11} color="#9299A8" family="InterRegular">Likelihood of closing</AppText></View><View style={styles.confidenceBadge}><AppText size={14} color={colors.blue} family="InterBold">{opportunityForm.confidence}%</AppText></View></View>
                <ConfidenceSlider value={opportunityForm.confidence} onChange={confidence => setOpportunityForm(current => ({ ...current, confidence }))} />
                <View style={styles.confidenceScale}><AppText size={10} color="#9AA1B0" family="InterMedium">0%</AppText><AppText size={10} color="#9AA1B0" family="InterMedium">100%</AppText></View>
              </View>

              <TaskFieldLabel icon="user" label="Assign To" required />
              <Dropdown dropdownPosition="auto" maxHeight={260} style={styles.taskDropdown} containerStyle={styles.opportunityDropdownMenu} data={opportunityUsers} labelField="label" valueField="value" value={opportunityForm.assignedTo} onChange={item => { setOpportunityForm(current => ({ ...current, assignedTo: item.value })); setOpportunityError(''); }} placeholder={opportunityOptionsLoading ? 'Loading users...' : 'Select user'} placeholderStyle={styles.taskPlaceholder} selectedTextStyle={styles.taskSelectedText} disable={opportunityOptionsLoading} />
              <TaskFieldLabel icon="contact" label="Lead Contact" required />
              <Dropdown dropdownPosition="auto" maxHeight={260} style={styles.taskDropdown} containerStyle={styles.opportunityDropdownMenu} data={opportunityContacts} labelField="label" valueField="value" value={opportunityForm.contactId} onChange={item => { setOpportunityForm(current => ({ ...current, contactId: item.value })); setOpportunityError(''); }} placeholder={opportunityOptionsLoading ? 'Loading contacts...' : 'Select contact'} placeholderStyle={styles.taskPlaceholder} selectedTextStyle={styles.taskSelectedText} disable={opportunityOptionsLoading} />
              <TaskFieldLabel icon="note" label="Opportunity Note" required />
              <TextInput value={opportunityForm.note} onChangeText={note => { setOpportunityForm(current => ({ ...current, note: note.slice(0, 1000) })); setOpportunityError(''); }} placeholder="Add context, requirements or next steps..." placeholderTextColor="#A2A9B7" multiline textAlignVertical="top" style={styles.opportunityNote} />
              <TaskFieldLabel icon="calendar" label="Estimated Close Date" required />
              <Pressable style={styles.taskScheduleField} onPress={() => setShowOpportunityDatePicker(true)}><AppText size={14} color="#30384A" family="InterSemiBold">{displayTaskDate(opportunityDate)}</AppText><DetailIcon type="calendar" size={18} /></Pressable>
              {Platform.OS === 'android' && showOpportunityDatePicker && <DateTimePicker value={opportunityDate} mode="date" minimumDate={new Date()} onChange={(_, value) => { setShowOpportunityDatePicker(false); if (value) setOpportunityDate(value); }} />}
              <TaskFieldLabel icon="status" label="Opportunity Status" required />
              <Dropdown dropdownPosition="top" maxHeight={240} style={styles.taskDropdown} containerStyle={styles.opportunityDropdownMenu} data={opportunityStatuses} labelField="label" valueField="value" value={opportunityForm.status} onChange={item => { setOpportunityForm(current => ({ ...current, status: item.value })); setOpportunityError(''); }} placeholder={opportunityOptionsLoading ? 'Loading statuses...' : 'Select status'} placeholderStyle={styles.taskPlaceholder} selectedTextStyle={styles.taskSelectedText} disable={opportunityOptionsLoading} />
              {opportunityError ? <AppText size={12} color="#C43D36" family="InterMedium" style={styles.taskErrorText}>{opportunityError}</AppText> : null}
              <View style={styles.taskActions}>
                <Pressable style={styles.taskCancelButton} disabled={savingOpportunity} onPress={() => setShowOpportunity(false)}><AppText size={15} color={colors.blue} family="InterBold">Cancel</AppText></Pressable>
                <Pressable style={[styles.taskSaveButton, savingOpportunity && { opacity: 0.65 }]} disabled={savingOpportunity || opportunityOptionsLoading} onPress={saveOpportunity}>{savingOpportunity ? <ActivityIndicator color="white" /> : <DetailIcon type="save" color="white" size={18} />}<AppText size={15} color="white" family="InterBold">{savingOpportunity ? 'Saving...' : 'Create'}</AppText></Pressable>
              </View>
            </ScrollView>
          </View>
          <IosPickerOverlay visible={Platform.OS === 'ios' && showOpportunityDatePicker} title="Estimated Close Date" mode="date" value={opportunityDate} minimumDate={new Date()} onCancel={() => setShowOpportunityDatePicker(false)} onDone={value => { setOpportunityDate(value); setShowOpportunityDatePicker(false); }} />
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
};

const Section = ({ title, children }: any) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionMarker} />
      <AppText size={16} color="#202432" family="InterBold">{title}</AppText>
    </View>
    {children}
  </View>
);

const FieldGrid = ({ fields }: { fields: { label: string; value: any; fullWidth?: boolean; onPress?: () => void }[] }) => (
  <View style={styles.fieldGrid}>
    {fields.map(field => {
      const value = fieldValue(field.value);
      return (
        <View key={field.label} style={[styles.fieldItem, field.fullWidth && styles.fieldItemFull]}>
          <AppText size={12} color="#8991A3" family="InterSemiBold">{field.label}</AppText>
          <Pressable disabled={!value || !field.onPress} onPress={field.onPress}>
            <AppText size={14} color={!value ? '#A7ADBA' : field.onPress ? colors.blue : '#30384A'} family={value ? 'InterMedium' : 'InterRegular'} style={styles.fieldValue}>{value || '-'}</AppText>
          </Pressable>
        </View>
      );
    })}
  </View>
);

const ActionTile = ({ icon, label, onPress }: any) => (
  <Pressable style={styles.actionTile} onPress={onPress}>
    <View style={styles.actionIcon}><DetailIcon type={icon} size={24} /></View>
    <AppText size={13} color="#30384A" family="InterSemiBold">{label}</AppText>
  </Pressable>
);

const TaskFieldLabel = ({ icon, label, required = false }: any) => (
  <View style={styles.taskLabelRow}><DetailIcon type={icon} size={16} /><AppText size={13} color="#4F586D" family="InterSemiBold">{label}{required ? ' *' : ''}</AppText></View>
);

const ConfidenceSlider = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
  const [width, setWidth] = useState(0);
  const update = (x: number) => onChange(Math.round(Math.max(0, Math.min(100, (x / Math.max(width, 1)) * 100))));
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: event => update(event.nativeEvent.locationX),
    onPanResponderMove: event => update(event.nativeEvent.locationX),
  }), [width]);
  return <View style={styles.sliderTouch} onLayout={event => setWidth(event.nativeEvent.layout.width)} {...responder.panHandlers}><View style={styles.sliderTrack}><View style={[styles.sliderFill, { width: `${value}%` }]} /><View style={[styles.sliderThumb, { left: `${value}%` }]} /></View></View>;
};

const TimelineCard = ({ label, value, placeholder = false }: any) => (
  <View style={styles.timelineCard}>
    <AppText size={12} color="#687086" family="InterBold" align="center">{label}</AppText>
    <DetailIcon type="calendar" size={18} />
    <AppText size={13} color={placeholder ? '#A7ADBA' : '#30384A'} family={placeholder ? 'InterRegular' : 'InterSemiBold'} align="center">{value}</AppText>
  </View>
);

const DetailIcon = ({ type, size = 21, color = colors.blue }: any) => {
  const line = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const icons: Record<string, React.ReactNode> = {
    edit: <><Path d="M4 20h4L19 9l-4-4L4 16v4z" {...line} /><Path d="M13 7l4 4" {...line} /></>,
    phone: <Path d="M7 3l3 4-2 2c1.6 3.5 3.5 5.4 7 7l2-2 4 3-1 3c-.4 1-1.5 1.5-2.5 1.2C9 18.5 5.5 15 2.8 6.5 2.5 5.5 3 4.4 4 4l3-1z" {...line} />,
    email: <><Rect x="3" y="5" width="18" height="14" rx="2" {...line} /><Path d="M4 7l8 6 8-6" {...line} /></>,
    location: <><Path d="M12 22s7-6 7-13a7 7 0 10-14 0c0 7 7 13 7 13z" {...line} /><Circle cx="12" cy="9" r="2" {...line} /></>,
    pin: <><Rect x="3" y="5" width="18" height="14" rx="2" {...line} /><Path d="M7 9h2m2 0h2m2 0h2M7 13h2m2 0h2m2 0h2" {...line} /></>,
    lead: <><Circle cx="9" cy="9" r="3" {...line} /><Path d="M3 20c.5-4 2.5-6 6-6s5.5 2 6 6m2-13h4m-2-2v4" {...line} /></>,
    source: <><Circle cx="12" cy="12" r="3" {...line} /><Circle cx="12" cy="12" r="8" {...line} /><Path d="M12 4V2m8 10h2m-10 8v2M4 12H2" {...line} /></>,
    note: <><Path d="M4 3h16v14l-4 4H4V3z" {...line} /><Path d="M16 21v-4h4M8 8h8m-8 4h6" {...line} /></>,
    checkin: <><Path d="M4 3h10v18H4z" {...line} /><Path d="M20 12H9m3-3l-3 3 3 3" {...line} /></>,
    checkout: <><Path d="M10 3h10v18H10z" {...line} /><Path d="M4 12h11m-3-3l3 3-3 3" {...line} /></>,
    activity: <><Path d="M4 12h4l2-6 4 12 2-6h4" {...line} /></>,
    task: <><Rect x="4" y="3" width="16" height="18" rx="2" {...line} /><Path d="M8 8l1 1 2-2m2 1h3M8 14l1 1 2-2m2 1h3" {...line} /></>,
    opportunity: <><Circle cx="12" cy="9" r="5" {...line} /><Path d="M9 15h6m-5 3h4m-2-14V2" {...line} /></>,
    rupee: <><Path d="M6 5h12M6 9h12M7 5c7 0 7 8 0 8l9 7" {...line} /></>,
    contact: <><Circle cx="9" cy="8" r="3" {...line} /><Path d="M3 19c.5-4 2.5-6 6-6s5.5 2 6 6m2-11h4m-2-2v4" {...line} /></>,
    status: <><Circle cx="12" cy="12" r="9" {...line} /><Path d="M8 12l3 3 5-6" {...line} /></>,
    calendar: <><Rect x="3" y="5" width="18" height="16" rx="2" {...line} /><Path d="M7 3v4m10-4v4M3 10h18" {...line} /></>,
    user: <><Circle cx="12" cy="8" r="4" {...line} /><Path d="M4 21c.6-5 3-7 8-7s7.4 2 8 7" {...line} /></>,
    close: <Path d="M6 6l12 12M18 6L6 18" {...line} />,
    save: <><Path d="M4 3h14l2 2v16H4V3z" {...line} /><Path d="M8 3v6h8V3M8 21v-7h8v7" {...line} /></>,
    clock: <><Circle cx="12" cy="12" r="9" {...line} /><Path d="M12 7v5l3 2" {...line} /></>,
  };
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">{icons[type]}</Svg>;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  stateContainer: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: '#F4F6FA' },
  retryButton: { minWidth: 110, height: 44, paddingHorizontal: 18, borderRadius: 12, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  profileCard: { overflow: 'hidden', marginBottom: 16, borderRadius: 20, backgroundColor: colors.blue, elevation: 5, shadowColor: colors.blue, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 12 },
  profileTopRow: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.17)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.55)', alignItems: 'center', justifyContent: 'center' },
  profileText: { flex: 1, minWidth: 0, gap: 4 },
  statusChip: { alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  editButton: { height: 40, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.13)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  profileFooter: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 11, backgroundColor: 'rgba(0,0,0,0.08)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.16)' },
  profileFooterDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },
  sectionCard: { marginBottom: 14, padding: 17, borderRadius: 18, backgroundColor: 'white', borderWidth: 1, borderColor: '#E8EBF1', elevation: 2, shadowColor: '#17203A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.055, shadowRadius: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 15 },
  sectionMarker: { width: 4, height: 20, borderRadius: 2, backgroundColor: colors.blue },
  detailIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.blue + '0D', alignItems: 'center', justifyContent: 'center' },
  detailText: { flex: 1 },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 },
  fieldItem: { width: '50%', paddingRight: 10 },
  fieldItemFull: { width: '100%' },
  fieldValue: { marginTop: 3 },
  listDivider: { height: 1, marginVertical: 12, backgroundColor: '#ECEEF3' },
  contactMeta: { marginTop: 2 },
  contactLink: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  noteBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 13, borderRadius: 12, backgroundColor: colors.blue + '08' },
  noteText: { flex: 1, lineHeight: 21 },
  primaryActions: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  primaryAction: { flex: 1, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 14, backgroundColor: 'white', borderWidth: 1.2, borderColor: colors.blue + '45', elevation: 2, shadowColor: '#17203A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 5 },
  primaryActionDisabled: { opacity: 0.65, backgroundColor: colors.blue + '08' },
  actionGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  actionTile: { flex: 1, alignItems: 'center', gap: 8 },
  actionIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: colors.blue + '0D', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.blue + '18' },
  timelineRow: { flexDirection: 'row', gap: 9 },
  timelineCard: { flex: 1, minHeight: 118, alignItems: 'center', justifyContent: 'center', gap: 9, padding: 10, borderRadius: 16, backgroundColor: 'white', borderWidth: 1, borderColor: '#E4E8EF', elevation: 2, shadowColor: '#17203A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
  modalHeader: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E8EBF1' },
  modalTitleIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  modalClose: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.blue + '0D', borderWidth: 1, borderColor: colors.blue + '25', alignItems: 'center', justifyContent: 'center' },
  noteModalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18, backgroundColor: 'rgba(20,27,43,0.56)' },
  noteModal: { width: '100%', maxWidth: 520, overflow: 'hidden', borderRadius: 22, backgroundColor: '#F8F9FC', elevation: 12, shadowColor: '#111827', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 18 },
  noteModalBody: { padding: 18 },
  noteInputWrap: { minHeight: 210, overflow: 'hidden', borderWidth: 1.2, borderColor: '#D8DEE9', borderRadius: 15, backgroundColor: 'white' },
  noteInputError: { borderColor: '#C43D36' },
  noteInputHeader: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13, backgroundColor: colors.blue + '08', borderBottomWidth: 1, borderBottomColor: '#EBEEF3' },
  noteInput: { minHeight: 164, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 14, color: '#283044', fontSize: 15, fontFamily: fonts.InterMedium, lineHeight: 22 },
  noteErrorText: { marginTop: 7, marginLeft: 3 },
  noteHint: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 13, padding: 11, borderRadius: 11, backgroundColor: colors.blue + '08' },
  noteSubmitButton: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 17, borderRadius: 13, backgroundColor: colors.blue, elevation: 3, shadowColor: colors.blue, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.22, shadowRadius: 7 },
  checkoutInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 13, padding: 11, borderRadius: 12, backgroundColor: colors.blue + '08', borderWidth: 1, borderColor: colors.blue + '15' },
  checkoutInfoIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.blue + '0D', alignItems: 'center', justifyContent: 'center' },
  taskModal: { width: '100%', maxWidth: 540, maxHeight: '88%', overflow: 'hidden', borderRadius: 22, backgroundColor: '#F8F9FC', elevation: 12, shadowColor: '#111827', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 18 },
  opportunityModal: { width: '100%', maxWidth: 540, maxHeight: '92%', overflow: 'hidden', borderRadius: 22, backgroundColor: '#F8F9FC', elevation: 12, shadowColor: '#111827', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 18 },
  opportunityDropdownMenu: { borderRadius: 16, borderColor: '#D8DEE9', elevation: 12, shadowColor: '#111827', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.18, shadowRadius: 14 },
  amountField: { height: 58, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15, borderWidth: 1, borderColor: '#D8DEE9', borderRadius: 13, backgroundColor: 'white' },
  amountInput: { flex: 1, height: '100%', padding: 0, color: '#30384A', fontSize: 17, fontFamily: fonts.InterSemiBold },
  confidenceCard: { marginTop: 15, padding: 15, borderRadius: 14, backgroundColor: 'white', borderWidth: 1, borderColor: '#E1E5ED' },
  confidenceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  confidenceBadge: { minWidth: 52, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', borderRadius: 11, backgroundColor: colors.blue + '10' },
  sliderTouch: { height: 38, justifyContent: 'center', marginTop: 8 },
  sliderTrack: { height: 5, borderRadius: 3, backgroundColor: '#DDE2EB' },
  sliderFill: { height: 5, borderRadius: 3, backgroundColor: colors.blue },
  sliderThumb: { position: 'absolute', top: -7, width: 19, height: 19, marginLeft: -9, borderRadius: 10, backgroundColor: colors.blue, borderWidth: 3, borderColor: 'white', elevation: 3, shadowColor: colors.blue, shadowOpacity: 0.25, shadowRadius: 3 },
  confidenceScale: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -3 },
  opportunityNote: { minHeight: 82, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, borderWidth: 1, borderColor: '#D8DEE9', borderRadius: 13, backgroundColor: 'white', color: '#30384A', fontSize: 14, fontFamily: fonts.InterMedium, lineHeight: 20 },
  taskModalBody: { padding: 18, paddingBottom: 22 },
  taskLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14, marginBottom: 7 },
  taskDropdown: { height: 52, paddingHorizontal: 14, borderWidth: 1, borderColor: '#D8DEE9', borderRadius: 13, backgroundColor: 'white' },
  taskPlaceholder: { color: '#A2A9B7', fontSize: 14, fontFamily: fonts.InterRegular },
  taskSelectedText: { color: '#30384A', fontSize: 14, fontFamily: fonts.InterSemiBold },
  taskDescription: { minHeight: 94, paddingHorizontal: 14, paddingTop: 13, paddingBottom: 13, borderWidth: 1, borderColor: '#D8DEE9', borderRadius: 13, backgroundColor: 'white', color: '#30384A', fontSize: 14, fontFamily: fonts.InterMedium, lineHeight: 20 },
  taskScheduleRow: { flexDirection: 'row', gap: 11 },
  taskScheduleField: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 13, borderWidth: 1, borderColor: '#D8DEE9', borderRadius: 13, backgroundColor: 'white' },
  taskHint: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, padding: 11, borderRadius: 11, backgroundColor: colors.blue + '08' },
  taskErrorText: { marginTop: 10, marginLeft: 2 },
  taskActions: { flexDirection: 'row', gap: 11, marginTop: 18 },
  taskCancelButton: { flex: 1, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: 'white', borderWidth: 1, borderColor: colors.blue + '55' },
  taskSaveButton: { flex: 1.35, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 13, backgroundColor: colors.blue, elevation: 3, shadowColor: colors.blue, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 7 },
});

export default LeadDetails;
