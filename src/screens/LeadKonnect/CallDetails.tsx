import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import AppText from '../../components/AppText/AppText';
import { generateCallTranscriptApi, getCallLogApi, getCallTranscriptApi, getLeadDetailsApi } from '../../api/query/LeadApi';
import { colors } from '../../utils/Colors';

const shown = (value: any, fallback = 'Not available') => String(value || '').trim() || fallback;

const durationLabel = (seconds: number) => {
  const value = Number(seconds || 0);
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = value % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const dateLabel = (value?: string) => value
  ? new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : 'Not available';

const CallDetails = ({ route, navigation }: any) => {
  // Opened with the call from Call History, or with only its ID from Lead Activity.
  const callLogId = route?.params?.callLogId;
  const [fetchedCall, setFetchedCall] = useState<any>(null);
  const call = route?.params?.call || fetchedCall || {};
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (route?.params?.call || !callLogId) return;
    getCallLogApi(callLogId)
      .then(response => setFetchedCall(response?.data?.data || null))
      .catch((error: any) => {
        setLoading(false);
        Alert.alert('Unable to load call', error?.response?.data?.message || 'Call details could not be loaded.');
      });
  }, [callLogId, route?.params?.call]);

  const loadLead = useCallback(async () => {
    if (!call?.lead_id) {
      if (!callLogId || fetchedCall || route?.params?.call) setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await getLeadDetailsApi(call.lead_id);
      setLead(response?.data?.data || null);
    } catch (error: any) {
      Alert.alert('Unable to load customer', error?.response?.data?.message || 'Customer details could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [call?.lead_id, callLogId, fetchedCall, route?.params?.call]);

  useFocusEffect(useCallback(() => { loadLead(); }, [loadLead]));

  const [transcript, setTranscript] = useState<any>({ status: 'not_requested', conversation: [], transcript: null });
  const [transcriptBusy, setTranscriptBusy] = useState(false);
  const transcriptPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadTranscript = useCallback(async () => {
    if (!call?.id || !call?.recording_play_url) return;
    try {
      const response = await getCallTranscriptApi(call.id);
      setTranscript(response?.data?.data || { status: 'not_requested', conversation: [] });
    } catch {
      // Transcript is optional on this screen; the rest of the details still show.
    }
  }, [call?.id, call?.recording_play_url]);

  useFocusEffect(useCallback(() => { loadTranscript(); }, [loadTranscript]));

  // While a transcript is being generated, check again every 5 seconds.
  useEffect(() => {
    if (transcript.status !== 'processing') return;
    transcriptPollRef.current = setTimeout(loadTranscript, 5000);
    return () => {
      if (transcriptPollRef.current) clearTimeout(transcriptPollRef.current);
    };
  }, [transcript, loadTranscript]);

  const startTranscript = async (regenerate = false) => {
    if (!call?.id || transcriptBusy) return;
    try {
      setTranscriptBusy(true);
      const response = await generateCallTranscriptApi(call.id, regenerate);
      setTranscript(response?.data?.data || { status: 'processing', conversation: [] });
      if (response?.data?.success === false) Alert.alert('Transcript', response?.data?.message || 'Transcript could not be generated. Please try again.');
    } catch (error: any) {
      Alert.alert('Transcript', error?.response?.data?.message || 'Transcript could not be generated. Please try again.');
    } finally {
      setTranscriptBusy(false);
    }
  };

  const confirmRegenerate = () => Alert.alert('Regenerate transcript?', 'The current transcript will be replaced.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Regenerate', onPress: () => startTranscript(true) },
  ]);

  const customerName = shown(lead?.contact_name || lead?.contact?.name || call?.customer_name, 'Unknown customer');
  const companyName = shown(lead?.company_name || lead?.name || call?.company_name, 'Unknown firm');
  const phone = shown(lead?.phone_number || lead?.contact?.phone_number || call?.number);
  const initial = customerName.split(/\s+/).map((part: string) => part[0]).join('').slice(0, 2).toUpperCase();
  const leadStatus = shown(lead?.status?.display_name || lead?.status_name || lead?.status, 'Pending');

  const callNumber = () => Linking.openURL(`tel:${String(phone).replace(/\s+/g, '')}`).catch(() => Alert.alert('Unable to call', 'Phone application is unavailable.'));
  const playRecording = () => call?.recording_play_url && Linking.openURL(call.recording_play_url).catch(() => Alert.alert('Playback failed', 'Unable to open this recording.'));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}><AppText size={23} color="white" family="InterBold">{initial || 'C'}</AppText></View>
        <AppText size={21} color="#17233A" family="InterBold" style={styles.customerName}>{customerName}</AppText>
        <AppText size={14} color="#69758C" family="InterMedium" style={styles.companyName}>{companyName}</AppText>
        {call?.lead_id ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open lead details"
            style={({ pressed }) => [styles.leadBadge, styles.leadBadgeLink, pressed && { opacity: 0.7 }]}
            onPress={() => navigation.navigate('LeadDetails', { lead: { ...(lead || {}), id: call.lead_id } })}
          >
            <AppText size={11} color={colors.blue} family="InterBold">{leadStatus.toUpperCase()}</AppText>
            <AppText size={13} color={colors.blue} family="InterBold">›</AppText>
          </Pressable>
        ) : <View style={styles.leadBadge}><AppText size={11} color={colors.blue} family="InterBold">{leadStatus.toUpperCase()}</AppText></View>}
      </View>

      {loading ? <ActivityIndicator size="large" color={colors.blue} style={styles.loader} /> : (
        <>
          <Section title="Customer Information">
            <DetailRow label="Firm Name" value={companyName} />
            <DetailRow label="Mobile Number" value={phone} />
            <DetailRow label="Email" value={shown(lead?.email || lead?.contact?.email)} />
            <DetailRow label="City" value={shown(lead?.city)} />
            <AddressRow label="Address" value={shown(lead?.address || lead?.location_address)} />
            <DetailRow label="Lead Source" value={shown(lead?.lead_source || lead?.lead_source_lead)} last />
          </Section>

          <Section title="Call Information">
            <DetailRow label="Call Direction" value={call?.direction === 'inbound' ? 'Inbound' : 'Outbound'} />
            <DetailRow label="Call Date & Time" value={dateLabel(call?.started_at)} />
            <DetailRow label="Call Status" value={call?.connected ? 'Connected' : 'Not Connected'} valueColor={call?.connected ? '#07865E' : '#C73C52'} />
            <DetailRow label="Call Duration" value={durationLabel(call?.duration)} />
            <DetailRow label="Contact Number" value={shown(call?.number)} />
            <DetailRow label="Recording" value={call?.recording_play_url ? 'Available' : 'Not available'} last />
            {call?.remark ? <View style={styles.noteBox}><AppText size={12} color="#748099" family="InterSemiBold">CALL NOTE</AppText><AppText size={14} color="#344159" family="InterMedium" style={styles.noteText}>{call.remark}</AppText></View> : null}
          </Section>

          {call?.recording_play_url ? (
            <Section title="Call Transcript">
              <View style={styles.transcriptBody}>
                {transcript.status === 'completed' ? (
                  transcript.conversation?.length ? transcript.conversation.map((line: any, index: number) => {
                    const alt = Number(line.speaker) % 2 === 0;
                    return (
                      <View key={`${index}-${line.speaker}`} style={[styles.transcriptRow, alt && styles.transcriptRowAlt]}>
                        <View style={[styles.speakerAvatar, alt && styles.speakerAvatarAlt]}><AppText size={11} color={alt ? '#0F8A6A' : colors.blue} family="InterBold">S{line.speaker}</AppText></View>
                        <View style={[styles.transcriptBubble, alt && styles.transcriptBubbleAlt]}>
                          <AppText size={10} color={alt ? '#0F8A6A' : colors.blue} family="InterBold" align={alt ? 'right' : 'left'}>
                            SPEAKER {line.speaker}{line.start !== null && line.start !== undefined ? `  ·  ${transcriptTime(line.start)}` : ''}
                          </AppText>
                          <AppText size={13} color="#344159" family="InterMedium" style={styles.transcriptText}>{line.text}</AppText>
                        </View>
                      </View>
                    );
                  }) : <AppText size={13} color="#748099" family="InterMedium">{transcript.transcript || 'No transcript returned.'}</AppText>
                ) : transcript.status === 'processing' ? (
                  <View style={styles.transcriptStatus}>
                    <ActivityIndicator size="small" color={colors.blue} />
                    <AppText size={13} color="#748099" family="InterMedium">Generating transcript. It will appear here automatically.</AppText>
                  </View>
                ) : (
                  <AppText size={13} color="#748099" family="InterMedium">
                    {transcript.status === 'failed' ? 'Transcript could not be generated. Please try again.' : 'Transcript has not been generated yet.'}
                  </AppText>
                )}
              </View>
            </Section>
          ) : null}

          <View style={styles.actions}>
            <Pressable style={styles.callButton} onPress={callNumber}>
              <PhoneIcon color="white" />
              <AppText size={15} color="white" family="InterBold">Call Customer</AppText>
            </Pressable>
            {call?.recording_play_url ? (
              <Pressable style={styles.recordingButton} onPress={playRecording}>
                <AppText size={15} color={colors.blue} family="InterBold">▶ Play Recording</AppText>
              </Pressable>
            ) : null}
            {call?.recording_play_url && transcript.status !== 'processing' ? (
              <Pressable
                style={[styles.recordingButton, transcriptBusy && styles.buttonDisabled]}
                disabled={transcriptBusy}
                onPress={() => (transcript.status === 'completed' ? confirmRegenerate() : startTranscript())}
              >
                {transcriptBusy ? <ActivityIndicator size="small" color={colors.blue} /> : (
                  <AppText size={15} color={colors.blue} family="InterBold">
                    {transcript.status === 'completed' ? '↻ Regenerate Transcript' : transcript.status === 'failed' ? '↻ Retry Transcript' : '✦ Generate Transcript'}
                  </AppText>
                )}
              </Pressable>
            ) : null}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const transcriptTime = (seconds: any) => {
  const value = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
};

const Section = ({ title, children }: any) => <View style={styles.sectionWrap}><AppText size={12} color="#748099" family="InterBold" style={styles.sectionTitle}>{title.toUpperCase()}</AppText><View style={styles.sectionCard}>{children}</View></View>;

const DetailRow = ({ label, value, valueColor = '#24334D', last = false }: any) => <View style={[styles.detailRow, last && styles.detailRowLast]}><AppText size={13} color="#7B879D" family="InterMedium" style={styles.detailLabel}>{label}</AppText><AppText size={13} color={valueColor} family="InterSemiBold" align="right" style={styles.detailValue}>{value}</AppText></View>;

const AddressRow = ({ label, value }: any) => (
  <View style={[styles.detailRow, styles.addressRow]}>
    <AppText size={13} color="#7B879D" family="InterMedium" style={styles.detailLabel}>{label}</AppText>
    <ScrollView
      style={styles.addressScroll}
      contentContainerStyle={styles.addressScrollContent}
      nestedScrollEnabled
      showsVerticalScrollIndicator={value.length > 70}
    >
      <AppText size={13} color="#24334D" family="InterSemiBold" align="right" lineHeight={19}>{value}</AppText>
    </ScrollView>
  </View>
);

const PhoneIcon = ({ color }: { color: string }) => <Svg width={19} height={19} viewBox="0 0 24 24" fill="none"><Path d="M6.62 10.79a15.46 15.46 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" fill={color} /></Svg>;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F6FB' }, content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 36 },
  profileCard: { alignItems: 'center', paddingVertical: 14 }, avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: colors.blue, shadowOffset: { width: 0, height: 3 }, shadowOpacity: .2, shadowRadius: 7 },
  customerName: { marginTop: 10 }, companyName: { marginTop: 3 }, leadBadgeLink: { flexDirection: 'row', alignItems: 'center', gap: 5 }, leadBadge: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, backgroundColor: '#E9F2FF', borderWidth: 1, borderColor: '#B9D2F4' }, loader: { marginTop: 45 },
  sectionWrap: { marginTop: 11 }, sectionTitle: { marginBottom: 7, marginLeft: 2, letterSpacing: .6 }, sectionCard: { borderRadius: 16, borderWidth: 1, borderColor: '#D8E4F4', backgroundColor: 'white', paddingHorizontal: 14, shadowColor: '#24446F', shadowOffset: { width: 0, height: 3 }, shadowOpacity: .05, shadowRadius: 8, elevation: 1 },
  detailRow: { minHeight: 46, borderBottomWidth: 1, borderBottomColor: '#EBF0F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, detailRowLast: { borderBottomWidth: 0 }, detailLabel: { flex: .78 }, detailValue: { flex: 1.22 },
  addressRow: { minHeight: 72, alignItems: 'flex-start', paddingVertical: 10 }, addressScroll: { flex: 1.22, maxHeight: 57 }, addressScrollContent: { flexGrow: 1, justifyContent: 'center' },
  noteBox: { marginVertical: 11, borderRadius: 12, backgroundColor: '#F1F6FD', padding: 12 }, noteText: { marginTop: 5, lineHeight: 19 },
  transcriptBody: { paddingVertical: 12, gap: 10 }, transcriptStatus: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  transcriptRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, transcriptRowAlt: { flexDirection: 'row-reverse' },
  speakerAvatar: { width: 30, height: 30, borderRadius: 9, borderWidth: 1, borderColor: '#B9D2F4', backgroundColor: '#EAF3FF', alignItems: 'center', justifyContent: 'center' }, speakerAvatarAlt: { borderColor: '#A7E3D2', backgroundColor: '#E7F9F3' },
  transcriptBubble: { flex: 1, maxWidth: '86%', borderRadius: 12, borderTopLeftRadius: 4, backgroundColor: '#F1F6FD', padding: 10 }, transcriptBubbleAlt: { borderTopLeftRadius: 12, borderTopRightRadius: 4, backgroundColor: '#EEF9F5' },
  transcriptText: { marginTop: 4, lineHeight: 19 }, buttonDisabled: { opacity: 0.6 },
  actions: { marginTop: 16, gap: 9 }, callButton: { height: 52, borderRadius: 14, backgroundColor: colors.blue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, elevation: 2, shadowColor: colors.blue, shadowOffset: { width: 0, height: 3 }, shadowOpacity: .18, shadowRadius: 6 }, recordingButton: { height: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.blue, backgroundColor: '#EAF3FF', alignItems: 'center', justifyContent: 'center' },
});

export default CallDetails;
