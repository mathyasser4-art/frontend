import axios from "axios";

const getAssignmentByClass = async (setLoading, setAllAssignment, setError, classID) => {
    try {
        setLoading(true);
        const token = localStorage.getItem('O_authWEB');
        const { data } = await axios.get(`http://localhost:5000/assignment/class/${classID}`, {
            headers: {
                token: `abacus__${token}`
            }
        });
        
        if (data.message === 'success') {
            setAllAssignment(data.allAssignment);
        } else {
            setError(data.message);
        }
    } catch (error) {
        setError(error.response?.data?.message || 'Failed to fetch assignments');
    } finally {
        setLoading(false);
    }
}

export default getAssignmentByClass;
