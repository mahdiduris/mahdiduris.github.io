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
let current=null,history=[],pending=false,masteryToken=null,masteryActive=false;
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
function start(id){if(pending)return;current=id;history=[];masteryToken=null;masteryActive=false;updateMasteryUI();const a=activities.find(x=>x[0]===id);$('activityLabel').textContent=(a[3]==='writing'?'WRITING PRACTICE · ':'GUIDED LESSON · ')+id.toUpperCase();$('activityTitle').textContent=a[1];$('activityDesc').textContent=a[2];$('conversation').replaceChildren();$('chatStatus').textContent='';$('home').classList.add('hidden');$('lesson').classList.remove('hidden');send(id.startsWith('W')?'Start '+id+'. Explain the task briefly and help me plan before I write independently.':'Start Lesson '+id+'. Teach me with an example before asking a recognition question.');}
async function send(text){if(pending||!current||!text.trim())return;const prior=history.slice(-8);const action=masteryActive?'mastery_answer':undefined;pending=true;$('send').disabled=true;$('reset').disabled=true;$('summary').disabled=true;$('mastery').disabled=true;$('chatStatus').textContent='Tutor is thinking…';bubble('user',text);$('message').value='';try{const res=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({module:current,message:text,history:prior,action,masteryToken})});const data=await res.json();if(!res.ok)throw Error(data.error||'Service unavailable');bubble('assistant',data.reply);if(masteryActive){masteryToken=data.masteryToken||masteryToken;$('masteryStatus').textContent=data.masteryStatus||'';if(data.masteryComplete){masteryActive=false;updateMasteryUI();}}history.push({role:'user',content:text},{role:'assistant',content:data.reply});if(history.length>16)history.splice(0,history.length-16);$('chatStatus').textContent='';}catch(err){$('chatStatus').textContent='Request failed: '+err.message+' You may retry your message.';/* Remove failed turn from the visible history on restart; no API history was updated. */}finally{pending=false;$('send').disabled=false;$('reset').disabled=false;$('summary').disabled=false;$('mastery').disabled=false;$('message').focus();}}
$('chatForm').addEventListener('submit',e=>{e.preventDefault();send($('message').value)});
$('summary').addEventListener('click',()=>{if(masteryActive){$('chatStatus').textContent='Finish or exit the mastery check first.';return;}send('Please give my end-of-session summary using the four required headings. A formal mastery check, if completed, is shown separately in the interface. Do not claim verified mastery based on chat alone.');});
function updateMasteryUI(){const available=current&&!current.startsWith('W');$('mastery').classList.toggle('hidden',!available);$('mastery').textContent=masteryActive?'Exit mastery check':'Check mastery';if(!masteryActive&&(!masteryToken||!available))$('masteryStatus').textContent='';}
$('mastery').addEventListener('click',async()=>{
 if(pending||!current)return;
 if(masteryActive){masteryActive=false;masteryToken=null;updateMasteryUI();$('masteryStatus').textContent='Returned to guided practice. No mastery claim recorded.';return;}
 pending=true;$('mastery').disabled=true;$('send').disabled=true;$('chatStatus').textContent='Preparing independent check…';
 try{const res=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({module:current,action:'mastery_start',message:'Begin independent mastery check',history:[]})});const data=await res.json();if(!res.ok)throw Error(data.error||'Unavailable');masteryToken=data.masteryToken;masteryActive=true;updateMasteryUI();bubble('assistant',data.reply);$('masteryStatus').textContent=data.masteryStatus;}catch(e){$('chatStatus').textContent='Could not start mastery check: '+e.message;}finally{pending=false;$('mastery').disabled=false;$('send').disabled=false;if(masteryActive)$('chatStatus').textContent='';}
});
$('reset').addEventListener('click',()=>{if(current&&!pending)start(current)});
$('back').addEventListener('click',()=>{if(pending)return;$('lesson').classList.add('hidden');$('home').classList.remove('hidden');current=null;history=[];masteryToken=null;masteryActive=false;updateMasteryUI();});
