import { dbInstance, migrationDbInstance } from './auth';
import { Pool } from 'pg';
import { DatabaseSync } from 'node:sqlite';

export interface GameRecord {
  id: string;
  title: string;
  description: string;
  icon: string;
  htmlContent: string;
  cssContent?: string;
  jsContent?: string;
  authorId: string;
  authorUsername: string;
  authorAvatar: string;
  playCount: number;
  createdAt: string;
}

interface RawGameRow {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  html_content: string;
  css_content: string | null;
  js_content: string | null;
  author_id: string;
  author_username: string;
  author_avatar: string | null;
  play_count: number;
  created_at: Date | string;
}

const DEMO_GAMES: GameRecord[] = [
  {
    id: 'game-space-blaster',
    title: 'Space Blaster 3000',
    description: 'Defend your starship from incoming cosmic asteroids! Use Arrow Keys or A/D to move, Space to fire lasers.',
    icon: '🚀',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Space Blaster</title>
</head>
<body>
  <div id="game-ui">
    <div id="score">SCORE: <span id="score-val">0</span></div>
    <div id="lives">LIVES: <span id="lives-val">3</span></div>
  </div>
  <canvas id="canvas" width="600" height="400"></canvas>
  <div id="game-over">
    <h2>MISSION FAILED</h2>
    <p>Final Score: <span id="final-score">0</span></p>
    <button onclick="restartGame()">PLAY AGAIN 🔁</button>
  </div>
</body>
</html>`,
    cssContent: `body {
  margin: 0;
  background: #060913;
  color: #fff;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  overflow: hidden;
  user-select: none;
}
#game-ui {
  display: flex;
  justify-content: space-between;
  width: 600px;
  max-width: 95vw;
  margin-bottom: 8px;
  font-weight: bold;
  font-size: 16px;
  letter-spacing: 2px;
  color: #38bdf8;
}
canvas {
  background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
  border: 2px solid #38bdf8;
  border-radius: 12px;
  box-shadow: 0 0 25px rgba(56, 189, 248, 0.25);
  max-width: 95vw;
}
#game-over {
  display: none;
  position: absolute;
  background: rgba(15, 23, 42, 0.95);
  border: 2px solid #f43f5e;
  padding: 24px 40px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 0 35px rgba(244, 63, 94, 0.4);
}
#game-over h2 {
  color: #f43f5e;
  margin: 0 0 10px 0;
  font-size: 28px;
}
#game-over button {
  background: #38bdf8;
  color: #020617;
  border: none;
  padding: 10px 24px;
  font-weight: bold;
  font-size: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.1s;
}
#game-over button:hover {
  transform: scale(1.05);
}`,
    jsContent: `const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let score = 0;
let lives = 3;
let gameOver = false;

const player = {
  x: canvas.width / 2 - 15,
  y: canvas.height - 40,
  w: 30,
  h: 24,
  speed: 6
};

const keys = {};
let lasers = [];
let asteroids = [];
let particles = [];

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Space' && !gameOver) {
    lasers.push({ x: player.x + player.w / 2 - 2, y: player.y, w: 4, h: 12, speed: 8 });
  }
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

// Touch controls for mobile / kid tablets
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touchX = e.touches[0].clientX - rect.left;
  player.x = touchX - player.w / 2;
});
canvas.addEventListener('touchstart', e => {
  if (!gameOver) {
    lasers.push({ x: player.x + player.w / 2 - 2, y: player.y, w: 4, h: 12, speed: 8 });
  }
});

function spawnAsteroid() {
  if (gameOver) return;
  asteroids.push({
    x: Math.random() * (canvas.width - 30),
    y: -30,
    size: 20 + Math.random() * 20,
    speed: 1.5 + Math.random() * 2.5
  });
}
setInterval(spawnAsteroid, 1000);

function createExplosion(x, y, color) {
  for (let i = 0; i < 12; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 25,
      color
    });
  }
}

function update() {
  if (gameOver) return;

  if (keys['ArrowLeft'] || keys['KeyA']) player.x = Math.max(0, player.x - player.speed);
  if (keys['ArrowRight'] || keys['KeyD']) player.x = Math.min(canvas.width - player.w, player.x + player.speed);

  // Lasers
  for (let i = lasers.length - 1; i >= 0; i--) {
    lasers[i].y -= lasers[i].speed;
    if (lasers[i].y < -20) lasers.splice(i, 1);
  }

  // Asteroids
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.y += a.speed;

    // Hit by laser
    for (let j = lasers.length - 1; j >= 0; j--) {
      const l = lasers[j];
      if (l.x > a.x && l.x < a.x + a.size && l.y > a.y && l.y < a.y + a.size) {
        createExplosion(a.x + a.size/2, a.y + a.size/2, '#f59e0b');
        asteroids.splice(i, 1);
        lasers.splice(j, 1);
        score += 100;
        document.getElementById('score-val').innerText = score;
        break;
      }
    }

    // Hit player
    if (a.y + a.size > player.y && a.x + a.size > player.x && a.x < player.x + player.w) {
      createExplosion(player.x + player.w/2, player.y + player.h/2, '#f43f5e');
      asteroids.splice(i, 1);
      lives--;
      document.getElementById('lives-val').innerText = lives;
      if (lives <= 0) {
        gameOver = true;
        document.getElementById('final-score').innerText = score;
        document.getElementById('game-over').style.display = 'block';
      }
    } else if (a.y > canvas.height + 40) {
      asteroids.splice(i, 1);
    }
  }

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Player ship
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(player.x + player.w / 2, player.y);
  ctx.lineTo(player.x + player.w, player.y + player.h);
  ctx.lineTo(player.x + player.w / 2, player.y + player.h - 6);
  ctx.lineTo(player.x, player.y + player.h);
  ctx.closePath();
  ctx.fill();

  // Lasers
  ctx.fillStyle = '#22d3ee';
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#22d3ee';
  lasers.forEach(l => ctx.fillRect(l.x, l.y, l.w, l.h));
  ctx.shadowBlur = 0;

  // Asteroids
  ctx.fillStyle = '#f97316';
  asteroids.forEach(a => {
    ctx.beginPath();
    ctx.arc(a.x + a.size/2, a.y + a.size/2, a.size/2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Particles
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 3, 3);
  });

  requestAnimationFrame(() => {
    update();
    draw();
  });
}

function restartGame() {
  score = 0;
  lives = 3;
  gameOver = false;
  lasers = [];
  asteroids = [];
  particles = [];
  player.x = canvas.width / 2 - 15;
  document.getElementById('score-val').innerText = score;
  document.getElementById('lives-val').innerText = lives;
  document.getElementById('game-over').style.display = 'none';
}

draw();`,
    authorId: 'creator-buddy',
    authorUsername: 'CaptainCosmo',
    authorAvatar: '👨‍🚀',
    playCount: 142,
    createdAt: new Date().toISOString()
  },
  {
    id: 'game-neon-pong',
    title: 'Neon Cyber Pong',
    description: 'Fast-paced cybernetic tennis against an autonomous AI opponent. First to 5 points wins!',
    icon: '🏓',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Neon Cyber Pong</title>
</head>
<body>
  <div id="scoreboard">
    <span id="player-score">0</span> : <span id="ai-score">0</span>
  </div>
  <canvas id="pong" width="600" height="400"></canvas>
  <p id="help-text">Move mouse or touch screen up/down to steer your paddle!</p>
</body>
</html>`,
    cssContent: `body {
  margin: 0;
  background: #05050c;
  color: #fff;
  font-family: monospace;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  overflow: hidden;
}
#scoreboard {
  font-size: 36px;
  font-weight: 900;
  color: #a855f7;
  letter-spacing: 6px;
  margin-bottom: 12px;
  text-shadow: 0 0 15px rgba(168, 85, 247, 0.6);
}
canvas {
  background: #0d0e1c;
  border: 2px solid #a855f7;
  border-radius: 10px;
  box-shadow: 0 0 25px rgba(168, 85, 247, 0.2);
  cursor: none;
}
#help-text {
  color: #64748b;
  font-size: 12px;
  margin-top: 10px;
}`,
    jsContent: `const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

let playerScore = 0;
let aiScore = 0;

const paddleWidth = 10;
const paddleHeight = 70;

let playerY = (canvas.height - paddleHeight) / 2;
let aiY = (canvas.height - paddleHeight) / 2;

let ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 7,
  vx: 5,
  vy: 3
};

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  playerY = e.clientY - rect.top - paddleHeight / 2;
});

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  playerY = e.touches[0].clientY - rect.top - paddleHeight / 2;
});

function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.vx = -ball.vx;
  ball.vy = (Math.random() - 0.5) * 6;
}

function loop() {
  // Move AI paddle
  const targetAI = ball.y - paddleHeight / 2;
  aiY += (targetAI - aiY) * 0.08;

  // Clamp paddles
  playerY = Math.max(0, Math.min(canvas.height - paddleHeight, playerY));
  aiY = Math.max(0, Math.min(canvas.height - paddleHeight, aiY));

  // Move Ball
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Top / bottom bounce
  if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
    ball.vy = -ball.vy;
  }

  // Player paddle hit
  if (ball.x - ball.radius < 25 && ball.y > playerY && ball.y < playerY + paddleHeight) {
    ball.vx = Math.abs(ball.vx) * 1.05;
    ball.vy += (ball.y - (playerY + paddleHeight / 2)) * 0.15;
  }

  // AI paddle hit
  if (ball.x + ball.radius > canvas.width - 25 && ball.y > aiY && ball.y < aiY + paddleHeight) {
    ball.vx = -Math.abs(ball.vx) * 1.05;
    ball.vy += (ball.y - (aiY + paddleHeight / 2)) * 0.15;
  }

  // Score
  if (ball.x < 0) {
    aiScore++;
    document.getElementById('ai-score').innerText = aiScore;
    resetBall();
  } else if (ball.x > canvas.width) {
    playerScore++;
    document.getElementById('player-score').innerText = playerScore;
    resetBall();
  }

  // Draw
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Center net line
  ctx.strokeStyle = '#1e1b4b';
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  // Player paddle (cyan)
  ctx.fillStyle = '#06b6d4';
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#06b6d4';
  ctx.fillRect(15, playerY, paddleWidth, paddleHeight);

  // AI paddle (purple)
  ctx.fillStyle = '#a855f7';
  ctx.shadowColor = '#a855f7';
  ctx.fillRect(canvas.width - 25, aiY, paddleWidth, paddleHeight);

  // Ball
  ctx.fillStyle = '#f43f5e';
  ctx.shadowColor = '#f43f5e';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  requestAnimationFrame(loop);
}

loop();`,
    authorId: 'creator-arcade',
    authorUsername: 'PixelMaster',
    authorAvatar: '🕹️',
    playCount: 98,
    createdAt: new Date().toISOString()
  }
];

// Initialize games storage
let initialized = false;

async function ensureGamesTable() {
  if (initialized) return;

  try {
    if (migrationDbInstance instanceof Pool) {
      await migrationDbInstance.query(`
        CREATE TABLE IF NOT EXISTS games (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          icon TEXT NOT NULL,
          html_content TEXT NOT NULL,
          css_content TEXT,
          js_content TEXT,
          author_id TEXT NOT NULL,
          author_username TEXT NOT NULL,
          author_avatar TEXT,
          play_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Seed demos if table is empty
      const { rowCount } = await migrationDbInstance.query('SELECT 1 FROM games LIMIT 1');
      if (rowCount === 0) {
        for (const game of DEMO_GAMES) {
          await migrationDbInstance.query(
            `INSERT INTO games (id, title, description, icon, html_content, css_content, js_content, author_id, author_username, author_avatar, play_count, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              game.id,
              game.title,
              game.description,
              game.icon,
              game.htmlContent,
              game.cssContent || '',
              game.jsContent || '',
              game.authorId,
              game.authorUsername,
              game.authorAvatar,
              game.playCount,
              game.createdAt
            ]
          );
        }
      }
    } else if (dbInstance instanceof DatabaseSync) {
      dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS games (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          icon TEXT NOT NULL,
          html_content TEXT NOT NULL,
          css_content TEXT,
          js_content TEXT,
          author_id TEXT NOT NULL,
          author_username TEXT NOT NULL,
          author_avatar TEXT,
          play_count INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      const check = dbInstance.prepare('SELECT COUNT(*) as count FROM games').get() as { count: number };
      if (!check || check.count === 0) {
        const insert = dbInstance.prepare(`
          INSERT INTO games (id, title, description, icon, html_content, css_content, js_content, author_id, author_username, author_avatar, play_count, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const game of DEMO_GAMES) {
          insert.run(
            game.id,
            game.title,
            game.description,
            game.icon,
            game.htmlContent,
            game.cssContent || '',
            game.jsContent || '',
            game.authorId,
            game.authorUsername,
            game.authorAvatar,
            game.playCount,
            game.createdAt
          );
        }
      }
    }
  } catch (err) {
    console.warn('ensureGamesTable notice:', err);
  }

  initialized = true;
}

export async function getAllGames(): Promise<GameRecord[]> {
  await ensureGamesTable();

  if (dbInstance instanceof Pool) {
    const res = await dbInstance.query<RawGameRow>(`SELECT * FROM games ORDER BY created_at DESC`);
    return res.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description || '',
      icon: row.icon,
      htmlContent: row.html_content,
      cssContent: row.css_content || '',
      jsContent: row.js_content || '',
      authorId: row.author_id,
      authorUsername: row.author_username,
      authorAvatar: row.author_avatar || '👾',
      playCount: row.play_count || 0,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at)
    }));
  } else if (dbInstance instanceof DatabaseSync) {
    const rows = dbInstance.prepare(`SELECT * FROM games ORDER BY created_at DESC`).all() as unknown as RawGameRow[];
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description || '',
      icon: row.icon,
      htmlContent: row.html_content,
      cssContent: row.css_content || '',
      jsContent: row.js_content || '',
      authorId: row.author_id,
      authorUsername: row.author_username,
      authorAvatar: row.author_avatar || '👾',
      playCount: row.play_count || 0,
      createdAt: String(row.created_at)
    }));
  }

  return DEMO_GAMES;
}

export async function createGame(game: Omit<GameRecord, 'id' | 'playCount' | 'createdAt'>): Promise<GameRecord> {
  await ensureGamesTable();

  const id = `game-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const createdAt = new Date().toISOString();
  const playCount = 0;

  const newGame: GameRecord = {
    id,
    ...game,
    playCount,
    createdAt
  };

  if (dbInstance instanceof Pool) {
    await dbInstance.query(
      `INSERT INTO games (id, title, description, icon, html_content, css_content, js_content, author_id, author_username, author_avatar, play_count, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        newGame.id,
        newGame.title,
        newGame.description,
        newGame.icon,
        newGame.htmlContent,
        newGame.cssContent || '',
        newGame.jsContent || '',
        newGame.authorId,
        newGame.authorUsername,
        newGame.authorAvatar,
        newGame.playCount,
        newGame.createdAt
      ]
    );
  } else if (dbInstance instanceof DatabaseSync) {
    dbInstance.prepare(`
      INSERT INTO games (id, title, description, icon, html_content, css_content, js_content, author_id, author_username, author_avatar, play_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newGame.id,
      newGame.title,
      newGame.description,
      newGame.icon,
      newGame.htmlContent,
      newGame.cssContent || '',
      newGame.jsContent || '',
      newGame.authorId,
      newGame.authorUsername,
      newGame.authorAvatar,
      newGame.playCount,
      newGame.createdAt
    );
  }

  return newGame;
}

export async function getGameById(gameId: string): Promise<GameRecord | null> {
  await ensureGamesTable();

  if (dbInstance instanceof Pool) {
    const res = await dbInstance.query<RawGameRow>('SELECT * FROM games WHERE id = $1', [gameId]);
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      title: row.title,
      description: row.description || '',
      icon: row.icon,
      htmlContent: row.html_content,
      cssContent: row.css_content || '',
      jsContent: row.js_content || '',
      authorId: row.author_id,
      authorUsername: row.author_username,
      authorAvatar: row.author_avatar || '👾',
      playCount: row.play_count || 0,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    };
  } else if (dbInstance instanceof DatabaseSync) {
    const row = dbInstance.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as unknown as RawGameRow | undefined;
    if (!row) return null;
    return {
      id: row.id,
      title: row.title,
      description: row.description || '',
      icon: row.icon,
      htmlContent: row.html_content,
      cssContent: row.css_content || '',
      jsContent: row.js_content || '',
      authorId: row.author_id,
      authorUsername: row.author_username,
      authorAvatar: row.author_avatar || '👾',
      playCount: row.play_count || 0,
      createdAt: String(row.created_at),
    };
  }

  const demo = DEMO_GAMES.find((g) => g.id === gameId);
  return demo || null;
}

export async function deleteGame(gameId: string): Promise<boolean> {
  await ensureGamesTable();

  if (dbInstance instanceof Pool) {
    const res = await dbInstance.query('DELETE FROM games WHERE id = $1', [gameId]);
    return (res.rowCount ?? 0) > 0;
  } else if (dbInstance instanceof DatabaseSync) {
    const info = dbInstance.prepare('DELETE FROM games WHERE id = ?').run(gameId);
    return Number(info.changes) > 0;
  }

  return false;
}

export async function incrementPlayCount(gameId: string): Promise<number> {
  await ensureGamesTable();

  if (dbInstance instanceof Pool) {
    const res = await dbInstance.query<{ play_count: number }>(
      `UPDATE games SET play_count = play_count + 1 WHERE id = $1 RETURNING play_count`,
      [gameId]
    );
    return res.rows[0]?.play_count ?? 0;
  } else if (dbInstance instanceof DatabaseSync) {
    dbInstance.prepare(`UPDATE games SET play_count = play_count + 1 WHERE id = ?`).run(gameId);
    const row = dbInstance.prepare(`SELECT play_count FROM games WHERE id = ?`).get(gameId) as { play_count: number } | undefined;
    return row?.play_count ?? 0;
  }

  return 1;
}
