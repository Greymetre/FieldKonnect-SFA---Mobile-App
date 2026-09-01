import { View, TextInput, Pressable, ActivityIndicator, Platform } from 'react-native';
import React, { useState } from 'react';
import FastImage from 'react-native-fast-image';
import { Formik } from 'formik';
import * as Yup from 'yup';

import { styles } from './styles';
import AppText from '../../components/AppText/AppText';
import { colors } from '../../utils/Colors';
import { useDispatch } from 'react-redux';
import { useMutateLogin } from '../../api/query/AuthAPI';
import { setToken, setUser } from '../../components/redux/slice/AuthSlice';
import ICEyeOff from '../../assets/svgs/eye-off';
import ICEye from '../../assets/svgs/eye';
import Toast from 'react-native-toast-message';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { initializeLiveLocationTracking } from '../../services/liveLocationService';
import { APP_BUILD_NUMBER, APP_VERSION } from '../../utils/appVersion';
import { getDeviceName, getUniqueDeviceId } from '../../utils/deviceIdentity';
import { getFcmToken } from '../../utils/firebaseMessaging';

type LoginFormValues = {
  email: string;
  password: string;
};

const LoginScreen = ({ navigation }: { navigation: any }) => {
  const dispatch = useDispatch();
  const { mutateAsync: mutateLogin } = useMutateLogin();
  const [_serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false); // ← new state

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email('Please enter a valid email')
      .required('Email is required'),
    password: Yup.string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters'),
  });

  const initialValues: LoginFormValues = {
    email: '',
    password: '',
  };

  const handleLogin = async (
    values: LoginFormValues,
    { setSubmitting, resetForm }: any
  ) => {
    setServerError(null);
    setSubmitting(true);

    try {
      const fcmToken = await getFcmToken();
      const params = {
        username: values.email.trim(),
        password: values.password,
        app_version: APP_VERSION,
        build_number: APP_BUILD_NUMBER,
        device_name: getDeviceName(),
        device_type: Platform.OS,
        unique_id: getUniqueDeviceId(),
        fcm_token: fcmToken ?? undefined,
      };

      const res = await mutateLogin(params);

      // The API client already displays HTTP 400 messages. Stop here so a
      // device-login restriction is not replaced by a generic login error.
      if (typeof res === 'string') {
        setServerError(res);
        return;
      }

      if (res?.data?.status === 'success') {
        dispatch(setUser(res?.data?.userinfo));
        Toast.show({ type: 'success', text1: res?.data?.message || 'Login successful', visibilityTime: 5000 });

        dispatch(setToken(res?.data?.userinfo?.access_token));
        void initializeLiveLocationTracking().catch(error => {
          console.warn('Live location initialization failed:', error);
        });
        resetForm();
        navigation.replace('BottomTab');
      } else {
        Toast.show({ type: 'error', text1: res?.data?.message || 'Login failed', visibilityTime: 5000 });

        setServerError(res?.data?.message || 'Login failed');
      }
    } catch (error: any) {
      console.log('Login error:', error);
      Toast.show({ type: 'error', text1: error?.response?.data?.message || 'Login failed', visibilityTime: 5000 });

      setServerError(
        error?.response?.data?.message ||
        error?.message ||
        'Something went wrong. Please try again.'
      );
      if (error?.response?.data?.message == "Account deactivated. Contact admin.") {
        navigation.replace('AccountPendingScreen')
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        bottomOffset={50}
      >
        {/* <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      > */}
        <View style={[styles.logoView, styles.center]}>
          <FastImage
            style={styles.logo}
            resizeMode="contain"
            source={require('../../assets/images/FieldKonnectLogo.png')}
          />
          <FastImage
            style={styles.dukeLogo}
            resizeMode="contain"
            source={require('../../assets/images/duke_logo_new.png')}
          />
        </View>

        <View style={[styles.container, styles.subContainer]}>
          <AppText color="#111111" family="InterSemiBold" align="center" size={24}>
            Welcome Back
          </AppText>

          <View style={{ height: 7 }} />

          <AppText color="#515151" family="InterLight" align="center" size={16}>
            Please sign in to continue our app
          </AppText>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleLogin}
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
                {/* Email */}
                <TextInput
                  style={styles.input}
                  value={values.email}
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  placeholder="Enter Email"
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

                {/* Password + Eye icon container */}
                <View style={{ position: 'relative', marginTop: 16 }}>
                  <TextInput
                    style={styles.input}
                    value={values.password}
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    secureTextEntry={!showPassword} // ← toggled here
                    placeholder="Enter Password"
                    placeholderTextColor="rgba(0,0,0,0.4)"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <Pressable
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: [{ translateY: -11 }], // roughly center vertically (adjust if needed)
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

                {/* Server / auth error */}
                {/* {serverError && (
                  <View style={{ marginTop: 12, marginLeft: 4 }}>
                    <AppText color="red" family="InterRegular" size={13}>
                      {serverError}
                    </AppText>
                  </View>
                )} */}

                {/* Submit Button */}
                <Pressable
                  style={[
                    styles.buttonView,
                    {
                      // opacity: isValid && !isSubmitting ? 1 : 0.5,
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
                      Sign in
                    </AppText>
                  )}
                </Pressable>
                <View style={{ height: 5 }} />
                {
                  Platform.OS == 'ios' && (
                    <AppText color="gray" family="InterSemiBold" size={14}>Don't have an account <AppText color={colors.blue} onPress={() => {
                      navigation.replace('SignUpScreen')
                    }} family="InterSemiBold" size={14}>Sign Up</AppText></AppText>
                  )
                }

              </View>
            )}
          </Formik>
        </View>
        {/* </ScrollView> */}
      </KeyboardAwareScrollView>
    </View>
  );
};

export default LoginScreen;
