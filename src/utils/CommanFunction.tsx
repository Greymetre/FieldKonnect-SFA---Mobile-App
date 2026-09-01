// Attendance Data with Images
export const attendanceData = [
  {
    id: '1',
    count: 105,
    label: 'Total',
    color: '#e8eaf2',
    textColor:"#1f2937",
    image: require('../assets/images/Dummy/smile.png')
  },
  {
    id: '2',
    count: 90,
    label: 'Market',
    color: '#e1f5ee',
    textColor:"#075041",
    image: require('../assets/images/Dummy/check.png')
  },
  {
    id: '3',
    count: 7,
    label: 'On Leave',
    color: '#faeeda',
    textColor:"#633806",
    image: require('../assets/images/Dummy/sqaure.png')
  },
  {
    id: '4',
    count: 8,
    label: 'Mis Punch',
    color: '#fcebeb',
    textColor:"#791f1f",
    image: require('../assets/images/Dummy/exclamation.png')
  },
  {
    id: '5',
    count: 0,
    label: 'Holiday',
    color: '#e8f3ff',
    textColor:"#185fa5",
    image: require('../assets/images/Dummy/smile.png')
  },
];


// ASR & DSR Breakdown Data
export const breakdownData = [
  {
    id: '1',
    type: 'ASR',
    total: 65,
    badgeColor: '#e8eaf2',
    textColor: '#1E40AF',
    items: [
      { label: 'Market', value: 55, color: '#106e56',text:'#075041'  },
      { label: 'Leave', value: 5, color: '#ba7518',text:'#633806'  },
      { label: 'Mis Punch', value: 5, color: '#a32e2d',text:'#791f1f'  },
    ],
  },
  {
    id: '2',
    type: 'DSR',
    total: 40,
    badgeColor: '#e1f5ee',
    textColor: '#166534',
    items: [
      { label: 'Market', value: 35, color: '#106e56',text:'#075041' },
      { label: 'Leave', value: 2, color: '#ba7518',text:'#633806'  },
      { label: 'Mis Punch', value: 3, color: '#a32e2d',text:'#791f1f'  },
    ],
  },
];


export const orderData = [
  {
    id: '1',
    count: "800",
    label: 'Nos.Of Orders',
    color: '#e8eaf2',
    imageColor:'#3a4da0',
    image: require('../assets/images/Dummy/check.png')
  },
  {
    id: '2',
    count: "15K",
    label: 'Qty',
    color: '#e1f5ee',
    imageColor:'#106e56',
    image: require('../assets/images/Dummy/sqaure.png')
  },
  {
    id: '3',
    count: "₹3Cr",
    label: 'Value',
    color: '#faeeda',
    imageColor:'#8a5514',
    image: require('../assets/images/Dummy/rupee.png')
  },
];
