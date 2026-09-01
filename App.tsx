/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Platform, StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { KeyboardProvider } from "react-native-keyboard-controller";

import Toast, {
  BaseToast,
  BaseToastProps,
  ErrorToast,
} from 'react-native-toast-message';
import { colors } from './src/utils/Colors';
import store, { persistor } from './src/components/redux/Store';
import SplashScreen from './src/screens/Splash';
import Routes from './src/navigations/Routes';
import { navigationRef } from './src/services/NavigationService';
import {
  initializeLiveLocationTracking,
  runAndroidFirstTimeLiveLocationSetup,
} from './src/services/liveLocationService';
import {
  subscribeToForegroundNotifications,
  subscribeToNotificationPresses,
} from './src/utils/firebaseMessaging';
import {subscribeToMobileSessionSync, syncMobileSession} from './src/services/mobileSessionSync';
;


const queryClient = new QueryClient();

const App = () => {
  const [loading, setLoading] = useState(true);
  const loadingRef = React.useRef(true);
  const pendingNotificationNavigationRef = React.useRef(false);
  // const navigationRef = React.useRef<NavigationContainerRef<any>>(null);
  //  const navigationRef = createNavigationContainerRef();

  useEffect(() => {
    const openNotificationList = () => {
      if (!loadingRef.current && navigationRef.isReady()) {
        navigationRef.navigate('Notifications');
        pendingNotificationNavigationRef.current = false;
      } else {
        pendingNotificationNavigationRef.current = true;
      }
    };
    const unsubscribeForeground = subscribeToForegroundNotifications();
    const unsubscribePresses = subscribeToNotificationPresses(openNotificationList);

    setTimeout(() => {
      loadingRef.current = false;
      setLoading(false);
    }, 2000);

    return () => {
      unsubscribeForeground();
      unsubscribePresses();
    };
  }, []);

  useEffect(() => subscribeToMobileSessionSync(), []);

  useEffect(() => {
    if (!loading && navigationRef.isReady() && pendingNotificationNavigationRef.current) {
      const timer = setTimeout(() => {
        navigationRef.navigate('Notifications');
        pendingNotificationNavigationRef.current = false;
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const initializeAfterRehydrate = () => {
    void runAndroidFirstTimeLiveLocationSetup();
    void initializeLiveLocationTracking();
    syncMobileSession(true);
  };

  const MyTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: 'transparent',
    },
  };

  const toastConfig = {
    success: (props: BaseToastProps) => (
      <BaseToast
        {...props}

        text2NumberOfLines={0}
        style={{
          borderLeftColor: colors.blue,
        }}
      />
    ),
    error: (props: BaseToastProps) => <ErrorToast {...props} text1NumberOfLines={0}
      text2NumberOfLines={0} />,
  };


  return (

    <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <PersistGate persistor={persistor} onBeforeLift={initializeAfterRehydrate}>
            <QueryClientProvider client={queryClient}>
                <View style={{ flex: 1, backgroundColor: colors.bgColor }}>
                  <StatusBar
                    translucent
                    backgroundColor="transparent"
                    barStyle={'light-content'}
                  />

                  <NavigationContainer
                    ref={navigationRef}
                    theme={MyTheme}
                    onReady={() => {
                      if (!loadingRef.current && pendingNotificationNavigationRef.current) {
                        navigationRef.navigate('Notifications');
                        pendingNotificationNavigationRef.current = false;
                      }
                      console.log('Navigation is ready');
                    }}
                  >

                    {loading ? <SplashScreen /> : <Routes />}
                  </NavigationContainer>

                  <Toast config={toastConfig} visibilityTime={1500} />
                  {Platform.OS == 'android' && (
                    <SafeAreaView style={{ backgroundColor: colors.white }} /> 
                  )}

                </View>
            </QueryClientProvider> 
          </PersistGate>
        </Provider>
      </GestureHandlerRootView>
    </KeyboardProvider>
  );
};

export default App
