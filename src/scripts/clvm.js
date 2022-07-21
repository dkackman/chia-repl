// clvm and the other identifier are visible as part of the repl context
const { SExp, OPERATOR_LOOKUP, KEYWORD_TO_ATOM, h, t, run_program } = clvm;
const plus = h(KEYWORD_TO_ATOM["+"]);
const q = h(KEYWORD_TO_ATOM["q"]);
const program = SExp.to([plus, 1, t(q, 175)]);
const env = SExp.to(25);
const [cost, result] = run_program(program, env, OPERATOR_LOOKUP);
let isEqual = result.equal_to(SExp.to(25 + 175));
console.log(`isEqual: ${isEqual}`); // 'isEqual: true'
isEqual = result.as_int() === (25 + 175);
console.log(`isEqual: ${isEqual}`); // 'isEqual: true'
