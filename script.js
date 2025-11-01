// Canvas responsive setup
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    function resizeCanvas(){
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * ratio);
      canvas.height = Math.floor(rect.width * ratio);
      ctx.setTransform(ratio,0,0,ratio,0,0);
    }
    window.addEventListener('resize', resizeCanvas);
    setTimeout(resizeCanvas,50);

    // Game variables
    let running = false, paused = false;
    let score = 0, best = parseInt(localStorage.getItem('flappy_best')||0,10);
    let speedMul = 1;

    const uiScore = document.getElementById('uiScore');
    const uiBest = document.getElementById('uiBest'); uiBest.textContent = best;

    // bird
    const bird = {x:140, y:200, r:18, vy:0, rot:0};
    const gravity = 900; // px/s^2
    const flapStrength = -300; // px/s

    // pipes
    const pipes = [];
    let pipeTimer = 0;
    let pipeGap = canvas.height * 0.30; // gap height
    const pipeWidth = 75;

    // ground
    let groundY = 0;

    // difficulty
    const difficultySelect = document.getElementById('difficulty');
    function difficulty(){return parseFloat(difficultySelect.value)}

    // audio (simple beep using WebAudio)
    let audioEnabled = document.getElementById('audioToggle').checked;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let audioCtx;
    function playBeep(freq=440, time=0.06){ if(!audioEnabled) return; try{ audioCtx = audioCtx || new AudioCtx(); const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.frequency.value = freq; o.type = 'sine'; g.gain.value = 0.08; o.connect(g); g.connect(audioCtx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + time); o.stop(audioCtx.currentTime + time); }catch(e){} }

    // input
    const keys = {};
    window.addEventListener('keydown', e=>{ if(e.code==='Space' || e.code==='ArrowUp') { e.preventDefault(); flap(); } keys[e.key]=true });
    window.addEventListener('keyup', e=>{ keys[e.key]=false });

    // pointer / touch
    let tapping = false;
    canvas.addEventListener('pointerdown', e=>{ tapping=true; flap(); });
    window.addEventListener('pointerup', ()=>{ tapping=false });

    // controls
    document.getElementById('start').addEventListener('click', ()=>{ if(!running) startGame(); });
    document.getElementById('pause').addEventListener('click', ()=>{ if(!running) return; paused = !paused; document.getElementById('pause').textContent = paused? 'Resume':'Pause'; });
    document.getElementById('reset').addEventListener('click', resetGame);
    document.getElementById('audioToggle').addEventListener('change', e=>{ audioEnabled = e.target.checked; if(audioEnabled && audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); });

    function flap(){ if(!running) startGame(); if(!running || paused) return; bird.vy = flapStrength; bird.rot = -0.6; playBeep(880,0.05); }

    function startGame(){ running=true; paused=false; score=0; pipes.length=0; pipeTimer=0; speedMul = difficulty(); bird.x = 140; bird.y = 200; bird.vy = 0; uiScore.textContent = score; document.getElementById('pause').textContent='Pause'; last = performance.now(); requestAnimationFrame(loop); }
    function resetGame(){ running=false; paused=false; score=0; pipes.length=0; pipeTimer=0; uiScore.textContent = score; bird.y = 200; bird.vy = 0; uiBest.textContent = best; }

    function spawnPipe(){
      const h = Math.max(80, Math.random() * (canvas.height*0.5) + 80);
      const gap = pipeGap;
      pipes.push({x: canvas.getBoundingClientRect().width + 40, top:h - gap/2 - canvas.getBoundingClientRect().height/2, gap:gap, passed:false});
    }

    function update(dt){
      if(!running || paused) return;
      const cw = canvas.getBoundingClientRect().width;
      // adapt ground
      groundY = Math.floor(cw * 0.75) - 60;

      // bird physics
      bird.vy += gravity * dt;
      bird.y += bird.vy * dt;
      bird.rot += (bird.vy / 800) * dt;
      if(bird.rot > 1.2) bird.rot = 1.2;

      // spawn pipes
      pipeTimer += dt;
      const spawnInterval = Math.max(0.9, 1.6 - score*0.02) / speedMul;

      if(pipeTimer > spawnInterval){
  pipeTimer = 0;
  const gap = pipeGap - Math.min(60, Math.floor(score/10)*6);

  // ensure the gap never goes below the ground area
  const minCenter = gap / 2 + 50; // 50px above ground
  const maxCenter = canvas.height - gap / 2 - 70; // keeps it below top
  const center = Math.random() * (maxCenter - minCenter) + minCenter;

  pipes.push({
    x: cw + 40,
    gap: gap,
    center: center,
    passed:false
  });
}


      // update pipes
      for(let i = pipes.length -1; i>=0; i--){ const p = pipes[i]; p.x -= (160 * speedMul + score*0.6) * dt; const top = p.center - p.gap/2; const bottom = p.center + p.gap/2;
        // collision check
        const birdRect = {x:bird.x - bird.r, y:bird.y - bird.r, w: bird.r*2, h: bird.r*2};
        const pipeTopRect = {x:p.x, y:0, w:pipeWidth, h: top};
        const pipeBottomRect = {x:p.x, y: bottom, w:pipeWidth, h: 10000};
        if(rectsIntersect(birdRect, pipeTopRect) || rectsIntersect(birdRect, pipeBottomRect)){
          // hit
          running = false; playBeep(120,0.25); endGame(); return; }
        // passed
        if(!p.passed && p.x + pipeWidth < bird.x - bird.r){ p.passed = true; score += 1; uiScore.textContent = score; playBeep(900 + score*8, 0.02); if(score % 10 === 0) speedMul += 0.07; }
        if(p.x + pipeWidth < -40) pipes.splice(i,1);
      }

      // ground collision
      const canvasHeight = canvas.getBoundingClientRect().height;
      if(bird.y + bird.r > canvasHeight - 20){ running = false; playBeep(120,0.25); endGame(); }
      if(bird.y - bird.r < 0){ bird.y = bird.r; bird.vy = 0; }
    }

    function rectsIntersect(a,b){ return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

    function draw(){
      const rect = canvas.getBoundingClientRect();
      const cw = rect.width; const ch = rect.height;
      ctx.clearRect(0,0,cw,ch);
      // sky gradient
      const g = ctx.createLinearGradient(0,0,0,ch); g.addColorStop(0,'#70c5ce'); g.addColorStop(1,'#66bfc8'); ctx.fillStyle = g; ctx.fillRect(0,0,cw,ch);

      // pipes
      for(const p of pipes){ const top = p.center - p.gap/2; const bottom = p.center + p.gap/2;
        // top pipe
        ctx.fillStyle = '#2aa34a'; ctx.fillRect(p.x, 0, pipeWidth, top);
        // bottom pipe
        ctx.fillRect(p.x, bottom, pipeWidth, ch - bottom);
        // caps
        ctx.fillStyle = '#1f7b36'; ctx.fillRect(p.x-6, Math.max(0, top-18), pipeWidth+12, 18); ctx.fillRect(p.x-6, bottom, pipeWidth+12, 18);
      }

      // ground
      ctx.fillStyle = '#d2b48c'; ctx.fillRect(0, ch - 20, cw, 20);

      // bird
      ctx.save(); ctx.translate(bird.x, bird.y); ctx.rotate(bird.rot);
      // wing simple flapping based on vy
      const wing = Math.max(-8, Math.min(8, -bird.vy*0.02));
      // body
      ctx.beginPath(); ctx.fillStyle = '#ffdd57'; ctx.ellipse(0,0, bird.r, bird.r*0.8, 0, 0, Math.PI*2); ctx.fill();
      // eye
      ctx.beginPath(); ctx.fillStyle = '#222'; ctx.arc(6, -4, 3, 0, Math.PI*2); ctx.fill();
      // beak
      ctx.beginPath(); ctx.fillStyle = '#ff9f43'; ctx.moveTo(bird.r-2,0); ctx.lineTo(bird.r+10, -6); ctx.lineTo(bird.r+10, 6); ctx.closePath(); ctx.fill();
      // wing
      ctx.beginPath(); ctx.fillStyle = '#f4c542'; ctx.ellipse(-2, 2, 10, 6, wing*0.1, 0, Math.PI*2); ctx.fill();
      ctx.restore();

      // score on canvas top-left
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(12,12,92,34); ctx.fillStyle='white'; ctx.font='18px system-ui'; ctx.fillText('Score: '+score, 18, 36);
    }

    // end game
    function endGame(){ if(score > best){ best = score; localStorage.setItem('flappy_best', best); uiBest.textContent = best; } setTimeout(()=>{ alert('Game Over! Score: '+score); }, 60); }

    // loop
    let last = performance.now();
    function loop(now){ const dt = Math.min(0.033, (now - last)/1000); last = now; update(dt); draw(); if(running) requestAnimationFrame(loop); }

    // initial draw
    draw();

    // autoplay safety: resume audio on first user gesture
    window.addEventListener('pointerdown', ()=>{ if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); });

    // set touch-friendly canvas style for mobile
    canvas.style.touchAction = 'none';