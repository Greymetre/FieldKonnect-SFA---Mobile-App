import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Linking, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';
import { Dropdown } from 'react-native-element-dropdown';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { getCallFeedbackStatusesApi, getClickToCallStatusApi, getPendingCallFeedbackApi, initiateClickToCallApi, submitCallFeedbackApi } from '../../api/query/LeadApi';
import AppText from '../../components/AppText/AppText';
import { useAppSelector } from '../../components/redux/Store';
import { colors } from '../../utils/Colors';
import { fonts } from '../../utils/typography';

export const cleanPhoneNumber = (value: any) => String(value || '').replace(/[^0-9]/g, '');

export const openDialer = async (phone: any) => {
  const number = cleanPhoneNumber(phone);
  if (!number) return;

  const dialUrl = Platform.OS === 'ios' ? `telprompt:${number}` : `tel:${number}`;
  try {
    await Linking.openURL(dialUrl);
  } catch {
    try {
      await Linking.openURL(`tel:${number}`);
    } catch {
      Alert.alert('Unable to open dialer', 'A phone application is not available on this device.');
    }
  }
};

const toPlivoE164 = (phone: string) => {
  const digits = cleanPhoneNumber(phone);
  if (!digits) return '';
  if (digits.length > 10) return `+${digits}`;
  return `+91${digits}`;
};

const formatCallDuration = (value: any) => {
  const seconds = Math.max(0, Number(value) || 0);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

export type PlivoCallTarget = {
  /** Identifies the button that started the call, for its loading state. */
  key: string | number;
  phone: string;
  /** Person being called, shown in the waiting modal and feedback sheet. */
  name: string;
  leadId: any;
  leadName: string;
  leadStatusId?: any;
};

const EMPTY_FEEDBACK = { callLogId: '' as any, leadName: '', duration: 0, statusId: '' as any, message: '' };

// Plivo click-to-call flow shared by the lead list and Lead Details: starts the call,
// tracks its status, then asks for call feedback. Inbound callbacks and calls whose
// polling stopped are picked up from the server when the screen regains focus.
export const usePlivoCall = ({ onFeedbackSaved }: { onFeedbackSaved?: () => void } = {}) => {
  const { user } = useAppSelector(state => state.auth);
  const canUsePlivoCalling = user?.call_management === true || Number(user?.call_management) === 1;
  const feedbackSheetRef = useRef<ActionSheetRef>(null);
  // Calls already prompted on this screen, so a dismissed form is not reopened on every app resume.
  const promptedCallIdsRef = useRef<Set<string>>(new Set());
  const [callingKeys, setCallingKeys] = useState<Set<number | string>>(new Set());
  const [callWaiting, setCallWaiting] = useState({ visible: false, leadName: '', phase: 'Connecting to Plivo...' });
  const [feedbackStatuses, setFeedbackStatuses] = useState<any[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [callFeedback, setCallFeedback] = useState<any>(EMPTY_FEEDBACK);
  const callPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const terminalHandledRef = useRef(false);
  const onFeedbackSavedRef = useRef(onFeedbackSaved);
  onFeedbackSavedRef.current = onFeedbackSaved;

  const stopCallTracking = useCallback(() => {
    if (callPollRef.current) clearInterval(callPollRef.current);
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    callPollRef.current = null;
    callTimeoutRef.current = null;
  }, []);

  const closeCallWaiting = useCallback(() => {
    setCallWaiting(prev => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => stopCallTracking, [stopCallTracking]);

  const setCallingState = (key: string | number, isCalling: boolean) => {
    setCallingKeys(prev => {
      const next = new Set(prev);
      if (isCalling) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const loadFeedbackStatuses = useCallback(async () => {
    try {
      setFeedbackLoading(true);
      const response = await getCallFeedbackStatusesApi();
      const records = response?.data?.data || [];
      const options = (Array.isArray(records) ? records : []).map((status: any) => ({
        label: status?.display_name || status?.status_name || status?.name || 'Status',
        value: status?.id,
      })).filter((status: any) => status.value !== undefined && status.value !== null);
      setFeedbackStatuses(options);
      return options;
    } catch (error: any) {
      Alert.alert('Unable to load statuses', error?.response?.data?.message || 'Please check your connection and try again.');
      return [];
    } finally {
      setFeedbackLoading(false);
    }
  }, []);

  // The status list is the lead statuses; it starts on the lead's current status.
  const openCallFeedback = useCallback(async (callLogId: string | number, leadName: string, duration: any, leadStatusId?: any) => {
    promptedCallIdsRef.current.add(String(callLogId));
    const statusId = leadStatusId === undefined || leadStatusId === null || leadStatusId === '' ? '' : Number(leadStatusId);
    setCallFeedback({ callLogId, leadName, duration: Number(duration) || 0, statusId, message: '' });
    feedbackSheetRef.current?.show();
    if (!feedbackStatuses.length) await loadFeedbackStatuses();
  }, [feedbackStatuses.length, loadFeedbackStatuses]);

  const checkPendingFeedback = useCallback(async () => {
    if (!canUsePlivoCalling || callPollRef.current) return;
    try {
      const response = await getPendingCallFeedbackApi();
      const pending = response?.data?.data;
      if (!pending?.call_log_id || promptedCallIdsRef.current.has(String(pending.call_log_id))) return;
      openCallFeedback(pending.call_log_id, pending.customer_name || 'Customer', pending.duration, pending.lead_status_id);
    } catch {
      // Feedback prompt is best-effort; the call stays visible in Call History.
    }
  }, [canUsePlivoCalling, openCallFeedback]);

  useFocusEffect(useCallback(() => {
    checkPendingFeedback();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') checkPendingFeedback();
    });
    return () => subscription.remove();
  }, [checkPendingFeedback]));

  const submitCallFeedback = async () => {
    const message = String(callFeedback.message || '').trim();
    if (callFeedback.statusId === '' || !message || feedbackSubmitting) return;

    try {
      setFeedbackSubmitting(true);
      await submitCallFeedbackApi({
        call_log_id: callFeedback.callLogId,
        feedback_status_id: callFeedback.statusId,
        message,
      });
      feedbackSheetRef.current?.hide();
      setCallFeedback(EMPTY_FEEDBACK);
      Alert.alert('Call record saved', 'The lead status and call notes have been updated.');
      onFeedbackSavedRef.current?.();
    } catch (error: any) {
      Alert.alert('Unable to save call record', error?.response?.data?.message || 'Please try again.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const startCall = async (target: PlivoCallTarget) => {
    const phone = toPlivoE164(target.phone || '');
    if (!phone) return;

    if (!canUsePlivoCalling) {
      openDialer(phone);
      return;
    }

    const { key } = target;
    const displayName = target.name || target.leadName || 'Customer';
    stopCallTracking();
    terminalHandledRef.current = false;
    setCallingState(key, true);
    setCallWaiting({ visible: true, leadName: displayName, phase: 'Connecting to Plivo...' });

    try {
      const response = await initiateClickToCallApi({
        to: phone,
        lead_id: target.leadId,
        lead_name: target.leadName || target.name || '',
      });
      const callLogId = response?.data?.data?.call_log_id;
      setCallWaiting(prev => ({ ...prev, phase: 'Please wait. Your phone will ring shortly.' }));

      if (!callLogId) {
        callTimeoutRef.current = setTimeout(() => {
          closeCallWaiting();
          setCallingState(key, false);
        }, 8000);
        return;
      }

      callPollRef.current = setInterval(async () => {
        try {
          const statusResponse = await getClickToCallStatusApi(callLogId);
          const statusData = statusResponse?.data?.data || {};
          const callStatus = String(statusData?.status || '').toLowerCase();
          const isAnswered = Boolean(statusData?.answered);
          const isCompleted = Boolean(statusData?.completed) || ['completed', 'hangup', 'failed', 'busy', 'no-answer', 'timeout', 'cancel', 'canceled'].includes(callStatus);

          if (isCompleted && !terminalHandledRef.current) {
            terminalHandledRef.current = true;
            stopCallTracking();
            closeCallWaiting();
            setCallingState(key, false);
            if (statusData?.requires_feedback !== false) {
              setTimeout(() => openCallFeedback(callLogId, displayName, statusData?.duration, target.leadStatusId), 300);
            }
            return;
          }

          if (callStatus.includes('ring') || isAnswered || callStatus === 'agent-answered') {
            setCallWaiting(prev => ({ ...prev, phase: 'Your phone is ringing...' }));
            setTimeout(closeCallWaiting, 700);
          }
        } catch {
          // Ignore a transient polling failure and retry on the next interval.
        }
      }, 1500);

      callTimeoutRef.current = setTimeout(() => {
        stopCallTracking();
        closeCallWaiting();
        setCallingState(key, false);
        Alert.alert('Call tracking stopped', 'The call status could not be confirmed. You can check it in Call History.');
      }, 60 * 60 * 1000);
    } catch (error: any) {
      stopCallTracking();
      closeCallWaiting();
      setCallingState(key, false);
      const status = error?.response?.status;
      if (status === 404 || status === 405) {
        openDialer(phone);
      } else {
        Alert.alert(
          'Call failed',
          error?.response?.data?.message || 'Unable to start Plivo call. We will try normal dialer.',
        );
        openDialer(phone);
      }
    }
  };

  const feedbackIncomplete = callFeedback.statusId === '' || !String(callFeedback.message || '').trim() || feedbackSubmitting;

  const callUi = (
    <>
      <ActionSheet ref={feedbackSheetRef} gestureEnabled={false} containerStyle={styles.feedbackSheetContainer} keyboardHandlerEnabled>
        <View style={styles.feedbackContent}>
          <View style={styles.feedbackHandle} />
          <View style={styles.feedbackHeader}>
            <View style={styles.feedbackHeaderCopy}>
              <AppText size={22} color="#202432" family="InterBold">Call Ended</AppText>
              <AppText size={15} color="#667085" family="InterMedium" style={styles.feedbackCustomer}>
                {callFeedback.leadName} · {formatCallDuration(callFeedback.duration)}
              </AppText>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close call feedback" style={styles.closeButton} onPress={() => feedbackSheetRef.current?.hide()}>
              <AppText size={24} color="#566078">×</AppText>
            </Pressable>
          </View>

          <View style={styles.feedbackLabelRow}>
            <AppText size={13} color="#566078" family="InterBold">LEAD STATUS <AppText size={13} color="#E5485D" family="InterBold">*</AppText></AppText>
          </View>
          <Dropdown
            style={styles.feedbackDropdown}
            data={feedbackStatuses}
            labelField="label"
            valueField="value"
            value={callFeedback.statusId}
            onChange={status => setCallFeedback((previous: any) => ({ ...previous, statusId: status.value }))}
            placeholder={feedbackLoading ? 'Loading statuses...' : 'Select lead status'}
            placeholderStyle={styles.feedbackPlaceholder}
            selectedTextStyle={styles.feedbackSelectedText}
            disable={feedbackLoading}
          />
          {!feedbackLoading && feedbackStatuses.length === 0 && (
            <Pressable onPress={loadFeedbackStatuses} style={styles.retryStatuses}>
              <AppText size={13} color={colors.blue} family="InterBold">Retry loading statuses</AppText>
            </Pressable>
          )}

          <AppText size={13} color="#566078" family="InterBold" style={styles.feedbackNotesLabel}>
            NOTES <AppText size={13} color="#E5485D" family="InterBold">*</AppText>
          </AppText>
          <TextInput
            value={callFeedback.message}
            onChangeText={message => setCallFeedback((previous: any) => ({ ...previous, message }))}
            placeholder="What happened on this call?"
            placeholderTextColor="#98A2B3"
            multiline
            maxLength={1000}
            textAlignVertical="top"
            style={styles.feedbackNotesInput}
          />

          <Pressable
            accessibilityRole="button"
            disabled={feedbackIncomplete}
            onPress={submitCallFeedback}
            style={({ pressed }) => [
              styles.feedbackSubmit,
              feedbackIncomplete && styles.feedbackSubmitDisabled,
              pressed && styles.feedbackSubmitPressed,
            ]}
          >
            {feedbackSubmitting
              ? <ActivityIndicator color="white" size="small" />
              : <AppText size={16} color="white" family="InterBold">Save Call Record</AppText>}
          </Pressable>
        </View>
      </ActionSheet>

      <Modal visible={callWaiting.visible} transparent animationType="fade" statusBarTranslucent onRequestClose={closeCallWaiting}>
        <View style={styles.callWaitingBackdrop}>
          <View style={styles.callWaitingCard}>
            <View style={styles.callPulseOuter}>
              <View style={styles.callPulseInner}>
                <Svg width={34} height={34} viewBox="0 0 24 24" fill="none">
                  <Path d="M6.62 10.79a15.46 15.46 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" fill="white" />
                </Svg>
              </View>
            </View>
            <AppText size={22} color="#202432" family="InterBold" style={styles.callWaitingTitle}>Preparing your call</AppText>
            <AppText size={15} color="#59657A" family="InterMedium" style={styles.callWaitingName}>{callWaiting.leadName}</AppText>
            <ActivityIndicator size="small" color={colors.blue} style={styles.callWaitingLoader} />
            <AppText size={14} color="#59657A" family="InterMedium" style={styles.callWaitingMessage}>{callWaiting.phase}</AppText>
            <Pressable style={styles.callWaitingClose} onPress={closeCallWaiting}>
              <AppText size={14} color={colors.blue} family="InterBold">Close</AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );

  return {
    canUsePlivoCalling,
    startCall,
    isCalling: (key: string | number) => callingKeys.has(key),
    callUi,
  };
};

const styles = StyleSheet.create({
  closeButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  callWaitingBackdrop: { flex: 1, backgroundColor: 'rgba(13, 25, 48, 0.72)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  callWaitingCard: { width: '100%', maxWidth: 360, borderRadius: 28, backgroundColor: 'white', alignItems: 'center', paddingHorizontal: 28, paddingTop: 34, paddingBottom: 24 },
  callPulseOuter: { width: 92, height: 92, borderRadius: 46, backgroundColor: '#E8F0FF', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  callPulseInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  callWaitingTitle: { textAlign: 'center' },
  callWaitingName: { textAlign: 'center', marginTop: 8 },
  callWaitingLoader: { marginTop: 24, marginBottom: 13 },
  callWaitingMessage: { textAlign: 'center', lineHeight: 21, minHeight: 42 },
  callWaitingClose: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 11, borderRadius: 18, backgroundColor: '#EDF3FF' },
  feedbackSheetContainer: { borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  feedbackContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 34 : 24 },
  feedbackHandle: { width: 72, height: 5, borderRadius: 3, backgroundColor: '#CCD5E4', alignSelf: 'center', marginBottom: 22 },
  feedbackHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 27 },
  feedbackHeaderCopy: { flex: 1 },
  feedbackCustomer: { marginTop: 6 },
  feedbackLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  feedbackDropdown: { height: 56, borderWidth: 1.5, borderColor: '#C9D4E5', borderRadius: 13, paddingHorizontal: 15, backgroundColor: '#F8FAFD' },
  feedbackPlaceholder: { color: '#98A2B3', fontSize: 15, fontFamily: fonts.InterMedium },
  feedbackSelectedText: { color: '#202432', fontSize: 15, fontFamily: fonts.InterSemiBold },
  retryStatuses: { alignSelf: 'flex-start', paddingVertical: 9 },
  feedbackNotesLabel: { marginTop: 22, marginBottom: 9 },
  feedbackNotesInput: { minHeight: 132, maxHeight: 180, borderWidth: 1.5, borderColor: '#C9D4E5', borderRadius: 13, backgroundColor: '#F8FAFD', paddingHorizontal: 15, paddingTop: 15, paddingBottom: 15, color: '#202432', fontSize: 15, lineHeight: 21, fontFamily: fonts.InterRegular },
  feedbackSubmit: { height: 56, marginTop: 24, borderRadius: 14, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  feedbackSubmitDisabled: { backgroundColor: '#B8C4D8' },
  feedbackSubmitPressed: { opacity: 0.86 },
});
