import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Pressable, ScrollView, TextInput, View } from 'react-native';
import { ArrowDownIcon, CrossIcon } from '../../assets/svgs/SvgsFile';
import { rw } from '../../utils/responsive';
import { NavigationProp, ParamListBase, useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors } from '../../utils/Colors';
import { SearchSvgIcon } from '../../assets/svgs/HomePageSvgs';
import CustomerCard from '../../components/atoms/CustomerCard';
import { useMutateCustomerListApi, useMutateSecondaryCustListApi } from '../../api/query/CustomerApi';
import Geolocation from '@react-native-community/geolocation';
import Toast from 'react-native-toast-message';
import store from '../../components/redux/Store';
import axios from 'axios';
import { styles } from '../CustomerList/styles';
import AppText from '../../components/AppText/AppText';
import SecondaryCustomerCard from '../../components/atoms/SecondaryCustomerCard';
const BeatCustomerDetails = ({ route }: any) => {
    const { beatId, beatName } = route.params || {};
    const [focusText, setFocusText] = useState(false);
    const [loader, setLoader] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<NavigationProp<ParamListBase>>();
    const [currentLat, setCurrentLat] = useState<number | null>(null)
    const [currentLng, setCurrentLng] = useState<number | null>(null)
    const [locationError, setLocationError] = useState<string | null>(null)
    const [isPunchedIn, setIsPunchedIn] = useState<any>(false);
    console.log(beatId, beatName, 'beatId, beatName');
    useFocusEffect(
        useCallback(() => {
            fetchBeatCustomers();
            getCurrentLocation()
            fetchPunchInStatus()
        }, [])
    )


    const fetchBeatCustomers = useCallback(async () => {
        if (!beatId) {
            setLoading(false);
            return;
        }

        const token = store.getState()?.auth?.token;
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const url = `https://duke.fieldkonnect.in/api/getBeatCustomers?beat_id=${beatId}`;
            console.log(url, 'urlurl')
            // Optional: add search if you want server-side filtering
            // if (searchText?.trim()) url += `&search=${encodeURIComponent(searchText.trim())}`;

            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });

            const data = response.data;

            if (data.status === 'success' && Array.isArray(data.data)) {
                // or data.data.data if paginated
                setCustomers(data.data || []);
            } else if (data.data?.data) {
                // in case it's paginated like getBeatList
                setCustomers(data.data.data || []);
            } else {
                setCustomers([]);
            }
        } catch (err: any) {
            console.error('Beat customers fetch failed:', err);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err?.response?.data?.message || 'Network issue',
            });
        } finally {
            setLoading(false);
        }
    }, [beatId, searchText]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchBeatCustomers();
        }, 400); // debounce ~400ms

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


    // ── Fetch current location once ─────────────────────────────
    const getCurrentLocation = () => {
        Geolocation.getCurrentPosition(
            (position) => {
                setCurrentLat(position.coords.latitude)
                setCurrentLng(position.coords.longitude)
                setLocationError(null)
            },
            (error) => {
                console.log('Location fetch error:', error)
                let msg = 'Unable to get location'

                if (error.code === 1) {
                    msg = 'Location permission denied'
                } else if (error.code === 2) {
                    msg = 'Location services disabled'
                } else if (error.code === 3) {
                    msg = 'Location request timed out'
                }

                setLocationError(msg)
                Toast.show({
                    type: 'error',
                    text1: 'Location Error',
                    text2: msg,
                    position: 'top',
                    visibilityTime: 4000,
                })
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 10000,
            }
        )
    }


    return (
        <View style={styles.container}>
            <ScrollView style={[styles.container, { paddingHorizontal: rw(18) }]} >
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={colors.blue} />
                    </View>
                ) : (
                    <>

                        <AppText size={20} color="black" style={{  marginTop: rw(20) }}>
                            {beatName}
                        </AppText>
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

                        <FlatList
                            data={customers}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item, index }) => {
                                return (
                                    <SecondaryCustomerCard currentLat={currentLat} currentLng={currentLng} locationError={locationError} item={item?.customer} navigation={navigation} index={index} isPunchedIn={isPunchedIn} />
                                )
                            }}
                            contentContainerStyle={styles.listContainer}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <AppText size={16} color="#666" style={{ textAlign: 'center', marginTop: rw(120) }}>
                                    No customers in this beat
                                </AppText>
                            }
                        />
                    </>
                )}
            </ScrollView>
        </View>

    );
}


export default BeatCustomerDetails;
