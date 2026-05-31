import API_BASE_URL from '../../config/api.config';
import { adjustQuestionOrderAndShuffleMCQ } from '../../utils/questionShuffle';

const URL = `${API_BASE_URL}/chapter/getChapterQuestion`;

const getQuestion = (setLoading, setQuestionData, setThisQuestion, setNumberOfQuestion, setThisQuestionNumber, setTotalSummation, chapterID) => {
    setLoading(true)
    fetch(`${URL}/${chapterID}`, {
        method: 'get',
        headers: { 'Content-Type': 'application/json' },
    })
        .then((response) => response.json())
        .then((responseJson) => {
            if (responseJson.message === 'success') {
                setTimeout(() => {
                    setLoading(false)
                }, 2000);
                let allQuestion = responseJson.chapter.questions
                
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
                if (allQuestion.length === 0)
                    setLoading(true)
            } else {
                console.log(responseJson.message)
                setLoading(false)
            }
        })
        .catch((error) => {
            console.log(error.message)
            setLoading(false)
        });
}

export default getQuestion;