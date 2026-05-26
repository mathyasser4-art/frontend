import API_BASE_URL from '../../config/api.config';

const getHeaders = () => {
    const Token = localStorage.getItem('O_authWEB');
    return {
        'Content-Type': 'application/json',
        'authrization': `pracYas09${Token}`
    };
};

export const createCompetition = async (data) => {
    const response = await fetch(`${API_BASE_URL}/competition/create`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    return response.json();
};

export const getTeacherCompetitions = async () => {
    const response = await fetch(`${API_BASE_URL}/competition/teacher-list`, {
        method: 'GET',
        headers: getHeaders()
    });
    return response.json();
};

export const getCompetitionDetails = async (competitionId) => {
    const response = await fetch(`${API_BASE_URL}/competition/${competitionId}/details`, {
        method: 'GET',
        headers: getHeaders()
    });
    return response.json();
};

export const joinCompetition = async (competitionId) => {
    const response = await fetch(`${API_BASE_URL}/competition/${competitionId}/join`, {
        method: 'POST',
        headers: getHeaders()
    });
    return response.json();
};

export const startCompetition = async (competitionId) => {
    const response = await fetch(`${API_BASE_URL}/competition/${competitionId}/start`, {
        method: 'POST',
        headers: getHeaders()
    });
    return response.json();
};

export const updateLiveScore = async (competitionId, scoreData) => {
    const response = await fetch(`${API_BASE_URL}/competition/${competitionId}/score`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(scoreData)
    });
    return response.json();
};

export const finishCompetition = async (competitionId) => {
    const response = await fetch(`${API_BASE_URL}/competition/${competitionId}/finish`, {
        method: 'POST',
        headers: getHeaders()
    });
    return response.json();
};
