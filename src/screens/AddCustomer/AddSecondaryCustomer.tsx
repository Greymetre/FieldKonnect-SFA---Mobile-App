
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  Platform,
  Pressable,
  PermissionsAndroid,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { rw } from '../../utils/responsive';
import { colors } from '../../utils/Colors';
import AppText from '../../components/AppText/AppText';
import { MinusIcon, PlusIcon, UploadIcon } from '../../assets/svgs/HomePageSvgs';
import { styles } from './styles'; // ← your styles file
import { ArrowDownIcon } from '../../assets/svgs/SvgsFile';
import { Dropdown, MultiSelect } from 'react-native-element-dropdown';
// import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import {
  useGetBeatList,
  useGetCityListApi,
  useGetDistrictListApi,
  useGetPincodeByCityListAPi,
  useGetPincodeListAPi,
  useGetStateListApi,
  useGetCustomerTypesApi,
  useMutateCustomerTypeListApi,
} from '../../api/query/CustomerApi';
import { Asset, ImagePickerResponse, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { normalizeIndianMobileNumber } from '../../utils/phone';
import FastImage from 'react-native-fast-image';
import Toast from 'react-native-toast-message';
import store from '../../components/redux/Store';
import { BASE_URL, resolveMediaUrl } from '../../api/AxiosClient';
import { API_ENDPOINT } from '../../api/ApiUrls';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';
import useLocationHook from '../../api/hooks/uselocationhook';
import { fonts } from '../../utils/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import ImageCropPicker from 'react-native-image-crop-picker';
import { useFocusEffect } from '@react-navigation/native';

const requestPermissions = async () => {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
    return false;
  }
};

const logFormData = (label: string, formData: FormData) => {
  const parts = (formData as any)?._parts || [];
  console.log(`===== ${label} FormData START =====`);
  parts.forEach(([key, value]: [string, any]) => {
    if (value && typeof value === 'object' && value.uri) {
      console.log(key, {
        uri: value.uri,
        name: value.name || value.fileName,
        type: value.type,
        size: value.size,
      });
    } else {
      console.log(key, value);
    }
  });
  console.log(`===== ${label} FormData END =====`);
};

const normalizeBankAccountType = (value: any) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'savings') return 'Savings';
  if (normalized === 'current') return 'Current';
  return '';
};

const AccordionSection = ({ title, children, defaultExpanded = false }: any) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const heightValue = useSharedValue(defaultExpanded ? 1000 : 0);

  const toggle = () => {
    const toValue = expanded ? 0 : 1000;
    heightValue.value = withTiming(toValue, {
      duration: !expanded ? 300 : 0,
      easing: Easing.inOut(Easing.ease),
    });
    setExpanded(!expanded);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    maxHeight: heightValue.value,
    overflow: 'hidden',
  }));

  return (
    <View style={styles.sectionWrapper}>
      {!expanded && (
        <TouchableOpacity style={[styles.sectionHeader, { marginBottom: rw(20) }]} onPress={toggle}>
          <AppText size={16} color={colors.black} family="InterSemiBold">
            {title}
          </AppText>
          <PlusIcon />
        </TouchableOpacity>
      )}
      <Animated.View style={animatedStyle}>
        <View style={[styles.sectionContent, { paddingBottom: 20, marginBottom: rw(10) }]}>
          <TouchableOpacity style={[styles.sectionHeader, { marginBottom: 12, marginTop: 4 }]} onPress={toggle}>
            <AppText size={16} color={colors.black} family="InterSemiBold">
              {title}
            </AppText>
            <MinusIcon />
          </TouchableOpacity>
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

const CustomTextInput = ({ placeholder, value, onChangeText, keyboardType = 'default', maxLength, editable = true }: any) => (
  <View style={[styles.selectUser, styles.row]}>
    <TextInput
      style={styles.textInput}
      placeholder={placeholder}
      placeholderTextColor={'#718096'}
      value={value}
      maxLength={maxLength}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      autoCapitalize="sentences"
      editable={editable}
    />
  </View>
);

const AddSecondaryCustomer = ({ navigation, route }: any) => {
  const type = route?.params?.type || 'RETAILER';
  const isEdit = !!route?.params?.customer;
  const existingCustomer = route?.params?.customer;
  const existingCustomerType = existingCustomer?.customertype;
  const customerTypeId = route?.params?.customerTypeId ||
    existingCustomer?.customer_type_id ||
    existingCustomerType?.id ||
    (typeof existingCustomerType !== 'object' ? existingCustomerType : undefined);
  const customerTypeName = route?.params?.customerTypeName ||
    existingCustomer?.customer_type ||
    existingCustomerType?.customertype_name ||
    existingCustomerType?.name ||
    type;
  const resolvedCustomerType = String(
    customerTypeName ||
    type ||
    existingCustomer?.customer_type ||
    existingCustomer?.type ||
    '',
  ).toLowerCase();
  const [isRetailerCustomer, setIsRetailerCustomer] = useState(
    resolvedCustomerType.includes('retailer'),
  );

  const [formData, setFormData] = useState<any>({
    type,
    sub_type: '',
    owner_name: '',
    shop_name: '',
    mobile_numbers: [] as string[],
    address_line: '',
    country_id: '1',
    state_id: '',
    district_id: '',
    city_id: '',
    pincode_id: '',
    parent_customer_ids: [] as string[],
    sales_exception_assignment: '',
    vehicle_segment: '',
    belt_area_market_name: '',
    saathi_awareness_status: '',
    beat_id: '',
    gps_location: '',
    shop_photo: null,
    gst_attachment: null,
    pan_attachment: null,
    bank_proof: null,
    aadhar: null,
    gst_number: '',
    pan_number: '',
    bank_account_type: '',
    bank_account_number: '',
    bank_account_number_confirm: '',
    bank_name: '',
    ifsc_code: '',
    account_holder_name: '',
  });

  const [mobileInput, setMobileInput] = useState('');
  const [pinCode, setPincode] = useState('');
  const [stateName, setStateName] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [cityName, setCityName] = useState('');
  const [loading, setLoading] = useState(false);
  const [bankNumberError, setBankNumberError] = useState<string | null>(null);
  const { mutateAsync: getBeatList } = useGetBeatList();
  const { mutateAsync: getCustomerTypes } = useGetCustomerTypesApi();
  const { mutateAsync: getCustomerTypeList } = useMutateCustomerTypeListApi();
  const { mutateAsync: getPincodes } = useGetPincodeListAPi();
  const { mutateAsync: getPincodesByCity } = useGetPincodeByCityListAPi();

  const actionSheetRef = useRef<ActionSheetRef>(null);
  const [currentUploadField, setCurrentUploadField] = useState<string | null>(null);
  const [currentUploadLabel, setCurrentUploadLabel] = useState<string>('Upload Image');

  const [beats, setBeats] = useState([]);

  const { coords } = useLocationHook();
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [parentCustomers, setParentCustomers] = useState<any[]>([]);
  const [parentCustomersLoading, setParentCustomersLoading] = useState(false);
  const [cityOptions, setCityOptions] = useState<any[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const loadBeats = useCallback(async () => {
    try {
      const res = await getBeatList();
      if (res?.data?.status === 'success') {
        setBeats(res.data.data.map((beat: any) => ({
          label: beat.beat_name,
          value: beat.beat_id,
        })));
      }
    } catch (error) {
      console.log('Beat API error', error);
    }
  }, [getBeatList]);

  const getResponseList = (payload: any) => {
    const list =
      payload?.data?.data?.data ??
      payload?.data?.data ??
      payload?.data?.customer_types ??
      payload?.data?.types ??
      payload?.data ??
      payload?.customer_types ??
      payload?.types ??
      payload;

    return Array.isArray(list) ? list : [];
  };

  const getCustomerTypeLabel = (item: any) => String(
    item?.customertype_name ??
    item?.customer_type ??
    item?.name ??
    item?.title ??
    item?.type ??
    item?.label ??
    '',
  ).trim();

  const getCustomerTypeId = (item: any) =>
    item?.id ?? item?.customer_type_id ?? item?.customertype ?? item?.value;

  const loadCustomerConfiguration = useCallback(async () => {
    setParentCustomersLoading(true);
    try {
      const typeResponse = await getCustomerTypes();
      const customerTypes = getResponseList(typeResponse?.data);
      const retailerType = customerTypes.find(
        (item: any) => {
          const label = getCustomerTypeLabel(item).toLowerCase();
          return label.includes('retailer') && !label.includes('secondary');
        },
      );
      const retailerTypeId = getCustomerTypeId(retailerType);
      const currentTypeIsRetailer =
        resolvedCustomerType.includes('retailer') ||
        (customerTypeId != null && retailerTypeId != null &&
          String(customerTypeId) === String(retailerTypeId));

      setIsRetailerCustomer(currentTypeIsRetailer);
      if (!currentTypeIsRetailer) {
        setParentCustomers([]);
        return;
      }

      const parentTypes = customerTypes.filter((item: any) => {
        const label = getCustomerTypeLabel(item).toLowerCase().trim();
        const isDealerOrDistributor = label.includes('dealer') || label.includes('distributor');
        const isOldCustomerModel = label.includes('master') || label.includes('secondary');
        return isDealerOrDistributor && !isOldCustomerModel;
      });

      const responses = await Promise.all(
        parentTypes.map((parentType: any) => getCustomerTypeList({
          customer_type_id: getCustomerTypeId(parentType),
          page: 1,
          pageSize: 100,
        })),
      );

      const seen = new Set<string>();
      const combinedParentCustomers = responses.flatMap((response: any, responseIndex: number) =>
        getResponseList(response?.data).map((customer: any) => {
          const value = String(customer?.customer_id ?? customer?.id ?? '');
          if (!value || seen.has(value)) return null;
          seen.add(value);
          return {
            label: [
              getCustomerTypeLabel(parentTypes[responseIndex]),
              customer?.customer_code,
              customer?.shop_name || customer?.name || customer?.legal_name || customer?.owner_name,
            ].filter(Boolean).join(' - '),
            value,
          };
        }).filter(Boolean),
      );

      setParentCustomers(combinedParentCustomers);
      if (!parentTypes.length) {
        Toast.show({
          type: 'error',
          text1: 'Dealer or Distributor customer type not found',
        });
      }
    } catch (e) {
      console.log('Parent customers fetch error', e);
      setParentCustomers([]);
    } finally {
      setParentCustomersLoading(false);
    }
  }, [customerTypeId, getCustomerTypeList, getCustomerTypes, resolvedCustomerType]);

  useEffect(() => {
    loadBeats();
    loadCustomerConfiguration();
  }, [loadBeats, loadCustomerConfiguration]);

  const loadPincodesByCity = async (cityId: any) => {
    try {
      const res = await getPincodesByCity(cityId);
      if (res?.data?.status === 'success') {
        const pincodes = res?.data?.data || [];
        if (existingCustomer?.pincode_id) {
          const matchedPincode = pincodes.find(
            (item: any) => item.pincode_id === existingCustomer.pincode_id
          );
          if (matchedPincode) {
            setPincode(matchedPincode.pincode);
            handleChange("pincode_id", matchedPincode.pincode_id);
            loadPincodes(matchedPincode.pincode);
          }
        }
      }
    } catch (e) {
      console.log("Pincode by city error", e);
    }
  };


  // Validate on change (you can also validate on submit)
  const handleBankNumberChange = (value: string) => {
    handleChange('bank_account_number', value);

    // Check match only if confirm field is already filled
    if (formData.bank_account_number_confirm && value !== formData.bank_account_number_confirm) {
      setBankNumberError("Account numbers don't match");
    } else {
      setBankNumberError(null);
    }
  };

  const handleConfirmBankNumberChange = (value: string) => {
    handleChange('bank_account_number_confirm', value);

    if (formData.bank_account_number && value !== formData.bank_account_number) {
      setBankNumberError("Account numbers don't match");
    } else {
      setBankNumberError(null);
    }
  };

  // Optional: more strict validation before submit
  const isBankInfoValid = () => {
    const hasBankNumber = !!formData.bank_account_number?.trim();
    const hasConfirm = !!formData.bank_account_number_confirm?.trim();

    if (hasBankNumber && !hasConfirm) {
      return false; // must confirm if entered
    }

    if (hasBankNumber && hasConfirm) {
      return formData.bank_account_number === formData.bank_account_number_confirm;
    }

    return true; // no bank number → ok
  };

  // const loadPincodes = async (pincode: string) => {
  //   if (pincode.length !== 6) return;

  //   try {
  //     const res = await getPincodes(pincode);
  //     const data = res?.data;

  //     if (res?.status === 200 && data?.pincode) {
  //       setStateName(data.state);
  //       setDistrictName(data.district);
  //       setCityName(data.city);

  //       handleChange("state_id", data.state_id);
  //       handleChange("pincode_id", data.pincode_id);
  //       handleChange("district_id", data.district_id);
  //       handleChange("city_id", data.city_id);
  //     } else {
  //       Toast.show({ type: "error", text1: "Invalid Pincode" });
  //       clearLocationFields();
  //     }
  //   } catch (error) {
  //     Toast.show({ type: "error", text1: "Invalid Pincode" });
  //     clearLocationFields();
  //     console.log("Pincode error", error);
  //   }
  // };

  const loadPincodes = async (pincode: string, olddata?: any) => {
    if (pincode.length !== 6) return;

    try {
      const res = await getPincodes(pincode);
      const data = res?.data;

      if (res?.status === 200 && data?.pincode) {
        setStateName(data.state);
        setDistrictName(data.district);

        handleChange("state_id", data.state_id);
        handleChange("pincode_id", data.pincode_id);
        handleChange("district_id", data.district_id);

        // ✅ NEW LOGIC
        if (data?.cities && data.cities.length > 1) {
          // Multiple cities case
          setShowCityDropdown(true);

          const options = data.full_data.map((c: any, index: number) => ({
            label: c?.city,
            value: data.city_ids[index],
            state: c?.state,
            district: c?.district,
            state_id: c?.state_id,
            district_id: c?.district_id
          }));

          setCityOptions(options);

          // clear previous selection
          setCityName('');
          handleChange("city_id", '');
          if (olddata?.city_id) {
            const matchedCity = options.find(
              (item: any) => String(item.value) === String(olddata.city_id)
            );

            if (matchedCity) {
              setCityName(matchedCity.label);

              handleChange("city_id", matchedCity.value);
              handleChange("state_id", matchedCity.state_id);
              handleChange("district_id", matchedCity.district_id);

              setStateName(matchedCity.state);
              setDistrictName(matchedCity.district);
            }
          }
        } else {
          // Single city case (existing behavior)
          setShowCityDropdown(false);

          setCityName(data.city);
          handleChange("city_id", data.city_id);
        }

      } else {
        Toast.show({ type: "error", text1: "Invalid Pincode" });
        clearLocationFields();
      }
    } catch (error) {
      Toast.show({ type: "error", text1: "Invalid Pincode" });
      clearLocationFields();
      console.log("Pincode error", error);
    }
  };

  const clearLocationFields = () => {
    setStateName('');
    setDistrictName('');
    setCityName('');
    handleChange("state_id", '');
    handleChange("district_id", '');
    handleChange("city_id", '');
    handleChange("pincode_id", '');
    setShowCityDropdown(false);
    setCityOptions([]);
  };

  useEffect(() => {
    if (useCurrentLocation && coords) {
      const lat = Number(coords.latitude.toFixed(6));
      const lng = Number(coords.longitude.toFixed(6));
      handleChange("gps_location", `${lat},${lng}`);
    } else if (!useCurrentLocation) {
      handleChange("gps_location", "");
    }
  }, [useCurrentLocation, coords]);

  const openUploadSheet = (field: string, label: string) => {
    setCurrentUploadField(field);
    setCurrentUploadLabel(label);
    actionSheetRef.current?.show();
  };

  const pickImage = async (fromCamera = false) => {
    // Dismiss the upload sheet before presenting the native camera/gallery.
    // This prevents the sheet from remaining visible behind the iOS picker.
    actionSheetRef.current?.hide();
    await new Promise<void>(resolve => setTimeout(() => resolve(), 250));

    if (fromCamera) {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Toast.show({ type: 'error', text1: 'Camera permission denied' });
        return;
      }
    }

    const options: any = {
      mediaType: 'photo' as const,
      quality: 0.9,           // start with good quality
      maxWidth: 1600,         // resize before cropping (helps performance)
      maxHeight: 1600,
      includeBase64: false,
    };

    const picker = fromCamera ? launchCamera : launchImageLibrary;
    picker(options, async (response: ImagePickerResponse) => {
      // if (response.didCancel || response.errorCode) return;
      // if (response.assets && response.assets[0] && currentUploadField) {
      //   handleChange(currentUploadField, response.assets[0]);
      // }
      // actionSheetRef.current?.hide();
      if (response.didCancel || response.errorCode || !response.assets?.[0]) {
        actionSheetRef.current?.hide();
        return;
      }

      const asset = response.assets[0];
      if (currentUploadField) {
        handleChange(currentUploadField, asset);
      }

      try {
        // Now open cropper with the picked image
        const croppedImage = await ImageCropPicker.openCropper({
          path: asset.uri!, // important: use uri from image-picker
          width: 1200, // desired output width
          height: 1200, // desired output height (change as needed)
          cropping: true,
          cropperCircleOverlay: false, // set true for profile picture (circular crop)
          freeStyleCropEnabled: true, // allow user to freely adjust crop
          compressImageQuality: 0.85, // final compression
          compressImageMaxWidth: 1200,
          compressImageMaxHeight: 1200,
          forceJpg: true,
          mediaType: 'photo'
        });
        // croppedImage now has much smaller size
        if (currentUploadField) {
          handleChange(currentUploadField, {
            uri: croppedImage.path,
            type: croppedImage.mime || 'image/jpeg',
            fileName: croppedImage.filename || `photo_${Date.now()}.jpg`,
            width: croppedImage.width,
            height: croppedImage.height,
            size: croppedImage.size,   // you can check this before upload
          });
        }
      } catch (cropError: any) {
        if (cropError.code !== 'E_PICKER_CANCELLED') {
          console.error('Cropping error:', cropError);
          Toast.show({
            type: 'info',
            text1: 'Image selected',
            text2: 'Crop was skipped, original image will be used',
          });
        }
      }

    });
  };

  const ImageUploadBox = ({ label, value, field, required = false, existingUri }: any) => {
    const displayUri = value?.uri || existingUri;
    return (
      <View style={{ width: '48%', marginBottom: 16 }}>
        <AppText size={14} color={colors.black} family="InterMedium">
          {label} {required && <AppText color="red">*</AppText>}
        </AppText>
        <TouchableOpacity
          style={{
            height: 140,
            justifyContent: value ? 'flex-start' : 'center',
            alignItems: 'center',
            borderWidth: 1.5,
            borderColor: value ? '#22C55E' : '#CBD5E1',
            borderStyle: 'dashed',
            borderRadius: 12,
            overflow: 'hidden',
            marginTop: 8,
          }}
          onPress={() => openUploadSheet(field, label)}
        >
          {displayUri ? (
            <>
              <FastImage source={{ uri: displayUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              <TouchableOpacity
                onPress={() => handleChange(field, null)}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  borderRadius: 20,
                  padding: 6,
                }}
              >
                <MinusIcon width={16} height={16} fill="white" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={{ alignItems: 'center', gap: 8 }}>
              <UploadIcon width={40} height={40} />
              <AppText size={13} color="#64748B" family="InterMedium" align="center">
                Tap to upload
              </AppText>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const getBasicCount = () => {
    let count = 0;
    if (formData.owner_name?.trim()) count++;
    if (formData.shop_name?.trim()) count++;
    if (formData.mobile_numbers.length > 0) count++;
    return count;
  };

  const getAddressCount = () => {
    let count = 0;
    if (formData.address_line?.trim()) count++;
    if (formData.state_id) count++;
    if (formData.district_id) count++;
    if (formData.city_id) count++;
    if (pinCode.length === 6) count++;
    return count;
  };

  const getAdditionalCount = () => {
    let count = 0;
    if (isRetailerCustomer && formData.parent_customer_ids?.length) count++;
    return count;
  };

  const additionalRequiredCount = isRetailerCustomer ? 1 : 0;

  const isFormValid =
    getBasicCount() === 3 &&
    getAddressCount() === 5 &&
    getAdditionalCount() === additionalRequiredCount &&
    !!formData.shop_photo &&
    isBankInfoValid();

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        headerTitle: `${isEdit ? 'Edit Customer' : 'Add Customer'}`,     // ← change to whatever you want
      });
    }, [navigation, isEdit]
    ));

  const prepareFormData = () => {
    const fd = new FormData();
    const appendIfPresent = (key: string, value: any) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        fd.append(key, String(value).trim());
      }
    };
    const addPhoto = (key: string, asset: any) => {
      if (asset?.uri && !asset.uri.startsWith('http')) {
        fd.append(key, {
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        });
      }
    };

    const mobileNumbers = formData.mobile_numbers.map((num: string) => normalizeIndianMobileNumber(num)).filter(Boolean);
    const [firstName, ...lastNameParts] = formData.owner_name.trim().split(/\s+/);
    const parentIds = isRetailerCustomer
      ? formData.parent_customer_ids.filter(Boolean).join(',')
      : '';

    if (isEdit) appendIfPresent('customer_id', existingCustomer?.customer_id || existingCustomer?.id);
    fd.append('mobile', mobileNumbers[0] || '');
    appendIfPresent('full_name', formData.owner_name);
    appendIfPresent('first_name', firstName);
    appendIfPresent('last_name', lastNameParts.join(' '));
    appendIfPresent('name', formData.shop_name);
    appendIfPresent('customertype', customerTypeId);
    appendIfPresent('firmtype', formData.sub_type);
    appendIfPresent('contact_number', mobileNumbers[1] || mobileNumbers[0]);
    appendIfPresent('address1', formData.address_line);
    appendIfPresent('country_id', formData.country_id);
    appendIfPresent('state_id', formData.state_id);
    appendIfPresent('district_id', formData.district_id);
    appendIfPresent('city_id', formData.city_id);
    appendIfPresent('pincode_id', formData.pincode_id);
    appendIfPresent('zipcode', pinCode);
    if (isRetailerCustomer) appendIfPresent('parent_id', parentIds);
    appendIfPresent('beat_id', formData.beat_id);
    appendIfPresent('locality', formData.belt_area_market_name);
    appendIfPresent('latitude', useCurrentLocation ? coords?.latitude : existingCustomer?.latitude);
    appendIfPresent('longitude', useCurrentLocation ? coords?.longitude : existingCustomer?.longitude);
    appendIfPresent('gstin_no', formData.gst_number);
    appendIfPresent('pan_no', formData.pan_number);
    appendIfPresent('bank_account_type', normalizeBankAccountType(formData.bank_account_type));
    appendIfPresent('account_holder', formData.account_holder_name);
    appendIfPresent('account_number', formData.bank_account_number);
    appendIfPresent('bank_name', formData.bank_name);
    appendIfPresent('ifsc_code', formData.ifsc_code);
    appendIfPresent('status_type', formData.saathi_awareness_status);

    addPhoto('shopimage', formData.shop_photo);
    addPhoto('gstin_image', formData.gst_attachment);
    addPhoto('pan_image', formData.pan_attachment);
    addPhoto('other_image', formData.bank_proof);
    addPhoto('aadhar', formData.aadhar);

    return fd;
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      Toast.show({ type: 'error', text1: 'Please fill all required fields' });
      return;
    }
    setLoading(true);

    const token = store.getState().auth?.token;
    const url = isEdit
      ? `${BASE_URL}${API_ENDPOINT.UPDATE_CUSTOMER_PROFILE}`
      : `${BASE_URL}${API_ENDPOINT.STORE_CUSTOMER}`;
    // const payload1 = prepareFormData();
    // console.log(payload1, 'poadkkfjakjsdhfkjas')
    // return
    try {
      const payload = prepareFormData();
      logFormData(isEdit ? 'Update Customer Profile' : 'Store Customer', payload);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      const json = await res.json();
      const responseStatus = String(json?.status ?? '').toLowerCase();
      const isSuccess = res.ok && (
        json?.status === true ||
        responseStatus === 'success' ||
        responseStatus === '200'
      );
      if (isSuccess) {
        Toast.show({
          type: 'success',
          text1: json?.msg || json?.message || (isEdit ? 'Customer updated successfully' : 'Customer added successfully'),
        });
        navigation.goBack();
      } else {
        const rawMessage = json?.message || json?.msg;
        const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;
        Toast.show({ type: 'error', text1: message || 'Failed to save' });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Network error' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addMobileNumber = () => {
    const normalizedMobile = normalizeIndianMobileNumber(mobileInput);
    if (!normalizedMobile || normalizedMobile.length !== 10) {
      Toast.show({ type: 'error', text1: 'Enter valid 10-digit number' });
      return;
    }
    if (formData.mobile_numbers.length >= 2) {
      Toast.show({ type: 'error', text1: 'Maximum 2 numbers allowed' });
      return;
    }
    if (formData.mobile_numbers.includes(normalizedMobile)) {
      Toast.show({ type: 'error', text1: 'Number already added' });
      return;
    }
    handleChange('mobile_numbers', [...formData.mobile_numbers, normalizedMobile]);
    setMobileInput('');
  };

  const removeMobile = (num: string) => {
    handleChange('mobile_numbers', formData.mobile_numbers.filter((n: string) => n !== num));
  };

  useEffect(() => {
    if (isEdit && existingCustomer) {
      const details = existingCustomer.customerdetails || {};
      const address = existingCustomer.customeraddress || {};
      const parentIds = Array.isArray(existingCustomer.parent_id)
        ? existingCustomer.parent_id
        : String(existingCustomer.parent_id || '').split(',').filter(Boolean);
      const legacyParentIds = [
        existingCustomer.distributor_name,
        existingCustomer.agri_distributor,
      ].flatMap(value => String(value || '').split(',')).filter(Boolean);
      const mobiles = [
        existingCustomer.mobile_number,
        existingCustomer.mobile,
        existingCustomer.contact_number,
        details.mobile,
        details.contact_number,
      ]
        .flatMap(value => String(value || '').split(','))
        .map((number: string) => normalizeIndianMobileNumber(number))
        .filter((number: string) => number.length === 10)
        .filter((number: string, index: number, list: string[]) => list.indexOf(number) === index)
        .slice(0, 2);
      setFormData({
        type: existingCustomer.type || existingCustomer.customer_type || type,
        sub_type: existingCustomer.sub_type || existingCustomer.firmtype || details.firmtype || '',
        owner_name: existingCustomer.owner_name || existingCustomer.full_name || details.contact_person || '',
        shop_name: existingCustomer.shop_name || existingCustomer.name || existingCustomer.legal_name || '',
        mobile_numbers: mobiles,
        address_line: existingCustomer.address_line || existingCustomer.address1 || address.full_address || '',
        country_id: existingCustomer.country_id || address.country_id || '1',
        state_id: existingCustomer.state_id || address.state_id || '',
        district_id: existingCustomer.district_id || address.district_id || '',
        city_id: existingCustomer.city_id || address.city_id || '',
        pincode_id: existingCustomer.pincode_id || address.pincode_id || '',
        parent_customer_ids: [
          ...parentIds,
          ...legacyParentIds,
        ].filter(Boolean).map(String).filter((value, index, list) => list.indexOf(value) === index),
        beat_id: existingCustomer.beat_id || '',
        belt_area_market_name: existingCustomer.belt_area_market_name || existingCustomer.locality || '',
        saathi_awareness_status: existingCustomer.saathi_awareness_status || existingCustomer.status_type || '',
        shop_photo: existingCustomer.shop_photo || existingCustomer.shop_image
          ? { uri: resolveMediaUrl(existingCustomer.shop_photo || existingCustomer.shop_image) }
          : null,
        gst_number: existingCustomer.gst_number || existingCustomer.gstin_no || details.gstin_no || '',
        gps_location: existingCustomer.gps_location || '',
        gst_attachment: existingCustomer.gst_attachment ? { uri: resolveMediaUrl(existingCustomer.gst_attachment) } : null,
        pan_attachment: existingCustomer.pan_attachment ? { uri: resolveMediaUrl(existingCustomer.pan_attachment) } : null,
        bank_proof: existingCustomer.bank_proof ? { uri: resolveMediaUrl(existingCustomer.bank_proof) } : null,
        aadhar: existingCustomer.aadhar ? { uri: resolveMediaUrl(existingCustomer.aadhar) } : null,
        pan_number: existingCustomer.pan_number || existingCustomer.pan_no || details.pan_no || '',
        bank_account_type: normalizeBankAccountType(existingCustomer.bank_account_type),
        bank_account_number: existingCustomer.bank_account_number || existingCustomer.account_number || details.account_number || '',
        bank_account_number_confirm: existingCustomer.bank_account_number || existingCustomer.account_number || details.account_number || '',
        bank_name: existingCustomer.bank_name || details.bank_name || '',
        ifsc_code: existingCustomer.ifsc_code || details.ifsc_code || '',
        account_holder_name: existingCustomer.account_holder_name || existingCustomer.account_holder || details.account_holder || '',
      });
      if (existingCustomer.pincode?.pincode) {
        setPincode(existingCustomer.pincode?.pincode || '');
      } else {
        setPincode(existingCustomer.pincode || '');
      }
      if (existingCustomer.pincode?.pincode) {
        loadPincodes(existingCustomer.pincode?.pincode, existingCustomer);
      } else {
        if (existingCustomer.city_id) {
          loadPincodesByCity(existingCustomer.city_id);
        } else if (existingCustomer.pincode) {
          loadPincodes(existingCustomer.pincode);
        }
      }

    }
  }, [isEdit, existingCustomer, beats, type]);


  const getFirstMissingFieldMessage = () => {
    // Basic
    if (!formData.shop_name?.trim()) return "Shop Name is required";
    if (!formData.owner_name?.trim()) return "Owner Name is required";
    if (formData.mobile_numbers.length === 0) return "At least one Mobile Number is required";

    // Address
    if (!formData.address_line?.trim()) return "Address is required";
    if (!pinCode || pinCode.length !== 6) return "Pincode is required";
    if (!formData.state_id) return "State is required";
    if (!formData.district_id) return "District is required";
    if (!formData.city_id) return "City is required";

    // Additional
    if (isRetailerCustomer && !formData.parent_customer_ids?.length) return "Parent Customer is required";

    // Attachments
    if (!formData.shop_photo) return "Shop Image is required";

    // Bank validation
    if (!isBankInfoValid()) return "Bank account numbers do not match";

    return "";
  };

  const missingFieldsMessage = getFirstMissingFieldMessage();
  return (
    <SafeAreaView style={[styles.container, { paddingBottom: 10 }]} edges={['bottom']}>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ backgroundColor: '#E0F2FE', padding: 16, alignItems: 'center' }}>
          <AppText size={16} family="InterSemiBold" color={colors.blue}>
            Customer Type: {customerTypeName}
          </AppText>
        </View>
        <KeyboardAwareScrollView
          style={{ flex: 1, paddingHorizontal: 16 }}
          bottomOffset={50}
        // contentContainerStyle={{ padding: 16 }}


        >
          <View style={{ flex: 1 }}
          >

            <AccordionSection title="Basic Information" defaultExpanded>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <AppText
                  size={16}
                  color={getBasicCount() == 3 ? '#22C55E' : '#64748B'}
                  family="InterSemiBold"
                >
                  {getBasicCount()}/3 completed
                </AppText>
              </View>

              <CustomTextInput
                placeholder="Shop Name *"
                value={formData.shop_name}
                onChangeText={(v: string) => handleChange('shop_name', v)}
              />

              <CustomTextInput
                placeholder="Owner Name *"
                value={formData.owner_name}
                onChangeText={(v: string) => handleChange('owner_name', v)}
              />

              <View style={{ marginTop: 8 }}>
                <AppText size={14} family="InterMedium">
                  Mobile Numbers (max 2) *
                </AppText>
                <AppText
                  size={12}
                  color="#64748B"
                  family="InterRegular"
                  style={{ marginTop: 4, marginBottom: 8 }}
                >
                  • First number will be considered **Primary Mobile {'\n'}   Number** (also used for WhatsApp){'\n'}
                  • Second number is the alternate contact number
                </AppText>
                <View style={[styles.selectUser, { flexDirection: 'row', marginTop: 8, alignItems: 'center' }]}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder="Enter 10-digit number"
                    value={mobileInput}
                    onChangeText={setMobileInput}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                  <TouchableOpacity
                    onPress={addMobileNumber}
                    style={{
                      backgroundColor: colors.blue,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 8,
                      marginLeft: 12,
                    }}
                  >
                    <AppText color="white" family="InterMedium">
                      Add
                    </AppText>
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {formData.mobile_numbers.map((num: string) => (
                    <View
                      key={num}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#e2e8f0',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                      }}
                    >
                      <AppText size={14}>{num}</AppText>
                      <TouchableOpacity onPress={() => removeMobile(num)} style={{ marginLeft: 8 }}>
                        <MinusIcon width={16} height={16} fill="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            </AccordionSection>

            <AccordionSection title="Address Information">
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <AppText
                  size={16}
                  color={getAddressCount() === 5 ? '#22C55E' : '#64748B'}
                  family="InterSemiBold"
                >
                  {getAddressCount()}/5 completed
                </AppText>
              </View>
              <CustomTextInput
                placeholder="Address Line *"
                value={formData.address_line}
                onChangeText={(v: string) => handleChange('address_line', v)}
              />

              <View style={[styles.selectUser, { padding: 14, marginBottom: 12 }]}>
                <AppText size={14} color={colors.black}>India</AppText>
              </View>
              {console.log(pinCode, 'pinCodepinCodepinCode')}
              <CustomTextInput
                placeholder="Pincode *"
                value={pinCode}
                maxLength={6}
                keyboardType="numeric"
                onChangeText={(text: string) => {
                  setPincode(text);
                  if (text.length === 6) {
                    loadPincodes(text);
                  } else {
                    clearLocationFields();
                  }
                }}
              />

              <CustomTextInput placeholder="State *" value={stateName} editable={false} />
              <CustomTextInput placeholder="District *" value={districtName} editable={false} />
              {/* <CustomTextInput placeholder="City *" value={cityName} editable={false} /> */}
              {showCityDropdown ? (
                <Dropdown
                  style={[styles.selectUser, { padding: 14, marginBottom: 12 }]}
                  data={cityOptions}
                  value={formData.city_id}
                  onChange={(item) => {
                    handleChange("city_id", item.value);
                    setCityName(item.label);
                    setDistrictName(item?.district)
                    setStateName(item?.state)
                    handleChange("state_id", item.state_id);
                    handleChange("district_id", item.district_id);
                  }}
                  labelField="label"
                  valueField="value"
                  placeholder="Select City *"
                  placeholderStyle={{ color: 'gray', fontFamily: fonts.InterRegular, fontSize: 14 }}
                  renderRightIcon={() => <ArrowDownIcon />}
                />
              ) : (
                <CustomTextInput placeholder="City *" value={cityName} editable={false} />
              )}
            </AccordionSection>

            <AccordionSection title="Additional Information">
              {additionalRequiredCount > 0 && (
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <AppText
                    size={16}
                    color={getAdditionalCount() === additionalRequiredCount ? '#22C55E' : '#64748B'}
                    family="InterSemiBold"
                  >
                    {getAdditionalCount()}/{additionalRequiredCount} completed
                  </AppText>
                </View>
              )}
              <CustomTextInput
                placeholder="Belt / Area / Market Name (optional)"
                value={formData.belt_area_market_name}
                onChangeText={(v: string) => handleChange('belt_area_market_name', v)}
              />

              {isRetailerCustomer && (
                <MultiSelect
                  style={[styles.selectUser, { padding: 14, marginTop: 12 }]}
                  data={parentCustomers}
                  value={formData.parent_customer_ids}
                  onChange={(values) => handleChange('parent_customer_ids', values.map(String))}
                  labelField="label"
                  valueField="value"
                  placeholder={parentCustomersLoading ? 'Loading Parent Customers...' : 'Select Parent Customer *'}
                  placeholderStyle={{ color: 'gray', fontFamily: fonts.InterRegular, fontSize: 14 }}
                  search
                  searchPlaceholder="Search Dealer or Distributor"
                  disable={parentCustomersLoading}
                  renderRightIcon={() => parentCustomersLoading ? <ActivityIndicator size="small" /> : <ArrowDownIcon />}
                />
              )}

              <Dropdown
                style={[styles.selectUser, { padding: 14, marginTop: 12 }]}
                data={beats}
                value={formData.beat_id}
                onChange={(item) => handleChange('beat_id', item.value)}
                labelField="label"
                valueField="value"
                placeholder="Select Beat (optional)"
                placeholderStyle={{ color: 'gray', fontFamily: fonts.InterRegular, fontSize: 14 }}
                renderRightIcon={() => <ArrowDownIcon />}
              />

              <CustomTextInput
                placeholder="GPS Location (lat,lng) - optional"
                value={formData.gps_location}
                editable={false}
              />

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 10,
                  padding: 12,
                  backgroundColor: '#f8fafc',
                  borderRadius: 12,
                  marginBottom: 10,
                }}
              >
                <AppText size={14} family="InterMedium" width="70%">
                  Use current location (auto-fill GPS)
                </AppText>
                <Switch
                  value={useCurrentLocation}
                  onValueChange={setUseCurrentLocation}
                  trackColor={{ false: '#cbd5e1', true: colors.blue }}
                />
              </View>
            </AccordionSection>

            <AccordionSection title="Bank & Tax Information">
              <CustomTextInput
                placeholder="GST Number (optional)"
                value={formData.gst_number}
                onChangeText={(v: string) => handleChange('gst_number', v.toUpperCase())}
                maxLength={15}
              />
              <CustomTextInput
                placeholder="PAN Number (optional)"
                value={formData.pan_number}
                onChangeText={(v: string) => handleChange('pan_number', v.toUpperCase())}
                maxLength={10}
              />
              <CustomTextInput
                placeholder="Account Holder Name (optional)"
                value={formData.account_holder_name}
                onChangeText={(v: string) => handleChange('account_holder_name', v)}
              />
              <CustomTextInput
                placeholder="Bank Account Number (optional)"
                value={formData.bank_account_number}
                onChangeText={handleBankNumberChange}
                keyboardType="numeric"
              />

              {bankNumberError && (
                <AppText
                  size={13}
                  color="red"
                  style={{ marginTop: 4, marginLeft: 12 }}
                >
                  {bankNumberError}
                </AppText>
              )}

              <CustomTextInput
                placeholder="Confirm Bank Account Number"
                value={formData.bank_account_number_confirm}
                onChangeText={handleConfirmBankNumberChange}
                keyboardType="numeric"
              />
              <CustomTextInput
                placeholder="Bank Name (optional)"
                value={formData.bank_name}
                onChangeText={(v: string) => handleChange('bank_name', v)}
              />
              <CustomTextInput
                placeholder="IFSC Code (optional)"
                value={formData.ifsc_code}
                onChangeText={(v: string) => handleChange('ifsc_code', v.toUpperCase())}
                maxLength={14}
              />
              <Dropdown
                style={[styles.selectUser, { padding: 14, marginTop: 12 }]}
                data={[
                  { label: 'Savings', value: 'Savings' },
                  { label: 'Current', value: 'Current' },
                ]}
                value={formData.bank_account_type}
                onChange={(item) => handleChange('bank_account_type', item.value)}
                labelField="label"
                valueField="value"
                placeholder="Account Type (optional)"
                placeholderStyle={{ color: 'gray', fontFamily: fonts.InterRegular, fontSize: 14 }}
                renderRightIcon={() => <ArrowDownIcon />}
              />
            </AccordionSection>

            <AccordionSection title="Attachments">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <ImageUploadBox
                  label="Shop Image"
                  field="shop_photo"
                  value={formData.shop_photo}
                  required
                  existingUri={isEdit ? formData.shop_photo?.uri : null}
                />
                <ImageUploadBox
                  label="GST Attachment (optional)"
                  field="gst_attachment"
                  value={formData.gst_attachment}
                  existingUri={isEdit ? formData.gst_attachment?.uri : null}
                />
                <ImageUploadBox
                  label="PAN Attachment (optional)"
                  field="pan_attachment"
                  value={formData.pan_attachment}
                  existingUri={isEdit ? formData.pan_attachment?.uri : null}
                />
                <ImageUploadBox
                  label="Bank Proof / Cheque (optional)"
                  field="bank_proof"
                  value={formData.bank_proof}
                  existingUri={isEdit ? formData.bank_proof?.uri : null}
                />
                <ImageUploadBox
                  label="Aadhaar Card (optional)"
                  field="aadhar"
                  value={formData.aadhar}
                  existingUri={isEdit ? formData.aadhar?.uri : null}
                />
              </View>
            </AccordionSection>

            {missingFieldsMessage ? (
              <AppText
                size={13}
                color="red"
                align='center'
                family='InterMedium'
              >
                {missingFieldsMessage}
              </AppText>
            ) : null}

            <Pressable
              style={{
                backgroundColor: isFormValid ? colors.blue : '#94a3b8',
                padding: 16,
                borderRadius: 12,
                alignItems: 'center',
                marginTop: 16,
              }}
              disabled={!isFormValid || loading}
              onPress={handleSubmit}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <AppText color="white" size={16} family="InterBold">
                  SUBMIT
                </AppText>
              )}
            </Pressable>
          </View>
        </KeyboardAwareScrollView>
        <ActionSheet
          ref={actionSheetRef}
          gestureEnabled
          containerStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        >
          <View style={{ padding: 24 }}>
            <AppText size={20} family="InterBold" align="center">
              {currentUploadLabel}
            </AppText>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 32, gap: 16 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.blue,
                  padding: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
                onPress={() => pickImage(true)}
              >
                <AppText color="white">Take Photo</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: 'white',
                  borderWidth: 1.5,
                  borderColor: colors.blue,
                  padding: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
                onPress={() => pickImage(false)}
              >
                <AppText color={colors.blue}>Choose from Gallery</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </ActionSheet>
      </View>
    </SafeAreaView>
  );
};

export default AddSecondaryCustomer;
