import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import Gallery from 'react-native-awesome-gallery';
import Pdf from 'react-native-pdf';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../../components/AppText/AppText';
import { useAppSelector } from '../../components/redux/Store';
import { approveExpenseApi, getExpenseDetailsApi, rejectExpenseApi } from '../../api/query/ExpenseApi';
import { colors } from '../../utils/Colors';
import { rw } from '../../utils/responsive';
import { shadowStyle } from '../../utils/typography';
import { styles } from './styles';

const STATUS_OPTIONS = [
  { label: 'Pending', value: 0 },
  { label: 'Approved', value: 1 },
  { label: 'Rejected', value: 2 },
  { label: 'Checked', value: 3 },
  { label: 'Checked By Reporting', value: 4 },
  { label: 'Hold', value: 5 },
];

const statusLabel = (status: any) => {
  const option = STATUS_OPTIONS.find(item => String(item.value) === String(status));
  return option?.label || status || 'Pending';
};

const statusColor = (status: any) => {
  if (String(status) === '1') return '#1E8E3E';
  if (String(status).toLowerCase() === 'approved') return '#1E8E3E';
  if (String(status) === '2' || String(status).toLowerCase() === 'rejected') return '#D93025';
  if (String(status) === '4' || String(status).toLowerCase() === 'checked by reporting') return '#168AAD';
  if (String(status) === '3' || String(status) === '5') return '#4A5568';
  return '#D98324';
};

const money = (value: any) => `₹ ${Number(value || 0).toFixed(2)}`;

const rateMoney = (value: any) =>
  value === null || value === undefined || value === '' ? 'NA' : `₹ ${Number(value || 0).toFixed(2)}`;

const displayValue = (value: any, fallback = 'NA') =>
  value === null || value === undefined || value === '' ? fallback : value;

const normalizeStatusText = (status: any) => String(status ?? '').trim().toLowerCase();

const getExpenseStatus = (item: any) =>
  item?.checker_status !== null && item?.checker_status !== undefined && item?.checker_status !== ''
    ? item.checker_status
    : item?.status ?? 0;

const formatDate = (date: any) => {
  if (!date || typeof date !== 'string') return 'NA';
  if (date.includes('T')) return formatDate(date.slice(0, 10));

  const parts = date.split('-');
  if (parts.length !== 3) return date;
  if (parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return date;
};

const getAttachmentLabel = (item: any) => {
  if (Array.isArray(item?.expense_image)) return item.expense_image.length ? String(item.expense_image.length) : 'NA';
  return item?.expense_image ? '1' : 'NA';
};

const getAttachmentItems = (item: any) => {
  const files = Array.isArray(item?.expense_image)
    ? item.expense_image
    : item?.expense_image ? [item.expense_image] : [];
  const ids = Array.isArray(item?.image_id)
    ? item.image_id
    : item?.image_id ? [item.image_id] : [];

  return files.map((file: any, index: number) => ({
    uri: typeof file === 'string'
      ? file
      : file?.uri || file?.url || file?.path || file?.file_url || '',
    id: ids[index],
    name: typeof file === 'object'
      ? file?.name || file?.file_name || `Attachment ${index + 1}`
      : `Attachment ${index + 1}`,
    mimeType: typeof file === 'object' ? file?.type || file?.mime_type || '' : '',
  })).filter((file: any) => Boolean(file.uri));
};

const isPdfAttachment = (file: any) => {
  if (String(file?.mimeType || '').toLowerCase().includes('pdf')) return true;

  const uriWithoutQuery = String(file?.uri || '').split(/[?#]/)[0];
  try {
    return decodeURIComponent(uriWithoutQuery).toLowerCase().endsWith('.pdf');
  } catch {
    return uriWithoutQuery.toLowerCase().endsWith('.pdf');
  }
};

const getFirstValue = (source: any, paths: string[]) => {
  for (const path of paths) {
    const value = path.split('.').reduce((current, key) => current?.[key], source);
    if (value !== null && value !== undefined && value !== '') return value;
  }

  return '';
};

const getExpenseDecisionReason = (item: any) => getFirstValue(item, [
  'reason',
  'reasons',
  'approval_reason',
  'rejection_reason',
  'approve_reason',
  'reject_reason',
  'approval_remark',
  'rejection_remark',
  'checker_reason',
  'latest_approval.reason',
  'last_approval.reason',
  'approval.reason',
  'approval.reasons',
]);

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

const DetailCell = ({ label, value, color = '#202432' }: any) => (
  <View style={styles.detailCell}>
    <AppText size={13} color="#9094A3" family="InterSemiBold">{label}</AppText>
    <AppText size={15} color={color} family="InterBold" numLines={2}>
      {displayValue(value)}
    </AppText>
  </View>
);

const SectionTitle = ({ children }: any) => (
  <AppText size={15} color="#9094A3" family="InterBold" style={styles.detailSectionTitle}>
    {children}
  </AppText>
);

const ExpenseDetails = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const routeExpense = route?.params?.expense;
  const mode = route?.params?.mode;
  const { user, token } = useAppSelector((state) => state.auth);

  const [expense, setExpense] = useState<any>(routeExpense || null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState<'approve' | 'reject'>('approve');
  const [approveAmount, setApproveAmount] = useState(String(routeExpense?.claim_amount || ''));
  const [reason, setReason] = useState('');
  const [previewAttachment, setPreviewAttachment] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [pdfPage, setPdfPage] = useState(1);
  const [pdfPages, setPdfPages] = useState(0);

  const expenseId = routeExpense?.id || route?.params?.expense_id;
  const currentStatus = getExpenseStatus(expense);
  const normalizedCurrentStatus = normalizeStatusText(currentStatus);
  const isApproved = normalizedCurrentStatus === '1' || normalizedCurrentStatus === 'approved';
  const isRejected = normalizedCurrentStatus === '2' || normalizedCurrentStatus === 'rejected';
  const isChecked = normalizedCurrentStatus === '3' || normalizedCurrentStatus === 'checked';
  const hasReading = !!displayValue(expense?.start_km, '') || !!displayValue(expense?.stop_km, '');

  const isOwnExpense = useMemo(() => {
    return (
      mode === 'my' ||
      expense?.self === true ||
      expense?.self === 1 ||
      String(expense?.user_id || '') === String(user?.id || '')
    );
  }, [expense?.self, expense?.user_id, mode, user?.id]);

  const canShowApproval =
    !isOwnExpense &&
    (normalizedCurrentStatus === '0' || normalizedCurrentStatus === 'pending' || isChecked);
  const canEditExpense =
    isOwnExpense &&
    (String(currentStatus) === '0' || String(currentStatus || '').toLowerCase() === 'pending');
  const showApprovalDecision = !canShowApproval && (isApproved || isRejected);
  const attachmentItems = getAttachmentItems(expense);
  const decisionReason = getExpenseDecisionReason(expense);

  const openAttachmentPreview = (file: any) => {
    setPreviewError('');
    setPreviewLoading(true);
    setPdfPage(1);
    setPdfPages(0);
    setPreviewAttachment(file);
  };

  const closeAttachmentPreview = () => {
    setPreviewAttachment(null);
    setPreviewLoading(false);
    setPreviewError('');
  };

  const employeeCode = getFirstValue(expense, [
    'employee_code',
    'emp_code',
    'employee_codes',
    'user.employee_codes',
    'users.employee_codes',
  ]);
  const planCity = getFirstValue(expense, [
    'plan.city.city_name',
    'plan.cityname.city_name',
    'plan.cityRelation.city_name',
    'plan.town_name',
    'plan.city_name',
    'plan.town',
  ]);
  const visitCity = getFirstValue(expense, [
    'today_visit_city',
    'visit_city',
    'current_visit_city',
    'plan.visited_city',
    'plan.today_visit_city',
  ]) || planCity;
  const approverName = getFirstValue(expense, [
    'approved_by',
    'approve_by',
    'approver_name',
    'approve_reject_by_name',
    'approved_user.name',
    'approve_user.name',
  ]);
  const approvalDate = getFirstValue(expense, [
    'approve_date',
    'approved_date',
    'approval_date',
    'updated_at',
  ]);

  const loadDetails = useCallback(async () => {
    if (!expenseId) return;

    try {
      setLoading(true);
      const res = await getExpenseDetailsApi(expenseId);
      const details = res?.data?.data || res?.data?.expense || res?.data;
      setExpense(details);
      setApproveAmount(String(details?.approve_amount || details?.claim_amount || ''));
    } catch (error: any) {
      console.log('Expense details error:', error?.response || error);
      Toast.show({ type: 'error', text1: 'Failed to load expense details' });
    } finally {
      setLoading(false);
    }
  }, [expenseId]);

  useFocusEffect(
    useCallback(() => {
      loadDetails();
    }, [loadDetails]),
  );

  const submitApproval = async () => {
    if (!expense?.id || submitting) return;

    if (decision === 'approve' && (!approveAmount || Number(approveAmount) <= 0)) {
      Toast.show({ type: 'error', text1: 'Please enter approve amount' });
      return;
    }
    if (decision === 'approve' && Number(approveAmount) > Number(expense?.claim_amount || 0)) {
      Toast.show({ type: 'error', text1: 'Approve amount cannot be greater than claim amount' });
      return;
    }
    if (!reason.trim()) {
      Toast.show({
        type: 'error',
        text1: decision === 'approve' ? 'Please enter reporting check reason' : 'Please enter rejection reason',
      });
      return;
    }

    try {
      setSubmitting(true);
      const res = decision === 'approve'
        ? await approveExpenseApi({
          expense_id: expense.id,
          approve_amnt: approveAmount,
          reasons: reason.trim(),
          reason: reason.trim(),
        })
        : await rejectExpenseApi({
          expense_id: expense.id,
          reasons: reason.trim(),
          reason: reason.trim(),
        });

      if (res?.data?.status === true || res?.data?.status === 'success') {
        Toast.show({
          type: 'success',
          text1: decision === 'approve' ? 'Expense checked by reporting' : 'Expense rejected',
        });
        navigation.goBack();
      } else {
        Toast.show({ type: 'error', text1: res?.data?.message || 'Action failed' });
      }
    } catch (error: any) {
      console.log('Expense approval error:', error?.response || error);
      Toast.show({ type: 'error', text1: error?.response?.data?.message || 'Action failed' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !expense) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.blue} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={[styles.container, { paddingHorizontal: rw(18), paddingTop: 16 }]} keyboardShouldPersistTaps="handled">
        {canEditExpense && (
          <View style={styles.expenseEditRow}>
            <Pressable
              style={styles.expenseEditButton}
              onPress={() => navigation.navigate('AddNewExpense', { expense })}
            >
              <AppText size={15} color="#333F82" family="InterBold">Edit</AppText>
            </Pressable>
          </View>
        )}

        <View style={[styles.detailHeroCard, shadowStyle]}>
          <View style={styles.detailHeroHeader}>
            <View style={styles.detailTitleBlock}>
              <AppText size={20} color="#202432" family="InterBold" numLines={1}>
                {expense?.expenses_type_name || 'Expense'}
              </AppText>
              <AppText size={14} color="#9094A3" family="InterSemiBold">
                #{expense?.id}
              </AppText>
            </View>
            <AppText size={26} color="#333F82" family="InterBold">
              {money(expense?.approve_amount || expense?.claim_amount)}
            </AppText>
          </View>

          <View style={styles.expenseDivider} />

          <View style={styles.detailGrid}>
            <DetailCell label="Expense Date" value={formatDate(expense?.date)} />
            <DetailCell
              label="Status"
              value={statusLabel(currentStatus)}
              color={statusColor(currentStatus)}
            />
            <DetailCell label="Rate" value={rateMoney(expense?.rate)} />
            <DetailCell label="Attachment" value={getAttachmentLabel(expense)} />
          </View>
        </View>

        <View style={[styles.detailHeroCard, shadowStyle]}>
          <SectionTitle>EMPLOYEE &amp; VISIT INFO</SectionTitle>
          <View style={styles.detailGrid}>
            <DetailCell label="Employee Name" value={expense?.user_name || expense?.name || 'NA'} />
            <DetailCell label="Employee Code" value={employeeCode || 'NA'} />
            <DetailCell label="Rate" value={rateMoney(expense?.rate)} />
            <DetailCell label="Claim Amt" value={money(expense?.claim_amount)} />
            {hasReading && (
              <>
                <DetailCell
                  label="Reading (Start-End)"
                  value={`${displayValue(expense?.start_km, '0')} - ${displayValue(expense?.stop_km, '0')}`}
                />
                <DetailCell label="Total KM" value={`${displayValue(expense?.total_km, '0')} km`} />
              </>
            )}
            <DetailCell label="Total Visit Nos" value={displayValue(expense?.total_visit, '0')} />
            <DetailCell label="Google Map Total KM" value={`${displayValue(expense?.total_dis, '0')} km`} />
            <DetailCell label="Today Tour Plan City" value={planCity || 'NA'} />
            <DetailCell label="Today Visit City" value={visitCity || 'NA'} />
          </View>
          <AppText size={13} color="#9094A3" family="InterRegular" style={styles.detailHelpText}>
            Google Map KM measured from attendance start (punch-in) location to last check-out / last punch-out location.
          </AppText>
        </View>

        <View style={[styles.detailHeroCard, shadowStyle]}>
          <SectionTitle>NOTE / REMARKS</SectionTitle>
          <AppText size={15} color="#202432" family="InterMedium">
            {expense?.note || 'NA'}
          </AppText>
          {!!decisionReason && (isApproved || isRejected) && (
            <View style={styles.detailReasonBlock}>
              <SectionTitle>REASON</SectionTitle>
              <AppText size={15} color="#202432" family="InterMedium">
                {decisionReason}
              </AppText>
            </View>
          )}
        </View>

        {attachmentItems.length > 0 && (
          <View style={[styles.detailHeroCard, shadowStyle]}>
            <SectionTitle>ATTACHMENTS</SectionTitle>
            {attachmentItems.map((file: any, index: number) => (
              <Pressable
                key={`${file.uri}-${index}`}
                style={styles.detailAttachmentRow}
                onPress={() => openAttachmentPreview(file)}
              >
                <AppText size={14} color="#202432" family="InterSemiBold" numLines={1}>
                  {file.name}
                </AppText>
                <AppText size={13} color="#333F82" family="InterBold">
                  View
                </AppText>
              </Pressable>
            ))}
          </View>
        )}

        {showApprovalDecision && (
          <View style={[styles.detailHeroCard, shadowStyle]}>
            <SectionTitle>APPROVAL DECISION</SectionTitle>
            <View style={styles.approvalDecisionRow}>
              <AppText size={16} color={isRejected ? '#D93025' : '#1E8E3E'} family="InterBold">
                {isRejected ? 'Rejected' : 'Approved'}{approverName ? ` by ${approverName}` : ''}
              </AppText>
              <AppText size={15} color="#9094A3" family="InterMedium">
                {approvalDate ? formatDate(String(approvalDate)) : ''}
              </AppText>
            </View>
          </View>
        )}

        {canShowApproval && (
          <View style={[styles.detailHeroCard, shadowStyle]}>
            <SectionTitle>APPROVAL ACTION</SectionTitle>

            <View style={styles.approvalChoiceRow}>
              <Pressable style={styles.approvalChoice} onPress={() => setDecision('approve')}>
                <View style={[styles.approvalRadio, decision === 'approve' && styles.approvalRadioApprove]}>
                  {decision === 'approve' && <View style={styles.approvalRadioDot} />}
                </View>
                <AppText size={16} family="InterBold" color="#168AAD">
                  Checked By Reporting
                </AppText>
              </Pressable>
              <Pressable style={styles.approvalChoice} onPress={() => setDecision('reject')}>
                <View style={[styles.approvalRadio, styles.approvalRadioReject, decision === 'reject' && styles.approvalRadioRejectActive]}>
                  {decision === 'reject' && <View style={[styles.approvalRadioDot, styles.approvalRadioRejectDot]} />}
                </View>
                <AppText size={16} family="InterBold" color="#D93025">
                  Rejected
                </AppText>
              </Pressable>
            </View>

            {decision === 'approve' && (
              <>
                <View style={styles.approveAmountLabelRow}>
                  <AppText size={14} color="#202432" family="InterBold">Approved Amount</AppText>
                  <AppText size={12} color="#9094A3" family="InterSemiBold">editable by approver only</AppText>
                </View>
                <TextInput
                  style={styles.approvalAmountInput}
                  placeholder="Approved Amount"
                  placeholderTextColor="#718096"
                  keyboardType="decimal-pad"
                  value={approveAmount}
                  onChangeText={(text) => setApproveAmount(normalizeNumericInput(text))}
                />
              </>
            )}

            <AppText size={14} color="#202432" family="InterBold" style={styles.approvalRemarkLabel}>
              {decision === 'reject' ? 'Rejection Reason' : 'Reporting Check Reason'}
            </AppText>
            <TextInput
              style={styles.textArea}
              placeholder={decision === 'reject' ? 'Enter rejection reason' : 'Enter reporting check reason'}
              placeholderTextColor="#718096"
              multiline
              value={reason}
              onChangeText={setReason}
            />

            <Pressable style={[styles.buttonView, { marginTop: 15 }]} disabled={submitting} onPress={submitApproval}>
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <AppText size={16} color="white" family="InterBold">SUBMIT</AppText>
              )}
            </Pressable>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      <Modal
        visible={Boolean(previewAttachment)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeAttachmentPreview}
      >
        <View style={styles.attachmentPreviewModal}>
          <View style={[styles.attachmentPreviewHeader, { paddingTop: insets.top + 8 }]}>
            <AppText
              size={16}
              color="white"
              family="InterBold"
              numLines={1}
              style={styles.attachmentPreviewTitle}
            >
              {previewAttachment?.name || 'Attachment'}
            </AppText>
            {isPdfAttachment(previewAttachment) && pdfPages > 0 && (
              <AppText size={13} color="#D8DCE8" family="InterSemiBold">
                {pdfPage} / {pdfPages}
              </AppText>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close attachment preview"
              hitSlop={12}
              style={styles.attachmentPreviewClose}
              onPress={closeAttachmentPreview}
            >
              <AppText size={25} color="white" family="InterBold">✕</AppText>
            </Pressable>
          </View>

          <View style={styles.attachmentPreviewContent}>
            {previewAttachment && isPdfAttachment(previewAttachment) ? (
              <Pdf
                source={{
                  uri: previewAttachment.uri,
                  cache: true,
                  headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                }}
                style={styles.attachmentPdf}
                trustAllCerts={false}
                enablePaging={false}
                enableDoubleTapZoom
                onLoadComplete={(numberOfPages) => {
                  setPdfPages(numberOfPages);
                  setPreviewLoading(false);
                }}
                onPageChanged={(page, numberOfPages) => {
                  setPdfPage(page);
                  setPdfPages(numberOfPages);
                }}
                onError={(error) => {
                  console.log('Expense PDF preview error:', error);
                  setPreviewLoading(false);
                  setPreviewError('Unable to display this PDF.');
                }}
              />
            ) : previewAttachment ? (
              <Gallery
                data={[previewAttachment.uri]}
                style={styles.attachmentImageGallery}
                pinchEnabled
                doubleTapEnabled
                doubleTapScale={2.5}
                maxScale={6}
                disableSwipeUp
                disableVerticalSwipe
                onIndexChange={() => setPreviewLoading(false)}
              />
            ) : null}

            {previewLoading && isPdfAttachment(previewAttachment) && (
              <View style={styles.attachmentPreviewLoader}>
                <ActivityIndicator size="large" color="white" />
              </View>
            )}

            {!!previewError && (
              <View style={styles.attachmentPreviewLoader}>
                <AppText size={15} color="white" family="InterSemiBold" align="center">
                  {previewError}
                </AppText>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ExpenseDetails;
