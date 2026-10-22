'use strict';
const home=document.querySelector('#home'),room=document.querySelector('#room'),list=document.querySelector('#chat-list');
let activeRoom=null;
function openHome(){room.hidden=true;list.hidden=true;home.hidden=false;if(activeRoom)document.querySelector('#room-'+activeRoom).contentWindow?.postMessage({type:'bobble-pause'},location.origin);activeRoom=null;history.replaceState(null,'',location.pathname)}
function openRoom(name){if(!['girib','pyoeum','tpt'].includes(name))return;if(activeRoom&&activeRoom!==name)document.querySelector('#room-'+activeRoom).contentWindow?.postMessage({type:'bobble-pause'},location.origin);home.hidden=true;list.hidden=true;room.hidden=false;document.querySelectorAll('iframe').forEach(f=>f.hidden=true);const frame=document.querySelector('#room-'+name);frame.hidden=false;if(!frame.getAttribute('src'))frame.src=frame.dataset.src;activeRoom=name;history.replaceState(null,'','#'+name)}
document.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>openRoom(b.dataset.room));
window.addEventListener('message',e=>{if(e.origin!==location.origin)return;if(![...document.querySelectorAll('iframe')].some(f=>f.contentWindow===e.source))return;if(e.data?.type==='bobble-home')openHome()});
const previews={girib:'행복한 하루 보내.',pyoeum:'오늘 생일 축하해줘서 정말 고마워!',tpt:'일러!! 기다려주셔요.'};
const container=document.querySelector('#chat-list-items');document.querySelectorAll('.subscriptions .star').forEach(b=>{const item=b.cloneNode(true);item.querySelector('small').textContent=previews[item.dataset.room];item.onclick=()=>openRoom(item.dataset.room);container.append(item)});
function openChatList(){home.hidden=true;room.hidden=true;list.hidden=false}document.querySelector('#chats-tab').onclick=openChatList;document.querySelector('#enter-bobble').onclick=()=>{document.querySelector('#splash').hidden=true;openHome()};document.querySelector('#stars-tab').onclick=openHome;document.querySelector('#list-back').onclick=openHome;

