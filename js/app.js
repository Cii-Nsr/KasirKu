document.addEventListener('DOMContentLoaded', () => {
  window.CartManager.loadFromLocalStorage();
  window.PaymentGateway.init();

  let currentFilter = 'all';
  renderProducts(currentFilter);
  
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.category;
      renderProducts(currentFilter);
    });
  });

  window.CartManager.setOnChange(() => {
    renderCart();
    updateTotal();
  });

  document.getElementById('checkoutBtn').addEventListener('click', async () => {
    const cartItems = window.CartManager.getItems();
    if (cartItems.length === 0) {
      alert('Keranjang kosong, tambahkan produk dulu');
      return;
    }
    const total = window.CartManager.getTotal();
    const result = await window.PaymentGateway.show(total);
    if (result && result.success) {
      window.CartManager.clearCart();
    }
  });

  function renderProducts(category) {
    const container = document.getElementById('productList');
    const allProducts = window.ProductsData;
    let filtered = category === 'all' ? allProducts : allProducts.filter(p => p.category === category);
    if (filtered.length === 0) {
      container.innerHTML = '<div class="empty-cart-msg" style="grid-column:1/-1">Produk tidak ditemukan</div>';
      return;
    }
    container.innerHTML = filtered.map(product => `
      <div class="product-card" data-id="${product.id}">
        <div class="product-icon">
          <img src="${product.imageUrl || 'https://via.placeholder.com/80?text=No+Image'}" 
               alt="${product.name}"
               onerror="this.src='https://via.placeholder.com/80?text=Error'">
        </div>
        <div class="product-name">${product.name}</div>
        <div class="product-category">${product.category === 'makanan' ? '🍚 Makanan' : '🥤 Minuman'}</div>
        <div class="product-price">${formatRupiah(product.price)}</div>
        <button class="btn-add" data-id="${product.id}">
          <i class="fas fa-cart-plus"></i> Tambah
        </button>
      </div>
    `).join('');
    
    document.querySelectorAll('.btn-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        const product = allProducts.find(p => p.id === id);
        if (product) window.CartManager.addItem(product);
      });
    });
  }

  function renderCart() {
    const container = document.getElementById('cartItemsContainer');
    const items = window.CartManager.getItems();
    if (items.length === 0) {
      container.innerHTML = '<div class="empty-cart-msg">Keranjang masih kosong</div>';
      return;
    }
    container.innerHTML = items.map(item => `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${formatRupiah(item.price)}</div>
        </div>
        <div class="cart-item-qty">
          <button class="qty-btn minus" data-id="${item.id}">-</button>
          <span>${item.quantity}</span>
          <button class="qty-btn plus" data-id="${item.id}">+</button>
        </div>
        <div class="item-total">${formatRupiah(item.price * item.quantity)}</div>
        <button class="remove-item" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button>
      </div>
    `).join('');
    
    document.querySelectorAll('.minus').forEach(btn => {
      btn.onclick = (e) => {
        const id = parseInt(btn.dataset.id);
        const item = items.find(i => i.id === id);
        if (item) window.CartManager.updateQuantity(id, item.quantity - 1);
      };
    });
    document.querySelectorAll('.plus').forEach(btn => {
      btn.onclick = (e) => {
        const id = parseInt(btn.dataset.id);
        const item = items.find(i => i.id === id);
        if (item) window.CartManager.updateQuantity(id, item.quantity + 1);
      };
    });
    document.querySelectorAll('.remove-item').forEach(btn => {
      btn.onclick = (e) => {
        const id = parseInt(btn.dataset.id);
        window.CartManager.removeItem(id);
      };
    });
  }

  function updateTotal() {
    const total = window.CartManager.getTotal();
    document.getElementById('cartTotalPrice').innerText = formatRupiah(total);
  }

  function formatRupiah(angka) {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(angka);
  }

  function updateDateTime() {
    const now = new Date();
    document.getElementById('dateTime').innerText = now.toLocaleDateString('id-ID') + ' ' + now.toLocaleTimeString('id-ID');
  }
  updateDateTime();
  setInterval(updateDateTime, 1000);
});