# Phone Shutdown Recovery - Implementation TODO

## Step 1: [x] Update `src/pages/assignment/Assignment.js`
- [x] Add localStorage save effect for progress
- [x] Add progress recovery on load
- [x] Add visibilitychange/pagehide listeners for shutdown detection
- [x] Add "Resume Assignment?" dialog UI
- [x] Clear localStorage on successful completion

## Step 2: [x] Update `src/components/timer/Timer.js`
- [x] Save remaining time to localStorage periodically

## Step 3: [x] Update `src/api/student/assignmentDetails.api.js`
- [x] Make `localStorage.removeItem("time")` conditional (only if no saved progress)

## Step 4: [ ] Test & Verify
- [ ] Start assignment, answer questions, simulate shutdown
- [ ] Verify resume dialog appears
- [ ] Verify progress is restored
- [ ] Verify timer is restored
- [ ] Verify completion clears localStorage

