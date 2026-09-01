import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import AppText from '../../components/AppText/AppText';
import { ArrowDownIcon, CalenderIcon, PlusAddIcon } from '../../assets/svgs/SvgsFile';
import { colors } from '../../utils/Colors';
import { rw } from '../../utils/responsive';
import { shadowStyle } from '../../utils/typography';
import { getAllExpensesApi, getMyExpensesApi } from '../../api/query/ExpenseApi';
import CustomerCalendar from '../../components/CustomCalendar/CalendarPopupView';
import { styles } from './styles';

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 0 },
  { label: 'Approved', value: 1 },
  { label: 'Rejected', value: 2 },
  { label: 'Checked', value: 3 },
  { label: 'Checked By Reporting', value: 4 },
  { label: 'Hold', value: 5 },
];

const normalizeStatusText = (status: any) => String(status ?? '').trim().toLowerCase();

const normalizeStatusValue = (status: any) => {
  const normalized = normalizeStatusText(status);
  const option = STATUS_OPTIONS.find(item =>
    normalizeStatusText(item.value) === normalized || normalizeStatusText(item.label) === normalized,
  );

  return option ? normalizeStatusText(option.value) : normalized;
};

const statusLabel = (status: any) => {
  const normalized = normalizeStatusValue(status);
  const option = STATUS_OPTIONS.find(item => normalizeStatusText(item.value) === normalized);
  return option?.label || status || 'Pending';
};

const statusColor = (status: any) => {
  if (isApprovedStatus(status)) return '#1E8E3E';
  if (String(status) === '2' || String(status).toLowerCase() === 'rejected') return '#D93025';
  if (String(status) === '4' || String(status).toLowerCase() === 'checked by reporting') return '#168AAD';
  if (String(status) === '3' || String(status) === '5') return '#4A5568';
  return '#D98324';
};

const formatAmount = (amount: any) => Number(amount || 0).toFixed(2);

const getExpenseStatus = (item: any) =>
  item?.checker_status !== null && item?.checker_status !== undefined && item?.checker_status !== ''
    ? item.checker_status
    : item?.status ?? 0;

const getNestedValue = (source: any, path: string) =>
  path.split('.').reduce((current, key) => current?.[key], source);

const getExpenseDecisionReason = (item: any) => {
  const paths = [
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
  ];

  for (const path of paths) {
    const value = getNestedValue(item, path);
    if (value !== null && value !== undefined && String(value).trim()) return String(value).trim();
  }

  return '';
};

const shouldShowDecisionReason = (status: any) => {
  const value = normalizeStatusText(status);
  return value === '1' || value === '2' || value === 'rejected' || value === 'approved';
};

const isApprovedStatus = (status: any) => {
  const value = normalizeStatusText(status);
  return value === '1' || value === 'approved';
};

const matchesExactStatus = (status: any, value: any) =>
  normalizeStatusValue(status) === normalizeStatusValue(value);

const getApprovalStatusOptions = () => STATUS_OPTIONS
  .filter(item => item.value !== '')
  .map(item => ({ ...item }));

const getExpenseAmount = (item: any) => {
  const currentStatus = getExpenseStatus(item);
  const rawAmount = isApprovedStatus(currentStatus)
    ? item?.approve_amount ?? item?.claim_amount
    : item?.claim_amount;
  const amount = Number(String(rawAmount ?? 0).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(amount) ? amount : 0;
};

const displayValue = (value: any, fallback = '—') =>
  value === null || value === undefined || value === '' ? fallback : value;

const formatDate = (date: any) => {
  if (!date || typeof date !== 'string') return 'NA';
  const [year, month, day] = date.split('-');
  if (!year || !month || !day) return date;
  return `${day}-${month}-${year}`;
};

const formatYYYYMMDD = (date: Date | null) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getExpenseImageCount = (item: any) => {
  const images = item?.expense_image;
  if (Array.isArray(images)) return images.length || 'NA';
  return images ? 1 : 'NA';
};

const ExpenseInfoCell = ({ label, value, color = '#202432' }: any) => (
  <View style={styles.expenseInfoCell}>
    <AppText size={13} color="#9094A3" family="InterSemiBold" numLines={1}>
      {label}
    </AppText>
    <AppText size={15} color={color} family="InterBold" numLines={1}>
      {value}
    </AppText>
  </View>
);

const ExpenseReport = ({ navigation }: any) => {
  const [mode, setMode] = useState<'my' | 'approval'>('my');
  const [status, setStatus] = useState<any>('');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [approvalSummaryExpenses, setApprovalSummaryExpenses] = useState<any[]>([]);
  const [approvalStatuses, setApprovalStatuses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCal, setShowCal] = useState(false);
  const [rangeType, setRangeType] = useState('currentMonth');
  const [startDate, setStartDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [endDate, setEndDate] = useState<Date>(() => new Date());

  const userOptions = useMemo(() => {
    const normalized = users.map((item: any) => ({
      label: item?.name || item?.user_name || item?.label || `User ${item?.id || item?.user_id}`,
      value: item?.id || item?.user_id || item?.value,
    })).filter(item => item.value);

    return [{ label: 'All Users', value: '' }, ...normalized];
  }, [users]);

  const approvalSummary = useMemo(() => {
    const options = [{ label: 'All', value: '' }, ...approvalStatuses];
    return options.map((option) => {
      const list = option.value === ''
        ? approvalSummaryExpenses
        : approvalSummaryExpenses.filter((item) => matchesExactStatus(getExpenseStatus(item), option.value));

      const amount = list.reduce((sum, item) => sum + getExpenseAmount(item), 0);

      return {
        ...option,
        count: list.length,
        amount,
      };
    });
  }, [approvalStatuses, approvalSummaryExpenses]);

  const statusOptions = useMemo(() => approvalSummary.map(item => ({
    ...item,
    displayLabel: `${item.label} · ${item.count} · ₹${formatAmount(item.amount)}`,
  })), [approvalSummary]);

  const fetchExpenses = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params: any = {
        pageSize: 100,
      };
      if (status !== '') params.status = status;
      if (mode === 'approval') {
        if (selectedUser) params.user_id = selectedUser;
        if (startDate && endDate) {
          params.start_date = formatYYYYMMDD(startDate);
          params.end_date = formatYYYYMMDD(endDate);
        }
      }

      const res = mode === 'approval'
        ? await getAllExpensesApi(params)
        : await getMyExpensesApi(params);

      const payload = res?.data || {};
      const listPayload = payload?.data;
      const list = Array.isArray(listPayload) ? listPayload : (listPayload?.data || []);

      setExpenses(list || []);
      if (mode === 'approval') {
        setUsers(payload?.users || []);
        setApprovalStatuses(current => current.length ? current : getApprovalStatusOptions());
      }
    } catch (error: any) {
      console.log('Expense listing error:', error?.response || error);
      setExpenses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [endDate, mode, selectedUser, startDate, status]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const fetchApprovalSummary = useCallback(async () => {
    if (mode !== 'approval') {
      setApprovalSummaryExpenses([]);
      setApprovalStatuses([]);
      return;
    }

    try {
      const params: any = { pageSize: 100 };
      if (selectedUser) params.user_id = selectedUser;
      if (startDate && endDate) {
        params.start_date = formatYYYYMMDD(startDate);
        params.end_date = formatYYYYMMDD(endDate);
      }
      const res = await getAllExpensesApi(params);
      const payload = res?.data || {};
      const listPayload = payload?.data;
      const list = Array.isArray(listPayload) ? listPayload : (listPayload?.data || []);
      setApprovalSummaryExpenses(list || []);
      setApprovalStatuses(getApprovalStatusOptions());
      setUsers(payload?.users || []);
    } catch (error: any) {
      console.log('Expense summary error:', error?.response || error);
      setApprovalSummaryExpenses([]);
    }
  }, [endDate, mode, selectedUser, startDate]);

  useEffect(() => {
    fetchApprovalSummary();
  }, [fetchApprovalSummary]);

  const handleApplyDateRange = (start: Date | null, end: Date | null, type: string) => {
    if (start) setStartDate(start);
    if (end) setEndDate(end);
    setRangeType(type || 'custom');
    setShowCal(false);
  };

  const renderExpenseCard = ({ item }: any) => {
    const currentStatus = getExpenseStatus(item);
    const decisionReason = getExpenseDecisionReason(item);
    const showDecisionReason = shouldShowDecisionReason(currentStatus) && Boolean(decisionReason);
    const rejected = normalizeStatusText(currentStatus) === '2' || normalizeStatusText(currentStatus) === 'rejected';

    return (
    <Pressable
      style={[styles.expenseCard, shadowStyle]}
      onPress={() => navigation.navigate('ExpenseDetails', { expense: item, mode })}
    >
      <View style={styles.expenseCardHeader}>
        <View style={styles.expenseTitleBlock}>
          <AppText color="#202432" family="InterBold" size={18} numLines={1}>
            {item?.expenses_type_name || item?.expenses_type || 'Expense'}
          </AppText>
          <AppText color="#9094A3" family="InterSemiBold" size={14} numLines={1}>
            {item?.user_name || item?.name || 'My Expense'} · #{item?.id}
          </AppText>
        </View>
        <View style={styles.expenseIdBlock}>
          <AppText color="#9094A3" family="InterSemiBold" size={13}>
            Expense Id
          </AppText>
          <AppText color="#333F82" family="InterBold" size={18}>
            #{item?.id}
          </AppText>
        </View>
      </View>

      <View style={styles.expenseDivider} />

      <View style={styles.expenseGrid}>
        <ExpenseInfoCell label="Date" value={formatDate(item?.date)} />
        <ExpenseInfoCell label="Attachment" value={getExpenseImageCount(item)} />
        <ExpenseInfoCell
          label="Status"
          value={statusLabel(currentStatus)}
          color={statusColor(currentStatus)}
        />
        <ExpenseInfoCell label="Rate" value={displayValue(item?.rate ? `₹ ${formatAmount(item?.rate)}` : item?.rate)} />
        <ExpenseInfoCell label="Claim Amt" value={`₹ ${formatAmount(item?.claim_amount)}`} />
        <ExpenseInfoCell
          label="Approve Amt"
          value={item?.approve_amount ? `₹ ${formatAmount(item?.approve_amount)}` : '—'}
          color={item?.approve_amount ? '#202432' : '#1E8E3E'}
        />
      </View>

      {showDecisionReason && (
        <View style={[styles.expenseReasonBox, rejected && styles.expenseReasonBoxRejected]}>
          <AppText
            size={13}
            color={rejected ? '#D93025' : '#1E8E3E'}
            family="InterBold"
          >
            REASON
          </AppText>
          <AppText size={15} color="#202432" family="InterMedium">
            {decisionReason}
          </AppText>
        </View>
      )}

      <View style={styles.expenseActionRow}>
        <Pressable
          style={styles.expenseViewButton}
          onPress={() => navigation.navigate('ExpenseDetails', { expense: item, mode })}
        >
          <AppText size={15} color="#333F82" family="InterBold">View</AppText>
          <AppText size={20} color="#333F82" family="InterBold">›</AppText>
        </Pressable>
      </View>
    </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: rw(18), paddingTop: 15 }}>
        <View style={[styles.row, { gap: 10 }]}>
          <Pressable
            style={[styles.modeChip, mode === 'my' && styles.modeChipActive]}
            onPress={() => {
              setMode('my');
              setStatus('');
              setSelectedUser('');
            }}
          >
            <AppText size={14} family="InterSemiBold" color={mode === 'my' ? colors.white : colors.blue}>
              My Expenses
            </AppText>
          </Pressable>
          <Pressable
            style={[styles.modeChip, mode === 'approval' && styles.modeChipActive]}
            onPress={() => {
              setMode('approval');
              setStatus('');
            }}
          >
            <AppText size={14} family="InterSemiBold" color={mode === 'approval' ? colors.white : colors.blue}>
              Approvals
            </AppText>
          </Pressable>
        </View>

        {mode === 'approval' && (
          <View style={[styles.row, { gap: 13, marginTop: 15 }]}>
            <Dropdown
              style={[styles.UserBox, { flex: 1 }]}
              placeholderStyle={{ color: '#718096', fontSize: 14 }}
              selectedTextStyle={{ color: colors.black, fontSize: 14 }}
              inputSearchStyle={{ height: 40, fontSize: 14 }}
              data={userOptions}
              search
              searchPlaceholder="Search user..."
              labelField="label"
              valueField="value"
              placeholder="All Users"
              value={selectedUser}
              onChange={(item) => setSelectedUser(item.value)}
              renderRightIcon={() => <ArrowDownIcon />}
            />
          </View>
        )}

        {mode === 'approval' && (
          <Pressable style={[styles.UserBox, styles.expenseDateFilter]} onPress={() => setShowCal(true)}>
            <View style={styles.expenseDateTextBlock}>
              <AppText size={12} color="#9094A3" family="InterSemiBold">
                Date Range
              </AppText>
              <AppText size={14} color="#202432" family="InterBold" numLines={1}>
                {formatYYYYMMDD(startDate)} to {formatYYYYMMDD(endDate)}
              </AppText>
            </View>
            <View style={styles.expenseDateIconBox}>
              <CalenderIcon size={16} color={colors.blue} />
            </View>
          </Pressable>
        )}

        {mode === 'approval' && (
          <View style={styles.expenseStatusFilterRow}>
            <Dropdown
              style={styles.expenseStatusFilter}
              placeholderStyle={styles.expenseDropdownText}
              selectedTextStyle={styles.expenseDropdownText}
              data={statusOptions}
              labelField="displayLabel"
              valueField="value"
              placeholder="All · 0 · ₹0.00"
              value={status}
              onChange={(item) => setStatus(item.value)}
              renderRightIcon={() => <ArrowDownIcon />}
            />
          </View>
        )}
      </View>

      {loading ? (
        <View style={[styles.container, styles.center]}>
          <ActivityIndicator color={colors.blue} size="large" />
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item, index) => `${item?.id || index}`}
          renderItem={renderExpenseCard}
          style={{ paddingHorizontal: rw(18), marginTop: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchExpenses(true)} />
          }
          ListEmptyComponent={() => (
            <View style={[styles.center, { paddingTop: 80 }]}>
              <AppText size={15} color="#718096" family="InterMedium">No expenses found</AppText>
            </View>
          )}
          ListFooterComponent={() => <View style={{ height: 120 }} />}
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('AddNewExpense')}
      >
        <PlusAddIcon color="white" />
      </Pressable>

      <CustomerCalendar
        showCal={showCal}
        setShowCal={setShowCal}
        minimumDate={new Date(2000, 0, 1)}
        initialStartDate={startDate}
        initialEndDate={endDate}
        setStartDates={setStartDate}
        setEndDates={setEndDate}
        setRange={setRangeType}
        range={rangeType}
        onApplyClick={handleApplyDateRange}
      />
    </View>
  );
};

export default ExpenseReport;
