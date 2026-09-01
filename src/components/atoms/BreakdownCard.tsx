import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import AppText from '../AppText/AppText';
import { rw } from '../../utils/responsive';
import { colors } from '../../utils/Colors';

interface BreakdownItem {
    label: string;
    value: number;
    color: string;
    text: string
}

interface BreakdownCardProps {
    title: string;           // "ASR" or "DSR"
    total: number;
    index: number;
    data: any;
    items: BreakdownItem[];
    badgeColor?: string;     // background color for ASR/DSR badge
    onPress?: () => void;
}

const BreakdownCard: React.FC<BreakdownCardProps> = ({
    title,
    total,
    items,
    badgeColor = '#E0F2FE',
    onPress,
    index,
    data
}) => {
    let designationData = null
    if (index === 0) {
        designationData = {...data?.asr, leave: data?.leave_asr_today}
    } else if (index === 1) {
        designationData = {...data?.dsr, leave: data?.leave_dsr_today}
    }
    return (
        <View
            style={styles.card}>
            {/* Header: Badge + Total */}
            <View style={{ flex: 1 }}>
                <View style={styles.header}>
                    <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                        <AppText
                            size={12}
                            family="InterSemiBold"
                            color={title === 'ASR' ? colors.blue : '#04342c'}>
                            {title}
                        </AppText>
                    </View>

                    <View style={styles.totalContainer}>
                        <AppText size={24} family="InterSemiBold" color="#1f2937">
                            {designationData?.total}
                        </AppText>
                        <AppText size={12} color="#737986" style={{ marginTop: -3 }}>
                            Total
                        </AppText>
                    </View>
                </View>

                {/* Breakdown List */}
                <View style={styles.breakdownList}>
                    {items.map((item, fIndex) => {
                        let value = 0
                        if (fIndex === 0) {
                            value = designationData?.checked_in_today - designationData?.leave || 0
                        } else if (fIndex === 1) {
                            value = designationData?.leave || 0
                        } else if (fIndex === 2) {
                            value = designationData?.not_checked_in_today || 0
                        }
                        return (
                            <View key={fIndex} style={styles.row}>
                                <View style={styles.dotContainer}>
                                    <View style={[styles.dot, { backgroundColor: item.color }]} />
                                    <AppText size={12} color="#6b7280" family="InterMedium">
                                        {item.label}
                                    </AppText>
                                </View>
                                <AppText size={15} family="InterSemiBold" color={item?.text ? item?.text : "#1F2937"}>
                                    {value}
                                </AppText>
                            </View>
                        )
                    })}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: rw(18),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        borderWidth: 2,
        borderColor: "#e6e8eb",
        paddingVertical: rw(16),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: rw(10),
    },
    badge: {
        paddingHorizontal: rw(12),
        paddingVertical: rw(3),
        borderRadius: 999,
        alignSelf: 'center'
    },
    totalContainer: {
        alignItems: 'flex-end',
    },
    breakdownList: {
        gap: rw(1),
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dotContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: rw(10),
    },
    dot: {
        width: rw(10),
        height: rw(10),
        borderRadius: 999,
    },
});

export default BreakdownCard;