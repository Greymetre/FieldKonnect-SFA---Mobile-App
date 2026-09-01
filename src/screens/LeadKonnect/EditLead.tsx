import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import AppText from '../../components/AppText/AppText';
import { colors } from '../../utils/Colors';
import { fonts } from '../../utils/typography';
import { getLeadDetailsApi, getLeadStatusSourceApi, updateLeadApi } from '../../api/query/LeadApi';
import { useGetPincodeListAPi } from '../../api/query/CustomerApi';

const EditLead = ({ route, navigation }: any) => {
  const lead = route?.params?.lead || {};
  const [form, setForm] = useState<any>({ assignTo: '', firm: '', customer: '', website: '', mobile: '', email: '', address: '', pin: '', city: '', state: '', district: '', note: '', status: 0, source: '', pincodeId: '', cityId: '', stateId: '', districtId: '' });
  const [users, setUsers] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cityOptions, setCityOptions] = useState<any[]>([]);
  const { mutateAsync: getPincodeDetails } = useGetPincodeListAPi();
  const [atCustomerPlace, setAtCustomerPlace] = useState(false);
  const update = (key: string, value: any) => setForm(current => ({ ...current, [key]: value }));

  const resolvePincode = async (pin: string) => {
    if (pin.length !== 6) return;
    try {
      const response = await getPincodeDetails(pin);
      const data = response?.data;
      if (!data?.pincode) return;
      const multipleCities = Array.isArray(data.cities) && data.cities.length > 1;
      const options = multipleCities ? data.cities.map((city: any, index: number) => ({ label: city?.city || String(city), value: data.city_ids?.[index] || city?.city_id })) : [];
      setCityOptions(options.filter((item: any) => item.label && item.value));
      setForm((current: any) => ({ ...current, pin, pincodeId: data.pincode_id || '', state: data.state || '', stateId: data.state_id || '', district: data.district || '', districtId: data.district_id || '', city: multipleCities ? '' : data.city || '', cityId: multipleCities ? '' : data.city_id || '' }));
    } catch {
      Alert.alert('Invalid PIN code', 'Location details could not be found for this PIN code.');
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [detailResponse, optionResponse] = await Promise.all([getLeadDetailsApi(lead.id), getLeadStatusSourceApi()]);
        const data = detailResponse?.data?.data || {};
        const options = optionResponse?.data?.data || {};
        setUsers((options.users || []).map((item: any) => ({ label: item.name, value: item.id })));
        setStatuses([
          { label: 'Pending', value: 0 },
          ...(options.status || []).map((item: any) => ({ label: item.display_name, value: item.id })),
        ]);
        setSources((options.source || []).map((item: any) => ({ label: item.value || item.key, value: item.key || item.value })));
        setForm({ assignTo: data.assign_user_id || '', firm: data.company_name || '', customer: data.contact_name || '', website: data.website || '', mobile: data.phone_number || '', email: data.email || '', address: data.address || '', pin: data.pincode || '', city: data.city || '', state: data.state || '', district: data.district || '', note: data.note || '', status: data.status_id ?? 0, source: data.lead_source || '', pincodeId: data.pincode_id || '', cityId: data.city_id || '', stateId: data.state_id || '', districtId: data.district_id || '' });
      } catch {
        Alert.alert('Unable to load lead', 'Please try again.');
      } finally {
        setLoading(false);
      }
    };
    if (lead.id) load();
    else {
      setLoading(false);
      Alert.alert('Lead unavailable', 'A valid lead was not provided.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    }
  }, [lead.id]);

  const handleUpdate = async () => {
    if (!form.assignTo || !form.firm.trim() || !form.customer.trim() || form.mobile.length !== 10 || !form.source) {
      Alert.alert('Check required fields', 'Assign To, firm name, customer name, valid mobile number and lead source are required.');
      return;
    }
    try {
      setSubmitting(true);
      await updateLeadApi({ lead_id: lead.id, assign_to: form.assignTo, company_name: form.firm.trim(), contact_name: form.customer.trim(), website: form.website.trim(), url: form.website.trim(), phone_number: form.mobile, email: form.email.trim(), address: form.address.trim(), pincode_id: form.pincodeId, city_id: form.cityId, state_id: form.stateId, district_id: form.districtId, note: form.note.trim(), status: form.status, lead_source: form.source, on_location: atCustomerPlace ? 1 : 0 });
      Alert.alert('Lead Updated', 'Lead details updated successfully.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      const message = error?.response?.data?.message;
      Alert.alert('Update failed', typeof message === 'string' ? message : 'Please check the details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <View style={styles.loadingState}><ActivityIndicator size="large" color={colors.blue} /><AppText size={14} color="#687086" family="InterMedium">Loading lead...</AppText></View>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.introCard}>
          <View style={styles.introIcon}><EditIcon type="edit" color="white" size={24} /></View>
          <View style={{ flex: 1 }}>
            <AppText size={18} color="white" family="InterBold">Update Lead Information</AppText>
            <AppText size={13} color="white" family="InterRegular" opacity={0.78}>Review the details below before saving changes.</AppText>
          </View>
        </View>

        <FormSection title="Assignment" subtitle="Choose the employee responsible for this lead">
          <FieldLabel label="Assign To" required />
          <View style={styles.dropdownWrap}>
            <EditIcon type="user" />
            <Dropdown style={styles.dropdown} data={users} labelField="label" valueField="value" value={form.assignTo} onChange={item => update('assignTo', item.value)} placeholder="Select user" placeholderStyle={styles.placeholder} selectedTextStyle={styles.selectedText} />
          </View>
        </FormSection>

        <FormSection title="Basic Information" subtitle="Business and primary contact details">
          <EditField icon="firm" label="Firm Name" value={form.firm} onChangeText={(value: string) => update('firm', value)} required />
          <EditField icon="user" label="Customer Name" value={form.customer} onChangeText={(value: string) => update('customer', value)} required />
          <EditField icon="website" label="Company Website" value={form.website} onChangeText={(value: string) => update('website', value)} autoCapitalize="none" keyboardType="url" />
          <FieldLabel label="Lead Status" required />
          <Dropdown style={styles.standaloneDropdown} data={statuses} labelField="label" valueField="value" value={form.status} onChange={item => update('status', item.value)} placeholder="Select status" placeholderStyle={styles.placeholder} selectedTextStyle={styles.selectedText} />
          <FieldLabel label="Lead Source" required />
          <Dropdown style={styles.standaloneDropdown} data={sources} labelField="label" valueField="value" value={form.source} onChange={item => update('source', item.value)} placeholder="Select source" placeholderStyle={styles.placeholder} selectedTextStyle={styles.selectedText} />
        </FormSection>

        <FormSection title="Contact & Communication" subtitle="Ways to connect with the customer">
          <EditField icon="phone" label="Mobile Number" value={form.mobile} onChangeText={(value: string) => update('mobile', value.replace(/[^0-9]/g, '').slice(0, 10))} keyboardType="phone-pad" required />
          <EditField icon="email" label="Email Address" value={form.email} onChangeText={(value: string) => update('email', value)} keyboardType="email-address" autoCapitalize="none" />
        </FormSection>

        <FormSection title="Address Information" subtitle="Lead location and service area">
          <EditField icon="location" label="Address" value={form.address} onChangeText={(value: string) => update('address', value)} multiline />
          <EditField icon="pin" label="PIN Code" value={form.pin} onChangeText={(value: string) => { const pin = value.replace(/[^0-9]/g, '').slice(0, 6); update('pin', pin); if (pin.length === 6) resolvePincode(pin); }} keyboardType="number-pad" />
          {cityOptions.length > 1 ? <><FieldLabel label="City" /><Dropdown style={styles.standaloneDropdown} data={cityOptions} labelField="label" valueField="value" value={form.cityId} onChange={item => setForm((current: any) => ({ ...current, cityId: item.value, city: item.label }))} placeholder="Select city" placeholderStyle={styles.placeholder} selectedTextStyle={styles.selectedText} /></> : <EditField icon="city" label="City" value={form.city} editable={false} />}
          <EditField icon="state" label="State" value={form.state} editable={false} />
          <EditField icon="district" label="District" value={form.district} editable={false} />
        </FormSection>

        <FormSection title="Additional Information" subtitle="Notes and visit context">
          <EditField icon="note" label="Note" value={form.note} onChangeText={(value: string) => update('note', value)} multiline large />
          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <AppText size={15} color="#202432" family="InterSemiBold">Are you at customer's place?</AppText>
              <AppText size={12} color="#858DA0" family="InterRegular">Enable when updating from the lead location</AppText>
            </View>
            <Switch value={atCustomerPlace} onValueChange={setAtCustomerPlace} trackColor={{ false: '#DDE1E8', true: colors.blue + '70' }} thumbColor={atCustomerPlace ? colors.blue : '#FFFFFF'} ios_backgroundColor="#DDE1E8" />
          </View>
        </FormSection>

        <Pressable style={[styles.updateButton, submitting && { opacity: 0.65 }]} onPress={handleUpdate} disabled={submitting}>
          {submitting ? <ActivityIndicator color="white" /> : <EditIcon type="save" color="white" />}
          <AppText size={16} color="white" family="InterBold">{submitting ? 'Updating...' : 'Update Lead'}</AppText>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const FormSection = ({ title, subtitle, children }: any) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.marker} />
      <View style={{ flex: 1 }}>
        <AppText size={16} color="#202432" family="InterBold">{title}</AppText>
        <AppText size={12} color="#858DA0" family="InterRegular">{subtitle}</AppText>
      </View>
    </View>
    <View style={styles.fields}>{children}</View>
  </View>
);

const FieldLabel = ({ label, required = false }: any) => (
  <AppText size={13} color="#4E586D" family="InterSemiBold">{label}{required ? ' *' : ''}</AppText>
);

const EditField = ({ icon, label, required, multiline, large, ...props }: any) => (
  <View>
    <FieldLabel label={label} required={required} />
    <View style={[styles.inputWrap, multiline && styles.inputWrapMultiline, large && styles.inputWrapLarge]}>
      <View style={styles.inputIcon}><EditIcon type={icon} size={19} /></View>
      <TextInput {...props} style={[styles.input, multiline && styles.multilineInput]} placeholder={`Enter ${label.toLowerCase()}`} placeholderTextColor="#A0A7B5" multiline={multiline} textAlignVertical={multiline ? 'top' : 'center'} />
    </View>
  </View>
);

const EditIcon = ({ type, size = 20, color = colors.blue }: any) => {
  const line = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const icons: Record<string, React.ReactNode> = {
    edit: <><Path d="M4 20h4L19 9l-4-4L4 16v4z" {...line} /><Path d="M13 7l4 4" {...line} /></>,
    user: <><Circle cx="12" cy="8" r="4" {...line} /><Path d="M4 21c.6-5 3-7 8-7s7.4 2 8 7" {...line} /></>,
    firm: <><Path d="M4 21V8h16v13M7 8V4h10v4M8 12h2m4 0h2m-8 4h2m4 0h2" {...line} /></>,
    website: <><Circle cx="12" cy="12" r="9" {...line} /><Path d="M3 12h18M12 3c3 3 3 15 0 18m0-18c-3 3-3 15 0 18" {...line} /></>,
    phone: <Path d="M7 3l3 4-2 2c1.5 3 3.5 5 7 7l2-2 4 3-1 3c-.4 1-1.5 1.5-2.5 1.2C9 18.5 5.5 15 2.8 6.5 2.5 5.5 3 4.4 4 4l3-1z" {...line} />,
    email: <><Rect x="3" y="5" width="18" height="14" rx="2" {...line} /><Path d="M4 7l8 6 8-6" {...line} /></>,
    location: <><Path d="M12 22s7-6 7-13a7 7 0 10-14 0c0 7 7 13 7 13z" {...line} /><Circle cx="12" cy="9" r="2" {...line} /></>,
    pin: <><Rect x="3" y="5" width="18" height="14" rx="2" {...line} /><Path d="M7 9h2m2 0h2m2 0h2M7 13h2m2 0h2m2 0h2" {...line} /></>,
    city: <Path d="M4 21V9h6v12M10 21V4h10v17M7 13v2m7-7v2m3-2v2m-3 4v2m3-2v2" {...line} />,
    state: <><Path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z" {...line} /><Path d="M9 3v15m6-12v15" {...line} /></>,
    district: <><Path d="M4 6h16M4 12h16M4 18h16" {...line} /><Circle cx="8" cy="6" r="2" fill="white" {...line} /><Circle cx="16" cy="12" r="2" fill="white" {...line} /></>,
    note: <><Path d="M4 3h16v14l-4 4H4V3z" {...line} /><Path d="M16 21v-4h4M8 8h8m-8 4h6" {...line} /></>,
    save: <><Path d="M4 3h14l2 2v16H4V3z" {...line} /><Path d="M8 3v6h8V3M8 21v-7h8v7" {...line} /></>,
  };
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">{icons[type]}</Svg>;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#F4F6FA' },
  content: { padding: 16, paddingBottom: 38 },
  introCard: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 16, padding: 17, borderRadius: 18, backgroundColor: colors.blue, elevation: 4, shadowColor: colors.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 9 },
  introIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  card: { marginBottom: 14, padding: 17, borderRadius: 18, backgroundColor: 'white', borderWidth: 1, borderColor: '#E7EAF0', elevation: 2, shadowColor: '#17203A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 17 },
  marker: { width: 4, height: 34, borderRadius: 2, backgroundColor: colors.blue },
  fields: { gap: 15 },
  inputWrap: { minHeight: 52, flexDirection: 'row', alignItems: 'center', marginTop: 7, borderWidth: 1, borderColor: '#D9DEE8', borderRadius: 12, backgroundColor: '#F9FAFC', overflow: 'hidden' },
  inputWrapMultiline: { minHeight: 82, alignItems: 'flex-start' },
  inputWrapLarge: { minHeight: 118 },
  inputIcon: { width: 46, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 50, paddingRight: 13, color: '#202432', fontSize: 14, fontFamily: fonts.InterMedium },
  multilineInput: { minHeight: 78, paddingTop: 15 },
  dropdownWrap: { height: 54, flexDirection: 'row', alignItems: 'center', marginTop: 7, paddingLeft: 13, borderWidth: 1, borderColor: colors.blue + '55', borderRadius: 12, backgroundColor: colors.blue + '08' },
  dropdown: { flex: 1, height: 52, paddingHorizontal: 12 },
  placeholder: { color: '#A0A7B5', fontSize: 14, fontFamily: fonts.InterRegular },
  selectedText: { color: '#202432', fontSize: 14, fontFamily: fonts.InterSemiBold },
  standaloneDropdown: { height: 52, marginTop: -8, borderWidth: 1, borderColor: '#D9DEE8', borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#F9FAFC' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  toggleText: { flex: 1, gap: 3 },
  updateButton: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, backgroundColor: colors.blue, elevation: 4, shadowColor: colors.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.23, shadowRadius: 8 },
});

export default EditLead;
