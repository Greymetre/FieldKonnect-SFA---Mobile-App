import { Platform, StyleSheet } from "react-native";
import { colors } from "../../utils/Colors";
import { shadowStyle } from "../../utils/typography";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgColor
    },
    activityView: {
        backgroundColor: 'white',
        paddingHorizontal: 10,
        paddingVertical: 11,
        borderRadius: 8,
        shadowOffset: { width: 4, height: 5 },
        shadowColor: Platform.OS == "ios" ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.1)',
        shadowOpacity: 1,
        shadowRadius: 5,
        elevation: 2,
        flexDirection:"row",
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14
    },
    eywView:{
        justifyContent: 'center',
        alignItems: 'center',
        height: 30,
        width: 30,
        borderRadius: 30,
        borderWidth: 1,
        borderColor:'#CBD5E0'
    },
});