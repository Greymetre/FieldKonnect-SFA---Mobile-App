import { StyleProp, TextStyle } from "react-native";

export type ParamList = {
  HomeScreen: {
    from: string | any;
  }
};

export type TopTabNameProps = {
  focused: boolean;
  tabName: string;
};

export type RootStackParamList = {
  LoginScreen: undefined;
  SignUpScreen: undefined;
  AccountPendingScreen: undefined;
  CustomerDetails: undefined;
  TourPlanPage: undefined;
  ForceUpdateScreen: undefined;
  CreatePlan: undefined | { item: number | string };
  BottomTab: undefined;
  CustomerList: {
    type?: string;
    beatId?: string | number;
    customerTypeId?: string | number;
    customerTypeName?: string;
  } | undefined;
  AddCustomer:{
    customer?: any;
    customerTypeId?: string | number;
    customerTypeName?: string;
  } | undefined;
  AttendanceReport:undefined;
  ExpenseReport:undefined;
  ExpenseDetails:{
    expense?: any;
    expense_id?: string | number;
    mode?: 'my' | 'approval';
  } | undefined;
  UserActivityPage:{ zone?: string } | undefined;
  ProductCatalogue:undefined;
  SubmitOrder:undefined;
  AddNewExpense:{
    expense?: any;
  } | undefined;
  AttendanceScreen:undefined;
  AddSecondaryCustomer:{
    customer?: any;
    type?: string;
    customerTypeId?: string | number;
    customerTypeName?: string;
  } | undefined;
  VisitReport:undefined;
  UserTourList:undefined;
  BeatCustomerList:undefined;
  OrderHistoryDetailsScreen:undefined
  Reports:undefined
  OrderListDetails:undefined
  IndividualPage:undefined
  AttendanceViewAllScreen:{
    zone?: string;
    type?: 'not_punch_in';
  } | undefined
  TargetArchieViewAllScreen:{ zone?: string } | undefined
  DealerDistributorPerformanceViewAllScreen:undefined
  PromotionalActivitiesViewAllScreen:undefined
  RetailersPerformanceViewAllScreen:undefined
  Notifications: undefined
  MyProfile: undefined
  LeadKonnect: undefined
  CallHistory: undefined
  CallDetails: { call: any }
  CreateLead: undefined
  LeadDetails: { lead?: any } | undefined
  EditLead: { lead?: any } | undefined
  OpportunityList: undefined
  Documents: undefined
  TaskList: { initialTab?: 'lead' | 'management' } | undefined
};

export type AppTextProps = {
  size?: number,
  color?: string,
  family?: 'InterBlack' | 'InterBold' | 'InterExtraBold' | 'InterExtraLight' | 'InterLight' | "InterMedium" | 'InterRegular' | 'InterSemiBold' | 'InterThin'
  align?: 'left' | 'center' | 'right' | 'justify'
  transform?: 'capitalize' | 'lowercase' | 'uppercase' | 'none'
  numLines?: number
  children?: React.ReactNode | React.ReactNode[]
  testID?: string,
  animateValue?: any,
  customColor?: string,
  spacing?: number | string | any,
  horizontal?: number | string | any,
  underlineColor?: string,
  underline?: 'underline' | 'line-through' | 'none' | 'underline line-through'
  textDecorationStyle?: 'dashed' | 'dotted' | 'solid' | 'double'
  onPress?: () => void,
  handleTextLayout?: (e: any) => void,
  dotMode?: 'head' | 'tail' | 'middle' | 'clip'
  width?: number | string | any
  maxWidth?: number | string | any
  opacity?: number | string | any
  lineHeight?: number | string | any
  fontStyle?: any
  style?: StyleProp<TextStyle>;
}

export type loginParmas ={
  username: any
  password: any
  app_version?: any
  build_number?: string
  device_name?: any
  device_type?: any
  unique_id?: string
  fcm_token?: string
}

export type signupParmas ={
  name: any
  mobile: any
  email: any
  password: any
}
