<!doctype html>
<html>
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin — Hotel Menu</title>
<style>
  body{font-family:Arial;margin:18px;background:#f4f6fb}
  h1{margin:0 0 12px}
  form{background:#fff;padding:12px;border-radius:8px;max-width:760px}
  label{display:block;margin:8px 0 4px}
  input,textarea,select{width:100%;padding:8px;border-radius:6px;border:1px solid #ddd}
  .row{display:flex;gap:10px}
  .row > * {flex:1}
  button{background:#2c3e50;color:#fff;border:none;padding:9px 12px;border-radius:8px;cursor:pointer}
  .list{margin-top:12px}
  .qr{display:flex;gap:8px;align-items:center}
</style>
</head>
<body>
<h1>Admin — Menu & QR</h1>
<h2>QR CODE Based Applicatioin</h2>
<form id="itemForm" onsubmit="return addItem(event)">
  <label>Item name</label>
  <input id="name" required>
  <label>Category</label>
  <input id="category" required>
  <label>Description</label>
  <textarea id="desc"></textarea>
  <div class="row">
    <div>
      <label>Price (number)</label>
      <input id="price" type="number" required>
    </div>
    <div>
      <label>Image URL</label>
      <input id="image">
    </div>
  </div>
  <div style="margin-top:8px"><button type="submit">Add menu item</button></div>
</form>

<div style="margin-top:12px;background:#fff;padding:10px;border-radius:8px;max-width:760px">
  <h3>Generate Table QR</h3>
  <div style="display:flex;gap:8px;align-items:center">
    <input id="tableNo" placeholder="Table number e.g. 12">
    <button onclick="generateQR()">Generate</button>
  </div>
  <div id="qResult" style="margin-top:10px"></div>
</div>

<script>
const API = '/api';

async function addItem(e){
  e.preventDefault();
  const payload = {
    name: document.getElementById('name').value,
    category: document.getElementById('category').value,
    description: document.getElementById('desc').value,
    price: Number(document.getElementById('price').value),
    image: document.getElementById('image').value || ''
  };
  const res = await fetch(API + '/menu', {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
  });
  if(res.ok){ alert('Item added'); location.reload(); } else { alert('Failed'); console.error(await res.text()) }
}

async function generateQR(){
  const t = document.getElementById('tableNo').value.trim();
  if(!t){ alert('Enter table number'); return; }
  const res = await fetch(API + '/generate-qr', {
    method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ table: t })
  });
  if(!res.ok) return alert('QR generation failed');
  const data = await res.json();
  document.getElementById('qResult').innerHTML = '<div class="qr"><img src="'+data.qrDataUrl+'" width="130"><div><div>Table: '+t+'</div><a href="'+data.url+'" target="_blank">Open URL</a></div></div>';
}
</script>
</body>
</html>
