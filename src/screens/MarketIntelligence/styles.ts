import { Platform, StyleSheet } from "react-native";
import { colors } from "../../utils/Colors";
import { rw } from "../../utils/responsive";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgColor
    },
    selectUser: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(203, 213, 224, 1)",
        backgroundColor: 'rgba(57, 82, 153, 0.07)',
        height: 48,
        marginVertical: 18,
        paddingHorizontal: 14
    },
    row: {
        flexDirection: "row",
        alignItems: 'center',
    },
    placeholer: {
        flex: 1
    },
    sectionContent: {
        backgroundColor: '#fff',
        paddingHorizontal: rw(12),
        paddingVertical: rw(14),
        marginTop: rw(4),
        borderRadius: 8,
        shadowOffset: { width: 4, height: 5 },
        shadowColor: Platform.OS == "ios" ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.1)',
        shadowOpacity: 1,
        shadowRadius: 5,
        elevation: 8,
    },
    uploadBox: {
        height: 95,
        width: '100%',
        borderWidth: 2,
        borderColor: 'rgba(57, 82, 153, 1)',
        borderStyle: 'dashed',
        backgroundColor: 'rgba(57, 82, 153, 0.1)',
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: rw(14),
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
})