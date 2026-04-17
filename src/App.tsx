import { FormEvent, useEffect, useMemo, useState } from 'react';
import { formatTime, generatePuzzle, validateExpression } from './game';

const EXAMPLE_INPUTS = ['(8-4)*(7-1)', '6/(1-3/4)', '(13+11)*1'];

export function App() {
  const [puzzle, setPuzzle] = useState(() => generatePuzzle());
  const [expression, setExpression] = useState('');
  const [message, setMessage] = useState('用四张牌各一次，算出 24。');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [streak, setStreak] = useState(0);
  const [solved, setSolved] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [roundSolved, setRoundSolved] = useState(false);

  const sortedCards = useMemo(() => [...puzzle.cards].sort((a, b) => a - b), [puzzle.cards]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [puzzle]);

  function nextRound() {
    setPuzzle(generatePuzzle());
    setExpression('');
    setMessage('新题已发出。');
    setStatus('idle');
    setSeconds(0);
    setShowSolution(false);
    setRoundSolved(false);
  }

  function checkAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateExpression(expression, puzzle.cards);
    setMessage(result.message);
    setStatus(result.ok ? 'success' : 'error');

    if (result.ok && !roundSolved) {
      setStreak((value) => value + 1);
      setSolved((value) => value + 1);
      setRoundSolved(true);
    }
  }

  function append(value: string) {
    setExpression((current) => `${current}${value}`);
  }

  return (
    <main className="app-shell">
      <section className="play-area" aria-labelledby="game-title">
        <div className="topbar">
          <div>
            <p className="eyebrow">24 points</p>
            <h1 id="game-title">24 点练习场</h1>
          </div>
          <div className="score-strip" aria-label="游戏统计">
            <span>{formatTime(seconds)}</span>
            <span>连胜 {streak}</span>
            <span>已解 {solved}</span>
          </div>
        </div>

        <div className="table-surface">
          <div className="cards" aria-label={`当前牌面 ${sortedCards.join(' ')}`}>
            {puzzle.cards.map((card, index) => (
              <button className="number-card" key={`${card}-${index}`} type="button" onClick={() => append(card.toString())}>
                <span>{card}</span>
              </button>
            ))}
          </div>

          <form className="answer-panel" onSubmit={checkAnswer}>
            <label htmlFor="answer">输入算式</label>
            <div className="input-row">
              <input
                id="answer"
                value={expression}
                onChange={(event) => setExpression(event.target.value)}
                placeholder={EXAMPLE_INPUTS[puzzle.cards[0] % EXAMPLE_INPUTS.length]}
                inputMode="text"
                autoComplete="off"
              />
              <button className="primary-action" type="submit">
                验算
              </button>
            </div>
            <p className={`message ${status}`}>{message}</p>

            <div className="operator-grid" aria-label="快捷输入">
              {['+', '-', '*', '/', '(', ')'].map((operator) => (
                <button type="button" key={operator} onClick={() => append(operator)}>
                  {operator}
                </button>
              ))}
              <button type="button" onClick={() => setExpression((current) => current.slice(0, -1))}>
                退格
              </button>
              <button type="button" onClick={() => setExpression('')}>
                清空
              </button>
            </div>
          </form>
        </div>

        <aside className="side-panel" aria-label="本局操作">
          <button type="button" onClick={nextRound}>
            换一题
          </button>
          <button type="button" onClick={() => setShowSolution((value) => !value)}>
            {showSolution ? '隐藏答案' : '看答案'}
          </button>
          <div className="solution-box" aria-live="polite">
            {showSolution ? puzzle.solution : '先试一把，再揭开答案。'}
          </div>
        </aside>
      </section>
    </main>
  );
}
