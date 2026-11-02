import API_BASE_URL from '../../config/api.config';
import { safeLocalStorage } from '../../utils/safeStorage';

const getHeaders = () => {
    let Token = safeLocalStorage.getItem('O_authWEB');
    if (!Token || Token === 'null' || Token === 'undefined') {
        Token = safeLocalStorage.getItem('token') || safeLocalStorage.getItem('userToken') || safeLocalStorage.getItem('auth_token') || '';
    }

    return {
        'Content-Type': 'application/json',
        'authrization': `pracYas09${Token}`
    };
};

const safeJsonFetch = async (url, options) => {
    try {
        const response = await fetch(url, options);
        let data;
        try {
            data = await response.json();
        } catch (parseErr) {
            // e.g. the rate limiter's plain-text "Too many requests" reply
            return { message: response.status === 429 ? "Too many requests, please try again in a moment." : `Unexpected server response (${response.status})`, error: true, httpStatus: response.status };
        }
        if (data && typeof data === 'object' && !Array.isArray(data)) {
            data.httpStatus = response.status;
        }
        return data;
    } catch (err) {
        console.error('API Fetch error:', url, err);
        return { message: "Network request failed. Please check your connection.", error: true };
    }
};

export const createCompetition = async (data) => {
    return safeJsonFetch(`${API_BASE_URL}/competition/create`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
};

export const getTeacherCompetitions = async () => {
    return safeJsonFetch(`${API_BASE_URL}/competition/teacher-list`, {
        method: 'GET',
        headers: getHeaders()
    });
};

export const getCompetitionDetails = async (competitionId) => {
    return safeJsonFetch(`${API_BASE_URL}/competition/${competitionId}/details`, {
        method: 'GET',
        headers: getHeaders()
    });
};

// Lightweight polling fallback: status, timing and whether the requester is still a participant
export const getCompetitionStatus = async (competitionId, studentId = null) => {
    const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
    return safeJsonFetch(`${API_BASE_URL}/competition/${competitionId}/status${query}`, {
        method: 'GET',
        headers: getHeaders()
    });
};

export const joinCompetition = async (competitionId, guestData = null) => {
    return safeJsonFetch(`${API_BASE_URL}/competition/${competitionId}/join`, {
        method: 'POST',
        headers: getHeaders(),
        body: guestData ? JSON.stringify(guestData) : undefined
    });
};

export const startCompetition = async (competitionId) => {
    return safeJsonFetch(`${API_BASE_URL}/competition/${competitionId}/start`, {
        method: 'POST',
        headers: getHeaders()
    });
};

export const updateLiveScore = async (competitionId, scoreData) => {
    return safeJsonFetch(`${API_BASE_URL}/competition/${competitionId}/score`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(scoreData)
    });
};

export const finishCompetition = async (competitionId) => {
    return safeJsonFetch(`${API_BASE_URL}/competition/${competitionId}/finish`, {
        method: 'POST',
        headers: getHeaders()
    });
};

export const removeParticipant = async (competitionId, targetId) => {
    return safeJsonFetch(`${API_BASE_URL}/competition/${competitionId}/remove-participant`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ participantId: targetId, studentId: targetId })
    });
};
