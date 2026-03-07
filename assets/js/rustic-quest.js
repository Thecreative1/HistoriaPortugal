(() => {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const ui = {
    status: document.getElementById('statusText'),
    score: document.getElementById('scoreValue'),
    coins: document.getElementById('coinValue'),
    distance: document.getElementById('distanceValue'),
    restart: document.getElementById('restartBtn')
  };

  const labels = {
    start: 'Carrega em Espaço para começar a aventura.',
    playing: 'Corre até à Quinta do Tesouro!',
    gameOver: 'Fim de jogo! Evita os barris e tenta novamente.',
    victory: 'Vitória! Chegaste ao destino com os pergaminhos.'
  };

  const gravity = 0.6;
  const jumpPower = -12;
  const speed = 4;
  const goalDistance = 2600;

  let keys = { left: false, right: false, jump: false };
  let player;
  let obstacles;
  let coins;
  let platforms;
  let particles;
  let state;
  let distance;
  let score;
  let coinScore;
  let spawnTick;

  const reset = () => {
    player = { x: 90, y: 0, w: 34, h: 44, vx: 0, vy: 0, grounded: false, facing: 1 };
    obstacles = [];
    coins = [];
    platforms = [{ x: 0, y: canvas.height - 48, w: 5000, h: 48, kind: 'ground' }];
    particles = [];
    state = 'ready';
    distance = 0;
    score = 0;
    coinScore = 0;
    spawnTick = 0;

    ui.restart.hidden = true;
    ui.status.textContent = labels.start;
    updateHud();
  };

  const updateHud = () => {
    ui.score.textContent = Math.floor(score);
    ui.coins.textContent = coinScore;
    ui.distance.textContent = Math.floor(distance);
  };

  const spawnElements = () => {
    spawnTick += 1;

    if (spawnTick % 80 === 0) {
      obstacles.push({
        x: canvas.width + Math.random() * 180,
        y: canvas.height - 78,
        w: 34,
        h: 30,
        speed: speed + Math.random() * 1.2
      });
    }

    if (spawnTick % 55 === 0) {
      coins.push({
        x: canvas.width + Math.random() * 140,
        y: canvas.height - 145 - Math.random() * 95,
        r: 8
      });
    }

    if (spawnTick % 180 === 0) {
      const width = 80 + Math.random() * 90;
      platforms.push({
        x: canvas.width + Math.random() * 80,
        y: canvas.height - 120 - Math.random() * 120,
        w: width,
        h: 14,
        kind: 'floating'
      });
    }
  };

  const updatePlayer = () => {
    if (keys.left) {
      player.vx = -speed * 0.8;
      player.facing = -1;
    } else if (keys.right) {
      player.vx = speed;
      player.facing = 1;
    } else {
      player.vx *= 0.8;
    }

    if (keys.jump && player.grounded) {
      player.vy = jumpPower;
      player.grounded = false;

      for (let i = 0; i < 10; i += 1) {
        particles.push({
          x: player.x + player.w / 2,
          y: player.y + player.h,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 2,
          life: 24
        });
      }
    }

    player.vy += gravity;
    player.x += player.vx;
    player.y += player.vy;

    player.x = Math.max(20, Math.min(canvas.width * 0.5, player.x));
    player.grounded = false;

    for (const platform of platforms) {
      if (player.x + player.w <= platform.x || player.x >= platform.x + platform.w) continue;

      const isFalling = player.vy >= 0;
      const feet = player.y + player.h;
      if (isFalling && feet > platform.y && feet < platform.y + platform.h + 14) {
        player.y = platform.y - player.h;
        player.vy = 0;
        player.grounded = true;
      }
    }

    if (player.y > canvas.height + 120) {
      endGame(false);
    }
  };

  const collectCollisions = () => {
    for (const obstacle of obstacles) {
      const hitObstacle = (
        player.x < obstacle.x + obstacle.w
        && player.x + player.w > obstacle.x
        && player.y < obstacle.y + obstacle.h
        && player.y + player.h > obstacle.y
      );

      if (hitObstacle) {
        endGame(false);
        return;
      }
    }

    coins = coins.filter((coin) => {
      const closestX = Math.max(player.x, Math.min(coin.x, player.x + player.w));
      const closestY = Math.max(player.y, Math.min(coin.y, player.y + player.h));
      const dx = coin.x - closestX;
      const dy = coin.y - closestY;
      const gotCoin = (dx * dx + dy * dy) < coin.r * coin.r;

      if (gotCoin) {
        coinScore += 1;
        score += 35;
      }

      return !gotCoin;
    });
  };

  const updateWorld = () => {
    const worldSpeed = speed + Math.min(2.3, distance / 1200);

    for (const platform of platforms) {
      if (platform.kind !== 'ground') platform.x -= worldSpeed;
    }
    platforms = platforms.filter((platform) => platform.kind === 'ground' || platform.x + platform.w > -120);

    for (const obstacle of obstacles) obstacle.x -= obstacle.speed;
    obstacles = obstacles.filter((obstacle) => obstacle.x + obstacle.w > -50);

    for (const coin of coins) coin.x -= worldSpeed;
    coins = coins.filter((coin) => coin.x + coin.r > -20);

    for (const particle of particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.09;
      particle.life -= 1;
    }
    particles = particles.filter((particle) => particle.life > 0);

    distance += worldSpeed;
    score += 0.55 + worldSpeed * 0.03;

    collectCollisions();

    if (distance >= goalDistance) {
      endGame(true);
    }

    updateHud();
  };

  const endGame = (victory) => {
    state = victory ? 'victory' : 'gameover';
    ui.status.textContent = victory ? labels.victory : labels.gameOver;
    ui.restart.hidden = false;
  };

  const drawBackground = () => {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#85c4cf');
    gradient.addColorStop(1, '#f2d49f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f6e5c2';
    for (let i = 0; i < 3; i += 1) {
      const hillOffset = (distance * (0.15 + i * 0.08)) % (canvas.width + 260);
      ctx.beginPath();
      ctx.ellipse(canvas.width - hillOffset, canvas.height - 60, 220, 90 + i * 15, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#366147';
    for (let i = 0; i < 7; i += 1) {
      const treeX = (i * 180 - (distance * 0.45) % 900) + 40;
      ctx.fillRect(treeX, canvas.height - 170, 12, 60);
      ctx.beginPath();
      ctx.arc(treeX + 6, canvas.height - 180, 26, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawPlatforms = () => {
    for (const platform of platforms) {
      ctx.fillStyle = platform.kind === 'ground' ? '#6b4c2f' : '#8b5f3d';
      ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
      ctx.fillStyle = '#d2aa6f';
      ctx.fillRect(platform.x, platform.y, platform.w, 4);
    }
  };

  const drawPlayer = () => {
    ctx.fillStyle = '#163b5c';
    ctx.fillRect(player.x, player.y + 10, player.w, player.h - 10);
    ctx.fillStyle = '#f7d0aa';
    ctx.fillRect(player.x + 8, player.y, player.w - 16, 16);
    ctx.fillStyle = '#c0362c';
    ctx.fillRect(player.x + 2, player.y + 4, player.w - 4, 8);
    ctx.fillStyle = '#1f2a44';
    ctx.fillRect(player.x + (player.facing === 1 ? 22 : 8), player.y + 7, 4, 4);
  };

  const drawObstacles = () => {
    ctx.fillStyle = '#5b3821';
    for (const obstacle of obstacles) {
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);
      ctx.fillStyle = '#c79f67';
      ctx.fillRect(obstacle.x + 4, obstacle.y + 6, obstacle.w - 8, 4);
      ctx.fillStyle = '#5b3821';
    }
  };

  const drawCoins = () => {
    for (const coin of coins) {
      ctx.beginPath();
      ctx.fillStyle = '#ffd447';
      ctx.arc(coin.x, coin.y, coin.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f1b510';
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, coin.r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawGoal = () => {
    const goalX = canvas.width - (goalDistance - distance);
    if (goalX > canvas.width + 90 || state === 'ready') return;

    ctx.fillStyle = '#f3f0e4';
    ctx.fillRect(goalX, canvas.height - 140, 58, 92);
    ctx.fillStyle = '#9f6a2d';
    ctx.fillRect(goalX + 22, canvas.height - 70, 14, 22);
    ctx.fillStyle = '#8e1f23';
    ctx.beginPath();
    ctx.moveTo(goalX + 58, canvas.height - 140);
    ctx.lineTo(goalX + 58, canvas.height - 95);
    ctx.lineTo(goalX + 95, canvas.height - 116);
    ctx.closePath();
    ctx.fill();
  };

  const drawParticles = () => {
    for (const particle of particles) {
      ctx.globalAlpha = Math.max(0, particle.life / 24);
      ctx.fillStyle = '#e5c48b';
      ctx.fillRect(particle.x, particle.y, 3, 3);
    }
    ctx.globalAlpha = 1;
  };

  const loop = () => {
    drawBackground();

    if (state === 'playing') {
      spawnElements();
      updatePlayer();
      updateWorld();
    }

    drawGoal();
    drawPlatforms();
    drawObstacles();
    drawCoins();
    drawParticles();
    drawPlayer();

    requestAnimationFrame(loop);
  };

  const startGame = () => {
    if (state !== 'ready') return;
    state = 'playing';
    ui.status.textContent = labels.playing;
  };

  document.addEventListener('keydown', (event) => {
    if (event.code === 'ArrowLeft') keys.left = true;
    if (event.code === 'ArrowRight') keys.right = true;

    if (event.code === 'ArrowUp' || event.code === 'Space') {
      keys.jump = true;
      startGame();
    }
  });

  document.addEventListener('keyup', (event) => {
    if (event.code === 'ArrowLeft') keys.left = false;
    if (event.code === 'ArrowRight') keys.right = false;
    if (event.code === 'ArrowUp' || event.code === 'Space') keys.jump = false;
  });

  ui.restart.addEventListener('click', reset);

  reset();
  loop();
})();
