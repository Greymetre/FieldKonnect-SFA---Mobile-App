import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  Pressable,
  Modal,
  PermissionsAndroid,
  ActivityIndicator,
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
import { LocationIcon, MinusIcon, PlusIcon, UploadIcon } from '../../assets/svgs/HomePageSvgs';
import { styles } from './styles';
import { ArrowDownIcon } from '../../assets/svgs/SvgsFile';
import CustomToggleRow from './CustomToggleRowPage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';
import { useGetBeatList, useGetCityListApi, useGetDistrictListApi, useGetPincodeByCityListAPi, useGetPincodeListAPi, useGetStateListApi, useGetSuperVisorListApi } from '../../api/query/CustomerApi';
import FastImage from 'react-native-fast-image';
import { Asset, ImagePickerResponse, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import store from '../../components/redux/Store';
import { BASE_URL, IMAGE_BASE_URL } from '../../api/AxiosClient';
import { API_ENDPOINT } from '../../api/ApiUrls';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';
import Geolocation from '@react-native-community/geolocation';
import useLocationHook from '../../api/hooks/uselocationhook';
import { useFocusEffect } from '@react-navigation/native';
import { normalizeIndianMobileNumber } from '../../utils/phone';

const { width } = Dimensions.get('window');

interface AccordionSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const requestPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      const camera = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Camera Permission",
          message: "App needs camera access to take photos",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK"
        }
      );

      if (camera === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else {
        Toast.show({ type: 'error', text1: 'Camera permission denied' });
        return false;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
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




const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  children,
  defaultExpanded = false,
}) => {
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
      {
        !expanded && (
          <TouchableOpacity style={[styles.sectionHeader, { marginBottom: rw(20) }]} onPress={toggle}>
            <AppText size={16} color={colors.black} family={'InterSemiBold'}>
              {title}
            </AppText>
            <PlusIcon />
          </TouchableOpacity>
        )
      }
      <Animated.View style={animatedStyle}>
        <View style={[styles.sectionContent, { paddingBottom: 20, marginBottom: rw(10) }]}>
          <TouchableOpacity style={[styles.sectionHeader, { marginBottom: 12, marginTop: 4 }]} onPress={toggle}>
            <AppText size={16} color={colors.black} family={'InterSemiBold'}>
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
const CustomDropdown = ({ placeholder, value }: { placeholder: string; value?: string }) => (
  <View style={[styles.selectUser, styles.row]}>
    <View style={styles.placeholer}>
      <AppText size={14} color={value ? colors.black : '#718096'} family="InterRegular">
        {value || placeholder}
      </AppText>
    </View>
    <ArrowDownIcon />
  </View>
);

const CustomTextInput = ({
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  autoCapitalize,
  maxLength,
  editable
}: {
  placeholder: string;
  value: string;
  maxLength?: any;
  editable?: any;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'numeric';
  autoCapitalize?: 'characters' | 'none' | 'sentences' | 'words'
}) => (
  <View style={[styles.selectUser, styles.row]}>
    <TextInput
      style={styles.textInput}
      placeholder={placeholder}
      placeholderTextColor={'#718096'}
      value={value}
      maxLength={maxLength}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize || 'sentences'}
      editable={editable ? !editable : true}
    />
  </View>
);



const CustomUploadBox = ({ label }: { label: string }) => (
  <View style={[styles.uploadBox, { width: '48%', gap: 6 }]}>
    <UploadIcon />
    <AppText size={13} color={'#64748B'} family="InterMedium" >
      {label}
    </AppText>
  </View>
);


const AddCustomer = ({ navigation, route }: any) => {
  const isEditMode = !!route?.params?.customer;           // better
  const distributorId = isEditMode ? route.params.customer.id : null;
  const customerTypeId = route?.params?.customerTypeId;
  const customerTypeName = route?.params?.customerTypeName || route?.params?.customer?.customer_type || route?.params?.customer?.type || 'Distributor';



  const [formData, setFormData] = useState({
    legalName: '',
    tradeName: '',
    distributorCode: '',
    distributorCategory: '',
    businessStatus: '',
    businessStartDate: null as Date | null, // we'll store Date object

    // New Contact & Communication fields
    primaryContactPerson: '',
    designation: '',
    primaryMobile: '',
    alternateMobile: '',
    primaryEmail: '',
    secondaryEmail: '',

    // Address & Location - Billing
    billingAddressLine1: '',
    billingCountry: 'IN',           // default India (value)
    billingState: '',
    billingDistrict: '',
    billingCity: '',
    billingPincode: '',

    // Address & Location - Shipping
    shippingAddressLine1: '',
    shippingCountry: 'IN',
    shippingState: '',
    shippingDistrict: '',
    shippingCity: '',
    shippingPincode: '',

    sameAsBilling: true,            // default checked 

    // Business & Operational Information
    salesZone: '',
    areaTerritory: '',
    beatRoute: '',
    marketClassification: '',
    competitorBrands: '',


    // Compliance & Legal
    gstNumber: '',
    panNumber: '',
    businessRegistrationType: '',

    // Banking & Financial Information
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscSwift: '',
    branchName: '',
    creditLimitAssigned: '',
    creditLimitDays: '',
    averageMonthlyPurchase: '',      // optional
    outstandingBalance: '',          // optional
    preferredPaymentMethod: '',

    // Sales & Performance Information
    monthlySalesVolume: '',
    productCategoriesHandled: '',
    secondarySalesReporting: '',           // optional
    last12MonthsSales: '',                 // optional
    assignedSalesExecutives: '',           // array for multi-select
    // assignedSalesExecutives: [],           // array for multi-select
    assignedSupervisor: '',
    customerSegment: '',

    // Additional Information
    weeklyTaiAlert: '',
    targetVsAchievementAnnually: '',
    schemesUpdates: '',
    newLaunchUpdate: '',
    alertForPayment: '',
    pendingOrderList: '',
    inventoryStatus: '',

    // Operational & Business Capacity
    turnover: '',
    staffStrength: '',
    vehiclesLogisticsCapacity: '',
    areaCoverage: '',
    otherBrandsHandled: '',
    warehouseSize: '',

    shopImage: null as any,           // or better: Asset | null
    profileImage: null as any,
    cancelledCheque: null as any,
    mouDocument: null as any,
    additionalDocument: null as any
  });

  const [locationEnabled, setLocationEnabled] = useState(true);

  // Date picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // Example: store lists fetched from your API
  const [statesList, setStatesList] = useState<{ label: string; value: string }[]>([]);
  const [districtsBilling, setDistrictsBilling] = useState<{ label: string; value: string }[]>([]);
  const [citiesBilling, setCitiesBilling] = useState<{ label: string; value: string }[]>([]);
  const [pincodesBilling, setPincodesBilling] = useState<{ label: string; value: string }[]>([]);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]> | null>(null);
  // Similar for shipping if independent
  const [districtsShipping, setDistrictsShipping] = useState<{ label: string; value: string }[]>([]);
  const [citiesShipping, setCitiesShipping] = useState<{ label: string; value: string }[]>([]);
  const [pincodesShipping, setPincodesShipping] = useState<{ label: string; value: string }[]>([]);
  const [superVisorList, setSuperVisorList] = useState<{ label: string; value: string }[]>([]);
  const [emailError, setEmailError] = useState<string>('');
  const [emailSecondaryError, setEmailSecondaryError] = useState<string>('');
  const actionSheetRef = useRef<ActionSheetRef>(null);
  const [currentUploadField, setCurrentUploadField] = useState<string | null>(null);
  const [currentUploadLabel, setCurrentUploadLabel] = useState<string>('Upload Image');



  const { mutateAsync: muatateGetApiList } = useGetStateListApi();
  const { mutateAsync: mutateGetDistrict } = useGetDistrictListApi();
  const { mutateAsync: mutateCityList } = useGetCityListApi();
  const { mutateAsync: getPincodes } = useGetPincodeListAPi();
  const { mutateAsync: getPincodesByCity } = useGetPincodeByCityListAPi();

  const { mutateAsync: mutateSuperVisorList } = useGetSuperVisorListApi();

  useEffect(() => {
    handleGetStateList()
    handleSuperVisorList()
    loadBeats();
  }, [])

  const validateMobile = (mobile: string) => {
    if (!mobile) return 'Primary Mobile is required';
    if (!/^[6-9]\d{9}$/.test(mobile)) return 'Enter valid 10-digit mobile number';
    return '';
  };

  useFocusEffect(
      useCallback(() => {
        navigation.setOptions({
          headerTitle: `${isEditMode ? 'Edit Customer' : 'Add Customer'}`,     // ← change to whatever you want
        });
      }, [navigation, isEditMode] 
    ));


  type ImageUploadProps = {
    label: string;
    value: Asset | null | undefined;
    onChange: (asset: Asset | null) => void;
    required?: boolean;
  };
  const openUploadSheet = (field: string, label: string) => {
    setCurrentUploadField(field);
    setCurrentUploadLabel(label);
    actionSheetRef.current?.show();
  };

  const ImageUploadBox = ({ label, value, onChange, required = false }: ImageUploadProps) => {
    const data = route?.params?.customer;

    const removeImage = () => {
      onChange(null);
    };
    const fieldName = label.toLowerCase().includes('shop') ? 'shopImage' :
      label.toLowerCase().includes('cheque') ? 'cancelledCheque' :
        label.toLowerCase().includes('mou') ? 'mouDocument' :
          label.toLowerCase().includes('additional') ? 'additionalDocument' :
            label.toLowerCase().includes('profile') ? 'profileImage' : '';
    // Determine which image to show
    let displayImage: string | null = null;

    if (value?.uri) {
      // New picked image
      displayImage = value.uri;
    } else if (isEditMode && !value) {
      // Show existing image from server
      switch (fieldName) {
        case 'shopImage':
          displayImage = data?.shop_image ? `${IMAGE_BASE_URL}public/storage/${data.shop_image}` : null;
          console.log(displayImage, 'data?.shop_imagedata?.shop_image')
          break;
        case 'profileImage':
          displayImage = data?.profile_image ? `${IMAGE_BASE_URL}public/storage/${data.profile_image}` : null;
          break;
        case 'cancelledCheque':
          displayImage = data?.cancelled_cheque ? `${IMAGE_BASE_URL}public/storage/${data.cancelled_cheque}` : null;
          break;
        case 'mouDocument':
          displayImage = data?.mou_file ? `${IMAGE_BASE_URL}public/storage/${data.mou_file}` : null;
          break;
        case 'additionalDocument':
          const parsed = JSON.parse(data?.documents);
          if (Array.isArray(parsed)) {
            if (parsed.length > 0) {
              displayImage = `${IMAGE_BASE_URL}public/storage/${parsed[0]}`;
            } else {
              displayImage = null
            }
          } else {
            displayImage = null
          }

          break;
        // additional document is array – more complex
        default:
          displayImage = null;
      }
    }

    return (
      <View style={{ width: '48%', marginBottom: 16 }}>
        <AppText size={14} color={colors.black} family="InterMedium">
          {label} {required && <AppText color="red">*</AppText>}
        </AppText>

        <TouchableOpacity
          style={[
            styles.uploadBox,
            {
              height: 140,
              justifyContent: value ? 'flex-start' : 'center',
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: value ? '#22C55E' : '#CBD5E1',
              borderStyle: 'dashed',
              borderRadius: 12,
              overflow: 'hidden',
              marginTop: 8,
            },
          ]}
          onPress={() => openUploadSheet(fieldName, label)}
        >
          {displayImage ? (
            <>
              <FastImage
                source={{ uri: displayImage }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={removeImage}
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
                Tap to upload{' '}
                {label.toLowerCase().includes('cheque') || label.toLowerCase().includes('mou')
                  ? '(PDF or Image allowed)'
                  : ''}
              </AppText>
            </View>
          )}
        </TouchableOpacity>

        {/* {value && (
        <AppText size={12} color="#22C55E" family="InterRegular">
          Uploaded • {value.fileName || 'image'}
        </AppText>
      )} */}
      </View>
    );
  };

  const [billingPincode, setBillingPincode] = useState('');
  const [billingStateName, setBillingStateName] = useState('');
  const [billingDistrictName, setBillingDistrictName] = useState('');
  const [billingCityName, setBillingCityName] = useState('');

  const [shippingPincode, setShippingPincode] = useState('');
  const [shippingStateName, setShippingStateName] = useState('');
  const [shippingDistrictName, setShippingDistrictName] = useState('');
  const [shippingCityName, setShippingCityName] = useState('');

  const handleGetStateList = async () => {
    try {
      const res = await muatateGetApiList();
      if (res?.data?.status == "success") {
        const formatted = res?.data?.data?.map((item: any) => ({
          label: item.state_name,
          value: String(item.state_id),          // better to use ID as value
          // value: item.state_name,     // ← if your backend expects name instead
        }));
        setStatesList(formatted);
      }
    } catch (error) {
      console.log("get challenges by user error:", error);
    }
  }

  const handleSuperVisorList = async () => {
    try {
      const res = await mutateSuperVisorList();
      if (res?.data?.status == true) {
        const formatted = res?.data?.data?.map((item: any) => ({
          label: item.name,
          value: String(item.id),          // better to use ID as value
          // value: item.state_name,     // ← if your backend expects name instead
        }));
        setSuperVisorList(formatted)
      }
    } catch (error) {
      console.log("get mutateSuperVisorList", error);
    }
  }

  const handleGetDistrictList = async (value: any, status: any) => {
    try {
      const res = await mutateGetDistrict(value);
      if (res?.data?.status == "success") {
        const formatted = res?.data?.data?.map((item: any) => ({
          label: item.district_name,
          value: String(item.district_id),          // better to use ID as value
          // value: item.state_name,     // ← if your backend expects name instead
        }));
        if (status == "billing") {
          setDistrictsBilling(formatted);
        }
        if (status == "shipping") {
          setDistrictsShipping(formatted)
        }
      }
    } catch (error) {
      console.log("get challenges by user error:", error);
    }
  }
  const REQUIRED_ATTACHMENTS = [
    {
      key: 'shopImage',
      label: 'Shop / Outlet Image',
    },
    {
      key: 'cancelledCheque',
      label: 'Cancelled Cheque',
    },
    {
      key: 'mouDocument',
      label: 'MOU Document',
    },
    {
      key: 'additionalDocument',
      label: 'Additional Document',
    },
  ] as const;

  const handleGetCitiesList = async (value: any, status: any) => {
    try {
      const res = await mutateCityList(value);
      if (res?.data?.status == "success") {
        const formatted = res?.data?.data?.map((item: any) => ({
          label: item.city_name,
          value: String(item.city_id),          // better to use ID as value
          // value: item.state_name,     // ← if your backend expects name instead
        }));
        if (status == "billing") {
          setCitiesBilling(formatted);
        }
        if (status == "shipping") {
          setCitiesShipping(formatted)
        }
      }
    } catch (error) {
      console.log("get challenges by user error:", error);
    }
  }

  const [pinCode, setPincode] = useState('')
  //  const loadPincodesByCity = async (cityId: any) => {
  //   try {
  //     const res = await getPincodesByCity(cityId);
  //     console.log(res?.data, 'res data');

  //     if (res?.data?.status === 'success') {

  //       const pincodes = res?.data?.data || [];

  //       if (existingCustomer?.pincode_id) {

  //         const matchedPincode = pincodes.find(
  //           (item: any) => item.pincode_id === existingCustomer.pincode_id
  //         );
  //         if (matchedPincode) {
  //           setPincode(matchedPincode.pincode);
  //           handleChange("pincode_id", matchedPincode.pincode_id);
  //           // also load location details
  //           loadPincodes(String(matchedPincode.pincode));
  //         }
  //       }
  //     }
  //   } catch (e) {
  //     console.log("Pincode by city error", e);
  //   }
  // };

  const loadPincodesByCity = async (cityId: any,type:any) => {
  try {
    const res = await getPincodesByCity(cityId);

    if (res?.data?.status === 'success') {

      const pincodes = res?.data?.data || [];
console.log(pincodes,formData.billingPincode,'ssj');
      if (formData.billingPincode) {

       const matchedPincode = pincodes.find(
  (item: any) => String(item.pincode_id) === String(formData.billingPincode)
);
        if (matchedPincode) {
          console.log(matchedPincode,'kdjjd');
          setBillingPincode(matchedPincode.pincode);
          handleChange("billingPincode", matchedPincode.pincode_id);
          // also load location details
          loadLocationByPincode(String(matchedPincode.pincode),type);
        }
      }
    }
  } catch (e) {
    console.log("Pincode by city error", e);
  }
};
console.log(billingPincode,'sksk');
  const loadLocationByPincode = async (
    pincode: string,
    type: "billing" | "shipping"
  ) => {
    try {
      const res = await getPincodes(pincode);
      const data = res?.data;

      if (res?.status === 200 && data?.pincode) {

        if (type === "billing") {

          setBillingStateName(data.state);
          setBillingDistrictName(data.district);
          setBillingCityName(data.city);

          handleChange("billingState", data.state_id);
          handleChange("billingDistrict", data.district_id);
          handleChange("billingCity", data.city_id);
          handleChange("billingPincode", data.pincode_id);

          if (formData.sameAsBilling) {
            setShippingStateName(data.state);
            setShippingDistrictName(data.district);
            setShippingCityName(data.city);
            setShippingPincode(pincode);

            handleChange("shippingState", data.state_id);
            handleChange("shippingDistrict", data.district_id);
            handleChange("shippingCity", data.city_id);
            handleChange("shippingPincode", data.pincode_id);
          }
        }

        if (type === "shipping") {

          setShippingStateName(data.state);
          setShippingDistrictName(data.district);
          setShippingCityName(data.city);

          handleChange("shippingState", data.state_id);
          handleChange("shippingDistrict", data.district_id);
          handleChange("shippingCity", data.city_id);
          handleChange("shippingPincode", data.pincode_id);
        }

      } else {
        Toast.show({
          type: "error",
          text1: "Invalid Pincode",
          text2: "Please enter correct pincode",
        });
      }
    } catch (e) {
      console.log("Pincode error", e);
    }
  };


  const pickFromGallery = () => {
    const options: any = {
      mediaType: 'photo' as const,
      quality: 0.85,
      includeBase64: false, // set true only if you really need base64
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
        actionSheetRef.current?.hide();
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Toast.show({
          type: 'error',
          text1: response.errorMessage || 'Gallery error',
        });
        actionSheetRef.current?.hide();
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        if (currentUploadField) {
          handleChange(currentUploadField, asset);
        }
        actionSheetRef.current?.hide();
      }
    });
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    launchCamera(
      {
        mediaType: 'photo',
        includeBase64: false,
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 1,           // ← slightly lower than 1 to save space/bandwidth
        saveToPhotos: false,
        cameraType: 'back',      // or 'front' – you can make dynamic if needed
        // Note: selectionLimit has NO EFFECT in launchCamera – it's always single capture
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel) {
          console.log('User cancelled camera');
          return;
        }

        if (response.errorCode) {
          Toast.show({
            type: 'error',
            text1: response.errorMessage || 'Camera error',
          });
          return;
        }

        if (response.assets && response.assets.length > 0) {
          const uri = response.assets[0]?.uri;
          if (!uri) return;
          const asset = response.assets[0];
          if (currentUploadField) {
            handleChange(currentUploadField, asset);

          }
          actionSheetRef.current?.hide();
        }
      }
    );
  };

  const [beats, setBeats] = useState([]);

  const loadBeats = async () => {
    try {
      const res = await getBeatList();
      console.log(res, 'sjsjjs');
      if (res?.data?.status === 'success') {
        const formattedBeats = res?.data?.data?.map((beat) => ({
          label: beat.beat_name,
          value: beat.beat_id,
        }));

        setBeats(formattedBeats);
      }
    } catch (error) {
      console.log('Beat API error', error);
    }
  };

  const getBasicInfoCount = () => {
    let count = 0;
    if (formData.legalName.trim()) count++;
    if (formData.distributorCode.trim()) count++;
    if (formData.distributorCategory) count++;
    if (formData.businessStatus) count++;
    if (formData.businessStartDate) count++;
    return count;
  };

  const getContactCount = () => {
    let count = 0;
    if (formData.primaryContactPerson.trim()) count++;
    if (formData.primaryMobile.trim()) count++;
    if (formData.primaryEmail.trim() && formData.primaryEmail.includes('@')) count++;
    return count;
  };

  const getBillingAddressCount = () => {
    let count = 0;
    if (formData.billingAddressLine1.trim()) count++;
    if (formData.billingCountry) count++;
    if (formData.billingState) count++;
    if (formData.billingDistrict) count++;
    if (formData.billingCity) count++;
    if (billingPincode) count++;
    return count;
  };

  const getShippingAddressCount = () => {
    let count = 0;
    if (formData.shippingAddressLine1.trim()) count++;
    if (formData.shippingCountry) count++;
    if (formData.shippingState) count++;
    if (formData.shippingDistrict) count++;
    if (formData.shippingCity) count++;
    if (shippingPincode) count++;
    return count;
  };

  console.log(formData,'formDataformData');
  const getBusinessOperationalCount = () => {
    let count = 0;
    if (formData.salesZone) count++;
    if (formData.areaTerritory) count++;
    if (formData.beatRoute) count++;
    if (formData.marketClassification) count++;
    if (formData.competitorBrands.trim()) count++;
    return count;
  };

  const getComplianceLegalCount = () => {
    let count = 0;
    if (formData.gstNumber.trim().length >= 15) count++;
    if (formData.panNumber.trim().length === 10) count++;
    if (formData.businessRegistrationType) count++;
    return count;
  };

  const getBankingFinancialCount = () => {
    let count = 0;
    if (formData.bankName.trim()) count++;
    if (formData.accountHolderName.trim()) count++;
    if (formData.accountNumber.trim()) count++;
    if (formData.ifscSwift.trim()) count++;
    if (formData.branchName.trim()) count++;
    if (formData.creditLimitAssigned.trim()) count++;
    if (formData.creditLimitDays.trim()) count++;
    return count;
  };

  const getSalesPerformanceCount = () => {
    let count = 0;
    if (formData.monthlySalesVolume.trim()) count++;
    if (formData.productCategoriesHandled.trim()) count++;
    if (formData.assignedSalesExecutives) count++;
    if (formData.assignedSupervisor) count++;
    if (formData.customerSegment) count++;
    return count;
  };

  const getAdditionalInfoCount = () => {
    let count = 0;
    if (formData.weeklyTaiAlert) count++;
    if (formData.targetVsAchievementAnnually.trim()) count++;
    if (formData.schemesUpdates) count++;
    if (formData.newLaunchUpdate) count++;
    if (formData.alertForPayment) count++;
    if (formData.pendingOrderList) count++;
    if (formData.inventoryStatus) count++;
    return count;
  };

  const getOperationalCapacityCount = () => {
    let count = 0;
    if (formData.turnover.trim()) count++;
    if (formData.staffStrength.trim()) count++;
    if (formData.vehiclesLogisticsCapacity.trim()) count++;
    if (formData.areaCoverage.trim()) count++;
    if (formData.otherBrandsHandled.trim()) count++;
    if (formData.warehouseSize.trim()) count++;
    return count;
  };

  const isFormValid =
    getBasicInfoCount() === 5 &&
    getContactCount() === 3 &&
    getBillingAddressCount() === 6 &&
    (formData.sameAsBilling || getShippingAddressCount() === 6) &&
    getBusinessOperationalCount() === 5 &&
    getComplianceLegalCount() === 3 &&
    getBankingFinancialCount() === 7 &&
    getSalesPerformanceCount() === 5 &&
    getAdditionalInfoCount() === 7 &&
    getOperationalCapacityCount() === 6;

  const validateEmail = (email: string): string => {
    if (!email.trim()) return '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? '' : 'Please enter a valid email address';
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      if (prev.sameAsBilling && field.startsWith('billing')) {
        const shippingField = field.replace('billing', 'shipping');
        newData[shippingField] = value;
      }

      return newData;
    });

  };



  // ─── Helper to update form and sync shipping if needed ───────
  const handleChangeShipping = (field: string, value: string | Date | boolean | null) => {
    setFormData((prev) => {
      const newData: any = { ...prev, [field]: value };

      // Auto-sync shipping when sameAsBilling is true
      if (prev.sameAsBilling && field.startsWith('billing')) {
        const shippingField = field.replace('billing', 'shipping');
        newData[shippingField] = value;
      }

      return newData;
    });
  };

  // Dropdown data
  const categoryData = [
    { label: 'Diamond', value: 'diamond' },
    { label: 'Gold', value: 'gold' },
    { label: 'Silver', value: 'silver' },
    { label: 'Platinum', value: 'platinum' },
    { label: 'Bronze', value: 'bronze' },
  ];

  const statusData = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
    { label: 'On Hold', value: 'On Hold' },
  ];

  // You can define them as constants or load from API / context
  const areaTerritoryOptions = [
    { label: 'Bhopal Central', value: 'bhopal-central' },
    { label: 'Indore North', value: 'indore-north' },
    { label: 'Jabalpur East', value: 'jabalpur-east' },
    // ...
  ];



  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }); // → 17/02/2026
  };


  const prepareApiPayload = () => {
    const payload = new FormData();
    const appendIfPresent = (key: string, value: any) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        payload.append(key, String(value).trim());
      }
    };

    const addFile = (key: string, asset: any) => {
      if (asset && asset.uri && !asset.uri.startsWith('http')) {
        const filename = asset.fileName || `file_${Date.now()}.${asset.type?.split('/')[1] || 'jpg'}`;
        payload.append(key, {
          uri: asset.uri,
          name: filename,
          type: asset.type || 'image/jpeg',
        } as any);
      }
    };

    if (!isEditMode) {
      const [firstName, ...lastNameParts] = formData.primaryContactPerson.trim().split(/\s+/);

      payload.append('mobile', normalizeIndianMobileNumber(formData.primaryMobile));
      appendIfPresent('full_name', formData.primaryContactPerson);
      appendIfPresent('first_name', firstName);
      appendIfPresent('last_name', lastNameParts.join(' '));
      appendIfPresent('name', formData.legalName || formData.tradeName);
      appendIfPresent('email', formData.primaryEmail);
      appendIfPresent('contact_number', formData.alternateMobile);
      appendIfPresent('customer_code', formData.distributorCode);
      appendIfPresent('customertype', customerTypeId);
      appendIfPresent('firmtype', formData.businessRegistrationType || formData.distributorCategory);
      appendIfPresent('address1', formData.billingAddressLine1);
      appendIfPresent('country_id', formData.billingCountry === 'IN' ? '1' : formData.billingCountry);
      appendIfPresent('state_id', formData.billingState);
      appendIfPresent('district_id', formData.billingDistrict);
      appendIfPresent('city_id', formData.billingCity);
      appendIfPresent('pincode_id', formData.billingPincode);
      appendIfPresent('zipcode', billingPincode);
      appendIfPresent('beat_id', formData.beatRoute);
      appendIfPresent('gstin_no', formData.gstNumber);
      appendIfPresent('pan_no', formData.panNumber);
      appendIfPresent('account_holder', formData.accountHolderName);
      appendIfPresent('account_number', formData.accountNumber);
      appendIfPresent('bank_name', formData.bankName);
      appendIfPresent('ifsc_code', formData.ifscSwift);
      appendIfPresent('grade', formData.customerSegment);
      appendIfPresent('status_type', formData.businessStatus);

      addFile('shopimage', formData.shopImage);
      addFile('image', formData.profileImage);
      addFile('other_image', formData.additionalDocument || formData.cancelledCheque || formData.mouDocument);

      return payload;
    }

    // Basic Information
    payload.append('legal_name', formData.legalName || '');
    payload.append('trade_name', formData.tradeName || '');
    payload.append('distributor_code', formData.distributorCode || '');
    payload.append('category', formData.distributorCategory || '');
    payload.append('business_status', formData.businessStatus || '');

    // Format date as YYYY-MM-DD
    if (formData.businessStartDate) {
      const date = formData.businessStartDate;
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      payload.append('business_start_date', `${yyyy}-${mm}-${dd}`);
    }

    // Contact
    payload.append('contact_person', formData.primaryContactPerson || '');
    payload.append('designation', formData.designation || '');
    payload.append('mobile', formData.primaryMobile || '');
    payload.append('alternate_mobile', formData.alternateMobile || '');
    payload.append('email', formData.primaryEmail || '');
    payload.append('secondary_email', formData.secondaryEmail || '');

    // Billing Address
    payload.append('billing_address', formData.billingAddressLine1 || '');
    payload.append('billing_city', formData.billingCity || '');
    payload.append('billing_district', formData.billingDistrict || '');
    payload.append('billing_state', formData.billingState || '');     // name or ID?
    payload.append('billing_country', formData.billingCountry || 'India');
    payload.append('billing_pincode', formData.billingPincode || '');

    // Shipping Address
    payload.append('shipping_address', formData.shippingAddressLine1 || '');
    payload.append('shipping_city', formData.shippingCity || '');
    payload.append('shipping_district', formData.shippingDistrict || '');
    payload.append('shipping_state', formData.shippingState || '');
    payload.append('shipping_country', formData.shippingCountry || 'India');
    payload.append('shipping_pincode', formData.shippingPincode || '');

    // Business & Operational
    payload.append('sales_zone', formData.salesZone || '');
    payload.append('area_territory', formData.areaTerritory || '');
    payload.append('beat_route', formData.beatRoute || '');
    payload.append('market_classification', formData.marketClassification || '');
    payload.append('competitor_brands', formData.competitorBrands || '');

    // Compliance
    payload.append('gst_number', formData.gstNumber || '');
    payload.append('pan_number', formData.panNumber || '');
    payload.append('registration_type', formData.businessRegistrationType || '');

    // Banking
    payload.append('bank_name', formData.bankName || '');
    payload.append('account_holder', formData.accountHolderName || '');
    payload.append('account_number', formData.accountNumber || '');
    payload.append('ifsc', formData.ifscSwift || '');
    payload.append('branch_name', formData.branchName || '');
    payload.append('credit_limit', formData.creditLimitAssigned || '');
    payload.append('credit_days', formData.creditLimitDays || '');
    payload.append('avg_monthly_purchase', formData.averageMonthlyPurchase || '');
    payload.append('outstanding_balance', formData.outstandingBalance || '');
    payload.append('preferred_payment_method', formData.preferredPaymentMethod || '');

    // Sales & Performance
    payload.append('monthly_sales', formData.monthlySalesVolume || '');
    payload.append('product_categories', formData.productCategoriesHandled || '');
    payload.append('secondary_sales_required', formData.secondarySalesReporting || '');
    payload.append('last_12_months_sales', formData.last12MonthsSales || '');

    // Note: API expects sales_executive_id[0], sales_executive_id[1], ...
    if (formData.assignedSalesExecutives) {
      payload.append('sales_executive_id[0]', formData.assignedSalesExecutives);
      // If it's really multi-select later → loop and append sales_executive_id[0], [1], etc.
    }

    payload.append('supervisor_id', formData.assignedSupervisor || '');
    payload.append('customer_segment', formData.customerSegment || '');

    // Additional Information
    payload.append('weekly_tai_alert', formData.weeklyTaiAlert || '');
    payload.append('target_vs_achievement', formData.targetVsAchievementAnnually || '');
    payload.append('schemes_updates', formData.schemesUpdates || '');
    payload.append('new_launch_update', formData.newLaunchUpdate || '');
    payload.append('payment_alert', formData.alertForPayment || '');
    payload.append('pending_orders', formData.pendingOrderList || '');
    payload.append('inventory_status', formData.inventoryStatus || '');

    // Operational Capacity
    payload.append('turnover', formData.turnover || '');
    payload.append('staff_strength', formData.staffStrength || '');
    payload.append('vehicles_capacity', formData.vehiclesLogisticsCapacity || '');
    payload.append('area_coverage', formData.areaCoverage || '');
    payload.append('other_brands_handled', formData.otherBrandsHandled || '');
    payload.append('warehouse_size', formData.warehouseSize || '');

    // Checkbox
    payload.append('same_as_billing', formData.sameAsBilling ? '1' : '0');

    // Images / Files
    const addLegacyFile = (key: string, asset: any) => {
      if (asset && asset.uri && !asset.uri.startsWith('http')) {
        const filename = asset.fileName || `file_${Date.now()}.${asset.type?.split('/')[1] || 'jpg'}`;
        payload.append(key, {
          uri: asset.uri,
          name: filename,
          type: asset.type || 'image/jpeg',
        } as any);
      }
    };

    addLegacyFile('shop_image', formData.shopImage);
    addLegacyFile('profile_image', formData.profileImage);
    addLegacyFile('cancelled_cheque', formData.cancelledCheque);
    addLegacyFile('mou_file', formData.mouDocument);
    addLegacyFile('documents[]', formData.additionalDocument);   // note the [] for array

    return payload;
  };

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    setServerErrors(null);
    if (!isFormValid) {
      Toast.show({
        type: 'error',
        text1: 'Please complete all required fields',
      });
      return;
    }
    setSubmitLoading(true);
    const token = store.getState().auth?.token;
    const url = isEditMode
      ? `${BASE_URL}api/master-distributors/${distributorId}`
      : `${BASE_URL}${API_ENDPOINT.STORE_CUSTOMER}`;
    try {
      const formPayload = prepareApiPayload();
      logFormData(isEditMode ? 'Update Customer' : 'Store Customer', formPayload);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: formPayload,
      });

      const result = await response.json();
      const isSuccess = response.ok && (result?.status === true || result?.status === 'success');
      if (isSuccess) {
        Toast.show({
          type: 'success',
          text1: isEditMode ? 'Distributor updated successfully' : 'Distributor added successfully',
        });
        // Optionally reset form or navigate back
        navigation.goBack();
      } else {
        setServerErrors(result.errors);
        const message = Array.isArray(result?.message) ? result.message.join(', ') : result?.message;
        Toast.show({
          type: 'error', text1: message || 'Failed to add customer'
        })
        console.log('API Error:', result);
      }
      setSubmitLoading(false)
    } catch (error) {
      setSubmitLoading(false)
      console.error('Submit error:', error);
      Toast.show({
        type: 'error', text1: 'Something went wrong. Please try again.'
      })
    }
  };


  useEffect(() => {
    if (isEditMode && route.params.customer) {
      const data = route.params.customer;

      setFormData({
        legalName: data.legal_name || '',
        tradeName: data.trade_name || '',
        distributorCode: data.distributor_code || '',
        distributorCategory: data.category || '',
        businessStatus: data.business_status || '',
        businessStartDate: data.business_start_date
          ? new Date(data.business_start_date)
          : null,

        primaryContactPerson: data.contact_person || '',
        designation: data.designation || '',
        primaryMobile: data.mobile || '',
        alternateMobile: data.alternate_mobile || '',
        primaryEmail: data.email || '',
        secondaryEmail: data.secondary_email || '',

        billingAddressLine1: data.billing_address || '',
        billingCountry: data.billing_country || 'IN',
        billingState: data.billing_state || '',
        billingDistrict: data.billing_district || '',
        billingCity: data.billing_city || '',
        billingPincode: data.billing_pincode || '',

        shippingAddressLine1: data.shipping_address || '',
        shippingCountry: data.shipping_country || 'IN',
        shippingState: data.shipping_state || '',
        shippingDistrict: data.shipping_district || '',
        shippingCity: data.shipping_city || '',
        shippingPincode: data.shipping_pincode || '',

        sameAsBilling: data.same_as_billing === true || data.same_as_billing === '1',

        salesZone: data.sales_zone || '',
        areaTerritory: data.area_territory || '',
        beatRoute: data.beat_route || '',
        marketClassification: data.market_classification || '',
        competitorBrands: data.competitor_brands || '',

        gstNumber: data.gst_number || '',
        panNumber: data.pan_number || '',
        businessRegistrationType: data.registration_type || '',

        bankName: data.bank_name || '',
        accountHolderName: data.account_holder || '',
        accountNumber: data.account_number || '',
        ifscSwift: data.ifsc || '',
        branchName: data.branch_name || '',
        creditLimitAssigned: data.credit_limit || '',
        creditLimitDays: data.credit_days?.toString() || '',
        averageMonthlyPurchase: data.avg_monthly_purchase || '',
        outstandingBalance: data.outstanding_balance || '',
        preferredPaymentMethod: data.preferred_payment_method || '',

        monthlySalesVolume: data.monthly_sales || '',
        productCategoriesHandled: data.product_categories || '',
        secondarySalesReporting: data.secondary_sales_required || '',
        last12MonthsSales: data.last_12_months_sales || '',

        assignedSalesExecutives: data.sales_executives?.[0]?.id?.toString() || '', // adjust if multi
        assignedSupervisor: data.supervisor_id?.toString() || '',
        customerSegment: data.customer_segment || '',

        weeklyTaiAlert: data.weekly_tai_alert || '',
        targetVsAchievementAnnually: data.target_vs_achievement || '',
        schemesUpdates: data.schemes_updates || '',
        newLaunchUpdate: data.new_launch_update || '',
        alertForPayment: data.payment_alert || '',
        pendingOrderList: data.pending_orders || '',
        inventoryStatus: data.inventory_status || '',

        turnover: data.turnover || '',
        staffStrength: data.staff_strength || '',
        vehiclesLogisticsCapacity: data.vehicles_capacity || '',
        areaCoverage: data.area_coverage || '',
        otherBrandsHandled: data.other_brands_handled || '',
        warehouseSize: data.warehouse_size || '',

        // Images – we'll handle display separately
        shopImage: null,
        profileImage: null,
        cancelledCheque: null,
        mouDocument: null,
        additionalDocument: null,
      });
      // Optional: load dependent dropdowns (state → district → city → pincode)
     
     
      if(data.billing_city){
        loadPincodesByCity(data.billing_city,"billing")
      }
      // same for shipping if !sameAsBilling
    }
  }, [isEditMode, route.params?.customer,]);


  // ── Inside the component (states remain the same) ──
  
  const { mutateAsync: getBeatList } = useGetBeatList();
const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const { coords } = useLocationHook();
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLng, setCurrentLng] = useState<number | null>(null);

  useEffect(() => {
    if (useCurrentLocation && coords) {
      // Update local state when hook has location
      const lat = Number(coords.latitude.toFixed(6));
      const lng = Number(coords.longitude.toFixed(6));

      setCurrentLat(lat);
      setCurrentLng(lng);
      handleChange("gps_location", `${lat},${lng}`);
      Toast.show({
        type: "success",
        text1: "Location captured",
        text2: `${lat},${lng}`,
        position: "top",
      });

    } else if (!useCurrentLocation) {
      setCurrentLat(null);
      setCurrentLng(null);
      handleChange("gps_location", "");
    }
  }, [useCurrentLocation, coords]);

  // ── Optional: Request location permission on mount (Android mostly) ──
  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: "Location Permission",
              message: "This app needs access to your location to auto-fill coordinates.",
              buttonNeutral: "Ask Me Later",
              buttonNegative: "Cancel",
              buttonPositive: "OK"
            }
          );
          // You can also request ACCESS_BACKGROUND_LOCATION if needed later
        } catch (err) {
          console.warn(err);
        }
      }
    };

    requestLocationPermission();
  }, []);


  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ backgroundColor: '#E0F2FE', padding: 16, alignItems: 'center', borderRadius: 8, marginBottom: 16 }}>
          <AppText size={16} family="InterSemiBold" color={colors.blue}>
            Customer Type: {customerTypeName}
          </AppText>
        </View>

        <AccordionSection title="Basic Information" defaultExpanded={true}>
          {/* Progress indicator */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <AppText size={16} color={getBasicInfoCount() === 5 ? '#22C55E' : '#64748B'} family="InterSemiBold">
              {getBasicInfoCount()}/5 completed
            </AppText>
          </View>

          <CustomTextInput
            placeholder="Legal Name *"
            value={formData.legalName}
            onChangeText={(text) => handleChange('legalName', text)}
          />

          <CustomTextInput
            placeholder="Trade Name (optional)"
            value={formData.tradeName}
            onChangeText={(text) => handleChange('tradeName', text)}
          />

          <CustomTextInput
            placeholder="Distributor Code *"
            value={formData.distributorCode}
            onChangeText={(text) => handleChange('distributorCode', text)}
          />

          {/* Searchable Dropdown - Distributor Category */}
          <Dropdown
            style={[styles.selectUser, { paddingHorizontal: 12, paddingVertical: 14 }]}
            placeholderStyle={{ color: '#718096', fontSize: 14 }}
            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
            inputSearchStyle={{ height: 40, fontSize: 14 }}
            data={categoryData}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Distributor Category *"
            searchPlaceholder="Search category..."
            value={formData.distributorCategory}
            onChange={(item) => handleChange('distributorCategory', item.value)}
            renderRightIcon={() => <ArrowDownIcon />}
          />

          {/* Searchable Dropdown - Business Status */}
          <Dropdown
            style={[styles.selectUser, { paddingHorizontal: 12, paddingVertical: 14, marginTop: 12 }]}
            placeholderStyle={{ color: '#718096', fontSize: 14 }}
            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
            inputSearchStyle={{ height: 40, fontSize: 14 }}
            data={statusData}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Business Status *"
            searchPlaceholder="Search status..."
            value={formData.businessStatus}
            onChange={(item) => handleChange('businessStatus', item.value)}
            renderRightIcon={() => <ArrowDownIcon />}
          />

          {/* Date Picker Trigger */}
          <TouchableOpacity
            style={[
              styles.selectUser,
              {
                justifyContent: 'space-between',
                paddingHorizontal: 12,
                paddingVertical: 14,
                marginTop: 12,
                flexDirection: "row",
                alignItems: 'center',
              },
            ]}
            onPress={() => {
              // When opening modal: initialize tempDate with current saved value or today
              const initial = formData.businessStartDate || new Date();
              setTempDate(initial);
              setShowDatePicker(true);
            }}
          >
            <AppText
              size={14}
              color={formData.businessStartDate ? colors.black : '#718096'}
              family="InterRegular"
            >
              {formData.businessStartDate
                ? `${formatDate(formData.businessStartDate)}`
                : 'Business Start Date * (DD/MM/YYYY)'}
            </AppText>
            <ArrowDownIcon />
          </TouchableOpacity>

        </AccordionSection>

        <AccordionSection title="Contact & Communication">
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <AppText size={16} color={getContactCount() === 3 ? '#22C55E' : '#64748B'} family="InterSemiBold">
              {getContactCount()}/3 completed
            </AppText>
          </View>

          <CustomTextInput
            placeholder="Primary Contact Person *"
            value={formData.primaryContactPerson}
            onChangeText={(text) => handleChange('primaryContactPerson', text)}
          />

          <CustomTextInput
            placeholder="Designation (optional)"
            value={formData.designation}
            onChangeText={(text) => handleChange('designation', text)}
          />

          <CustomTextInput
            placeholder="Primary Mobile *"
            value={formData.primaryMobile}
            onChangeText={(text) => handleChange('primaryMobile', text)}
            keyboardType="phone-pad"
            maxLength={10}
            editable={isEditMode}
          />

          <CustomTextInput
            placeholder="Alternate Mobile (optional)"
            value={formData.alternateMobile}
            onChangeText={(text) => handleChange('alternateMobile', text)}
            keyboardType="phone-pad"
            maxLength={10}
          />

          <CustomTextInput
            placeholder="Primary Email *"
            value={formData.primaryEmail}
            onChangeText={(text) => {
              handleChange('primaryEmail', text);
              setEmailError(validateEmail(text));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={isEditMode}
          />
          {emailError ? (
            <AppText
              color="#BE0B0B"
              size={12}
              family="InterRegular"
            >
              {emailError}
            </AppText>
          ) : null}
          <CustomTextInput
            placeholder="Secondary Email (optional)"
            value={formData.secondaryEmail}
            onChangeText={(text) => {
              handleChange('secondaryEmail', text);
              setEmailSecondaryError(validateEmail(text));
            }}
            // onChangeText={(text) => handleChange('secondaryEmail', text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailSecondaryError ? (
            <AppText
              color="#BE0B0B"
              size={12}
              family="InterRegular"
            >
              {emailSecondaryError}
            </AppText>
          ) : null}
        </AccordionSection>

        <AccordionSection title="Address & Location Information">
          {/* Progress indicator (billing focused) */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <AppText
              size={16}
              color={
                formData.sameAsBilling
                  ? getBillingAddressCount() === 6
                    ? '#22C55E'
                    : '#64748B'
                  : getShippingAddressCount() === 6
                    ? '#22C55E'
                    : '#64748B'
              }
              family="InterSemiBold"
            >
              {formData.sameAsBilling
                ? `Billing ${getBillingAddressCount()}/6 completed`
                : `Shipping ${getShippingAddressCount()}/6 completed`}
            </AppText>
          </View>

          {/* Billing Address */}
          <AppText size={16} family="InterSemiBold">
            Billing Address
          </AppText>

          <CustomTextInput
            placeholder="Address Line 1 *"
            value={formData.billingAddressLine1}
            onChangeText={(text) => handleChange('billingAddressLine1', text)}
          />

          {/* Country Dropdown */}
          <Dropdown
            style={[styles.selectUser, { paddingHorizontal: 12, paddingVertical: 14, marginTop: 12 }]}
            placeholderStyle={{ color: '#718096', fontSize: 14 }}
            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
            inputSearchStyle={{ height: 40, fontSize: 14 }}
            data={[
              { label: 'India', value: 'IN' },
              { label: 'United States', value: 'US' },  // add more if needed
            ]}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Country *"
            searchPlaceholder="Search country..."
            value={formData.billingCountry}
            onChange={(item) => {

              handleChange('billingCountry', item.value);
              if (formData.sameAsBilling) handleChange('shippingCountry', item.value);
              // Optional: fetchStates() here if country changes affect states list
            }}
            renderRightIcon={() => <ArrowDownIcon />}
          />

          <CustomTextInput
            placeholder="Pincode *"
            maxLength={6}
            value={billingPincode}
            onChangeText={(text) => {

              setBillingPincode(text);
              // handleChange("billingPincode", text);

              if (text.length === 6) {
                loadLocationByPincode(text, "billing");
              }

              if (text.length === 0) {
                setBillingStateName('');
                setBillingDistrictName('');
                setBillingCityName('');

                handleChange("billingState", "");
                handleChange("billingDistrict", "");
                handleChange("billingCity", "");
              }

            }}

          />
          <CustomTextInput
            placeholder="State *"
            value={billingStateName}
            editable={true}
            onChangeText={(text: string) => {
              handleChange('shippingState', text);
            }}
          />
          <CustomTextInput
            placeholder="District *"
            value={billingDistrictName}
            editable={true}
            onChangeText={(text: string) => {
              handleChange('shippingDistrict', text)
            }}
          />
          <CustomTextInput
            placeholder="City *"
            editable={true}
            value={billingCityName}
            onChangeText={(text: string) => {
              handleChange('shippingCity', text)

            }}
          />

          {/* Checkbox */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 16 }}>
            <Switch
              value={formData.sameAsBilling}
              onValueChange={(checked) => {

                handleChange('sameAsBilling', checked);

                if (checked) {
                  // Copy billing → shipping
                  handleChange('shippingAddressLine1', formData.billingAddressLine1);
                  handleChange('shippingCountry', formData.billingCountry);
                  handleChange('shippingState', formData.billingState);
                  handleChange('shippingDistrict', formData.billingDistrict);
                  handleChange('shippingCity', formData.billingCity);
                  handleChange('shippingPincode', formData.billingPincode);

                  setShippingPincode(billingPincode);
                  setShippingStateName(billingStateName);
                  setShippingDistrictName(billingDistrictName);
                  setShippingCityName(billingCityName);

                } else {
                  // 🔴 CLEAR SHIPPING ADDRESS
                  handleChange('shippingAddressLine1', '');
                  handleChange('shippingCountry', '');
                  handleChange('shippingState', '');
                  handleChange('shippingDistrict', '');
                  handleChange('shippingCity', '');
                  handleChange('shippingPincode', '');

                  setShippingPincode('');
                  setShippingStateName('');
                  setShippingDistrictName('');
                  setShippingCityName('');
                }
              }}

            />
            <AppText size={14}>
              {'  '}Same as Billing Address
            </AppText>
          </View>

          {/* Shipping Address – only visible when not same */}
          {!formData.sameAsBilling && (
            <>
              <AppText size={16} family="InterSemiBold" >
                Shipping Address
              </AppText>

              <CustomTextInput
                placeholder="Address Line 1 *"
                value={formData.shippingAddressLine1}
                onChangeText={(text) => handleChange('shippingAddressLine1', text)}
              />

              <Dropdown
                style={[styles.selectUser, { paddingHorizontal: 12, paddingVertical: 14, marginTop: 12 }]}
                placeholderStyle={{ color: '#718096', fontSize: 14 }}
                selectedTextStyle={{ color: colors.black, fontSize: 14 }}
                inputSearchStyle={{ height: 40, fontSize: 14 }}
                data={[
                  { label: 'India', value: 'IN' },
                  { label: 'United States', value: 'US' },  // add more if needed
                ]}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Country *"
                searchPlaceholder="Search country..."
                value={formData.shippingCountry}
                onChange={(item) => {
                  handleChange('shippingCountry', item.value);
                  // if (formData.sameAsBilling) handleChange('shippingCountry', item.value);

                  // Optional: fetchStates() here if country changes affect states list
                }}
                renderRightIcon={() => <ArrowDownIcon />}
              />

              {/* State Dropdown */}

              <CustomTextInput
                placeholder="Pincode *"
                maxLength={6}
                value={shippingPincode}
                onChangeText={(text) => {

                  setShippingPincode(text);
                  handleChange("shippingPincode", text);

                  if (text.length === 6) {
                    loadLocationByPincode(text, "shipping");
                  }

                  if (text.length === 0) {
                    setShippingStateName('');
                    setShippingDistrictName('');
                    setShippingCityName('');

                    handleChange("shippingState", "");
                    handleChange("shippingDistrict", "");
                    handleChange("shippingCity", "");
                  }

                }}

              />
              <CustomTextInput
                placeholder="State *"
                value={shippingStateName}
                editable={true}
                onChangeText={(text: string) => {
                  handleChange('shippingState', text);
                }}
              />
              <CustomTextInput
                placeholder="District *"
                value={shippingDistrictName}
                editable={true}
                onChangeText={(text: string) => {
                  handleChange('shippingDistrict', text)
                }}
              />
              <CustomTextInput
                placeholder="City *"
                editable={true}
                value={shippingCityName}
                onChangeText={(text: string) => {
                  handleChange('shippingCity', text)

                }}
              />

            </>
          )}
        </AccordionSection>

        <AccordionSection title="Business & Operational Information">
          {/* Progress indicator – same style as Basic Information */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <AppText size={16} color={getBusinessOperationalCount() === 5 ? '#22C55E' : '#64748B'} family="InterSemiBold">
              {getBusinessOperationalCount()}/5 completed
            </AppText>
          </View>

          {/* 1. Sales Zone / Region */}
          <Dropdown
            style={[styles.selectUser, { paddingHorizontal: 12, paddingVertical: 14, marginTop: 12 }]}
            placeholderStyle={{ color: '#718096', fontSize: 14 }}
            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
            inputSearchStyle={{ height: 40, fontSize: 14 }}
            data={[
              { label: 'East', value: 'east' },
              { label: 'West', value: 'west' },
              { label: 'North', value: 'north' },
              { label: 'South', value: 'south' },
            ]}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Sales Zone / Region *"
            searchPlaceholder="Search zone..."
            value={formData.salesZone}
            onChange={(item) => handleChange('salesZone', item.value)}
            renderRightIcon={() => <ArrowDownIcon />}
          />

          {/* 2. Area / Territory */}
          <Dropdown
            style={[styles.selectUser, { paddingHorizontal: 12, paddingVertical: 14, marginTop: 12 }]}
            placeholderStyle={{ color: '#718096', fontSize: 14 }}
            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
            inputSearchStyle={{ height: 40, fontSize: 14 }}
            data={areaTerritoryOptions} // ← fill from your logic / API
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Area / Territory *"
            searchPlaceholder="Search area / territory..."
            value={formData.areaTerritory}
            onChange={(item) => handleChange('areaTerritory', item.value)}
            renderRightIcon={() => <ArrowDownIcon />}
          />

          {/* 3. Beat Route */}
          <Dropdown
            style={[styles.selectUser, { paddingHorizontal: 12, paddingVertical: 14, marginTop: 12 }]}
            placeholderStyle={{ color: '#718096', fontSize: 14 }}
            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
            inputSearchStyle={{ height: 40, fontSize: 14 }}
            data={beats}
            // value={formData.beat_id}
            // onChange={(item) => handleChange('beat_id', item.value)}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Beat Route *"
            searchPlaceholder="Search beat route..."
            value={formData.beatRoute}
            onChange={(item) => handleChange('beatRoute', item.value)}
            renderRightIcon={() => <ArrowDownIcon />}
          />

          {/* 4. Market Classification */}
          <Dropdown
            style={[styles.selectUser, { paddingHorizontal: 12, paddingVertical: 14, marginTop: 12 }]}
            placeholderStyle={{ color: '#718096', fontSize: 14 }}
            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
            inputSearchStyle={{ height: 40, fontSize: 14 }}
            data={[
              { label: 'Urban', value: 'urban' },
              { label: 'Rural', value: 'rural' },
              { label: 'Semi-Urban', value: 'semi-urban' },
            ]}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Market Classification *"
            searchPlaceholder="Search classification..."
            value={formData.marketClassification}
            onChange={(item) => handleChange('marketClassification', item.value)}
            renderRightIcon={() => <ArrowDownIcon />}
          />

          {/* 5. Competitor Brands Handled */}
          <CustomTextInput
            placeholder="Competitor Brands Handled *"
            value={formData.competitorBrands}
            onChangeText={(text) => handleChange('competitorBrands', text)}
          />
        </AccordionSection>


        <AccordionSection title="Compliance & Legal">
          {/* Progress indicator – same pattern as Basic Information */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <AppText size={16} color={getComplianceLegalCount() === 3 ? '#22C55E' : '#64748B'} family="InterSemiBold">
              {getComplianceLegalCount()}/3 completed
            </AppText>
          </View>

          {/* 1. GST Number */}
          <CustomTextInput
            placeholder="GST Number *"
            value={formData.gstNumber}
            onChangeText={(text) => {
              // Optional: force uppercase & limit length (GST is usually 15 chars)
              const upper = text.toUpperCase().replace(/[^0-9A-Z]/g, '');
              handleChange('gstNumber', upper.slice(0, 15));
            }}
            autoCapitalize="characters"

          />

          {/* 2. PAN Number */}
          <CustomTextInput
            placeholder="PAN Number * (e.g., ABCDE1234F)"
            value={formData.panNumber}
            onChangeText={(text) => {
              // Force uppercase & typical PAN format
              const upper = text.toUpperCase().replace(/[^0-9A-Z]/g, '');
              handleChange('panNumber', upper.slice(0, 10));
            }}
            autoCapitalize="characters"

          />

          {/* 3. Business Registration Type */}
          <Dropdown
            style={[styles.selectUser, { paddingHorizontal: 12, paddingVertical: 14, marginTop: 12 }]}
            placeholderStyle={{ color: '#718096', fontSize: 14 }}
            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
            inputSearchStyle={{ height: 40, fontSize: 14 }}
            data={[
              { label: 'Proprietorship', value: 'proprietorship' },
              { label: 'Partnership', value: 'partnership' },
              { label: 'Pvt Ltd', value: 'pvt_ltd' },
              { label: 'LLP', value: 'llp' },
            ]}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Business Registration Type *"
            searchPlaceholder="Search type..."
            value={formData.businessRegistrationType}
            onChange={(item) => handleChange('businessRegistrationType', item.value)}
            renderRightIcon={() => <ArrowDownIcon />}
          />
        </AccordionSection>

        <AccordionSection title="Banking & Financial Information">
          {/* Progress indicator – same style as Basic Information */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <AppText size={16} color={getBankingFinancialCount() === 7 ? '#22C55E' : '#64748B'} family="InterSemiBold">
              {getBankingFinancialCount()}/7 completed
            </AppText>
          </View>

          {/* 1. Bank Name */}
          <CustomTextInput
            placeholder="Bank Name *"
            value={formData.bankName}
            onChangeText={(text) => handleChange('bankName', text)}
          />

          {/* 2. Account Holder Name */}
          <CustomTextInput
            placeholder="Account Holder Name *"
            value={formData.accountHolderName}
            onChangeText={(text) => handleChange('accountHolderName', text)}
          />

          {/* 3. Account Number */}
          <CustomTextInput
            placeholder="Account Number *"
            value={formData.accountNumber}
            onChangeText={(text) => {
              // Allow only digits
              const numeric = text.replace(/[^0-9]/g, '');
              handleChange('accountNumber', numeric);
            }}
            keyboardType="numeric"
          />

          {/* 4. IFSC / SWIFT Code */}
          <CustomTextInput
            placeholder="IFSC / SWIFT Code *"
            value={formData.ifscSwift}
            onChangeText={(text) => {
              // IFSC is usually uppercase alphanumeric, SWIFT can be longer
              const upper = text.toUpperCase().replace(/[^0-9A-Z]/g, '');
              handleChange('ifscSwift', upper);
            }}
            autoCapitalize="characters"
          />

          {/* 5. Branch Name */}
          <CustomTextInput
            placeholder="Branch Name *"
            value={formData.branchName}
            onChangeText={(text) => handleChange('branchName', text)}
          />

          {/* 6. Credit Limit Assigned */}
          <CustomTextInput
            placeholder="Credit Limit Assigned *"
            value={formData.creditLimitAssigned}
            onChangeText={(text) => {
              const numeric = text.replace(/[^0-9.]/g, '');
              handleChange('creditLimitAssigned', numeric);
            }}
            keyboardType="numeric"
          />

          {/* 7. Credit Limit Assigned (Days) */}
          <CustomTextInput
            placeholder="Credit Limit Assigned (Days) *"
            value={formData.creditLimitDays}
            onChangeText={(text) => {
              const numeric = text.replace(/[^0-9]/g, '');
              handleChange('creditLimitDays', numeric);
            }}
            keyboardType="numeric"
          />

          {/* Optional fields – not counted in 7/7 */}
          <CustomTextInput
            placeholder="Average Monthly Purchase"
            value={formData.averageMonthlyPurchase}
            onChangeText={(text) => {
              const numeric = text.replace(/[^0-9.]/g, '');
              handleChange('averageMonthlyPurchase', numeric);
            }}
            keyboardType="numeric"
          />

          <CustomTextInput
            placeholder="Outstanding Balance"
            value={formData.outstandingBalance}
            onChangeText={(text) => {
              const numeric = text.replace(/[^0-9.]/g, '');
              handleChange('outstandingBalance', numeric);
            }}
            keyboardType="numeric"
          />

          {/* Preferred Payment Method – Dropdown */}
          <Dropdown
            style={[styles.selectUser, { paddingHorizontal: 12, paddingVertical: 14, marginTop: 12 }]}
            placeholderStyle={{ color: '#718096', fontSize: 14 }}
            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
            inputSearchStyle={{ height: 40, fontSize: 14 }}
            data={[
              { label: 'NEFT', value: 'neft' },
              { label: 'RTGS', value: 'rtgs' },
              { label: 'Cheque', value: 'cheque' },
              { label: 'Online', value: 'online' },
            ]}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Preferred Payment Method *"
            searchPlaceholder="Search method..."
            value={formData.preferredPaymentMethod}
            onChange={(item) => handleChange('preferredPaymentMethod', item.value)}
            renderRightIcon={() => <ArrowDownIcon />}
          />
        </AccordionSection>


        <AccordionSection title="Sales & Performance Information">
          {/* Progress indicator – consistent with Basic Information */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <AppText size={16} color={getSalesPerformanceCount() === 5 ? '#22C55E' : '#64748B'} family="InterSemiBold">
              {getSalesPerformanceCount()}/5 completed
            </AppText>
          </View>

          {/* 1. Monthly Sales Volume (Approx.) */}
          <CustomTextInput
            placeholder="Monthly Sales Volume (Approx.) *"
            value={formData.monthlySalesVolume}
            onChangeText={(text) => {
              const numeric = text.replace(/[^0-9]/g, '');
              handleChange('monthlySalesVolume', numeric);
            }}
            keyboardType="numeric"
          />

          {/* 2. Product Categories Handled */}
          <CustomTextInput
            placeholder="Product Categories Handled *"
            value={formData.productCategoriesHandled}
            onChangeText={(text) => handleChange('productCategoriesHandled', text)}
          />

          {/* 3. Secondary Sales Reporting Required (optional) */}
          <Dropdown
            style={[styles.selectUser, { paddingHorizontal: 12, paddingVertical: 14, marginTop: 12 }]}
            placeholderStyle={{ color: '#718096', fontSize: 14 }}
            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
            inputSearchStyle={{ height: 40, fontSize: 14 }}
            data={[
              { label: 'Yes', value: 'Yes' },
              { label: 'No', value: 'No' },
            ]}
            search={false} // no need to search for yes/no
            maxHeight={200}
            labelField="label"
            valueField="value"
            placeholder="Secondary Sales Reporting Required"
            value={formData.secondarySalesReporting}
            onChange={(item) => handleChange('secondarySalesReporting', item.value)}
            renderRightIcon={() => <ArrowDownIcon />}
          />

          {/* 4. Last 12 Months Sales History (optional) */}
          <CustomTextInput
            placeholder="Last 12 Months Sales History"
            value={formData.last12MonthsSales}
            keyboardType="numeric"
            onChangeText={(text) => handleChange('last12MonthsSales', text)}
          />

          {/* 5. Assigned Sales Executive * (multi select) */}
          <Dropdown
            style={[styles.selectUser, { paddingHorizontal: 12, paddingVertical: 14, marginTop: 12 }]}
            placeholderStyle={{ color: '#718096', fontSize: 14 }}
            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
            inputSearchStyle={{ height: 40, fontSize: 14 }}
            data={superVisorList}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Assigned Sales Executive *"
            searchPlaceholder="Search executive..."
            value={formData.assignedSalesExecutives} // array for multi-select
            onChange={(item) => {


              // const values = item.map(item => item.value);
              handleChange('assignedSalesExecutives', item.value);
              // For multi-select we need to handle array
              // Assuming you're using multi-select mode (need to set mode="MULTI")
              // If using single value → change to single string
            }}
            renderRightIcon={() => <ArrowDownIcon />}
          // Important: for real multi-select you need to enable multi mode
          // mode="MULTI"
          // selectedTextProps={{ numberOfLines: 2 }} // better display for multiple
          // onChange={(items) => handleChange('assignedSalesExecutives', items.map(i => i.value))}
          />

          {/* 6. Assigned Supervisor / ASM / RSM * (single select) */}
          <Dropdown
            style={[styles.selectUser, { paddingHorizontal: 12, paddingVertical: 14, marginTop: 12 }]}
            placeholderStyle={{ color: '#718096', fontSize: 14 }}
            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
            inputSearchStyle={{ height: 40, fontSize: 14 }}
            data={superVisorList}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Assigned Supervisor / ASM / RSM *"
            searchPlaceholder="Search supervisor..."
            value={formData.assignedSupervisor}
            onChange={(item) => handleChange('assignedSupervisor', item.value)}
            renderRightIcon={() => <ArrowDownIcon />}
          />

          {/* 7. Customer Segment * (single select) */}
          <Dropdown
            style={[styles.selectUser, { paddingHorizontal: 12, paddingVertical: 14, marginTop: 12 }]}
            placeholderStyle={{ color: '#718096', fontSize: 14 }}
            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
            inputSearchStyle={{ height: 40, fontSize: 14 }}
            data={[
              { label: '2W', value: '2w' },
              { label: '3W', value: '3w' },
              { label: 'LCV', value: 'lcv' },
              { label: 'HCV', value: 'hcv' },
              { label: 'Tractor', value: 'tractor' },
            ]}
            search={false}
            maxHeight={250}
            labelField="label"
            valueField="value"
            placeholder="Customer Segment *"
            value={formData.customerSegment}
            onChange={(item) => handleChange('customerSegment', item.value)}
            renderRightIcon={() => <ArrowDownIcon />}
          />
        </AccordionSection>

        {/* <AccordionSection title="Attachments">
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <AppText
              size={16}
              color={
                formData.shopImage &&
                  formData.cancelledCheque &&
                  formData.mouDocument &&
                  formData.additionalDocument
                  ? '#22C55E'
                  : '#64748B'
              }
              family="InterSemiBold"
            >
              {formData.shopImage && formData.cancelledCheque && formData.mouDocument
                ? '4/5 required uploaded'
                : 'Required documents pending'}
            </AppText>
          </View>

          <View style={[styles.row, { width: '100%', flexWrap: 'wrap', justifyContent: 'space-between' }]}>
            <ImageUploadBox
              label="Shop / Outlet Image"
              value={formData.shopImage}
              onChange={(asset: any) => handleChange('shopImage', asset)}
              required
            />

            <ImageUploadBox
              label="Profile / Owner Photo"
              value={formData.profileImage}
              onChange={(asset: any) => handleChange('profileImage', asset)}
            />

            <ImageUploadBox
              label="Cancelled Cheque"
              value={formData.cancelledCheque}
              onChange={(asset: any) => handleChange('cancelledCheque', asset)}
              required
            />

            <ImageUploadBox
              label="Upload MOU"
              value={formData.mouDocument}
              onChange={(asset: any) => handleChange('mouDocument', asset)}
              required
            />

            <ImageUploadBox
              label="Additional Document"
              value={formData.additionalDocument}
              onChange={(asset: any) => handleChange('additionalDocument', asset)}
              required
            />
          </View>
        </AccordionSection> */}

        <AccordionSection title="Attachments">
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            {(() => {
              // Count how many required images are actually present
              const uploadedCount = REQUIRED_ATTACHMENTS.filter(
                (item) => !!formData[item.key]
              ).length;

              const totalRequired = REQUIRED_ATTACHMENTS.length;
              const isComplete = uploadedCount === totalRequired;

              return (
                <AppText
                  size={16}
                  color={isComplete ? '#22C55E' : '#64748B'}
                  family="InterSemiBold"
                >
                  {uploadedCount} / {totalRequired} required uploaded
                </AppText>
              );
            })()}
          </View>

          <View
            style={[
              styles.row,
              {
                width: '100%',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
              },
            ]}
          >
            {REQUIRED_ATTACHMENTS.map((item) => (
              <ImageUploadBox
                key={item.key}
                label={`${item.label} *`}
                value={formData[item.key]}
                onChange={(asset: any) => handleChange(item.key, asset)}
                required
              />
            ))}

            {/* Optional images come after required ones */}
            <ImageUploadBox
              label="Profile / Owner Photo"
              value={formData.profileImage}
              onChange={(asset: any) => handleChange('profileImage', asset)}
            // no required prop → optional
            />
          </View>
        </AccordionSection>
        <AccordionSection title="Additional Information">
          {/* Progress indicator – same pattern as Basic Information */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <AppText size={16} color={getAdditionalInfoCount() === 7 ? '#22C55E' : '#64748B'} family="InterSemiBold">
              {getAdditionalInfoCount()}/7 completed
            </AppText>
          </View>

          {/* 1. Weekly TAI Alert */}
          <Dropdown
            style={[styles.selectUser, { paddingHorizontal: 12, paddingVertical: 14, marginTop: 12 }]}
            placeholderStyle={{ color: '#718096', fontSize: 14 }}
            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
            inputSearchStyle={{ height: 40, fontSize: 14 }}
            data={[
              { label: 'A', value: 'A' },
              { label: 'B', value: 'B' },
            ]}
            search={false}
            maxHeight={200}
            labelField="label"
            valueField="value"
            placeholder="Weekly TAI Alert *"
            value={formData.weeklyTaiAlert}
            onChange={(item) => handleChange('weeklyTaiAlert', item.value)}
            renderRightIcon={() => <ArrowDownIcon />}
          />

          {/* 2. Target v/s Achievement Annually */}
          <CustomTextInput
            placeholder="Target V/s Achievement Annually *"
            value={formData.targetVsAchievementAnnually}
            onChangeText={(text) => {
              // Allow numbers, decimal point, % sign, etc.
              const cleaned = text.replace(/[^0-9.%]/g, '');
              handleChange('targetVsAchievementAnnually', cleaned);
            }}
            keyboardType="numeric"
          />

          {/* 3. Schemes Updates */}
          <Dropdown
            style={[styles.selectUser, { paddingHorizontal: 12, paddingVertical: 14, marginTop: 12 }]}
            placeholderStyle={{ color: '#718096', fontSize: 14 }}
            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
            inputSearchStyle={{ height: 40, fontSize: 14 }}
            data={[
              { label: 'A', value: 'A' },
              { label: 'B', value: 'B' },
            ]}
            search={false}
            maxHeight={200}
            labelField="label"
            valueField="value"
            placeholder="Schemes Updates *"
            value={formData.schemesUpdates}
            onChange={(item) => handleChange('schemesUpdates', item.value)}
            renderRightIcon={() => <ArrowDownIcon />}
          />

          {/* 4. New Launch Update */}
          <Dropdown
            style={[styles.selectUser, { paddingHorizontal: 12, paddingVertical: 14, marginTop: 12 }]}
            placeholderStyle={{ color: '#718096', fontSize: 14 }}
            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
            inputSearchStyle={{ height: 40, fontSize: 14 }}
            data={[
              { label: 'A', value: 'A' },
              { label: 'B', value: 'B' },
            ]}
            search={false}
            maxHeight={200}
            labelField="label"
            valueField="value"
            placeholder="New Launch Update *"
            value={formData.newLaunchUpdate}
            onChange={(item) => handleChange('newLaunchUpdate', item.value)}
            renderRightIcon={() => <ArrowDownIcon />}
          />

          {/* 5. Alert for Payment */}
          <Dropdown
            style={[styles.selectUser, { paddingHorizontal: 12, paddingVertical: 14, marginTop: 12 }]}
            placeholderStyle={{ color: '#718096', fontSize: 14 }}
            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
            inputSearchStyle={{ height: 40, fontSize: 14 }}
            data={[
              { label: 'A', value: 'A' },
              { label: 'B', value: 'B' },
            ]}
            search={false}
            maxHeight={200}
            labelField="label"
            valueField="value"
            placeholder="Alert for Payment *"
            value={formData.alertForPayment}
            onChange={(item) => handleChange('alertForPayment', item.value)}
            renderRightIcon={() => <ArrowDownIcon />}
          />

          {/* 6. Pending Order List */}
          <Dropdown
            style={[styles.selectUser, { paddingHorizontal: 12, paddingVertical: 14, marginTop: 12 }]}
            placeholderStyle={{ color: '#718096', fontSize: 14 }}
            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
            inputSearchStyle={{ height: 40, fontSize: 14 }}
            data={[
              { label: 'A', value: 'A' },
              { label: 'B', value: 'B' },
            ]}
            search={false}
            maxHeight={200}
            labelField="label"
            valueField="value"
            placeholder="Pending Order List *"
            value={formData.pendingOrderList}
            onChange={(item) => handleChange('pendingOrderList', item.value)}
            renderRightIcon={() => <ArrowDownIcon />}
          />

          {/* 7. Inventory Status */}
          <Dropdown
            style={[styles.selectUser, { paddingHorizontal: 12, paddingVertical: 14, marginTop: 12 }]}
            placeholderStyle={{ color: '#718096', fontSize: 14 }}
            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
            inputSearchStyle={{ height: 40, fontSize: 14 }}
            data={[
              { label: 'A', value: 'A' },
              { label: 'B', value: 'B' },
            ]}
            search={false}
            maxHeight={200}
            labelField="label"
            valueField="value"
            placeholder="Inventory Status *"
            value={formData.inventoryStatus}
            onChange={(item) => handleChange('inventoryStatus', item.value)}
            renderRightIcon={() => <ArrowDownIcon />}
          />
        </AccordionSection>


        <AccordionSection title="Operational & Business Capacity">
          {/* Progress indicator – same style as Basic Information */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <AppText size={16} color={getOperationalCapacityCount() === 6 ? '#22C55E' : '#64748B'} family="InterSemiBold">
              {getOperationalCapacityCount()}/6 completed
            </AppText>
          </View>

          {/* 1. Turnover * */}
          <CustomTextInput
            placeholder="Turnover *"
            value={formData.turnover}
            onChangeText={(text) => {
              // Allow numbers + decimal + optional currency symbols
              const cleaned = text.replace(/[^0-9.]/g, '');
              handleChange('turnover', cleaned);
            }}
            keyboardType="numeric"
          />

          {/* 2. Staff Strength * */}
          <CustomTextInput
            placeholder="Staff Strength *"
            value={formData.staffStrength}
            onChangeText={(text) => {
              const numeric = text.replace(/[^0-9]/g, '');
              handleChange('staffStrength', numeric);
            }}
            keyboardType="numeric"
          />

          {/* 3. Vehicles & Logistics Capacity * */}
          <CustomTextInput
            placeholder="Vehicles & Logistics Capacity *"
            value={formData.vehiclesLogisticsCapacity}
            onChangeText={(text) => handleChange('vehiclesLogisticsCapacity', text)}

          />

          {/* 4. Area Coverage * */}
          <CustomTextInput
            placeholder="Area Coverage *"
            value={formData.areaCoverage}
            onChangeText={(text) => handleChange('areaCoverage', text)}
          />

          {/* 5. Other Manufacturers / Brands Handled * */}
          <CustomTextInput
            placeholder="Other Manufacturers / Brands Handled *"
            value={formData.otherBrandsHandled}
            onChangeText={(text) => handleChange('otherBrandsHandled', text)}
          />

          {/* 6. Warehouse Size * */}
          <CustomTextInput
            placeholder="Warehouse Size * (sq ft / sq m)"
            value={formData.warehouseSize}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9\s\w]/g, ''); // allow numbers + unit text
              handleChange('warehouseSize', cleaned);
            }}
            keyboardType="numeric"
          />
        </AccordionSection>

        {serverErrors && (
          <View
            style={{
              backgroundColor: '#fee2e2',
              padding: 16,
              borderRadius: 12,
              marginHorizontal: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: '#fecaca',
            }}
          >
            <AppText color="#BE0B0B" family="InterSemiBold" size={15}>
              Please correct the following errors:
            </AppText>
            {serverErrors &&
              Object.entries(serverErrors).map(([field, messages]) => (
                <AppText
                  key={field}
                  color="#BE0B0B"
                  size={13}
                >
                  • {field.replace(/_/g, ' ')}: {messages[0]}
                </AppText>
              ))}

            {!serverErrors && !isFormValid && (
              <AppText color="#BE0B0B" size={13} >
                • Please fill all required fields correctly
              </AppText>
            )}
          </View>
        )}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 12,
            marginBottom: 16,
            paddingVertical: 8,
            paddingHorizontal: 4,
            backgroundColor: '#f8fafc',
            borderRadius: 12,
          }}
        >
          <AppText
            size={14}
            color={colors.black}
            family="InterMedium"
            width={'70%'}
          >
            I'm currently at this location (auto-fill GPS)
          </AppText>

          <Switch
            value={useCurrentLocation}
            onValueChange={setUseCurrentLocation}
            disabled={useCurrentLocation}
            trackColor={{ false: '#cbd5e1', true: colors.blue }}
            thumbColor={useCurrentLocation ? colors.white : '#94a3b8'}
            ios_backgroundColor="#e2e8f0"
            style={{ transform: [{ scale: 1.1 }] }} // slightly larger touch area
          />
        </View>

        {locationLoading && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingLeft: 4 }}>
            <ActivityIndicator size="small" color={colors.blue} />
            <AppText size={13} color="#64748B">
              Fetching current location...
            </AppText>
          </View>
        )}

        {locationError && (
          <AppText
            size={13}
            color="red"

          >
            {locationError}
          </AppText>
        )}

        {currentLat !== null && currentLng !== null && useCurrentLocation && (
          <AppText
            size={13}
            color="#22C55E"

          >
            {/* Captured: {currentLat.toFixed(6)}, {currentLng.toFixed(6)} */}
          </AppText>
        )}
        {isFormValid && (
          // <Pressable style={styles.buttonView} onPress={handleSubmit}>
          //   <AppText color='white' family='InterBold' size={16}>SUBMIT</AppText>
          // </Pressable>
          <Pressable
            style={[
              styles.buttonView,
              {
                // opacity: isValid && !isSubmitting ? 1 : 0.5,
                backgroundColor: colors.blue,
                marginTop: 24,
              },
            ]}
            onPress={() => handleSubmit()}
          >
            {submitLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <AppText color="white" family="InterBold" size={16}>
                {isEditMode ? 'UPDATE' : 'SUBMIT'}
              </AppText>
            )}
          </Pressable>
        )}

      </ScrollView>

      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: '88%',
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 20,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 10,
            }}
          >
            <AppText
              size={18}
              family="InterSemiBold"
              color={colors.black}

            >
              Select Start Date
            </AppText>

            {tempDate && (
              <DateTimePicker
                value={tempDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
                onChange={(event, selectedDate) => {
                  if (Platform.OS == "ios") {
                    if (selectedDate) {
                      setTempDate(selectedDate); // update preview live
                    }
                  } else {
                    if (selectedDate) {
                      handleChange('businessStartDate', selectedDate);
                    }
                    setShowDatePicker(false);
                    setTempDate(null);
                  }

                }}
                maximumDate={new Date()} // optional: prevent future dates
              // You can add minimumDate if needed, e.g. new Date(2000, 0, 1)
              />
            )}

            <View
              style={{
                flexDirection: 'row',
                width: '100%',
                justifyContent: 'space-between',
                marginTop: 28,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setShowDatePicker(false);
                  setTempDate(null); // clean up
                }}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  backgroundColor: '#f1f5f9',
                  borderRadius: 10,
                  marginRight: 10,
                  alignItems: 'center',
                }}
              >
                <AppText size={16} color="#64748B" family="InterSemiBold">
                  Cancel
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (tempDate) {
                    handleChange('businessStartDate', tempDate);
                  }
                  setShowDatePicker(false);
                  setTempDate(null);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  backgroundColor: '#3B82F6', // use your theme color
                  borderRadius: 10,
                  marginLeft: 10,
                  alignItems: 'center',
                }}
              >
                <AppText size={16} color="white" family="InterSemiBold">
                  Confirm
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <ActionSheet
        ref={actionSheetRef}
        gestureEnabled
        containerStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: '#fff',
          paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        }}
        indicatorStyle={{
          backgroundColor: '#D1D5DB',
          width: 40,
          height: 5,
        }}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 }}>
          <AppText
            align="center"
            size={20}
            color={colors.black}
            family="InterBold"
          >
            {currentUploadLabel}
          </AppText>
          <View style={{ marginTop: 12 }}>
            <AppText
              align="center"
              size={14}
              color="#6B7280"
              family="InterMedium"
            >
              Please select an option to upload image
            </AppText>
          </View>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginVertical: rw(32),
          }}>
            <Pressable
              style={styles.attandence}
              onPress={pickImage}
            >
              <AppText size={16} color={colors.white} family="InterMedium">
                Take Photo
              </AppText>
            </Pressable>

            <Pressable
              style={[styles.attandence, {
                backgroundColor: colors.white,
                borderWidth: 2,
                borderColor: colors.blue

              }]}
              onPress={pickFromGallery}
            >

              <AppText size={16} color={colors.black} family="InterMedium">
                Choose from Gallery
              </AppText>
            </Pressable>
          </View>
        </View>
      </ActionSheet>
    </View>
  );
};



export default AddCustomer;
