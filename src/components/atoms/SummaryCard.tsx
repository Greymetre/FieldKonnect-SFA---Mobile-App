import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import AppText from "../AppText/AppText";
import { colors } from "../../utils/Colors";
// orderValue
// quantity
// totalCustomer

const formatNumberValueIndian = (value: number): string => {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    if (absValue === 0) return '0';
    if (absValue < 1000) return value.toLocaleString('en-IN');

    let formatted = '';
    let suffix = '';

    if (absValue < 100000) {
        // Thousand
        formatted = (absValue / 1000).toFixed(absValue >= 10000 ? 2 : 2);
        suffix = 'K';
    } else if (absValue < 10000000) {
        // Lakh
        formatted = (absValue / 100000).toFixed(absValue >= 1000000 ? 2 : 2);
        suffix = 'L';
    } else {
        // Crore (last suffix)
        formatted = (absValue / 10000000).toFixed(absValue >= 100000000 ? 2 : 2);
        suffix = 'Cr';
    }

    formatted = formatted.replace(/\.0$/, '');

    return sign + formatted + suffix;
};

const formatShortNumber = (
    num: number | string | null | undefined
): string => {
    if (num == null || num === '') {
        return '0';
    }

    if (typeof num === 'number') {
        return formatNumberValueIndian(num);
    }

    let cleanString = String(num).trim().replace(/,/g, '');
    const parsed = Number(cleanString);

    if (isNaN(parsed)) {
        console.warn('Invalid number format:', num);
        return '0';
    }

    return formatNumberValueIndian(parsed);
};

const SummaryCard = ({ item, orderValue, quantity, totalCustomer, totalCheckIn }: any) => {
    let orderValueText

    if (item?.title == "Order\nValue") {
        orderValueText = formatShortNumber(orderValue || 0)
    }
    if (item?.title == "Order\nQuantity") {
        orderValueText = formatShortNumber(quantity) || 0
    }
    if (item?.title == "Total\nCustomer") {
        orderValueText = totalCustomer || 0
    }
    if (item?.title == "New\nCustomers") {
        orderValueText = totalCustomer || 0
    }
    if (item?.title == "Total\nCheck-Ins") {
        orderValueText = totalCheckIn || 0
    }
    return (
        <View style={[styles.inner, { width: 150 }]}>
            <View style={[styles.line, { backgroundColor: item.bgColor }]} />
            <View style={styles.gap}>
                <AppText
                    size={12}
                    color={'#303030'}
                    family='InterRegular'>
                    {item?.title}
                    {
                        item?.title == "Order\nValue" && (
                            <AppText
                                size={10}
                                color={'#303030'}
                                family='InterRegular'>
                                {item?.title == "Order\nValue" ? " (INR)" : ""}
                            </AppText>
                        )
                    }
                    {
                        (item?.title == "Order\nQuantity" || item?.title == "New\nCustomers" || item?.title == "Total\nCheck-Ins") && (
                            <AppText
                                size={10}
                                color={'#303030'}
                                family='InterRegular'>
                                { item?.title == "New\nCustomers" ? " Mapped" : " (NOS)"}
                            </AppText>
                        )
                    }

                </AppText>
                <AppText
                    size={16}
                    opacity={0.8}
                    color={colors.blue}
                    family="InterSemiBold">
                    {orderValueText}
                </AppText>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    inner: {
        backgroundColor: 'white',
        paddingBottom: 10,
        borderRadius: 8,
        shadowOffset: { width: 4, height: 5 },
        shadowColor: Platform.OS == "ios" ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.1)',
        shadowOpacity: 1,
        shadowRadius: 5,
        elevation: 8,
    },
    line: {
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4, height: 8,
        shadowOffset: { width: 4, height: 5 },
        shadowColor: Platform.OS == "ios" ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.1)',
        shadowOpacity: 1,
        shadowRadius: 5,
        elevation: 20,
    },
    gap: {
        gap: 12,
        paddingHorizontal: 16,
        paddingTop: 14,
    }
});

export default SummaryCard;
