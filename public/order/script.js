const pageContainer =
  document.getElementById("pageContainer");

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
| GET PRODUCT ID
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
| CREATE METHOD
|--------------------------------------------------------------------------
*/

function createMethod(method) {
  const type =
    String(method || "")
      .trim()
      .toLowerCase();

  if (!type) {
    return "";
  }

  const config =
    serviceConfig[type];

  const name =
    config
      ? config.name
      : type.charAt(0).toUpperCase() +
        type.slice(1);

  return `
    <div class="method">
      <input
        type="radio"
        name="orderType"
        id="method-${escapeHTML(type)}"
        value="${escapeHTML(type)}"
      >

      <label
        class="method-label"
        for="method-${escapeHTML(type)}"
      >
        ${escapeHTML(name)}
      </label>
    </div>
  `;
}

/*
|--------------------------------------------------------------------------
| SHOW PAGE ERROR
|--------------------------------------------------------------------------
*/

function showPageError(message) {
  if (!pageContainer) {
    return;
  }

  pageContainer.innerHTML = `
    <div class="state">
      <div class="state-title">
        Gagal memuat
      </div>

      <div class="state-text">
        ${escapeHTML(message)}
      </div>
    </div>
  `;
}

/*
|--------------------------------------------------------------------------
| RENDER ORDER
|--------------------------------------------------------------------------
*/

function renderOrder(product) {
  if (!product) {
    showPageError(
      "Data product tidak ditemukan."
    );
    return;
  }

  const name =
    escapeHTML(product.name);

  const description =
    escapeHTML(product.description);

  const image =
    escapeHTML(
      product.endpoint ||
      product.image
    );

  /*
  |--------------------------------------------------------------------------
  | GET ORDER METHODS
  |--------------------------------------------------------------------------
  */

  const orderMethods =
    Array.isArray(product.orderMethods)
      ? product.orderMethods
          .map(method =>
            String(method)
              .trim()
              .toLowerCase()
          )
          .filter(Boolean)
      : [];

  /*
  |--------------------------------------------------------------------------
  | REMOVE DUPLICATE
  |--------------------------------------------------------------------------
  */

  const methods =
    [...new Set(orderMethods)];

  /*
  |--------------------------------------------------------------------------
  | NO METHOD
  |--------------------------------------------------------------------------
  */

  if (methods.length === 0) {
    showPageError(
      "Produk ini tidak memiliki metode transaksi."
    );
    return;
  }

  /*
  |--------------------------------------------------------------------------
  | CREATE METHOD HTML
  |--------------------------------------------------------------------------
  */

  const methodHTML =
    methods
      .map(createMethod)
      .join("");

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  pageContainer.innerHTML = `
    <div
      class="order-card"
      data-product-id="${escapeHTML(product.id)}"
    >

      <!-- PRODUCT -->
      <div class="product-summary">
        <div class="product-image">
          <img
            src="../${image}"
            alt="${name}"
            loading="lazy"
            onerror="
              this.onerror=null;
              this.src='/assets/favicon.jpg';
            "
          >
        </div>

        <div class="product-info">
          <div class="product-name">
            ${name}
          </div>

          <div class="product-description">
            ${
              description ||
              "Tidak ada deskripsi produk."
            }
          </div>

          <div class="product-price">
            ${formatRupiah(product.price)}
          </div>
        </div>
      </div>

      <!-- FORM -->
      <form
        id="orderForm"
        class="order-form"
      >

        <div class="form-title">
          Data Pemesanan
        </div>

        <!-- NAME -->
        <div class="form-group">
          <label
            class="form-label"
            for="custName"
          >
            Nama
          </label>

          <input
            id="custName"
            type="text"
            class="form-input"
            placeholder="Masukkan nama kamu"
            maxlength="100"
            autocomplete="name"
            required
          >
        </div>

        <!-- METHOD -->
        <div class="form-group">
          <label class="form-label">
            Metode Transaksi
          </label>

          <div class="methods">
            ${methodHTML}
          </div>
        </div>

        <!-- ERROR -->
        <div
          id="formError"
          class="error"
        ></div>

        <!-- BUTTON -->
        <button
          type="submit"
          class="order-button"
          id="orderButton"
        >
          Buat Order
        </button>
      </form>
    </div>

  `;

  /*
  |--------------------------------------------------------------------------
  | FORM EVENT
  |--------------------------------------------------------------------------
  */

  const form =
    document.getElementById(
      "orderForm"
    );

  if (!form) {
    console.error(
      "[ORDER] orderForm tidak ditemukan."
    );
    return;
  }

  form.addEventListener(
    "submit",
    event => {
      event.preventDefault();
      createOrder(
        product,
        methods
      );
    }
  );
}

/*
|--------------------------------------------------------------------------
| CREATE ORDER
|--------------------------------------------------------------------------
*/

async function createOrder(
  product,
  availableMethods
) {
  const custNameInput =
    document.getElementById(
      "custName"
    );

  const selected =
    document.querySelector(
      'input[name="orderType"]:checked'
    );

  const error =
    document.getElementById(
      "formError"
    );

  const button =
    document.getElementById(
      "orderButton"
    );

  if (
    !custNameInput ||
    !selected ||
    !error ||
    !button
  ) {
    console.error(
      "[ORDER] Element form tidak lengkap."
    );
    return;
  }

  error.textContent = "";
  error.classList.remove(
    "show"
  );

  /*
  |--------------------------------------------------------------------------
  | CUSTOMER NAME
  |--------------------------------------------------------------------------
  */

  const custName =
    custNameInput.value.trim();
  if (!custName) {
    error.textContent =
      "Nama wajib diisi.";

    error.classList.add(
      "show"
    );
    custNameInput.focus();
    return;
  }

  /*
  |--------------------------------------------------------------------------
  | ORDER TYPE
  |--------------------------------------------------------------------------
  */

  const orderType =
    selected.value
      .trim()
      .toLowerCase();

  /*
  |--------------------------------------------------------------------------
  | CLIENT-SIDE VALIDATION
  |--------------------------------------------------------------------------
  */

  if (
    !availableMethods.includes(
      orderType
    )
  ) {
    error.textContent =
      "Metode transaksi tidak tersedia untuk produk ini.";
    error.classList.add(
      "show"
    );
    return;
  }

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  button.disabled = true;
  button.textContent =
    "Membuat Order...";

  try {
    /*
    |--------------------------------------------------------------------------
    | API
    |--------------------------------------------------------------------------
    */

    const response =
      await fetch(
        "/api/order/create",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
            "Accept":
              "application/json"
          },

          body: JSON.stringify({
            productId:
              product.id,
            custName,
            orderType
          })
        }
      );

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    const result =
      await response.json();
    console.log(
      "[ORDER] API response:",
      result
    );

    /*
    |--------------------------------------------------------------------------
    | API ERROR
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
    | SUCCESS
    |--------------------------------------------------------------------------
    */

    const orderData =
      result.data;
    if (
      !orderData ||
      !orderData.hyperToken
    ) {
      throw new Error(
        "Order berhasil tetapi Hyper Token tidak diterima."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | LOCK FORM
    |--------------------------------------------------------------------------
    */

    custNameInput.disabled = true;
    document
      .querySelectorAll(
        'input[name="orderType"]'
      )
      .forEach(input => {

        input.disabled = true;

      });
    button.disabled = true;
    button.textContent =
      "Order Berhasil";

    /*
    |--------------------------------------------------------------------------
    | SHOW PROCESS POPUP
    |--------------------------------------------------------------------------
    */

    showProcessPopup(
      orderData,
      product
    );
  } catch (err) {
    console.error(
      "[ORDER] Create error:",
      err
    );

    error.textContent =
      err.message ||
      "Gagal membuat order.";

    error.classList.add(
      "show"
    );

    button.disabled = false;
    button.textContent =
      "Buat Order";
  }
}

/*
|--------------------------------------------------------------------------
| PROCESS ORDER POPUP
|--------------------------------------------------------------------------
*/

function showProcessPopup(
  data,
  product
) {
  const hyperToken =
    String(
      data?.hyperToken || ""
    ).trim();

  /*
  |--------------------------------------------------------------------------
  | TOKEN CHECK
  |--------------------------------------------------------------------------
  */

  if (!hyperToken) {
    console.error(
      "[ORDER] Hyper Token tidak tersedia."
    );
    return;
  }

  const phoneNumber =
    data?.botNumber ||
    product?.adminWhatsapp;
  if (!phoneNumber) {
    console.error(
      "[ORDER] Nomor WhatsApp admin tidak tersedia."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | REMOVE OLD POPUP
  |--------------------------------------------------------------------------
  */

  const oldPopup =
    document.getElementById(
      "processPopup"
    );
  if (oldPopup) {
    oldPopup.remove();
  }

  /*
  |--------------------------------------------------------------------------
  | CREATE POPUP
  |--------------------------------------------------------------------------
  */

  const popup =
    document.createElement(
      "div"
    );

  popup.id =
    "processPopup";

  /*
  |--------------------------------------------------------------------------
  | POPUP HTML
  |--------------------------------------------------------------------------
  */

  popup.innerHTML = `
    <div
      class="process-popup-overlay"
      id="processPopupOverlay"
    ></div>

    <div
      class="process-popup-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="processPopupTitle"
    >

      <div
        class="process-popup-title"
        id="processPopupTitle"
      >
        Order Berhasil
      </div>

      <div class="process-popup-description">
        Order kamu berhasil dibuat.
        <br><br>
        Klik tombol
        <strong>Proses Order</strong>
        di bawah untuk mengirim
        Hyper Token ke WhatsApp admin.
      </div>

      <div class="process-popup-token">
        ${escapeHTML(hyperToken)}
      </div>

      <button
        type="button"
        id="processOrderButton"
        class="process-order-button"
        ${phoneNumber ? "" : "disabled"}
      >
        Proses Order
      </button>

      <button
        type="button"
        id="closeProcessPopup"
        class="close-process-button"
      >
        Tutup
      </button>
    </div>
  `;

  document.body.appendChild(
    popup
  );

  /*
  |--------------------------------------------------------------------------
  | PROCESS BUTTON
  |--------------------------------------------------------------------------
  */

  const processButton =
    document.getElementById(
      "processOrderButton"
    );

  if (processButton) {
    processButton.addEventListener(
      "click",
      () => {
        if (!phoneNumber) {
          alert(
            "Nomor WhatsApp admin belum tersedia."
          );
          return;
        }

        /*
        |--------------------------------------------------------------------------
        | NORMALIZE PHONE
        |--------------------------------------------------------------------------
        */

        const cleanPhone =
          String(phoneNumber)
            .replace(/\D/g, "");

        if (!cleanPhone) {
          alert(
            "Nomor WhatsApp admin tidak valid."
          );
          return;
        }

        const whatsappURL =
          `https://wa.me/${cleanPhone}?text=.verif+${encodeURIComponent(
            hyperToken
          )}`;

        /*
        |--------------------------------------------------------------------------
        | REDIRECT
        |--------------------------------------------------------------------------
        */

        window.location.href =
          whatsappURL;
      }
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CLOSE BUTTON
  |--------------------------------------------------------------------------
  */

const closeButton =
  document.getElementById(
    "closeProcessPopup"
  );

if (closeButton) {
  closeButton.addEventListener(
    "click",
    () => {
      popup.remove();
      window.location.href = "/";
    }
  );
}

  /*
  |--------------------------------------------------------------------------
  | OVERLAY
  |--------------------------------------------------------------------------
  */

  const overlay =
    document.getElementById(
      "processPopupOverlay"
    );

  if (overlay) {
    overlay.addEventListener(
      "click",
      () => {
        popup.remove();
      }
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ESC KEY
  |--------------------------------------------------------------------------
  */

  document.addEventListener(
    "keydown",
    function closeWithEscape(event) {
      if (
        event.key === "Escape" &&
        document.getElementById(
          "processPopup"
        )
      ) {
        popup.remove();
        document.removeEventListener(
          "keydown",
          closeWithEscape
        );
      }
    }
  );
}

/*
|--------------------------------------------------------------------------
| LOAD PRODUCT DETAIL
|--------------------------------------------------------------------------
*/

async function loadProduct() {
  console.log(
    "[ORDER] Loading product..."
  );
  
  if (!pageContainer) {
    console.error(
      "[ORDER] #pageContainer tidak ditemukan."
    );
    return;
  }

  /*
  |--------------------------------------------------------------------------
  | PRODUCT ID
  |--------------------------------------------------------------------------
  */

  const productId =
    getProductId();

  console.log(
    "[ORDER] Product ID:",
    productId
  );


  if (!productId) {
    showPageError(
      "ID produk tidak ditemukan."
    );
    return;
  }

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  pageContainer.innerHTML = `
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
    | DETAIL API
    |--------------------------------------------------------------------------
    */

    const response =
      await fetch(
        "/api/product/detail",
        {
          method: "POST",
          credentials: "include",
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

    console.log(
      "[ORDER] Detail HTTP:",
      response.status
    );

    const result =
      await response.json();

    console.log(
      "[ORDER] Detail API:",
      result
    );

    /*
    |--------------------------------------------------------------------------
    | API ERROR
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

    renderOrder(
      result.data
    );
  } catch (error) {
    console.error(
      "[ORDER] Load error:",
      error
    );

    showPageError(
      error.message ||
      "Gagal memuat product."
    );
  }
}

/*
|--------------------------------------------------------------------------
| START
|--------------------------------------------------------------------------
*/

loadProduct();