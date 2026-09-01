import { View, Text, StyleSheet, Pressable, StatusBar } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../utils/Colors';
import { rw } from '../../utils/responsive';
import { BackIcon } from '../../assets/svgs/SvgsFile';
import AppText from '../AppText/AppText';
import { getHeaderTitle } from '@react-navigation/elements';
import { shadowStyle } from '../../utils/typography';

const CustomHeader = ({ navigation, route, options, back }: any) => {
  const title = getHeaderTitle(options, route.name);
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={"dark-content"}
      />
      <View style={[styles.mainView, styles.row, shadowStyle]}>
        <Pressable onPress={() => navigation.goBack()}>
          <BackIcon />
        </Pressable>
        <View style={styles.titleView}>
          <AppText size={18} color='black' family='InterMedium' opacity={0.8}>{title}</AppText>
        </View>
        {options.headerRight ? <View style={styles.rightView}>{options.headerRight({})}</View> : null}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white
  },
  mainView: {
    height: 64,
    width: "100%",
    paddingHorizontal: rw(20),
    backgroundColor: 'white'
  },
  row: {
    flexDirection: 'row',
    alignItems: "center"
  },
  titleView: {
    paddingLeft: rw(15),
    flex: 1
  },
  rightView: { marginLeft: 12 },
});

export default CustomHeader
