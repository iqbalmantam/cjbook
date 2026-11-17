"use strict";
/* ================= konfigurasi (kunci publishable memang boleh publik; keamanan dijaga RLS) ================= */
const CONFIG={
  url:"https://kchhmqpakdeqoozfiogo.supabase.co",
  key:"sb_publishable_qeoEBpSYLutbVicxvhn6Dw_N3-oidko",
  domain:"cjbook.internal"
};

/* ================= util ================= */
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const MIN=6e4,HR=36e5,DAY=864e5;
function ago(t){const d=Date.now()-t;if(d<MIN)return"baru saja";if(d<HR)return Math.floor(d/MIN)+" mnt lalu";if(d<DAY)return Math.floor(d/HR)+" jam lalu";if(d<7*DAY)return Math.floor(d/DAY)+" hari lalu";return new Date(t).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}
const IC={
 home:'<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
 users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-6 6.500-6s6.500 2.500 6.500 6"/><path d="M16 5a3.500 3.500 0 0 1 0 7M18 14c2.200.700 3.500 2.700 3.500 6"/>',
 mega:'<path d="M3 10v4h4l8 5V5L7 10z"/><path d="M19 9a4 4 0 0 1 0 6"/>',
 chat:'<path d="M4 5h16v11H9l-5 4z"/>',
 bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
 cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
 shield:'<path d="M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6z"/>',
 image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>',
 out:'<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>',
 flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
 trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
 send:'<path d="M21 3L3 11l7 3 3 7z"/>'
};
const ic=n=>`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${IC[n]||""}</svg>`;
const initials=n=>String(n).split(/\s+/).slice(0,2).map(w=>w[0]).join("").toUpperCase();
const COLORS=["#0F766E","#1D4E89","#7A3E9D","#9A4A12","#8A2C4A","#35603A","#5B4B8A","#4A5568"];
const colorOf=id=>COLORS[[...String(id)].reduce((a,c)=>a+c.charCodeAt(0),0)%COLORS.length];
const NIK_RE=/^[0-9A-Za-z-]{3,20}$/;
const emailOf=nik=>nik.trim().toLowerCase()+"@"+CONFIG.domain;

/* ================= klien Supabase ================= */
let sb=null;
try{sb=window.supabase.createClient(CONFIG.url,CONFIG.key,{auth:{persistSession:true,autoRefreshToken:true}})}catch(e){console.error(e)}

/* ================= state ================= */
let S={me:null,email:null,users:[],follows:[],posts:[],reacts:{},comments:[],groups:[],members:[],notifs:[],readAnn:new Set(),events:[],rsvp:{},convos:[],reports:[],invites:[],annStats:{},theme:"light"};
try{S.theme=localStorage.getItem("cjbook.theme")||"light"}catch(e){}
const IMG={};let imgT=Date.now();
let openCm=new Set(),draft=null,adminTab="anggota";

const U=id=>S.users.find(u=>u.id===id);
const me=()=>U(S.me);
const isAdmin=()=>!!me()&&me().role==="admin";
const G=id=>S.groups.find(g=>g.id===id);
const isMember=(gid,u=S.me)=>S.members.some(m=>m.gid===gid&&m.uid===u&&m.status==="aktif");
const follows=(a,b)=>S.follows.some(f=>f[0]===a&&f[1]===b);
const av=(u,sz=40)=>`<span class="av" style="--c:${u.warna};--sz:${sz}px" aria-hidden="true">${esc(initials(u.nama))}</span>`;
const nameLink=u=>`<a href="#/u/${esc(u.id)}"><strong>${esc(u.nama)}</strong></a>`;
const unread=()=>S.notifs.filter(n=>!n.read).length;
const unreadAnn=()=>S.posts.filter(p=>p.type==="pengumuman"&&!S.readAnn.has(p.id)).length;
const chatUnread=()=>S.convos.filter(c=>{const l=c.msgs[c.msgs.length-1];return l&&l.by!==S.me&&l.t>c.lastRead}).length;
function canSee(p){
 if(p.aud==="rekan")return p.by===S.me||follows(S.me,p.by);
 if(p.gid)return isMember(p.gid);
 return true;
}
function toast(msg){const w=$("#toast"),d=document.createElement("div");d.className="t";d.textContent=msg;w.appendChild(d);setTimeout(()=>d.remove(),3000)}
function modal(html){const m=$("#modal");m.innerHTML=`<div class="scrim" data-act="scrim"><div class="dlg" role="dialog" aria-modal="true">${html}</div></div>`;const f=m.querySelector("input,textarea,select,button");f&&f.focus()}
function closeModal(){$("#modal").innerHTML=""}
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
function errMsg(e){
 const m=String(e&&e.message||e||"");
 if(/row-level security|permission denied|not allowed/i.test(m))return"Anda tidak punya izin untuk tindakan ini.";
 if(/duplicate key|already exists/i.test(m))return"Data ini sudah ada.";
 if(/Failed to fetch|NetworkError|network/i.test(m))return"Tidak ada koneksi internet. Coba lagi.";
 return"Terjadi kesalahan. Coba lagi.";
}

/* ================= pemuatan data ================= */
const q=async p=>{const r=await p;if(r.error)throw r.error;return r.data||[]};
async function syncCore(){
 const [prof,fol,grp,mem,evs,rsv]=await Promise.all([
  q(sb.from("profiles").select("*").order("nama")),
  q(sb.from("follows").select("follower_id,followee_id")),
  q(sb.from("groups").select("*").order("created_at")),
  q(sb.from("group_members").select("group_id,user_id,status")),
  q(sb.from("events").select("*").order("mulai")),
  q(sb.from("event_rsvps").select("event_id,user_id,status"))]);
 S.users=prof.map(p=>({id:p.id,nik:p.nik,nama:p.nama,jabatan:p.jabatan,dept:p.dept,site:p.site,bio:p.bio,hp:p.hp,role:p.role,aktif:p.aktif,nk:p.notif_komentar,nr:p.notif_reaksi,warna:colorOf(p.id)}));
 S.follows=fol.map(f=>[f.follower_id,f.followee_id]);
 S.groups=grp.map(g=>({id:g.id,nama:g.nama,desk:g.deskripsi,privasi:g.privasi,owner:g.owner_id}));
 S.members=mem.map(m=>({gid:m.group_id,uid:m.user_id,status:m.status}));
 S.events=evs.map(e=>({id:e.id,judul:e.judul,waktu:e.mulai,lokasi:e.lokasi,by:e.dibuat_oleh}));
 S.rsvp={};rsv.forEach(r=>{(S.rsvp[r.event_id]=S.rsvp[r.event_id]||{})[r.user_id]=r.status});
}
async function syncFeed(){
 const [posts,rx,cm,ar]=await Promise.all([
  q(sb.from("posts").select("*").is("deleted_at",null).order("created_at",{ascending:false}).limit(150)),
  q(sb.from("reactions").select("post_id,user_id,kind").limit(5000)),
  q(sb.from("comments").select("*").order("created_at",{ascending:false}).limit(3000)),
  q(sb.from("announcement_reads").select("post_id,user_id").limit(5000))]);
 S.posts=posts.map(p=>({id:p.id,by:p.author_id,gid:p.group_id,text:p.body,img:p.image_path,aud:p.audience,type:p.kind,t:Date.parse(p.created_at)}));
 S.reacts={};rx.forEach(r=>{(S.reacts[r.post_id]=S.reacts[r.post_id]||{})[r.user_id]=r.kind});
 S.comments=cm.reverse().map(c=>({id:c.id,pid:c.post_id,by:c.author_id,pare:c.parent_id,text:c.body,t:Date.parse(c.created_at)}));
 S.readAnn=new Set(ar.filter(r=>r.user_id===S.me).map(r=>r.post_id));
 if(Date.now()-imgT>50*MIN){Object.keys(IMG).forEach(k=>delete IMG[k]);imgT=Date.now()}
 const need=[...new Set(S.posts.filter(p=>p.img&&!IMG[p.img]).map(p=>p.img))];
 if(need.length){try{const r=await sb.storage.from("media").createSignedUrls(need,3600);(r.data||[]).forEach(d=>{if(d.signedUrl)IMG[d.path]=d.signedUrl})}catch(e){console.warn("foto gagal dimuat",e)}}
}
async function syncNotifs(){
 const n=await q(sb.from("notifications").select("*").eq("user_id",S.me).order("created_at",{ascending:false}).limit(60));
 S.notifs=n.map(x=>({id:x.id,tipe:x.tipe,text:x.teks,link:x.link,t:Date.parse(x.created_at),read:x.dibaca}));
}
async function syncChat(){
 const [cv,cm,ms]=await Promise.all([
  q(sb.from("conversations").select("id,dm_key")),
  q(sb.from("conversation_members").select("conversation_id,user_id,last_read_at")),
  q(sb.from("messages").select("*").order("created_at",{ascending:false}).limit(1000))]);
 S.convos=cv.map(c=>{
  const mm=cm.filter(x=>x.conversation_id===c.id);const mine=mm.find(x=>x.user_id===S.me);
  return{id:c.id,members:mm.map(x=>x.user_id),lastRead:mine?Date.parse(mine.last_read_at):0,
   msgs:ms.filter(m=>m.conversation_id===c.id).reverse().map(m=>({id:m.id,by:m.sender_id,text:m.body,t:Date.parse(m.created_at)}))};
 }).filter(c=>c.members.includes(S.me)).sort((a,b)=>((b.msgs.at(-1)||{}).t||0)-((a.msgs.at(-1)||{}).t||0));
}
async function syncAdmin(){
 if(!isAdmin()){S.reports=[];S.invites=[];S.annStats={};return}
 const [rp,iv,st]=await Promise.all([
  q(sb.from("reports").select("*").order("created_at",{ascending:false}).limit(200)),
  q(sb.from("invites").select("id,nik,nama,dept,jabatan,expires_at,used_at,created_at").order("created_at",{ascending:false}).limit(200)),
  q(sb.rpc("announcement_stats"))]);
 S.reports=rp.map(r=>({id:r.id,by:r.reporter_id,pid:r.post_id,alasan:r.alasan,status:r.status,t:Date.parse(r.created_at)}));
 S.invites=iv.map(i=>({id:i.id,nik:i.nik,nama:i.nama,dept:i.dept,jabatan:i.jabatan,exp:Date.parse(i.expires_at),used:!!i.used_at}));
 S.annStats={};st.forEach(s=>{S.annStats[s.post_id]={dibaca:Number(s.dibaca),total:Number(s.total)}});
}
const ALL=["core","feed","notifs","chat","admin"];
async function sync(parts=ALL){
 const j=[];
 if(parts.includes("core"))j.push(syncCore());
 if(parts.includes("feed"))j.push(syncFeed());
 if(parts.includes("notifs"))j.push(syncNotifs());
 if(parts.includes("chat"))j.push(syncChat());
 await Promise.all(j);
 if(parts.includes("admin"))await syncAdmin();
}
async function run(fn,parts,okMsg){
 try{await fn();if(parts)await sync(parts);render();if(okMsg)toast(okMsg)}
 catch(e){console.error(e);toast(errMsg(e));try{if(parts){await sync(parts);render()}}catch(_){}}
}

/* ================= tampilan ================= */
function loginView(mode){
 const act=mode==="activate";
 return `<main class="auth"><div class="auth-box card">
  <div class="logo" style="margin-bottom:8px"><span class="logo-mark">CJ</span>CJBook</div>
  <p class="muted" style="margin-top:0">${act?"Aktifkan akun dengan kode dari HRD.":"Ruang ngobrol khusus karyawan."}</p>
  <form data-form="${act?"activate":"login"}" novalidate>
   ${act?`<label class="f" for="kode">Kode undangan</label><input id="kode" type="text" autocomplete="off" placeholder="CJ-XXXXXXXX">`
        :`<label class="f" for="nik">ID karyawan (NIK)</label><input id="nik" type="text" inputmode="text" autocomplete="username">`}
   <label class="f" for="pw">${act?"Buat kata sandi (min. 6 karakter)":"Kata sandi"}</label>
   <input id="pw" type="password" autocomplete="${act?"new-password":"current-password"}">
   <div id="aerr" class="err" role="alert"></div>
   <button class="btn primary block" style="margin-top:16px">${act?"Aktifkan akun":"Masuk"}</button>
  </form>
  <p class="small" style="text-align:center;margin:16px 0 0">${act?`<a href="#/login">Sudah punya akun? Masuk</a>`:`<a href="#/activate">Karyawan baru? Aktifkan akun</a>`}</p>
 </div></main>`;
}
function rightPanel(){
 const ev=[...S.events].filter(e=>Date.parse(e.waktu)>Date.now()-DAY).slice(0,2);
 const sug=S.users.filter(u=>u.id!==S.me&&u.aktif&&!follows(S.me,u.id)).slice(0,3);
 return `
 <div class="card"><h3>Acara mendatang</h3>
  ${ev.map(e=>`<div style="margin-bottom:10px"><a href="#/events"><strong>${esc(e.judul)}</strong></a><div class="muted small">${fmtDate(e.waktu)} · ${esc(e.lokasi)}</div></div>`).join("")||`<div class="muted small">Belum ada acara.</div>`}
 </div>
 <div class="card"><h3>Mungkin Anda kenal</h3>
  ${sug.map(u=>`<div class="person">${av(u,36)}<div class="grow"><a href="#/u/${esc(u.id)}"><strong>${esc(u.nama)}</strong></a><div class="muted small">${esc(u.dept)}</div></div><button class="btn sm" data-act="follow" data-id="${esc(u.id)}">Ikuti</button></div>`).join("")||`<div class="muted small">Tidak ada saran saat ini.</div>`}
 </div>`;
}
const fmtDate=s=>new Date(s).toLocaleString("id-ID",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});

function shell(inner,route){
 const m=me(),nu=unread(),na=unreadAnn(),nc=chatUnread();
 const lk=(r,label,icon,extra="")=>`<a class="sidelink ${route===r?"on":""}" href="#/${r}">${ic(icon)}${label}${extra}</a>`;
 const myGroups=S.groups.filter(g=>isMember(g.id));
 const nav=`
  <a class="iconbtn ${route===""?"on":""}" href="#/" aria-label="Beranda">${ic("home")}</a>
  <a class="iconbtn hide-m ${route==="groups"?"on":""}" href="#/groups" aria-label="Grup">${ic("users")}</a>
  <a class="iconbtn ${route==="announcements"?"on":""}" href="#/announcements" aria-label="Pengumuman, ${na} belum dibaca">${ic("mega")}${na?`<span class="badge">${na}</span>`:""}</a>
  <a class="iconbtn ${route==="chat"?"on":""}" href="#/chat" aria-label="Pesan, ${nc} belum dibaca">${ic("chat")}${nc?`<span class="badge">${nc}</span>`:""}</a>
  <a class="iconbtn ${route==="notifications"?"on":""}" href="#/notifications" aria-label="Notifikasi, ${nu} baru">${ic("bell")}${nu?`<span class="badge">${nu}</span>`:""}</a>`;
 return `
 <header class="top">
  <a class="logo" href="#/" aria-label="CJBook beranda"><span class="logo-mark">CJ</span><span class="hide-m">CJBook</span></a>
  <form data-form="search" role="search"><label class="sr" for="q">Cari</label><input id="q" type="search" placeholder="Cari rekan, grup, postingan"></form>
  <nav class="nav" aria-label="Utama">${nav}<a class="iconbtn" href="#/u/${esc(m.id)}" aria-label="Profil saya">${av(m,32)}</a></nav>
 </header>
 <div class="shell">
  <aside class="side left" aria-label="Pintasan">
   <a class="sidelink" href="#/u/${esc(m.id)}">${av(m,32)}<strong>${esc(m.nama)}</strong></a>
   ${lk("colleagues","Rekan","users")}${lk("groups","Grup","users")}${lk("announcements","Pengumuman","mega",na?`<span class="pill" style="margin-left:auto">${na}</span>`:"")}
   ${lk("events","Acara","cal")}${lk("chat","Pesan","chat")}${lk("settings","Pengaturan","gear")}${isAdmin()?lk("admin","Panel Admin","shield"):""}
   <hr style="border:0;border-top:1px solid var(--border);margin:12px 0">
   <div class="muted small" style="padding:0 12px 4px">Grup saya</div>
   ${myGroups.map(g=>`<a class="sidelink" href="#/g/${esc(g.id)}">${esc(g.nama)}</a>`).join("")||`<div class="muted small" style="padding:0 12px">Belum ada grup.</div>`}
  </aside>
  <main id="main">${inner}</main>
  <aside class="side right" aria-label="Info samping">${rightPanel()}</aside>
 </div>
 <nav class="bottom" aria-label="Menu bawah">
  <a class="iconbtn ${route===""?"on":""}" href="#/" aria-label="Beranda">${ic("home")}</a>
  <a class="iconbtn ${route==="groups"?"on":""}" href="#/groups" aria-label="Grup">${ic("users")}</a>
  <a class="iconbtn ${route==="announcements"?"on":""}" href="#/announcements" aria-label="Pengumuman">${ic("mega")}${na?`<span class="badge">${na}</span>`:""}</a>
  <a class="iconbtn ${route==="chat"?"on":""}" href="#/chat" aria-label="Pesan">${ic("chat")}${nc?`<span class="badge">${nc}</span>`:""}</a>
  <a class="iconbtn ${route==="notifications"?"on":""}" href="#/notifications" aria-label="Notifikasi">${ic("bell")}${nu?`<span class="badge">${nu}</span>`:""}</a>
  <a class="iconbtn ${["settings","events","colleagues","admin"].includes(route)?"on":""}" href="#/settings" aria-label="Lainnya">${ic("gear")}</a>
 </nav>`;
}
function composer(gid=null){
 const m=me();
 return `<form class="card" data-form="post" data-gid="${esc(gid||"")}">
  <div class="row" style="align-items:flex-start">${av(m,40)}<div class="grow">
   <label class="sr" for="ptext">Tulis postingan</label>
   <textarea id="ptext" maxlength="5000" placeholder="Apa kabar hari ini, ${esc(m.nama.split(" ")[0])}?"></textarea>
   <div id="cmp-prev"></div>
   <div class="row wrap spread" style="margin-top:8px">
    <div class="row wrap">
     <label class="btn sm" style="cursor:pointer">${ic("image")} Foto<input id="pimg" type="file" accept="image/*" class="sr"></label>
     ${gid?"":`<label class="sr" for="paud">Audiens</label><select id="paud" style="width:auto;padding:6px 10px"><option value="semua">Semua karyawan</option><option value="rekan">Rekan saya</option></select>`}
     ${isAdmin()&&!gid?`<label class="small row" style="gap:6px"><input type="checkbox" id="pann"> Pengumuman resmi</label>`:""}
    </div>
    <button class="btn primary sm">Kirim</button>
   </div></div></div></form>`;
}
function postCard(p,full=false){
 const a=U(p.by)||{id:"",nama:"(akun dihapus)",jabatan:"",warna:"#4A5568"},g=p.gid?G(p.gid):null;
 const r=S.reacts[p.id]||{};
 const R=[["suka","👍","Suka"],["hebat","👏","Hebat"],["tawa","😄","Lucu"],["peduli","🤝","Peduli"]];
 const cms=S.comments.filter(c=>c.pid===p.id);
 const open=full||openCm.has(p.id);
 const can=p.by===S.me||isAdmin();
 const aud=g?`di ${esc(g.nama)}`:p.aud==="rekan"?"Rekan":"Semua karyawan";
 const img=p.img&&IMG[p.img];
 return `<article class="card post ${p.type==="pengumuman"?"ann":""}" id="post-${esc(p.id)}">
  <div class="head">${av(a,44)}<div class="grow">${a.id?nameLink(a):`<strong>${esc(a.nama)}</strong>`} ${p.type==="pengumuman"?`<span class="pill">Pengumuman</span>`:""}
   <div class="muted small">${esc(a.jabatan)} · ${ago(p.t)} · ${aud}</div></div>
   ${can?`<button class="iconbtn" data-act="delpost" data-id="${esc(p.id)}" aria-label="Hapus postingan">${ic("trash")}</button>`:""}
   ${p.by!==S.me?`<button class="iconbtn" data-act="report" data-id="${esc(p.id)}" aria-label="Laporkan postingan">${ic("flag")}</button>`:""}
  </div>
  <div class="body">${esc(p.text)}</div>
  ${img?`<img class="m" src="${esc(img)}" alt="Foto dalam postingan ${esc(a.nama)}">`:p.img?`<div class="muted small" style="margin-bottom:12px">(foto belum bisa dimuat)</div>`:""}
  <div class="reacts" role="group" aria-label="Reaksi">
   ${R.map(([k,e,l])=>{const n=Object.values(r).filter(v=>v===k).length;return `<button class="rbtn ${r[S.me]===k?"on":""}" data-act="react" data-id="${esc(p.id)}" data-k="${k}" aria-pressed="${r[S.me]===k}" aria-label="${l}, ${n}"><span aria-hidden="true">${e}</span>${n||""}</button>`}).join("")}
   <button class="rbtn" data-act="togglecm" data-id="${esc(p.id)}" style="margin-left:auto">${ic("chat")} ${cms.length} komentar</button>
  </div>
  ${open?commentsBlock(p,cms):""}
 </article>`;
}
function commentsBlock(p,cms){
 const tops=cms.filter(c=>!c.pare);
 const one=(c,rep)=>{const u=U(c.by)||{id:"",nama:"(akun dihapus)",warna:"#4A5568"};return `<div class="cm ${rep?"reply":""}">${av(u,32)}<div><div class="bub">${u.id?nameLink(u):esc(u.nama)}<div>${esc(c.text)}</div></div>
  <div class="muted small" style="padding:2px 12px">${ago(c.t)} ${rep?"":`· <button class="btn sm" style="height:auto;border:0;padding:0;background:none;color:var(--accent-text)" data-act="reply" data-id="${esc(p.id)}" data-cid="${esc(c.id)}">Balas</button>`}
  ${c.by===S.me||isAdmin()?`· <button class="btn sm" style="height:auto;border:0;padding:0;background:none;color:var(--danger)" data-act="delcm" data-id="${esc(c.id)}">Hapus</button>`:""}</div></div></div>`};
 return `<div>${tops.map(c=>one(c,false)+cms.filter(x=>x.pare===c.id).map(x=>one(x,true)).join("")).join("")}
  <form class="cmform" data-form="comment" data-pid="${esc(p.id)}"><label class="sr" for="ci-${esc(p.id)}">Tulis komentar</label><input id="ci-${esc(p.id)}" type="text" maxlength="2000" placeholder="Tulis komentar..." autocomplete="off"><button class="btn primary sm" aria-label="Kirim komentar">${ic("send")}</button></form></div>`;
}
const pinned=p=>p.type==="pengumuman"&&Date.now()-p.t<2*DAY?1:0;
function feedView(){
 const posts=S.posts.filter(canSee).sort((a,b)=>pinned(b)-pinned(a)||b.t-a.t);
 return composer()+(posts.map(p=>postCard(p)).join("")||`<div class="card empty">Belum ada postingan. Jadilah yang pertama menyapa!</div>`);
}
function postView(id){const p=S.posts.find(x=>x.id===id);if(!p||!canSee(p))return`<div class="card empty">Postingan tidak ditemukan atau Anda tidak punya akses.<br><a href="#/">Kembali ke beranda</a></div>`;return postCard(p,true)}
function profileView(id,tab){
 const u=U(id);if(!u)return`<div class="card empty">Profil tidak ditemukan.</div>`;
 const mine=u.id===S.me;const fol=follows(S.me,u.id);
 const posts=S.posts.filter(p=>p.by===u.id&&canSee(p)).sort((a,b)=>b.t-a.t);
 const fc=S.follows.filter(f=>f[1]===u.id).length,fg=S.follows.filter(f=>f[0]===u.id).length;
 return `<div class="card" style="padding:0;overflow:hidden"><div class="cover" style="--c:${u.warna}"></div>
  <div class="profilehead">${av(u,96)}<div class="grow" style="padding-bottom:8px"><h2 style="margin:0;font-size:22px">${esc(u.nama)}</h2>
   <div class="muted">${esc(u.jabatan)} · ${esc(u.dept)} · ${esc(u.site)}</div><div class="small muted">${fc} pengikut · ${fg} mengikuti</div></div>
   <div class="row" style="padding-bottom:8px">${mine?`<button class="btn" data-act="editprofile">Ubah profil</button>`:`<button class="btn ${fol?"":"primary"}" data-act="follow" data-id="${esc(u.id)}">${fol?"Mengikuti":"Ikuti"}</button><button class="btn" data-act="dm" data-id="${esc(u.id)}">Pesan</button>`}</div></div>
  <div class="tabs" style="margin:0 16px"><a class="tab ${tab!=="about"?"on":""}" href="#/u/${esc(u.id)}">Postingan</a><a class="tab ${tab==="about"?"on":""}" href="#/u/${esc(u.id)}/about">Tentang</a></div>
  <div style="padding:0 16px 16px;margin-top:12px">${tab==="about"?`<p>${esc(u.bio||"Belum ada bio.")}</p><div class="muted small">NIK ${esc(u.nik)}${u.hp?` · ${esc(u.hp)}`:""}</div>`:`<p class="muted small" style="margin-top:0">${esc(u.bio||"")}</p>`}</div></div>
  ${tab==="about"?"":(posts.map(p=>postCard(p)).join("")||`<div class="card empty">Belum ada postingan.</div>`)}`;
}
function colleaguesView(){
 const L=S.users.filter(u=>u.id!==S.me&&u.aktif);
 return `<div class="card"><h2>Rekan di CJ (${L.length})</h2>${L.map(u=>`<div class="person">${av(u,48)}<div class="grow"><a href="#/u/${esc(u.id)}"><strong>${esc(u.nama)}</strong></a><div class="muted small">${esc(u.jabatan)} · ${esc(u.dept)}</div></div><button class="btn sm ${follows(S.me,u.id)?"":"primary"}" data-act="follow" data-id="${esc(u.id)}">${follows(S.me,u.id)?"Mengikuti":"Ikuti"}</button></div>`).join("")||`<div class="empty">Belum ada rekan lain.</div>`}</div>`;
}
function groupsView(){
 return `<div class="row spread" style="margin-bottom:12px"><h2 style="margin:0">Grup</h2><button class="btn primary sm" data-act="newgroup">Buat grup</button></div>
 ${S.groups.map(g=>{const m=S.members.find(x=>x.gid===g.id&&x.uid===S.me);const n=S.members.filter(x=>x.gid===g.id&&x.status==="aktif").length;
 return `<div class="card row"><div class="grow"><a href="#/g/${esc(g.id)}"><strong>${esc(g.nama)}</strong></a> <span class="pill ${g.privasi==="tertutup"?"warn":""}">${esc(g.privasi)}</span><div class="muted small">${esc(g.desk)}${m&&m.status==="aktif"?` · ${n} anggota`:""}</div></div>
 ${m&&m.status==="aktif"?`<span class="pill">Anggota</span>`:m&&m.status==="menunggu"?`<span class="muted small">Menunggu persetujuan</span>`:`<button class="btn sm primary" data-act="join" data-id="${esc(g.id)}">${g.privasi==="tertutup"?"Minta gabung":"Gabung"}</button>`}</div>`}).join("")||`<div class="card empty">Belum ada grup. Buat yang pertama!</div>`}`;
}
function groupView(id,tab){
 const g=G(id);if(!g)return`<div class="card empty">Grup tidak ditemukan.</div>`;
 const mem=isMember(id);const owner=g.owner===S.me||isAdmin();
 const ms=S.members.filter(m=>m.gid===id);
 const posts=S.posts.filter(p=>p.gid===id).sort((a,b)=>b.t-a.t);
 const hidden=g.privasi==="tertutup"&&!mem&&!isAdmin();
 const myRow=S.members.find(m=>m.gid===id&&m.uid===S.me);
 return `<div class="card"><h2 style="font-size:22px;margin-bottom:4px">${esc(g.nama)}</h2><div class="muted">${esc(g.desk)}</div>
  <div class="row" style="margin-top:12px">${mem?`<span class="pill">Anggota</span><button class="btn sm" data-act="leave" data-id="${esc(id)}">Keluar</button>`:myRow?`<span class="muted small">Menunggu persetujuan</span>`:`<button class="btn primary sm" data-act="join" data-id="${esc(id)}">${g.privasi==="tertutup"?"Minta gabung":"Gabung"}</button>`}</div>
  <div class="tabs"><a class="tab ${tab!=="members"?"on":""}" href="#/g/${esc(id)}">Diskusi</a><a class="tab ${tab==="members"?"on":""}" href="#/g/${esc(id)}/members">Anggota (${ms.filter(m=>m.status==="aktif").length})</a></div></div>
  ${tab==="members"?`<div class="card">${ms.filter(m=>m.status==="aktif"||owner).map(m=>{const u=U(m.uid);if(!u)return"";return `<div class="person">${av(u,40)}<div class="grow"><a href="#/u/${esc(u.id)}"><strong>${esc(u.nama)}</strong></a>${u.id===g.owner?` <span class="pill">Admin grup</span>`:""}<div class="muted small">${esc(u.dept)}</div></div>${m.status==="menunggu"?`<button class="btn sm primary" data-act="approve" data-id="${esc(id)}" data-uid="${esc(u.id)}">Setujui</button>`:""}</div>`}).join("")||`<div class="empty">Belum ada anggota yang terlihat.</div>`}</div>`
  :hidden?`<div class="card empty">Grup tertutup. Minta gabung untuk melihat diskusi.</div>`
  :(mem?composer(id):"")+(posts.map(p=>postCard(p)).join("")||`<div class="card empty">Belum ada diskusi di grup ini.</div>`)}`;
}
function annView(){
 const list=S.posts.filter(p=>p.type==="pengumuman").sort((a,b)=>b.t-a.t);
 return `<div class="row spread" style="margin-bottom:12px"><h2 style="margin:0">Pengumuman resmi</h2>${unreadAnn()?`<button class="btn sm" data-act="readall">Tandai semua dibaca</button>`:""}</div>
 ${list.map(p=>{const a=U(p.by),r=S.readAnn.has(p.id),st=S.annStats[p.id];return `<div class="card post ann"><div class="row spread"><div>${a?nameLink(a):""} <span class="muted small">· ${ago(p.t)}</span></div>${r?`<span class="muted small">Sudah dibaca</span>`:`<span class="pill warn">Belum dibaca</span>`}</div>
 <p style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(p.text)}</p>${r?"":`<button class="btn sm primary" data-act="readann" data-id="${esc(p.id)}">Saya sudah membaca</button>`}
 ${isAdmin()&&st?`<div class="muted small" style="margin-top:8px">${st.dibaca} dari ${st.total} karyawan sudah membaca</div>`:""}</div>`}).join("")||`<div class="card empty">Belum ada pengumuman.</div>`}`;
}
let notifT=null;
function notifView(){
 const L=S.notifs;
 if(L.some(n=>!n.read)){clearTimeout(notifT);notifT=setTimeout(async()=>{try{const r=await sb.from("notifications").update({dibaca:true}).eq("user_id",S.me).eq("dibaca",false);if(r.error)throw r.error;S.notifs.forEach(n=>n.read=true);render()}catch(e){console.warn(e)}},1500)}
 return `<div class="card"><h2>Notifikasi</h2>${L.map(n=>`<a class="person" style="color:var(--text);text-decoration:none;${n.read?"":"background:var(--accent-soft);border-radius:8px;padding:8px"}" href="${esc(n.link||"#/")}"><div class="grow">${esc(n.text)}<div class="muted small">${ago(n.t)}</div></div>${n.read?"":`<span class="pill">Baru</span>`}</a>`).join("")||`<div class="empty">Belum ada notifikasi.</div>`}</div>`;
}
function chatView(cid){
 const mine=S.convos;
 const cur=mine.find(c=>c.id===cid);
 const other=c=>U(c.members.find(x=>x!==S.me))||{id:"",nama:"(akun dihapus)",warna:"#4A5568"};
 if(cur)markRead(cur);
 return `<div class="chat ${cur?"open":""}"><div class="card clist" style="margin:0"><h3>Pesan</h3>
  ${mine.map(c=>{const o=other(c),l=c.msgs[c.msgs.length-1];const un=l&&l.by!==S.me&&l.t>c.lastRead;return `<a class="item ${c.id===cid?"on":""}" href="#/chat/${esc(c.id)}" style="color:var(--text);text-decoration:none">${av(o,40)}<div class="grow"><strong>${esc(o.nama)}</strong>${un?` <span class="pill">Baru</span>`:""}<div class="muted small" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(l?l.text:"Belum ada pesan")}</div></div></a>`}).join("")||`<div class="muted small">Belum ada percakapan. Buka profil rekan lalu tekan "Pesan".</div>`}
  <button class="btn sm block" style="margin-top:8px" data-act="newchat">Pesan baru</button></div>
  <div class="card cwin" style="margin:0">${cur?`<div class="row" style="margin-bottom:8px"><a href="#/chat" class="muted small" aria-label="Kembali ke daftar">&larr;</a>${av(other(cur),36)}<strong>${esc(other(cur).nama)}</strong></div>
   <div class="msgs" id="msgs" tabindex="0" aria-live="polite">${cur.msgs.map(m=>`<div class="msg ${m.by===S.me?"me":""}">${esc(m.text)}<div class="small" style="opacity:.75">${ago(m.t)}</div></div>`).join("")||`<div class="muted small">Mulai percakapan.</div>`}</div>
   <form class="cmform" data-form="msg" data-cid="${esc(cur.id)}"><label class="sr" for="mi">Pesan</label><input id="mi" type="text" maxlength="2000" placeholder="Tulis pesan..." autocomplete="off"><button class="btn primary sm" aria-label="Kirim pesan">${ic("send")}</button></form>`
   :`<div class="empty">Pilih percakapan di sebelah kiri.</div>`}</div></div>`;
}
async function markRead(c){
 const l=c.msgs[c.msgs.length-1];if(!l||l.t<=c.lastRead)return;
 c.lastRead=Date.now();
 try{await sb.from("conversation_members").update({last_read_at:new Date().toISOString()}).eq("conversation_id",c.id).eq("user_id",S.me)}catch(e){console.warn(e)}
}
function searchView(q){
 q=(q||"").trim().toLowerCase();
 if(!q)return`<div class="card empty">Ketik kata kunci pada kolom cari.</div>`;
 const pu=S.users.filter(u=>u.aktif&&(u.nama+u.jabatan+u.dept+u.site).toLowerCase().includes(q));
 const pg=S.groups.filter(g=>(g.nama+g.desk).toLowerCase().includes(q));
 const pp=S.posts.filter(p=>canSee(p)&&p.text.toLowerCase().includes(q));
 return `<div class="card"><h3>Orang (${pu.length})</h3>${pu.map(u=>`<div class="person">${av(u,40)}<div><a href="#/u/${esc(u.id)}"><strong>${esc(u.nama)}</strong></a><div class="muted small">${esc(u.jabatan)} · ${esc(u.dept)}</div></div></div>`).join("")||`<div class="muted small">Tidak ada hasil.</div>`}</div>
 <div class="card"><h3>Grup (${pg.length})</h3>${pg.map(g=>`<div class="person"><div><a href="#/g/${esc(g.id)}"><strong>${esc(g.nama)}</strong></a><div class="muted small">${esc(g.desk)}</div></div></div>`).join("")||`<div class="muted small">Tidak ada hasil.</div>`}</div>
 <h3 style="margin:16px 0 8px">Postingan (${pp.length})</h3>${pp.map(p=>postCard(p)).join("")||`<div class="card muted small">Tidak ada hasil.</div>`}`;
}
function eventsView(){
 const L=[...S.events].sort((a,b)=>a.waktu.localeCompare(b.waktu));
 return `<div class="row spread" style="margin-bottom:12px"><h2 style="margin:0">Acara</h2>${isAdmin()?`<button class="btn primary sm" data-act="newevent">Buat acara</button>`:""}</div>
 ${L.map(e=>{const r=S.rsvp[e.id]||{};const n=Object.values(r).filter(v=>v==="hadir").length;const my=r[S.me]==="hadir";
 return `<div class="card row"><div class="grow"><strong>${esc(e.judul)}</strong><div class="muted small">${fmtDate(e.waktu)} · ${esc(e.lokasi)}</div><div class="small">${n} orang akan hadir</div></div>
 <button class="btn ${my?"":"primary"} sm" data-act="rsvp" data-id="${esc(e.id)}" aria-pressed="${my}">${my?"Batal hadir":"Saya hadir"}</button></div>`}).join("")||`<div class="card empty">Belum ada acara.</div>`}`;
}
function settingsView(){
 const m=me();
 return `<div class="card"><h2>Pengaturan</h2>
  <div class="switch"><label for="s-dark">Mode gelap</label><input id="s-dark" type="checkbox" data-set="dark" ${S.theme==="dark"?"checked":""}></div>
  <div class="switch"><label for="s-k">Notifikasi komentar</label><input id="s-k" type="checkbox" data-set="komentar" ${m.nk?"checked":""}></div>
  <div class="switch"><label for="s-r">Notifikasi reaksi</label><input id="s-r" type="checkbox" data-set="reaksi" ${m.nr?"checked":""}></div>
  <form data-form="pw" style="margin-top:16px"><h3>Ganti kata sandi</h3>
   <label class="f" for="pw0">Kata sandi lama</label><input id="pw0" type="password" autocomplete="current-password">
   <label class="f" for="pw1">Kata sandi baru (min. 6 karakter)</label><input id="pw1" type="password" autocomplete="new-password">
   <div id="pwerr" class="err" role="alert"></div><button class="btn primary" style="margin-top:12px">Simpan</button></form>
  <div class="row wrap" style="margin-top:24px"><button class="btn" data-act="logout">${ic("out")} Keluar</button></div></div>`;
}
function adminView(){
 if(!isAdmin())return`<div class="card empty">Anda tidak punya akses ke halaman ini.</div>`;
 const open=S.reports.filter(r=>r.status==="baru");
 return `<div class="tabs"><button class="tab ${adminTab==="anggota"?"on":""}" data-act="atab" data-id="anggota">Anggota</button><button class="tab ${adminTab==="laporan"?"on":""}" data-act="atab" data-id="laporan">Laporan (${open.length})</button></div>
 ${adminTab==="anggota"?`<div class="card"><div class="row spread"><h3 style="margin:0">Anggota</h3><button class="btn primary sm" data-act="newinvite">Buat kode undangan</button></div>
  <div style="overflow:auto"><table><thead><tr><th>Nama</th><th>NIK</th><th>Departemen</th><th>Status</th><th></th></tr></thead><tbody>
  ${S.users.map(u=>`<tr><td>${esc(u.nama)}</td><td>${esc(u.nik)}</td><td>${esc(u.dept)}</td><td>${u.aktif?"Aktif":"Nonaktif"}</td><td>${u.id===S.me?"":`<button class="btn sm" data-act="toggleuser" data-id="${esc(u.id)}">${u.aktif?"Nonaktifkan":"Aktifkan"}</button>`}</td></tr>`).join("")}</tbody></table></div>
  ${S.invites.filter(i=>!i.used&&i.exp>Date.now()).length?`<h3 style="margin-top:16px">Undangan menunggu aktivasi</h3>${S.invites.filter(i=>!i.used&&i.exp>Date.now()).map(i=>`<div class="small">${esc(i.nama)} (NIK ${esc(i.nik)}) · berlaku sampai ${new Date(i.exp).toLocaleDateString("id-ID")}</div>`).join("")}`:""}</div>`
 :`<div class="card"><h3>Laporan konten</h3>${open.map(r=>{const p=S.posts.find(x=>x.id===r.pid);const by=U(r.by);return `<div style="margin-bottom:16px"><div class="small muted">Dilaporkan ${esc(by?by.nama:"?")} · ${ago(r.t)} · alasan: ${esc(r.alasan)}</div><div style="margin:6px 0;padding:8px;background:var(--bg);border-radius:8px">${esc(p?p.text:"(sudah dihapus atau tidak tersedia)")}</div><div class="row"><button class="btn sm danger" data-act="rephapus" data-id="${esc(r.id)}">Hapus konten</button><button class="btn sm" data-act="repabaikan" data-id="${esc(r.id)}">Abaikan</button></div></div>`}).join("")||`<div class="empty">Tidak ada laporan baru.</div>`}</div>`}`;
}

/* ================= router & render ================= */
function snapshot(){
 const o={};document.querySelectorAll("input[id],textarea[id],select[id]").forEach(e=>{if(["password","file","checkbox","radio"].includes(e.type))return;o[e.id]=e.value});
 const a=document.activeElement;
 return{o,focus:a&&a.id?a.id:null,pos:a&&a.selectionStart!=null?a.selectionStart:null,y:window.scrollY};
}
function restore(s){
 Object.entries(s.o).forEach(([id,v])=>{const e=document.getElementById(id);if(e&&!e.value&&v)e.value=v});
 if(s.focus){const e=document.getElementById(s.focus);if(e){e.focus();try{if(s.pos!=null)e.setSelectionRange(s.pos,s.pos)}catch(_){}}}
 window.scrollTo(0,s.y);
}
function render(keep=true){
 document.documentElement.dataset.theme=S.theme||"light";
 const app=$("#app");
 const h=location.hash.replace(/^#\/?/,"");const [path,qs]=h.split("?");const p=path.split("/").filter(Boolean);const r=p[0]||"";
 if(!sb){app.innerHTML=`<main class="auth"><div class="auth-box card"><h2>CJBook tidak bisa dimuat</h2><p class="muted">Pustaka Supabase gagal dimuat. Periksa koneksi internet lalu muat ulang halaman.</p></div></main>`;return}
 if(!S.me){app.innerHTML=loginView(r==="activate"?"activate":"login");return}
 const snap=keep?snapshot():null;
 let inner,route=r;
 try{
  switch(r){
   case"":inner=feedView();break;
   case"post":inner=postView(p[1]);route="";break;
   case"u":inner=profileView(p[1],p[2]);route=p[1]===S.me?"me":"u";break;
   case"colleagues":inner=colleaguesView();break;
   case"groups":inner=groupsView();break;
   case"g":inner=groupView(p[1],p[2]);route="groups";break;
   case"announcements":inner=annView();break;
   case"notifications":inner=notifView();break;
   case"chat":inner=chatView(p[1]);break;
   case"search":inner=searchView(decodeURIComponent((qs||"").replace(/^q=/,"")));break;
   case"events":inner=eventsView();break;
   case"settings":inner=settingsView();break;
   case"admin":inner=adminView();break;
   case"login":case"activate":location.hash="#/";return;
   default:inner=`<div class="card empty">Halaman tidak ditemukan.<br><a href="#/">Kembali ke beranda</a></div>`;
  }
 }catch(e){console.error(e);inner=`<div class="card empty">Terjadi kesalahan menampilkan halaman ini.</div>`}
 app.innerHTML=shell(inner,route);
 const msgs=$("#msgs");if(msgs)msgs.scrollTop=msgs.scrollHeight;
 if(draft&&$("#cmp-prev"))$("#cmp-prev").innerHTML=`<img src="${esc(draft.url)}" alt="Pratinjau foto" style="max-width:100%;max-height:180px;border-radius:8px;margin-top:8px">`;
 if(snap)restore(snap);
}
window.addEventListener("hashchange",()=>{if(draft){try{URL.revokeObjectURL(draft.url)}catch(_){}draft=null}render(false);window.scrollTo(0,0)});

/* ================= foto ================= */
function toBlobUnder(canvas,max){
 return new Promise(res=>{let q=.72;const go=()=>canvas.toBlob(b=>{if(!b)return res(null);if(b.size<=max||q<=.4)return res(b);q-=.12;go()},"image/jpeg",q);go()});
}
function prepImage(file){
 return new Promise((res,rej)=>{
  const url=URL.createObjectURL(file);const im=new Image();
  im.onload=async()=>{const k=Math.min(1,1024/Math.max(im.width,im.height));const c=document.createElement("canvas");c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext("2d").drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(url);const b=await toBlobUnder(c,480000);b?res(b):rej(new Error("gagal"))};
  im.onerror=()=>{URL.revokeObjectURL(url);rej(new Error("bukan gambar"))};im.src=url;
 });
}

/* ================= aksi ================= */
const fnError=async e=>{try{const j=await e.context.json();return j.error}catch(_){return null}};
async function startSession(){
 const {data}=await sb.auth.getSession();
 if(!data||!data.session)return false;
 S.me=data.session.user.id;S.email=data.session.user.email;
 await sync();
 if(!me()||!me().aktif){await sb.auth.signOut();S.me=null;return"nonaktif"}
 subscribe();return true;
}
let chan=null,liveT=null;
function subscribe(){
 try{
  if(chan)sb.removeChannel(chan);
  chan=sb.channel("cj-"+S.me)
   .on("postgres_changes",{event:"INSERT",schema:"public",table:"messages"},live)
   .on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications",filter:"user_id=eq."+S.me},live)
   .subscribe();
 }catch(e){console.warn("realtime tidak aktif",e)}
}
function live(){clearTimeout(liveT);liveT=setTimeout(async()=>{if(!S.me)return;try{await sync(["notifs","chat","feed"]);render()}catch(e){console.warn(e)}},400)}
setInterval(async()=>{if(S.me&&!document.hidden&&!$("#modal").innerHTML){try{await sync();render()}catch(e){console.warn(e)}}},60000);

document.addEventListener("change",async e=>{
 const t=e.target;
 if(t.id==="pimg"&&t.files[0]){
  try{const b=await prepImage(t.files[0]);if(draft)URL.revokeObjectURL(draft.url);draft={blob:b,url:URL.createObjectURL(b)};$("#cmp-prev").innerHTML=`<img src="${esc(draft.url)}" alt="Pratinjau foto" style="max-width:100%;max-height:180px;border-radius:8px;margin-top:8px">`}
  catch(_){toast("File bukan gambar yang valid")}
 }
 if(t.dataset.set){
  const k=t.dataset.set;
  if(k==="dark"){S.theme=t.checked?"dark":"light";try{localStorage.setItem("cjbook.theme",S.theme)}catch(_){}document.documentElement.dataset.theme=S.theme}
  else{const col=k==="komentar"?"notif_komentar":"notif_reaksi";const r=await sb.from("profiles").update({[col]:t.checked}).eq("id",S.me);if(r.error){toast(errMsg(r.error));t.checked=!t.checked}else{me()[k==="komentar"?"nk":"nr"]=t.checked}}
 }
});

const FORMS={
 async login(f){
  const nik=$("#nik").value.trim(),pw=$("#pw").value,err=$("#aerr");
  if(!NIK_RE.test(nik)||!pw){err.textContent="Isi ID karyawan dan kata sandi.";return}
  const {error}=await sb.auth.signInWithPassword({email:emailOf(nik),password:pw});
  if(error){err.textContent="ID karyawan atau kata sandi salah.";return}
  const r=await startSession();
  if(r==="nonaktif"){render();$("#aerr").textContent="Akun Anda dinonaktifkan. Hubungi HRD.";return}
  if(!r){err.textContent="Gagal masuk. Coba lagi.";return}
  location.hash="#/";render(false);
 },
 async activate(f){
  const kode=$("#kode").value.trim().toUpperCase(),pw=$("#pw").value,err=$("#aerr");
  if(!/^CJ-[A-Z0-9]{8}$/.test(kode)){err.textContent="Format kode salah. Contoh: CJ-ABCD2345";return}
  if(pw.length<6){err.textContent="Kata sandi minimal 6 karakter.";return}
  const {data,error}=await sb.functions.invoke("activate",{body:{kode,password:pw}});
  if(error){err.textContent=(await fnError(error))||"Aktivasi gagal. Coba lagi atau hubungi HRD.";return}
  const {error:e2}=await sb.auth.signInWithPassword({email:data.email,password:pw});
  if(e2){err.textContent="Akun dibuat, tetapi gagal masuk. Silakan masuk manual.";return}
  await startSession();toast("Akun aktif. Selamat datang di CJBook!");location.hash="#/";render(false);
 },
 async search(f){const v=$("#q").value.trim();location.hash="#/search?q="+encodeURIComponent(v)},
 async post(f){
  const text=$("#ptext").value.trim();if(!text&&!draft){toast("Tulis sesuatu atau tambahkan foto dulu");return}
  const gid=f.dataset.gid||null,ann=$("#pann")&&$("#pann").checked;
  const btn=f.querySelector("button.primary");btn.disabled=true;
  try{
   let path=null;
   if(draft){path=`${S.me}/${crypto.randomUUID()}.jpg`;const up=await sb.storage.from("media").upload(path,draft.blob,{contentType:"image/jpeg",upsert:false});if(up.error)throw up.error}
   const r=await sb.from("posts").insert({author_id:S.me,group_id:gid,body:text,image_path:path,audience:gid?"grup":($("#paud")?$("#paud").value:"semua"),kind:ann?"pengumuman":"biasa"});
   if(r.error)throw r.error;
   $("#ptext").value="";if(draft){URL.revokeObjectURL(draft.url);draft=null}
   await sync(["feed","notifs"]);render();toast(ann?"Pengumuman terkirim":"Postingan terkirim");
  }catch(e){console.error(e);toast(errMsg(e))}finally{btn.disabled=false}
 },
 async comment(f){
  const i=f.querySelector("input");const text=i.value.trim();if(!text)return;
  const pid=f.dataset.pid;const pare=window.__replyTo&&window.__replyTo.pid===pid?window.__replyTo.cid:null;
  await run(async()=>{const r=await sb.from("comments").insert({post_id:pid,author_id:S.me,parent_id:pare,body:text});if(r.error)throw r.error;window.__replyTo=null;i.value="";openCm.add(pid)},["feed","notifs"]);
 },
 async msg(f){
  const i=f.querySelector("input");const text=i.value.trim();if(!text)return;i.value="";
  await run(async()=>{const r=await sb.from("messages").insert({conversation_id:f.dataset.cid,sender_id:S.me,body:text});if(r.error)throw r.error},["chat"]);
 },
 async pw(f){
  const a=$("#pw0").value,b=$("#pw1").value,err=$("#pwerr");
  if(b.length<6){err.textContent="Kata sandi baru minimal 6 karakter.";return}
  const chk=await sb.auth.signInWithPassword({email:S.email,password:a});
  if(chk.error){err.textContent="Kata sandi lama salah.";return}
  const r=await sb.auth.updateUser({password:b});
  if(r.error){err.textContent="Gagal mengganti kata sandi.";return}
  err.textContent="";f.reset();toast("Kata sandi diganti");
 },
 async editprofile(f){
  const m=me();
  await run(async()=>{const r=await sb.from("profiles").update({jabatan:$("#e-j").value.trim()||m.jabatan,bio:$("#e-b").value.trim().slice(0,300),hp:$("#e-h").value.trim().slice(0,20)}).eq("id",S.me);if(r.error)throw r.error;closeModal()},["core"],"Profil disimpan");
 },
 async newgroup(f){
  const n=$("#g-n").value.trim();if(n.length<2){$("#g-err").textContent="Nama grup minimal 2 huruf.";return}
  let id=null;
  await run(async()=>{
   const r=await sb.from("groups").insert({nama:n,deskripsi:$("#g-d").value.trim(),privasi:$("#g-p").value,owner_id:S.me}).select("id").single();if(r.error)throw r.error;id=r.data.id;
   const m=await sb.from("group_members").insert({group_id:id,user_id:S.me,status:"aktif"});if(m.error)throw m.error;closeModal();
  },["core"],"Grup dibuat");
  if(id)location.hash="#/g/"+id;
 },
 async newevent(f){
  const j=$("#v-j").value.trim(),w=$("#v-w").value;if(!j||!w){$("#v-err").textContent="Judul dan waktu wajib diisi.";return}
  await run(async()=>{const r=await sb.from("events").insert({judul:j,mulai:new Date(w).toISOString(),lokasi:$("#v-l").value.trim()||"-",dibuat_oleh:S.me});if(r.error)throw r.error;closeModal()},["core"],"Acara dibuat");
 },
 async newinvite(f){
  const n=$("#i-n").value.trim(),k=$("#i-k").value.trim();
  if(!n||!k){$("#i-err").textContent="Nama dan NIK wajib diisi.";return}
  if(!NIK_RE.test(k)){$("#i-err").textContent="NIK hanya huruf, angka, atau tanda hubung (3-20 karakter).";return}
  if(S.users.some(u=>u.nik.toLowerCase()===k.toLowerCase())){$("#i-err").textContent="NIK sudah terdaftar.";return}
  const kode="CJ-"+randCode(8);const hash=await sha256(kode);
  let ok=false;
  await run(async()=>{const r=await sb.from("invites").insert({kode_hash:hash,nik:k,nama:n,dept:$("#i-d").value.trim()||"Umum",jabatan:$("#i-j").value.trim()||"Karyawan",created_by:S.me});if(r.error)throw r.error;ok=true},["admin"]);
  if(ok)modal(`<h2>Kode undangan</h2><p>Berikan kode ini kepada <strong>${esc(n)}</strong>. Kode hanya tampil sekali di sini dan berlaku 14 hari.</p><p style="font-size:24px;font-weight:800;letter-spacing:2px;text-align:center;user-select:all" id="kodeout">${esc(kode)}</p><div class="row" style="justify-content:flex-end"><button class="btn" data-act="copykode" data-id="${esc(kode)}">Salin</button><button class="btn primary" data-act="close">Selesai</button></div>`);
 },
 async report(f){
  await run(async()=>{const r=await sb.from("reports").insert({reporter_id:S.me,post_id:f.dataset.pid,alasan:$("#r-a").value});if(r.error&&!/duplicate/i.test(r.error.message))throw r.error;closeModal()},["admin"],"Laporan terkirim ke admin");
 },
 async newchat(f){
  const o=$("#nc-u").value;if(!o)return;
  await openDm(o);closeModal();
 }
};
function randCode(n){const A="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";const a=new Uint32Array(n);crypto.getRandomValues(a);return[...a].map(x=>A[x%A.length]).join("")}
async function sha256(t){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(t));return[...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,"0")).join("")}
async function openDm(other){
 try{const r=await sb.rpc("start_dm",{other});if(r.error)throw r.error;await sync(["chat"]);location.hash="#/chat/"+r.data}
 catch(e){console.error(e);toast(errMsg(e))}
}
document.addEventListener("submit",async e=>{
 const f=e.target.closest("[data-form]");if(!f)return;e.preventDefault();
 const fn=FORMS[f.dataset.form];if(!fn)return;
 try{await fn(f)}catch(err){console.error(err);toast(errMsg(err))}
});
function userOptions(){return S.users.filter(u=>u.id!==S.me&&u.aktif).map(u=>`<option value="${esc(u.id)}">${esc(u.nama)} (${esc(u.dept)})</option>`).join("")}
const dlgBtns=lbl=>`<div class="row" style="margin-top:16px;justify-content:flex-end"><button type="button" class="btn" data-act="close">Batal</button><button class="btn primary">${lbl}</button></div>`;
document.addEventListener("click",async e=>{
 const b=e.target.closest("[data-act]");if(!b)return;
 const act=b.dataset.act,id=b.dataset.id;
 if(act==="scrim"){if(e.target===b)closeModal();return}
 if(act==="close"){closeModal();return}
 switch(act){
  case"react":{
   const r=S.reacts[id]=S.reacts[id]||{};const had=r[S.me];const k=b.dataset.k;const y=window.scrollY;
   if(had===k)delete r[S.me];else r[S.me]=k;render();window.scrollTo(0,y);
   try{
    const res=had===k?await sb.from("reactions").delete().eq("post_id",id).eq("user_id",S.me):await sb.from("reactions").upsert({post_id:id,user_id:S.me,kind:k},{onConflict:"post_id,user_id"});
    if(res.error)throw res.error;
   }catch(err){console.error(err);toast(errMsg(err));try{await sync(["feed"]);render()}catch(_){}}
   break}
  case"togglecm":openCm.has(id)?openCm.delete(id):openCm.add(id);render();break;
  case"reply":{window.__replyTo={pid:id,cid:b.dataset.cid};openCm.add(id);render();const i=$("#ci-"+id);if(i){i.focus();i.placeholder="Membalas komentar..."}break}
  case"delcm":await run(async()=>{const r=await sb.from("comments").delete().eq("id",id);if(r.error)throw r.error},["feed"]);break;
  case"delpost":if(confirm("Hapus postingan ini?"))await run(async()=>{const r=await sb.from("posts").update({deleted_at:new Date().toISOString()}).eq("id",id);if(r.error)throw r.error},["feed"],"Postingan dihapus");break;
  case"report":modal(`<h2>Laporkan postingan</h2><form data-form="report" data-pid="${esc(id)}"><label class="f" for="r-a">Alasan</label><select id="r-a"><option>Tidak pantas / menyinggung</option><option>Informasi keliru</option><option>Spam</option><option>Membocorkan data perusahaan</option></select>${dlgBtns("Kirim laporan")}</form>`);break;
  case"follow":await run(async()=>{const fol=follows(S.me,id);const r=fol?await sb.from("follows").delete().eq("follower_id",S.me).eq("followee_id",id):await sb.from("follows").insert({follower_id:S.me,followee_id:id});if(r.error)throw r.error},["core"]);break;
  case"dm":await openDm(id);break;
  case"newchat":modal(`<h2>Pesan baru</h2><form data-form="newchat"><label class="f" for="nc-u">Kepada</label><select id="nc-u">${userOptions()}</select>${dlgBtns("Mulai")}</form>`);break;
  case"editprofile":{const m=me();modal(`<h2>Ubah profil</h2><form data-form="editprofile"><label class="f" for="e-j">Jabatan</label><input id="e-j" type="text" maxlength="80" value="${esc(m.jabatan)}"><label class="f" for="e-b">Bio</label><textarea id="e-b" maxlength="300">${esc(m.bio)}</textarea><label class="f" for="e-h">Nomor HP (opsional)</label><input id="e-h" type="text" maxlength="20" value="${esc(m.hp)}">${dlgBtns("Simpan")}</form>`);break}
  case"newgroup":modal(`<h2>Buat grup</h2><form data-form="newgroup"><label class="f" for="g-n">Nama grup</label><input id="g-n" type="text" maxlength="80"><label class="f" for="g-d">Deskripsi</label><input id="g-d" type="text" maxlength="300"><label class="f" for="g-p">Privasi</label><select id="g-p"><option value="terbuka">Terbuka (semua boleh gabung)</option><option value="tertutup">Tertutup (perlu persetujuan)</option></select><div id="g-err" class="err" role="alert"></div>${dlgBtns("Buat")}</form>`);break;
  case"join":{const g=G(id);await run(async()=>{const r=await sb.from("group_members").insert({group_id:id,user_id:S.me,status:g.privasi==="tertutup"?"menunggu":"aktif"});if(r.error)throw r.error},["core","feed"],g.privasi==="tertutup"?"Permintaan dikirim":"Anda bergabung");break}
  case"leave":await run(async()=>{const r=await sb.from("group_members").delete().eq("group_id",id).eq("user_id",S.me);if(r.error)throw r.error},["core","feed"]);break;
  case"approve":await run(async()=>{const r=await sb.from("group_members").update({status:"aktif"}).eq("group_id",id).eq("user_id",b.dataset.uid);if(r.error)throw r.error},["core"],"Disetujui");break;
  case"readann":await run(async()=>{const r=await sb.from("announcement_reads").insert({post_id:id,user_id:S.me});if(r.error&&!/duplicate/i.test(r.error.message))throw r.error},["feed","admin"]);break;
  case"readall":await run(async()=>{const rows=S.posts.filter(p=>p.type==="pengumuman"&&!S.readAnn.has(p.id)).map(p=>({post_id:p.id,user_id:S.me}));if(rows.length){const r=await sb.from("announcement_reads").upsert(rows,{onConflict:"post_id,user_id",ignoreDuplicates:true});if(r.error)throw r.error}},["feed","admin"]);break;
  case"rsvp":await run(async()=>{const my=(S.rsvp[id]||{})[S.me]==="hadir";const r=my?await sb.from("event_rsvps").delete().eq("event_id",id).eq("user_id",S.me):await sb.from("event_rsvps").insert({event_id:id,user_id:S.me,status:"hadir"});if(r.error)throw r.error},["core"]);break;
  case"newevent":modal(`<h2>Buat acara</h2><form data-form="newevent"><label class="f" for="v-j">Judul</label><input id="v-j" type="text" maxlength="120"><label class="f" for="v-w">Waktu</label><input id="v-w" type="datetime-local"><label class="f" for="v-l">Lokasi</label><input id="v-l" type="text"><div id="v-err" class="err" role="alert"></div>${dlgBtns("Buat")}</form>`);break;
  case"atab":adminTab=id;render();break;
  case"toggleuser":await run(async()=>{const u=U(id);const r=await sb.from("profiles").update({aktif:!u.aktif}).eq("id",id);if(r.error)throw r.error},["core"]);break;
  case"newinvite":modal(`<h2>Kode undangan karyawan baru</h2><form data-form="newinvite"><label class="f" for="i-n">Nama lengkap</label><input id="i-n" type="text" maxlength="80"><label class="f" for="i-k">NIK</label><input id="i-k" type="text" maxlength="20"><label class="f" for="i-d">Departemen</label><input id="i-d" type="text" maxlength="60"><label class="f" for="i-j">Jabatan</label><input id="i-j" type="text" maxlength="80"><div id="i-err" class="err" role="alert"></div>${dlgBtns("Buat kode")}</form>`);break;
  case"copykode":try{await navigator.clipboard.writeText(id);toast("Kode disalin")}catch(_){toast("Salin manual: tekan lama pada kode")}break;
  case"rephapus":await run(async()=>{const rp=S.reports.find(x=>x.id===id);const a=await sb.from("posts").update({deleted_at:new Date().toISOString()}).eq("id",rp.pid);if(a.error)throw a.error;const r=await sb.from("reports").update({status:"selesai"}).eq("id",id);if(r.error)throw r.error},["feed","admin"],"Konten dihapus");break;
  case"repabaikan":await run(async()=>{const r=await sb.from("reports").update({status:"selesai"}).eq("id",id);if(r.error)throw r.error},["admin"]);break;
  case"logout":try{if(chan)sb.removeChannel(chan)}catch(_){}await sb.auth.signOut();S.me=null;S.email=null;location.hash="#/login";render(false);break;
 }
});

/* ================= mulai ================= */
(async function boot(){
 document.documentElement.dataset.theme=S.theme;
 if(!sb){render(false);return}
 $("#app").innerHTML=`<main class="auth"><div class="auth-box card"><div class="logo"><span class="logo-mark">CJ</span>CJBook</div><p class="muted" role="status">Memuat...</p><div class="skel" style="margin-top:8px"></div></div></main>`;
 try{
  const r=await startSession();
  render(false);
  if(r==="nonaktif")$("#aerr")&&($("#aerr").textContent="Akun Anda dinonaktifkan. Hubungi HRD.");
 }catch(e){
  console.error(e);
  $("#app").innerHTML=`<main class="auth"><div class="auth-box card"><div class="logo"><span class="logo-mark">CJ</span>CJBook</div><p class="err" role="alert">Tidak bisa terhubung ke server. Periksa internet lalu coba lagi.</p><a class="btn primary block" href="./">Coba lagi</a></div></main>`;
 }
})();
