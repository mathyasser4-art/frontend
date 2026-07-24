import API_BASE_URL from '../../config/api.config';
import { adjustQuestionOrderAndShuffleMCQ } from '../../utils/questionShuffle';

const URL = `${API_BASE_URL}/student/assignmentDetails`;


const assignmentDetails = (setLoading, setOperationError, setQuestionData, setThisQuestion, setNumberOfQuestion, setThisQuestionNumber, setTotalSummation, assignmentID, timerCount, setTime, setTotalTime, setAnswer, handleGetResult, navigate, setForceFlashMode, setCurrentAttempt, setTotalAttempts, setRemainingAttempts, setFlashSpeed, setAllowGlitchRetry) => {
    const Token = localStorage.getItem('O_authWEB');

    setLoading(true)
    // Only remove legacy time key if no saved progress exists for this assignment
    // (preserves backward compatibility while supporting phone-shutdown recovery)
    const hasSavedProgress = localStorage.getItem(`assignment_progress_${assignmentID}`);
    if (!hasSavedProgress) {
        localStorage.removeItem("time");
    }
    
    console.log('Fetching assignment details for:', assignmentID)
    console.log('Navigate function available:', !!navigate)
    
    fetch(`${URL}/${assignmentID}`, {
        method: 'get',
        headers: {
            'Content-Type': 'application/json',
            'authrization': `pracYas09${Token}`
        }
    })
        .then((response) => response.json())
        .then((responseJson) => {
            console.log('Assignment details response:', responseJson)
            if (responseJson.message === 'success') {
                setTimeout(() => {
                    setLoading(false)
                }, 2000);
                let allQuestion = responseJson.assignment.questions
                
                // Minimize choice index and answer repetitions, and dynamically randomize MCQ and Graph options
                allQuestion = adjustQuestionOrderAndShuffleMCQ(allQuestion);

                const numbers = []
                let totalSummation = 0
                for (let index = 0; index < allQuestion.length; index++) {
                    numbers.push(index + 1)
                    const element = allQuestion[index];
                    totalSummation += element.questionPoints
                }
                setTotalSummation(totalSummation)
                setQuestionData(allQuestion)
                setThisQuestion(allQuestion[0])
                setNumberOfQuestion(numbers)
                setThisQuestionNumber(1)
                if (allQuestion.length !== 0 && allQuestion[0].questionAnswer)
                    setAnswer(allQuestion[0].questionAnswer);
                if (allQuestion.length === 0)
                    setLoading(true)
                
                // Set force flash mode if the assignment requires it
                console.log('🔍 Backend forceFlashMode:', responseJson.assignment.forceFlashMode);
                console.log('🔍 Backend flashSpeed:', responseJson.assignment.flashSpeed);
                
                if (setForceFlashMode && responseJson.assignment.forceFlashMode) {
                    console.log('✅ Setting force flash mode to TRUE');
                    setForceFlashMode(true);
                } else {
                    console.log('❌ Force flash mode NOT set (backend value:', responseJson.assignment.forceFlashMode, ')');
                }
                
                // Set flash speed if provided
                if (setFlashSpeed && responseJson.assignment.flashSpeed) {
                    console.log('✅ Setting flash speed to:', responseJson.assignment.flashSpeed);
                    setFlashSpeed(responseJson.assignment.flashSpeed);
                } else {
                    console.log('⚠️ Flash speed not provided or using default');
                }
                
                // Set attempt information
                if (setCurrentAttempt && responseJson.assignment.currentAttempt) {
                    setCurrentAttempt(responseJson.assignment.currentAttempt);
                }
                if (setTotalAttempts && responseJson.assignment.totalAttempts) {
                    setTotalAttempts(responseJson.assignment.totalAttempts);
                }
                if (setRemainingAttempts !== undefined && responseJson.assignment.remainingAttempts !== undefined) {
                    setRemainingAttempts(responseJson.assignment.remainingAttempts);
                }
                
                if (responseJson?.assignment.timer && parseInt(responseJson.assignment.timer) > 0) {
                    const timer = parseInt(responseJson.assignment.timer) * 60
                    const time = new Date();
                    time.setSeconds(time.getSeconds() + timer); // Timer in minutes
                    setTotalTime(parseInt(responseJson.assignment.timer))
                    setTimeout(() => {
                        timerCount()
                        setTime(time)
                    }, 2000);
                }
            } else {
                // Assignment already completed, expired, or other error
                console.log('Assignment status:', responseJson.message);
                
                // Check if attempts are expired (assignment already completed)
                // The exact message from backend is: "Oops!!You can't open this assignment, your number of attempts has expired."
                if (responseJson.message && (
                    responseJson.message.includes('attempts has expired') || 
                    responseJson.message.includes("can't open this assignment")
                )) {
                    // Show message that assignment is already completed
                    console.log('Assignment already completed. Showing message...');
                    setLoading(false);
                    setOperationError('This assignment has been completed. You have used all your attempts.');

                    // APPROACH A: Check if previous attempt was a glitch/interrupted attempt
                    if (setAllowGlitchRetry) {
                        const userID = localStorage.getItem('pp_id') || 'unknown';
                        const progressKey = `assignment_progress_${assignmentID}_${userID}`;
                        const hadSavedProgress = !!localStorage.getItem(progressKey) || !!localStorage.getItem(`assignment_progress_${assignmentID}`);

                        fetch(`${API_BASE_URL}/answer/getResult/${assignmentID}`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'authrization': `pracYas09${Token}`
                            }
                        })
                        .then(res => res.json())
                        .then(resultJson => {
                            if (resultJson.message === 'success') {
                                const res = resultJson.result || {};
                                const questionsAns = parseInt(res.questionsNumber || 0);
                                const totalScore = parseInt(res.total || 0);
                                const timeStr = String(res.time || '0:00');
                                const isZeroTime = timeStr === '0:00' || timeStr === '0:01' || timeStr === '0:02' || timeStr === '0:03' || timeStr === '0:05';
                                
                                if (questionsAns === 0 || totalScore === 0 || isZeroTime || hadSavedProgress) {
                                    console.log('🔄 Glitch attempt detected (0 questions/instant exit/interrupted). Enabling auto-retry!');
                                    setAllowGlitchRetry(true);
                                } else {
                                    setAllowGlitchRetry(false);
                                }
                            } else {
                                // If result not found or error, enable retry if progress existed or as fallback
                                setAllowGlitchRetry(true);
                            }
                        })
                        .catch(err => {
                            setAllowGlitchRetry(true);
                        });
                    }
                } else if (responseJson.message && responseJson.message.toLowerCase().includes('expired')) {
                    // Assignment time period has expired (different from attempts expired)
                    setLoading(false);
                    setOperationError(responseJson.message);
                } else {
                    // Other errors
                    setLoading(false);
                    setOperationError(responseJson.message || 'Unable to load assignment');
                }
            }
        })
        .catch((error) => {
            console.log('Error fetching assignment:', error.message);
            setLoading(false);
            setOperationError('Unable to load assignment. Please check your internet connection and try again.');
        });
}

export default assignmentDetails;