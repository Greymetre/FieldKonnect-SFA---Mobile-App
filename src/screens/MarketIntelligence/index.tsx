import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { ArrowDownIcon } from '../../assets/svgs/SvgsFile';
import { styles } from './styles';
import AppText from '../../components/AppText/AppText';
import { rw } from '../../utils/responsive';
import { UploadIcon } from '../../assets/svgs/HomePageSvgs';

const MarketIntelligenceScreen = () => {
    return (
        <View style={styles.container}>
            <ScrollView style={[styles.container, { paddingHorizontal: rw(19) }]} >
                <View style={[styles.selectUser, styles.row]}>
                    <View style={styles.placeholer}>
                        <AppText size={14} color='#718096' family='InterRegular'>Select State</AppText>
                    </View>
                    <ArrowDownIcon />
                </View>
                <View style={styles.sectionContent}>
                    <AppText size={16} color='#000000' family='InterSemiBold' horizontal={6}>Attachments</AppText>
                    <View style={[styles.uploadBox]}>
                        <UploadIcon />
                        <AppText size={13} color={'#64748B'} family="InterMedium" >
                            Upload Image
                        </AppText>
                    </View>
                </View>
                <Pressable style={styles.buttonView} >
                    <AppText color='white' family='InterBold' size={16}>SUBMIT</AppText>
                </Pressable>
            </ScrollView>
        </View>
    );
}


export default MarketIntelligenceScreen;
