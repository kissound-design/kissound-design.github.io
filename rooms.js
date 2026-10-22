'use strict';
if(window.parent!==window)document.body.classList.add('embedded');
const $=s=>document.querySelector(s),messages=$('#messages'),input=$('#reply'),send=$('#send');
const roomName=document.querySelector('script[data-room]').dataset.room;
const isGirib=roomName==='girib',name=isGirib?'한기립':'TPT';
let run=0,typingEl=null;
const previous=['오랜만에 연락하는 상대에게 다시 다가가는 법 좀 알려줘.','먼저 연락하라고?','그 정도는 나도 알아.','그래. 생각은 해볼게.','잘 자.'];
const previousFriedRice=['볶음밥 맛있게 하는 법 좀 알려줘.','굴소스 넣었는데도 맛없어.','더 넣으라고? 이미 많이 넣었는데.','됐어. 다시 해볼게.'];
const current=isGirib?['행복한 하루 보내.']:['일러!! 기다려주셔요.'];
function scroll(){messages.scrollTop=messages.scrollHeight}
function row(text,mine=false,old=false){
 const follow=messages.scrollHeight-messages.scrollTop-messages.clientHeight<140;
 const el=document.createElement('div');el.className='row'+(mine?' mine':'')+(old?' history':'');
 if(!mine){const avatar=document.createElement('div');avatar.className='avatar';if(isGirib){const img=document.createElement('img');img.src='assets/girib-profile.png';img.alt='한기립 프로필';avatar.append(img)}else{avatar.classList.add('tpt-avatar');avatar.textContent='tpt'}el.append(avatar)}
 const body=document.createElement('div');body.className='body';
 if(!mine){const label=document.createElement('div');label.className='name';if(isGirib){const badge=document.createElement('span');badge.className='artist-badge';badge.textContent='ARTIST';label.append(badge)}const strong=document.createElement('strong');strong.textContent=name;label.append(strong);body.append(label)}
 const line=document.createElement('div');line.className='line';const bubble=document.createElement('div');bubble.className='bubble';bubble.textContent=text;line.append(bubble);
 if(!old){const stamp=document.createElement('div');stamp.className='time';stamp.textContent=new Date().toLocaleTimeString('ko-KR',{hour:'numeric',minute:'2-digit',hour12:true});line.append(stamp)}
 body.append(line);el.append(body);if(mine&&typingEl?.isConnected)messages.insertBefore(el,typingEl);else messages.append(el);if(follow)scroll();return el;
}
function showTyping(){if(typingEl?.isConnected)return;typingEl=row('');typingEl.setAttribute('aria-label',name+' 입력 중');typingEl.querySelector('.bubble').innerHTML='<div class="dots" aria-hidden="true"><i></i><i></i><i></i></div>'}
function hideTyping(){typingEl?.remove();typingEl=null}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function start(){const token=run;for(let i=0;i<current.length;i++){showTyping();await sleep(i===0?1500:[0,7000,8000,6500][i]||5000);if(token!==run)return;hideTyping();row(current[i])}$('#hint').textContent='';}
function renderHistory(){if(!isGirib)return;const date=document.createElement('div');date.className='date history-heading';date.textContent='6월 6일';messages.insertBefore(date,$('#date'));for(const text of previous){const el=row(text,false,true);messages.insertBefore(el,$('#date'))}const oldDate=document.createElement('div');oldDate.className='date history-heading';oldDate.textContent='이전 보블';messages.insertBefore(oldDate,$('#date'));for(const text of previousFriedRice){const el=row(text,false,true);messages.insertBefore(el,$('#date'))}}
$('#date').textContent=new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
$('#composer').addEventListener('submit',e=>{e.preventDefault();const text=input.value.trim();if(!text)return;row(text,true);input.value='';input.style.height='';send.disabled=true});
input.addEventListener('input',()=>{send.disabled=!input.value.trim();input.style.height='auto';input.style.height=Math.min(input.scrollHeight,92)+'px'});
input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();$('#composer').requestSubmit()}});
$('#menu').onclick=()=>{$('#panel').hidden=!$('#panel').hidden};$('#close').onclick=()=>$('#panel').hidden=true;
$('#info').onclick=()=>{if(window.parent!==window)window.parent.postMessage({type:'bobble-home'},location.origin);else location.href='/'};
$('#history').onclick=()=>{$('#panel').hidden=true;messages.scrollTop=0};if(!isGirib)$('#history').hidden=true;
$('#restart').onclick=()=>{run++;hideTyping();messages.querySelectorAll('.row:not(.history)').forEach(el=>el.remove());$('#panel').hidden=true;$('#hint').textContent='메시지 보내기';scroll();start()};
let firstDay;try{firstDay=localStorage.getItem('pyoeum-first-day')}catch{}$('#days').textContent='+'+(firstDay?Math.max(1,Math.floor((Date.now()-new Date(firstDay).getTime())/86400000)+1):1);
renderHistory();scroll();start();
