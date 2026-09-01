import { Platform, StyleSheet } from "react-native";
import { colors } from "../../utils/Colors";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgColor
    },
    row: {
        flexDirection: "row",
        alignItems: "center"
    },
    UserBox: {
        flex: 1,
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
        flex: 1

    },
    dateTimeBox2: {
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
        height: 61,
        width: "100%",
        backgroundColor: "white",
        paddingHorizontal: 10,
        shadowOffset: { width: 4, height: 5 },
        shadowColor: Platform.OS == "ios" ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.1)',
        shadowOpacity: 1,
        shadowRadius: 5,
        elevation: 8,
        marginBottom: 10,
        borderRadius: 10,
        overflow: "hidden",
        flex: 1
    },
    iconView: {
        borderColor: colors.blue,
        height: 32,
        width: 32, borderRadius: 32,
        borderWidth: 1
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
    individualContent: {
        flex: 1,
        marginTop: 20,
        paddingHorizontal: 20,
    },
    activityCardsContainer: {
        flex: 1,
    },
    activityCardsContent: {
        paddingBottom: 70,
    },
    reportingManagerText: {
        marginTop: 4,
    },
    clearAllButton: {
        borderColor: '#EF4444',
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 6,
        backgroundColor: 'white',
    },
})
