import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ArrowDownIcon } from '../../assets/svgs/SvgsFile';
import AppText from '../../components/AppText/AppText';
import { styles } from './styles';
import { rw } from '../../utils/responsive';
import { colors } from '../../utils/Colors';
import { NavigationProp, ParamListBase, useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import store from '../../components/redux/Store';
import { Dropdown } from 'react-native-element-dropdown';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeModules } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
const { HtmlToPdf } = NativeModules;
import { Platform } from 'react-native';
import { formatMobileNumberList } from '../../utils/phone';

const resolveMobileNumber = (...values: unknown[]) => {
    for (const value of values) {
        if (value === null || value === undefined || String(value).trim() === '') {
            continue;
        }

        const formattedNumber = formatMobileNumberList(value as string | number)[0];
        if (formattedNumber) {
            return formattedNumber;
        }
    }

    return '-';
};

interface OrderItem {
    id: string;               // unique key
    productName: string;
    quantity: number;
    rate: number;             // editable
    amount: number;           // calculated = qty × rate
}

const TableHeader = () => (
    <View style={styles.tableHeader}>
        <AppText size={14} color="#000000" family='InterSemiBold' width={'40%'}>
            Product
        </AppText>
        <AppText size={14} color="#000000" family='InterSemiBold' width={'10%'} align='center'>
            Qty
        </AppText>
        <AppText size={14} color="#000000" family='InterSemiBold' width={'25%'} align='center'>
            Rate
        </AppText>
        <AppText size={14} color="#000000" family='InterSemiBold' width={'25%'} align='center'>
            Amount
        </AppText>
    </View>
);

interface TableRowProps {
    label: string;
    value?: string | number;
    isQty?: boolean;
    qty?: number;
    onQtyChange?: (newQty: number) => void;
    rate?: number;
    amount?: number;
}
const TableRow: React.FC<TableRowProps> = ({
    label,
    value,
    isQty = false,
    qty,
    onQtyChange,
    rate,
    amount,
}) => (
    <View style={styles.tableRows}>
        <View style={{ width: '35%' }}>
            <AppText size={14} color={'#333333'} family={'InterRegular'}>
                {label}
            </AppText>
        </View>

        <View style={{ width: '15%', alignItems: 'center' }}>
            <AppText size={14} color={'#333333'} family={'InterRegular'}>
                {value}
            </AppText>
        </View>

        <AppText size={14} color={'#333333'} family={'InterRegular'} width={'25%'} align='center'>
            {rate}
        </AppText>

        <AppText size={14} color={'#333333'} family="InterBold" width={'25%'} align='center'>
            {amount}
        </AppText>
    </View>
);


const OrderHistoryDetailsScreen = () => {
    const navigation = useNavigation<NavigationProp<ParamListBase>>();
    const route = useRoute();
    const { orderId } = route.params as { orderId: number };
    const [orderDetails, setOrderDetails] = useState<any>(null);
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        fetchOrderDetails();
    }, []);

    const fetchOrderDetails = async () => {
        const token = store.getState().auth?.token;

        if (!token) {
            Toast.show({ type: 'error', text1: 'Token not found' });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `https://duke.fieldkonnect.in/api/getOrderDetails?order_id=${orderId}`,
                {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const json = await response.json();


            if (json?.status) {
                setOrderDetails(json?.data);
                setOrderItems(json?.data?.orderdetails || []);
            } else {
                Toast.show({
                    type: 'error',
                    text1: json?.message || 'Failed to load order',
                });
            }
        } catch (error) {
            console.log("Order details error", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculations
    const totalQuantity = orderItems.reduce((sum, item) => {
        return sum + Number(item.quantity || 0);
    }, 0);

    const totalOrderValue = orderItems.reduce((sum, item) => {
        return sum + Number(item.line_total || 0);
    }, 0);

    const customerMobileNumber = resolveMobileNumber(
        orderDetails?.buyers?.mobile_number,
        orderDetails?.buyers?.mobile,
        orderDetails?.buyers?.contact_number,
        orderDetails?.buyers?.phone,
        orderDetails?.buyer?.mobile_number,
        orderDetails?.buyer?.mobile,
        orderDetails?.buyer?.contact_number,
        orderDetails?.buyer_mobile_number,
        orderDetails?.buyer_mobile,
        orderDetails?.customer_mobile_number,
        orderDetails?.customer_mobile,
    );

    const distributorMobileNumber = resolveMobileNumber(
        orderDetails?.seller?.mobile_number,
        orderDetails?.seller?.mobile,
        orderDetails?.seller?.contact_number,
        orderDetails?.seller?.phone,
        orderDetails?.seller_mobile_number,
        orderDetails?.seller_mobile,
    );

    const generatePDF = async () => {
        try {

            // ✅ Total Quantity
            const totalQty = orderItems.reduce((sum, item) => {
                return sum + Number(item.quantity || 0);
            }, 0);

            const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
            <meta charset="utf-8">
            <style>
            body {
                font-family: Arial, sans-serif;
                margin: 10px;
                color: #000;
            }

            h1 {
                font-size: 22px;
                margin-bottom: 10px;
            }

            h2 {
                margin-top: 20px;
                font-size: 18px;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }

            td, th {
                border: 1px solid #ccc;
                padding: 8px;
                font-size: 13px;
            }

            th {
                background-color: #eee;
                font-weight: bold;
            }

            .section-title {
                background-color: #f2f2f2;
                font-weight: bold;
            }

            .right {
                text-align: right;
            }

            .no-border td {
                border: none !important;
                padding-top: 10px;
            }

            </style>
            </head>

            <body>

            <h1>Order Details</h1>

            <table>
            <tr>
                <td><b>Order Number</b></td>
                <td>${orderDetails?.orderno}</td>
                <td><b>Order Date</b></td>
                <td>${orderDetails?.order_date}</td>
            </tr>

            <tr class="section-title">
                <td colspan="2">Buyer Details</td>
                <td colspan="2">Seller Details</td>
            </tr>

            <tr>
                <td>Name</td>
                <td>${orderDetails?.buyer_name}</td>
                <td>Name</td>
                <td>${orderDetails?.seller_name}</td>
            </tr>

            <tr>
                <td>Mobile Number</td>
                <td>${customerMobileNumber}</td>
                <td>Mobile Number</td>
                <td>${distributorMobileNumber}</td>
            </tr>

            <tr>
                <td>Address</td>
                <td>${orderDetails?.buyer_address}</td>
                <td>Address</td>
                <td>${orderDetails?.seller_address}</td>
            </tr>

            </table>

            <h2>Product Details</h2>

            <table>
            <tr>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Rate(LP)</th>
                <th>Amount</th>
            </tr>

            ${orderItems.map((item: any) => `
                <tr>
                <td>${item.product_name}</td>
                <td>${item.quantity}</td>
                <td>${item.price}</td>
                <td>${item.line_total}</td>
                </tr>
            `).join('')}

            </table>

            <table>
            <tr>
                <td><b>Total Quantity</b></td>
                <td class="right"><b>${totalQty}</b></td>
            </tr>
            <tr>
                <td><b>Total Order Value</b></td>
                <td class="right"><b>${totalOrderValue.toFixed(2)}</b></td>
            </tr>
            <tr>
                <td><b>Remark</b></td>
                <td style="white-space: pre-wrap;">
                ${orderDetails?.order_remark || '-'}
                </td>
            </tr>
            </table>



            </body>
            </html>
            `;

            const options = {
                html: htmlContent,
                fileName: `Order_${orderDetails?.orderno}`,
                directory: Platform.OS === 'android' ? 'Documents' : 'Documents',
            };

            const file = await HtmlToPdf.convert(options);

            if (!file?.filePath) {
                throw new Error('PDF not generated');
            }

            const fileName = `Order_${orderDetails?.orderno}_111${Date.now()}.pdf`;

            const { fs } = ReactNativeBlobUtil;
            const destPath =
                Platform.OS === 'android'
                    ? `${fs.dirs.DownloadDir}/${fileName}`
                    : `${fs.dirs.DocumentDir}/${fileName}`;

            // OPTIONAL (if you don’t use timestamp)
            const exists = await fs.exists(destPath);
            if (exists) {
                await fs.unlink(destPath);
            }

            // Copy file
            await fs.cp(file.filePath, destPath);

            // Step 3: Android Download Manager (VISIBLE in Downloads)
            if (Platform.OS === 'android') {
                await ReactNativeBlobUtil.android.addCompleteDownload({
                    title: fileName,
                    description: 'Order PDF downloaded',
                    mime: 'application/pdf',
                    path: destPath,
                    showNotification: true,
                });
            }

            // Step 4: iOS open file
            if (Platform.OS === 'ios') {
                console.log(destPath, 'destPathdestPath');
                ReactNativeBlobUtil.ios.previewDocument(destPath);
            }

            // Alert.alert('Success', `Saved to:\n${destPath}`);

            Toast.show({
                type: 'success',
                text1: 'PDF Downloaded Successfully',
                // text2: destPath,
            });

        } catch (error: any) {
            console.log('PDF error:', error);

            Toast.show({
                type: 'error',
                text1: 'PDF Failed',
                text2: error?.message,
            });
        }
    };


    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>

            {
                loading ? (
                    <View style={{ flex: 1, marginTop: 100 }}>
                        <ActivityIndicator size="large" color={colors.blue} />
                    </View>
                ) : (
                    <ScrollView style={[styles.container, { paddingHorizontal: rw(18) }]} >
                        <View style={{ marginTop: 20, gap: 6 }}>
                            <AppText size={14} color={'black'} family={'InterBold'}>
                                Customer Name : {orderDetails?.buyer_name}
                            </AppText>

                            <AppText size={14} color={'black'} family={'InterBold'}>
                                Customer Address : {orderDetails?.buyer_address}
                            </AppText>

                            <AppText size={14} color={'black'} family={'InterBold'}>
                                Customer Mobile : {customerMobileNumber}
                            </AppText>

                            <AppText size={14} color={'black'} family={'InterBold'}>
                                Distributor Name : {orderDetails?.seller_name}
                            </AppText>

                            <AppText size={14} color={'black'} family={'InterBold'}>
                                Distributor Address : {orderDetails?.seller_address}
                            </AppText>

                            <AppText size={14} color={'black'} family={'InterBold'}>
                                Distributor Mobile : {distributorMobileNumber}
                            </AppText>

                            <AppText size={14} color={'#333333'} family={'InterRegular'}>
                                Order Number : {orderDetails?.orderno}
                            </AppText>

                            <AppText size={14} color={'#333333'} family={'InterRegular'}>
                                Order Date : {orderDetails?.order_date}
                            </AppText>

                            <AppText size={14} color={'#333333'} family={'InterRegular'}>
                                Created By : {orderDetails?.createdbyname?.name}
                            </AppText>
                            <AppText size={14} color={'#333333'} family={'InterRegular'}>
                                Remark :  {orderDetails?.order_remark}
                            </AppText>
                        </View>
                        <View style={styles.tableContainers}>
                            <TableHeader />
                            <View style={{
                                borderBottomWidth: 1,
                                borderBottomColor: '#eee',
                                marginBottom: 10
                            }} />
                            {orderItems.map((item) => (
                                <TableRow
                                    key={item.id}
                                    label={item.product_name}
                                    value={item.quantity}
                                    rate={item.price}
                                    amount={item.line_total}
                                />
                            ))}

                        </View>

                        <View style={[styles.tableContainers, { paddingHorizontal: 14 }]}>
                            <View style={[styles.tableRow, { paddingTop: rw(10), paddingRight: 25 }]}>
                                <AppText size={14} color={'#333333'} family={'InterRegular'}>
                                    Total Quantity
                                </AppText>
                                <AppText size={16} color={colors.blue} family="InterBold">
                                    {totalQuantity}
                                </AppText>
                            </View>
                            <View style={[styles.tableRow, { paddingTop: rw(10) }]}>
                                <AppText size={14} color={'#333333'} family={'InterRegular'}>
                                    Total Order Value
                                </AppText>
                                <AppText size={16} color={colors.blue} family="InterBold" horizontal={20}>
                                    {totalOrderValue.toFixed(2)}
                                </AppText>
                            </View>
                        </View>



                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                            <Pressable style={[styles.buttonView, { width: '48%', }]}  onPress={generatePDF}>
                                <AppText color='white' family='InterBold' size={16}>Download</AppText>
                            </Pressable>
                            {/* <Pressable style={[styles.buttonView, { width: '48%', backgroundColor: 'red' }]} >
                                <AppText color='white' family='InterBold' size={16}>Cancel</AppText>
                            </Pressable> */}
                        </View>
                        {/* <Pressable style={[styles.buttonView,]} >
                            <AppText color='white' family='InterBold' size={16}>Order Dispatch</AppText>
                        </Pressable> */}
                    </ScrollView>
                )
            }

        </SafeAreaView>
    );
}


export default OrderHistoryDetailsScreen;
