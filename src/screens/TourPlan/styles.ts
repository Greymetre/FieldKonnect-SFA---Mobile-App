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

        paddingHorizontal: 14
    },
    innerContainer: {
        padding: 12,
        borderBottomWidth: 1,
        borderColor: '#F2F2F2',
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    row: {
        flexDirection: "row",
        alignItems: 'center',
    },
    placeholer: {
        flex: 1
    },
    listItem: {
        height: 52,
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
        overflow: 'hidden',
        flex: 1
    },
    iconView: {
        borderColor: colors.blue,
        height: 32,
        width: 32, borderRadius: 32,
        borderWidth: 1
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    creatText: {
        paddingHorizontal: rw(20)
    },
    boxView: {
        paddingHorizontal: rw(4),
        marginTop: 8,
        flex: 1,
        width: '100%'
    },
    heading: {
        flex: 0.34,
        height: 36,
        backgroundColor: colors.blue,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heading1: {
        flex: 0.34,
        height: 44,
        backgroundColor: 'rgba(57, 82, 153, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomColor: colors.blue,
        borderBottomWidth: 1,
    },
    innerView: {
        flex: 1,
        width: '100%',
        paddingHorizontal: rw(4),


    },
    createPlanView: {
        marginTop: 16,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: rw(20),
        justifyContent: 'space-between',
    },
    newPlanView: {
        gap: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButton: {
        height: 44,
        paddingHorizontal: 44,
        borderRadius: 6,
        backgroundColor: colors.blue
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
    clearAllButton: {
        borderColor: '#EF4444',
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 6,
        backgroundColor: 'white',
    },
    statusChipRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: -8,
        marginBottom: 12,
    },
    statusChip: {
        flex: 1,
        minHeight: 38,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#d8dcec',
        backgroundColor: 'white',
    },
    approveStatusChip: {
        borderColor: '#339D4F',
        backgroundColor: '#339D4F18',
    },
    pendingStatusChip: {
        borderColor: '#E78422',
        backgroundColor: '#E7842218',
    },
    rejectStatusChip: {
        borderColor: '#D31111',
        backgroundColor: '#D3111118',
    },

    designationChip: {
        backgroundColor: colors.blue + '20',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    designationModal: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '70%',
    },
    modalTitle: {
        marginBottom: 15,
    },
    designationOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    designationCheckbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#ccc',
        backgroundColor: 'transparent',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    designationCheckboxSelected: {
        borderColor: colors.blue,
        backgroundColor: colors.blue,
    },
    emptyDesignationText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#718096',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        backgroundColor: '#f1f1f1',
        alignItems: 'center',
    },
    applyButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        backgroundColor: colors.blue,
        alignItems: 'center',
    },
    listContainer: {
        position: 'absolute',
        width: '100%',
        backgroundColor: colors.white,
        borderRadius: 10,
        maxHeight: 300,
        overflow: 'hidden',
        zIndex:999,
        top:100,
        left:20
    },

});
