import { StyleSheet } from "react-native";
import { colors } from "../../utils/Colors";
import { rw } from "../../utils/responsive";
import { fonts } from "../../utils/typography";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor:'#F2F2F4'
    },
    row: {
        flexDirection: "row",
        alignItems: "center"
    },
     center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: rw(100)
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
    textInputMainView: {
        backgroundColor: colors.blue,
        padding: rw(2),
        marginTop: rw(20),
        alignItems: "center",
        paddingVertical: rw(1.2),
        paddingHorizontal: rw(10),
        borderRadius: 8,
        flexDirection: "row",
        height: 45,
    },
    listContainer: {
        paddingVertical: rw(12),
    },
    textInput: {
        marginHorizontal: rw(6),
        paddingVertical: 0,
        flex: 1,
        fontSize: 16,
        fontFamily: fonts.InterRegular,
        color: colors.white,
    },
    icon:{
        
    },
});