window.PaymentGateway = {
  modal: null,
  currentTotal: 0,
  resolvePayment: null,

  init() {
    this.modal = document.getElementById('paymentModal');
    document.getElementById('cancelPaymentBtn').onclick = () => this.closeModal();
    document.querySelector('.close-modal').onclick = () => this.closeModal();
    document.getElementById('processPaymentBtn').onclick = () => this.processPayment();
    
    const radios = document.querySelectorAll('input[name="paymentMethod"]');
    radios.forEach(radio => {
      radio.addEventListener('change', (e) => this.togglePaymentDetails(e.target.value));
    });
    this.togglePaymentDetails('cash');
  },

  togglePaymentDetails(method) {
    document.getElementById('cardDetails').classList.add('hidden');
    document.getElementById('transferDetails').classList.add('hidden');
    document.getElementById('cashDetails').classList.add('hidden');
    document.getElementById('digitalDetails').classList.add('hidden');
    
    if (method === 'card') {
      document.getElementById('cardDetails').classList.remove('hidden');
    } else if (method === 'transfer') {
      document.getElementById('transferDetails').classList.remove('hidden');
    } else if (method === 'cash') {
      document.getElementById('cashDetails').classList.remove('hidden');
    } else {
      // Metode digital: qris, dana, ovo, shopeepay, gopay
      document.getElementById('digitalDetails').classList.remove('hidden');
      this.generateQRCode(method);
    }
  },

  generateQRCode(method) {
    const qrContainer = document.getElementById('qrCodeContainer');
    if (!qrContainer) return;
    
    // Bersihkan QR code lama
    qrContainer.innerHTML = '';
    
    let text = '';
    let instruction = '';
    const total = this.currentTotal;
    
    switch(method) {
      case 'qris':
        text = `QRIS|Toko Demo|Total: Rp ${total.toLocaleString('id-ID')}`;
        instruction = `Scan QR Code QRIS - Total: Rp ${total.toLocaleString('id-ID')}`;
        break;
      case 'dana':
        text = `DANA|085123456789|${total}|Toko Demo`;
        instruction = `Scan QR Code Dana - Total: Rp ${total.toLocaleString('id-ID')}`;
        break;
      case 'ovo':
        text = `OVO|081234567890|${total}|Toko Demo`;
        instruction = `Scan QR Code OVO - Total: Rp ${total.toLocaleString('id-ID')}`;
        break;
      case 'shopeepay':
        text = `ShopeePay|TokoDemo|${total}`;
        instruction = `Scan QR Code ShopeePay - Total: Rp ${total.toLocaleString('id-ID')}`;
        break;
      case 'gopay':
        text = `GOPAY|tokodemo@email|${total}`;
        instruction = `Scan QR Code GoPay - Total: Rp ${total.toLocaleString('id-ID')}`;
        break;
      default:
        text = `Pembayaran digital: Rp ${total.toLocaleString('id-ID')}`;
        instruction = `Total: Rp ${total.toLocaleString('id-ID')}`;
    }
    
    // Generate QR Code menggunakan library qrcodejs
    new QRCode(qrContainer, {
      text: text,
      width: 150,
      height: 150,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
    
    document.getElementById('digitalInstruction').innerText = instruction;
  },

  show(totalAmount) {
    this.currentTotal = totalAmount;
    document.getElementById('paymentTotalAmount').innerText = this.formatRupiah(totalAmount);
    document.getElementById('cardNumber').value = '';
    document.getElementById('cardExpiry').value = '';
    document.getElementById('cardCvv').value = '';
    document.getElementById('cashAmount').value = '';
    document.getElementById('changeAmount').innerText = '';
    
    const cashRadio = document.querySelector('input[value="cash"]');
    if(cashRadio) cashRadio.checked = true;
    this.togglePaymentDetails('cash');
    
    // Event listener tombol konfirmasi digital (dipasang ulang)
    const confirmBtn = document.getElementById('confirmDigitalPayment');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    newConfirmBtn.addEventListener('click', () => this.processDigitalPayment());
    
    this.modal.style.display = 'flex';
    return new Promise((resolve) => {
      this.resolvePayment = resolve;
    });
  },

  closeModal() {
    this.modal.style.display = 'none';
    if (this.resolvePayment) this.resolvePayment({ success: false });
  },

  processDigitalPayment() {
    const method = document.querySelector('input[name="paymentMethod"]:checked').value;
    setTimeout(() => {
      const receipt = {
        transactionId: 'TRX' + Date.now(),
        date: new Date().toLocaleString(),
        items: window.CartManager.getItems(),
        total: this.currentTotal,
        method: this.getMethodName(method),
        cashPaid: null
      };
      this.modal.style.display = 'none';
      if (this.resolvePayment) this.resolvePayment({ success: true, receipt });
      this.showReceipt(receipt);
    }, 500);
  },

  processPayment() {
    const method = document.querySelector('input[name="paymentMethod"]:checked').value;
    const digitalMethods = ['qris', 'dana', 'ovo', 'shopeepay', 'gopay'];
    if (digitalMethods.includes(method)) {
      this.processDigitalPayment();
      return;
    }
    
    let isValid = true;
    let errorMsg = '';
    
    if (method === 'card') {
      const cardNum = document.getElementById('cardNumber').value.replace(/\s/g, '');
      const expiry = document.getElementById('cardExpiry').value;
      const cvv = document.getElementById('cardCvv').value;
      if (!/^\d{16}$/.test(cardNum)) isValid = false, errorMsg = 'Nomor kartu harus 16 digit';
      else if (!/^\d{2}\/\d{2}$/.test(expiry)) isValid = false, errorMsg = 'Format Expiry MM/YY';
      else if (!/^\d{3}$/.test(cvv)) isValid = false, errorMsg = 'CVV 3 digit';
    } else if (method === 'cash') {
      const cashAmount = parseFloat(document.getElementById('cashAmount').value);
      if (isNaN(cashAmount) || cashAmount < this.currentTotal) {
        isValid = false;
        errorMsg = 'Uang tunai kurang dari total belanja';
      } else {
        const change = cashAmount - this.currentTotal;
        document.getElementById('changeAmount').innerHTML = `Kembalian: ${this.formatRupiah(change)}`;
      }
    } else if (method === 'transfer') {
      if (!confirm("Pastikan Anda sudah transfer ke rekening BCA 1234567890. Lanjutkan?")) {
        isValid = false;
      }
    }
    
    if (!isValid) {
      alert(errorMsg || "Pembayaran gagal, cek kembali data Anda");
      return;
    }
    
    setTimeout(() => {
      const receipt = {
        transactionId: 'TRX' + Date.now(),
        date: new Date().toLocaleString(),
        items: window.CartManager.getItems(),
        total: this.currentTotal,
        method: method === 'cash' ? 'Tunai' : (method === 'card' ? 'Kartu Kredit' : 'Transfer Bank'),
        cashPaid: method === 'cash' ? parseFloat(document.getElementById('cashAmount').value) : null
      };
      this.modal.style.display = 'none';
      if (this.resolvePayment) this.resolvePayment({ success: true, receipt });
      this.showReceipt(receipt);
    }, 300);
  },

  getMethodName(method) {
    const names = {
      cash: 'Tunai',
      card: 'Kartu Kredit',
      transfer: 'Transfer Bank',
      qris: 'QRIS',
      dana: 'Dana',
      ovo: 'OVO',
      shopeepay: 'ShopeePay',
      gopay: 'GoPay'
    };
    return names[method] || 'Digital Wallet';
  },

  showReceipt(receipt) {
    const receiptModal = document.getElementById('receiptModal');
    const receiptBody = document.getElementById('receiptBody');
    let itemsHtml = '';
    receipt.items.forEach(item => {
      itemsHtml += `<div class="receipt-line">
        <span>${item.name} x${item.quantity}</span>
        <span>${this.formatRupiah(item.price * item.quantity)}</span>
      </div>`;
    });
    let cashHtml = '';
    if (receipt.method === 'Tunai' && receipt.cashPaid) {
      cashHtml = `<div class="receipt-line"><span>Tunai</span><span>${this.formatRupiah(receipt.cashPaid)}</span></div>
                  <div class="receipt-line"><span>Kembalian</span><span>${this.formatRupiah(receipt.cashPaid - receipt.total)}</span></div>`;
    }
    receiptBody.innerHTML = `
      <div class="receipt-line"><strong>KasirKu</strong></div>
      <div class="receipt-line">${receipt.date}</div>
      <div class="receipt-line">ID: ${receipt.transactionId}</div>
      <hr>
      ${itemsHtml}
      <hr>
      <div class="receipt-line"><strong>Total</strong><strong>${this.formatRupiah(receipt.total)}</strong></div>
      ${cashHtml}
      <div class="receipt-line">Metode: ${receipt.method}</div>
      <hr>
      <div style="text-align:center;">Terima kasih! 🛒</div>
    `;
    receiptModal.style.display = 'flex';
    const closeReceipt = () => {
      receiptModal.style.display = 'none';
    };
    document.getElementById('closeReceiptBtn').onclick = closeReceipt;
    document.querySelector('.close-receipt').onclick = closeReceipt;
  },

  formatRupiah(angka) {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(angka);
  }
};