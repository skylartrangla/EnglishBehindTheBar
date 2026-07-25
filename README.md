# English Behind the Bar

A mobile-first, self-study English speaking course for Vietnamese bartenders.

The curriculum is adapted from a 24-week textbook into short interactive lessons
for hospitality, nightlife conversation and bartender competitions.

## Current MVP

- Oceanic-blue responsive interface
- Local learner onboarding and daily check-in
- Speaking-based streaks and Bar Points
- Six-step mobile lesson player
- Normal and slow English text-to-speech
- Five-second mouse-hover and phone touch-and-hold translation
- Local voice and video recording
- Twenty-four-week course map
- Timed bartender-competition judge drills
- Six fully adapted representative lessons

The first release intentionally does not import all 144 textbook lessons. Content
is reviewed and adapted before it enters the course.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run check
npm run build
```

## Data and privacy

The MVP stores the learner profile and progress in browser storage. Audio and
video recordings remain on the learner's device. Cross-device authentication and
cloud progress will be added after the learning experience is validated.
