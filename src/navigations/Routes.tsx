import React, { useEffect } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../utils/Types';
import LoginScreen from '../screens/Login';
import CustomerDetails from '../screens/Customer/CustomerDetails';
import CustomHeader from '../components/Header';
import TourPlanPage from '../screens/TourPlan';
import CreatePlan from '../screens/TourPlan/CreatePlan';
import BottomTab from './BottomTab';
import CustomerList from '../screens/CustomerList';
import AddCustomer from '../screens/AddCustomer';
import ExpenseReport from '../screens/ExpenseReport';
import ExpenseDetails from '../screens/ExpenseReport/ExpenseDetails';
import AttendanceReport from '../screens/AttendanceReport';
import UserActivityScreen from '../screens/UserActivity';
import ProductCatalogue from '../screens/OrderScreen/ProductCatalogue';
import SubmitOrder from '../screens/OrderScreen/SubmitOrder';
import AddNewExpense from '../screens/AddNewExpense';
import AttendanceScreen from '../screens/AttendanceReport/AttendanceScreen';
import { useAppSelector } from '../components/redux/Store';
import AddSecondaryCustomer from '../screens/AddCustomer/AddSecondaryCustomer';
import VisitReport from '../screens/AttendanceReport/VisitReport';
import UserTourList from '../screens/TourPlan/UserTourList';
import BeatCustomerDetails from '../screens/BeatScreen/BeatCustomerDetails';
import OrderHistoryDetailsScreen from '../screens/OrderScreen/OrderHistoryDetailsScreen';
import Reports from '../screens/reports';
import OrderList from '../screens/OrderScreen';
import IndividualPage from '../screens/UserActivity/IndividualPage';
import { useDispatch } from 'react-redux';
import { setActiveBg } from '../components/redux/slice/AuthSlice';
import AttendanceViewAllScreen from '../screens/AttendanceReport/AttendanceViewAllScreen';
import TargetArchieViewAllScreen from '../screens/AttendanceReport/TargetArchieViewAllScreen';
import DealerDistributorPerformanceViewAllScreen from '../screens/AttendanceReport/DealerDistributorPerformanceViewAllScreen';
import PromotionalActivitiesViewAllScreen from '../screens/AttendanceReport/PromotionalActivitiesViewAllScreen';
import RetailersPerformanceViewAllScreen from '../screens/AttendanceReport/RetailersPerformanceViewAllScreen';
import SignUpScreen from '../screens/Login/SignUpScreen';
import AccountPendingScreen from '../screens/Login/AccountPendingScreen';
import ForceUpdateScreen from '../screens/Login/ForceUpdateScreen';
import Notifications from '../screens/Notifications';
import MyProfile from '../screens/MyProfile';
import LeadKonnect from '../screens/LeadKonnect/index';
import CreateLead from '../screens/LeadKonnect/CreateLead';
import LeadDetails from '../screens/LeadKonnect/LeadDetails';
import EditLead from '../screens/LeadKonnect/EditLead';
import TaskList from '../screens/TaskList';
import OpportunityList from '../screens/LeadKonnect/OpportunityList';
import CallHistory from '../screens/LeadKonnect/CallHistory';
import CallDetails from '../screens/LeadKonnect/CallDetails';
import Documents from '../screens/Documents';

const Stack = createNativeStackNavigator<RootStackParamList>();

const Routes = () => {
  const { user } = useAppSelector(
    (state) => state.auth
  );
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setActiveBg(false));
  }, [dispatch])

  return (
    <>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          header: (props) => <CustomHeader {...props} />
        }}
        initialRouteName={
          user?.access_token
            ? "BottomTab"
            : "LoginScreen"
        }
      >
        <Stack.Screen name='LoginScreen' component={LoginScreen} />
        <Stack.Screen name='SignUpScreen' component={SignUpScreen} />
        <Stack.Screen
          name="ForceUpdateScreen"
          component={ForceUpdateScreen}
        />
        <Stack.Screen name='AccountPendingScreen' component={AccountPendingScreen} />
        <Stack.Screen name='BottomTab' component={BottomTab} />
        <Stack.Screen name='CustomerDetails' component={CustomerDetails} options={{
          headerShown: true,
          title: 'Customer Details'
        }} />
        <Stack.Screen name='AttendanceReport' component={AttendanceReport} options={{
          headerShown: true,
          title: 'Attendance Report'
        }} />
        <Stack.Screen name='ExpenseReport' component={ExpenseReport} options={{
          headerShown: true,
          title: 'Expenses'
        }} />
        <Stack.Screen name='ExpenseDetails' component={ExpenseDetails} options={{
          headerShown: true,
          title: 'Expense Details'
        }} />
        <Stack.Screen name='OrderHistoryDetailsScreen' component={OrderHistoryDetailsScreen} options={{
          headerShown: true,
          title: 'Order'
        }} />
        <Stack.Screen name='Reports' component={Reports} options={{
          headerShown: true,
          title: 'Reports'
        }} />

        <Stack.Screen name='TourPlanPage' component={TourPlanPage} options={{
          headerShown: true,
          title: 'Tour Plan'
        }} />
        <Stack.Screen name='UserTourList' component={UserTourList} options={{
          headerShown: true,
          title: 'Tour Plan'
        }} />
        <Stack.Screen name='AddCustomer' component={AddCustomer} options={{
          headerShown: true,
          title: 'Add Customer'
        }} />
        <Stack.Screen name='AddSecondaryCustomer' component={AddSecondaryCustomer} options={{
          headerShown: true,
          title: 'Add Customer'
        }} />
        <Stack.Screen name='UserActivityPage' component={UserActivityScreen} options={{
          headerShown: true,
          title: 'User Activity'
        }} />
        <Stack.Screen name='IndividualPage' component={IndividualPage} options={{
          headerShown: true,
          title: 'User Activity'
        }} />
        <Stack.Screen name='ProductCatalogue' component={ProductCatalogue} options={{
          headerShown: true,
          title: 'Product Catalogue'
        }} />

        <Stack.Screen name='SubmitOrder' component={SubmitOrder} options={{
          headerShown: true,
          title: 'Submit Order'
        }} />

        <Stack.Screen name='CreatePlan' component={CreatePlan} options={{
          headerShown: true,
          title: 'Create'
        }} />
        <Stack.Screen name='AddNewExpense' component={AddNewExpense} options={{
          headerShown: true,
          title: 'Add New Expense'
        }} />
        <Stack.Screen name='AttendanceScreen' component={AttendanceScreen} options={{
          headerShown: true,
          title: 'Attendance'
        }} />
        <Stack.Screen name='VisitReport' component={VisitReport} options={{
          headerShown: true,
          title: 'Visit Report'
        }} />

        <Stack.Screen name='CustomerList' component={CustomerList} options={{
          headerShown: true,
          title: 'Customers'
        }} />

        <Stack.Screen name='BeatCustomerList' component={BeatCustomerDetails} options={{
          headerShown: true,
          title: 'Customers'
        }} />
        <Stack.Screen name='OrderListDetails' component={OrderList} options={{
          headerShown: true,
          title: 'Orders'
        }} />
        <Stack.Screen
          name='AttendanceViewAllScreen'
          component={AttendanceViewAllScreen}
          options={{
            headerShown: false,
          }} />
        <Stack.Screen
          name='TargetArchieViewAllScreen'
          component={TargetArchieViewAllScreen}
          options={{
            headerShown: false,
          }} />
        <Stack.Screen
          name='DealerDistributorPerformanceViewAllScreen'
          component={DealerDistributorPerformanceViewAllScreen}
          options={{
            headerShown: false,
          }} />
        <Stack.Screen
          name='PromotionalActivitiesViewAllScreen'
          component={PromotionalActivitiesViewAllScreen}
          options={{ headerShown: false }} />
        <Stack.Screen
          name='RetailersPerformanceViewAllScreen'
          component={RetailersPerformanceViewAllScreen}
          options={{
            headerShown: false,
          }} />
        <Stack.Screen name='Notifications' component={Notifications} options={{
          headerShown: true,
          title: 'Notifications'
        }} />
        <Stack.Screen name='MyProfile' component={MyProfile} options={{
          headerShown: true,
          title: 'My Profile'
        }} />
        <Stack.Screen name='LeadKonnect' component={LeadKonnect} options={{
          headerShown: true,
          title: 'LeadKonnect'
        }} />
        <Stack.Screen name='CallHistory' component={CallHistory} options={{
          headerShown: true,
          title: 'Call History'
        }} />
        <Stack.Screen name='CallDetails' component={CallDetails} options={{
          headerShown: true,
          title: 'Call Details'
        }} />
        <Stack.Screen name='CreateLead' component={CreateLead} options={{
          headerShown: true,
          title: 'Add New Lead'
        }} />
        <Stack.Screen name='LeadDetails' component={LeadDetails} options={{
          headerShown: true,
          title: 'Lead Details'
        }} />
        <Stack.Screen name='EditLead' component={EditLead} options={{
          headerShown: true,
          title: 'Edit Lead'
        }} />
        <Stack.Screen name='OpportunityList' component={OpportunityList} options={{
          headerShown: true,
          title: 'Opportunities'
        }} />
        <Stack.Screen name='Documents' component={Documents} options={{
          headerShown: true,
          title: 'Documents'
        }} />
        <Stack.Screen name='TaskList' component={TaskList} options={{
          headerShown: true,
          title: 'Tasks'
        }} />


      </Stack.Navigator>
    </>
  )
}

export default Routes
