let orders = [];
let packageItems = [];

// ===== DATA MANAGEMENT =====

function loadOrders() {
  const saved = localStorage.getItem("ordersData");
  orders = saved ? JSON.parse(saved) : [];
}

function saveOrders() {
  localStorage.setItem("ordersData", JSON.stringify(orders));
}

function getInventory() {
  const saved = localStorage.getItem("inventoryData");
  return saved ? JSON.parse(saved) : [];
}

function saveInventory(inventory) {
  localStorage.setItem("inventoryData", JSON.stringify(inventory));
}

// ===== TRACKING =====

function generateTrackingId() {
  const now = new Date();
  const date = now.getFullYear().toString().slice(2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const seq = String(orders.length + 1).padStart(4, "0");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `IPK-${date}${seq}-${rand}`;
}

const CARRIER_URLS = {
  ups: (num) => `https://www.ups.com/track?tracknum=${encodeURIComponent(num)}`,
  fedex: (num) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(num)}`,
  dhl: (num) => `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(num)}`,
  usps: (num) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(num)}`,
  other: (num) => null,
};

function getCarrierUrl(carrier, trackingNum) {
  if (!trackingNum || !CARRIER_URLS[carrier]) return null;
  return CARRIER_URLS[carrier](trackingNum);
}

function getCarrierName(carrier) {
  const names = { ups: "UPS", fedex: "FedEx", dhl: "DHL", usps: "USPS", other: "Other" };
  return names[carrier] || carrier;
}

// ===== RENDERING =====

function renderStats() {
  const total = orders.length;
  const revenue = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.total, 0);
  const pending = orders.filter(
    (o) => o.orderStatus === "pending" || o.orderStatus === "processing",
  ).length;
  const shipped = orders.filter(
    (o) =>
      o.orderStatus === "shipped" ||
      o.orderStatus === "in_transit" ||
      o.orderStatus === "delivered",
  ).length;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-revenue").textContent = formatCurrency(revenue);
  document.getElementById("stat-pending").textContent = pending;
  document.getElementById("stat-shipped").textContent = shipped;
}

function renderOrders(filtered) {
  const tbody = document.getElementById("orders-table");
  tbody.innerHTML = "";

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-16 text-slate-500 font-display text-lg">No orders found. Create your first package!</td></tr>`;
    return;
  }

  filtered.forEach((order, index) => {
    const statusBadge = getStatusBadge(order.orderStatus);
    const paymentBadge = getPaymentBadge(order.paymentStatus);
    const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

    const row = document.createElement("tr");
    row.className = "group transition-colors cursor-pointer";
    row.style.animationDelay = `${index * 30}ms`;
    row.onclick = () => showDetailModal(order.id);
    row.innerHTML = `
      <td class="px-4 md:px-6 py-4 md:py-5 font-mono text-primary-light font-semibold text-xs">${order.trackingId}</td>
      <td class="px-4 md:px-6 py-4 md:py-5">
        <p class="font-semibold text-white">${order.client.name}</p>
        <p class="text-xs text-slate-500">${order.client.email}</p>
      </td>
      <td class="px-4 md:px-6 py-4 md:py-5 text-center">
        <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white font-bold text-xs">${itemCount}</span>
      </td>
      <td class="px-4 md:px-6 py-4 md:py-5 text-right font-mono font-bold text-emerald-400">${formatCurrency(order.total)}</td>
      <td class="px-4 md:px-6 py-4 md:py-5 text-center">${paymentBadge}</td>
      <td class="px-4 md:px-6 py-4 md:py-5 text-center">${statusBadge}</td>
      <td class="px-4 md:px-6 py-4 md:py-5 text-slate-400 text-xs">${formatDate(order.createdAt)}</td>
      <td class="px-4 md:px-6 py-4 md:py-5">
        <div class="flex items-center justify-end gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
          <button onclick="event.stopPropagation(); showDetailModal(${order.id})"
              class="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 flex items-center justify-center transition-colors text-xs">
              <i class="fa-solid fa-eye"></i></button>
          <button onclick="event.stopPropagation(); deleteOrder(${order.id})"
              class="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors text-xs">
              <i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function getStatusBadge(status) {
  const map = {
    pending: { label: "Pending",    color: "amber",   dot: "" },
    processing: { label: "Processing", color: "blue",    dot: "animate-pulse" },
    shipped: { label: "Shipped",    color: "indigo",  dot: "" },
    in_transit: { label: "In Transit", color: "purple",  dot: "animate-pulse" },
    delivered: { label: "Delivered",  color: "emerald", dot: "" },
    cancelled: { label: "Cancelled",  color: "red",     dot: "" },
  };
  const s = map[status] || map.pending;
  return `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-${s.color}-500/10 border border-${s.color}-500/20 text-${s.color}-400 text-[10px] font-bold rounded-full"><div class="w-1.5 h-1.5 rounded-full bg-${s.color}-400 ${s.dot}"></div>${s.label}</span>`;
}

function getPaymentBadge(status) {
  const map = {
    pending: { label: "Unpaid", color: "amber" },
    paid: { label: "Paid", color: "emerald" },
    refunded: { label: "Refunded", color: "slate" },
  };
  const s = map[status] || map.pending;
  return `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-${s.color}-500/10 border border-${s.color}-500/20 text-${s.color}-400 text-[10px] font-bold rounded-full">${s.label}</span>`;
}

function renderPackageItems() {
  const list = document.getElementById("package-items-list");
  list.innerHTML = "";

  if (packageItems.length === 0) {
    list.innerHTML = `<p class="text-slate-500 text-sm italic text-center py-4">No items added yet. Select a product above.</p>`;
    updateSummary();
    return;
  }

  packageItems.forEach((item, idx) => {
    const total = (item.quantity * item.unitPrice).toFixed(2);
    const div = document.createElement("div");
    div.className =
      "package-item flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 hover:border-primary/20 transition-colors";
    div.innerHTML = `
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <div class="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-light text-xs font-bold">${item.quantity}×</div>
        <div class="min-w-0">
          <p class="text-white text-sm font-semibold truncate">${item.name}</p>
          <p class="text-slate-500 text-xs">${item.category} • $${item.unitPrice.toFixed(2)} ea</p>
        </div>
      </div>
      <div class="flex items-center gap-3 ml-3">
        <span class="text-emerald-400 font-mono font-bold text-sm">$${total}</span>
        <button onclick="removeFromPackage(${idx})" class="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-colors text-xs">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;
    list.appendChild(div);
  });

  updateSummary();
}

function updateSummary() {
  const subtotal = packageItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const shipping = parseFloat(document.getElementById("ship-cost")?.value) || 0;
  const total = subtotal + shipping;

  document.getElementById("package-subtotal").textContent = formatCurrency(subtotal);
  document.getElementById("summary-subtotal").textContent = formatCurrency(subtotal);
  document.getElementById("summary-shipping").textContent = formatCurrency(shipping);
  document.getElementById("summary-total").textContent = formatCurrency(total);
}

// ===== ORDER DETAIL =====

function renderOrderDetail(order) {
  const statuses = ["pending", "processing", "shipped", "in_transit", "delivered"];
  const statusIcons = ["⏳", "⚙️", "📦", "🚚", "✅"];
  const statusLabels = ["Pending", "Processing", "Shipped", "In Transit", "Delivered"];
  const currentIdx = order.orderStatus === "cancelled" ? -1 : statuses.indexOf(order.orderStatus);

  // Timeline fill percentage
  const fillPct = currentIdx <= 0 ? 0 : (currentIdx / (statuses.length - 1)) * 100;

  let timelineHTML = `<div class="timeline-track mb-2"><div class="timeline-line"><div class="timeline-line-fill" style="width:${fillPct}%"></div></div>`;
  statuses.forEach((s, i) => {
    let cls = "";
    if (i < currentIdx) cls = "completed";
    else if (i === currentIdx) cls = "active";
    timelineHTML += `
      <div class="timeline-step ${cls}">
        <div class="step-dot">${statusIcons[i]}</div>
        <span class="step-label">${statusLabels[i]}</span>
      </div>`;
  });
  timelineHTML += `</div>`;

  // Carrier tracking link
  const carrierUrl = getCarrierUrl(order.carrier, order.carrierTrackingNum);
  const trackBtn = carrierUrl
    ? `<a href="${carrierUrl}" target="_blank" rel="noopener noreferrer"
        class="flex-1 flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all group">
        <i class="fa-solid fa-location-arrow group-hover:-translate-y-0.5 transition-transform"></i> Track on ${getCarrierName(order.carrier)}
      </a>`
    : `<button disabled class="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-slate-500 px-4 py-2.5 rounded-xl font-semibold text-sm cursor-not-allowed">
        <i class="fa-solid fa-location-arrow"></i> No tracking number yet
      </button>`;

  // Items table
  let itemsRows = order.items
    .map(
      (i) => `
    <div class="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <div class="flex items-center gap-3">
        <div class="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-light text-[10px] font-bold">${i.quantity}×</div>
        <div><p class="text-white text-sm font-medium">${i.name}</p><p class="text-slate-500 text-xs">${i.category}</p></div>
      </div>
      <span class="text-emerald-400 font-mono text-sm font-bold">$${(i.quantity * i.unitPrice).toFixed(2)}</span>
    </div>`,
    )
    .join("");

  // Status update buttons
  const nextStatus = getNextStatus(order.orderStatus);
  let statusActions = "";
  if (order.orderStatus !== "delivered" && order.orderStatus !== "cancelled") {
    if (nextStatus === "shipped") {
      statusActions += `<button onclick="showShipModal(${order.id})" class="flex-1 flex items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"><i class="fa-solid fa-truck-fast"></i> Mark as Shipped</button>`;
    } else if (nextStatus) {
      const label = statusLabels[statuses.indexOf(nextStatus)];
      statusActions += `<button onclick="advanceStatus(${order.id})" class="flex-1 flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary-light px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"><i class="fa-solid fa-arrow-right"></i> Move to ${label}</button>`;
    }
    statusActions += `<button onclick="cancelOrder(${order.id})" class="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"><i class="fa-solid fa-ban"></i> Cancel</button>`;
  }

  // Payment action
  let payAction = "";
  if (order.paymentStatus === "pending") {
    payAction = `<button onclick="markAsPaid(${order.id})" class="flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all w-full"><i class="fa-solid fa-check-circle"></i> Mark as Paid</button>`;
  } else if (order.paymentStatus === "paid") {
    payAction = `<button onclick="refundOrder(${order.id})" class="flex items-center justify-center gap-2 bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/20 text-slate-400 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all w-full"><i class="fa-solid fa-rotate-left"></i> Refund</button>`;
  }

  const payMethodLabels = {
    credit_card: "Credit Card",
    bank_transfer: "Bank Transfer",
    paypal: "PayPal",
    cash: "Cash on Delivery",
  };

  document.getElementById("detail-body").innerHTML = `
    <!-- Header -->
    <div class="px-6 md:px-8 py-5 md:py-6 border-b border-white/10 relative">
      <div class="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"></div>
      <div class="flex justify-between items-start relative z-10">
        <div>
          <p class="text-xs text-slate-500 uppercase tracking-wider font-display mb-1">Order Details</p>
          <h3 class="text-xl md:text-2xl font-bold text-white font-display">${order.trackingId}</h3>
          <p class="text-xs text-slate-400 mt-1">${formatDate(order.createdAt)}</p>
        </div>
        <button onclick="hideDetailModal()" class="text-slate-400 hover:text-white transition-colors text-3xl font-light hover:rotate-90 duration-300">×</button>
      </div>
    </div>

    <div class="p-6 md:p-8 space-y-6 bg-black/20">
      <!-- Timeline -->
      <div class="bg-white/5 rounded-2xl p-5 border border-white/10">
        ${order.orderStatus === "cancelled"
      ? `<div class="text-center py-4"><span class="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full font-bold text-sm"><i class="fa-solid fa-ban"></i> Order Cancelled</span></div>`
      : timelineHTML
    }
      </div>

      <!-- Track Button -->
      <div class="flex gap-3">
        ${trackBtn}
      </div>

      <!-- Client Info -->
      <div class="bg-white/5 rounded-2xl p-5 border border-white/10">
        <p class="form-section-label mb-4"><i class="fa-solid fa-user mr-2"></i>Client</p>
        <div class="info-row"><span class="info-label">Name</span><span class="info-value">${order.client.name}</span></div>
        <div class="info-row"><span class="info-label">Email</span><span class="info-value">${order.client.email}</span></div>
        <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${order.client.phone || "—"}</span></div>
        <div class="info-row"><span class="info-label">Address</span><span class="info-value text-right">${order.address.street}<br>${order.address.city}, ${order.address.state} ${order.address.zip}<br>${order.address.country}</span></div>
      </div>

      <!-- Items -->
      <div class="bg-white/5 rounded-2xl p-5 border border-white/10">
        <p class="form-section-label mb-4"><i class="fa-solid fa-cubes mr-2"></i>Items</p>
        ${itemsRows}
      </div>

      <!-- Financial -->
      <div class="bg-white/5 rounded-2xl p-5 border border-white/10">
        <p class="form-section-label mb-4"><i class="fa-solid fa-receipt mr-2"></i>Payment</p>
        <div class="info-row"><span class="info-label">Method</span><span class="info-value">${payMethodLabels[order.paymentMethod] || order.paymentMethod}</span></div>
        <div class="info-row"><span class="info-label">Status</span><span class="info-value">${getPaymentBadge(order.paymentStatus)}</span></div>
        <div class="info-row"><span class="info-label">Subtotal</span><span class="info-value font-mono">${formatCurrency(order.subtotal)}</span></div>
        <div class="info-row"><span class="info-label">Shipping (${getCarrierName(order.carrier)})</span><span class="info-value font-mono">${formatCurrency(order.shippingCost)}</span></div>
        <div class="info-row border-t border-white/10 pt-3 mt-2"><span class="info-label text-white font-bold text-base">Total</span><span class="info-value text-emerald-400 font-bold font-mono text-lg">${formatCurrency(order.total)}</span></div>
        ${payAction ? `<div class="mt-4">${payAction}</div>` : ""}
      </div>

      ${order.carrierTrackingNum ? `
      <div class="bg-white/5 rounded-2xl p-5 border border-white/10">
        <p class="form-section-label mb-4"><i class="fa-solid fa-barcode mr-2"></i>Carrier Tracking</p>
        <div class="info-row"><span class="info-label">Carrier</span><span class="info-value">${getCarrierName(order.carrier)}</span></div>
        <div class="info-row"><span class="info-label">Tracking #</span><span class="info-value font-mono text-primary-light">${order.carrierTrackingNum}</span></div>
      </div>` : ""}

      ${order.notes ? `
      <div class="bg-white/5 rounded-2xl p-5 border border-white/10">
        <p class="form-section-label mb-4"><i class="fa-solid fa-note-sticky mr-2"></i>Notes</p>
        <p class="text-slate-400 text-sm">${order.notes}</p>
      </div>` : ""}

      <!-- Status Actions -->
      ${statusActions ? `<div class="flex gap-3">${statusActions}</div>` : ""}
    </div>
  `;
}

function getNextStatus(current) {
  const flow = ["pending", "processing", "shipped", "in_transit", "delivered"];
  const idx = flow.indexOf(current);
  return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null;
}

// ===== MODALS =====

function showCreateModal() {
  packageItems = [];
  // Reset form
  document.getElementById("client-name").value = "";
  document.getElementById("client-email").value = "";
  document.getElementById("client-phone").value = "";
  document.getElementById("addr-street").value = "";
  document.getElementById("addr-city").value = "";
  document.getElementById("addr-state").value = "";
  document.getElementById("addr-zip").value = "";
  document.getElementById("addr-country").value = "United States";
  document.getElementById("ship-carrier").value = "ups";
  document.getElementById("ship-method").value = "standard";
  document.getElementById("ship-cost").value = "0";
  document.getElementById("pay-method").value = "credit_card";
  document.getElementById("pay-status").value = "pending";
  document.getElementById("order-notes").value = "";

  populateProductDropdown();
  renderPackageItems();

  const modal = document.getElementById("create-modal");
  const content = document.getElementById("create-modal-content");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  void modal.offsetWidth;
  modal.classList.add("modal-overlay-show");
  content.classList.add("modal-content-show");
}

function hideCreateModal() {
  const modal = document.getElementById("create-modal");
  const content = document.getElementById("create-modal-content");
  modal.classList.remove("modal-overlay-show");
  content.classList.remove("modal-content-show");
  setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }, 300);
}

function showDetailModal(id) {
  const order = orders.find((o) => o.id === id);
  if (!order) return;

  renderOrderDetail(order);

  const modal = document.getElementById("detail-modal");
  const content = document.getElementById("detail-modal-content");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  void modal.offsetWidth;
  modal.classList.add("modal-overlay-show");
  content.classList.add("modal-content-show");
}

function hideDetailModal() {
  const modal = document.getElementById("detail-modal");
  const content = document.getElementById("detail-modal-content");
  modal.classList.remove("modal-overlay-show");
  content.classList.remove("modal-content-show");
  setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }, 300);
}

function showShipModal(orderId) {
  hideDetailModal();
  setTimeout(() => {
    document.getElementById("ship-order-id").value = orderId;
    document.getElementById("carrier-tracking-num").value = "";

    const modal = document.getElementById("ship-modal");
    const content = document.getElementById("ship-modal-content");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    void modal.offsetWidth;
    modal.classList.add("modal-overlay-show");
    content.classList.add("modal-content-show");
  }, 350);
}

function hideShipModal() {
  const modal = document.getElementById("ship-modal");
  const content = document.getElementById("ship-modal-content");
  modal.classList.remove("modal-overlay-show");
  content.classList.remove("modal-content-show");
  setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }, 300);
}

// ===== PACKAGE BUILDER =====

function populateProductDropdown() {
  const select = document.getElementById("product-select");
  const inventory = getInventory();
  select.innerHTML = `<option value="" class="bg-darker">Select a product...</option>`;

  if (inventory.length === 0) {
    select.innerHTML = `<option value="" class="bg-darker">No inventory items available</option>`;
    return;
  }

  inventory
    .filter((item) => item.quantity > 0)
    .forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.id;
      opt.className = "bg-darker";
      opt.textContent = `${item.name} — $${item.price.toFixed(2)} (${item.quantity} in stock)`;
      select.appendChild(opt);
    });
}

function addToPackage() {
  const select = document.getElementById("product-select");
  const qtyInput = document.getElementById("product-qty");
  const productId = parseInt(select.value);
  const qty = parseInt(qtyInput.value);

  if (!productId || isNaN(qty) || qty < 1) {
    showToast("Select a product and enter a valid quantity.");
    return;
  }

  const inventory = getInventory();
  const product = inventory.find((i) => i.id === productId);
  if (!product) return;

  // Check if already in package
  const existing = packageItems.find((i) => i.productId === productId);
  const alreadyInPackage = existing ? existing.quantity : 0;

  if (alreadyInPackage + qty > product.quantity) {
    showToast(
      `Not enough stock. Available: ${product.quantity - alreadyInPackage}`,
    );
    return;
  }

  if (existing) {
    existing.quantity += qty;
  } else {
    packageItems.push({
      productId: product.id,
      name: product.name,
      category: product.category,
      quantity: qty,
      unitPrice: product.price,
    });
  }

  qtyInput.value = "1";
  select.value = "";
  renderPackageItems();
}

function removeFromPackage(index) {
  packageItems.splice(index, 1);
  renderPackageItems();
}

// ===== ORDER ACTIONS =====

function createOrder() {
  const clientName = document.getElementById("client-name").value.trim();
  const clientEmail = document.getElementById("client-email").value.trim();
  const clientPhone = document.getElementById("client-phone").value.trim();
  const street = document.getElementById("addr-street").value.trim();
  const city = document.getElementById("addr-city").value.trim();
  const state = document.getElementById("addr-state").value.trim();
  const zip = document.getElementById("addr-zip").value.trim();
  const country = document.getElementById("addr-country").value.trim();

  // Validation
  if (!clientName || !clientEmail) {
    showToast("Please fill in client name and email.");
    return;
  }
  if (!street || !city || !state || !zip || !country) {
    showToast("Please complete the shipping address.");
    return;
  }
  if (packageItems.length === 0) {
    showToast("Add at least one item to the package.");
    return;
  }

  const subtotal = packageItems.reduce(
    (s, i) => s + i.quantity * i.unitPrice,
    0,
  );
  const shippingCost =
    parseFloat(document.getElementById("ship-cost").value) || 0;

  const newOrder = {
    id: orders.length > 0 ? Math.max(...orders.map((o) => o.id)) + 1 : 1,
    trackingId: generateTrackingId(),
    carrierTrackingNum: "",
    client: { name: clientName, email: clientEmail, phone: clientPhone },
    address: { street, city, state, zip, country },
    items: packageItems.map((i) => ({ ...i })),
    subtotal: subtotal,
    shippingCost: shippingCost,
    total: subtotal + shippingCost,
    carrier: document.getElementById("ship-carrier").value,
    shippingMethod: document.getElementById("ship-method").value,
    paymentMethod: document.getElementById("pay-method").value,
    paymentStatus: document.getElementById("pay-status").value,
    orderStatus: "pending",
    notes: document.getElementById("order-notes").value.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Deduct from inventory
  const inventory = getInventory();
  packageItems.forEach((pkgItem) => {
    const invItem = inventory.find((i) => i.id === pkgItem.productId);
    if (invItem) {
      invItem.quantity = Math.max(0, invItem.quantity - pkgItem.quantity);
    }
  });
  saveInventory(inventory);

  orders.push(newOrder);
  saveOrders();

  hideCreateModal();
  renderStats();
  filterOrders();

  showToast(`Package ${newOrder.trackingId} created successfully 📦`);
}

function advanceStatus(id) {
  const order = orders.find((o) => o.id === id);
  if (!order) return;

  const next = getNextStatus(order.orderStatus);
  if (!next) return;

  order.orderStatus = next;
  order.updatedAt = new Date().toISOString();
  saveOrders();

  hideDetailModal();
  renderStats();
  filterOrders();

  showToast(`Order moved to ${next.replace("_", " ")} ✅`);
}

function confirmShipment() {
  const orderId = parseInt(document.getElementById("ship-order-id").value);
  const trackingNum = document
    .getElementById("carrier-tracking-num")
    .value.trim();

  if (!trackingNum) {
    showToast("Please enter a carrier tracking number.");
    return;
  }

  const order = orders.find((o) => o.id === orderId);
  if (!order) return;

  order.orderStatus = "shipped";
  order.carrierTrackingNum = trackingNum;
  order.updatedAt = new Date().toISOString();
  saveOrders();

  hideShipModal();
  renderStats();
  filterOrders();

  showToast(`Package shipped with tracking: ${trackingNum} 🚚`);
}

function markAsPaid(id) {
  const order = orders.find((o) => o.id === id);
  if (!order) return;

  order.paymentStatus = "paid";
  order.updatedAt = new Date().toISOString();
  saveOrders();

  hideDetailModal();
  renderStats();
  filterOrders();

  showToast("Payment recorded successfully 💳");
}

function refundOrder(id) {
  if (!confirm("Are you sure you want to refund this order?")) return;

  const order = orders.find((o) => o.id === id);
  if (!order) return;

  order.paymentStatus = "refunded";
  order.updatedAt = new Date().toISOString();
  saveOrders();

  hideDetailModal();
  renderStats();
  filterOrders();

  showToast("Order refunded 💸");
}

function cancelOrder(id) {
  if (!confirm("Cancel this order? Inventory quantities will be restored."))
    return;

  const order = orders.find((o) => o.id === id);
  if (!order) return;

  // Restore inventory
  const inventory = getInventory();
  order.items.forEach((orderItem) => {
    const invItem = inventory.find((i) => i.id === orderItem.productId);
    if (invItem) {
      invItem.quantity += orderItem.quantity;
    }
  });
  saveInventory(inventory);

  order.orderStatus = "cancelled";
  order.updatedAt = new Date().toISOString();
  saveOrders();

  hideDetailModal();
  renderStats();
  filterOrders();

  showToast("Order cancelled. Inventory restored. ❌");
}

function deleteOrder(id) {
  if (!confirm("Permanently delete this order?")) return;

  const order = orders.find((o) => o.id === id);
  if (!order) return;

  // Restore inventory if not delivered or cancelled
  if (
    order.orderStatus !== "delivered" &&
    order.orderStatus !== "cancelled"
  ) {
    const inventory = getInventory();
    order.items.forEach((orderItem) => {
      const invItem = inventory.find((i) => i.id === orderItem.productId);
      if (invItem) {
        invItem.quantity += orderItem.quantity;
      }
    });
    saveInventory(inventory);
  }

  orders = orders.filter((o) => o.id !== id);
  saveOrders();

  renderStats();
  filterOrders();

  showToast("Order deleted 🗑️");
}

// ===== SEARCH & FILTER =====

function filterOrders() {
  const search = document.getElementById("search-input").value.toLowerCase().trim();
  const statusFilter = document.getElementById("status-filter").value;
  const paymentFilter = document.getElementById("payment-filter").value;

  let filtered = [...orders];

  if (search) {
    filtered = filtered.filter(
      (o) =>
        o.trackingId.toLowerCase().includes(search) ||
        o.client.name.toLowerCase().includes(search) ||
        o.client.email.toLowerCase().includes(search) ||
        (o.carrierTrackingNum && o.carrierTrackingNum.toLowerCase().includes(search)),
    );
  }

  if (statusFilter) {
    filtered = filtered.filter((o) => o.orderStatus === statusFilter);
  }

  if (paymentFilter) {
    filtered = filtered.filter((o) => o.paymentStatus === paymentFilter);
  }

  // Sort newest first
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  renderOrders(filtered);
}

// ===== UTILITIES =====

function showToast(message) {
  const toast = document.getElementById("toast");
  document.getElementById("toast-text").textContent = message;
  toast.classList.add("toast-show");
  setTimeout(() => toast.classList.remove("toast-show"), 3500);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount) {
  return "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ===== SIDEBAR =====

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("mobile-overlay");

  if (sidebar.classList.contains("-translate-x-[110%]")) {
    sidebar.classList.remove("-translate-x-[110%]");
    sidebar.classList.add("translate-x-0");
    overlay.classList.remove("hidden");
  } else {
    sidebar.classList.add("-translate-x-[110%]");
    sidebar.classList.remove("translate-x-0");
    overlay.classList.add("hidden");
  }
}

// ===== INIT =====

// Listen for shipping cost changes to update summary
document.getElementById("ship-cost")?.addEventListener("input", updateSummary);

window.onload = function () {
  loadOrders();
  renderStats();
  filterOrders();
};
