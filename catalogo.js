(function(){
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const okId=i=>/^fotos\/[0-9a-f]{16}\.(jpg|png|webp)$/.test(String(i||''));
const money=n=>'$'+(isFinite(+n)&&+n>=0?+n:0).toLocaleString('es-MX',{minimumFractionDigits:0,maximumFractionDigits:2});
let D={tienda:{nombre:'Catálogo',tel:''},productos:[]},cat='',sel=null,cur=null;

function ago(iso){const d=new Date(iso);if(isNaN(d))return '';const m=Math.round((Date.now()-d)/60000);
  if(m<2)return 'Actualizado hace un momento';if(m<60)return 'Actualizado hace '+m+' min';const h=Math.round(m/60);if(h<24)return 'Actualizado hace '+h+(h===1?' hora':' horas');
  return 'Actualizado el '+d.toLocaleDateString('es-MX',{day:'numeric',month:'long'})}
function pic(p,big){return `<div class="pic">${okId(p.foto)?`<img src="${esc(p.foto)}" alt="${esc(p.nombre)}" ${big?'':'loading="lazy"'} data-ini="${esc(p.nombre.slice(0,2))}">`:`<span class="ini">${esc(p.nombre.slice(0,2))}</span>`}
  ${p.e==='agotado'?'<span class="tag agotado">Agotado</span>':''}</div>`}
function card(p){return `<button class="card ${p.e==='agotado'?'out':''}" data-id="${esc(p.id)}">${pic(p)}<div class="body">
  ${p.marca?`<div class="brand">${esc(p.marca)}</div>`:''}<div class="name">${esc(p.nombre)}</div><div class="price">${money(p.precio)}</div>
  ${p.tallas.length?`<div class="sz">${p.tallas.map(t=>`<span class="s ${t.e}">${esc(t.t)}</span>`).join('')}</div>`:''}</div></button>`}
function render(){
  const q=norm($('#q').value.trim());
  const cats=[...new Set(D.productos.map(p=>p.categoria).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  $('#cats').innerHTML=cats.length>1?[''].concat(cats).map(c=>`<button class="cat" data-cat="${esc(c)}" aria-pressed="${c===cat}">${c?esc(c):'Todo'}</button>`).join(''):'';
  let L=D.productos.filter(p=>(!cat||p.categoria===cat)&&(!q||norm([p.nombre,p.marca,p.categoria,p.detalle].join(' ')).includes(q)));
  const disp=L.filter(p=>p.e!=='agotado'),out=L.filter(p=>p.e==='agotado');
  if(!D.productos.length){$('#list').innerHTML='<div class="empty">Estamos subiendo el inventario. Vuelve a abrir este enlace en un rato.</div>';return}
  if(!L.length){$('#list').innerHTML='<div class="empty">No encontramos productos con esa búsqueda.</div>';return}
  $('#list').innerHTML=(disp.length?`<div class="grid">${disp.map(card).join('')}</div>`:'')+(out.length?`<div class="sec">Agotados</div><div class="grid">${out.map(card).join('')}</div>`:'');
}
function waHref(p,t){const tel=String(D.tienda.tel||'').replace(/\D/g,'').slice(0,13);if(!tel)return '';const n=tel.length===10?'52'+tel:tel;
  const msg=`¡Qué onda! Me interesa ${p.nombre}${p.marca?' '+p.marca:''}${t?' talla '+t:''} (${money(p.precio)}). ¿Está disponible?`;
  return 'https://wa.me/'+n+'?text='+encodeURIComponent(msg)}
function openP(p){cur=p;sel=null;const avail=p.tallas.filter(t=>t.e!=='agotado');if(avail.length===1)sel=avail[0].t;drawSheet();$('#sheet').hidden=false;document.body.style.overflow='hidden'}
function drawSheet(){const p=cur;if(!p)return;const needT=p.tallas.length>0;const can=p.e!=='agotado'&&(!needT||sel);const href=waHref(p,sel);
  $('#sheet').innerHTML=`<div class="panel" role="dialog" aria-modal="true" aria-label="${esc(p.nombre)}"><div style="position:relative">${pic(p,true)}<button class="close" id="x" aria-label="Cerrar">×</button></div>
  <div class="pin">
    <div>${p.marca?`<div class="brand">${esc(p.marca)}${p.categoria?' · '+esc(p.categoria):''}</div>`:''}<div class="pname">${esc(p.nombre)}</div></div>
    ${p.detalle?`<div class="note" style="color:var(--ink)">${esc(p.detalle)}</div>`:''}
    <div class="price" style="font-size:30px">${money(p.precio)}</div>
    ${needT?`<div class="lbl">Talla</div><div class="opts">${p.tallas.map(t=>`<button class="opt" data-t="${esc(t.t)}" aria-pressed="${t.t===sel}" ${t.e==='agotado'?'disabled':''}>${esc(t.t)}</button>`).join('')}</div>
      ${p.e==='pocas'?'<div><span class="tag pocas" style="position:static;display:inline-block">Últimas piezas</span></div>':''}`:''}
    ${p.e==='agotado'?'<div class="note">Este producto está agotado. Escríbenos si quieres que te avisemos cuando vuelva.</div>':''}
    ${href?`<a class="wa" href="${esc(href)}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer" ${can||p.e==='agotado'?'':'aria-disabled="true"'}>${p.e==='agotado'?'Avísenme cuando llegue':needT&&!sel?'Elige tu talla':'Lo quiero · Pedir por WhatsApp'}</a>
      <div class="copy"><span>WhatsApp ${esc(String(D.tienda.tel||'').replace(/\D/g,''))}</span><button id="cp">Copiar número</button></div>`
      :'<div class="note">Escríbenos por WhatsApp al número donde te compartimos este catálogo.</div>'}
  </div></div>`;}
document.addEventListener('click',e=>{
  const c=e.target.closest('.card');if(c){const p=D.productos.find(x=>x.id===c.dataset.id);if(p)openP(p);return}
  const k=e.target.closest('.cat');if(k){cat=k.dataset.cat;render();return}
  const o=e.target.closest('.opt');if(o&&!o.disabled){sel=o.dataset.t;drawSheet();return}
  if(e.target.id==='cp'){const b=e.target;navigator.clipboard.writeText(D.tienda.tel).then(()=>{b.textContent='Copiado'},()=>{b.textContent='Selecciona el número'});return}
  if(e.target.id==='x'||e.target.id==='sheet'){closeS()}
});
function closeS(){$('#sheet').hidden=true;$('#sheet').innerHTML='';cur=null;document.body.style.overflow=''}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&cur)closeS()});
document.addEventListener('error',e=>{const t=e.target;if(t&&t.tagName==='IMG'&&t.dataset.ini!=null){const s=document.createElement('span');s.className='ini';s.textContent=t.dataset.ini;t.replaceWith(s)}},true);
$('#q').addEventListener('input',render);
fetch('catalogo.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw 0;return r.json()}).then(d=>{
  d=(d&&typeof d==='object')?d:{};const str=(v,m)=>String(v??'').slice(0,m);const E=e=>['ok','pocas','agotado'].includes(e)?e:'ok';
  D={tienda:{nombre:str(d.tienda&&d.tienda.nombre,60)||'Catálogo',tel:str(d.tienda&&d.tienda.tel,13).replace(/\D/g,'')},actualizado:d.actualizado,
    productos:(Array.isArray(d.productos)?d.productos:[]).slice(0,500).filter(p=>p&&typeof p==='object').map(p=>({id:str(p.id,64),nombre:str(p.nombre,120),marca:str(p.marca,60),categoria:str(p.categoria,40),detalle:str(p.detalle,200),precio:+p.precio||0,foto:okId(p.foto)?p.foto:'',
      tallas:(Array.isArray(p.tallas)?p.tallas:[]).slice(0,30).map(t=>({t:str(t&&t.t,12),e:E(t&&t.e)})).filter(t=>t.t),e:E(p.e)}))};
document.title=(D.tienda.nombre||'Gravity Supply')+' · Catálogo';
  $('#upd').textContent=ago(D.actualizado);const n=D.productos.filter(p=>p.e!=='agotado').length;$('#cnt').textContent=D.productos.length?n+' disponibles':'';render();
}).catch(()=>{$('#upd').textContent='';$('#list').innerHTML='<div class="empty">No se pudo cargar el catálogo. Revisa tu conexión y vuelve a abrir el enlace.</div>'});
// la foto de fondo arranca siempre justo debajo del buscador
(function(){const tb=document.querySelector('.tools');if(!tb)return;let raf=0;
  const set=()=>{raf=0;document.documentElement.style.setProperty('--py',Math.max(0,Math.round(tb.getBoundingClientRect().bottom))+'px')};
  const q=()=>{if(!raf)raf=requestAnimationFrame(set)};
  addEventListener('scroll',q,{passive:true});addEventListener('resize',q);set()})();
})();
