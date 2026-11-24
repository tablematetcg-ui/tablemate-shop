/* Tablemate TCG: trade and sell offer form. Loaded by the shop page script. */
(function(){
"use strict";
const T=window.__tm;if(!T)return;
const {$,esc,items,cleanVer,tileArt,priceHTML,toast,closeCard,igIcon,IG_DM}=T;
const has=v=>v!=null&&v!=="";
const money=n=>"$"+Number(n).toLocaleString("en-US",{minimumFractionDigits:Number(n)%1?2:0,maximumFractionDigits:2});
/* ---------- trade and sell offers ---------- */
const SHOP_EMAIL="shop@tablematecards.com";
const CONDS=["Near mint","Lightly played","Moderately played","Heavily played","Damaged","PSA 10","PSA 9","PSA 8 or lower","BGS graded","CGC graded","Sealed"];
const MODE_TXT={buy:"buy some cards from you",sell:"sell you some cards",trade:"make a trade"};
const MODES=[["buy","Buy from us"],["sell","Sell to us"],["trade","Trade with us"]];
let TR={mode:"trade",give:[],want:[],wantNote:"",name:"",ig:"",email:"",cash:"",notes:""};
try{const d=JSON.parse(localStorage.getItem("tm-offer")||"null");if(d&&Array.isArray(d.give)&&Array.isArray(d.want))TR=Object.assign(TR,d)}catch(e){}
if(!MODE_TXT[TR.mode])TR.mode="trade";
function keepDraft(){try{localStorage.setItem("tm-offer",JSON.stringify(TR))}catch(e){}}
let CAT=null,catLoading=null,trSet="",trTimer=0,CHUNK=16;
const chunkCache={};
function chunkOf(n){
  if(!chunkCache[n])chunkCache[n]=fetch("img/"+n+".webp").then(r=>{if(!r.ok)throw r.status;return r.arrayBuffer()}).then(buf=>{
    const v=new DataView(buf),k=v.getUint32(0,true);let off=4+4*k;const urls=[];
    for(let i=0;i<k;i++){const len=v.getUint32(4+4*i,true);urls.push(URL.createObjectURL(new Blob([buf.slice(off,off+len)],{type:"image/webp"})));off+=len}
    return urls}).catch(e=>{delete chunkCache[n];throw e});
  return chunkCache[n];
}
function slotUrl(slot){const i=slot-1;return chunkOf(Math.floor(i/CHUNK)).then(u=>u[i%CHUNK])}
function hydrate(root){if(!root)return;root.querySelectorAll("img[data-slot]:not([src])").forEach(im=>{slotUrl(Number(im.dataset.slot)).then(u=>{if(u)im.src=u}).catch(()=>{})})}
function loadCat(){
  if(CAT)return Promise.resolve(CAT);
  if(catLoading)return catLoading;
  catLoading=fetch("data/catalog.json").then(r=>{if(!r.ok)throw r.status;return r.json()}).then(j=>{
    const G=j.groups||[];
    CHUNK=j.chunk||16;CAT=j.cards.map(a=>({id:a[0],name:a[1],num:a[2],rar:a[3],abbr:a[4],grp:G[a[5]]||"",slot:a[6]||0}));
    CAT.forEach(c=>c.k=(c.name+" "+c.num+" "+c.num.replace(/-/g,"")+" "+c.abbr+" "+c.grp+" "+c.rar).toLowerCase());
    CAT.groups=G;fillSets();return CAT;
  }).catch(e=>{catLoading=null;throw e});
  return catLoading;
}
function fillSets(){const s=$("#tr-set");if(!s||!CAT||s.options.length>1)return;
  s.insertAdjacentHTML("beforeend",CAT.groups.map(g=>`<option value="${esc(g)}">${esc(g)}</option>`).join(""))}
function catSearch(q){
  const t=q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let list=trSet?CAT.filter(c=>c.grp===trSet):CAT;
  if(!t.length)return trSet?list.slice(0,200):[];
  const whole=t.join(" "),out=[];
  for(const c of list){if(!t.every(w=>c.k.includes(w)))continue;
    let s=0;const nm=c.name.toLowerCase(),n=c.num.toLowerCase();
    if(n===whole||n.replace(/-/g,"")===whole)s-=100;
    if(nm===whole)s-=40;else if(nm.startsWith(t[0]))s-=10;
    if(new RegExp("(^|[\\s.])"+t[0].replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"($|[\\s(])").test(nm))s-=15;
    if(/\((alternate art|sp|manga|parallel)/.test(nm))s-=2;
    if(!c.num)s+=5;
    out.push([s,c]);}
  out.sort((a,b)=>a[0]-b[0]);
  return out.slice(0,40).map(x=>x[1]);
}
function catArt(slot,label){return slot?`<img data-slot="${Number(slot)}" alt="" decoding="async">`:`<span class="ti-ph">${esc(label||"Card")}</span>`}
function subLine(a){return a.filter(Boolean).map(esc).join(" · ")}

function tradeHTML(){
  const shop=items().slice().sort((a,b)=>a.name.localeCompare(b.name)||a.num.localeCompare(b.num));
  return `<section class="trade" id="trade" aria-labelledby="trade-h"><div class="wrap">
  <div class="trade-head"><p class="kicker">Buy, sell, or trade</p><h2 id="trade-h">Send us an offer</h2>
    <p>Buy from our table, sell us your cards, or trade. Pick the cards and your offer is written up for you, then you send it to us by Instagram DM or email.</p></div>
  <form class="tr-form" id="tr-form" novalidate>
    <fieldset class="tr-step"><legend><span class="n">1</span>What would you like to do?</legend>
      <div class="seg">${MODES.map(([v,l])=>`<label class="seg-o"><input type="radio" name="tr-mode" value="${v}"${TR.mode===v?" checked":""}><span>${l}</span></label>`).join("")}</div>
    </fieldset>
    <fieldset class="tr-step" id="tr-give-step"><legend><span class="n" id="tr-n-give">2</span><span id="tr-give-l">Cards you are offering</span></legend>
      <div class="pk-row">
        <label class="pk-search"><span class="sr">Search any One Piece card</span>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <input id="tr-q" type="search" placeholder="Card name or number, like OP05-119" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="tr-res" aria-autocomplete="list"></label>
        <label class="pk-set"><span class="sr">Browse a set</span><select id="tr-set"><option value="">Browse by set</option></select></label>
      </div>
      <ul class="pk-res" id="tr-res" role="listbox" aria-label="Matching cards" hidden></ul>
      <p class="pk-hint">Type a name or card number, or pick a set to see its full list. Tap a card to add it. If it is not listed, you can add it exactly as you typed it.</p>
      <ul class="tr-list" id="tr-give"></ul>
    </fieldset>
    <fieldset class="tr-step" id="tr-want-step"><legend><span class="n" id="tr-n-want">3</span><span id="tr-want-l">What you want from our shop</span></legend>
      <div class="pk-row">
        <label class="pk-set wide"><span class="sr">Choose a card from our shop</span><select id="tr-want-sel"><option value="">Choose a card from our shop</option>${shop.map(c=>`<option value="${esc(c.id)}">${esc(c.name+" "+c.num+" · "+(c.kind==="slab"?(c.grade||"Graded"):c.kind==="sealed"?"Sealed":cleanVer(c.ver)))}</option>`).join("")}</select></label>
        <button type="button" class="btn" data-tr-addwant>Add</button>
      </div>
      <ul class="tr-list" id="tr-want"></ul>
      <label class="fld tr-want-more"><span>Hunting for something we do not have listed?</span><input id="tr-wantnote" maxlength="300" placeholder="Optional" value="${esc(TR.wantNote)}"></label>
    </fieldset>
    <fieldset class="tr-step"><legend><span class="n" id="tr-n4">4</span>Your details</legend>
      <div class="fld-grid">
        <label class="fld"><span>Your name</span><input id="tr-name" autocomplete="name" maxlength="80" value="${esc(TR.name)}"></label>
        <label class="fld"><span>Instagram handle</span><input id="tr-ig" autocomplete="off" maxlength="40" placeholder="@yourhandle" value="${esc(TR.ig)}"></label>
        <label class="fld"><span>Email (optional)</span><input id="tr-email" type="email" autocomplete="email" maxlength="120" value="${esc(TR.email)}"></label>
        <label class="fld"><span id="tr-cash-l">Cash to add or ask for (optional)</span><input id="tr-cash" maxlength="80" placeholder="Optional" value="${esc(TR.cash)}"></label>
        <label class="fld full"><span>Anything else we should know?</span><textarea id="tr-notes" maxlength="1000" placeholder="Pickup at a show, shipping, condition details">${esc(TR.notes)}</textarea></label>
      </div>
    </fieldset>
    <div class="tr-send">
      <div class="tr-preview"><p class="ot-title">Your offer</p><pre id="tr-text"></pre></div>
      <p class="tr-err" id="tr-err" role="alert"></p>
      <div class="tr-btns">
        <a class="btn primary" href="${IG_DM}" target="_blank" rel="noopener" data-tr-send="ig">${igIcon()}<span>Copy offer and open Instagram DM</span></a>
        <a class="btn" id="tr-mail" href="mailto:${SHOP_EMAIL}" target="_blank" rel="noopener" data-tr-send="mail">Email the offer</a>
        <button type="button" class="btn ghost" data-tr-copy>Copy offer text</button>
        <button type="button" class="btn ghost" data-tr-reset>Start over</button>
      </div>
      <p class="fine">Instagram does not let websites type a message for you, so we copy your offer. Paste it into the DM and send. Email opens your own email app addressed to <span class="tr-email">${SHOP_EMAIL}</span>. Nothing is sent until you press send.</p>
    </div>
  </form></div></section>`;
}

function wantItems(){return TR.want.map(id=>T.STATE.items.find(x=>x.id===id)).filter(Boolean)}
function offerText(){
  const L=["Hi Tablemate TCG! I would like to "+MODE_TXT[TR.mode]+"."];
  if(TR.mode!=="buy"&&TR.give.length){L.push("","Cards I am offering:");
    TR.give.forEach(g=>L.push("• "+[g.name+(g.num?" "+g.num:""),g.grp,g.cond,(g.qty>1?"x"+g.qty:""),(TR.mode==="sell"&&g.price?"asking $"+String(g.price).replace(/^\$/,""):"")].filter(Boolean).join(" | ")))}
  if(TR.mode!=="sell"&&(TR.want.length||TR.wantNote)){
    L.push("",TR.mode==="buy"?"Cards I would like to buy:":"What I want from your shop:");
    const w=wantItems();
    w.forEach(c=>L.push("• "+c.name+" "+c.num+" ("+(c.kind==="slab"?(c.grade||"Graded")+", ":"")+cleanVer(c.ver)+")"));
    if(TR.wantNote)L.push("• Also looking for: "+TR.wantNote)}
  if(TR.cash)L.push("",({buy:"My offer: ",sell:"Asking for everything: ",trade:"Cash: "}[TR.mode])+TR.cash);
  if(TR.notes)L.push("","Notes: "+TR.notes);
  const who=[TR.name,TR.ig?"@"+TR.ig.replace(/^@+/,""):"",TR.email].filter(Boolean).join(" | ");
  if(who)L.push("","From: "+who);
  L.push("","Sent from the Tablemate TCG shop page");
  return L.join("\n");
}
function offerProblem(){
  if(TR.mode==="buy"&&!TR.want.length&&!TR.wantNote)return "Choose at least one card you would like to buy.";
  if(TR.mode!=="buy"&&!TR.give.length)return "Add at least one card you are offering.";
  if(!TR.name.trim()&&!TR.ig.trim()&&!TR.email.trim())return "Add your name, Instagram handle, or email so we know who the offer is from.";
  return "";
}
function mailHref(){
  const who=TR.name||(TR.ig?"@"+TR.ig.replace(/^@+/,""):"")||"a collector";
  const subj=({buy:"Buy",sell:"Sell",trade:"Trade"}[TR.mode])+" offer from "+who;
  let body=offerText();if(body.length>1800)body=body.slice(0,1780)+"\n(continued, see my DM)";
  return "mailto:"+SHOP_EMAIL+"?subject="+encodeURIComponent(subj)+"&body="+encodeURIComponent(body);
}
function giveRow(g,i){
  return `<li class="tr-item">
    <div class="ti-art">${catArt(g.slot,g.num||g.name)}</div>
    <div class="ti-body"><p class="ti-name">${esc(g.name)}</p><p class="ti-sub">${subLine([g.num,g.rar,g.grp])||"Typed in"}</p>
      <div class="ti-fields">
        <label><span>Condition</span><select data-tr-f="cond" data-i="${i}">${CONDS.map(c=>`<option${g.cond===c?" selected":""}>${c}</option>`).join("")}</select></label>
        <label><span>Quantity</span><input type="number" min="1" max="99" inputmode="numeric" value="${esc(g.qty)}" data-tr-f="qty" data-i="${i}"></label>
        ${TR.mode==="sell"?`<label><span>Asking price</span><input inputmode="decimal" maxlength="12" placeholder="$ optional" value="${esc(g.price||"")}" data-tr-f="price" data-i="${i}"></label>`:""}
      </div></div>
    <button type="button" class="ti-x" data-tr-del="give" data-i="${i}" aria-label="Remove ${esc(g.name)}">×</button></li>`;
}
function wantRow(id,i){
  const c=T.STATE.items.find(x=>x.id===id);if(!c)return "";
  return `<li class="tr-item"><div class="ti-art">${tileArt(c,"art")}</div>
    <div class="ti-body"><p class="ti-name">${esc(c.name)}</p><p class="ti-sub">${subLine([c.num,c.kind==="slab"?c.grade:"",cleanVer(c.ver)])}</p><p class="ti-sub">${priceHTML(c)}</p></div>
    <button type="button" class="ti-x" data-tr-del="want" data-i="${i}" aria-label="Remove ${esc(c.name)}">×</button></li>`;
}
function renderOffer(){
  const sec=$("#trade");if(!sec)return;
  const t=offerText();$("#tr-text").textContent=t;
  $("#tr-mail").href=mailHref();
  keepDraft();
}
function renderTrade(){
  if(!$("#trade"))return;
  $("#tr-give").innerHTML=TR.give.map(giveRow).join("");hydrate($("#tr-give"));
  $("#tr-want").innerHTML=TR.want.map(wantRow).join("");
  const m=TR.mode;
  $("#tr-give-step").hidden=m==="buy";
  $("#tr-want-step").hidden=m==="sell";
  $("#tr-n-give").textContent="2";
  $("#tr-n-want").textContent=m==="buy"?"2":"3";
  $("#tr-n4").textContent=m==="trade"?"4":"3";
  $("#tr-want-l").textContent=m==="buy"?"Cards you want to buy":"What you want from our shop";
  $("#tr-cash-l").textContent={buy:"Your offer for everything (optional)",sell:"Asking price for everything (optional)",trade:"Cash to add or ask for (optional)"}[m];
  renderOffer();
}
function closeHits(){const ul=$("#tr-res");if(ul)ul.hidden=true;const q=$("#tr-q");if(q)q.setAttribute("aria-expanded","false")}
function renderHits(){
  const ul=$("#tr-res"),qi=$("#tr-q");if(!ul||!qi)return;
  const typed=qi.value.trim();
  if(!typed&&!trSet){closeHits();return}
  if(!CAT){ul.innerHTML=`<li class="pk-none">Loading the card list…</li>`;ul.hidden=false;
    loadCat().then(renderHits).catch(()=>{ul.innerHTML=`<li class="pk-none">The card list did not load. You can still add your card as typed.</li>${typed?`<li><button type="button" class="pk-hit pk-custom" data-tr-custom>Add “${esc(typed)}” as typed</button></li>`:""}`});return}
  const hits=catSearch(typed);
  ul.innerHTML=hits.map(c=>`<li role="option"><button type="button" class="pk-hit" data-tr-pick="${esc(c.id)}"><span class="pk-art">${catArt(c.slot,c.num||"Sealed")}</span><span class="pk-t"><b>${esc(c.name)}</b><small>${subLine([c.num,c.rar,c.grp])}</small></span></button></li>`).join("")
    +(!hits.length?`<li class="pk-none">No match${trSet?" in this set":""}. Try fewer words or a card number.</li>`:"")
    +(typed?`<li><button type="button" class="pk-hit pk-custom" data-tr-custom>Add “${esc(typed)}” as typed</button></li>`:"");
  ul.hidden=false;qi.setAttribute("aria-expanded","true");hydrateLazy(ul);
}
function hydrateLazy(ul){
  if(!("IntersectionObserver" in window)){hydrate(ul);return}
  const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){io.unobserve(x.target);hydrate(x.target)}}),{root:ul,rootMargin:"200px"});
  ul.querySelectorAll(".pk-art").forEach(a=>io.observe(a));
}
function addGive(g){TR.give.push(Object.assign({cond:"Near mint",qty:1,price:""},g));
  const q=$("#tr-q");if(q)q.value="";closeHits();renderTrade();toast(g.name+" added to your offer.")}
function setMode(m){TR.mode=m;const r=document.querySelector('input[name="tr-mode"][value="'+m+'"]');if(r)r.checked=true}
function addWant(id){if(!id||TR.want.includes(id))return false;TR.want.push(id);if(TR.mode==="sell")setMode("buy");renderTrade();return true}
async function copyOffer(){const t=offerText();try{await navigator.clipboard.writeText(t);return true}catch(e){return false}}

document.addEventListener("click",async e=>{
  const pk=e.target.closest("[data-tr-pick]");
  if(pk&&CAT){const c=CAT.find(x=>x.id===pk.dataset.trPick);if(c)addGive({cid:c.id,slot:c.slot,name:c.name,num:c.num,rar:c.rar,grp:c.grp,cond:c.num?"Near mint":"Sealed"});return}
  if(e.target.closest("[data-tr-custom]")){const v=($("#tr-q").value||"").trim();if(v)addGive({cid:"",slot:0,name:v,num:"",rar:"",grp:""});return}
  const del=e.target.closest("[data-tr-del]");
  if(del){TR[del.dataset.trDel].splice(Number(del.dataset.i),1);renderTrade();return}
  if(e.target.closest("[data-tr-addwant]")){const s=$("#tr-want-sel");if(s&&addWant(s.value)){s.value=""}else if(s&&!s.value)s.focus();return}
  const wc=e.target.closest("[data-tr-wantcard]");
  if(wc){addWant(wc.dataset.trWantcard);closeCard();const t=$("#trade");if(t)t.scrollIntoView({behavior:"smooth",block:"start"});toast(TR.mode==="buy"?"Added to your list. Switch to Trade if you would rather trade for it.":"Added to what you want. Now add the cards you are offering.");return}
  if(e.target.closest("[data-tr-reset]")){TR={mode:TR.mode,give:[],want:[],wantNote:"",name:TR.name,ig:TR.ig,email:TR.email,cash:"",notes:""};["tr-wantnote","tr-cash","tr-notes"].forEach(id=>{const el=document.getElementById(id);if(el)el.value=""});$("#tr-err").textContent="";renderTrade();toast("Cards cleared. Your contact details are kept.");return}
  const sd=e.target.closest("[data-tr-send]");
  if(sd){const err=offerProblem();$("#tr-err").textContent=err;
    if(err){e.preventDefault();$("#tr-err").scrollIntoView({behavior:"smooth",block:"center"});return}
    if(sd.dataset.trSend==="ig"){copyOffer().then(ok=>toast(ok?"Offer copied. Paste it into the Instagram chat and send.":"Copy did not work here. Use Copy offer text, or copy it from the box above."))}
    else{sd.href=mailHref();toast("Opening your email app. If nothing opens, email "+SHOP_EMAIL+" and paste the offer.")}
    return}
  if(e.target.closest("[data-tr-copy]")){const err=offerProblem();$("#tr-err").textContent=err;if(err)return;
    toast(await copyOffer()?"Offer copied.":"Copy did not work here. Select the text in the box above.");return}
  if(!e.target.closest("#tr-res")&&!e.target.closest("#tr-q")&&!e.target.closest("#tr-set"))closeHits();
});
document.addEventListener("input",e=>{
  const id=e.target.id;
  if(id==="tr-q"){clearTimeout(trTimer);trTimer=setTimeout(renderHits,120);return}
  const f=e.target.dataset&&e.target.dataset.trF;
  if(f){const g=TR.give[Number(e.target.dataset.i)];if(!g)return;
    g[f]=f==="qty"?Math.max(1,Math.min(99,parseInt(e.target.value,10)||1)):e.target.value;renderOffer();return}
  const map={"tr-wantnote":"wantNote","tr-name":"name","tr-ig":"ig","tr-email":"email","tr-cash":"cash","tr-notes":"notes"};
  if(map[id]){TR[map[id]]=e.target.value;if($("#tr-err").textContent)$("#tr-err").textContent=offerProblem();renderOffer()}
});
document.addEventListener("change",e=>{
  if(e.target.name==="tr-mode"){TR.mode=e.target.value;renderTrade();return}
  if(e.target.id==="tr-set"){trSet=e.target.value;renderHits();return}
  if(e.target.dataset&&e.target.dataset.trF==="cond"){const g=TR.give[Number(e.target.dataset.i)];if(g){g.cond=e.target.value;renderOffer()}}
});
document.addEventListener("focusin",e=>{if(e.target.id==="tr-q"||e.target.id==="tr-set")loadCat().catch(()=>{})});
document.addEventListener("keydown",e=>{
  if(e.target.id!=="tr-q")return;
  if(e.key==="Enter"){e.preventDefault();const b=document.querySelector("#tr-res [data-tr-pick],#tr-res [data-tr-custom]");if(b&&!$("#tr-res").hidden)b.click();else renderHits()}
  if(e.key==="Escape")closeHits();
  if(e.key==="ArrowDown"){const b=document.querySelector("#tr-res button");if(b&&!$("#tr-res").hidden){e.preventDefault();b.focus()}}
});
document.addEventListener("submit",e=>{if(e.target.id==="tr-form")e.preventDefault()});
function initTrade(){
  renderTrade();
  const sec=$("#trade");
  if(sec&&"IntersectionObserver" in window){const io=new IntersectionObserver(es=>{if(es.some(x=>x.isIntersecting)){io.disconnect();loadCat().catch(()=>{})}},{rootMargin:"600px"});io.observe(sec)}
  if(location.hash==="#trade"&&sec)setTimeout(()=>sec.scrollIntoView(),0);
}


/* ---------- stock pictures for shop cards that have none ---------- */
const VAR_WORDS=["alternate art","parallel","sp","manga","secret rare","treasure","winner","event pack","participation","release event","pre-release","championship","celebration","anniversary","finalist","judge","gift collection","premium card collection","promotion pack","tournament","illustration box","wanted poster","full art","box topper","red","gold","silver","textured"];
function numOf(s){const m=String(s||"").toUpperCase().match(/\b(?:[A-Z]{1,4}\d{0,2}-\d{3}|P-\d{3})\b/);return m?m[0]:""}
const SYN={"alternate art":["alternate art","parallel","alt art"],"parallel":["parallel","alternate art","alt art"],"sp":["sp","special"],"manga":["manga"]};
function kwRe(k){return new RegExp("\\b"+k.replace(/[-]/g,"[- ]?")+"\\b")}
function hasKw(k,t){return (SYN[k]||[k]).some(x=>kwRe(x).test(t))}
function bestCat(c){
  if(!CAT)return null;
  const ver=(String(c.ver||"")+" "+String(c.set||"")).toLowerCase().replace(/\balt\.? art\b/g,"alternate art");
  if(/japanese/.test(ver))return null;
  const num=numOf(c.num)||numOf(c.ver);
  const isDon=!num&&/don!!/i.test(String(c.num)+" "+String(c.name));
  if(!num&&!isDon)return null;
  let cands=isDon?CAT.filter(x=>/^DON!! Card/i.test(x.name)&&x.slot):CAT.filter(x=>x.num===num&&x.slot);
  if(!cands.length)return null;
  const vw=ver.replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(w=>w.length>2&&!["the","and","from","with","card","cards","art","one","piece","printing","set","pack","vol","lists","tcgplayer","raw"].includes(w));
  let kw=VAR_WORDS.filter(k=>kwRe(k).test(ver));
  if(kw.includes("manga")||kw.includes("sp"))kw=kw.filter(k=>k!=="alternate art"&&k!=="parallel");
  const plain=/regular art|regular|base art/.test(ver)||(!kw.length&&!vw.length);
  const stem=w=>w.replace(/(ies|es|s)$/,"");
  let best=null,bs=-1e9;
  for(const x of cands){
    const nm=(x.name+" "+x.grp).toLowerCase(),paren=(x.name.match(/[(\[][^)\]]*[)\]]/g)||[]).join(" ").toLowerCase();
    let s=0;
    const vn=" "+ver.replace(/[^a-z0-9]+/g," ")+" ";
    (x.name.match(/\(([^)]*)\)/g)||[]).forEach(p=>{const pn=p.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();if(pn&&!/^\d+$/.test(pn)&&!numOf(pn.toUpperCase().replace(/ /g,"-"))&&vn.includes(" "+pn+" "))s+=8});
    kw.forEach(k=>{if(hasKw(k,nm))s+=6;else s-=3});
    const nmw=nm.replace(/[^a-z0-9 ]/g," ").split(/\s+/).map(stem);
    vw.forEach(w=>{if(nmw.includes(stem(w)))s+=2});
    if(paren){VAR_WORDS.forEach(k=>{if(kwRe(k).test(paren)&&!kw.some(q=>(SYN[q]||[q]).includes(k)))s-=4})}
    else if(plain&&!isDon)s+=3;
    if(s>bs){bs=s;best=x}
  }
  if(!best)return null;
  const bn=(best.name+" "+best.grp).toLowerCase();
  if(kw.some(k=>!hasKw(k,bn)))return null;
  if(kw.length&&bs<3)return null;
  if(isDon&&!vw.some(w=>w.length>4&&bn.includes(w)))return null;
  return best;
}
/* pictures found by hand for cards the catalog does not cover */
const EXTRA_ART={luffyMag:"extra/luffy-magazine-vol20.webp",t_mag:"extra/luffy-magazine-vol20.webp",t_p001:"extra/luffy-p001-25th.webp",luffyEP9:"extra/luffy-p108-event-pack-9.webp",baseShopV1:"extra/base-shop-vol1.webp",mr0A18:"extra/tm-op18-mr0-alt.webp",gunkoA18:"extra/tm-op18-gunko-alt.webp",kakuA18:"extra/tm-op18-kaku-alt.webp",kakuA18b:"extra/tm-op18-kaku-alt.webp",mr4A18:"extra/tm-op18-mr4-alt.webp",robinA18:"extra/tm-op18-robin-alt.webp",mr2TR18:"extra/tm-op18-mr2-tr.webp",lokiA18:"extra/tm-op18-loki-alt.webp",donGold18:"extra/tm-op18-don-gold.webp"};
/* catalog pictures picked by hand (Nov 22) where the automatic match misses or could pick the wrong version */
const HAND_SLOT={namiEB05S:211,gloriosaEB05:197,nojikoEB05:206,afraidNE:313,satoriWP4:6849,luffyL79A:371,rocksSECw:419,lokiT:422,shamSEC18:119,luffyW161:7171,leoPCC6:6689,bonneyORP2:7065,chopperORP2:7076,gorgonWP3:6835,forFunBS6:6827,kaidoA:348,jozuRP:6599,odenRP:6819,shanksL17:290,lawEP7:7072,sanjiP64:4264,toySoldier:3648,luffy92:957,allsundaySPbgs:4562,namiBS4:6649,s_demon2:2296,okikuFest:6235,chopper1st:7192,teachL80:736,t_kuzanM:713,t_chopReg:6205};
const shopSlot={},autoArt={};
function shopArtSlot(id){
  if(id in shopSlot)return shopSlot[id];
  const c0=T.STATE.items.find(x=>x.id===id);
  if(EXTRA_ART[id]&&c0&&!T.STATE.art[id]&&!(T.STATE.photos[id]||[]).length)return shopSlot[id]=EXTRA_ART[id];
  if(HAND_SLOT[id]&&c0&&!T.STATE.art[id]&&!(T.STATE.photos[id]||[]).length)return shopSlot[id]=HAND_SLOT[id];
  if(!CAT)return 0;
  const c=T.STATE.items.find(x=>x.id===id);let v=0;
  if(c&&!T.STATE.art[c.id]&&!(T.STATE.photos[c.id]||[]).length){const b=bestCat(c);if(b){v=b.slot;autoArt[c.id]=b.name+(b.grp?" ("+b.grp+")":"")}}
  return shopSlot[id]=v;
}
function idForPh(ph){
  const b=ph.closest("[data-open]");if(b)return b.dataset.open;
  if(ph.closest("#sheet")){const cp=document.querySelector("#sheet [data-copy]");return cp?cp.dataset.copy:null}
  const it=ph.closest(".tr-item");if(it){const d=it.querySelector('[data-tr-del="want"]');if(d)return TR.want[Number(d.dataset.i)]}
  return null;
}
function fillShopArt(){
  document.querySelectorAll(".ph").forEach(ph=>{
    const id=idForPh(ph);if(!id)return;const slot=shopArtSlot(id);if(!slot)return;
    const im=document.createElement("img");im.className=ph.classList.contains("big")?"art big":"art";im.alt="";
    if(typeof slot==="string")im.src=slot;else im.dataset.slot=slot;
    ph.replaceWith(im);
  });
  hydrate(document.body);
  auditArt();
}
function auditArt(){
  const bar=$("#ownerbar");if(!bar||bar.hidden||!CAT)return;
  const miss=items().filter(c=>!T.STATE.art[c.id]&&!(T.STATE.photos[c.id]||[]).length&&!shopArtSlot(c.id));
  let el=document.getElementById("tm-art-audit");
  const auto=items().filter(c=>autoArt[c.id]);
  const txt=(miss.length?"No picture yet ("+miss.length+"): "+miss.map(c=>c.name+" "+c.num).join(", ")+". Open the card and use Add your photos.":"Every listing has a picture.")
    +(auto.length?" Matched automatically ("+auto.length+"), check these: "+auto.map(c=>c.num+" "+cleanVer(c.ver)+" → "+autoArt[c.id]).join(" | "):"");
  if(!el){el=document.createElement("div");el.id="tm-art-audit";el.className="wrap";el.style.cssText="padding:0 20px 8px;font-size:13px;font-weight:600";bar.appendChild(el)}
  if(el.textContent!==txt)el.textContent=txt;
}
let fillT=0;
new MutationObserver(()=>{clearTimeout(fillT);fillT=setTimeout(fillShopArt,60)}).observe(document.body,{childList:true,subtree:true});
fillShopArt();loadCat().then(()=>{for(const k in shopSlot)if(shopSlot[k]===0)delete shopSlot[k];fillShopArt()}).catch(()=>{});

const slot=$("#trade-slot");
if(slot){slot.outerHTML=tradeHTML();initTrade()}
})();
