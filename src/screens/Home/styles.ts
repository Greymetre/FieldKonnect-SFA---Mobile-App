import { Platform, StyleSheet } from "react-native";
import { colors } from "../../utils/Colors";
import { rw } from "../../utils/responsive";
import { SCREEN_WIDTH } from "../../utils/misc";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgColor
    },
    blueContaier: {
        height: 250,
        width: '100%',
        backgroundColor: colors.blue,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        position: "absolute"
    },
    header: {
        width: '100%',
        paddingHorizontal: rw(20),
        height: 64,
        justifyContent: 'space-between',
    },
    row: {
        flexDirection: "row",
        alignItems: 'center',
    },
    button: {
        gap: 10
    },
    applyLeaveButton: {
        height: 28,
        paddingHorizontal: 9,
        borderRadius: 14,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    helloName: {
        paddingHorizontal: 20
    },
    graphView: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingBottom: 10,
        paddingTop: 21,
        marginTop: 20,
        borderRadius: 8,
        shadowOffset: { width: 4, height: 5 },
        shadowColor: Platform.OS == "ios" ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.1)',
        shadowOpacity: 1,
        shadowRadius: 5,
        elevation: 8,
    },
    mainContainer: {
        paddingHorizontal: 20,
        marginTop: 20
    },
    UserBox: {
        width: SCREEN_WIDTH / 3.5,
        height: 36,
        borderRadius: 4,
        backgroundColor: colors.offWHite,
        paddingHorizontal: 12,
    },
    chatButton:{
        borderRadius:100,
        height:45,
        flexDirection:'row',
        alignItems:'center',
        gap:10,
        justifyContent:'center',
        width:'48%',
        marginBottom:20

    },
    topOptionView:{
        // backgroundColor:'white',
        // marginTop: rw(10),
    },
    attandence:{
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        width:'90%',
        borderRadius: 8,
        backgroundColor: colors.blue,
        alignSelf: 'center',
        marginTop: 10
    },
    profileView:{
        // paddingTop: 30,
        // paddingBottom: 36,
        // paddingHorizontal: 20
    },
    itemVIew:{
        height: 54,
        width: '100%',
        paddingHorizontal: 20,
        gap: 18
    },
    todayContainer:{
        backgroundColor:'#e8eaf2',
        borderRadius:40,
        paddingHorizontal:8,
        paddingVertical:2
    },
    performanceTabs: {
        flexDirection: 'row',
        backgroundColor: '#e8eaf2',
        borderRadius: 12,
        padding: 4,
        marginTop: 12,
    },
    performanceTab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 9,
    },
    performanceTabActive: {
        backgroundColor: colors.blue,
    },
});
