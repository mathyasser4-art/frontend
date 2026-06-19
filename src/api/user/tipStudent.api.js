import API_BASE_URL from '../../config/api.config';

const tipStudent = async (studentId, amount) => {
    try {
        const token = localStorage.getItem('O_authWEB');
        const response = await fetch(`${API_BASE_URL}/user/tipStudent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authrization': `Berear ${token}`
            },
            body: JSON.stringify({ studentId, amount })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error tipping student:', error);
        return { message: error.message };
    }
};

export default tipStudent;
