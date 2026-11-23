import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';
import { Dropdown } from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { getClickToCallStatusApi, getLeadCallOptionsApi, getPendingCallFeedbackApi, initiateClickToCallApi, submitCallOutcomeApi } from '../../api/query/LeadApi';
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

const pad = (value: number) => String(value).padStart(2, '0');
/** Y-m-dTH:i, the format the server expects for follow_up_at. */
const toServerDateTime = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
const displayDateTime = (date: Date) => date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/** First message from a Laravel validation / error response. */
export const apiErrorMessage = (error: any, fallback: string) => {
  const data = error?.response?.data;
  const errors = data?.errors && typeof data.errors === 'object' ? Object.values(data.errors).flat() : [];
  if (errors.length) return String(errors[0]);
  if (typeof data?.message === 'string' && data.message) return data.message;
  return fallback;
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

type CallOption = { id: number; key: string; label: string; needs_follow_up?: boolean; asks_channels?: boolean; not_reached?: boolean };

// Colour of each call outcome chip (matches the CRM).
const OUTCOME_COLORS: Record<string, string> = {
  lead_call_done: '#10B981',
  lead_call_no_response: '#F59E0B',
  lead_call_switch_off: '#64748B',
  lead_call_wrong_number: '#EF4444',
  lead_call_back: '#0EA5E9',
};

/** Call log ids whose remark form was already shown in this app session. */
const PROMPTED_CALL_IDS = new Set<string>();

const EMPTY_FEEDBACK = {
  callLogId: '' as any,
  leadId: '' as any,
  leadName: '',
  contactName: '',
  duration: 0,
  callStatusId: '' as any,
  leadTypeId: '' as any,
  remark: '',
  channels: [] as string[],
  followUp: null as Date | null,
};

// Plivo click-to-call flow shared by the lead list and Lead Details: starts the call,
// tracks its status, then asks for the call remark exactly like the CRM:
// call status (outcome) + lead type + remark, a date/time for "Call Back" or when
// the customer wants details after "Call Done" (becomes a task), and the next
// not-yet-called contact when this one was not reached.
export const usePlivoCall = ({ onFeedbackSaved }: { onFeedbackSaved?: () => void } = {}) => {
  const { user } = useAppSelector(state => state.auth);
  const canUsePlivoCalling = user?.call_management === true || Number(user?.call_management) === 1;
  const feedbackSheetRef = useRef<ActionSheetRef>(null);
  // Calls already prompted anywhere in the app (shared by every screen), so a
  // saved or dismissed remark form is never reopened for the same call.
  const promptedCallIdsRef = useRef<Set<string>>(PROMPTED_CALL_IDS);
  const [callingKeys, setCallingKeys] = useState<Set<number | string>>(new Set());
  const [callWaiting, setCallWaiting] = useState({ visible: false, leadName: '', phase: 'Connecting to Plivo...' });
  const [options, setOptions] = useState<{ callStatuses: CallOption[]; leadTypes: any[]; channels: any[] }>({ callStatuses: [], leadTypes: [], channels: [] });
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [callFeedback, setCallFeedback] = useState(EMPTY_FEEDBACK);
  const [androidPicker, setAndroidPicker] = useState<'date' | 'time' | null>(null);
  const callPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const terminalHandledRef = useRef(false);
  const onFeedbackSavedRef = useRef(onFeedbackSaved);
  onFeedbackSavedRef.current = onFeedbackSaved;
  const startCallRef = useRef<(target: PlivoCallTarget) => void>(() => {});

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

  const loadOptions = useCallback(async () => {
    try {
      setOptionsLoading(true);
      const response = await getLeadCallOptionsApi();
      const data = response?.data?.data || {};
      const next = {
        callStatuses: Array.isArray(data.call_statuses) ? data.call_statuses : [],
        leadTypes: (Array.isArray(data.lead_types) ? data.lead_types : []).map((type: any) => ({ label: type.label, value: type.id })),
        channels: Array.isArray(data.channels) ? data.channels : [],
      };
      setOptions(next);
      return next;
    } catch (error: any) {
      setFeedbackError(apiErrorMessage(error, 'Unable to load call options. Please retry.'));
      return null;
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  // Lead type starts on the lead's current type, like the CRM.
  const openCallFeedback = useCallback(async (callLogId: string | number, details: { leadId?: any; leadName?: string; contactName?: string; duration?: any; leadStatusId?: any }) => {
    promptedCallIdsRef.current.add(String(callLogId));
    const leadTypeId = details.leadStatusId === undefined || details.leadStatusId === null || details.leadStatusId === '' ? 0 : Number(details.leadStatusId);
    setFeedbackError('');
    setCallFeedback({
      ...EMPTY_FEEDBACK,
      callLogId,
      leadId: details.leadId ?? '',
      leadName: details.leadName || '',
      contactName: details.contactName || details.leadName || 'Customer',
      duration: Number(details.duration) || 0,
      leadTypeId,
    });
    feedbackSheetRef.current?.show();
    if (!options.callStatuses.length) await loadOptions();
  }, [options.callStatuses.length, loadOptions]);

  const checkPendingFeedback = useCallback(async () => {
    if (!canUsePlivoCalling || callPollRef.current) return;
    try {
      const response = await getPendingCallFeedbackApi();
      const pending = response?.data?.data;
      if (!pending?.call_log_id || promptedCallIdsRef.current.has(String(pending.call_log_id))) return;
      openCallFeedback(pending.call_log_id, {
        leadId: pending.lead_id,
        leadName: pending.company_name,
        contactName: pending.customer_name || 'Customer',
        duration: pending.duration,
        leadStatusId: pending.lead_status_id,
      });
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

  const selectedStatus = options.callStatuses.find(status => String(status.id) === String(callFeedback.callStatusId));
  const isCallBack = Boolean(selectedStatus?.needs_follow_up);
  const isCallDone = Boolean(selectedStatus?.asks_channels);
  const sendChannels = callFeedback.channels.filter(channel => channel !== 'none');
  const needsFollowUp = isCallBack || (isCallDone && sendChannels.length > 0);

  const updateFeedback = (changes: Partial<typeof EMPTY_FEEDBACK>) => {
    setFeedbackError('');
    setCallFeedback(previous => ({ ...previous, ...changes }));
  };

  const toggleChannel = (key: string) => {
    const current = callFeedback.channels;
    let next: string[];
    if (key === 'none') next = current.includes('none') ? [] : ['none'];
    else next = current.includes(key) ? current.filter(item => item !== key) : [...current.filter(item => item !== 'none'), key];
    updateFeedback({ channels: next });
  };

  const defaultFollowUp = () => {
    const date = new Date(Date.now() + 60 * 60 * 1000);
    date.setMinutes(0, 0, 0);
    return date;
  };

  const submitCallFeedback = async () => {
    if (feedbackSubmitting) return;
    const remark = String(callFeedback.remark || '').trim();
    if (options.callStatuses.length && !callFeedback.callStatusId) return setFeedbackError('Please select the call status.');
    if (callFeedback.leadTypeId === '' || callFeedback.leadTypeId === null) return setFeedbackError('Please select the lead type.');
    if (isCallDone && !callFeedback.channels.length) return setFeedbackError('Choose where the customer wants details, or "No follow-up needed".');
    if (needsFollowUp && !callFeedback.followUp) return setFeedbackError(isCallBack ? 'Please choose the call back date and time.' : 'Please choose when to send the details.');
    if (needsFollowUp && callFeedback.followUp && callFeedback.followUp.getTime() <= Date.now()) return setFeedbackError('The follow-up time must be in the future.');
    if (!remark) return setFeedbackError('Please add a remark.');

    try {
      setFeedbackSubmitting(true);
      const response = await submitCallOutcomeApi({
        call_log_id: callFeedback.callLogId,
        call_status: callFeedback.callStatusId,
        status: callFeedback.leadTypeId,
        remark,
        ...(isCallDone ? { details_via: callFeedback.channels } : {}),
        ...(needsFollowUp && callFeedback.followUp ? { follow_up_at: toServerDateTime(callFeedback.followUp) } : {}),
      });
      const saved = callFeedback;
      feedbackSheetRef.current?.hide();
      setCallFeedback(EMPTY_FEEDBACK);
      onFeedbackSavedRef.current?.();

      const next = response?.data?.next_contact;
      if (next?.phone) {
        Alert.alert(
          'Call the next contact?',
          `${next.remaining} contact${next.remaining === 1 ? '' : 's'} of this lead ${next.remaining === 1 ? 'is' : 'are'} not called yet. Call ${next.name || next.phone} now?`,
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Call now', onPress: () => startCallRef.current({ key: next.phone, phone: next.phone, name: next.name || next.phone, leadId: saved.leadId, leadName: saved.leadName, leadStatusId: saved.leadTypeId }) },
          ],
        );
      } else {
        // "Call Back" = one task; "Call Done" = one task per channel chosen.
        const taskCount = isCallBack ? 1 : sendChannels.length;
        const task = needsFollowUp && saved.followUp
          ? `\n${taskCount > 1 ? `${taskCount} follow-up tasks were` : 'A follow-up task was'} created for ${displayDateTime(saved.followUp)}.`
          : '';
        Alert.alert('Call remark saved', `The call status and lead type were updated.${task}`);
      }
    } catch (error: any) {
      // Already saved elsewhere (e.g. in the CRM): close the form instead of showing it again.
      if (error?.response?.status === 409 || error?.response?.data?.already_saved) {
        feedbackSheetRef.current?.hide();
        setCallFeedback(EMPTY_FEEDBACK);
        onFeedbackSavedRef.current?.();
        Alert.alert('Already saved', error?.response?.data?.message || 'The remark for this call was already saved.');
        return;
      }
      setFeedbackError(apiErrorMessage(error, 'Unable to save the call remark. Please try again.'));
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
              setTimeout(() => openCallFeedback(callLogId, {
                leadId: target.leadId,
                leadName: target.leadName,
                contactName: displayName,
                duration: statusData?.duration,
                leadStatusId: target.leadStatusId,
              }), 300);
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
  startCallRef.current = startCall;

  /** Ask "do you really want to call?" first, like the CRM. */
  const confirmAndCall = (target: PlivoCallTarget) => {
    Alert.alert(
      'Start call?',
      `Do you really want to call ${target.name || target.phone}?${canUsePlivoCalling ? '\nYour phone will ring first, then the contact is connected.' : ''}`,
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Call', onPress: () => startCall(target) }],
    );
  };

  const onAndroidPicked = (event: any, value?: Date) => {
    const mode = androidPicker;
    setAndroidPicker(null);
    if (event?.type === 'dismissed' || !value) return;
    if (mode === 'date') {
      const base = callFeedback.followUp || defaultFollowUp();
      const next = new Date(value);
      next.setHours(base.getHours(), base.getMinutes(), 0, 0);
      updateFeedback({ followUp: next });
      setTimeout(() => setAndroidPicker('time'), 250);
    } else {
      const base = new Date(callFeedback.followUp || defaultFollowUp());
      base.setHours(value.getHours(), value.getMinutes(), 0, 0);
      updateFeedback({ followUp: base });
    }
  };

  const callUi = (
    <>
      <ActionSheet ref={feedbackSheetRef} gestureEnabled={false} containerStyle={styles.feedbackSheetContainer} keyboardHandlerEnabled>
        <ScrollView style={styles.feedbackScroll} contentContainerStyle={styles.feedbackContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.feedbackHandle} />
          <View style={styles.feedbackHeader}>
            <View style={styles.feedbackHeaderCopy}>
              <AppText size={21} color="#202432" family="InterBold">Call Ended</AppText>
              <AppText size={14} color="#667085" family="InterMedium" style={styles.feedbackCustomer} numLines={2}>
                {callFeedback.contactName}{callFeedback.leadName && callFeedback.leadName !== callFeedback.contactName ? ` · ${callFeedback.leadName}` : ''} · {formatCallDuration(callFeedback.duration)}
              </AppText>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close call feedback" style={styles.closeButton} onPress={() => feedbackSheetRef.current?.hide()}>
              <AppText size={24} color="#566078">×</AppText>
            </Pressable>
          </View>

          {optionsLoading && !options.callStatuses.length ? <ActivityIndicator color={colors.blue} style={{ marginVertical: 18 }} /> : null}

          {options.callStatuses.length > 0 && (
            <>
              <AppText size={12} color="#566078" family="InterBold" style={styles.label}>CALL STATUS <AppText size={12} color="#E5485D" family="InterBold">*</AppText></AppText>
              <View style={styles.chipWrap}>
                {options.callStatuses.map(status => {
                  const active = String(status.id) === String(callFeedback.callStatusId);
                  const tint = OUTCOME_COLORS[status.key] || colors.blue;
                  return (
                    <Pressable
                      key={status.id}
                      onPress={() => updateFeedback({ callStatusId: status.id, channels: [], followUp: status.needs_follow_up ? (callFeedback.followUp || defaultFollowUp()) : null })}
                      style={[styles.chip, active && { borderColor: tint, backgroundColor: `${tint}1A` }]}
                    >
                      <View style={[styles.chipDot, { backgroundColor: tint }]} />
                      <AppText size={13} color={active ? '#202432' : '#566078'} family={active ? 'InterBold' : 'InterMedium'}>{status.label}</AppText>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {isCallDone && (
            <>
              <AppText size={12} color="#566078" family="InterBold" style={styles.label}>CUSTOMER WANTS DETAILS ON <AppText size={12} color="#E5485D" family="InterBold">*</AppText></AppText>
              <View style={styles.chipWrap}>
                {options.channels.map((channel: any) => {
                  const active = callFeedback.channels.includes(channel.key);
                  return (
                    <Pressable key={channel.key} onPress={() => toggleChannel(channel.key)} style={[styles.chip, active && styles.chipActive]}>
                      <View style={[styles.checkbox, active && styles.checkboxActive]}>{active ? <AppText size={10} color="white" family="InterBold">✓</AppText> : null}</View>
                      <AppText size={13} color={active ? '#202432' : '#566078'} family={active ? 'InterBold' : 'InterMedium'}>{channel.label}</AppText>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {needsFollowUp && (
            <>
              <AppText size={12} color="#566078" family="InterBold" style={styles.label}>
                {isCallBack ? 'CALL BACK ON' : 'SEND DETAILS ON'} <AppText size={12} color="#E5485D" family="InterBold">*</AppText>
              </AppText>
              {Platform.OS === 'ios' ? (
                <View style={styles.iosPickerRow}>
                  <DateTimePicker
                    value={callFeedback.followUp || defaultFollowUp()}
                    mode="datetime"
                    display="compact"
                    minimumDate={new Date()}
                    themeVariant="light"
                    onChange={(_, value) => value && updateFeedback({ followUp: value })}
                  />
                </View>
              ) : (
                <Pressable style={styles.dateField} onPress={() => setAndroidPicker('date')}>
                  <AppText size={15} color={callFeedback.followUp ? '#202432' : '#98A2B3'} family="InterSemiBold">
                    {callFeedback.followUp ? displayDateTime(callFeedback.followUp) : 'Choose date & time'}
                  </AppText>
                  <AppText size={13} color={colors.blue} family="InterBold">Change</AppText>
                </Pressable>
              )}
              <AppText size={12} color="#7E8799" family="InterRegular" style={styles.hint}>
                {!isCallBack && sendChannels.length > 1 ? `${sendChannels.length} follow-up tasks (one per channel) will be created for this time.` : 'A follow-up task will be created for this time.'}
              </AppText>
            </>
          )}

          <AppText size={12} color="#566078" family="InterBold" style={styles.label}>LEAD TYPE <AppText size={12} color="#E5485D" family="InterBold">*</AppText></AppText>
          <Dropdown
            style={styles.feedbackDropdown}
            data={options.leadTypes}
            labelField="label"
            valueField="value"
            value={callFeedback.leadTypeId}
            onChange={type => updateFeedback({ leadTypeId: type.value })}
            placeholder={optionsLoading ? 'Loading...' : 'Select lead type'}
            placeholderStyle={styles.feedbackPlaceholder}
            selectedTextStyle={styles.feedbackSelectedText}
            dropdownPosition="auto"
            disable={optionsLoading}
          />

          <AppText size={12} color="#566078" family="InterBold" style={styles.label}>
            REMARK <AppText size={12} color="#E5485D" family="InterBold">*</AppText>
          </AppText>
          <TextInput
            value={callFeedback.remark}
            onChangeText={remark => updateFeedback({ remark })}
            placeholder="What happened on this call?"
            placeholderTextColor="#98A2B3"
            multiline
            maxLength={1000}
            textAlignVertical="top"
            style={styles.feedbackNotesInput}
          />

          {feedbackError ? (
            <View style={styles.errorBox}>
              <AppText size={13} color="#B42318" family="InterMedium" style={{ flex: 1 }}>{feedbackError}</AppText>
              {!options.callStatuses.length && !optionsLoading ? (
                <Pressable onPress={loadOptions}><AppText size={13} color={colors.blue} family="InterBold">Retry</AppText></Pressable>
              ) : null}
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={feedbackSubmitting}
            onPress={submitCallFeedback}
            style={({ pressed }) => [styles.feedbackSubmit, feedbackSubmitting && styles.feedbackSubmitDisabled, pressed && styles.feedbackSubmitPressed]}
          >
            {feedbackSubmitting
              ? <ActivityIndicator color="white" size="small" />
              : <AppText size={16} color="white" family="InterBold">Save Call Remark</AppText>}
          </Pressable>
        </ScrollView>
        {Platform.OS === 'android' && androidPicker ? (
          <DateTimePicker
            value={callFeedback.followUp || defaultFollowUp()}
            mode={androidPicker}
            minimumDate={androidPicker === 'date' ? new Date() : undefined}
            onChange={onAndroidPicked}
          />
        ) : null}
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
    confirmAndCall,
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
  feedbackScroll: { maxHeight: 640 },
  feedbackContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 34 : 24 },
  feedbackHandle: { width: 72, height: 5, borderRadius: 3, backgroundColor: '#CCD5E4', alignSelf: 'center', marginBottom: 18 },
  feedbackHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  feedbackHeaderCopy: { flex: 1 },
  feedbackCustomer: { marginTop: 5 },
  label: { marginTop: 18, marginBottom: 9, letterSpacing: 0.3 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: '#D5DDEA', backgroundColor: '#F8FAFD' },
  chipActive: { borderColor: colors.blue, backgroundColor: '#EEF3FF' },
  chipDot: { width: 9, height: 9, borderRadius: 5 },
  checkbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, borderColor: '#AEB8CA', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  iosPickerRow: { alignItems: 'flex-start' },
  dateField: { height: 52, borderWidth: 1.5, borderColor: '#C9D4E5', borderRadius: 13, paddingHorizontal: 15, backgroundColor: '#F8FAFD', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hint: { marginTop: 6 },
  feedbackDropdown: { height: 52, borderWidth: 1.5, borderColor: '#C9D4E5', borderRadius: 13, paddingHorizontal: 15, backgroundColor: '#F8FAFD' },
  feedbackPlaceholder: { color: '#98A2B3', fontSize: 15, fontFamily: fonts.InterMedium },
  feedbackSelectedText: { color: '#202432', fontSize: 15, fontFamily: fonts.InterSemiBold },
  feedbackNotesInput: { minHeight: 104, maxHeight: 160, borderWidth: 1.5, borderColor: '#C9D4E5', borderRadius: 13, backgroundColor: '#F8FAFD', paddingHorizontal: 15, paddingTop: 13, paddingBottom: 13, color: '#202432', fontSize: 15, lineHeight: 21, fontFamily: fonts.InterRegular },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, padding: 11, borderRadius: 10, backgroundColor: '#FEF3F2' },
  feedbackSubmit: { height: 54, marginTop: 18, borderRadius: 14, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  feedbackSubmitDisabled: { backgroundColor: '#B8C4D8' },
  feedbackSubmitPressed: { opacity: 0.86 },
});
