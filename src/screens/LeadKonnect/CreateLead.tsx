import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import { createLeadApi, getLeadStatusSourceApi } from '../../api/query/LeadApi';
import { useGetPincodeListAPi } from '../../api/query/CustomerApi';
import useLocationHook from '../../api/hooks/uselocationhook';
import { ArrowDownIcon } from '../../assets/svgs/SvgsFile';
import { MinusIcon, PlusIcon } from '../../assets/svgs/HomePageSvgs';
import AppText from '../../components/AppText/AppText';
import CustomToggleRow from '../AddCustomer/CustomToggleRowPage';
import { colors } from '../../utils/Colors';
import { fonts } from '../../utils/typography';

type SectionKey = 'basic' | 'address' | 'additional';

const CreateLead = ({ navigation }: any) => {
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    basic: true,
    address: false,
    additional: false,
  });
  const [form, setForm] = useState({
    company_name: '', website: '', contact_name: '', phone_number: '', email: '',
    status: '' as string | number, lead_source: '', address: '', note: '', other: '',
    pincode_id: '', state_id: '', district_id: '', city_id: '',
  });
  const [pincode, setPincode] = useState('');
  const [additionalPhones, setAdditionalPhones] = useState<string[]>([]);
  const [stateName, setStateName] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [cityName, setCityName] = useState('');
  const [cityOptions, setCityOptions] = useState<any[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [statusOptions, setStatusOptions] = useState<any[]>([]);
  const [sourceOptions, setSourceOptions] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { mutateAsync: getPincodeDetails } = useGetPincodeListAPi();
  const { coords, loading: locationLoading } = useLocationHook();

  const updateField = (key: string, value: any) =>
    setForm(current => ({ ...current, [key]: value }));

  const toggleSection = (key: SectionKey) =>
    setExpanded(current => ({ ...current, [key]: !current[key] }));

  const loadOptions = useCallback(async () => {
    try {
      setLoadingOptions(true);
      const response = await getLeadStatusSourceApi();
      const data = response?.data?.data || {};
      setStatusOptions((data.status || []).map((item: any) => ({
        label: item.display_name || item.status_name || item.name,
        value: item.id,
      })));
      setSourceOptions((data.source || []).map((item: any) => ({
        label: item.value || item.key,
        value: item.key || item.value,
      })));
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error?.response?.data?.message || 'Could not load lead options' });
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => { loadOptions(); }, [loadOptions]);

  useEffect(() => {
    if (useCurrentLocation && coords) {
      Toast.show({ type: 'success', text1: 'Current location captured' });
    }
  }, [coords, useCurrentLocation]);

  const resolvePincode = async (value: string) => {
    if (value.length !== 6) return;
    try {
      setPincodeLoading(true);
      const response = await getPincodeDetails(value);
      const data = response?.data;
      if (response?.status === 200 && data?.pincode) {
        setStateName(data.state || '');
        setDistrictName(data.district || '');
        if (Array.isArray(data.cities) && data.cities.length > 1) {
          const cityDetails = Array.isArray(data.full_data) && data.full_data.length
            ? data.full_data
            : data.cities;
          const options = cityDetails.map((item: any, index: number) => ({
            label: item?.city || String(item || ''),
            value: data.city_ids?.[index] || item?.city_id,
            state: item?.state,
            district: item?.district,
            state_id: item?.state_id,
            district_id: item?.district_id,
          })).filter((item: any) => item.label && item.value);
          setCityOptions(options);
          setShowCityDropdown(true);
          setCityName('');
          setForm(current => ({
            ...current,
            pincode_id: data.pincode_id || '',
            state_id: data.state_id || '',
            district_id: data.district_id || '',
            city_id: '',
          }));
        } else {
          setShowCityDropdown(false);
          setCityOptions([]);
          setCityName(data.city || '');
          setForm(current => ({
            ...current,
            pincode_id: data.pincode_id || '',
            state_id: data.state_id || '',
            district_id: data.district_id || '',
            city_id: data.city_id || '',
          }));
        }
      } else {
        throw new Error('Invalid pincode');
      }
    } catch {
      setStateName(''); setDistrictName(''); setCityName('');
      setShowCityDropdown(false); setCityOptions([]);
      setForm(current => ({ ...current, pincode_id: '', state_id: '', district_id: '', city_id: '' }));
      Toast.show({ type: 'error', text1: 'Invalid Pincode', text2: 'Please enter a correct pincode' });
    } finally {
      setPincodeLoading(false);
    }
  };

  const validate = () => {
    if (!form.company_name.trim()) return 'Please enter firm name';
    if (!form.contact_name.trim()) return 'Please enter contact name';
    if (!/^\d{10}$/.test(form.phone_number)) return 'Please enter a valid 10-digit phone number';
    if (additionalPhones.some(number => !/^\d{10}$/.test(number))) return 'Please complete all additional mobile numbers';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email';
    if (pincode && pincode.length !== 6) return 'Please enter a valid 6-digit pincode';
    if (showCityDropdown && !form.city_id) return 'Please select a city';
    if (form.status === '') return 'Please select lead status';
    if (!form.lead_source) return 'Please select lead source';
    return '';
  };

  const submit = async () => {
    const validationError = validate();
    if (validationError) {
      Toast.show({ type: 'error', text1: validationError });
      return;
    }
    try {
      setSubmitting(true);
      const payload: any = {
        ...form,
        company_name: form.company_name.trim(),
        contact_name: form.contact_name.trim(),
        address: form.address.trim(),
        note: form.note.trim(),
        website: form.website.trim(),
        email: form.email.trim(),
        on_location: useCurrentLocation ? 1 : 0,
        phone_numbers: [form.phone_number, ...additionalPhones].filter(Boolean),
      };
      if (useCurrentLocation && coords) {
        payload.latitude = Number(coords.latitude.toFixed(6));
        payload.longitude = Number(coords.longitude.toFixed(6));
      }
      const response = await createLeadApi(payload);
      if (response?.data?.status === 'success') {
        Toast.show({ type: 'success', text1: response.data.message || 'Lead created successfully' });
        navigation.goBack();
      } else {
        Toast.show({ type: 'error', text1: response?.data?.message || 'Could not create lead' });
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: typeof error?.response?.data?.message === 'string' ? error.response.data.message : 'Could not create lead' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.leadTypeCard}>
          <View style={styles.leadTypeBanner}>
            <AppText size={16} color={colors.blue} family="InterBold">
              Lead Type: {statusOptions.find(item => String(item.value) === String(form.status))?.label || 'Not selected'}
            </AppText>
          </View>
          <LeadDropdown
            placeholder={loadingOptions ? 'Loading lead types...' : 'Lead Type'}
            data={statusOptions}
            value={form.status}
            onChange={(v: any) => updateField('status', v)}
            loading={loadingOptions}
            icon="type"
            standalone
          />
        </View>

        <Accordion title="Basic Information" expanded={expanded.basic} onToggle={() => toggleSection('basic')}>
          <View style={styles.progressBlock}>
            <AppText size={15} color={form.company_name && form.contact_name && form.phone_number.length === 10 ? '#22C55E' : '#718096'} family="InterSemiBold">
              {[Boolean(form.company_name), Boolean(form.contact_name), form.phone_number.length === 10].filter(Boolean).length}/3 completed
            </AppText>
          </View>
          <FormInput icon="firm" placeholder="Firm Name *" value={form.company_name} onChangeText={(v: string) => updateField('company_name', v)} />
          <FormInput icon="user" placeholder="Customer Name *" value={form.contact_name} onChangeText={(v: string) => updateField('contact_name', v)} />
          <AppText size={14} color={colors.black} family="InterSemiBold" style={styles.fieldLabel}>Mobile Number *</AppText>
          <View style={styles.phoneRow}>
            <FormInput wrapperStyle={styles.phoneInput} icon="phone" placeholder="Enter 10-digit number" value={form.phone_number} onChangeText={(v: string) => updateField('phone_number', v.replace(/\D/g, ''))} keyboardType="phone-pad" maxLength={10} />
            <Pressable style={styles.addPhoneButton} onPress={() => setAdditionalPhones(current => [...current, ''])}>
              <AppText size={14} color={colors.blue} family="InterBold">Add</AppText>
            </Pressable>
          </View>
          {additionalPhones.map((number, index) => (
            <View style={styles.phoneRow} key={`phone-${index}`}>
              <FormInput wrapperStyle={styles.phoneInput} icon="phone" placeholder={`Additional number ${index + 1}`} value={number} onChangeText={(value: string) => setAdditionalPhones(current => current.map((item, itemIndex) => itemIndex === index ? value.replace(/\D/g, '') : item))} keyboardType="phone-pad" maxLength={10} />
              <Pressable style={styles.removePhoneButton} onPress={() => setAdditionalPhones(current => current.filter((_, itemIndex) => itemIndex !== index))}>
                <AppText size={18} color="#D93025" family="InterBold">−</AppText>
              </Pressable>
            </View>
          ))}
          <FormInput icon="email" placeholder="Email Id" value={form.email} onChangeText={(v: string) => updateField('email', v)} keyboardType="email-address" autoCapitalize="none" />
          <FormInput icon="website" placeholder="Website" value={form.website} onChangeText={(v: string) => updateField('website', v)} keyboardType="url" autoCapitalize="none" />
        </Accordion>

        <Accordion title="Address Information" expanded={expanded.address} onToggle={() => toggleSection('address')}>
          <FormInput icon="location" placeholder="Address" value={form.address} onChangeText={(v: string) => updateField('address', v)} />
          <View style={styles.inputBox}>
            <FieldIcon value="pin" />
            <TextInput placeholder="Pin *" placeholderTextColor="#718096" value={pincode} maxLength={6} keyboardType="numeric" style={styles.textInput} onChangeText={(value) => {
                const numeric = value.replace(/\D/g, ''); setPincode(numeric);
                if (numeric.length < 6) {
                  setStateName(''); setDistrictName(''); setCityName('');
                  setShowCityDropdown(false); setCityOptions([]);
                  setForm(current => ({ ...current, pincode_id: '', state_id: '', district_id: '', city_id: '' }));
                }
                resolvePincode(numeric);
              }} />
            {pincodeLoading && <ActivityIndicator size="small" color={colors.blue} />}
          </View>
          {showCityDropdown ? (
            <View style={styles.dropdownWrap}>
              <FieldIcon value="city" />
              <Dropdown style={styles.dropdown} data={cityOptions} value={form.city_id} labelField="label" valueField="value" placeholder="Select City *" placeholderStyle={styles.placeholder} selectedTextStyle={styles.selectedText} onChange={(item) => {
                  setCityName(item.label); setStateName(item.state || stateName); setDistrictName(item.district || districtName);
                  setForm(current => ({ ...current, city_id: item.value, state_id: item.state_id || current.state_id, district_id: item.district_id || current.district_id }));
                }} renderRightIcon={() => <ArrowDownIcon />} />
            </View>
          ) : (
            <FormInput icon="city" placeholder="City" value={cityName} editable={false} />
          )}
          <FormInput icon="state" placeholder="State" value={stateName} editable={false} />
          <FormInput icon="district" placeholder="District" value={districtName} editable={false} />
        </Accordion>

        <Accordion title="Additional Information" expanded={expanded.additional} onToggle={() => toggleSection('additional')}>
          <FormInput icon="other" placeholder="Other" value={form.other} onChangeText={(v: string) => updateField('other', v)} />
          <LeadDropdown placeholder={loadingOptions ? 'Loading sources...' : 'Lead Source'} data={sourceOptions} value={form.lead_source} onChange={(v: any) => updateField('lead_source', v)} icon="source" />
          <FormInput placeholder="Note" value={form.note} onChangeText={(v: string) => updateField('note', v)} multiline />
        </Accordion>

        <View style={styles.locationCard}>
          <CustomToggleRow
            label="Are you at customer's place?"
            value={useCurrentLocation}
            disabled={locationLoading && !coords}
            onValueChange={setUseCurrentLocation}
            plain
          />
          {useCurrentLocation && (
            <AppText size={12} color={coords ? '#22C55E' : '#718096'} family="InterMedium" style={{ marginTop: 8 }}>
              {coords ? `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}` : 'Fetching current location...'}
            </AppText>
          )}
        </View>

        <Pressable style={[styles.submitButton, submitting && { opacity: 0.6 }]} disabled={submitting || loadingOptions} onPress={submit}>
          {submitting ? <ActivityIndicator color="white" /> : <AppText size={16} color="white" family="InterBold">Create Lead</AppText>}
        </Pressable>
      </ScrollView>
    </View>
  );
};

const Accordion = ({ title, expanded, onToggle, children }: any) => (
  <View style={styles.sectionWrapper}>
    {!expanded ? (
      <TouchableOpacity style={styles.collapsedHeader} onPress={onToggle}>
        <AppText size={17} color={colors.black} family="InterBold">{title}</AppText><View style={styles.iconCircle}><PlusIcon /></View>
      </TouchableOpacity>
    ) : (
      <View style={styles.sectionContent}>
        <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
          <AppText size={17} color={colors.black} family="InterBold">{title}</AppText><View style={styles.iconCircle}><MinusIcon /></View>
        </TouchableOpacity>
        {children}
      </View>
    )}
  </View>
);

const LeadDropdown = ({ placeholder, data, value, onChange, loading, icon, standalone }: any) => (
  <View style={[styles.dropdownWrap, standalone && styles.standaloneDropdown]}>
    {icon && <FieldIcon value={icon} />}
    <Dropdown style={styles.dropdown} placeholderStyle={styles.placeholder} selectedTextStyle={styles.selectedText} data={data} labelField="label" valueField="value" placeholder={placeholder} value={value} onChange={item => onChange(item.value)} renderRightIcon={() => loading ? <ActivityIndicator size="small" color={colors.blue} /> : <ArrowDownIcon />} />
  </View>
);

const FieldIcon = ({ value }: { value: string }) => {
  const common = { stroke: '#667085', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const paths: Record<string, React.ReactNode> = {
    type: <><Circle cx="8" cy="8" r="2.5" {...common} /><Circle cx="16" cy="8" r="2.5" {...common} /><Rect x="5.5" y="14" width="5" height="5" rx="1" {...common} /><Rect x="13.5" y="14" width="5" height="5" rx="1" {...common} /></>,
    firm: <><Path d="M4 20V8h16v12M7 8V4h10v4M8 12v2m4-2v2m4-2v2M8 18h8" {...common} /></>,
    user: <><Circle cx="12" cy="8" r="3" {...common} /><Path d="M5 20c.6-4 3-6 7-6s6.4 2 7 6" {...common} /></>,
    phone: <Path d="M7 3l3 4-2 2c1.5 3 3.5 5 7 7l2-2 4 3-1 3c-.4 1-1.5 1.5-2.5 1.2C9 18.5 5.5 15 2.8 6.5 2.5 5.5 3 4.4 4 4l3-1z" {...common} />,
    email: <><Rect x="3" y="5" width="18" height="14" rx="2" {...common} /><Path d="M4 7l8 6 8-6" {...common} /></>,
    website: <><Circle cx="12" cy="12" r="9" {...common} /><Path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" {...common} /></>,
    location: <><Path d="M12 22s7-6 7-13a7 7 0 10-14 0c0 7 7 13 7 13z" {...common} /><Circle cx="12" cy="9" r="2.3" {...common} /></>,
    pin: <><Rect x="3" y="5" width="18" height="14" rx="2" {...common} /><Path d="M7 9h2m2 0h2m2 0h2M7 14h2m2 0h2m2 0h2" {...common} /></>,
    city: <><Path d="M4 21V9h6v12M10 21V4h10v17M7 12v2m0 3v1m7-10v2m3-2v2m-3 4v2m3-2v2" {...common} /></>,
    state: <Path d="M4 5l5-2 6 3 5-2v15l-5 2-6-3-5 2V5zm5-2v15m6-12v15" {...common} />,
    district: <><Path d="M4 7h16M4 12h16M4 17h16M8 4v6m8 0v5m-6 0v5" {...common} /></>,
    other: <><Path d="M4 6h12M4 10h9M4 14h6M15 16l4-4 2 2-4 4-3 1 1-3z" {...common} /></>,
    source: <><Circle cx="12" cy="5" r="2" {...common} /><Circle cx="5" cy="16" r="2" {...common} /><Circle cx="19" cy="16" r="2" {...common} /><Path d="M12 7v5M7 15l5-3 5 3" {...common} /></>,
  };
  return <View style={styles.fieldIcon}><Svg width={22} height={22} viewBox="0 0 24 24" fill="none">{paths[value] || paths.other}</Svg></View>;
};

const FormInput = ({ multiline = false, icon, wrapperStyle, ...props }: any) => (
  <View style={[styles.inputBox, wrapperStyle, multiline && styles.multilineBox]}>
    {icon && <FieldIcon value={icon} />}
    <TextInput {...props} multiline={multiline} placeholderTextColor="#718096" style={[styles.textInput, multiline && styles.multilineInput]} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { paddingTop: 16, paddingBottom: 90 },
  leadTypeCard: { marginHorizontal: 16, marginBottom: 10, borderRadius: 16, backgroundColor: '#fff', padding: 14, shadowColor: '#18213D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  leadTypeBanner: { minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.blue + '12' },
  standaloneDropdown: { marginTop: 12 },
  sectionWrapper: { marginHorizontal: 16, marginVertical: 8, padding: 16, borderRadius: 16, backgroundColor: '#fff', shadowColor: '#18213D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  collapsedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 48 },
  sectionContent: { backgroundColor: '#fff' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.blue + '20', alignItems: 'center', justifyContent: 'center' },
  progressBlock: { alignItems: 'center', marginVertical: 10 },
  fieldLabel: { marginTop: 16 },
  inputBox: { minHeight: 52, marginTop: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#D8DEE9', backgroundColor: '#F7F8FC', justifyContent: 'center', flexDirection: 'row', alignItems: 'center' },
  dropdownWrap: { minHeight: 52, marginTop: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#D8DEE9', backgroundColor: '#F7F8FC', flexDirection: 'row', alignItems: 'center' },
  dropdown: { flex: 1, height: 50 },
  fieldIcon: { width: 30, alignItems: 'flex-start', justifyContent: 'center' },
  textInput: { flex: 1, color: colors.black, fontSize: 14, fontFamily: fonts.InterRegular },
  multilineBox: { minHeight: 92, paddingVertical: 10 },
  multilineInput: { minHeight: 70, textAlignVertical: 'top' },
  placeholder: { color: '#718096', fontSize: 14 },
  selectedText: { color: colors.black, fontSize: 14 },
  phoneRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  phoneInput: { flex: 1 },
  addPhoneButton: { width: 76, minHeight: 52, marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.blue + '55', backgroundColor: colors.blue + '10', alignItems: 'center', justifyContent: 'center' },
  removePhoneButton: { width: 52, minHeight: 52, marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F2B8B5', backgroundColor: '#FDECEC', alignItems: 'center', justifyContent: 'center' },
  locationCard: { marginHorizontal: 16, marginTop: 8, padding: 12, borderRadius: 16, backgroundColor: '#fff', shadowColor: '#18213D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  submitButton: { height: 50, marginTop: 16, marginHorizontal: 16, borderRadius: 12, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', shadowColor: colors.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 7, elevation: 4 },
});

export default CreateLead;
