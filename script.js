/* Sample L'Oréal Product Data */
const products = [
  {
    id: 1,
    name: "Revitalift 1.5% Pure Hyaluronic Acid Serum",
    category: "Skincare",
    description: "Lightweight, fast-absorbing serum that intensely hydrates and visibly plumps skin for a dewy glow."
  },
  {
    id: 2,
    name: "Telescopic Lift Washable Mascara",
    category: "Makeup",
    description: "Provides instant lash lift, volume, and up to +5mm visible length with a double-hook bristle brush."
  },
  {
    id: 3,
    name: "Elvive Hyaluron Plump Hydrating Shampoo",
    category: "Haircare",
    description: "Formulated with hyaluronic acid to coat hair fibers and lock in moisture for up to 72 hours."
  },
  {
    id: 4,
    name: "Libre Eau de Parfum",
    category: "Fragrance",
    description: "A bold floral fragrance blending French lavender essence with warm Moroccan orange blossom and vanilla."
  }
];

/* Storage keys */
const STORAGE_KEY = "loreal_selected_products";
const RTL_STORAGE_KEY = "loreal_rtl_mode";

/* Load saved product IDs and RTL preference from localStorage */
let selectedProductIds = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let isRtl = JSON.parse(localStorage.getItem(RTL_STORAGE_KEY)) || false;

/* Apply saved RTL state on load */
const htmlRoot = document.getElementById("htmlRoot");
htmlRoot.setAttribute("dir", isRtl ? "rtl" : "ltr");

/* Keep track of full conversation history with web search guidance */
let chatHistory = [
  {
    role: "system",
    content: "You are a helpful L'Oréal Smart Product Advisor with real-time web search capabilities. Use web search when helpful to provide current information, usage tips, ingredient insights, and availability for L'Oréal products and routines. Only answer questions related to the generated routine or topics like skincare, haircare, makeup, and fragrance. Politely redirect users back to beauty and routine topics if they ask about unrelated subjects."
  }
];

/* DOM Elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const productGrid = document.getElementById("productGrid");
const productSearchInput = document.getElementById("productSearchInput");
const categoryFilter = document.getElementById("categoryFilter");
const selectedList = document.getElementById("selectedList");
const selectedCount = document.getElementById("selectedCount");
const selectedActions = document.getElementById("selectedActions");
const generateRoutineBtn = document.getElementById("generateRoutineBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const rtlToggleBtn = document.getElementById("rtlToggleBtn");

// Set initial welcome message
chatWindow.textContent = "👋 Hello! Select products above and click 'Generate Routine', or ask follow-up questions below (now with live L'Oréal web search & RTL support!).";

/* Toggle RTL Mode */
rtlToggleBtn.addEventListener("click", () => {
  isRtl = !isRtl;
  localStorage.setItem(RTL_STORAGE_KEY, JSON.stringify(isRtl));
  htmlRoot.setAttribute("dir", isRtl ? "rtl" : "ltr");
});

/* Save current selections to localStorage */
function saveSelections() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedProductIds));
}

/* Filter and render matching product cards into the grid */
function renderProducts() {
  productGrid.innerHTML = "";

  const searchTerm = productSearchInput.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value;

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;

    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm);

    return matchesCategory && matchesSearch;
  });

  if (filteredProducts.length === 0) {
    productGrid.innerHTML = `<p class="no-results">No products match your search or category filter.</p>`;
    return;
  }

  filteredProducts.forEach((product) => {
    const isSelected = selectedProductIds.includes(product.id);

    const card = document.createElement("div");
    card.className = `product-card ${isSelected ? "selected" : ""}`;

    card.innerHTML = `
      <div>
        <div class="product-category">${product.category}</div>
        <div class="product-name">${product.name}</div>
      </div>
      <div>
        <button type="button" class="details-btn" aria-expanded="false">
          Show Details
        </button>
        <p class="product-description hidden">${product.description}</p>
      </div>
    `;

    const detailsBtn = card.querySelector(".details-btn");
    const descriptionText = card.querySelector(".product-description");

    detailsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = descriptionText.classList.toggle("hidden");
      detailsBtn.textContent = isHidden ? "Show Details" : "Hide Details";
      detailsBtn.setAttribute("aria-expanded", !isHidden);
    });

    card.addEventListener("click", () => {
      toggleProductSelection(product.id);
    });

    productGrid.appendChild(card);
  });
}

/* Re-render product grid live as user types or switches category */
productSearchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", renderProducts);

/* Add or remove a product ID from the selection list */
function toggleProductSelection(productId) {
  if (selectedProductIds.includes(productId)) {
    selectedProductIds = selectedProductIds.filter((id) => id !== productId);
  } else {
    selectedProductIds.push(productId);
  }

  saveSelections();
  renderProducts();
  renderSelectedProducts();
}

/* Clear all selected products at once */
clearAllBtn.addEventListener("click", () => {
  selectedProductIds = [];
  saveSelections();
  renderProducts();
  renderSelectedProducts();
});

/* Update the "Selected Products" UI section */
function renderSelectedProducts() {
  selectedCount.textContent = selectedProductIds.length;
  selectedList.innerHTML = "";

  if (selectedProductIds.length === 0) {
    selectedList.innerHTML = `<li class="empty-msg">No products selected yet.</li>`;
    selectedActions.classList.add("hidden");
    return;
  }

  selectedActions.classList.remove("hidden");

  selectedProductIds.forEach((id) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const listItem = document.createElement("li");
    listItem.className = "selected-item";
    listItem.innerHTML = `
      <span>${product.name}</span>
      <button type="button" class="remove-btn" aria-label="Remove ${product.name}">&times;</button>
    `;

    const removeBtn = listItem.querySelector(".remove-btn");
    removeBtn.addEventListener("click", () => {
      toggleProductSelection(product.id);
    });

    selectedList.appendChild(listItem);
  });
}

/* Format AI response text + clickable web search citations */
function buildAIMessageElement(replyText, citations = []) {
  const msgDiv = document.createElement("div");
  msgDiv.className = "msg ai";

  const formattedText = replyText.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #ff003b;">$1</a>'
  );

  msgDiv.innerHTML = `<b>AI:</b> ${formattedText}`;

  if (citations && citations.length > 0) {
    const citationsBox = document.createElement("div");
    citationsBox.className = "citations-box";

    const title = document.createElement("div");
    title.className = "citations-title";
    title.textContent = "Sources:";
    citationsBox.appendChild(title);

    const linksWrap = document.createElement("div");
    linksWrap.className = "citation-links";

    citations.forEach((cite) => {
      const a = document.createElement("a");
      a.className = "citation-link";
      a.href = cite.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = cite.title;
      linksWrap.appendChild(a);
    });

    citationsBox.appendChild(linksWrap);
    msgDiv.appendChild(citationsBox);
  }

  return msgDiv;
}

/* Helper function to send full conversation history to your Cloudflare Worker */
async function sendMessagesToAI() {
  try {
    const response = await fetch("https://ltankney.workers.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: chatHistory
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || "Worker request failed");
    }

    return {
      reply: data.reply,
      citations: data.citations || []
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/* Handle "Generate Routine" button click */
generateRoutineBtn.addEventListener("click", async () => {
  if (selectedProductIds.length === 0) return;

  const selectedProductsData = selectedProductIds.map((id) => {
    const product = products.find((p) => p.id === id);
    return {
      name: product.name,
      category: product.category,
      description: product.description
    };
  });

  const promptMessage = `Please search the web for current L'Oréal usage tips for these selected products and create a personalized daily routine using only them: ${JSON.stringify(selectedProductsData)}. Explain how and when to use each one together, and include any helpful links or citations.`;

  chatHistory.push({ role: "user", content: promptMessage });

  chatWindow.innerHTML = `<div class="msg ai">⏳ Searching L'Oréal tips & generating your personalized routine...</div>`;

  try {
    const { reply, citations } = await sendMessagesToAI();

    chatHistory.push({ role: "assistant", content: reply });

    chatWindow.innerHTML = "";
    chatWindow.appendChild(buildAIMessageElement(reply, citations));
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (error) {
    chatWindow.innerHTML = `<div class="msg ai">⚠️ Error generating routine. Make sure your Cloudflare Worker is updated and deployed.</div>`;
  }
});

/* Handle follow-up chat questions with full conversation context */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;

  const userDiv = document.createElement("div");
  userDiv.className = "msg user";
  userDiv.innerHTML = `<b>You:</b> `;
  userDiv.appendChild(document.createTextNode(text));
  chatWindow.appendChild(userDiv);

  chatHistory.push({ role: "user", content: text });

  userInput.value = "";
  chatWindow.scrollTop = chatWindow.scrollHeight;

  const loadingDiv = document.createElement("div");
  loadingDiv.className = "msg ai";
  loadingDiv.textContent = "⏳ Searching & thinking...";
  chatWindow.appendChild(loadingDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    const { reply, citations } = await sendMessagesToAI();
    loadingDiv.remove();

    chatHistory.push({ role: "assistant", content: reply });

    chatWindow.appendChild(buildAIMessageElement(reply, citations));
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (error) {
    loadingDiv.remove();
    const errDiv = document.createElement("div");
    errDiv.className = "msg ai";
    errDiv.textContent = "⚠️ Error connecting to worker.";
    chatWindow.appendChild(errDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
});

/* Initialize both the product grid and saved selections on page load */
renderProducts();
renderSelectedProducts();
