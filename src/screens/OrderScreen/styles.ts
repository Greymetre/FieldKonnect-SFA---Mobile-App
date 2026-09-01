import { StyleSheet } from "react-native";
import { colors } from "../../utils/Colors";
import { rw } from "../../utils/responsive";
import { fonts } from "../../utils/typography";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F4'

    },
    row: {
        flexDirection: "row",
        alignItems: "center"
    },
    UserBox: {
        flex: 0.5,
        height: 48,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(203, 213, 224, 1)",
        backgroundColor: "rgba(57, 82, 153, 0.07)",
        paddingHorizontal: 14
    },
    dateTimeBox: {
        marginTop: 10,
        height: 48,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(203, 213, 224, 1)",
        backgroundColor: "rgba(57, 82, 153, 0.07)",
        paddingHorizontal: 14,
        // flex: 1

    },
    calenderICon: {
        height: 32,
        width: 32,
        backgroundColor: 'white',
        borderColor: "#CBD5E0",
        borderWidth: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    listItem: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10
    },
    line: {
        width: "100%",
        height: 1,
        backgroundColor: "#D9D9D9",
        marginTop: 20
    },
    firstPunchIN: {
        flex: 0.32,
        gap: 8
    },
    detailsRow: {
        marginTop: 16,
        justifyContent: 'space-between',
        flex: 1
    },
    detailsFirstRow: {
        flex: 0.6
    },
    detailsSecondRow: {
        flex: 0.4
    },
    firstAttachemnt: {
        flex: 0.5,
        gap: 13
    },
    attImg: {
        width: '100%',
        height: 110,
        borderRadius: 6
    },
    quantitySection: {
        marginTop: rw(20),
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        gap: 20
    },
    productImage: {
        height: '100%',
        width: '100%',
        borderRadius: 18
    },
    productContainer: {
        height: 160,
        width: 160,
        borderRadius: 22,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: colors.blue,
        overflow: 'hidden'
    },
    tableContainer: {
        // marginBottom: rw(14),
        width: '52%',
    },
    tableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: rw(6),
    },
    quantityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 20
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        width: 150,
        justifyContent: 'space-between',
        paddingHorizontal: rw(10),
        paddingVertical: rw(2),
        borderWidth: 1,
        borderColor: '#E1DEDF'
    },

    quantityDisplay: {
        width: rw(50),
        alignItems: 'center',
    },
    placeOrderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        backgroundColor: colors.blue,
        paddingHorizontal: rw(20),
        borderRadius: 6,
        width: '55%',
        height: 44,
        position: 'relative',
    },
    chatButton: {
        borderRadius: 100,
        height: 45,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        justifyContent: 'center',
        width: '48%',
        marginBottom: 20
    },
    cartBadge: {
        position: 'absolute',
        top: 6,
        left: 52,
        backgroundColor: '#F17929',
        borderRadius: 100,
        minWidth: 15,
        height: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tableContainers: {
        backgroundColor: '#fff',
        borderRadius: rw(12),
        paddingVertical: rw(12),
        borderWidth: 1,
        marginTop: 20,
        borderColor: '#CBD5E0',
    },
    tableHeader: {
        flexDirection: 'row',
        paddingBottom: rw(8),
        paddingHorizontal: rw(12),
    },
    tableRows: {
        flexDirection: 'row',
        paddingVertical: rw(6),
        paddingHorizontal: rw(12),
        alignItems: 'center',
    },
    discountRow: {
        paddingHorizontal: rw(12),
    },
    discount: {
        width: 85,
        height: 26,
        borderWidth: 1,
        justifyContent: 'center',
        paddingHorizontal: 10,
        borderColor: '#DADADA',
    },
    remarkContainer: {
        marginTop: rw(16),
    },
    remarkInput: {
        height: rw(48),
        borderWidth: 1,
        borderColor: '#CBD5E0',
        borderRadius: rw(8),
        padding: rw(12),
        marginTop: rw(8),
        fontFamily: fonts.InterRegular,
        fontSize: 14,
        color: colors.black,
        backgroundColor: '#fff',
    },
    buttonView: {
        backgroundColor: colors.blue,
        width: '100%',
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
        marginTop: 10
    },

    selectUser: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(203, 213, 224, 1)",
        backgroundColor: 'rgba(57, 82, 153, 0.07)',
        height: 48,

        paddingHorizontal: 14
    },

    searchBox: {
        height: 48,
        marginTop: 15,
        borderRadius: 8,
        paddingHorizontal: 14,
        backgroundColor: colors.blue,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    searchInput: {
        flex: 1,
        height: 48,
        color: colors.white,
        fontFamily: fonts.InterRegular,
        fontSize: 14,
        paddingVertical: 0,
    },

    

})
