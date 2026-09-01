import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Platform,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
  FlatList,
} from 'react-native';
import AppText from '../AppText/AppText';
import { colors } from '../../utils/Colors';
import { fonts } from '../../utils/typography';
import { BackIcon, BlueTickIcon } from '../../assets/svgs/SvgsFile';
import { rw } from '../../utils/responsive';

interface Props {
  minDate: Date | null;
  startDate: any | null;
  endDate: any | null;
  setRange: (type: string) => void;
  range: string;
  setStartDates?: (start: any) => void;
  setEndDates?: (end: any) => void;
  startEndDateChange: (startData: any, endData: any) => void;
  onApplyClick?: (start: any, end: any, type: any) => void;
  calendarType?: 'reminder' | 'history';
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

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CustomCalendar: React.FC<Props> = ({
  minDate = new Date(2020, 0, 1),
  startDate: propStartDate,
  endDate: propEndDate,
  startEndDateChange,
  onApplyClick,
  setRange,
  setStartDates,
  setEndDates,
  range,
  calendarType
}) => {
  const today = new Date();
  // today.setHours(0, 0, 0, 0);
  today.setHours(18, 30, 0, 0);
  // Default to Last 7 days if props are null
  const getDefaultDates = () => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  };


  const [localStartDate, setLocalStartDate] = useState<Date>(
    propStartDate,
  );
  const [localEndDate, setLocalEndDate] = useState<Date>(
    propEndDate,
  );
  // Sync when props change (after Redux loads)
  useEffect(() => {
    if (propStartDate) setLocalStartDate(propStartDate);
    if (propEndDate) setLocalEndDate(propEndDate);
  }, [propStartDate, propEndDate]);


  const [dateList, setDateList] = useState<Date[]>([]);
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  // const [localStartDate, setLocalStartDate] = useState<Date | null>(propStartDate);
  // const [localEndDate, setLocalEndDate] = useState<Date | null>(propEndDate);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const years = Array.from(
    { length: 30 },
    (_, i) => new Date().getFullYear() - i,
  );

  const setListOfDate = useCallback((monthDate: Date) => {
    const dates: Date[] = [];
    let newDate = new Date();
    newDate.setFullYear(monthDate.getFullYear(), monthDate.getMonth(), 0);
    const prevMonthDate = newDate.getDate();
    let previousMonthDay = 0;

    if (newDate.getDay() !== 0) {
      previousMonthDay = newDate.getDay() === 0 ? 7 : newDate.getDay();
      for (let i = 1; i <= previousMonthDay; i++) {
        const date = new Date(newDate);
        date.setDate(prevMonthDate - (previousMonthDay - i));
        dates.push(date);
      }
    }
    // 42 = 7 * 6:- 7 == column, 6 == rows
    for (let i = 0; i < 42 - previousMonthDay; i++) {
      const date = new Date(newDate);
      date.setDate(prevMonthDate + (i + 1));
      dates.push(date);
    }
    setDateList(dates);
  }, []);

  useEffect(() => {
    setListOfDate(new Date());
  }, [setListOfDate]);
  useEffect(() => {
    setListOfDate(currentMonthDate);
  }, [currentMonthDate, setListOfDate]);

  useEffect(() => {
    setLocalStartDate(propStartDate);
    setLocalEndDate(propEndDate);
  }, [propStartDate, propEndDate]);

  const normalizeDate = (date: Date | null | undefined): Date | null => {
    if (!date) return null;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  };

  const getIsItStartAndEndDate = (date: Date) => {
    const d = normalizeDate(date);
    const s = normalizeDate(localStartDate);
    const e = normalizeDate(localEndDate);
    return (
      (s && d?.getTime() === s.getTime()) || (e && d?.getTime() === e.getTime())
    );
  };

  const isStartDateRadius = (date: Date) => {
    return (
      normalizeDate(localStartDate)?.getTime() ===
      normalizeDate(date)?.getTime()
    );
  };

  const isEndDateRadius = (date: Date) => {
    return (
      normalizeDate(localEndDate)?.getTime() === normalizeDate(date)?.getTime()
    );
  };
  const getIsInRange = (date: Date) => {
    const normalizedDate = normalizeDate(date);
    const normalizedStart = normalizeDate(localStartDate);
    const normalizedEnd = normalizeDate(localEndDate);

    if (!normalizedStart || !normalizedEnd || !normalizedDate) return false;
    return normalizedDate > normalizedStart && normalizedDate < normalizedEnd;
  };

  const onDateClick = (date: Date) => {
    const normalizedDate = normalizeDate(date);
    const normalizedToday = normalizeDate(today);

    if (!normalizedDate || !normalizedToday) return;

    // Conditional disable based on calendar type
    if (calendarType !== 'reminder') {
      // Reminder: disable past dates (only today and future allowed)
      // History: disable future dates (past and today allowed)
      if (normalizedDate.getTime() > normalizedToday.getTime()) {
        return;
      }
    }


    let newStart = localStartDate;
    let newEnd = localEndDate;
    // First tap: set start date
    if (!localStartDate || (localStartDate && localEndDate)) {
      newStart = date;
      newEnd = null;
    }
    // Second tap: set end date
    else {
      const normalizedClicked = normalizeDate(date);
      const normalizedStart = normalizeDate(localStartDate);

      if (normalizedClicked && normalizedStart && normalizedClicked.getTime() < normalizedStart.getTime()) {
        // Clicked earlier than start → swap
        newEnd = localStartDate;
        newStart = date;
      } else {
        newEnd = date;
      }
    }

    setLocalStartDate(newStart);
    setLocalEndDate(newEnd);
    startEndDateChange(newStart, newEnd);
    // Set custom type only when both dates are selected
    if (newStart && newEnd) {
      const matchedPreset = detectPresetFromDates(newStart, newEnd);
      if (matchedPreset) {
        setRange(matchedPreset);
      } else {
        setRange('custom');
      }
    } else {
      // Incomplete range (only start selected)
      setRange('custom');
    }
  };

  const setCurrentMonth = () => {
    const now = new Date();

    // Start: 1st day of current month
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    // End: today
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    setLocalStartDate(start);
    setLocalEndDate(end);

    startEndDateChange(start, end);

    setRange('currentMonth');

    setStartDates?.(start);
    setEndDates?.(end);

    setCurrentMonthDate(new Date());
    setListOfDate(new Date());
  };
  // const onDateClick = (date: Date) => {
  //   // Disable future dates — safe non-null assertion
  //   if (normalizeDate(date)!?.getTime() > normalizeDate(today)!?.getTime())
  //     return;

  //   let newStart = localStartDate;
  //   let newEnd = localEndDate;

  //   if (!localStartDate || (localStartDate && localEndDate)) {
  //     newStart = date;
  //     newEnd = null;
  //   } else {
  //     // Safe: localStartDate is not null here
  //   if (
  //     normalizeDate(date)!?.getTime() <
  //     normalizeDate(localStartDate)!?.getTime()
  //   ) {
  //     newEnd = localStartDate;
  //     newStart = date;
  //   } else {
  //     newEnd = date;
  //   }
  // }

  //   setLocalStartDate(newStart);
  //   setLocalEndDate(newEnd);
  //   startEndDateChange(newStart, newEnd);

  //   if (newStart && newEnd) {
  //     setDateType('custom');
  //   }
  // };

  const getDaysNameUI = () => {
    if (dateList.length === 0) {
      return;
    }

    const listUI: React.JSX.Element[] = [];
    for (let i = 0; i < 7; i++) {
      const weekDay = WEEK_DAYS[dateList[i].getDay()];

      listUI.push(
        <View
          style={{
            flex: 1,
            height: 30,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text key={weekDay} style={styles.weekDayText}>
            {weekDay ? weekDay.charAt(0) : '-'}
          </Text>
        </View>,
      );
    }
    return listUI;
  };
  const getDaysNoUI = () => {
    const noList: React.JSX.Element[] = [];
    let count = 0;

    for (let i = 0; i < dateList.length / 7; i++) {
      const listUI: React.JSX.Element[] = [];

      for (let j = 0; j < 7; j++) {
        const date = dateList[count];
        const isDateStartOrEnd = getIsItStartAndEndDate(date);
        const isDateInRange = getIsInRange(date);
        const isStartDate = isStartDateRadius(date);
        const isEndDate = isEndDateRadius(date);

        listUI.push(
          <View key={`day_${count}`} style={{ flex: 1, aspectRatio: 1.0 }}>
            <View
              style={[
                normalizeDate(localStartDate)?.getTime() ===
                normalizeDate(date)?.getTime() && {
                  borderTopLeftRadius: 24,
                  borderBottomLeftRadius: 24,
                  overflow: 'hidden',
                  backgroundColor: '#e0f5ff',
                },
                normalizeDate(localEndDate)?.getTime() ===
                normalizeDate(date)?.getTime() && {
                  borderTopRightRadius: 24,
                  borderBottomRightRadius: 24,
                  backgroundColor: '#e0f5ff',
                  overflow: 'hidden',
                },
                {
                  flex: 1,
                  backgroundColor:
                    localStartDate && localEndDate
                      ? isDateStartOrEnd || isDateInRange
                        ? '#e0f5ff'
                        : 'transparent'
                      : 'transparent',
                  paddingLeft: isStartDate ? 4 : 0,
                  paddingRight: isEndDate ? 4 : 0,
                  borderBottomLeftRadius: isStartDate ? 24 : 0,
                  borderTopLeftRadius: isStartDate ? 24 : 0,
                  borderTopRightRadius: isEndDate ? 24 : 0,
                  borderBottomRightRadius: isEndDate ? 24 : 0,
                },
              ]}
            />
            <View
              style={[
                styles.dayNoBtnContainer,
                {
                  borderWidth: isDateStartOrEnd ? 2 : 0,
                  borderColor: isDateStartOrEnd ? 'white' : 'transparent',
                  backgroundColor: isDateStartOrEnd
                    ? colors.blue
                    : 'transparent',
                },
                isDateStartOrEnd && styles.activeDatesShadow,
              ]}
            >
              <Pressable
                style={styles.dayNoBtn}
                onPress={() => {
                  onDateClick(date);
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: isDateStartOrEnd
                      ? 'WorkSans-Bold'
                      : 'WorkSans-Regular',
                    color: isDateStartOrEnd
                      ? colors.white
                      : (() => {
                        const normalizedDate = normalizeDate(date);
                        const normalizedToday = normalizeDate(today);

                        if (!normalizedDate || !normalizedToday) return 'lightgrey';

                        if (calendarType !== 'reminder') {
                          // Reminder: fade past dates
                          return normalizedDate.getTime() > normalizedToday.getTime()
                            ? '#D3D3D3'
                            : currentMonthDate.getMonth() === date.getMonth()
                              ? 'black'
                              : 'lightgrey';
                        }
                      })(),
                  }}
                >
                  {date.getDate()}
                </Text>
              </Pressable>
            </View>
          </View>,
        );

        count += 1;
      }

      noList.push(
        <View key={`daysRow_${i}`} style={styles.dayNoRowView}>
          {listUI}
        </View>,
      );
    }
    return noList;
  };

  const formattedDate = (date: Date | string | null | undefined): string => {
    if (!date) return '--/--';

    let validDate: Date;

    if (typeof date === 'string') {
      validDate = new Date(date);
    } else if (date instanceof Date) {
      validDate = date;
    } else {
      return '--/--';
    }

    // Check if it's a valid date
    if (isNaN(validDate.getTime())) return '--/--';

    return `${WEEKS[validDate.getDay()]}, ${String(
      validDate.getDate(),
    ).padStart(2, '0')} ${HALF_MONTHS[validDate.getMonth()]}`;
  };

  const setToday = () => {
    const now = new Date();
    now.setHours(18, 29, 59, 999);

    setLocalStartDate(now);
    setLocalEndDate(now);
    startEndDateChange(now, now);
    setRange('today')
    setStartDates?.(now)
    setEndDates?.(now)
    setCurrentMonthDate(new Date());
    setListOfDate(new Date());
  };

  const setYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(18, 29, 59, 999);
    setLocalStartDate(yesterday);
    setLocalEndDate(yesterday);
    startEndDateChange(yesterday, yesterday);
    setRange('yesterday')
    setStartDates?.(yesterday)
    setEndDates?.(yesterday)
    setCurrentMonthDate(new Date());
    setListOfDate(new Date());
  };

  const setLast7Days = () => {
    const end = new Date();
    end.setHours(18, 30, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    setLocalStartDate(start);
    setRange('last7days')
    setLocalEndDate(end);
    startEndDateChange(start, end);
    setStartDates?.(start)
    setEndDates?.(end)
    setCurrentMonthDate(new Date());
    setListOfDate(new Date());
  };

  const setLastMonth = () => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    end.setDate(0);
    const start = new Date(end);
    start.setDate(1);
    setRange('lastMonth')
    setLocalStartDate(start);
    setLocalEndDate(end);
    setStartDates?.(start)
    setEndDates?.(end)
    startEndDateChange(start, end);

    setCurrentMonthDate(new Date(today.getFullYear(), today.getMonth() - 1, 1));
    setListOfDate(new Date(today.getFullYear(), today.getMonth() - 1, 1));
  };

  // ==================== NEW: Current Year (YTD) ====================
  const setCurrentYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);   // 1st Jan current year
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999); // Today

    setLocalStartDate(start);
    setLocalEndDate(end);
    startEndDateChange(start, end);
    setRange('currentYear');
    setStartDates?.(start);
    setEndDates?.(end);
    setCurrentMonthDate(new Date());
    setListOfDate(new Date());
  };

  const detectPresetFromDates = (start: Date | null, end: Date | null): string | null => {
    if (!start || !end) return null;

    const s = new Date(start);
    s.setHours(0, 0, 0, 0);
    const e = new Date(end);
    e.setHours(23, 59, 59, 999);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Today
    if (
      s.getTime() === today.getTime() &&
      e.getTime() >= today.setHours(23, 59, 59, 999) &&
      e.getTime() <= today.setHours(23, 59, 59, 999)
    ) {
      return 'today';
    }

    // Yesterday
    if (
      s.getTime() === yesterday.setHours(0, 0, 0, 0) &&
      e.getTime() >= yesterday.setHours(23, 59, 59, 999) &&
      e.getTime() <= yesterday.setHours(23, 59, 59, 999)
    ) {
      return 'yesterday';
    }

    // Last 7 Days (including today)
    const last7Start = new Date(today);
    last7Start.setDate(last7Start.getDate() - 6);
    last7Start.setHours(0, 0, 0, 0);

    if (
      s.getTime() === last7Start.getTime() &&
      e.getTime() >= today.setHours(23, 59, 59, 999)
    ) {
      return 'last7days';
    }

    const cmStart = new Date(today.getFullYear(), today.getMonth(), 1);
    cmStart.setHours(0, 0, 0, 0);

    const cmEnd = new Date(today);
    cmEnd.setHours(23, 59, 59, 999);

    if (
      s.getTime() === cmStart.getTime() &&
      e.getTime() <= cmEnd.getTime()
    ) {
      return 'currentMonth';
    }

    // Last Month
    // Inside detectPresetFromDates
    const lmEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
    const lmStart = new Date(lmEnd.getFullYear(), lmEnd.getMonth(), 1, 0, 0, 0, 0);

    if (s.getTime() === lmStart.getTime() && e.getTime() === lmEnd.getTime()) {
      return 'lastMonth';
    }

    // Last Year - full previous calendar year only
    const prevYear = today.getFullYear() - 1;
    const lastYearStart = new Date(prevYear, 0, 1, 0, 0, 0, 0);
    const lastYearEnd = new Date(prevYear, 11, 31, 23, 59, 59, 999);
    console.log(prevYear, lastYearEnd, lastYearEnd, 'skss');
    if (s.getTime() === lastYearStart.getTime() && e.getTime() === lastYearEnd.getTime()) {
      return 'lastYear';
    }

    const now = new Date();
    const todayStart = normalizeDate(now)!;
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    // Current Year (YTD) - ADD THIS BLOCK
    const currentYearStart = new Date(now.getFullYear(), 0, 1);
    if (s.getTime() === currentYearStart.getTime() && e.getTime() <= todayEnd.getTime()) {
      return 'currentYear';
    }

    // No match → custom
    return null;
  };
  const setLastYear = () => {
    const now = new Date();

    // Previous year (2025 if today is 2026)
    const prevYear = now.getFullYear() - 1;

    // Start: 1 January of previous year at 00:00:00
    const start = new Date(prevYear, 0, 1, 0, 0, 0, 0);

    // End: 31 December of previous year at 23:59:59.999
    const end = new Date(prevYear, 11, 31, 23, 59, 59, 999);

    // Update state
    setLocalStartDate(start);
    setLocalEndDate(end);
    startEndDateChange(start, end);
    setRange('lastYear');
    setStartDates?.(start);
    setEndDates?.(end);

    // Reset calendar view to current month (optional)
    setCurrentMonthDate(new Date());
    setListOfDate(new Date());
  };
  const setAllTime = () => {
    const start = new Date(1996, 0, 1);
    setLocalStartDate(start);
    setLocalEndDate(today);
    startEndDateChange(start, today);
    setRange('allTime')
    setStartDates?.(start)
    setEndDates?.(today)
    setCurrentMonthDate(new Date());
    setListOfDate(new Date());
  };

  const handleApply = () => {
    if (localStartDate && localEndDate && range) {
      onApplyClick?.(localStartDate, localEndDate, range);
    }
  };
  return (
    <View style={{}}>
      <View style={[styles.row, { gap: 10 }]}>
        <View style={styles.dateView}>
          <View style={[styles.row, styles.yearMonthView]}>
            <Pressable onPress={() => setShowYearPicker(true)}>
              <AppText size={12} color="#00A1EB" family='InterMedium'>
                {currentMonthDate.getFullYear()}
              </AppText>
            </Pressable>
            <View style={[styles.monthView, styles.row]}>
              <Pressable
                style={styles.BackIconView}
                onPress={() => {
                  currentMonthDate.setMonth(currentMonthDate.getMonth() - 1);
                  setListOfDate(currentMonthDate);
                }}
              >
                <BackIcon width={12} height={12} />
              </Pressable>
              <Pressable onPress={() => setShowMonthPicker(true)}>
                <AppText size={12} color="#00A1EB" family='InterMedium'>
                  {MONTH_NAMES[currentMonthDate.getMonth()]}
                </AppText>
              </Pressable>
              <Pressable
                style={[
                  styles.BackIconView,
                  { paddingRight: 2, transform: [{ rotate: '180deg' }] },
                ]}
                onPress={() => {
                  currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
                  setListOfDate(currentMonthDate);
                }}
              >
                <BackIcon width={12} height={12} />
              </Pressable>
            </View>
          </View>
          <View style={[styles.fromToView, styles.row]}>
            <View style={styles.fromVIew}>
              <AppText
                size={8}
                color={colors.blue}
                family="InterMedium"
              >
                {'From'}
              </AppText>
              <AppText
                size={10}
                color={colors.blue}
                family="InterMedium"
              >
                {formattedDate(localStartDate)}
              </AppText>
            </View>
            <View style={styles.fromVIew}>
              <AppText
                size={8}
                color={colors.blue}
                family="InterMedium"
              >
                {'To'}
              </AppText>
              <AppText
                size={10}
                color={colors.blue}
                family="InterMedium"
              >
                {formattedDate(localEndDate)}
              </AppText>
            </View>
          </View>
          <View style={styles.weekDayContainer}>{getDaysNameUI()}</View>
          <View style={{ paddingHorizontal: 8 }}>{getDaysNoUI()}</View>
          <Pressable style={styles.selectButton} onPress={handleApply}>
            <AppText
              size={12}
              color={colors.blue}
              family='InterMedium'
            >
              {'Select'}
            </AppText>
          </Pressable>
        </View>

        <View style={[styles.timeDurationview, { alignSelf: 'flex-start' }]}>
          <Pressable
            style={[
              styles.duration,
              range === 'today' && {
                backgroundColor: colors.blue,
              },
            ]}
            onPress={() => {
              setToday();
            }}
          >
            <AppText
              size={11}
              family="InterMedium"
              color={range === 'today' ? colors.white : colors.blue}
            >
              Today
            </AppText>
          </Pressable>
          <Pressable
            style={[
              styles.duration,
              range === 'yesterday' && {
                backgroundColor: colors.blue,
              },
            ]}
            onPress={() => {
              setYesterday();
            }}
          >
            <AppText
              size={11}
              family="InterMedium"
              color={range === 'yesterday' ? colors.white : colors.blue}
            >
              Yesterday
            </AppText>
          </Pressable>
          <Pressable
            style={[
              styles.duration,
              range === 'last7days' && {
                backgroundColor: colors.blue,
              },
            ]}
            onPress={() => {
              setLast7Days();
            }}
          >
            <AppText
              size={11}
              family='InterMedium'
              color={range === 'last7days' ? colors.white : colors.blue}
            >
              Last 7 Days
            </AppText>
          </Pressable>
          <Pressable
            style={[
              styles.duration,
              range === 'currentMonth' && {
                backgroundColor: colors.blue,
              },
            ]}
            onPress={() => {
              setCurrentMonth();
            }}
          >
            <AppText
              size={11}
              family="InterMedium"
              color={range === 'currentMonth' ? colors.white : colors.blue}
            >
              MTD
            </AppText>
          </Pressable>
          <Pressable
            style={[
              styles.duration,
              range === 'currentYear' && {
                backgroundColor: colors.blue,
              },
            ]}
            onPress={() => {
              setCurrentYear();
            }}
          >
            <AppText
              size={11}
              family="InterMedium"
              color={range === 'currentYear' ? colors.white : colors.blue}
            >
              YTD
            </AppText>
          </Pressable>
          <Pressable
            style={[
              styles.duration,
              range === 'lastMonth' && {
                backgroundColor: colors.blue,
              },
            ]}
            onPress={() => {
              setLastMonth();
            }}
          >
            <AppText
              size={11}
              family="InterMedium"
              color={range === 'lastMonth' ? colors.white : colors.blue}
            >
              Last Month
            </AppText>
          </Pressable>
          <Pressable
            style={[
              styles.duration,
              range === 'lastYear' && {
                backgroundColor: colors.blue,
              },
            ]}
            onPress={() => {
              setLastYear();
            }}
          >
            <AppText
              size={11}
              family="InterMedium"
              color={range === 'lastYear' ? colors.white : colors.blue}
            >
              Last Year
            </AppText>
          </Pressable>


          {/* <Pressable
                style={[
                  styles.duration,
                  range === 'allTime' && {
                    backgroundColor: colors.blue,
                  },
                ]}
                onPress={() => {
                  setAllTime();
                }}
              >
                <AppText
                  size={11}
                  family="InterMedium"
                  color={colors.blue}
                >
                  All Time
                </AppText>
              </Pressable> */}
        </View>


      </View>
      {/* <View style={{ flexDirection: 'row', padding: 8 }}>
        <View style={styles.arrowContainerStyle}>
          <Pressable
            style={styles.arrowBtnStyle}
            onPress={() => {
              currentMonthDate.setMonth(currentMonthDate.getMonth() - 1);
              setListOfDate(currentMonthDate);
            }}
          >
          </Pressable>
        </View>
        <Text style={styles.monthHeaderStyle}>
          {MONTH_NAMES[currentMonthDate.getMonth()]}
          {`, ${currentMonthDate.getFullYear()}`}
        </Text>
        <View style={styles.arrowContainerStyle}>
          <Pressable
            style={styles.arrowBtnStyle}
            onPress={() => {
              currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
              setListOfDate(currentMonthDate);
            }}
          >
          </Pressable>
        </View>
      </View> */}
      {showMonthPicker && (
        <Modal transparent animationType="fade">
          <TouchableWithoutFeedback onPress={() => setShowMonthPicker(false)}>
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <View
                style={[styles.yearCOntainer, { left: 120, marginTop: -100 }]}
              >
                <FlatList
                  data={MONTH_NAMES}
                  keyExtractor={item => item}
                  renderItem={({ item, index }) => {
                    const isSelected = index === currentMonthDate.getMonth();
                    return (
                      <Pressable
                        style={{
                          paddingHorizontal: rw(16),
                          paddingVertical: rw(6),
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          backgroundColor: isSelected ? '#F6F6F6' : 'white',
                          borderWidth: isSelected ? 0.5 : 0,
                          borderColor: isSelected ? '#F6F6F6' : 'white',
                        }}
                        onPress={() => {
                          const newDate = new Date(currentMonthDate);
                          newDate.setMonth(index);
                          setCurrentMonthDate(newDate);
                          setListOfDate(newDate);
                          setShowMonthPicker(false);
                        }}
                      >
                        <View style={{ width: '6%' }}>
                          {isSelected && <BlueTickIcon />}
                        </View>
                        <AppText
                          size={12}
                          family="InterMedium"
                          color={colors.black}
                          horizontal={rw(10)}
                        >
                          {item}
                        </AppText>
                      </Pressable>
                    );
                  }}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {showYearPicker && (
        <Modal transparent animationType="fade">
          <TouchableWithoutFeedback onPress={() => setShowYearPicker(false)}>
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <View style={styles.yearCOntainer}>
                <FlatList
                  data={years}
                  keyExtractor={item => item.toString()}
                  renderItem={({ item }) => {
                    const isSelected = item === currentMonthDate.getFullYear();
                    return (
                      <Pressable
                        style={{
                          // padding: 16,
                          // height:32,
                          paddingHorizontal: rw(16),
                          paddingVertical: rw(6),
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          backgroundColor: isSelected ? '#F6F6F6' : 'white',
                          borderWidth: isSelected ? 0.5 : 0,
                          borderColor: isSelected ? '#F6F6F6' : 'white',
                        }}
                        onPress={() => {
                          const newDate = new Date(currentMonthDate);
                          newDate.setFullYear(item);
                          setCurrentMonthDate(newDate);
                          setListOfDate(newDate);
                          setShowYearPicker(false);
                        }}
                      >
                        <View style={{ width: '6%' }}>
                          {isSelected && <BlueTickIcon />}
                        </View>
                        <AppText
                          size={12}
                          family="InterMedium"
                          color={colors.black}
                          horizontal={rw(10)}
                        >
                          {item}
                        </AppText>
                      </Pressable>
                    );
                  }}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  arrowContainerStyle: {
    borderRadius: 24,
    borderWidth: 0.6,
    borderColor: 'lightgrey',
    overflow: 'hidden',
  },
  yearCOntainer: {
    backgroundColor: 'white',
    width: '40%',
    maxHeight: '25%',
    alignSelf: 'flex-start',
    marginHorizontal: rw(23),
    marginTop: -130,
  },
  arrowBtnStyle: {
    height: 38,
    width: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthHeaderStyle: {
    flex: 1,
    color: 'black',
    fontSize: 20,
    fontFamily: 'WorkSans-Medium',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  weekDayContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  weekDayText: {
    textAlign: 'center',
    fontSize: 10,
    fontFamily: fonts.InterRegular,
    color: colors.black,
  },
  dayNoRowView: {
    flexDirection: 'row',
    marginVertical: 1,
  },
  dayNoBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNoBtnContainer: {
    ...StyleSheet.absoluteFillObject,
    padding: 2,
    borderRadius: '50%',
  },
  activeDatesShadow: {
    ...Platform.select({
      ios: {
        shadowColor: 'grey',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 2.63,
      },
      android: { elevation: 4 },
    }),
  },
  currentDateIndicator: {
    position: 'absolute',
    bottom: 6,
    height: 4,
    width: 4,
    borderRadius: 2,
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
  monthView: {
    gap: 2,
  },
  BackIconView: {
    width: 32,
    paddingRight: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  fromToView: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    borderTopWidth: 0.27,
    borderBottomWidth: 0.27,
    borderBottomColor: '#F2F2F2',
    borderTopColor: '#F2F2F2',
  },
  fromVIew: {
    flex: 1,
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: '#A7AEC1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  timeDurationview: {
    gap: 12,
    width: '27%',
  },
  duration: {
    height: 24,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    alignSelf: 'flex-start',
  },
  selectButton: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopColor: '#F2F2F2',
    borderTopWidth: 0.5,
  },
});

export default CustomCalendar;
