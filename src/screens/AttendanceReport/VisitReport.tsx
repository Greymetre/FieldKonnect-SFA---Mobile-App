import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { styles } from '../ExpenseReport/styles'; // adjust path
import AppText from '../../components/AppText/AppText';
import { rw } from '../../utils/responsive';
import { colors } from '../../utils/Colors';
import Toast from 'react-native-toast-message';
import { useGetSubmitCheckout } from '../../api/query/CustomerApi'; // ← add this hook
import { ArrowDownIcon } from '../../assets/svgs/SvgsFile';
import axios from 'axios';
import store from '../../components/redux/Store';

interface VisitReportProps {
  navigation: any;
  route: any;
}

interface VisitType {
  id: number;
  name: string; // or 'visit_type_name' depending on actual response
}

const VisitReport: React.FC<VisitReportProps> = ({ navigation, route }) => {
  const { checkin_id, entity_type, entity_id, latitude, longitude, customerData } = route.params || {};
  const customerDetails = customerData?.customerdetails || customerData?.customer_details || {};
  const customerName = [
    customerData?.legal_name,
    customerData?.shop_name,
    customerData?.name,
    customerData?.customer_name,
    customerData?.full_name,
    customerDetails?.legal_name,
    customerDetails?.shop_name,
    customerDetails?.name,
    [customerData?.first_name, customerData?.last_name].filter(Boolean).join(' '),
    customerData?.owner_name,
    customerData?.contact_person,
  ].find((value) => typeof value === 'string' && value.trim())?.trim() || 'Unknown';
  const [description, setDescription] = useState('');
  const [visitType, setVisitType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  console.log(checkin_id, 'checkin_idcheckin_idcheckin_id');
  const { mutateAsync: submitCheckout } = useGetSubmitCheckout(); // your checkout mutation
  const [visitTypes, setVisitTypes] = useState<VisitType[]>([]);
  const [visitTypesLoading, setVisitTypesLoading] = useState(true);
  const [visitTypesError, setVisitTypesError] = useState(false);

  const visitTypeOptions = [
    { label: 'First Time Visit (New Visit)', value: 'First Time Visit (New Visit)' },
    { label: 'New Dealer/Distributor Appointment', value: 'New Dealer/Distributor Appointment' },
    { label: 'For Payment Collection', value: 'For Payment Collection' },
    { label: 'Visit For Order Collection', value: 'Visit For Order Collection' },
    { label: 'Revisit', value: 'Revisit' },
    { label: 'Retailer Visit', value: 'Retailer Visit' },
    { label: 'Dealer Distributor Existing Visit', value: 'Dealer Distributor Existing Visit' },
  ];

  const handleSubmit = async () => {
    if (!description.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Description required',
        text2: 'Please enter visit details',
        position: 'top',
      });
      return;
    }
    
    if (!visitType) {
      Toast.show({ type: 'error', text1: 'Visit Type required', text2: 'Please select a visit type' });
      return;
    }

    if (!checkin_id || !entity_type || !entity_id || latitude == null || longitude == null) {
      Toast.show({
        type: 'error',
        text1: 'Missing data',
        text2: 'Cannot proceed with checkout',
        position: 'top',
      });
      return;
    }

    setLoading(true);

    const payload = {
      checkin_id: checkin_id,
      entity_type: entity_type,
      entity_id: entity_id,
      checkout_latitude: latitude,
      checkout_longitude: longitude,
      description: description.trim(),
      visit_type_id: visitType,
      //   visit_type_id: visitType ? parseInt(visitType) : undefined, // if your API expects ID
      // Optional: next_visit: "2026-03-10 11:00:00" – add if needed
    };

    console.log(payload, 'payloadpayloadpayload');

    try {
      const res = await submitCheckout(payload);
      console.log(res?.data, 'res?.datares?.data');
      if (res?.data?.status === true || res?.data?.status === 'success') {
        Toast.show({
          type: 'success',
          text1: res?.data?.message,
          text2: 'Visit report submitted',
          position: 'top',
          visibilityTime: 3000,
        });

        // Go back to previous screen (CustomerDetails)
        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Checkout failed',
          text2: res?.data?.message || 'Please try again',
          position: 'top',
        });
      }
    } catch (error: any) {
      console.log('Checkout error:', error?.response);
      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: error?.response?.data?.message || 'Could not complete checkout',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Visit Types from API
  useEffect(() => {
    const fetchVisitTypes = async () => {
      try {
        setVisitTypesLoading(true);
        setVisitTypesError(false);
        const token = store.getState().auth?.token;
        const response = await axios.get('https://duke.fieldkonnect.in/api/getVisitTypes', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });

        // Adjust this based on actual API response structure
        const rawData = response.data?.data || [];
        console.log(rawData, 'resssssss')
        const transformedData: VisitType[] = rawData.map((item: any) => ({
          label: item.type_name,
          value: item.type_id,
        }));
        setVisitTypes(transformedData);
      } catch (error: any) {
        console.error('Failed to fetch visit types:', error?.response || error);
        setVisitTypesError(true);
        Toast.show({
          type: 'error',
          text1: 'Failed to load visit types',
          text2: 'Please try again later',
          position: 'top',
        });
      } finally {
        setVisitTypesLoading(false);
      }
    };

    fetchVisitTypes();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        style={[styles.container, { paddingHorizontal: rw(18) }]}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <View style={{ height: 12 }} />
        <AppText size={20} color={colors.black} family="InterBold" >
          Visit Report & Checkout
        </AppText>

        {/* Optional: Show customer name */}
        {customerData && (
          <AppText size={16} color="#555">
            Customer: {customerName}
          </AppText>
        )}

        {/* Visit Type Dropdown */}
        <View style={{ marginTop: rw(24) }}>
          <AppText size={14} color="#000" family="InterBold">
            Visit Type *
          </AppText>
          <Dropdown
            style={[styles.UserBox, { marginTop: rw(8), paddingHorizontal: rw(12) }]}
            placeholderStyle={{ color: '#718096', fontSize: rw(14) }}
            selectedTextStyle={{ color: '#000', fontSize: rw(14) }}
            data={visitTypes}
            maxHeight={300}
            labelField="label"      // ← Using label key
            valueField="value"      // ← Using value key
            placeholder={
              visitTypesLoading
                ? 'Loading visit types...'
                : visitTypesError
                  ? 'Failed to load types'
                  : 'Select visit type'
            }
            value={visitType}
            onChange={(item) => setVisitType(item?.value)}
            renderRightIcon={() => <ArrowDownIcon />}
            disable={visitTypesLoading || visitTypesError}
          />

          {visitTypesError && (
            <AppText size={12} color="red" style={{ marginTop: 4 }}>
              Failed to load visit types. Please refresh.
            </AppText>
          )}
        </View>

        {/* Description */}
        <View style={{ marginTop: rw(24) }}>
          <AppText size={14} color="#000" family="InterBold">
            Description / Remarks *
          </AppText>
          <TextInput
            style={[styles.todayInput, { marginTop: rw(8), minHeight: 120 }]}
            placeholder="Enter details of the visit..."
            placeholderTextColor="#718096"
            multiline
            numberOfLines={6}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Submit Button */}
        <View style={{ height: 70 }} />
        <Pressable
          style={[
            {
              backgroundColor: loading || visitTypesLoading || !visitType ? 'rgba(0,0,0,0.3)' : colors.blue,
              paddingVertical: rw(14),
              borderRadius: rw(12),
              alignItems: 'center',
              marginTop: rw(40),
            },
            loading && { opacity: 0.7 },
          ]}
          onPress={handleSubmit}
          disabled={loading || visitTypesLoading || !visitType}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <AppText size={16} color="white" family="InterSemiBold">
              Submit Report & Check Out
            </AppText>
          )}
        </Pressable>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

export default VisitReport;
