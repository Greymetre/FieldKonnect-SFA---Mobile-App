import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';
import { Dropdown } from 'react-native-element-dropdown';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { PlusAddIcon } from '../../assets/svgs/SvgsFile';
import { getClickToCallStatusApi, getLeadsApi, getLeadStatusSourceApi, initiateClickToCallApi } from '../../api/query/LeadApi';
import AppText from '../../components/AppText/AppText';
import CustomerCalendar from '../../components/CustomCalendar/CalendarPopupView';
import { colors } from '../../utils/Colors';
import { fonts } from '../../utils/typography';
import { useAppSelector } from '../../components/redux/Store';

const formatYYYYMMDD = (date: Date | null) => {
  if (!date) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatDisplayDate = (date: Date | null) => date
  ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '';

const cleanPhoneNumber = (value: any) => String(value || '').replace(/[^0-9]/g, '');

const getLeadLocation = (item: any) => {
  const gpsOrLocation = String(item?.location_address || '').trim();
  if (gpsOrLocation && gpsOrLocation.toLowerCase() !== 'n/a') return gpsOrLocation;
  return String(item?.address || '').trim();
};

const openDialer = async (phone: any) => {
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

const openMail = (email: any) => {
  const address = String(email || '').trim();
  if (address) Linking.openURL(`mailto:${address}`).catch(() => {});
};

const openWhatsApp = (phone: any) => {
  let number = cleanPhoneNumber(phone);
  if (number.length === 10) number = `91${number}`;
  if (!number) return;
  Linking.openURL(`whatsapp://send?phone=${number}`).catch(() =>
    Linking.openURL(`https://wa.me/${number}`).catch(() => {}),
  );
};

const openLocation = async (location: string) => {
  if (!location) return;
  const query = encodeURIComponent(location);
  const nativeUrl = `maps://?q=${query}`;
  const webUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
  try {
    const supported = await Linking.canOpenURL(nativeUrl);
    await Linking.openURL(supported ? nativeUrl : webUrl);
  } catch {
    Linking.openURL(webUrl).catch(() => {});
  }
};

const toPlivoE164 = (phone: string) => {
  const digits = cleanPhoneNumber(phone);
  if (!digits) return '';
  if (digits.length > 10) return `+${digits}`;
  return `+91${digits}`;
};

const LeadKonnect = ({ navigation }: any) => {
  const { user } = useAppSelector(state => state.auth);
  const canUsePlivoCalling = user?.call_management === true || Number(user?.call_management) === 1;
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [leads, setLeads] = useState<any[]>([]);
  const [counts, setCounts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<any>(-1);
  const [selectedUser, setSelectedUser] = useState<any>('');
  const [selectedSource, setSelectedSource] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [draftUser, setDraftUser] = useState<any>('');
  const [draftSource, setDraftSource] = useState('');
  const [draftStartDate, setDraftStartDate] = useState<Date | null>(null);
  const [draftEndDate, setDraftEndDate] = useState<Date | null>(null);
  const [showCal, setShowCal] = useState(false);
  const [rangeType, setRangeType] = useState('custom');
  const filterSheetRef = useRef<ActionSheetRef>(null);
  const [callingLeadIds, setCallingLeadIds] = useState<Set<number | string>>(new Set());
  const [callWaiting, setCallWaiting] = useState({ visible: false, leadName: '', phase: 'Connecting to Plivo...' });
  const callPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: canUsePlivoCalling ? () => (
        <Pressable accessibilityRole="button" accessibilityLabel="Open call history" style={styles.headerCallButton} onPress={() => navigation.navigate('CallHistory')}>
          <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
            <Path d="M6.62 10.79a15.46 15.46 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" fill={colors.blue} />
          </Svg>
        </Pressable>
      ) : undefined,
    });
  }, [canUsePlivoCalling, navigation]);

  const closeCallWaiting = useCallback(() => {
    if (callPollRef.current) clearInterval(callPollRef.current);
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    callPollRef.current = null;
    callTimeoutRef.current = null;
    setCallWaiting(prev => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => closeCallWaiting, [closeCallWaiting]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    getLeadStatusSourceApi().then(response => {
      const data = response?.data?.data || {};
      setUsers(data?.users || []);
      setSources(data?.source || []);
    }).catch(error => console.log('Lead filter options error:', error?.response || error));
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { pageSize: 100 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedUser) params.user_id = selectedUser;
      if (selectedSource) params.lead_source = selectedSource;
      if (selectedStatus !== -1) params.status = selectedStatus;
      if (startDate && endDate) {
        params.start_date = formatYYYYMMDD(startDate);
        params.end_date = formatYYYYMMDD(endDate);
      }
      const response = await getLeadsApi(params);
      const payload = response?.data || {};
      const listPayload = payload?.data;
      setLeads(Array.isArray(listPayload) ? listPayload : (listPayload?.data || []));
      setCounts(payload?.counts || []);
    } catch (error: any) {
      console.log('Lead listing error:', error?.response || error);
      setLeads([]);
      setCounts([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, endDate, selectedSource, selectedStatus, selectedUser, startDate]);

  useFocusEffect(useCallback(() => {
    fetchLeads();
  }, [fetchLeads]));

  const userOptions = useMemo(() => [
    { label: 'All Users', value: '' },
    ...users.map(item => ({ label: item?.name || `User ${item?.id}`, value: item?.id })),
  ], [users]);
  const sourceOptions = useMemo(() => [
    { label: 'All Sources', value: '' },
    ...sources.map(item => ({ label: item?.value || item?.key, value: item?.key || item?.value })),
  ], [sources]);
  const activeFilterCount = Number(Boolean(selectedUser)) + Number(Boolean(selectedSource)) + Number(Boolean(startDate && endDate));

  const setCallingState = (leadId: string | number, isCalling: boolean) => {
    setCallingLeadIds(prev => {
      const next = new Set(prev);
      if (isCalling) {
        next.add(leadId);
      } else {
        next.delete(leadId);
      }
      return next;
    });
  };

  const handlePlivoCall = async (item: any) => {
    const phone = toPlivoE164(item?.contact?.phone_number || item?.phone || '');
    if (!phone) return;

    if (!canUsePlivoCalling) {
      openDialer(phone);
      return;
    }

    const leadId = item?.id || item?.lead_id || 'lead';
    setCallingState(leadId, true);
    setCallWaiting({
      visible: true,
      leadName: item?.contact?.name || item?.name || 'Customer',
      phase: 'Connecting to Plivo...',
    });

    try {
      const payload = {
        to: phone,
        lead_id: item?.id,
        lead_name: item?.name || item?.contact?.name || '',
      };
      const response = await initiateClickToCallApi(payload);
      const callLogId = response?.data?.data?.call_log_id;
      setCallWaiting(prev => ({ ...prev, phase: 'Please wait. Your phone will ring shortly.' }));

      if (!callLogId) {
        callTimeoutRef.current = setTimeout(closeCallWaiting, 8000);
        return;
      }

      callPollRef.current = setInterval(async () => {
        try {
          const statusResponse = await getClickToCallStatusApi(callLogId);
          const callStatus = String(statusResponse?.data?.data?.status || '').toLowerCase();
          const isAnswered = Boolean(statusResponse?.data?.data?.answered);
          if (callStatus.includes('ring') || isAnswered || callStatus === 'agent-answered') {
            setCallWaiting(prev => ({ ...prev, phase: 'Your phone is ringing...' }));
            setTimeout(closeCallWaiting, 700);
          } else if (['failed', 'busy', 'cancel', 'timeout'].includes(callStatus)) {
            closeCallWaiting();
            Alert.alert('Call unavailable', 'The call could not be connected. Please try again.');
          }
        } catch (_) {
          // Ignore a transient polling failure and retry on the next interval.
        }
      }, 1500);

      callTimeoutRef.current = setTimeout(() => {
        closeCallWaiting();
        Alert.alert('Still waiting?', 'The call is taking longer than expected. Please try again if your phone does not ring.');
      }, 45000);
    } catch (error: any) {
      closeCallWaiting();
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
    } finally {
      setCallingState(leadId, false);
    }
  };

  const openFilters = () => {
    setDraftUser(selectedUser);
    setDraftSource(selectedSource);
    setDraftStartDate(startDate);
    setDraftEndDate(endDate);
    filterSheetRef.current?.show();
  };

  const clearFilters = () => {
    setDraftUser('');
    setDraftSource('');
    setDraftStartDate(null);
    setDraftEndDate(null);
    setSelectedUser('');
    setSelectedSource('');
    setStartDate(null);
    setEndDate(null);
    filterSheetRef.current?.hide();
  };

  const applyFilters = () => {
    setSelectedUser(draftUser);
    setSelectedSource(draftSource);
    setStartDate(draftStartDate);
    setEndDate(draftEndDate);
    filterSheetRef.current?.hide();
  };

  const openDateCalendar = () => {
    filterSheetRef.current?.hide();
    setTimeout(() => setShowCal(true), 300);
  };

  const setCalendarVisibility = (visible: boolean) => {
    setShowCal(visible);
    if (!visible) setTimeout(() => filterSheetRef.current?.show(), 250);
  };

  return (
    <View style={styles.container}>
      <View style={styles.listContent}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <LeadListIcon type="search" />
            <TextInput value={search} onChangeText={setSearch} placeholder="Search leads" placeholderTextColor="#7A8499" style={styles.searchInput} />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="View opportunities" style={styles.opportunityButton} onPress={() => navigation.navigate('OpportunityList')}>
            <LeadListIcon type="opportunity" color="white" size={23} />
          </Pressable>
          <Pressable style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]} onPress={openFilters}>
            <LeadListIcon type="filter" color="white" />
            {activeFilterCount > 0 && <View style={styles.filterCount}><AppText size={10} color={colors.blue} family="InterBold">{activeFilterCount}</AppText></View>}
          </Pressable>
        </View>

        <ScrollView horizontal style={styles.statusScroll} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryRow}>
          {counts.map(item => (
            <SummaryCard
              key={`${item.id}-${item.display_name}`}
              count={item.count || 0}
              label={item.display_name || 'Status'}
              active={selectedStatus === item.id}
              onPress={() => setSelectedStatus(item.id)}
            />
          ))}
        </ScrollView>

        <View style={styles.sectionTitleRow}>
          <AppText size={17} color="#202432" family="InterBold">Lead List</AppText>
          <AppText size={13} color={colors.blue} family="InterSemiBold">{leads.length} leads</AppText>
        </View>

        <ScrollView style={styles.leadListScroll} contentContainerStyle={styles.leadListContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {loading ? <View style={styles.loadingBox}><ActivityIndicator size="large" color={colors.blue} /></View> : leads.length ? leads.map(item => <LeadCard key={item.id} item={item} navigation={navigation} onCallPress={handlePlivoCall} isCalling={callingLeadIds.has(item.id || item?.lead_id)} />) : (
            <View style={styles.noSearchResults}>
              <AppText size={15} color="#718096" family="InterMedium">No matching leads</AppText>
            </View>
          )}
        </ScrollView>
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel="Create new lead" style={styles.fab} onPress={() => navigation.navigate('CreateLead')}>
        <PlusAddIcon color="white" />
      </Pressable>

      <ActionSheet ref={filterSheetRef} gestureEnabled containerStyle={styles.sheetContainer}>
        <View style={styles.sheetContent}>
          <View style={styles.sheetHeader}>
            <AppText size={19} color="#202432" family="InterBold">Filter Leads</AppText>
            <Pressable style={styles.closeButton} onPress={() => filterSheetRef.current?.hide()}><AppText size={24} color="#566078">×</AppText></Pressable>
          </View>
          <AppText size={13} color="#566078" family="InterSemiBold" style={styles.filterLabel}>User</AppText>
          <Dropdown style={styles.dropdown} data={userOptions} labelField="label" valueField="value" value={draftUser} onChange={item => setDraftUser(item.value)} placeholder="Select user" placeholderStyle={styles.placeholder} selectedTextStyle={styles.selectedText} />
          <AppText size={13} color="#566078" family="InterSemiBold" style={styles.filterLabel}>Lead Source</AppText>
          <Dropdown style={styles.dropdown} data={sourceOptions} labelField="label" valueField="value" value={draftSource} onChange={item => setDraftSource(item.value)} placeholder="Select source" placeholderStyle={styles.placeholder} selectedTextStyle={styles.selectedText} />
          <AppText size={13} color="#566078" family="InterSemiBold" style={styles.filterLabel}>Date Range</AppText>
          <Pressable style={styles.dateField} onPress={openDateCalendar}>
            <LeadListIcon type="calendar" />
            <AppText size={14} color={draftStartDate && draftEndDate ? '#202432' : '#7A8499'} family="InterMedium">
              {draftStartDate && draftEndDate ? `${formatDisplayDate(draftStartDate)} - ${formatDisplayDate(draftEndDate)}` : 'Select date range'}
            </AppText>
          </Pressable>
          <View style={styles.sheetActions}>
            <Pressable style={styles.clearButton} onPress={clearFilters}><AppText size={15} color={colors.blue} family="InterBold">Clear</AppText></Pressable>
            <Pressable style={styles.applyButton} onPress={applyFilters}><AppText size={15} color="white" family="InterBold">Apply Filters</AppText></Pressable>
          </View>
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
      <CustomerCalendar showCal={showCal} setShowCal={setCalendarVisibility} range={rangeType} minimumDate={null} initialStartDate={draftStartDate} initialEndDate={draftEndDate} setRange={setRangeType} onApplyClick={(start, end, type) => { setDraftStartDate(start); setDraftEndDate(end); setRangeType(type || 'custom'); }} />
    </View>
  );
};

const SummaryCard = ({ count, label, active = false, onPress }: any) => (
  <Pressable style={[styles.summaryCard, active && styles.summaryCardActive]} onPress={onPress}>
    <AppText size={19} color={active ? 'white' : colors.blue} family="InterBold">{count}</AppText>
    <AppText size={13} color={active ? 'white' : '#566078'} family="InterSemiBold" style={styles.summaryLabel}>{label}</AppText>
  </Pressable>
);

const LeadCard = ({ item, navigation, onCallPress, isCalling = false }: any) => {
  const phone = cleanPhoneNumber(item?.contact?.phone_number);
  const email = String(item?.contact?.email || '').trim();
  const location = getLeadLocation(item);

  return (
  <View style={styles.leadCard}>
    <View style={styles.cardHeader}>
      <View style={{ flex: 1 }}>
        <AppText size={17} color={colors.blue} family="InterBold" numLines={1}>{item?.name || 'Unnamed firm'}</AppText>
        <AppText size={14} color="#3D4659" family="InterMedium" numLines={1} style={{ marginTop: 5 }}>{item?.contact?.name || 'No contact name'}</AppText>
      </View>
      <View style={styles.statusBadge}>
        <AppText size={13} color="white" family="InterSemiBold">{item?.status?.display_name || 'Pending'}</AppText>
      </View>
    </View>

    <View style={styles.divider} />
    <View style={styles.infoRow}>
      <InfoCell icon="phone" text={item?.contact?.phone_number || 'No mobile'} />
      <InfoCell icon="city" text={item?.city || 'No city'} />
    </View>
    <View style={styles.divider} />
    <View style={styles.infoRow}>
      <InfoCell icon="source" text={item?.lead_source_lead || item?.contact?.lead_source || 'No source'} />
      <InfoCell icon="opportunity" text={item?.opportunity_status || 'Opportunity'} placeholder={!item?.opportunity_status} />
    </View>
    <View style={styles.divider} />
    <View style={styles.noteRow}>
      <LeadListIcon type="note" />
      <AppText size={14} color="#50596D" family="InterRegular" style={{ flex: 1 }}>{item?.note || 'No note added'}</AppText>
    </View>
    <View style={styles.divider} />

    <View style={styles.actionRow}>
      <ActionButton icon="phone" disabled={!phone || isCalling} loading={isCalling} onPress={() => onCallPress(item)} />
      <ActionButton icon="email" disabled={!email} onPress={() => openMail(email)} />
      <ActionButton icon="whatsapp" disabled={!phone} onPress={() => openWhatsApp(phone)} />
      <ActionButton icon="location" disabled={!location} onPress={() => openLocation(location)} />
      <ActionButton icon="view" onPress={() => navigation.navigate('LeadDetails', { lead: item })} />
    </View>
  </View>
  );
};

const InfoCell = ({ icon, text, placeholder = false }: any) => (
  <View style={styles.infoCell}><LeadListIcon type={icon} color={placeholder ? '#A9B0BF' : colors.blue} /><AppText size={14} color={placeholder ? '#A9B0BF' : '#50596D'} family={placeholder ? 'InterRegular' : 'InterMedium'} numLines={1} style={{ flex: 1 }}>{text}</AppText></View>
);

const ActionButton = ({ icon, onPress, disabled = false, loading = false }: any) => (
  <Pressable
    style={[
      styles.actionButton,
      !disabled && { backgroundColor: colors.blue + '10', borderColor: colors.blue + '35' },
      disabled && styles.actionButtonDisabled,
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    {loading ? (
      <ActivityIndicator color={colors.blue} size="small" />
    ) : (
      <LeadListIcon type={icon} size={19} color={disabled ? '#B7BDCA' : colors.blue} />
    )}
  </Pressable>
);

const LeadListIcon = ({ type, size = 21, color = colors.blue }: any) => {
  const common = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const icons: Record<string, React.ReactNode> = {
    search: <><Circle cx="10" cy="10" r="6" {...common} /><Path d="M15 15l5 5" {...common} /></>,
    filter: <Path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" {...common} />,
    phone: <Path d="M7 3l3 4-2 2c1.5 3 3.5 5 7 7l2-2 4 3-1 3c-.4 1-1.5 1.5-2.5 1.2C9 18.5 5.5 15 2.8 6.5 2.5 5.5 3 4.4 4 4l3-1z" {...common} />,
    city: <Path d="M4 21V9h6v12M10 21V4h10v17M7 12v2m0 3v1m7-10v2m3-2v2m-3 4v2m3-2v2" {...common} />,
    source: <><Rect x="4" y="4" width="16" height="16" rx="3" {...common} /><Path d="M8 12h8m-3-3l3 3-3 3" {...common} /></>,
    opportunity: <><Circle cx="12" cy="9" r="5" {...common} /><Path d="M9 15h6m-5 3h4m-2-14V2" {...common} /></>,
    note: <><Path d="M4 3h16v14l-4 4H4V3z" {...common} /><Path d="M16 21v-4h4" {...common} /></>,
    email: <><Rect x="3" y="5" width="18" height="14" rx="2" {...common} /><Path d="M4 7l8 6 8-6" {...common} /></>,
    whatsapp: <><Path d="M20.5 11.5a8.5 8.5 0 01-12.6 7.4L3 20.5l1.6-4.7a8.5 8.5 0 1115.9-4.3z" {...common} /><Path d="M8.2 7.7c.3-.6.6-.6.9-.6l.6.1c.2 0 .3.2.4.4l.8 1.8c.1.2.1.4-.1.6l-.7.9c-.2.2-.1.4 0 .6.8 1.4 1.9 2.5 3.4 3.2.3.1.5.1.7-.1l.9-1.1c.2-.2.4-.3.6-.2l1.9.9c.3.1.4.3.4.5 0 .4-.2 1.5-.9 2.1-.6.6-1.5.8-2.4.6-1.1-.2-2.5-.7-4.3-2.3-2.3-2-3.6-4.5-3.7-5.6 0-.8.5-1.5.5-1.8z" {...common} /></>,
    location: <><Path d="M12 22s7-6 7-13a7 7 0 10-14 0c0 7 7 13 7 13z" {...common} /><Circle cx="12" cy="9" r="2" {...common} /></>,
    view: <><Path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" {...common} /><Circle cx="12" cy="12" r="2.5" {...common} /></>,
    calendar: <><Rect x="3" y="5" width="18" height="16" rx="2" {...common} /><Path d="M7 3v4m10-4v4M3 10h18" {...common} /></>,
  };
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">{icons[type]}</Svg>;
};

const styles = StyleSheet.create({
  headerCallButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EDF3FF', alignItems: 'center', justifyContent: 'center' },
  callWaitingBackdrop: { flex: 1, backgroundColor: 'rgba(13, 25, 48, 0.72)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  callWaitingCard: { width: '100%', maxWidth: 360, borderRadius: 28, backgroundColor: 'white', alignItems: 'center', paddingHorizontal: 28, paddingTop: 34, paddingBottom: 24 },
  callPulseOuter: { width: 92, height: 92, borderRadius: 46, backgroundColor: '#E8F0FF', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  callPulseInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  callWaitingTitle: { textAlign: 'center' },
  callWaitingName: { textAlign: 'center', marginTop: 8 },
  callWaitingLoader: { marginTop: 24, marginBottom: 13 },
  callWaitingMessage: { textAlign: 'center', lineHeight: 21, minHeight: 42 },
  callWaitingClose: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 11, borderRadius: 18, backgroundColor: '#EDF3FF' },
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  listContent: { flex: 1, padding: 16, paddingBottom: 0 },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  searchBox: { flex: 1, height: 50, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#D8DEE9', backgroundColor: 'white' },
  searchInput: { flex: 1, color: '#202432', fontSize: 15, fontFamily: fonts.InterRegular },
  filterButton: { width: 50, height: 50, borderRadius: 12, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  opportunityButton: { width: 50, height: 50, borderRadius: 12, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#6076B4' },
  filterButtonActive: { borderWidth: 2, borderColor: '#AFC3FF' },
  filterCount: { position: 'absolute', right: -4, top: -5, minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: 10, backgroundColor: 'white', borderWidth: 1, borderColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  statusScroll: { flexGrow: 0, height: 104 },
  summaryRow: { gap: 10, paddingVertical: 16 },
  summaryCard: { width: 108, minHeight: 72, borderRadius: 14, borderWidth: 1, borderColor: colors.blue + '35', backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', gap: 4 },
  summaryCardActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  summaryLabel: { textTransform: 'capitalize' },
  leadCard: { marginBottom: 14, padding: 16, borderRadius: 16, backgroundColor: 'white', shadowColor: '#18213D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  statusBadge: { minWidth: 76, height: 36, paddingHorizontal: 14, borderRadius: 10, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: '#E4E7ED', marginVertical: 12 },
  infoRow: { flexDirection: 'row', gap: 12 },
  infoCell: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 9 },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center', elevation: 1, shadowColor: '#17203A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  actionButtonDisabled: { opacity: 0.45, backgroundColor: '#F2F4F7', borderColor: '#E1E5EC' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  leadListScroll: { flex: 1 },
  leadListContent: { paddingBottom: 100 },
  noSearchResults: { minHeight: 160, borderRadius: 16, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  loadingBox: { minHeight: 220, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', right: 20, bottom: 40, width: 60, height: 60, borderRadius: 30, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: colors.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
  sheetContainer: { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  closeButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  filterLabel: { marginTop: 14, marginBottom: 7 },
  dropdown: { height: 52, borderWidth: 1, borderColor: '#D8DEE9', borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#F8F9FC' },
  placeholder: { color: '#7A8499', fontSize: 14, fontFamily: fonts.InterRegular },
  selectedText: { color: '#202432', fontSize: 14, fontFamily: fonts.InterMedium },
  dateField: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#D8DEE9', borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#F8F9FC' },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  clearButton: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  applyButton: { flex: 1.5, height: 50, borderRadius: 12, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
});

export default LeadKonnect;
