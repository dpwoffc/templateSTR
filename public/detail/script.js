const productContainer =
  document.getElementById("productContainer");


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
| SERVICE LABEL
|--------------------------------------------------------------------------
*/

function createService(service) {
  const type =
    String(service || "").toLowerCase();

  const config =
    serviceConfig[type];

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
| GET PRODUCT ID FROM URL
|--------------------------------------------------------------------------
*/

function getProductId() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  return params.get("id");
}


/*
|--------------------------------------------------------------------------
| RENDER PRODUCT
|--------------------------------------------------------------------------
*/

function renderProduct(product) {

  if (!product) {
    productContainer.innerHTML = `
      <div class="state">
        <div class="state-title">
          Produk tidak ditemukan
        </div>

        <div class="state-text">
          Data produk tidak tersedia.
        </div>
      </div>
    `;

    return;
  }


  const name =
    escapeHTML(product.name);

  const description =
    escapeHTML(product.description);

  const image =
    escapeHTML(
      product.endpoint ||
      product.image ||
      ""
    );


  const services =
    Array.isArray(product.orderMethods)
      ? product.orderMethods
          .map(createService)
          .join("")
      : "";


  /*
  |--------------------------------------------------------------------------
  | DETAIL CARD
  |--------------------------------------------------------------------------
  |
  | PENTING:
  | Semua bagian detail sekarang berada di dalam
  | .product-detail.
  |
  */

  productContainer.innerHTML = `
    <div class="product-detail">

      <div class="detail-image">

        <img
          src=".${image}"
          alt="${name}"
          onerror="
            this.onerror=null;
            this.src='/assets/favicon.jpg';
          "
        >

      </div>


      <div class="detail-content">

        <div class="detail-name">
          ${name}
        </div>


        <div class="detail-price">
          ${formatRupiah(product.price)}
        </div>


        ${
          services
            ? `
              <div class="services">
                ${services}
              </div>
            `
            : ""
        }


        <div class="description-title">
          Deskripsi
        </div>


        <div class="description">
          ${
            description ||
            "Tidak ada deskripsi produk."
          }
        </div>


        <div class="order-area">

          <button
            type="button"
            class="order-button"
            id="orderButton"
          >
            Order
          </button>

        </div>

      </div>

    </div>
  `;


  /*
  |--------------------------------------------------------------------------
  | ORDER BUTTON
  |--------------------------------------------------------------------------
  */

  const orderButton =
    document.getElementById(
      "orderButton"
    );


  if (!orderButton) {

    console.error(
      "Tombol order tidak ditemukan."
    );

    return;
  }


  orderButton.addEventListener(
    "click",
    () => {
      orderProduct(product);
    }
  );
}


/*
|--------------------------------------------------------------------------
| ORDER PRODUCT
|--------------------------------------------------------------------------
*/

function orderProduct(product) {

  if (
    !product ||
    !product.id
  ) {

    console.error(
      "ID product tidak tersedia.",
      product
    );

    return;
  }


  const productId =
    encodeURIComponent(
      product.id
    );


  window.location.href =
    `/order/?id=${productId}`;
}


/*
|--------------------------------------------------------------------------
| LOAD PRODUCT DETAIL
|--------------------------------------------------------------------------
*/

async function loadProductDetail() {

  const productId =
    getProductId();


  /*
  |--------------------------------------------------------------------------
  | VALIDATE ID
  |--------------------------------------------------------------------------
  */

  if (!productId) {

    productContainer.innerHTML = `
      <div class="state">

        <div class="state-title">
          Produk tidak ditemukan
        </div>

        <div class="state-text">
          ID produk tidak tersedia pada URL.
        </div>

      </div>
    `;

    return;
  }


  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  productContainer.innerHTML = `
    <div class="state">

      <div class="state-title">
        Memuat produk...
      </div>

      <div class="state-text">
        Mohon tunggu sebentar.
      </div>

    </div>
  `;


  try {

    /*
    |--------------------------------------------------------------------------
    | REQUEST DETAIL
    |--------------------------------------------------------------------------
    */

    const response =
      await fetch(
        "/api/product/detail",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Accept":
              "application/json"
          },

          body: JSON.stringify({
            id: productId
          })
        }
      );


    /*
    |--------------------------------------------------------------------------
    | PARSE RESPONSE
    |--------------------------------------------------------------------------
    */

    const result =
      await response.json();


    /*
    |--------------------------------------------------------------------------
    | HANDLE ERROR API
    |--------------------------------------------------------------------------
    */

    if (
      !response.ok ||
      !result.status
    ) {

      throw new Error(
        result.message ||
        `HTTP ${response.status}`
      );
    }


    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    renderProduct(
      result.data
    );


  } catch (error) {

    console.error(
      "Gagal memuat detail product:",
      error
    );


    productContainer.innerHTML = `
      <div class="state">

        <div class="state-title">
          Gagal memuat produk
        </div>

        <div class="state-text">
          ${
            escapeHTML(
              error.message
            ) ||
            "Terjadi kesalahan."
          }
        </div>

      </div>
    `;
  }
}


/*
|--------------------------------------------------------------------------
| START
|--------------------------------------------------------------------------
*/

loadProductDetail();
