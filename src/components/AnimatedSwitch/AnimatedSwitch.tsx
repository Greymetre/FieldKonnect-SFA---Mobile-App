import React, { useEffect } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '../../utils/Colors';
import { fonts } from '../../utils/typography';

const springConfig = (velocity = 0) => ({
  stiffness: 900,
  damping: 80,
  mass: 1,
  velocity,
});

interface AnimatedSwitchProps {
  dataPress: (val: boolean) => void;
  text1?: string;
  text2?: string;
  initialValue?: boolean;  // ← NEW optional prop for initial state (from parent)
  height?: number
}

export default function AnimatedSwitch({
  dataPress,
  text1,
  text2,
  initialValue = true,
  height
}: AnimatedSwitchProps) {
  // position of slider
  const x = useSharedValue(0);
  const containerWidth = useSharedValue(0);
  const sliderMax = useSharedValue(0);
  const selectedIndex = useSharedValue(initialValue ? 0 : 1);
  const startX = useSharedValue(0);
  // Sync internal state when initialValue changes (from parent route/props)
  useEffect(() => {
    selectedIndex.value = initialValue ? 0 : 1;

    if (sliderMax.value > 0) {
      x.value = withSpring(
        initialValue ? 0 : sliderMax.value,
        springConfig()
      );
    }
  }, [initialValue]);


  const panGesture = Gesture.Pan()
    .onBegin(() => {
      // store where the slider currently is
      startX.value = x.value;
    })
    .onUpdate((event) => {
      const next = startX.value + event.translationX;
      // clamp between 0 and sliderMax
      x.value = Math.max(0, Math.min(next, sliderMax.value));
    })
    .onEnd((event) => {
      const threshold = sliderMax.value / 2;

      if (x.value > threshold) {
        selectedIndex.value = 1;
        x.value = withSpring(sliderMax.value, {
          stiffness: 900,
          damping: 80,
          mass: 1,
          velocity: event.velocityX,
        });
        runOnJS(dataPress)(false);
      } else {
        selectedIndex.value = 0;
        x.value = withSpring(0, {
          stiffness: 900,
          damping: 80,
          mass: 1,
          velocity: event.velocityX,
        });
        runOnJS(dataPress)(true);
      }

    });

  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
    width: containerWidth.value / 2 - 6,
  }));

  const textStyle1 = useAnimatedStyle(() => ({
    fontFamily: selectedIndex.value === 0 ? fonts.InterMedium : fonts.InterRegular,
    color: selectedIndex.value === 0 ? colors.blue : '#797C86',
  }));

  const textStyle2 = useAnimatedStyle(() => ({
    fontFamily: selectedIndex.value === 1 ? fonts.InterMedium : fonts.InterRegular,
    color: selectedIndex.value === 1 ? colors.blue : '#797C86',
  }));

  return (
    <View style={styles.outer}>
      <Animated.View
        style={[styles.rowContainer, { height: height ? height : 50 }]}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          containerWidth.value = w;
          sliderMax.value = w / 2 - 6;

          // ✅ position slider based on selectedIndex (not initialValue)
          x.value = withSpring(
            selectedIndex.value === 0 ? 0 : w / 2 - 6,
            springConfig()
          );
        }}
      >
        {/* labels */}
        <View style={styles.rowSubContainer}>
          <Animated.View style={styles.rowSubContainer2}>
            <TouchableOpacity
              onPress={() => {
                if (selectedIndex.value == 1) {
                  selectedIndex.value = 0;
                  x.value = withSpring(0, springConfig());
                  runOnJS(dataPress)(true);
                }

              }}
              activeOpacity={1}
              hitSlop={10}
            >
              <Animated.Text style={[styles.txt, textStyle1]}>{text1}</Animated.Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={styles.rowSubContainer2}>
            <TouchableOpacity
              onPress={() => {
                if (selectedIndex.value == 0) {
                  selectedIndex.value = 1;
                  x.value = withSpring(sliderMax.value, springConfig());
                  runOnJS(dataPress)(false);
                }
              }}
              activeOpacity={1}
              hitSlop={10}
            >
              <Animated.Text style={[styles.txt, textStyle2]}>{text2}</Animated.Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* moving slider */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.moveBar, sliderStyle]} />
        </GestureDetector>
      </Animated.View>
    </View>
  );
}

// styles remain exactly the same
const styles = StyleSheet.create({
  outer: {
    alignSelf: 'center',
    width: '40%',
  },
  rowContainer: {
    borderRadius: 50,
    backgroundColor: 'rgba(57, 82, 153, 0.09)',
    overflow: 'hidden',
    height: 50,
    justifyContent: 'center',
    padding: 3,
  },
  rowSubContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
    alignSelf: 'center',
  },
  rowSubContainer2: {
    width: '48.5%',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  txt: {
    paddingHorizontal: 15,
    fontSize: 12,
    fontFamily: fonts.InterRegular,
    color: '#797C86',
    textAlign: 'center',
  },
  moveBar: {
    position: 'absolute',
    left: 4,
    height: '100%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
});