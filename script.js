document.addEventListener("DOMContentLoaded", function () {
    const navbar = document.getElementById("siteNavbar");

    function handleNavbarScroll() {
        if (!navbar) return;

        if (window.scrollY > 20) {
            navbar.classList.add("navbar-scrolled");
        } else {
            navbar.classList.remove("navbar-scrolled");
        }
    }

    handleNavbarScroll();
    window.addEventListener("scroll", handleNavbarScroll);
});
const WHATSAPP_NUMBER = "919395045293";
const CART_STORAGE_KEY = "sanghamitraCart";
const CUSTOMER_STORAGE_KEY = "sanghamitraCustomer";
const CUSTOMER_COOKIE_KEY = "sanghamitraCustomer";
const CUSTOMER_COOKIE_DAYS = 30;

let cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];

const DOM = {
    productsGrid: document.getElementById("products-grid"),
    cartModal: document.getElementById("cart-modal"),
    cartItems: document.getElementById("cart-items"),
    cartTotal: document.getElementById("cart-total"),
    cartCount: document.getElementById("cart-count"),
    checkoutModal: document.getElementById("checkout-modal"),
    checkoutForm: document.getElementById("checkout-form"),
    checkoutName: document.getElementById("checkout-name"),
    checkoutPhone: document.getElementById("checkout-phone"),
    checkoutAddress: document.getElementById("checkout-address"),
    checkoutNameErr: document.getElementById("checkout-name-error"),
    checkoutPhoneErr: document.getElementById("checkout-phone-error"),
    checkoutAddrErr: document.getElementById("checkout-address-error"),
    submitOrderBtn: document.getElementById("submit-order-btn"),
    cartCheckoutBtn: document.getElementById("cart-checkout-btn"),
    cartCheckoutLabel: document.getElementById("cart-checkout-label"),
    cartCheckoutHint: document.getElementById("cart-checkout-hint"),
    whatsappFloatBtn: document.getElementById("whatsapp-float"),
    mobileOrderBar: document.getElementById("mobile-order-bar"),
    mobileOrderCount: document.getElementById("mobile-order-count"),
    mobileOrderTotal: document.getElementById("mobile-order-total"),
};

const products = [
    { id: 1, name: "Fresh Cow Milk", price: 60, unit: "litre", img: "https://iili.io/qWUBRII.md.png", desc: "Pure, unadulterated milk collected daily" },
    { id: 2, name: "Traditional Desi Ghee", price: 650, unit: "kg", img: "https://iili.io/qWS5Dtj.md.jpg", desc: "Hand-churned A2 ghee" },
    { id: 3, name: "Fresh Paneer", price: 420, unit: "kg", img: "https://iili.io/qWS5vus.md.jpg", desc: "Soft, creamy homemade paneer" },
    { id: 4, name: "Natural Curd", price: 120, unit: "kg", img: "https://iili.io/qWS5Dtj.md.jpg", desc: "Thick probiotic-rich curd" },
];

function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
    const prefix = `${name}=`;
    const found = document.cookie.split(";").map(part => part.trim()).find(part => part.startsWith(prefix));
    if (!found) return "";
    return decodeURIComponent(found.slice(prefix.length));
}

function readCustomerData() {
    const localRaw = localStorage.getItem(CUSTOMER_STORAGE_KEY);
    if (localRaw) {
        try {
            return JSON.parse(localRaw);
        } catch (_error) {
            return null;
        }
    }

    const cookieRaw = getCookie(CUSTOMER_COOKIE_KEY);
    if (!cookieRaw) return null;
    try {
        return JSON.parse(cookieRaw);
    } catch (_error) {
        return null;
    }
}

function writeCustomerData(payload) {
    const safePayload = {
        name: String(payload.name || "").trim(),
        phone: String(payload.phone || "").trim(),
        address: String(payload.address || "").trim(),
    };

    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(safePayload));
    setCookie(CUSTOMER_COOKIE_KEY, JSON.stringify(safePayload), CUSTOMER_COOKIE_DAYS);
}

function prefillCheckoutForm() {
    const existing = readCustomerData();
    if (!existing) return;

    if (DOM.checkoutName && !DOM.checkoutName.value.trim()) {
        DOM.checkoutName.value = existing.name || "";
    }
    if (DOM.checkoutPhone && !DOM.checkoutPhone.value.trim()) {
        DOM.checkoutPhone.value = existing.phone || "";
    }
    if (DOM.checkoutAddress && !DOM.checkoutAddress.value.trim()) {
        DOM.checkoutAddress.value = existing.address || "";
    }
}

function getCartItem(id) {
    return cart.find(item => item.id === id);
}

function getCartQty(id) {
    const item = getCartItem(id);
    return item ? item.qty : 0;
}

function getCartTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function updateCartCount() {
    if (!DOM.cartCount) return;
    DOM.cartCount.textContent = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
}

function updateCheckoutCTA() {
    if (!DOM.cartCheckoutBtn) return;

    const total = getCartTotal();
    const isEmpty = cart.length === 0;

    DOM.cartCheckoutBtn.disabled = isEmpty;
    if (DOM.cartCheckoutLabel) DOM.cartCheckoutLabel.textContent = isEmpty ? "Add product to order" : "Order on WhatsApp";
    if (DOM.cartCheckoutHint) {
        DOM.cartCheckoutHint.textContent = isEmpty
            ? "Your order is empty. Add products to continue."
            : `Ready to order: Rs ${total}`;
    }
}

function updateMobileOrderBar() {
    if (!DOM.mobileOrderBar) return;

    const itemCount = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
    const total = getCartTotal();
    const hasItems = itemCount > 0;

    if (DOM.mobileOrderCount) {
        DOM.mobileOrderCount.textContent = `${itemCount} ${itemCount === 1 ? "item" : "items"}`;
    }
    if (DOM.mobileOrderTotal) {
        DOM.mobileOrderTotal.textContent = `Rs ${total}`;
    }

    DOM.mobileOrderBar.classList.toggle("hidden", !hasItems);
    document.body.classList.toggle("has-mobile-order-bar", hasItems);

    if (DOM.whatsappFloatBtn) {
        DOM.whatsappFloatBtn.classList.toggle("support-hide-mobile", hasItems);
        DOM.whatsappFloatBtn.classList.toggle("support-deemphasis", hasItems);
    }
}

function renderProducts() {
    if (!DOM.productsGrid) return;

    DOM.productsGrid.innerHTML = products.map(product => {
        const qty = getCartQty(product.id);
        let controlHtml = "";

        if (qty <= 0) {
            controlHtml = `
                <button onclick="addToCart(${product.id})"
                        class="mt-6 w-full text-white py-4 rounded-2xl font-medium flex items-center justify-center gap-2 transition duration-200 btn-brand">
                    <i class="fa-solid fa-cart-plus"></i> ADD TO ORDER
                </button>
            `;
        } else {
            controlHtml = `
                <div class="mt-6 w-full flex items-center justify-between rounded-2xl overflow-hidden shadow-sm"
                     style="background: rgba(0,173,239,0.1); border: 1px solid rgba(0,173,239,0.35);">
                    <button onclick="changeQtyById(${product.id}, -1)"
                            class="w-12 h-12 flex items-center justify-center transition duration-150 font-bold text-xl"
                            style="color: rgba(0,120,180,1);">
                        -
                    </button>
                    <span class="font-semibold text-lg min-w-[40px] text-center" style="color: rgba(0,100,160,1);">
                        ${qty}
                    </span>
                    <button onclick="changeQtyById(${product.id}, 1)"
                            class="w-12 h-12 flex items-center justify-center transition duration-150 font-bold text-xl"
                            style="color: rgba(0,120,180,1);">
                        +
                    </button>
                </div>
            `;
        }

        return `
            <div class="rounded-3xl overflow-hidden card-hover shadow-md" style="background: rgba(0,173,239,0.07);">
                <img src="${product.img}" alt="${product.name}" class="w-full h-56 object-cover" loading="lazy">
                <div class="p-6">
                    <h3 class="text-2xl font-semibold text-gray-800">${product.name}</h3>
                    <p class="font-medium mt-1" style="color: rgba(0,140,200,1);">Rs ${product.price} / ${product.unit}</p>
                    <p class="mt-3 text-sm text-gray-600">${product.desc}</p>
                    ${controlHtml}
                </div>
            </div>
        `;
    }).join("");
}

function renderCart() {
    if (!DOM.cartItems) return;

    if (cart.length === 0) {
        DOM.cartItems.innerHTML = '<p class="text-center text-gray-500 py-12">Your order is empty.<br>Add fresh dairy products.</p>';
        DOM.cartTotal.textContent = "Rs 0";
        updateCheckoutCTA();
        updateMobileOrderBar();
        return;
    }

    let html = "";
    let total = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;

        html += `
            <div class="flex gap-4 border-b pb-6 last:border-b-0">
                <img src="${item.img}" alt="${item.name}" class="w-20 h-20 object-cover rounded-2xl" loading="lazy">
                <div class="flex-1">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="font-medium">${item.name}</h4>
                            <p class="text-xs text-gray-500">Rs ${item.price} x ${item.qty} ${item.unit}</p>
                        </div>
                        <button onclick="removeFromCart(${index})" class="text-red-600 hover:text-red-800 text-xl" aria-label="Remove ${item.name}">
                            &times;
                        </button>
                    </div>
                    <div class="flex items-center gap-3 mt-3">
                        <button onclick="changeQty(${index}, -1)" class="w-9 h-9 border rounded-lg hover:bg-gray-100">-</button>
                        <span class="font-semibold w-8 text-center">${item.qty}</span>
                        <button onclick="changeQty(${index}, 1)" class="w-9 h-9 border rounded-lg hover:bg-gray-100">+</button>
                    </div>
                </div>
                <div class="font-medium text-right">Rs ${itemTotal}</div>
            </div>
        `;
    });

    DOM.cartItems.innerHTML = html;
    DOM.cartTotal.textContent = `Rs ${total}`;
    updateCheckoutCTA();
    updateMobileOrderBar();
}

function changeQtyById(id, delta) {
    let itemIndex = cart.findIndex(item => item.id === id);

    if (itemIndex === -1 && delta > 0) {
        const product = products.find(p => p.id === id);
        if (product) {
            cart.push({ ...product, qty: 1 });
            itemIndex = cart.length - 1;
        }
    }

    if (itemIndex !== -1) {
        const newQty = cart[itemIndex].qty + delta;
        if (newQty <= 0) {
            cart.splice(itemIndex, 1);
        } else {
            cart[itemIndex].qty = newQty;
        }
    }

    saveCart();
    updateCartCount();
    renderCart();
    renderProducts();
}

function changeQty(index, delta) {
    if (!cart[index]) return;
    cart[index].qty = Math.max(1, cart[index].qty + delta);
    saveCart();
    renderCart();
    updateCartCount();
    renderProducts();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCart();
    updateCartCount();
    renderProducts();
}

function addToCart(id) {
    const product = products.find(item => item.id === id);
    if (!product) return;

    const existingIndex = cart.findIndex(item => item.id === id);
    if (existingIndex !== -1) {
        cart[existingIndex].qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    saveCart();
    updateCartCount();
    renderCart();
    renderProducts();
    showToast(`${product.name} added to your order`);
}

function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "fixed bottom-8 left-1/2 -translate-x-1/2 text-white px-6 py-3 rounded-2xl shadow-2xl z-[9999]";
    toast.style.background = "rgba(0,140,200,1)";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2200);
}

function toggleCart() {
    if (!DOM.cartModal) return;
    DOM.cartModal.classList.toggle("hidden");
    document.body.classList.toggle("no-scroll", !DOM.cartModal.classList.contains("hidden"));
    if (!DOM.cartModal.classList.contains("hidden")) renderCart();
}

function openCheckoutModal() {
    if (cart.length === 0) {
        showToast("Your order is empty");
        return;
    }

    if (!DOM.checkoutModal) return;
    prefillCheckoutForm();
    DOM.checkoutModal.classList.remove("hidden");
    document.body.classList.add("no-scroll");
    DOM.checkoutName?.focus();
}

function closeCheckoutModal() {
    if (!DOM.checkoutModal) return;
    DOM.checkoutModal.classList.add("hidden");
    if (DOM.cartModal?.classList.contains("hidden")) {
        document.body.classList.remove("no-scroll");
    }
    [DOM.checkoutNameErr, DOM.checkoutPhoneErr, DOM.checkoutAddrErr].forEach(el => el?.classList.add("hidden"));
}

function checkoutViaWhatsApp() {
    openCheckoutModal();
}

function validateCheckout(name, phone, address) {
    let valid = true;
    [DOM.checkoutNameErr, DOM.checkoutPhoneErr, DOM.checkoutAddrErr].forEach(el => el?.classList.add("hidden"));

    const nameRegex = /^[a-zA-Z\u0900-\u097F]+([\s][a-zA-Z\u0900-\u097F]+)+$/;
    if (name.length < 5 || !nameRegex.test(name)) {
        DOM.checkoutNameErr.textContent = "Please enter your full name (letters and spaces only)";
        DOM.checkoutNameErr.classList.remove("hidden");
        valid = false;
    }

    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 12) {
        DOM.checkoutPhoneErr.textContent = "Enter a valid 10-digit phone number";
        DOM.checkoutPhoneErr.classList.remove("hidden");
        valid = false;
    }

    if (address.length < 15) {
        DOM.checkoutAddrErr.textContent = "Please provide complete address with pincode";
        DOM.checkoutAddrErr.classList.remove("hidden");
        valid = false;
    }

    return valid;
}

function createOrderMessage(name, phone, address) {
    let message = "*Sanghamitra Order*%0A%0A";
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        message += `- ${item.name} x ${item.qty} ${item.unit} = Rs ${itemTotal}%0A`;
    });

    message += `%0A*Total:* Rs ${total}%0A%0A`;
    message += `*Customer Details*%0AName: ${name}%0APhone: ${phone}%0AAddress:%0A${address}%0A%0A`;
    message += "Please confirm order and share delivery slot.";

    return message;
}

function sendOrderToWhatsApp(event) {
    event.preventDefault();

    const name = DOM.checkoutName?.value.trim() || "";
    const phone = DOM.checkoutPhone?.value.trim() || "";
    const address = DOM.checkoutAddress?.value.trim() || "";

    if (!validateCheckout(name, phone, address)) return;

    writeCustomerData({ name, phone, address });

    if (DOM.submitOrderBtn) {
        DOM.submitOrderBtn.classList.add("loading");
        DOM.submitOrderBtn.disabled = true;
        DOM.submitOrderBtn.innerHTML = '<i class="fa-brands fa-whatsapp text-2xl"></i> Opening WhatsApp...';
    }

    const message = createOrderMessage(name, phone, address);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

    setTimeout(() => {
        window.open(whatsappUrl, "_blank");

        setTimeout(() => {
            if (DOM.submitOrderBtn) {
                DOM.submitOrderBtn.classList.remove("loading");
                DOM.submitOrderBtn.disabled = false;
                DOM.submitOrderBtn.innerHTML = '<i class="fa-brands fa-whatsapp text-2xl"></i> Order on WhatsApp';
            }
            closeCheckoutModal();
            if (DOM.cartModal && !DOM.cartModal.classList.contains("hidden")) {
                toggleCart();
            }
            showToast("Order sent on WhatsApp");
        }, 500);
    }, 250);
}

function openWhatsAppSupport() {
    const message = encodeURIComponent("Hello Sanghamitra team, I need help with my order.");
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
}

function bindPrefillAutoSave() {
    const persist = () => {
        writeCustomerData({
            name: DOM.checkoutName?.value || "",
            phone: DOM.checkoutPhone?.value || "",
            address: DOM.checkoutAddress?.value || "",
        });
    };

    [DOM.checkoutName, DOM.checkoutPhone, DOM.checkoutAddress].forEach(field => {
        field?.addEventListener("blur", persist);
    });

    DOM.checkoutPhone?.addEventListener("input", () => {
        DOM.checkoutPhone.value = DOM.checkoutPhone.value.replace(/[^\d+]/g, "").slice(0, 13);
    });
}

function toggleMobileMenu() {
    document.getElementById("mobileMenu")?.classList.toggle("hidden");
}

window.addEventListener("load", () => {
    renderProducts();
    renderCart();
    updateCartCount();
    prefillCheckoutForm();
    bindPrefillAutoSave();

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", event => {
            const target = anchor.getAttribute("href");
            if (!target || target === "#") return;

            const node = document.querySelector(target);
            if (!node) return;

            event.preventDefault();
            node.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });

    DOM.cartModal?.addEventListener("click", event => {
        if (event.target === DOM.cartModal) toggleCart();
    });

    DOM.checkoutModal?.addEventListener("click", event => {
        if (event.target === DOM.checkoutModal) closeCheckoutModal();
    });

    DOM.checkoutForm?.addEventListener("submit", sendOrderToWhatsApp);
    DOM.whatsappFloatBtn?.addEventListener("click", openWhatsAppSupport);
    window.addEventListener("resize", updateMobileOrderBar);

    document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;

        if (!DOM.checkoutModal?.classList.contains("hidden")) {
            closeCheckoutModal();
            return;
        }

        if (!DOM.cartModal?.classList.contains("hidden")) {
            toggleCart();
        }
    });

    updateMobileOrderBar();
});
