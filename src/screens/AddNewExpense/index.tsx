import DateTimePicker from '@react-native-community/datetimepicker';
import { NavigationProp, ParamListBase, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, PermissionsAndroid, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { Asset, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import { ArrowDownIcon, CalenderIcon } from '../../assets/svgs/SvgsFile';
import { UploadIcon } from '../../assets/svgs/HomePageSvgs';
import AppText from '../../components/AppText/AppText';
import { useAppSelector } from '../../components/redux/Store';
import { createExpenseApi, getExpenseTypesApi, updateExpenseApi } from '../../api/query/ExpenseApi';
import { colors } from '../../utils/Colors';
import { rw } from '../../utils/responsive';
import { styles } from './styles';

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const todayIso = () => formatLocalDate(new Date());
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
const ALLOWANCE_TYPE = {
  TRAVELLING: '1',
  DAILY: '2',
} as const;

const getPayrollId = (user: any) =>
  user?.payroll_id ||
  user?.payroll?.id ||
  user?.employee_detail?.payroll_id ||
  user?.employee_details?.payroll_id ||
  user?.payrollId;

const normalizeTypes = (payload: any) => {
  const list =
    payload?.data?.data ??
    payload?.data?.expence_types ??
    payload?.expence_types ??
    payload?.data ??
    [];

  return (Array.isArray(list) ? list : []).map((item: any) => ({
    label: item?.name || item?.expenses_type_name || `Expense ${item?.id}`,
    value: item?.id || item?.value,
    rate: item?.rate === false || item?.rate === '' || item?.rate == null ? '0' : String(item.rate),
    allowanceTypeId: item?.allowance_type_id,
    raw: item,
  })).filter((item: any) => item.value);
};

const isTravellingAllowance = (allowanceTypeId?: string | number) =>
  String(allowanceTypeId ?? '') === ALLOWANCE_TYPE.TRAVELLING;

const roundedAmount = (value: any) => String(Math.round(Number(value || 0)));

const normalizeDateForInput = (date: any) => {
  if (!date || typeof date !== 'string') return todayIso();
  if (date.includes('T')) return date.slice(0, 10);
  const parts = date.split('-');
  if (parts.length === 3 && parts[0].length !== 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return date;
};

const normalizeNumericInput = (value: string) => {
  const devanagariDigits = '०१२३४५६७८९';
  const arabicIndicDigits = '٠١٢٣٤٥٦٧٨٩';
  const easternArabicIndicDigits = '۰۱۲۳۴۵۶۷۸۹';
  const normalized = String(value || '')
    .replace(/[०-९]/g, (digit) => String(devanagariDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicIndicDigits.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(easternArabicIndicDigits.indexOf(digit)))
    .replace(/[^0-9.]/g, '');
  const parts = normalized.split('.');

  return parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('')}` : normalized;
};

const AddNewExpense = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const route = useRoute<any>();
  const { user } = useAppSelector((state) => state.auth);
  const payrollId = getPayrollId(user);
  const editExpense = route?.params?.expense;
  const isEditMode = !!editExpense?.id;

  const [expenseTypes, setExpenseTypes] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<any>(editExpense?.expenses_type || null);
  const [expenseDate, setExpenseDate] = useState(normalizeDateForInput(editExpense?.date));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [rate, setRate] = useState(normalizeNumericInput(String(editExpense?.rate || '')));
  const [startKm, setStartKm] = useState(normalizeNumericInput(String(editExpense?.start_km || '')));
  const [stopKm, setStopKm] = useState(normalizeNumericInput(String(editExpense?.stop_km || '')));
  const [claimAmount, setClaimAmount] = useState(normalizeNumericInput(String(editExpense?.claim_amount || '')));
  const [note, setNote] = useState(editExpense?.note || '');
  const [attachments, setAttachments] = useState<Asset[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<Array<string | number>>([]);
  const [loading, setLoading] = useState(false);
  const [typesLoading, setTypesLoading] = useState(false);

  const selectedTypeItem = useMemo(
    () => expenseTypes.find((item) => String(item.value) === String(selectedType)),
    [expenseTypes, selectedType],
  );
  const selectedAllowanceTypeId = selectedTypeItem?.allowanceTypeId ?? editExpense?.allowance_type_id;
  const isTravelling = isTravellingAllowance(selectedAllowanceTypeId);
  const showKmFields = isTravelling;
  const isAutoClaimAmount = isTravelling;
  const attachmentRequired = isTravelling;
  const totalKm = useMemo(() => {
    const start = Number(startKm || 0);
    const stop = Number(stopKm || 0);
    return stop > start ? stop - start : 0;
  }, [startKm, stopKm]);

  useEffect(() => {
    if (isAutoClaimAmount) {
      const baseAmount = showKmFields ? totalKm * Number(rate || 0) : Number(rate || 0);
      setClaimAmount(roundedAmount(baseAmount));
    }
  }, [isAutoClaimAmount, rate, showKmFields, totalKm]);

  const loadExpenseTypes = useCallback(async () => {
    if (!payrollId) {
      setExpenseTypes([]);
      Toast.show({ type: 'error', text1: 'Payroll id not found for expense types' });
      return;
    }

    try {
      setTypesLoading(true);
      const typeRes = await getExpenseTypesApi(payrollId);
      const types = normalizeTypes(typeRes?.data);

      setExpenseTypes(types);
    } catch (error: any) {
      console.log('Expense type error:', error?.response || error);
      Toast.show({ type: 'error', text1: 'Failed to load expense types' });
    } finally {
      setTypesLoading(false);
    }
  }, [payrollId]);

  useEffect(() => {
    loadExpenseTypes();
  }, [loadExpenseTypes]);

  useEffect(() => {
    if (!editExpense) return;

    const files = Array.isArray(editExpense?.expense_image)
      ? editExpense.expense_image
      : editExpense?.expense_image ? [editExpense.expense_image] : [];
    const ids = Array.isArray(editExpense?.image_id)
      ? editExpense.image_id
      : editExpense?.image_id ? [editExpense.image_id] : [];

    setExistingAttachments(files.map((uri: string, index: number) => ({
      uri,
      id: ids[index],
      name: `Attachment ${index + 1}`,
    })));
  }, [editExpense]);

  useEffect(() => {
    if (!selectedTypeItem) return;

    setRate(normalizeNumericInput(String(selectedTypeItem.rate || '0')) || '0');
  }, [selectedTypeItem]);

  const validateFiles = (files: Asset[]) => {
    return files.filter((file) => {
      const fileType = String(file.type || '').toLowerCase();
      if (file.fileSize && file.fileSize > MAX_ATTACHMENT_SIZE) {
        Toast.show({ type: 'error', text1: `${file.fileName || 'Attachment'} is more than 5 MB` });
        return false;
      }
      if (fileType && !ALLOWED_ATTACHMENT_TYPES.includes(fileType)) {
        Toast.show({ type: 'error', text1: `${file.fileName || 'Attachment'} type is not allowed` });
        return false;
      }
      return true;
    });
  };

  const pickAttachmentFromGallery = () => {
    launchImageLibrary({
      mediaType: 'mixed',
      selectionLimit: 0,
    }, (response) => {
      if (response.didCancel) return;
      if (response.errorMessage) {
        Toast.show({ type: 'error', text1: response.errorMessage });
        return;
      }

      const selectedFiles = response.assets || [];
      const validFiles = validateFiles(selectedFiles);

      if (validFiles.length) {
        setAttachments((prev) => [...prev, ...validFiles]);
      }
    });
  };

  const pickAttachmentFromCamera = async () => {
    if (Platform.OS === 'android') {
      const permission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
        Toast.show({ type: 'error', text1: 'Camera permission denied' });
        return;
      }
    }

    launchCamera({
      mediaType: 'photo',
      saveToPhotos: false,
    }, (response) => {
      if (response.didCancel) return;
      if (response.errorMessage) {
        Toast.show({ type: 'error', text1: response.errorMessage });
        return;
      }

      const validFiles = validateFiles(response.assets || []);
      if (validFiles.length) {
        setAttachments((prev) => [...prev, ...validFiles]);
      }
    });
  };

  const validate = () => {
    if (!selectedType) {
      Toast.show({ type: 'error', text1: 'Please select expense type' });
      return false;
    }
    if (!expenseDate) {
      Toast.show({ type: 'error', text1: 'Please select expense date' });
      return false;
    }
    if (!claimAmount || Number(claimAmount) <= 0) {
      Toast.show({ type: 'error', text1: 'Please enter claim amount' });
      return false;
    }
    if (showKmFields && (!startKm || !stopKm || Number(stopKm) <= Number(startKm))) {
      Toast.show({ type: 'error', text1: 'Please enter valid start and stop km' });
      return false;
    }
    if (!note.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter note' });
      return false;
    }
    if (attachmentRequired && attachments.length + existingAttachments.length === 0) {
      Toast.show({ type: 'error', text1: 'At least one expense attachment is required' });
      return false;
    }
    return true;
  };

  const submitExpense = async () => {
    if (!validate() || loading) return;

    const fd = new FormData();
    if (isEditMode) fd.append('expense_id', editExpense.id);
    fd.append('expenses_type', selectedType);
    fd.append('claim_amount', claimAmount);
    fd.append('date', expenseDate);
    if (startKm) fd.append('start_km', startKm);
    if (stopKm) fd.append('stop_km', stopKm);
    if (showKmFields) fd.append('total_km', String(totalKm));
    fd.append('note', note.trim());
    attachments.forEach((attachment, index) => {
      if (attachment?.uri) {
        fd.append('expense_file[]', {
          uri: attachment.uri,
          type: attachment.type || 'image/jpeg',
          name: attachment.fileName || `expense-${Date.now()}-${index}.jpg`,
        } as any);
      }
    });
    if (removedAttachmentIds.length === 1) {
      fd.append('image_id', String(removedAttachmentIds[0]));
    } else {
      removedAttachmentIds.forEach((id) => {
        fd.append('image_id[]', String(id));
      });
    }

    try {
      setLoading(true);
      const res = isEditMode ? await updateExpenseApi(fd) : await createExpenseApi(fd);
      if (res?.data?.status === true || res?.data?.status === 'success') {
        Toast.show({ type: 'success', text1: res?.data?.message || (isEditMode ? 'Expense updated' : 'Expense submitted') });
        navigation.goBack();
      } else {
        Toast.show({ type: 'error', text1: res?.data?.message || 'Could not save expense' });
      }
    } catch (error: any) {
      console.log('Save expense error:', error?.response || error);
      Toast.show({ type: 'error', text1: error?.response?.data?.message || 'Could not save expense' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={[styles.container, { paddingHorizontal: rw(18), paddingTop: 20 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.sectionContent}>
          <AppText size={16} color="#000000" family="InterSemiBold">Select Expense Type</AppText>
          <Dropdown
            style={styles.UserBox}
            placeholderStyle={{ color: '#718096', fontSize: 14 }}
            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
            data={expenseTypes}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder={typesLoading ? 'Loading...' : 'Select Expense Type'}
            value={selectedType}
            onChange={(item) => {
              setSelectedType(item.value);
              const nextRate = normalizeNumericInput(item.rate === false || item.rate === '' || item.rate == null ? '0' : String(item.rate)) || '0';
              setRate(nextRate);
              setStartKm('');
              setStopKm('');
              if (isTravellingAllowance(item.allowanceTypeId)) {
                setClaimAmount('0');
              } else {
                setClaimAmount('');
              }
            }}
            renderRightIcon={() => typesLoading ? <ActivityIndicator size="small" color={colors.blue} /> : <ArrowDownIcon color="#000000" />}
          />

          <AppText size={16} color="#000000" family="InterSemiBold">Select Expense Date</AppText>
          <Pressable style={[styles.UserBox, styles.row]} onPress={() => setShowDatePicker(true)}>
            <View style={{ flex: 1, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <CalenderIcon color="#3C3C3C" />
              <AppText size={14} color="#718096" family="InterRegular">{expenseDate}</AppText>
            </View>
            <ArrowDownIcon color="#000000" />
          </Pressable>
          {showDatePicker && (
            <View style={Platform.OS === 'ios' ? styles.iosDatePickerContainer : undefined}>
              <DateTimePicker
                value={expenseDate ? new Date(expenseDate) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                themeVariant="light"
                maximumDate={new Date()}
                onChange={(_, date) => {
                  if (Platform.OS !== 'ios') {
                    setShowDatePicker(false);
                  }
                  if (date) setExpenseDate(formatLocalDate(date));
                }}
              />
              {Platform.OS === 'ios' && (
                <Pressable style={styles.dateDoneButton} onPress={() => setShowDatePicker(false)}>
                  <AppText size={14} color="white" family="InterSemiBold">Done</AppText>
                </Pressable>
              )}
            </View>
          )}

          <AppText size={16} color="#000000" family="InterSemiBold">Rate</AppText>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            placeholder="Rate"
            placeholderTextColor="#718096"
            keyboardType="numeric"
            value={rate || '0'}
            editable={false}
          />

          {showKmFields && (
            <>
              <AppText size={16} color="#000000" family="InterSemiBold">Start Km</AppText>
              <TextInput
                style={styles.input}
                placeholder="km"
                placeholderTextColor="#718096"
                keyboardType="decimal-pad"
                value={startKm}
                onChangeText={(text) => setStartKm(normalizeNumericInput(text))}
              />
              <AppText size={16} color="#000000" family="InterSemiBold">Stop Km</AppText>
              <TextInput
                style={styles.input}
                placeholder="km"
                placeholderTextColor="#718096"
                keyboardType="decimal-pad"
                value={stopKm}
                onChangeText={(text) => setStopKm(normalizeNumericInput(text))}
              />
              <AppText size={16} color="#000000" family="InterSemiBold">Total Km</AppText>
              <View style={[styles.UserBox, styles.row]}>
                <AppText size={14} color="#718096" family="InterRegular">{totalKm} km</AppText>
              </View>
            </>
          )}

          <AppText size={16} color="#000000" family="InterSemiBold">Claim Amount</AppText>
          <TextInput
            style={[styles.input, isAutoClaimAmount && styles.disabledInput]}
            placeholder="₹ 0.00"
            placeholderTextColor="#718096"
            keyboardType="decimal-pad"
            value={claimAmount}
            onChangeText={(text) => setClaimAmount(normalizeNumericInput(text))}
            editable={!isAutoClaimAmount}
          />

          <AppText size={16} color="#000000" family="InterSemiBold">Note *</AppText>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter note"
            placeholderTextColor="#718096"
            multiline
            value={note}
            onChangeText={setNote}
          />
        </View>

        <View style={[styles.sectionContent, { flexDirection: 'row', alignItems: 'center', marginTop: 12 }]}>
          <Pressable style={styles.uploadBox} onPress={pickAttachmentFromCamera}>
            <UploadIcon width={24} height={24} />
            <AppText size={13} color="#64748B" family="InterMedium">
              Camera
            </AppText>
          </Pressable>
          <Pressable style={styles.uploadBox} onPress={pickAttachmentFromGallery}>
            <UploadIcon width={24} height={24} />
            <AppText size={13} color="#64748B" family="InterMedium">
              Gallery
            </AppText>
          </Pressable>
          <View style={{ gap: 3, flex: 1 }}>
            <AppText size={16} color="#000000" family="InterSemiBold" horizontal={6} numLines={2}>
              {attachments.length || existingAttachments.length ? `${attachments.length + existingAttachments.length} attachment(s) selected` : 'Expense Attachment'}
            </AppText>
            <AppText size={12} color="#C25050" family="InterRegular" horizontal={6}>
              {attachmentRequired ? 'Required · Images/PDF, max 5 MB each' : 'Images/PDF, max 5 MB each'}
            </AppText>
          </View>
        </View>
        {(existingAttachments.length > 0 || attachments.length > 0) && (
          <View style={styles.sectionContent}>
            {existingAttachments.map((file, index) => (
              <View key={`${file.uri}-${index}`} style={[styles.row, styles.attachmentRow]}>
                <AppText size={13} color="#000000" family="InterMedium" width="75%" numLines={1}>
                  {file.name || `Attachment ${index + 1}`}
                </AppText>
                <Pressable onPress={() => {
                  if (file.id) setRemovedAttachmentIds((prev) => [...prev, file.id]);
                  setExistingAttachments((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
                }}>
                  <AppText size={13} color="#C25050" family="InterSemiBold">Remove</AppText>
                </Pressable>
              </View>
            ))}
            {attachments.map((file, index) => (
              <View key={`${file.uri}-${index}`} style={[styles.row, styles.attachmentRow]}>
                <AppText size={13} color="#000000" family="InterMedium" width="75%" numLines={1}>
                  {file.fileName || `Attachment ${index + 1}`}
                </AppText>
                <Pressable onPress={() => setAttachments((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}>
                  <AppText size={13} color="#C25050" family="InterSemiBold">Remove</AppText>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Pressable style={styles.buttonView} disabled={loading} onPress={submitExpense}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <AppText color="white" family="InterBold" size={16}>{isEditMode ? 'UPDATE' : 'SUBMIT'}</AppText>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
};

export default AddNewExpense;
