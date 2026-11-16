import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateArithmeticExpression } from "../src/utils/mathEval.js";

describe("Safe arithmetic expression evaluator", () => {
  it("evaluates arithmetic expressions with precedence and parentheses", () => {
    assert.equal(evaluateArithmeticExpression("6 + 7"), 13);
    assert.equal(evaluateArithmeticExpression("2 + 3 * 4"), 14);
    assert.equal(evaluateArithmeticExpression("(2 + 3) * 4"), 20);
    assert.equal(evaluateArithmeticExpression("2 ** 3 ** 2"), 512);
    assert.equal(evaluateArithmeticExpression("-5 + 12.5"), 7.5);
    assert.equal(evaluateArithmeticExpression("10 % 3"), 1);
  });

  it("rejects division by zero and non-arithmetic payloads", () => {
    assert.equal(evaluateArithmeticExpression("10 / 0"), null);
    assert.equal(evaluateArithmeticExpression("process.exit(1)"), null);
    assert.equal(evaluateArithmeticExpression("alert(1)"), null);
    assert.equal(evaluateArithmeticExpression(""), null);
    assert.equal(evaluateArithmeticExpression("1..2 + 3"), null);
  });
});
