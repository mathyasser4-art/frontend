/* global BigInt */
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, RotateCcw, Pencil, Eraser, Undo, Redo, Trash2 } from 'lucide-react';
import './FeaturesSection.css';

const createInitialRods = (count) => Array(count).fill(null).map(() => ({
  topBeadActive: false,
  bottomBeadsActive: [false, false, false, false],
}));

function FeaturesSection() {
  const { t } = useTranslation();
  
  // Abacus State
  const [rodCount, setRodCount] = useState(13);
  const [rods, setRods] = useState(createInitialRods(13));
  const [totalValue, setTotalValue] = useState('0');
  const [showValue, setShowValue] = useState(true);

  // Whiteboard State
  const [tool, setTool] = useState('pen'); // 'pen' or 'eraser'
  const [color, setColor] = useState('#0f172a'); // Black, Blue, Red
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const isDrawingRef = useRef(false);
  const canvasRef = useRef(null);

  // Initialize Whiteboard Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setUndoStack([canvas.toDataURL()]);
    }
  }, []);

  // Handle Abacus Rod Count Change
  useEffect(() => {
    setRods(createInitialRods(rodCount));
  }, [rodCount]);

  // Calculate Abacus Total Value
  useEffect(() => {
    let total = 0n;
    rods.forEach((rod, i) => {
      let rodValue = 0;
      if (rod.topBeadActive) rodValue += 5;
      rodValue += rod.bottomBeadsActive.filter(isActive => isActive).length;
      total += BigInt(rodValue) * (10n ** BigInt(rods.length - 1 - i));
    });
    setTotalValue(total.toString());
  }, [rods]);

  // Abacus Click Handlers
  const handleTopBeadClick = (rodIndex) => {
    const newRods = JSON.parse(JSON.stringify(rods));
    newRods[rodIndex].topBeadActive = !newRods[rodIndex].topBeadActive;
    setRods(newRods);
  };

  const handleBottomBeadClick = (rodIndex, beadIndex) => {
    const newRods = JSON.parse(JSON.stringify(rods));
    const isClickedBeadActive = newRods[rodIndex].bottomBeadsActive[beadIndex];
    for (let i = 0; i < 4; i++) {
      if (isClickedBeadActive) {
        if (i >= beadIndex) newRods[rodIndex].bottomBeadsActive[i] = false;
      } else {
        if (i <= beadIndex) newRods[rodIndex].bottomBeadsActive[i] = true;
      }
    }
    setRods(newRods);
  };

  const handleResetAbacus = () => {
    setRods(createInitialRods(rodCount));
  };

  // Whiteboard Drawing Handlers
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (e) => {
    isDrawingRef.current = true;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 24;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
    }
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      setUndoStack((prev) => [...prev, dataUrl]);
      setRedoStack([]); // Clear redo stack on new action
    }
  };

  const handleUndo = () => {
    if (undoStack.length > 1) {
      const nextUndoStack = [...undoStack];
      const popped = nextUndoStack.pop();
      setRedoStack((prev) => [popped, ...prev]);
      setUndoStack(nextUndoStack);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = nextUndoStack[nextUndoStack.length - 1];
      img.onload = () => {
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextRedoStack = [...redoStack];
      const nextState = nextRedoStack.shift();
      setUndoStack((prev) => [...prev, nextState]);
      setRedoStack(nextRedoStack);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = nextState;
      img.onload = () => {
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
    }
  };

  const handleClearWhiteboard = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL();
      setUndoStack((prev) => [...prev, dataUrl]);
      setRedoStack([]);
    }
  };

  return (
    <section className="features-section">
      <div className="features-container">
        <div className="features-header">
          <h2 id="discover-features-title">
            {t('featuresSection.abacusTitle', 'Interactive Soroban Training Arena')}
          </h2>
          <p>
            {t('featuresSection.abacusSubtitle', 'Use the whiteboard to write questions and explain steps, then demonstrate the solutions instantly on the wide virtual abacus.')}
          </p>
          <div className="line"></div>
        </div>

        <div className="training-arena-container">
          {/* Whiteboard Card */}
          <div className="whiteboard-card">
            <div className="whiteboard-toolbar">
              <div className="toolbar-group">
                <button
                  className={`wb-tool-btn ${tool === 'pen' ? 'active' : ''}`}
                  onClick={() => setTool('pen')}
                  title="Pen Tool"
                >
                  <Pencil size={16} />
                  Pen
                </button>
                <button
                  className={`wb-tool-btn ${tool === 'eraser' ? 'active' : ''}`}
                  onClick={() => setTool('eraser')}
                  title="Eraser Tool"
                >
                  <Eraser size={16} />
                  Eraser
                </button>
              </div>

              {tool === 'pen' && (
                <div className="toolbar-group">
                  <div
                    className={`wb-color-btn ${color === '#0f172a' ? 'active' : ''}`}
                    style={{ backgroundColor: '#0f172a' }}
                    onClick={() => setColor('#0f172a')}
                    title="Black Color"
                  ></div>
                  <div
                    className={`wb-color-btn ${color === '#2563eb' ? 'active' : ''}`}
                    style={{ backgroundColor: '#2563eb' }}
                    onClick={() => setColor('#2563eb')}
                    title="Blue Color"
                  ></div>
                  <div
                    className={`wb-color-btn ${color === '#dc2626' ? 'active' : ''}`}
                    style={{ backgroundColor: '#dc2626' }}
                    onClick={() => setColor('#dc2626')}
                    title="Red Color"
                  ></div>
                </div>
              )}

              <div className="toolbar-group">
                <button
                  className="wb-action-btn"
                  onClick={handleUndo}
                  disabled={undoStack.length <= 1}
                  title="Undo"
                >
                  <Undo size={16} />
                </button>
                <button
                  className="wb-action-btn"
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  title="Redo"
                >
                  <Redo size={16} />
                </button>
                <button
                  className="wb-action-btn clear-btn"
                  onClick={handleClearWhiteboard}
                  title="Clear Whiteboard"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="whiteboard-canvas-container">
              <canvas
                ref={canvasRef}
                width={440}
                height={420}
                className="whiteboard-canvas"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
          </div>

          {/* Abacus Card */}
          <div className="big-abacus-card">
            {/* Teacher Controls */}
            <div className="teacher-controls-bar">
              <div className="rod-selector-group">
                <span className="rod-selector-label">Rods:</span>
                {[5, 7, 9, 13, 15].map((count) => (
                  <button
                    key={count}
                    className={`rod-btn ${rodCount === count ? 'active' : ''}`}
                    onClick={() => setRodCount(count)}
                  >
                    {count}
                  </button>
                ))}
              </div>

              <div className="action-btn-group">
                <button
                  className="toggle-value-btn"
                  onClick={() => setShowValue(!showValue)}
                  title={showValue ? 'Hide Value Display' : 'Show Value Display'}
                >
                  {showValue ? <EyeOff size={18} /> : <Eye size={18} />}
                  {showValue ? 'Hide Value' : 'Show Value'}
                </button>

                <button
                  className="reset-abacus-btn"
                  onClick={handleResetAbacus}
                  title="Reset Abacus to Zero"
                >
                  <RotateCcw size={18} />
                  Reset
                </button>
              </div>
            </div>

            {/* Value Display */}
            <div className={`abacus-value-display ${!showValue ? 'hidden-value' : ''}`}>
              {showValue ? totalValue : '??? (Question Mode)'}
            </div>

            {/* Abacus Structure */}
            <div className="big-abacus-scroll-wrapper">
              <div className="big-abacus-frame">
                {rods.map((rod, rodIndex) => (
                  <div key={rodIndex} className="big-rod">
                    <div className="big-rod-upper">
                      <div
                        className={`big-bead big-bead-top ${rod.topBeadActive ? 'active' : ''}`}
                        onClick={() => handleTopBeadClick(rodIndex)}
                      ></div>
                    </div>
                    <div className="big-rod-lower">
                      {rod.bottomBeadsActive.map((isActive, beadIndex) => (
                        <div
                          key={beadIndex}
                          className={`big-bead big-bead-bottom ${isActive ? 'active' : ''}`}
                          onClick={() => handleBottomBeadClick(rodIndex, beadIndex)}
                        ></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
