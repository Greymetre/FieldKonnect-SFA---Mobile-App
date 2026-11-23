import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { approveLeadDraftApi, getDraftApprovalsApi, sendDraftFeedbackApi } from '../../api/query/LeadApi';
import AppText from '../../components/AppText/AppText';
import { colors } from '../../utils/Colors';
import { fonts } from '../../utils/typography';
import { apiErrorMessage } from './usePlivoCall';

type DraftType = 'email' | 'linkedin';
type DraftState = 'pending' | 'changes' | 'approved';

const STATE_LABELS: Record<DraftState, string> = { pending: 'Pending', changes: 'Feedback sent', approved: 'Approved' };

/**
 * Lead Management > Draft Approval, like the CRM: Email and LinkedIn drafts sent
 * to the signed-in user (all drafts for users with the draft_approval
 * permission). The approver can edit the text and approve in one step.
 */
const DraftApprovals = ({ navigation }: any) => {
  const [type, setType] = useState<DraftType>('email');
  const [state, setState] = useState<DraftState>('pending');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [counts, setCounts] = useState({ email: 0, linkedin: 0 });
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [reviewing, setReviewing] = useState<any>(null);
  const [reviewText, setReviewText] = useState('');
  const [approving, setApproving] = useState(false);
  const [feedbackFor, setFeedbackFor] = useState<any>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const requestRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async (pageToLoad = 1, isRefresh = false) => {
    const requestId = ++requestRef.current;
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      setError('');
      const response = await getDraftApprovalsApi({ type, state, search: debounced || undefined, page: pageToLoad });
      if (requestId !== requestRef.current) return;
      const data = response?.data || {};
      setItems(previous => (pageToLoad === 1 ? data.data || [] : [...previous, ...(data.data || [])]));
      setCounts(data.pending_counts || { email: 0, linkedin: 0 });
      setPage(Number(data.current_page) || pageToLoad);
      setLastPage(Number(data.last_page) || 1);
    } catch (requestError: any) {
      if (requestId === requestRef.current) setError(apiErrorMessage(requestError, 'Unable to load drafts.'));
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [type, state, debounced]);

  useFocusEffect(useCallback(() => { load(1); }, [load]));

  const openReview = (draft: any) => {
    setReviewing(draft);
    setReviewText(draft.note || '');
  };

  const approve = async () => {
    if (!reviewing) return;
    if (!reviewText.trim()) return Alert.alert('Draft is empty', 'Please keep some text in the draft.');
    try {
      setApproving(true);
      await approveLeadDraftApi(reviewing.id, reviewText.trim() !== String(reviewing.note || '').trim() ? reviewText.trim() : undefined);
      setReviewing(null);
      load(1);
    } catch (requestError: any) {
      Alert.alert('Unable to approve', apiErrorMessage(requestError, 'Please try again.'));
    } finally {
      setApproving(false);
    }
  };

  const openFeedback = (draft: any) => {
    setFeedbackFor(draft);
    setFeedbackText('');
    setFeedbackError('');
  };

  // The draft goes back to the agent, who edits it and sends it for approval again.
  const sendFeedback = async () => {
    if (!feedbackFor) return;
    if (!feedbackText.trim()) return setFeedbackError('Please write what should be changed.');
    try {
      setSendingFeedback(true);
      await sendDraftFeedbackApi(feedbackFor.id, feedbackText.trim());
      setFeedbackFor(null);
      load(1);
    } catch (requestError: any) {
      setFeedbackError(apiErrorMessage(requestError, 'Unable to send the feedback.'));
    } finally {
      setSendingFeedback(false);
    }
  };

  const lastFeedback = (draft: any) => (draft?.feedbacks?.length ? draft.feedbacks[draft.feedbacks.length - 1] : null);

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <AppText size={15} color={colors.blue} family="InterBold" numLines={1} onPress={() => navigation.navigate('LeadDetails', { lead: { id: item.lead_id, name: item.company_name, company_name: item.company_name } })}>
            {item.company_name || 'Lead'}
          </AppText>
          <AppText size={12} color="#8991A3" family="InterMedium" numLines={1}>
            {[item.external_lead_id ? `Lead ID ${item.external_lead_id}` : null, `By ${item.created_by || '—'}`, item.created_at].filter(Boolean).join(' · ')}
          </AppText>
        </View>
        <View style={[styles.badge, item.approved ? styles.badgeGood : item.state === 'changes_requested' ? styles.badgeChanges : styles.badgeWarn]}>
          <AppText size={11} color={item.approved ? '#047857' : item.state === 'changes_requested' ? '#C2410C' : '#B45309'} family="InterBold">
            {item.approved ? 'Approved' : item.state === 'changes_requested' ? 'Feedback sent' : 'Pending'}
          </AppText>
        </View>
      </View>
      {item.contact_name ? <AppText size={12.5} color="#0369A1" family="InterSemiBold" style={{ marginTop: 6 }}>For {item.contact_name}{item.contact_title ? ` · ${item.contact_title}` : ''}</AppText> : null}
      <AppText size={13.5} color="#30384A" family="InterRegular" numLines={6} style={styles.note}>{item.note}</AppText>
      {lastFeedback(item) && !item.approved ? (
        <View style={[styles.feedbackBox, item.state === 'changes_requested' && styles.feedbackBoxOpen]}>
          <AppText size={12} color={item.state === 'changes_requested' ? '#C2410C' : '#5B6478'} family="InterBold">
            {item.state === 'changes_requested' ? 'Your feedback · waiting for the agent' : `Updated after feedback (${item.feedbacks.length})`}
          </AppText>
          <AppText size={12.5} color="#30384A" family="InterRegular" style={{ marginTop: 3 }} numLines={3}>{lastFeedback(item).text}</AppText>
        </View>
      ) : null}
      <View style={styles.cardBottom}>
        <AppText size={12} color="#5B6478" family="InterMedium" style={{ flex: 1 }} numLines={1}>
          {item.approved ? `Approved by ${item.approved_by || '—'} · ${item.approved_at}` : `Sent to ${item.approver || 'you'}`}
        </AppText>
        {item.can_approve && item.state !== 'changes_requested' ? (
          <Pressable style={styles.feedbackButton} onPress={() => openFeedback(item)}>
            <AppText size={13} color="#C2410C" family="InterBold">Feedback</AppText>
          </Pressable>
        ) : null}
        {item.can_approve ? (
          <Pressable style={styles.primaryButton} onPress={() => openReview(item)}>
            <AppText size={13} color="white" family="InterBold">Review & approve</AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {(['email', 'linkedin'] as DraftType[]).map(key => (
          <Pressable key={key} style={[styles.tab, type === key && styles.tabActive]} onPress={() => setType(key)}>
            <AppText size={14} color={type === key ? 'white' : '#4F586D'} family="InterBold">{key === 'email' ? 'Email' : 'LinkedIn'}</AppText>
            {counts[key] > 0 ? <View style={[styles.count, type === key && styles.countActive]}><AppText size={11} color={type === key ? colors.blue : 'white'} family="InterBold">{counts[key]}</AppText></View> : null}
          </Pressable>
        ))}
      </View>
      <View style={styles.filterRow}>
        {(['pending', 'changes', 'approved'] as DraftState[]).map(key => (
          <Pressable key={key} style={[styles.segment, state === key && styles.segmentActive]} onPress={() => setState(key)}>
            <AppText size={12.5} color={state === key ? colors.blue : '#687086'} family="InterBold">{STATE_LABELS[key]}</AppText>
          </Pressable>
        ))}
        <TextInput value={search} onChangeText={setSearch} placeholder="Search company or text" placeholderTextColor="#98A2B3" style={styles.search} />
      </View>

      <FlatList
        data={items}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(1, true)} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => { if (!loading && page < lastPage) load(page + 1); }}
        ListEmptyComponent={loading ? <ActivityIndicator color={colors.blue} style={{ marginTop: 40 }} /> : (
          <AppText size={14} color="#8991A3" family="InterMedium" align="center" style={{ marginTop: 40 }}>
            {error || (state === 'pending' ? 'No drafts are waiting for your approval.' : state === 'changes' ? 'No drafts are waiting for changes.' : 'No approved drafts yet.')}
          </AppText>
        )}
        ListFooterComponent={loading && items.length ? <ActivityIndicator color={colors.blue} style={{ marginVertical: 16 }} /> : null}
      />

      <Modal visible={Boolean(reviewing)} transparent animationType="fade" statusBarTranslucent onRequestClose={() => !approving && setReviewing(null)}>
        <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <AppText size={18} color="#202432" family="InterBold">Review {reviewing?.type === 'linkedin' ? 'LinkedIn' : 'email'} draft</AppText>
            <AppText size={12.5} color="#687086" family="InterRegular" style={{ marginTop: 4 }} numLines={1}>{reviewing?.company_name} · by {reviewing?.created_by}</AppText>
            <TextInput value={reviewText} onChangeText={setReviewText} multiline textAlignVertical="top" style={styles.textArea} />
            <AppText size={12} color="#7E8799" family="InterRegular" style={{ marginTop: 6 }}>You can edit the text before approving. After approval the agent can send it.</AppText>
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} disabled={approving} onPress={() => setReviewing(null)}>
                <AppText size={13.5} color={colors.blue} family="InterBold">Cancel</AppText>
              </Pressable>
              <Pressable style={[styles.primaryButton, approving && { opacity: 0.6 }]} disabled={approving} onPress={approve}>
                {approving ? <ActivityIndicator size="small" color="white" /> : <AppText size={13.5} color="white" family="InterBold">Approve</AppText>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <Modal visible={Boolean(feedbackFor)} transparent animationType="fade" statusBarTranslucent onRequestClose={() => !sendingFeedback && setFeedbackFor(null)}>
        <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <AppText size={18} color="#202432" family="InterBold">Send feedback</AppText>
            <AppText size={12.5} color="#687086" family="InterRegular" style={{ marginTop: 4 }} numLines={2}>
              {feedbackFor?.company_name}{feedbackFor?.contact_name ? ` · for ${feedbackFor.contact_name}` : ''} · by {feedbackFor?.created_by}
            </AppText>
            {(feedbackFor?.feedbacks || []).map((entry: any, index: number) => (
              <View key={index} style={styles.historyItem}>
                <AppText size={12.5} color="#30384A" family="InterRegular">{entry.text}</AppText>
                <AppText size={11} color="#8991A3" family="InterMedium" style={{ marginTop: 3 }}>{entry.by} · {entry.at}</AppText>
              </View>
            ))}
            <TextInput value={feedbackText} onChangeText={value => { setFeedbackText(value); setFeedbackError(''); }} placeholder="What should the agent change?" placeholderTextColor="#98A2B3" multiline maxLength={2000} textAlignVertical="top" style={[styles.textArea, { minHeight: 120 }]} />
            {feedbackError ? <AppText size={12.5} color="#B42318" family="InterMedium" style={{ marginTop: 6 }}>{feedbackError}</AppText> : null}
            <AppText size={12} color="#7E8799" family="InterRegular" style={{ marginTop: 6 }}>The draft goes back to the agent. They edit it and send it to you again.</AppText>
            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} disabled={sendingFeedback} onPress={() => setFeedbackFor(null)}>
                <AppText size={13.5} color={colors.blue} family="InterBold">Cancel</AppText>
              </Pressable>
              <Pressable style={[styles.primaryButton, sendingFeedback && { opacity: 0.6 }]} disabled={sendingFeedback} onPress={sendFeedback}>
                {sendingFeedback ? <ActivityIndicator size="small" color="white" /> : <AppText size={13.5} color="white" family="InterBold">Send to agent</AppText>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F5F9' },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14 },
  tab: { flex: 1, height: 42, borderRadius: 12, backgroundColor: 'white', borderWidth: 1, borderColor: '#DDE3EE', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  tabActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  count: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, backgroundColor: '#E5484D', alignItems: 'center', justifyContent: 'center' },
  countActive: { backgroundColor: 'white' },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 10 },
  segment: { height: 38, paddingHorizontal: 14, borderRadius: 10, backgroundColor: 'white', borderWidth: 1, borderColor: '#DDE3EE', alignItems: 'center', justifyContent: 'center' },
  segmentActive: { borderColor: colors.blue, backgroundColor: '#EEF3FF' },
  search: { flex: 1, height: 38, borderRadius: 10, backgroundColor: 'white', borderWidth: 1, borderColor: '#DDE3EE', paddingHorizontal: 12, color: '#202432', fontSize: 13.5, fontFamily: fonts.InterMedium },
  list: { padding: 16, paddingBottom: 40, gap: 12 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E7ECF4' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 11 },
  badgeGood: { backgroundColor: '#D1FAE5' },
  badgeWarn: { backgroundColor: '#FEF3C7' },
  badgeChanges: { backgroundColor: '#FFEDD5' },
  feedbackBox: { marginBottom: 10, padding: 9, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#CBD5E1', backgroundColor: '#F8FAFC' },
  feedbackBoxOpen: { borderLeftColor: '#F97316', backgroundColor: '#FFF7ED' },
  feedbackButton: { minHeight: 36, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FDBA74', backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' },
  historyItem: { marginTop: 10, padding: 9, borderRadius: 10, backgroundColor: '#F4F6FA' },
  note: { marginVertical: 10, lineHeight: 19 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  primaryButton: { minHeight: 36, paddingHorizontal: 14, borderRadius: 10, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  secondaryButton: { minHeight: 36, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#EEF3FF', alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(13, 25, 48, 0.6)', justifyContent: 'center', padding: 18 },
  modalCard: { backgroundColor: 'white', borderRadius: 20, padding: 18 },
  textArea: { minHeight: 180, maxHeight: 360, marginTop: 14, borderWidth: 1.5, borderColor: '#C9D4E5', borderRadius: 12, backgroundColor: '#F8FAFD', padding: 12, color: '#202432', fontSize: 14, lineHeight: 20, fontFamily: fonts.InterRegular },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
});

export default DraftApprovals;
