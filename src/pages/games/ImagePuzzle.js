import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, RefreshCw, Trophy, Sparkles, Image as ImageIcon } from 'lucide-react';
import Confetti from 'react-confetti';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';

// Import our cute generated images
import cuteSpaceCat from '../../img/cute_space_cat.png';
import cuteDinosaur from '../../img/cute_dinosaur.png';
import cuteOcean from '../../img/cute_ocean.png';
import cuteRobot from '../../img/cute_robot.png';
import magicalForest from '../../img/magical_forest.png';
import cartoonCar from '../../img/cartoon_car.png';

import './ImagePuzzle.css';

const PUZZLE_IMAGES = [
  { id: 'cat', src: cuteSpaceCat, name: 'Space Cat' },
  { id: 'dino', src: cuteDinosaur, name: 'Party Dino' },
  { id: 'ocean', src: cuteOcean, name: 'Ocean Friends' },
  { id: 'robot', src: cuteRobot, name: 'Cute Robot' },
  { id: 'forest', src: magicalForest, name: 'Magical Forest' },
  { id: 'car', src: cartoonCar, name: 'Cartoon Car' },
];

const GRID_SIZES = [
  { label: 'Easy (3x3)', value: 3 },
  { label: 'Medium (4x4)', value: 4 },
  { label: 'Hard (5x5)', value: 5 },
];

const ImagePuzzle = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [gridSize, setGridSize] = useState(3);
  const [pieces, setPieces] = useState([]);
  const [draggedPieceIndex, setDraggedPieceIndex] = useState(null);
  const [dragOverPieceIndex, setDragOverPieceIndex] = useState(null);
  const [moves, setMoves] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Initialize and shuffle the puzzle
  const initPuzzle = () => {
    const totalPieces = gridSize * gridSize;
    const initialPieces = Array.from({ length: totalPieces }, (_, i) => ({
      id: i,
      currentPos: i,
      correctPos: i,
    }));

    // Shuffle logic (Fisher-Yates) ensuring it's not already solved
    let shuffled = [...initialPieces];
    let isSolved = true;
    
    while (isSolved) {
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      // Update currentPos based on new array indices
      shuffled.forEach((p, idx) => p.currentPos = idx);
      
      // Check if solved
      isSolved = shuffled.every(p => p.currentPos === p.correctPos);
    }

    setPieces(shuffled);
    setMoves(0);
    setIsCompleted(false);
    setDraggedPieceIndex(null);
    setDragOverPieceIndex(null);
    setShowPreview(false);
  };

  useEffect(() => {
    initPuzzle();
  }, [selectedImageIndex, gridSize]);

  const handleDragStart = (e, index) => {
    if (isCompleted || showPreview) {
      e.preventDefault();
      return;
    }
    setDraggedPieceIndex(index);
    // Needed for Firefox
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedPieceIndex === null || draggedPieceIndex === index || isCompleted || showPreview) return;
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (draggedPieceIndex !== null && draggedPieceIndex !== index && !isCompleted && !showPreview) {
      setDragOverPieceIndex(index);
    }
  };

  const handleDragLeave = (e, index) => {
    if (dragOverPieceIndex === index) {
      setDragOverPieceIndex(null);
    }
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    setDragOverPieceIndex(null);

    if (draggedPieceIndex === null || draggedPieceIndex === index || isCompleted || showPreview) {
      setDraggedPieceIndex(null);
      return;
    }

    const newPieces = [...pieces];
    
    // Swap in the array
    const temp = newPieces[draggedPieceIndex];
    newPieces[draggedPieceIndex] = newPieces[index];
    newPieces[index] = temp;

    // Update currentPos
    newPieces[draggedPieceIndex].currentPos = draggedPieceIndex;
    newPieces[index].currentPos = index;

    setPieces(newPieces);
    setMoves(m => m + 1);
    soundEffects.playJump();

    setDraggedPieceIndex(null);
    checkWin(newPieces);
  };

  const checkWin = (currentPieces) => {
    // A piece is in the correct spot if its id (which represents correctPos) matches its current array index!
    const solved = currentPieces.every((p, index) => p.id === index);
    if (solved) {
      setIsCompleted(true);
      soundEffects.playSuccess();
    }
  };

  const currentImage = PUZZLE_IMAGES[selectedImageIndex];

  return (
    <div className="image-puzzle-page">
      <MobileNav role="Student" />
      <Navbar />

      <div className="puzzle-container">
        {/* Header */}
        <div className="game-header">
          <button className="back-btn" onClick={() => navigate('/dashboard/student')}>
            <ArrowLeft size={24} />
            <span>Back to Dashboard</span>
          </button>
          <div className="stats-bar">
            <div className="stat-pill">
              <span className="stat-label">Moves:</span>
              <span className="stat-value">{moves}</span>
            </div>
          </div>
        </div>

        <div className="game-content">
          {isCompleted && (
            <Confetti
              width={window.innerWidth}
              height={window.innerHeight}
              recycle={false}
              numberOfPieces={500}
              gravity={0.15}
              style={{ zIndex: 100, position: 'fixed', top: 0, left: 0 }}
            />
          )}
          {/* Controls Sidebar */}
          <div className="controls-sidebar">
            <div className="control-group">
              <h3>Select Image</h3>
              <div className="image-selector">
                {PUZZLE_IMAGES.map((img, idx) => (
                  <button 
                    key={img.id}
                    className={`image-btn ${idx === selectedImageIndex ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedImageIndex(idx);
                      soundEffects.playClick();
                    }}
                  >
                    <img src={img.src} alt={img.name} />
                  </button>
                ))}
              </div>
            </div>

            <div className="control-group">
              <h3>Difficulty</h3>
              <div className="difficulty-selector">
                {GRID_SIZES.map(size => (
                  <button
                    key={size.value}
                    className={`diff-btn ${gridSize === size.value ? 'active' : ''}`}
                    onClick={() => {
                      setGridSize(size.value);
                      soundEffects.playClick();
                    }}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="action-buttons">
              <button 
                className="action-btn preview-btn"
                onMouseDown={() => setShowPreview(true)}
                onMouseUp={() => setShowPreview(false)}
                onTouchStart={() => setShowPreview(true)}
                onTouchEnd={() => setShowPreview(false)}
              >
                <ImageIcon size={20} />
                Hold for Preview
              </button>
              
              <button className="action-btn restart-btn" onClick={initPuzzle}>
                <RefreshCw size={20} />
                Restart Puzzle
              </button>
            </div>
          </div>

          {/* Puzzle Board Area */}
          <div className="board-area">
            {isCompleted && (
              <div className="victory-overlay">
                <Trophy size={64} className="trophy-icon" />
                <h2>Puzzle Solved!</h2>
                <p>Amazing job! You finished in {moves} moves.</p>
                <button className="play-again-btn" onClick={initPuzzle}>
                  <Sparkles size={20} />
                  Play Again
                </button>
              </div>
            )}

            <div 
              className={`puzzle-board ${isCompleted ? 'completed' : ''} ${showPreview ? 'preview-mode' : ''}`}
              style={{
                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                gridTemplateRows: `repeat(${gridSize}, 1fr)`
              }}
            >
              {showPreview ? (
                <img src={currentImage.src} alt="Preview" className="preview-image" />
              ) : (
                pieces.map((piece, index) => {
                  const correctX = piece.correctPos % gridSize;
                  const correctY = Math.floor(piece.correctPos / gridSize);
                  
                  return (
                    <div
                      key={piece.id}
                      draggable={!isCompleted && !showPreview}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnter={(e) => handleDragEnter(e, index)}
                      onDragLeave={(e) => handleDragLeave(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`puzzle-piece ${draggedPieceIndex === index ? 'dragging' : ''} ${dragOverPieceIndex === index ? 'drag-over' : ''}`}
                      style={{
                        backgroundImage: `url(${currentImage.src})`,
                        backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                        backgroundPosition: `${(correctX / (gridSize - 1)) * 100}% ${(correctY / (gridSize - 1)) * 100}%`,
                      }}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePuzzle;
