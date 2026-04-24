# Phone Shutdown During Assignment - Analysis & Recovery Plan

## Current Behavior (What Happens Now)

When a student's phone shuts down during an assignment, the following occurs:

1. **All progress is lost** — Assignment answers exist only in React state (`questionData` in memory). There is **no** localStorage, sessionStorage, or backend recovery mechanism.

2. **Attempt is consumed without score** — The backend increments `attempts` when the student *opens* the assignment. If the phone shuts down before `handleGetResult()` / `getResult()` is called, the student loses the attempt but gets **no score recorded**.

3. **Timer resets completely** — The timer is initialized from the backend's full duration on every load. No elapsed time is preserved.

4. **`beforeunload` warning is useless for phone shutdown** — The code shows a warning on browser close/refresh, but this **never triggers** on phone battery death, OS kill, or accidental shutdown.

5. **Background sync is incomplete** — `syncAnswerWithBackend` fires only for MCQ/Graph answers on selection. Essay answers are only saved on "Next" click. The student's **current question index**, **remaining time**, and **current unsaved answer** are never persisted.

6. **Known backend attempts bug** — The backend incorrectly sets `attempts = attemptsNumber` on finish, which can block students from re-attempting even when they should have attempts left.

---

## Root Cause

The frontend has **zero state persistence** for in-progress assignments. Everything lives in ephemeral React state:
- `questionData` — lost on shutdown
- `thisQuestionNumber` — lost on shutdown  
- `answer` (current input) — lost on shutdown
- `time` (timer expiry) — lost on shutdown
- Background-synced answers — only partially saved to backend

---

## Comprehensive Fix Plan

### Fix 1: Auto-save progress to localStorage
**File:** `src/pages/assignment/Assignment.js`

Add a `useEffect` that saves progress whenever key state changes:
- `questionData` (all questions + answers)
- `thisQuestionNumber`
- `answer` (current input)
- `time` (remaining timer expiry)
- `totalTime`
- Timestamp

### Fix 2: Recover progress on load
**Files:** `src/pages/assignment/Assignment.js`, `src/api/student/assignmentDetails.api.js`

After loading assignment details, check for saved progress in localStorage:
- If recent (within 24h), restore question data, current question index, answer input
- Restore timer from saved remaining time
- If timer already expired, auto-submit with elapsed time

### Fix 3: Persist timer state
**Files:** `src/components/timer/Timer.js`, `src/pages/assignment/Assignment.js`

Save remaining time to localStorage every 5 seconds. Restore on reload.

### Fix 4: Detect shutdown / app kill / backgrounding
**File:** `src/pages/assignment/Assignment.js`

Add `visibilitychange` and `pagehide` event listeners:
- When `document.visibilityState === 'hidden'`, aggressively save state
- Use `navigator.sendBeacon` for reliable submission if browser is closing
- Auto-submit if student has answered at least one question

### Fix 5: Add "Resume Assignment?" dialog
**File:** `src/pages/assignment/Assignment.js`

If saved progress is detected on load, show a modal:
- "You have unsaved progress on this assignment (Question X of Y)"
- [Resume] button — restores progress
- [Start Fresh] button — discards saved progress

### Fix 6: Backend fixes (if accessible)
- Track `isCompleted` separately from `attempts`
- Increment `attempts` only on successful `getResult`, OR
- Provide a resume endpoint that returns partial progress

---

## Files to Edit

| File | Changes |
|------|---------|
| `src/pages/assignment/Assignment.js` | Add save/recovery effects, resume dialog, visibility listeners |
| `src/components/timer/Timer.js` | Add periodic localStorage save of remaining time |
| `src/api/student/assignmentDetails.api.js` | Make `localStorage.removeItem("time")` conditional |

---

## Testing Steps

1. Start an assignment, answer a few questions
2. Force-close the browser / simulate phone shutdown
3. Reopen the assignment
4. Verify "Resume?" dialog appears
5. Click Resume — verify question index, answers, and timer are restored
6. Complete the assignment — verify score is saved correctly
7. Verify localStorage is cleaned after successful completion

