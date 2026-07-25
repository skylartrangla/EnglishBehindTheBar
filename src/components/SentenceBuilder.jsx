import { useMemo, useState } from "react";

function tokenize(sentence) {
  return sentence.trim().split(/\s+/);
}

function shuffledTokens(sentence) {
  const tokens = tokenize(sentence).map((text, index) => ({
    id: `${index}-${text}`,
    text,
  }));
  const shuffled = [...tokens];
  let seed = [...sentence].reduce((total, character) => total + character.charCodeAt(0), 0);

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    seed = (seed * 9301 + 49297) % 233280;
    const target = Math.floor((seed / 233280) * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }

  if (
    shuffled.length > 1 &&
    shuffled.every((token, index) => token.id === tokens[index].id)
  ) {
    shuffled.push(shuffled.shift());
  }

  return shuffled;
}

export default function SentenceBuilder({ phrases, onComplete, onSpeak, showVietnamese }) {
  const [round, setRound] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [status, setStatus] = useState("building");
  const phrase = phrases[round];
  const bank = useMemo(() => shuffledTokens(phrase.en), [phrase.en]);
  const selected = selectedIds.map((id) => bank.find((token) => token.id === id));
  const available = bank.filter((token) => !selectedIds.includes(token.id));
  const expected = tokenize(phrase.en);

  function addWord(id) {
    if (status === "correct") return;
    setSelectedIds((current) => [...current, id]);
    setStatus("building");
  }

  function removeWord(id) {
    if (status === "correct") return;
    setSelectedIds((current) => {
      const index = current.lastIndexOf(id);
      return index === -1
        ? current
        : [...current.slice(0, index), ...current.slice(index + 1)];
    });
    setStatus("building");
  }

  function checkAnswer() {
    const answer = selected.map((token) => token.text);
    const correct =
      answer.length === expected.length &&
      answer.every((word, index) => word === expected[index]);
    setStatus(correct ? "correct" : "incorrect");
  }

  function clearAnswer() {
    setSelectedIds([]);
    setStatus("building");
  }

  function nextRound() {
    if (round === phrases.length - 1) {
      onComplete();
      return;
    }
    setRound((current) => current + 1);
    setSelectedIds([]);
    setStatus("building");
  }

  return (
    <div className="sentence-builder">
      <div className="builder-progress" aria-label={`Sentence ${round + 1} of ${phrases.length}`}>
        <strong>Sentence {round + 1} of {phrases.length}</strong>
        <div>
          {phrases.map((item, index) => (
            <span
              key={`${index}-${item.en}`}
              className={index < round || (index === round && status === "correct") ? "complete" : index === round ? "active" : ""}
            />
          ))}
        </div>
      </div>

      <div className="builder-instruction">
        <strong>Tap the words in the correct order.</strong>
        <p>Build the English sentence, check your answer, then listen and say it aloud.</p>
        {showVietnamese && <p className="builder-meaning">Meaning: {phrase.vi}</p>}
      </div>

      <div
        className={`answer-zone ${status}`}
        aria-label="Your sentence"
        aria-live="polite"
      >
        {selected.length ? (
          selected.map((token) => (
            <button type="button" key={token.id} onClick={() => removeWord(token.id)}>
              {token.text}
            </button>
          ))
        ) : (
          <span>Tap a word below to begin…</span>
        )}
      </div>

      <div className="word-bank" aria-label="Available words">
        {available.map((token) => (
          <button type="button" key={token.id} onClick={() => addWord(token.id)}>
            {token.text}
          </button>
        ))}
      </div>

      {status === "incorrect" && (
        <p className="builder-feedback incorrect">Not quite. Tap a word above to remove it, then try again.</p>
      )}
      {status === "correct" && (
        <p className="builder-feedback correct">✓ Correct! Now listen and say the complete sentence aloud.</p>
      )}

      <div className="builder-actions">
        {status !== "correct" ? (
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={clearAnswer}
              disabled={!selectedIds.length}
            >
              Clear
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={checkAnswer}
              disabled={selectedIds.length !== expected.length}
            >
              Check answer
            </button>
          </>
        ) : (
          <>
            <button type="button" className="secondary-button" onClick={() => onSpeak(phrase.en)}>
              ▶ Hear sentence
            </button>
            <button type="button" className="primary-button" onClick={nextRound}>
              {round === phrases.length - 1 ? "Finish exercise ✓" : "Next sentence →"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
