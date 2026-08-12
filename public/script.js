const productsContainer = document.querySelector(".products");


/*
|--------------------------------------------------------------------------
| SERVICE CONFIG
|--------------------------------------------------------------------------
*/

const serviceConfig = {
  whatsapp: {
    name: "WhatsApp"
  },

  qris: {
    name: "QRIS"
  },

  telegram: {
    name: "Telegram"
  }
};


/*
|--------------------------------------------------------------------------
| FORMAT RUPIAH
|--------------------------------------------------------------------------
*/

function formatRupiah(value) {

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);

}


/*
|--------------------------------------------------------------------------
| ESCAPE HTML
|--------------------------------------------------------------------------
| Mencegah nama/deskripsi dari API langsung dianggap sebagai HTML.
*/

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/*
|--------------------------------------------------------------------------
| CREATE SERVICE LABEL
|--------------------------------------------------------------------------
*/

function createService(service) {

  const type = String(service || "").toLowerCase();

  const config = serviceConfig[type];

  if (!config) {
    return "";
  }

  return `
    <span class="service ${type}">
      ${config.name}
    </span>
  `;

}


/*
|--------------------------------------------------------------------------
| CREATE PRODUCT CARD
|--------------------------------------------------------------------------
*/

function createProduct(product) {

  const name = escapeHTML(product.name);
  const description = escapeHTML(product.description);
  const image = escapeHTML(product.endpoint || product.image);
  const price = formatRupiah(product.price);
  const productId = escapeHTML(product.id);

  const orderMethods = Array.isArray(product.orderMethods)
    ? product.orderMethods
    : [];

  const services = orderMethods
    .map(createService)
    .join("");

  return `
    <div
      class="product"
      data-product-id="${productId}"
      onclick="window.location.href='/detail/index.html?id=${productId}'"
    >

      <div class="product-image">
        <img
          src="${image}"
          alt="${name}"
          loading="lazy"
          onerror="this.onerror=null; this.src='/assets/favicon.jpg';"
        >
      </div>

      <div class="product-content">
        <div class="product-name">
          ${name}
        </div>

        <div class="product-description">
          ${description}
        </div>

        <div class="price">
          ${price}
        </div>

        <div class="services">
          ${services}
        </div>
      </div>

    </div>
  `;
}


/*
|--------------------------------------------------------------------------
| RENDER PRODUCTS
|--------------------------------------------------------------------------
*/

function renderProducts(products) {

  if (!productsContainer) {
    console.error("Element .products tidak ditemukan.");
    return;
  }

  if (!Array.isArray(products) || products.length === 0) {

    productsContainer.innerHTML = `
      <div class="empty">
        Belum ada produk.
      </div>
    `;

    return;
  }

  productsContainer.innerHTML = products
    .map(createProduct)
    .join("");

}


/*
|--------------------------------------------------------------------------
| LOAD PRODUCTS
|--------------------------------------------------------------------------
*/

async function loadProducts() {

  if (!productsContainer) {
    console.error("Element .products tidak ditemukan.");
    return;
  }

  productsContainer.innerHTML = `
    <div class="empty">
      Memuat produk...
    </div>
  `;

  try {

    const response = await fetch("/api/product", {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });


    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }


    const result = await response.json();


    if (!result.status) {
      throw new Error(
        "API mengembalikan status false."
      );
    }


    renderProducts(result.data);

  } catch (error) {

    console.error(
      "Gagal mengambil produk:",
      error
    );

    productsContainer.innerHTML = `
      <div class="empty">
        Gagal memuat produk.
        <br>
        <small>
          Silakan coba lagi nanti.
        </small>
      </div>
    `;

  }

}


/*
|--------------------------------------------------------------------------
| START
|--------------------------------------------------------------------------
*/

loadProducts();
