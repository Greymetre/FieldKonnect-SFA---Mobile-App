import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../utils/Colors';
import { fonts, shadowStyle } from '../../utils/typography';
import { AddToCartIcon, ArrowCardDownIcon, CheckIcon, CrossIconCard, EmailIcon, EyeIcon, LocationIcon, PhoneICon, WhatsappICon } from '../../assets/svgs/HomePageSvgs';
import AppText from '../AppText/AppText';
import { rw } from '../../utils/responsive';
import { SCREEN_WIDTH } from '../../utils/misc';
import { resolveMediaUrl } from '../../api/AxiosClient';
import FastImage from 'react-native-fast-image';
import Toast from 'react-native-toast-message';
import { useGetSubmitCheckIN } from '../../api/query/CustomerApi';
import { normalizeIndianMobileNumber } from '../../utils/phone';

const { width } = Dimensions.get('window');

interface SolarCardProps {
  item: {
    id?: any;
    rating?: string;
    type?: string;
    company?: string;
    address?: string;
    imageUrl: any;
    last_checkin_date?: any
    legal_name?: string
    shipping_address?: any
    shop_image?: string
    shop_photo?: string
    owner_photo?: string
    profile_image?: string
    last_checkout_date?: string
    last_checkin_id?: string
    mobile?: string
    last_checkin_time?: string
    last_checkout_time?: string
    email?: string | unknown
  };
  index?: number
  isPunchedIn?: any
  navigation?: any
  onViewPress?: () => void;
  onCheckInPress?: any;
  currentLat?: any;
  currentLng?: any;
  locationLoading?: any;
  locationError?: any;
  onAddOrderPress?: () => void;
  onClosePress?: () => void;
  type?: any
}

const CustomerCard: React.FC<SolarCardProps> = ({
  item,
  index,
  onViewPress,
  onCheckInPress,
  onAddOrderPress,
  onClosePress,
  navigation,
  currentLat,
  currentLng,
  locationLoading,
  locationError,
  isPunchedIn,
  type
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const animationHeight = useSharedValue(0);
  const [newCheckInData, setNewCheckInData] = useState<boolean>(false)

  const [checkInLoading, setCheckInLoading] = useState<boolean>(false)
  const [checkIn, setCheckIn] = useState<boolean>(item?.last_checkin_date && !item?.last_checkout_date)
  const [checkInHandle, setCheckInHanlde] = useState<boolean>(!!item?.last_checkin_date &&
    !item?.last_checkout_date)
  const { mutateAsync: submitCheckIn } = useGetSubmitCheckIN()
  const customerName =
    item?.legal_name ||
    item?.shop_name ||
    item?.name ||
    [item?.first_name, item?.last_name].filter(Boolean).join(' ') ||
    type?.entity_name ||
    '-';
  const customerAddress =
    item?.shipping_address ||
    item?.address_line ||
    item?.full_address ||
    item?.customeraddress?.full_address ||
    type?.checkin_address ||
    '-';
  const customerImage = resolveMediaUrl(
    item?.shop_image || item?.shop_photo || item?.owner_photo || item?.profile_image,
  );
  function isCheckoutBeforeCheckin(checkinDate: any, checkinTime: any, checkoutDate: any, checkoutTime: any) {
    // Combine date + time into full ISO strings
    const checkinStr = `${checkinDate}T${checkinTime}`;
    const checkoutStr = `${checkoutDate}T${checkoutTime}`;

    // Convert to Date objects
    const checkin = new Date(checkinStr);
    const checkout = new Date(checkoutStr);

    // Check if dates are valid
    if (isNaN(checkin.getTime()) || isNaN(checkout.getTime())) {
      return "NA";
    }

    // Compare timestamps
    return checkout < checkin;
  }

  useEffect(() => {

    if (item?.last_checkin_date && item?.last_checkout_date) {
      const result: any = isCheckoutBeforeCheckin(
        item?.last_checkin_date,
        item?.last_checkin_time,
        item?.last_checkout_date,
        item?.last_checkout_time
      );
      if (result != "NA") {
        setCheckIn(result)
        setCheckInHanlde(result)
      }
    } else {
      setCheckIn(item?.last_checkin_date && !item?.last_checkout_date)
      setCheckInHanlde(!!item?.last_checkin_date &&
        !item?.last_checkout_date)
    }

  }, [item])

  const toggleExpand = () => {
    const toValue = isExpanded ? 0 : 1;
    animationHeight.value = withTiming(toValue * 175, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
    setIsExpanded(!isExpanded);
  };

  const iconsContainerStyle = useAnimatedStyle(() => ({
    height: animationHeight.value,
    opacity: animationHeight.value / 175,
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: animationHeight.value * (180 / 175) + 'deg' }],
  }));

  const hasOpenCheckIn =
    !!item?.last_checkin_date &&
    !item?.last_checkout_date

  const handleCheckInOut = async () => {
    if (checkInLoading) return
    // Check if we have location
    if (currentLat === null || currentLng === null) {
      Toast.show({
        type: 'error',
        text1: 'Location not available',
        text2: locationError || 'Please enable location and try again',
        position: 'top',
        visibilityTime: 3500,
      })
      // Optional: try to fetch again
      // getCurrentLocation()
      return
    }

    if (checkInHandle || type) {
      if (currentLat === null || currentLng === null) {
        Toast.show({
          type: 'error',
          text1: 'Location not available',
          text2: locationError || 'Please enable location and try again',
          position: 'top',
          visibilityTime: 3500,
        })
        // Optional: try to fetch again
        // getCurrentLocation()
        return
      }
      navigation.navigate('VisitReport', {
        checkin_id: type ? type?.checkin_id : newCheckInData || item?.last_checkin_id,
        entity_type: 'customer',
        entity_id: item?.id,
        customerData: item, // pass full customer data if needed in report
        latitude: currentLat,
        longitude: currentLng,
      });
      return
    } else {
      setCheckInLoading(true)
      const payload = {
        entity_type: 'customer',
        entity_id: item?.id,
        checkin_latitude: currentLat,
        checkin_longitude: currentLng,
      }

      try {
        const res: any = await submitCheckIn(payload)

        if (res?.data?.status === true || res?.data?.status == "success") {
          console.log(res?.data, 'res?.datares?.data');
          Toast.show({
            type: 'success',
            text1: checkInHandle ? 'Checked out successfully' : 'Checked in successfully',
            position: 'top',
            visibilityTime: 2500,
          })
          setNewCheckInData(res?.data?.checkin_id)
          // Refresh data to update button text / status
          setCheckIn(!checkIn)
          setCheckInHanlde(!checkInHandle)
          onCheckInPress()
        } else {
          console.log(res, 'ressssssssssssss')
          Toast.show({
            type: 'error',
            text1: res,
            text2: res?.data?.message || 'Please try again',
            position: 'top',
            visibilityTime: 4000,
          })
        }
      } catch (error: any) {
        console.log('Check-in/out error:', error?.response)
        Toast.show({
          type: 'error',
          text1: 'Failed',
          text2: error?.response?.data?.message || 'Could not complete action',
          position: 'top',
        })
      } finally {
        setCheckInLoading(false)
      }
    }
  }
  const phoneNumber = item?.mobile;      // ← change to real number (with country code, no + or 00)
  const whatsappNumber = item?.mobile;   // same format
  const emailAddress = item?.email;
  const prefilledMessage = 'Hello! I need help with my order.';

  const handleCall = () => {
    if (!cleanPhone || cleanPhone.length < 10) {
      Alert.alert('Invalid Number', 'Please check the phone number.');
      return;
    }
    const url = `tel:${cleanPhone}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Unable to open dialer'),
    );
  };

  const cleanPhone = normalizeIndianMobileNumber(phoneNumber);
  const cleanWhatsApp = normalizeIndianMobileNumber(whatsappNumber);

  // Final WhatsApp number: prefer whatsapp_number, fallback to mobile_number
  const finalWhatsAppNumber = cleanWhatsApp || cleanPhone;

  const handleWhatsApp = () => {
    // Check if we have a valid number (either WhatsApp or fallback mobile)
    if (!finalWhatsAppNumber || finalWhatsAppNumber.length < 10) {
      Alert.alert('Invalid Number', 'No valid phone or WhatsApp number available.');
      return;
    }

    // Use Indian country code by default (change if needed)
    const whatsappUrl = `whatsapp://send?phone=91${finalWhatsAppNumber}&text=${encodeURIComponent(prefilledMessage)}`;

    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert(
        'WhatsApp Not Installed',
        'WhatsApp is required to send message. Would you like to install it?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Install WhatsApp',
            onPress: () => {
              const storeUrl =
                Platform.OS === 'ios'
                  ? 'https://apps.apple.com/app/whatsapp-messenger/id310633997'
                  : 'https://play.google.com/store/apps/details?id=com.whatsapp';
              Linking.openURL(storeUrl).catch(() =>
                Alert.alert('Error', 'Cannot open store link.'),
              );
            },
          },
        ],
      );
    });
  };
  const openEmail = () => {
    const subject = encodeURIComponent('Inquiry from App');
    const body = encodeURIComponent(prefilledMessage + '\n\nSent from my mobile app');

    const url = `mailto:${emailAddress}`;

    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('No email app found', 'Please set up an email client');
        }
      })
      .catch(err => console.error('Email Linking error:', err));
  };



  const handleLocation = async () => {
    const gps = item?.gps_location?.trim();
    const addr = item?.shipping_address?.trim();

    let query = '';

    // Prefer coordinates if available
    if (gps && gps.includes(',')) {
      const [lat, lng] = gps.split(',').map(s => s.trim());
      if (lat && lng) {
        query = `${lat},${lng}`;
      }
    }

    // Fallback to address
    if (!query && addr) {
      query = encodeURIComponent(addr);
    }

    if (!query) {
      Alert.alert('No Location', 'No GPS or address available.');
      return;
    }

    // ────────────────────────────────────────────────
    // Android: try geo: URI first (works with most map apps)
    // iOS: use maps://
    // Fallback: browser
    // ────────────────────────────────────────────────

    const scheme = Platform.OS === 'android' ? 'geo:0,0?q=' : 'maps://?q=';
    const nativeUrl = scheme + query;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

    try {
      // Try native map app first
      if (await Linking.canOpenURL(nativeUrl)) {
        await Linking.openURL(nativeUrl);
        return;
      }

      // If native fails → open in browser
      await Linking.openURL(webUrl);
    } catch (err) {
      console.log('Map open failed:', err);

      Alert.alert(
        'Cannot Open Map',
        'No map application is available.\n\nThe location will open in your browser instead.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open in Browser',
            onPress: () => Linking.openURL(webUrl).catch(() => { }),
          },
        ]
      );
    }
  };
  return (
    <Pressable style={[styles.cardContainer, shadowStyle]} onPress={() => navigation?.navigate("CustomerDetails", { item, isPunchedIn: isPunchedIn })}>
      {
        !type && (
          <FastImage
            source={customerImage
              ? { uri: customerImage }
              : require('../../assets/images/Dummy/Customer2.png')}
            style={styles.mainImage}
            resizeMode="cover"
          />
        )
      }

      {
        type && (
          <AppText size={18} color="#395299" underline='underline' family="InterBold">
            Currently Checkin at
          </AppText>
        )
      }

      {/* <TouchableOpacity style={[styles.playIconWrapper, { top: 30, left: 8 }]} >
        <BlurView
          blurType="dark"
          blurAmount={36}
          reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.2)"
        />
        <View style={[styles.playIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
          <Text style={styles.tagText}>{item?.rating}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.playIconWrapper, { top: 30, left: 60 }]} >
        <BlurView
          blurType="dark"
          blurAmount={36}
          reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.2)"
        />
        <View style={[styles.playIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
          <Text style={styles.tagText}>{item?.type}</Text>
        </View>
      </TouchableOpacity> */}

      <View style={styles.infoContainer}>
        <Text style={styles.companyName} numberOfLines={2}>
          {customerName}
        </Text>
        <Text style={styles.address} numberOfLines={2}>
          {customerAddress}
        </Text>
      </View>

      {
        !isExpanded && !type && (
          <TouchableOpacity onPress={toggleExpand} style={styles.rightBlurBar}>
            <Animated.View style={[styles.toggleArrow, arrowStyle]}>
              <ArrowCardDownIcon />
            </Animated.View>
          </TouchableOpacity>
        )
      }
      <Animated.View style={[styles.iconsContainer, iconsContainerStyle]}>
        <TouchableOpacity style={styles.iconButton} onPress={toggleExpand}>
          <CrossIconCard />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={handleLocation}>
          <LocationIcon />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={handleCall}>
          <PhoneICon />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={handleWhatsApp}>
          <WhatsappICon />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={openEmail}>
          <EmailIcon />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.viewButton, { width: '25%' }]} onPress={() => navigation?.navigate("CustomerDetails", { item, isPunchedIn: isPunchedIn })}>
          <EyeIcon />
          <AppText size={14} color="#395299" family="InterMedium">
            View
          </AppText>
        </TouchableOpacity>
        {
          !type ? (
            <TouchableOpacity style={[styles.viewButton, { width: '33%', }]}
              onPress={() => {

                if (isPunchedIn == true) {
                  handleCheckInOut()
                } else {
                  if (isPunchedIn == false) {
                    Toast.show({ type: "error", text1: "Please Punch in your attendance" })
                  } else {
                    Toast.show({ type: "error", text1: "Your Today shift is end" })
                  }
                }
                // onCheckInPress()
                // onCheckInPress(item?.last_checkin_date ? "Check Out" : "Check In", item?.id)
              }}>
              <CheckIcon />
              <AppText size={14} color="#395299" family="InterMedium">
                {checkIn ? "Check Out" : "Check In"}
              </AppText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.viewButton, { width: '33%', }]}
              onPress={() => {

                if (isPunchedIn == true) {
                  handleCheckInOut()
                } else {
                  if (isPunchedIn == false) {
                    Toast.show({ type: "error", text1: "Please Punch in your attendance" })
                  } else {
                    Toast.show({ type: "error", text1: "Your Today shift is end" })
                  }
                }
                // onCheckInPress()
                // onCheckInPress(item?.last_checkin_date ? "Check Out" : "Check In", item?.id)
              }}>
              <CheckIcon />
              <AppText size={14} color="#395299" family="InterMedium">
                Check Out
              </AppText>
            </TouchableOpacity>
          )
        }
        {/* {
          !type ? ( */}
            <TouchableOpacity style={[styles.addOrderButton, { width: '36%' }]} onPress={() => {
              const orderCustomer: any = item;
              const customerId = orderCustomer?.customer_id ?? orderCustomer?.id;
              const customerTypeId = orderCustomer?.customer_type_id || orderCustomer?.customertype;
              const customerTypeName = orderCustomer?.customer_type || orderCustomer?.type;
              const isDistributor =
                String(customerTypeName || '').toLowerCase().includes('distributor');
              navigation.navigate("ProductCatalogue", {
                customer_id: customerId,
                retailer_id: isDistributor ? undefined : customerId,
                distributor_id: isDistributor ? customerId : orderCustomer?.distributor_id,
                customer: item,
                type: customerTypeName || (isDistributor ? "Distributor" : "Retailer"),
                customer_type_id: customerTypeId,
                customer_type: customerTypeName,
              });
            }}>
              <FastImage
                source={require('../../assets/images/HomeTabs/addorder.png')}
                style={{ height: 22, width: 22 }}
                resizeMode="cover"
              />
              <AppText size={14} color="#FFFFFF" family="InterMedium">
                Add Order
              </AppText>
            </TouchableOpacity>
          {/* ) : (
            <View style={{ width: '36%' }}>
            </View>
          )
        } */}

      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: width - rw(32),
    backgroundColor: 'white',
    paddingBottom: 10,
    borderRadius: 8,
    paddingHorizontal: rw(12),
    paddingVertical: rw(14),
    marginBottom: 20
  },
  tagContainer: {
    flexDirection: 'row',
    gap: rw(8),
  },
  playIconContainer: {
    paddingHorizontal: 15,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  playIconWrapper: {
    paddingHorizontal: 15,
    height: 32,
    borderRadius: 100,
    position: 'absolute',
  },

  tagText: {
    color: '#fff',
    fontSize: rw(11),
    fontWeight: '600',
  },
  mainImage: {
    width: '100%',
    height: rw(223),
    borderRadius: rw(4),
  },
  infoContainer: {
    marginTop: rw(10),
  },
  companyName: {
    fontSize: rw(16),
    fontFamily: fonts.InterMedium,
    color: colors.black,
    marginBottom: rw(5),
    textTransform: 'capitalize'
  },
  address: {
    fontSize: rw(14),
    fontFamily: fonts.InterRegular,
    color: colors.black,
    opacity: 0.6,
  },
  rightBlurBar: {
    position: 'absolute',
    right: 20,
    top: 30,
    borderRadius: 100,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38,
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  toggleButton: {
    paddingVertical: rw(8),
    alignItems: 'center',
  },
  toggleArrow: {
    height: 26,
    width: 26,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  iconsContainer: {
    alignItems: 'center',
    overflow: 'hidden',
    position: 'absolute',
    right: 20,
    top: 30,
    width: 38,
    // height:200,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  iconButton: {
    width: 26,
    height: 26,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: rw(4),
  },
  iconText: {
    fontSize: rw(18),
    color: '#fff',
  },
  closeButton: {
    width: rw(28),
    height: rw(28),
    borderRadius: rw(14),
    backgroundColor: 'rgba(255,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: rw(8),
    marginBottom: rw(4),
  },
  closeText: {
    fontSize: rw(20),
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: rw(8),
    marginTop: 14,
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  viewButton: {
    height: rw(36),
    borderWidth: 1,
    borderColor: colors.blue,
    borderRadius: rw(100),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: rw(6),
  },
  addOrderButton: {
    height: rw(36),
    backgroundColor: colors.blue,
    borderRadius: rw(100),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: rw(6),
  },
});

export default CustomerCard;
