import API_BASE_URL from '../../config/api.config';

const getAssignmentByClass = (setLoading, setAllAssignment, setError, classID) => {
    const Token = localStorage.getItem('O_authWEB');

    setLoading(true);
    
    const URL = `${API_BASE_URL}/assignment/class/${classID}`;

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
                setLoading(false);
                setAllAssignment(responseJson.allAssignment);
            } else {
                setError(responseJson.message);
                setLoading(false);
            }
        })
        .catch((error) => {
            setError(error.message);
            setLoading(false);
        });
}

export default getAssignmentByClass;
