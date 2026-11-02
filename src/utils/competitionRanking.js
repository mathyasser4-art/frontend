// Single source of truth for competition rankings on the frontend.
// MUST stay in sync with rankParticipants() in the backend competition controller:
//  1. more correct answers
//  2. earlier finish time (students without a finish time come last)
//  3. fewer wrong answers
//  4. more questions answered
//  5. joined the lobby earlier
// Once a competition is finished the server freezes `rank` / `finalRank` on every
// participant; those are used as-is so the podium, the table, certificates, badges
// and the coins the server awarded always agree.

const finishMs = (p) => (p && p.finishedAt ? new Date(p.finishedAt).getTime() : Number.POSITIVE_INFINITY);
const answeredCount = (p) => Math.max(p?.totalAnswered || 0, p?.answers?.length || 0);
const joinedMs = (p) => (p && p.joinedAt ? new Date(p.joinedAt).getTime() : 0);

export const compareParticipants = (a, b) => {
    if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
    const ta = finishMs(a);
    const tb = finishMs(b);
    if (ta !== tb) return ta < tb ? -1 : 1;
    if ((a.wrongAnswers || 0) !== (b.wrongAnswers || 0)) return (a.wrongAnswers || 0) - (b.wrongAnswers || 0);
    if (answeredCount(b) !== answeredCount(a)) return answeredCount(b) - answeredCount(a);
    return joinedMs(a) - joinedMs(b);
};

const serverRankOf = (p, useFinal) => {
    if (useFinal && Number.isFinite(p?.finalRank)) return p.finalRank;
    return Number.isFinite(p?.rank) ? p.rank : null;
};

/**
 * Returns a new array of participants in ranking order, each with a `displayRank`.
 * @param {Array} participants
 * @param {boolean} isFinished - when true, the server's frozen final ranks win
 */
export const sortParticipants = (participants, isFinished = false) => {
    const list = Array.isArray(participants) ? participants.filter(Boolean) : [];
    const allHaveServerRank = isFinished && list.length > 0 && list.every(p => serverRankOf(p, true) !== null);

    const sorted = allHaveServerRank
        ? [...list].sort((a, b) => serverRankOf(a, true) - serverRankOf(b, true))
        : list.map((p, index) => ({ p, index }))
            .sort((x, y) => compareParticipants(x.p, y.p) || x.index - y.index)
            .map(entry => entry.p);

    return sorted.map((p, idx) => ({ ...p, displayRank: allHaveServerRank ? serverRankOf(p, true) : idx + 1 }));
};

// Podium spots / certificates / medals only go to students who actually scored
// (the server awards coins the same way).
export const isPodiumEligible = (p) => (p?.score || 0) > 0;

export const formatElapsedMs = (finishedAt, startedAt, withRawMs = false) => {
    if (!finishedAt || !startedAt) return "—";
    const diffMs = new Date(finishedAt) - new Date(startedAt);
    if (!Number.isFinite(diffMs) || diffMs < 0) return "—";

    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    const ms = diffMs % 1000;

    let formatted = mins > 0 ? `${mins}min ` : "";
    formatted += `${secs}s ${ms}ms`;
    return withRawMs ? `${formatted} (${diffMs.toLocaleString()} ms)` : formatted;
};
