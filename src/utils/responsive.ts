import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (based on standard iPhone 11)
const baseWidth = 375;
const baseHeight = 812;

export const scale = (size: number) => {
  const scale = SCREEN_WIDTH / baseWidth;
  const newSize = size * scale;
  
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
};

export const verticalScale = (size: number) => {
  const scale = SCREEN_HEIGHT / baseHeight;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const moderateScale = (size: number, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

const percentageCalculation = (max: number, val: number) => max * (val / 100);

const responsiveWidth = (w: number) => {
  const { width } = Dimensions.get('window');
  return percentageCalculation(width, w);
};

// Check for Platform
export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';

// Responsive Dimensions - More consistent across platforms
const width = 393; // Use same base width for both platforms
const screenWidth = width / 100;

export function rw(n: number) {
  const result = responsiveWidth(n / screenWidth);
  // Add slight platform-specific adjustment for better consistency
  return Platform.OS === 'android' ? Math.round(result) : result;
}

export const deviceWidth = Dimensions.get('window').width;
export const deviceHeight = Dimensions.get('window').height; 