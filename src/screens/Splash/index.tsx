import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { colors } from '../../utils/Colors';
import FastImage from 'react-native-fast-image';
import { SCREEN_HEIGHT } from '../../utils/misc';

const SplashScreen = () => {
  return (
    <View style={[styles.container, styles.center]}>
      <FastImage style={[styles.imageArea, styles.center]} source={require('../../assets/images/CircleArea.png')}>
        <FastImage style={[styles.logo, styles.center]} resizeMode='contain' source={require('../../assets/images/FieldKonnectLogo.png')} >
        </FastImage>
      </FastImage>
    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.blue
  },
  center: {
    justifyContent: 'center',
    alignItems: "center"
  },
  imageArea: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.9
  },
  logo:{
    width:'80%',
    height: 50
  },
});
export default SplashScreen