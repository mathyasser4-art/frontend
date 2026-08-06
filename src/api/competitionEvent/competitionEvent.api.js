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

export const createCompetitionEvent = async (data) => {
    return safeJsonFetch(`${API_BASE_URL}/competition-event/create`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
};

export const getSchoolCompetitionEvents = async () => {
    return safeJsonFetch(`${API_BASE_URL}/competition-event/list`, {
        method: 'GET',
        headers: getHeaders()
    });
};

export const registerStudentsForEvent = async (eventId, studentIds) => {
    return safeJsonFetch(`${API_BASE_URL}/competition-event/${eventId}/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ studentIds })
    });
};

export const updateCompetitionEvent = async (eventId, data) => {
    return safeJsonFetch(`${API_BASE_URL}/competition-event/${eventId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
};

export const deleteCompetitionEvent = async (eventId) => {
    return safeJsonFetch(`${API_BASE_URL}/competition-event/${eventId}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
};
