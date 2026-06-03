import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Heart, ShieldAlert, Award, Sun } from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import FullscreenButton from '../../components/fullscreenButton/FullscreenButton';
import soundEffects from '../../utils/soundEffects';
import { generateArithmeticMcq } from '../../utils/arithmeticMcq';

import { Canvas, useFrame } from '@react-three/fiber';
import './CaveRunner.css';

// ── 3D Components ────────────────────────────────────────────────────────────

// Beautiful Procedural Bunny - Slim, cute, and animated!
function ProceduralBunny({ isRunning, isJumping, isFalling }) {
  const frontLeftLegRef = useRef();
  const frontRightLegRef = useRef();
  const backLeftLegRef = useRef();
  const backRightLegRef = useRef();

  useFrame((state) => {
    if (!isRunning) {
      if (frontLeftLegRef.current) frontLeftLegRef.current.rotation.z = 0;
      if (frontRightLegRef.current) frontRightLegRef.current.rotation.z = 0;
      if (backLeftLegRef.current) backLeftLegRef.current.rotation.z = 0;
      if (backRightLegRef.current) backRightLegRef.current.rotation.z = 0;
      return;
    }
    const t = state.clock.getElapsedTime();
    const swing = Math.sin(t * 16) * 0.6; // Energetic leg swing
    if (frontLeftLegRef.current) frontLeftLegRef.current.rotation.z = swing;
    if (frontRightLegRef.current) frontRightLegRef.current.rotation.z = -swing;
    if (backLeftLegRef.current) backLeftLegRef.current.rotation.z = -swing;
    if (backRightLegRef.current) backRightLegRef.current.rotation.z = swing;
  });

  return (
    <group>
      {/* Body - Slim Ellipsoid */}
      <mesh position={[0, 0.5, 0]} scale={[1.3, 0.9, 0.7]} castShadow>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>
      {/* Head - Slightly forward */}
      <mesh position={[0.36, 0.82, 0]} castShadow>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>
      {/* Ears - Long and slim */}
      <mesh position={[0.28, 1.25, 0.07]} rotation={[0, 0, -0.35]} castShadow>
        <cylinderGeometry args={[0.02, 0.03, 0.7, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>
      <mesh position={[0.28, 1.25, -0.07]} rotation={[0, 0, -0.35]} castShadow>
        <cylinderGeometry args={[0.02, 0.03, 0.7, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>
      {/* Pink Inner Ears */}
      <mesh position={[0.29, 1.25, 0.07]} rotation={[0, 0, -0.35]} scale={[0.5, 0.9, 0.5]}>
        <cylinderGeometry args={[0.02, 0.03, 0.7, 16]} />
        <meshStandardMaterial color="#fda4af" roughness={0.8} />
      </mesh>
      <mesh position={[0.29, 1.25, -0.07]} rotation={[0, 0, -0.35]} scale={[0.5, 0.9, 0.5]}>
        <cylinderGeometry args={[0.02, 0.03, 0.7, 16]} />
        <meshStandardMaterial color="#fda4af" roughness={0.8} />
      </mesh>
      {/* Nose */}
      <mesh position={[0.58, 0.78, 0]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial color="#f43f5e" />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.47, 0.88, 0.08]}>
        <sphereGeometry args={[0.028, 16, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} />
      </mesh>
      <mesh position={[0.47, 0.88, -0.08]}>
        <sphereGeometry args={[0.028, 16, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} />
      </mesh>
      {/* Tail */}
      <mesh position={[-0.48, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.9} />
      </mesh>

      {/* 4 Animated Legs */}
      {/* Front Left Leg */}
      <group ref={frontLeftLegRef} position={[0.2, 0.22, 0.15]}>
        <mesh position={[0, -0.12, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.03, 0.24, 16]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.8} />
        </mesh>
      </group>
      {/* Front Right Leg */}
      <group ref={frontRightLegRef} position={[0.2, 0.22, -0.15]}>
        <mesh position={[0, -0.12, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.03, 0.24, 16]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.8} />
        </mesh>
      </group>
      {/* Back Left Leg */}
      <group ref={backLeftLegRef} position={[-0.2, 0.22, 0.15]}>
        <mesh position={[0, -0.12, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.03, 0.24, 16]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.8} />
        </mesh>
      </group>
      {/* Back Right Leg */}
      <group ref={backRightLegRef} position={[-0.2, 0.22, -0.15]}>
        <mesh position={[0, -0.12, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.03, 0.24, 16]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

// 3D Bunny Character loader with animation bobbing and dynamic jump/fall heights
function Bunny3D({ isJumping, jumpStartTime, isFalling, fallStartTime, isRunning }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Position Y (Jump logic)
    if (isJumping) {
      const elapsed = (Date.now() - jumpStartTime) / 700;
      if (elapsed >= 0 && elapsed <= 1) {
        groupRef.current.position.y = Math.sin(elapsed * Math.PI) * 2.8;
        groupRef.current.rotation.z = Math.sin(elapsed * Math.PI) * 0.15;
      }
    } else if (isFalling) {
      const elapsed = (Date.now() - fallStartTime) / 600;
      if (elapsed >= 0 && elapsed <= 1) {
        groupRef.current.position.y = Math.max(0, 0.45 - elapsed * 1.5);
        groupRef.current.rotation.z = -elapsed * Math.PI / 2;
      }
    } else {
      groupRef.current.position.y = 0;
      groupRef.current.rotation.z = 0;
      
      // Running bobbing animation
      if (isRunning) {
        groupRef.current.position.y = Math.abs(Math.sin(t * 14)) * 0.18;
        groupRef.current.rotation.z = Math.sin(t * 14) * 0.05;
      }
    }
  });

  return (
    <group ref={groupRef} position={[-3, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
      <ProceduralBunny isRunning={isRunning} isJumping={isJumping} isFalling={isFalling} />
    </group>
  );
}

// 3D Rock obstacle
function Rock3D({ position }) {
  const x = ((position - 20) / 100) * 15 - 3;
  return (
    <mesh position={[x, 0.35, 0]} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.5, 1]} />
      <meshStandardMaterial color="#64748b" roughness={0.95} metalness={0.05} />
    </mesh>
  );
}

// 3D Pine Tree obstacle
function Tree3D({ position }) {
  const x = ((position - 20) / 100) * 15 - 3;
  return (
    <group position={[x, 0, 0]}>
      {/* Trunk */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.11, 0.6, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
      {/* Cone Leaves */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <coneGeometry args={[0.35, 0.7, 8]} />
        <meshStandardMaterial color="#14532d" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow>
        <coneGeometry args={[0.26, 0.5, 8]} />
        <meshStandardMaterial color="#166534" roughness={0.8} />
      </mesh>
    </group>
  );
}

// 3D Glowing Fire obstacle
function Fire3D({ position }) {
  const x = ((position - 20) / 100) * 15 - 3;
  const fireRef = useRef();

  useFrame((state) => {
    if (fireRef.current) {
      const t = state.clock.getElapsedTime();
      fireRef.current.scale.set(
        1 + Math.sin(t * 22) * 0.08,
        1 + Math.cos(t * 18) * 0.12,
        1 + Math.sin(t * 20) * 0.08
      );
    }
  });

  return (
    <group position={[x, 0, 0]}>
      {/* Wood Logs Base */}
      <mesh position={[0, 0.08, 0.1]} rotation={[0.3, 0.6, 1.5]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 6]} />
        <meshStandardMaterial color="#451a03" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.08, -0.1]} rotation={[-0.3, -0.6, 1.5]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 6]} />
        <meshStandardMaterial color="#451a03" roughness={0.9} />
      </mesh>

      {/* Flame meshes */}
      <group ref={fireRef}>
        <mesh position={[0, 0.4, 0]}>
          <coneGeometry args={[0.25, 0.8, 8]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0, 0.32, 0.04]} scale={0.72}>
          <coneGeometry args={[0.25, 0.8, 8]} />
          <meshBasicMaterial color="#f97316" />
        </mesh>
        <mesh position={[0, 0.22, -0.04]} scale={0.48}>
          <coneGeometry args={[0.25, 0.8, 8]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
      </group>

      {/* Glowing point light */}
      <pointLight color="#f97316" intensity={2.5} distance={4} decay={1.5} position={[0, 0.4, 0]} />
    </group>
  );
}

// Obstacle Multiplexer
function Obstacle3D({ type, position }) {
  if (type === 'rock') return <Rock3D position={position} />;
  if (type === 'tree') return <Tree3D position={position} />;
  if (type === 'fire') return <Fire3D position={position} />;
  return null;
}

// 3D Spinning Carrot collectible
function Carrot3D({ position }) {
  const x = ((position - 20) / 100) * 15 - 3;
  const carrotRef = useRef();

  useFrame((state) => {
    if (carrotRef.current) {
      carrotRef.current.rotation.y = state.clock.getElapsedTime() * 3.5;
      carrotRef.current.position.y = 1.35 + Math.sin(state.clock.getElapsedTime() * 6) * 0.12;
    }
  });

  return (
    <group ref={carrotRef} position={[x, 1.35, 0]} scale={0.8}>
      {/* Orange Body */}
      <mesh rotation={[Math.PI, 0, 0]} position={[0, 0.15, 0]} castShadow>
        <coneGeometry args={[0.11, 0.5, 8]} />
        <meshStandardMaterial color="#f97316" roughness={0.4} />
      </mesh>
      {/* Leaves */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#22c55e" roughness={0.7} />
      </mesh>
    </group>
  );
}

// 3D Environment with ground track, ambient lighting, and parallax scrolling background hills/trees
function CaveEnvironment({ speed, isRunning }) {
  const [pillars, setPillars] = useState([
    { id: 1, x: -10, z: -1.8, scale: 1.2, color: '#334155' },
    { id: 2, x: 2, z: -2.2, scale: 0.8, color: '#475569' },
    { id: 3, x: 14, z: -1.6, scale: 1.5, color: '#1e293b' }
  ]);

  useFrame((state, delta) => {
    if (!isRunning) return;
    setPillars(prev => prev.map(p => {
      let nextX = p.x - speed * delta * 7.5;
      if (nextX < -15) {
        nextX = 18 + Math.random() * 6;
      }
      return { ...p, x: nextX };
    }));
  });

  return (
    <group>
      {/* Ground runway - Green Grass */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <boxGeometry args={[35, 0.4, 3]} />
        <meshStandardMaterial color="#22c55e" roughness={0.9} />
      </mesh>

      {/* Side Track Border Grid - Wood Brown */}
      <mesh position={[0, -0.05, 1.35]} receiveShadow>
        <boxGeometry args={[35, 0.1, 0.15]} />
        <meshStandardMaterial color="#854d0e" roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.05, -1.35]} receiveShadow>
        <boxGeometry args={[35, 0.1, 0.15]} />
        <meshStandardMaterial color="#854d0e" roughness={0.8} />
      </mesh>

      {/* Parallax background hills/trees */}
      {pillars.map(p => (
        <group key={p.id} position={[p.x, 0.4, p.z]} scale={p.scale}>
          {/* Green Hill */}
          <mesh castShadow receiveShadow>
            <coneGeometry args={[1.6, 2.2, 5]} />
            <meshStandardMaterial color="#4ade80" roughness={0.9} />
          </mesh>
          {/* Pine tree on the hill */}
          <group position={[0, 1.0, 0.1]} scale={0.4}>
            <mesh castShadow>
              <cylinderGeometry args={[0.1, 0.15, 0.8, 8]} />
              <meshStandardMaterial color="#78350f" />
            </mesh>
            <mesh position={[0, 0.8, 0]} castShadow>
              <coneGeometry args={[0.6, 1.2, 8]} />
              <meshStandardMaterial color="#166534" />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}

// ── Game Container ───────────────────────────────────────────────────────────

const BunnyRun = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [gameState, setGameState] = useState('menu');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [isJumping, setIsJumping] = useState(false);
  const isJumpingRef = useRef(false);
  const [jumpStartTime, setJumpStartTime] = useState(0);
  const [isFalling, setIsFalling] = useState(false);
  const isFallingRef = useRef(false);
  const [fallStartTime, setFallStartTime] = useState(0);
  const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false);
  const isWaitingRef = useRef(false);
  const [obstaclePos, setObstaclePos] = useState(120);
  const OBSTACLE_TYPES = ['rock', 'tree', 'fire'];
  const [obstacleType, setObstacleType] = useState('rock');
  const [speed, setSpeed] = useState(0.8);

  const obstaclesPassedRef = useRef(0);
  const targetObstaclesRef = useRef(Math.floor(Math.random() * 3) + 3); // Random 3 to 5
  
  const [question, setQuestion] = useState({ text: '' });
  const [options, setOptions] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [difficulty, setDifficulty] = useState('0');

  const [coins, setCoins] = useState([]);
  const nextCoinId = useRef(0);
  const gameLoopRef = useRef(null);

  const spawnCoins = useCallback(() => {
    const newCoins = [];
    const basePos = 100 + Math.random() * 20;
    for (let i = 0; i < 3; i++) {
      newCoins.push({
        id: nextCoinId.current++,
        pos: basePos + (i * 12),
        collected: false
      });
    }
    setCoins(newCoins);
  }, []);

  const generateQuestion = (level = difficulty) => {
    const q = generateArithmeticMcq(level, 4);
    setQuestion({ text: q.text });
    setCorrectAnswer(q.answer);
    setOptions(q.options);
  };

  const startGame = async (selectedLevel) => {
    soundEffects.playClick();
    setDifficulty(selectedLevel);
    setGameState('playing');
    setScore(0);
    setLives(5);
    setSpeed(0.8);
    setObstaclePos(150);
    setObstacleType('rock');
    setIsWaitingForAnswer(false);
    isWaitingRef.current = false;
    setIsFalling(false);
    isFallingRef.current = false;
    isJumpingRef.current = false;
    setIsJumping(false);
    setJumpStartTime(0);
    setFallStartTime(0);
    obstaclesPassedRef.current = 0;
    targetObstaclesRef.current = Math.floor(Math.random() * 3) + 3;
    spawnCoins();
    generateQuestion(selectedLevel);
  };

  const handleGameOver = useCallback(() => {
    setGameState('gameover');
    soundEffects.playWrong();
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
  }, []);

  const jump = useCallback(() => {
    if (gameState !== 'playing' || isJumpingRef.current || isFallingRef.current || isWaitingRef.current) return;
    
    soundEffects.playClick();
    setIsJumping(true);
    isJumpingRef.current = true;
    setJumpStartTime(Date.now());
    
    setTimeout(() => {
      setIsJumping(false);
      isJumpingRef.current = false;
    }, 700);
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  const handleAnswer = (selectedAns) => {
    if (gameState !== 'playing') return;

    if (selectedAns === correctAnswer) {
      soundEffects.playCorrect();
      setScore(s => s + 50);
      setSpeed(s => Math.min(s + 0.1, 3.2));
      jump();
    } else {
      soundEffects.playWrong();
      setLives(l => {
        const newLives = l - 1;
        if (newLives <= 0) handleGameOver();
        return newLives;
      });
    }

    setIsWaitingForAnswer(false);
    isWaitingRef.current = false;
    obstaclesPassedRef.current = 0;
    targetObstaclesRef.current = Math.floor(Math.random() * 3) + 3;
    generateQuestion(difficulty);
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    let lastTime = performance.now();

    const loop = (time) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      setObstaclePos(pos => {
        if (isWaitingRef.current || isFallingRef.current) return pos;

        let newPos = pos - (speed * (deltaTime / 16));
        
        let hitObstacle = false;
        if (newPos <= 26 && (newPos + 8) >= 14 && !isJumpingRef.current) {
          hitObstacle = true;
        }

        if (hitObstacle) {
          soundEffects.playWrong();
          setIsFalling(true);
          isFallingRef.current = true;
          setFallStartTime(Date.now());
          
          setTimeout(() => {
            setLives(l => {
              const newLives = l - 1;
              if (newLives <= 0) {
                handleGameOver();
              } else {
                setIsFalling(false);
                isFallingRef.current = false;
                setObstaclePos(120);
                setObstacleType(OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)]);
                spawnCoins();
              }
              return newLives;
            });
          }, 600);
          
          return pos;
        }
        
        if (newPos < -20) {
           // Increment obstacle count
           obstaclesPassedRef.current += 1;
           
           if (obstaclesPassedRef.current >= targetObstaclesRef.current) {
              setIsWaitingForAnswer(true);
              isWaitingRef.current = true;
           }

           newPos = 120 + Math.random() * 40;
           setObstacleType(OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)]);
           spawnCoins();
        }
        
        return newPos;
      });

      setCoins(prevCoins => {
        if (isWaitingRef.current || isFallingRef.current) return prevCoins;
        
        return prevCoins.map(c => {
          if (c.collected) return c;
          const newCoinPos = c.pos - (speed * (deltaTime / 16));
          if (newCoinPos <= 25 && newCoinPos >= 15 && !isFallingRef.current) {
             soundEffects.playNumberClick();
             setScore(s => s + 10);
             return { ...c, pos: newCoinPos, collected: true };
          }
          return { ...c, pos: newCoinPos };
        }).filter(c => c.pos > -10);
      });

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [gameState, speed, handleGameOver, spawnCoins]);

  return (
    <div className="cave-runner-page">
      <MobileNav role="Student" />
      <Navbar />

      <div className="game-wrapper">
        <div className="game-header-top">
          <button className="back-btn" onClick={() => navigate('/dashboard/student')}>
            <ArrowLeft size={24} />
            <span>Dashboard</span>
          </button>
          
          {gameState === 'playing' && (
            <div className="hud" style={{ zIndex: 10 }}>
              <div className="lives">
                {[...Array(5)].map((_, i) => (
                  <Heart 
                    key={i} 
                    size={28} 
                    fill={i < lives ? '#ef4444' : 'transparent'} 
                    color={i < lives ? '#ef4444' : '#cbd5e1'} 
                  />
                ))}
              </div>
              <div className="score-board">
                <Award size={24} color="#fbbf24" />
                <span>{score}</span>
              </div>
            </div>
          )}
        </div>

        <div 
          className={`game-area-premium ${isWaitingForAnswer ? 'frozen' : ''}`}
          onTouchStart={(e) => { e.preventDefault(); jump(); }}
          ref={containerRef}
        >
          <FullscreenButton targetRef={containerRef} />

          {/* Render 3D Canvas inside layout for active play sessions */}
          {gameState !== 'menu' && (
            <Canvas
              shadows
              camera={{ position: [0, 2.3, 7.5], fov: 45 }}
              style={{ position: 'absolute', inset: 0, zIndex: 3, background: '#bae6fd' }}
            >
              {/* Morning Sunshine Lighting */}
              <ambientLight intensity={0.75} color="#f0fdf4" />
              
              {/* Spotlight focus tracking track */}
              <directionalLight 
                position={[8, 15, 6]} 
                intensity={1.5} 
                color="#fef08a"
                castShadow 
                shadow-mapSize-width={1024} 
                shadow-mapSize-height={1024} 
                shadow-camera-far={25}
                shadow-camera-left={-8}
                shadow-camera-right={8}
                shadow-camera-top={8}
                shadow-camera-bottom={-8}
              />

              <pointLight color="#bae6fd" intensity={0.8} distance={15} position={[-3, 4, 2]} />

              {/* 3D Morning Environment Ground Runway and Parallax background hills/trees */}
              <CaveEnvironment speed={speed} isRunning={gameState === 'playing' && !isWaitingForAnswer && !isFalling} />

              {/* 3D Bunny Character (Loaded model with procedural fallback) */}
              <Bunny3D 
                isJumping={isJumping} 
                jumpStartTime={jumpStartTime} 
                isFalling={isFalling} 
                fallStartTime={fallStartTime}
                isRunning={gameState === 'playing' && !isWaitingForAnswer && !isFalling} 
              />

              {/* 3D Active Obstacles (Rock, Tree, Fire) */}
              {!isWaitingForAnswer && (
                <Obstacle3D type={obstacleType} position={obstaclePos} />
              )}

              {/* 3D Collectible Carrots */}
              {!isWaitingForAnswer && coins.map(coin => !coin.collected && (
                <Carrot3D key={coin.id} position={coin.pos} />
              ))}
            </Canvas>
          )}

          {/* Standard 2D Sky elements (Fallback rendering for Game Menu) */}
          {gameState === 'menu' && (
            <>
              <div className="sky-layer sunny">
                <div className="sun-bright">
                  <Sun size={140} color="#fcd34d" strokeWidth={3} />
                </div>
                <div className="sun-glow-bright"></div>
                <div className="clouds-container">
                  <div className="cloud-p p1"></div>
                  <div className="cloud-p p2"></div>
                  <div className="cloud-p p3"></div>
                </div>
              </div>
              
              <div className="mountains-container">
                <div className="mountain-p far"></div>
                <div className="mountain-p mid"></div>
              </div>

              <div className="ground-world">
                <div className="ground-surface">
                  <div className="surface-part full"></div>
                </div>
              </div>
            </>
          )}

          {isWaitingForAnswer && (
            <div className="math-overlay-modern" style={{ zIndex: 10 }}>
              <div className="math-card">
                <div className="math-title">Quick Solve!</div>
                <div className="math-q">{question.text}</div>
                <div className="math-opts">
                  {options.map((opt, i) => (
                    <button key={i} onClick={() => handleAnswer(opt)}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {gameState === 'menu' && (
            <div className="game-overlay-screen" style={{ zIndex: 10 }}>
              <div className="menu-inner">
                <div className="game-logo">BUNNY RUN</div>
                <p>Jump over obstacles and collect the carrots in full 3D!</p>
                <div className="diff-select">
                  <button className="lvl-btn l0" onClick={() => startGame('0')}>Level 0</button>
                  <button className="lvl-btn l1" onClick={() => startGame('1')}>Level 1</button>
                  <button className="lvl-btn l2" onClick={() => startGame('2')}>Level 2</button>
                  <button className="lvl-btn l3" onClick={() => startGame('3')}>Level 3</button>
                </div>
              </div>
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="game-overlay-screen" style={{ zIndex: 10 }}>
              <div className="menu-inner">
                <ShieldAlert size={80} color="#ef4444" />
                <h2>CRASHED!</h2>
                <p className="final-s">Final Score: {score}</p>
                <button className="retry-btn" onClick={() => startGame(difficulty)}>
                  <RotateCcw /> PLAY AGAIN
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BunnyRun;
