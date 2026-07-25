import { Fragment, useEffect, useMemo, useState } from "react";
import AudioRecorder from "./components/AudioRecorder.jsx";
import BartenderAvatar from "./components/BartenderAvatar.jsx";
import ExamPlayer from "./components/ExamPlayer.jsx";
import RecoveryGame from "./components/RecoveryGame.jsx";
import SentenceBuilder from "./components/SentenceBuilder.jsx";
import ShiftSubmission from "./components/ShiftSubmission.jsx";
import TranslatableText from "./components/TranslatableText.jsx";
import VideoRecorder from "./components/VideoRecorder.jsx";
import {
  coursePhases,
  courseWeeks,
  judgeQuestions,
  starterLessons,
} from "./data/course.js";
import {
  allAvatarItems,
  economy,
  examCheckpoints,
  examSpecialItems,
  isExamReady,
  isWeekUnlocked,
  storeItems,
} from "./data/game.js";
import {
  calculateHabitStreak,
  clearProfile,
  evaluateStudyCheckIn,
  loadProfile,
  loadProgress,
  localDateKey,
  localWeekKey,
  saveProfile,
  saveProgress,
} from "./lib/storage.js";

const screens = [
  ["home", "⌂", "Today"],
  ["course", "◫", "Course"],
  ["exams", "◎", "Exams"],
  ["game", "↻", "Minigame"],
  ["wardrobe", "♢", "Pu"],
  ["progress", "◇", "Progress"],
];

function speak(text, rate = 1) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = rate;
  const voices = window.speechSynthesis.getVoices();
  utterance.voice =
    voices.find((voice) => voice.lang.startsWith("en") && /female|samantha|zira/i.test(voice.name)) ||
    voices.find((voice) => voice.lang.startsWith("en")) ||
    null;
  window.speechSynthesis.speak(utterance);
}

function Onboarding({ onComplete }) {
  const [name, setName] = useState("");
  const [studyTime, setStudyTime] = useState("19:00");
  const [recoveryDay, setRecoveryDay] = useState("0");

  function submit(event) {
    event.preventDefault();
    if (!name.trim()) return;
    onComplete({
      name: name.trim(),
      studyTime,
      recoveryDay: Number(recoveryDay),
      joinedAt: new Date().toISOString(),
    });
  }

  return (
    <main className="onboarding-shell">
      <section className="onboarding-copy">
        <div className="eyebrow">ENGLISH · HOSPITALITY · COMPETITION</div>
        <div className="brand-lockup large">
          <span className="brand-mark">EB</span>
          <span>English Behind the Bar</span>
        </div>
        <h1>Build a voice that carries across the bar.</h1>
        <p>
          A 24-week, 144-lesson speaking course for Vietnamese bartenders—one
          focused lesson, one recording and one real-shift phrase at a time.
        </p>
        <div className="ocean-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>

      <form className="onboarding-card" onSubmit={submit}>
        <div>
          <div className="step-label">SET UP YOUR DAILY ROUTINE</div>
          <h2>Welcome aboard</h2>
          <p className="muted">Your progress will be saved privately on this device.</p>
        </div>
        <label>
          What should we call you?
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            autoComplete="name"
            required
          />
        </label>
        <label>
          Preferred study time
          <input
            type="time"
            value={studyTime}
            onChange={(event) => setStudyTime(event.target.value)}
          />
        </label>
        <label>
          Weekly recovery day
          <select value={recoveryDay} onChange={(event) => setRecoveryDay(event.target.value)}>
            <option value="0">Sunday</option>
            <option value="1">Monday</option>
            <option value="2">Tuesday</option>
            <option value="3">Wednesday</option>
            <option value="4">Thursday</option>
            <option value="5">Friday</option>
            <option value="6">Saturday</option>
          </select>
        </label>
        <button type="submit" className="primary-button full-width">
          Start my course →
        </button>
        <p className="microcopy">
          No password yet. Cross-device accounts will be added after the learning experience is
          validated.
        </p>
      </form>
    </main>
  );
}

function AppHeader({ profile, progress, onOpenProfile }) {
  const streak = calculateHabitStreak(progress.habitCheckIns, profile.recoveryDay);

  return (
    <header className="app-header">
      <button type="button" className="brand-lockup" onClick={() => window.scrollTo(0, 0)}>
        <span className="brand-mark">EB</span>
        <span>English Behind the Bar</span>
      </button>
      <div className="header-status">
        <span>🔥 {streak}</span>
        <span>◉ {progress.points}</span>
        <button type="button" className="avatar-button" onClick={onOpenProfile}>
          {profile.name.slice(0, 1).toUpperCase()}
        </button>
      </div>
    </header>
  );
}

function HomeScreen({ profile, progress, onStartLesson, onStartExam, onNavigate }) {
  const completed = new Set(progress.completedLessons);
  const currentLesson = starterLessons.find(
    (lesson) =>
      isWeekUnlocked(lesson.week, progress.examResults) && !completed.has(lesson.id),
  );
  const dueExam = examCheckpoints.find(
    (checkpoint) =>
      !progress.examResults?.[checkpoint]?.passed && isExamReady(checkpoint, progress),
  );
  const streak = calculateHabitStreak(progress.habitCheckIns, profile.recoveryDay);
  const todayCheckIn = progress.habitCheckIns.find(
    (entry) => entry.date === localDateKey(),
  );
  const checkInMessage = !todayCheckIn
    ? "Checking today’s study time…"
    : todayCheckIn.status === "on-time"
      ? `✓ On time for ${profile.studyTime}`
      : todayCheckIn.status === "recovery-day"
        ? "☕ Scheduled recovery day"
        : todayCheckIn.status === "recovered"
          ? "↻ Streak recovered"
          : todayCheckIn.status === "debt"
            ? "⚠ Streak debt created"
            : `⚠ Outside study time · mark ${todayCheckIn.markNumber}/3`;

  return (
    <div className="screen-stack">
      <section className="welcome-row">
        <div>
          <div className="eyebrow">TODAY · {new Date().toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase()}</div>
          <h1>Good evening, {profile.name}.</h1>
          <p>Your next speaking mission is ready.</p>
        </div>
        <div className="home-character">
          <BartenderAvatar equipped={progress.equipped} compact />
          <div>
            <span className={`check-in-chip ${todayCheckIn && todayCheckIn.status !== "on-time" && todayCheckIn.status !== "recovery-day" ? "warning" : ""}`}>
              {checkInMessage}
            </span>
            <strong>{progress.points} Bar Coins</strong>
            <button type="button" className="text-button" onClick={() => onNavigate("wardrobe")}>
              Dress Pu →
            </button>
          </div>
        </div>
      </section>

      <section className="stat-grid">
        <article className="stat-card">
          <span>On-time streak</span>
          <strong>{streak} days</strong>
          <small>Check in near {profile.studyTime} each study day.</small>
        </article>
        <article className="stat-card">
          <span>Bar Coins</span>
          <strong>{progress.points}</strong>
          <small>Earned through lessons and exams.</small>
        </article>
        <article className="stat-card">
          <span>Recovery Tokens</span>
          <strong>{progress.recoveryTokens}</strong>
          <small>{progress.streakDebt ? `${progress.streakDebt} streak debt waiting.` : "No streak debt."}</small>
        </article>
      </section>

      {(progress.lateMarks > 0 || progress.streakDebt > 0) && (
        <section className="habit-warning-card">
          <div>
            <span className="step-label">STUDY-TIME HABIT</span>
            <h2>
              {progress.streakDebt
                ? "Your streak needs a Recovery Token."
                : `${progress.lateMarks}/3 outside-time marks used.`}
            </h2>
            <p>
              Your check-in window is {profile.studyTime}, plus or minus 30 minutes.
              Late marks never remove Bar Coins.
            </p>
          </div>
          <button type="button" className="secondary-button" onClick={() => onNavigate("game")}>
            Open Minigame →
          </button>
        </section>
      )}

      {currentLesson ? (
        <section className="mission-card">
          <div className="mission-topline">
            <span className="stage-pill">WEEK {currentLesson.week} · DAY {currentLesson.day}</span>
            <span>{currentLesson.duration} MIN</span>
          </div>
          <div className="mission-layout">
            <div>
              <div className="eyebrow">{currentLesson.theme.toUpperCase()}</div>
              <h2>{currentLesson.title}</h2>
              <p>{currentLesson.goal}</p>
              <div className="lesson-route">
                {["Hear", "Words", "Build", "Dialogue", "Speak", "Shift"].map((step, index) => (
                  <span key={step}>
                    <b>{index + 1}</b>
                    {step}
                  </span>
                ))}
              </div>
            </div>
            <button type="button" className="start-orb" onClick={() => onStartLesson(currentLesson)}>
              <span>START</span>
              <b>→</b>
            </button>
          </div>
        </section>
      ) : dueExam ? (
        <section className="mission-card exam-mission">
          <div className="mission-topline">
            <span className="stage-pill">CHECKPOINT READY</span>
            <span>10 QUESTIONS</span>
          </div>
          <div className="mission-layout">
            <div>
              <div className="eyebrow">WEEKS {dueExam - 3}–{dueExam} REVISION</div>
              <h2>Pass the Week {dueExam} exam.</h2>
              <p>Score 80% to unlock the next chapter. Score 90% to earn an exclusive item.</p>
            </div>
            <button type="button" className="start-orb" onClick={() => onStartExam(dueExam)}>
              <span>EXAM</span>
              <b>→</b>
            </button>
          </div>
        </section>
      ) : (
        <section className="mission-card">
          <div className="eyebrow">COURSE COMPLETE</div>
          <h2>Every lesson and checkpoint is complete.</h2>
          <p>Keep practicing in Judge Mode and build your competition voice.</p>
        </section>
      )}

      <section className="two-column">
        <article className="panel-card phrase-card">
          <div className="panel-heading">
            <div>
              <span className="step-label">PHRASE OF THE SHIFT</span>
              <h3>Pause on any word for 2 seconds</h3>
            </div>
            <button
              type="button"
              className="audio-button"
              onClick={() => speak("I will be with you in a moment.")}
              aria-label="Play phrase"
            >
              ▶
            </button>
          </div>
          <TranslatableText
            text="I will be with you in a moment."
            sentenceTranslation="Tôi sẽ phục vụ bạn ngay."
            className="daily-phrase"
          />
          <p className="muted">Hover with a mouse or press and hold on your phone.</p>
        </article>

        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <span className="step-label">WEEKLY RHYTHM</span>
              <h3>Six pours, one pause</h3>
            </div>
            <button type="button" className="text-button" onClick={() => onNavigate("course")}>
              Course map →
            </button>
          </div>
          <div className="week-dots">
            {[1, 2, 3, 4, 5, 6].map((day) => (
              <span
                key={day}
                className={day <= Math.min(progress.completedLessons.length + 1, 6) ? "active" : ""}
              >
                {day}
              </span>
            ))}
            <span className="recovery">☕</span>
          </div>
        </article>
      </section>
    </div>
  );
}

function LessonPlayer({ lesson, progress, onExit, onComplete, onRecording }) {
  const isCompleted = progress.completedLessons.includes(lesson.id);
  const [step, setStep] = useState(0);
  const [showVietnamese, setShowVietnamese] = useState(true);
  const [buildComplete, setBuildComplete] = useState(isCompleted);
  const [shiftEvidenceReady, setShiftEvidenceReady] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const steps = ["Hear it", "Words", "Build it", "Dialogue", "Speak", "Shift mission"];

  function next() {
    setStep((current) => Math.min(current + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function finishLesson() {
    if (!shiftEvidenceReady || isCompleted) return;
    onComplete(lesson);
    setShowCelebration(true);
  }

  return (
    <div className="lesson-shell">
      <div className="lesson-header">
        <button type="button" className="back-button" onClick={onExit}>
          ← Back
        </button>
        <div className="lesson-header-copy">
          <span>WEEK {lesson.week} · DAY {lesson.day}</span>
          <strong>{lesson.title}</strong>
        </div>
        <button
          type="button"
          className={`translation-toggle ${showVietnamese ? "active" : ""}`}
          onClick={() => setShowVietnamese((value) => !value)}
        >
          VI {showVietnamese ? "ON" : "OFF"}
        </button>
      </div>

      <div className="lesson-progress" aria-label={`Step ${step + 1} of ${steps.length}`}>
        {steps.map((name, index) => (
          <button
            type="button"
            key={name}
            className={index <= step ? "active" : ""}
            onClick={() => setStep(index)}
            disabled={!buildComplete && index > 2}
            title={!buildComplete && index > 2 ? "Complete Build it first" : ""}
          >
            <span>{index + 1}</span>
            <small>{name}</small>
          </button>
        ))}
      </div>

      <main className="lesson-stage">
        <div className="lesson-goal">
          <div className="step-label">TODAY’S GOAL</div>
          <h1>{lesson.goal}</h1>
          <p>Pause your cursor—or press and hold on your phone—for two seconds to translate any word.</p>
        </div>

        {step === 0 && (
          <section className="learning-card">
            <div className="card-kicker">01 · LISTEN, THEN REPEAT</div>
            <div className="phrase-stack">
              {lesson.warmup.map((phrase, index) => (
                <article className="practice-phrase" key={phrase.en}>
                  <span className="phrase-number">0{index + 1}</span>
                  <div>
                    <TranslatableText
                      text={phrase.en}
                      sentenceTranslation={phrase.vi}
                      className="lesson-phrase"
                    />
                    {showVietnamese && <p className="vietnamese-line">{phrase.vi}</p>}
                  </div>
                  <div className="phrase-audio">
                    <button type="button" onClick={() => speak(phrase.en, 1)}>
                      ▶ Normal
                    </button>
                    <button type="button" onClick={() => speak(phrase.en, 0.68)}>
                      ◁ Slow
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="learning-card">
            <div className="card-kicker">02 · SIX WORDS FOR TODAY</div>
            <div className="vocabulary-grid">
              {lesson.vocabulary.map(([word, vi, example], index) => (
                <article key={word}>
                  <span>0{index + 1}</span>
                  <h3>{word}</h3>
                  {showVietnamese && <p className="vietnamese-line">{vi}</p>}
                  <button type="button" onClick={() => speak(word, 0.8)}>
                    ▶ Hear
                  </button>
                  <TranslatableText
                    text={example}
                    sentenceTranslation={vi}
                    className="word-example"
                  />
                </article>
              ))}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="learning-card build-card">
            <div className="card-kicker">03 · BUILD THREE USEFUL SENTENCES</div>
            <SentenceBuilder
              phrases={lesson.warmup.slice(0, 3)}
              onComplete={() => setBuildComplete(true)}
              onSpeak={speak}
              showVietnamese={showVietnamese}
            />
          </section>
        )}

        {step === 3 && (
          <section className="learning-card">
            <div className="card-kicker">04 · PLAY BOTH ROLES</div>
            <div className="dialogue">
              {lesson.dialogue.map(([speakerName, line, vi], index) => (
                <article className={speakerName.toLowerCase().includes("bartender") ? "bartender" : "guest"} key={`${line}-${index}`}>
                  <span>{speakerName}</span>
                  <TranslatableText text={line} sentenceTranslation={vi} />
                  {showVietnamese && <small>{vi}</small>}
                  <button type="button" onClick={() => speak(line)}>▶</button>
                </article>
              ))}
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => lesson.dialogue.forEach(([, line], index) => window.setTimeout(() => speak(line), index * 2600))}
            >
              ▶ Play complete dialogue
            </button>
          </section>
        )}

        {step === 4 && (
          <section className="learning-card speaking-card">
            <div className="card-kicker">05 · SPEAK WITHOUT THE SCRIPT</div>
            <h2>{lesson.speakingPrompt}</h2>
            <div className="keyword-row">
              {lesson.vocabulary.slice(0, 5).map(([word]) => (
                <span key={word}>{word}</span>
              ))}
            </div>
            <AudioRecorder onSaved={onRecording} />
            <div className="self-check-row">
              <span>After listening, how clear was it?</span>
              <button type="button">Try again</button>
              <button type="button">Mostly clear</button>
              <button type="button">Clear</button>
            </div>
          </section>
        )}

        {step === 5 && (
          <section className="learning-card shift-card">
            <div className="card-kicker">06 · TAKE IT TO THE BAR</div>
            <div className="shift-icon">↗</div>
            <h2>{lesson.shiftChallenge}</h2>
            <p>
              During your next shift, record yourself using today’s phrase while serving at the
              front of the bar. Audio is accepted if recording video is not practical.
            </p>
            {!isCompleted && <ShiftSubmission onReady={setShiftEvidenceReady} />}
            <button
              type="button"
              className="primary-button"
              onClick={finishLesson}
              disabled={isCompleted || !shiftEvidenceReady}
            >
              {isCompleted
                ? "✓ Lesson already completed"
                : `Complete lesson · +${economy.lessonReward} coins`}
            </button>
            {!isCompleted && !shiftEvidenceReady && (
              <small className="completion-lock">Add a valid clip to unlock lesson completion.</small>
            )}
          </section>
        )}

        <div className="lesson-footer-actions">
          <button type="button" className="secondary-button" onClick={() => setStep((value) => Math.max(value - 1, 0))} disabled={step === 0}>
            ← Previous
          </button>
          {step < steps.length - 1 && (
            <button
              type="button"
              className="primary-button"
              onClick={next}
              disabled={step === 2 && !buildComplete}
            >
              Continue →
            </button>
          )}
        </div>
      </main>
      {showCelebration && (
        <div className="celebration-overlay" role="dialog" aria-modal="true" aria-labelledby="celebration-title">
          <div className="celebration-card">
            <div className="celebration-mark">◆</div>
            <span className="step-label">TODAY’S MISSION COMPLETE</span>
            <h2 id="celebration-title">Congratulations! You’ve finished today’s lesson.</h2>
            <p>
              Your real-shift practice is complete, your streak is protected, and you earned{" "}
              {economy.lessonReward} Bar Coins.
            </p>
            <button type="button" className="primary-button full-width" onClick={onExit}>
              Back to today →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CourseScreen({ progress, onStartLesson, onStartExam }) {
  const [phase, setPhase] = useState("foundations");
  const lessonsByWeek = useMemo(
    () =>
      starterLessons.reduce((grouped, lesson) => {
        grouped[lesson.week] = [...(grouped[lesson.week] || []), lesson];
        return grouped;
      }, {}),
    [],
  );

  return (
    <div className="screen-stack">
      <section className="page-heading">
        <div className="eyebrow">24 WEEKS · 3 STAGES · 1 PRACTICAL VOICE</div>
        <h1>Course map</h1>
        <p>Lessons unlock as short mobile interactions—not textbook pages.</p>
      </section>
      <div className="phase-tabs">
        {coursePhases.map((item) => (
          <button
            type="button"
            key={item.id}
            className={phase === item.id ? "active" : ""}
            onClick={() => setPhase(item.id)}
          >
            <span>{item.number}</span>
            <strong>{item.title}</strong>
            <small>{item.range}</small>
          </button>
        ))}
      </div>
      <section className="course-list">
        {courseWeeks
          .filter((week) => week.phase === phase)
          .map((week) => {
            const weekLessons = lessonsByWeek[week.week] || [];
            const unlocked = isWeekUnlocked(week.week, progress.examResults);
            const completedCount = weekLessons.filter((lesson) =>
              progress.completedLessons.includes(lesson.id),
            ).length;
            return (
              <Fragment key={week.week}>
                <article className={`course-week${unlocked ? "" : " locked"}`}>
                  <div className="week-number">
                    {unlocked ? String(week.week).padStart(2, "0") : "⌑"}
                  </div>
                  <div>
                    <span>WEEK {week.week}</span>
                    <h2>{week.title}</h2>
                    <p>{week.goal}</p>
                    <div className="available-lessons">
                      {weekLessons.map((lesson) => {
                        const complete = progress.completedLessons.includes(lesson.id);
                        return (
                          <button
                            type="button"
                            key={lesson.id}
                            disabled={!unlocked}
                            onClick={() => onStartLesson(lesson)}
                          >
                            Day {lesson.day} · {lesson.title}
                            {complete && " ✓"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <span className={`week-status ${unlocked ? "available" : ""}`}>
                    {unlocked ? `${completedCount}/${weekLessons.length} complete` : "Exam locked"}
                  </span>
                </article>
                {week.week % 4 === 0 && (() => {
                  const result = progress.examResults?.[week.week];
                  const ready = isExamReady(week.week, progress);
                  const special = examSpecialItems.find(
                    (item) => item.checkpoint === week.week,
                  );
                  return (
                    <article className={`checkpoint-banner${result?.passed ? " passed" : ""}`}>
                      <div>
                        <span className="step-label">CHAPTER {week.week / 4} EXAM</span>
                        <h3>Weeks {week.week - 3}–{week.week} checkpoint</h3>
                        <p>
                          Pass at 80% · Exclusive {special.name} at 90% · Wrong answers cost{" "}
                          {economy.wrongAnswerPenalty} coins
                        </p>
                      </div>
                      <button
                        type="button"
                        className={ready || result?.passed ? "primary-button" : "secondary-button"}
                        disabled={!ready && !result?.passed}
                        onClick={() => onStartExam(week.week)}
                      >
                        {result?.passed
                          ? `Best ${result.bestScore}% · Retake`
                          : ready
                            ? "Take exam →"
                            : "Complete all 24 lessons"}
                      </button>
                    </article>
                  );
                })()}
              </Fragment>
            );
          })}
      </section>
    </div>
  );
}

function ExamHub({ progress, onStartExam }) {
  return (
    <div className="screen-stack">
      <section className="page-heading">
        <div>
          <div className="eyebrow">SIX CHAPTER CHECKPOINTS</div>
          <h1>Revise. Pass. Unlock.</h1>
          <p>
            Every four weeks ends with a ten-question exam. Pass at 80%; reach 90% for an
            item that the store will never sell.
          </p>
        </div>
        <div className="exam-economy-note">
          <strong>+{economy.examPassReward}</strong>
          <span>first-pass reward</span>
          <small>−{economy.wrongAnswerPenalty} per wrong answer</small>
        </div>
      </section>

      <section className="exam-grid">
        {examCheckpoints.map((checkpoint) => {
          const result = progress.examResults?.[checkpoint];
          const ready = isExamReady(checkpoint, progress);
          const special = examSpecialItems.find((item) => item.checkpoint === checkpoint);
          return (
            <article
              key={checkpoint}
              className={`exam-card${result?.passed ? " passed" : ready ? " ready" : ""}`}
            >
              <div className="exam-card-topline">
                <span>WEEKS {checkpoint - 3}–{checkpoint}</span>
                <strong>{result?.passed ? `${result.bestScore}%` : ready ? "READY" : "LOCKED"}</strong>
              </div>
              <div className="exam-special-icon" style={{ color: special.color }}>
                {special.icon}
              </div>
              <h2>Checkpoint {checkpoint / 4}</h2>
              <p>{special.name} · exclusive 90% reward</p>
              <button
                type="button"
                className="secondary-button full-width"
                disabled={!ready && !result?.passed}
                onClick={() => onStartExam(checkpoint)}
              >
                {result?.passed ? "Retake exam" : ready ? "Start exam →" : "Finish chapter lessons"}
              </button>
            </article>
          );
        })}
      </section>

      <section className="practice-divider">
        <span className="step-label">UNLIMITED PRACTICE · NO COIN PENALTY</span>
        <h2>Prepare for judge questions</h2>
      </section>
      <PracticeScreen embedded />
    </div>
  );
}

function WardrobeScreen({ progress, onPurchase, onEquip }) {
  const inventory = new Set(progress.inventory);
  const earnedSpecials = examSpecialItems.filter((item) => inventory.has(item.id));

  return (
    <div className="screen-stack">
      <section className="page-heading wardrobe-heading">
        <div>
          <div className="eyebrow">PU’S BACK BAR · CHARACTER & STORE</div>
          <h1>Make progress visible.</h1>
          <p>Lessons earn coins. Exams unlock exclusive pieces that cannot be purchased.</p>
        </div>
        <div className="coin-balance">
          <span>◉</span>
          <strong>{progress.points}</strong>
          <small>BAR COINS</small>
        </div>
      </section>

      <section className="wardrobe-layout">
        <div className="avatar-panel">
          <BartenderAvatar equipped={progress.equipped} />
          <div className="equipped-list">
            {["outfit", "head", "accessory", "background"].map((type) => {
              const item = allAvatarItems.find(
                (candidate) => candidate.id === progress.equipped[type],
              );
              return (
                <span key={type}>
                  <small>{type}</small>
                  <strong>{item?.name || "Default"}</strong>
                </span>
              );
            })}
          </div>
        </div>

        <div className="store-panel">
          <div className="panel-heading">
            <div>
              <span className="step-label">STORE</span>
              <h2>Shift rewards</h2>
            </div>
            <span className="economy-caption">Most items = 7–22 completed lessons</span>
          </div>
          <div className="store-grid">
            {storeItems.map((item) => {
              const owned = inventory.has(item.id);
              const equipped = progress.equipped[item.type] === item.id;
              const affordable = progress.points >= item.price;
              return (
                <article key={item.id} className={owned ? "owned" : ""}>
                  <div className="store-icon" style={{ color: item.color }}>{item.icon}</div>
                  <span>{item.type.toUpperCase()}</span>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  {owned ? (
                    <button
                      type="button"
                      className="secondary-button full-width"
                      disabled={equipped}
                      onClick={() => onEquip(item)}
                    >
                      {equipped ? "✓ Equipped" : "Equip"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="secondary-button full-width"
                      disabled={!affordable}
                      onClick={() => onPurchase(item)}
                    >
                      ◉ {item.price}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="exclusive-vault">
        <div className="panel-heading">
          <div>
            <span className="step-label">EXAM VAULT</span>
            <h2>Six pieces money cannot buy</h2>
          </div>
          <span>{earnedSpecials.length}/6 earned</span>
        </div>
        <div className="special-grid">
          {examSpecialItems.map((item) => {
            const owned = inventory.has(item.id);
            const equipped = progress.equipped[item.type] === item.id;
            return (
              <article key={item.id} className={owned ? "earned" : "locked"}>
                <span style={{ color: owned ? item.color : undefined }}>{owned ? item.icon : "?"}</span>
                <div>
                  <small>WEEK {item.checkpoint} · 90%</small>
                  <strong>{owned ? item.name : "Hidden reward"}</strong>
                </div>
                {owned && (
                  <button type="button" onClick={() => onEquip(item)} disabled={equipped}>
                    {equipped ? "Equipped" : "Equip"}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function PracticeScreen({ embedded = false }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timerMode, setTimerMode] = useState("idle");
  const [remaining, setRemaining] = useState(30);

  useEffect(() => {
    if (timerMode !== "prep" && timerMode !== "answer") return undefined;
    const interval = window.setInterval(() => {
      setRemaining((seconds) => {
        if (seconds > 1) return seconds - 1;
        if (timerMode === "prep") {
          setTimerMode("answer");
          return 90;
        }
        setTimerMode("done");
        return 0;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerMode]);

  function startDrill() {
    setTimerMode("prep");
    setRemaining(30);
  }

  return (
    <div className="screen-stack">
      {!embedded && (
        <section className="page-heading">
          <div className="eyebrow">PRACTICE LAB · JUDGE MODE</div>
          <h1>Answer under pressure.</h1>
          <p>Thirty seconds to prepare. Ninety seconds to answer. Keep it direct.</p>
        </section>
      )}
      <section className="judge-layout">
        <article className="judge-card">
          <div className="judge-topline">
            <span>QUESTION {String(questionIndex + 1).padStart(2, "0")}</span>
            <button
              type="button"
              onClick={() => {
                setQuestionIndex((index) => (index + 1) % judgeQuestions.length);
                setTimerMode("idle");
                setRemaining(30);
              }}
            >
              New question ↻
            </button>
          </div>
          <TranslatableText
            text={judgeQuestions[questionIndex]}
            sentenceTranslation="Giữ từng từ trong 2 giây để xem nghĩa."
            className="judge-question"
          />
          <div className={`timer ${timerMode}`}>
            <span>{timerMode === "answer" ? "ANSWER" : timerMode === "done" ? "DONE" : "PREPARE"}</span>
            <strong>{String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}</strong>
          </div>
          <button type="button" className="primary-button full-width" onClick={startDrill}>
            {timerMode === "idle" || timerMode === "done" ? "Start timed drill" : "Restart drill"}
          </button>
        </article>
        <aside className="answer-framework">
          <span className="step-label">ANSWER FRAMEWORK</span>
          {[
            ["01", "Answer", "Give the answer in one sentence."],
            ["02", "Reason", "Explain why you made that choice."],
            ["03", "Evidence", "Name one ingredient, technique or result."],
            ["04", "Close", "Return to the central cocktail idea."],
          ].map(([number, title, copy]) => (
            <div key={title}>
              <span>{number}</span>
              <strong>{title}</strong>
              <p>{copy}</p>
            </div>
          ))}
        </aside>
      </section>
      <section className="panel-card">
        <div className="panel-heading">
          <div>
            <span className="step-label">VIDEO MIRROR</span>
            <h2>Watch your timing and body language</h2>
          </div>
          <span className="privacy-label">LOCAL ONLY</span>
        </div>
        <VideoRecorder />
      </section>
    </div>
  );
}

function ProgressScreen({ profile, progress }) {
  const streak = calculateHabitStreak(progress.habitCheckIns, profile.recoveryDay);
  const lessonPercent = Math.round((progress.completedLessons.length / starterLessons.length) * 100);
  const completedSet = new Set(progress.completedLessons);
  const completedInRange = (startWeek, endWeek) =>
    starterLessons.filter(
      (lesson) =>
        lesson.week >= startWeek && lesson.week <= endWeek && completedSet.has(lesson.id),
    ).length;
  const milestones = [
    ["First Pour", "Complete your first lesson", progress.completedLessons.length >= 1],
    ["Clear Voice", "Save ten speaking recordings", progress.recordings >= 10],
    ["First Chapter", "Pass the Week 4 exam", progress.examResults?.[4]?.passed],
    ["Special Collector", "Earn an exclusive exam item", examSpecialItems.some((item) => progress.inventory.includes(item.id))],
    ["Master Bartender", "Pass the final Week 24 exam", progress.examResults?.[24]?.passed],
  ];

  return (
    <div className="screen-stack">
      <section className="page-heading">
        <div className="eyebrow">YOUR LEARNING RECORD</div>
        <h1>Consistency over perfection.</h1>
        <p>Your streak now reflects showing up near your chosen study time.</p>
      </section>
      <section className="stat-grid">
        <article className="stat-card featured">
          <span>On-time streak</span>
          <strong>{streak} days</strong>
          <small>Daily window: ±30 minutes around {profile.studyTime}.</small>
        </article>
        <article className="stat-card">
          <span>Course lessons</span>
          <strong>{progress.completedLessons.length}/{starterLessons.length}</strong>
          <small>{lessonPercent}% of the full 24-week course.</small>
        </article>
        <article className="stat-card">
          <span>Voice archive</span>
          <strong>{progress.recordings}</strong>
          <small>Recordings created on this device.</small>
        </article>
      </section>
      <section className="two-column">
        <article className="panel-card">
          <span className="step-label">RECENT CHECK-INS</span>
          <div className="check-in-history">
            {progress.habitCheckIns.length ? (
              [...progress.habitCheckIns].slice(-7).reverse().map((entry) => (
                <div key={entry.date}>
                  <span>{entry.date}</span>
                  <strong>
                    {entry.status === "on-time"
                      ? "✓ On time"
                      : entry.status === "recovery-day"
                        ? "☕ Recovery day"
                        : entry.status === "recovered"
                          ? "↻ Recovered"
                          : entry.status === "debt"
                            ? "⚠ Debt"
                            : `⚠ Mark ${entry.markNumber}/3`}
                  </strong>
                </div>
              ))
            ) : (
              <p>Your first timed check-in will appear here.</p>
            )}
          </div>
        </article>
        <article className="panel-card">
          <span className="step-label">SKILL SIGNALS</span>
          <div className="skill-bars">
            {[
              ["Bar foundations", Math.round((completedInRange(1, 8) / 48) * 100)],
              ["Real-shift service", Math.round((completedInRange(9, 16) / 48) * 100)],
              ["Competition", Math.round((completedInRange(17, 24) / 48) * 100)],
            ].map(([name, score]) => (
              <div key={name}>
                <span>{name}</span>
                <div><i style={{ width: `${score}%` }} /></div>
                <b>{score}%</b>
              </div>
            ))}
          </div>
        </article>
        <article className="panel-card">
          <span className="step-label">MILESTONES</span>
          <div className="milestone-list">
            {milestones.map(([title, description, earned]) => (
              <div key={title} className={earned ? "earned" : ""}>
                <span>{earned ? "◆" : "◇"}</span>
                <div>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function ProfileScreen({ profile, onReset }) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return (
    <div className="screen-stack">
      <section className="page-heading">
        <div className="eyebrow">LEARNER PROFILE</div>
        <h1>{profile.name}</h1>
        <p>Your current MVP profile is stored only in this browser.</p>
      </section>
      <section className="profile-grid">
        <article className="panel-card">
          <span className="step-label">DAILY ROUTINE</span>
          <dl>
            <div><dt>Study time</dt><dd>{profile.studyTime}</dd></div>
            <div><dt>Recovery day</dt><dd>{days[profile.recoveryDay]}</dd></div>
            <div><dt>Translation hold</dt><dd>2 seconds</dd></div>
            <div><dt>Audio and video</dt><dd>Saved locally</dd></div>
          </dl>
        </article>
        <article className="panel-card">
          <span className="step-label">ACCOUNT ROADMAP</span>
          <h2>Cross-device login comes after validation.</h2>
          <p>
            The first release tests whether the lessons, translations and recording routine are
            genuinely useful. Cloud authentication will follow without changing the learning flow.
          </p>
          <button type="button" className="danger-text-button" onClick={onReset}>
            Reset local learner profile
          </button>
        </article>
      </section>
    </div>
  );
}

function registerDailyHabitCheckIn(current, profile, now = new Date()) {
  if (!profile) return current;
  const today = localDateKey(now);
  if (current.habitCheckIns.some((entry) => entry.date === today)) return current;

  const checkIn = evaluateStudyCheckIn(
    profile.studyTime,
    profile.recoveryDay,
    now,
  );
  const outsideWindow = checkIn.status === "outside-window";
  const nextMark = outsideWindow ? current.lateMarks + 1 : current.lateMarks;
  const createsDebt = outsideWindow && nextMark >= 3;
  const entry = {
    ...checkIn,
    status: createsDebt ? "debt" : checkIn.status,
    markNumber: outsideWindow ? (createsDebt ? 3 : nextMark) : 0,
  };

  return {
    ...current,
    checkIns: current.checkIns.includes(today)
      ? current.checkIns
      : [...current.checkIns, today],
    habitCheckIns: [...current.habitCheckIns, entry],
    lateMarks: createsDebt ? 0 : nextMark,
    streakDebt: current.streakDebt + Number(createsDebt),
  };
}

export default function App() {
  const [profile, setProfile] = useState(() => loadProfile());
  const [progress, setProgress] = useState(() => {
    const next = registerDailyHabitCheckIn(loadProgress(), profile);
    saveProgress(next);
    return next;
  });
  const [screen, setScreen] = useState("home");
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeExam, setActiveExam] = useState(null);

  function completeProfile(nextProfile) {
    saveProfile(nextProfile);
    setProgress((current) => {
      const next = registerDailyHabitCheckIn(current, nextProfile);
      saveProgress(next);
      return next;
    });
    setProfile(nextProfile);
  }

  function updateProgress(updater) {
    setProgress((current) => {
      const next = updater(current);
      saveProgress(next);
      return next;
    });
  }

  function completeLesson(lesson) {
    updateProgress((current) => {
      if (current.completedLessons.includes(lesson.id)) return current;
      const today = localDateKey();
      return {
        ...current,
        completedLessons: [...current.completedLessons, lesson.id],
        completionDates: current.completionDates.includes(today)
          ? current.completionDates
          : [...current.completionDates, today],
        recordings: current.recordings + 1,
        points: current.points + economy.lessonReward,
      };
    });
  }

  function recordSaved() {
    updateProgress((current) => ({
      ...current,
      recordings: current.recordings + 1,
    }));
  }

  function purchaseItem(item) {
    updateProgress((current) => {
      if (current.inventory.includes(item.id) || current.points < item.price) return current;
      return {
        ...current,
        points: current.points - item.price,
        inventory: [...current.inventory, item.id],
        equipped: { ...current.equipped, [item.type]: item.id },
      };
    });
  }

  function equipItem(item) {
    updateProgress((current) => {
      if (!current.inventory.includes(item.id)) return current;
      return {
        ...current,
        equipped: { ...current.equipped, [item.type]: item.id },
      };
    });
  }

  function buyRecoveryToken(price) {
    updateProgress((current) => {
      if (current.points < price || current.recoveryTokens >= 5) return current;
      return {
        ...current,
        points: current.points - price,
        recoveryTokens: current.recoveryTokens + 1,
      };
    });
  }

  function winRecoveryToken() {
    updateProgress((current) => {
      const week = localWeekKey();
      if (
        current.minigameRewardWeeks.includes(week) ||
        current.recoveryTokens >= 5
      ) {
        return current;
      }
      return {
        ...current,
        recoveryTokens: current.recoveryTokens + 1,
        minigameRewardWeeks: [...current.minigameRewardWeeks, week],
      };
    });
  }

  function useRecoveryToken() {
    updateProgress((current) => {
      if (!current.recoveryTokens || !current.streakDebt) return current;
      const debtIndex = current.habitCheckIns.findIndex(
        (entry) => entry.status === "debt",
      );
      return {
        ...current,
        recoveryTokens: current.recoveryTokens - 1,
        streakDebt: current.streakDebt - 1,
        habitCheckIns: current.habitCheckIns.map((entry, index) =>
          index === debtIndex ? { ...entry, status: "recovered" } : entry,
        ),
      };
    });
  }

  function completeExam(outcome) {
    updateProgress((current) => {
      const previous = current.examResults?.[outcome.checkpoint] || {};
      const special = examSpecialItems.find(
        (item) => item.checkpoint === outcome.checkpoint,
      );
      const earnsNewSpecial =
        outcome.specialEarned && special && !current.inventory.includes(special.id);
      return {
        ...current,
        points: Math.max(0, current.points + outcome.reward - outcome.penalty),
        inventory: earnsNewSpecial
          ? [...current.inventory, special.id]
          : current.inventory,
        examResults: {
          ...current.examResults,
          [outcome.checkpoint]: {
            attempts: (previous.attempts || 0) + 1,
            bestScore: Math.max(previous.bestScore || 0, outcome.score),
            passed: Boolean(previous.passed || outcome.passed),
            rewardClaimed: Boolean(previous.rewardClaimed || outcome.reward),
            specialEarned: Boolean(previous.specialEarned || outcome.specialEarned),
          },
        },
      };
    });
  }

  function reset() {
    if (!window.confirm("Reset this learner profile and return to onboarding?")) return;
    clearProfile();
    setProfile(null);
    setScreen("home");
    setActiveLesson(null);
    setActiveExam(null);
  }

  if (!profile) return <Onboarding onComplete={completeProfile} />;

  if (activeExam) {
    return (
      <ExamPlayer
        checkpoint={activeExam}
        progress={progress}
        onExit={() => setActiveExam(null)}
        onFinish={completeExam}
      />
    );
  }

  if (activeLesson) {
    return (
      <LessonPlayer
        lesson={activeLesson}
        progress={progress}
        onExit={() => setActiveLesson(null)}
        onComplete={completeLesson}
        onRecording={recordSaved}
      />
    );
  }

  return (
    <div className="app-shell">
      <AppHeader profile={profile} progress={progress} onOpenProfile={() => setScreen("profile")} />
      <main className="app-main">
        {screen === "home" && (
          <HomeScreen
            profile={profile}
            progress={progress}
            onStartLesson={setActiveLesson}
            onStartExam={setActiveExam}
            onNavigate={setScreen}
          />
        )}
        {screen === "course" && (
          <CourseScreen
            progress={progress}
            onStartLesson={setActiveLesson}
            onStartExam={setActiveExam}
          />
        )}
        {screen === "exams" && (
          <ExamHub progress={progress} onStartExam={setActiveExam} />
        )}
        {screen === "game" && (
          <RecoveryGame
            progress={progress}
            onBuyToken={buyRecoveryToken}
            onUseToken={useRecoveryToken}
            onWinToken={winRecoveryToken}
          />
        )}
        {screen === "wardrobe" && (
          <WardrobeScreen
            progress={progress}
            onPurchase={purchaseItem}
            onEquip={equipItem}
          />
        )}
        {screen === "progress" && <ProgressScreen profile={profile} progress={progress} />}
        {screen === "profile" && <ProfileScreen profile={profile} onReset={reset} />}
      </main>
      <nav className="bottom-nav" aria-label="Main navigation">
        {screens.map(([id, icon, label]) => (
          <button
            type="button"
            key={id}
            className={screen === id ? "active" : ""}
            onClick={() => {
              setScreen(id);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <span>{icon}</span>
            <small>{label}</small>
          </button>
        ))}
      </nav>
    </div>
  );
}
