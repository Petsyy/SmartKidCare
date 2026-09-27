import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import bcrypt from "bcryptjs";
import User from "../src/models/Users";
import {
  CAPTAIN_PASSWORD_SETUP_PURPOSE,
  buildPasswordSetupToken,
  hashOtp,
  signAuthToken,
} from "../src/modules/auth/services/password-otp.service";
import { completeCaptainPasswordSetup } from "../src/modules/auth/controllers/password-otp.controller";
import { authenticateToken } from "../src/shared/middleware/auth.middleware";

type MockResponse = {
  statusCode: number;
  body: any;
  cookies: Array<{ name: string; value: string }>;
  status: (code: number) => MockResponse;
  json: (body: any) => MockResponse;
  cookie: (name: string, value: string) => MockResponse;
};

const createResponse = (): MockResponse => {
  const response: MockResponse = {
    statusCode: 200,
    body: null,
    cookies: [],
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    cookie(name, value) {
      this.cookies.push({ name, value });
      return this;
    },
  };
  return response;
};

const createCaptain = async (overrides: Record<string, unknown> = {}) => {
  const captain: any = {
    _id: "507f1f77bcf86cd799439011",
    role: "barangay_captain",
    isActive: true,
    mustChangePassword: true,
    password: await bcrypt.hash("Temporary123!", 4),
    passwordResetOtpPurpose: CAPTAIN_PASSWORD_SETUP_PURPOSE,
    passwordResetOtpHash: hashOtp("123456"),
    passwordResetOtpExpiresAt: new Date(Date.now() + 60_000),
    latestTempPassword: "Temporary123!",
    latestTempPasswordIssuedAt: new Date(),
    saveCount: 0,
    async save() {
      this.saveCount += 1;
      return this;
    },
    toObject() {
      return { ...this, save: undefined, toObject: undefined };
    },
    ...overrides,
  };
  return captain;
};

describe("captain first-login password setup", () => {
  const originalFindById = User.findById;

  beforeEach(() => {
    process.env.JWT_SECRET = "captain-password-setup-test-secret";
    process.env.OTP_SECRET = "captain-password-setup-test-otp-secret";
  });

  afterEach(() => {
    (User as any).findById = originalFindById;
  });

  it("creates a normal session after valid OTP and password setup", async () => {
    const captain = await createCaptain();
    (User as any).findById = async () => captain;
    const token = buildPasswordSetupToken(
      String(captain._id),
      CAPTAIN_PASSWORD_SETUP_PURPOSE,
    );
    const response = createResponse();

    await completeCaptainPasswordSetup(
      { body: { passwordSetupToken: token, newPassword: "Private123!", confirmPassword: "Private123!", otp: "123456" } } as any,
      response as any,
    );

    assert.equal(response.statusCode, 200);
    assert.equal(captain.mustChangePassword, false);
    assert.equal(captain.passwordResetOtpHash, undefined);
    assert.equal(captain.latestTempPassword, undefined);
    assert.equal(await bcrypt.compare("Private123!", captain.password), true);
    assert.equal(response.cookies.some((cookie) => cookie.name === "authToken"), true);
    assert.equal(response.body.user.password, undefined);
  });

  it("rejects an invalid or wrong-purpose setup token", async () => {
    const captain = await createCaptain();
    (User as any).findById = async () => captain;
    const response = createResponse();

    await completeCaptainPasswordSetup(
      { body: { passwordSetupToken: "invalid", newPassword: "Private123!", confirmPassword: "Private123!", otp: "123456" } } as any,
      response as any,
    );

    assert.equal(response.statusCode, 401);
    assert.equal(response.body.code, "PASSWORD_SETUP_TOKEN_INVALID");
    assert.equal(captain.saveCount, 0);
  });

  it("rejects an invalid OTP without changing the password", async () => {
    const captain = await createCaptain();
    const originalPassword = captain.password;
    (User as any).findById = async () => captain;
    const token = buildPasswordSetupToken(String(captain._id), CAPTAIN_PASSWORD_SETUP_PURPOSE);
    const response = createResponse();

    await completeCaptainPasswordSetup(
      { body: { passwordSetupToken: token, newPassword: "Private123!", confirmPassword: "Private123!", otp: "654321" } } as any,
      response as any,
    );

    assert.equal(response.statusCode, 400);
    assert.equal(response.body.message, "Invalid OTP.");
    assert.equal(captain.password, originalPassword);
    assert.equal(captain.mustChangePassword, true);
  });

  it("clears an expired OTP and requires a new code", async () => {
    const captain = await createCaptain({
      passwordResetOtpExpiresAt: new Date(Date.now() - 1_000),
    });
    (User as any).findById = async () => captain;
    const token = buildPasswordSetupToken(String(captain._id), CAPTAIN_PASSWORD_SETUP_PURPOSE);
    const response = createResponse();

    await completeCaptainPasswordSetup(
      { body: { passwordSetupToken: token, newPassword: "Private123!", confirmPassword: "Private123!", otp: "123456" } } as any,
      response as any,
    );

    assert.equal(response.statusCode, 400);
    assert.equal(response.body.code, "PASSWORD_SETUP_OTP_EXPIRED");
    assert.equal(captain.passwordResetOtpHash, undefined);
    assert.equal(captain.saveCount, 1);
  });

  it("rejects reuse of the temporary password", async () => {
    const captain = await createCaptain();
    (User as any).findById = async () => captain;
    const token = buildPasswordSetupToken(String(captain._id), CAPTAIN_PASSWORD_SETUP_PURPOSE);
    const response = createResponse();

    await completeCaptainPasswordSetup(
      { body: { passwordSetupToken: token, newPassword: "Temporary123!", confirmPassword: "Temporary123!", otp: "123456" } } as any,
      response as any,
    );

    assert.equal(response.statusCode, 400);
    assert.match(response.body.message, /different from the temporary password/i);
    assert.equal(captain.mustChangePassword, true);
  });

  it("rejects replay after password setup is already complete", async () => {
    const captain = await createCaptain({ mustChangePassword: false });
    (User as any).findById = async () => captain;
    const token = buildPasswordSetupToken(String(captain._id), CAPTAIN_PASSWORD_SETUP_PURPOSE);
    const response = createResponse();

    await completeCaptainPasswordSetup(
      { body: { passwordSetupToken: token, newPassword: "Private123!", confirmPassword: "Private123!", otp: "123456" } } as any,
      response as any,
    );

    assert.equal(response.statusCode, 401);
    assert.equal(response.body.code, "PASSWORD_SETUP_TOKEN_INVALID");
  });

  it("blocks a pending captain from protected APIs even with a valid auth cookie", async () => {
    const captain = await createCaptain();
    (User as any).findById = () => ({
      select: () => ({
        lean: async () => ({
          _id: captain._id,
          role: captain.role,
          daycareCenter: "507f1f77bcf86cd799439012",
          isActive: true,
          mustChangePassword: true,
        }),
      }),
    });
    const response = createResponse();
    let nextCalled = false;

    await authenticateToken(
      {
        method: "GET",
        path: "/admin/system-overview",
        headers: {},
        cookies: { authToken: signAuthToken(String(captain._id), captain.role) },
        get: () => undefined,
      } as any,
      response as any,
      (() => { nextCalled = true; }) as any,
    );

    assert.equal(response.statusCode, 403);
    assert.equal(response.body.code, "PASSWORD_CHANGE_REQUIRED");
    assert.equal(nextCalled, false);
  });
});
