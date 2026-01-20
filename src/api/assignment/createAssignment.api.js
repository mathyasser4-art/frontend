import API_BASE_URL from '../../config/api.config';
import { getDemoData, isDemoMode } from '../../utils/createDemoData';

const URL = `${API_BASE_URL}/assignment/createAssignment`;

const createAssignment = (data, setError, setLoadingOperation, setPocketNumber, setQuestionList, closeQuestionList, setTimer, setAttempts, setExpiryData, setStartDate, setTitle, setClassesBox) => {
    const Token = localStorage.getItem('O_authWEB')
    
    // Handle demo mode - save to localStorage
    if (isDemoMode()) {
        setLoadingOperation(true)
        setTimeout(() => {
            // Get existing demo data
            const demoData = getDemoData();
            
            // Create new assignment with demo ID
            const newAssignment = {
                ...data,
                _id: `demo-assignment-${Date.now()}`,
                isDemoAssignment: true,
                createdAt: new Date().toISOString()
            };
            
            // Add to assignments list
            demoData.assignments.push(newAssignment);
            
            // Save back to localStorage
            localStorage.setItem('demo_data', JSON.stringify(demoData));
            
            // Reset form
            setLoadingOperation(false)
            setPocketNumber(0)
            setQuestionList([])
            setTimer('')
            setAttempts('')
            setExpiryData('')
            setStartDate('')
            setTitle('')
            setClassesBox([])
            closeQuestionList()
            localStorage.removeItem('cartona')
        }, 1000);
        return;
    }

    // Regular API call
    setLoadingOperation(true)
    fetch(`${URL}`, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'authrization': `pracYas09${Token}`
        },
        body: JSON.stringify(data)
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setLoadingOperation(false)
                setPocketNumber(0)
                setQuestionList([])
                setTimer('')
                setAttempts('')
                setExpiryData('')
                setStartDate('')
                setTitle('')
                setClassesBox([])
                closeQuestionList()
                localStorage.removeItem('cartona')
            } else {
                setError(responseJson.message)
                setLoadingOperation(false)
            }
        })
        .catch((error) => {
            setError(error.message)
            setLoadingOperation(false)
        });
}

export default createAssignment;