import React, { useRef } from 'react';
import {
  View,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
  Easing,
  Platform,
} from 'react-native';
import { colors } from '../../utils/Colors';
import { LocationIcon } from '../../assets/svgs/HomePageSvgs';
import AppText from '../../components/AppText/AppText';



interface CustomToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (newValue: boolean) => void;
  disabled?: boolean;
  compact?: boolean;
  plain?: boolean;
}

const CustomToggleRow = ({
  label,
  value,
  onValueChange,
  disabled = false,
  compact = false,
  plain = false,
}: CustomToggleRowProps) => {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  // Sync external value changes (if controlled from parent)
  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [value]);

  const toggle = () => {
    if (disabled) return;

    const newValue = !value;
    onValueChange(newValue);

    Animated.timing(animatedValue, {
      toValue: newValue ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  // Interpolate values
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22], // adjust if you change SWITCH_WIDTH / thumb size
  });

  const trackBackground = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: plain ? ['#E7EBF1', 'rgba(57, 82, 153, 0.25)'] : [colors.white, colors.white],
  });

  const thumbBackground = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: plain ? [colors.white, colors.blue] : ['red', "#39C04E"],
  });

  return (
    <View style={[styles.toggleRow, plain && styles.plainToggleRow, compact && styles.compactToggleRow]}>
      {!compact && <View style={styles.toggleLabel}>
        {!plain && <LocationIcon color={colors.white} />}
        <AppText size={14} color={plain ? colors.black : colors.white} family="InterRegular" numLines={1}>
          {label}
        </AppText>
      </View>}

      <TouchableWithoutFeedback onPress={toggle} disabled={disabled}>
        <View style={styles.switchContainer}>
          <Animated.View
            style={[
              styles.track,
              {
                backgroundColor: trackBackground,
                opacity: disabled ? 0.5 : 1,
              },
            ]}
          />

          <Animated.View
            style={[
              styles.thumb,
              {
                transform: [{ translateX }],
                backgroundColor: thumbBackground,
                elevation: value ? 4 : 2, // subtle shadow lift when on
                shadowOpacity: value ? 0.3 : 0.15,
              },
            ]}
          />
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default CustomToggleRow;

const SWITCH_WIDTH = 52;
const SWITCH_HEIGHT = 30;
const THUMB_SIZE = 26;

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    backgroundColor:'#39C04E'
  },
  toggleLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compactToggleRow: {
    width: SWITCH_WIDTH,
    height: SWITCH_HEIGHT,
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  plainToggleRow: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  switchContainer: {
    width: SWITCH_WIDTH,
    height: SWITCH_HEIGHT,
    justifyContent: 'center',
    marginLeft: 10,
  },
  track: {
    width: '100%',
    height: '100%',
    borderRadius: SWITCH_HEIGHT / 2,
    position: 'absolute',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    ...Platform.select({
      android: { elevation: 3 },
    }),
  },
});
