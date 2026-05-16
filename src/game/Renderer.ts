import { GameState, Entity, EntityType, ItemType, EnemyType } from './types';

export function render(ctx: CanvasRenderingContext2D, state: GameState, width: number, height: number, debug = false) {
  const { camera, screenshake } = state;
  
  // Apply Screenshake
  const shakeX = (Math.random() - 0.5) * screenshake;
  const shakeY = (Math.random() - 0.5) * screenshake;

  // Glitch effect for high screenshake or hitStop
  let offsetX = shakeX;
  let offsetY = shakeY;
  if (screenshake > 15 || state.hitStop > 0) {
    if (Math.random() < 0.2) {
      offsetX += (Math.random() - 0.5) * 40;
      offsetY += (Math.random() - 0.5) * 40;
    }
  }

  // Clear
  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.translate(offsetX, offsetY);

  // Deep Space Background with optimized gradient
  const bgGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height));
  bgGrad.addColorStop(0, '#1e1b4b'); // Deep indigo center
  bgGrad.addColorStop(1, '#0c0c0e'); // Black edges
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Starfield (Parallax layers) with better glow
  const starSeed = 12345;
  for (let i = 0; i < 150; i++) {
    const x = ((Math.sin(i * 123.45 + starSeed) * 10000) % state.world.width);
    const y = ((Math.cos(i * 456.78 + starSeed) * 10000) % state.world.height);
    
    // 3 Layers of parallax
    const layer = i % 3;
    const parallax = (layer + 1) * 0.15;
    const drawX = (x - camera.x * parallax + state.world.width) % state.world.width;
    const drawY = (y - camera.y * parallax + state.world.height) % state.world.height;
    
    // Frustum culling for stars
    if (drawX < 0 || drawX > width || drawY < 0 || drawY > height) continue;

    const brightness = 0.2 + (i % 5) * 0.15;
    ctx.fillStyle = layer === 2 ? `rgba(255, 255, 255, ${brightness})` : `rgba(147, 197, 253, ${brightness * 0.6})`;
    const size = layer === 2 ? 2.5 : 1.5;
    ctx.fillRect(drawX, drawY, size, size);
    
    if (layer === 2 && i % 10 === 0) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'white';
      ctx.fillRect(drawX, drawY, size, size);
      ctx.shadowBlur = 0;
    }
  }

  // Nebula Clouds (Atmospheric backdrop)
  const nebulaSeed = 98765;
  ctx.save();
  for (let i = 0; i < 5; i++) {
    const x = ((Math.sin(i * 789.01 + nebulaSeed) * 20000) % state.world.width);
    const y = ((Math.cos(i * 123.45 + nebulaSeed) * 20000) % state.world.height);
    const parallax = 0.05;
    const drawX = (x - camera.x * parallax + state.world.width) % state.world.width;
    const drawY = (y - camera.y * parallax + state.world.height) % state.world.height;
    
    if (drawX < -400 || drawX > width + 400 || drawY < -400 || drawY > height + 400) continue;

    const grad = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, 400);
    const hue = (i * 40) % 360;
    grad.addColorStop(0, `hsla(${hue}, 70%, 50%, 0.05)`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(drawX - 400, drawY - 400, 800, 800);
  }
  ctx.restore();

  // Core Background Grid (Arena Floor)
  const gridBrightness = 0.2 + (state.screenshake * 0.03);
  const gridSize = 200;
  
  const startX = -(camera.x % gridSize);
  const startY = -(camera.y % gridSize);

  // Draw Arena Floor
  ctx.save();
  ctx.strokeStyle = `rgba(96, 165, 250, ${gridBrightness * 0.5})`;
  ctx.lineWidth = 2;
  
  // Vertical lines
  for (let x = startX - gridSize; x < width + gridSize; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  // Horizontal lines
  for (let y = startY - gridSize; y < height + gridSize; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // Highlight intersections with glowing dots
  ctx.fillStyle = `rgba(147, 197, 253, ${gridBrightness})`;
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#60a5fa';
  for (let x = startX - gridSize; x < width + gridSize; x += gridSize) {
    for (let y = startY - gridSize; y < height + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // World Bounds / Arena Walls
  const worldScreenX = -camera.x;
  const worldScreenY = -camera.y;
  ctx.save();
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 8;
  ctx.shadowBlur = 30;
  ctx.shadowColor = '#60a5fa';
  ctx.strokeRect(worldScreenX, worldScreenY, state.world.width, state.world.height);
  
  // Arena Border Glow (Wall effect)
  const wallGrad = ctx.createLinearGradient(worldScreenX, worldScreenY, worldScreenX + 50, worldScreenY);
  ctx.fillStyle = 'rgba(96, 165, 250, 0.1)';
  ctx.fillRect(worldScreenX, worldScreenY, 50, state.world.height); // North/South wall
  ctx.restore();

  // Draw Vignette / Scanlines

  // Render Obstacles
  state.obstacles.forEach(obs => {
    const drawX = obs.pos.x - camera.x;
    const drawY = obs.pos.y - camera.y;

    if (
      drawX < -Math.max(obs.size.x, obs.size.y) || 
      drawX > width + Math.max(obs.size.x, obs.size.y) || 
      drawY < -Math.max(obs.size.x, obs.size.y) || 
      drawY > height + Math.max(obs.size.x, obs.size.y)
    ) return;

    ctx.save();
    ctx.translate(drawX, drawY);
    ctx.rotate(obs.rotation);
    ctx.fillStyle = obs.color;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;

    if (obs.type === 'RECT') {
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 10;
      ctx.fillRect(-obs.size.x / 2, -obs.size.y / 2, obs.size.x, obs.size.y);
      ctx.shadowBlur = 0;
      ctx.strokeRect(-obs.size.x / 2, -obs.size.y / 2, obs.size.x, obs.size.y);
      
      // Cyber pattern on rects
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.1)';
      ctx.beginPath();
      ctx.moveTo(-obs.size.x / 2, -obs.size.y / 2);
      ctx.lineTo(obs.size.x / 2, obs.size.y / 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 10;
      ctx.arc(0, 0, obs.size.x, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.stroke();

      // Cyber pattern on circles
      ctx.beginPath();
      ctx.arc(0, 0, obs.size.x * 0.8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.1)';
      ctx.stroke();
    }

    ctx.restore();
  });

  // Render Items (with culling)
  state.items.forEach(item => {
    const drawX = item.pos.x - camera.x;
    const drawY = item.pos.y - camera.y;

    if (drawX < -25 || drawX > width + 25 || drawY < -25 || drawY > height + 25) return;

    const time = Date.now() / 400;
    const bounce = Math.sin(time + item.id.length) * 4;
    const size = item.radius;

    // Rarity determination
    const isLegendary = [ItemType.MULTISHOT, ItemType.OVERDRIVE, ItemType.SHIELD, ItemType.RAPID_FIRE, ItemType.TIME_SLOW, ItemType.PIERCING].includes(item.itemType!);
    const isRare = [ItemType.BOMB, ItemType.MAGNET, ItemType.SCORE_MULTIPLIER].includes(item.itemType!);

    ctx.save();
    ctx.translate(drawX, drawY + bounce);
    
    if (isLegendary) {
      // Pulsing Star shape
      const rot = time;
      ctx.rotate(rot);
      ctx.shadowBlur = 25;
      ctx.shadowColor = item.color;
      ctx.fillStyle = item.color;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const ang = (i * Math.PI * 2) / 5;
        const x = Math.cos(ang) * size * 1.6;
        const y = Math.sin(ang) * size * 1.6;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        const ang2 = ang + (Math.PI * 2) / 10;
        ctx.lineTo(Math.cos(ang2) * size * 0.8, Math.sin(ang2) * size * 0.8);
      }
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (isRare) {
      // Rotating Diamond
      ctx.rotate(time * 1.5);
      ctx.shadowBlur = 15;
      ctx.shadowColor = item.color;
      ctx.fillStyle = item.color;
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-size * 0.8, -size * 0.8, size * 1.6, size * 1.6);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-size * 0.8, -size * 0.8, size * 1.6, size * 1.6);
    } else {
      // Common Hexagon
      ctx.rotate(time * 0.5);
      ctx.shadowBlur = 8;
      ctx.shadowColor = item.color;
      ctx.fillStyle = item.color;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI * 2) / 6;
        const x = Math.cos(ang) * size;
        const y = Math.sin(ang) * size;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.stroke();
    }
    
    ctx.restore();
    ctx.shadowBlur = 0;
    
    // Draw Emojis
    const emojiMap: Record<string, string> = {
      [ItemType.HEALTH]: '❤️',
      [ItemType.ENERGY]: '⚡',
      [ItemType.SCORE]: '⭐',
      [ItemType.MULTISHOT]: '🔷',
      [ItemType.OVERDRIVE]: '💥',
      [ItemType.SHIELD]: '🛡️',
      [ItemType.MAGNET]: '🧲',
      [ItemType.SCORE_MULTIPLIER]: '💯',
      [ItemType.BOMB]: '💣',
      [ItemType.RAPID_FIRE]: '🔥',
      [ItemType.TIME_SLOW]: '⏰',
      [ItemType.PIERCING]: '🎯',
    };
    const emoji = item.itemType ? emojiMap[item.itemType] : '🎁';
    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, drawX, drawY + bounce);

  });

  // Render Particles (with culling)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  state.particles.forEach(p => {
    const drawX = p.pos.x - camera.x;
    const drawY = p.pos.y - camera.y;

    if (drawX < -200 || drawX > width + 200 || drawY < -200 || drawY > height + 200) return;

    const lifeRatio = Math.max(0, Math.min(1, p.life / p.maxLife));
    ctx.globalAlpha = lifeRatio;
    ctx.fillStyle = p.color;
    ctx.strokeStyle = p.color;

    if (p.particleType === 'ring') {
      ctx.beginPath();
      ctx.lineWidth = 4 * lifeRatio;
      ctx.arc(drawX, drawY, Math.max(0, p.size * (1 - lifeRatio)), 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.particleType === 'spark') {
      ctx.beginPath();
      ctx.lineWidth = Math.max(0, p.size * lifeRatio);
      ctx.moveTo(drawX, drawY);
      ctx.lineTo(drawX - p.velocity.x * 2 * lifeRatio, drawY - p.velocity.y * 2 * lifeRatio);
      ctx.stroke();
    } else if (p.particleType === 'dot') {
      ctx.beginPath();
      const g = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, Math.max(0, p.size * (1 - lifeRatio)));
      g.addColorStop(0, p.color);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.arc(drawX, drawY, Math.max(0, p.size * (1 - lifeRatio)), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.shadowBlur = 10 * lifeRatio;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(drawX, drawY, Math.max(0, (p.size / 2) * lifeRatio), 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.restore();

  // Render Projectiles (with culling)
  state.projectiles.forEach(p => {
    const drawX = p.pos.x - camera.x;
    const drawY = p.pos.y - camera.y;

    if (drawX < -200 || drawX > width + 200 || drawY < -200 || drawY > height + 200) return;

    // Bullet trail
    const velLen = p.velocity.magnitude();
    const isBeam = p.radius > 20; // Laser beam signature
    
    ctx.save();
    ctx.strokeStyle = p.color || '#fef08a';
    ctx.globalAlpha = isBeam ? 0.6 : 0.3;
    ctx.lineWidth = isBeam ? p.radius * 2 : p.radius * 1.5;
    ctx.beginPath();
    ctx.moveTo(drawX, drawY);
    ctx.lineTo(drawX - (p.velocity.x / velLen) * (isBeam ? 300 : 20), drawY - (p.velocity.y / velLen) * (isBeam ? 300 : 20));
    ctx.stroke();
    
    if (isBeam) {
        // Core glow for beam
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = p.radius * 0.4;
        ctx.beginPath();
        ctx.moveTo(drawX, drawY);
        ctx.lineTo(drawX - (p.velocity.x / velLen) * 300, drawY - (p.velocity.y / velLen) * 300);
        ctx.stroke();
    }
    ctx.restore();

    ctx.globalAlpha = 1.0;

    ctx.fillStyle = p.color || '#ffffff';
    ctx.shadowBlur = isBeam ? 60 : 15;
    ctx.shadowColor = p.color || '#fef08a';
    ctx.beginPath();
    ctx.arc(drawX, drawY, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(drawX, drawY, p.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // --- Nano Plexus Links between enemies (Optimized and Throttled) ---
  if (state.enemies.length < 150) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    
    // Performance: Draw fewer links in higher density
    const maxLinkDist = state.enemies.length > 80 ? 60 : 100;
    const maxLinksPerEntity = state.enemies.length > 80 ? 2 : 4;
    
    const plexusGrid: Record<string, number[]> = {};
    const pSize = 100;
    for (let i = 0; i < state.enemies.length; i++) {
      const e = state.enemies[i];
      const gx = Math.floor(e.pos.x / pSize);
      const gy = Math.floor(e.pos.y / pSize);
      const key = `${gx},${gy}`;
      if (!plexusGrid[key]) plexusGrid[key] = [];
      plexusGrid[key].push(i);
    }

    for (let i = 0; i < state.enemies.length; i++) {
      const e1 = state.enemies[i];
      const gx = Math.floor(e1.pos.x / pSize);
      const gy = Math.floor(e1.pos.y / pSize);
      
      let linksCount = 0;
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const key = `${gx + ox},${gy + oy}`;
          const cell = plexusGrid[key];
          if (cell) {
            for (const j of cell) {
              if (j <= i) continue;
              if (linksCount >= maxLinksPerEntity) break;

              const e2 = state.enemies[j];
              const distSq = e1.pos.distanceToSq(e2.pos);
              if (distSq < maxLinkDist * maxLinkDist) {
                const dist = Math.sqrt(distSq);
                const alpha = 1 - (dist / maxLinkDist);
                ctx.beginPath();
                ctx.moveTo(e1.pos.x - camera.x, e1.pos.y - camera.y);
                ctx.lineTo(e2.pos.x - camera.x, e2.pos.y - camera.y);
                ctx.strokeStyle = `rgba(96, 165, 250, ${alpha * 0.25})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
                linksCount++;
              }
            }
          }
        }
      }
    }
    ctx.restore();
  }

  // Render Enemies
  state.enemies.forEach(e => {
    const drawX = e.pos.x - camera.x;
    const drawY = e.pos.y - camera.y;

    if (drawX < -50 || drawX > width + 50 || drawY < -50 || drawY > height + 50) return;

    // Enemy Trail
    const eVelLen = e.velocity.magnitude();
    if (eVelLen > 0.1) {
      ctx.strokeStyle = e.color;
      ctx.globalAlpha = 0.15;
      ctx.lineWidth = e.radius;
      ctx.beginPath();
      ctx.moveTo(drawX, drawY);
      ctx.lineTo(drawX - (e.velocity.x / eVelLen) * 20, drawY - (e.velocity.y / eVelLen) * 20);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    // Body
    ctx.save();
    ctx.translate(drawX, drawY);
    
    // Squash and stretch / Wobble on hit
    const hitWobble = e.hitTimer && e.hitTimer > 0 ? Math.sin(e.hitTimer * 5) * 0.3 : 0;
    const scaleX = 1 + hitWobble;
    const scaleY = 1 - hitWobble;
    ctx.scale(scaleX, scaleY);

    ctx.fillStyle = e.hitTimer && e.hitTimer > 0 ? '#ffffff' : e.color;
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    
    // Reduced shadow overhead for performance
    const useShadows = state.enemies.length < 100;
    if (useShadows) {
      ctx.shadowColor = e.color;
      ctx.shadowBlur = (e.enemyType === EnemyType.BOSS ? 30 : 15) * (e.hitTimer && e.hitTimer > 0 ? 2 : 1);
    }
    
    const time = Date.now() / 500;
    const idleWobble = Math.sin(time + e.id.length) * 2;
    const radius = e.radius + idleWobble;

    switch (e.enemyType) {
      case EnemyType.PHALANX:
        // Phalanx: Heavy Shielded Block
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const ang = (i * Math.PI * 2) / 6 + time * 0.1;
          const px = Math.cos(ang) * radius;
          const py = Math.sin(ang) * radius;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Frontal Shield Arc
        const faceAngle = Math.atan2(e.velocity.y, e.velocity.x);
        ctx.save();
        ctx.rotate(faceAngle - time * 0.2); // Counter-rotation relative to body if needed, or just follow face
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.5, -Math.PI / 3, Math.PI / 3);
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 6;
        ctx.globalAlpha = 0.5 + Math.sin(time * 5) * 0.2;
        ctx.stroke();
        ctx.restore();
        break;

      case EnemyType.WRAITH:
        // Wraith: Flickering Ghost
        const wraithAlpha = 0.3 + Math.sin(time * 8) * 0.3;
        ctx.globalAlpha = wraithAlpha;
        ctx.rotate(time * 1.5);
        ctx.beginPath();
        ctx.moveTo(radius * 1.5, 0);
        ctx.lineTo(-radius, -radius * 0.8);
        ctx.lineTo(-radius, radius * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        break;

      case EnemyType.NOVA:
        // Nova: Pulsating Core
        const novaPulse = 1 + Math.sin(time * 12) * 0.2;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * novaPulse);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.5, e.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, radius * novaPulse * 1.5, 0, Math.PI * 2);
        ctx.fill();
        // Inner core sparks
        for (let s = 0; s < 4; s++) {
          const sang = time * 4 + (s * Math.PI / 2);
          ctx.strokeStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(sang) * radius, Math.sin(sang) * radius);
          ctx.stroke();
        }
        break;

      case EnemyType.SPLINTER:
        // Splinter: Jagged Crystal
        ctx.rotate(time * 0.8);
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const ang = (i * Math.PI * 2) / 4;
          const px = Math.cos(ang) * radius * 1.4;
          const py = Math.sin(ang) * radius * 1.4;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          const iang = ang + Math.PI / 4;
          ctx.lineTo(Math.cos(iang) * radius * 0.5, Math.sin(iang) * radius * 0.5);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case EnemyType.RANGED:
        // Diamond shape
        ctx.rotate(time * 0.5);
        ctx.beginPath();
        ctx.moveTo(0, -radius * 1.3);
        ctx.lineTo(radius, 0);
        ctx.lineTo(0, radius * 1.3);
        ctx.lineTo(-radius, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Inner core
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        break;

      case EnemyType.TANK:
        // Beveled Square
        ctx.rotate(Math.PI / 4);
        const b = radius * 0.3;
        ctx.beginPath();
        ctx.moveTo(-radius + b, -radius);
        ctx.lineTo(radius - b, -radius);
        ctx.lineTo(radius, -radius + b);
        ctx.lineTo(radius, radius - b);
        ctx.lineTo(radius - b, radius);
        ctx.lineTo(-radius + b, radius);
        ctx.lineTo(-radius, radius - b);
        ctx.lineTo(-radius, -radius + b);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case EnemyType.BOSS:
        // Menacing Octagon
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const ang = (i * Math.PI * 2) / 8 + time * 0.2;
          const px = Math.cos(ang) * radius;
          const py = Math.sin(ang) * radius;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Inner Core
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.8;
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const ang = (i * Math.PI * 2) / 8 - time * 0.4;
          const px = Math.cos(ang) * radius * 0.5;
          const py = Math.sin(ang) * radius * 0.5;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1.0;
        
        // Spikes
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 4;
        for (let i = 0; i < 8; i++) {
          const ang = (i * Math.PI * 2) / 8 - time * 0.3;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang) * radius, Math.sin(ang) * radius);
          ctx.lineTo(Math.cos(ang) * radius * 1.6, Math.sin(ang) * radius * 1.6);
          ctx.stroke();
        }
        break;

      case EnemyType.ELITE:
        // Golden Spike Octagon
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const ang = (i * Math.PI * 2) / 8 + time * 0.3;
          const px = Math.cos(ang) * radius;
          const py = Math.sin(ang) * radius;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.stroke();
        // Spikes
        for (let i = 0; i < 8; i++) {
          const ang = (i * Math.PI * 2) / 8 + time * 0.3;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang) * radius, Math.sin(ang) * radius);
          ctx.lineTo(Math.cos(ang) * radius * 1.5, Math.sin(ang) * radius * 1.5);
          ctx.stroke();
        }
        break;

      case EnemyType.FAST:
        // Sleek Arrow
        ctx.rotate(Math.atan2(e.velocity.y, e.velocity.x));
        ctx.beginPath();
        ctx.moveTo(radius * 1.5, 0);
        ctx.lineTo(-radius, -radius * 0.6);
        ctx.lineTo(-radius * 0.3, 0);
        ctx.lineTo(-radius, radius * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case EnemyType.SWARMER:
        // Tiny Pulsing Diamond
        const swarmPulse = Math.sin(time * 10 + e.id.length) * 0.2 + 0.8;
        ctx.rotate(time * 2);
        ctx.beginPath();
        ctx.moveTo(0, -radius * swarmPulse);
        ctx.lineTo(radius * swarmPulse, 0);
        ctx.lineTo(0, radius * swarmPulse);
        ctx.lineTo(-radius * swarmPulse, 0);
        ctx.closePath();
        ctx.fill();
        break;

      default: // CHASER (Triangle/Spiky)
        ctx.rotate(Math.atan2(e.velocity.y, e.velocity.x));
        ctx.beginPath();
        ctx.moveTo(radius * 1.2, 0);
        ctx.lineTo(-radius, -radius * 0.8);
        ctx.lineTo(-radius * 0.5, 0);
        ctx.lineTo(-radius, radius * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
    }
    ctx.restore();

    // Menacing Eyes
    const eyeOffset = radius * 0.4;
    const eyeSize = radius * 0.2;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(drawX - eyeOffset, drawY - eyeOffset * 0.3, eyeSize, 0, Math.PI * 2);
    ctx.arc(drawX + eyeOffset, drawY - eyeOffset * 0.3, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    if (e.enemyType === EnemyType.BOSS) {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); 
      ctx.moveTo(drawX - 25, drawY - radius - 10); 
      ctx.lineTo(drawX, drawY - radius - 30); 
      ctx.lineTo(drawX + 25, drawY - radius - 10); 
      ctx.fill();
    }

    // Health Bar
    const healthBarW = e.radius * 2;
    const healthBarH = 4;
    const hpPercent = e.health / e.maxHealth;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(drawX - e.radius, drawY - e.radius - 12, healthBarW, healthBarH);
    ctx.fillStyle = hpPercent > 0.5 ? '#4ade80' : hpPercent > 0.2 ? '#facc15' : '#ef4444';
    ctx.fillRect(drawX - e.radius, drawY - e.radius - 12, healthBarW * hpPercent, healthBarH);
  });

  // Render Player
  const p = state.player;
  const pDrawX = p.pos.x - camera.x;
  const pDrawY = p.pos.y - camera.y;

  // --- Orbitals ---
  if (state.orbitalCount > 0) {
    const orbitRadius = 100;
    const orbitSpeed = 0.05;
    const time = Date.now();
    for (let i = 0; i < state.orbitalCount; i++) {
      const angle = (time * orbitSpeed + (i * 2 * Math.PI) / state.orbitalCount);
      const orbitX = pDrawX + Math.cos(angle) * orbitRadius;
      const orbitY = pDrawY + Math.sin(angle) * orbitRadius;
      
      // Drone Body
      ctx.save();
      ctx.translate(orbitX, orbitY);
      ctx.rotate(angle + Math.PI / 2);
      
      ctx.fillStyle = '#8b5cf6';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#8b5cf6';
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(10, 8);
      ctx.lineTo(-10, 8);
      ctx.closePath();
      ctx.fill();
      
      // Drone Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
      
      // Trail
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.lineWidth = 2;
      ctx.arc(pDrawX, pDrawY, orbitRadius, angle - 0.5, angle);
      ctx.stroke();
    }
  }

  // Multi-Shot Aura
  if (state.multiShot > 1) {
    const auraCount = state.multiShot - 1;
    const time = Date.now() / 1000;
    for (let i = 0; i < auraCount; i++) {
      const angle = (time * 1.5) + (i * Math.PI * 2 / auraCount);
      const orbitPulse = Math.sin(time * 3 + i) * 4;
      const orbitalX = pDrawX + Math.cos(angle) * (p.radius + 15 + orbitPulse);
      const orbitalY = pDrawY + Math.sin(angle) * (p.radius + 15 + orbitPulse);
      
      ctx.fillStyle = '#fbbf24'; 
      ctx.globalAlpha = 0.8;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#fbbf24';
      ctx.beginPath();
      ctx.arc(orbitalX, orbitalY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1.0;
  }

  if (state.isDashing) {
    // Advanced Dash Ghost Trail
    ctx.fillStyle = p.color;
    for (let i = 1; i <= 5; i++) {
        ctx.globalAlpha = 0.3 / i;
        ctx.beginPath();
        const r = Math.max(0, p.radius * (1 - i * 0.15));
        ctx.arc(pDrawX - (p.velocity.x * i), pDrawY - (p.velocity.y * i), r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  // Ship rotation
  const angle = Math.atan2(p.velocity.y, p.velocity.x) || 0;
  
  ctx.save();
  ctx.translate(pDrawX, pDrawY);
  ctx.rotate(angle);

  // Engine Fire
  if (p.velocity.magnitude() > 0.1) {
    const fireLen = state.isDashing ? 40 : 20;
    const time = Date.now() / 50;
    const flicker = Math.sin(time) * 5;
    
    // Gradient for engine
    const grad = ctx.createLinearGradient(-p.radius, 0, -p.radius - fireLen - flicker, 0);
    grad.addColorStop(0, '#60a5fa');
    grad.addColorStop(0.5, 'rgba(59, 130, 246, 0.5)');
    grad.addColorStop(1, 'transparent');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-p.radius + 5, -8);
    ctx.lineTo(-p.radius - fireLen - flicker, 0);
    ctx.lineTo(-p.radius + 5, 8);
    ctx.fill();

    // Engine Core Glow
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(-p.radius + 2, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  // Ship Body
  ctx.fillStyle = p.hitTimer && p.hitTimer > 0 ? '#ffffff' : p.color;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.shadowBlur = state.buffs.overdrive > 0 ? 30 : 0;
  ctx.shadowColor = '#f43f5e';
  
  ctx.beginPath();
  ctx.moveTo(p.radius * 1.5, 0);
  ctx.lineTo(-p.radius, -p.radius);
  ctx.lineTo(-p.radius * 0.5, 0);
  ctx.lineTo(-p.radius, p.radius);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  
  // Cockpit
  ctx.fillStyle = '#1e293b'; // Darker sleek cockpit
  ctx.beginPath();
  ctx.ellipse(p.radius * 0.2, 0, p.radius * 0.4, p.radius * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.stroke();

  ctx.restore();

  if (state.combo > 1) {
    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = `hsl(${Math.min(60, state.combo * 5)}, 100%, 60%)`;
    ctx.fillText(`×${state.combo}`, pDrawX - 15, pDrawY - 40);
  }

  // Buff Visuals
  if (state.buffs.shield > 0) {
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 3;
    const shieldPulse = Math.sin(Date.now() / 150) * 4;
    ctx.beginPath();
    ctx.arc(pDrawX, pDrawY, Math.max(0, p.radius * 2 + shieldPulse), 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(52, 211, 153, 0.1)';
    ctx.fill();
  }

  if (state.buffs.overdrive > 0) {
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    const overtime = Date.now() / 100;
    ctx.beginPath();
    ctx.arc(pDrawX, pDrawY, Math.max(0, p.radius * 2.4), overtime, overtime + Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pDrawX, pDrawY, Math.max(0, p.radius * 2.4), overtime + Math.PI, overtime + Math.PI * 1.5);
    ctx.stroke();
  }

  if (state.buffs.rapidFire > 0) {
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    const rt = Date.now() / 50;
    ctx.beginPath();
    ctx.arc(pDrawX, pDrawY, Math.max(0, p.radius * 2.8), -rt, -rt + Math.PI / 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pDrawX, pDrawY, Math.max(0, p.radius * 2.8), -rt + Math.PI, -rt + Math.PI * 1.25);
    ctx.stroke();
  }

  if (state.buffs.timeSlow > 0) {
    // Blue tint overlay
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
    ctx.fillRect(-offsetX, -offsetY, width, height); // compensating for shake offset
    ctx.restore();
  }

  // Vignette Effect
  const vignette = ctx.createRadialGradient(width/2, height/2, width/4, width/2, height/2, width);
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  // Render Damage Texts
  ctx.textAlign = 'center';
  ctx.font = 'bold 16px Inter, sans-serif';
  state.damageTexts.forEach(dtxt => {
    ctx.globalAlpha = dtxt.life;
    ctx.fillStyle = dtxt.color;
    ctx.fillText(dtxt.text, dtxt.pos.x - camera.x, dtxt.pos.y - camera.y);
  });
  ctx.globalAlpha = 1.0;

  // Screen Flash
  if (state.screenFlash > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = Math.min(0.5, state.screenFlash / 10);
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1.0;
  }

  ctx.restore();

  // --- Mini-Map ---
  const mapSize = 120;
  const mapPadding = 20;
  const mapX = width - mapSize - mapPadding;
  const mapY = mapPadding + 60;
  
  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.strokeStyle = 'rgba(96, 165, 250, 0.4)';
  ctx.lineWidth = 2;
  ctx.fillRect(mapX, mapY, mapSize, mapSize);
  ctx.strokeRect(mapX, mapY, mapSize, mapSize);

  // Map scale
  const scaleX = mapSize / state.world.width;
  const scaleY = mapSize / state.world.height;

  // Obstacles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  state.obstacles.forEach(obs => {
    if (obs.type === 'RECT') {
      ctx.fillRect(mapX + (obs.pos.x - obs.size.x/2) * scaleX, mapY + (obs.pos.y - obs.size.y/2) * scaleY, obs.size.x * scaleX, obs.size.y * scaleY);
    } else {
      ctx.beginPath();
      ctx.arc(mapX + obs.pos.x * scaleX, mapY + obs.pos.y * scaleY, obs.size.x * scaleX, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Items
  const mapPulse = Math.sin(Date.now() / 200) * 0.5 + 0.5;
  state.items.forEach(i => {
    ctx.fillStyle = `rgba(251, 191, 36, ${0.5 + mapPulse * 0.5})`;
    ctx.beginPath();
    ctx.arc(mapX + i.pos.x * scaleX, mapY + i.pos.y * scaleY, 2 + mapPulse, 0, Math.PI * 2);
    ctx.fill();
  });

  // Enemies
  state.enemies.forEach(e => {
    if (e.enemyType === EnemyType.BOSS) {
      ctx.fillStyle = `rgba(153, 27, 27, ${0.5 + mapPulse * 0.5})`;
      ctx.beginPath();
      ctx.arc(mapX + e.pos.x * scaleX, mapY + e.pos.y * scaleY, 4 + mapPulse * 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(mapX + e.pos.x * scaleX, mapY + e.pos.y * scaleY, 2, 2);
    }
  });

  // Viewport rect
  const viewX = mapX + camera.x * scaleX;
  const viewY = mapY + camera.y * scaleY;
  const viewW = width * scaleX;
  const viewH = height * scaleY;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(viewX, viewY, viewW, viewH);

  // Player
  ctx.fillStyle = '#60a5fa';
  ctx.beginPath();
  ctx.arc(mapX + state.player.pos.x * scaleX, mapY + state.player.pos.y * scaleY, 3, 0, Math.PI * 2);
  ctx.fill();
}
