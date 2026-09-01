import { View, TextInput, Pressable, ActivityIndicator, Platform } from 'react-native';
import React, { useState } from 'react';
import FastImage from 'react-native-fast-image';
import { Formik } from 'formik';
import * as Yup from 'yup';

import { styles } from './styles'; // Reuse same styles
import AppText from '../../components/AppText/AppText';
import { colors } from '../../utils/Colors';
import { useDispatch } from 'react-redux';
import { useMutateLogin, useMutateSignup } from '../../api/query/AuthAPI'; // ← Change if your hook name is different
import { setToken, setUser } from '../../components/redux/slice/AuthSlice';
import ICEyeOff from '../../assets/svgs/eye-off';
import ICEye from '../../assets/svgs/eye';
import Toast from 'react-native-toast-message';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

type SignUpFormValues = {
  name: string;
  email: string;
  address: string;
  mobile: string;
  password: string;
  confirmPassword: string;
};

const SignUpScreen = ({ navigation }: { navigation: any }) => {
  const dispatch = useDispatch();
  const { mutateAsync: mutateRegister } = useMutateSignup(); // ← Use your register mutation hook

  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required('Name is required')
      .min(2, 'Name must be at least 2 characters'),

    email: Yup.string()
      .email('Please enter a valid email')
      .required('Email is required'),

    mobile: Yup.string()
      .required('Mobile number is required')
      .matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits'),

    password: Yup.string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters'),

    confirmPassword: Yup.string()
      .required('Confirm password is required')
      .oneOf([Yup.ref('password')], 'Passwords must match'),
  });

  const initialValues: SignUpFormValues = {
    name: '',
    email: '',
    address: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  };

  const handleSignUp = async (
    values: SignUpFormValues,
    { setSubmitting, resetForm }: any
  ) => {
    setServerError(null);
    setSubmitting(true);

    try {
      const params = {
        name: values.name.trim(),
        username: values.email.trim(),        // or email, depending on your API
        email: values.email.trim(),
        mobile: values.mobile.trim(),
        password: values.password,
      };

      const res = await mutateRegister(params); // ← Calling register API

      if (res?.data?.status === 'success') {
        navigation.replace('AccountPendingScreen'); // or navigate to login if you want
      } else {
        console.log(res, 'res?.datares?.data')
        Toast.show({
          type: 'error',
          text1: res?.data?.data?.message || res || 'Registration failed',
          visibilityTime: 5000,
        });
        setServerError(res?.data?.message || res || 'Registration failed');
      }
    } catch (error: any) {
      console.log('Signup error:', error);
      // Toast.show({
      //   type: 'error',
      //   text1: error?.response?.data?.message || 'Registration failed',
      //   visibilityTime: 5000,
      // });

      setServerError(
        error?.response?.data?.message ||
        error?.message ||
        'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        style={styles.container}
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        bottomOffset={50}
      >
        {/* Logo */}
        <View style={[styles.logoView, styles.center]}>
          <FastImage
            style={styles.logo}
            resizeMode="contain"
            source={require('../../assets/images/FieldKonnectLogo.png')}
          />
        </View>

        <View style={[styles.container, styles.subContainer]}>
          <AppText color="#111111" family="InterSemiBold" align="center" size={24}>
            Create Account
          </AppText>

          <View style={{ height: 7 }} />

          <AppText color="#515151" family="InterLight" align="center" size={16}>
            Please fill the details to continue
          </AppText>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSignUp}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
              isSubmitting,
              isValid,
            }) => (
              <View style={styles.inputCollectionView}>
                {/* Name */}
                <TextInput
                  style={styles.input}
                  value={values.name}
                  onChangeText={handleChange('name')}
                  onBlur={handleBlur('name')}
                  placeholder="Full Name"
                  placeholderTextColor="rgba(0,0,0,0.4)"
                  autoCapitalize="words"
                />
                {touched.name && errors.name && (
                  <AppText color="#BE0B0B" family="InterRegular" size={12}>
                    {errors.name}
                  </AppText>
                )}
                <View style={{ marginTop: 12 }}></View>
                {/* Email */}
                <TextInput
                  style={styles.input}
                  value={values.email}
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  placeholder="Email Address"
                  placeholderTextColor="rgba(0,0,0,0.4)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {touched.email && errors.email && (
                  <AppText color="#BE0B0B" family="InterRegular" size={12}>
                    {errors.email}
                  </AppText>
                )}

                <View style={{ marginTop: 12 }}></View>
                {/* Mobile Number */}
                <TextInput
                  style={styles.input}
                  value={values.mobile}
                  onChangeText={handleChange('mobile')}
                  onBlur={handleBlur('mobile')}
                  placeholder="Mobile Number"
                  placeholderTextColor="rgba(0,0,0,0.4)"
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                {touched.mobile && errors.mobile && (
                  <AppText color="#BE0B0B" family="InterRegular" size={12}>
                    {errors.mobile}
                  </AppText>
                )}

                {/* Password */}
                <View style={{ marginTop: 12 }}>
                  <TextInput
                    style={styles.input}
                    value={values.password}
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    secureTextEntry={!showPassword}
                    placeholder="Password"
                    placeholderTextColor="rgba(0,0,0,0.4)"
                    autoCapitalize="none"
                  />
                  <Pressable
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: [{ translateY: -11 }],
                      padding: 4,
                    }}
                    onPress={() => setShowPassword((prev) => !prev)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    {showPassword ? (
                      <ICEye width={22} height={22} stroke={colors.blue} />
                    ) : (
                      <ICEyeOff width={22} height={22} stroke={colors.blue} />
                    )}
                  </Pressable>
                </View>
                {touched.password && errors.password && (
                  <AppText color="#BE0B0B" family="InterRegular" size={12}>
                    {errors.password}
                  </AppText>
                )}

                {/* Confirm Password */}
                <View style={{ marginTop: 12 }}>
                  <TextInput
                    style={styles.input}
                    value={values.confirmPassword}
                    onChangeText={handleChange('confirmPassword')}
                    onBlur={handleBlur('confirmPassword')}
                    secureTextEntry={!showConfirmPassword}
                    placeholder="Confirm Password"
                    placeholderTextColor="rgba(0,0,0,0.4)"
                    autoCapitalize="none"
                  />
                  <Pressable
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: [{ translateY: -11 }],
                      padding: 4,
                    }}
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    {showConfirmPassword ? (
                      <ICEye width={22} height={22} stroke={colors.blue} />
                    ) : (
                      <ICEyeOff width={22} height={22} stroke={colors.blue} />
                    )}
                  </Pressable>
                </View>
                {touched.confirmPassword && errors.confirmPassword && (
                  <AppText color="#BE0B0B" family="InterRegular" size={12}>
                    {errors.confirmPassword}
                  </AppText>
                )}

                {/* Server Error */}
                {serverError && (
                  <View style={{ marginTop: 12, marginLeft: 4 }}>
                    <AppText color="red" family="InterRegular" size={13}>
                      {serverError}
                    </AppText>
                  </View>
                )}

                {/* Submit Button */}
                <Pressable
                  style={[
                    styles.buttonView,
                    {
                      backgroundColor: isValid ? colors.blue : '#A0A0A0',
                      marginTop: 24,
                    },
                  ]}
                  onPress={() => handleSubmit()}
                  disabled={!isValid || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <AppText color="white" family="InterBold" size={16}>
                      Sign Up
                    </AppText>
                  )}
                </Pressable>

                <View style={{ height: 5 }} />
                <AppText color="gray" family="InterSemiBold" size={14} align="center">
                  Already have an account?{' '}
                  <AppText
                    color={colors.blue}
                    family="InterSemiBold"
                    size={14}
                    onPress={() => navigation.navigate('LoginScreen')}
                  >
                    Sign In
                  </AppText>
                </AppText>
               
              </View>
            )}
          </Formik>
           <View style={{ height: 70 }} />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default SignUpScreen;