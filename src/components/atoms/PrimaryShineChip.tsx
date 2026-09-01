import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import AppText from '../AppText/AppText';
import { colors } from '../../utils/Colors';

const PrimaryShineChip = ({ label = 'Primary' }: { label?: string }) => {
  const shine = useRef(new Animated.Value(-40)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shine, {
          toValue: 90,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(900),
        Animated.timing(shine, {
          toValue: -40,
          duration: 1,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, [shine]);

  return (
    <View style={styles.chip}>
      <Animated.View style={[styles.shine, { transform: [{ translateX: shine }, { rotate: '18deg' }] }]} />
      <AppText color={colors.blue} size={11} family="InterSemiBold">{label}</AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'center',
    overflow: 'hidden',
    backgroundColor: '#e8eaf7',
    borderWidth: 1,
    borderColor: '#cdd3f3',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  shine: {
    position: 'absolute',
    top: -8,
    bottom: -8,
    left: 0,
    width: 18,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
});

export default PrimaryShineChip;
