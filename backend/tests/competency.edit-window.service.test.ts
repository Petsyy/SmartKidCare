import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CompetencyService } from "../src/modules/competencies/services/competency.service";
import type {
  CompetencyChildRepository,
  CompetencyDefinitionRepositoryContract,
  CompetencyEvaluationInput,
  CompetencyEvaluationRepositoryContract,
  CompetencyNotificationServiceContract,
} from "../src/modules/competencies/types/competency.types";

const CHILD_ID = "64b000000000000000000001";
const OTHER_CHILD_ID = "64b000000000000000000002";
const TEACHER_ID = "64b000000000000000000003";
const CENTER_ID = "64b000000000000000000004";
const EVALUATION_ID = "64b000000000000000000005";
const COMPETENCY_ID = "64b000000000000000000006";

const input: CompetencyEvaluationInput = {
  childId: CHILD_ID,
  evaluationId: EVALUATION_ID,
  evaluationDate: "2026-10-19",
  period: "quarterly",
  status: "submitted",
  entries: [{ competencyId: COMPETENCY_ID, level: "achieved" }],
};

const user = {
  id: TEACHER_ID,
  role: "teacher",
  daycareCenterId: CENTER_ID,
};

function createService(existingEvaluation: Record<string, any>) {
  const definitionRepository: CompetencyDefinitionRepositoryContract = {
    ensureDefaults: async () => undefined,
    findActive: async () => [
      { _id: COMPETENCY_ID, name: "Uses classroom materials" },
    ],
    findActiveByIds: async () => [],
  };
  const evaluationRepository: CompetencyEvaluationRepositoryContract = {
    removeLegacyIndexes: async () => undefined,
    create: async (data) => data,
    findById: async () => existingEvaluation,
    findByChildAndDate: async () => null,
    findByChildSchoolYearAndPeriod: async () => null,
    findByChildAndPeriod: async () => ({ status: "submitted" }),
    findViewByChildSchoolYearAndPeriod: async () => null,
    findHistoryByChild: async () => [],
    countHistoryByChild: async () => 0,
    aggregateLatestSubmitted: async () => [],
    findSubmittedSchoolYears: async () => [],
  };
  const childRepository: CompetencyChildRepository = {
    findByIdWithDetails: async () => ({
      _id: CHILD_ID,
      firstName: "Ana",
      lastName: "Santos",
      status: "Active",
      schoolYear: "2026-2027",
      teacher: TEACHER_ID,
      daycareCenter: CENTER_ID,
      parent: null,
    }),
  };
  const notificationService: CompetencyNotificationServiceContract = {
    notify: async () => ({ status: "created" }),
  };

  return new CompetencyService(
    definitionRepository,
    evaluationRepository,
    childRepository,
    notificationService,
    () => new Date("2026-10-19T02:00:00.000Z"),
  );
}

function createEvaluation(evaluationDate: string, child = CHILD_ID) {
  return {
    _id: EVALUATION_ID,
    child,
    period: "quarterly",
    status: "submitted",
    evaluationDate: new Date(`${evaluationDate}T00:00:00.000Z`),
    set(values: Record<string, unknown>) {
      Object.assign(this, values);
    },
    async save() {
      return this;
    },
  };
}

describe("CompetencyService submitted evaluation edit window", () => {
  it("should allow editing on the evaluation date in Manila", async () => {
    const evaluation = createEvaluation("2026-10-19");
    const service = createService(evaluation);

    const result = await service.saveEvaluation(user, input);

    assert.equal(result.evaluation, evaluation);
    assert.equal(result.evaluation.status, "submitted");
  });

  it("should reject editing after the evaluation date in Manila", async () => {
    const service = createService(createEvaluation("2026-10-18"));

    await assert.rejects(
      () =>
        service.saveEvaluation(user, {
          ...input,
          evaluationDate: "2026-10-18",
        }),
      {
        name: "ConflictError",
        message:
          "Submitted evaluations can only be edited on their evaluation date.",
      },
    );
  });

  it("should reject an evaluation ID belonging to another child", async () => {
    const service = createService(
      createEvaluation("2026-10-19", OTHER_CHILD_ID),
    );

    await assert.rejects(() => service.saveEvaluation(user, input), {
      name: "ForbiddenError",
      message: "This evaluation does not belong to the selected child.",
    });
  });

  it("should reject evaluation dates older than seven Manila calendar days", async () => {
    const service = createService(createEvaluation("2026-10-11"));

    await assert.rejects(
      () =>
        service.saveEvaluation(user, {
          ...input,
          evaluationDate: "2026-10-11",
        }),
      {
        name: "ValidationError",
        message: "Evaluation date must be today or within the previous 7 days.",
      },
    );
  });

  it("should reject future evaluation dates", async () => {
    const service = createService(createEvaluation("2026-10-20"));

    await assert.rejects(
      () =>
        service.saveEvaluation(user, {
          ...input,
          evaluationDate: "2026-10-20",
        }),
      {
        name: "ValidationError",
        message: "Evaluation date must be today or within the previous 7 days.",
      },
    );
  });
});
