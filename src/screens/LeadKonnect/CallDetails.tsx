import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import AppText from '../../components/AppText/AppText';
import { getLeadDetailsApi } from '../../api/query/LeadApi';
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

const CallDetails = ({ route }: any) => {
  const call = route?.params?.call || {};
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadLead = useCallback(async () => {
    if (!call?.lead_id) {
      setLoading(false);
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
  }, [call?.lead_id]);

  useFocusEffect(useCallback(() => { loadLead(); }, [loadLead]));

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
        <View style={styles.leadBadge}><AppText size={11} color={colors.blue} family="InterBold">{leadStatus.toUpperCase()}</AppText></View>
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
            <DetailRow label="Call Date & Time" value={dateLabel(call?.started_at)} />
            <DetailRow label="Call Status" value={call?.connected ? 'Connected' : 'Not Connected'} valueColor={call?.connected ? '#07865E' : '#C73C52'} />
            <DetailRow label="Call Duration" value={durationLabel(call?.duration)} />
            <DetailRow label="Contact Number" value={shown(call?.number)} />
            <DetailRow label="Recording" value={call?.recording_play_url ? 'Available' : 'Not available'} last />
            {call?.remark ? <View style={styles.noteBox}><AppText size={12} color="#748099" family="InterSemiBold">CALL NOTE</AppText><AppText size={14} color="#344159" family="InterMedium" style={styles.noteText}>{call.remark}</AppText></View> : null}
          </Section>

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
          </View>
        </>
      )}
    </ScrollView>
  );
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
  customerName: { marginTop: 10 }, companyName: { marginTop: 3 }, leadBadge: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, backgroundColor: '#E9F2FF', borderWidth: 1, borderColor: '#B9D2F4' }, loader: { marginTop: 45 },
  sectionWrap: { marginTop: 11 }, sectionTitle: { marginBottom: 7, marginLeft: 2, letterSpacing: .6 }, sectionCard: { borderRadius: 16, borderWidth: 1, borderColor: '#D8E4F4', backgroundColor: 'white', paddingHorizontal: 14, shadowColor: '#24446F', shadowOffset: { width: 0, height: 3 }, shadowOpacity: .05, shadowRadius: 8, elevation: 1 },
  detailRow: { minHeight: 46, borderBottomWidth: 1, borderBottomColor: '#EBF0F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, detailRowLast: { borderBottomWidth: 0 }, detailLabel: { flex: .78 }, detailValue: { flex: 1.22 },
  addressRow: { minHeight: 72, alignItems: 'flex-start', paddingVertical: 10 }, addressScroll: { flex: 1.22, maxHeight: 57 }, addressScrollContent: { flexGrow: 1, justifyContent: 'center' },
  noteBox: { marginVertical: 11, borderRadius: 12, backgroundColor: '#F1F6FD', padding: 12 }, noteText: { marginTop: 5, lineHeight: 19 },
  actions: { marginTop: 16, gap: 9 }, callButton: { height: 52, borderRadius: 14, backgroundColor: colors.blue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, elevation: 2, shadowColor: colors.blue, shadowOffset: { width: 0, height: 3 }, shadowOpacity: .18, shadowRadius: 6 }, recordingButton: { height: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.blue, backgroundColor: '#EAF3FF', alignItems: 'center', justifyContent: 'center' },
});

export default CallDetails;
