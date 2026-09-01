import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import AppText from '../AppText/AppText';
import { rw } from '../../utils/responsive';
import { colors } from '../../utils/Colors';
import { formatShortNumber } from '../../utils/misc';

interface TargetAchievementCardProps {
  onViewAllPress?: () => void;
  homeData: any;
}

const number = (value: any) => Number(value) || 0;

const PercentageRing = ({ percentage }: { percentage: number }) => {
  const size = rw(76);
  const stroke = rw(8);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, percentage));

  return (
    <View style={[styles.ring, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.ringSvg}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#e8e9f1" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#6974f6"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference - (progress / 100) * circumference}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <AppText size={18} family="InterBold" color="#1f2437">{Math.round(percentage)}%</AppText>
    </View>
  );
};

const TargetAchievementCard: React.FC<TargetAchievementCardProps> = ({ homeData }) => {
  // Use a future combined API object first; aggregate current ASR + DSR fields meanwhile.
  const summary = homeData?.target_achievement_summary;
  const combinedTarget = homeData?.total_target;
  const usesCombinedResponse = combinedTarget != null;
  // The API returns target and achievement in lacs; convert them to rupees for display.
  const targetValue = summary != null
    ? number(summary.target_value)
    : usesCombinedResponse
      ? number(combinedTarget.target) * 100000
      : (number(homeData?.asr_target?.target) + number(homeData?.dsr_target?.target)) * 100000;
  const achievedValue = summary != null
    ? number(summary.achievement_value)
    : usesCombinedResponse
      ? number(combinedTarget.achievement) * 100000
      : number(homeData?.current_month_orders?.value) + number(homeData?.current_month_orders_dsr?.value);
  const uniqueCustomers = summary != null
    ? number(summary.unique_customers)
    : usesCombinedResponse
      ? number(homeData?.unique_buyers)
      : number(homeData?.unique_buyers_from_asr) + number(homeData?.unique_buyers_from_dsr);
  const todayQty = summary != null ? number(summary?.today?.quantity) : number(homeData?.today_orders?.quantity);
  const todayValue = summary != null ? number(summary?.today?.value) : number(homeData?.today_orders?.value);
  const mtdQty = summary != null ? number(summary?.mtd?.quantity) : number(homeData?.current_month_orders?.quantity);
  const mtdValue = summary != null ? number(summary?.mtd?.value) : number(homeData?.current_month_orders?.value);
  const percentage = usesCombinedResponse
    ? Math.max(0, Math.min(100, number(combinedTarget.achievement_percent)))
    : targetValue > 0 ? Math.min(100, (achievedValue / targetValue) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.chartIcon}><AppText size={20}>📊</AppText></View>
          <AppText size={17} family="InterSemiBold" color="#1f2437" style={styles.title}>
            MTD Target Vs{`\n`}Achievement
          </AppText>
          <View style={styles.customerBlock}>
            <AppText size={11} color="#8a8fa3" family="InterMedium" align="right">No.of Customers</AppText>
            <AppText size={10} color="#8a8fa3" family="InterMedium" align="right">(MTD Sales Unique No)</AppText>
            <AppText size={20} family="InterBold" color="#1f2437" align="right">{uniqueCustomers}</AppText>
          </View>
        </View>

        <View style={styles.valueRow}>
          <View style={styles.valueContent}>
            <View style={styles.valueTop}>
              <View>
                <AppText size={15} color="#8a8fa3" family="InterMedium">Value</AppText>
                <AppText size={25} color="#1f2437" family="InterBold">₹{formatShortNumber(achievedValue)}</AppText>
              </View>
              <View style={styles.targetText}>
                <AppText size={15} color="#159447" family="InterSemiBold">{Math.round(percentage)}%</AppText>
                <AppText size={12} color="#8a8fa3" family="InterMedium">of ₹{formatShortNumber(targetValue)}</AppText>
              </View>
            </View>
            <View style={styles.track}><View style={[styles.fill, { width: `${percentage}%` }]} /></View>
          </View>
          <PercentageRing percentage={percentage} />
        </View>

        <View style={styles.divider} />
        <View style={styles.footer}>
          <Summary title="TODAY" quantity={todayQty} value={todayValue} bordered />
          <Summary title="MTD" quantity={mtdQty} value={mtdValue} />
        </View>
      </View>
    </View>
  );
};

const Summary = ({ title, quantity, value, bordered = false }: { title: string; quantity: number; value: number; bordered?: boolean }) => (
  <View style={[styles.summary, bordered && styles.summaryBorder]}>
    <AppText size={12} color="#8a8fa3" family="InterSemiBold">{title}</AppText>
    <View style={styles.summaryLabels}>
      <AppText size={12} color="#8a8fa3" family="InterMedium">Qty</AppText>
      <AppText size={12} color="#8a8fa3" family="InterMedium">Val</AppText>
    </View>
    <View style={styles.summaryLabels}>
      <AppText size={19} color="#1f2437" family="InterSemiBold">{formatShortNumber(quantity)}</AppText>
      <AppText size={19} color="#1f2437" family="InterSemiBold">₹{formatShortNumber(value)}</AppText>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { paddingHorizontal: rw(19), marginTop: rw(16) },
  card: { backgroundColor: 'white', borderRadius: 18, padding: rw(18), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 },
  header: { flexDirection: 'row', alignItems: 'center' },
  chartIcon: { width: rw(46), height: rw(46), borderRadius: 12, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', marginRight: rw(12) },
  title: { flex: 1 },
  customerBlock: { alignItems: 'flex-end' },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: rw(14), marginTop: rw(24) },
  valueContent: { flex: 1 },
  valueTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  targetText: { alignItems: 'flex-end', gap: 7 },
  track: { height: rw(7), borderRadius: 99, backgroundColor: '#e3e5ee', overflow: 'hidden', marginTop: rw(10) },
  fill: { height: '100%', borderRadius: 99, backgroundColor: '#7c83ff' },
  ring: { alignItems: 'center', justifyContent: 'center' },
  ringSvg: { position: 'absolute' },
  divider: { height: 1, backgroundColor: '#eceef4', marginTop: rw(26) },
  footer: { flexDirection: 'row', paddingTop: rw(16) },
  summary: { flex: 1, paddingLeft: rw(18) },
  summaryBorder: { paddingLeft: 0, paddingRight: rw(18), borderRightWidth: 1, borderRightColor: '#eceef4' },
  summaryLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: rw(8) },
});

export default TargetAchievementCard;
