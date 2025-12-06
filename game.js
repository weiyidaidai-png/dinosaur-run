// 获取DOM元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const gameOverScreen = document.getElementById('gameOver');
const currentScoreElement = document.getElementById('current-score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('final-score');

// 游戏状态
let gameState = 'ready'; // ready, playing, gameOver
let score = 0;
let highScore = localStorage.getItem('dinoHighScore') || 0;
let frames = 0;

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
        this.speed = 4;
    }

    update() {
        this.x -= this.speed;
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
    obstacles.length = 0; // 清空障碍物数组

    // 重置恐龙位置
    dino.x = 50;
    dino.y = canvas.height - 50 - 20;
    dino.dy = 0;
    dino.grounded = true;

    // 重置界面
    currentScoreElement.textContent = score;
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

        // 逐渐增加游戏速度
        if (frames % 100 === 0 && Obstacle.prototype.speed < 8) {
            Obstacle.prototype.speed += 0.2;
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
gameLoop();