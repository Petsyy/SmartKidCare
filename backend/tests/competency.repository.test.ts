import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CompetencyEvaluationRepository } from "../src/modules/competencies/repositories/competency.repository";

describe("CompetencyEvaluationRepository", () => {
  it("returns an editable document when finding an evaluation by date", async () => {
    const document = {
      set() {},
      async save() {
        return this;
      },
    };
    let receivedQuery: Record<string, unknown> | undefined;

    const model = {
      findOne(query: Record<string, unknown>) {
        receivedQuery = query;
        return {
          populate() {
            return Promise.resolve(document);
          },
        };
      },
    };

    const repository = new CompetencyEvaluationRepository(model as any);
    const result = await repository.findByChildAndDate(
      "64b000000000000000000000001",
      new Date("2026-10-18T16:00:00.000Z"),
      new Date("2026-10-19T15:59:59.999Z"),
      "quarterly",
    );

    assert.equal(result, document);
    assert.equal(typeof result.set, "function");
    assert.equal(typeof result.save, "function");
    assert.equal(receivedQuery?.child, "64b000000000000000000000001");
  });
});
