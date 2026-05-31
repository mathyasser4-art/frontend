/**
 * Robust question and option shuffling utility.
 * Automatically minimizes:
 * 1. Correct choice index repeating 3+ times in a row for MCQ questions.
 * 2. Exact same correct answer repeating 3+ times in a row.
 *
 * @param {Array} questions - Array of question objects fetched from DB.
 * @returns {Array} - The optimized and shuffled array of questions.
 */
export function adjustQuestionOrderAndShuffleMCQ(questions) {
    if (!Array.isArray(questions) || questions.length === 0) return questions;

    const normalize = (val) => String(val !== undefined && val !== null ? val : "").trim();

    // Make a shallow copy of the array so we don't mutate input arguments directly
    const processedQuestions = [...questions];

    // ─────────────────────────────────────────────────────────────────────────
    // PASS 1: Minimize consecutive identical correct answer values (e.g. 3 in a row)
    // We run a bubble-like reordering pass to separate identical answer numbers.
    // ─────────────────────────────────────────────────────────────────────────
    let changed = true;
    let passes = 0;
    while (changed && passes < 5) {
        changed = false;
        passes++;
        for (let i = 0; i < processedQuestions.length - 2; i++) {
            const q1 = processedQuestions[i];
            const q2 = processedQuestions[i + 1];
            const q3 = processedQuestions[i + 2];

            const ans1 = q1.typeOfAnswer === 'MCQ' ? q1.correctAnswer : (q1.typeOfAnswer === 'Graph' ? q1.correctPicAnswer : (q1.answer && q1.answer[0]));
            const ans2 = q2.typeOfAnswer === 'MCQ' ? q2.correctAnswer : (q2.typeOfAnswer === 'Graph' ? q2.correctPicAnswer : (q2.answer && q2.answer[0]));
            const ans3 = q3.typeOfAnswer === 'MCQ' ? q3.correctAnswer : (q3.typeOfAnswer === 'Graph' ? q3.correctPicAnswer : (q3.answer && q3.answer[0]));

            if (ans1 && ans2 && ans3 && normalize(ans1) === normalize(ans2) && normalize(ans2) === normalize(ans3)) {
                // Detected 3 in a row! Let's swap the 3rd question (i + 2) with a future question of different answer
                let swapped = false;
                for (let j = i + 3; j < processedQuestions.length; j++) {
                    const qJ = processedQuestions[j];
                    const ansJ = qJ.typeOfAnswer === 'MCQ' ? qJ.correctAnswer : (qJ.typeOfAnswer === 'Graph' ? qJ.correctPicAnswer : (qJ.answer && qJ.answer[0]));
                    if (ansJ && normalize(ansJ) !== normalize(ans1)) {
                        const temp = processedQuestions[i + 2];
                        processedQuestions[i + 2] = processedQuestions[j];
                        processedQuestions[j] = temp;
                        swapped = true;
                        changed = true;
                        break;
                    }
                }
                // Fallback: If we couldn't swap forward, try to swap with an earlier safe position
                if (!swapped) {
                    for (let j = 0; j < i; j++) {
                        const qJ = processedQuestions[j];
                        const ansJ = qJ.typeOfAnswer === 'MCQ' ? qJ.correctAnswer : (qJ.typeOfAnswer === 'Graph' ? qJ.correctPicAnswer : (qJ.answer && qJ.answer[0]));
                        if (ansJ && normalize(ansJ) !== normalize(ans1)) {
                            const temp = processedQuestions[i + 2];
                            processedQuestions[i + 2] = processedQuestions[j];
                            processedQuestions[j] = temp;
                            changed = true;
                            break;
                        }
                    }
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PASS 2: Shuffle choices dynamically while avoiding repeating correct option
    // index 3 times in a row at the same visual index.
    // ─────────────────────────────────────────────────────────────────────────
    let lastCorrectIdx = -1;
    let secondLastCorrectIdx = -1;

    for (let i = 0; i < processedQuestions.length; i++) {
        const q = processedQuestions[i];

        if (q.typeOfAnswer === 'MCQ' && Array.isArray(q.wrongAnswer) && q.wrongAnswer.length > 0) {
            const correctVal = normalize(q.correctAnswer || "");

            // Extract unique options from wrongAnswer
            let uniqueChoices = Array.from(new Set(q.wrongAnswer.map(normalize)));
            if (!uniqueChoices.includes(correctVal)) {
                uniqueChoices.push(correctVal);
            }

            // Cap at 4 options for a premium grid look
            if (uniqueChoices.length > 4) {
                const incorrects = uniqueChoices.filter(c => c !== correctVal);
                uniqueChoices = [correctVal, ...incorrects.slice(0, 3)];
            }

            const optionsCount = uniqueChoices.length;
            const wrongOptions = uniqueChoices.filter(c => c !== correctVal);

            // Determine allowed indices for correct answer placement
            const allIndices = Array.from({ length: optionsCount }, (_, idx) => idx);
            let allowedIndices = allIndices;

            if (lastCorrectIdx !== -1 && secondLastCorrectIdx !== -1 && lastCorrectIdx === secondLastCorrectIdx) {
                // Exclude the index if it repeated the last two times
                allowedIndices = allIndices.filter(idx => idx !== lastCorrectIdx);
            }

            // Pick index from allowed pool
            const chosenIndex = allowedIndices[Math.floor(Math.random() * allowedIndices.length)];

            // Construct new wrongAnswer array representing shuffled visual choices
            const finalChoices = [];
            let wrongInserted = 0;
            for (let idx = 0; idx < optionsCount; idx++) {
                if (idx === chosenIndex) {
                    finalChoices.push(q.correctAnswer || correctVal);
                } else {
                    finalChoices.push(wrongOptions[wrongInserted++]);
                }
            }

            q.wrongAnswer = finalChoices;

            // Track index history
            secondLastCorrectIdx = lastCorrectIdx;
            lastCorrectIdx = chosenIndex;

        } else if (q.typeOfAnswer === 'Graph' && Array.isArray(q.wrongPicAnswer) && q.wrongPicAnswer.length > 0) {
            const correctVal = normalize(q.correctPicAnswer || "");

            let uniquePics = Array.from(new Set(q.wrongPicAnswer.map(normalize)));
            if (!uniquePics.includes(correctVal)) {
                uniquePics.push(correctVal);
            }

            if (uniquePics.length > 4) {
                const incorrects = uniquePics.filter(c => c !== correctVal);
                uniquePics = [correctVal, ...incorrects.slice(0, 3)];
            }

            const optionsCount = uniquePics.length;
            const wrongPics = uniquePics.filter(c => c !== correctVal);

            const allIndices = Array.from({ length: optionsCount }, (_, idx) => idx);
            let allowedIndices = allIndices;

            if (lastCorrectIdx !== -1 && secondLastCorrectIdx !== -1 && lastCorrectIdx === secondLastCorrectIdx) {
                allowedIndices = allIndices.filter(idx => idx !== lastCorrectIdx);
            }

            const chosenIndex = allowedIndices[Math.floor(Math.random() * allowedIndices.length)];

            const finalChoices = [];
            let wrongInserted = 0;
            for (let idx = 0; idx < optionsCount; idx++) {
                if (idx === chosenIndex) {
                    finalChoices.push(q.correctPicAnswer || correctVal);
                } else {
                    finalChoices.push(wrongPics[wrongInserted++]);
                }
            }

            q.wrongPicAnswer = finalChoices;

            secondLastCorrectIdx = lastCorrectIdx;
            lastCorrectIdx = chosenIndex;
        }
    }

    return processedQuestions;
}
