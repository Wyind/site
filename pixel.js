(function(){
const P=['#050d1f','#0b1933','#14274c','#203e6a','#35689d','#4da8ff','#bcd4f5'];
const CAT=["1..1.......","11111......","111111111..","1111111111.","11111111112"];
function scene(c){
  if(!c)return;const x=c.getContext('2d');let W,H,stars,bld,t=0;
  function init(){
    const r=c.getBoundingClientRect(),s=Math.max(3,Math.round(r.width/230));
    W=Math.ceil(r.width/s);H=Math.ceil(r.height/s);c.width=W;c.height=H;
    let a=11;const R=()=>(a=a*16807%2147483647)/2147483647;
    stars=Array.from({length:W>>2},()=>({x:R()*W|0,y:R()*H*.55|0,p:R()*6}));
    bld=[];for(let b=0;b<W;){const w=6+R()*9|0,h=H*.18+R()*H*.3|0;
      bld.push({x:b,w,h,win:Array.from({length:w*h>>4},()=>({x:1+R()*(w-3)|0,y:2+R()*(h-4)|0,p:R()*9}))});b+=w+(R()*2|0);}
  }
  function draw(){
    t++;for(let i=0;i<6;i++){x.fillStyle=P[Math.min(i<4?0:i-3,2)];x.fillStyle=['#050d1f','#081327','#0b1933','#0f2147','#14274c','#172c53'][i];x.fillRect(0,H*i/6|0,W,Math.ceil(H/6));}
    stars.forEach(s=>{x.fillStyle=(t/4+s.p)%6<1?P[3]:(s.p>4?P[6]:P[5]);x.fillRect(s.x,s.y,1,1);});
    x.fillStyle=P[2];[[.1,.2],[.45,.12],[.7,.3]].forEach(([u,v],i)=>{const cx=((u*W+t*(.3+i*.15))%(W+30))-15|0,cy=v*H|0;x.fillRect(cx,cy,12,2);x.fillRect(cx+2,cy-1,7,1);x.fillRect(cx+4,cy+2,6,1);});
    x.fillStyle=P[6];x.fillRect(W*.82|0,H*.12|0,5,5);x.fillStyle='#14274c';x.fillRect((W*.82|0)+2,(H*.12|0)+1,4,4);
    bld.forEach(b=>{const y=H-b.h-4;x.fillStyle=P[1];x.fillRect(b.x,y,b.w,b.h);x.fillStyle=P[2];x.fillRect(b.x,y,1,b.h);
      b.win.forEach(w=>{if((t/6+w.p)%9<6){x.fillStyle=w.p>6?P[6]:P[5];x.fillRect(b.x+w.x,y+w.y,1,1);}});});
    x.fillStyle=P[2];x.fillRect(0,H-4,W,4);x.fillStyle=P[4];x.fillRect(0,H-4,W,1);
    const cx=W-26,cy=H-20;x.fillStyle=P[3];x.fillRect(cx,cy,16,12);x.fillStyle=P[0];x.fillRect(cx+2,cy+2,12,8);
    x.fillStyle=P[5];x.fillRect(cx+4+(t>>3)%6,cy+6,2,2);x.fillRect(cx+3,cy+3,4,1);
    CAT.forEach((r,j)=>[...r].forEach((v,i)=>{if(v!=='.'){x.fillStyle=v==='2'?P[4]:P[3];x.fillRect(cx+2+i,cy-5+j,1,1);}}));
  }
  init();draw();
  let timer=null;
  function setMotion(on){if(on&&!timer)timer=setInterval(draw,250);else if(!on&&timer){clearInterval(timer);timer=null;}}
  (window.WYIND_PIXEL_SCENES=window.WYIND_PIXEL_SCENES||[]).push(setMotion);
  setMotion(!matchMedia('(prefers-reduced-motion: reduce)').matches);
  addEventListener('resize',()=>{init();draw();});
}
scene(document.getElementById('boot-scene'));scene(document.getElementById('hero-scene'));
window.WYIND_PIXEL={setMotion:function(on){(window.WYIND_PIXEL_SCENES||[]).forEach(function(f){f(!!on);});}};
if(window.WYIND_SETTINGS)window.WYIND_PIXEL.setMotion(window.WYIND_SETTINGS.get('pixelMotion'));
})();
