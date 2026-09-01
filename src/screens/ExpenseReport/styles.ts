import { StyleSheet } from "react-native";
import { colors } from "../../utils/Colors";
import { rw } from "../../utils/responsive";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.offWHite
    },
    row: {
        flexDirection: "row",
        alignItems: "center"
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
    dateTimeBox: {
        height: 48,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(203, 213, 224, 1)",
        backgroundColor: "rgba(57, 82, 153, 0.07)",
        paddingHorizontal: 14,
        flex: 1

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
    approveSubmitBox: {
        marginVertical: 15,
        height: 74,
        borderRadius: 10,
        backgroundColor: 'white',
        paddingHorizontal: 10,
        justifyContent: 'space-between',
    },
    approveView: {
        gap: 10
    },
    fab: {
        position: 'absolute',
        bottom: 40,
        right: 20,
        height: 60,
        width: 60,
        borderRadius: 30,
        backgroundColor: colors.blue,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
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
        overflow:'hidden'
    },
    todayContainer: {
        marginTop: rw(16),
    },
    todayInput: {
        height: rw(45),
        borderWidth: 1,
        borderColor: '#CBD5E0',
        borderRadius: rw(8),
        paddingHorizontal: rw(12),
        marginTop: rw(12),
        backgroundColor: '#FFFFFF',
        textAlignVertical: 'top',
    },
    submit: {
        paddingHorizontal: 15,
        height: 34,
        borderRadius: 6,
        backgroundColor: colors.blue,
    },
    listItem: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10
    },
    line: {
        width: "100%",
        height: 1,
        backgroundColor: "#D9D9D9",
        marginVertical: 16
    },
    firstPunchIN: {
        flex: 0.32,
        gap: 8
    },
    modalcontainer: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        flex: 1
    },
    modalheader: {
        height: 61,
        backgroundColor: colors.blue,
        width: "100%",
        overflow: 'hidden',
        zIndex: 10,
        marginTop: -14,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        justifyContent: 'center',
        paddingHorizontal: 20

    },
    mainOCntainer: {
        width: "86%",
        paddingTop: 20,
        paddingHorizontal: 20,
        backgroundColor: colors.white
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
    firstViewModal: {
        flex: 0.55,
        gap: 4
    },
    approveRejectView: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 28,
        marginBottom: 20
    },
    selectUser: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(203, 213, 224, 1)",
        backgroundColor: 'rgba(57, 82, 153, 0.07)',
        height: 48,
        marginTop: 12,
        paddingHorizontal: 14
    },
    done:{
        backgroundColor: colors.blue,
        paddingHorizontal: 6,
        height: 45,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modeChip: {
        flex: 1,
        height: 42,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.blue,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.white,
    },
    modeChipActive: {
        backgroundColor: colors.blue,
    },
    detailCard: {
        backgroundColor: colors.white,
        borderRadius: 10,
        padding: 15,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 12,
    },
    detailCell: {
        width: '50%',
        gap: 5,
        paddingRight: 12,
    },
    detailHeroCard: {
        backgroundColor: colors.white,
        borderRadius: 18,
        padding: 18,
        marginBottom: 14,
    },
    detailHeroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
    },
    detailTitleBlock: {
        flex: 1,
        gap: 4,
    },
    detailGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: 18,
    },
    detailSectionTitle: {
        marginBottom: 14,
    },
    detailHelpText: {
        marginTop: 14,
        lineHeight: 20,
    },
    detailReasonBlock: {
        marginTop: 16,
    },
    expenseEditRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 10,
    },
    expenseEditButton: {
        height: 36,
        paddingHorizontal: 16,
        borderRadius: 18,
        backgroundColor: '#ECEEF5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailAttachmentRow: {
        minHeight: 44,
        borderBottomWidth: 1,
        borderBottomColor: '#EDF2F7',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    attachmentPreviewModal: {
        flex: 1,
        backgroundColor: '#080A10',
    },
    attachmentPreviewHeader: {
        minHeight: 68,
        paddingHorizontal: 16,
        paddingBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#111522',
        zIndex: 2,
    },
    attachmentPreviewTitle: {
        flex: 1,
    },
    attachmentPreviewClose: {
        height: 42,
        width: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    attachmentPreviewContent: {
        flex: 1,
        position: 'relative',
    },
    attachmentImageGallery: {
        flex: 1,
    },
    attachmentPdf: {
        flex: 1,
        width: '100%',
        backgroundColor: '#D7D9DF',
    },
    attachmentPreviewLoader: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
        backgroundColor: 'rgba(8,10,16,0.72)',
    },
    approvalDecisionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    approvalChoiceRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 28,
        marginTop: 8,
        marginBottom: 22,
    },
    approvalChoice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    approvalRadio: {
        height: 28,
        width: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#168AAD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    approvalRadioApprove: {
        borderColor: '#168AAD',
    },
    approvalRadioReject: {
        borderColor: '#D93025',
    },
    approvalRadioRejectActive: {
        borderColor: '#D93025',
    },
    approvalRadioDot: {
        height: 14,
        width: 14,
        borderRadius: 7,
        backgroundColor: '#168AAD',
    },
    approvalRadioRejectDot: {
        backgroundColor: '#D93025',
    },
    approveAmountLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    approvalAmountInput: {
        height: 48,
        borderWidth: 1,
        borderColor: '#CBD5E0',
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#F7F8FC',
        color: '#202432',
        fontSize: 16,
    },
    approvalRemarkLabel: {
        marginTop: 14,
        marginBottom: 8,
    },
    textArea: {
        minHeight: 88,
        borderWidth: 1,
        borderColor: '#CBD5E0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingTop: 10,
        backgroundColor: '#FFFFFF',
        color: '#000000',
        textAlignVertical: 'top',
    },
    expenseCard: {
        backgroundColor: colors.white,
        borderRadius: 18,
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 16,
        marginBottom: 14,
    },
    expenseCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
    },
    expenseTitleBlock: {
        flex: 1,
        gap: 4,
    },
    expenseIdBlock: {
        alignItems: 'flex-end',
        gap: 2,
    },
    expenseDivider: {
        height: 1,
        backgroundColor: '#E6E9F0',
        marginTop: 14,
        marginBottom: 16,
    },
    expenseGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: 14,
    },
    expenseInfoCell: {
        width: '33.33%',
        minHeight: 46,
        gap: 4,
        paddingRight: 8,
    },
    expenseActionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 16,
    },
    expenseReasonBox: {
        marginTop: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 5,
        backgroundColor: '#FFF7E8',
    },
    expenseReasonBoxRejected: {
        backgroundColor: '#FDECEC',
    },
    expenseViewButton: {
        minWidth: 96,
        height: 42,
        paddingHorizontal: 18,
        borderRadius: 24,
        backgroundColor: '#ECEEF5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    expenseStatusFilterRow: {
        marginTop: 12,
    },
    expenseStatusFilter: {
        height: 48,
        width: '100%',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(203, 213, 224, 1)',
        backgroundColor: 'rgba(57, 82, 153, 0.07)',
        paddingHorizontal: 14,
    },
    expenseDropdownText: {
        color: colors.black,
        fontSize: 14,
    },
    expenseDateFilter: {
        marginTop: 12,
        width: '100%',
        flex: 0,
        height: 58,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: 14,
        borderColor: '#DDE2EE',
        paddingHorizontal: 14,
    },
    expenseDateTextBlock: {
        flex: 1,
        gap: 4,
        paddingRight: 10,
    },
    expenseDateIconBox: {
        height: 34,
        width: 34,
        borderRadius: 17,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
