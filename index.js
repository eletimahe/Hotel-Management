<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Hotel Menu — Customer</title>
<style>
  :root{--primary:#2c3e50;--accent:#e67e22;--muted:#777}
  body{font-family:Inter,system-ui,Arial;margin:0;background:#f6f7fb;color:#111}
  header{background:var(--primary);color:#fff;padding:14px 18px;font-weight:700}
  .top{display:flex;gap:12px;align-items:center;padding:12px;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.04)}
  .search{flex:1}
  input[type="search"]{width:100%;padding:10px;border-radius:8px;border:1px solid #ddd}
  .layout{display:grid;grid-template-columns:1fr 320px;gap:20px;padding:18px}
  @media(max-width:880px){.layout{grid-template-columns:1fr}.cart-side{order:2}}
  .menu-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:18px}
  .card{background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 6px 20px rgba(35,35,35,.04)}
  .card img{width:100%;height:160px;object-fit:cover}
  .card .body{padding:12px}
  .title{font-weight:700;margin:0 0 6px}
  .desc{color:var(--muted);font-size:13px;margin:0 0 10px}
  .footer{display:flex;justify-content:space-between;align-items:center}
  .price{color:#27ae60;font-weight:700}
  button.btn{background:var(--accent);border:none;color:#fff;padding:8px 12px;border-radius:8px;cursor:pointer}
  .cart-side{background:#fff;padding:16px;border-radius:12px;box-shadow:0 6px 20px rgba(35,35,35,.04);height:fit-content;position:sticky;top:18px}
  .cart-list{max-height:420px;overflow:auto}
  .cart-item{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #eee}
  .cart-actions{display:flex;gap:8px;align-items:center}
  .qty-btn{padding:6px 10px;border-radius:6px;border:1px solid #ddd;background:#fafafa;cursor:pointer}
  .checkout{margin-top:12px;display:flex;flex-direction:column;gap:8px}
  .info{padding:10px;background:#eef9f5;border-radius:8px;color:#09593a}
  .table-banner{padding:10px;background:#fff;text-align:center;border-bottom:1px solid #eee}
</style>
</head>
<body>

<header>Hotel Menu — Order from Table</header>

<div class="table-banner" id="tableBanner">Table: —</div>

<div class="top">
  <div style="width:220px">
    <select id="categoryFilter" onchange="applyFilters()">
      <option value="">All categories</option>
    </select>
  </div>
  <div class="search"><input id="q" type="search" placeholder="Search menu..." oninput="applyFilters()"></div>
  <div style="width:140px"><button onclick="openCart()" class="btn">Open Cart</button></div>
</div>

<div class="layout">
  <main>
    <section style="padding:18px 0">
      <div id="menuGrid" class="menu-grid">Loading menu...</div>
    </section>
  </main>

  <aside class="cart-side">
    <h3>Cart</h3>
    <div id="cartEmptyMsg">Your cart is empty</div>
    <div class="cart-list" id="cartList" style="display:none"></div>

    <div class="checkout">
      <div>Subtotal: <span id="subtotal">₹0</span></div>
      <div class="info" id="tableInfo">Not identified. Scan table QR or visit the QR URL.</div>
      <button id="btnCheckout" class="btn" onclick="checkout()" disabled>Place Order</button>
    </div>

    <hr style="margin:12px 0">
    <div style="font-size:13px;color:var(--muted)">Tip: QR URL should be like <code>?table=12</code>. Admin can generate QR codes.</div>
  </aside>
</div>

<script>
/* ---------- Config ---------- */
const API_BASE = '/api'; // backend server route prefix
let MENU = [];
let CART = {};
let TABLE_NO = null;

/* ---------- Utilities ---------- */
function money(n){ return '₹' + Number(n).toFixed(0) }

/* ---------- Init: read table from URL ---------- */
function readTableFromURL(){
  const params = new URLSearchParams(window.location.search);
  const t = params.get('table');
  if(t){ TABLE_NO = t; document.getElementById('tableBanner').innerText = 'Table: ' + t; document.getElementById('tableInfo').innerText = 'Ordering for table ' + t; }
  else { document.getElementById('tableBanner').innerText = 'Table: Not identified'; }
}
readTableFromURL();

/* ---------- Fetch Menu ---------- */
async function loadMenu(){
  try{
    const res = await fetch(API_BASE + '/menu');
    if(!res.ok) throw new Error('Menu failed');
    MENU = await res.json();
  }catch(e){
    console.error(e);
    MENU = [];
  }
  renderCategories();
  renderMenu(MENU);
}
loadMenu();

/* ---------- Render categories ---------- */
function renderCategories(){
  const cats = Array.from(new Set(MENU.map(i=>i.category||'Uncategorized')));
  const sel = document.getElementById('categoryFilter');
  sel.innerHTML = '<option value="">All categories</option>';
  cats.forEach(c => {
    const o = document.createElement('option');
    o.value = c; o.textContent = c; sel.appendChild(o);
  });
}

/* ---------- Render Menu ---------- */
function renderMenu(list){
  const grid = document.getElementById('menuGrid');
  if(!list.length){ grid.innerHTML = '<div style="padding:24px;background:#fff;border-radius:8px">No items available</div>'; return; }
  grid.innerHTML = '';
  list.forEach(item => {
    const el = document.createElement('div'); el.className = 'card';
    el.innerHTML = `
      <img src="${item.image||'https://via.placeholder.com/600x400?text=No+Image'}" alt="">
      <div class="body">
        <div class="title">${item.name} <span style="font-weight:500;color:#888;font-size:13px">(${item.category||''})</span></div>
        <div class="desc">${item.description||''}</div>
        <div class="footer">
          <div class="price">${money(item.price)}</div>
          <div>
            <button class="btn" onclick='addToCart(${item.id})'>Add</button>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(el);
  });
}

/* ---------- Filtering ---------- */
function applyFilters(){
  const q = document.getElementById('q').value.toLowerCase().trim();
  const cat = document.getElementById('categoryFilter').value;
  const filtered = MENU.filter(i=>{
    const inCat = !cat || (i.category||'').toLowerCase() === cat.toLowerCase();
    const inQ = !q || (i.name + ' ' + (i.description||'') + ' ' + (i.category||'')).toLowerCase().includes(q);
    return inCat && inQ;
  });
  renderMenu(filtered);
}

/* ---------- Cart operations ---------- */
function addToCart(id){
  const item = MENU.find(x=>x.id===id); if(!item) return;
  if(!CART[id]) CART[id] = {...item, qty:0};
  CART[id].qty += 1;
  refreshCartUI();
}

function removeFromCart(id){
  delete CART[id];
  refreshCartUI();
}

function changeQty(id, delta){
  if(!CART[id]) return;
  CART[id].qty += delta;
  if(CART[id].qty <= 0) removeFromCart(id);
  refreshCartUI();
}

function refreshCartUI(){
  const listEl = document.getElementById('cartList');
  const empty = document.getElementById('cartEmptyMsg');
  const subtotalEl = document.getElementById('subtotal');
  const checkoutBtn = document.getElementById('btnCheckout');

  const items = Object.values(CART);
  if(items.length === 0){ empty.style.display='block'; listEl.style.display='none'; checkoutBtn.disabled=true; subtotalEl.textContent = money(0); return; }
  empty.style.display='none'; listEl.style.display='block';
  listEl.innerHTML = '';
  let subtotal = 0;
  items.forEach(it=>{
    subtotal += it.price * it.qty;
    const row = document.createElement('div'); row.className='cart-item';
    row.innerHTML = `
      <div>
        <div style="font-weight:700">${it.name}</div>
        <div style="font-size:13px;color:#666">${money(it.price)} x ${it.qty}</div>
      </div>
      <div class="cart-actions">
        <button class="qty-btn" onclick="changeQty(${it.id}, -1)">−</button>
        <div style="min-width:28px;text-align:center">${it.qty}</div>
        <button class="qty-btn" onclick="changeQty(${it.id}, 1)">+</button>
        <button class="qty-btn" onclick="removeFromCart(${it.id})">✕</button>
      </div>
    `;
    listEl.appendChild(row);
  });
  subtotalEl.textContent = money(subtotal);
  checkoutBtn.disabled = false;
}

/* ---------- Checkout flow ---------- */
async function checkout(){
  if(Object.keys(CART).length === 0){ alert('Cart is empty'); return; }
  if(!TABLE_NO){
    const t = prompt('Enter your table number (or cancel):');
    if(!t) return;
    TABLE_NO = t; document.getElementById('tableBanner').innerText = 'Table: ' + t; document.getElementById('tableInfo').innerText = 'Ordering for table ' + t;
  }

  const order = {
    table: TABLE_NO,
    items: Object.values(CART).map(i => ({ id: i.id, qty: i.qty, name: i.name, price: i.price })),
    note: ''
  };

  try{
    const res = await fetch(API_BASE + '/order', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(order)
    });
    if(!res.ok) throw new Error('order failed');
    const data = await res.json();
    alert('Order placed! Order #: ' + data.orderId);
    CART = {}; refreshCartUI();
  }catch(err){
    alert('Failed to place order. Try again.');
    console.error(err);
  }
}

/* ---------- Open cart focus helper ---------- */
function openCart(){ window.scrollTo({ top: 0, behavior: 'smooth' }); }

/* ---------- Expose for console debugging ---------- */
window._debug = { MENU, CART };

/* ---------- Optional: poll cart from server to show real-time (not used here) ---------- */

</script>
</body>
</html>
