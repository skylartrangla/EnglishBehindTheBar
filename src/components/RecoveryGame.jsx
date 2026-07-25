import { useMemo, useState } from "react";
import { localDateKey, localWeekKey } from "../lib/storage.js";

const RECOVERY_PRICE = 300;
const PASS_SCORE = 4;
const MAX_TOKENS = 5;

const phraseBank = [
  ["Good evening.", "Chào buổi tối."],
  ["Welcome to our bar.", "Chào mừng bạn đến quán của chúng tôi."],
  ["Please have a seat.", "Mời bạn ngồi."],
  ["One moment, please.", "Vui lòng chờ một lát."],
  ["What can I get you?", "Tôi có thể phục vụ bạn món gì?"],
  ["Would you like it sweet or sour?", "Bạn muốn vị ngọt hay chua?"],
  ["This drink is light and refreshing.", "Thức uống này nhẹ và sảng khoái."],
  ["Thank you for waiting.", "Cảm ơn bạn đã chờ."],
  ["Please enjoy your drink.", "Chúc bạn thưởng thức đồ uống ngon miệng."],
  ["Cheers!", "Chúc mừng!"],
];

function dailyQuestions() {
  const seed = [...localDateKey()].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  return Array.from({ length: 5 }, (_, questionIndex) => {
    const answerIndex = (seed + questionIndex * 3) % phraseBank.length;
    const optionIndexes = [
      answerIndex,
      (answerIndex + 3 + questionIndex) % phraseBank.length,
      (answerIndex + 6 + questionIndex) % phraseBank.length,
    ];
    const rotated = optionIndexes
      .map((index) => phraseBank[index][1])
      .slice(questionIndex % 3)
      .concat(optionIndexes.map((index) => phraseBank[index][1]).slice(0, questionIndex % 3));
    return {
      prompt: phraseBank[answerIndex][0],
      answer: phraseBank[answerIndex][1],
      options: [...new Set(rotated)],
    };
  });
}

export default function RecoveryGame({
  progress,
  onBuyToken,
  onUseToken,
  onWinToken,
}) {
  const questions = useMemo(() => dailyQuestions(), []);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const rewardClaimed = progress.minigameRewardWeeks.includes(localWeekKey());
  const allAnswered = questions.every((_, index) => answers[index]);

  function submitGame() {
    const score = questions.reduce(
      (total, question, index) => total + Number(answers[index] === question.answer),
      0,
    );
    const passed = score >= PASS_SCORE;
    const earned = passed && !rewardClaimed && progress.recoveryTokens < MAX_TOKENS;
    setResult({ score, passed, earned });
    if (earned) onWinToken();
  }

  function retry() {
    setAnswers({});
    setResult(null);
  }

  return (
    <div className="screen-stack recovery-game-screen">
      <section className="page-heading">
        <div className="eyebrow">HABIT TRAINING · STREAK RECOVERY</div>
        <h1>Protect the time you promised yourself.</h1>
        <p>
          Check in within 30 minutes before or after your registered study time.
          Three outside-window check-ins create one streak debt.
        </p>
      </section>

      <section className="habit-status-grid">
        <article>
          <span>Late marks</span>
          <strong>{progress.lateMarks}/3</strong>
          <small>The third mark creates a streak debt.</small>
        </article>
        <article className={progress.streakDebt ? "warning" : ""}>
          <span>Streak debt</span>
          <strong>{progress.streakDebt}</strong>
          <small>Each debt needs one Recovery Token.</small>
        </article>
        <article>
          <span>Recovery Tokens</span>
          <strong>{progress.recoveryTokens}</strong>
          <small>Maximum stored: {MAX_TOKENS}.</small>
        </article>
      </section>

      {progress.streakDebt > 0 && (
        <section className="panel-card recovery-alert">
          <div>
            <span className="step-label">STREAK NEEDS REPAIR</span>
            <h2>Use one token to clear one streak debt.</h2>
            <p>Your Bar Coins are never deducted for a late check-in.</p>
          </div>
          <button
            type="button"
            className="primary-button"
            disabled={!progress.recoveryTokens}
            onClick={onUseToken}
          >
            Use Recovery Token
          </button>
        </section>
      )}

      <section className="recovery-layout">
        <article className="panel-card minigame-card">
          <div className="panel-heading">
            <div>
              <span className="step-label">MINIGAME · BAR PHRASE MATCH</span>
              <h2>Match at least 4 of 5 phrases.</h2>
            </div>
            <span className="weekly-reward">
              {rewardClaimed ? "Weekly reward claimed" : "Reward: 1 token"}
            </span>
          </div>
          <p>
            Choose the correct Vietnamese meaning. You can practice anytime,
            but only the first passing game each week awards a token.
          </p>

          <div className="minigame-questions">
            {questions.map((question, questionIndex) => (
              <fieldset key={question.prompt} disabled={Boolean(result)}>
                <legend>
                  <span>{questionIndex + 1}</span>
                  {question.prompt}
                </legend>
                {question.options.map((option) => (
                  <label key={option} className={answers[questionIndex] === option ? "selected" : ""}>
                    <input
                      type="radio"
                      name={`recovery-question-${questionIndex}`}
                      value={option}
                      checked={answers[questionIndex] === option}
                      onChange={() =>
                        setAnswers((current) => ({ ...current, [questionIndex]: option }))
                      }
                    />
                    {option}
                  </label>
                ))}
              </fieldset>
            ))}
          </div>

          {result && (
            <div className={`game-result ${result.passed ? "passed" : "failed"}`}>
              <strong>{result.score}/5 correct</strong>
              <p>
                {result.passed
                  ? result.earned
                    ? "You passed and earned one Recovery Token."
                    : progress.recoveryTokens >= MAX_TOKENS
                      ? "You passed. Use a stored token before earning another one."
                      : "Great practice. You already earned this week’s token."
                  : "You need 4 correct answers. Review the phrases and try again."}
              </p>
            </div>
          )}

          <div className="builder-actions">
            {result ? (
              <button type="button" className="secondary-button" onClick={retry}>
                Play again
              </button>
            ) : (
              <button
                type="button"
                className="primary-button"
                disabled={!allAnswered}
                onClick={submitGame}
              >
                Check my score
              </button>
            )}
          </div>
        </article>

        <aside className="panel-card recovery-shop">
          <span className="step-label">RECOVERY SHOP · NOT COSMETICS</span>
          <div className="recovery-token-icon">↻</div>
          <h2>Recovery Token</h2>
          <p>Clears one streak debt caused by three outside-window check-ins.</p>
          <strong>{RECOVERY_PRICE} Bar Coins</strong>
          <button
            type="button"
            className="primary-button full-width"
            disabled={progress.points < RECOVERY_PRICE || progress.recoveryTokens >= MAX_TOKENS}
            onClick={() => onBuyToken(RECOVERY_PRICE)}
          >
            {progress.recoveryTokens >= MAX_TOKENS
              ? "Token storage full"
              : progress.points < RECOVERY_PRICE
                ? `Need ${RECOVERY_PRICE - progress.points} more coins`
                : "Buy one token"}
          </button>
          <small>Late check-ins themselves never remove Bar Coins.</small>
        </aside>
      </section>
    </div>
  );
}
