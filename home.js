/* Baked with Hope: manually controlled vertical stories. No automatic scrolling. */
(()=>{
'use strict';
const root=document.querySelector('.feed');
if(!root)return;
const slides=[...root.querySelectorAll('.feed-slide')];
const dots=[...root.querySelectorAll('.progress')];
const counter=document.getElementById('counter');
const prev=document.getElementById('prev');
const next=document.getElementById('next');
const videos=[...root.querySelectorAll('.video-feature video')];
function synchronizeVideos(){
 videos.forEach(video=>{
  const active=slides[index].contains(video)&&document.visibilityState==='visible';
  if(!active){video.pause();return;}
  video.muted=true;
  video.setAttribute('muted','');
  video.setAttribute('playsinline','');
  const attempt=video.play();
  if(attempt&&typeof attempt.catch==='function')attempt.catch(()=>{video.closest('.video-feature')?.classList.add('video-paused')});
 });
}
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let index=location.hash==='#story'?1:0;
let touch=null;
let wheelLocked=false;
let cleanup=null;
function update(n){
 const selected=(n+slides.length)%slides.length;
 const old=index;
 index=selected;
 if(cleanup)clearTimeout(cleanup);
 slides.forEach((el,i)=>{
   el.classList.toggle('active',i===index);
   el.classList.toggle('above',i<index);
   el.classList.toggle('below',i>index);
   el.classList.toggle('exiting',i===old&&old!==index&&!reduced);
   el.setAttribute('aria-hidden',String(i!==index));
   if(i!==index)el.inert=true;
   else el.inert=false;
   el.querySelectorAll('a,button').forEach(link=>{link.tabIndex=i===index?0:-1});
 });
 dots.forEach((el,i)=>{
   el.classList.toggle('active',i===index);
   el.setAttribute('aria-pressed',String(i===index));
 });
 if(counter)counter.textContent=String(index+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0');
 synchronizeVideos();
 cleanup=setTimeout(()=>slides.forEach(slide=>slide.classList.remove('exiting')),760);
}
prev?.addEventListener('click',()=>update(index-1));
next?.addEventListener('click',()=>update(index+1));
dots.forEach((dot,i)=>dot.addEventListener('click',()=>update(i)));
root.addEventListener('touchstart',e=>{
 if(!e.touches.length)return;
 touch={x:e.touches[0].clientX,y:e.touches[0].clientY};
},{passive:true});
root.addEventListener('touchend',e=>{
 if(!touch||!e.changedTouches.length)return;
 const diffY=e.changedTouches[0].clientY-touch.y;
 const diffX=e.changedTouches[0].clientX-touch.x;
 touch=null;
 if(Math.abs(diffY)<65||Math.abs(diffY)<Math.abs(diffX))return;
 const active=slides[index];
 if(active?.classList.contains('story')){
   const atBottom=active.scrollTop+active.clientHeight>=active.scrollHeight-5;
   const atTop=active.scrollTop<=5;
   if(diffY<0&&!atBottom)return;
   if(diffY>0&&!atTop)return;
 }
 update(index+(diffY<0?1:-1));
},{passive:true});
root.addEventListener('wheel',e=>{
 if(Math.abs(e.deltaY)<28||wheelLocked)return;
 const active=slides[index];
 if(active?.scrollHeight>active?.clientHeight+10){
   const atBottom=active.scrollTop+active.clientHeight>=active.scrollHeight-5;
   const atTop=active.scrollTop<=5;
   if(e.deltaY>0&&!atBottom)return;
   if(e.deltaY<0&&!atTop)return;
 }
 wheelLocked=true;
 update(index+(e.deltaY>0?1:-1));
 setTimeout(()=>wheelLocked=false,900);
},{passive:true});
document.addEventListener('keydown',e=>{
 if(e.target.closest('input,textarea,select')||e.altKey||e.ctrlKey||e.metaKey)return;
 if(e.key==='ArrowDown'||e.key==='PageDown'){e.preventDefault();update(index+1)}
 if(e.key==='ArrowUp'||e.key==='PageUp'){e.preventDefault();update(index-1)}
});
document.addEventListener('visibilitychange',synchronizeVideos);
videos.forEach(video=>{
 const backdrop=video.closest('.video-feature');
 const ready=()=>{if(video.videoWidth>0){backdrop?.classList.add('video-ready')}};
 video.addEventListener('playing',()=>{backdrop?.classList.add('video-ready');backdrop?.classList.remove('video-paused')});
 video.addEventListener('pause',()=>{if(slides[index].contains(video)&&document.visibilityState==='visible')backdrop?.classList.add('video-paused')});
 video.addEventListener('loadeddata',ready);
 video.addEventListener('canplay',()=>{ready();if(slides[index].contains(video))synchronizeVideos()});
 video.addEventListener('error',()=>{backdrop?.classList.remove('video-ready');backdrop?.classList.add('video-paused')});
 if(video.readyState>=2)ready();
});
// Muted inline autoplay is retried when the page regains visibility. No visible playback controls.
const hero=document.getElementById('heroVideo');
if(hero){
 hero.muted=true;
 hero.defaultMuted=true;
 hero.autoplay=true;
 hero.playsInline=true;
 hero.setAttribute('muted','');
 hero.setAttribute('playsinline','');
 hero.setAttribute('autoplay','');
 // After the first user interaction, retry silently if the browser initially deferred autoplay.
 document.addEventListener('pointerdown',()=>{
  if(!hero.paused||!slides[index].contains(hero))return;
  hero.play().catch(()=>{});
 },{passive:true});
}
window.addEventListener('pageshow',synchronizeVideos);
window.addEventListener('focus',synchronizeVideos);
update(index);
})();