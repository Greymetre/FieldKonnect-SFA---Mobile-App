import { View, FlatList, Pressable, ActivityIndicator, TextInput, TouchableWithoutFeedback, Keyboard, Modal, ScrollView } from 'react-native'
import { BASE_URL } from '../../api/AxiosClient';
import React, { useCallback, useEffect, useState } from 'react'
import { styles } from './styles'
import { rw } from '../../utils/responsive'
import AppText from '../../components/AppText/AppText'
import { ArrowDownIcon, CreateIcon, EyeIcon } from '../../assets/svgs/SvgsFile'
import { Dropdown } from 'react-native-element-dropdown'
import { colors } from '../../utils/Colors'
import Toast from 'react-native-toast-message'
import store from '../../components/redux/Store'
import { fonts, shadowStyle } from '../../utils/typography'

interface DropdownUser {
  label: string;
  value: number | string;
}

interface FilterOption {
  label: string;
  value: string;
  id?: number | string | null;
  zone?: string;
  zone_id?: number | string | null;
}

type TourPlanPageProps = {
  navigation: any
}
const TourPlanPage = ({ navigation }: TourPlanPageProps) => {

  const [selectedUserName, setSelectedUserName] = useState<string>('Select User');
  const [zones, setZones] = useState<FilterOption[]>([]);
  const [selectedZone, setSelectedZone] = useState<FilterOption | null>(null);
  const [isZoneFocus, setIsZoneFocus] = useState(false);
  const [designationOptions, setDesignationOptions] = useState<any[]>([]);
  const [selectedDesignations, setSelectedDesignations] = useState<string[]>([]);
  const [tempSelectedDesignations, setTempSelectedDesignations] = useState<string[]>([]);
  const [showDesignationModal, setShowDesignationModal] = useState(false);
  const [hasAppliedDefaultDesignations, setHasAppliedDefaultDesignations] = useState(false);
  const [hasShowDropDown, setHasShowDropDown] = useState<any>(false)
  const [users, setUsers] = useState<DropdownUser[]>([]);
  const [usersSelect, setUsersSelect] = useState<DropdownUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | string | null>(null);
  const [userSearchText, setUserSearchText] = useState('');
  const [statusCounts, setStatusCounts] = useState({ approved: 0, pending: 0, rejected: 0 });

  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [dropDownpage, setDropDownpage] = useState<number>(1);
  const [hasMoreDropDown, setHasMoreDropDown] = useState<boolean>(true);
  const [loadingDropDown, setLoadingDropDown] = useState<boolean>(false);


  const formatFilterOption = useCallback((item: any): FilterOption => {
    if (typeof item === 'string') {
      return { label: item, value: item, id: null };
    }

    const label =
      item?.name ||
      item?.zone ||
      item?.zone_name ||
      item?.branch ||
      item?.branch_name ||
      item?.label ||
      '';
    const id = item?.id ?? item?.value ?? null;

    return {
      label: String(label),
      value: String(id ?? label),
      id,
      zone: item?.zone || item?.zone_name || item?.zone?.name || item?.zone?.zone_name,
      zone_id: item?.zone_id || item?.zone?.id || null,
    };
  }, []);

  const getTourUserListUrl = useCallback((pageNum = 1, searchName = '') => {
    const params = new URLSearchParams({
      page: String(pageNum),
      per_page: '10',
    });

    if (searchName) params.append('search_name', searchName);
    if (selectedZone?.label) params.append('zone', selectedZone.label);
    if (selectedZone?.id) params.append('zone_id', String(selectedZone.id));
    if (selectedDesignations.length > 0) params.append('designation', selectedDesignations.join(','));

    return `${BASE_URL}api/tour/userlist?${params.toString()}`;
  }, [selectedZone, selectedDesignations]);

  const resetTourUserList = () => {
    setUsers([]);
    setUsersSelect([]);
    setPage(1);
    setDropDownpage(1);
    setHasMore(true);
    setHasMoreDropDown(true);
    setSelectedUserId(null);
    setSelectedUserName('Select User');
    setUserSearchText('');
  };

  const clearAllFilters = () => {
    setSelectedZone(null);
    setTempSelectedDesignations([]);
    setSelectedDesignations([]);
    setShowDesignationModal(false);
    resetTourUserList();
  };
  useEffect(() => {
    // handleCustomerList()
  }, [])

  const token = store.getState()?.auth?.token;



  const fetchDesignations = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${BASE_URL}api/designations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      const result = await response.json();
      const data = result?.data || [];

      if (result?.status === true && data.length > 0) {
        const formatted = data.map((item: any) => ({
          label: item.designation_name,
          value: item.id.toString(),
        }));

        setDesignationOptions(formatted);

        const defaultDesignations = formatted.filter((item: any) => {
          const name = item.label.toLowerCase().trim();
          return name === 'asr' || name === 'dsr';
        });

        if (defaultDesignations.length > 0 && !hasAppliedDefaultDesignations) {
          const defaultValues = defaultDesignations.map((item: any) => item.value);
          setTempSelectedDesignations(defaultValues);
          setSelectedDesignations(defaultValues);
        }
        setHasAppliedDefaultDesignations(true);
      } else {
        setDesignationOptions([]);
      }
    } catch (err) {
      console.error('Failed to fetch designations:', err);
      setDesignationOptions([]);
    }
  }, [token, hasAppliedDefaultDesignations]);

  const fetchZoneBranchFilters = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${BASE_URL}api/user-attendance-zone-branch`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      const result = await response.json();
      const filterData = result?.data || result || {};

      setZones((filterData.zones || []).map(formatFilterOption).filter((item: FilterOption) => item.label));
    } catch (err) {
      console.error('Failed to fetch zone filters:', err);
    }
  }, [token, formatFilterOption]);

  useEffect(() => {
    fetchDesignations();
    fetchZoneBranchFilters();
  }, [fetchDesignations, fetchZoneBranchFilters]);

  // Fetch paginated user list
  const fetchUsers = useCallback(async (pageNum = 1, searchName = '') => {
    if (!token) {
      Toast.show({ type: 'error', text1: 'Authentication token not found' });
      return;
    }

    setLoading(true);

    try {
      const url = getTourUserListUrl(pageNum, searchName);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const json = await response.json();

      if (json?.status_counts) {
        setStatusCounts({
          approved: Number(json.status_counts.approved || 0),
          pending: Number(json.status_counts.pending || 0),
          rejected: Number(json.status_counts.rejected || 0),
        });
      }

      if (json?.data?.data && Array.isArray(json.data.data)) {
        const newUsers = json.data.data.map((u: any) => ({
          label: u.name,
          value: u.user_id,
        }));
        // Append or replace based on page
        setUsers(prev => (pageNum === 1 ? newUsers : [...prev, ...newUsers]));
        setHasMore(json.data.current_page < json.data.last_page);
        setPage(pageNum);
      } else {
        Toast.show({ type: 'error', text1: 'Invalid user list response' });
      }
    } catch (err) {
      console.error('User fetch error:', err?.response);
      Toast.show({ type: 'error', text1: 'Could not load users' });
    } finally {
      setLoading(false);
    }
  }, [token, getTourUserListUrl]);

  const fetchUsersDataSelect = useCallback(async (pageNum = 1, searchName = '') => {
    setLoadingDropDown(true);
    if (!token) {
      Toast.show({ type: 'error', text1: 'Authentication token not found' });
      setLoadingDropDown(false);
      return;
    }
    const url = getTourUserListUrl(pageNum, searchName);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const json = await response.json();

      if (json?.data?.data && Array.isArray(json.data.data)) {

        const newUsers = json.data.data.map((u: any) => ({
          label: u.name,
          value: u.user_id,
        }));

        // add ALL option only on first page
        if (pageNum === 1) {
          const allOption = { label: 'All', value: 'all' };
          setUsersSelect([allOption, ...newUsers]);
        } else {
          setUsersSelect(prev => [...prev, ...newUsers]);
        }

        setHasMoreDropDown(json.data.current_page < json.data.last_page);
        setDropDownpage(pageNum);
      } else {
        Toast.show({ type: 'error', text1: 'Invalid user list response' });
      }
    } catch (err) {
      console.error('User fetch error:', err);
      Toast.show({ type: 'error', text1: 'Could not load users' });
    } finally {
      setLoadingDropDown(false);
    }
  }, [token, getTourUserListUrl]);

  // Fetch users once on mount and whenever zone/branch filters change.
  useEffect(() => {
    fetchUsers(1);
    fetchUsersDataSelect(1);
  }, [fetchUsers, fetchUsersDataSelect]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchUsers(page + 1);
    }
  }, [loading, hasMore, page, fetchUsers]);
  const loadMoreDropdown = useCallback(() => {
    if (!loadingDropDown && hasMoreDropDown) {
      fetchUsersDataSelect(dropDownpage + 1, userSearchText);
    }
  }, [loadingDropDown, hasMoreDropDown, dropDownpage, userSearchText, fetchUsersDataSelect]);


  const toggleDesignation = (value: string) => {
    setTempSelectedDesignations(prev =>
      prev.includes(value)
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };

  const handleApplyDesignationFilter = () => {
    setSelectedDesignations(tempSelectedDesignations);
    resetTourUserList();
    setShowDesignationModal(false);
  };

  const renderItem: any = useCallback((item: any) => {
    const itemD = item?.item
    const index = item?.index
    console.log(itemD, 'itemDitemDitemD');
    return (
      <View style={[styles.listItem, index % 2 === 0 && { backgroundColor: 'rgba(255, 255, 255, 0.6)' }, styles.row]}>
        <View style={{ flex: 1 }}>
          <AppText color='black' size={16} family='InterRegular' opacity={0.8}>{itemD?.label}</AppText>
        </View>
        <View style={[styles.row, { gap: 9 }]}>
          <Pressable style={[styles.iconView, styles.center]} onPress={() => navigation.navigate('CreatePlan', { item: itemD?.value })}>
            <CreateIcon />
          </Pressable>
          <Pressable style={[styles.iconView, styles.center]} onPress={() => {
            navigation.navigate('UserTourList', { item: itemD })
          }}>
            <EyeIcon />
          </Pressable>
        </View>
      </View>
    )
  }, [navigation])

  return (
    <View style={[styles.container, ]}> 
      <View style={styles.container}>

        <View style={styles.container}>
          <View style={[styles.container, { paddingHorizontal: rw(19) }]} >

            <View style={[styles.row, { justifyContent: 'space-between', marginTop: 16 }]}>
              <AppText size={15} color="black" family="InterBold">Filters</AppText>
              {(selectedZone || selectedUserId || selectedDesignations.length > 0) && (
                <Pressable onPress={clearAllFilters} style={styles.clearAllButton}>
                  <AppText color="#EF4444" size={13} family="InterMedium">Clear</AppText>
                </Pressable>
              )}
            </View>

            <View style={[styles.row, { gap: 10, marginTop: 12 }]}>
              <View style={{ flex: 1 }}>
                <Dropdown
                  style={[styles.dateTimeBox, isZoneFocus && { borderColor: colors.blue }]}
                  placeholderStyle={{ color: '#718096', fontSize: 14 }}
                  selectedTextStyle={{ color: 'black', fontSize: 14 }}
                  data={zones}
                  search
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Zone"
                  searchPlaceholder="Search zone..."
                  value={selectedZone?.value}
                  onFocus={() => setIsZoneFocus(true)}
                  onBlur={() => setIsZoneFocus(false)}
                  onChange={(item: FilterOption) => {
                    setSelectedZone(item);
                    resetTourUserList();
                  }}
                  renderRightIcon={() => <ArrowDownIcon />}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Pressable
                  style={[styles.dateTimeBox, styles.row, { justifyContent: 'space-between' }]}
                  onPress={() => setShowDesignationModal(true)}
                >
                  <AppText
                    color={tempSelectedDesignations.length > 0 ? 'black' : '#718096'}
                    size={14}
                    family="InterRegular"
                    numberOfLines={1}
                  >
                    {tempSelectedDesignations.length > 0
                      ? `${tempSelectedDesignations.length} selected`
                      : 'Select Designation'}
                  </AppText>
                  <ArrowDownIcon />
                </Pressable>
              </View>
            </View>


            {tempSelectedDesignations.length > 0 && (
              <Pressable style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }} onPress={() => setShowDesignationModal(true)}>
                {designationOptions
                  .filter(item => tempSelectedDesignations.includes(item.value))
                  .map(item => (
                    <View key={item.value} style={styles.designationChip}>
                      <AppText size={13} color="black">{item.label}</AppText>
                    </View>
                  ))}
              </Pressable>
            )}

            <View style={[styles.row, { gap: 10, marginVertical: 20 }]}>
              <Pressable style={[styles.dateTimeBox, styles.row, { justifyContent: 'space-between', flex: 1 }]}
                onPress={() => setHasShowDropDown(true)}>
                <View style={{ justifyContent: 'center' }}>
                  <AppText size={14} color="#718096" family="InterRegular">
                    {selectedUserName}
                  </AppText>
                </View>
                <ArrowDownIcon />
              </Pressable>
            </View>
            <View style={styles.statusChipRow}>
              <View style={[styles.statusChip, styles.approveStatusChip]}>
                <AppText size={13} family="InterSemiBold" color="#339D4F">
                  Approve ({statusCounts.approved})
                </AppText>
              </View>
              <View style={[styles.statusChip, styles.pendingStatusChip]}>
                <AppText size={13} family="InterSemiBold" color="#E78422">
                  Pending ({statusCounts.pending})
                </AppText>
              </View>
              <View style={[styles.statusChip, styles.rejectStatusChip]}>
                <AppText size={13} family="InterSemiBold" color="#D31111">
                  Reject ({statusCounts.rejected})
                </AppText>
              </View>
            </View>
            {hasShowDropDown && (
              <>
                <TouchableWithoutFeedback
                  onPress={() => {
                    setHasShowDropDown(false)
                    setUserSearchText('')
                    Keyboard.dismiss()
                  }}
                >
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0
                    }}
                  />
                </TouchableWithoutFeedback>
                <View style={[styles.listContainer, shadowStyle]}>

                  <View style={{ marginVertical: 16, marginHorizontal: 10 }}>
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: '#ddd',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        fontSize: 16,
                        backgroundColor: '#f9f9f9',
                        fontFamily: fonts.InterMedium,
                      }}
                      placeholder="Search user..."
                      value={userSearchText}
                      onChangeText={(text) => {
                        setUserSearchText(text)
                        setDropDownpage(1)
                        fetchUsersDataSelect(1, text)
                      }}
                    />
                  </View>

                  <FlatList

                    data={usersSelect}
                    keyExtractor={(item, index) =>
                      `${item?.value || index}`
                    }
                    renderItem={({ item }) => (
                      <Pressable
                        style={[
                          styles.innerContainer,
                          selectedUserId === item.value && {
                            backgroundColor: '#E6F0FF'
                          }
                        ]}
                        onPress={() => {

                          setSelectedUserId(item?.value)
                          setSelectedUserName(item?.label)
                          setHasShowDropDown(false)

                          // reset main list
                          setUsers([])
                          setPage(1)
                          setHasMore(true)

                          if (item.value === 'all') {
                            // show all users
                            fetchUsers(1)
                          } else {
                            // filter by selected user
                            fetchUsers(1, item?.label)
                          }

                        }}
                      >

                        <View
                          style={{ marginHorizontal: rw(10) }}
                        >
                          <AppText
                            color={selectedUserId === item.value ? colors.blue : 'black'} size={16} family='InterRegular' opacity={0.8}>
                            {item.label}
                          </AppText>

                        </View>
                      </Pressable>
                    )}

                    onEndReached={loadMoreDropdown}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                      loadingDropDown ? (
                        <ActivityIndicator
                          size="large"
                          color={colors.blue}
                        />
                      ) : null
                    }
                    showsVerticalScrollIndicator={false}
                  />
                </View>

              </>
            )}


            <FlatList
              data={users}
              keyExtractor={(item) => item?.value}
              onScroll={() => {
                if (hasShowDropDown) {
                  setHasShowDropDown(false);
                  setUserSearchText('')
                }
              }}
              maintainVisibleContentPosition={{ disabled: true }}
              scrollEventThrottle={16}
              ListEmptyComponent={
                loading ? <View style={{ flex: 1, marginTop: rw(50) }}>
                  <ActivityIndicator size="large" color={colors.blue} />
                </View> : (
                  <AppText size={16} color="gray" align="center" style={{ marginTop: rw(50) }}>
                    No users found
                  </AppText>
                )
              }
              ListFooterComponent={
                loading && page > 1 ? (
                  <ActivityIndicator size='large' color={colors.blue} style={{ marginVertical: rw(20) }} />
                ) : (
                  <View style={{height:50}} />
                )
              }
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              renderItem={renderItem} />

            <View style={{ height: 30 }} />
            {
              hasShowDropDown && (
                <TouchableWithoutFeedback
                  onPress={() => {
                    setHasShowDropDown(false)
                    setUserSearchText('')
                    Keyboard.dismiss()
                  }}
                >
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0
                    }}
                  />
                </TouchableWithoutFeedback>
              )
            }

          </View>
        </View>
      </View>


      <Modal
        visible={showDesignationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDesignationModal(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.designationModal}>
            <AppText size={18} family="InterBold" style={styles.modalTitle}>
              Select Designations
            </AppText>

            <ScrollView>
              {designationOptions.length > 0 ? (
                designationOptions.map(item => {
                  const isSelected = tempSelectedDesignations.includes(item.value);
                  return (
                    <Pressable
                      key={item.value}
                      onPress={() => toggleDesignation(item.value)}
                      style={styles.designationOption}
                    >
                      <View style={[
                        styles.designationCheckbox,
                        isSelected && styles.designationCheckboxSelected,
                      ]}>
                        {isSelected && <AppText color="white" size={16}>✓</AppText>}
                      </View>
                      <AppText size={15}>{item.label}</AppText>
                    </Pressable>
                  );
                })
              ) : (
                <AppText style={styles.emptyDesignationText}>No designations available</AppText>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setTempSelectedDesignations(selectedDesignations);
                  setShowDesignationModal(false);
                }}
                style={styles.cancelButton}
              >
                <AppText color="black" family="InterMedium">Cancel</AppText>
              </Pressable>
              <Pressable onPress={handleApplyDesignationFilter} style={styles.applyButton}>
                <AppText color="white" family="InterMedium">Apply</AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      
    </View>
  )
}

export default TourPlanPage
