'use strict';
if(window.parent!==window)document.body.classList.add('embedded');
const $=s=>document.querySelector(s),messages=$('#messages'),input=$('#reply'),send=$('#send');
const audio=new Audio('assets/pyoeum-song.mp3');audio.preload='metadata';
let waiting=false,waitTimer=null,run=0,startedSong=false,finished=false,playButton,seek,duration,status;
let pendingReply=null,replySerial=0,typingEl=null;
const groups=[
 ['이제 퇴근~ 영어로 녹화하면 신경을 두 배로 써서 그런가, 진짜 배고프다 ㅎㅎ'],
 ['오늘 거 언제 나오냐고? 날짜 나오면 알려줄게. 오늘 방송에서 손을 엄청 바쁘게 움직였어 ㅎㅎ', '말로 다 안 되니까 손이라도 거들어야지.'],
 ['밥 먹었어? 난 집에 가서 볶음밥 먹으려고. 오는 길에 계속 그 생각 했어.', '직접 만드냐고? ㅎㅎ 나는 먹는 쪽으로 꾸준히 실력을 쌓고 있지.']
];
const songIntro='아 그리고 오늘 녹음 중간중간 만든 노래야. 친구가 듣더니 귀에 붙는다는데 ㅎㅎ';
const closing=['ㅎㅎㅎ', '알겠어. 이제 난 집 도착. 쉴 수 있을진 모르겠지만 쉬어야지 ㅎㅎㅎ', '바이~'];
function scroll(){messages.scrollTop=messages.scrollHeight}
function time(){return new Date().toLocaleTimeString('ko-KR',{hour:'numeric',minute:'2-digit',hour12:true})}
function row(text,mine=false){const follow=messages.scrollHeight-messages.scrollTop-messages.clientHeight<140;const el=document.createElement('div');el.className='row'+(mine?' mine':'');if(!mine){const av=document.createElement('div');av.className='avatar';av.innerHTML='<img src="assets/pyoeum-profile.png" alt="표음 프로필">';el.append(av)}const body=document.createElement('div');body.className='body';if(!mine){const name=document.createElement('div');name.className='name';name.innerHTML='<span class="artist-badge">ARTIST</span><strong>표음</strong>';body.append(name)}const line=document.createElement('div');line.className='line';const bubble=document.createElement('div');bubble.className='bubble';bubble.textContent=text;const stamp=document.createElement('div');stamp.className='time';stamp.textContent=time();if(mine){const read=document.createElement('span');read.className='read';read.textContent='1';stamp.prepend(read);setTimeout(()=>read.remove(),1800)}line.append(bubble,stamp);body.append(line);el.append(body);if(mine&&typingEl?.isConnected)messages.insertBefore(el,typingEl);else messages.append(el);if(follow)scroll();return {el,bubble,stamp}}
const historyItems=[
 {image:'pyoeum-selfie.png',alt:'뉴욕 야경을 배경으로 찍은 표음의 셀카'},
 {text:'이거 논알콜인데 달콤하고 맛있더라.'},
 {image:'dinner.png',alt:'보라색 음료와 레스토랑 식사 사진'},
 {text:'눈으로 먹어 봐 ^^. 뉴욕 야경은 덤.'},
 {image:'new-york-night.png',alt:'창밖으로 보이는 뉴욕의 야경 사진 모음'},
 {text:'레션이들 대신 배터지게 먹음.'},
 {text:'어제 행사사진 내일 인별에 업로드 될 거야.'},
 {text:'그럼 잘 자.'}
];
function renderHistory(){
 const marker=document.createElement('div');marker.className='date history-heading';marker.textContent='7월 18일';messages.insertBefore(marker,$('#date'));
 for(const item of historyItems){
  const r=row(item.text||'');r.el.classList.add('history');r.stamp.remove();
  if(item.image){
   r.bubble.classList.add('photo-bubble');const button=document.createElement('button');button.className='photo-open';button.type='button';button.setAttribute('aria-label',item.alt+' 크게 보기');
   const img=document.createElement('img');img.src='assets/'+item.image;img.alt=item.alt;img.width=item.image==='pyoeum-selfie.png'?336:item.image==='dinner.png'?269:282;img.height=item.image==='pyoeum-selfie.png'?457:item.image==='dinner.png'?228:255;button.append(img);
   button.onclick=()=>{const full=$('#photo-full');full.src=img.src;full.alt=img.alt;$('#photo-viewer').showModal()};r.bubble.append(button);
  }
  messages.insertBefore(r.el,$('#date'));
 }
}
$('#photo-close').onclick=()=>$('#photo-viewer').close();
$('#photo-viewer').addEventListener('click',e=>{if(e.target===$('#photo-viewer'))$('#photo-viewer').close()});
$('#history').onclick=()=>{$('#panel').hidden=true;messages.scrollTop=0};
function typing(){const r=row('');r.el.setAttribute('aria-hidden','true');r.bubble.innerHTML='<div class="dots"><i></i><i></i><i></i></div>';return r.el}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function showTyping(){if(!typingEl?.isConnected)typingEl=typing();return typingEl}
function hideTyping(){if(typingEl)typingEl.remove();typingEl=null}
async function say(text,token,first=false,delayOverride=null){
 if(token!==run)return false;
 showTyping();
 const delay=delayOverride??(first?1000:Math.min(4000,2500+text.length*22));
 await sleep(delay);if(token!==run)return false;
 hideTyping();row(text);showTyping();return true;
}
function waitForReply(token,baseline,minMs=5000,maxMs=10000){
 if(token!==run)return Promise.resolve(false);
 showTyping();waiting=true;$('#hint').textContent='표음에게 답장을 보내보세요';
 return new Promise(resolve=>{
  let minimumPassed=false,responded=replySerial>baseline,minimumTimer;
  const finish=ok=>{clearTimeout(minimumTimer);clearTimeout(waitTimer);pendingReply=null;waiting=false;resolve(ok&&token===run)};
  pendingReply={reply:()=>{responded=true;if(minimumPassed)finish(true)},cancel:()=>finish(false)};
  minimumTimer=setTimeout(()=>{minimumPassed=true;if(responded)finish(true)},minMs);
  waitTimer=setTimeout(()=>finish(true),maxMs);
 });
}
function next(){replySerial++;if(pendingReply)pendingReply.reply()}
async function advance(){
 const token=run;
 for(let i=0;i<groups.length;i++){
  const baseline=replySerial;
  for(let j=0;j<groups[i].length;j++){if(!await say(groups[i][j],token,i===0&&j===0))return}
  if(!await waitForReply(token,baseline))return;
 }
 if(!await say(songIntro,token))return;
 await sleep(5000);if(token!==run)return;
 hideTyping();startedSong=true;addSong();showTyping();$('#hint').textContent='표음이 보낸 노래를 들어보세요';
 status.textContent='재생 버튼을 눌러 들어줘요';
 if(!await say('어때? 수능금지곡 노려볼만해?',token,false,55000))return;
 $('#hint').textContent='표음에게 답장을 보내보세요';
 showTyping();await sleep(12000);if(token!==run)return;
 hideTyping();row(closing[0]);showTyping();
 for(const text of closing.slice(1)){if(!await say(text,token))return}
 if(token!==run)return;hideTyping();finished=true;
 const el=document.createElement('div');el.className='end';el.textContent='오늘의 보블은 여기까지 ♡';messages.append(el);
 $('#hint').textContent='메뉴에서 대화를 다시 시작할 수 있어요';scroll();
}
$('#composer').addEventListener('submit',e=>{e.preventDefault();const text=input.value.trim();if(!text)return;row(text,true);input.value='';input.style.height='';send.disabled=true;next()});
input.addEventListener('input',()=>{send.disabled=!input.value.trim();input.style.height='auto';input.style.height=Math.min(input.scrollHeight,92)+'px'});
input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();$('#composer').requestSubmit()}});
function fmt(t){if(!Number.isFinite(t))return '0:00';return Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0')}
function addSong(){const r=row('');r.bubble.classList.add('song');r.bubble.innerHTML='<div class="song-label">VOICE MESSAGE</div><div class="player"><button class="play" aria-label="노래 재생">▶</button><button class="loop" type="button" aria-label="반복 재생" aria-pressed="false">↻</button><input class="track" type="range" min="0" max="100" value="0" step="0.1" aria-label="노래 재생 위치"></div><div class="duration">0:00 / '+fmt(audio.duration)+'</div><div class="song-status">표음이 보낸 음성 메시지</div>';playButton=r.bubble.querySelector('.play');seek=r.bubble.querySelector('.track');duration=r.bubble.querySelector('.duration');status=r.bubble.querySelector('.song-status');const loopButton=r.bubble.querySelector('.loop');audio.loop=false;loopButton.onclick=()=>{audio.loop=!audio.loop;loopButton.setAttribute('aria-pressed',String(audio.loop));loopButton.setAttribute('aria-label',audio.loop?'반복 재생 끄기':'반복 재생 켜기')};playButton.onclick=()=>{if(audio.paused)audio.play().catch(()=>status.textContent='재생하지 못했어요. 다시 눌러주세요.');else audio.pause()};seek.oninput=()=>{if(Number.isFinite(audio.duration))audio.currentTime=Number(seek.value)/100*audio.duration};scroll()}
audio.addEventListener('play',()=>{if(playButton){playButton.textContent='Ⅱ';playButton.setAttribute('aria-label','노래 일시정지');status.textContent='표음이 노래하고 있어요'}});
audio.addEventListener('pause',()=>{if(playButton){playButton.textContent='▶';playButton.setAttribute('aria-label','노래 재생');status.textContent=audio.ended?'다시 들어도 좋아요':'잠시 멈춤'}});
audio.addEventListener('timeupdate',()=>{if(seek){seek.value=audio.duration?audio.currentTime/audio.duration*100:0;duration.textContent=fmt(audio.currentTime)+' / '+fmt(audio.duration)}});
audio.addEventListener('error',()=>{if(status)status.textContent='음성을 불러오지 못했어요. 새로고침해 주세요.'});
$('#menu').onclick=()=>{$('#panel').hidden=!$('#panel').hidden};$('#info').onclick=()=>{if(window.parent!==window)window.parent.postMessage({type:'bobble-home'},window.location.origin);else window.location.href='/'};$('#close').onclick=()=>$('#panel').hidden=true;
$('#restart').onclick=()=>{
 hideTyping();run++;if(pendingReply)pendingReply.cancel();clearTimeout(waitTimer);
 audio.pause();audio.loop=false;audio.currentTime=0;waiting=false;startedSong=false;finished=false;
 playButton=seek=duration=status=null;messages.querySelectorAll('.row:not(.history),.end').forEach(x=>x.remove());
 $('#panel').hidden=true;$('#hint').textContent='표음에게 답장을 보내보세요';advance();
};
let firstDay;try{firstDay=localStorage.getItem('pyoeum-first-day');if(!firstDay){firstDay=new Date().toISOString();localStorage.setItem('pyoeum-first-day',firstDay)}}catch{}const dayCount=firstDay?Math.max(1,Math.floor((Date.now()-new Date(firstDay).getTime())/86400000)+1):1;$('#days').textContent='+'+dayCount;
$('#date').textContent=new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long'});renderHistory();Promise.race([Promise.all(Array.from(messages.querySelectorAll('img')).map(img=>img.decode().catch(()=>{}))),sleep(2500)]).then(()=>{scroll();advance()});

window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===window.parent&&e.data?.type==='bobble-pause')audio.pause()});
