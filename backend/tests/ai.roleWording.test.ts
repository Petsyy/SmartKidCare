import assert from "node:assert/strict";
import { test } from "node:test";
import {
  composeAttendanceReply,
  composeChildReportReply,
  composeFeedingReply,
} from "../src/services/ai/nlg.service";
import {
  GenerateChildReportResult,
  SummarizeAttendanceResult,
  SummarizeFeedingResult,
} from "../src/services/ai/mongoAgentTools.service";

function attendanceResult(
  overrides: Partial<SummarizeAttendanceResult>,
): SummarizeAttendanceResult {
  return {
    tool: "summarize_attendance",
    timeframe: "week",
    present: 8,
    absent: 2,
    totalDays: 10,
    attendanceRate: 80,
    absentDates: ["2026-02-10", "2026-02-12"],
    ...overrides,
  };
}

function feedingResult(
  overrides: Partial<SummarizeFeedingResult>,
): SummarizeFeedingResult {
  return {
    tool: "summarize_feeding",
    timeframe: "week",
    completed: 9,
    missed: 1,
    totalMeals: 10,
    feedingRate: 90,
    foods: ["Rice", "Fish"],
    ...overrides,
  };
}

function reportResult(
  overrides: Partial<GenerateChildReportResult>,
): GenerateChildReportResult {
  return {
    tool: "generate_child_report",
    timeframe: "week",
    attendance: attendanceResult({}),
    feeding: feedingResult({}),
    ...overrides,
  };
}

test("teacher attendance wording uses child phrasing, not parent phrasing", async () => {
  const originalEnabled = process.env.AI_RECOMMENDATIONS_ENABLED;
  try {
    process.env.AI_RECOMMENDATIONS_ENABLED = "false";
    const teacherReply = await composeAttendanceReply(
      attendanceResult({}),
      undefined,
      "en",
      "teacher",
    );
    const parentReply = await composeAttendanceReply(
      attendanceResult({}),
      undefined,
      "en",
      "parent",
    );

    assert.match(teacherReply, /This child attended/i);
    assert.doesNotMatch(teacherReply, /Your child attended/i);
    assert.match(parentReply, /Your child attended/i);
  } finally {
    if (originalEnabled === undefined) {
      delete process.env.AI_RECOMMENDATIONS_ENABLED;
    } else {
      process.env.AI_RECOMMENDATIONS_ENABLED = originalEnabled;
    }
  }
});

test("teacher feeding wording uses child phrasing, not parent phrasing", async () => {
  const originalEnabled = process.env.AI_RECOMMENDATIONS_ENABLED;
  try {
    process.env.AI_RECOMMENDATIONS_ENABLED = "false";
    const teacherReply = await composeFeedingReply(
      feedingResult({}),
      undefined,
      "en",
      "teacher",
    );
    const parentReply = await composeFeedingReply(
      feedingResult({}),
      undefined,
      "en",
      "parent",
    );

    assert.match(teacherReply, /This child completed/i);
    assert.doesNotMatch(teacherReply, /Your child completed/i);
    assert.match(parentReply, /Your child completed/i);
  } finally {
    if (originalEnabled === undefined) {
      delete process.env.AI_RECOMMENDATIONS_ENABLED;
    } else {
      process.env.AI_RECOMMENDATIONS_ENABLED = originalEnabled;
    }
  }
});

test("teacher report intro uses child phrasing, not parent phrasing", async () => {
  const originalEnabled = process.env.AI_RECOMMENDATIONS_ENABLED;
  try {
    process.env.AI_RECOMMENDATIONS_ENABLED = "false";
    const teacherReply = await composeChildReportReply(
      reportResult({}),
      undefined,
      "en",
      "teacher",
    );
    const parentReply = await composeChildReportReply(
      reportResult({}),
      undefined,
      "en",
      "parent",
    );

    assert.match(teacherReply, /Here is this child's update/i);
    assert.doesNotMatch(teacherReply, /Here is your child's update/i);
    assert.match(parentReply, /Here is your child's update/i);
  } finally {
    if (originalEnabled === undefined) {
      delete process.env.AI_RECOMMENDATIONS_ENABLED;
    } else {
      process.env.AI_RECOMMENDATIONS_ENABLED = originalEnabled;
    }
  }
});
