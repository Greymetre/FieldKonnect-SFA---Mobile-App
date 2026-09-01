import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import AppText from '../AppText/AppText';
import { rw } from '../../utils/responsive';
import { formatShortNumber } from '../../utils/misc';

type Period = 'YTD' | 'MTD';

type Performer = {
  dealer: string;
  city: string;
  state: string;
  sales_value: number;
};

const rankColors = ['#fac775', '#d3d1c7', '#f5c4b3', '#e8eaf2', '#e8eaf2'];

const DealerDistributorPerformanceCard = ({ data }: { data: any }) => {
  const [period, setPeriod] = useState<Period>('YTD');
  const performers: Performer[] = period === 'YTD'
    ? (data?.top_5_dealer_distributor_current_year || [])
    : (data?.top_5_dealer_distributor_current_month || []);
  const highestSales = Number(performers[0]?.sales_value) || 1;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.tabs}>
          {(['YTD', 'MTD'] as const).map(item => (
            <Pressable
              key={item}
              onPress={() => setPeriod(item)}
              style={[styles.tab, period === item && styles.activeTab]}
              hitSlop={8}
            >
              <AppText
                size={14}
                family="InterMedium"
                color={period === item ? '#FFFFFF' : '#64748B'}
              >
                {item}
              </AppText>
            </Pressable>
          ))}
        </View>

        {performers.map((performer, index) => (
          <View key={`${performer.dealer}-${performer.city}-${performer.state}`} style={styles.performerRow}>
            <View style={[styles.rank, { backgroundColor: rankColors[index] }]}>
              <AppText size={13} family="InterSemiBold" color="#1F2937">
                {index + 1}
              </AppText>
            </View>
            <View style={styles.performerDetails}>
              <View style={styles.valueRow}>
                <View style={styles.performerName}>
                  <AppText numLines={1} size={15} family="InterMedium" color="#000000">
                    {performer.dealer || 'N/A'}
                  </AppText>
                  <AppText numLines={1} size={11} family="InterRegular" color="#6B7280">
                    {[performer.city, performer.state].filter(Boolean).join(', ') || 'Location unavailable'}
                  </AppText>
                </View>
                <AppText size={16} family="InterSemiBold" color="#3a4da0">
                  ₹{formatShortNumber(Number(performer.sales_value) || 0)}
                </AppText>
              </View>
              <View style={styles.progressBackground}>
                <View
                  style={[
                    styles.progress,
                    { width: `${((Number(performer.sales_value) || 0) / highestSales) * 100}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        ))}
        {performers.length === 0 && (
          <View style={styles.emptyState}>
            <AppText size={13} family="InterRegular" color="#6B7280">
              No performance data available for {period}.
            </AppText>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: rw(19),
    marginTop: rw(16),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: rw(16),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f8',
    borderRadius: 30,
    padding: 6,
    marginBottom: rw(8),
  },
  tab: {
    flex: 1,
    paddingVertical: rw(6),
    alignItems: 'center',
    borderRadius: 26,
  },
  activeTab: {
    backgroundColor: '#3a4da0',
  },
  performerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rw(14),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rank: {
    width: rw(28),
    height: rw(28),
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: rw(4),
  },
  performerDetails: {
    flex: 1,
    marginLeft: rw(12),
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  performerName: {
    flex: 1,
    marginRight: rw(8),
  },
  progressBackground: {
    height: rw(6),
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    marginTop: rw(10),
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: '#1E40AF',
    borderRadius: 999,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: rw(24),
  },
});

export default DealerDistributorPerformanceCard;
