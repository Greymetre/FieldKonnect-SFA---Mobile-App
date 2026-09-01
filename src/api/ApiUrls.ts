export const API_ENDPOINT = {
  //auth
  LOGIN: "api/login",
  LOGOUT: "api/logout",
  SYNC_MOBILE_SESSION: "api/mobile/session/sync",
  SIGNUP: "api/signup",
  GET_STATE_LIST: "api/getStateList",
  GET_BEAT_LIST: "api/getBeatDropdownList",
  GET_DISTRIBUTORS_LIST: "api/order/distributors",

  GET_DISTRICT_LIST: "api/getDistrictList",
  GET_CITIES_LIST: "api/getCityList",
  GET_USER_CITIES_LIST: "api/userCityList",
  GET_USER_DISTRICT_LIST: "api/userDistrictList",
  GET_PINCODES_LIST: "api/get-location-by-pincode",
  GET_PINCODESBYCITY_LIST: "api/getPincodeList",
  GET_NOTIFICATIONS: "api/getNotification",
  READ_NOTIFICATION: "api/notifications/read",
  GET_PROFILE: "api/getProfile",
  UPDATE_PROFILE: "api/updateProfile",
  CLICK_TO_CALL: "api/click-to-call",
  CLICK_TO_CALL_STATUS: "api/click-to-call",
  MY_CALL_HISTORY: "api/my-call-history",

  //customer 
  MASTER_DISTRIBUTOR_GET: "api/master-distributors?per_page=20",
  MASTER_DISTRIBUTOR: "api/master-distributors",
  MASTER_DISTRIBUTOR_POST: "api/master-distributors",
  GET_SUPERVISOR_API: "api/master-distributors/supervisors",
  //secondary cistomer 
  SECONDARY_CUSTOMER_GET: "api/secondary-customers?type=",
  GET_BEAT_CUSTOMER_LIST: "api/getBeatCustomers?beat_id=",
  GET_CUSTOMER_TYPE_LIST: "api/getCustomerTypeList",
  GET_CUSTOMER_LIST: "api/getCustomerList",
  GET_CUSTOMER_INFO: "api/getCustomerInfo",
  STORE_CUSTOMER: "api/storeCustomer",
  UPDATE_CUSTOMER_PROFILE: "api/updateCustomerProfile",
  SECONDARY_CUSTOMER: "api/secondary-customers",
  // MASTER_DISTRIBUTOR_POST:"api/master-distributors",
  // GET_SUPERVISOR_API : "api/master-distributors/supervisors",


  //Tour plan api
  TOUR_PLAN_GET: "api/tour/global",
  TOUR_PLAN_CHANGE_STATUS: "api/tour-plan/changeStatus",
  TOUR_GET_SHOW: "api/tour/show",
  TOUR_OBJECTIVES: "api/tour/objectives",
  BEAT_PLAN_DATA: "api/getTodaySchedul",

  //Attendance api
  GET_ALL_ATTENDANCE: "api/getAllUserPunchInOut",
  ATTENDANCE_DATA: "api/showAttendance?attendance_id=",
  UPDATE_LIVE_LOCATION: "api/updateLiveLocation",

  //Check in api
  CUSTOMER_CHECKIN: "api/submitCheckin",
  CUSTOMER_CHECKOUT: "api/submitCheckout",
  CHANGE_ATTENDANCE_STATUS: "api/attendance/changeStatus",
  //user activity 
  USER_ACTIVITY: "api/user/activity",

  // Expense APIs
  GET_EXPENSES_TYPE: "api/getExpensesType",
  CREATE_EXPENSE: "api/createExpense",
  UPDATE_EXPENSE: "api/updateExpense",
  EXPENSE_LISTING: "api/expenseListing",
  ALL_EXPENSE_LISTING: "api/allExpenseListing",
  EXPENSE_DETAILS: "api/expenseDetails",
  APPROVE_EXPENSE: "api/approveExpense",
  REJECT_EXPENSE: "api/rejectExpense",

};
