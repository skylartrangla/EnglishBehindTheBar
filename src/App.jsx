import { useEffect, useMemo, useState } from "react";
import AudioRecorder from "./components/AudioRecorder.jsx";
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
  calculateStreak,
  clearProfile,
  loadProfile,
  loadProgress,
  localDateKey,
  saveProfile,
  saveProgress,
} from "./lib/storage.js";

const screens = [
  ["home", "⌂", "Today"],
  ["course", "◫", "Course"],
  ["practice", "◎", "Practice"],
  ["progress", "◇", "Progress"],
  ["profile", "○", "Profile"],
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
          A 24-week speaking course for Vietnamese bartenders—one focused lesson,
          one recording and one real-shift phrase at a time.
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
  const streak = calculateStreak(progress.completionDates, profile.recoveryDay);

  return (
    <header className="app-header">
      <button type="button" className="brand-lockup" onClick={() => window.scrollTo(0, 0)}>
        <span className="brand-mark">EB</span>
        <span>English Behind the Bar</span>
      </button>
      <div className="header-status">
        <span>🔥 {streak}</span>
        <span>◆ {progress.points}</span>
        <button type="button" className="avatar-button" onClick={onOpenProfile}>
          {profile.name.slice(0, 1).toUpperCase()}
        </button>
      </div>
    </header>
  );
}

function HomeScreen({ profile, progress, onStartLesson, onNavigate }) {
  const completed = new Set(progress.completedLessons);
  const currentLesson = starterLessons.find((lesson) => !completed.has(lesson.id)) || starterLessons[0];
  const streak = calculateStreak(progress.completionDates, profile.recoveryDay);

  return (
    <div className="screen-stack">
      <section className="welcome-row">
        <div>
          <div className="eyebrow">TODAY · {new Date().toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase()}</div>
          <h1>Good evening, {profile.name}.</h1>
          <p>Your next speaking mission is ready.</p>
        </div>
        <div className="check-in-chip">✓ Daily check-in saved</div>
      </section>

      <section className="stat-grid">
        <article className="stat-card">
          <span>Shaker streak</span>
          <strong>{streak} days</strong>
          <small>Recovery days do not break it.</small>
        </article>
        <article className="stat-card">
          <span>Bar Points</span>
          <strong>{progress.points}</strong>
          <small>Earned through speaking work.</small>
        </article>
        <article className="stat-card">
          <span>Recordings</span>
          <strong>{progress.recordings}</strong>
          <small>Saved on this device.</small>
        </article>
      </section>

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
  const [step, setStep] = useState(0);
  const [showVietnamese, setShowVietnamese] = useState(true);
  const [patternChoice, setPatternChoice] = useState(lesson.pattern.options[0]);
  const [shiftEvidenceReady, setShiftEvidenceReady] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const steps = ["Hear it", "Words", "Build it", "Dialogue", "Speak", "Shift mission"];
  const isCompleted = progress.completedLessons.includes(lesson.id);

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
            <div className="card-kicker">03 · BUILD ONE USEFUL SENTENCE</div>
            <p>{lesson.pattern.prompt}</p>
            <div className="pattern-builder">
              <span>{lesson.pattern.lead}</span>
              <select value={patternChoice} onChange={(event) => setPatternChoice(event.target.value)}>
                {lesson.pattern.options.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <span>.</span>
            </div>
            <div className="built-phrase">
              <TranslatableText
                text={`${lesson.pattern.lead} ${patternChoice}.`}
                sentenceTranslation="Chạm hoặc giữ từng từ để xem nghĩa tiếng Việt."
              />
              <button type="button" className="audio-button" onClick={() => speak(`${lesson.pattern.lead} ${patternChoice}.`)}>
                ▶
              </button>
            </div>
            <p className="muted">Say it three times: slowly, naturally, then without looking.</p>
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
              {isCompleted ? "✓ Lesson already completed" : "Complete lesson · +40 BP"}
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
            <button type="button" className="primary-button" onClick={next}>
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
              Your real-shift practice is complete, your streak is protected, and you earned 40 Bar
              Points.
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

function CourseScreen({ progress, onStartLesson }) {
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
            const completedCount = weekLessons.filter((lesson) =>
              progress.completedLessons.includes(lesson.id),
            ).length;
            return (
              <article key={week.week} className="course-week">
                <div className="week-number">{String(week.week).padStart(2, "0")}</div>
                <div>
                  <span>WEEK {week.week}</span>
                  <h2>{week.title}</h2>
                  <p>{week.goal}</p>
                  {weekLessons.length > 0 && (
                    <div className="available-lessons">
                      {weekLessons.map((lesson) => (
                        <button type="button" key={lesson.id} onClick={() => onStartLesson(lesson)}>
                          Day {lesson.day} · {lesson.title}
                          {progress.completedLessons.includes(lesson.id) && " ✓"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`week-status ${weekLessons.length ? "available" : ""}`}>
                  {weekLessons.length ? `${completedCount}/${weekLessons.length} adapted` : "Content QA"}
                </span>
              </article>
            );
          })}
      </section>
    </div>
  );
}

function PracticeScreen() {
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
      <section className="page-heading">
        <div className="eyebrow">PRACTICE LAB · JUDGE MODE</div>
        <h1>Answer under pressure.</h1>
        <p>Thirty seconds to prepare. Ninety seconds to answer. Keep it direct.</p>
      </section>
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
  const streak = calculateStreak(progress.completionDates, profile.recoveryDay);
  const lessonPercent = Math.round((progress.completedLessons.length / starterLessons.length) * 100);
  const milestones = [
    ["First Pour", "Complete your first lesson", progress.completedLessons.length >= 1],
    ["Clear Voice", "Save ten speaking recordings", progress.recordings >= 10],
    ["Smooth Service", "Complete four service lessons", progress.completedLessons.filter((id) => id < 17).length >= 4],
    ["Storyteller", "Complete a competition story lesson", progress.completedLessons.includes(97)],
    ["Judge Ready", "Complete a judge-question lesson", progress.completedLessons.includes(127)],
  ];

  return (
    <div className="screen-stack">
      <section className="page-heading">
        <div className="eyebrow">YOUR LEARNING RECORD</div>
        <h1>Consistency over perfection.</h1>
        <p>Only meaningful speaking work counts toward your streak.</p>
      </section>
      <section className="stat-grid">
        <article className="stat-card featured">
          <span>Current streak</span>
          <strong>{streak} days</strong>
          <small>One completed speaking task per study day.</small>
        </article>
        <article className="stat-card">
          <span>Adapted lessons</span>
          <strong>{progress.completedLessons.length}/{starterLessons.length}</strong>
          <small>{lessonPercent}% of the validated starter set.</small>
        </article>
        <article className="stat-card">
          <span>Voice archive</span>
          <strong>{progress.recordings}</strong>
          <small>Recordings created on this device.</small>
        </article>
      </section>
      <section className="two-column">
        <article className="panel-card">
          <span className="step-label">SKILL SIGNALS</span>
          <div className="skill-bars">
            {[
              ["Service English", Math.min(100, progress.completedLessons.filter((id) => id < 17).length * 25)],
              ["Speaking practice", Math.min(100, progress.recordings * 10)],
              ["Competition", Math.min(100, progress.completedLessons.filter((id) => id >= 97).length * 50)],
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

export default function App() {
  const [profile, setProfile] = useState(() => loadProfile());
  const [progress, setProgress] = useState(() => {
    const current = loadProgress();
    const today = localDateKey();
    if (!current.checkIns.includes(today)) {
      const updated = { ...current, checkIns: [...current.checkIns, today] };
      saveProgress(updated);
      return updated;
    }
    return current;
  });
  const [screen, setScreen] = useState("home");
  const [activeLesson, setActiveLesson] = useState(null);

  function completeProfile(nextProfile) {
    saveProfile(nextProfile);
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
        points: current.points + 40,
      };
    });
  }

  function recordSaved() {
    updateProgress((current) => ({
      ...current,
      recordings: current.recordings + 1,
      points: current.points + 10,
    }));
  }

  function reset() {
    if (!window.confirm("Reset this learner profile and return to onboarding?")) return;
    clearProfile();
    setProfile(null);
    setScreen("home");
    setActiveLesson(null);
  }

  if (!profile) return <Onboarding onComplete={completeProfile} />;

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
            onNavigate={setScreen}
          />
        )}
        {screen === "course" && (
          <CourseScreen progress={progress} onStartLesson={setActiveLesson} />
        )}
        {screen === "practice" && <PracticeScreen />}
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
