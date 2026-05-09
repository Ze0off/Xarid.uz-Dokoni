// ═══════════════════════════════════════════
//  XARID.UZ — script.js
// ═══════════════════════════════════════════

// ── Mahsulotlar ──────────────────────────
let products = [
  { id:1, name:'Redmi Note 12',     price:3500000,  image:'images/Redni-Note12.jpeg', desc:'Kundalik foydalanish uchun qulay smartfon. Katta ekran, yaxshi kamera.' },
  { id:2, name:'ASUS Vivobook',     price:6500000,  image:'images/Asus-Vivobook.png', desc:"O'qish va ish uchun mos noutbuk. Yengil, tezkor, zamonaviy dizayn." },
  { id:3, name:'Quloqchin',         price:350000,   image:'images/Quloqchin.jpg',     desc:"Musiqa tinglash va qo'ng'iroqlar uchun qulay. Ovozi tiniq." },
  { id:4, name:'iPhone 17 Pro Max', price:22500000, image:'images/Ayfon17.jpg',       desc:'Yuqori sifatli kamera, kuchli ishlash tezligi, chiroyli dizayn.' },
];

let cart      = JSON.parse(localStorage.getItem('xCart')) || [];
let smsCode   = '';
let curMethod = 'payme';
let nextId    = 5;

// ── Pul formati ──────────────────────────
function money(n) {
  return Number(n).toLocaleString('uz-UZ') + " so'm";
}

// ════════════════════════════════════════
//  PANELLAR
// ════════════════════════════════════════
function openPanel(name) {
  // Hammani yopamiz
  ['info','admin','cart'].forEach(n => {
    document.getElementById('panel-' + n).style.display = 'none';
  });

  document.getElementById('panel-' + name).style.display = 'flex';
  document.getElementById('overlay').classList.add('show');

  if (name === 'admin') renderAdminList();
  if (name === 'cart')  renderCart();
}

function closePanel() {
  ['info','admin','cart'].forEach(n => {
    document.getElementById('panel-' + n).style.display = 'none';
  });
  document.getElementById('overlay').classList.remove('show');
}

// ════════════════════════════════════════
//  MAHSULOTLAR
// ════════════════════════════════════════
function renderProducts() {
  document.getElementById('products-grid').innerHTML = products.map(p => `
    <div class="product-card">
      <img src="${p.image}" alt="${p.name}"
           onerror="this.src='https://via.placeholder.com/200x180?text=Rasm'">
      <div class="pc-info">
        <h3>${p.name}</h3>
        <p class="price">${money(p.price)}</p>
        <p class="desc">${p.desc || ''}</p>
        <button class="add-btn" onclick="addToCart(${p.id})">+ Savatga qo'shish</button>
      </div>
    </div>
  `).join('');
}

// ════════════════════════════════════════
//  SAVATCHA
// ════════════════════════════════════════
function saveCart() {
  localStorage.setItem('xCart', JSON.stringify(cart));
  const total = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cart-count').textContent = total;
}

function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const found = cart.find(x => x.id === id);
  if (found) found.qty++;
  else cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 });
  saveCart();
  showToast('✅ ' + p.name + " savatga qo'shildi!");
  if (document.getElementById('panel-cart').style.display === 'flex') renderCart();
}

function changeQty(id, d) {
  const item = cart.find(x => x.id === id);
  if (!item) return;
  item.qty += d;
  if (item.qty <= 0) cart = cart.filter(x => x.id !== id);
  saveCart();
  renderCart();
}

function removeItem(id) {
  cart = cart.filter(x => x.id !== id);
  saveCart();
  renderCart();
}

function renderCart() {
  const el = document.getElementById('cart-list');
  if (cart.length === 0) {
    el.innerHTML = "<p class='empty-msg'>Savatcha bo'sh. Mahsulot qo'shing!</p>";
    document.getElementById('cart-total').textContent = "0 so'm";
    return;
  }
  el.innerHTML = cart.map(i => `
    <div class="cart-item">
      <div class="ci-info">
        <b>${i.name}</b>
        <span>${money(i.price)} × ${i.qty} = ${money(i.price * i.qty)}</span>
      </div>
      <div class="qty-ctrl">
        <button class="q-btn" onclick="changeQty(${i.id},-1)">−</button>
        <span class="q-num">${i.qty}</span>
        <button class="q-btn" onclick="changeQty(${i.id},+1)">+</button>
      </div>
      <button class="rm-btn" onclick="removeItem(${i.id})">🗑</button>
    </div>
  `).join('');
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById('cart-total').textContent = money(total);
}

// ════════════════════════════════════════
//  TO'LOV MODAL
// ════════════════════════════════════════
function openPayModal() {
  if (cart.length === 0) { showToast("⚠️ Savatcha bo'sh!"); return; }
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById('pay-sum').textContent = money(total);

  // Reset
  selectMethod('payme');
  document.getElementById('phone-num').value = '';
  document.getElementById('sms-code').value  = '';
  document.getElementById('sms-hint').textContent = '';
  document.getElementById('card-num').value  = '';
  document.getElementById('card-exp').value  = '';
  document.getElementById('card-cvv').value  = '';
  smsCode = '';

  closePanel();
  document.getElementById('modal-pay').style.display = 'flex';
}

function closePayModal() {
  document.getElementById('modal-pay').style.display = 'none';
}

function selectMethod(m) {
  curMethod = m;
  ['payme','click','card'].forEach(x => {
    document.getElementById('m-' + x).classList.remove('active');
  });
  document.getElementById('m-' + m).classList.add('active');
  document.getElementById('card-section').style.display = (m === 'card') ? 'block' : 'none';

  // Kod va telefon tozalash
  document.getElementById('sms-code').value = '';
  document.getElementById('sms-hint').textContent = '';
  smsCode = '';
}

// Karta formatlash
function fmtCard(inp) {
  let v = inp.value.replace(/\D/g,'').slice(0,16);
  inp.value = v.replace(/(\d{4})(?=\d)/g,'$1 ');
}
function fmtExp(inp) {
  let v = inp.value.replace(/\D/g,'').slice(0,4);
  if (v.length >= 3) v = v.slice(0,2) + '/' + v.slice(2);
  inp.value = v;
}
function fmtPhone(inp) {
  let v = inp.value.replace(/\D/g,'').slice(0,9);
  inp.value = v;
}

// SMS yuborish simulyatsiyasi
function sendSMS() {
  // Karta tekshiruvi
  if (curMethod === 'card') {
    const num = document.getElementById('card-num').value.replace(/\s/g,'');
    if (num.length < 16) { showToast('⚠️ Karta raqamini to\'liq kiriting!'); return; }
    const exp = document.getElementById('card-exp').value;
    if (exp.length < 5)  { showToast('⚠️ Muddatni kiriting!'); return; }
    const cvv = document.getElementById('card-cvv').value;
    if (cvv.length < 3)  { showToast('⚠️ CVV kodni kiriting!'); return; }
  }

  // Telefon tekshiruvi
  const phone = document.getElementById('phone-num').value.replace(/\D/g,'');
  if (phone.length < 9) { showToast('⚠️ Telefon raqamni to\'liq kiriting!'); return; }

  // 6 xonali kod generatsiya
  smsCode = String(Math.floor(100000 + Math.random() * 900000));

  const hint = document.getElementById('sms-hint');
  hint.style.color = '#28a745';
  hint.textContent = '📱 +998' + phone + ' raqamiga 333 dan SMS yuborildi. Kod: ' + smsCode + ' (simulyatsiya)';

  showToast('📱 SMS kod yuborildi!');
}

// To'lovni tasdiqlash
function confirmPay() {
  // Karta tekshiruvi
  if (curMethod === 'card') {
    const num = document.getElementById('card-num').value.replace(/\s/g,'');
    if (num.length < 16) { showToast('⚠️ Karta raqamini kiriting!'); return; }
    if (document.getElementById('card-exp').value.length < 5) { showToast('⚠️ Muddatni kiriting!'); return; }
    if (document.getElementById('card-cvv').value.length < 3) { showToast('⚠️ CVV kiriting!'); return; }
  }

  // Telefon
  const phone = document.getElementById('phone-num').value.replace(/\D/g,'');
  if (phone.length < 9) { showToast('⚠️ Telefon raqamni kiriting!'); return; }

  // SMS kod
  if (!smsCode) { showToast("⚠️ Avval 'Kod olish' tugmasini bosing!"); return; }
  const entered = document.getElementById('sms-code').value.trim();
  if (entered !== smsCode) {
    const hint = document.getElementById('sms-hint');
    hint.style.color = '#dc3545';
    hint.textContent = '❌ Kod noto\'g\'ri! Qayta urinib ko\'ring.';
    showToast('❌ Noto\'g\'ri kod!');
    return;
  }

  // ✅ Muvaffaqiyatli
  const total    = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const itemsCnt = cart.reduce((s, i) => s + i.qty, 0);
  const names    = { payme:'Payme', click:'Click', card:'Karta' };

  closePayModal();

  document.getElementById('success-info').innerHTML =
    `To'lov usuli: <b>${names[curMethod]}</b><br>
     Telefon: <b>+998${phone}</b><br>
     Mahsulotlar: <b>${itemsCnt} ta</b><br>
     To'langan summa: <b>${money(total)}</b>`;

  document.getElementById('modal-success').style.display = 'flex';

  cart = [];
  saveCart();
}

function closeSuccess() {
  document.getElementById('modal-success').style.display = 'none';
}

// ════════════════════════════════════════
//  ADMIN PANEL
// ════════════════════════════════════════
function adminAdd() {
  const name  = document.getElementById('a-name').value.trim();
  const price = Number(document.getElementById('a-price').value);
  const image = document.getElementById('a-image').value.trim() || 'https://via.placeholder.com/200x180?text=Mahsulot';
  const desc  = document.getElementById('a-desc').value.trim();
  const msg   = document.getElementById('admin-msg');

  if (!name)         { msg.style.color='#dc3545'; msg.textContent='⚠️ Nom kiriting!'; return; }
  if (!price || price<=0) { msg.style.color='#dc3545'; msg.textContent='⚠️ Narx kiriting!'; return; }

  products.push({ id: nextId++, name, price, image, desc });
  renderProducts();
  renderAdminList();

  document.getElementById('a-name').value  = '';
  document.getElementById('a-price').value = '';
  document.getElementById('a-image').value = '';
  document.getElementById('a-desc').value  = '';

  msg.style.color = '#28a745';
  msg.textContent = '✅ ' + name + " qo'shildi!";
  setTimeout(() => msg.textContent = '', 3000);
}

function adminDelete(id) {
  products = products.filter(p => p.id !== id);
  cart     = cart.filter(i => i.id !== id);
  saveCart();
  renderProducts();
  renderAdminList();
}

function renderAdminList() {
  document.getElementById('prod-count').textContent = products.length;
  document.getElementById('admin-list').innerHTML = products.map(p => `
    <div class="admin-item">
      <img src="${p.image}" onerror="this.src='https://via.placeholder.com/44?text=?'">
      <div class="admin-item-info">
        <b>${p.name}</b>
        <span>${money(p.price)}</span>
      </div>
      <button class="del-btn" onclick="adminDelete(${p.id})">🗑 O'chir</button>
    </div>
  `).join('');
}

// ════════════════════════════════════════
//  TOAST
// ════════════════════════════════════════
let toastT;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(toastT);
  toastT = setTimeout(() => t.style.display = 'none', 2500);
}

// ── Ishga tushirish ──────────────────────
renderProducts();
saveCart();
