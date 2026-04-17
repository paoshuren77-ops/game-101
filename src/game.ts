export type Puzzle = {
  cards: number[];
  solution: string;
};

type Token =
  | { type: 'number'; value: number; raw: string }
  | { type: 'operator'; value: '+' | '-' | '*' | '/' }
  | { type: 'paren'; value: '(' | ')' };

type Operator = '+' | '-' | '*' | '/';
type OperatorStackItem = Operator | '(';

const EPSILON = 1e-7;
const OPERATORS = new Set(['+', '-', '*', '/']);

export function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

export function generatePuzzle(): Puzzle {
  for (let attempts = 0; attempts < 5000; attempts += 1) {
    const cards = Array.from({ length: 4 }, () => Math.floor(Math.random() * 13) + 1);
    const solution = findSolution(cards);

    if (solution) {
      return { cards, solution };
    }
  }

  return { cards: [3, 3, 8, 8], solution: '8 / (3 - 8 / 3)' };
}

export function validateExpression(expression: string, cards: number[]) {
  if (!expression.trim()) {
    return { ok: false, message: '先写下你的算式。' };
  }

  let tokens: Token[];
  try {
    tokens = tokenize(expression);
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : '算式格式不正确。' };
  }

  const usedNumbers = tokens.filter((token) => token.type === 'number').map((token) => token.value);
  if (!sameMultiset(usedNumbers, cards)) {
    return { ok: false, message: '必须且只能使用这四张牌各一次。' };
  }

  try {
    const value = evaluateTokens(tokens);
    if (Math.abs(value - 24) <= EPSILON) {
      return { ok: true, message: '正确，漂亮的一手！' };
    }

    return { ok: false, message: `结果是 ${trimNumber(value)}，还差一点。` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : '算式无法计算。' };
  }
}

export function findSolution(cards: number[]) {
  const states = cards.map((value) => ({ value, expr: value.toString() }));
  return solveStates(states);
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (/\s/.test(char)) {
      i += 1;
      continue;
    }

    if (/\d/.test(char)) {
      let raw = char;
      i += 1;
      while (i < input.length && /\d/.test(input[i])) {
        raw += input[i];
        i += 1;
      }
      tokens.push({ type: 'number', value: Number(raw), raw });
      continue;
    }

    if (OPERATORS.has(char)) {
      tokens.push({ type: 'operator', value: char as Operator });
      i += 1;
      continue;
    }

    if (char === '(' || char === ')') {
      tokens.push({ type: 'paren', value: char });
      i += 1;
      continue;
    }

    throw new Error('只能输入数字、括号和 + - * /。');
  }

  return tokens;
}

function evaluateTokens(tokens: Token[]) {
  const values: number[] = [];
  const operators: OperatorStackItem[] = [];

  for (const token of tokens) {
    if (token.type === 'number') {
      values.push(token.value);
      continue;
    }

    if (token.type === 'paren' && token.value === '(') {
      operators.push(token.value);
      continue;
    }

    if (token.type === 'paren' && token.value === ')') {
      while (operators.length && operators[operators.length - 1] !== '(') {
        applyTop(values, operators);
      }
      if (operators.pop() !== '(') {
        throw new Error('括号没有配对。');
      }
      continue;
    }

    if (token.type === 'operator') {
      while (
        operators.length &&
        operators[operators.length - 1] !== '(' &&
        precedence(operators[operators.length - 1]) >= precedence(token.value)
      ) {
        applyTop(values, operators);
      }
      operators.push(token.value);
    }
  }

  while (operators.length) {
    if (operators[operators.length - 1] === '(') {
      throw new Error('括号没有配对。');
    }
    applyTop(values, operators);
  }

  if (values.length !== 1 || Number.isNaN(values[0])) {
    throw new Error('算式格式不正确。');
  }

  return values[0];
}

function applyTop(values: number[], operators: OperatorStackItem[]) {
  const operator = operators.pop();
  const right = values.pop();
  const left = values.pop();

  if (!operator || operator === '(' || left === undefined || right === undefined) {
    throw new Error('算式格式不正确。');
  }

  if (operator === '+') values.push(left + right);
  if (operator === '-') values.push(left - right);
  if (operator === '*') values.push(left * right);
  if (operator === '/') {
    if (Math.abs(right) <= EPSILON) {
      throw new Error('不能除以 0。');
    }
    values.push(left / right);
  }
}

function precedence(operator: string) {
  return operator === '+' || operator === '-' ? 1 : 2;
}

function sameMultiset(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  const left = [...a].sort((x, y) => x - y);
  const right = [...b].sort((x, y) => x - y);
  return left.every((value, index) => value === right[index]);
}

function solveStates(states: Array<{ value: number; expr: string }>): string | null {
  if (states.length === 1) {
    return Math.abs(states[0].value - 24) <= EPSILON ? states[0].expr : null;
  }

  for (let i = 0; i < states.length; i += 1) {
    for (let j = 0; j < states.length; j += 1) {
      if (i === j) continue;

      const rest = states.filter((_, index) => index !== i && index !== j);
      const a = states[i];
      const b = states[j];
      const candidates = [
        { value: a.value + b.value, expr: `(${a.expr} + ${b.expr})` },
        { value: a.value - b.value, expr: `(${a.expr} - ${b.expr})` },
        { value: a.value * b.value, expr: `(${a.expr} * ${b.expr})` },
      ];

      if (Math.abs(b.value) > EPSILON) {
        candidates.push({ value: a.value / b.value, expr: `(${a.expr} / ${b.expr})` });
      }

      for (const candidate of candidates) {
        const solved = solveStates([...rest, candidate]);
        if (solved) return solved;
      }
    }
  }

  return null;
}

function trimNumber(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}
