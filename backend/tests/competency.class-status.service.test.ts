import assert from "node:assert/strict";
import test from "node:test";
import { CompetencyService } from "../src/modules/competencies/services/competency.service";

test("builds a teacher class queue with submitted, locked, and available children", async () => {
  let receivedChildFilter: Record<string, unknown> | undefined;
  const service = new CompetencyService(
    {} as any,
    {
      findSubmittedByChildrenAndDate: async () => [
        {
          _id: "evaluation-1",
          child: "child-1",
          evaluationDate: new Date("2026-10-19T00:00:00.000Z"),
        },
      ],
      findSubmittedByChildrenAndPeriod: async () => [
        { child: "child-2", schoolYear: "2026-2027" },
      ],
    } as any,
    {
      findByTeacher: async (
        _teacherId: string,
        filter: Record<string, unknown>,
      ) => {
        receivedChildFilter = filter;
        return [
          { _id: "child-1", schoolYear: "2026-2027" },
          { _id: "child-2", schoolYear: "2026-2027" },
          { _id: "child-3", schoolYear: "2026-2027" },
        ];
      },
    } as any,
    {} as any,
    () => new Date("2026-10-19T04:00:00.000Z"),
  );

  const result = await service.getMyClassStatus(
    { id: "teacher-1", role: "teacher", daycareCenterId: "center-1" },
    "final",
    "2026-10-19",
  );

  assert.deepEqual(receivedChildFilter, {
    daycareCenter: "center-1",
    status: "Active",
  });
  assert.deepEqual(
    result.statuses.map((item) => [item.childId, item.status]),
    [
      ["child-1", "submitted"],
      ["child-2", "not_started"],
      ["child-3", "locked"],
    ],
  );
});

test("rejects class queue access for non-teachers", async () => {
  const service = new CompetencyService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );
  await assert.rejects(
    () =>
      service.getMyClassStatus(
        { id: "parent-1", role: "parent", daycareCenterId: "center-1" },
        "quarterly",
        "2026-10-19",
      ),
    { name: "ForbiddenError" },
  );
});
