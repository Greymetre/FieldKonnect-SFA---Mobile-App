import { Platform, StyleSheet } from "react-native";
import { rw } from "../../utils/responsive";
import { colors } from "../../utils/Colors";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.offWHite
    },
    tabBarView: {
        height: 65,
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 64,
        shadowOffset: { width: 0, height: 5 },
        shadowColor: Platform.OS == "android" ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)',
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 8,
        padding: rw(10),

    },
    row: {
        flexDirection: "row",
        alignItems: "center"
    },
    firstTab: {
        width: '50%',
        height: 50
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: colors.blue,
        height: '100%',
        borderRadius: 63,
    },
    activeInnerContainer: {
        flex: 1,
        marginTop: 20
    },
    imageView: {
        padding: 10,
        backgroundColor: colors.white,
        borderRadius: 8
    },
    firstImage: {
        width: '100%',
        height: 221,
        marginBottom: 10
    },
    textHeading: {
        gap: 6
    },
    filter: {
        marginTop: 20,
        marginBottom: 18,
        justifyContent: 'space-between',
    },
    calender: {
        height: 40,
        width: 40,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: "center",
        backgroundColor: colors.blue
    },
    orderInformation: {
        backgroundColor: colors.white,
        padding: 18,
        borderRadius: 6
    },
    rowView: {
        justifyContent: 'space-between',
    },
    gapView: {
        gap: 13,
        flex: 1,
        marginVertical: 20
    },
    activityButton: {
        flex: 0.5,
        height: 83,
        borderRadius: 6,
        gap: 8
    },
    detailsView: {
        marginTop: 20
    },
    detailsRow: {
        marginTop: 14,
        justifyContent: 'space-between',
        flex: 1
    },
    detailsFirstRow: {
        flex: 0.6
    },
    detailsSecondRow: {
        flex: 0.4
    },
    headerRow: {
        justifyContent: 'space-between',
    },
    button: {
        height: 34,
        paddingHorizontal: rw(10),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.lightBlue,
        borderRadius: 40
    },
    firstAttachemnt: {
        flex: 0.5,
        gap: 13
    },
    attImg: {
        width: '100%',
        height: 91,
        borderRadius: 6
    },
    edit: {
        height: 44,
        alignSelf: "center",
        paddingHorizontal: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 36,
        backgroundColor: colors.blue,
        marginBottom: 20,
        marginTop: 25,
        width: '90%'
    },
    modalContainer: {
        flex: 1,
        // marginTop: Platform?.OS == 'ios' ? 0 : -40,
        backgroundColor: 'rgba(0,0,0,0.98)',


    },
    approveRejectView: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 28,
        marginBottom: 20
    },
    approveView: {
        gap: 10
    },
    circle: {
        height: 29,
        width: 29,
        borderRadius: 15,
        borderColor: '#339D4F',
        borderWidth: 2,
        padding: 6
    },
    circleInner: {

        backgroundColor: 'transparent',
        height: 18,
        width: 18,
        borderRadius: 12,
        overflow: 'hidden'
    },
});