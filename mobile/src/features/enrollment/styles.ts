import { StyleSheet } from "react-native";

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
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    color: "#111827",
  },
  textInputFocused: {
    borderColor: "#0D9488",
    backgroundColor: "#F0FDFA",
    color: "#111827",
  },
  textInputReadOnly: {
    borderColor: "#99F6E4",
    backgroundColor: "#F0FDFA",
    color: "#134E4A",
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
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },
  footerBtnPrimaryIdle: {
    backgroundColor: "#0D9488",
  },
  footerBtnPrimaryDisabled: {
    backgroundColor: "#5EEAD4",
  },
});
