import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  FlatList,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { styles } from './styles';
import AppText from '../../components/AppText/AppText';
import { colors } from '../../utils/Colors';
import { PlusAddIcon } from '../../assets/svgs/SvgsFile';
import Toast from 'react-native-toast-message';
import store from '../../components/redux/Store';
import { BASE_URL } from '../../api/AxiosClient';
import { SCREEN_HEIGHT } from '../../utils/misc';
import { fonts } from '../../utils/typography';
import ActionSheet, {
  ActionSheetRef,
  FlatList as ActionSheetFlatList,
} from 'react-native-actions-sheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTourObjectivesApi, normalizeTourObjectives } from '../../api/query/TourPlanApi';

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────

interface DropdownItem {
  label: string;
  value: string | number;
}

interface PlanRow {
  id: string;
  date: string;           // displayed / saved format "DD MMM YYYY"
  district: string;
  districtId: string | number;
  town: string;
  townId: string | number;
  objective: string;

  isEditing: boolean;
  editingDate?: string;
  editingDistrict?: DropdownItem | null;
  editingCity?: DropdownItem | null;
  editingObjective?: string;
}

// ────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────

const CreatePlan: React.FC = ({ navigation, route }: any) => {
  const [plans, setPlans] = useState<PlanRow[]>([
    {
      id: 'blank-1',
      date: '',
      district: '',
      districtId: '',
      town: '',
      townId: '',
      objective: '',
      isEditing: true,
      editingDate: '',
      editingDistrict: null,
      editingCity: null,
      editingObjective: '',
    },
  ]);

  const routeItem = route?.params?.item;

  const [editingRowId, setEditingRowId] = useState<string | null>('blank-1');

  // Dropdown data
  const [users, setUsers] = useState<DropdownItem[]>([]);
  const [districts, setDistricts] = useState<DropdownItem[]>([]);
  const [cities, setCities] = useState<DropdownItem[]>([]);
  const [filteredDistricts, setFilteredDistricts] = useState<DropdownItem[]>([]);
  const [filteredCities, setFilteredCities] = useState<DropdownItem[]>([]);

  // Modals & search
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [districtSearchText, setDistrictSearchText] = useState('');
  const [citySearchText, setCitySearchText] = useState('');

  const [submitLoading, setSubmitLoading] = useState(false);

  // Objective bottom sheet
  const objectiveSheetRef = useRef<ActionSheetRef>(null);
  const objectiveListRef = useRef<any>(null);
  const [sheetRowId, setSheetRowId] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [otherText, setOtherText] = useState('');
  const [objectiveOptions, setObjectiveOptions] = useState<DropdownItem[]>([]);
  const [objectivesLoading, setObjectivesLoading] = useState(false);
  const isOtherObjective = (value: string) => {
    const normalizedValue = value.trim().toLowerCase();
    return normalizedValue === 'other' || normalizedValue === 'others';
  };

  // ────────────────────────────────────────────────
  // Fetch users & districts on mount
  // ────────────────────────────────────────────────

  useEffect(() => {
    fetchUsers();
    fetchDistricts();
    fetchObjectives();
  }, []);

  const fetchObjectives = async () => {
    try {
      setObjectivesLoading(true);
      const res = await getTourObjectivesApi();
      setObjectiveOptions(normalizeTourObjectives(res?.data));
    } catch (error) {
      console.log('Tour objectives error:', error);
      Toast.show({ type: 'error', text1: 'Failed to load objectives' });
    } finally {
      setObjectivesLoading(false);
    }
  };

  const fetchUsers = async () => {
    const token = store.getState().auth?.token;
    if (!token) return;

    try {
      const res = await fetch('https://duke.fieldkonnect.in/api/tour/userlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json?.data) {
        setUsers(
          json.data.map((u: any) => ({
            label: u.name,
            value: u.user_id,
          }))
        );
      }
    } catch (err) {
      // Toast.show({ type: 'error', text1: 'Failed to load users' });
    }
  };

  const fetchDistricts = async () => {
    const token = store.getState().auth?.token;
    if (!token) return;

    try {
      const res = await fetch('https://duke.fieldkonnect.in/api/userDistrictList', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      // Adjust field names according to your actual API response
      if (json?.data && Array.isArray(json.data)) {
        const districtList = json.data.map((d: any) => ({
          label: d.name || d.district_name || d.district || 'Unknown District',
          value: d.id || d.district_id || d.districtId,
        }));
        setDistricts(districtList);
        setFilteredDistricts(districtList);
      }
    } catch (err) {
      console.log(err);
      Toast.show({ type: 'error', text1: 'Failed to load districts' });
    }
  };

  const fetchCitiesForDistrict = async (districtId: string | number) => {
    const token = store.getState().auth?.token;
    if (!token || !districtId) return;

    try {
      const res = await fetch(
        `https://duke.fieldkonnect.in/api/userCitiesByDistrict?district_id=${districtId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const json = await res.json();

      if (json?.data && Array.isArray(json.data)) {
        const cityList = json.data.map((c: any) => ({
          label: c.city_name || c.name || c.city || 'Unknown City',
          value: c.id || c.city_id || c.cityId,
        }));
        setCities(cityList);
        setFilteredCities(cityList);
      } else {
        setCities([]);
        setFilteredCities([]);
      }
    } catch (err) {
      console.log(err);
      Toast.show({ type: 'error', text1: 'Failed to load cities for this district' });
    }
  };

  const formatDate = (d: Date): string => {
    const day = String(d.getDate()).padStart(2, '0');
    // Do not use locale short month names here. Android may return "Sept"
    // while iOS returns "Sep", which made the submit parser fall back to January.
    const month = [
      'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
    ][d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate && editingRowId) {
      const formatted = formatDate(selectedDate);
      setPlans(prev =>
        prev.map(p =>
          p.id === editingRowId ? { ...p, editingDate: formatted } : p
        )
      );
    }
  };

  // ────────────────────────────────────────────────
  // Row actions
  // ────────────────────────────────────────────────

  const startEditing = (rowId: string) => {
    // Save any currently editing row first
    setPlans(prev =>
      prev.map(p => {
        if (p.isEditing && p.id !== rowId) {
          return saveRow(p);
        }
        return p;
      })
    );

    setPlans(prev =>
      prev.map(p =>
        p.id === rowId
          ? {
            ...p,
            isEditing: true,
            editingDate: p.date,
            editingDistrict: p.district ? { label: p.district, value: p.districtId } : null,
            editingCity: p.town ? { label: p.town, value: p.townId } : null,
            editingObjective: p.objective,
          }
          : { ...p, isEditing: false }
      )
    );

    setEditingRowId(rowId);
  };

  const saveRow = (row: PlanRow): PlanRow => {
    if (!row.isEditing) return row;

    return {
      ...row,
      date: row.editingDate || '',
      district: row.editingDistrict?.label || '',
      districtId: row.editingDistrict?.value || '',
      town: row.editingCity?.label || '',
      townId: row.editingCity?.value || '',
      objective: row.editingObjective?.trim() || '',
      isEditing: false,
      // optional: keep editing fields or remove them
    };
  };

  const addNewPlan = () => {
    // First save current editing row (if any)
    setPlans(prev => prev.map(p => (p.isEditing ? saveRow(p) : p)));

    const newRow: PlanRow = {
      id: Date.now().toString(),
      date: '',
      district: '',
      districtId: '',
      town: '',
      townId: '',
      objective: '',
      isEditing: true,
      editingDate: '',
      editingDistrict: null,
      editingCity: null,
      editingObjective: '',
    };

    setPlans(prev => [...prev, newRow]);
    setEditingRowId(newRow.id);
  };

  const removePlan = (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
    if (editingRowId === id) setEditingRowId(null);
  };


  // ────────────────────────────────────────────────
  // Objective Sheet Handlers
  // ────────────────────────────────────────────────

  const openObjectiveSheet = (rowId: string) => {
    const plan = plans.find(p => p.id === rowId);
    if (!plan) return;

    const current = (plan.editingObjective || '').trim();
    if (!current) {
      setSelectedOptions([]);
      setOtherText('');
      setSheetRowId(rowId);
      objectiveSheetRef.current?.show();
      return;
    }

    const parts = current.split(',').map(s => s.trim()).filter(Boolean);

    const fixedOptions = objectiveOptions.map(item => String(item.label));
    const otherOption = fixedOptions.find(isOtherObjective) || 'Other';

    // 1. Find which of the fixed options are selected
    const preSelected = fixedOptions.filter(opt => parts.includes(opt));

    // 2. Everything that is NOT a fixed option → is custom text for "Other"
    const customParts = parts.filter(p => !fixedOptions.includes(p));

    // If there is any custom text OR "Other" is explicitly present → we consider "Other" selected
    let finalSelected = preSelected;

    // If we have custom text but "Other" is not in the list → add it
    if (customParts.length > 0 && !finalSelected.some(isOtherObjective)) {
      finalSelected = [...finalSelected, otherOption];
    }

    const customText = customParts.join(', ');

    setSelectedOptions(finalSelected);
    setOtherText(customText);
    setSheetRowId(rowId);

    objectiveSheetRef.current?.show();
  };

  const saveObjective = () => {
    if (!sheetRowId) return;

    // ── NEW VALIDATION ──
    const hasOther = selectedOptions.some(isOtherObjective);
    if (hasOther && !otherText.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Please specify the objective',
        text2: 'Description is required when "Other" is selected',
      });
      return; // ← prevent closing / saving
    }

    let final = selectedOptions.filter(item => !isOtherObjective(item));

    if (hasOther && otherText.trim()) {
      final.push(otherText.trim());
    }

    const result = final.join(', ').trim();

    setPlans(prev =>
      prev.map(p =>
        p.id === sheetRowId ? { ...p, editingObjective: result } : p
      )
    );

    objectiveSheetRef.current?.hide();
    setSheetRowId(null);
    setSelectedOptions([]);
    setOtherText('');
  };
  // ────────────────────────────────────────────────
  // Final submit
  // ────────────────────────────────────────────────

  const handleFinalSubmit = async () => {
    // 1. Create a "committed" version where all editing rows are saved
    const committedPlans = plans.map(p =>
      p.isEditing ? saveRow(p) : p
    );

    const errors: string[] = [];
    const payloadRows: any[] = [];

    const monthMap: Record<string, string> = {
      JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
      JUL: '07', AUG: '08', SEP: '09', SEPT: '09', OCT: '10', NOV: '11', DEC: '12',
    };

    committedPlans.forEach((p, i) => {
      const rowNum = i + 1;

      if (!p.date?.trim()) errors.push(`Row ${rowNum}: Date missing`);
      if (!p.districtId) errors.push(`Row ${rowNum}: District missing`);
      if (!p.townId) errors.push(`Row ${rowNum}: Town missing`);
      if (!p.objective?.trim()) errors.push(`Row ${rowNum}: Objective missing`);

      // Only add to payload if no errors so far (or collect all and check later)
      const [day, mon, year] = (p.date || '').split(' ');
      const monthNum = monthMap[mon?.toUpperCase?.() ?? ''];
      if (p.date?.trim() && !monthNum) errors.push(`Row ${rowNum}: Invalid date`);
      const isoDate = day && monthNum && year
        ? `${day.padStart(2, '0')}-${monthNum}-${year}`
        : '';

      payloadRows.push({
        date: isoDate,
        district: p.districtId,
        town: p.townId,
        objective: (p.objective || '').trim(),
      });
    });

    if (errors.length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Please fill all required fields',
        text2: errors.join('\n'),
        visibilityTime: 6000,
      });
      return;
    }

    if (payloadRows.length === 0) {
      Toast.show({ type: 'error', text1: 'No plans to submit' });
      return;
    }

    // Optional: also update UI state so saved rows are no longer in edit mode
    setPlans(committedPlans);

    setSubmitLoading(true);

    const payload = {
      user_id: route?.params?.item ?? null,
      date: payloadRows.map(r => r.date),
      district: payloadRows.map(r => r.district),
      town: payloadRows.map(r => r.town),
      objectives: payloadRows.map(r => r.objective),
    };

    // ── rest of fetch logic unchanged ──
    try {
      const token = store.getState().auth?.token;
      const res = await fetch(`${BASE_URL}api/tour/add`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok) {
        Toast.show({ type: 'success', text1: 'Tour plan created!' });
        navigation.goBack();
      } else {
        Toast.show({ type: 'error', text1: json.message || 'Submit failed' });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Network error. Please try again.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  // Search filtering (unchanged)
  // ────────────────────────────────────────────────

  useEffect(() => {
    const lower = districtSearchText.toLowerCase().trim();
    setFilteredDistricts(districts.filter(d => d.label.toLowerCase().includes(lower)));
  }, [districtSearchText, districts]);

  useEffect(() => {
    const lower = citySearchText.toLowerCase().trim();
    setFilteredCities(cities.filter(c => c.label.toLowerCase().includes(lower)));
  }, [citySearchText, cities]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={{ flex: 1, marginTop: 20 }} keyboardDismissMode="on-drag">
        {/* Header */}
        <View style={styles.creatText}>
          <AppText size={16} color="black" family="InterSemiBold">
            Create Tour Plan
          </AppText>
        </View>

        {/* Table */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header Row */}
            <View style={[styles.boxView, styles.row, { marginTop: 24 }]}>
              <View style={[{ width: 19 }]}> {/* ← Action column - narrow */}
                <AppText size={10} color={colors.bgColor} family="InterSemiBold">
                  {/* empty or "Action" if you want */}
                  new
                </AppText>
              </View>
              <View style={[styles.heading, { width: 112 }]}>
                <AppText size={14} color="white" family="InterSemiBold">
                  Date
                </AppText>
              </View>
              <View style={[styles.heading, { width: 128 }]}>
                <AppText size={14} color="white" family="InterSemiBold">
                  District
                </AppText>
              </View>
              <View style={[styles.heading, { width: 140 }]}>
                <AppText size={14} color="white" family="InterSemiBold">
                  Visit Town
                </AppText>
              </View>
              <View style={[styles.heading, { width: 160 }]}>
                <AppText size={14} color="white" family="InterSemiBold">
                  Objective
                </AppText>
              </View>
            </View>

            {/* Data Rows */}
            {plans.map(plan => {
              const isEditing = plan.isEditing;
              const rowId = plan.id;

              return (
                <View key={rowId} style={[styles.innerView, styles.row]}>
                  {/* Delete */}
                  <View
                    style={{
                      width: 20,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {plans.length > 1 && (
                      <TouchableOpacity
                        style={{ height: 18, width: 18, backgroundColor: colors.blue, borderRadius: 50, alignItems: 'center' }}
                        onPress={() => removePlan(plan.id)}
                      >
                        <AppText size={12} color="white">-</AppText>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Date */}
                  <Pressable
                    style={[
                      styles.heading1,
                      { width: 112 },
                      {
                        borderLeftWidth: 1,
                        borderLeftColor: colors.blue,
                        borderRightColor: colors.blue,
                        borderRightWidth: 1,
                      },
                    ]}
                    onPress={() => {
                      if (!isEditing) startEditing(rowId);
                      else if (Platform.OS === 'android') setShowDatePicker(true);
                      else setShowDatePicker(true); // you can also use modal for iOS
                    }}
                  >
                    <AppText size={14} color={plan.editingDate ? "black" : 'gray'} family="InterRegular">
                      {isEditing ? (plan.editingDate || 'Select Date') : (plan.date || '—')}
                    </AppText>
                  </Pressable>

                  {/* District */}
                  <Pressable
                    style={[
                      styles.heading1,
                      { width: 140 },
                      { borderRightColor: colors.blue, borderRightWidth: 1 },
                    ]}
                    onPress={() => {
                      if (!isEditing) startEditing(rowId);
                      if (isEditing) setShowDistrictModal(true);
                    }}
                  >
                    <AppText size={14} color={plan.editingDistrict?.label ? "black" : 'gray'} family="InterRegular">
                      {isEditing
                        ? plan.editingDistrict?.label || 'Select District'
                        : plan.district || '—'}
                    </AppText>
                  </Pressable>

                  {/* Town */}
                  <Pressable
                    style={[styles.heading1, { width: 140 }]}
                    onPress={() => {
                      if (!isEditing) startEditing(rowId);
                      if (isEditing && plan.editingDistrict) setShowCityModal(true);
                    }}
                  >
                    <AppText size={14} color={plan.editingCity?.label ? "black" : 'gray'} family="InterRegular">
                      {isEditing
                        ? plan.editingCity?.label || 'Select City'
                        : plan.town || '—'}
                    </AppText>
                  </Pressable>

                  {/* Objective */}
                  <View
                    style={[
                      styles.heading1,
                      {
                        width: 160,
                        borderLeftWidth: 1,
                        borderLeftColor: colors.blue,
                        borderRightColor: colors.blue,
                        borderRightWidth: 1,
                        paddingHorizontal: 5,
                        justifyContent: 'center',
                      },
                    ]}
                  >
                    {isEditing ? (
                      <TouchableOpacity
                        style={{ flex: 1, justifyContent: 'center' }}
                        onPress={() => {
                          console.log(rowId, isEditing, 'reeeeee')
                          if (!isEditing) startEditing(rowId);
                          console.log(rowId, isEditing, '2222', plan.editingObjective)
                          if (isEditing) openObjectiveSheet(rowId)
                        }}
                      >
                        <AppText
                          size={14}
                          color={plan.editingObjective ? 'black' : 'gray'}
                          family="InterRegular"
                          numLines={2}
                        >
                          {plan.editingObjective || 'Select Objective'}
                        </AppText>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={{ flex: 1, justifyContent: 'center' }}
                        onPress={() => {
                          console.log(rowId, isEditing, 'reeeeee')
                          if (!isEditing) startEditing(rowId);
                          console.log(rowId, isEditing, '2222')
                          if (isEditing && plan.editingObjective) openObjectiveSheet(rowId)

                        }}
                      >
                        <AppText size={14} color="black" family="InterRegular" numLines={2}>
                          {plan.objective || '—'}
                        </AppText>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={[styles.createPlanView, { marginTop: 50 }]}>
          <Pressable
            style={[styles.newPlanView, styles.row]}
            onPress={addNewPlan}
          >
            <PlusAddIcon />
            <AppText size={14} family="InterMedium" color="black" opacity={0.8}>
              New Plan
            </AppText>
          </Pressable>

          <Pressable
            style={[styles.submitButton, styles.center, submitLoading && { opacity: 0.7 }]}
            onPress={handleFinalSubmit}
            disabled={submitLoading}
          >
            {submitLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <AppText size={16} color="white" family="InterBold">
                Submit
              </AppText>
            )}
          </Pressable>
        </View>

        {
          Platform?.OS == 'android' && (
            showDatePicker && (
              <DateTimePicker
                value={tempDate}
                mode="date"
                display={'default'}
                onChange={onDateChange}
                themeVariant="light"
                minimumDate={new Date()}
              />
            ))}

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* ─── District Modal ─── */}

      <Modal
        visible={Platform.OS === 'ios' && showDatePicker}
        transparent
      // animationType="slide"
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
        >
          <View
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,

            }}
          >
            <View style={{ alignItems: "center" }}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="inline"
                themeVariant='light'
                onChange={(e, d) => d && setTempDate(d)}
              />
            </View>

            {/* iOS Buttons */}
            {Platform.OS === 'ios' && (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 20,
                }}
              >
                <Pressable
                  onPress={() => setShowDatePicker(false)}
                  style={{
                    padding: 12,
                  }}
                >
                  <AppText>Cancel</AppText>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setShowDatePicker(false);
                    if (editingRowId) {
                      setPlans(prev =>
                        prev.map(p =>
                          p.id === editingRowId ? { ...p, editingDate: formatDate(tempDate) } : p
                        )
                      );
                    }
                  }}
                  style={{
                    backgroundColor: '#395299',
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                  }}
                >
                  <AppText color="white">OK</AppText>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDistrictModal}
        animationType="slide"
        transparent={true}
        statusBarTranslucent
        onRequestClose={() => setShowDistrictModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDistrictModal(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{
                  backgroundColor: 'white',
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  padding: 20,
                  height: SCREEN_HEIGHT * 0.75,
                  maxHeight: SCREEN_HEIGHT * 0.75,
                  minHeight: SCREEN_HEIGHT * 0.75,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                  <AppText size={18} family="InterSemiBold" color="black">
                    Select District
                  </AppText>
                  <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
                    <AppText size={16} color={colors.blue} family="InterMedium">
                      Close
                    </AppText>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#ddd',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 16,
                    marginBottom: 16,
                    backgroundColor: '#f9f9f9',
                    fontFamily: fonts.InterMedium,
                  }}
                  placeholder="Search district..."
                  value={districtSearchText}
                  onChangeText={setDistrictSearchText}
                />

                <FlatList
                  data={filteredDistricts}
                  keyExtractor={item => String(item.value)}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                      onPress={() => {

                        if (editingRowId) {
                          setPlans(prev =>
                            prev.map(p =>
                              p.id === editingRowId
                                ? {
                                  ...p,
                                  editingDistrict: item,
                                  editingCity: null,      // reset city when district changes
                                }
                                : p
                            )
                          );
                          fetchCitiesForDistrict(item.value);
                        }
                        setShowDistrictModal(false);
                        setDistrictSearchText('');

                        // setCities([]);
                        // fetchCitiesForDistrict(item.value);
                        // setShowDistrictModal(false);
                        // setDistrictSearchText('');
                      }}
                    >
                      <AppText size={16} color="black" family="InterRegular">
                        {item.label}
                      </AppText>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <AppText size={16} color="#999">
                      No districts found
                    </AppText>
                  }
                />
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── City Modal ─── */}
      <Modal
        visible={showCityModal}
        animationType="slide"
        transparent={true}
        statusBarTranslucent
        onRequestClose={() => setShowCityModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowCityModal(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{
                  backgroundColor: 'white',
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  padding: 20,
                  height: SCREEN_HEIGHT * 0.75,
                  maxHeight: SCREEN_HEIGHT * 0.75,
                  minHeight: SCREEN_HEIGHT * 0.75,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                  <AppText size={18} family="InterSemiBold" color="black">
                    Select City
                  </AppText>
                  <TouchableOpacity onPress={() => setShowCityModal(false)}>
                    <AppText size={16} color={colors.blue} family="InterMedium">
                      Close
                    </AppText>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#ddd',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 16,
                    marginBottom: 16,
                    backgroundColor: '#f9f9f9',
                    fontFamily: fonts.InterMedium,
                  }}
                  placeholder="Search city..."
                  value={citySearchText}
                  onChangeText={setCitySearchText}
                />

                <FlatList
                  data={filteredCities}
                  keyExtractor={item => String(item.value)}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                      onPress={() => {
                        if (editingRowId) {
                          setPlans(prev =>
                            prev.map(p =>
                              p.id === editingRowId
                                ? { ...p, editingCity: item }
                                : p
                            )
                          );
                        }
                        setShowCityModal(false);
                        setCitySearchText('');
                      }}
                    >
                      <AppText size={16} color="black" family="InterRegular">
                        {item.label}
                      </AppText>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <AppText size={16} color="#999" style={{ textAlign: 'center', marginTop: 20 }}>
                      {editingRowId && plans.find(p => p.id === editingRowId)?.editingDistrict
                        ? 'No cities found for selected district'
                        : 'Please select a district first'}
                    </AppText>
                  }
                />
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <ActionSheet
        ref={objectiveSheetRef}
        gestureEnabled
        closable
        closeOnTouchBackdrop
        statusBarTranslucent
        containerStyle={{
          backgroundColor: 'white',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
        indicatorStyle={{ backgroundColor: colors.blue, width: 60 }}
      >
        <View style={{ paddingHorizontal: 20, paddingBottom: 0, paddingTop: 20 }}>
          <AppText
            size={18}
            family="InterSemiBold"
            color="black"
            style={{ marginBottom: 20, textAlign: 'center' }}
          >
            Select Objective
          </AppText>

          <ActionSheetFlatList<DropdownItem>
            ref={objectiveListRef}
            data={objectiveOptions}
            style={{ maxHeight: 380 }}
            contentContainerStyle={{ paddingBottom: 8 }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
            keyExtractor={item => String(item.value)}
            ListEmptyComponent={objectivesLoading ? (
              <ActivityIndicator color={colors.blue} />
            ) : (
              <AppText size={15} color="#999" align="center" style={{ marginTop: 20 }}>
                No objectives available
              </AppText>
            )}
            renderItem={({ item: option }) => {
              const opt = option.label;
              return (
              <TouchableOpacity
                key={opt}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: '#eee',
                  backgroundColor: selectedOptions.includes(opt) ? 'rgba(57,82,153,0.08)' : 'transparent',
                }}
                onPress={() => {
                  const isSelecting = !selectedOptions.includes(opt);

                  setSelectedOptions(prev =>
                    prev.includes(opt)
                      ? prev.filter(o => o !== opt)
                      : [...prev, opt]
                  );

                  if (isSelecting && isOtherObjective(opt)) {
                    setTimeout(() => {
                      objectiveListRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                  }
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: selectedOptions.includes(opt) ? colors.blue : '#ccc',
                    backgroundColor: selectedOptions.includes(opt) ? colors.blue : 'transparent',
                    marginRight: 14,
                  }}
                />
                <AppText size={16} family="InterRegular" color="black">
                  {opt}
                </AppText>
              </TouchableOpacity>
              );
            }}
            ListFooterComponent={(
              <View>
                {selectedOptions.some(isOtherObjective) ? (
                  <View
                    style={{
                      marginTop: 12,
                      padding: 12,
                      backgroundColor: '#f9f9f9',
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#eee',
                    }}
                  >
                    <TextInput
                  style={{
                    fontSize: 16,
                    color: '#000',
                    minHeight: 60,
                    textAlignVertical: 'top',
                    fontFamily: fonts.InterRegular,
                  }}
                  placeholder="Please specify..."
                  placeholderTextColor="#999"
                  value={otherText}
                  onChangeText={setOtherText}
                  onFocus={() => {
                    setTimeout(() => objectiveListRef.current?.scrollToEnd({ animated: true }), 250);
                  }}
                  multiline
                  maxLength={120}
                    />
                  </View>
                ) : null}

                <TouchableOpacity
                  onPress={saveObjective}
                  style={{
                    marginTop: 20,
                    marginBottom: 8,
                    backgroundColor: colors.blue,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <AppText size={16} color="white" family="InterBold">
                    Done
                  </AppText>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      </ActionSheet>
    </SafeAreaView>
  );
};

export default CreatePlan;
