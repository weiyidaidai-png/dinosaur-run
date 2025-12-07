## 所有修改的文件内容

### 1. index.html

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>恐龙跑酷游戏</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="game-container">
        <div class="game-header">
            <div class="score">分数: <span id="current-score">0</span></div>
            <div class="high-score">最高分: <span id="high-score">0</span></div>
            <div class="speed">速度: <span id="current-speed">1.0</span>x</div>
        </div>
        <canvas id="gameCanvas" width="800" height="200"></canvas>
        <div class="game-controls">
            <button id="startButton">开始游戏</button>
            <div class="instructions">
                <p>游戏说明：</p>
                <p>1. 使用空格键或点击屏幕让恐龙跳跃</p>
                <p>2. 避开路上的仙人掌障碍物</p>
                <p>3. 跑得越远，分数越高</p>
                <p>4. 游戏会记录你的最高分数</p>
            </div>
        </div>
        <div id="gameOver" class="game-over hidden">
            <h2>游戏结束</h2>
            <p>最终分数: <span id="final-score">0</span></p>
            <button id="restartButton">重新开始</button>
        </div>
    </div>
    <script src="game.js"></script>
</body>
</html>```

### 2. style.css

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    background-color: #f0f0f0;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
}

.game-container {
    background-color: #ffffff;
    border-radius: 10px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
    padding: 20px;
    text-align: center;
    max-width: 900px;
    width: 100%;
}

.game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 10px 20px;
    background-color: #f8f9fa;
    border-radius: 5px;
}

.score, .high-score, .speed {
    font-size: 18px;
    font-weight: bold;
    color: #333;
}

#current-score, #high-score {
    color: #e74c3c;
}

#current-speed {
    color: #3498db;
}

#gameCanvas {
    display: block;
    margin: 0 auto 20px;
    background-color: #f0f0f0;
    border: 2px solid #333;
    border-radius: 5px;
}

.game-controls {
    margin-bottom: 20px;
}

#startButton, #restartButton {
    background-color: #2ecc71;
    color: white;
    border: none;
    padding: 12px 30px;
    font-size: 16px;
    font-weight: bold;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

#startButton:hover, #restartButton:hover {
    background-color: #27ae60;
}

#startButton:active, #restartButton:active {
    transform: translateY(1px);
}

.instructions {
    margin-top: 15px;
    color: #666;
    font-size: 14px;
}

.instructions p {
    margin: 5px 0;
}

.game-over {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.3);
    z-index: 1000;
}

.game-over h2 {
    color: #e74c3c;
    margin-bottom: 15px;
    font-size: 24px;
}

.game-over p {
    color: #333;
    margin-bottom: 20px;
    font-size: 16px;
}

#final-score {
    color: #e74c3c;
    font-weight: bold;
}

.hidden {
    display: none !important;
}

@media (max-width: 768px) {
    .game-container {
        padding: 15px;
    }

    .game-header {
        flex-direction: column;
        gap: 10px;
        padding: 15px;
    }

    #gameCanvas {
        width: 100%;
        max-width: 400px;
        height: auto;
    }

    #startButton, #restartButton {
        padding: 10px 25px;
        font-size: 14px;
    }
}```

### 3. game.js

```javascript
// 获取DOM元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const gameOverScreen = document.getElementById('gameOver');
const currentScoreElement = document.getElementById('current-score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('final-score');
const currentSpeedElement = document.getElementById('current-speed');

// 游戏状态
let gameState = 'ready'; // ready, playing, gameOver
let score = 0;
let highScore = localStorage.getItem('dinoHighScore') || 0;
let frames = 0;

// 加速机制配置
const SPEED_STEP = 0.2; // 每次加速的幅度
const SPEED_INTERVAL = 600; // 加速间隔（帧数，60帧=1秒，所以这里是10秒）
const MAX_SPEED = 8; // 最大速度限制
let currentSpeed = 1.0; // 当前游戏速度倍数

// 设置初始高分
highScoreElement.textContent = highScore;

// 恐龙对象
const dino = {
    x: 50,
    y: canvas.height - 50 - 20, // 距离地面20px
    width: 20,
    height: 20,
    dy: 0,
    gravity: 0.5,
    jumpPower: -10,
    grounded: true
};

// 障碍物数组
const obstacles = [];

// 障碍物类
class Obstacle {
    constructor() {
        this.width = 15;
        this.height = 25 + Math.random() * 25; // 随机高度
        this.x = canvas.width;
        this.y = canvas.height - 50 - this.height; // 距离地面
        this.baseSpeed = 4; // 基础速度
    }

    update() {
        // 根据当前游戏速度调整障碍物移动速度
        this.x -= this.baseSpeed * currentSpeed;
    }

    draw() {
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // 添加像素风格细节
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
    }
}

// 地面对象
const ground = {
    x: 0,
    y: canvas.height - 50,
    width: canvas.width,
    height: 50
};

// 绘制地面
function drawGround() {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(ground.x, ground.y, ground.width, ground.height);

    // 添加地面纹理
    ctx.fillStyle = '#654321';
    for (let i = 0; i < ground.width; i += 20) {
        ctx.fillRect(i, ground.y + 10, 10, 10);
    }
}

// 绘制恐龙
function drawDino() {
    ctx.fillStyle = '#000';
    ctx.fillRect(dino.x, dino.y, dino.width, dino.height);

    // 添加像素风格的眼睛
    ctx.fillStyle = '#fff';
    ctx.fillRect(dino.x + 12, dino.y + 5, 4, 4);
    ctx.fillStyle = '#000';
    ctx.fillRect(dino.x + 14, dino.y + 7, 2, 2);
}

// 更新恐龙
function updateDino() {
    // 应用重力
    dino.dy += dino.gravity;
    dino.y += dino.dy;

    // 检查是否落地
    if (dino.y >= canvas.height - 50 - dino.height) {
        dino.y = canvas.height - 50 - dino.height;
        dino.dy = 0;
        dino.grounded = true;
    } else {
        dino.grounded = false;
    }
}

// 跳跃
function jump() {
    if (dino.grounded) {
        dino.dy = dino.jumpPower;
        dino.grounded = false;
    }
}

// 更新障碍物
function updateObstacles() {
    // 生成障碍物
    if (frames % 60 === 0) {
        obstacles.push(new Obstacle());
    }

    // 更新和绘制障碍物
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update();
        obstacles[i].draw();

        // 检查是否超出屏幕
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            score += 10; // 通过障碍物加分
            currentScoreElement.textContent = score;
        }
    }
}

// 碰撞检测
function checkCollision() {
    for (let obstacle of obstacles) {
        if (
            dino.x < obstacle.x + obstacle.width &&
            dino.x + dino.width > obstacle.x &&
            dino.y < obstacle.y + obstacle.height &&
            dino.y + dino.height > obstacle.y
        ) {
            return true;
        }
    }
    return false;
}

// 游戏结束
function endGame() {
    gameState = 'gameOver';

    // 更新最高分
    const oldHighScore = highScore;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('dinoHighScore', highScore);
        highScoreElement.textContent = highScore;
    }

    // 显示游戏结束界面
    finalScoreElement.textContent = score;

    // 如果创造了新纪录，显示特殊提示
    const gameOverMessage = document.querySelector('#gameOver h2');
    if (score > oldHighScore) {
        gameOverMessage.textContent = '🎉 新纪录！';
        gameOverMessage.style.color = '#f39c12'; // 金色
    } else {
        gameOverMessage.textContent = '游戏结束';
        gameOverMessage.style.color = '#e74c3c'; // 红色
    }

    gameOverScreen.classList.remove('hidden');
}

// 重置游戏
function resetGame() {
    gameState = 'ready';
    score = 0;
    frames = 0;
    currentSpeed = 1.0; // 重置游戏速度
    obstacles.length = 0; // 清空障碍物数组

    // 重置恐龙位置
    dino.x = 50;
    dino.y = canvas.height - 50 - 20;
    dino.dy = 0;
    dino.grounded = true;

    // 重置界面
    currentScoreElement.textContent = score;
    currentSpeedElement.textContent = currentSpeed.toFixed(1); // 重置速度显示
    gameOverScreen.classList.add('hidden');
}

// 游戏主循环
function gameLoop() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制地面
    drawGround();

    if (gameState === 'playing') {
        frames++;

        // 更新和绘制恐龙
        updateDino();
        drawDino();

        // 更新和绘制障碍物
        updateObstacles();

        // 检查碰撞
        if (checkCollision()) {
            endGame();
        }

        // 定期增加游戏速度
        if (frames % SPEED_INTERVAL === 0 && currentSpeed * 4 < MAX_SPEED) {
            currentSpeed += SPEED_STEP;
            // 更新速度显示
            currentSpeedElement.textContent = currentSpeed.toFixed(1);
        }
    } else if (gameState === 'ready') {
        // 绘制准备状态的恐龙
        drawDino();

        // 显示游戏说明（已在HTML中提供中文说明）
        // 这里不再重复显示，保持画布简洁
    }

    // 请求下一帧
    requestAnimationFrame(gameLoop);
}

// 事件监听器
startButton.addEventListener('click', () => {
    if (gameState === 'ready') {
        gameState = 'playing';
        startButton.style.display = 'none';
    }
});

restartButton.addEventListener('click', () => {
    resetGame();
    startButton.style.display = 'inline-block';
});

// 键盘事件
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault(); // 防止空格键滚动页面

        if (gameState === 'ready') {
            gameState = 'playing';
            startButton.style.display = 'none';
        } else if (gameState === 'playing') {
            jump();
        }
    }
});

// 点击屏幕事件 - 支持同时点击和空格键
canvas.addEventListener('click', () => {
    if (gameState === 'ready') {
        gameState = 'playing';
        startButton.style.display = 'none';
    } else if (gameState === 'playing') {
        jump();
    }
});

// 触摸事件 - 支持移动设备触摸跳跃
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // 防止触摸时的默认行为（如缩放）

    if (gameState === 'ready') {
        gameState = 'playing';
        startButton.style.display = 'none';
    } else if (gameState === 'playing') {
        jump();
    }
});

// 启动游戏循环
gameLoop();```

## Git 差异对比

```diff
```
