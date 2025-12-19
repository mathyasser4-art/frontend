import React, { useState, useEffect } from 'react'
import Navbar from '../../components/navbar/Navbar'
import { Link, useParams } from 'react-router-dom'
import DashboardLoading from '../../components/dashboardLoading/DashboardLoading'
import MathInput from "react-math-keyboard";
import '../../reusable.css'
import '../assignmentReport/AssignmentReport.css'
import API_BASE_URL from '../../config/api.config';

function StudentReport() {
  const [allAnswers, setAllAnswers] = useState([])
  const [time, setTime] = useState('')
  const [assignmentData, setAssignmentData] = useState()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(0)
  const { assignmentID } = useParams()
  const isAuth = localStorage.getItem('O_authWEB')
  let number = 1

  useEffect(() => {
    const fetchMyReport = async () => {
      setLoading(true)
      setError(null)
      const Token = localStorage.getItem('O_authWEB')
      
      if (!Token) {
        setError('Please log in to view your report')
        setLoading(false)
        return
      }
      
      try {
        console.log('Fetching report for assignment:', assignmentID)
        const response = await fetch(`${API_BASE_URL}/answer/getMyReport/${assignmentID}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'authrization': `pracYas09${Token}`
          },
        })
        
        console.log('Response status:', response.status)
        console.log('Response headers:', response.headers.get('content-type'))
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Report not found. You may not have completed this assignment yet.')
          } else if (response.status === 401) {
            throw new Error('Authentication failed. Please log in again.')
          } else {
            throw new Error(`Server error: ${response.status}`)
          }
        }
        
        const contentType = response.headers.get("content-type")
        if (!contentType || contentType.indexOf("application/json") === -1) {
          const text = await response.text()
          console.error('Non-JSON response:', text.substring(0, 200))
          throw new Error("Server returned an invalid response. Please try again later.")
        }
        
        const responseJson = await response.json()
        console.log('API Response:', responseJson)
        
        if (responseJson.message === 'success') {
          if (!responseJson.report || !responseJson.report.questions) {
            throw new Error('Invalid report data received')
          }
          
          setAllAnswers(responseJson.report.questions)
          setAssignmentData(responseJson.answers.assignment)
          setTime(responseJson.answers.time)
          
          let calculatedResult = 0
          responseJson.report.questions.forEach(question => {
            if (question.isCorrect) {
              calculatedResult += question.questionPoints
            }
          })
          setResult(calculatedResult)
          setLoading(false)
        } else {
          throw new Error(responseJson.message || 'Failed to load report')
        }
      } catch (error) {
        console.error('Error fetching report:', error)
        setError(error.message || 'Unable to load your report. Please try again later.')
        setLoading(false)
      }
    }
    
    if (isAuth) {
      fetchMyReport()
    } else {
      setError('Please log in to view your report')
      setLoading(false)
    }
  }, [assignmentID, isAuth])

  return (
    <>
      <nav>
        <div className='nav-mobile'>
          <div className='nav-mobile-container d-flex justify-content-space-around align-items-center'>
            <Link to={'/'}><i className="fa fa-home" aria-hidden="true"></i></Link>
            <Link to={'/system/65a4963482dbaac16d820fc6'}><i className="fa fa-tasks link" aria-hidden="true"></i></Link>
            <Link to={'/system/65a4964b82dbaac16d820fc8'}><i className="fa fa-file-text-o link" aria-hidden="true"></i></Link>
            <Link to={'/dashboard/student'}><i className="fa fa-graduation-cap active" aria-hidden="true"></i></Link>
            <Link to={'/contact'}><i className="fa fa-headphones link" aria-hidden="true"></i></Link>
            <Link to={'/user/info'}><i className="fa fa-user link" aria-hidden="true"></i></Link>
          </div>
        </div>
      </nav>
      <Navbar />
      <div className="assignment-report-container">
        {loading ? (
          <DashboardLoading />
        ) : error ? (
          <div className='d-flex justify-content-center flex-direction-column align-items-center' style={{ padding: '40px 20px' }}>
            <div className="error" style={{ marginBottom: '20px', textAlign: 'center' }}>{error}</div>
            <Link to='/dashboard/student'>
              <button className='button'>Back to Dashboard</button>
            </Link>
          </div>
        ) : (
          <div className='assignment-report-body'>
            <h2 className='text-center mb-3'>My Assignment Report</h2>
            
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Question</th>
                  <th>Your Answer</th>
                  <th>Status</th>
                  <th>Points</th>
                </tr>
              </thead>

              <tbody>
                {allAnswers?.map(item => {
                  return (
                    <tr key={item._id}>
                      <td>{number++}</td>
                      <td>
                        <div className='d-flex justify-content-center'>
                          <p className='question-assignment-title'>{item.question}</p>
                        </div>
                      </td>
                      <td>
                        {item.firstAnswer ? (
                          <div className="mcq-answer assignment-report-answer">
                            <div className="mcq-answer-layout">
                              <input className='d-none' type="radio" id="berries_1" value={item.firstAnswer} name="berries" />
                              <MathInput size="small" initialLatex={item.firstAnswer} />
                              <div className="answer-layout"></div>
                            </div>
                          </div>
                        ) : '-'}
                      </td>
                      {item.isCorrect ? (
                        <td className='success'>Correct ✓</td>
                      ) : item.notAnswer ? (
                        <td className='wrong'>Not Answered</td>
                      ) : (
                        <td className='wrong'>Wrong ✗</td>
                      )}
                      <td>
                        {item.isCorrect
                          ? `${item.questionPoints} / ${item.questionPoints}`
                          : `0 / ${item.questionPoints}`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className='d-flex mt-4'>
              <div className="result d-flex align-items-center">
                <h4>Your Score:</h4>
                <p>{result}/{assignmentData?.totalPoints}</p>
              </div>
              <div className="timer d-flex align-items-center">
                <h4>Time Spent:</h4>
                <p>{time || '—'}</p>
              </div>
            </div>

            <div className='d-flex justify-content-center mt-4'>
              <Link to='/dashboard/student'>
                <button className='button'>Back to Dashboard</button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default StudentReport