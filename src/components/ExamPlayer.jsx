import { useMemo, useState } from "react";
import {
  economy,
  examQuestions,
  examSpecialItems,
} from "../data/game.js";

export default function ExamPlayer({ checkpoint, progress, onExit, onFinish }) {
  const questions = useMemo(() => examQuestions[checkpoint], [checkpoint]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const special = examSpecialItems.find((item) => item.checkpoint === checkpoint);
  const previous = progress.examResults?.[checkpoint] || {};
  const question = questions[index];
  const answeredCount = Object.keys(answers).length;

  function submit() {
    if (answeredCount !== questions.length) return;
    const correct = questions.filter((item) => answers[item.id] === item.answer).length;
    const score = Math.round((correct / questions.length) * 100);
    const wrong = questions.length - correct;
    const passed = score >= economy.passScore;
    const reward = passed && !previous.rewardClaimed ? economy.examPassReward : 0;
    const penalty = wrong * economy.wrongAnswerPenalty;
    const specialEarned = score >= economy.specialScore;
    const outcome = { checkpoint, score, wrong, passed, reward, penalty, specialEarned };
    onFinish(outcome);
    setResult(outcome);
  }

  function retry() {
    setAnswers({});
    setIndex(0);
    setResult(null);
  }

  if (result) {
    return (
      <main className="exam-shell result-shell">
        <section className={`exam-result ${result.passed ? "passed" : "failed"}`}>
          <span className="step-label">WEEK {checkpoint} CHECKPOINT</span>
          <div className="score-ring">{result.score}%</div>
          <h1>{result.passed ? "Chapter passed." : "Not passed yet."}</h1>
          <p>
            {result.passed
              ? checkpoint === 24
                ? "You completed the full English Behind the Bar course."
                : `Weeks ${checkpoint + 1}–${checkpoint + 4} are now unlocked.`
              : `Reach ${economy.passScore}% to unlock the next four weeks.`}
          </p>
          <div className="result-economy">
            <span>Exam reward <strong>+{result.reward}</strong></span>
            <span>Wrong-answer cost <strong>−{result.penalty}</strong></span>
          </div>
          {result.specialEarned && (
            <div className="special-item-reveal">
              <span style={{ color: special.color }}>{special.icon}</span>
              <div>
                <small>EXCLUSIVE ITEM EARNED</small>
                <strong>{special.name}</strong>
                <p>{special.description}</p>
              </div>
            </div>
          )}
          <div className="button-row">
            <button type="button" className="primary-button" onClick={onExit}>
              Back to course →
            </button>
            {(!result.passed || !result.specialEarned) && (
              <button type="button" className="secondary-button" onClick={retry}>
                Retake exam
              </button>
            )}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="exam-shell">
      <header className="exam-header">
        <button type="button" className="back-button" onClick={onExit}>← Exit</button>
        <div>
          <span>WEEK {checkpoint} CHECKPOINT</span>
          <strong>Question {index + 1} of {questions.length}</strong>
        </div>
        <span>{answeredCount}/{questions.length} answered</span>
      </header>
      <div className="exam-progress-bar">
        <i style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>
      <section className="exam-question-card">
        <span className="step-label">REVISION EXAM</span>
        <h1>{question.prompt}</h1>
        <div className="exam-options">
          {question.options.map((option, optionIndex) => (
            <button
              type="button"
              key={option}
              className={answers[question.id] === optionIndex ? "selected" : ""}
              onClick={() =>
                setAnswers((current) => ({ ...current, [question.id]: optionIndex }))
              }
            >
              <span>{String.fromCharCode(65 + optionIndex)}</span>
              {option}
            </button>
          ))}
        </div>
        <div className="exam-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={index === 0}
            onClick={() => setIndex((current) => Math.max(0, current - 1))}
          >
            ← Previous
          </button>
          {index < questions.length - 1 ? (
            <button
              type="button"
              className="primary-button"
              disabled={answers[question.id] === undefined}
              onClick={() => setIndex((current) => current + 1)}
            >
              Next question →
            </button>
          ) : (
            <button
              type="button"
              className="primary-button"
              disabled={answeredCount !== questions.length}
              onClick={submit}
            >
              Submit exam
            </button>
          )}
        </div>
      </section>
      <aside className="exam-rules">
        <span>PASS</span> {economy.passScore}% · <span>SPECIAL ITEM</span>{" "}
        {economy.specialScore}% · <span>WRONG ANSWER</span> −
        {economy.wrongAnswerPenalty} coins
      </aside>
    </main>
  );
}
