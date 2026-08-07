import { StyleSheet } from "react-native";
import { ENROLL_COLORS } from "../constants";

export const enrollFieldStyles = StyleSheet.create({
  inputContainer: {
    marginBottom: 16,
  },
  inputHalf: {
    flex: 1,
  },
  textInput: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textInputEditable: {
    borderColor: ENROLL_COLORS.neutralBorder,
    backgroundColor: ENROLL_COLORS.white,
    color: "#111827",
  },
  textInputFocused: {
    borderColor: ENROLL_COLORS.primary,
    backgroundColor: ENROLL_COLORS.primaryBg,
    color: "#111827",
  },
  textInputReadOnly: {
    borderColor: ENROLL_COLORS.primaryBorder,
    backgroundColor: ENROLL_COLORS.primaryBg,
    color: "#134E4A",
  },
  textInputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  assignedCenterContainer: {
    justifyContent: "center",
  },
  programOptionCard: {
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  programOptionCardSelected: {
    borderColor: ENROLL_COLORS.primary,
    backgroundColor: ENROLL_COLORS.primaryBg,
  },
  programOptionCardUnselected: {
    borderColor: "#E5E7EB",
    backgroundColor: ENROLL_COLORS.white,
  },
  programOptionCardError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  programOptionRadio: {
    height: 20,
    width: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 2,
  },
  programOptionRadioSelected: {
    borderColor: ENROLL_COLORS.primary,
  },
  programOptionRadioUnselected: {
    borderColor: ENROLL_COLORS.neutralBorder,
  },
  programOptionText: {
    fontSize: 15,
  },
  programOptionTextSelected: {
    fontWeight: "700",
    color: "#0F766E",
  },
  programOptionTextUnselected: {
    fontWeight: "500",
    color: ENROLL_COLORS.neutralText,
  },
  footerBtn: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  footerBtnSecondary: {
    borderWidth: 1,
    borderColor: ENROLL_COLORS.neutralBorder,
    backgroundColor: ENROLL_COLORS.white,
  },
  footerBtnPrimaryIdle: {
    backgroundColor: ENROLL_COLORS.primary,
  },
  footerBtnPrimaryDisabled: {
    backgroundColor: "#5EEAD4",
  },
});
