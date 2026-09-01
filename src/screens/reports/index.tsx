import { View, Text, Pressable } from 'react-native'
import React from 'react'
import { styles } from './styles'
import { ScrollView } from 'react-native-gesture-handler'
import { rw } from '../../utils/responsive'
import AppText from '../../components/AppText/AppText'
import { EyeIcon } from '../../assets/svgs/SvgsFile'

const Reports = ({ navigation }: any) => {
  return (
    <View style={[styles.container,]}>
      <ScrollView style={{ flex: 1, marginTop: 20, paddingHorizontal: rw(20) }} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.activityView} onPress={() => navigation.navigate('UserActivityPage')}>
          <AppText size={16} color='black' opacity={0.8} family='InterSemiBold'>User Activity</AppText>
          <View style={styles.eywView}>
            <EyeIcon />
          </View>
        </Pressable>
        <Pressable style={styles.activityView} onPress={() => navigation.navigate('AttendanceReport')}>
          <AppText size={16} color='black' opacity={0.8} family='InterSemiBold'>Attendance</AppText>
          <View style={styles.eywView}>
            <EyeIcon />
          </View>
        </Pressable>
        <Pressable style={styles.activityView} onPress={() => navigation.navigate('TourPlanPage')}>
          <AppText size={16} color='black' opacity={0.8} family='InterSemiBold'>Tour Plan</AppText>
          <View style={styles.eywView}>
            <EyeIcon />
          </View>
        </Pressable>
        <Pressable style={styles.activityView} onPress={() => navigation.navigate('OrderListDetails')}>
          <AppText size={16} color='black' opacity={0.8} family='InterSemiBold'>Order History</AppText>
          <View style={styles.eywView}>
            <EyeIcon />
          </View>
        </Pressable>


      </ScrollView>
    </View>
  )
}

export default Reports