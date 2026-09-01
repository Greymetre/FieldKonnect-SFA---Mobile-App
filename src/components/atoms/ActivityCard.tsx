import React from "react";
import { Alert, Linking, Platform, Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText/AppText";
import { colors } from "../../utils/Colors";
import { ClockIcon, LocationIcon } from "../../assets/svgs/HomePageSvgs";
import Toast from "react-native-toast-message";

const ActivityCard = ({ todayPunchInData, item, navigation, index }: any) => {

  const openGoogleMaps = (lat: string, lng: string, label?: string) => {
    if (!lat || !lng) {
      Toast.show({ type: "info", text1: "Location not available" })
      return;
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    const url = Platform.select({
      ios: `http://maps.apple.com/?ll=${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}`
    });

    Linking.openURL(url as string);
  };

  return (
    <Pressable style={styles.gap} >
      <View style={[styles.line,]}>
        <AppText
          size={15}
          color={colors.white}
          family='InterSemiBold'>
          {item?.type}
        </AppText>
        <View style={[styles.row, { gap: 10 }]}>
          <View style={styles.row}>
            <ClockIcon />
            <AppText
              size={14}
              color={colors.white}
              opacity={0.8}
              family='InterMedium'>
              {
                index == 0 ? todayPunchInData?.punchin_time : item?.time
              }

            </AppText>
          </View>
          {
            index == 0 ? (
              <>
                <Pressable style={styles.row} onPress={() => {
                  openGoogleMaps(
                    todayPunchInData?.punchin_longitude,
                    todayPunchInData?.punchin_latitude,
                    todayPunchInData?.punchin_address
                  )
                }}>
                  <LocationIcon />
                  <AppText
                    size={14}
                    color={colors.white}
                    opacity={0.8}
                    underline="underline"
                    family='InterMedium'>
                    {'View'}
                  </AppText>
                </Pressable>
              </>
            ) : (
              <>
                {
                  item?.location && (
                    <View style={styles.row}>
                      <LocationIcon />
                      <AppText
                        size={14}
                        color={colors.white}
                        opacity={0.8}
                        family='InterMedium'>
                        {item?.location}
                      </AppText>
                    </View>
                  )
                }
              </>
            )
          }


        </View>
      </View>
      <View style={[styles.inner]}>
        <AppText
          size={14}
          color={'#1E1E1E'}
          family='InterRegular'>
          {
            index == 0 ? todayPunchInData?.working_type : item?.description
          }
        </AppText>
      </View>
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
    shadowOffset: { width: 0, height: 10 },
    shadowColor: 'grey',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4
  },
  line: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: '#5870B4',
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 10 },
    shadowColor: 'grey',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  gap: {
    gap: 12,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  }
});

export default ActivityCard;
