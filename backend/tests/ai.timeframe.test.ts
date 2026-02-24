import assert from "node:assert/strict";
import { test } from "node:test";
import { getDateRange } from "../src/services/ai/mongoAgentTools.service";

test("last_week timeframe resolves to the previous 7-day week window", async () => {
  const thisWeek = await getDateRange("week");
  const lastWeek = await getDateRange("last_week");

  const oneDayMs = 24 * 60 * 60 * 1000;
  const oneWeekMs = 7 * oneDayMs;

  assert.equal(thisWeek.start.getTime() - lastWeek.start.getTime(), oneWeekMs);
  assert.equal(thisWeek.start.getTime() - lastWeek.end.getTime(), 1);
});
