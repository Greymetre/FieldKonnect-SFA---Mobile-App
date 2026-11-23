import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';
import { Dropdown } from 'react-native-element-dropdown';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { PlusAddIcon } from '../../assets/svgs/SvgsFile';
import { getDraftApprovalsApi, getLeadDetailsApi, getLeadsApi, getLeadStatusSourceApi, updateLeadStatusApi } from '../../api/query/LeadApi';
import AppText from '../../components/AppText/AppText';
import CustomerCalendar from '../../components/CustomCalendar/CalendarPopupView';
import LeadActivityModal from './LeadActivityModal';
import IosDateRangePicker from '../../components/DatePicker/IosDateRangePicker';
import { colors } from '../../utils/Colors';
import { fonts } from '../../utils/typography';
import { composeEmail } from '../../utils/composeEmail';
import { cleanPhoneNumber, usePlivoCall } from './usePlivoCall';

const formatYYYYMMDD = (date: Date | null) => {
  if (!date) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatDisplayDate = (date: Date | null) => date
  ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '';

// Address used for the map: the location captured at the lead's place, else the saved address, else the city.
const getLeadLocation = (item: any) => {
  const valid = (value: any) => { const text = String(value || '').trim(); return text && text.toLowerCase() !== 'n/a' ? text : ''; };
  return valid(item?.location_address) || valid(item?.address) || valid(item?.city);
};

const openLocation = async (location: string) => {
  if (!location) return;
  const query = encodeURIComponent(location);
  const webUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
  const nativeUrl = Platform.OS === 'ios' ? `maps://?q=${query}` : `geo:0,0?q=${query}`;
  try {
    await Linking.openURL(nativeUrl);
  } catch {
    Linking.openURL(webUrl).catch(() => Alert.alert('Unable to open map', 'No map application is available on this device.'));
  }
};

const openWebsite = (website: string) => {
  const url = /^https?:\/\//i.test(website) ? website : `https://${website}`;
  Linking.openURL(url).catch(() => Alert.alert('Unable to open website', 'Please check the website address.'));
};

const openWhatsApp = (phone: any) => {
  let number = cleanPhoneNumber(phone);
  if (number.length === 10) number = `91${number}`;
  if (!number) return;
  Linking.openURL(`whatsapp://send?phone=${number}`).catch(() =>
    Linking.openURL(`https://wa.me/${number}`).catch(() => {}),
  );
};

const LEADS_PAGE_SIZE = 50;

const LeadKonnect = ({ navigation }: any) => {
  const { canUsePlivoCalling, confirmAndCall, isCalling, callUi } = usePlivoCall({ onFeedbackSaved: () => fetchLeads(1) });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [leads, setLeads] = useState<any[]>([]);
  const [counts, setCounts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [designations, setDesignations] = useState<string[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<any[]>([]);
  const [statusChange, setStatusChange] = useState<any>(null);
  const [statusChangeSubmitting, setStatusChangeSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalLeads, setTotalLeads] = useState<number | null>(null);
  const leadsRequestRef = useRef(0);
  const [activityLeadId, setActivityLeadId] = useState<any>(null);
  const [leadActivity, setLeadActivity] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<any>(-1);
  const [selectedUser, setSelectedUser] = useState<any>('');
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [selectedProgress, setSelectedProgress] = useState('');
  const [draftProgress, setDraftProgress] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [draftUser, setDraftUser] = useState<any>('');
  const [draftSource, setDraftSource] = useState('');
  const [draftDesignation, setDraftDesignation] = useState('');
  const [draftStatus, setDraftStatus] = useState<any>(-1);
  const [draftStartDate, setDraftStartDate] = useState<Date | null>(null);
  const [draftEndDate, setDraftEndDate] = useState<Date | null>(null);
  const [showCal, setShowCal] = useState(false);
  const [rangeType, setRangeType] = useState('custom');
  const filterSheetRef = useRef<ActionSheetRef>(null);

  // Drafts waiting for this user's approval (Email + LinkedIn), shown on the header button.
  const [pendingDrafts, setPendingDrafts] = useState(0);
  useFocusEffect(useCallback(() => {
    getDraftApprovalsApi({ type: 'email' })
      .then(response => {
        const counts = response?.data?.pending_counts || {};
        setPendingDrafts(Number(counts.email || 0) + Number(counts.linkedin || 0));
      })
      .catch(() => setPendingDrafts(0));
  }, []));

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <Pressable accessibilityRole="button" accessibilityLabel="Open draft approval" style={styles.headerCallButton} onPress={() => navigation.navigate('DraftApprovals')}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke={colors.blue} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            {pendingDrafts > 0 ? <View style={styles.headerBadge}><AppText size={10} color="white" family="InterBold">{pendingDrafts > 99 ? '99+' : pendingDrafts}</AppText></View> : null}
          </Pressable>
          {canUsePlivoCalling ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Open call history" style={styles.headerCallButton} onPress={() => navigation.navigate('CallHistory')}>
              <Svg width={23} height={23} viewBox="0 0 24 24" fill="none">
                <Path d="M6.62 10.79a15.46 15.46 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" fill={colors.blue} />
              </Svg>
            </Pressable>
          ) : null}
        </View>
      ),
    });
  }, [canUsePlivoCalling, navigation, pendingDrafts]);


  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    getLeadStatusSourceApi().then(response => {
      const data = response?.data?.data || {};
      setUsers(data?.users || []);
      setSources(data?.source || []);
      setDesignations(data?.designations || []);
      setLeadStatuses(data?.status || []);
    }).catch(error => console.log('Lead filter options error:', error?.response || error));
  }, []);

  const fetchLeads = useCallback(async (pageToLoad = 1) => {
    const requestId = ++leadsRequestRef.current;
    const isFirstPage = pageToLoad === 1;
    try {
      if (isFirstPage) setLoading(true);
      else setLoadingMore(true);
      const params: any = { pageSize: LEADS_PAGE_SIZE, page: pageToLoad };
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedUser) params.user_id = selectedUser;
      if (selectedSource) params.lead_source = selectedSource;
      if (selectedDesignation) params.designation = selectedDesignation;
      if (selectedProgress) params.call_progress = selectedProgress;
      if (selectedStatus !== -1) params.status = selectedStatus;
      if (startDate && endDate) {
        params.start_date = formatYYYYMMDD(startDate);
        params.end_date = formatYYYYMMDD(endDate);
      }
      const response = await getLeadsApi(params);
      if (requestId !== leadsRequestRef.current) return;
      const payload = response?.data || {};
      const listPayload = payload?.data;
      const pageLeads = Array.isArray(listPayload) ? listPayload : (listPayload?.data || []);
      const meta = Array.isArray(listPayload) ? (payload?.pagination || payload) : listPayload;
      const lastPage = Number(meta?.last_page ?? meta?.page_count);
      const total = Number(meta?.total);

      setLeads(prev => (isFirstPage ? pageLeads : [...prev, ...pageLeads]));
      setPage(pageToLoad);
      setHasMore(lastPage ? pageToLoad < lastPage : pageLeads.length === LEADS_PAGE_SIZE);
      if (isFirstPage) {
        setTotalLeads(Number.isFinite(total) ? total : null);
        setCounts(payload?.counts || []);
      }
    } catch (error: any) {
      if (requestId !== leadsRequestRef.current) return;
      console.log('Lead listing error:', error?.response || error);
      if (isFirstPage) {
        setLeads([]);
        setCounts([]);
        setTotalLeads(null);
      }
      setHasMore(false);
    } finally {
      if (requestId === leadsRequestRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [debouncedSearch, endDate, selectedDesignation, selectedProgress, selectedSource, selectedStatus, selectedUser, startDate]);

  // Activity comes from the lead details API, the same source as the Lead Details screen.
  const openLeadActivity = async (leadId: any) => {
    if (!leadId) return;
    setActivityLeadId(leadId);
    setLeadActivity([]);
    setActivityLoading(true);
    try {
      const response = await getLeadDetailsApi(leadId);
      setLeadActivity(response?.data?.notes_tasks || []);
    } catch (error: any) {
      setActivityLeadId(null);
      Alert.alert('Unable to load activity', error?.response?.data?.message || 'Please try again.');
    } finally {
      setActivityLoading(false);
    }
  };

  const loadMoreLeads = () => {
    if (loading || loadingMore || !hasMore) return;
    fetchLeads(page + 1);
  };

  useFocusEffect(useCallback(() => {
    fetchLeads(1);
  }, [fetchLeads]));

  const userOptions = useMemo(() => [
    { label: 'All Users', value: '' },
    ...users.map(item => ({ label: item?.name || `User ${item?.id}`, value: item?.id })),
  ], [users]);
  // Same statuses as the summary cards (the "Total" card uses id -1 for all statuses).
  const statusOptions = useMemo(() => {
    const options = counts
      .filter(item => item?.id !== undefined && item?.id !== null && Number(item.id) !== -1)
      .map(item => ({ label: String(item.display_name || 'Status').replace(/\b\w/g, char => char.toUpperCase()), value: item.id }));
    return [{ label: 'All Statuses', value: -1 }, ...options];
  }, [counts]);
  const sourceOptions = useMemo(() => [
    { label: 'All Sources', value: '' },
    ...sources.map(item => ({ label: item?.value || item?.key, value: item?.key || item?.value })),
  ], [sources]);
  const designationOptions = useMemo(() => [
    { label: 'All Designations', value: '' },
    ...designations.map(item => ({ label: item, value: item })),
  ], [designations]);
  const leadStatusOptions = useMemo(() => leadStatuses.map(item => ({
    label: String(item?.display_name || 'Status').replace(/\b\w/g, char => char.toUpperCase()),
    value: item?.id,
  })), [leadStatuses]);
  const activeFilterCount = Number(Boolean(selectedUser)) + Number(selectedStatus !== -1 && selectedStatus !== '-1') + Number(Boolean(selectedSource)) + Number(Boolean(selectedDesignation)) + Number(Boolean(selectedProgress)) + Number(Boolean(startDate && endDate));

  const openStatusChange = (item: any) => {
    const statusId = item?.status?.id;
    setStatusChange({ lead: item, statusId: statusId ? Number(statusId) : '', note: '' });
  };

  const closeStatusChange = () => {
    if (!statusChangeSubmitting) setStatusChange(null);
  };

  // A changed lead moves to the end of the list, matching the server order.
  const submitStatusChange = async () => {
    const lead = statusChange?.lead;
    const leadId = lead?.id || lead?.lead_id;
    const newStatusId = statusChange?.statusId;
    if (!leadId || newStatusId === '' || statusChangeSubmitting) return;
    const note = String(statusChange.note || '').trim();
    const oldStatusId = Number(lead?.status?.id ?? 0);
    const statusChanged = Number(newStatusId) !== oldStatusId;

    try {
      setStatusChangeSubmitting(true);
      const response = await updateLeadStatusApi(leadId, newStatusId, note || undefined);
      if (response?.data?.status === 'error') {
        Alert.alert('Unable to update status', response?.data?.message || 'Please try again.');
        return;
      }
      const newStatus = response?.data?.data?.status
        || { id: newStatusId, display_name: leadStatusOptions.find(option => option.value === newStatusId)?.label || 'Status' };

      if (statusChanged) {
        const updatedLead = { ...lead, status: newStatus, note: note || lead?.note };
        const keepInList = selectedStatus === -1 || Number(selectedStatus) === Number(newStatus.id);
        setLeads(prev => {
          const rest = prev.filter(entry => (entry?.id || entry?.lead_id) !== leadId);
          // Leads still to be paged in come before it, so it shows up once the last page loads.
          return keepInList && !hasMore ? [...rest, updatedLead] : rest;
        });
        if (!keepInList) setTotalLeads(prev => (prev === null ? prev : Math.max(0, prev - 1)));
        setCounts(prev => prev.map(entry => {
          if (Number(entry?.id) === oldStatusId) return { ...entry, count: Math.max(0, Number(entry.count || 0) - 1) };
          if (Number(entry?.id) === Number(newStatus.id)) return { ...entry, count: Number(entry.count || 0) + 1 };
          return entry;
        }));
      } else if (note) {
        setLeads(prev => prev.map(entry => ((entry?.id || entry?.lead_id) === leadId ? { ...entry, note } : entry)));
      }
      setStatusChange(null);
    } catch (error: any) {
      Alert.alert('Unable to update status', error?.response?.data?.message || 'Please try again.');
    } finally {
      setStatusChangeSubmitting(false);
    }
  };

  const [numberChoice, setNumberChoice] = useState<any>(null);

  // When the lead also has an alternate number, let the agent pick which one to call.
  const requestLeadCall = (item: any) => {
    const main = cleanPhoneNumber(item?.contact?.phone_number || item?.phone);
    const alternate = cleanPhoneNumber(item?.alternate_number);
    if (alternate && alternate.slice(-10) !== main.slice(-10)) {
      setNumberChoice({ item, numbers: [{ label: 'Mobile Number', number: main }, { label: 'Alternate Number', number: alternate }].filter(entry => entry.number) });
      return;
    }
    handlePlivoCall(item);
  };

  const handlePlivoCall = (item: any, selectedNumber?: string) => confirmAndCall({
    key: item?.id || item?.lead_id || 'lead',
    phone: selectedNumber || item?.contact?.phone_number || item?.phone || '',
    name: item?.contact?.name || item?.name || 'Customer',
    leadId: item?.id,
    leadName: item?.name || item?.contact?.name || '',
    leadStatusId: item?.status?.id,
  });


  const openFilters = () => {
    setDraftUser(selectedUser);
    setDraftStatus(selectedStatus);
    setDraftSource(selectedSource);
    setDraftDesignation(selectedDesignation);
    setDraftProgress(selectedProgress);
    setDraftStartDate(startDate);
    setDraftEndDate(endDate);
    filterSheetRef.current?.show();
  };

  const clearFilters = () => {
    setDraftUser('');
    setDraftStatus(-1);
    setDraftSource('');
    setDraftDesignation('');
    setDraftProgress('');
    setSelectedProgress('');
    setDraftStartDate(null);
    setDraftEndDate(null);
    setSelectedUser('');
    setSelectedStatus(-1);
    setSelectedSource('');
    setSelectedDesignation('');
    setStartDate(null);
    setEndDate(null);
    filterSheetRef.current?.hide();
  };

  const applyFilters = () => {
    setSelectedUser(draftUser);
    setSelectedStatus(draftStatus);
    setSelectedSource(draftSource);
    setSelectedDesignation(draftDesignation);
    setSelectedProgress(draftProgress);
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
          <AppText size={13} color={colors.blue} family="InterSemiBold">{totalLeads !== null && totalLeads > leads.length ? `${leads.length} of ${totalLeads}` : leads.length} leads</AppText>
        </View>

        {loading ? <View style={styles.loadingBox}><ActivityIndicator size="large" color={colors.blue} /></View> : (
          <FlatList
            data={leads}
            keyExtractor={(item, index) => String(item?.id ?? item?.lead_id ?? index)}
            renderItem={({ item }) => <LeadCard item={item} navigation={navigation} onCallPress={requestLeadCall} onActivityPress={() => openLeadActivity(item?.id || item?.lead_id)} onStatusPress={() => openStatusChange(item)} isCalling={isCalling(item?.id || item?.lead_id || 'lead')} />}
            style={styles.leadListScroll}
            contentContainerStyle={styles.leadListContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onEndReached={loadMoreLeads}
            onEndReachedThreshold={0.5}
            ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={colors.blue} style={styles.loadMoreLoader} /> : null}
            ListEmptyComponent={(
              <View style={styles.noSearchResults}>
                <AppText size={15} color="#718096" family="InterMedium">No matching leads</AppText>
              </View>
            )}
          />
        )}
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
          <AppText size={13} color="#566078" family="InterSemiBold" style={styles.filterLabel}>Lead Status</AppText>
          <Dropdown style={styles.dropdown} data={statusOptions} labelField="label" valueField="value" value={draftStatus} onChange={item => setDraftStatus(item.value)} placeholder="Select status" placeholderStyle={styles.placeholder} selectedTextStyle={styles.selectedText} />
          <AppText size={13} color="#566078" family="InterSemiBold" style={styles.filterLabel}>Calling</AppText>
          <Dropdown style={styles.dropdown} data={CALL_PROGRESS_OPTIONS} labelField="label" valueField="value" value={draftProgress} onChange={item => setDraftProgress(item.value)} placeholder="Any calling progress" placeholderStyle={styles.placeholder} selectedTextStyle={styles.selectedText} />
          <AppText size={13} color="#566078" family="InterSemiBold" style={styles.filterLabel}>Lead Source</AppText>
          <Dropdown style={styles.dropdown} data={sourceOptions} labelField="label" valueField="value" value={draftSource} onChange={item => setDraftSource(item.value)} placeholder="Select source" placeholderStyle={styles.placeholder} selectedTextStyle={styles.selectedText} />
          <AppText size={13} color="#566078" family="InterSemiBold" style={styles.filterLabel}>Designation</AppText>
          <Dropdown style={styles.dropdown} data={designationOptions} labelField="label" valueField="value" value={draftDesignation} onChange={item => setDraftDesignation(item.value)} placeholder="Select designation" placeholderStyle={styles.placeholder} selectedTextStyle={styles.selectedText} search searchPlaceholder="Search designation" inputSearchStyle={styles.dropdownSearch} />
          <AppText size={13} color="#566078" family="InterSemiBold" style={styles.filterLabel}>Date Range</AppText>
          {Platform.OS === 'ios' ? (
            <IosDateRangePicker startDate={draftStartDate} endDate={draftEndDate} onChange={(start, end) => { setDraftStartDate(start); setDraftEndDate(end); setRangeType('custom'); }} />
          ) : (
            <Pressable style={styles.dateField} onPress={openDateCalendar}>
              <LeadListIcon type="calendar" />
              <AppText size={14} color={draftStartDate && draftEndDate ? '#202432' : '#7A8499'} family="InterMedium">
                {draftStartDate && draftEndDate ? `${formatDisplayDate(draftStartDate)} - ${formatDisplayDate(draftEndDate)}` : 'Select date range'}
              </AppText>
            </Pressable>
          )}
          <View style={styles.sheetActions}>
            <Pressable style={styles.clearButton} onPress={clearFilters}><AppText size={15} color={colors.blue} family="InterBold">Clear</AppText></Pressable>
            <Pressable style={styles.applyButton} onPress={applyFilters}><AppText size={15} color="white" family="InterBold">Apply Filters</AppText></Pressable>
          </View>
        </View>
      </ActionSheet>


      <Modal visible={Boolean(statusChange)} transparent animationType="fade" statusBarTranslucent onRequestClose={closeStatusChange}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.callWaitingBackdrop} onPress={closeStatusChange}>
            <Pressable style={styles.numberChoiceCard} onPress={() => {}}>
              <View style={styles.numberChoiceHeader}>
                <View style={{ flex: 1 }}>
                  <AppText size={18} color="#202432" family="InterBold">Change Lead Status</AppText>
                  <AppText size={13} color="#687086" family="InterMedium" numLines={1} style={{ marginTop: 3 }}>{statusChange?.lead?.name || statusChange?.lead?.contact?.name || 'Lead'}</AppText>
                </View>
                <Pressable style={styles.closeButton} onPress={closeStatusChange}><AppText size={24} color="#566078">×</AppText></Pressable>
              </View>

              <AppText size={13} color="#566078" family="InterBold">LEAD STATUS <AppText size={13} color="#E5485D" family="InterBold">*</AppText></AppText>
              <Dropdown
                style={styles.feedbackDropdown}
                data={leadStatusOptions}
                labelField="label"
                valueField="value"
                value={statusChange?.statusId}
                onChange={status => setStatusChange((previous: any) => ({ ...previous, statusId: status.value }))}
                placeholder={leadStatusOptions.length ? 'Select lead status' : 'Loading statuses...'}
                placeholderStyle={styles.feedbackPlaceholder}
                selectedTextStyle={styles.feedbackSelectedText}
                search
                searchPlaceholder="Search status"
                inputSearchStyle={styles.statusSearchInput}
                renderLeftIcon={() => <View style={[styles.statusDot, { marginRight: 10 }, statusChange?.statusId === '' && styles.statusDotEmpty]} />}
                containerStyle={styles.statusListContainer}
                maxHeight={300}
                activeColor="transparent"
                autoScroll={false}
                flatListProps={{ ListEmptyComponent: <AppText size={14} color="#7A8499" family="InterMedium" style={styles.statusListEmpty}>No status found</AppText> }}
                renderItem={(option, selected) => (
                  <View style={[styles.statusOption, selected && styles.statusOptionSelected]}>
                    <View style={[styles.statusDot, !selected && styles.statusDotEmpty]} />
                    <AppText size={15} color={selected ? colors.blue : '#202432'} family={selected ? 'InterBold' : 'InterMedium'} style={{ flex: 1 }}>{option.label}</AppText>
                    {selected && (
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Path d="M5 12.5l4.5 4.5L19 7.5" stroke={colors.blue} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    )}
                  </View>
                )}
              />

              <AppText size={13} color="#566078" family="InterBold" style={{ marginTop: 6 }}>NOTE</AppText>
              <TextInput
                value={statusChange?.note || ''}
                onChangeText={note => setStatusChange((previous: any) => ({ ...previous, note }))}
                placeholder="Add a note (optional)"
                placeholderTextColor="#98A2B3"
                multiline
                maxLength={1000}
                textAlignVertical="top"
                style={styles.statusNoteInput}
              />

              <Pressable
                accessibilityRole="button"
                disabled={statusChange?.statusId === '' || statusChangeSubmitting}
                onPress={submitStatusChange}
                style={({ pressed }) => [
                  styles.statusSubmit,
                  (statusChange?.statusId === '' || statusChangeSubmitting) && styles.feedbackSubmitDisabled,
                  pressed && styles.feedbackSubmitPressed,
                ]}
              >
                {statusChangeSubmitting
                  ? <ActivityIndicator color="white" size="small" />
                  : <AppText size={16} color="white" family="InterBold">Submit</AppText>}
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={Boolean(numberChoice)} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setNumberChoice(null)}>
        <Pressable style={styles.callWaitingBackdrop} onPress={() => setNumberChoice(null)}>
          <Pressable style={styles.numberChoiceCard} onPress={() => {}}>
            <View style={styles.numberChoiceHeader}>
              <View style={{ flex: 1 }}>
                <AppText size={18} color="#202432" family="InterBold">Select number to call</AppText>
                <AppText size={13} color="#687086" family="InterMedium" numLines={1} style={{ marginTop: 3 }}>{numberChoice?.item?.contact?.name || numberChoice?.item?.name || 'Customer'}</AppText>
              </View>
              <Pressable style={styles.closeButton} onPress={() => setNumberChoice(null)}><AppText size={24} color="#566078">×</AppText></Pressable>
            </View>
            {(numberChoice?.numbers || []).map((entry: any) => (
              <Pressable
                key={entry.label}
                style={({ pressed }) => [styles.numberOption, pressed && { opacity: 0.7 }]}
                onPress={() => {
                  const item = numberChoice.item;
                  setNumberChoice(null);
                  handlePlivoCall(item, entry.number);
                }}
              >
                <View style={styles.numberOptionIcon}><LeadListIcon type="phone" size={19} /></View>
                <View style={{ flex: 1 }}>
                  <AppText size={12} color="#7A8499" family="InterSemiBold">{entry.label}</AppText>
                  <AppText size={16} color="#202432" family="InterBold" style={{ marginTop: 2 }}>{entry.number}</AppText>
                </View>
                <AppText size={14} color={colors.blue} family="InterBold">Call</AppText>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {callUi}
      <LeadActivityModal visible={Boolean(activityLeadId)} loading={activityLoading} activity={leadActivity} navigation={navigation} onClose={() => setActivityLeadId(null)} />
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

// "Calling" filter, same as the CRM leads list.
const CALL_PROGRESS_OPTIONS = [
  { label: 'Any calling progress', value: '' },
  { label: 'Not called', value: 'not_called' },
  { label: 'Partially called', value: 'partial' },
  { label: 'All contacts called', value: 'all_called' },
];
const CALLING_TONES: Record<string, [string, string]> = {
  not_called: ['#1D4ED8', '#DBEAFE'],
  partial: ['#B45309', '#FEF3C7'],
  all_called: ['#047857', '#D1FAE5'],
};

const LeadCard = ({ item, navigation, onCallPress, onActivityPress, onStatusPress, isCalling = false }: any) => {
  const phone = cleanPhoneNumber(item?.contact?.phone_number);
  const email = String(item?.contact?.email || '').trim();
  const location = getLeadLocation(item);
  const designation = String(item?.contact?.designation || '').trim();
  const website = String(item?.website || '').trim();

  return (
  <View style={styles.leadCard}>
    <View style={styles.cardHeader}>
      <View style={{ flex: 1 }}>
        <AppText size={17} color={colors.blue} family="InterBold" numLines={1}>{item?.name || 'Unnamed firm'}</AppText>
        <AppText size={14} color="#3D4659" family="InterMedium" numLines={1} style={{ marginTop: 5 }}>{item?.contact?.name || 'No contact name'}{item?.contacts_count > 1 ? ` +${item.contacts_count - 1} more` : ''}</AppText>
        <View style={styles.metaRow}>
          {item?.external_lead_id ? <View style={styles.metaChip}><AppText size={11} color="#4F586D" family="InterBold">Lead ID {item.external_lead_id}</AppText></View> : null}
          {item?.calling && item.calling.dialable > 0 ? (
            <View style={[styles.metaChip, { backgroundColor: CALLING_TONES[item.calling.state]?.[1] || '#E2E8F0' }]}>
              <AppText size={11} color={CALLING_TONES[item.calling.state]?.[0] || '#475569'} family="InterBold">Called {item.calling.called}/{item.calling.dialable}</AppText>
            </View>
          ) : null}
        </View>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Change lead status" style={({ pressed }) => [styles.statusBadge, pressed && { opacity: 0.8 }]} onPress={onStatusPress} hitSlop={6}>
        <AppText size={13} color="white" family="InterSemiBold">{item?.status?.display_name || 'Pending'}</AppText>
      </Pressable>
    </View>

    <View style={styles.divider} />
    <View style={styles.infoRow}>
      <InfoCell icon="phone" text={item?.contact?.phone_number || 'No mobile'} />
      <InfoCell icon="location" text={item?.city || 'No city'} onPress={location ? () => openLocation(location) : undefined} />
    </View>
    <View style={styles.divider} />
    <View style={styles.infoRow}>
      <InfoCell icon="source" text={item?.lead_source_lead || item?.contact?.lead_source || 'No source'} />
      <InfoCell icon="opportunity" text={item?.opportunity_status || 'Opportunity'} placeholder={!item?.opportunity_status} />
    </View>
    <View style={styles.divider} />
    <View style={styles.infoRow}>
      <InfoCell icon="designation" text={designation || 'No designation'} placeholder={!designation} />
      <InfoCell icon="website" text={website || 'No website'} placeholder={!website} onPress={website ? () => openWebsite(website) : undefined} />
    </View>
    <View style={styles.divider} />

    <View style={styles.actionRow}>
      <ActionButton icon="phone" disabled={!phone || isCalling} loading={isCalling} onPress={() => onCallPress(item)} />
      <ActionButton icon="email" disabled={!email} onPress={() => composeEmail(email)} />
      <ActionButton icon="whatsapp" disabled={!phone} onPress={() => openWhatsApp(phone)} />
      <ActionButton icon="activity" onPress={onActivityPress} />
      <ActionButton icon="view" onPress={() => navigation.navigate('LeadDetails', { lead: item })} />
    </View>
  </View>
  );
};

const InfoCell = ({ icon, text, placeholder = false, onPress }: any) => (
  <Pressable style={({ pressed }) => [styles.infoCell, onPress && pressed && { opacity: 0.6 }]} onPress={onPress} disabled={!onPress} hitSlop={6}>
    <LeadListIcon type={icon} color={placeholder ? '#A9B0BF' : colors.blue} />
    <AppText size={14} color={placeholder ? '#A9B0BF' : '#50596D'} family={placeholder ? 'InterRegular' : 'InterMedium'} numLines={1} style={{ flex: 1 }}>{text}</AppText>
  </Pressable>
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
    activity: <Path d="M4 12h4l2-6 4 12 2-6h4" {...common} />,
    view: <><Path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" {...common} /><Circle cx="12" cy="12" r="2.5" {...common} /></>,
    designation: <><Rect x="3" y="7" width="18" height="13" rx="2" {...common} /><Path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M3 13h18" {...common} /></>,
    website: <><Circle cx="12" cy="12" r="9" {...common} /><Path d="M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z" {...common} /></>,
    calendar: <><Rect x="3" y="5" width="18" height="16" rx="2" {...common} /><Path d="M7 3v4m10-4v4M3 10h18" {...common} /></>,
  };
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">{icons[type]}</Svg>;
};

const styles = StyleSheet.create({
  headerCallButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EDF3FF', alignItems: 'center', justifyContent: 'center' },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBadge: { position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: '#E5484D', alignItems: 'center', justifyContent: 'center' },
  numberChoiceCard: { width: '100%', maxWidth: 380, borderRadius: 22, backgroundColor: 'white', padding: 18, gap: 10 },
  numberChoiceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  numberOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 14, borderWidth: 1, borderColor: colors.blue + '30', backgroundColor: colors.blue + '08' },
  numberOptionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.blue + '12', alignItems: 'center', justifyContent: 'center' },
  callWaitingBackdrop: { flex: 1, backgroundColor: 'rgba(13, 25, 48, 0.72)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  feedbackDropdown: { height: 56, borderWidth: 1.5, borderColor: '#C9D4E5', borderRadius: 13, paddingHorizontal: 15, backgroundColor: '#F8FAFD' },
  feedbackPlaceholder: { color: '#98A2B3', fontSize: 15, fontFamily: fonts.InterMedium },
  feedbackSelectedText: { color: '#202432', fontSize: 15, fontFamily: fonts.InterSemiBold },
  statusListContainer: { marginTop: 6, borderRadius: 14, borderWidth: 1, borderColor: '#DCE3EE', paddingHorizontal: 8, paddingTop: 8, paddingBottom: 6, backgroundColor: 'white', shadowColor: '#18213D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 14, elevation: 8 },
  statusSearchInput: { height: 44, borderRadius: 10, borderColor: '#DCE3EE', backgroundColor: '#F4F6FA', color: '#202432', fontSize: 14, fontFamily: fonts.InterRegular, marginBottom: 6 },
  statusOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 13, borderRadius: 10, marginVertical: 1 },
  statusOptionSelected: { backgroundColor: colors.blue + '12' },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.blue },
  statusDotEmpty: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#B7C0D0' },
  statusListEmpty: { textAlign: 'center', paddingVertical: 18 },
  statusNoteInput: { minHeight: 100, maxHeight: 160, borderWidth: 1.5, borderColor: '#C9D4E5', borderRadius: 13, backgroundColor: '#F8FAFD', padding: 13, color: '#202432', fontSize: 15, lineHeight: 21, fontFamily: fonts.InterRegular },
  statusSubmit: { height: 52, marginTop: 8, borderRadius: 14, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  feedbackSubmitDisabled: { backgroundColor: '#B8C4D8' },
  feedbackSubmitPressed: { opacity: 0.86 },
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
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 7 },
  metaChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9, backgroundColor: '#EEF1F6' },
  statusBadge: { minWidth: 76, height: 36, paddingHorizontal: 14, borderRadius: 10, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: '#E4E7ED', marginVertical: 12 },
  infoRow: { flexDirection: 'row', gap: 12 },
  infoCell: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 9 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center', elevation: 1, shadowColor: '#17203A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  actionButtonDisabled: { opacity: 0.45, backgroundColor: '#F2F4F7', borderColor: '#E1E5EC' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  leadListScroll: { flex: 1 },
  leadListContent: { paddingBottom: 100 },
  noSearchResults: { minHeight: 160, borderRadius: 16, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  loadingBox: { minHeight: 220, alignItems: 'center', justifyContent: 'center' },
  loadMoreLoader: { marginVertical: 16 },
  fab: { position: 'absolute', right: 20, bottom: 40, width: 60, height: 60, borderRadius: 30, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: colors.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
  sheetContainer: { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  closeButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  filterLabel: { marginTop: 14, marginBottom: 7 },
  dropdown: { height: 52, borderWidth: 1, borderColor: '#D8DEE9', borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#F8F9FC' },
  placeholder: { color: '#7A8499', fontSize: 14, fontFamily: fonts.InterRegular },
  selectedText: { color: '#202432', fontSize: 14, fontFamily: fonts.InterMedium },
  dropdownSearch: { height: 44, borderRadius: 10, color: '#202432', fontSize: 14, fontFamily: fonts.InterRegular },
  dateField: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#D8DEE9', borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#F8F9FC' },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  clearButton: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  applyButton: { flex: 1.5, height: 50, borderRadius: 12, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
});

export default LeadKonnect;
