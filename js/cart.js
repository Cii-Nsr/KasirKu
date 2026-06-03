// Cart Manager - global object
window.CartManager = {
  items: [], // { id, name, price, quantity, category }

  // Tambah item (jika sudah ada, quantity +1)
  addItem(product) {
    const existing = this.items.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        quantity: 1
      });
    }
    this.saveToLocalStorage();
    this.triggerCartChange();
  },

  // Update quantity
  updateQuantity(productId, newQty) {
    if (newQty <= 0) {
      this.removeItem(productId);
      return;
    }
    const item = this.items.find(i => i.id === productId);
    if (item) {
      item.quantity = newQty;
      this.saveToLocalStorage();
      this.triggerCartChange();
    }
  },

  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.saveToLocalStorage();
    this.triggerCartChange();
  },

  clearCart() {
    this.items = [];
    this.saveToLocalStorage();
    this.triggerCartChange();
  },

  getTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  getItems() {
    return [...this.items];
  },

  saveToLocalStorage() {
    localStorage.setItem('kasir_cart', JSON.stringify(this.items));
  },

  loadFromLocalStorage() {
    const saved = localStorage.getItem('kasir_cart');
    if (saved) {
      this.items = JSON.parse(saved);
    }
    this.triggerCartChange();
  },

  // Event handler untuk update UI
  onChangeCallback: null,
  triggerCartChange() {
    if (this.onChangeCallback) this.onChangeCallback();
  },
  setOnChange(callback) {
    this.onChangeCallback = callback;
  }
};