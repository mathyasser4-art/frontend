import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { renderLatexInHtml } from './latexRenderer';

/**
 * Helper to determine MCQ answer letter (A, B, C, D) and formatted answer text
 */
const getMcqAnswerInfo = (q) => {
  let choices = (q.choices && q.choices.length > 0) ? q.choices : (q.wrongAnswer || []);
  choices = choices.filter(c => c !== null && c !== undefined && String(c).trim() !== '');
  
  if (q.correctAnswer && !choices.some(c => String(c).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase())) {
    choices = [q.correctAnswer, ...choices];
  }
  choices = Array.from(new Set(choices)).slice(0, 4);

  const cleanCorrect = String(q.correctAnswer || (Array.isArray(q.answer) ? q.answer[0] : q.answer) || '').trim().toLowerCase();
  let letter = '';
  let answerText = String(q.correctAnswer || (Array.isArray(q.answer) ? q.answer.join(', ') : q.answer) || 'N/A');

  const matchIdx = choices.findIndex(c => String(c).trim().toLowerCase() === cleanCorrect);
  if (matchIdx !== -1) {
    letter = String.fromCharCode(65 + matchIdx);
  }

  return { choices, letter, answerText };
};

/**
 * Exports a full Practice Exam as a clean, professionally formatted PDF.
 * Strictly guarantees EVERY QUESTION IS ON ITS OWN PAGE, ending with a Teacher Answer Key page.
 *
 * @param {Object} options
 * @param {Array} options.questions - Array of question objects from questionData
 * @param {string} options.examTitle - Name of chapter or practice exam
 * @param {string} options.teacherName - Teacher name (defaults to Mr. Shahin)
 * @param {Function} options.onProgress - Optional progress callback ({ current, total, message })
 */
export const exportPracticeExamPdf = async ({
  questions = [],
  examTitle = 'SAT Practice Exam',
  teacherName = 'Mr. Shahin',
  onProgress = () => {}
}) => {
  if (!questions || questions.length === 0) {
    alert('No questions available in this practice exam to download.');
    return false;
  }

  const totalQuestions = questions.length;
  const totalPages = totalQuestions + 1; // questions + 1 Answer Key page
  const cleanTitle = (examTitle || 'SAT Practice Exam').trim();

  // Create overlay container on body (offscreen)
  const renderContainer = document.createElement('div');
  renderContainer.id = 'practice-exam-pdf-render-root';
  renderContainer.style.position = 'fixed';
  renderContainer.style.left = '-9999px';
  renderContainer.style.top = '0';
  renderContainer.style.width = '794px'; // Standard A4 width at 96 DPI
  renderContainer.style.zIndex = '-9999';
  document.body.appendChild(renderContainer);

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    const pdfWidth = 210;
    const pdfHeight = 297;

    // Helper: wait for all images inside an element to load
    const waitForImages = async (element) => {
      const imgElements = Array.from(element.querySelectorAll('img'));
      await Promise.all(imgElements.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
          setTimeout(resolve, 2500); // 2.5s safety timeout
        });
      }));
      // Brief pause for layout/KaTeX formulas to settle
      await new Promise(res => setTimeout(res, 60));
    };

    // -------------------------------------------------------------
    // STEP 1: RENDER EACH QUESTION ON ITS OWN DISTINCT A4 PAGE
    // -------------------------------------------------------------
    for (let i = 0; i < totalQuestions; i++) {
      const q = questions[i];
      const qNum = i + 1;
      const qPoints = q.questionPoints || 1;
      const qType = q.typeOfAnswer || 'MCQ';

      onProgress({
        current: qNum,
        total: totalPages,
        message: `Rendering Question ${qNum} of ${totalQuestions}...`
      });

      // Clear container
      renderContainer.innerHTML = '';

      // Build dedicated A4 Question Page element
      const pageEl = document.createElement('div');
      pageEl.className = 'pdf-exam-single-page';
      pageEl.style.width = '794px';
      pageEl.style.minHeight = '1123px'; // Standard A4 height at 96 DPI
      pageEl.style.height = '1123px';
      pageEl.style.boxSizing = 'border-box';
      pageEl.style.padding = '36px 42px';
      pageEl.style.backgroundColor = '#ffffff';
      pageEl.style.color = '#0f172a';
      pageEl.style.fontFamily = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      pageEl.style.display = 'flex';
      pageEl.style.flexDirection = 'column';
      pageEl.style.justifyContent = 'space-between';
      pageEl.style.overflow = 'hidden';

      // Choices or Response Section HTML
      let responseSectionHtml = '';
      if (qType === 'MCQ') {
        const { choices } = getMcqAnswerInfo(q);
        responseSectionHtml = `
          <div style="margin-top: 14px; margin-bottom: 12px;">
            ${choices.map((opt, oIdx) => {
              const letter = String.fromCharCode(65 + oIdx);
              return `
                <div style="display: flex; align-items: center; gap: 12px; padding: 9px 14px; border: 1.5px solid #cbd5e1; border-radius: 8px; background: #f8fafc; margin-bottom: 8px;">
                  <div style="width: 28px; height: 28px; min-width: 28px; border-radius: 50%; border: 1.5px solid #64748b; background: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; color: #1e293b;">
                    ${letter}
                  </div>
                  <div class="question-html-clean" style="font-size: 13.5px; color: #334155; line-height: 1.4; flex-grow: 1;">
                    ${renderLatexInHtml(opt)}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      } else if (qType === 'Essay') {
        responseSectionHtml = `
          <div style="margin-top: 14px; margin-bottom: 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; background: #f8fafc; padding: 14px 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 12px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px;">
                STUDENT-PRODUCED RESPONSE (SPR)
              </span>
              <span style="font-size: 11px; color: #64748b;">
                Integers, fractions, or decimals
              </span>
            </div>
            <div style="font-size: 13px; color: #475569; margin-bottom: 10px;">
              Write your final answer in the response box below:
            </div>
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="width: 200px; height: 42px; border: 2px solid #2563eb; border-radius: 6px; background: #ffffff; display: flex; align-items: center; padding: 0 12px; font-weight: 700; font-size: 16px; color: #0f172a;">
                &nbsp;
              </div>
              <div style="font-size: 11.5px; color: #64748b; line-height: 1.3;">
                Fill in completely. No negative fractions on standard SAT grid.
              </div>
            </div>
          </div>
        `;
      } else if (qType === 'Graph') {
        const pics = (q.wrongPicAnswer || []).slice(0, 4);
        responseSectionHtml = `
          <div style="margin-top: 14px; margin-bottom: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            ${pics.map((pic, pIdx) => {
              const letter = String.fromCharCode(65 + pIdx);
              return `
                <div style="border: 1.5px solid #cbd5e1; border-radius: 8px; background: #f8fafc; padding: 8px; text-align: center;">
                  <div style="font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">Choice ${letter}</div>
                  <img src="${pic}" alt="Graph Choice ${letter}" style="max-height: 140px; max-width: 100%; border-radius: 4px; object-fit: contain; margin: 0 auto;" crossorigin="anonymous" />
                </div>
              `;
            }).join('')}
          </div>
        `;
      }

      // Diagram / Question Pic
      const diagramHtml = q.questionPic ? `
        <div style="text-align: center; margin-bottom: 14px;">
          <img src="${q.questionPic}" alt="Question diagram" style="max-height: 220px; max-width: 100%; border-radius: 6px; border: 1px solid #e2e8f0; object-fit: contain; margin: 0 auto; display: block;" crossorigin="anonymous" />
        </div>
      ` : '';

      pageEl.innerHTML = `
        <!-- Header Bar -->
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="font-size: 16px; font-weight: 900; color: #1e1b4b; letter-spacing: 0.5px;">MR. SHAHIN</span>
                <span style="font-size: 11px; font-weight: 700; background: #eff6ff; color: #2563eb; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">
                  SAT School Official
                </span>
              </div>
              <h2 style="font-size: 15px; font-weight: 700; color: #1e293b; margin: 0;">
                ${cleanTitle}
              </h2>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="background: #2563eb; color: #ffffff; font-weight: 800; font-size: 12px; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.3px;">
                  QUESTION ${qNum} OF ${totalQuestions}
                </span>
                <span style="background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; font-weight: 700; font-size: 11px; padding: 4px 8px; border-radius: 20px;">
                  ${qPoints} ${qPoints === 1 ? 'Pt' : 'Pts'}
                </span>
              </div>
              <span style="font-size: 11px; color: #64748b; font-weight: 500;">
                Standard Time: 35 Min • Module 1
              </span>
            </div>
          </div>
        </div>

        <!-- Middle: Question Stem + Choices/Response -->
        <div style="flex: 1 0 auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
              QUESTION ${qNum}
            </span>
            <span style="font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase;">
              ${qType === 'Essay' ? 'Student-Produced Response' : qType === 'Graph' ? 'Graph Analysis' : 'Multiple Choice'}
            </span>
          </div>

          ${diagramHtml}

          <div class="question-html-clean" style="font-size: 14.5px; line-height: 1.6; color: #0f172a; margin-bottom: 12px;">
            ${renderLatexInHtml(q.question || '')}
          </div>

          ${responseSectionHtml}
        </div>

        <!-- Student Workspace / Scratchpad Area -->
        <div style="margin-top: 12px; margin-bottom: 14px; border: 1.5px dashed #cbd5e1; border-radius: 8px; background: #fafafa; padding: 10px 14px; min-height: 130px; display: flex; flex-direction: column; justify-content: flex-start;">
          <span style="font-size: 10.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
            Workspace / Scratchpad (Show Calculations & Working)
          </span>
        </div>

        <!-- Page Footer -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #64748b;">
          <div>
            <strong>Mr. Shahin SAT System</strong> • Official Examination Practice
          </div>
          <div style="text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; color: #94a3b8;">
            Confidential Test Material
          </div>
          <div>
            <strong>Page ${qNum}</strong> of ${totalPages}
          </div>
        </div>
      `;

      renderContainer.appendChild(pageEl);

      // Wait for images and formulas
      await waitForImages(pageEl);

      // Rasterize to high-DPI canvas
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }

    // -------------------------------------------------------------
    // STEP 2: RENDER TEACHER ANSWER KEY PAGE AS THE FINAL PAGE
    // -------------------------------------------------------------
    onProgress({
      current: totalPages,
      total: totalPages,
      message: 'Generating Teacher Answer Key Page...'
    });

    renderContainer.innerHTML = '';

    const answerKeyEl = document.createElement('div');
    answerKeyEl.className = 'pdf-exam-single-page';
    answerKeyEl.style.width = '794px';
    answerKeyEl.style.minHeight = '1123px';
    answerKeyEl.style.height = '1123px';
    answerKeyEl.style.boxSizing = 'border-box';
    answerKeyEl.style.padding = '36px 42px';
    answerKeyEl.style.backgroundColor = '#ffffff';
    answerKeyEl.style.color = '#0f172a';
    answerKeyEl.style.fontFamily = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    answerKeyEl.style.display = 'flex';
    answerKeyEl.style.flexDirection = 'column';
    answerKeyEl.style.justifyContent = 'space-between';
    answerKeyEl.style.overflow = 'hidden';

    const totalPoints = questions.reduce((sum, q) => sum + (q.questionPoints || 1), 0);

    answerKeyEl.innerHTML = `
      <!-- Header Bar -->
      <div style="border-bottom: 2px solid #7c3aed; padding-bottom: 12px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="font-size: 16px; font-weight: 900; color: #1e1b4b; letter-spacing: 0.5px;">MR. SHAHIN</span>
              <span style="font-size: 11px; font-weight: 700; background: #f3e8ff; color: #7c3aed; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">
                Teacher Copy
              </span>
            </div>
            <h2 style="font-size: 18px; font-weight: 800; color: #1e293b; margin: 0;">
              Official Answer Key & Solutions Guide
            </h2>
            <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0;">
              Exam Title: <strong>${cleanTitle}</strong>
            </p>
          </div>
          <div style="text-align: right;">
            <span style="display: inline-block; background: #7c3aed; color: #ffffff; font-weight: 700; padding: 4px 12px; border-radius: 20px; font-size: 12px;">
              ANSWER KEY
            </span>
            <p style="font-size: 11px; color: #94a3b8; margin: 4px 0 0 0;">
              Instructor: ${teacherName}
            </p>
          </div>
        </div>
      </div>

      <!-- Exam Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center;">
          <span style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Total Questions</span>
          <h4 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 2px 0 0 0;">${totalQuestions}</h4>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center;">
          <span style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Total Points</span>
          <h4 style="font-size: 18px; font-weight: 800; color: #2563eb; margin: 2px 0 0 0;">${totalPoints}</h4>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center;">
          <span style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Allocated Time</span>
          <h4 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 2px 0 0 0;">35 Min</h4>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center;">
          <span style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Generated Date</span>
          <h4 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 4px 0 0 0;">${new Date().toLocaleDateString()}</h4>
        </div>
      </div>

      <!-- Structured Answers Table -->
      <div style="flex: 1 0 auto; overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
              <th style="padding: 8px 10px; font-weight: 700; color: #1e293b; width: 60px;">Q#</th>
              <th style="padding: 8px 10px; font-weight: 700; color: #1e293b; width: 100px;">Type</th>
              <th style="padding: 8px 10px; font-weight: 700; color: #1e293b;">Official Correct Answer / Solution</th>
              <th style="padding: 8px 10px; font-weight: 700; color: #1e293b; width: 70px; text-align: right;">Points</th>
            </tr>
          </thead>
          <tbody>
            ${questions.map((q, idx) => {
              const qNum = idx + 1;
              const qType = q.typeOfAnswer || 'MCQ';
              const pts = q.questionPoints || 1;
              let answerDisplay = '';

              if (qType === 'MCQ') {
                const { letter, answerText } = getMcqAnswerInfo(q);
                answerDisplay = letter ? `<strong>Choice ${letter}</strong> (${answerText})` : `<strong>${answerText}</strong>`;
              } else if (qType === 'Essay') {
                const ans = q.correctAnswer || (Array.isArray(q.answer) ? q.answer.join(', ') : q.answer) || 'Recorded in system';
                answerDisplay = `<strong>${ans}</strong>`;
              } else if (qType === 'Graph') {
                answerDisplay = q.correctPicAnswer ? `<span>Graph Choice Verified</span>` : `<span>Refer to Graph key</span>`;
              } else {
                answerDisplay = `<strong>${q.correctAnswer || 'Verified'}</strong>`;
              }

              return `
                <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                  <td style="padding: 7px 10px; font-weight: 700; color: #2563eb;">#${qNum}</td>
                  <td style="padding: 7px 10px; color: #64748b; font-size: 11.5px;">${qType}</td>
                  <td style="padding: 7px 10px; color: #1e293b;">${answerDisplay}</td>
                  <td style="padding: 7px 10px; text-align: right; font-weight: 600; color: #475569;">${pts} pt</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #64748b; margin-top: 14px;">
        <div>
          <strong>Mr. Shahin Educational System</strong> • SAT School Teacher Copy
        </div>
        <div style="text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; color: #7c3aed;">
          Confidential • Teacher Reference Guide
        </div>
        <div>
          <strong>Page ${totalPages}</strong> of ${totalPages}
        </div>
      </div>
    `;

    renderContainer.appendChild(answerKeyEl);
    await waitForImages(answerKeyEl);

    const keyCanvas = await html2canvas(answerKeyEl, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    const keyImgData = keyCanvas.toDataURL('image/jpeg', 0.95);
    pdf.addPage('a4', 'portrait');
    pdf.addImage(keyImgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    // Save and download
    const sanitizedFileName = cleanTitle.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_');
    const fileName = `${sanitizedFileName}_SAT_Practice_Exam.pdf`;
    pdf.save(fileName);

    onProgress({
      current: totalPages,
      total: totalPages,
      message: 'PDF Download Completed Successfully!'
    });

    return true;
  } catch (err) {
    console.error('Error generating practice exam PDF:', err);
    alert('Failed to generate practice exam PDF. Please try again.');
    return false;
  } finally {
    // Clean up offscreen container
    if (renderContainer && renderContainer.parentNode) {
      renderContainer.parentNode.removeChild(renderContainer);
    }
  }
};

export default exportPracticeExamPdf;
