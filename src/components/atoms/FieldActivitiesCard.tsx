import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import AppText from '../AppText/AppText';
import { rw } from '../../utils/responsive';

type Period = 'today' | 'month' | 'year';

const images = {
  person: require('../../assets/images/Dummy/person.png'),
  people: require('../../assets/images/Dummy/DoublePerson.png'),
  location: require('../../assets/images/Dummy/location.png'),
  wrench: require('../../assets/images/Dummy/wrench.png'),
  other: require('../../assets/images/Dummy/danger.png'),
};

const activityMeta: Record<string, { label: string; image: any; color: string }> = {
  customer_visit: { label: 'Customer Visit', image: images.location, color: '#e8eaf2' },
  mechanic_meet: { label: 'Mechanic Meet', image: images.wrench, color: '#faeeda' },
  borer_meet: { label: 'Borer Meet', image: images.people, color: '#e6eefb' },
  retailer_meet: { label: 'Retailer Meet', image: images.people, color: '#eff2e8' },
  tractor_show: { label: 'Tractor Show', image: images.wrench, color: '#e1f5ee' },
  promotional_item_distribution: { label: 'Promotional Item Distribution', image: images.person, color: '#e9e8fb' },
  dealer_board: { label: 'Dealer Board', image: images.person, color: '#e6eefb' },
  wall_painting: { label: 'Wall Painting', image: images.wrench, color: '#faeeda' },
  dealer_factory_visit: { label: 'Dealer Factory Visit', image: images.location, color: '#e1f5ee' },
  others: { label: 'Others', image: images.other, color: '#fcebeb' },
};

const readableLabel = (key: string) => key
  .split('_')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

const number = (value: any) => Number(value) || 0;
const hiddenActivityKeys = new Set(['customer_visit', 'other', 'others']);

const FieldActivitiesCard = ({ data }: any) => {
  const [period, setPeriod] = useState<Period>('today');
  const suffix = period === 'today' ? 'today' : period === 'month' ? 'current_month' : 'current_year';

  const responseActivities = data?.[`working_type_${suffix}`] || {};
  const orderedKeys = [
    ...Object.keys(activityMeta).filter(key => Object.prototype.hasOwnProperty.call(responseActivities, key)),
    ...Object.keys(responseActivities).filter(key => !activityMeta[key]),
  ].filter(key => !hiddenActivityKeys.has(key.toLowerCase()));
  const activities = orderedKeys.map(key => ({
    id: key,
    key,
    value: number(responseActivities[key]),
    ...(activityMeta[key] || { label: readableLabel(key), image: images.other, color: '#f3f4f8' }),
  }));
  const total = activities.reduce((sum, item) => sum + item.value, 0);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.periodTabs}>
          {([
            ['today', 'Today'],
            ['month', 'This Month'],
            ['year', 'This Year'],
          ] as Array<[Period, string]>).map(([value, label]) => (
            <Pressable
              key={value}
              style={[styles.periodTab, period === value && styles.activePeriodTab]}
              onPress={() => setPeriod(value)}
              hitSlop={8}
            >
              <AppText size={12} family="InterMedium" color={period === value ? '#1E40AF' : '#64748B'}>{label}</AppText>
            </Pressable>
          ))}
        </View>

        {activities.map((item, index) => {
          const progress = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <View key={item.id} style={[styles.activityRow, index === activities.length - 1 && styles.lastRow]}>
              <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                <Image source={item.image} style={styles.activityImage} resizeMode="contain" />
              </View>
              <View style={styles.activityContent}>
                <View style={styles.activityHeader}>
                  <AppText size={16} family="InterMedium" color="#000">{item.label}</AppText>
                  <AppText size={17} family="InterSemiBold" color="#1F2937">{item.value}</AppText>
                </View>
                <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: rw(19), marginTop: rw(16) },
  card: { backgroundColor: 'white', borderRadius: 16, padding: rw(16), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 },
  periodTabs: { flexDirection: 'row', gap: rw(8), marginBottom: rw(12) },
  periodTab: { flex: 1, backgroundColor: '#fff', borderRadius: 30, paddingVertical: rw(6), alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  activePeriodTab: { backgroundColor: '#e8eaf2', borderColor: '#3a4da0' },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: rw(12), paddingVertical: rw(10), borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  lastRow: { borderBottomWidth: 0 },
  iconContainer: { width: rw(30), height: rw(30), borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  activityImage: { width: rw(20), height: rw(20) },
  activityContent: { flex: 1 },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressTrack: { height: rw(4), backgroundColor: '#E2E8F0', borderRadius: 999, overflow: 'hidden', marginTop: 5 },
  progressFill: { height: '100%', backgroundColor: '#1E40AF', borderRadius: 999 },
});

export default FieldActivitiesCard;
