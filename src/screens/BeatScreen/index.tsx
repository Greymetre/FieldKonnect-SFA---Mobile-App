import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, View, StyleSheet, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import AppText from '../../components/AppText/AppText';
import { rw } from '../../utils/responsive';
import { colors } from '../../utils/Colors';
import store, { useAppSelector } from '../../components/redux/Store';
import { NavigationProp, ParamListBase, useFocusEffect, useNavigation } from '@react-navigation/native';

interface BeatItem {
    beatscheduleid: number;
    beat_id: number;
    beat_name: string;
    description: string;
    beat_date: string;
    total_customers: number;
    visited_customers: number;
    remaining_customers: number;
    order_count: number;
    new_customers: number;
    is_today: boolean;
}

const API_BASE = 'https://duke.fieldkonnect.in/api';

const BeatsScreen = () => {
    const navigation = useNavigation<NavigationProp<ParamListBase>>();
    const { user } = useAppSelector(
        (state) => state.auth
    );
    const token = store.getState()?.auth?.token;
    const userId = user?.id;
    const [beats, setBeats] = useState<BeatItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const fetchBeats = async () => {
        if (!token || !userId) {
            setErrorMsg('Authentication information missing');
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            setErrorMsg(null);
            const today = new Date().toISOString().split('T')[0];

            const url = `${API_BASE}/getBeatList?beat_date=${today}&user_id=${userId}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const json = await response.json();

            if (json.status === 'success' && Array.isArray(json.data?.data)) {
                setBeats(json.data.data);
            } else {
                setErrorMsg(json.message || 'Failed to load beat list');
            }
        } catch (err: any) {
            console.error('Beat fetch error:', err);
            setErrorMsg('Could not load beats. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchBeats();
        }, [token, userId])
    )


    const onRefresh = () => {
        setRefreshing(true);
        fetchBeats();
    };

    const renderBeatItem = ({ item }: any) => (
        <Pressable style={styles.card}
            onPress={() => {
                // navigation.navigate('BeatCustomerList', {
                //     beatId: item.beat_id,
                //     beatName: item.beat_name,
                //     beatDate: item.beat_date,
                // });
                navigation.navigate("CustomerList", {
                    type: 'RETAILER',
                    beatId: item.beat_id,
                    beatName: item.beat_name,
                    beatDate: item.beat_date,
                })
            }}>
            {/* Beat Name */}
            <AppText
                size={18}
                horizontal={rw(16)}
                family='InterSemiBold'
                color={'black'}
            >
                {item?.beat_name}
            </AppText>
            <View style={styles.line} />

            <View style={styles.tableRow}>
                <View style={styles.cell}>
                    <AppText
                        size={14}
                        family='InterMedium'
                        color="black"
                        style={{ textAlign: 'center' }}
                    >
                        Counter
                    </AppText>
                </View>

                <View style={[styles.cell, styles.cellBorderLeft]}>
                    <AppText size={13} family="InterMedium" color={"black"}>
                        Total
                    </AppText>
                    <AppText size={15} family="InterBold" color="black">
                        {item?.total_customers}
                    </AppText>
                </View>

                <View style={[styles.cell, styles.cellBorderLeft]}>
                    <AppText size={13} family="InterMedium" color={"black"}>
                        Visited
                    </AppText>
                    <AppText size={15} family='InterBold' color="black">
                        {item?.visited_customers}
                    </AppText>
                </View>

                <View style={[styles.cell, styles.cellBorderLeft]}>
                    <AppText size={13} family="InterMedium" color={"black"}>
                        Remaining
                    </AppText>
                    <AppText size={15} family="InterBold" color="black">
                        {item?.remaining_customers}
                    </AppText>
                </View>
            </View>
        </Pressable>
    );

    if (!token || !userId) {
        return (
            <View style={styles.center}>
                <AppText size={16} color="red">
                    Please log in to view beats
                </AppText>
            </View>
        );
    }

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.blue} />
            </View>
        );
    }

    return (
        <View style={styles.container}>

            <FlatList
                data={beats}
                renderItem={renderBeatItem}
                keyExtractor={item => String(item.beatscheduleid)}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={{ marginTop: 20 }}>
                        <AppText size={16} color="black" align='center'>
                            {errorMsg || 'No beats scheduled for today'}
                        </AppText>
                    </View>
                }
                ListFooterComponent={
                    errorMsg && !beats.length ? (
                        <AppText size={14} color="red" style={{ textAlign: 'center', marginTop: rw(20) }}>
                            {errorMsg}
                        </AppText>
                    ) : null
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgColor
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: rw(20)
    },
    listContent: {
        paddingHorizontal: rw(12),
        paddingVertical: rw(8),
        paddingBottom: rw(80),
        marginTop: rw(20)
    },
    card: {
        backgroundColor: '#fff',
        paddingTop: rw(14),
        marginTop: rw(4),
        borderRadius: 8,
        shadowOffset: { width: 4, height: 5 },
        shadowColor: Platform.OS == "ios" ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.1)',
        shadowOpacity: 1,
        shadowRadius: 5,
        elevation: 8,
        marginBottom: 10
    },
    line: {
        width: "100%",
        height: 2,
        backgroundColor: "#D9D9D9",
        marginTop: 20
    },
    tableRow: {
        flexDirection: 'row',
    },
    cell: {
        flex: 1,
        paddingVertical: rw(10),
        paddingHorizontal: rw(8),
        gap: 10,
        justifyContent: "center",
        alignItems: 'center', // centers all text horizontally
    },
    cellBorderLeft: {
        borderLeftWidth: 2,
        borderLeftColor: '#D9D9D9', // vertical column separators
    },
});

export default BeatsScreen;