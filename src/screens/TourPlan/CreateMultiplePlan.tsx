import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Pressable,
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
import { MinusIcon, PlusIcon } from '../../assets/svgs/HomePageSvgs';
import { styles } from './styles'; // same styles file
import { ArrowDownIcon } from '../../assets/svgs/SvgsFile';
import { Dropdown } from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import store from '../../components/redux/Store';

const AccordionSection = ({ title, children, defaultExpanded = false }) => {
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

const CustomTextInput = ({ placeholder, value, onChangeText, multiline = false, keyboardType = 'default' }) => (
  <View style={[styles.selectUser, { paddingHorizontal: 12, paddingVertical: multiline ? 10 : 14 }]}>
    <TextInput
      style={[styles.textInput, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
      placeholder={placeholder}
      placeholderTextColor={'#718096'}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      multiline={multiline}
      autoCapitalize="sentences"
    />
  </View>
);

const AddTourPlan = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dates, setDates] = useState([]);           // array of selected dates (strings: DD-MM-YYYY)
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [townsInput, setTownsInput] = useState(''); // comma separated
  const [objectives, setObjectives] = useState('');

  // Fetch user list
  useEffect(() => {
    const fetchUsers = async () => {
      const token = store.getState().auth?.token;
      if (!token) return;

      try {
        const res = await fetch('https://duke.fieldkonnect.in/api/tour/userlist', {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();
        if (res.ok && json?.data) {
          const userList = json.data.map(u => ({
            label: u.name || u.username || `User ${u.id}`,
            value: u.id,
          }));
          setUsers(userList);
        } else {
          Toast.show({ type: 'error', text1: 'Failed to load users' });
        }
      } catch (err) {
        Toast.show({ type: 'error', text1: 'Network error while loading users' });
      }
    };

    fetchUsers();
  }, []);

  // Date picker handlers
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios'); // keep open on iOS
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const addDate = () => {
    if (!tempDate) return;

    const day = String(tempDate.getDate()).padStart(2, '0');
    const month = String(tempDate.getMonth() + 1).padStart(2, '0');
    const year = tempDate.getFullYear();

    const dateStr = `${day}-${month}-${year}`;

    if (!dates.includes(dateStr)) {
      setDates([...dates, dateStr]);
    }

    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  };

  const removeDate = (dateToRemove) => {
    setDates(dates.filter(d => d !== dateToRemove));
  };

  const isFormValid =
    selectedUser &&
    dates.length > 0 &&
    townsInput.trim() &&
    objectives.trim();

  const handleSubmit = async () => {
    if (!isFormValid) {
      Toast.show({ type: 'error', text1: 'Please fill all required fields' });
      return;
    }

    setLoading(true);

    const token = store.getState().auth?.token;

    const payload = {
      user_id: selectedUser,
      date: dates,
      town: townsInput.split(',').map(t => t.trim()).filter(Boolean),
      objectives: objectives
        .split('\n')
        .map(o => o.trim())
        .filter(Boolean),
    };

    try {
      const res = await fetch(`${BASE_URL}/api/tour/add`, {  // or use the full URL if BASE_URL is not set
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok) {
        Toast.show({ type: 'success', text1: 'Tour plan created successfully' });
        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text1: json.message || 'Failed to create tour plan',
        });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Network error. Please try again.' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AccordionSection title="Tour Plan Details" defaultExpanded={true}>
          <View style={{ marginBottom: 20 }}>
            <AppText size={14} color={colors.black} family="InterMedium">
              Select User *
            </AppText>
            <Dropdown
              style={[styles.selectUser, { marginTop: 8 }]}
              placeholderStyle={{ color: '#718096', fontSize: 14 }}
              selectedTextStyle={{ color: colors.black, fontSize: 14 }}
              data={users}
              search
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Select User"
              searchPlaceholder="Search user..."
              value={selectedUser}
              onChange={item => setSelectedUser(item.value)}
              renderRightIcon={() => <ArrowDownIcon />}
            />
          </View>

          <View style={{ marginBottom: 20 }}>
            <AppText size={14} color={colors.black} family="InterMedium">
              Select Dates *
            </AppText>

            <TouchableOpacity
              style={[styles.selectUser, { marginTop: 8, padding: 14 }]}
              onPress={() => setShowDatePicker(true)}
            >
              <AppText size={14} color={dates.length ? colors.black : '#718096'}>
                {dates.length ? `Selected: ${dates.join(', ')}` : 'Tap to pick dates'}
              </AppText>
              <ArrowDownIcon />
            </TouchableOpacity>

            {dates.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 }}>
                {dates.map((date, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#E0F2FE',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                    }}
                  >
                    <AppText size={13} color={colors.primary}>
                      {date}
                    </AppText>
                    <TouchableOpacity onPress={() => removeDate(date)} style={{ marginLeft: 8 }}>
                      <AppText size={16} color="red">×</AppText>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {showDatePicker && (
              <DateTimePicker
                value={tempDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}

            {showDatePicker && Platform.OS === 'ios' && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <AppText color={colors.gray}>Cancel</AppText>
                </TouchableOpacity>
                <TouchableOpacity onPress={addDate}>
                  <AppText color={colors.primary}>Add Date</AppText>
                </TouchableOpacity>
              </View>
            )}

            {Platform.OS === 'android' && showDatePicker && (
              <TouchableOpacity
                style={{
                  marginTop: 12,
                  padding: 12,
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={addDate}
              >
                <AppText color="white">Add Selected Date</AppText>
              </TouchableOpacity>
            )}
          </View>

          <CustomTextInput
            placeholder="Towns (comma separated) *   e.g. Indore, Bhopal, Jabalpur"
            value={townsInput}
            onChangeText={setTownsInput}
          />

          <CustomTextInput
            placeholder="Objectives (one per line) *"
            value={objectives}
            onChangeText={setObjectives}
            multiline
          />
        </AccordionSection>

        <View style={{ marginTop: 30, marginBottom: 40 }}>
          {isFormValid && (
            <Pressable
              style={[styles.buttonView, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <AppText color="white" family="InterBold" size={16}>
                  CREATE TOUR PLAN
                </AppText>
              )}
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddTourPlan;