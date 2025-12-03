import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Upload } from 'lucide-react';

const GamePage = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('ready'); // ready, playing, gameOver
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [faceImage, setFaceImage] = useState(null);
  const gameLoopRef = useRef(null);
  const gameDataRef = useRef({
    bird: { x: 80, y: 200, velocity: 0, size: 50 },
    pipes: [],
    gravity: 0.4,
    jumpStrength: -8,
    pipeGap: 200,
    pipeWidth: 60,
    pipeSpeed: 2,
    frameCount: 0,
    fartParticles: []
  });

  const fartSoundRef = useRef(null);

  useEffect(() => {
    // Load high score
    const savedHighScore = localStorage.getItem('flappyHighScore');
    if (savedHighScore) setHighScore(parseInt(savedHighScore));

    // Load face image from public assets (transparent PNG recommended)
    const img = new Image();
    const faceSrc = process.env.PUBLIC_URL ? process.env.PUBLIC_URL + '/assets/character.png' : 'assets/character.png';
    img.src = faceSrc;
    img.onload = () => setFaceImage(img);

    // Preload fart sound from assets
    try {
      const fartSrc = process.env.PUBLIC_URL ? process.env.PUBLIC_URL + '/assets/fart-01.mp3' : 'assets/fart-01.mp3';
      const audio = new Audio(fartSrc);
      audio.preload = 'auto';
      fartSoundRef.current = audio;
    } catch (e) {
      // ignore if Audio is not available
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      startGame();
    }
  }, [gameState]);

  // Keyboard and touch controls
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', onKey, { passive: false });
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const playFartSound = () => {
    if (!fartSoundRef.current) return;
    try {
      // Clone to allow overlapping and add slight pitch variance
      const s = fartSoundRef.current.cloneNode();
      s.volume = 0.85;
      s.playbackRate = 0.9 + Math.random() * 0.3;
      s.currentTime = 0;
      void s.play();
    } catch (e) {
      // noop if autoplay blocked
    }
  };

  const createFartParticles = (x, y) => {
    const particles = [];
    for (let i = 0; i < 14; i++) {
      particles.push({
        x: x - 6 + Math.random() * 4,
        y: y + 36 + Math.random() * 6,
        vx: -2 - Math.random() * 2 + (Math.random() - 0.5) * 1.2,
        vy: Math.random() * 1.2 + 0.4,
        life: 48 + Math.floor(Math.random() * 12),
        size: Math.random() * 10 + 6,
        alpha: 0.9,
        color: `rgb(${120 + Math.floor(Math.random() * 50)}, ${90 + Math.floor(Math.random() * 20)}, ${40 + Math.floor(Math.random() * 20)})`,
        shadow: 8 + Math.random() * 6
      });
    }
    return particles;
  };

  const drawCharacterBody = (ctx, x, y, size, rotation) => {
    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);
    ctx.rotate(rotation);
    
    const bodyWidth = size * 0.6;
    const bodyHeight = size * 0.8;
    
    // Body (torso)
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.ellipse(0, size * 0.15, bodyWidth / 2, bodyHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Pants/shorts
    ctx.fillStyle = '#4ECDC4';
    ctx.beginPath();
    ctx.ellipse(0, size * 0.4, bodyWidth / 2, bodyHeight / 3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Arms
    ctx.strokeStyle = '#FFD93D';
    ctx.lineWidth = size * 0.12;
    ctx.lineCap = 'round';
    
    // Left arm
    ctx.beginPath();
    ctx.moveTo(-bodyWidth / 2, size * 0.1);
    ctx.lineTo(-bodyWidth / 1.5, size * 0.3);
    ctx.stroke();
    
    // Right arm  
    ctx.beginPath();
    ctx.moveTo(bodyWidth / 2, size * 0.1);
    ctx.lineTo(bodyWidth / 1.5, size * 0.3);
    ctx.stroke();
    
    // Legs
    ctx.strokeStyle = '#95E1D3';
    ctx.lineWidth = size * 0.14;
    
    // Left leg
    ctx.beginPath();
    ctx.moveTo(-bodyWidth / 4, size * 0.5);
    ctx.lineTo(-bodyWidth / 3, size * 0.75);
    ctx.stroke();
    
    // Right leg
    ctx.beginPath();
    ctx.moveTo(bodyWidth / 4, size * 0.5);
    ctx.lineTo(bodyWidth / 3, size * 0.75);
    ctx.stroke();
    
    // Butt highlight (where fart comes from)
    ctx.fillStyle = 'rgba(255, 182, 193, 0.6)';
    ctx.beginPath();
    ctx.ellipse(-2, size * 0.45, size * 0.15, size * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  };

  const jump = () => {
    if (gameState === 'ready') {
      setGameState('playing');
      return;
    }
    if (gameState === 'playing') {
      gameDataRef.current.bird.velocity = gameDataRef.current.jumpStrength;
      playFartSound();
      const newParticles = createFartParticles(
        gameDataRef.current.bird.x,
        gameDataRef.current.bird.y
      );
      gameDataRef.current.fartParticles.push(...newParticles);
    }
  };

  const startGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    gameDataRef.current.pipes = [];
    gameDataRef.current.bird.y = 200;
    gameDataRef.current.bird.velocity = 0;
    gameDataRef.current.frameCount = 0;
    gameDataRef.current.fartParticles = [];
    setScore(0);

    const gameLoop = () => {
      if (gameState !== 'playing') return;

      const data = gameDataRef.current;
      data.frameCount++;

      // Clear canvas
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(100, 80, 30, 0, Math.PI * 2);
      ctx.arc(120, 75, 35, 0, Math.PI * 2);
      ctx.arc(140, 80, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(350, 120, 25, 0, Math.PI * 2);
      ctx.arc(365, 115, 30, 0, Math.PI * 2);
      ctx.arc(380, 120, 25, 0, Math.PI * 2);
      ctx.fill();

      // Update bird physics
      data.bird.velocity += data.gravity;
      data.bird.y += data.bird.velocity;

      // Generate pipes
      if (data.frameCount % 100 === 0) {
        const minHeight = 80;
        const maxHeight = canvas.height - data.pipeGap - 80;
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        data.pipes.push({
          x: canvas.width,
          topHeight: topHeight,
          scored: false
        });
      }

      // Update and draw pipes
      data.pipes = data.pipes.filter(pipe => pipe.x > -data.pipeWidth);
      data.pipes.forEach(pipe => {
        pipe.x -= data.pipeSpeed;

        // Draw top pipe
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(pipe.x, 0, data.pipeWidth, pipe.topHeight);
        ctx.fillStyle = '#45a049';
        ctx.fillRect(pipe.x, 0, 8, pipe.topHeight);
        ctx.fillStyle = '#2d6b2d';
        ctx.fillRect(pipe.x + data.pipeWidth - 8, 0, 8, pipe.topHeight);
        
        // Pipe cap top
        ctx.fillStyle = '#66BB6A';
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 30, data.pipeWidth + 10, 30);

        // Draw bottom pipe
        const bottomY = pipe.topHeight + data.pipeGap;
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(pipe.x, bottomY, data.pipeWidth, canvas.height - bottomY);
        ctx.fillStyle = '#45a049';
        ctx.fillRect(pipe.x, bottomY, 8, canvas.height - bottomY);
        ctx.fillStyle = '#2d6b2d';
        ctx.fillRect(pipe.x + data.pipeWidth - 8, bottomY, 8, canvas.height - bottomY);
        
        // Pipe cap bottom
        ctx.fillStyle = '#66BB6A';
        ctx.fillRect(pipe.x - 5, bottomY, data.pipeWidth + 10, 30);

        // Score detection
        if (!pipe.scored && pipe.x + data.pipeWidth < data.bird.x) {
          pipe.scored = true;
          setScore(prev => prev + 1);
        }

        // Collision detection
        if (
          data.bird.x + data.bird.size > pipe.x &&
          data.bird.x < pipe.x + data.pipeWidth &&
          (data.bird.y < pipe.topHeight || data.bird.y + data.bird.size > bottomY)
        ) {
          endGame();
        }
      });

      // Update and draw fart particles (with fade and blur)
      data.fartParticles = data.fartParticles.filter(p => p.life > 0);
      data.fartParticles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 1;
        particle.size *= 0.985;
        particle.alpha *= 0.97;

        ctx.save();
        ctx.globalAlpha = Math.max(particle.alpha, 0);
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = particle.shadow;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw bird with face (squash & stretch)
      if (faceImage && faceImage.complete) {
        ctx.save();
        const rotation = Math.min(Math.max(data.bird.velocity * 0.05, -0.5), 0.5);
        const squash = Math.max(Math.min(-data.bird.velocity * 0.03, 0.25), -0.2);
        const scaleX = 1 - squash;
        const scaleY = 1 + squash;
        ctx.translate(data.bird.x + data.bird.size / 2, data.bird.y + data.bird.size / 2);
        ctx.rotate(rotation);
        ctx.scale(scaleX, scaleY);
        
        // Draw circle clip for face
        ctx.beginPath();
        ctx.arc(0, 0, data.bird.size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        // Draw face image (transparent PNG recommended)
        ctx.drawImage(
          faceImage,
          -data.bird.size / 2,
          -data.bird.size / 2,
          data.bird.size,
          data.bird.size
        );
        ctx.restore();
        
        // Draw border around face
        ctx.save();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(data.bird.x + data.bird.size / 2, data.bird.y + data.bird.size / 2, data.bird.size / 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else {
        // Default yellow circle
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(data.bird.x + data.bird.size / 2, data.bird.y + data.bird.size / 2, data.bird.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Check boundaries
      if (data.bird.y > canvas.height - data.bird.size || data.bird.y < 0) {
        endGame();
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();
  };

  const endGame = () => {
    setGameState('gameOver');
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    
    // Update high score
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('flappyHighScore', score.toString());
    }
  };

  const resetGame = () => {
    setGameState('ready');
    setScore(0);
    gameDataRef.current.bird.y = 200;
    gameDataRef.current.bird.velocity = 0;
    gameDataRef.current.pipes = [];
    gameDataRef.current.fartParticles = [];
    drawReadyScreen();
  };

  const drawReadyScreen = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(100, 80, 30, 0, Math.PI * 2);
    ctx.arc(120, 75, 35, 0, Math.PI * 2);
    ctx.arc(140, 80, 30, 0, Math.PI * 2);
    ctx.fill();

    const baseX = gameDataRef.current.bird.x;
    const baseY = gameDataRef.current.bird.y;
    const t = Date.now() / 1000;
    const hover = Math.sin(t * 2) * 5;

    // Draw bird
    if (faceImage && faceImage.complete) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(baseX + 25, baseY + 25 + hover, 25, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(faceImage, baseX, baseY + hover, 50, 50);
      ctx.restore();
      
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(baseX + 25, baseY + 25 + hover, 25, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(baseX + 25, baseY + 25 + hover, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFA500';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  };

  useEffect(() => {
    if (gameState === 'ready') {
      drawReadyScreen();
    }
  }, [gameState, faceImage]);

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-pink-400 to-purple-500 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent">
          Flappy Fart-eev
        </h1>
        
        <div className="flex justify-between items-center mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 font-medium">Score</p>
            <p className="text-3xl font-bold text-orange-600">{score}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 font-medium">High Score</p>
            <p className="text-3xl font-bold text-purple-600">{highScore}</p>
          </div>
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={500}
            height={600}
            onClick={jump}
            onTouchStart={jump}
            className="border-4 border-gray-300 rounded-xl cursor-pointer w-full bg-sky-300"
            style={{ maxWidth: '500px', height: 'auto' }}
          />
          
          {gameState === 'ready' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/95 rounded-2xl p-8 text-center shadow-xl">
                <h2 className="text-3xl font-bold mb-4 text-gray-800">Ready to Fart & Fly?</h2>
                <p className="text-lg text-gray-600 mb-2">Click anywhere to start</p>
                <p className="text-sm text-gray-500">Click/Tap to make your friend fart and fly!</p>
              </div>
            </div>
          )}

          {gameState === 'gameOver' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/95 rounded-2xl p-8 text-center shadow-xl">
                <h2 className="text-3xl font-bold mb-4 text-red-600">Game Over!</h2>
                <p className="text-xl mb-2">Score: <span className="font-bold text-orange-600">{score}</span></p>
                <p className="text-lg mb-6">High Score: <span className="font-bold text-purple-600">{highScore}</span></p>
                <Button
                  onClick={resetGame}
                  className="pointer-events-auto bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105"
                >
                  Play Again
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-gray-600">Click to fart and fly! Avoid the pipes!</p>
          {null}
        </div>
      </div>
    </div>
  );
};

export default GamePage;