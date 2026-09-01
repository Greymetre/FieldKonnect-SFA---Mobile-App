import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ArrowDownIcon } from '../../assets/svgs/SvgsFile';
import AppText from '../../components/AppText/AppText';
import { styles } from './styles';
import { rw } from '../../utils/responsive';
import FastImage from 'react-native-fast-image';
import { AddCartMiunsIcon, PlaceOrderIcon, PlusIcon } from '../../assets/svgs/HomePageSvgs';
import { colors } from '../../utils/Colors';
import { Dropdown } from 'react-native-element-dropdown';
import Toast from 'react-native-toast-message';
import store from '../../components/redux/Store';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';


type ProductCatalogueProps = {
    navigation: any;
    route: any
}

interface CartItem {
    productId: number | string;
    productName: string;
    quantity: number;
    price: number;
}

interface DropdownItem {
    label: string;
    value: number | string;
}
const ProductCatalogue = ({ navigation, route }: ProductCatalogueProps) => {
    const [segmentList, setSegmentList] = useState<DropdownItem[]>([]);
    const [familyList, setFamilyList] = useState<DropdownItem[]>([]);
    const [productList, setProductList] = useState<DropdownItem[]>([]);
    const [selectedSegmentId, setSelectedSegmentId] = useState<number | string | null>(null);
    const [selectedFamilyId, setSelectedFamilyId] = useState<number | string | null>(null);

    const [products, setProducts] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingFamily, setLoadingFamily] = useState<boolean>(true);
    const [productDetails, setProductDetails] = useState<any | null>(null);
    const [productImageError, setProductImageError] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [isEditingQty, setIsEditingQty] = useState(false);
    const [tempQuantity, setTempQuantity] = useState<string>('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const token = store.getState().auth?.token;

    const resetPageState = useCallback(() => {
        setSelectedFamilyId(null);
        setSelectedProduct(null);
        setQuantity(1);
        setCart([]);                    // ← clear cart (remove if you want to keep it)
        // reset any other form-related state here
    }, []);



    useFocusEffect(
        useCallback(() => {
            const unsubscribe = navigation.addListener('beforeRemove', (e) => {
                // Prevent default back action
                e.preventDefault();
                resetPageState();
                navigation.dispatch(e.data.action);
                // navigation.goBack();
                // Show confirmation alert
                // Alert.alert(
                //     'Confirm',
                //     'Are you sure you want to leave Product Catalogue?',
                //     [
                //         {
                //             text: 'Cancel',
                //             style: 'cancel',
                //             // Do nothing → stay on screen
                //         },
                //         {
                //             text: "Yes, I'm sure",
                //             style: 'destructive',
                //             onPress: () => {
                //                 // User confirmed → reset + actually go back
                //                 resetPageState();
                //                 navigation.dispatch(e.data.action); // proceed with back
                //             },
                //         },
                //     ],
                //     { cancelable: true }
                // );
            });

            // Also handle Android hardware back button (extra safety)
            const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
                // Trigger the same alert logic
                resetPageState();
                navigation.goBack();
                // Alert.alert(
                //     'Confirm',
                //     'Are you sure you want to leave Product Catalogue?',
                //     [
                //         { text: 'Cancel', style: 'cancel' },
                //         {
                //             text: "Yes, I'm sure",
                //             onPress: () => {
                //                 resetPageState();
                //                 navigation.goBack();
                //             },
                //         },
                //     ]
                // );
                return true; // prevent default back
            });

            return () => {
                unsubscribe();
                backHandler.remove();
            };
        }, [navigation, resetPageState])
    );

    useEffect(() => {
        fetchSegments();
    }, []);


    const fetchSegments = async () => {
        try {
            const res = await fetch(
                `https://duke.fieldkonnect.in/api/getCategoryList`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                }
            );

            const json = await res.json();

            const segmentData = json?.data?.map((item: any) => ({
                label: item.category_name,
                value: item.id,
            }));

            setSegmentList(segmentData || []);
        } catch (error) {
            console.log('Segment error', error);
        }
    };

    useEffect(() => {
        // if (!selectedSegmentId) return;

        fetchFamily();
    }, [selectedSegmentId]);

    const fetchFamily = async () => {
        setLoadingFamily(true)
        console.log(selectedSegmentId, 'selectedSegmentId', 'selectedSegmentId')
        try {
            const res = await fetch(
                !selectedSegmentId 
                ? `https://duke.fieldkonnect.in/api/getSubCategoryList`
                : `https://duke.fieldkonnect.in/api/getSubCategoryList?category_id=${selectedSegmentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const json = await res.json();

            const familyData = json?.data?.map((item: any) => ({
                label: item.subcategory_name,
                value: item.id,
            }));

            setFamilyList(familyData || []);
            setLoadingFamily(false)
        } catch (error) {
            setLoadingFamily(false)
            console.log('Family error', error);
        }
    };





    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async (subcategoryId?: number | string) => {
        setLoadingProducts(true);

        try {
            const url = subcategoryId
                ? `https://duke.fieldkonnect.in/api/getProductList?subcategory_id=${subcategoryId}`
                : `https://duke.fieldkonnect.in/api/getProductList`;

            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const json = await res.json();

            const productData = json?.data?.map((item: any) => ({
                label: item.product_name,
                value: item.id,
                subcategory_id: item.subcategory_id,
                subcategory_name: item.subcategory_name,
                category_id: item.category_id,
                category_name: item.category_name,
            }));

            setProductList(productData || []);
        } catch (error) {
            console.log("Product error", error);
        } finally {
            setLoadingProducts(false);
        }
    };
    /*
    --------------------------
    PRODUCT DETAILS API
    --------------------------
    */

    const fetchProductDetails = async (productId: number | string) => {
        try {
            const res = await fetch(
                `https://duke.fieldkonnect.in/api/getProductDetails?product_id=${productId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const json = await res.json();

            setProductDetails(json?.data || null);
            setProductImageError(false);
        } catch (error) {
            console.log('Product details error', error);
        }
    };


    const resetForm = () => {
        if (!selectedProduct) {
            Toast.show({
                type: 'info',
                text1: 'Please add product',
                position: 'top',
            });
            return;
        }
        setSelectedProduct(null);
        setSelectedFamilyId(null)
        setSelectedSegmentId(null)
        fetchProducts();
        setProductDetails(null)
        setQuantity(1);
        setIsEditingQty(false);
        setTempQuantity('');
    };
    const addToCart = () => {
        if (!selectedProduct) {
            Toast.show({
                type: 'info',
                text1: 'Please select product',
                position: 'top',
            });
            return;
        }

        if (!productDetails?.mrp) {
            Toast.show({
                type: 'error',
                text1: 'Product price not available',
                position: 'top',
            });
            return;
        }

        const itemPrice = Number(productDetails.mrp); // or productDetails.selling_price if you have it

        setCart((prevCart) => {
            const existingIndex = prevCart.findIndex(
                (item) => item.productId === selectedProduct.value
            );

            if (existingIndex !== -1) {
                // Update existing item
                const updatedCart = [...prevCart];
                updatedCart[existingIndex] = {
                    ...updatedCart[existingIndex],
                    quantity: quantity,
                    price: itemPrice,           // ← keep consistent price
                };

                Toast.show({
                    type: 'success',
                    text1: 'Quantity updated',
                    position: 'top',
                });

                return updatedCart;
            }

            // Add new item
            const newItem: CartItem = {
                productId: selectedProduct.value,
                productName: selectedProduct.label,
                quantity: quantity,
                price: itemPrice,
            };

            Toast.show({
                type: 'success',
                text1: 'Added to cart',
                position: 'top',
            });

            return [...prevCart, newItem];
        });
    };

    const getTotalCartItems = () => {
        return cart?.length;
    };

    const goToPlaceOrder = () => {
        if (cart.length === 0) {
            Toast.show({ type: 'info', text1: 'Cart is empty', position: 'top' });
            return;
        }

        // Optional: check if current selected product is in cart with correct qty
        if (selectedProduct) {
            const currentInCart = cart.find(item => item.productId === selectedProduct.value);
            if (currentInCart && currentInCart.quantity !== quantity) {
                Toast.show({
                    type: 'info',
                    text1: 'You have unsaved quantity changes',
                    text2: 'Press "Add to Cart" first',
                    position: 'top',
                });
                return;
            }
        }

        navigation.navigate('SubmitOrder', {
            cartItems: cart,
            routeData: route?.params,
            updateCart: (updatedCart: CartItem[]) => setCart(updatedCart),
        });
    };



    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <KeyboardAwareScrollView
                style={[styles.container, { paddingHorizontal: rw(18) }]} keyboardDismissMode='on-drag' showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bottomOffset={50}
            // contentContainerStyle={{ padding: 16 }}


            >
                {/* <ScrollView style={[styles.container, { paddingHorizontal: rw(18) }]} keyboardDismissMode='on-drag' showsVerticalScrollIndicator={false}> */}
                <View style={[styles.row, { gap: 10, marginVertical: 20 }]}>
                    <View style={{ flex: 1, gap: 10 }}>
                        <AppText size={16} color='black' family='InterBold' opacity={0.8}>Category</AppText>

                        <Dropdown
                            style={styles.selectUser}
                            placeholderStyle={{ color: '#718096', fontSize: 14 }}
                            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
                            inputSearchStyle={{ height: 40, fontSize: 14 }}
                            data={segmentList}

                            search
                            maxHeight={300}
                            labelField="label"
                            valueField="value"
                            placeholder="Select category"
                            searchPlaceholder="Search category..."
                            value={selectedSegmentId}
                            onChange={(item) => {
                                setSelectedSegmentId(item.value);
                                setSelectedFamilyId(null);
                                setProductList([]);
                                setSelectedProduct(null);
                            }}
                            renderRightIcon={() => <ArrowDownIcon />}
                        />


                    </View>
                </View>
                <View style={[styles.row, { gap: 10, marginBottom: 20 }]}>
                    <View style={{ flex: 1, gap: 10 }}>
                        <AppText size={16} color='black' family='InterBold' opacity={0.8}>Subcategory</AppText>
                        <Dropdown
                            style={styles.selectUser}
                            placeholderStyle={{ color: '#718096', fontSize: 14 }}
                            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
                            inputSearchStyle={{ height: 40, fontSize: 14 }}
                            data={familyList}
                            search
                            maxHeight={300}
                            labelField="label"
                            valueField="value"
                            placeholder="Select subcategory"
                            searchPlaceholder="Search subcategory..."
                            value={selectedFamilyId}
                            onChange={(item) => {
                                setSelectedFamilyId(item.value);
                                setSelectedProduct(null);
                                fetchProducts(item.value);
                            }}
                            renderRightIcon={() => <ArrowDownIcon />}
                        />


                    </View>
                </View>

                <View style={{ flex: 1, gap: 10 }}>
                    <AppText size={16} color='black' family='InterBold' opacity={0.8}>Product Name</AppText>
                    <Dropdown
                        style={styles.selectUser}
                        placeholderStyle={{ color: '#718096', fontSize: 14 }}
                        selectedTextStyle={{ color: colors.black, fontSize: 14 }}
                        inputSearchStyle={{ height: 40, fontSize: 14 }}
                        data={productList.length > 0 ? productList : [{label: 'Loading...', value: 1}]}
                        search
                        maxHeight={300}
                        labelField="label"
                        valueField="value"
                        placeholder="Select Product"
                        searchPlaceholder="Select Product..."
                        value={selectedProduct}
                        // disable={loadingProducts}
                        onChange={(item) => {
                            if(loadingProducts && productList.length == 0) return
                            setSelectedProduct(item);
                            if (item.subcategory_id) {
                                setSelectedFamilyId(item.subcategory_id);
                            }

                            // ⭐ Auto set Segment
                            if (item.category_id) {
                                setSelectedSegmentId(item.category_id);
                            }
                            fetchProductDetails(item.value);
                        }}
                        renderRightIcon={() =>
                            <ArrowDownIcon />
                        }

                    />
                    {selectedFamilyId && !loadingProducts && productList?.length === 0 && (
                        <AppText
                            size={13}
                            color="#e74c3c"
                            family="InterMedium"
                            style={{ marginTop: rw(8), textAlign: 'center' }}
                        >
                            No products found in this family
                        </AppText>
                    )}
                </View>
                {
                    productDetails && (
                        <View style={styles.quantitySection}>
                            <View style={styles.productContainer}>
                                <FastImage
                                    style={styles.productImage}
                                    source={
                                        productDetails?.product_image && !productImageError
                                            ? { uri: productDetails.product_image }
                                            : require('../../assets/images/Dummy/order2.png')
                                    }
                                    resizeMode='cover'
                                    onError={() => setProductImageError(true)}
                                />
                            </View>
                            <View style={[styles.tableContainer, { alignSelf: 'center' }]}>
                                <View style={[styles.tableRow, {
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#E1DEDF',
                                    width: "100%"
                                }]}>
                                    <View style={{ width: '48%' }}>
                                        <AppText size={14} color='black' family='InterSemiBold' opacity={0.8}>
                                            Subcategory
                                        </AppText>
                                        <AppText size={13} color="black" family='InterRegular' opacity={0.8}>
                                            {productDetails?.subcategory_name}
                                        </AppText>
                                    </View>
                                    <View style={{ width: '48%', alignItems: 'center' }}>
                                        <AppText size={14} color='black' family='InterSemiBold' opacity={0.8}>
                                            Product
                                        </AppText>
                                        <AppText size={13} color="black" family='InterRegular' opacity={0.8} align='center'>
                                            {productDetails?.product_name}
                                        </AppText>
                                    </View>
                                </View>

                                <View style={[styles.tableRow, {
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#E1DEDF',
                                }]}>
                                    <View style={{ width: '48%' }}>
                                        <AppText size={14} color='black' family='InterSemiBold' opacity={0.8}>
                                            Code
                                        </AppText>
                                        <AppText size={13} color="black" family='InterRegular' opacity={0.8}>
                                            {productDetails?.product_code}
                                        </AppText>
                                    </View>
                                    <View style={{ width: '48%', alignItems: 'center' }}>
                                        <AppText size={14} color='black' family='InterSemiBold' opacity={0.8}>
                                            MRP
                                        </AppText>
                                        <AppText size={13} color="black" family='InterRegular' opacity={0.8} align='center'>
                                            ₹ {productDetails?.mrp}
                                        </AppText>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )
                }

                <View style={styles.quantityRow}>
                    <View style={styles.quantityControls}>
                        <TouchableOpacity onPress={() => {
                            setQuantity((q) => Math.max(1, q - 1));
                        }}>
                            <AddCartMiunsIcon />
                        </TouchableOpacity>
                        <View style={[{ width: 60 }]}>
                            <TextInput
                                style={{
                                    flex: 1,
                                    fontSize: 15,
                                    fontFamily: 'InterBold',
                                    color: '#395299',
                                    textAlign: 'center',
                                    paddingHorizontal: 4,
                                }}
                                value={isEditingQty ? tempQuantity : String(quantity)}  // ← key part
                                onChangeText={(text) => {
                                    const cleaned = text.replace(/[^0-9]/g, '');

                                    setTempQuantity(cleaned);
                                    setQuantity(cleaned == '' ? 1 : Number(cleaned)); // update main qty only with valid number
                                }}
                                keyboardType="number-pad"

                                maxLength={6}
                                onFocus={() => {
                                    setIsEditingQty(true);
                                    setTempQuantity(String(quantity)); // start with current value
                                }}
                                onBlur={() => {
                                    setIsEditingQty(false);
                                    const num = tempQuantity === '' ? 1 : Number(tempQuantity);
                                    setQuantity(isNaN(num) || num < 1 ? 1 : num);
                                    setTempQuantity(''); // clean up
                                }}

                            />
                        </View>
                        <TouchableOpacity onPress={() => {
                            Keyboard.dismiss();
                            setQuantity((q) => q + 1);
                        }}>
                            <PlusIcon />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.placeOrderBtn} onPress={goToPlaceOrder}>
                        <PlaceOrderIcon color={'white'} />
                        <View style={styles.cartBadge}>
                            <AppText size={10} color="white" family="InterBold">
                                {getTotalCartItems()}
                            </AppText>
                        </View>
                        <AppText size={15} color="white" family="InterBold">
                            Place Order
                        </AppText>
                    </TouchableOpacity>
                </View>
                <View style={[styles.row, { justifyContent: 'space-between', marginTop: 25 }]}>
                    <Pressable style={[styles.chatButton, { backgroundColor: colors.blue }]} onPress={resetForm}>
                        <AppText size={14} color={colors.white} family='InterBold' >Add More Product</AppText>
                    </Pressable>
                    <Pressable style={[styles.chatButton, { backgroundColor: '#D2DAEE' }]} onPress={addToCart}>
                        <PlaceOrderIcon />
                        <AppText size={14} color={'#395299'} family='InterBold' >Add to Cart</AppText>
                    </Pressable>
                </View>
                {/* </ScrollView> */}
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}


export default ProductCatalogue;
