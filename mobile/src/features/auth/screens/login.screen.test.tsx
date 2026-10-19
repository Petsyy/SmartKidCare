/* eslint-disable @typescript-eslint/no-require-imports */
import { act, fireEvent, waitFor } from "@testing-library/react-native";
import { login as apiLogin } from "@/src/api/authentication.api";
import { useAuth } from "@/src/hooks/use-auth";
import { getMockSubmit, resetMockSubmit } from "@/src/test/gradient-button.mock";
import { renderWithQueryClient } from "@/src/test/render";
import Login from "./login.screen";

const mockPush = jest.fn();
let mockMutationOverride: { mutateAsync: jest.Mock; isPending: boolean } | null = null;

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    useMutation: (options: { mutationFn: (variables: unknown) => Promise<unknown> }) =>
      mockMutationOverride ?? {
        mutateAsync: options.mutationFn,
        isPending: false,
      },
  };
});

jest.mock("@/src/components/ui", () => ({
  GradientButton: require("@/src/test/gradient-button.mock").MockGradientButton,
  PasswordInput: require("@/src/components/ui/password-input").PasswordInput,
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (callback: () => void | (() => void)) => callback(),
}));

jest.mock("@/src/api/authentication.api", () => ({
  login: jest.fn(),
}));

jest.mock("@/src/hooks/use-auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/src/lib/error-reporting", () => ({
  getUserFriendlyErrorMessage: (_error: unknown, fallback: string) => fallback,
  reportHandledError: jest.fn(),
}));

const mockedApiLogin = jest.mocked(apiLogin);
const mockedUseAuth = jest.mocked(useAuth);
const mockStoreLogin = jest.fn();

describe("Login screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMutationOverride = null;
    resetMockSubmit();
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      role: null,
      loading: false,
      isAuthenticated: false,
      login: mockStoreLogin,
      logout: jest.fn(),
      authState: "signedOut",
      lastOnlineVerifiedAt: null,
      offlineExpiresAt: null,
      lockApp: jest.fn(),
      unlockOffline: jest.fn(),
    });
  });

  it("should render accessible login controls", async () => {
    const view = await renderWithQueryClient(<Login />);

    expect(view.getByRole("header", { name: "SmartKidCare" })).toBeTruthy();
    expect(view.getByLabelText("Email address")).toBeTruthy();
    expect(view.getByLabelText("Password")).toBeTruthy();
    expect(view.getByRole("button", { name: "Sign In" })).toBeTruthy();
  });

  it("should validate required fields without calling the API", async () => {
    const view = await renderWithQueryClient(<Login />);

    await act(async () => {
      await getMockSubmit()?.();
    });

    expect(await view.findByText("Enter your registered email address.")).toBeTruthy();
    expect(view.getByText("Enter your password.")).toBeTruthy();
    expect(mockedApiLogin).not.toHaveBeenCalled();
  });

  it("should authenticate valid credentials", async () => {
    mockedApiLogin.mockResolvedValue({
      token: "auth-token",
      user: {
        _id: "parent-1",
        email: "parent@example.com",
        role: "parent",
        needsToConfirmLink: false,
      },
    });
    const view = await renderWithQueryClient(<Login />);

    await fireEvent.changeText(view.getByLabelText("Email address"), " parent@example.com ");
    await fireEvent.changeText(view.getByLabelText("Password"), "Secret123!");
    await act(async () => {
      await getMockSubmit()?.();
    });

    await waitFor(() => {
      expect(mockedApiLogin).toHaveBeenCalledWith({
        identifier: "parent@example.com",
        password: "Secret123!",
      });
      expect(mockStoreLogin).toHaveBeenCalledWith(
        {
          id: "parent-1",
          email: "parent@example.com",
          role: "parent",
          needsToConfirmLink: false,
        },
        "auth-token",
      );
    });
  });

  it("should display a safe message when login fails", async () => {
    mockedApiLogin.mockRejectedValue(new Error("private server detail"));
    const view = await renderWithQueryClient(<Login />);

    await fireEvent.changeText(view.getByLabelText("Email address"), "parent@example.com");
    await fireEvent.changeText(view.getByLabelText("Password"), "wrong-password");
    await act(async () => {
      await getMockSubmit()?.();
    });

    expect(
      await view.findByText("Login failed. Check your credentials and try again."),
    ).toBeTruthy();
    expect(mockStoreLogin).not.toHaveBeenCalled();
  });

  it("should show a disabled loading button while login is pending", async () => {
    mockMutationOverride = {
      mutateAsync: jest.fn(),
      isPending: true,
    };
    const view = await renderWithQueryClient(<Login />);

    const pendingButton = view.getByRole("button", { name: "Signing In..." });
    expect(pendingButton.props.accessibilityState).toEqual({
      disabled: true,
      busy: true,
    });
  });

  it("should toggle password visibility", async () => {
    const view = await renderWithQueryClient(<Login />);
    const passwordInput = view.getByLabelText("Password");

    expect(passwordInput.props.secureTextEntry).toBe(true);
    await fireEvent.press(view.getByRole("button", { name: "Show password" }));

    expect(view.getByLabelText("Password").props.secureTextEntry).toBe(false);
    expect(view.getByRole("button", { name: "Hide password" })).toBeTruthy();
  });

  it("should route password-change challenges to OTP verification", async () => {
    mockedApiLogin.mockResolvedValue({
      requiresPasswordChange: true,
      email: "teacher@example.com",
      requiresOtp: true,
    });
    const view = await renderWithQueryClient(<Login />);

    await fireEvent.changeText(view.getByLabelText("Email address"), "teacher@example.com");
    await fireEvent.changeText(view.getByLabelText("Password"), "Temporary1!");
    await act(async () => {
      await getMockSubmit()?.();
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/(auth)/verify-otp",
        params: { email: "teacher@example.com" },
      });
    });
  });
});
