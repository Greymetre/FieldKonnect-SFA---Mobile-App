import React, { useState } from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import AppText from '../AppText/AppText';
import { rw } from '../../utils/responsive';
import { stylesss } from './AttendanceCard';
import { orderData } from '../../utils/CommanFunction';
import { formatShortNumber } from '../../utils/misc';

const RetailersOverviewCard = ({data}: any) => {
    const [period, setPeriod] = useState<'MTD' | 'YTD'>('MTD');
    const isMTD = period === 'MTD';
    const hasCombinedDashboardResponse = data?.total_users != null || data?.total_target != null;
    const mtdQuantity = data?.total_order_quantity_current_month != null
        ? Number(data.total_order_quantity_current_month) || 0
        : hasCombinedDashboardResponse
        ? (Number(data?.current_month_orders?.quantity) || 0)
        : (Number(data?.current_month_orders?.quantity) || 0) + (Number(data?.current_month_orders_dsr?.quantity) || 0);
    const mtdValue = data?.total_order_value_current_month != null
        ? Number(data.total_order_value_current_month) || 0
        : hasCombinedDashboardResponse
        ? (Number(data?.current_month_orders?.value) || 0)
        : (Number(data?.current_month_orders?.value) || 0) + (Number(data?.current_month_orders_dsr?.value) || 0);
    const mtdOrders = data?.total_orders_current_month ??
        ((Number(data?.current_month_orders?.orders ?? data?.current_month_orders?.count) || 0) +
        (Number(data?.current_month_orders_dsr?.orders ?? data?.current_month_orders_dsr?.count) || 0));
    const uniqueCustomers = isMTD
        ? (data?.secondary_customers_with_order_current_month ?? data?.unique_buyers ?? ((Number(data?.unique_buyers_from_asr) || 0) + (Number(data?.unique_buyers_from_dsr) || 0)))
        : (data?.secondary_customers_with_order_current_year || 0);
    const orderValues = isMTD
        ? [mtdOrders, mtdQuantity, mtdValue]
        : [data?.total_orders_current_year || 0, data?.total_order_quantity_current_year || 0, data?.total_order_value_current_year || 0];
    const registeredCustomers = isMTD
        ? (data?.customers_registered_mtd ?? data?.total_customers ?? data?.secondary_customers_registered_approved_current_year ?? 0)
        : (data?.customers_registered_ytd ?? data?.total_customers ?? data?.secondary_customers_registered_approved_current_year ?? 0);
    const registeredToday = data?.customers_registered_today ?? data?.secondary_customers_registered_approved_today ?? 0;

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.periodTabs}>
                    {(['MTD', 'YTD'] as const).map(item => (
                        <Pressable
                            key={item}
                            onPress={() => setPeriod(item)}
                            style={[styles.periodTab, period === item && styles.activePeriodTab]}
                            hitSlop={8}>
                            <AppText size={14} family="InterSemiBold" color={period === item ? 'white' : '#8a8fa3'}>{item}</AppText>
                        </Pressable>
                    ))}
                </View>
                {/* Header Text */}
                <AppText size={14} color="#8a8fa3" family='InterRegular'>
                    Total Customers
                </AppText>

                {/* Main Number */}
                <View style={styles.mainRow}>
                    <AppText size={30} family='InterMedium' color="#3a4da0">
                        {registeredCustomers}
                    </AppText>
                    <View style={styles.todayBadge}>
                        <AppText size={11} color="#125748" family="InterMedium">
                            +{registeredToday} today
                        </AppText>
                    </View>
                    <View style={[styles.iconContainer]}>
                        <Image
                            source={require('../../assets/images/Dummy/user.png')}
                            style={styles.activityImage}
                            resizeMode="contain"
                        />
                    </View>
                </View>

                {/* Unique Retailers */}
                <View style={styles.uniqueContainer}>
                    <View style={styles.checkIcon}>
                        <Image
                            source={require('../../assets/images/Dummy/checkcircle.png')}
                            style={styles.activityImage}
                            resizeMode="contain"
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <AppText size={12} family='InterMedium' color="#3a4da0">
                            Unique Customers Ordered
                        </AppText>
                        <AppText size={11} color="#6b7280" family="InterMedium">
                            {period} · placed at least 1 order
                        </AppText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <AppText size={22} family='InterSemiBold' color="#3a4da0">
                            {uniqueCustomers}
                        </AppText>
                        <AppText size={11} color="#267a66" family='InterMedium'>
                            {/* 76% of total */}
                        </AppText>
                    </View>
                </View>

                {/* Year to Date Orders */}
                <View style={styles.ytdSection}>
                    <View style={styles.ytdHeader}>
                        <AppText size={11} color="#6b7280" family="InterMedium">
                            {isMTD ? 'MONTH TO DATE ORDERS' : 'YEAR TO DATE ORDERS'}
                        </AppText>
                        <View style={styles.ytdBadge}>
                            <AppText size={12} color="#3a4da0" family="InterMedium">{period}</AppText>
                        </View>
                    </View>

                    <View style={styles.orderGrid}>
                        {orderData.map((item: any, index: number) => {
                            const count = index === 0 ? orderValues[index] : formatShortNumber(orderValues[index]) || 0;
                            return (
                                <Pressable
                                    key={item.id}
                                    style={[stylesss.card,{marginTop:0,width:'31.5%',alignItems:"flex-start"}]}>
                                    <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:4}}>
                                        <View style={[stylesss.imageContainer, { backgroundColor: item?.color }]}>
                                        <Image
                                            source={item.image}
                                            style={stylesss.image}
                                            resizeMode="contain"
                                            tintColor={item?.imageColor}
                                        />
                                    </View>
                                     <AppText
                                        size={12}
                                        color="#6b7280"
                                        family="InterMedium">
                                        {item.label}
                                    </AppText>
                                    </View>

                                    <AppText size={18} family="InterSemiBold" color={item?.textColor ? item?.textColor : "#1F2937"} >
                                        {count}
                                    </AppText>

                               
                                </Pressable>
                            )
                        })}
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
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: rw(18),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 4,
    },
    periodTabs: {
        flexDirection: 'row',
        backgroundColor: '#f0f1f8',
        borderRadius: 30,
        padding: 5,
        marginBottom: rw(18),
    },
    periodTab: {
        flex: 1,
        paddingVertical: rw(8),
        borderRadius: 26,
        alignItems: 'center',
    },
    activePeriodTab: {
        backgroundColor: '#3f4d99',
    },
    mainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: rw(12),
        marginBottom: rw(12),
        marginTop: 4
    },
    todayBadge: {
        backgroundColor: '#e1f5ee',
        paddingHorizontal: rw(8),
        paddingVertical: rw(2),
        borderRadius: 999,
    },
    iconContainer: {
        marginBottom: rw(4),
        width: rw(40),
        height: rw(40),
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 'auto',
        backgroundColor: '#e8eaf2'
    },
    activityImage: {
        width: rw(20),
        height: rw(20),
    },
    uniqueContainer: {
        flexDirection: 'row',
        backgroundColor: '#e8eaf2',
        borderRadius: 12,
        paddingHorizontal: rw(12),
        paddingVertical: 6,
        alignItems: 'center',
        gap: rw(10),
    },
    checkIcon: {
        width: rw(35),
        height: rw(35),
        backgroundColor: 'white',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ytdSection: {
        marginTop: rw(16),
    },
    orderGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    ytdHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: rw(14),
    },
    ytdBadge: {
        backgroundColor: '#fff',
        paddingHorizontal: rw(8),
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#d4d9ea'
    },

});

export default RetailersOverviewCard;
