import { View, Text, StyleSheet, StyleProp, TextStyle, Animated } from 'react-native'
import React from 'react'
import { fonts } from '../../utils/typography'
import { AppTextProps } from '../../utils/Types'


const AppText = ({ size, color, family, align, width, underlineColor, underline, onPress, transform, numLines, spacing, horizontal, children, testID, customColor, dotMode, animateValue, maxWidth, opacity, lineHeight, handleTextLayout, textDecorationStyle, fontStyle, style }: AppTextProps & { style?: StyleProp<TextStyle> }) => {

  let fontFamily: any
  switch (family) {
    case 'InterBlack': {
      fontFamily = fonts.InterBlack //
      break
    }
    case 'InterBold': {
      fontFamily = fonts.InterBold
      break
    }

    case 'InterExtraBold': {
      fontFamily = fonts.InterExtraBold
      break
    }
    case 'InterExtraLight': {
      fontFamily = fonts.InterExtraLight
      break
    }
    case 'InterLight': {
      fontFamily = fonts.InterLight
      break
    }
    case 'InterMedium': {
      fontFamily = fonts.InterMedium
      break
    }
    case 'InterRegular': {
      fontFamily = fonts.InterRegular
      break
    }
    case 'InterSemiBold': {
      fontFamily = fonts.InterSemiBold
      break
    }
    case 'InterThin': {
      fontFamily = fonts.InterThin
      break
    }
  }
  const internalStyle: StyleProp<TextStyle> = {
    color: color ? color : 'black',
    fontSize: size,
    fontFamily: fontFamily,
    textAlign: align,
    textTransform: transform,
    letterSpacing: spacing,
    paddingHorizontal: horizontal,
    textDecorationLine: underline,
    textDecorationColor: underlineColor,
    textDecorationStyle: textDecorationStyle,
    width: width,
    maxWidth: maxWidth,
    opacity: opacity ? opacity : 1,
    lineHeight: lineHeight,
    fontStyle: fontStyle
  }
  return (
    <Animated.Text allowFontScaling={false} maxFontSizeMultiplier={1.3} style={[internalStyle, style, animateValue && { transform: [{ scale: animateValue }], }]} numberOfLines={numLines} ellipsizeMode={dotMode} onPress={onPress} onTextLayout={handleTextLayout}>{children}</Animated.Text>
  )
}
const styles = StyleSheet.create({
  mainText: {}
})

export default AppText