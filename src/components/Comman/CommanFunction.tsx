import { AddCustomerIcon, AdhocOrderIcon, CustomerVisitIcon, Expenses, NewsTileIcon, TourPlanIcon } from "../../assets/svgs/HomePageSvgs";
import { colors } from "../../utils/Colors";

export const dashboardTiles = [
  {
    id: "1",
    title: "Tour\nPlan",
    icon: <TourPlanIcon/>,
    bgColor: colors.blue,
    navigateTo: "TourPlanPage",
  },
  {
    id: "2",
    title: "Add\nCustomer",
    icon: <AddCustomerIcon/>,
    bgColor: colors.blue,
    navigateTo: "AddCustomer",
  },
  {
    id: "3",
    title: "Customers",
    icon: <CustomerVisitIcon/>,
    bgColor: colors.blue,
    navigateTo: "CustomerList",
  },
  {
    id: "4",
    title: "Adhoc\nOrder",
    icon: <AdhocOrderIcon/>,
    bgColor: colors.blue,
    navigateTo: "ProductCatalogue",
  },
  {
    id: "5",
    title: "Expenses",
    icon: <Expenses/>,
    bgColor: colors.blue,
    navigateTo: "ExpenseReport",
  },
  {
    id: "6",
    title: "News",
    icon: <NewsTileIcon/>,
    bgColor: colors.blue,
    navigateTo: "News",
  },
];
export const DATA = [
  {
    id: '1',
    company: 'Soil & Brick Infrastructures Private Limited',
    address: 'Scheme No. 78, Vijay Nagar, Indore(MP)',
    imageUrl: require('../../assets/images/Dummy/Customer1.png'), 
    rating: 'A+',
    type: 'Warm',
  },
   {
    id: '2',
    company: 'Soil & Brick Infrastructures Private Limited',
    address: 'Scheme No. 78, Vijay Nagar, Indore(MP)',
    imageUrl: require('../../assets/images/Dummy/Customer1.png'), 
    rating: 'A+',
    type: 'Warm',
  },
   {
    id: '3',
    company: 'Soil & Brick Infrastructures Private Limited',
    address: 'Scheme No. 78, Vijay Nagar, Indore(MP)',
    imageUrl: require('../../assets/images/Dummy/Customer2.png'), 
    rating: 'A+',
    type: 'Warm',
  },
  // Add more items...
];

export const summaryStats = [
  {
    id: "1",
    title: "Order\nValue",
    value: "0 ( Lac )",
    bgColor: '#395299',
  },
  {
    id: "2",
    title: "Order\nQuantity",
    value: "0",
    bgColor: '#4C6ABD',
  },
  {
    id: "3",
    title: "Total\nCustomer",
    value: "0",
    bgColor: '#5B77C2',
  },
  {
    id: "4",
    title: "Total\nCheck-Ins",
    value: "0",
    bgColor: '#6A83C8',
  },
];

export const summaryStats1 = [
  {
    id: "1",
    title: "Order\nValue",
    value: "0 ( Lac )",
    bgColor: '#395299',
  },
  {
    id: "2",
    title: "Order\nQuantity",
    value: "0",
    bgColor: '#4C6ABD',
  },
  {
    id: "3",
    title: "New\nCustomers",
    value: "0",
    bgColor: '#5B77C2',
  },
  {
    id: "4",
    title: "Total\nCheck-Ins",
    value: "0",
    bgColor: '#6A83C8',
  },
];

export const activityTimeline = [
  {
    id: "1",
    type: "Punch In",
    time: "10:00 AM",
    location: "Indore",
    description: "Work From Office",
  },
  // {
  //   id: "2",
  //   type: "Check In",
  //   time: "07:14 PM",
  //   location: "Indore",
  //   description: "Indore Water Technology.com",
  // },
  // {
  //   id: "3",
  //   type: "Order",
  //   time: "02:14 PM",
  //   location: null,
  //   description: "Gear Box",
  // },
  // {
  //   id: "4",
  //   type: "Check Out",
  //   time: "02:14 PM",
  //   location: "Indore",
  //   description: "Indian Water Technology.com.\nRemark- Order Placed.",
  // },
];
