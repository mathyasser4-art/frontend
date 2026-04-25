import API_BASE_URL from '../../config/api.config';

const getGameQuestionsByLevel = async (level) => {
    try {
        // Construct the expected backend endpoint for fetching questions by level
        const URL = `${API_BASE_URL}/questions/level/${level}`;
        
        const response = await fetch(URL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        const responseJson = await response.json();

        if (responseJson.message === 'success' && responseJson.questions) {
            return responseJson.questions;
        } else {
            console.warn(`API returned failure or no questions for level ${level}. Falling back to auto-generation.`);
            return null;
        }
    } catch (error) {
        console.warn(`Failed to fetch custom questions for level ${level}. Backend API might not be implemented yet. Falling back to auto-generation. Error:`, error.message);
        return null;
    }
};

export default getGameQuestionsByLevel;
