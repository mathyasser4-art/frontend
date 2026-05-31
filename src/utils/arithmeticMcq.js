const __debugHistory = [];

export function getArithmeticMcqDebugHistory() {
  return __debugHistory.slice();
}

export function generateArithmeticMcq(level, optionsCount = 4) {
  const lvl = String(level);
  const ranges = {
    '0': { min: 1, max: 9 },
    '1': { min: 10, max: 99 },
    '2': { min: 100, max: 999 },
    '3': { min: 100, max: 999 },
    easy: { min: 1, max: 9 },
    medium: { min: 10, max: 99 },
    hard: { min: 100, max: 999 },
  };

  const { min, max } = ranges[lvl] || ranges['0'];
  const lastQ = __debugHistory[0];
  const secondLastQ = __debugHistory[1];

  let guardGen = 0;
  let a = 0, b = 0, operator = '+', answer = 0;
  while (guardGen < 30) {
    operator = Math.random() > 0.5 ? '+' : '-';
    a = Math.floor(Math.random() * (max - min + 1)) + min;
    b = Math.floor(Math.random() * (max - min + 1)) + min;

    if (operator === '-' && a < b) {
      const t = a; a = b; b = t;
    }

    answer = operator === '+' ? a + b : a - b;

    // Check history to avoid 3-in-a-row correct answer value
    const lastAns = lastQ ? lastQ.answer : null;
    const secondLastAns = secondLastQ ? secondLastQ.answer : null;

    if (lastAns !== null && secondLastAns !== null && lastAns === secondLastAns && answer === lastAns) {
      guardGen++;
      continue;
    }
    break;
  }

  const text = `${a} ${operator} ${b} = ?`;

  const opts = [answer];
  const spread = lvl === '0' ? 5 : lvl === '1' ? 15 : lvl === '2' ? 30 : 50;
  let guard = 0;
  while (opts.length < optionsCount && guard < 200) {
    guard++;
    const fake = answer + (Math.floor(Math.random() * (spread * 2 + 1)) - spread);
    if (fake < 0) continue;
    if (!opts.includes(fake)) opts.push(fake);
  }
  while (opts.length < optionsCount) opts.push(answer + opts.length + 1);

  // Filter unique incorrect options
  const uniqWrong = Array.from(new Set(opts.filter(o => o !== answer)));
  while (uniqWrong.length < optionsCount - 1) {
    uniqWrong.push(answer + uniqWrong.length + 2);
  }
  const wrongOptions = uniqWrong.slice(0, optionsCount - 1);

  // Choose index for correct answer to prevent 3-in-a-row same position
  const lastCorrectIdx = lastQ ? lastQ.options.indexOf(lastQ.answer) : -1;
  const secondLastCorrectIdx = secondLastQ ? secondLastQ.options.indexOf(secondLastQ.answer) : -1;

  const allIndices = Array.from({ length: optionsCount }, (_, idx) => idx);
  let allowedIndices = allIndices;

  if (lastCorrectIdx !== -1 && secondLastCorrectIdx !== -1 && lastCorrectIdx === secondLastCorrectIdx) {
    allowedIndices = allIndices.filter(idx => idx !== lastCorrectIdx);
  }

  const chosenIndex = allowedIndices[Math.floor(Math.random() * allowedIndices.length)];

  // Assemble choices
  const finalOptions = [];
  let wrongInserted = 0;
  for (let idx = 0; idx < optionsCount; idx++) {
    if (idx === chosenIndex) {
      finalOptions.push(answer);
    } else {
      finalOptions.push(wrongOptions[wrongInserted++]);
    }
  }

  const result = { text, answer, options: finalOptions };

  // #region agent log
  __debugHistory.unshift({ ts: Date.now(), level: lvl, ...result });
  if (__debugHistory.length > 25) __debugHistory.length = 25;
  // #endregion

  return result;
}

