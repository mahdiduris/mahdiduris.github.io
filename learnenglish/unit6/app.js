'use strict';
const API='https://learnenglish-unit6-api.mahdiduris.workers.dev/chat';
const activities=[
 ['6b','Who started this company?','Irregular past verbs, questions and negatives','lesson'],
 ['6c','Lifelogging','Diaries, social media and expressions with write','lesson'],
 ['6d','How was your weekend?','Weekend conversations and opinion adjectives','lesson'],
 ['6e','Thanks!','Thank-you notes, emails and letters','lesson'],
 ['6f','Gender equality','Women in sport, professions and role models','lesson'],
 ['W1','Thank-you message','Write a message thanking a friend for study help','writing'],
 ['W2','Describe a scene','Text-based scenario, not an actual picture','writing'],
 ['W3','Short message','Ask a classmate about missed homework','writing']
];
const $=id=>document.getElementById(id);
let current=null,history=[],pending=false;
for(const [id,title,desc,kind] of activities){const b=document.createElement('button');b.type='button';b.className='choice'+(kind==='writing'?' secondary':'');const span=document.createElement('span'),strong=document.createElement('b'),small=document.createElement('small'),arrow=document.createElement('span');strong.textContent=id+' · '+title;small.textContent=desc;span.append(strong,small);arrow.textContent='→';b.append(span,arrow);b.addEventListener('click',()=>start(id));$(kind==='lesson'?'lessons':'writings').append(b);}
// Render **bold** as emphasis using text nodes; never interpret model text as HTML.
function appendSafeEmphasis(parent,content){
 const parts=String(content??'').split(/(\*\*[^*\n]+\*\*)/g);
 for(const part of parts){
  if(part.startsWith('**')&&part.endsWith('**')&&part.length>4){
   const strong=document.createElement('strong');strong.textContent=part.slice(2,-2);parent.append(strong);
  }else parent.append(document.createTextNode(part));
 }
}
function bubble(role,content){const el=document.createElement('div');el.className='bubble '+role;const who=document.createElement('strong');who.textContent=role==='assistant'?'Tutor':'You';const p=document.createElement('p');appendSafeEmphasis(p,content);el.append(who,p);$('conversation').append(el);el.scrollIntoView({block:'nearest'});}
function start(id){if(pending)return;current=id;history=[];const a=activities.find(x=>x[0]===id);$('activityLabel').textContent=(a[3]==='writing'?'WRITING PRACTICE · ':'GUIDED LESSON · ')+id.toUpperCase();$('activityTitle').textContent=a[1];$('activityDesc').textContent=a[2];$('conversation').replaceChildren();$('chatStatus').textContent='';$('home').classList.add('hidden');$('lesson').classList.remove('hidden');send(id.startsWith('W')?'Start '+id+'. Explain the task briefly and help me plan before I write independently.':'Start Lesson '+id+'. Teach me with an example before asking a recognition question.');}
async function send(text){if(pending||!current||!text.trim())return;const prior=history.slice(-8);pending=true;$('send').disabled=true;$('reset').disabled=true;$('summary').disabled=true;$('chatStatus').textContent='Tutor is thinking…';bubble('user',text);$('message').value='';try{const res=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({module:current,message:text,history:prior})});const data=await res.json();if(!res.ok)throw Error(data.error||'Service unavailable');bubble('assistant',data.reply);history.push({role:'user',content:text},{role:'assistant',content:data.reply});if(history.length>16)history.splice(0,history.length-16);$('chatStatus').textContent='';}catch(err){$('chatStatus').textContent='Request failed: '+err.message+' You may retry your message.';/* Remove failed turn from the visible history on restart; no API history was updated. */}finally{pending=false;$('send').disabled=false;$('reset').disabled=false;$('summary').disabled=false;$('message').focus();}}
$('chatForm').addEventListener('submit',e=>{e.preventDefault();send($('message').value)});
$('summary').addEventListener('click',()=>send('Please give my end-of-session summary using the four required headings. Do not claim mastery unless you have evidence.'));
$('reset').addEventListener('click',()=>{if(current&&!pending)start(current)});
$('back').addEventListener('click',()=>{if(pending)return;$('lesson').classList.add('hidden');$('home').classList.remove('hidden');current=null;history=[];});
