import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AppText from '../AppText/AppText';
import { colors } from '../../utils/Colors';

type Props = {
  visible: boolean;
  title: string;
  mode: 'date' | 'time';
  value: Date;
  minimumDate?: Date;
  onCancel: () => void;
  onDone: (value: Date) => void;
};

/**
 * iOS date/time picker shown as an overlay inside the current screen or modal
 * (not a separate Modal). Dates use the native calendar, times the wheel, both
 * forced to the light theme so they stay readable when the phone is in dark mode.
 */
const IosPickerOverlay = ({ visible, title, mode, value, minimumDate, onCancel, onDone }: Props) => {
  const [draft, setDraft] = useState(value);
  useEffect(() => { if (visible) setDraft(value); }, [visible, value]);
  if (!visible) return null;

  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
      <View style={styles.card}>
        <View style={styles.header}>
          <Pressable hitSlop={10} onPress={onCancel}><AppText size={14} color="#687086" family="InterSemiBold">Cancel</AppText></Pressable>
          <AppText size={16} color="#202432" family="InterBold">{title}</AppText>
          <Pressable hitSlop={10} onPress={() => onDone(draft)}><AppText size={14} color={colors.blue} family="InterBold">Done</AppText></Pressable>
        </View>
        <DateTimePicker
          value={draft}
          mode={mode}
          display={mode === 'date' ? 'inline' : 'spinner'}
          themeVariant="light"
          textColor="#202432"
          accentColor={colors.blue}
          minimumDate={minimumDate}
          onChange={(_, selected) => selected && setDraft(selected)}
          style={mode === 'time' ? styles.timePicker : undefined}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, zIndex: 50, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(20,27,43,0.48)' },
  card: { width: '100%', maxWidth: 430, overflow: 'hidden', borderRadius: 18, backgroundColor: 'white', paddingBottom: 6 },
  header: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 17, borderBottomWidth: 1, borderBottomColor: '#E8EBF1' },
  timePicker: { height: 210 },
});

export default IosPickerOverlay;
