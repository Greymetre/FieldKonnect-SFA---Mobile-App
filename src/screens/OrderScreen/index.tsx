import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Keyboard, Pressable, TextInput, View } from 'react-native';
import { ArrowDownIcon, CalenderIcon, CrossIcon } from '../../assets/svgs/SvgsFile';
import { SearchSvgIcon } from '../../assets/svgs/HomePageSvgs';
import { colors } from '../../utils/Colors';
import { styles } from './styles';
import AppText from '../../components/AppText/AppText';
import { rw } from '../../utils/responsive';
import { shadowStyle } from '../../utils/typography';
import store from '../../components/redux/Store';
import Toast from 'react-native-toast-message';
import { Dropdown } from 'react-native-element-dropdown';
import CustomerCalendar from '../../components/CustomCalendar/CalendarPopupView';

interface DropdownUser {
    label: string;
    value: number | string;
}

type OrderListProps = {
    navigation: any
}
const OrderList = ({ navigation }: OrderListProps) => {
    const [usersSelect, setUsersSelect] = useState<DropdownUser[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | string | null>(null);
    const [orderList, setOrderList] = useState<any[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [showCal, setShowCal] = useState(false);

    const [rangeType, setRange] = useState('currentMonth');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchText, setSearchText] = useState('');
    const isInitialSearchRender = useRef(true);

    const PAGE_SIZE = 10;

    const [startDate, setStartDate] = useState<any>(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        return start;
    });

    const [endDate, setEndDate] = useState<any>(() => {
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        return end;
    });

    const handleApply = (start: Date | null, end: Date | null, type: string) => {
        if (!start || !end) {
            Alert.alert("Invalid range", "Please select both start and end dates.");
            return;
        }

        const normalizedStart = new Date(start);
        normalizedStart.setHours(0, 0, 0, 0);

        const normalizedEnd = new Date(end);
        normalizedEnd.setHours(23, 59, 59, 999);

        setStartDate(normalizedStart);
        setEndDate(normalizedEnd);
        setRange(type || 'custom');

        setShowCal(false);
        setPage(1);
        setHasMore(true);

        fetchOrderList(
            selectedUserId,
            normalizedStart,
            normalizedEnd,
            1,
            false
        );

    };




    useEffect(() => {
        fetchOrderList(
            null,
            startDate,
            endDate,
            1,
            false
        );
    }, []);

    useEffect(() => {
        if (isInitialSearchRender.current) {
            isInitialSearchRender.current = false;
            return;
        }

        const timer = setTimeout(() => {
            setPage(1);
            setHasMore(true);
            fetchOrderList(selectedUserId, startDate, endDate, 1, false);
        }, 400);

        return () => clearTimeout(timer);
    }, [searchText]);

    const formatYYYYMMDD = (date: any): string => {
        if (!date) return '';

        const d = new Date(date);

        if (isNaN(d.getTime())) return '';

        // Use LOCAL year, month, day — ignore timezone / UTC completely
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0'); // 01 to 12
        const day = String(d.getDate()).padStart(2, '0');     // 01 to 31

        return `${year}-${month}-${day}`;
    };

    const fetchOrderList = async (
        userId?: number | string | null,
        start?: Date,
        end?: Date,
        pageNumber: number = 1,
        loadMore: boolean = false
    ) => {

        const token = store.getState().auth?.token;

        if (!token) {
            Toast.show({ type: 'error', text1: 'Token not found' });
            return;
        }

        if (loadMore) {
            setLoadingMore(true);
        } else {
            setLoadingOrders(true);
        }

        try {

            const params = new URLSearchParams();

            // pagination
            params.append("page", String(pageNumber));
            params.append("pageSize", String(PAGE_SIZE));

            if (searchText.trim()) {
                params.append("global_search", searchText.trim());
            }

            if (userId) {
                params.append("user_id", String(userId));
            }

            if (start) {
                params.append("startdate", formatYYYYMMDD(start));
            }

            if (end) {
                params.append("enddate", formatYYYYMMDD(end));
            }

            const url = `https://duke.fieldkonnect.in/api/getOrderList?${params.toString()}`;

            console.log(url, 'ORDER API');

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            const json = await response.json();

            console.log("Order List Response", json);

            if (json?.status) {

                const newData = json?.data || [];

                // append on load more
                if (loadMore) {
                    setOrderList(prev => [...prev, ...newData]);
                } else {
                    setOrderList(newData);
                }

                // users dropdown
                if (json?.users && Array.isArray(json.users) && usersSelect.length === 0) {

                    const dropdownUsers = json.users.map((u: any) => ({
                        label: u.name,
                        value: u.id
                    }));

                    setUsersSelect(dropdownUsers);
                }

                // pagination logic
                // if backend gives page_count use that
                if (json?.page_count) {

                    setHasMore(pageNumber < json.page_count);

                } else {

                    // fallback logic
                    setHasMore(newData.length >= PAGE_SIZE);
                }

                setPage(pageNumber);

            } else {

                if (!loadMore) {
                    setOrderList([]);
                }

                setHasMore(false);

                Toast.show({
                    type: "error",
                    text1: json?.message || "Failed to load orders",
                });
            }

        } catch (error) {

            console.log("Order list error", error);

        } finally {

            setLoadingOrders(false);
            setLoadingMore(false);
        }
    };

    const loadMoreOrders = () => {

        if (loadingMore || !hasMore) {
            return;
        }

        const nextPage = page + 1;

        fetchOrderList(
            selectedUserId,
            startDate,
            endDate,
            nextPage,
            true
        );
    };

    const renderItem: any = useCallback((item: any) => {
        const items = item?.item
        return (
            <Pressable style={[styles.listItem, shadowStyle]} onPress={() => navigation.navigate("OrderHistoryDetailsScreen", {
                orderId: items?.order_id,
            })}>
                <View style={[styles.row]}>
                    <View style={{ gap: 3 }}>
                        <AppText color='black' family='InterMedium' size={14} opacity={0.8}>Firm Name</AppText>
                        <AppText color='black' family='InterBold' size={14}>{items?.buyer_name || items?.seller_name}</AppText>
                    </View>
                </View>

                <View style={[styles.row, styles.detailsRow]}>
                    <View style={styles.detailsFirstRow}>
                        <AppText color='black' family='InterMedium' size={14} opacity={0.8}>Order ID</AppText>
                        <View style={{ height: 5 }} />
                        <AppText color='black' family='InterBold' size={14}>{items?.order_id}</AppText>
                    </View>
                    <View style={styles.detailsSecondRow}>
                        <AppText color='black' family='InterMedium' size={14} opacity={0.8}>Order Date</AppText>
                        <View style={{ height: 5 }} />
                        <AppText color='black' family='InterBold' size={14}>{items?.order_date}</AppText>
                    </View>
                </View>
                <View style={[styles.row, styles.detailsRow]}>
                    <View style={styles.detailsFirstRow}>
                        <AppText color='black' family='InterMedium' size={14} opacity={0.8}>Quantity</AppText>
                        <View style={{ height: 5 }} />
                        <AppText color='black' family='InterBold' size={14}>{items?.total_qty}</AppText>
                    </View>
                    <View style={styles.detailsSecondRow}>
                        <AppText color='black' family='InterMedium' size={14} opacity={0.8}>Amount</AppText>
                        <View style={{ height: 5 }} />
                        <AppText color='black' family='InterBold' size={14}>{items?.grand_total}</AppText>
                    </View>
                </View>
                <View style={styles.line} />
                <View style={[styles.row, styles.detailsRow]}>
                    <View style={[styles.detailsFirstRow, { paddingRight: 20 }]}>
                        <AppText color='black' family='InterMedium' size={14} opacity={0.8}>Order Remark</AppText>
                        <View style={{ height: 5 }} />
                        <AppText numLines={1} color='black' family='InterSemiBold' size={14}>{items?.order_remark}</AppText>
                    </View>
                    <View style={styles.detailsSecondRow}>
                        <AppText color='black' family='InterMedium' size={14} opacity={0.8}>Created By</AppText>
                        <View style={{ height: 5 }} />
                        <AppText color='black' family='InterBold' size={14}>{items?.creatd_by}</AppText>
                    </View>
                </View>
            </Pressable>
        )
    }, [orderList])

    return (
        <View style={styles.container}>
            <View style={[styles.container, { paddingHorizontal: rw(18) }]} >
                <View style={styles.searchBox}>
                    <SearchSvgIcon />
                    <TextInput
                        placeholder="Search orders..."
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        style={styles.searchInput}
                        value={searchText}
                        onChangeText={setSearchText}
                        returnKeyType="search"
                        onSubmitEditing={() => Keyboard.dismiss()}
                    />
                    {!!searchText && (
                        <Pressable onPress={() => setSearchText('')} hitSlop={10}>
                            <CrossIcon />
                        </Pressable>
                    )}
                </View>
                <View style={{ marginTop: 20 }}>
                    <Dropdown
                        style={styles.selectUser}
                        placeholderStyle={{ color: '#718096', fontSize: 14 }}
                        selectedTextStyle={{ color: colors.black, fontSize: 14 }}
                        inputSearchStyle={{ height: 40, fontSize: 14 }}
                        data={usersSelect}
                        search
                        maxHeight={300}
                        labelField="label"
                        valueField="value"
                        placeholder="Select User"
                        searchPlaceholder="Search user..."
                        value={selectedUserId}           // ← null = shows placeholder
                        onChange={(item) => {

                            setSelectedUserId(item.value);

                            setPage(1);
                            setHasMore(true);

                            fetchOrderList(
                                item.value,
                                startDate,
                                endDate,
                                1,
                                false
                            );
                        }}
                        renderRightIcon={() => <ArrowDownIcon />}
                    />

                </View>
                <Pressable style={[styles.dateTimeBox, styles.row, { justifyContent: 'space-between' }]} onPress={() => setShowCal(true)}>
                    <View style={{ justifyContent: 'center' }}>
                        {
                            (startDate && endDate) ? (
                                <AppText size={12} color="black" family="InterRegular">
                                    {formatYYYYMMDD(startDate)} : {formatYYYYMMDD(endDate)}
                                </AppText>
                            ) : (
                                <AppText size={14} color="#718096" family="InterRegular">
                                    Select Date Range
                                </AppText>
                            )
                        }

                    </View>
                    <View style={[styles.calenderICon, styles.center]}>
                        <CalenderIcon size={16} color={colors.blue} />
                    </View>
                </Pressable>
                <FlatList
                    data={orderList}
                    keyExtractor={(item) => item.order_id.toString()}
                    showsVerticalScrollIndicator={false}
                    renderItem={renderItem}

                    onEndReached={loadMoreOrders}
                    onEndReachedThreshold={0.5}

                    ListEmptyComponent={
                        loadingOrders ? (
                            <View style={{ marginTop: 40, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color={colors.blue} />
                            </View>
                        ) : (
                            <View style={{ marginTop: 20 }}>
                                <AppText size={16} color="black" align='center'>
                                    No data found
                                </AppText>
                            </View>
                        )
                    }

                    style={{ marginTop: 20 }}

                    ListFooterComponent={() => (
                        <>
                            {loadingMore && (
                                <ActivityIndicator
                                    size="small"
                                    color={colors.blue}
                                    style={{ marginVertical: 20 }}
                                />
                            )}

                            {!hasMore && orderList.length > 0 && (
                                <AppText
                                    size={13}
                                    color="#718096"
                                    align="center"
                                    style={{ marginVertical: 20 }}
                                >
                                    No more orders
                                </AppText>
                            )}

                            <View style={{ height: 120 }} />
                        </>
                    )}
                />
            </View>


            <CustomerCalendar
                {...{ showCal, setShowCal }}
                minimumDate={new Date()}
                initialStartDate={startDate}
                initialEndDate={endDate}
                setStartDates={setStartDate}
                setEndDates={setEndDate}
                setRange={setRange}
                range={rangeType}
                onApplyClick={handleApply}
            />
        </View>
    );
}


export default OrderList;
