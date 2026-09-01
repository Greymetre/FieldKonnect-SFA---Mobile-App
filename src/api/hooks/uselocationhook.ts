// useLocationHook.ts — Improved version
import { useEffect, useState, useRef } from "react";
import Geolocation from "@react-native-community/geolocation";
import {
  Alert,
  Linking,
  Platform,
  PermissionsAndroid,
} from "react-native";

interface Coords {
  latitude: number;
  longitude: number;
}

const useLocationHook = () => {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    requestAndGetLocation();

    // Cleanup on unmount
    return () => {
      if (watchId.current !== null) {
        Geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS !== "android") return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      }

      // Also try coarse if fine is denied (better than nothing)
      const coarse = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      );
      return coarse === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn("Permission error:", err);
      return false;
    }
  };

  const requestAndGetLocation = async () => {
    setLoading(true);
    setError(null);

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setLoading(false);
      setError("Location permission denied");
      Alert.alert(
        "Permission Required",
        "This app needs location access to show nearby orders.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    // Clear any previous watch
    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    // First: Try fast network-based location (WiFi/cell)
    Geolocation.getCurrentPosition(
      (position) => {
        successCallback(position);
      },
      (err) => {
        if (err.code === 3) {
          // Timeout on high accuracy → fallback to watchPosition for better UX
          startWatchingLocation();
        } else {
          handleLocationError(err);
        }
      },
      {
        enableHighAccuracy: false,   // Fast but less accurate
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  const startWatchingLocation = () => {
    setError("Getting accurate location...");

    watchId.current = Geolocation.watchPosition(
      (position) => {
        successCallback(position);
        // Got good location → stop watching to save battery
        if (watchId.current !== null) {
          Geolocation.clearWatch(watchId.current);
          watchId.current = null;
        }
      },
      (err) => {
        handleLocationError(err);
        if (watchId.current !== null) {
          Geolocation.clearWatch(watchId.current);
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 5000,
        distanceFilter: 10,
      }
    );
  };

  const successCallback = (position: any) => {
    setCoords({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
    setLoading(false);
    setError(null);
  };

  const handleLocationError = (err: any) => {
    console.log("Geolocation error:", err.code, err.message);

    setLoading(false);

    if (err.code === 1) {
      setError("Permission denied");
      Alert.alert("Permission Denied", "Location access is required.", [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => { Linking.openSettings(); } }
      ]);
    } else if (err.code === 2) {
      setError("Location services disabled");
      Alert.alert(
        "Location Off",
        "Please enable location services to receive orders.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => Linking.openSettings(),
          },
          { text: "Retry", onPress: requestAndGetLocation },
        ]
      );
    } else if (err.code === 3) {
      setError("Taking longer than usual...");
      // Don't show annoying alert immediately — instead use watchPosition
      if (!watchId.current) {
        startWatchingLocation();
      }
    } else {
      setError("Unable to get location");
      Alert.alert("Retry?", "Couldn't get your location", [
        { text: "Cancel", style: "cancel" },
        { text: "Retry", onPress: requestAndGetLocation },
      ]);
    }
  };

  const refreshLocation = () => {
    requestAndGetLocation();
  };

  return {
    coords,
    loading,
    error,
    refreshLocation,
  };
};

export default useLocationHook;