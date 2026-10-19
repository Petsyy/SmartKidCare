import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { API_BASE } from "@/api/config";
import { useAdminLoginStore } from "@/stores/admin-login.store";
import { renderWithAppProviders } from "@/test/render";
import AdminLogin from "./AdminLogin";

vi.mock("@/components/auth/useAuthSession", () => ({
  useAuthSession: () => ({
    isChecking: false,
    isAuthenticated: false,
    user: null,
    authCheckError: null,
    retryAuthCheck: vi.fn(),
  }),
}));

vi.mock("@/context/SystemSettingsContext", () => ({
  useSystemSettings: () => ({
    settings: { schoolName: "Test KidCare" },
    loading: false,
    refreshSettings: vi.fn(),
  }),
}));

const renderLogin = () =>
  renderWithAppProviders(
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/monitoring/dashboard" element={<h1>Dashboard</h1>} />
    </Routes>,
    { initialRoute: "/login" },
  );

const jsonResponse = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("AdminLogin", () => {
  beforeEach(() => {
    useAdminLoginStore.getState().resetLoginFlow();
    vi.unstubAllGlobals();
  });

  it("should render the branded credential form", () => {
    renderLogin();

    expect(screen.getByText("Test KidCare")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your username or email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your password")).toHaveAttribute(
      "type",
      "password",
    );
    expect(screen.getByRole("button", { name: "Sign In" })).toBeEnabled();
  });

  it("should show validation errors without calling the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Username or email is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("should submit valid credentials and open the dashboard", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderLogin();

    await user.type(
      screen.getByPlaceholderText("Enter your username or email"),
      "captain@example.com",
    );
    await user.type(screen.getByPlaceholderText("Enter your password"), "Secret123!");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE}/auth/admin/login`,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          username: "captain@example.com",
          password: "Secret123!",
        }),
      }),
    );
  });

  it("should display an API login error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ message: "Invalid credentials" }, 401)),
    );
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText("Enter your username or email"), "captain");
    await user.type(screen.getByPlaceholderText("Enter your password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Dashboard" })).not.toBeInTheDocument();
  });

  it("should disable submission while login is pending", async () => {
    let resolveLogin!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        () => new Promise<Response>((resolve) => {
          resolveLogin = resolve;
        }),
      ),
    );
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText("Enter your username or email"), "captain");
    await user.type(screen.getByPlaceholderText("Enter your password"), "Secret123!");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByRole("button", { name: /Signing in/i })).toBeDisabled();

    resolveLogin(jsonResponse({ success: true }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    });
  });

  it("should render password setup fields when setup is required", () => {
    useAdminLoginStore.getState().setPasswordSetupToken("setup-token");

    renderLogin();

    expect(screen.getByRole("heading", { name: "Create Your Password" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Create a new password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Confirm your new password")).toBeInTheDocument();
    expect(screen.getAllByLabelText(/OTP digit/)).toHaveLength(6);
    expect(screen.getByRole("button", { name: "Set Password & Continue" })).toBeEnabled();
  });
});
