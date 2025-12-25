class DinoRunner {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.gameOverOverlay = document.getElementById('gameOverOverlay');
        this.finalScoreElement = document.getElementById('finalScore');

        // New elements for score submission and leaderboard
        this.nameInputSection = document.getElementById('nameInputSection');
        this.playerNameInput = document.getElementById('playerName');
        this.submitScoreButton = document.getElementById('submitScoreButton');
        this.leaderboardSection = document.getElementById('leaderboardSection');
        this.leaderboardList = document.getElementById('leaderboardList');
        this.playAgainButton = document.getElementById('playAgainButton');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.errorMessage = document.getElementById('errorMessage');

        // API configuration
        this.apiBaseUrl = 'https://dino-backend-cxqw.onrender.com/api';

        // Game state
        this.gameRunning = true;
        this.score = 0;
        this.speed = 3; // Reduced from 5 for easier start
        
        // Dino properties
        this.dino = {
            x: 50,
            y: 150,
            width: 40,
            height: 40,
            velocityY: 0,
            isJumping: false,
            gravity: 0.6,
            jumpPower: -12
        };
        
        // Ground
        this.groundY = 190;
        
        // Obstacles
        this.obstacles = [];
        this.obstacleSpawnTimer = 0;
        this.obstacleSpawnRate = 180; // frames between spawns (increased from 120 for easier start)
        
        // Controls
        this.keys = {};
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.gameLoop();
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.keys[e.code] = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.keys[e.code] = false;
            }
        });

        this.playAgainButton.addEventListener('click', () => {
            this.restart();
        });

        this.submitScoreButton.addEventListener('click', () => {
            this.submitScore();
        });

        this.playAgainButton.addEventListener('click', () => {
            this.restart();
        });

        // Allow Enter key to submit score
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitScore();
            }
        });
    }
    
    gameLoop() {
        if (this.gameRunning) {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.gameLoop());
        }
    }
    
    update() {
        // Handle jump
        if (this.keys['Space'] && !this.dino.isJumping) {
            this.dino.velocityY = this.dino.jumpPower;
            this.dino.isJumping = true;
        }
        
        // Update dino physics
        this.dino.velocityY += this.dino.gravity;
        this.dino.y += this.dino.velocityY;
        
        // Ground collision
        if (this.dino.y >= this.groundY - this.dino.height) {
            this.dino.y = this.groundY - this.dino.height;
            this.dino.velocityY = 0;
            this.dino.isJumping = false;
        }
        
        // Update obstacles
        this.updateObstacles();
        
        // Check collisions
        this.checkCollisions();
        
        // Update score and speed
        this.score++;
        this.scoreElement.textContent = Math.floor(this.score / 10);
        
        // Gradually increase speed every 4 seconds (240 score points at ~60fps) for gentler scaling
        if (this.score % 240 === 0) {
            this.speed += 0.08; // Reduced from 0.1 for gentler increase
        }

        // Decrease spawn rate every 15 seconds (900 score points) for gentler difficulty
        if (this.score % 900 === 0 && this.obstacleSpawnRate > 60) {
            this.obstacleSpawnRate -= 5; // Reduced from 8 for gentler increase
        }
    }
    
    updateObstacles() {
        // Spawn new obstacles
        this.obstacleSpawnTimer++;
        if (this.obstacleSpawnTimer >= this.obstacleSpawnRate) {
            this.obstacles.push({
                x: this.canvas.width,
                y: this.groundY - 30,
                width: 20,
                height: 30
            });
            this.obstacleSpawnTimer = 0;
        }
        
        // Move obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            this.obstacles[i].x -= this.speed;
            
            // Remove off-screen obstacles
            if (this.obstacles[i].x + this.obstacles[i].width < 0) {
                this.obstacles.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        for (let obstacle of this.obstacles) {
            if (this.rectCollision(this.dino, obstacle)) {
                this.gameRunning = false;
                this.showGameOver();
                break;
            }
        }
    }
    
    rectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ground
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.groundY, this.canvas.width, 10);
        
        // Draw dino
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(this.dino.x, this.dino.y, this.dino.width, this.dino.height);
        
        // Draw dino eyes
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(this.dino.x + 25, this.dino.y + 10, 8, 8);
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(this.dino.x + 27, this.dino.y + 12, 4, 4);
        
        // Draw obstacles
        this.ctx.fillStyle = '#DC143C';
        for (let obstacle of this.obstacles) {
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
        
        // Draw clouds
        this.drawClouds();
    }
    
    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        // Static clouds for background
        this.ctx.beginPath();
        this.ctx.arc(100, 40, 20, 0, Math.PI * 2);
        this.ctx.arc(120, 40, 25, 0, Math.PI * 2);
        this.ctx.arc(140, 40, 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(400, 30, 15, 0, Math.PI * 2);
        this.ctx.arc(415, 30, 20, 0, Math.PI * 2);
        this.ctx.arc(435, 30, 15, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    showGameOver() {
        this.finalScoreElement.textContent = Math.floor(this.score / 10);
        this.gameOverOverlay.classList.remove('hidden');

        // Show name input section, hide leaderboard and loading
        this.nameInputSection.classList.remove('hidden');
        this.leaderboardSection.classList.add('hidden');
        this.loadingIndicator.classList.add('hidden');
        this.errorMessage.classList.add('hidden');

        // Focus on name input and clear any previous value
        this.playerNameInput.value = '';
        this.playerNameInput.focus();
    }

    async submitScore() {
        const playerName = this.playerNameInput.value.trim();

        // Validate name
        if (!playerName) {
            this.showError('Please enter your name');
            return;
        }

        if (playerName.length > 20) {
            this.showError('Name must be 20 characters or less');
            return;
        }

        // Show loading state
        this.nameInputSection.classList.add('hidden');
        this.loadingIndicator.classList.remove('hidden');
        this.errorMessage.classList.add('hidden');

        try {
            // Submit score to backend
            const response = await fetch(`${this.apiBaseUrl}/score`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: playerName,
                    score: Math.floor(this.score / 10),
                    date: new Date().toISOString()
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            // Success - fetch and display leaderboard
            await this.loadLeaderboard();

        } catch (error) {
            console.error('Error submitting score:', error);
            this.showError('Failed to save score. Please try again.');
            // Show name input again on error
            this.nameInputSection.classList.remove('hidden');
            this.loadingIndicator.classList.add('hidden');
        }
    }

    async loadLeaderboard() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/leaderboard?limit=10`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            this.displayLeaderboard(data.leaderboard);

        } catch (error) {
            console.error('Error loading leaderboard:', error);
            this.showError('Failed to load leaderboard');
        }
    }

    displayLeaderboard(leaderboard) {
        // Hide loading and show leaderboard
        this.loadingIndicator.classList.add('hidden');
        this.leaderboardSection.classList.remove('hidden');

        if (!leaderboard || leaderboard.length === 0) {
            this.leaderboardList.innerHTML = '<p>No scores yet!</p>';
            return;
        }

        const leaderboardHtml = leaderboard.map((entry, index) => `
            <div class="leaderboard-item ${index === 0 ? 'top-score' : ''}">
                <span class="rank">#${index + 1}</span>
                <span class="name">${this.escapeHtml(entry.name)}</span>
                <span class="score">${entry.score}</span>
            </div>
        `).join('');

        this.leaderboardList.innerHTML = leaderboardHtml;
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.remove('hidden');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    restart() {
        // Reset game state
        this.gameRunning = true;
        this.score = 0;
        this.speed = 3; // Reset to easier starting speed
        this.scoreElement.textContent = '0';

        // Reset dino position
        this.dino.y = this.groundY - this.dino.height;
        this.dino.velocityY = 0;
        this.dino.isJumping = false;

        // Reset obstacles
        this.obstacles = [];
        this.obstacleSpawnTimer = 0;
        this.obstacleSpawnRate = 180; // Reset to easier starting spawn rate

        // Hide game over overlay and reset all sections
        this.gameOverOverlay.classList.add('hidden');
        this.nameInputSection.classList.remove('hidden');
        this.leaderboardSection.classList.add('hidden');
        this.loadingIndicator.classList.add('hidden');
        this.errorMessage.classList.add('hidden');

        // Restart game loop
        this.gameLoop();
    }
}

// Start the game when the page loads
window.onload = () => {
    new DinoRunner();
};
