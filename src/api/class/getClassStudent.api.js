import API_BASE_URL from '../../config/api.config';
import { createDemoStudents, isDemoMode } from '../../utils/createDemoData';

const URL = `${API_BASE_URL}/class/getStudent`;

const getClassStudent = (setStudentLoading, setClassStudent, classID, setNoStudent) => {
    const Token = localStorage.getItem('O_authWEB')
    
    // Check if requesting demo class students
    if (isDemoMode() && classID.startsWith('demo-class-')) {
        setStudentLoading(true)
        setTimeout(() => {
            const demoStudents = createDemoStudents(classID);
            setClassStudent(demoStudents);
            setNoStudent(demoStudents.length === 0);
            setStudentLoading(false)
        }, 800); // Simulate API delay
        return;
    }

    // Regular API call
    setStudentLoading(true)
    fetch(`${URL}/${classID}`, {
        method: 'get',
        headers: {
            'Content-Type': 'application/json',
            'authrization': `pracYas09${Token}`
        },
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setStudentLoading(false)
                setNoStudent(false)
                setClassStudent(responseJson.allStudent)
            } else {
                console.log(responseJson.message)
                setStudentLoading(false)
                setNoStudent(true)
            }
        })
        .catch((error) => {
            console.log(error.message)
            setStudentLoading(false)
            setNoStudent(true)
        });
}

export default getClassStudent;