import { View, FlatList, Linking } from 'react-native'
import React, { useCallback, useEffect } from 'react'
import { styles } from './styles';
import AppText from '../../components/AppText/AppText';
import { colors } from '../../utils/Colors';
import { useGetUserActivity } from '../../api/query/CustomerApi';
import UserActivityCard from '../../components/atoms/UserActivityCard';
import Toast from 'react-native-toast-message';

const formatDateToApi = (dateString: string) => {
  if (!dateString) return '';

  const [day, month, year] = dateString.split('/');
  return `${year}-${month}-${day}`;
};

const IndividualPage = ({ navigation, route }: any) => {
  const routeItem = route?.params?.item;
  const [activityTimeline, setActivityTimeline] = React.useState<any[]>([]);
  const [_activityLoading, setActivityLoading] = React.useState<boolean>(false);
  const reportingManagerName =
    routeItem?.reporting?.name ||
    routeItem?.reporting_manager_name ||
    routeItem?.reportingManagerName ||
    routeItem?.manager_name ||
    routeItem?.reporting_manager?.name;
  const reportingManagerMobile =
    routeItem?.reporting?.mobile ||
    routeItem?.reporting_manager_mobile ||
    routeItem?.reportingManagerMobile ||
    routeItem?.manager_mobile ||
    routeItem?.reporting_manager?.mobile;

  const { mutateAsync: muatetGetUserActivity } = useGetUserActivity()

  const handleUserActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const payload = {
        user_id: routeItem?.user_id,
        date: formatDateToApi(routeItem?.date),
      }
      const res: any = await muatetGetUserActivity(payload)

      if (res?.data?.status === true || res?.data?.status === "success") {
        console.log(res?.data, 'res?.datares?.data');

        setActivityTimeline(res?.data?.data)

      }
    } catch (error: any) {
      console.log('Check-in/out error:', error?.response)
      Toast.show({
        type: 'error',
        text1: error?.response?.message || 'Failed',
      })
    } finally {
      setActivityLoading(false)
    }
  }, [muatetGetUserActivity, routeItem?.date, routeItem?.user_id])

  useEffect(() => {
    handleUserActivity()
  }, [handleUserActivity])

  const handleReportingManagerCall = () => {
    if (!reportingManagerMobile || reportingManagerMobile.length < 10) {
      Toast.show({ type: 'info', text1: 'Reporting manager mobile not available' });
      return;
    }

    Linking.openURL(`tel:${reportingManagerMobile}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.individualContent}>
        <View>
          <AppText size={17} color={colors.blue} family='InterBold'>{routeItem?.name} - {routeItem?.date}</AppText>
          <AppText
            size={14}
            color={reportingManagerMobile ? colors.blue : '#1E1E1E'}
            family='InterMedium'
            underline={reportingManagerMobile ? 'underline' : undefined}
            style={styles.reportingManagerText}
            onPress={handleReportingManagerCall}
          >
            Reporting: {reportingManagerName || 'N/A'}
          </AppText>
        </View>
        <View style={[styles.graphView, styles.activityCardsContainer]}>
          <FlatList
            data={activityTimeline}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <UserActivityCard index={index} todayPunchInData={undefined} item={item} navigation={navigation} />
            )}
            contentContainerStyle={styles.activityCardsContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </View>
  )
}

export default IndividualPage
