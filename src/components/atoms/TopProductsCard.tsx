// import React, { useState } from 'react';
// import { View, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
// import AppText from '../AppText/AppText';
// import { rw } from '../../utils/responsive';
// import { colors } from '../../utils/Colors';
// import { formatShortNumber } from '../../utils/misc';
// import AnimatedSwitch from '../AnimatedSwitch/AnimatedSwitch';

// const TopProductsCard = ({ data }: { data: any }) => {
//     const [activeTab, setActiveTab] = useState<'YTD' | 'MTD'>('YTD');

//     const totalYTDQuantity = data?.top_5_products_current_year?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
//     const totalYTDValue = data?.top_5_products_current_year?.reduce((sum: number, item: any) => sum + (item.value || 0), 0) || 0;
//     const totalMTDValue = data?.top_5_products_current_month?.reduce((sum: number, item: any) => sum + (item.value || 0), 0) || 0;
//     const totalMTDQuantity = data?.top_5_products_current_month?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
//     const products = [
//         {
//             rank: 1,
//             name: data?.top_5_products_current_year?.[0]?.product_name,
//             value: data?.top_5_products_current_year?.[0]?.quantity || 0,
//             progress: `${(data?.top_5_products_current_year?.[0]?.quantity || 1) / totalYTDQuantity * 100}%`,
//             color: '#fac775',
//             value2: data?.top_5_products_current_year?.[0]?.value || 0,
//             progress2: `${(data?.top_5_products_current_year?.[0]?.value || 1) / totalYTDValue * 100}%`
//         },

//         {
//             rank: 2,
//             name: data?.top_5_products_current_year?.[1]?.product_name,
//             value: data?.top_5_products_current_year?.[1]?.quantity || 0,
//             progress: `${(data?.top_5_products_current_year?.[1]?.quantity || 1) / totalYTDQuantity * 100}%`,
//             color: '#d3d1c7',
//             value2: data?.top_5_products_current_year?.[1]?.value || 0,
//             progress2: `${(data?.top_5_products_current_year?.[1]?.value || 1) / totalYTDValue * 100}%`
//         },
//         {
//             rank: 3,
//             name: data?.top_5_products_current_year?.[2]?.product_name,
//             value: data?.top_5_products_current_year?.[2]?.quantity || 0,
//             progress: `${(data?.top_5_products_current_year?.[2]?.quantity || 1) / totalYTDQuantity * 100}%`,
//             color: '#f5c4b3',
//             value2: data?.top_5_products_current_year?.[2]?.value || 0,
//             progress2: `${(data?.top_5_products_current_year?.[2]?.value || 1) / totalYTDValue * 100}%`

//         },
//         {
//             rank: 4, name: data?.top_5_products_current_year?.[3]?.product_name, value: data?.top_5_products_current_year?.[3]?.quantity || 0, progress: `${(data?.top_5_products_current_year?.[3]?.quantity || 1) / totalYTDQuantity * 100}%`, color: '#e8eaf2',
//             value2: data?.top_5_products_current_year?.[3]?.value || 0,
//             progress2: `${(data?.top_5_products_current_year?.[3]?.value || 1) / totalYTDValue * 100}%`
//         },

//         {
//             rank: 5, name: data?.top_5_products_current_year?.[4]?.product_name, value: data?.top_5_products_current_year?.[4]?.quantity || 0, progress: `${(data?.top_5_products_current_year?.[4]?.quantity || 1) / totalYTDQuantity * 100}%`, color: '#e8eaf2',
//             value2: data?.top_5_products_current_year?.[4]?.value || 0,
//             progress2: `${(data?.top_5_products_current_year?.[4]?.value || 1) / totalYTDValue * 100}%`
//         },
//     ];
//     const products1 = [
//         {
//             rank: 1, name: data?.top_5_products_current_month?.[0]?.product_name, value: data?.top_5_products_current_month?.[0]?.quantity || 0, progress: `${(data?.top_5_products_current_month?.[0]?.quantity || 1) / totalMTDQuantity * 100}%`, color: '#fac775',
//             value2: data?.top_5_products_current_month?.[0]?.value || 0,
//             progress2: `${(data?.top_5_products_current_month?.[0]?.value || 1) / totalMTDValue * 100}%`
//         },
//         {
//             rank: 2, name: data?.top_5_products_current_month?.[1]?.product_name, value: data?.top_5_products_current_month?.[1]?.quantity || 0, progress: `${(data?.top_5_products_current_month?.[1]?.quantity || 1) / totalMTDQuantity * 100}%`, color: '#d3d1c7',
//             value2: data?.top_5_products_current_month?.[1]?.value || 0,
//             progress2: `${(data?.top_5_products_current_month?.[1]?.value || 1) / totalMTDValue * 100}%`
//         },
//         {
//             rank: 3, name: data?.top_5_products_current_month?.[2]?.product_name, value: data?.top_5_products_current_month?.[2]?.quantity || 0, progress: `${(data?.top_5_products_current_month?.[2]?.quantity || 1) / totalMTDQuantity * 100}%`, color: '#f5c4b3',
//             value2: data?.top_5_products_current_month?.[2]?.value || 0,
//             progress2: `${(data?.top_5_products_current_month?.[2]?.value || 1) / totalMTDValue * 100}%`
//         },
//         {
//             rank: 4, name: data?.top_5_products_current_month?.[3]?.product_name, value: data?.top_5_products_current_month?.[3]?.quantity || 0, progress: `${(data?.top_5_products_current_month?.[3]?.quantity || 1) / totalMTDQuantity * 100}%`, color: '#e8eaf2',
//             value2: data?.top_5_products_current_month?.[3]?.value || 0,
//             progress2: `${(data?.top_5_products_current_month?.[3]?.value || 1) / totalMTDValue * 100}%`
//         },
//         {
//             rank: 5, name: data?.top_5_products_current_month?.[4]?.product_name, value: data?.top_5_products_current_month?.[4]?.quantity || 0, progress: `${(data?.top_5_products_current_month?.[4]?.quantity || 1) / totalMTDQuantity * 100}%`, color: '#e8eaf2',
//             value2: data?.top_5_products_current_month?.[4]?.value || 0,
//             progress2: `${(data?.top_5_products_current_month?.[4]?.value || 1) / totalMTDValue * 100}%`
//         },
//     ];

//     let productsToDisplay = activeTab === 'YTD' ? products : products1;
//     const onSwitchChange = () => {

//     }
//     return (
//         <View style={styles.container}>

//             {/* Products List */}
//             <View style={styles.card}>
//                 <View style={{ width: '100%', flexDirection: "row", alignItems: "center", flex: 1, gap : 6 }}>
//                     <View style={[styles.topTabs, {flex: 1, marginTop: 12}]}>
//                         <Pressable style={[styles.tab, activeTab === 'YTD' && styles.activeTab]}
//                             onPress={() => setActiveTab('YTD')}>
//                             <AppText size={14} family="InterMedium" color={activeTab === 'YTD' ? 'white' : '#64748B'}>
//                                 YTD
//                             </AppText>
//                         </Pressable>
//                         <Pressable
//                             style={[styles.tab, activeTab === 'MTD' && styles.activeTab]}
//                             onPress={() => setActiveTab('MTD')}>
//                             <AppText
//                                 size={14}
//                                 family="InterMedium"
//                                 color={activeTab === 'MTD' ? 'white' : '#64748B'}
//                             >
//                                 MTD
//                             </AppText>
//                         </Pressable>
//                     </View>
//                     <AnimatedSwitch
//                         text1="Qty."
//                         text2="Val."
//                         dataPress={onSwitchChange}
//                         height={40}
//                     />
//                 </View>
//                 {productsToDisplay?.map((item, index) => (
//                     <View key={index} style={styles.productRow}>
//                         <View style={styles.rankContainer}>
//                             <View style={[styles.rankCircle, { backgroundColor: item.color }]}>
//                                 <AppText size={13} family="InterSemiBold" color="#1F2937">
//                                     {item.rank}
//                                 </AppText>
//                             </View>
//                         </View>
//                         <View style={{ flex: 1, marginLeft: 8 }}>
//                             <View style={{ flexDirection: 'row', justifyContent: 'space-between', }}>
//                                 <View style={{ flex: 0.9, marginRight: 8 }}>
//                                     <AppText numLines={1} size={16} family="InterMedium" color="#000">
//                                         {item.name}
//                                     </AppText>
//                                 </View>
//                                 <AppText size={17} family="InterSemiBold" color="#3a4da0">
//                                     <AppText align='right' size={10} family="InterSemiBold" color="#3a4da0">
//                                         {' '}(QTY){' '}
//                                     </AppText>
//                                     {formatShortNumber(item.value)}
//                                 </AppText>
//                             </View>

//                             {/* Progress Bar */}
//                             <View style={[styles.progressBg, {marginBottom: 10}]}>
//                                 <View style={[styles.progressFill, { width: item.progress }]} />
//                             </View>
//                             <AppText align='right' size={17} family="InterSemiBold" color="#1f5f14be">
//                                 <AppText align='right' size={10} family="InterSemiBold" color="#1f5f14be">
//                                     {' '}(Value){' '}
//                                 </AppText>
//                                 {formatShortNumber(item.value2)}
//                             </AppText>

//                             <View style={styles.progressBg}>
//                                 <View style={[styles.progressFill, { width: item.progress2, backgroundColor: '#25d007be', }]} />
//                             </View>
//                         </View>

//                     </View>
//                 ))}

//                 {/* Footer Totals */}
//                 <View style={styles.footer}>
//                     <View>
//                         <AppText size={11} color="#6b7280" family="InterMedium">
//                             YTD TOTAL QTY
//                         </AppText>
//                         <AppText size={16} family="InterSemiBold" color="#1F2937">
//                             {formatShortNumber(activeTab === 'MTD' ? totalMTDQuantity : totalYTDQuantity) || 0}
//                         </AppText>
//                     </View>
//                     <View style={{
//                         borderWidth: 1,
//                         borderColor: '#e5e7eb'
//                     }} />
//                     <View style={{ alignItems: 'flex-end' }}>
//                         <AppText size={11} color="#6b7280" family="InterMedium">
//                             YTD TOTAL VALUE
//                         </AppText>
//                         <AppText size={16} family='InterMedium' color="#1E40AF">
//                             ₹{formatShortNumber(activeTab === 'MTD' ? totalMTDValue : totalYTDValue) || 0}
//                         </AppText>
//                     </View>
//                 </View>
//             </View>
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         paddingHorizontal: rw(19),
//         marginTop: rw(16),
//     },
//     topTabs: {
//         flexDirection: 'row',
//         backgroundColor: '#f3f4f8',
//         borderRadius: 30,
//         padding: 6,
//         marginBottom: rw(12),
//     },

//     tab: {
//         flex: 1,
//         paddingVertical: rw(6),
//         alignItems: 'center',
//         borderRadius: 26,
//     },
//     activeTab: {
//         backgroundColor: '#3a4da0',
//     },
//     card: {
//         backgroundColor: 'white',
//         borderRadius: 16,
//         padding: rw(16),
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.06,
//         shadowRadius: 10,
//         elevation: 4,
//     },
//     productRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         paddingVertical: rw(14),
//         borderBottomWidth: 1,
//         borderBottomColor: '#F1F5F9',
//     },
//     rankContainer: {
//         width: rw(36),
//         alignItems: 'center',
//     },
//     rankCircle: {
//         width: rw(28),
//         height: rw(28),
//         borderRadius: 8,
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     productInfo: {
//         flex: 1,
//         paddingHorizontal: rw(12),
//     },
//     progressBg: {
//         height: rw(6),
//         backgroundColor: '#E2E8F0',
//         borderRadius: 999,
//         marginTop: rw(6),
//         overflow: 'hidden',
//     },
//     progressFill: {
//         height: '100%',
//         backgroundColor: '#1E40AF',
//         borderRadius: 999,
//     },
//     footer: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         paddingTop: rw(8),
//         marginTop: rw(8),
//     },
// });

// export default TopProductsCard;

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import AppText from '../AppText/AppText';
import { rw } from '../../utils/responsive';
import { formatShortNumber } from '../../utils/misc';
import AnimatedSwitch from '../AnimatedSwitch/AnimatedSwitch';

const TopProductsCard = ({ data }: { data: any }) => {
  const [activeTab, setActiveTab] = useState<'YTD' | 'MTD'>('YTD');
  const [viewMode, setViewMode] = useState<'qty' | 'val'>('val'); // Default: Quantity

  // Raw data
  const ytdQtyProducts = data?.top_5_products_current_year || [];
  const mtdQtyProducts = data?.top_5_products_current_month || [];

  const ytdValueProducts = data?.top_5_products_value_wise || [];
  const mtdValueProducts = data?.top_5_products_current_month_value_wise || [];

  const currentRawProducts: any =
    activeTab === 'YTD'
      ? (viewMode === 'qty' ? ytdQtyProducts : ytdValueProducts)
      : (viewMode === 'qty' ? mtdQtyProducts : mtdValueProducts);

  // Calculate totals
  const totalYTDQuantity =
    (viewMode === 'qty' ? ytdQtyProducts : ytdValueProducts)
      .reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

  const totalYTDValue =
    (viewMode === 'qty' ? ytdQtyProducts : ytdValueProducts)
      .reduce((sum: number, item: any) => sum + (item.value || 0), 0);

  const totalMTDQuantity =
    (viewMode === 'qty' ? mtdQtyProducts : mtdValueProducts)
      .reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

  const totalMTDValue =
    (viewMode === 'qty' ? mtdQtyProducts : mtdValueProducts)
      .reduce((sum: number, item: any) => sum + (item.value || 0), 0);

  const totalQuantity = activeTab === 'YTD' ? totalYTDQuantity : totalMTDQuantity;
  const totalValue = activeTab === 'YTD' ? totalYTDValue : totalMTDValue;

  // Sorted products based on current view mode
  const productsToDisplay = useMemo(() => {

    const colorsList = ['#fac775', '#d3d1c7', '#f5c4b3', '#e8eaf2', '#e8eaf2'];

    return currentRawProducts.slice(0, 5).map((item: any, index: number) => ({
      rank: index + 1,
      name: item.product_name || 'N/A',
      quantity: item.quantity || 0,
      value: item.value || 0,
      progressQty: totalQuantity > 0 ? `${((item.quantity || 0) / totalQuantity) * 100}%` : '0%',
      progressValue: totalValue > 0 ? `${((item.value || 0) / totalValue) * 100}%` : '0%',
      color: colorsList[index],
    }));
  }, [currentRawProducts, viewMode, totalQuantity, totalValue]);

  const onSwitchChange = () => {
    setViewMode(prev => prev === 'qty' ? 'val' : 'qty');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Tabs + Switch */}
        <View style={{ width: '100%', flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={[styles.topTabs, { flex: 1, marginTop: 12 }]}>
            <Pressable
              style={[styles.tab, activeTab === 'YTD' && styles.activeTab]}
              onPress={() => setActiveTab('YTD')}
              hitSlop={10}
            >
              <AppText size={14} family="InterMedium" color={activeTab === 'YTD' ? 'white' : '#64748B'}>
                YTD
              </AppText>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'MTD' && styles.activeTab]}
              onPress={() => setActiveTab('MTD')}
              hitSlop={10}
            >
              <AppText size={14} family="InterMedium" color={activeTab === 'MTD' ? 'white' : '#64748B'}>
                MTD
              </AppText>
            </Pressable>
          </View>

          <AnimatedSwitch
            text1="Val."
            text2="Qty."
            dataPress={onSwitchChange}
            height={40}
          />
        </View>

        {/* Products List */}
        {productsToDisplay.map((item: any) => (
          <View key={item.rank} style={styles.productRow}>
            <View style={styles.rankContainer}>
              <View style={[styles.rankCircle, { backgroundColor: item.color }]}>
                <AppText size={13} family="InterSemiBold" color="#1F2937">
                  {item.rank}
                </AppText>
              </View>
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <AppText numLines={1} size={16} family="InterMedium" color="#000">
                    {item.name}
                  </AppText>
                </View>

                {/* Primary Value */}
                <AppText size={17} family="InterSemiBold" color={viewMode == 'qty' ? "#3a4da0" : "#156a06be"}>
                  {viewMode === 'qty' ? (
                    <>
                      <AppText size={10} family="InterSemiBold" color="#3a4da0">(QTY) </AppText>
                      {formatShortNumber(item.quantity)}
                    </>
                  ) : (
                    <>
                      <AppText size={10} family="InterSemiBold" color="#156a06be">(VAL) </AppText>
                      ₹{formatShortNumber(item.value)}
                    </>
                  )}
                </AppText>
              </View>

              {/* Quantity Progress Bar */}
              {
                viewMode == 'qty' ? (
                  <View style={[styles.progressBg, { marginTop: 10 }]}>
                    <View style={[styles.progressFill, { width: item.progressQty }]} />
                  </View>
                ) : (
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: item.progressValue, backgroundColor: '#25d007be' }]} />
                  </View>
                )
              }

              <AppText align='right' size={14} family="InterSemiBold" color={viewMode !== 'qty' ? "#3a4da0" : "#156a06be"}>
                {viewMode !== 'qty' ? (
                  <>
                    <AppText size={10} family="InterSemiBold" color="#3a4da0">(QTY) </AppText>
                    {formatShortNumber(item.quantity)}
                  </>
                ) : (
                  <>
                    <AppText size={10} family="InterSemiBold" color="#156a06be">(VAL) </AppText>
                    ₹{formatShortNumber(item.value)}
                  </>
                )}
              </AppText>
              {/* {
                viewMode !== 'qty' ? (
                  <View style={[styles.progressBg, { marginTop: 10 }]}>
                    <View style={[styles.progressFill, { width: item.progressQty }]} />
                  </View>
                ) : (
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: item.progressValue, backgroundColor: '#25d007be' }]} />
                  </View>
                )
              } */}
              {/* Value Progress Bar */}

              {/* <AppText align='right' size={13} family="InterMedium" color="#1f5f14be" style={{ marginTop: 2 }}>
                                ₹{formatShortNumber(item.value)}
                            </AppText> */}
            </View>
          </View>
        ))}

        {/* Footer Totals */}
        <View style={styles.footer}>
          <View>
            <AppText size={11} color="#6b7280" family="InterMedium">
              TOTAL QTY
            </AppText>
            <AppText size={16} family="InterSemiBold" color="#1F2937">
              {formatShortNumber(totalQuantity)}
            </AppText>
          </View>

          <View style={{ borderWidth: 1, borderColor: '#e5e7eb' }} />

          <View style={{ alignItems: 'flex-end' }}>
            <AppText size={11} color="#6b7280" family="InterMedium">
              TOTAL VALUE
            </AppText>
            <AppText size={16} family="InterSemiBold" color="#1E40AF">
              ₹{formatShortNumber(totalValue)}
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: rw(19),
    marginTop: rw(16),
  },
  topTabs: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f8',
    borderRadius: 30,
    padding: 6,
    marginBottom: rw(12),
  },
  tab: {
    flex: 1,
    paddingVertical: rw(6),
    alignItems: 'center',
    borderRadius: 26,
  },
  activeTab: {
    backgroundColor: '#3a4da0',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: rw(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rw(14),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rankContainer: {
    width: rw(36),
    alignItems: 'center',
  },
  rankCircle: {
    width: rw(28),
    height: rw(28),
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBg: {
    height: rw(6),
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    marginTop: rw(12),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1E40AF',
    borderRadius: 999,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: rw(12),
    marginTop: rw(8),
  },
});

export default TopProductsCard;