import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Linking, Modal, PermissionsAndroid, Platform, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import {
  changeLeadTaskStatusApi,
  deleteLeadDraftApi,
  deleteLeadFileApi,
  getDraftApproversApi,
  getLeadFlowApi,
  saveLeadDraftApi,
  uploadLeadFilesApi,
} from '../../api/query/LeadApi';
import AppText from '../../components/AppText/AppText';
import { colors } from '../../utils/Colors';
import { fonts } from '../../utils/typography';
import { composeEmail } from '../../utils/composeEmail';
import { composeDraftEmail } from '../../utils/composeDraftEmail';
import { apiErrorMessage, PlivoCallTarget } from './usePlivoCall';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

export type LeadFlow = {
  external_lead_id?: string | null;
  calling: { dialable: number; called: number; next_contact: { id: number; name: string; phone: string } | null };
  contacts: any[];
  call_history: any[];
  tasks: any[];
  drafts: { email: any[]; linkedin: any[] };
  files: any[];
};

const EMPTY_FLOW: LeadFlow = { calling: { dialable: 0, called: 0, next_contact: null }, contacts: [], call_history: [], tasks: [], drafts: { email: [], linkedin: [] }, files: [] };

/** Loads the CRM lead flow (api/lead-flow) for a lead. */
export const useLeadFlow = (leadId: any) => {
  const [flow, setFlow] = useState<LeadFlow>(EMPTY_FLOW);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!leadId) return;
    try {
      setLoading(true);
      setError('');
      const response = await getLeadFlowApi(leadId);
      setFlow({ ...EMPTY_FLOW, ...(response?.data?.data || {}) });
    } catch (requestError: any) {
      setError(apiErrorMessage(requestError, 'Unable to load calls, tasks and drafts.'));
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  return { flow, loading, error, refresh };
};

type CallProps = {
  leadId: any;
  leadName: string;
  leadStatusId?: any;
  call: (target: PlivoCallTarget) => void;
  isCalling: (key: string | number) => boolean;
};

const STATUS_TONES: Record<string, [string, string]> = {
  'Call Done': ['#047857', '#D1FAE5'],
  'No Response': ['#B45309', '#FEF3C7'],
  'Switch Off': ['#475569', '#E2E8F0'],
  'Wrong Number': ['#B91C1C', '#FEE2E2'],
  'Call Back': ['#0369A1', '#E0F2FE'],
  Connected: ['#047857', '#D1FAE5'],
  'Not connected': ['#475569', '#E2E8F0'],
};

const TASK_TONES: Record<string, [string, string]> = {
  pending: ['#B45309', '#FEF3C7'],
  open: ['#0369A1', '#E0F2FE'],
  in_progress: ['#6D28D9', '#EDE9FE'],
  completed: ['#047857', '#D1FAE5'],
};

const Badge = ({ label, tone }: { label: string; tone?: [string, string] }) => {
  const [fg, bg] = tone || ['#475569', '#E2E8F0'];
  return <View style={[styles.badge, { backgroundColor: bg }]}><AppText size={11} color={fg} family="InterBold">{label}</AppText></View>;
};

export const FlowSection = ({ title, count, action, children }: any) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionMarker} />
      <AppText size={16} color="#202432" family="InterBold" style={{ flex: 1 }}>{title}{count !== undefined ? ` (${count})` : ''}</AppText>
      {action}
    </View>
    {children}
  </View>
);

const SmallButton = ({ label, onPress, primary, danger, disabled, loading }: any) => (
  <Pressable onPress={onPress} disabled={disabled || loading} style={[styles.smallButton, primary && styles.smallButtonPrimary, danger && styles.smallButtonDanger, (disabled || loading) && { opacity: 0.55 }]}>
    {loading ? <ActivityIndicator size="small" color={primary ? 'white' : colors.blue} /> : (
      <AppText size={12.5} color={primary ? 'white' : danger ? '#B42318' : colors.blue} family="InterBold">{label}</AppText>
    )}
  </Pressable>
);

const Empty = ({ text }: { text: string }) => <AppText size={13.5} color="#A7ADBA" family="InterRegular">{text}</AppText>;

// ---------------------------------------------------------------------------
// Calling progress + contacts
// ---------------------------------------------------------------------------

export const CallingProgressCard = ({ flow, ...callProps }: { flow: LeadFlow } & CallProps) => {
  const { dialable, called, next_contact: next } = flow.calling;
  if (!dialable) return null;
  const done = called >= dialable;
  const percent = Math.round((called * 100) / dialable);
  return (
    <View style={styles.progressCard}>
      <View style={styles.progressTop}>
        <AppText size={14} color="#202432" family="InterBold">Called {called}/{dialable} contacts</AppText>
        <Badge label={done ? 'All called' : called ? 'Partially called' : 'Not called'} tone={done ? ['#047857', '#D1FAE5'] : called ? ['#B45309', '#FEF3C7'] : ['#1D4ED8', '#DBEAFE']} />
      </View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${percent}%` }, done && { backgroundColor: '#10B981' }]} /></View>
      {next ? (
        <View style={styles.nextRow}>
          <AppText size={12.5} color="#5B6478" family="InterMedium" style={{ flex: 1 }} numLines={2}>Next to call: <AppText size={12.5} color="#202432" family="InterBold">{next.name || next.phone}</AppText></AppText>
          <SmallButton
            primary
            label="Call next"
            loading={callProps.isCalling(String(next.phone))}
            onPress={() => callProps.call({ key: String(next.phone), phone: next.phone, name: next.name || next.phone, leadId: callProps.leadId, leadName: callProps.leadName, leadStatusId: callProps.leadStatusId })}
          />
        </View>
      ) : null}
    </View>
  );
};

export const ContactsCard = ({ flow, ...callProps }: { flow: LeadFlow } & CallProps) => (
  <FlowSection title="Contacts" count={flow.contacts.length}>
    {flow.contacts.length ? flow.contacts.map((contact: any, index: number) => {
      const phone = String(contact.phone_number || '').trim();
      const calling = phone ? callProps.isCalling(phone) : false;
      return (
        <View key={contact.id} style={[styles.contactRow, index > 0 && styles.rowDivider]}>
          <View style={styles.contactTop}>
            <View style={styles.avatar}><AppText size={14} color={colors.blue} family="InterBold">{String(contact.name || '?').charAt(0).toUpperCase()}</AppText></View>
            <View style={{ flex: 1 }}>
              <AppText size={15} color="#202432" family="InterBold" numLines={1}>{contact.name || 'Unnamed contact'}</AppText>
              <AppText size={12} color="#8991A3" family="InterMedium" numLines={1}>
                {[contact.title, contact.external_contact_id ? `Contact ID ${contact.external_contact_id}` : null].filter(Boolean).join(' · ') || '—'}
              </AppText>
            </View>
            {phone ? (
              <Badge
                label={contact.calls ? `Called ${contact.calls}×` : 'Not called'}
                tone={contact.calls ? ['#047857', '#D1FAE5'] : ['#1D4ED8', '#DBEAFE']}
              />
            ) : <Badge label="No phone" />}
          </View>
          {contact.calls ? (
            <AppText size={12} color="#5B6478" family="InterRegular" style={styles.contactMeta}>
              Last call {contact.last_call_at}{contact.last_status ? ` · ${contact.last_status}` : ''}
            </AppText>
          ) : null}
          <View style={styles.contactActions}>
            {phone ? (
              <Pressable style={styles.contactChip} disabled={calling} onPress={() => callProps.call({ key: phone, phone, name: contact.name || phone, leadId: callProps.leadId, leadName: callProps.leadName, leadStatusId: callProps.leadStatusId })}>
                {calling ? <ActivityIndicator size="small" color={colors.blue} /> : <AppText size={13} color={colors.blue} family="InterBold">📞 {phone}</AppText>}
              </Pressable>
            ) : null}
            {contact.email ? (
              <Pressable style={styles.contactChip} onPress={() => composeEmail(contact.email)}>
                <AppText size={13} color={colors.blue} family="InterBold" numLines={1}>✉️ {contact.email}</AppText>
              </Pressable>
            ) : null}
            {contact.linkedin_url ? (
              <Pressable style={[styles.contactChip, styles.linkedinChip]} onPress={() => Linking.openURL(contact.linkedin_url).catch(() => Alert.alert('Unable to open LinkedIn'))}>
                <AppText size={13} color="#0A66C2" family="InterBold">in  LinkedIn</AppText>
              </Pressable>
            ) : null}
          </View>
        </View>
      );
    }) : <Empty text="No contacts on this lead." />}
  </FlowSection>
);

// ---------------------------------------------------------------------------
// Call history
// ---------------------------------------------------------------------------

const formatDuration = (seconds: number) => `${Math.floor((seconds || 0) / 60)}:${String((seconds || 0) % 60).padStart(2, '0')}`;

export const CallHistoryCard = ({ flow, navigation }: { flow: LeadFlow; navigation: any }) => {
  const [expanded, setExpanded] = useState(false);
  const calls = expanded ? flow.call_history : flow.call_history.slice(0, 4);
  return (
    <FlowSection title="Call History" count={flow.call_history.length}>
      {calls.length ? calls.map((call: any, index: number) => (
        <Pressable key={call.id} style={[styles.listRow, index > 0 && styles.rowDivider]} onPress={() => navigation?.navigate?.('CallDetails', { callLogId: call.id })}>
          <View style={{ flex: 1 }}>
            <AppText size={14} color="#202432" family="InterBold" numLines={1}>{call.contact_name || call.number}</AppText>
            <AppText size={12} color="#8991A3" family="InterMedium" numLines={1}>
              {call.started_at} · {call.agent || '—'} · {formatDuration(call.duration)}
            </AppText>
            {call.remark ? <AppText size={12.5} color="#4F586D" family="InterRegular" numLines={2} style={styles.contactMeta}>{call.remark}</AppText> : null}
            {call.follow_up_at ? <AppText size={12} color="#0369A1" family="InterSemiBold" style={styles.contactMeta}>Follow-up {call.follow_up_at}</AppText> : null}
          </View>
          <Badge label={call.status} tone={STATUS_TONES[call.status]} />
        </Pressable>
      )) : <Empty text="No calls yet." />}
      {flow.call_history.length > 4 ? (
        <Pressable style={styles.moreButton} onPress={() => setExpanded(value => !value)}>
          <AppText size={13} color={colors.blue} family="InterBold">{expanded ? 'Show less' : `Show all ${flow.call_history.length} calls`}</AppText>
        </Pressable>
      ) : null}
    </FlowSection>
  );
};

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

const TASK_STATUSES = [
  { key: 'pending', label: 'Pending' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

export const TasksCard = ({ flow, onChanged, onAddTask }: { flow: LeadFlow; onChanged: () => void; onAddTask: () => void }) => {
  const [editing, setEditing] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [remark, setRemark] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const open = (task: any) => {
    setEditing(task);
    setStatus(task.status);
    setRemark('');
    setError('');
  };

  const save = async () => {
    if (!status) return setError('Choose a status.');
    if (!remark.trim()) return setError('Please add a remark.');
    try {
      setSaving(true);
      const response = await changeLeadTaskStatusApi(editing.id, status, remark.trim());
      if (response?.data?.status === 'error') throw { response };
      setEditing(null);
      onChanged();
    } catch (requestError: any) {
      setError(apiErrorMessage(requestError, 'Unable to update the task.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FlowSection title="Tasks" count={flow.tasks.length} action={<SmallButton label="+ Add" onPress={onAddTask} />}>
      {flow.tasks.length ? flow.tasks.map((task: any, index: number) => (
        <View key={task.id} style={[styles.listRow, index > 0 && styles.rowDivider]}>
          <View style={{ flex: 1 }}>
            <AppText size={14} color="#202432" family="InterBold" numLines={2}>{task.description || 'Task'}</AppText>
            <AppText size={12} color={task.overdue ? '#B42318' : '#8991A3'} family="InterMedium">
              {[task.date, task.time].filter(Boolean).join(' · ')}{task.overdue ? ' · Overdue' : ''}
            </AppText>
            <AppText size={12} color="#5B6478" family="InterRegular" style={styles.contactMeta}>
              Assigned to {task.assigned_to || '—'}
              {task.completed_at ? ` · Completed ${task.completed_at}` : task.opened_at ? ` · Opened ${task.opened_at}` : task.seen_at ? ` · Seen ${task.seen_at}` : ' · Not seen yet'}
            </AppText>
          </View>
          <View style={styles.taskRight}>
            <Badge label={task.status_label} tone={TASK_TONES[task.status]} />
            {task.can_change_status ? <SmallButton label="Update" onPress={() => open(task)} /> : null}
          </View>
        </View>
      )) : <Empty text="No tasks yet." />}

      <Modal visible={Boolean(editing)} transparent animationType="fade" statusBarTranslucent onRequestClose={() => !saving && setEditing(null)}>
        <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <AppText size={18} color="#202432" family="InterBold">Update task status</AppText>
            <AppText size={13} color="#687086" family="InterRegular" numLines={2} style={styles.contactMeta}>{editing?.description}</AppText>
            <View style={[styles.chipWrap, { marginTop: 14 }]}>
              {TASK_STATUSES.map(item => (
                <Pressable key={item.key} onPress={() => { setStatus(item.key); setError(''); }} style={[styles.chip, status === item.key && styles.chipActive]}>
                  <AppText size={13} color={status === item.key ? colors.blue : '#566078'} family={status === item.key ? 'InterBold' : 'InterMedium'}>{item.label}</AppText>
                </Pressable>
              ))}
            </View>
            <TextInput value={remark} onChangeText={value => { setRemark(value); setError(''); }} placeholder="Remark (required)" placeholderTextColor="#98A2B3" multiline textAlignVertical="top" style={styles.textArea} />
            {error ? <AppText size={12.5} color="#B42318" family="InterMedium" style={styles.contactMeta}>{error}</AppText> : null}
            <View style={styles.modalActions}>
              <SmallButton label="Cancel" onPress={() => setEditing(null)} disabled={saving} />
              <SmallButton primary label="Update status" onPress={save} loading={saving} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </FlowSection>
  );
};

// ---------------------------------------------------------------------------
// Email / LinkedIn drafts (approval + send)
// ---------------------------------------------------------------------------

const DRAFT_LABELS = { email: 'Email Drafts', linkedin: 'LinkedIn Drafts' };

export const DraftsCard = ({ type, flow, leadId, onChanged }: { type: 'email' | 'linkedin'; flow: LeadFlow; leadId: any; onChanged: () => void }) => {
  const drafts = flow.drafts[type] || [];
  const [editor, setEditor] = useState<{ id?: any; note: string; approverId: any; contactId: any; feedback?: string } | null>(null);
  // Contacts the draft can be written for.
  const contactOptions = flow.contacts.map((contact: any) => ({ label: `${contact.name || 'Contact'}${contact.title ? ` · ${contact.title}` : ''}`, value: contact.id }));
  const defaultContactId = contactOptions.length === 1 ? contactOptions[0].value : '';
  const [approvers, setApprovers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sendDraft, setSendDraft] = useState<any>(null);
  const [recipients, setRecipients] = useState<string[]>([]);

  useEffect(() => {
    if (!editor || approvers.length) return;
    getDraftApproversApi()
      .then(response => setApprovers((response?.data?.data || []).map((user: any) => ({ label: user.name, value: user.id }))))
      .catch(() => setError('Unable to load approvers.'));
  }, [editor, approvers.length]);

  const save = async () => {
    if (!editor?.note.trim()) return setError('Please write the draft.');
    if (!editor.contactId) return setError('Please choose the contact this draft is for.');
    if (!editor.approverId) return setError('Please choose who should approve this draft.');
    try {
      setSaving(true);
      const response = await saveLeadDraftApi({ draft_id: editor.id, lead_id: leadId, type, note: editor.note.trim(), approver_id: editor.approverId, lead_contact_id: editor.contactId });
      setEditor(null);
      onChanged();
      Alert.alert('Draft saved', response?.data?.message || 'The draft was sent for approval.');
    } catch (requestError: any) {
      setError(apiErrorMessage(requestError, 'Unable to save the draft.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = (draft: any) => Alert.alert('Delete draft?', 'This draft will be removed.', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteLeadDraftApi(draft.id); onChanged(); } catch (requestError: any) { Alert.alert('Unable to delete', apiErrorMessage(requestError, 'Please try again.')); }
      },
    },
  ]);

  const emailContacts = flow.contacts.filter((contact: any) => String(contact.email || '').trim());
  const linkedinContacts = flow.contacts.filter((contact: any) => contact.linkedin_url);

  const startSend = (draft: any) => {
    const pool = type === 'email' ? emailContacts : linkedinContacts;
    if (!pool.length) {
      Alert.alert(type === 'email' ? 'No email address' : 'No LinkedIn profile', type === 'email' ? 'None of the contacts on this lead has an email address.' : 'None of the contacts on this lead has a LinkedIn URL.');
      return;
    }
    const own = pool.find((contact: any) => String(contact.id) === String(draft.contact_id)) || pool[0];
    setRecipients(type === 'email' ? [String(own.email)] : [String(own.id)]);
    setSendDraft(draft);
  };

  const send = async () => {
    if (!sendDraft) return;
    if (type === 'email') {
      if (!recipients.length) return;
      setSendDraft(null);
      composeDraftEmail(recipients, sendDraft.note);
      return;
    }
    const contact = linkedinContacts.find((item: any) => String(item.id) === recipients[0]);
    if (!contact) return;
    setSendDraft(null);
    // Copy the message (Share → Copy) or send it straight to the LinkedIn app, then open the profile.
    try { await Share.share({ message: sendDraft.note }); } catch { /* user dismissed */ }
    Linking.openURL(contact.linkedin_url).catch(() => Alert.alert('Unable to open LinkedIn'));
  };

  return (
    <FlowSection
      title={DRAFT_LABELS[type]}
      count={drafts.length}
      action={<SmallButton label="+ New" onPress={() => { setError(''); setEditor({ note: '', approverId: '', contactId: defaultContactId }); }} />}
    >
      {drafts.length ? drafts.map((draft: any, index: number) => (
        <View key={draft.id} style={[styles.draftRow, index > 0 && styles.rowDivider]}>
          <View style={styles.draftTop}>
            <Badge
              label={draft.approved ? 'Approved' : draft.state === 'changes_requested' ? 'Changes requested' : 'Pending approval'}
              tone={draft.approved ? ['#047857', '#D1FAE5'] : draft.state === 'changes_requested' ? ['#C2410C', '#FFEDD5'] : ['#B45309', '#FEF3C7']}
            />
            <AppText size={11.5} color="#8991A3" family="InterMedium" style={{ flex: 1, textAlign: 'right' }} numLines={1}>{draft.created_by} · {draft.created_at}</AppText>
          </View>
          {draft.contact_name ? <AppText size={12.5} color="#0369A1" family="InterSemiBold" style={styles.contactMeta}>For {draft.contact_name}{draft.contact_title ? ` · ${draft.contact_title}` : ''}</AppText> : null}
          <AppText size={13.5} color="#30384A" family="InterRegular" style={styles.draftText} numLines={6}>{draft.note}</AppText>
          {!draft.approved && draft.feedbacks?.length ? (
            <View style={[styles.feedbackBox, draft.state === 'changes_requested' && styles.feedbackBoxOpen]}>
              <AppText size={12} color={draft.state === 'changes_requested' ? '#C2410C' : '#5B6478'} family="InterBold">
                Feedback from {draft.feedbacks[draft.feedbacks.length - 1].by || 'approver'} · {draft.feedbacks[draft.feedbacks.length - 1].at}
              </AppText>
              <AppText size={13} color="#30384A" family="InterRegular" style={styles.contactMeta}>{draft.feedbacks[draft.feedbacks.length - 1].text}</AppText>
              <AppText size={11.5} color="#7E8799" family="InterRegular" style={styles.contactMeta}>
                {draft.state === 'changes_requested' ? 'Edit the draft as per this feedback — saving sends it back for approval.' : 'Updated and sent back for approval.'}
              </AppText>
            </View>
          ) : null}
          <AppText size={12} color="#5B6478" family="InterMedium">
            {draft.approved ? `Approved by ${draft.approved_by || '—'} · ${draft.approved_at}` : `Waiting for ${draft.approver || 'approver'}`}
          </AppText>
          <View style={styles.draftActions}>
            {draft.approved ? <SmallButton primary label={type === 'email' ? 'Send email' : 'Send message'} onPress={() => startSend(draft)} /> : null}
            {draft.can_edit ? <SmallButton primary={draft.state === 'changes_requested'} label={draft.state === 'changes_requested' ? 'Edit as per feedback' : 'Edit'} onPress={() => { setError(''); setEditor({ id: draft.id, note: draft.note, approverId: draft.approver_id, contactId: draft.contact_id || defaultContactId, feedback: draft.state === 'changes_requested' ? draft.feedbacks?.[draft.feedbacks.length - 1]?.text : undefined }); }} /> : null}
            {draft.can_edit ? <SmallButton danger label="Delete" onPress={() => remove(draft)} /> : null}
          </View>
        </View>
      )) : <Empty text={type === 'email' ? 'No email drafts yet.' : 'No LinkedIn drafts yet.'} />}

      <Modal visible={Boolean(editor)} transparent animationType="fade" statusBarTranslucent onRequestClose={() => !saving && setEditor(null)}>
        <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <AppText size={18} color="#202432" family="InterBold">{editor?.id ? 'Edit' : 'New'} {type === 'email' ? 'email' : 'LinkedIn'} draft</AppText>
            <AppText size={12.5} color="#687086" family="InterRegular" style={styles.contactMeta}>The draft is sent to the approver. Once approved you can send it.</AppText>
            {editor?.feedback ? (
              <View style={[styles.feedbackBox, styles.feedbackBoxOpen]}>
                <AppText size={12} color="#C2410C" family="InterBold">Approver feedback</AppText>
                <AppText size={13} color="#30384A" family="InterRegular" style={styles.contactMeta}>{editor.feedback}</AppText>
              </View>
            ) : null}
            <AppText size={12} color="#566078" family="InterBold" style={styles.fieldLabel}>DRAFT FOR (CONTACT) *</AppText>
            <Dropdown
              style={styles.dropdown}
              data={contactOptions}
              labelField="label"
              valueField="value"
              value={editor?.contactId}
              onChange={item => { setEditor(current => current && { ...current, contactId: item.value }); setError(''); }}
              placeholder={contactOptions.length ? 'Choose the contact' : 'No contacts on this lead'}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownText}
              dropdownPosition="bottom"
            />
            <TextInput value={editor?.note || ''} onChangeText={note => { setEditor(current => current && { ...current, note }); setError(''); }} placeholder={type === 'email' ? 'Write the email...' : 'Write the LinkedIn message...'} placeholderTextColor="#98A2B3" multiline textAlignVertical="top" style={[styles.textArea, { minHeight: 150 }]} />
            <AppText size={12} color="#566078" family="InterBold" style={styles.fieldLabel}>APPROVER *</AppText>
            <Dropdown
              style={styles.dropdown}
              data={approvers}
              search
              searchPlaceholder="Search user"
              labelField="label"
              valueField="value"
              value={editor?.approverId}
              onChange={item => { setEditor(current => current && { ...current, approverId: item.value }); setError(''); }}
              placeholder={approvers.length ? 'Choose who approves' : 'Loading users...'}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownText}
              inputSearchStyle={styles.dropdownText}
              dropdownPosition="top"
            />
            {error ? <AppText size={12.5} color="#B42318" family="InterMedium" style={styles.contactMeta}>{error}</AppText> : null}
            <View style={styles.modalActions}>
              <SmallButton label="Cancel" onPress={() => setEditor(null)} disabled={saving} />
              <SmallButton primary label="Send for approval" onPress={save} loading={saving} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={Boolean(sendDraft)} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setSendDraft(null)}>
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <AppText size={18} color="#202432" family="InterBold">{type === 'email' ? 'Send email to' : 'Send LinkedIn message to'}</AppText>
            <AppText size={12.5} color="#687086" family="InterRegular" style={styles.contactMeta}>
              {type === 'email' ? 'Choose one or more contacts. Your email app opens with the approved draft.' : 'Choose one contact. Copy the message (or share it to LinkedIn), then the profile opens.'}
            </AppText>
            <ScrollView style={{ maxHeight: 280, marginTop: 12 }}>
              {(type === 'email' ? emailContacts : linkedinContacts).map((contact: any) => {
                const value = type === 'email' ? String(contact.email) : String(contact.id);
                const active = recipients.includes(value);
                return (
                  <Pressable
                    key={contact.id}
                    style={[styles.pickRow, active && styles.chipActive]}
                    onPress={() => setRecipients(current => type === 'email' ? (active ? current.filter(item => item !== value) : [...current, value]) : [value])}
                  >
                    <View style={[type === 'email' ? styles.checkbox : styles.radio, active && styles.checkboxActive]}>{active ? <AppText size={10} color="white" family="InterBold">✓</AppText> : null}</View>
                    <View style={{ flex: 1 }}>
                      <AppText size={14} color="#202432" family="InterBold" numLines={1}>{contact.name || 'Contact'}</AppText>
                      <AppText size={12} color="#8991A3" family="InterMedium" numLines={1}>{type === 'email' ? contact.email : contact.linkedin_url}</AppText>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.modalActions}>
              <SmallButton label="Cancel" onPress={() => setSendDraft(null)} />
              <SmallButton primary label={type === 'email' ? `Open email (${recipients.length})` : 'Copy & open profile'} onPress={send} disabled={!recipients.length} />
            </View>
          </View>
        </View>
      </Modal>
    </FlowSection>
  );
};

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

const formatSize = (bytes: number) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export const FilesCard = ({ flow, leadId, onChanged }: { flow: LeadFlow; leadId: any; onChanged: () => void }) => {
  const [uploading, setUploading] = useState(false);

  const upload = async (assets: any[]) => {
    const files = assets.filter(asset => asset?.uri);
    if (!files.length) return;
    const formData = new FormData();
    formData.append('lead_id', String(leadId));
    files.forEach((asset, index) => {
      formData.append('files[]', { uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || `lead-file-${Date.now()}-${index}.jpg` } as any);
    });
    try {
      setUploading(true);
      const response = await uploadLeadFilesApi(formData);
      if (typeof response === 'string') throw new Error(response);
      onChanged();
    } catch (requestError: any) {
      Alert.alert('Upload failed', requestError?.message && !requestError?.response ? requestError.message : apiErrorMessage(requestError, 'Unable to upload the file.'));
    } finally {
      setUploading(false);
    }
  };

  const pick = () => Alert.alert('Add file', 'Choose a photo or video to upload to this lead.', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Camera', onPress: async () => {
        if (Platform.OS === 'android') {
          const permission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
          if (permission !== PermissionsAndroid.RESULTS.GRANTED) return;
        }
        launchCamera({ mediaType: 'photo', quality: 0.8 }, response => !response.didCancel && upload(response.assets || []));
      },
    },
    { text: 'Gallery', onPress: () => launchImageLibrary({ mediaType: 'mixed', selectionLimit: 10 }, response => !response.didCancel && upload(response.assets || [])) },
  ]);

  const remove = (file: any) => Alert.alert('Delete file?', file.file_name, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteLeadFileApi(file.id); onChanged(); } catch (requestError: any) { Alert.alert('Unable to delete', apiErrorMessage(requestError, 'Please try again.')); }
      },
    },
  ]);

  return (
    <FlowSection title="Files" count={flow.files.length} action={<SmallButton label={uploading ? 'Uploading...' : '+ Upload'} loading={uploading} onPress={pick} />}>
      {flow.files.length ? flow.files.map((file: any, index: number) => (
        <View key={file.id} style={[styles.listRow, index > 0 && styles.rowDivider]}>
          <Pressable style={{ flex: 1 }} onPress={() => Linking.openURL(file.url).catch(() => Alert.alert('Unable to open file'))}>
            <AppText size={14} color={colors.blue} family="InterBold" numLines={1}>{file.is_image ? '🖼 ' : '📄 '}{file.file_name}</AppText>
            <AppText size={12} color="#8991A3" family="InterMedium">{String(file.mime_type || '').split('/').pop()?.toUpperCase()} · {formatSize(file.size)} · {file.uploaded_at}</AppText>
          </Pressable>
          <SmallButton danger label="Delete" onPress={() => remove(file)} />
        </View>
      )) : <Empty text="No files uploaded." />}
    </FlowSection>
  );
};

const styles = StyleSheet.create({
  sectionCard: { backgroundColor: 'white', borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E7ECF4' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12 },
  sectionMarker: { width: 4, height: 18, borderRadius: 2, backgroundColor: colors.blue },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 11, alignSelf: 'flex-start' },
  smallButton: { minHeight: 32, paddingHorizontal: 12, borderRadius: 9, borderWidth: 1, borderColor: '#C9D4E5', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F7FC' },
  smallButtonPrimary: { backgroundColor: colors.blue, borderColor: colors.blue },
  smallButtonDanger: { backgroundColor: '#FEF3F2', borderColor: '#FECDCA' },
  progressCard: { backgroundColor: 'white', borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E7ECF4' },
  progressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: '#E8EDF5', marginTop: 12, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: '#F59E0B' },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  rowDivider: { borderTopWidth: 1, borderTopColor: '#EEF1F6' },
  contactRow: { paddingVertical: 12 },
  contactTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EAF0FF', alignItems: 'center', justifyContent: 'center' },
  contactMeta: { marginTop: 4 },
  contactActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  contactChip: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 16, backgroundColor: '#F1F5FD', maxWidth: '100%' },
  linkedinChip: { backgroundColor: '#E8F3FC' },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 11 },
  taskRight: { alignItems: 'flex-end', gap: 8 },
  moreButton: { paddingTop: 10, alignItems: 'center' },
  draftRow: { paddingVertical: 12 },
  draftTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  draftText: { marginVertical: 9, lineHeight: 19 },
  draftActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  backdrop: { flex: 1, backgroundColor: 'rgba(13, 25, 48, 0.6)', justifyContent: 'center', padding: 18 },
  modalCard: { backgroundColor: 'white', borderRadius: 20, padding: 18 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1.5, borderColor: '#D5DDEA', backgroundColor: '#F8FAFD' },
  chipActive: { borderColor: colors.blue, backgroundColor: '#EEF3FF' },
  textArea: { minHeight: 90, maxHeight: 260, marginTop: 14, borderWidth: 1.5, borderColor: '#C9D4E5', borderRadius: 12, backgroundColor: '#F8FAFD', padding: 12, color: '#202432', fontSize: 14, lineHeight: 20, fontFamily: fonts.InterRegular },
  fieldLabel: { marginTop: 14, marginBottom: 7 },
  dropdown: { height: 48, borderWidth: 1.5, borderColor: '#C9D4E5', borderRadius: 12, paddingHorizontal: 12, backgroundColor: '#F8FAFD' },
  dropdownPlaceholder: { color: '#98A2B3', fontSize: 14, fontFamily: fonts.InterMedium },
  dropdownText: { color: '#202432', fontSize: 14, fontFamily: fonts.InterSemiBold },
  feedbackBox: { marginTop: 10, padding: 10, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#CBD5E1', backgroundColor: '#F8FAFC' },
  feedbackBoxOpen: { borderLeftColor: '#F97316', backgroundColor: '#FFF7ED' },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, borderRadius: 12, borderWidth: 1.5, borderColor: '#E3E8F1', marginBottom: 8 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: '#AEB8CA', alignItems: 'center', justifyContent: 'center' },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: '#AEB8CA', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: colors.blue, borderColor: colors.blue },
});
