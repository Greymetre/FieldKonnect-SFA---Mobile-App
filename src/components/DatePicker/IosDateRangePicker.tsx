import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AppText from '../AppText/AppText';
import { colors } from '../../utils/Colors';

type Props = {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
};

const startOfDay = (date: Date) => { const d = new Date(date); d.setHours(0, 0, 0, 0); return d; };
const endOfDay = (date: Date) => { const d = new Date(date); d.setHours(23, 59, 59, 999); return d; };
const label = (date: Date | null) => date
  ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : 'Select';

const QUICK_RANGES = [
  { label: 'Today', range: () => [startOfDay(new Date()), endOfDay(new Date())] },
  { label: 'Last 7 Days', range: () => { const s = new Date(); s.setDate(s.getDate() - 6); return [startOfDay(s), endOfDay(new Date())]; } },
  { label: 'This Month', range: () => { const n = new Date(); return [startOfDay(new Date(n.getFullYear(), n.getMonth(), 1)), endOfDay(n)]; } },
  { label: 'Last Month', range: () => { const n = new Date(); return [startOfDay(new Date(n.getFullYear(), n.getMonth() - 1, 1)), endOfDay(new Date(n.getFullYear(), n.getMonth(), 0))]; } },
];

/**
 * iOS date range selector rendered inside a filter sheet. It uses the native
 * inline calendar instead of opening a second modal, which on iOS cannot be
 * presented while the filter sheet is dismissing and left a blank screen.
 */
const IosDateRangePicker = ({ startDate, endDate, onChange }: Props) => {
  const [editing, setEditing] = useState<'start' | 'end' | null>(null);

  const selectDate = (value?: Date) => {
    if (!value || !editing) return;
    if (editing === 'start') {
      const start = startOfDay(value);
      // Keep the range valid: move the end date forward when needed.
      const end = !endDate || endDate < start ? endOfDay(value) : endDate;
      onChange(start, end);
      setEditing('end');
    } else {
      const end = endOfDay(value);
      onChange(!startDate || startDate > end ? startOfDay(value) : startDate, end);
      setEditing(null);
    }
  };

  return (
    <View>
      <View style={styles.chips}>
        {QUICK_RANGES.map(item => (
          <Pressable key={item.label} style={styles.chip} onPress={() => { const [s, e] = item.range(); onChange(s, e); setEditing(null); }}>
            <AppText size={12} color={colors.blue} family="InterSemiBold">{item.label}</AppText>
          </Pressable>
        ))}
      </View>
      <View style={styles.row}>
        <DateBox title="From" value={label(startDate)} active={editing === 'start'} onPress={() => setEditing(editing === 'start' ? null : 'start')} />
        <DateBox title="To" value={label(endDate)} active={editing === 'end'} onPress={() => setEditing(editing === 'end' ? null : 'end')} />
      </View>
      {editing ? (
        <View style={styles.calendarCard}>
          <DateTimePicker
            value={(editing === 'start' ? startDate : endDate) || new Date()}
            mode="date"
            display="inline"
            themeVariant="light"
            accentColor={colors.blue}
            minimumDate={editing === 'end' && startDate ? startDate : undefined}
            onChange={(_, value) => selectDate(value)}
          />
        </View>
      ) : null}
    </View>
  );
};

const DateBox = ({ title, value, active, onPress }: any) => (
  <Pressable style={[styles.dateBox, active && styles.dateBoxActive]} onPress={onPress}>
    <AppText size={11} color="#7A8499" family="InterSemiBold">{title.toUpperCase()}</AppText>
    <AppText size={14} color={value === 'Select' ? '#A0A7B5' : '#202432'} family="InterSemiBold">{value}</AppText>
  </Pressable>
);

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: colors.blue + '40', backgroundColor: colors.blue + '0D' },
  row: { flexDirection: 'row', gap: 10 },
  dateBox: { flex: 1, gap: 3, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#D8DEE9', backgroundColor: '#F8F9FC' },
  dateBoxActive: { borderColor: colors.blue, backgroundColor: colors.blue + '0D' },
  calendarCard: { marginTop: 10, borderRadius: 14, borderWidth: 1, borderColor: '#E6E9F0', backgroundColor: 'white', overflow: 'hidden' },
});

export default IosDateRangePicker;
