(() => {
  const $ = id => document.getElementById(id);
  const fit = (ctx, canvas, color='#4da8ff') => { ctx.fillStyle='#050d1f'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.strokeStyle='#14274c'; ctx.strokeRect(1,1,canvas.width-2,canvas.height-2); };
  // Snake
  {
    const c=$('snake-game'),x=c.getContext('2d'),score=$('snake-score'); c.tabIndex=0; c.addEventListener('pointerdown',()=>{document.querySelectorAll('.game-canvas').forEach(q=>q.dataset.active='');c.dataset.active='1'}); let snake,dir,food,points,timer,paused=false,dead=true;
    function reset(){clearInterval(timer);snake=[{x:8,y:7},{x:7,y:7},{x:6,y:7}];dir={x:1,y:0};points=0;paused=false;dead=false;place();draw();timer=setInterval(tick,115);}
    function place(){food={x:Math.random()*20|0,y:Math.random()*15|0};if(snake.some(p=>p.x===food.x&&p.y===food.y))place();}
    function draw(){fit(x,c);snake.forEach((p,i)=>{x.fillStyle=i?'#268bd2':'#93e1ff';x.fillRect(p.x*16+1,p.y*16+1,14,14)});x.fillStyle='#e01a22';x.fillRect(food.x*16+3,food.y*16+3,10,10);score.textContent='SCORE: '+points;}
    function tick(){if(paused||dead)return;const h={x:snake[0].x+dir.x,y:snake[0].y+dir.y};if(h.x<0||h.x>=20||h.y<0||h.y>=15||snake.some(p=>p.x===h.x&&p.y===h.y)){dead=true;clearInterval(timer);return;}snake.unshift(h);if(h.x===food.x&&h.y===food.y){points+=10;place()}else snake.pop();draw();}
    document.addEventListener('keydown',e=>{if(c.dataset.active!=='1')return;const k=e.key.toLowerCase(),d={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]}[e.key]||{ };const v=d.length?d:({w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]}[k]);if(v&&!(v[0]===-dir.x&&v[1]===-dir.y)){dir={x:v[0],y:v[1]};if(!dead)e.preventDefault();}});
    $('snake-start').onclick=reset;$('snake-pause').onclick=()=>paused=!paused;reset();clearInterval(timer);dead=true;draw();
  }
  // Tetris
  {
    const c=$('tetris-game'),x=c.getContext('2d'),score=$('tetris-score'),cols=12,rows=20,cell=20;
    const shapes=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]],[[1,1,0],[0,1,1]],[[0,1,1],[1,1,0]]];let board,piece,pts,timer,paused=true,over=false;
    function newPiece(){const s=shapes[Math.random()*shapes.length|0];piece={s:s.map(r=>r.slice()),x:4,y:0};if(hit(0,0,piece.s)){over=true;clearInterval(timer)}}
    function hit(dx,dy,s=piece.s){return s.some((r,yy)=>r.some((v,xx)=>v&&(piece.x+xx+dx<0||piece.x+xx+dx>=cols||piece.y+yy+dy>=rows||(piece.y+yy+dy>=0&&board[piece.y+yy+dy][piece.x+xx+dx]))));}
    function draw(){fit(x,c);board.forEach((r,y)=>r.forEach((v,z)=>{if(v){x.fillStyle=v;x.fillRect(z*cell+1,y*cell+1,cell-2,cell-2)}}));if(piece)piece.s.forEach((r,y)=>r.forEach((v,z)=>{if(v){x.fillStyle='#4da8ff';x.fillRect((piece.x+z)*cell+1,(piece.y+y)*cell+1,cell-2,cell-2)}}));score.textContent='SCORE: '+pts+(over?' — GAME OVER':paused?' — PAUSED':'');}
    function step(){if(paused||over)return;if(!hit(0,1)){piece.y++;}else{piece.s.forEach((r,y)=>r.forEach((v,z)=>{if(v&&piece.y+y>=0)board[piece.y+y][piece.x+z]='#268bd2'}));let n=0;board=board.filter(r=>{if(r.every(Boolean)){n++;return false}return true});while(board.length<rows)board.unshift(Array(cols).fill(0));pts+=n*n*100;newPiece()}draw();}
    function reset(){clearInterval(timer);board=Array.from({length:rows},()=>Array(cols).fill(0));pts=0;over=false;paused=false;newPiece();timer=setInterval(step,480);draw();}
    function rotate(){const s=piece.s[0].map((_,i)=>piece.s.map(r=>r[i]).reverse());if(!hit(0,0,s))piece.s=s;draw();}
    document.addEventListener('keydown',e=>{if(c.dataset.active!=='1')return;if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' '].includes(e.key)){if(e.key==='ArrowLeft'&&!hit(-1,0))piece.x--;if(e.key==='ArrowRight'&&!hit(1,0))piece.x++;if(e.key==='ArrowDown')step();if(e.key==='ArrowUp')rotate();if(e.key===' '){while(!hit(0,1))piece.y++;step()}draw();}});
    // Global controls work while the game page is in view, without stealing normal typing.
    document.addEventListener('keydown',e=>{if(!c.getBoundingClientRect().top<innerHeight)return; if(e.key==='ArrowLeft'&&!paused&&!over&&!hit(-1,0)){piece.x--;draw()}});
    $('tetris-start').onclick=reset;$('tetris-pause').onclick=()=>{paused=!paused;draw()};board=Array.from({length:rows},()=>Array(cols).fill(0));pts=0;newPiece();draw();
  }
  // Flappy Pixel
  {
    const c=$('flappy-game'),x=c.getContext('2d'),score=$('flappy-score');let bird,pipes,pts,dead,timer;
    function reset(){clearInterval(timer);bird={y:110,v:0};pipes=[];pts=0;dead=false;for(let i=0;i<3;i++)pipes.push({x:350+i*145,gap:75+Math.random()*90|0,scored:false});timer=setInterval(tick,30);draw();}
    function flap(){if(dead){reset();return}bird.v=-4.6;}
    function draw(){fit(x,c);x.fillStyle='#f6c177';x.fillRect(70,bird.y,13,13);x.fillStyle='#268bd2';pipes.forEach(p=>{x.fillRect(p.x,0,27,p.gap-35);x.fillRect(p.x,p.gap+42,27,240-p.gap)});score.textContent='SCORE: '+pts+(dead?' — GAME OVER':'');}
    function tick(){if(dead)return;bird.v+=.22;bird.y+=bird.v;pipes.forEach(p=>{p.x-=2;if(p.x<57&&p.x>35){if(bird.y<p.gap-35||bird.y+13>p.gap+42){dead=true;clearInterval(timer)}}if(!p.scored&&p.x<65){p.scored=true;pts++}});if(pipes[0].x<-30){pipes.shift();pipes.push({x:pipes[pipes.length-1].x+145,gap:70+Math.random()*100|0,scored:false})}if(bird.y<0||bird.y>227){dead=true;clearInterval(timer)}draw();}
    c.addEventListener('pointerdown',flap);$('flappy-flap').onclick=flap;$('flappy-start').onclick=reset;document.addEventListener('keydown',e=>{if(e.code==='Space'&&c.getBoundingClientRect().top<innerHeight&&c.getBoundingClientRect().bottom>0){e.preventDefault();flap()}});reset();clearInterval(timer);dead=true;draw();
  }
  // Pong
  {
    const c=$('pong-game'),x=c.getContext('2d'),score=$('pong-score');c.tabIndex=0;c.addEventListener('pointerdown',()=>{document.querySelectorAll('.game-canvas').forEach(q=>q.dataset.active='');c.dataset.active='1'});let py,cy,bx,by,vx,vy,you,cpu,live=false,timer;
    function reset(){clearInterval(timer);py=90;cy=90;bx=160;by=120;vx=3;vy=2;you=cpu=0;live=true;timer=setInterval(tick,25);draw();}
    function draw(){fit(x,c);x.fillStyle='#203e6a';for(let y=0;y<240;y+=14)x.fillRect(158,y,3,7);x.fillStyle='#4da8ff';x.fillRect(12,py,6,52);x.fillStyle='#268bd2';x.fillRect(302,cy,6,52);x.fillStyle='#f6c177';x.fillRect(bx-5,by-5,10,10);score.textContent='YOU '+you+' — '+cpu+' CPU';}
    function tick(){if(!live)return;by+=vy;bx+=vx;cy+=(by-(cy+26))*.07;cy=Math.max(0,Math.min(188,cy));if(by<5||by>235)vy*=-1;if(bx<20&&by>py&&by<py+52){vx=Math.abs(vx)*1.04;vy+=(by-(py+26))*.08}if(bx>300&&by>cy&&by<cy+52){vx=-Math.abs(vx)*1.04;vy+=(by-(cy+26))*.08}if(bx<0||bx>320){if(bx<0)cpu++;else you++;bx=160;by=120;vx=bx<0?3:-3;vx=(you>cpu)?-3:3;vy=Math.random()*3-1.5}if(you>=5||cpu>=5){live=false;clearInterval(timer)}draw();}
    document.addEventListener('keydown',e=>{if(c.dataset.active!=='1')return;if(e.key==='ArrowUp'||e.key.toLowerCase()==='w')py=Math.max(0,py-18);if(e.key==='ArrowDown'||e.key.toLowerCase()==='s')py=Math.min(188,py+18);draw()});$('pong-start').onclick=reset;reset();clearInterval(timer);live=false;draw();
  }
})();
