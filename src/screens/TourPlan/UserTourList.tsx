import { View, Text, FlatList, ScrollView, Pressable, Alert, ActivityIndicator, TouchableOpacity, TextInput, Keyboard } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { styles } from './styles'
import AppText from '../../components/AppText/AppText'
import { useMutateChangeTourStatusApi, useMutateTourPlanSelectUserApi } from '../../api/query/TourPlanApi'
import { colors } from '../../utils/Colors'
import { CalenderIcon } from '../../assets/svgs/SvgsFile'
import CustomerCalendar from '../../components/CustomCalendar/CalendarPopupView'
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet'
import Toast from 'react-native-toast-message'
import { useAppSelector } from '../../components/redux/Store'
import { SafeAreaView } from 'react-native-safe-area-context'

const UserTourList = ({ navigation, route }: any) => {
  const routeItem = route?.params?.item
  const userId = route?.params?.item?.value; // assuming this is the selected user_id

  const [tourPlanData, setTourPlanData] = useState<any[]>([])
  const [loader, setLoader] = useState<boolean>(false)
  const { mutateAsync: mutateTOurSelectPlan } = useMutateTourPlanSelectUserApi();
  const [loading, setLoading] = useState<boolean>(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [fullPlanData, setFullPlanData] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<number | null | any>(null);
  const [remark, setRemark] = useState('');
  const statusSheetRef = useRef<ActionSheetRef>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const { mutateAsync: changeStatusApi } = useMutateChangeTourStatusApi();
  // ── Date range state ────────────────────────────────────────
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [rangeType, setRangeType] = useState<string>('custom'); // optional
  const { user } = useAppSelector((state) => state.auth);


  // Format date helper (same as AttendanceReport)
  const formatYYYYMMDD = (date: Date | null): string | undefined => {
    if (!date) return undefined;
    return date.toISOString().split('T')[0];
  };

  const loadTourPlans = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const payload: any = { user_id: userId };

      if (startDate && endDate) {
        payload.start_date = formatYYYYMMDD(startDate);
        payload.end_date = formatYYYYMMDD(endDate);
      }

      const res = await mutateTOurSelectPlan(payload);

      if (res?.data?.status === 'success') {
        setTourPlanData(res?.data?.data?.data || res?.data?.data || []);
        setFullPlanData(res?.data)
      } else {
        setTourPlanData([]);
      }
    } catch (error) {
      console.log('Error fetching tour plans:', error);
      Alert.alert('Error', 'Failed to load tour plans');
    } finally {
      setLoading(false);
    }
  };

  const openStatusSheet = (item: any) => {
    setSelectedItem(item);
    setSelectedStatus(null);
    setRemark('');
    statusSheetRef.current?.show();
  };

  // Load initially (without date filter) + whenever dates change
  useEffect(() => {
    loadTourPlans();
  }, [startDate, endDate, userId]);



  // const saveStatus = async () => {
  //   try {
  //     if (selectedStatus === null) {
  //       Toast.show({
  //         type: 'error',
  //         text1: 'Please select status',
  //       });
  //       return;
  //     }

  //     if (selectedStatus === 2 && !remark.trim()) {
  //       Toast.show({
  //         type: 'error',
  //         text1: 'Remark is required',
  //       });
  //       return;
  //     }

  //     setStatusLoading(true);

  //     await changeStatusApi({
  //       tour_id: selectedItem.id,
  //       status: selectedStatus,
  //       remark: selectedStatus === 2 ? remark : '',
  //     });

  //     Toast.show({
  //       type: 'success',
  //       text1:
  //         selectedStatus === 1
  //           ? 'Approved successfully'
  //           : selectedStatus === 2
  //             ? 'Rejected successfully'
  //             : 'Status updated',
  //     });

  //     statusSheetRef.current?.hide();
  //     loadTourPlans();

  //   } catch (e) {
  //     Toast.show({
  //       type: 'error',
  //       text1: 'Failed to update status',
  //     });
  //   } finally {
  //     setStatusLoading(false);
  //   }
  // };

  const saveStatus = async () => {
    try {
      if (selectedStatus === null) {
        Toast.show({
          type: 'error',
          text1: 'Please select a status',
        });
        return;
      }

      if (selectedStatus === 2 && !remark.trim()) {
        Toast.show({
          type: 'error',
          text1: 'Please enter a rejection remark',
        });
        return;
      }

      // ✅ APPROVE CONFIRMATION
      if (selectedStatus === 1) {
        Alert.alert(
          'Confirm Approval',
          'Are you sure you want to approve this tour plan?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Yes, Approve',
              onPress: () => handleSubmit(),
            },
          ]
        );
        return;
      }

      // for reject / pending directly submit
      handleSubmit();

    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Something went wrong',
      });
    }
  };

  const handleSubmit = async () => {
    try {
      Keyboard.dismiss();
      setStatusLoading(true);

      await changeStatusApi({
        tour_id: selectedItem.id,
        status: selectedStatus,
        remark: selectedStatus === 2 ? remark : '',
      });

      Toast.show({
        type: 'success',
        text1:
          selectedStatus === 1
            ? 'Tour plan approved successfully'
            : selectedStatus === 2
              ? 'Tour plan rejected successfully'
              : 'Status updated successfully',
      });

      statusSheetRef.current?.hide();
      loadTourPlans();

    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Failed to update status',
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const handleApplyDateRange = (start: Date | null, end: Date | null, type: string) => {
    if (!start || !end) {
      Alert.alert('Invalid range', 'Please select both start and end dates.');
      return;
    }

    // Normalize (remove time part if backend expects pure date)
    const s = new Date(start);
    s.setHours(0, 0, 0, 0);
    const e = new Date(end);
    e.setHours(23, 59, 59, 999);

    setStartDate(s);
    setEndDate(e);
    setRangeType(type);
    setShowCalendar(false);
    // loadTourPlans() will be triggered by useEffect
  };

  const renderItem = (({ item, index }: { item: any, index: number }) => {
    const plan = item
    return (
      <View style={{ flex: 1, }}>
        <View key={plan?.id} style={[styles.innerView, styles.row]}>
          {/* Date */}
          <View
            style={[
              styles.heading1,
              { width: 112 },
              {
                borderLeftWidth: 1,
                borderLeftColor: colors.blue,
                borderRightColor: colors.blue,
                borderRightWidth: 1,
              },
            ]}

          >
            <AppText
              size={14}
              color="black"
              family="InterRegular"
            >
              {(item?.date || 'Select Date')}
            </AppText>
          </View>

          {/* District */}
          <View
            style={[
              styles.heading1,
              { width: 140 },
              { borderRightColor: colors.blue, borderRightWidth: 1 },
            ]}

          >
            <AppText
              size={14}
              color="black"
              family="InterRegular"
            >
              {plan?.district_name || 'Select District'}
            </AppText>
          </View>

          {/* City */}
          <View
            style={[styles.heading1, { width: 140 }]}

          >
            <AppText
              size={14}
              color="black"
              family="InterRegular"
            >
              {plan?.town_name || 'Select City'}
            </AppText>
          </View>

          {/* Objective */}
          <View
            style={[
              styles.heading1,
              {
                width: 160,
                borderLeftWidth: 1,
                borderLeftColor: colors.blue,
                borderRightColor: colors.blue,
                borderRightWidth: 1,
                paddingHorizontal: 5,
              },
            ]}
          >
            <AppText
              size={14}
              align="center"
              opacity={plan.objective ? 1 : 0.7}
              numLines={2}
              color="black"
              family="InterRegular"
            >
              {plan.objectives || '-'}
            </AppText>

          </View>
          {/* <View
            style={[
              styles.heading1,
              { width: 112 },
              {
                borderRightColor: colors.blue,
                borderRightWidth: 1,
              },
            ]}

          >
            <AppText
              size={14}
              color="black"
              family="InterRegular"
            >
              {(plan?.status)}
            </AppText>
          </View> */}
          <View style={[
            styles.heading1,
            { width: 112 },
            {
              borderRightColor: colors.blue,
              borderRightWidth: 1,
            },
          ]}>
            <Pressable
              onPress={() => {
                if (user?.id == plan?.userid || fullPlanData?.hierarchy_level > 2) {
                  return
                }
                openStatusSheet(plan)
              }}
              style={{
                padding: 6,
                borderRadius: 20,
                paddingHorizontal: 10,
                backgroundColor: colors.blue,
              }}
            >
              <AppText align="center" family='InterRegular' color='white' size={12}>
                {plan?.status}
              </AppText>
            </Pressable>
          </View>
          <View
            style={[
              styles.heading1,
              {
                width: 160,
                borderRightColor: colors.blue,
                borderRightWidth: 1,
              },
            ]}
          >
            <AppText
              size={14}
              align="center"
              opacity={plan.remark ? 1 : 0.7}
              numLines={2}
              color="black"
              family="InterRegular"
            >
              {plan.status == "Rejected" ? plan.remark : '-'}
            </AppText>

          </View>
        </View>
        <View>
          {/* Header Row */}
          {/* <View style={[styles.boxView, styles.row, { marginTop: 24 }]}>
              <View style={[styles.heading, { width: 112 }]}>
                <AppText size={14} color="white" family="InterSemiBold">
                  Date
                </AppText>
              </View>
              <View style={[styles.heading, { width: 140 }]}>
                <AppText size={14} color="white" family="InterSemiBold">
                  District
                </AppText>
              </View>
              <View style={[styles.heading, { width: 140 }]}>
                <AppText size={14} color="white" family="InterSemiBold">
                  Visit Town
                </AppText>
              </View>
              <View style={[styles.heading, { width: 160 }]}>
                <AppText size={14} color="white" family="InterSemiBold">
                  Objective
                </AppText>
              </View>
            </View> */}

          {/* Data Rows */}

        </View>

      </View>
    )
  })
  return (
    <SafeAreaView style={[styles.container,]} edges={['bottom']}>
      <View style={styles.container}>
        <View style={[styles.row, { padding: 16 }]}>
          <AppText size={16} color='black' family='InterMedium'>Tour plan :{'  '}</AppText>
          <AppText size={16} transform='capitalize' color='black' family='InterSemiBold' underline='underline'>{routeItem?.label}</AppText>
        </View>
        <Pressable
          style={{
            marginHorizontal: 16,
            marginBottom: 12,
            padding: 12,
            backgroundColor: 'rgba(57, 82, 153, 0.07)',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          onPress={() => setShowCalendar(true)}
        >
          <AppText size={14} color={startDate && endDate ? 'black' : '#718096'}>
            {startDate && endDate
              ? `${formatYYYYMMDD(startDate)}  –  ${formatYYYYMMDD(endDate)}`
              : 'Select date range to filter'}
          </AppText>
          <CalenderIcon size={20} color={colors.blue} />
        </Pressable>


        {loading ? (
          <ActivityIndicator size="large" color={colors.blue} style={{ marginTop: 60 }} />
        ) : tourPlanData.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <AppText size={16} color="#718096">
              No tour plans found
              {startDate && endDate ? ' in selected date range' : ''}
            </AppText>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
            <FlatList
              data={tourPlanData}
              keyExtractor={(item) => item?.id?.toString() ?? Math.random().toString()}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={() => (
                <View style={{ height: 40 }} />
              )}
              ListHeaderComponent={() => (
                <View style={[styles.boxView, styles.row, { marginTop: 12, }]}>
                  <View style={[styles.heading, { width: 112 }]}>
                    <AppText size={14} color="white" family="InterSemiBold">
                      Date
                    </AppText>
                  </View>
                  <View style={[styles.heading, { width: 140 }]}>
                    <AppText size={14} color="white" family="InterSemiBold">
                      District
                    </AppText>
                  </View>
                  <View style={[styles.heading, { width: 140 }]}>
                    <AppText size={14} color="white" family="InterSemiBold">
                      Visit Town
                    </AppText>
                  </View>
                  <View style={[styles.heading, { width: 160 }]}>
                    <AppText size={14} color="white" family="InterSemiBold">
                      Objective
                    </AppText>
                  </View>
                  <View style={[styles.heading, { width: 112 }]}>
                    <AppText size={14} color="white" family="InterSemiBold">
                      Status
                    </AppText>
                  </View>
                  <View style={[styles.heading, { width: 160 }]}>
                    <AppText size={14} color="white" family="InterSemiBold">
                      Rejection remark
                    </AppText>
                  </View>
                </View>
              )}
            />
          </ScrollView>
        )}
        {
          showCalendar && (
            <CustomerCalendar
              showCal={showCalendar}
              setShowCal={setShowCalendar}
              initialStartDate={startDate ?? undefined}
              initialEndDate={endDate ?? undefined}
              setStartDates={setStartDate}
              setEndDates={setEndDate}
              setRange={setRangeType}
              range={rangeType}
              onApplyClick={handleApplyDateRange}
              minimumDate={null}
              calendarType="reminder"
            // minimumDate={new Date(2023, 0, 1)}   // optional
            />
          )
        }

        <ActionSheet
          ref={statusSheetRef}
          gestureEnabled
          closable
          closeOnTouchBackdrop
          statusBarTranslucent
          containerStyle={{
            backgroundColor: 'white',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
          indicatorStyle={{ backgroundColor: colors.blue, width: 60 }}
        >
          {/* <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        > */}
          <View style={{ padding: 20, paddingBottom: 30 }}>

            <AppText
              size={18}
              family="InterSemiBold"
              color="black"
              style={{ marginBottom: 20, textAlign: 'center' }}
            >
              Change Status
            </AppText>

            <ScrollView style={{}}>

              {[
                { label: 'Pending', value: 0 },
                { label: 'Approved', value: 1 },
                { label: 'Rejected', value: 2 },
              ].map(opt => (
                <Pressable
                  key={opt.value}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: '#eee',
                    backgroundColor:
                      selectedStatus === opt.value
                        ? 'rgba(57,82,153,0.08)'
                        : 'transparent',
                  }}
                  onPress={() => setSelectedStatus(opt.value)}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor:
                        selectedStatus === opt.value ? colors.blue : '#ccc',
                      backgroundColor:
                        selectedStatus === opt.value ? colors.blue : 'transparent',
                      marginRight: 14,
                    }}
                  />
                  <AppText size={16} family="InterRegular" color="black">
                    {opt.label}
                  </AppText>
                </Pressable>
              ))}

              {/* REMARK INPUT (ONLY FOR REJECT) */}
              {selectedStatus === 2 && (
                <View
                  style={{
                    marginTop: 12,
                    padding: 12,
                    backgroundColor: '#f9f9f9',
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: '#eee',
                  }}
                >
                  <TextInput
                    style={{
                      fontSize: 16,
                      color: '#000',
                      minHeight: 60,
                      textAlignVertical: 'top',
                    }}
                    placeholder="Enter remark..."
                    placeholderTextColor="#999"
                    value={remark}
                    onChangeText={setRemark}
                    multiline
                    maxLength={120}
                  />
                </View>
              )}
              <View style={{ height: 40 }} />
            </ScrollView>

            {/* SUBMIT BUTTON */}
            <Pressable
              onPress={saveStatus}
              disabled={statusLoading}
              style={({ pressed }) => ({
                marginTop: 28,
                backgroundColor: statusLoading
                  ? '#a0aec0'
                  : pressed
                    ? '#2f4bb5'
                    : colors.blue,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
                opacity: statusLoading ? 0.7 : 1,
              })}
            >
              {statusLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <AppText size={16} color="white" family="InterBold">
                  Done
                </AppText>
              )}
            </Pressable>

          </View>
          {/* </KeyboardAvoidingView> */}
        </ActionSheet>
      </View>
    </SafeAreaView>
  )
}

export default UserTourList