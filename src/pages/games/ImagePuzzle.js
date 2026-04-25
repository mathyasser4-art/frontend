import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, RefreshCw, Trophy, Sparkles, Image as ImageIcon } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import soundEffects from '../../utils/soundEffects';

// Import our cute generated images
import cuteSpaceCat from '../../img/cute_space_cat.png';
import cuteDinosaur from '../../img/cute_dinosaur.png';
import cuteOcean from '../../img/cute_ocean.png';

import './ImagePuzzle.css';

const PUZZLE_IMAGES = [
  { id: 'cat', src: cuteSpaceCat, name: 'Space Cat' },
  { id: 'dino', src: cuteDinosaur, name: 'Party Dino' },
  { id: 'ocean', src: cuteOcean, name: 'Ocean Friends' },
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
  const [selectedPieceIndex, setSelectedPieceIndex] = useState(null);
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
    setSelectedPieceIndex(null);
    setShowPreview(false);
  };

  useEffect(() => {
    initPuzzle();
  }, [selectedImageIndex, gridSize]);

  const handlePieceClick = (index) => {
    if (isCompleted || showPreview) return;

    if (selectedPieceIndex === null) {
      // Select first piece
      setSelectedPieceIndex(index);
      soundEffects.playClick();
    } else {
      // Swap pieces
      if (selectedPieceIndex !== index) {
        const newPieces = [...pieces];
        
        // Swap in the array
        const temp = newPieces[selectedPieceIndex];
        newPieces[selectedPieceIndex] = newPieces[index];
        newPieces[index] = temp;

        // Update currentPos
        newPieces[selectedPieceIndex].currentPos = selectedPieceIndex;
        newPieces[index].currentPos = index;

        setPieces(newPieces);
        setMoves(m => m + 1);
        soundEffects.playJump();

        // Check for win
        checkWin(newPieces);
      }
      setSelectedPieceIndex(null);
    }
  };

  const checkWin = (currentPieces) => {
    const solved = currentPieces.every(p => p.currentPos === p.correctPos);
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
                      className={`puzzle-piece ${selectedPieceIndex === index ? 'selected' : ''}`}
                      onClick={() => handlePieceClick(index)}
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
