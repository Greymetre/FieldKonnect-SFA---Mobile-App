import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Asset, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import { useDispatch } from 'react-redux';

import axiosClient, { resolveMediaUrl } from '../../api/AxiosClient';
import axiosClientForm from '../../api/AxiosForm';
import { API_ENDPOINT } from '../../api/ApiUrls';
import AppText from '../../components/AppText/AppText';
import { useAppSelector } from '../../components/redux/Store';
import { setUser } from '../../components/redux/slice/AuthSlice';
import { UserIcon } from '../../assets/svgs/SvgsFile';
import { colors } from '../../utils/Colors';

type Profile = {
  company_name?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile?: string;
  profile_image?: string;
  gender?: string;
  region_id?: string | number;
  payroll_id?: string | number;
  designation?: string | { name?: string; designation_name?: string };
  designation_name?: string;
  designation_id?: string | number;
  designationId?: string | number;
  user_designation_id?: string | number;
};

const getDesignation = (user?: Profile) => {
  const value = user?.designation_name
    || (typeof user?.designation === 'object'
      ? user.designation.designation_name || user.designation.name
      : user?.designation);

  if (typeof value !== 'string') return '';

  const designation = value.trim();
  return designation && !/^\d+$/.test(designation) ? designation : '';
};

const getDesignationId = (user?: Profile) => {
  const nestedId = typeof user?.designation === 'object'
    ? (user.designation as any)?.id
    : undefined;
  const value = user?.designation_id
    || user?.designationId
    || user?.user_designation_id
    || nestedId
    || (/^\d+$/.test(String(user?.designation || '')) ? user?.designation : undefined);

  return value == null ? '' : String(value);
};

const MyProfile = () => {
  const dispatch = useDispatch();
  const authUser = useAppSelector(state => state.auth.user);
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get(API_ENDPOINT.GET_PROFILE);
      const profileData: Profile = response?.data?.userinfo || {};
      const combinedProfile: Profile = { ...authUser, ...profileData };
      let designation = getDesignation(combinedProfile);

      if (!designation) {
        const designationId = getDesignationId(combinedProfile);
        if (designationId) {
          try {
            const designationResponse = await axiosClient.get('api/designations');
            const designationList = designationResponse?.data?.data || [];
            const match = designationList.find(
              (item: any) => String(item?.id) === designationId,
            );
            designation = String(match?.designation_name || '').trim();
          } catch {
            // The rest of the profile can still be displayed if this lookup fails.
          }
        }
      }

      const resolvedProfile = {
        ...profileData,
        ...(designation ? { designation_name: designation } : {}),
      };
      setProfile(resolvedProfile);

      if (designation && designation !== getDesignation(authUser || {})) {
        dispatch(setUser({ ...authUser, designation_name: designation }));
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error?.response?.data?.message || 'Unable to load profile',
      });
    } finally {
      setLoading(false);
    }
  }, [authUser, dispatch]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  const uploadPhoto = async (asset: Asset) => {
    if (!asset.uri) return;

    const formData = new FormData();
    formData.append('image', {
      uri: asset.uri,
      type: asset.type || 'image/jpeg',
      name: asset.fileName || `profile_${Date.now()}.jpg`,
    } as any);

    try {
      setUploading(true);
      const response = await axiosClientForm.post(API_ENDPOINT.UPDATE_PROFILE, formData);
      const profileImage = response?.data?.profile_image;
      if (!profileImage) throw new Error('Profile image was not returned');

      setProfile(current => ({ ...current, profile_image: profileImage }));
      dispatch(setUser({ ...authUser, profile_image: profileImage }));
      Toast.show({ type: 'success', text1: 'Profile photo updated' });
    } catch (error: any) {
      const validationMessage = error?.response?.data?.errors?.image?.[0];
      Toast.show({
        type: 'error',
        text1: validationMessage || error?.response?.data?.message || 'Unable to update profile photo',
      });
    } finally {
      setUploading(false);
    }
  };

  const pickPhoto = async (source: 'camera' | 'gallery') => {
    if (source === 'camera' && Platform.OS === 'android') {
      const permission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera permission',
          message: 'FieldKonnect needs camera access to take your profile photo.',
          buttonPositive: 'Allow',
          buttonNegative: 'Cancel',
        },
      );

      if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
        Toast.show({ type: 'error', text1: 'Camera permission is required' });
        return;
      }
    }

    const options = {
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.8,
      maxWidth: 1400,
      maxHeight: 1400,
    } as const;

    const result = source === 'camera'
      ? await launchCamera(options)
      : await launchImageLibrary(options);

    if (result.didCancel || !result.assets?.[0]?.uri) return;
    await uploadPhoto(result.assets[0]);
  };

  const changePhoto = () => {
    Alert.alert('Change Profile Photo', 'Choose a photo source', [
      { text: 'Camera', onPress: () => pickPhoto('camera') },
      { text: 'Gallery', onPress: () => pickPhoto('gallery') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const details = [
    ['Full Name', profile.name],
    ['Email', profile.email],
    ['Mobile Number', profile.mobile],
  ];

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  const imageUrl = resolveMediaUrl(profile.profile_image);
  const designation = getDesignation(profile);
  const displayName = `${profile.name || 'User'}${designation ? ` - ${designation}` : ''}`;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.avatarImage} />
          ) : (
            <UserIcon />
          )}
        </View>
        <AppText size={22} family="InterBold" color="white" align="center">
          {displayName}
        </AppText>
        <AppText size={14} family="InterRegular" color="white" align="center" opacity={0.8}>
          {profile.mobile || ''}
        </AppText>
        <Pressable
          disabled={uploading}
          onPress={changePhoto}
          style={({ pressed }) => [styles.photoButton, pressed && styles.pressed]}>
          {uploading ? (
            <ActivityIndicator size="small" color={colors.blue} />
          ) : (
            <AppText size={14} family="InterSemiBold" color={colors.blue}>
              Change Profile Photo
            </AppText>
          )}
        </Pressable>
      </View>

      <AppText size={18} family="InterBold" color={colors.black}>Profile Details</AppText>
      <View style={styles.detailsCard}>
        {details.map(([label, value], index) => (
          <View key={String(label)} style={[styles.detailRow, index === details.length - 1 && styles.lastRow]}>
            <AppText size={12} family="InterMedium" color="#7A849C">{label}</AppText>
            <AppText size={16} family="InterSemiBold" color="#202A48">
              {String(value || '—')}
            </AppText>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgColor },
  content: { padding: 16, paddingBottom: 36, gap: 18 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgColor },
  profileCard: { backgroundColor: colors.blue, borderRadius: 20, padding: 24, alignItems: 'center', gap: 7 },
  avatar: { width: 112, height: 112, borderRadius: 56, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 5 },
  avatarImage: { width: '100%', height: '100%' },
  photoButton: { marginTop: 10, minWidth: 190, height: 44, paddingHorizontal: 18, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.75 },
  detailsCard: { backgroundColor: colors.white, borderRadius: 18, paddingHorizontal: 18 },
  detailRow: { paddingVertical: 15, gap: 5, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#DDE2EC' },
  lastRow: { borderBottomWidth: 0 },
});

export default MyProfile;
