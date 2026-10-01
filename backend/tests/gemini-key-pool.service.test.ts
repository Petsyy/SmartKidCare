import test from "node:test";
import assert from "node:assert/strict";
import { executeWithGeminiKeyPool, resetGeminiKeyPoolForTests } from "../src/modules/ai/services/core/gemini.service";

test("uses the primary key when it succeeds", async () => {
  resetGeminiKeyPoolForTests();
  const attempted: string[] = [];
  const result = await executeWithGeminiKeyPool(async (key) => { attempted.push(key); return "ok"; }, { keys: ["primary", "secondary"] });
  assert.equal(result, "ok");
  assert.deepEqual(attempted, ["primary"]);
});

test("fails over once when the primary key is quota limited", async () => {
  resetGeminiKeyPoolForTests();
  const attempted: string[] = [];
  const result = await executeWithGeminiKeyPool(async (key) => {
    attempted.push(key);
    if (key === "primary") throw Object.assign(new Error("quota"), { status: 429 });
    return "secondary-result";
  }, { keys: ["primary", "secondary"] });
  assert.equal(result, "secondary-result");
  assert.deepEqual(attempted, ["primary", "secondary"]);
});

test("skips a cooling key on the next request", async () => {
  resetGeminiKeyPoolForTests();
  let now = 1_000;
  await executeWithGeminiKeyPool(async (key) => {
    if (key === "primary") throw Object.assign(new Error("quota"), { status: 429 });
    return "ok";
  }, { keys: ["primary", "secondary"], now: () => now });
  const attempted: string[] = [];
  await executeWithGeminiKeyPool(async (key) => { attempted.push(key); return "ok"; }, { keys: ["primary", "secondary"], now: () => now });
  assert.deepEqual(attempted, ["secondary"]);
});

test("does not rotate on non-retryable application errors", async () => {
  resetGeminiKeyPoolForTests();
  const attempted: string[] = [];
  await assert.rejects(() => executeWithGeminiKeyPool(async (key) => {
    attempted.push(key);
    throw Object.assign(new Error("bad request"), { status: 400 });
  }, { keys: ["primary", "secondary"] }));
  assert.deepEqual(attempted, ["primary"]);
});

test("rotates away from an invalid API key without exposing it", async () => {
  resetGeminiKeyPoolForTests();
  const secret = "super-secret-invalid-key";
  const result = await executeWithGeminiKeyPool(async (key) => {
    if (key === secret) throw Object.assign(new Error("API key invalid"), { status: 400 });
    return "ok";
  }, { keys: [secret, "valid-key"] });
  assert.equal(result, "ok");
});
