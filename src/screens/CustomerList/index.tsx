import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import AppText from '../../components/AppText/AppText';
import { ArrowDownIcon, CrossIcon } from '../../assets/svgs/SvgsFile';
import { styles } from './styles';
import { rw } from '../../utils/responsive';
import { NavigationProp, ParamListBase, useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors } from '../../utils/Colors';
import { SearchSvgIcon } from '../../assets/svgs/HomePageSvgs';
import { DATA } from '../../components/Comman/CommanFunction';
import CustomerCard from '../../components/atoms/CustomerCard';
import { useGetUserCityListApi, useMutateBeatCustomerList, useMutateCustomerListApi, useMutateCustomerTypeListApi, useMutateSecondaryCustListApi } from '../../api/query/CustomerApi';
import SecondaryCustomerCard from '../../components/atoms/SecondaryCustomerCard';
import Geolocation from '@react-native-community/geolocation';
import Toast from 'react-native-toast-message';
import store from '../../components/redux/Store';
import axios from 'axios';
import useLocationHook from '../../api/hooks/uselocationhook';
import { current } from '@reduxjs/toolkit';
const CustomerList = ({ route }: any) => {
  const [focusText, setFocusText] = useState(false);
  const [loader, setLoader] = useState(false);
  const [loader1, setLoader1] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [customerData, setCustomerData] = useState<any[]>([]);
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { mutateAsync: mutateCustomerList } = useMutateCustomerListApi();
  const { mutateAsync: mutateCustomerTypeList } = useMutateCustomerTypeListApi();
  const { mutateAsync: mutateSecondaryCustList } = useMutateSecondaryCustListApi();
  const { mutateAsync: mutateBeatCustomerList } = useMutateBeatCustomerList();
  const { mutateAsync: getUserCities } = useGetUserCityListApi();
  // const [currentLat, setCurrentLat] = useState<number | null>(null)
  // const [currentLng, setCurrentLng] = useState<number | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isPunchedIn, setIsPunchedIn] = useState<any>(false);
  const [hasActiveCheckInSomewhere, setHasActiveCheckInSomewhere] = useState(false);
  const [activeCheckInCustomerId, setActiveCheckInCustomerId] = useState<string | null>(null);
  const customerTypeId = route?.params?.customerTypeId;
  const customerTypeName = route?.params?.customerTypeName;
  const isCustomerTypeList = !!customerTypeId;
  const isSecondary = !!route?.params?.type && !isCustomerTypeList;
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const [showCityModal, setShowCityModal] = useState(false);
  const [cityList, setCityList] = useState<any[]>([]);
  const [cityPage, setCityPage] = useState(1);
  const [cityHasMore, setCityHasMore] = useState(true);
  const [cityLoading, setCityLoading] = useState(false);
  const [currentCheckin, setCurrentCheckin] = useState<any>();
  const [citySearchText, setCitySearchText] = useState('');
  const [selectedCity, setSelectedCity] = useState<any>(null);

  // STATUS
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('All'); // ✅ default

  // Add these near your other states
  const [showUserModal, setShowUserModal] = useState(false);
  const [userList, setUserList] = useState<any[]>([]);
  const [userSearchText, setUserSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const STATUS_LIST = [
    { label: 'All', value: 'All' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Rejected', value: 'REJECTED' },
  ];
  useFocusEffect(
    useCallback(() => {
      if (route?.params?.type || isCustomerTypeList) {
        fetchCustomers(
          1,
          false,
          selectedStatus,
          selectedCity,
          selectedUser
        );

      } else {
        fetchCustomers(1);
      }
      fetchPunchInStatus()
      // setSelectedCity(null)
      // setSelectedStatus('All')
      // setSearchText('')
      // setSelectedUser(null)
    }, [selectedStatus, selectedCity, selectedUser])
  )

  // Option A: Fixed title (recommended for most cases)
  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        headerTitle: `${customerTypeName || 'Customers'}${total ? ` (${total})` : ''}`,
      });
    }, [navigation, total, customerTypeName])
  );


  const fetchHierarchyUsers = async () => {
    try {
      const token = store.getState()?.auth?.token;

      const res = await axios.get(
        'https://duke.fieldkonnect.in/api/getMyHierarchyUsers', // ← your endpoint 
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            type: route?.params?.type,
            customer_type_id: customerTypeId,
          },
        }
      );

      if (res?.data?.status) {
        setUserList(res.data.users || []); // assuming response has users array
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Failed to load users' });
      console.log('Hierarchy users fetch error:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      handleCUrtrentCheckin()
    }, [])
  )



  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchCustomers(1, false);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchText]);


  const fetchPunchInStatus = async () => {
    try {
      const token = store.getState()?.auth?.token;

      const res = await axios.get('https://duke.fieldkonnect.in/api/getPunchin', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = res.data;

      if (data.status === 'success' && data.data?.length > 0) {
        const latest = data.data[0]; // assuming latest or only one for today
        // You may want to also check punchin_date === today's date
        const isToday =
          latest.punchin_date ===
          new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(new Date());

        if (isToday && latest?.punchin_date && !latest?.punchout_date) {
          setIsPunchedIn(true);
        } else {
          setIsPunchedIn(false);
        }
        if (latest?.punchout_date && latest?.punchin_date && isToday) {
          setIsPunchedIn("end");
        }
      } else {
        setIsPunchedIn(false);
      }
    } catch (err) {
      console.error('Failed to fetch punch-in status:', err);
      setIsPunchedIn(false)
    } finally {
    }
  }


  const loadMore = () => {
    if (!loader && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchCustomers(nextPage, true);
    }
  };

  const fetchCities = async (pageNumber = 1, isLoadMore = false) => {
    if (cityLoading || (isLoadMore && !cityHasMore)) return;

    try {
      setCityLoading(true);
      const res = await getUserCities({ page: pageNumber, per_page: 20 });
      const payload = res?.data?.data;
      const rawCities = Array.isArray(payload) ? payload : payload?.data || [];
      const cities = rawCities.map((item: any) => ({
        ...item,
        id: item?.id ?? item?.city_id,
        city_name: item?.city_name ?? item?.name ?? item?.city ?? '',
      })).filter((item: any) => item.id && item.city_name);

      setCityList((previous: any[]) => {
        const combined = isLoadMore ? [...previous, ...cities] : cities;
        return combined.filter((city: any, index: number, all: any[]) =>
          all.findIndex((item: any) => String(item.id) === String(city.id)) === index
        );
      });
      setCityPage(pageNumber);
      setCityHasMore(payload?.last_page
        ? pageNumber < payload.last_page
        : cities.length === 20);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Failed to load cities' });
    } finally {
      setCityLoading(false);
    }
  };
  const handleCUrtrentCheckin = async () => {
    try {
      const token = store.getState()?.auth?.token;

      const res = await axios.get(
        'https://duke.fieldkonnect.in/api/getCurrentOpenCheckin',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log(res, 'resresresresresresres')
      if (res?.data?.status == "success") {
        setCurrentCheckin(res?.data?.open_checkin);
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Failed to load cities' });
    }
  };

  const filteredCities = cityList.filter((item: any) =>
    item.city_name.toLowerCase().includes(citySearchText.toLowerCase())
  );

  const { coords, } = useLocationHook();

  // Access as
  const currentLat = coords?.latitude;
  const currentLng = coords?.longitude;

  const fetchCustomers = useCallback(async (
    pageNumber = 1,
    isLoadMore = false,
    overrideStatus?: string,
    overrideCity?: any,
    overrideUser?: any,
    clearCity = false,
    clearUser = false
  ) => {
    try {
      setLoader(true);

      let res;
      if (route?.params?.beatId) {
        res = await mutateBeatCustomerList({
          type: route?.params?.beatId,
          search: searchText,
          page: pageNumber,
          status: overrideStatus == 'All'
            ? null
            : overrideStatus ? overrideStatus : selectedStatus === 'All'
              ? null
              : overrideStatus ?? selectedStatus,
          city_name: clearCity ? null : overrideCity?.city_name ?? selectedCity?.city_name,
          // for_user_id: clearUser ? null : overrideUser?.id ?? selectedUser?.id,
        });
      } else if (isCustomerTypeList) {
        res = await mutateCustomerTypeList({
          customer_type_id: customerTypeId,
          search: searchText,
          page: pageNumber,
          pageSize: 5,
          city_name: clearCity ? undefined : overrideCity?.city_name ?? selectedCity?.city_name,
          for_user_id: clearUser ? undefined : overrideUser?.id ?? selectedUser?.id,
        });
      } else if (isSecondary) {
        res = await mutateSecondaryCustList({
          type: route.params.type,
          search: searchText,
          page: pageNumber,
          status: overrideStatus == 'All'
            ? null
            : overrideStatus ? overrideStatus : selectedStatus === 'All'
              ? null
              : overrideStatus ?? selectedStatus,
          city_name: clearCity ? null : overrideCity?.city_name ?? selectedCity?.city_name,
          for_user_id: clearUser ? null : overrideUser?.id ?? selectedUser?.id,
        });
        console.log('Secondary customer list response:', {
          type: route.params.type,
          search: searchText,
          page: pageNumber,
          status: overrideStatus == 'All'
            ? null
            : overrideStatus ? overrideStatus : selectedStatus === 'All'
              ? null
              : overrideStatus ?? selectedStatus,
          city_name: clearCity ? null : overrideCity?.city_name ?? selectedCity?.city_name,
          for_user_id: clearUser ? null : overrideUser?.id ?? selectedUser?.id,
        });
      } else {
        res = await mutateCustomerList({
          search: searchText,
          page: pageNumber,
        });
      }


      const newData = res?.data?.data?.data || [];
      if (isLoadMore) {
        setCustomerData(prev => [...prev, ...newData]);
      } else {
        // if(route?.params?.beatId) return
        if (newData?.length == 0 && pageNumber == 1) {
          setCustomerData([])
        } else {
          setCustomerData(newData);
        }
      }


      const pagination = res?.data?.data;
      setHasMore(
        pagination?.last_page
          ? pageNumber < pagination.last_page
          : newData.length > 0
      );
      setTotal(res?.data?.data?.total);

    } catch (error: any) {
      console.log("Customer list error:", error?.response);
    } finally {
      setLoader(false);
      setLoader1(false)
    }
  }, [searchText, isCustomerTypeList, customerTypeId, isSecondary, selectedStatus, selectedCity, selectedUser, navigation, route]);


  const clearFilters = () => {
    setSelectedCity(null);
    setCitySearchText('');
    setShowCityModal(false);
    setSelectedStatus(selectedStatus); // default
    setLoader1(true);
    fetchCustomers(1, false, selectedStatus, null, null, true);
    // fetchCustomers(1, false, selectedStatus, null);
  };

  const clearFiltersUser = () => {
    setSelectedCity(null);
    setSelectedUser(null);               // ← reset user
    setCitySearchText('');
    setUserSearchText('');
    setShowCityModal(false);
    setShowUserModal(false);
    setShowStatusModal(false);
    setLoader1(true);
    setPage(1);
    fetchCustomers(1, false, selectedStatus, selectedCity, null, false, true); // clear city & user
  };

  return (
    <View style={styles.container}>
      <View style={[styles.container, { paddingHorizontal: rw(18) }]} >
        <View style={[styles.textInputMainView, {
          marginTop: rw(15),
        }]}>
          <SearchSvgIcon />
          <TextInput
            placeholder="Search Customer..."
            placeholderTextColor={'rgba(255, 255, 255, 0.5)'}
            style={[styles.textInput]}
            value={searchText}
            onSubmitEditing={() => {
              Keyboard.dismiss();
            }}
            onChangeText={setSearchText}
            onFocus={() => setFocusText(true)}
            onBlur={() => setFocusText(false)}
          />
          {searchText && (
            <Pressable style={styles.icon} onPress={() => {
              setSearchText('')
            }}>
              <CrossIcon />
            </Pressable>
          )}
        </View>
        {
          (route?.params?.type || isCustomerTypeList) && (
            <View style={[styles.row, { gap: 13, marginVertical: 15 }]}>
              {route?.params?.type && (
                <Pressable
                  style={[styles.UserBox, styles.row]}
                  onPress={() => setShowStatusModal(true)}
                >
                  <View style={{ flex: 1 }}>
                    <AppText size={12} color="black">
                      {selectedStatus}
                    </AppText>
                  </View>
                  <ArrowDownIcon />
                </Pressable>
              )}
              {
                !route?.params?.beatId && (
                  <Pressable
                    style={[styles.UserBox, styles.row]}
                    onPress={() => {
                      setShowUserModal(true);
                      fetchHierarchyUsers();
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <AppText
                        size={12}
                        color={selectedUser ? 'black' : '#718096'}
                      >
                        {selectedUser ? selectedUser.name : 'User'}
                      </AppText>
                    </View>
                    <ArrowDownIcon />
                  </Pressable>
                )
              }


              <Pressable
                style={[styles.UserBox, styles.row]}
                onPress={() => {
                  setShowCityModal(true);
                  setCityPage(1);
                  setCityHasMore(true);
                  fetchCities(1);
                }}
              >
                <View style={{ flex: 1 }}>
                  <AppText size={12} color={selectedCity ? 'black' : '#718096'}>
                    {selectedCity ? selectedCity.city_name : 'City'}
                  </AppText>
                </View>
                <ArrowDownIcon />
              </Pressable>
            </View>
          )
        }

        {
          loader1 && page == 1 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.blue} />
            </View>
          ) : (
            <FlatList
              data={customerData}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item, index }) => {
                if (route?.params?.beatId) {
                  return (
                    <SecondaryCustomerCard currentLat={currentLat} currentLng={currentLng} locationError={locationError} item={item?.customer} navigation={navigation} index={index} isPunchedIn={isPunchedIn} onCheckInPress={() => {
                      handleCUrtrentCheckin()
                    }} />
                  )
                } else if (isSecondary || isCustomerTypeList) {
                  return (
                    <SecondaryCustomerCard currentLat={currentLat} currentLng={currentLng} locationError={locationError} item={item} navigation={navigation} index={index} isPunchedIn={isPunchedIn} onCheckInPress={() => {
                      handleCUrtrentCheckin()
                    }} />
                  )
                } else {
                  return (<CustomerCard currentLat={currentLat} currentLng={currentLng} locationError={locationError} item={item} navigation={navigation} index={index} isPunchedIn={isPunchedIn} onCheckInPress={() => {
                    handleCUrtrentCheckin()
                  }} />)
                }
              }}
              ListHeaderComponent={() => {
                const currentDetails = currentCheckin?.entity_details;
                const currentCustomerId =
                  currentDetails?.customer_id ||
                  currentDetails?.id ||
                  currentCheckin?.entity_id;
                const listedCustomer = customerData.find((customer: any) =>
                  String(customer?.customer_id || customer?.id) === String(currentCustomerId),
                );
                const currentCustomer = currentDetails ? {
                  ...listedCustomer,
                  ...currentDetails,
                  id: currentDetails?.id || currentDetails?.customer_id || currentCheckin?.entity_id,
                  customer_id: currentDetails?.customer_id || currentDetails?.id || currentCheckin?.entity_id,
                } : null;
                const usesCustomerModel =
                  isCustomerTypeList ||
                  isSecondary ||
                  currentCheckin?.entity_type === 'customer' ||
                  currentCheckin?.entity_type === 'secondary_customer';

                if (currentCustomer && usesCustomerModel) {
                  return (
                    <SecondaryCustomerCard currentLat={currentLat} currentLng={currentLng} locationError={locationError} item={currentCustomer} navigation={navigation} index={-1} isPunchedIn={isPunchedIn} type={currentCheckin} />
                  )
                } else if (
                  currentCustomer &&
                  currentCheckin?.entity_type === 'distributor'
                ) {
                  return (
                    <CustomerCard currentLat={currentLat} currentLng={currentLng} locationError={locationError} item={currentCustomer} navigation={navigation} index={-1} isPunchedIn={isPunchedIn} type={currentCheckin} />
                  )
                }
              }}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={() => (
                <View style={{ justifyContent: 'center', alignItems: 'center', paddingTop: 40 }}>
                  <AppText size={16} family='InterMedium' color='black'>No customer found</AppText>
                </View>
              )}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={() =>
                loader && page > 1 ? (
                  <View style={{ paddingVertical: 20 }}>
                    <ActivityIndicator size="large" color={colors.blue} />
                  </View>
                ) : (
                  <View style={{ height: 30 }} />
                )
              }

            />
          )
        }

      </View>
      <Modal visible={showStatusModal} statusBarTranslucent transparent animationType="slide">
        <Pressable
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
          onPress={() => setShowStatusModal(false)}
        >
          <Pressable style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,

          }}>
            <AppText size={18} family="InterSemiBold">Select Status</AppText>
            <View style={{ height: 20 }} />
            {STATUS_LIST.map(item => (
              <Pressable
                key={item.value}
                onPress={() => {
                  setSelectedStatus(item.value);
                  setShowStatusModal(false);
                  setLoader1(true);
                  setPage(1);
                  fetchCustomers(1, false, item.value, selectedCity);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: '#eee',

                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor:
                      selectedStatus === item.value ? colors.blue : '#ccc',
                    backgroundColor:
                      selectedStatus === item.value ? colors.blue : 'transparent',
                    marginRight: 14,
                  }}
                />
                <AppText size={16} family="InterRegular" color="black">
                  {item.label}
                </AppText>
                {/* <AppText size={16}>{item.label}</AppText> */}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
      <Modal visible={showCityModal} statusBarTranslucent transparent animationType="slide">
        <Pressable
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
          onPress={() => setShowCityModal(false)}
        >
          <Pressable style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            height: '75%',
          }}>
            <View style={{ flexDirection: "row", alignItems: 'center', justifyContent: 'space-between', }}>
              <AppText size={18} family="InterSemiBold">Select City</AppText>
              <Pressable
                onPress={clearFilters}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 20,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#ccc',
                }}
              >
                <AppText size={14} family='InterMedium' color='black'>Clear Filter</AppText>
              </Pressable>
            </View>

            {/* SEARCH */}
            <TextInput
              placeholder="Search city..."
              value={citySearchText}
              onChangeText={setCitySearchText}
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                padding: 10,
                marginVertical: 12,
              }}
            />

            {/* LIST */}
            <FlatList
              data={filteredCities}
              keyExtractor={item => String(item.id)}
              onEndReached={() => fetchCities(cityPage + 1, true)}
              onEndReachedThreshold={0.5}
              ListFooterComponent={cityLoading ? (
                <ActivityIndicator size="small" color={colors.blue} />
              ) : null}
              renderItem={({ item }: { item: any }) => (
                <Pressable
                  onPress={() => {
                    setSelectedCity(item);
                    setShowCityModal(false);
                    setCitySearchText('');
                    setLoader1(true);
                    setPage(1);
                    fetchCustomers(1, false, selectedStatus, item);
                  }}
                  style={({ pressed }) => ({
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderColor: '#eee',
                    backgroundColor: pressed ? '#f5f5f5' : 'transparent',
                  })}
                >
                  <AppText size={16}>{item.city_name}</AppText>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
      <Modal visible={showUserModal} statusBarTranslucent transparent animationType="slide">
        <Pressable
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
          onPress={() => setShowUserModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              height: '75%',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <AppText size={18} family="InterSemiBold">Select User</AppText>
              <Pressable
                onPress={clearFiltersUser}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 20,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#ccc',
                }}
              >
                <AppText size={14} family="InterMedium" color="black">Clear Filter</AppText>
              </Pressable>
            </View>

            {/* Search */}
            <TextInput
              placeholder="Search user..."
              value={userSearchText}
              onChangeText={setUserSearchText}
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                padding: 10,
                marginVertical: 12,
              }}
            />

            {/* List */}
            <FlatList
              data={userList.filter((item: any) =>
                item.name?.toLowerCase().includes(userSearchText.toLowerCase())
              )}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }: { item: any }) => (
                <Pressable
                  onPress={() => {
                    setSelectedUser(item);
                    setShowUserModal(false);
                    setUserSearchText('');
                    setLoader1(true);
                    setPage(1);
                    fetchCustomers(1, false, selectedStatus, selectedCity, item);
                  }}
                  style={({ pressed }) => ({
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderColor: '#eee',
                    backgroundColor: pressed ? '#f5f5f5' : 'transparent',
                  })}
                >
                  <AppText size={16}>{item.name}</AppText>
                  {/* Optional: show more info */}
                  {/* <AppText size={13} color="#666">{item.mobile || '—'}</AppText> */}
                </Pressable>
              )}
              ListEmptyComponent={() => (
                <AppText style={{ textAlign: 'center', marginTop: 30 }}>
                  No users found
                </AppText>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>

  );
}


export default CustomerList;
