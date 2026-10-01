import React, { useState, useEffect, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { renderLatexInHtml } from '../../utils/latexRenderer';
import './QuestionPdfNoter.css';

const PALETTE_COLORS = [
  { name: 'Red', hex: '#dc2626' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Green', hex: '#16a34a' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Orange', hex: '#ea580c' },
  { name: 'Purple', hex: '#9333ea' },
  { name: 'Black', hex: '#0f172a' },
  { name: 'White', hex: '#ffffff' },
];

/**
 * QuestionPdfNoterModal
 * Interactive Overlay Drawing & Solution Noter for Teachers
 */
const QuestionPdfNoterModal = ({
  question,
  questionIndex = 0,
  examTitle = 'Question',
  onClose,
  onSaveToBox,
  onOpenBox,
  savedNotesCount = 0
}) => {
  const canvasRef = useRef(null);
  const workspaceRef = useRef(null);

  // Drawing tools & state
  const [activeTool, setActiveTool] = useState('pen'); // 'pen' | 'line' | 'arrow' | 'rect' | 'circle' | 'eraser'
  const [selectedColor, setSelectedColor] = useState('#dc2626'); // Red by default
  const [lineWidth, setLineWidth] = useState(3);
  const [strokes, setStrokes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState('');

  // Resize canvas to match workspace scroll dimensions accurately so strokes are never cut off
  const syncCanvasDimensions = useCallback(() => {
    const canvas = canvasRef.current;
    const workspace = workspaceRef.current;
    if (!canvas || !workspace) return;

    // Use full scroll dimensions of the workspace content so drawing extends to the bottom
    const contentWidth = Math.max(workspace.scrollWidth, workspace.offsetWidth, 750);
    const contentHeight = Math.max(workspace.scrollHeight, workspace.offsetHeight, 900);
    const dpr = Math.max(window.devicePixelRatio || 1, 2); // Ensure at least 2x DPR for crisp strokes

    const newWidth = Math.round(contentWidth * dpr);
    const newHeight = Math.round(contentHeight * dpr);

    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      canvas.width = newWidth;
      canvas.height = newHeight;
      canvas.style.width = `${contentWidth}px`;
      canvas.style.height = `${contentHeight}px`;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    redrawStrokes(strokes, ctx);
  }, [strokes]);

  useEffect(() => {
    syncCanvasDimensions();
    const workspace = workspaceRef.current;
    let observer = null;
    if (workspace && window.ResizeObserver) {
      observer = new ResizeObserver(() => {
        syncCanvasDimensions();
      });
      observer.observe(workspace);
    }
    window.addEventListener('resize', syncCanvasDimensions);
    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', syncCanvasDimensions);
    };
  }, [syncCanvasDimensions]);

  // Redraw all committed strokes on canvas cleanly
  const redrawStrokes = (strokeList, ctx) => {
    if (!ctx && canvasRef.current) {
      ctx = canvasRef.current.getContext('2d');
    }
    if (!ctx || !canvasRef.current) return;

    const dpr = Math.max(window.devicePixelRatio || 1, 2);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.scale(dpr, dpr);

    strokeList.forEach((stroke) => {
      drawSingleStroke(ctx, stroke);
    });
    ctx.restore();
  };

  const drawSingleStroke = (ctx, stroke) => {
    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = stroke.width * 4;
      ctx.beginPath();
      (stroke.points || []).forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.globalCompositeOperation = 'source-over';

    if (stroke.tool === 'pen') {
      ctx.beginPath();
      (stroke.points || []).forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
    } else if (stroke.tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(stroke.start.x, stroke.start.y);
      ctx.lineTo(stroke.end.x, stroke.end.y);
      ctx.stroke();
    } else if (stroke.tool === 'arrow') {
      drawArrow(ctx, stroke.start.x, stroke.start.y, stroke.end.x, stroke.end.y, stroke.width);
    } else if (stroke.tool === 'rect') {
      const w = stroke.end.x - stroke.start.x;
      const h = stroke.end.y - stroke.start.y;
      ctx.strokeRect(stroke.start.x, stroke.start.y, w, h);
    } else if (stroke.tool === 'circle') {
      const radiusX = Math.abs(stroke.end.x - stroke.start.x) / 2;
      const radiusY = Math.abs(stroke.end.y - stroke.start.y) / 2;
      const centerX = stroke.start.x + (stroke.end.x - stroke.start.x) / 2;
      const centerY = stroke.start.y + (stroke.end.y - stroke.start.y) / 2;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, Math.max(1, radiusX), Math.max(1, radiusY), 0, 0, 2 * Math.PI);
      ctx.stroke();
    }

    ctx.restore();
  };

  const drawArrow = (ctx, fromX, fromY, toX, toY, width) => {
    const headlen = Math.max(12, width * 3.5);
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  };

  // Pointer drawing events
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    const coords = getCanvasCoords(e);
    setIsDrawing(true);

    if (activeTool === 'pen' || activeTool === 'eraser') {
      const newStroke = {
        tool: activeTool,
        color: selectedColor,
        width: lineWidth,
        points: [coords]
      };
      setCurrentStroke(newStroke);
    } else {
      // Shape tools (line, arrow, rect, circle)
      const newStroke = {
        tool: activeTool,
        color: selectedColor,
        width: lineWidth,
        start: coords,
        end: coords
      };
      setCurrentStroke(newStroke);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDrawing || !currentStroke) return;
    const coords = getCanvasCoords(e);

    const ctx = canvasRef.current.getContext('2d');

    if (activeTool === 'pen' || activeTool === 'eraser') {
      const updatedStroke = {
        ...currentStroke,
        points: [...currentStroke.points, coords]
      };
      setCurrentStroke(updatedStroke);

      redrawStrokes(strokes, ctx);
      drawSingleStroke(ctx, updatedStroke);
    } else {
      // Real-time preview of shape
      const updatedStroke = {
        ...currentStroke,
        end: coords
      };
      setCurrentStroke(updatedStroke);

      redrawStrokes(strokes, ctx);
      drawSingleStroke(ctx, updatedStroke);
    }
  };

  const handlePointerUp = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStroke) {
      const newStrokes = [...strokes, currentStroke];
      setStrokes(newStrokes);
      setCurrentStroke(null);
      redrawStrokes(newStrokes);
    }
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const updated = strokes.slice(0, -1);
    setStrokes(updated);
    redrawStrokes(updated);
  };

  const handleClear = () => {
    if (strokes.length === 0) return;
    if (window.confirm('Clear all drawings on this question?')) {
      setStrokes([]);
      redrawStrokes([]);
    }
  };

  // Capture workspace as ultra-high-resolution image snapshot with direct canvas compositing
  const captureNoteImage = async () => {
    const workspace = workspaceRef.current;
    if (!workspace) return null;

    try {
      // Temporarily scroll to top so html2canvas doesn't cut off scrolled content
      const scrollContainer = workspace.parentElement;
      const prevScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
      if (scrollContainer) scrollContainer.scrollTop = 0;

      // Ensure all images in workspace are fully loaded before capturing
      const imgElements = Array.from(workspace.querySelectorAll('img'));
      await Promise.all(
        imgElements.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 2000);
          });
        })
      );

      // Brief settle for KaTeX / layout rendering
      await new Promise((resolve) => setTimeout(resolve, 80));

      const captureScale = 3; // 3x ultra-sharp retina resolution
      const targetWidth = Math.max(workspace.scrollWidth, workspace.offsetWidth);
      const targetHeight = Math.max(workspace.scrollHeight, workspace.offsetHeight);

      // 1. Capture the DOM backdrop (question text, math formulas, diagram, choices)
      //    We ignore the drawing canvas so html2canvas doesn't downscale or glitch it.
      const bgCanvas = await html2canvas(workspace, {
        scale: captureScale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        width: targetWidth,
        height: targetHeight,
        ignoreElements: (element) => {
          return element.classList && element.classList.contains('pdf-drawing-canvas');
        }
      });

      // Restore scroll position
      if (scrollContainer) scrollContainer.scrollTop = prevScrollTop;

      // 2. Composite user's drawings directly on top of the DOM backdrop
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = bgCanvas.width;
      finalCanvas.height = bgCanvas.height;
      const compCtx = finalCanvas.getContext('2d');

      // Draw background
      compCtx.drawImage(bgCanvas, 0, 0);

      // Draw user drawing canvas directly (pixel-perfect 1:1 strokes)
      if (canvasRef.current) {
        compCtx.drawImage(
          canvasRef.current,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height,
          0,
          0,
          finalCanvas.width,
          finalCanvas.height
        );
      }

      return finalCanvas.toDataURL('image/png', 1.0);
    } catch (err) {
      console.error('Error capturing question note:', err);
      return null;
    }
  };

  // Save current note into the Box
  const handleSaveToBox = async () => {
    setIsSaving(true);
    try {
      const imgData = await captureNoteImage();
      if (!imgData) {
        alert('Failed to capture note. Please try again.');
        setIsSaving(false);
        return;
      }

      const noteData = {
        id: question?._id || `q_${questionIndex}_${Date.now()}`,
        questionId: question?._id,
        questionIndex,
        examTitle,
        imageData: imgData,
        timestamp: new Date().toISOString(),
        hasDrawing: strokes.length > 0
      };

      if (onSaveToBox) {
        onSaveToBox(noteData);
      }

      setSaveToast(`✓ Question ${questionIndex + 1} saved to Notes Box!`);
      setTimeout(() => setSaveToast(''), 3500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // Download this question note directly as a high-resolution PNG screenshot
  const handleDownloadScreenshot = async () => {
    setIsSaving(true);
    try {
      const imgData = await captureNoteImage();
      if (!imgData) {
        alert('Failed to capture screenshot. Please try again.');
        return;
      }

      const cleanTitle = (examTitle || 'Question').replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_');
      const filename = `Question_${questionIndex + 1}_${cleanTitle}_Solution.png`;

      const link = document.createElement('a');
      link.href = imgData;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSaveToast(`✓ Screenshot downloaded (PNG)!`);
      setTimeout(() => setSaveToast(''), 3500);
    } catch (e) {
      console.error(e);
      alert('Failed to download screenshot.');
    } finally {
      setIsSaving(false);
    }
  };

  // Download this single question as an adaptive crystal-clear PDF (never cut or squashed)
  const handleDownloadSinglePdf = async () => {
    setIsSaving(true);
    try {
      const imgData = await captureNoteImage();
      if (!imgData) {
        setIsSaving(false);
        alert('Failed to capture note. Please try again.');
        return;
      }

      // Create PDF with custom dimensions matching the exact image aspect ratio
      const tempPdf = new jsPDF();
      const imgProps = tempPdf.getImageProperties(imgData);

      const isLandscape = imgProps.width > imgProps.height;
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'px',
        format: [imgProps.width, imgProps.height],
        hotfixes: ['px_scaling']
      });

      pdf.addImage(imgData, 'PNG', 0, 0, imgProps.width, imgProps.height, undefined, 'SLOW');
      pdf.save(`Question_${questionIndex + 1}_Solution_Note.pdf`);

      setSaveToast(`✓ Crystal PDF downloaded!`);
      setTimeout(() => setSaveToast(''), 3500);
    } catch (e) {
      console.error(e);
      alert('Failed to download single PDF.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="pdf-noter-overlay" onClick={onClose}>
      <div className="pdf-noter-container" onClick={(e) => e.stopPropagation()}>
        {/* Header & Controls Toolbar */}
        <div className="pdf-noter-header">
          <div className="pdf-noter-title-box">
            <h3 className="pdf-noter-title">
              <span>✏️ Question Solution Noter</span>
              <span className="pdf-noter-badge">Q{questionIndex + 1}</span>
            </h3>
            {saveToast && (
              <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 700 }}>
                {saveToast}
              </span>
            )}
          </div>

          {/* Tools */}
          <div className="pdf-noter-toolbar">
            <div className="pdf-tool-group">
              <button
                type="button"
                className={`pdf-tool-btn ${activeTool === 'pen' ? 'active' : ''}`}
                onClick={() => setActiveTool('pen')}
                title="Freehand Pen"
              >
                ✏️ Pen
              </button>
              <button
                type="button"
                className={`pdf-tool-btn ${activeTool === 'line' ? 'active' : ''}`}
                onClick={() => setActiveTool('line')}
                title="Straight Line"
              >
                📏 Line
              </button>
              <button
                type="button"
                className={`pdf-tool-btn ${activeTool === 'arrow' ? 'active' : ''}`}
                onClick={() => setActiveTool('arrow')}
                title="Arrow"
              >
                ➡️ Arrow
              </button>
              <button
                type="button"
                className={`pdf-tool-btn ${activeTool === 'rect' ? 'active' : ''}`}
                onClick={() => setActiveTool('rect')}
                title="Rectangle"
              >
                ⬜ Box
              </button>
              <button
                type="button"
                className={`pdf-tool-btn ${activeTool === 'circle' ? 'active' : ''}`}
                onClick={() => setActiveTool('circle')}
                title="Circle / Ellipse"
              >
                ⭕ Circle
              </button>
              <button
                type="button"
                className={`pdf-tool-btn ${activeTool === 'eraser' ? 'active' : ''}`}
                onClick={() => setActiveTool('eraser')}
                title="Eraser"
              >
                🧹 Eraser
              </button>
            </div>

            {/* Colors */}
            <div className="pdf-color-swatches">
              {PALETTE_COLORS.map((c) => (
                <div
                  key={c.hex}
                  className={`pdf-color-dot ${selectedColor === c.hex ? 'active' : ''}`}
                  style={{ background: c.hex, boxShadow: c.hex === '#ffffff' ? 'inset 0 0 0 1px #cbd5e1' : undefined }}
                  onClick={() => {
                    setSelectedColor(c.hex);
                    if (activeTool === 'eraser') setActiveTool('pen');
                  }}
                  title={c.name}
                />
              ))}
              <input
                type="color"
                className="pdf-color-native-input"
                value={selectedColor}
                onChange={(e) => {
                  setSelectedColor(e.target.value);
                  if (activeTool === 'eraser') setActiveTool('pen');
                }}
                title="Custom Color"
              />
            </div>

            {/* Thickness */}
            <div className="pdf-tool-group">
              {[2, 4, 8].map((w) => (
                <button
                  key={w}
                  type="button"
                  className={`pdf-width-btn ${lineWidth === w ? 'active' : ''}`}
                  onClick={() => setLineWidth(w)}
                >
                  {w === 2 ? 'Fine' : w === 4 ? 'Med' : 'Thick'}
                </button>
              ))}
            </div>

            {/* Undo & Clear */}
            <div className="pdf-tool-group">
              <button
                type="button"
                className="pdf-tool-btn"
                onClick={handleUndo}
                title="Undo last stroke"
                disabled={strokes.length === 0}
              >
                ↩ Undo
              </button>
              <button
                type="button"
                className="pdf-tool-btn"
                onClick={handleClear}
                title="Clear canvas"
                disabled={strokes.length === 0}
              >
                🗑️ Clear
              </button>
            </div>
          </div>
        </div>

        {/* Canvas & Workspace Body */}
        <div className="pdf-noter-body">
          <div ref={workspaceRef} className="pdf-noter-workspace">
            {/* Layered HTML5 Canvas */}
            <canvas
              ref={canvasRef}
              className={`pdf-drawing-canvas tool-${activeTool}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />

            {/* Question Backdrop Content */}
            <div className="pdf-noter-question-content">
              <div className="pdf-noter-q-header">
                <div className="pdf-noter-q-num">
                  <span>Question #{questionIndex + 1}</span>
                  {question?.typeOfAnswer && (
                    <span style={{ fontSize: '11px', color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>
                      {question.typeOfAnswer}
                    </span>
                  )}
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {question?.questionPoints || 1} pt
                  </span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                  {examTitle}
                </div>
              </div>

              {/* Question Text */}
              <div
                className="pdf-noter-q-text question-html-clean"
                dangerouslySetInnerHTML={{ __html: renderLatexInHtml(question?.question || '') }}
              />

              {/* Question Picture */}
              {question?.questionPic && (
                <div className="pdf-noter-q-pic">
                  <img src={question.questionPic} alt="Question Visual" crossOrigin="anonymous" />
                </div>
              )}

              {/* Choices (if MCQ) */}
              {question?.wrongAnswer && question.wrongAnswer.length > 0 && (
                <div className="pdf-noter-choices-grid">
                  {(question.wrongAnswer || []).slice(0, 4).map((choice, idx) => (
                    <div key={idx} className="pdf-noter-choice-card">
                      <span className="pdf-noter-choice-letter">{String.fromCharCode(65 + idx)}</span>
                      <span
                        className="question-html-clean"
                        dangerouslySetInnerHTML={{ __html: renderLatexInHtml(choice) }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Whiteboard Solution Working Area for Teacher */}
              <div className="pdf-noter-whiteboard-area">
                <div className="pdf-noter-whiteboard-guide">
                  <i className="fa-solid fa-pen"></i>
                  <span>Teacher Solution &amp; Working Area (write steps, formulas, and final answers here)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pdf-noter-footer">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="pdf-footer-btn pdf-footer-btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="button"
              className="pdf-footer-btn pdf-footer-btn-screenshot"
              onClick={handleDownloadScreenshot}
              disabled={isSaving}
              title="Download crystal-clear high-res PNG image (perfect for WhatsApp & sharing)"
            >
              <i className="fa-solid fa-camera"></i> 📸 Download Screenshot (PNG)
            </button>
            <button
              type="button"
              className="pdf-footer-btn pdf-footer-btn-secondary"
              onClick={handleDownloadSinglePdf}
              disabled={isSaving}
              title="Download perfectly proportioned crystal-clear PDF"
            >
              <i className="fa-solid fa-file-pdf"></i> 📄 Download PDF
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {savedNotesCount > 0 && (
              <button
                type="button"
                className="pdf-footer-btn pdf-footer-btn-amber"
                onClick={() => {
                  onClose();
                  if (onOpenBox) onOpenBox();
                }}
              >
                <i className="fa-solid fa-box-archive"></i> View Notes Box ({savedNotesCount})
              </button>
            )}

            <button
              type="button"
              className="pdf-footer-btn pdf-footer-btn-primary"
              onClick={handleSaveToBox}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="btn-spinner"></span> Saving Note...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-bookmark"></i> Save Note to Box
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionPdfNoterModal;
