import { StyleSheet } from "react-native";
import { colors } from "../../utils/Colors";
import { SCREEN_HEIGHT } from "../../utils/misc";
import { rw } from "../../utils/responsive";
import { fonts } from "../../utils/typography";

export const styles = StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: colors.blue
    },
    logoView:{
        height: SCREEN_HEIGHT * 0.35
    },
    subContainer:{
        flex: 1,
        backgroundColor: colors.white,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingTop: 46
    },
    logo:{
        height: 55,
        marginTop: 58,
        width: "100%",
    },
    dukeLogo:{
        width: 80,
        height: 49,
        marginTop: 28,
    },
    center:{
        justifyContent:"center",
        alignItems: 'center',
    },
    inputCollectionView:{
        marginTop: 32,
        paddingHorizontal: rw(30),
        gap: 4
    },
    input:{
        height: 49,
        width: "100%",
        borderWidth: 1,
        borderColor: "#CBD5E0",
        paddingHorizontal: rw(15),
        borderRadius: 4,
        fontFamily: fonts.InterMedium,
        fontSize: 16,
        color: colors.black
    },
    buttonView:{
        backgroundColor: colors.blue,
        width:'100%',
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
        marginTop: 10
    },
});
