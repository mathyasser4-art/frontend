import API_BASE_URL from '../../config/api.config';
import { getDemoData, isDemoMode } from '../../utils/createDemoData';

const URL = `${API_BASE_URL}/teacher/getAssignment`;

const getAssignment = (setLoading, setAllAsignment, setError) => {
    const Token = localStorage.getItem('O_authWEB')
    
    // Check if in trial/demo mode
    if (isDemoMode()) {
        setLoading(true)
        setTimeout(() => {
            const demoData = getDemoData();
            setAllAsignment(demoData.assignments);
            setLoading(false)
        }, 1000); // Simulate API delay
        return;
    }

    // Regular API call
    setLoading(true)
    fetch(URL, {
        method: 'get',
        headers: {
            'Content-Type': 'application/json',
            'authrization': `pracYas09${Token}`
        },
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setLoading(false)
                setAllAsignment(responseJson.allAssignment)
            } else {
                setError(responseJson.message)
                setLoading(false)
            }
        })
        .catch((error) => {
            setError(error.message)
            setLoading(false)
        });
}

export default getAssignment;