
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SectionList,
  Pressable,
  Image,
  StatusBar,
  Modal,
  Text,
  TextInput,
  Linking,
} from 'react-native';

import AppText from '../../components/AppText/AppText';
import { colors } from '../../utils/Colors';
import { fonts } from '../../utils/typography';
import { rw } from '../../utils/responsive';
import store from '../../components/redux/Store';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';

const BORDER = '#cfd3e6';

const getShort = (zone: string) =>
  zone.split(' ').map(w => w[0]).join('').toUpperCase();

const RetailersPerformanceViewAllScreen = ({ navigation }: any) => {
  const [tab, setTab] = useState<'ASR' | 'DSR'>('ASR');
  const [activeFilter, setActiveFilter] = useState('User');
  const [sections, setSections] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeModal, setActiveModal] = useState<
    'user' | 'branch' | 'zone' | 'type' | null
  >(null);
  const [filters, setFilters] = useState({
    user: null as number | null,
    branch: '' as string,
    zone: '' as string,
  });


  const toNumber = (value: any) => Number(value || 0);

  const firstValue = (source: any, keys: string[]) => {
    for (const key of keys) {
      if (source?.[key] !== undefined && source?.[key] !== null) {
        return source[key];
      }
    }
    return 0;
  };

  const formatRetailersData = (zones: any[]) => {
    return zones.map((z) => ({
      title: z.zone,
      data: (z.users || z.rows || []).map((u: any) => ({
        name: u.name,
        branch: u.branch,
        reporting: u.reporting,
        registeredRetailers: toNumber(firstValue(u, [
          'registered_approved',
          'reg_approved',
          'registered_retailers',
          'secondary_customers_registered_approved_current_year',
        ])),
        today: toNumber(firstValue(u, [
          'today',
          'today_registered',
          'today_registered_approved',
          'today_registered_retailers',
          'secondary_customers_registered_approved_today',
        ])),
        uniqueOrders: toNumber(firstValue(u, [
          'unique_orders',
          'unique_ordered',
          'unique_retailers_ordered',
          'secondary_customers_with_order_current_year',
          'unique_retailers_month',
        ])),
        orderCount: toNumber(firstValue(u, [
          'no_of_orders',
          'orders',
          'order_count',
          'total_orders',
          'total_orders_current_year',
        ])),
        qtyK: toNumber(firstValue(u, [
          'order_total_qty',
          'qty_k',
          'quantity_k',
          'total_order_quantity_k',
        ])) || toNumber(u.total_order_quantity_current_year) / 1000,
        valueL: toNumber(firstValue(u, [
          'order_total_value',
          'value_l',
          'order_value_l',
          'total_order_value_l',
        ])) || toNumber(u.total_order_value_current_year) / 100000,
      })),
    }));
  };

  const [filterData, setFilterData] = useState<{
    users: any[];
    branches: any[];
    zones: any[];
  }>({
    users: [],
    branches: [],
    zones: [],
  });

  const getFilterName = (item: any) => {
    if (typeof item === 'string') return item;
    if (typeof item === 'number') return String(item);
    return item?.name || item?.branch || item?.branch_name || item?.zone || item?.zone_name || '';
  };

  const normalizeNameList = (items: any[] = []) =>
    items.map(getFilterName).filter(Boolean);

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    const token = store.getState()?.auth?.token;
    try {
      const res = await fetch(
        'https://duke.fieldkonnect.in/api/user-attendance-zone-branch',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      const json = await res.json();

      const data = json?.data || {};

      setFilterData({
        users: data.users || [],
        branches: normalizeNameList(data.branches || []),
        zones: normalizeNameList(data.zones || []),
      });
    } catch (e) {
      console.log(e);
    }
  };

  const getModalData = () => {
    switch (activeModal) {
      case 'user':
        return filterData.users;
      case 'branch':
        return filterData.branches;
      case 'zone':
        return filterData.zones;
      default:
        return [];
    }
  };

  const getLabel = (item: any) => {
    if (activeModal === 'user') return item?.name || '';
    return getFilterName(item);
  };

  const getValue = (item: any) => {
    if (activeModal === 'user') return item?.id;
    return getFilterName(item);
  };

  const checkSelected = (value: any) => {
    if (activeModal === 'user') return filters.user === value;
    if (activeModal === 'branch') return filters.branch === value;
    if (activeModal === 'zone') return filters.zone === value;
    return false;
  };
  useEffect(() => {
    fetchAttendanceWithFilters(filters, tab);
  }, [filters, tab]);

  const handleSelect = (value: any) => {
    let updatedFilters = { ...filters };

    if (activeModal === 'user') updatedFilters.user = value;
    if (activeModal === 'branch') updatedFilters.branch = value;
    if (activeModal === 'zone') updatedFilters.zone = value;

    setFilters(updatedFilters);
    setActiveModal(null);

    setTimeout(() => {
      fetchAttendanceWithFilters(updatedFilters, tab);
    }, 0);
  };

  const fetchAttendanceWithFilters = async (customFilters: any, tab?: any) => {
    const token = store.getState()?.auth?.token;
    try {
      let url = 'https://duke.fieldkonnect.in/api/sales/retailer-sales-summary?designation=' + (tab || 'asr').toLowerCase();

      if (customFilters.branch) {
        url += `&branch=${encodeURIComponent(customFilters.branch)}`;
      }

      if (customFilters.zone) {
        url += `&zone=${encodeURIComponent(customFilters.zone.toLowerCase())}`;
      }

      if (customFilters.user) {
        url += `&user_id=${customFilters.user}`;
      }

      if (customFilters.type) {
        url += `&status=${customFilters.type}`;
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const json = await res.json();

      if (json.success) {
        const zones = json.data?.zones || json.data || [];
        setSections(formatRetailersData(Array.isArray(zones) ? zones : [zones]));
      }
    } catch (err) {
      console.log(err, 'resssssssssssssssssssssss');
    }
  };


  const calculateSectionTotals = (data: any[]) => {
    const totals = {
      registeredRetailers: 0,
      today: 0,
      uniqueOrders: 0,
      orderCount: 0,
      qtyK: 0,
      valueL: 0,
    };

    data.forEach((item) => {
      totals.registeredRetailers += toNumber(item.registeredRetailers);
      totals.today += toNumber(item.today);
      totals.uniqueOrders += toNumber(item.uniqueOrders);
      totals.orderCount += toNumber(item.orderCount);
      totals.qtyK += toNumber(item.qtyK);
      totals.valueL += toNumber(item.valueL);
    });

    return totals;
  };

  const calculateGrandTotals = (sections: any[]) => {
    return calculateSectionTotals(
      sections.flatMap((s) => s.data)
    );
  };

  const grandTotals = calculateGrandTotals(sections);

  const today = new Date();

  // Date format
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const formattedDate = `${days[today.getDay()]}, ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;

  // Day calculation
  const currentDay = today.getDate();
  const totalDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const dayText = `Day ${currentDay}/${totalDays}`;

  const filteredModalData: any = getModalData().filter((item: any) => {
    const label = getLabel(item)?.toString().toLowerCase();
    return label.includes(search.toLowerCase());
  });

  return (
    <View style={styles.container} >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={"light-content"}
      />
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Image
            source={require('../../assets/images/Dummy/back.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </Pressable>
        <AppText size={14} color="#cdd1ed" family={'InterMedium'}>
          Retailers performance
        </AppText>

        <AppText size={26} color={colors.white} family={'InterBold'}>
          Retailers performance
        </AppText>

        <AppText size={14} color="#cdd1ed" family={'InterMedium'}>
          {formattedDate} · {dayText}
        </AppText>
        <View style={styles.tabs}>
          {['ASR', 'DSR'].map(t => (
            <Pressable
              key={t}
              onPress={() => {
                setTab(t as any)
                const filterData: any = {
                  user: null,
                  branch: '',
                  zone: '',
                }
                setFilters(filterData);
              }}
              style={[
                styles.tab,
                tab === t ? styles.activeTab : styles.inactiveTab,
              ]}
            >
              <AppText
                size={16}
                family={'InterBold'}
                color={tab === t ? colors.white : '#666'}
              >
                {t}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* TABS */}

      <View style={styles.selectedFiltersContainer}>

        {/* USER */}
        {filters.user && (
          <Pressable
            onPress={() => setFilters({ ...filters, user: null })}
            style={styles.selectedChip}
          >
            <Text>
              {filterData.users.find((u: any) => u.id === filters.user)?.name} ✕
            </Text>
          </Pressable>
        )}

        {/* BRANCH */}
        {filters.branch ? (
          <Pressable
            onPress={() => setFilters({ ...filters, branch: '' })}
            style={styles.selectedChip}
          >
            <Text>{filters.branch} ✕</Text>
          </Pressable>
        ) : null}

        {/* ZONE */}
        {filters.zone ? (
          <Pressable
            onPress={() => setFilters({ ...filters, zone: '' })}
            style={styles.selectedChip}
          >
            <Text>{filters.zone} ✕</Text>
          </Pressable>
        ) : null}



      </View>
      {/* FILTERS */}
      <View style={styles.filters}>
        {['Zone', 'Branch', 'User'].map((f, i) => (
          <Pressable
            key={i}
            onPress={() => {
              setSearch('')
              setActiveModal(f.toLowerCase() as any)
              setActiveFilter(f)
            }}
            style={[
              styles.filterBtn,
              activeFilter === f && styles.filterActive,
            ]}
          >
            <AppText
              size={14}
              family="InterMedium"
              color={activeFilter === f ? '#fff' : '#333'}
            >
              {f}
            </AppText>

            <Image
              source={require('../../assets/images/Dummy/downarrow.png')}
              style={styles.downImage}
              tintColor={activeFilter === f ? '#fff' : '#333'}
            />
          </Pressable>
        ))}
      </View>



      {/* TABLE */}
      <ScrollView horizontal>
        <View style={styles.tableWrapper}>

          {/* HEADER ROW */}
          <View style={styles.headerRow}>
            <AppText style={[styles.th, { textAlign: 'left', width: 170, }]}>Name</AppText>
            <AppText style={[styles.th, { textAlign: 'left', width: 170, }]}>Reporting Head</AppText>
            <AppText style={styles.th}>Branch</AppText>
            <AppText style={[styles.th, { width: 140 }]}>Retailers{'\n'}(Reg & App.)</AppText>
            <AppText style={styles.th}>+Today</AppText>
            <AppText style={styles.th}>Unique{'\n'}Ord.</AppText>
            <AppText style={styles.th}>No. of{'\n'}Orders</AppText>
            <AppText style={styles.th}>Qty{'\n'}(K)</AppText>
            <AppText style={styles.th}>Value{'\n'}({'\u20b9'} L)</AppText>
          </View>

          <SectionList
            sections={sections}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item, index }) => (
              <View style={[styles.row, {
                backgroundColor: index % 2 === 0 ? '#fff' : '#f5f5f5',
              }]}>

                {/* NAME */}
                <AppText style={styles.cellBold}>{item?.name || '-'}</AppText>
                <AppText onPress={()=>{
                      if (!item?.reporting?.mobile || item?.reporting?.mobile.length < 10) {
                        Toast.show({
                          type: 'error',
                          text1: 'Invalid Number',
                          text2: 'Please check the phone number.',
                        });
                        return;
                      }
                      const url = `tel:${item?.reporting?.mobile}`;
                      Linking.openURL(url).catch(() =>{
                        Toast.show({
                          type: 'error',
                          text1: 'Error',
                          text2: 'Unable to open dialer.',
                        });
                      });
                    }}
                   style={[styles.cellBold, {color:'blue'}]} underline='underline'>{item?.reporting?.name || '-'}</AppText>

                {/* BRANCH */}
                <AppText style={styles.cell}>{item?.branch || '-'}</AppText>

                {/* RETAILERS */}
                <AppText style={[styles.cell, { width: 140 }]}>
                  {item?.registeredRetailers || 0}
                </AppText>

                {/* TODAY */}
                <AppText style={[styles.cell, { color: '#0a6644' }]}>
                  +{item?.today || 0}
                </AppText>

                {/* UNIQUE ORDERS */}
                <AppText style={styles.cell}>
                  {item?.uniqueOrders || 0}
                </AppText>

                {/* ORDER COUNT */}
                <AppText style={styles.cell}>
                  {item?.orderCount || 0}
                </AppText>

                {/* QTY (K) */}
                <AppText style={styles.cell}>
                  {toNumber(item?.qtyK).toFixed(2)}
                </AppText>

                {/* VALUE (RUPEES L) */}
                <AppText style={styles.cell}>
                  {toNumber(item?.valueL).toFixed(2)}
                </AppText>

              </View>
            )}

            renderSectionHeader={({ section }: { section: any }) => (
              <AppText
                style={[
                  styles.zone,
                ]}
              >
                Zone - {section?.title}
              </AppText>
            )}

            renderSectionFooter={({ section }) => {
              const totals = calculateSectionTotals(section.data);

              return (
                <View style={[styles.totalRow, {
                }]}>

                  <AppText style={[styles.totalText, { width: 170, textAlign: 'left' }]}>
                    {getShort(section.title)} total
                  </AppText>

                  <AppText style={[styles.totalText, { width: 170, }]}></AppText>
                  <AppText style={styles.totalText}></AppText>

                  <AppText style={[styles.totalText, { width: 140 }]}>
                    {totals.registeredRetailers}
                  </AppText>

                  <AppText style={[styles.totalText, { color: '#0a6644' }]}>+{totals.today}</AppText>
                  <AppText style={styles.totalText}>{totals.uniqueOrders}</AppText>
                  <AppText style={styles.totalText}>{totals.orderCount}</AppText>
                  <AppText style={styles.totalText}>{totals.qtyK.toFixed(2)}</AppText>
                  <AppText style={styles.totalText}>{totals.valueL.toFixed(2)}</AppText>

                </View>
              );
            }}

            ListFooterComponent={() => (
              <View style={styles.grandTotal}>
                <AppText style={[styles.grandText, { width: 170, textAlign: 'left' }]}>
                  Grand Total
                </AppText>
                <AppText style={[styles.grandText, { width: 170, }]}></AppText>

                <AppText style={styles.grandText}></AppText>

                <AppText style={[styles.grandText, { width: 140 }]}>
                  {grandTotals.registeredRetailers}
                </AppText>

                <AppText style={styles.grandText}>+{grandTotals.today}</AppText>
                <AppText style={styles.grandText}>{grandTotals.uniqueOrders}</AppText>
                <AppText style={styles.grandText}>{grandTotals.orderCount}</AppText>
                <AppText style={styles.grandText}>{grandTotals.qtyK.toFixed(2)}</AppText>
                <AppText style={styles.grandText}>{grandTotals.valueL.toFixed(2)}</AppText>
              </View>
            )}
          />
        </View>
      </ScrollView>
      <Modal visible={!!activeModal} transparent animationType="slide" statusBarTranslucent>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>

            <View style={modalStyles.headerRow}>
              <Text style={modalStyles.title}>Select {activeModal}</Text>

              <Pressable onPress={() => setActiveModal(null)}>
                <Text style={modalStyles.closeIcon}>✕</Text>
              </Pressable>
            </View>
            {
              activeModal == 'user' && (
                <View style={{ marginVertical: 10 }}>
                  <TextInput
                    placeholder="Search user..."
                    value={search}
                    onChangeText={setSearch}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderWidth: 1,
                      borderColor: '#ddd',
                    }}
                  />
                </View>
              )
            }


            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredModalData?.length == 0 && (
                <Text style={{ textAlign: 'center', marginTop: 20 }}>
                  No results found
                </Text>
              )}
              {filteredModalData?.map((item: any, index: number) => {
                const label = getLabel(item);
                const value = getValue(item);

                const isSelected = checkSelected(value);

                return (
                  <Pressable
                    key={index}
                    onPress={() => handleSelect(value)}
                    style={[
                      modalStyles.row,
                      isSelected && modalStyles.activeRow,
                      { borderBottomColor: isSelected ? '#3b4ab9' : '#eee', }
                    ]}
                  >
                    <Text>{label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              onPress={() => setActiveModal(null)}
              style={modalStyles.applyBtn}
            >
              <Text style={{ color: '#fff' }}>Done</Text>
            </Pressable>

          </View>
        </View>
      </Modal>
       <SafeAreaView edges={['bottom']} />
    </View>
  );
};

export default RetailersPerformanceViewAllScreen;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f3f3',
  },

  header: {
    backgroundColor: colors.blue,
    padding: 16,
    paddingTop: 40
  },

  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  image: {
    width: rw(18),
    height: rw(18),
  },
  downImage: {
    width: rw(10),
    height: rw(10),
  },

  tabs: {
    flexDirection: 'row',
    // margin: 16,
    marginTop: 28,
    backgroundColor: '#e5e6ef',
    borderRadius: 30,
    padding: 4,
  },
  selectedFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    marginVertical: 8,
  },

  selectedChip: {
    backgroundColor: '#e5e6ef',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 6,
    marginBottom: 6,
  },


  tab: {
    flex: 1,
    padding: 8,
    borderRadius: 30,
    alignItems: 'center',
  },

  activeTab: {
    backgroundColor: colors.blue,
  },

  inactiveTab: {},

  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12
  },

  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,

  },
  filterActive: {
    backgroundColor: colors.blue,
  },


  tableWrapper: {
    borderWidth: 1,
    borderColor: BORDER,
    margin: 16,
  },

  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.blue,

  },

  subHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.blue,
  },

  th: {
    width: 120,
    color: '#fff',
    padding: 10,
    borderRightWidth: 3,
    borderColor: BORDER,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: fonts.InterBold
  },

  thGroup: {
    width: 180,
    textAlign: 'center',
    color: '#fff',
    padding: 10,
    borderRightWidth: 3,
    borderColor: BORDER,
    borderBottomWidth: 3,
    borderBottomColor: BORDER,
    fontSize: 14,
    fontFamily: fonts.InterBold
  },

  subTh: {
    width: 60,
    textAlign: 'center',
    color: '#fff',
    padding: 6,
    borderRightWidth: 3,
    borderColor: BORDER,
    fontSize: 14,
    fontFamily: fonts.InterBold
  },

  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderColor: '#ddd',
  },

  cell: {
    width: 120,
    textAlign: 'center',
    padding: 10,
    borderRightWidth: 3,
    borderColor: '#ddd',
    fontSize: 14,
    fontFamily: fonts.InterSemiBold,
    color: '#000'
  },

  cellBold: {
    width: 170,
    padding: 10,
    borderRightWidth: 3,
    borderColor: '#ddd',
    fontSize: 14,
    fontFamily: fonts.InterBold,
    color: '#000'
  },

  green: { color: '#428840' },

  zone: {
    backgroundColor: '#e9eaf6',
    padding: 10,
    color: '#4849ad',
    fontFamily: fonts.InterBold,
    fontSize: 14,
  },

  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#e8eaf7',
  },

  totalText: {
    width: 120,
    padding: 10,
    textAlign: 'center',
    color: colors.blue,
    fontFamily: fonts.InterBold,
    fontSize: 14,
  },

  grandTotal: {
    flexDirection: 'row',
    backgroundColor: colors.blue,
  },

  grandText: {
    width: 120,
    padding: 10,
    textAlign: 'center',
    color: '#fff',
    fontFamily: fonts.InterBold,
    fontSize: 14,
  },

});


const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
    minHeight: '80%'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  section: {
    marginTop: 10,
    marginBottom: 5,
    fontWeight: '600',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eee',
    borderRadius: 20,
    marginRight: 8,
  },
  activeChip: {
    backgroundColor: '#3b4ab9',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  btn: {
    padding: 10,
    borderRadius: 10,
    width: '45%',
    alignItems: 'center',
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#fff',
  },

  activeRow: {
    backgroundColor: '#e8eaf7', // light blue (matches your zone bg)
    borderColor: '#3b4ab9',
    borderWidth: 1,

  },

  applyBtn: {
    marginTop: 12,
    backgroundColor: '#3b4ab9', // same as your primary color
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  closeIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});
