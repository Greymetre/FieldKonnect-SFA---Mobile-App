import { Platform, StyleSheet } from "react-native";
import { colors } from "../../utils/Colors";
import { rw } from "../../utils/responsive";
import { fonts } from "../../utils/typography";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: rw(16),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: rw(20),
    paddingBottom: rw(120),
    paddingTop: 25,
  },
  sectionWrapper: {
    marginVertical: rw(4),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginBottom: rw(30),
  },
  sectionContent: {
    backgroundColor: '#fff',
    paddingHorizontal: rw(10),
    paddingVertical: rw(10),
    marginTop: rw(4),
    borderRadius: 8,
    shadowOffset: { width: 4, height: 5 },
    shadowColor: Platform.OS == "ios" ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.1)',
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 8,
  },
  inputWrapper: {
    marginBottom: rw(16),
  },
  selectUser: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(203, 213, 224, 1)",
    backgroundColor: 'rgba(57, 82, 153, 0.07)',
    height: 52,
    marginTop: 12,
    paddingHorizontal: 14
  },
  row: {
    flexDirection: "row",
    alignItems: 'center',
  },
  placeholer: {
    flex: 1
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: colors.black,
    fontFamily: fonts.InterRegular
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: rw(8),
    backgroundColor: '#39C04E',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    paddingHorizontal: 10
  },
  toggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rw(8),
  },
  uploadBox: {
    height: 95,
    borderWidth: 2,
    borderColor: 'rgba(57, 82, 153, 1)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(57, 82, 153, 0.1)',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: rw(8),
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
  attandence: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    width: '48%',
    borderRadius: 8,
    backgroundColor: colors.blue,
    alignSelf: 'center',
    marginTop: 10
  },
})