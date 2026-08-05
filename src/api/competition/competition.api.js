import API_BASE_URL from '../../config/api.config';

const getHeaders = () => {
    let Token = localStorage.getItem('O_authWEB');
    if (!Token || Token === 'null' || Token === 'undefined') {
        Token = localStorage.getItem('token') || localStorage.getItem('userToken') || localStorage.getItem('auth_token') || '';
    }

    return {
        'Content-Type': 'application/json',
        'authrization': `pracYas09${Token}`
    };
};

const safeJsonFetch = async (url, options) => {
    try {
        const response = await fetch(url, options);
        const data = await response.json();
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
