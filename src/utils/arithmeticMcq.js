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
  const operator = Math.random() > 0.5 ? '+' : '-';
  let a = Math.floor(Math.random() * (max - min + 1)) + min;
  let b = Math.floor(Math.random() * (max - min + 1)) + min;

  if (operator === '-' && a < b) {
    const t = a; a = b; b = t;
  }

  const answer = operator === '+' ? a + b : a - b;
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

  opts.sort(() => Math.random() - 0.5);
  // Defensive: ensure answer is present and options are unique
  const uniq = Array.from(new Set(opts));
  while (uniq.length < optionsCount) uniq.push(answer + uniq.length + 1);
  const finalOptions = uniq.slice(0, optionsCount).sort(() => Math.random() - 0.5);
  const result = { text, answer, options: finalOptions };

  // #region agent log
  __debugHistory.unshift({ ts: Date.now(), level: lvl, ...result });
  if (__debugHistory.length > 25) __debugHistory.length = 25;
  // #endregion

  return result;
}

