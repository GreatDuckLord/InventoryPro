let inventory = [];
let editingId = null;

function initTailwind() {
  return;
}

function loadData() {
  const saved = localStorage.getItem("inventoryData");
  if (saved) {
    inventory = JSON.parse(saved);
  } else {
    inventory = [];
    saveData();
  }
}

function saveData() {
  localStorage.setItem("inventoryData", JSON.stringify(inventory));
}

function renderDashboard() {
  const totalItems = inventory.length;
  const totalValue = inventory.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0,
  );
  const lowStock = inventory.filter(
    (i) => i.quantity > 0 && i.quantity < 10,
  ).length;
  const outOfStock = inventory.filter((i) => i.quantity === 0).length;

  // Add counters animation
  animateValue(
    "total-items",
    parseInt(document.getElementById("total-items").textContent) || 0,
    totalItems,
    500,
  );
  animateValue(
    "low-stock",
    parseInt(document.getElementById("low-stock").textContent) || 0,
    lowStock,
    500,
  );
  animateValue(
    "out-of-stock",
    parseInt(document.getElementById("out-of-stock").textContent) || 0,
    outOfStock,
    500,
  );

  // Format Currency Total
  document.getElementById("total-value").textContent =
    "$" + totalValue.toLocaleString("en-US", { maximumFractionDigits: 2 });

  // Update Chart dynamically
  const baseCats = ["Electronics", "Furniture", "Office Supplies", "Tools"];
  const cats = {
    Electronics: 0,
    Furniture: 0,
    "Office Supplies": 0,
    Tools: 0,
  };

  inventory.forEach((item) => {
    if (cats[item.category] === undefined) {
      cats[item.category] = 0;
    }
    cats[item.category] += item.quantity;
  });

  for (let cat in cats) {
    if (!baseCats.includes(cat) && cats[cat] === 0) {
      delete cats[cat];
    }
  }

  const maxQty = Math.max(...Object.values(cats), 1);
  const chartContainer = document.getElementById("chart-container");
  if (chartContainer) {
    chartContainer.innerHTML = "";
    const colors = {
      Electronics:
        "from-blue-600 to-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]",
      Furniture:
        "from-primary to-primary-light shadow-[0_0_20px_rgba(138,43,226,0.3)]",
      "Office Supplies":
        "from-pink-600 to-pink-400 shadow-[0_0_20px_rgba(219,39,119,0.3)]",
      Tools:
        "from-amber-500 to-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)]",
      Clothing:
        "from-teal-500 to-teal-300 shadow-[0_0_20px_rgba(20,184,166,0.3)]",
      Books:
        "from-indigo-500 to-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.3)]",
      Groceries:
        "from-emerald-500 to-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]",
    };

    for (let cat in cats) {
      const qty = cats[cat];
      const pct = (qty / maxQty) * 100;
      const finalHeight = qty > 0 ? Math.max(pct, 5) : 0;
      const colorClass =
        colors[cat] ||
        "from-slate-500 to-slate-300 shadow-[0_0_20px_rgba(100,116,139,0.3)]";
      const displayCat = cat === "Office Supplies" ? "Office" : cat;

      const barHTML = `
                <div class="flex-1 flex flex-col items-center justify-end gap-2 md:gap-4 group/bar h-full">
                    <span class="text-xs text-white font-mono opacity-0 group-hover/bar:opacity-100 transition-opacity translate-y-2 group-hover/bar:translate-y-0 duration-300">${qty}</span>
                    <div class="w-full bg-gradient-to-t ${colorClass} rounded-xl md:rounded-2xl transition-all duration-700 hover:brightness-110 group-hover/bar:scale-x-105"
                        style="height: ${finalHeight}%"></div>
                    <p class="text-[10px] md:text-sm font-medium text-slate-300 font-display truncate w-full text-center" title="${cat}">${displayCat}</p>
                </div>
            `;
      chartContainer.innerHTML += barHTML;
    }
  }
}

function animateValue(id, start, end, duration) {
  if (start === end) return;
  const obj = document.getElementById(id);
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

function renderTable(filteredInventory) {
  const tbody = document.getElementById("inventory-table");
  tbody.innerHTML = "";

  if (filteredInventory.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-16 text-slate-500 font-display text-lg">No items found matching your filter criteria.</td></tr>`;
    return;
  }

  filteredInventory.forEach((item, index) => {
    const total = (item.quantity * item.price).toFixed(2);
    let statusHTML = "";

    if (item.quantity === 0) {
      statusHTML = `<span class="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-full shadow-[0_0_10px_rgba(239,68,68,0.1)]"><div class="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></div>Out of Stock</span>`;
    } else if (item.quantity < 10) {
      statusHTML = `<span class="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-full shadow-[0_0_10px_rgba(245,158,11,0.1)]"><div class="w-1.5 h-1.5 rounded-full bg-amber-400"></div>Low Stock</span>`;
    } else {
      statusHTML = `<span class="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full shadow-[0_0_10px_rgba(16,185,129,0.1)]"><div class="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>In Stock</span>`;
    }

    const row = document.createElement("tr");
    row.className = "group transition-colors";
    row.style.animationDelay = `${index * 30}ms`; // staggered fade in
    row.innerHTML = `
            <td class="px-4 md:px-8 py-4 md:py-5 font-semibold text-white">${item.name}</td>
            <td class="px-4 md:px-8 py-4 md:py-5 text-slate-400">${item.category}</td>
            <td class="px-4 md:px-8 py-4 md:py-5 text-right font-mono font-medium text-slate-300 pointer">${item.quantity}</td>
            <td class="px-4 md:px-8 py-4 md:py-5 text-right font-mono text-slate-400">$${item.price.toFixed(2)}</td>
            <td class="px-4 md:px-8 py-4 md:py-5 text-right font-mono font-bold text-emerald-400">$${total}</td>
            <td class="px-4 md:px-8 py-4 md:py-5 text-center">${statusHTML}</td>
            <td class="px-4 md:px-8 py-4 md:py-5">
                <div class="flex items-center justify-end gap-3 md:opacity-0 md:group-hover:opacity-100 transition-opacity md:translate-x-4 md:group-hover:translate-x-0 duration-300">
                    <button onclick="editItem(${item.id}); event.stopImmediatePropagation()" 
                            class="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 flex items-center justify-center transition-colors">✏️</button>
                    <button onclick="deleteItem(${item.id}); event.stopImmediatePropagation()" 
                            class="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 flex items-center justify-center transition-colors">🗑️</button>
                </div>
            </td>
        `;
    tbody.appendChild(row);
  });
}

function filterInventory() {
  const searchTerm = document
    .getElementById("search-input")
    .value.toLowerCase()
    .trim();
  const categoryFilter = document.getElementById("category-filter").value;

  let filtered = inventory;

  if (searchTerm) {
    filtered = filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm),
    );
  }

  if (categoryFilter) {
    filtered = filtered.filter((item) => item.category === categoryFilter);
  }

  renderTable(filtered);
}

function navigateTo(section) {
  if (window.innerWidth < 768) {
    const sidebar = document.getElementById("sidebar");
    if (sidebar && sidebar.classList.contains("translate-x-0")) {
      toggleSidebar();
    }
  }
  fadeSectionOut(() => {
    document.getElementById("dashboard-section")?.classList.add("hidden");
    document.getElementById("inventory-section")?.classList.add("hidden");
    document.getElementById("reports-section")?.classList.add("hidden");
    document.getElementById("privacy-section")?.classList.add("hidden");
    document.getElementById("security-section")?.classList.add("hidden");
    document.getElementById("terms-section")?.classList.add("hidden");
    document.getElementById("cookie-section")?.classList.add("hidden");
    document.getElementById("about-section")?.classList.add("hidden");
    document.getElementById("contact-section")?.classList.add("hidden");

    document
      .querySelectorAll(".nav-btn")
      .forEach((btn) => btn.classList.remove("active-nav"));

    const activeSection = document.getElementById(`${section}-section`);
    if (activeSection) {
      activeSection.classList.remove("hidden");

      // Add fade in effect
      activeSection.style.opacity = "0";
      activeSection.style.transform = "translateY(10px)";
      activeSection.style.transition = "all 0.4s ease-out";

      setTimeout(() => {
        activeSection.style.opacity = "1";
        activeSection.style.transform = "translateY(0)";
      }, 10);
    }

    const navBtn = document.getElementById(`nav-${section}`);
    if (navBtn) navBtn.classList.add("active-nav");

    const searchContainer = document.getElementById("search-container");
    const addItemContainer = document.getElementById("add-item-container");
    if (searchContainer) searchContainer.classList.add("hidden");
    if (addItemContainer) addItemContainer.classList.add("hidden");

    if (section === "dashboard") {
      document.getElementById("page-title").textContent = "Dashboard Overview";
      renderDashboard();
    } else if (section === "inventory") {
      document.getElementById("page-title").textContent =
        "Inventory Management";
      if (searchContainer) searchContainer.classList.remove("hidden");
      if (addItemContainer) addItemContainer.classList.remove("hidden");
      filterInventory();
    } else if (section === "reports") {
      document.getElementById("page-title").textContent = "Live Reports";
      renderReports();
    } else if (section === "privacy") {
      document.getElementById("page-title").textContent = "Privacy Policy";
    } else if (section === "security") {
      document.getElementById("page-title").textContent = "Security Infrastructure";
    } else if (section === "terms") {
      document.getElementById("page-title").textContent = "Terms of Service";
    } else if (section === "cookie") {
      document.getElementById("page-title").textContent = "Cookie Policy";
    } else if (section === "about") {
      document.getElementById("page-title").textContent = "About Us";
    } else if (section === "contact") {
      document.getElementById("page-title").textContent = "Contact Us";
    }
  });
}

function fadeSectionOut(callback) {
  const visibleSection = document.querySelector(
    "#dashboard-section:not(.hidden), #inventory-section:not(.hidden), #reports-section:not(.hidden), #privacy-section:not(.hidden), #security-section:not(.hidden), #terms-section:not(.hidden), #cookie-section:not(.hidden), #about-section:not(.hidden), #contact-section:not(.hidden)",
  );
  if (visibleSection) {
    visibleSection.style.opacity = "0";
    visibleSection.style.transform = "translateY(-10px)";
    setTimeout(callback, 200);
  } else {
    callback();
  }
}

function showAddModal() {
  editingId = null;
  document.getElementById("modal-title").textContent = "Add New Item";
  document.getElementById("form-name").value = "";
  document.getElementById("form-category").value = "Electronics";
  document.getElementById("form-quantity").value = "";
  document.getElementById("form-price").value = "";

  // Styling states
  document.getElementById("save-btn").innerHTML = "Save Item";
  document
    .querySelectorAll("input")
    .forEach((i) => (i.style.borderColor = "rgba(255, 255, 255, 0.1)"));

  const modal = document.getElementById("modal");
  const content = document.getElementById("modal-content");

  modal.classList.remove("hidden");
  modal.classList.add("flex");

  // Trigger reflow
  void modal.offsetWidth;

  modal.classList.add("modal-overlay-show");
  content.classList.add("modal-content-show");
}

function hideModal() {
  const modal = document.getElementById("modal");
  const content = document.getElementById("modal-content");

  modal.classList.remove("modal-overlay-show");
  content.classList.remove("modal-content-show");

  setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    editingId = null;
  }, 300);
}

function saveItem() {
  const name = document.getElementById("form-name").value.trim();
  const category = document.getElementById("form-category").value;
  const quantity = parseFloat(document.getElementById("form-quantity").value);
  const price = parseFloat(document.getElementById("form-price").value);

  let isValid = true;
  if (!name) {
    document.getElementById("form-name").style.borderColor = "#ef4444";
    isValid = false;
  }
  if (isNaN(quantity)) {
    document.getElementById("form-quantity").style.borderColor = "#ef4444";
    isValid = false;
  }
  if (isNaN(price)) {
    document.getElementById("form-price").style.borderColor = "#ef4444";
    isValid = false;
  }

  if (!isValid) return;

  const saveBtn = document.getElementById("save-btn");
  saveBtn.innerHTML =
    '<span class="animate-spin inline-block mr-2 font-light">◌</span> Saving...';

  setTimeout(() => {
    if (editingId !== null) {
      const item = inventory.find((i) => i.id === editingId);
      if (item) {
        item.name = name;
        item.category = category;
        item.quantity = quantity;
        item.price = price;
      }
    } else {
      const newId =
        inventory.length > 0 ? Math.max(...inventory.map((i) => i.id)) + 1 : 1;
      inventory.push({
        id: newId,
        name: name,
        category: category,
        quantity: quantity,
        price: price,
      });
    }

    saveData();
    hideModal();
    filterInventory();
    renderDashboard();
    renderReports();

    showToast(
      editingId
        ? "Item successfully updated ✨"
        : "New item saved to inventory 📦",
    );
  }, 600);
}

function editItem(id) {
  const item = inventory.find((i) => i.id === id);
  if (!item) return;

  showAddModal();
  editingId = id;
  document.getElementById("modal-title").textContent = "Edit Record";
  document.getElementById("form-name").value = item.name;
  document.getElementById("form-category").value = item.category;
  document.getElementById("form-quantity").value = item.quantity;
  document.getElementById("form-price").value = item.price;
}

function deleteItem(id) {
  if (!confirm("Permanently delete this record?")) return;

  inventory = inventory.filter((i) => i.id !== id);
  saveData();
  filterInventory();
  renderDashboard();
  renderReports();

  showToast("Item deleted successfully 🗑️");
}

function deleteAllItems() {
  if (inventory.length === 0) {
    showToast("Inventory is already empty.");
    return;
  }
  if (
    !confirm(
      "Are you absolutely sure you want to delete ALL items? This action cannot be undone.",
    )
  )
    return;

  inventory = [];
  saveData();
  filterInventory();
  renderDashboard();
  renderReports();

  showToast("All items deleted successfully 🗑️");
}

function exportToCSV() {
  if (inventory.length === 0) {
    showToast("No items to export.");
    return;
  }

  const headers = [
    "ID",
    "Item Name",
    "Category",
    "Quantity",
    "Unit Price",
    "Total Value",
  ];
  const rows = inventory.map((item) => [
    item.id,
    `"${item.name.replace(/"/g, '""')}"`,
    item.category,
    item.quantity,
    item.price.toFixed(2),
    (item.quantity * item.price).toFixed(2),
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
    "\n",
  );
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `inventory_export_${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("CSV Exported Successfully 📄");
}

function handleCSVImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const text = e.target.result;
      const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");

      if (lines.length < 2) {
        showToast("CSV file is empty or has no data rows.");
        return;
      }

      // Parse header row
      const headers = parseCSVLine(lines[0]).map((h) =>
        h.trim().toLowerCase().replace(/[^a-z0-9 ]/g, ""),
      );

      // Map flexible header names to our fields
      const nameIdx = headers.findIndex(
        (h) => h === "item name" || h === "name" || h === "item",
      );
      const categoryIdx = headers.findIndex(
        (h) => h === "category" || h === "cat",
      );
      const quantityIdx = headers.findIndex(
        (h) => h === "quantity" || h === "qty" || h === "stock",
      );
      const priceIdx = headers.findIndex(
        (h) =>
          h === "unit price" || h === "price" || h === "cost" || h === "unitprice",
      );

      if (nameIdx === -1 || categoryIdx === -1 || quantityIdx === -1 || priceIdx === -1) {
        showToast("CSV headers not recognized. Expected: Item Name, Category, Quantity, Unit Price");
        return;
      }

      let importedCount = 0;
      let nextId =
        inventory.length > 0
          ? Math.max(...inventory.map((i) => i.id)) + 1
          : 1;

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length <= Math.max(nameIdx, categoryIdx, quantityIdx, priceIdx)) continue;

        const name = cols[nameIdx]?.trim();
        const category = cols[categoryIdx]?.trim();
        const quantity = parseFloat(cols[quantityIdx]?.trim());
        const price = parseFloat(cols[priceIdx]?.trim().replace(/^\$/, ""));

        if (!name || !category || isNaN(quantity) || isNaN(price)) continue;

        inventory.push({
          id: nextId++,
          name: name,
          category: category,
          quantity: quantity,
          price: price,
        });
        importedCount++;
      }

      if (importedCount === 0) {
        showToast("No valid items found in CSV file.");
        return;
      }

      saveData();
      filterInventory();
      renderDashboard();
      renderReports();

      showToast(`Successfully imported ${importedCount} item${importedCount > 1 ? "s" : ""} 📥`);
    } catch (err) {
      showToast("Error reading CSV file. Please check the format.");
      console.error("CSV Import Error:", err);
    }
  };

  reader.readAsText(file);
  // Reset file input so the same file can be re-imported
  event.target.value = "";
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

function renderReports() {
  // 1. Category Breakdown
  const catsMap = {};
  let totalItemsCount = 0;
  let totalValueSum = 0;

  inventory.forEach((item) => {
    if (!catsMap[item.category]) {
      catsMap[item.category] = { count: 0, value: 0 };
    }
    catsMap[item.category].count += item.quantity;
    const val = item.quantity * item.price;
    catsMap[item.category].value += val;

    totalItemsCount += item.quantity;
    totalValueSum += val;
  });

  const catBody = document.getElementById("report-category-body");
  if (!catBody) return;
  catBody.innerHTML = "";

  for (const [cat, data] of Object.entries(catsMap)) {
    const row = document.createElement("tr");
    row.className = "group transition-colors hover:bg-white/5";
    row.innerHTML = `
            <td class="py-3 px-2 text-slate-300 font-medium">${cat}</td>
            <td class="py-3 px-2 text-right font-mono text-slate-400">${data.count}</td>
            <td class="py-3 px-2 text-right font-mono text-emerald-400">$${data.value.toFixed(2)}</td>
        `;
    catBody.appendChild(row);
  }

  document.getElementById("report-cat-total-items").textContent =
    totalItemsCount;
  document.getElementById("report-cat-total-value").textContent =
    "$" + totalValueSum.toFixed(2);

  // 2. Top Valuable Items
  const topItems = [...inventory]
    .map((i) => ({ ...i, totalValue: i.quantity * i.price }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5);

  const topItemsContainer = document.getElementById("report-top-items");
  topItemsContainer.innerHTML = "";

  if (topItems.length === 0) {
    topItemsContainer.innerHTML =
      '<p class="text-slate-500 italic">No inventory available.</p>';
  }

  topItems.forEach((item, index) => {
    const div = document.createElement("div");
    div.className =
      "flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 hover:border-primary/30 transition-colors";
    div.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary-light font-bold text-xs border border-primary/20">
                    #${index + 1}
                </div>
                <div>
                    <p class="text-white text-sm font-semibold">${item.name}</p>
                    <p class="text-slate-400 text-xs">${item.category}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="text-emerald-400 font-mono font-bold text-sm">$${item.totalValue.toFixed(2)}</p>
                <p class="text-slate-500 font-mono text-xs">${item.quantity} × $${item.price.toFixed(2)}</p>
            </div>
        `;
    topItemsContainer.appendChild(div);
  });

  // 3. Low Stock / Out of Stock
  const alertItems = inventory
    .filter((i) => i.quantity < 10)
    .sort((a, b) => a.quantity - b.quantity);
  const alertsBody = document.getElementById("report-alerts-body");
  alertsBody.innerHTML = "";

  if (alertItems.length === 0) {
    alertsBody.innerHTML =
      '<tr><td colspan="4" class="py-4 text-center text-slate-500 italic">All items are sufficiently stocked.</td></tr>';
  } else {
    alertItems.forEach((item) => {
      let statusHTML = "";
      if (item.quantity === 0) {
        statusHTML = `<span class="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold rounded-full"><div class="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></div>Out of Stock</span>`;
      } else {
        statusHTML = `<span class="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full"><div class="w-1.5 h-1.5 rounded-full bg-amber-400"></div>Low Stock</span>`;
      }

      const row = document.createElement("tr");
      row.className = "group transition-colors hover:bg-white/5";
      row.innerHTML = `
                <td class="py-3 px-4 font-semibold text-white">${item.name}</td>
                <td class="py-3 px-4 text-slate-400">${item.category}</td>
                <td class="py-3 px-4 text-right font-mono ${item.quantity === 0 ? "text-red-400" : "text-amber-400"}">${item.quantity}</td>
                <td class="py-3 px-4 text-center">${statusHTML}</td>
            `;
      alertsBody.appendChild(row);
    });
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  document.getElementById("toast-text").textContent = message;

  toast.classList.add("toast-show");

  setTimeout(() => {
    toast.classList.remove("toast-show");
  }, 3500);
}

function logout() {
  if (confirm("Are you sure you want to end your session?")) {
    window.location.href = "index.html";
  }
}

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

// input error clear on type
document.querySelectorAll("input").forEach((input) => {
  input.addEventListener("input", () => {
    input.style.borderColor = "rgba(255, 255, 255, 0.1)";
  });
});

window.onload = function () {
  initTailwind();
  loadData();
  const urlParams = new URLSearchParams(window.location.search);
  const section = urlParams.get("section") || "dashboard";
  navigateTo(section);
};
