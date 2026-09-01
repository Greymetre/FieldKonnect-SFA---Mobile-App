import { View, ScrollView, Pressable, Image, Alert, ActivityIndicator, Platform } from 'react-native'
import React, { useState } from 'react'
import { styles } from './styles'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { LeadIcon, LogoIcon, SunnyIcon } from '../../assets/svgs/HomePageSvgs'
import AppText from '../../components/AppText/AppText'
import LinearGradient from 'react-native-linear-gradient'
import FastImage from 'react-native-fast-image'
import { useNavigation } from '@react-navigation/native'
import { logout, setToken, setUser } from '../../components/redux/slice/AuthSlice'
import { useDispatch } from 'react-redux'
import { useAppSelector } from '../../components/redux/Store'
import { BASE_URL, resolveMediaUrl } from '../../api/AxiosClient'
import { colors } from '../../utils/Colors'
import { BackIcon, UserIcon } from '../../assets/svgs/SvgsFile'
import axios from 'axios'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../utils/misc'
import { stopLiveLocationTracking } from '../../services/liveLocationService'
import { logoutApi } from '../../api/query/AuthAPI'
import Svg, { Path } from 'react-native-svg'

const data = [
  { id: 1, icon: require('../../assets/images/HomeTabs/myprofile.png'), name: 'My Profile' },
  { id: 2, name: 'Lead' },
  { id: 8, name: 'Task' },
  // { id: 2, icon:require('../../assets/images/HomeTabs/orderHistory.png'), name: 'Order History' },
  { id: 3, icon: require('../../assets/images/HomeTabs/report.png'), name: 'Report' },
  { id: 4, icon: require('../../assets/images/HomeTabs/documents.png'), name: 'Documents' },
  // { id: 5, icon: require('../../assets/images/HomeTabs/mspactivity.png'), name: 'MSP Activity' },
  { id: 6, icon: require('../../assets/images/HomeTabs/logout.png'), name: 'Logout' },
  { id: 7, icon: require('../../assets/images/Dummy/danger.png'), name: 'Delete Account' },
]

const getDesignation = (user: any) => {
  const value = user?.designation_name
    || (typeof user?.designation === 'object'
      ? user.designation?.designation_name || user.designation?.name
      : user?.designation);

  return typeof value === 'string' ? value.trim() : '';
}

const ProfileTab = ({ handleDrawerClose }: any) => {
  const navigation: any = useNavigation()
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const { user } = useAppSelector(
    (state) => state.auth
  );
  const designation = getDesignation(user);
  const displayName = `${user?.name || 'User'}${designation ? ` - ${designation}` : ''}`;

  const handleLogout = async () => {
    setLoading(true);

    try {
      await logoutApi();
    } catch (error) {
      console.warn('Logout API failed:', error);
    } finally {
      await stopLiveLocationTracking({ captureFinalLocation: false });
      dispatch(logout());
      dispatch(setUser(null));
      dispatch(setToken(null));
      navigation?.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }],
      });
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete this account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);

              await axios.post(
                `${BASE_URL}api/delete-user`,
                {
                  user_id: user?.id,
                },
                {
                  headers: {
                    'Content-Type': 'application/json',
                  },
                },
              );

              await stopLiveLocationTracking({ captureFinalLocation: false });
              dispatch(logout());
              dispatch(setUser(null));
              dispatch(setToken(null));

              navigation?.reset({
                index: 0,
                routes: [{ name: 'LoginScreen' }],
              });

            } catch (error) {
              console.log('Delete Account Error:', error);
              Alert.alert('Error', 'Failed to delete account');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1 }}>

      <ScrollView style={[styles.container, { marginBottom: 20 }]} showsVerticalScrollIndicator={false}>
        {/* <View style={[styles.blueContaier, {
          height: 255 ,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }]} /> */}
        {
          loading && (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.3)',
                height: SCREEN_HEIGHT,
                width: SCREEN_WIDTH,
                position: 'absolute',
              }}
            >
              <ActivityIndicator size="large" color={colors.blue} />
            </View>
          )
        }

        <View style={[{ width: '100%', backgroundColor: colors.blue, justifyContent: 'space-between', paddingTop: useSafeAreaInsets()?.top, gap: 30 }]}>
          <View style={[styles.header, styles.row, {}]}>
            <Pressable style={{ alignItems: 'center', flexDirection: "row", gap: 20 }} onPress={handleDrawerClose}>
              <BackIcon size={28} color="white" />
              <LogoIcon />
            </Pressable>
            <View style={[styles.row, styles.button]}>
              <AppText size={12} color='white' family='InterMedium'>Good Day</AppText>
              <SunnyIcon />
            </View>

          </View>
          <LinearGradient style={[styles.profileView, styles.row]} colors={['#395299', 'rgba(56, 143, 205, 0.5)']} locations={[0.5, 1]}>
            <View style={{ height: 101, width: 101, borderRadius: 55, marginLeft: 16, marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', }}>
              {!user?.profile_image && <UserIcon />}
              {!!user?.profile_image && (
                <FastImage source={{ uri: resolveMediaUrl(user.profile_image) }} style={{ height: 101, width: 101, borderRadius: 101, position: 'absolute' }} />
              )}
              {/* <FastImage source={require('../../assets/images/HomeTabs/profile.png')} style={{ height: 101, width: 101, borderRadius: 101, position: 'absolute' }} /> */}
              {/* {
                user?.profile_image && (
                  <FastImage source={{ uri: `${IMAGE_BASE_URL}/public/storage/${user?.profile_image}` }} style={{ height: 101, width: 101, borderRadius: 101, position: 'absolute' }} />
                )
              } */}

            </View>
            <View style={{ gap: 5, paddingLeft: 20, marginBottom: 20 }}>

              <AppText size={20} family='InterBold' color='white'>{displayName}</AppText>
              <AppText size={20} family='InterMedium' color='white'>{user?.mobile}</AppText>
            </View>

          </LinearGradient>
        </View>
        <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>

          <View style={{ flex: 1, marginTop: 4, gap: 8, paddingHorizontal: 16 }}>
            {
              data?.map((item: any) => {
                if(Platform.OS == "android" && item?.name == "Delete Account"){
                  return null;
                } 
                return (
                  <Pressable key={item.id} style={[styles.itemVIew, styles.row]} onPress={async () => {
                    if (item?.name == "My Profile") {
                      handleDrawerClose()
                      navigation.navigate('MyProfile')
                    }
                    else if (item?.name == "Report") {
                      navigation.navigate('Reports')
                      handleDrawerClose()
                      // navigation.navigate('UserActivityPage')
                      // navigation.navigate('AttendanceReport')
                    }
                    else if (item?.name == "Documents") {
                      navigation.navigate('Documents')
                      handleDrawerClose()
                    }
                    else if (item?.name == "Lead") {
                      navigation.navigate('LeadKonnect')
                      handleDrawerClose()
                    }
                    else if (item?.name == "Task") {
                      navigation.navigate('TaskList')
                      handleDrawerClose()
                    }
                    else if (item?.name == "Order History") {
                      navigation.navigate('OrderList')
                      handleDrawerClose()
                    }
                    else if (item?.name == "Logout") {
                      await handleLogout();
                    }
                    else if (item?.name == "Delete Account") {
                      handleDeleteAccount();
                    }

                  }}>
                    {
                      item?.name == "Lead" ? (
                        <LeadIcon width={20} height={20} />
                      ) : item?.name == "Task" ? (
                        <TaskDrawerIcon />
                      ) : item?.name == "Delete Account" ? (
                        <DeleteDrawerIcon />
                      ) : (
                        <Image
                          source={item?.icon}
                          style={{ height: 20, width: 20 }}
                          resizeMode='contain'

                        />
                      )
                    }
                    <AppText size={16} color='black' family='InterMedium'>{item?.name}</AppText>
                  </Pressable>
                )
              })
            }
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  )
}

export default ProfileTab

const TaskDrawerIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M8 4.5h-1.5A2.5 2.5 0 004 7v12a2.5 2.5 0 002.5 2.5h11A2.5 2.5 0 0020 19V7a2.5 2.5 0 00-2.5-2.5H16" stroke="#3895D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 2.5h6a1 1 0 011 1v2H8v-2a1 1 0 011-1zM8 11l1.4 1.4L12 9.8M14 11h3M8 16l1.4 1.4L12 15.8M14 17h3" stroke="#3895D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)

const DeleteDrawerIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M4 7h16M9 7V4h6v3m3 0l-1 14H7L6 7m4 4v6m4-6v6" stroke="#3895D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
)
