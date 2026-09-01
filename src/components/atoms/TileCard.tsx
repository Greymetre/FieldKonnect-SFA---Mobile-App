import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import AppText from "../AppText/AppText";
import { colors } from "../../utils/Colors";
import { useNavigation } from "@react-navigation/native";

const TileCard = ({ item, onpress }: any) => {
    const navigation = useNavigation<any>();
    return (
        <LinearGradient
            colors={["#3895D3", "#FFFFFF"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.border}>
            <Pressable
                onPress={() => {
                    onpress(item)
                    // navigation.navigate(item?.navigateTo)
                }}
                style={[
                    styles.inner,
                    { backgroundColor: item.bgColor,paddingTop:14 }]}>
                <AppText
                    size={14}
                    color={colors.white}
                    horizontal={14}
                    family="InterSemiBold">
                    {item.title}
                </AppText>
                <View style={styles.iconView}>
                    {item.icon}
                </View>
            </Pressable>

        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    border: {
        width: "31%",
        borderRadius: 6,
        padding: 1,
        // marginBottom: 12,
    },

    inner: {
        flex: 1,
        borderRadius: 6,
        justifyContent: "flex-start",
    },
    iconView: {
        flex: 1, 
        justifyContent: 'flex-end', 
        alignItems: 'flex-end',
        marginTop:10
    }
});

export default TileCard;
