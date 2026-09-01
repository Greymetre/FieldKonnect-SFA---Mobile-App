import React from "react";
import { Alert, Linking, Platform, Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText/AppText";
import { colors } from "../../utils/Colors";
import { ClockIcon, LocationIcon } from "../../assets/svgs/HomePageSvgs";

const UserActivityCard = ({ item }: any) => {
  const handleLocation = async (lat: any, lng: any, add: any) => {
    const addr = add?.trim();
    const latitude = Number(lat);
    const longitude = Number(lng);
    const hasCoordinateValues =
      lat !== null &&
      lat !== undefined &&
      lng !== null &&
      lng !== undefined &&
      String(lat).trim() !== '' &&
      String(lng).trim() !== '';
    const hasCoordinates = hasCoordinateValues &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      Math.abs(latitude) <= 90 &&
      Math.abs(longitude) <= 180;

    if (!hasCoordinates && !addr) {
      Alert.alert('No Location', 'No GPS or address available.');
      return;
    }

    const markerLabel = addr || 'Activity Location';
    const coordinateQuery = `${latitude},${longitude}`;
    const nativeUrl = hasCoordinates
      ? Platform.OS === 'android'
        ? `geo:${coordinateQuery}?q=${encodeURIComponent(`${coordinateQuery}(${markerLabel})`)}`
        : `http://maps.apple.com/?ll=${coordinateQuery}&q=${encodeURIComponent(markerLabel)}`
      : Platform.OS === 'android'
        ? `geo:0,0?q=${encodeURIComponent(addr)}`
        : `http://maps.apple.com/?q=${encodeURIComponent(addr)}`;
    const webUrl = hasCoordinates
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinateQuery)}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;

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
    <Pressable style={styles.gap} >
      <View style={[styles.line,]}>
        <AppText
          size={15}
          color={colors.white}
          family='InterSemiBold'>
          {item?.title == "New Customer Registration" ? "Customer Add" : item?.title}
        </AppText>
        <View style={[styles.row, { gap: 10 }]}>
          <View style={styles.row}>
            <ClockIcon />
            <AppText
              size={14}
              color={colors.white}
              opacity={0.8}
              family='InterMedium'>
              {item?.time}
            </AppText>
          </View>

          <>
            {
              (item?.latitude != "" && item?.longitude != "") && (
                <Pressable style={styles.row} onPress={() => {
                  const isPunchActivity = item?.title === 'Punchin' || item?.title === 'Punchout';
                  handleLocation(
                    isPunchActivity ? item?.longitude : item?.latitude,
                    isPunchActivity ? item?.latitude : item?.longitude,
                    item?.location,
                  )
                }}>
                  <LocationIcon />
                  <AppText
                    size={14}
                    color={colors.white}
                    opacity={0.8}
                    family='InterMedium'>
                    {'View'}
                  </AppText>
                </Pressable>
              )
            }
          </>



        </View>
      </View>
      {
        item?.title == "Order" && (
          <View style={[styles.inner]}>

            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Order No: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.order_no}

              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Order Value: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.value}
              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Order Quantity: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.qty}
              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Buyer Name: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.customer}
              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Seller Name: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.seller}
              </AppText>
            </AppText>
          </View>
        )
      }
      {
        (item?.title == "Customer Edit" || item?.title == "Customer Rejected" || item?.title == "Customer Approved") && (
          <View style={[styles.inner]}>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Customer Name: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.customer}
              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Address: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.location}

              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'City: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.city}

              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'State: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.state}

              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Customer Type: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.customer_type}

              </AppText>
            </AppText>
            {
              item?.title == "Customer Rejected" && (
                <AppText
                  size={14}
                  color={'#1E1E1E'}
                  family='InterRegular'>
                  {'Remark: '}
                  <AppText
                    size={14}
                    color={'#1E1E1E'}
                    family='InterSemiBold'>
                    {item?.remark}

                  </AppText>
                </AppText>
              )
            }


          </View>
        )
      }
      {
        item?.title == "Punchin" && (
          <View style={[styles.inner]}>

            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Location: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.location}

              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Objective: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.working_type}
              </AppText>
            </AppText>
          </View>
        )
      }
      {
        item?.title == "Checkin" && (
          <View style={[styles.inner]}>

            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Location: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.location}

              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Customer: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.customer}
              </AppText>
            </AppText>
          </View>
        )
      }
      {
        item?.title == "New Customer Registration" && (
          <View style={[styles.inner]}>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Customer: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.customer}
              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Address: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.location}

              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'City: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.city}

              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'State: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.state}

              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Customer Type: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.customer_type}

              </AppText>
            </AppText>

          </View>
        )
      }
      {
        item?.title == "Punchout" && (
          <View style={[styles.inner]}>

            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Location: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.location || 'N/A'}

              </AppText>
            </AppText>

          </View>
        )
      }
      {
        item?.title == "Checkout" && (
          <View style={[styles.inner]}>

            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Location: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.location}

              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Customer Name: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.customer}
              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Remark: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.remark}
              </AppText>
            </AppText>
          </View>
        )
      }

    </Pressable>
  );
};

const styles = StyleSheet.create({
  inner: {
    backgroundColor: 'white',
    paddingBottom: 16,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    paddingHorizontal: 14,
    gap: 6
    // shadowOffset: { width: 0, height: 10 },
    // shadowColor: 'grey',
    // shadowOpacity: 0.2,
    // shadowRadius: 5,
    // elevation: 4
  },
  line: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: '#3654a4',
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 10 },
    // shadowColor: 'grey',
    // shadowOpacity: 0.2,
    // shadowRadius: 5,
    // elevation: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  gap: {
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  }
});

export default UserActivityCard;
