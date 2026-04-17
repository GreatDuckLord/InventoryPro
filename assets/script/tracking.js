// ===== CARRIER TRACKING URLs =====
const CARRIER_URLS = {
  ups: (num) =>
    `https://www.ups.com/track?tracknum=${encodeURIComponent(num)}`,
  fedex: (num) =>
    `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(num)}`,
  dhl: (num) =>
    `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(num)}`,
  usps: (num) =>
    `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(num)}`,
  other: () => null,
};

const CARRIER_NAMES = {
  ups: "UPS",
  fedex: "FedEx",
  dhl: "DHL",
  usps: "USPS",
  other: "Carrier",
};

const STATUS_FLOW = ["pending", "processing", "shipped", "in_transit", "delivered"];
const STATUS_ICONS = ["⏳", "⚙️", "📦", "🚚", "✅"];
const STATUS_LABELS = ["Pending", "Processing", "Shipped", "In Transit", "Delivered"];

// ===== LOOKUP =====

function getOrders() {
  const saved = localStorage.getItem("ordersData");
  return saved ? JSON.parse(saved) : [];
}

function findOrder(trackingId) {
  const orders = getOrders();
  const normalized = trackingId.trim().toUpperCase();
  return orders.find(
    (o) =>
      o.trackingId.toUpperCase() === normalized ||
      (o.carrierTrackingNum &&
        o.carrierTrackingNum.toUpperCase() === normalized),
  );
}

// ===== TRACK =====

function trackPackage() {
  const input = document.getElementById("tracking-input");
  const container = document.getElementById("results-container");
  const trackingId = input.value.trim();

  if (!trackingId) {
    input.focus();
    input.style.borderColor = "#ff4d4d";
    input.style.boxShadow = "0 0 0 4px rgba(255,77,77,0.12)";
    setTimeout(() => {
      input.style.borderColor = "rgba(255,255,255,0.1)";
      input.style.boxShadow = "none";
    }, 2000);
    return;
  }

  // Show loading
  container.innerHTML = `
    <div class="result-card">
      <div class="result-inner" style="padding: 48px; text-align: center;">
        <div class="spinner"></div>
        <p style="margin-top: 16px; color: #64748b; font-size: 14px;">Looking up your package...</p>
      </div>
    </div>`;

  // Simulate network delay for realism
  setTimeout(() => {
    const order = findOrder(trackingId);

    if (!order) {
      renderNotFound(trackingId);
      return;
    }

    // If the order has a carrier tracking number, try to redirect to carrier
    if (
      order.carrierTrackingNum &&
      order.carrier &&
      CARRIER_URLS[order.carrier]
    ) {
      renderResult(order);
    } else {
      renderResult(order);
    }
  }, 800);
}

// ===== RENDER RESULT =====

function renderResult(order) {
  const container = document.getElementById("results-container");
  const currentIdx =
    order.orderStatus === "cancelled"
      ? -1
      : STATUS_FLOW.indexOf(order.orderStatus);
  const fillPct =
    currentIdx <= 0 ? 0 : (currentIdx / (STATUS_FLOW.length - 1)) * 100;

  // Status timeline
  let timelineHTML = "";
  if (order.orderStatus === "cancelled") {
    timelineHTML = `
      <div style="text-align:center; padding: 16px 0;">
        <span style="display:inline-flex; align-items:center; gap:8px; padding:10px 20px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); color:#f87171; border-radius:99px; font-weight:700; font-size:14px; font-family:'Outfit',sans-serif;">
          <i class="fa-solid fa-ban"></i> Order Cancelled
        </span>
      </div>`;
  } else {
    timelineHTML = `<div class="timeline-track"><div class="timeline-line"><div class="timeline-line-fill" style="width:${fillPct}%"></div></div>`;
    STATUS_FLOW.forEach((s, i) => {
      let cls = "";
      if (i < currentIdx) cls = "completed";
      else if (i === currentIdx) cls = "active";
      timelineHTML += `
        <div class="timeline-step ${cls}">
          <div class="step-dot">${STATUS_ICONS[i]}</div>
          <span class="step-label">${STATUS_LABELS[i]}</span>
        </div>`;
    });
    timelineHTML += `</div>`;
  }

  // Carrier tracking button
  const carrierName = CARRIER_NAMES[order.carrier] || "Carrier";
  let carrierBtnHTML = "";
  if (order.carrierTrackingNum && CARRIER_URLS[order.carrier]) {
    const url = CARRIER_URLS[order.carrier](order.carrierTrackingNum);
    if (url) {
      carrierBtnHTML = `
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="carrier-btn active-link">
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
          Track live on ${carrierName}
        </a>`;
    }
  } else {
    carrierBtnHTML = `
      <div class="carrier-btn disabled-link">
        <i class="fa-solid fa-clock"></i>
        Carrier tracking available once shipped
      </div>`;
  }

  // Payment info
  const payLabels = {
    credit_card: "Credit Card",
    bank_transfer: "Bank Transfer",
    paypal: "PayPal",
    cash: "Cash on Delivery",
  };
  const payStatusLabels = {
    pending: '<span style="color:#fbbf24">Unpaid</span>',
    paid: '<span style="color:#34d399">Paid</span>',
    refunded: '<span style="color:#94a3b8">Refunded</span>',
  };

  const shippingLabels = {
    standard: "Standard",
    express: "Express",
    overnight: "Overnight",
  };

  container.innerHTML = `
    <div class="result-card">
      <div class="result-inner">
        <div class="result-header">
          <p class="tracking-id">${order.trackingId}</p>
          <h3>Package Status</h3>
        </div>
        <div class="result-body">
          ${timelineHTML}

          ${carrierBtnHTML}

          <div class="info-section">
            <p class="info-section-title"><i class="fa-solid fa-truck" style="margin-right:8px"></i>Shipping Details</p>
            <div class="info-row">
              <span class="info-label">Carrier</span>
              <span class="info-value">${carrierName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Method</span>
              <span class="info-value">${shippingLabels[order.shippingMethod] || order.shippingMethod}</span>
            </div>
            ${order.carrierTrackingNum ? `
            <div class="info-row">
              <span class="info-label">Carrier Tracking #</span>
              <span class="info-value" style="font-family:monospace; color:#b05bff">${order.carrierTrackingNum}</span>
            </div>` : ""}
            <div class="info-row">
              <span class="info-label">Destination</span>
              <span class="info-value" style="text-align:right">${order.address.city}, ${order.address.state} ${order.address.zip}<br>${order.address.country}</span>
            </div>
          </div>

          <div class="info-section">
            <p class="info-section-title"><i class="fa-solid fa-receipt" style="margin-right:8px"></i>Order Summary</p>
            <div class="info-row">
              <span class="info-label">Items</span>
              <span class="info-value">${order.items.reduce((s, i) => s + i.quantity, 0)} item${order.items.reduce((s, i) => s + i.quantity, 0) > 1 ? "s" : ""}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment</span>
              <span class="info-value">${payLabels[order.paymentMethod] || order.paymentMethod} — ${payStatusLabels[order.paymentStatus] || order.paymentStatus}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total</span>
              <span class="info-value" style="color:#34d399; font-weight:700; font-family:monospace; font-size:16px">$${order.total.toFixed(2)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Order Date</span>
              <span class="info-value">${new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

// ===== NOT FOUND =====

function renderNotFound(trackingId) {
  const container = document.getElementById("results-container");
  container.innerHTML = `
    <div class="error-card">
      <div class="error-inner">
        <div class="error-icon">
          <i class="fa-solid fa-magnifying-glass"></i>
        </div>
        <h3>Package Not Found</h3>
        <p>We couldn't find any package with tracking ID <strong style="color:#b05bff">"${trackingId}"</strong>. Please double-check your tracking number and try again.</p>
      </div>
    </div>`;
}

// ===== EVENTS =====

document.getElementById("tracking-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") trackPackage();
});

document.getElementById("tracking-input").addEventListener("input", function () {
  this.style.borderColor = "rgba(255,255,255,0.1)";
  this.style.boxShadow = "none";
});
