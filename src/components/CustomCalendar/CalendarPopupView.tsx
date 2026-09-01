import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  SafeAreaView,
  TouchableWithoutFeedback,
} from 'react-native';
import CustomCalendar from './CustomCalendar';
import { BlurView } from '@react-native-community/blur';

interface Props {
  showCal: boolean;
  setShowCal: any;
  range:string;
  minimumDate: Date | null;
  initialStartDate: Date | null;
  initialEndDate: Date | null;
  setRange:(type:string)=>void;
  setStartDates?:(start:any)=>void;
  setEndDates?:(end:any)=>void;
  onApplyClick: (startData: any, endData: any, type: any) => void;
  calendarType?: 'reminder' | 'history'
}

const HALF_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'July',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const WEEKS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CustomerCalendar: React.FC<Props> = ({
  showCal,
  setShowCal,
  minimumDate,
  initialStartDate,
  initialEndDate,
  onApplyClick,
  setStartDates,
  setEndDates,
  setRange,
  range,
  calendarType
}) => {
  // const [startDate, setStartDate] = useState(initialStartDate);
  // const [endDate, setEndDate] = useState(initialEndDate);

  const getDefaultDates = () => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  };

  const defaultDates = getDefaultDates();

  const [startDate, setStartDate] = useState<Date>(
    initialStartDate || defaultDates.start,
  );
  const [endDate, setEndDate] = useState<Date>(
    initialEndDate || defaultDates.end,
  );

  // Update local state when props change (after Redux loads)
  useEffect(() => {
    if (initialStartDate) setStartDate(initialStartDate);
    if (initialEndDate) setEndDate(initialEndDate);
  }, [initialStartDate, initialEndDate]);

  const formattedDate = (date: Date | null): string => {
    if (!date) return '--/--';
    return `${WEEKS[date.getDay()]}, ${String(date.getDate()).padStart(
      2,
      '0',
    )} ${HALF_MONTHS[date.getMonth()]}`;
  };

  return (
    <Modal
      visible={showCal}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={() => setShowCal(false)}
    >
      <TouchableWithoutFeedback
        style={{ flex: 1 }}
        onPress={() => setShowCal(false)}
      >
        <SafeAreaView style={styles.containerStyle}>
          <BlurView
            style={{ ...StyleSheet.absoluteFillObject }}
            blurType="light"
            blurAmount={10}
            reducedTransparencyFallbackColor="white"
          />
          <TouchableWithoutFeedback style={{ flex: 1 }} onPress={() => {}}>
            <View
              style={[
                {
                  backgroundColor: 'white',
                  borderRadius: 14,
                  margin: 12,
                  padding: 10,
                  shadowOffset: { width: 0, height: 0 },
                  shadowColor: 'black',
                  shadowOpacity: 0.8,
                  shadowRadius: 10,
                  elevation: 10,
                },
              ]}
            >
              <CustomCalendar
                minDate={minimumDate}
                startDate={startDate}
                endDate={endDate}
                startEndDateChange={(startDateData, endDateData) => {
                  setStartDate(startDateData);
                  setEndDate(endDateData);
                }}
                range={range}
                setRange={setRange}
                setStartDates={setStartDates}
                setEndDates={setEndDates}
                calendarType={calendarType}
                onApplyClick={(start, end, dateType) => {
                  onApplyClick(start, end, dateType);
                  setShowCal(false);
                }}
              />

              {/* <View style={styles.applyBtnShadow}>
                <View style={styles.applyBtnContainer}>
                  <Pressable
                    style={styles.applyBtn}
                    onPress={() => {
                      onApplyClick(startDate, endDate);
                      setShowCal(false);
                    }}
                  >
                    <Text style={styles.applyBtnText}>Apply</Text>
                  </Pressable>
                </View>
              </View> */}
            </View>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  containerStyle: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0, 0.5)',
  },
  timelineContainerStyle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fromToTextStyle: {
    fontSize: 16,
    fontFamily: 'WorkSans-Regular',
    color: 'rgba(128, 128, 128, 0.8)',
    marginBottom: 4,
  },
  startEndDateTextStyles: {
    color: 'black',
    fontSize: 16,
    fontFamily: 'WorkSans-Bold',
  },
  applyBtnContainer: {
    backgroundColor: '#54D3C2',
    borderRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  applyBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  applyBtnShadow: {
    backgroundColor: '#54D3C2',
    borderRadius: 24,
    margin: 16,
    marginTop: 8,
    shadowColor: 'grey',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  applyBtnText: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'WorkSans-Medium',
  },
  verticleDivider: {
    height: 74,
    width: 1,
    backgroundColor: 'grey',
    opacity: 0.4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateView: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#F2F2F2',
    borderRadius: 9,
  },
  yearMonthView: {
    height: 38,
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    alignItems: 'center',
  },
});

export default CustomerCalendar;
