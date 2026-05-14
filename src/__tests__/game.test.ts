import { afterEach, describe, expect, it, vi } from 'vitest';
import { findSolution, formatTime, generatePuzzle, validateExpression } from '../game';

describe('formatTime', () => {
  it('formats seconds as zero-padded minutes and seconds', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(9)).toBe('00:09');
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(3601)).toBe('60:01');
  });
});

describe('validateExpression', () => {
  it('accepts a valid expression that uses each card once and evaluates to 24', () => {
    expect(validateExpression('8 / (3 - 8 / 3)', [3, 3, 8, 8])).toEqual({
      ok: true,
      message: '正确，漂亮的一手！',
    });
  });

  it('handles operator precedence and parentheses', () => {
    expect(validateExpression('(8 - 4) * (7 - 1)', [8, 4, 7, 1]).ok).toBe(true);
    expect(validateExpression('6 / (1 - 3 / 4)', [6, 1, 3, 4]).ok).toBe(true);
    expect(validateExpression('(13 + 11) * 1 * 1', [13, 11, 1, 1]).ok).toBe(true);
  });

  it('rejects blank input before parsing', () => {
    expect(validateExpression('   ', [1, 2, 3, 4])).toEqual({
      ok: false,
      message: '先写下你的算式。',
    });
  });

  it('requires the exact card multiset including duplicates', () => {
    expect(validateExpression('8 / (3 - 8 / 4)', [3, 3, 8, 8])).toEqual({
      ok: false,
      message: '必须且只能使用这四张牌各一次。',
    });
    expect(validateExpression('8 / (3 - 8 / 8)', [3, 3, 8, 8])).toEqual({
      ok: false,
      message: '必须且只能使用这四张牌各一次。',
    });
  });

  it('rejects unsupported characters', () => {
    expect(validateExpression('1 + 2 + 3 + a', [1, 2, 3, 4])).toEqual({
      ok: false,
      message: '只能输入数字、括号和 + - * /。',
    });
  });

  it('reports mismatched parentheses and malformed expressions', () => {
    expect(validateExpression('(1 + 2 + 3 + 4', [1, 2, 3, 4])).toEqual({
      ok: false,
      message: '括号没有配对。',
    });
    expect(validateExpression('1 + 2) + 3 + 4', [1, 2, 3, 4])).toEqual({
      ok: false,
      message: '括号没有配对。',
    });
    expect(validateExpression('1 ++ 2 + 3 + 4', [1, 2, 3, 4])).toEqual({
      ok: false,
      message: '算式格式不正确。',
    });
    expect(validateExpression('1 2 3 4', [1, 2, 3, 4])).toEqual({
      ok: false,
      message: '算式格式不正确。',
    });
  });

  it('reports division by zero after card validation passes', () => {
    expect(validateExpression('1 / (2 - 2) + 1', [1, 1, 2, 2])).toEqual({
      ok: false,
      message: '不能除以 0。',
    });
  });

  it('returns the calculated value when the expression does not make 24', () => {
    expect(validateExpression('1 + 2 + 3 + 4', [1, 2, 3, 4])).toEqual({
      ok: false,
      message: '结果是 10，还差一点。',
    });
    expect(validateExpression('1 / 2 + 3 + 4', [1, 2, 3, 4])).toEqual({
      ok: false,
      message: '结果是 7.5，还差一点。',
    });
  });
});

describe('findSolution', () => {
  it('finds a valid solution for solvable cards', () => {
    const solution = findSolution([3, 3, 8, 8]);

    expect(solution).not.toBeNull();
    expect(validateExpression(solution!, [3, 3, 8, 8]).ok).toBe(true);
  });

  it('returns null when cards cannot make 24', () => {
    expect(findSolution([1, 1, 1, 1])).toBeNull();
  });
});

describe('generatePuzzle', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generates a puzzle whose reference solution is valid', () => {
    const values = [2 / 13, 2 / 13, 7 / 13, 7 / 13];
    const random = vi.spyOn(Math, 'random');
    values.forEach((value) => random.mockReturnValueOnce(value));

    const puzzle = generatePuzzle();

    expect(puzzle.cards).toEqual([3, 3, 8, 8]);
    expect(validateExpression(puzzle.solution, puzzle.cards).ok).toBe(true);
  });

  it('falls back to a known solvable puzzle after repeated unsolved attempts', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    expect(generatePuzzle()).toEqual({
      cards: [3, 3, 8, 8],
      solution: '8 / (3 - 8 / 3)',
    });
  });
});
