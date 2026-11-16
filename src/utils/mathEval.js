/**
 * Pure recursive-descent arithmetic evaluator (no eval / Function).
 */
export function evaluateArithmeticExpression(expr) {
  if (typeof expr !== "string") return null;
  const tokens = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[\d.]/.test(ch)) {
      const start = i;
      let dots = 0;
      while (i < expr.length && /[\d.]/.test(expr[i])) {
        if (expr[i] === ".") dots++;
        i++;
      }
      if (dots > 1) return null;
      const slice = expr.slice(start, i);
      if (slice === ".") return null;
      const num = Number(slice);
      if (!Number.isFinite(num)) return null;
      tokens.push({ type: "num", value: num });
      continue;
    }
    if (ch === "*" && expr[i + 1] === "*") {
      tokens.push({ type: "op", value: "**" });
      i += 2;
      continue;
    }
    if ("+-*/%()".includes(ch)) {
      tokens.push({ type: "op", value: ch });
      i++;
      continue;
    }
    return null;
  }

  let pos = 0;
  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  function parseAddSub() {
    let left = parseMulDiv();
    while (peek()?.type === "op" && (peek()?.value === "+" || peek()?.value === "-")) {
      const op = consume().value;
      const right = parseMulDiv();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  function parseMulDiv() {
    let left = parsePow();
    while (
      peek()?.type === "op" &&
      (peek()?.value === "*" || peek()?.value === "/" || peek()?.value === "%")
    ) {
      const op = consume().value;
      const right = parsePow();
      if ((op === "/" || op === "%") && right === 0) {
        throw new Error("Division by zero");
      }
      left = op === "*" ? left * right : op === "/" ? left / right : left % right;
    }
    return left;
  }

  function parsePow() {
    const base = parseUnary();
    if (peek()?.type === "op" && peek()?.value === "**") {
      consume();
      return base ** parsePow();
    }
    return base;
  }

  function parseUnary() {
    if (peek()?.type === "op" && (peek()?.value === "+" || peek()?.value === "-")) {
      const op = consume().value;
      const val = parseUnary();
      return op === "-" ? -val : val;
    }
    return parsePrimary();
  }

  function parsePrimary() {
    const tok = peek();
    if (!tok) throw new Error("Unexpected end");
    if (tok.type === "num") {
      consume();
      return tok.value;
    }
    if (tok.type === "op" && tok.value === "(") {
      consume();
      const inner = parseAddSub();
      const close = consume();
      if (!close || close.type !== "op" || close.value !== ")") {
        throw new Error("Missing closing parenthesis");
      }
      return inner;
    }
    throw new Error("Unexpected token");
  }

  try {
    if (tokens.length === 0) return null;
    const val = parseAddSub();
    if (pos !== tokens.length || !Number.isFinite(val)) return null;
    return val;
  } catch {
    return null;
  }
}
