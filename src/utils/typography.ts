import { Dimensions, Platform } from "react-native"

export const shadowStyle: any = {
  shadowOffset: { width: 4, height: 5},
  shadowColor: Platform.OS == "ios" ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.1)',
  shadowOpacity: 1,
  shadowRadius: 5,
  elevation: 8
}

// shadowOffset: { width: 0, height: 0 },
//     shadowColor: 'rgb(38, 73, 105)',
//     shadowOpacity: 1.4,
//     shadowRadius: 25,
//     elevation: 2


export const fonts = {
  InterBlack: 'Inter-Black',
  InterBold: 'Inter-Bold',
  InterExtraBold:'Inter-ExtraBold',
  InterExtraLight: 'Inter-ExtraLight',
  InterLight: 'Inter-Light',
  InterMedium: 'Inter-Medium',
  InterRegular: 'Inter-Regular',
  InterSemiBold: 'Inter-SemiBold',
  InterThin: 'Inter-Thin',
}


