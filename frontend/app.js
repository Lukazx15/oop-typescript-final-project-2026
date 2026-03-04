const API = '';

const state = {
  products: [],
  customers: [],
  orders: [],
};

const els = {
  apiStatus: document.getElementById('apiStatus'),
  toast: document.getElementById('toast'),
  statsCards: document.getElementById('statsCards'),
  refreshAllBtn: document.getElementById('refreshAllBtn'),
  ordersList: document.getElementById('ordersList'),
  productsTable: document.getElementById('productsTable'),
  customersTable: document.getElementById('customersTable'),
  customerHistory: document.getElementById('customerHistory'),
  insightsTopBuyers: document.getElementById('insightsTopBuyers'),
  insightsTopProducts: document.getElementById('insightsTopProducts'),

  orderForm: document.getElementById('createOrderForm'),
  orderCustomerId: document.getElementById('orderCustomerId'),
  orderProductId: document.getElementById('orderProductId'),
  orderQuantity: document.getElementById('orderQuantity'),
  orderPaymentMethod: document.getElementById('orderPaymentMethod'),
  orderAddress: document.getElementById('orderAddress'),
  orderNote: document.getElementById('orderNote'),

  historyCustomerSelect: document.getElementById('historyCustomerSelect'),
  loadHistoryBtn: document.getElementById('loadHistoryBtn'),

  productForm: document.getElementById('productForm'),
  productId: document.getElementById('productId'),
  productName: document.getElementById('productName'),
  productDescription: document.getElementById('productDescription'),
  productPrice: document.getElementById('productPrice'),
  productStock: document.getElementById('productStock'),
  productSku: document.getElementById('productSku'),
  productCategory: document.getElementById('productCategory'),
  productBrand: document.getElementById('productBrand'),
  productImage: document.getElementById('productImage'),
  productStatus: document.getElementById('productStatus'),
  resetProductFormBtn: document.getElementById('resetProductFormBtn'),

  customerForm: document.getElementById('customerForm'),
  customerId: document.getElementById('customerId'),
  customerName: document.getElementById('customerName'),
  customerEmail: document.getElementById('customerEmail'),
  customerPhone: document.getElementById('customerPhone'),
  customerAddress: document.getElementById('customerAddress'),
  customerStatus: document.getElementById('customerStatus'),
  resetCustomerFormBtn: document.getElementById('resetCustomerFormBtn'),
};

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(body.message)
      ? body.message.join(', ')
      : body.message || 'Request failed';
    throw new Error(message);
  }

  return body.data;
}

function showToast(message, isError = false) {
  els.toast.textContent = message;
  els.toast.style.background = isError ? '#991b1b' : '#0f172a';
  els.toast.classList.add('show');
  setTimeout(() => els.toast.classList.remove('show'), 2200);
}

function setStatus(ok) {
  els.apiStatus.textContent = ok ? 'API: online' : 'API: unavailable';
  els.apiStatus.style.color = ok ? '#166534' : '#991b1b';
}

function renderStats() {
  const totalRevenue = state.orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const html = [
    ['Products', state.products.length],
    ['Customers', state.customers.length],
    ['Orders', state.orders.length],
    ['Total Revenue', `${totalRevenue.toLocaleString()} THB`],
  ]
    .map(
      ([name, value]) => `<article class="stat"><p>${name}</p><div class="value">${value}</div></article>`,
    )
    .join('');

  els.statsCards.innerHTML = html;
}

function customerName(customerId) {
  return state.customers.find((customer) => customer.id === customerId)?.fullName || customerId;
}

function productName(productId) {
  return state.products.find((product) => product.id === productId)?.name || productId;
}

function renderOrdersList() {
  const sorted = [...state.orders].sort((a, b) => b.placedAt.localeCompare(a.placedAt));
  els.ordersList.innerHTML = sorted
    .map((order) => {
      const actions = ['PENDING', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED']
        .map(
          (status) =>
            `<option value="${status}" ${status === order.status ? 'selected' : ''}>${status}</option>`,
        )
        .join('');

      return `
      <article class="list-item">
        <h3>${order.id.slice(0, 8)} • ${customerName(order.customerId)}</h3>
        <p class="meta">${new Date(order.placedAt).toLocaleString()} • ${order.totalAmount} THB</p>
        <p class="meta">${order.items.map((item) => `${item.productName} x${item.quantity}`).join(', ')}</p>
        <div class="button-row" style="margin-top:8px;">
          <select data-order-status="${order.id}">${actions}</select>
          <input placeholder="tracking" value="${order.trackingNumber || ''}" data-order-tracking="${order.id}" />
          <button class="btn ghost" data-order-update="${order.id}">Update</button>
        </div>
      </article>`;
    })
    .join('');
}

function renderProductsTable() {
  const rows = state.products
    .map(
      (product) => `
    <tr>
      <td>${product.name}</td>
      <td>${product.price}</td>
      <td>${product.stockQuantity}</td>
      <td>${product.sku}</td>
      <td>${product.category}</td>
      <td><span class="pill ${product.status === 'ACTIVE' ? 'good' : 'bad'}">${product.status}</span></td>
      <td>
        <button class="btn ghost" data-product-edit="${product.id}">Edit</button>
        <button class="btn ghost" data-product-delete="${product.id}">Delete</button>
      </td>
    </tr>`,
    )
    .join('');

  els.productsTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Name</th><th>Price</th><th>Stock</th><th>SKU</th><th>Category</th><th>Status</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderCustomersTable() {
  const rows = state.customers
    .map(
      (customer) => `
    <tr>
      <td>${customer.fullName}</td>
      <td>${customer.email}</td>
      <td>${customer.phone}</td>
      <td><span class="pill ${customer.status === 'ACTIVE' ? 'good' : 'bad'}">${customer.status}</span></td>
      <td>
        <button class="btn ghost" data-customer-edit="${customer.id}">Edit</button>
        <button class="btn ghost" data-customer-delete="${customer.id}">Delete</button>
      </td>
    </tr>`,
    )
    .join('');

  els.customersTable.innerHTML = `
    <table>
      <thead>
        <tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Actions</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderSelects() {
  const customerOptions = state.customers
    .map((customer) => `<option value="${customer.id}">${customer.fullName} (${customer.id})</option>`)
    .join('');
  const productOptions = state.products
    .map((product) => `<option value="${product.id}">${product.name} • stock ${product.stockQuantity}</option>`)
    .join('');

  els.orderCustomerId.innerHTML = customerOptions;
  els.historyCustomerSelect.innerHTML = customerOptions;
  els.orderProductId.innerHTML = productOptions;
}

async function renderInsights() {
  const [buyers, products] = await Promise.all([
    api('/customer/insights/top-buyers?limit=5'),
    api('/products/insights/most-bought?limit=5'),
  ]);

  els.insightsTopBuyers.innerHTML = `<h3>Top Buyers</h3>${buyers
    .map(
      (buyer) =>
        `<div>${buyer.fullName} • ${buyer.totalSpent.toLocaleString()} THB • ${buyer.orderCount} orders</div>`,
    )
    .join('') || '<div>No data</div>'}`;

  els.insightsTopProducts.innerHTML = `<h3>Top Products</h3>${products
    .map(
      (product) =>
        `<div>${product.productName} • ${product.totalQuantity} sold • ${product.buyerCount} buyers</div>`,
    )
    .join('') || '<div>No data</div>'}`;
}

async function refreshAll() {
  try {
    const [products, customers, orders] = await Promise.all([
      api('/products'),
      api('/customer'),
      api('/orders'),
    ]);

    state.products = products;
    state.customers = customers;
    state.orders = orders;

    renderStats();
    renderOrdersList();
    renderProductsTable();
    renderCustomersTable();
    renderSelects();
    await renderInsights();
    setStatus(true);
  } catch (error) {
    setStatus(false);
    showToast(error.message, true);
  }
}

async function loadCustomerHistory() {
  const customerId = els.historyCustomerSelect.value;
  if (!customerId) {
    return;
  }

  try {
    const history = await api(`/customer/${customerId}/orders`);
    const productRows = history.summary.products
      .map(
        (row) => `<li>${row.productName} • qty ${row.totalQuantity} • ${row.totalSpent} THB</li>`,
      )
      .join('');

    els.customerHistory.innerHTML = `
      <div><strong>${history.customer.fullName}</strong> • ${history.customer.email}</div>
      <div>Orders: ${history.summary.totalOrders} • Total: ${history.summary.totalSpent.toLocaleString()} THB</div>
      <ul>${productRows || '<li>No products</li>'}</ul>
    `;
  } catch (error) {
    showToast(error.message, true);
  }
}

function resetProductForm() {
  els.productForm.reset();
  els.productId.value = '';
}

function resetCustomerForm() {
  els.customerForm.reset();
  els.customerId.value = '';
}

async function onCreateOrder(event) {
  event.preventDefault();
  const payload = {
    customerId: els.orderCustomerId.value,
    items: [
      {
        productId: els.orderProductId.value,
        quantity: Number(els.orderQuantity.value),
      },
    ],
    paymentMethod: els.orderPaymentMethod.value,
    shippingAddress: els.orderAddress.value,
    note: els.orderNote.value || undefined,
  };

  try {
    await api('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    showToast('Order created');
    await refreshAll();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function onSaveProduct(event) {
  event.preventDefault();
  const payload = {
    name: els.productName.value,
    description: els.productDescription.value,
    price: Number(els.productPrice.value),
    stockQuantity: Number(els.productStock.value),
    sku: els.productSku.value,
    category: els.productCategory.value,
    brand: els.productBrand.value,
    images: [els.productImage.value],
    status: els.productStatus.value,
  };

  const id = els.productId.value;

  try {
    if (id) {
      await api(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      showToast('Product updated');
    } else {
      await api('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showToast('Product created');
    }
    resetProductForm();
    await refreshAll();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function onSaveCustomer(event) {
  event.preventDefault();
  const payload = {
    fullName: els.customerName.value,
    email: els.customerEmail.value,
    phone: els.customerPhone.value,
    address: els.customerAddress.value,
    status: els.customerStatus.value,
  };

  const id = els.customerId.value;

  try {
    if (id) {
      await api(`/customer/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      showToast('Customer updated');
    } else {
      await api('/customer', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showToast('Customer created');
    }
    resetCustomerForm();
    await refreshAll();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function onClickActions(event) {
  const productEditId = event.target.dataset.productEdit;
  const productDeleteId = event.target.dataset.productDelete;
  const customerEditId = event.target.dataset.customerEdit;
  const customerDeleteId = event.target.dataset.customerDelete;
  const orderUpdateId = event.target.dataset.orderUpdate;

  try {
    if (productEditId) {
      const product = state.products.find((item) => item.id === productEditId);
      if (!product) return;
      els.productId.value = product.id;
      els.productName.value = product.name;
      els.productDescription.value = product.description;
      els.productPrice.value = product.price;
      els.productStock.value = product.stockQuantity;
      els.productSku.value = product.sku;
      els.productCategory.value = product.category;
      els.productBrand.value = product.brand;
      els.productImage.value = product.images[0] || '';
      els.productStatus.value = product.status;
      return;
    }

    if (productDeleteId) {
      await api(`/products/${productDeleteId}`, { method: 'DELETE' });
      showToast('Product deleted');
      await refreshAll();
      return;
    }

    if (customerEditId) {
      const customer = state.customers.find((item) => item.id === customerEditId);
      if (!customer) return;
      els.customerId.value = customer.id;
      els.customerName.value = customer.fullName;
      els.customerEmail.value = customer.email;
      els.customerPhone.value = customer.phone;
      els.customerAddress.value = customer.address;
      els.customerStatus.value = customer.status;
      return;
    }

    if (customerDeleteId) {
      await api(`/customer/${customerDeleteId}`, { method: 'DELETE' });
      showToast('Customer deleted');
      await refreshAll();
      return;
    }

    if (orderUpdateId) {
      const statusEl = document.querySelector(`[data-order-status="${orderUpdateId}"]`);
      const trackingEl = document.querySelector(`[data-order-tracking="${orderUpdateId}"]`);
      await api(`/orders/${orderUpdateId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: statusEl.value,
          trackingNumber: trackingEl.value || undefined,
        }),
      });
      showToast('Order updated');
      await refreshAll();
    }
  } catch (error) {
    showToast(error.message, true);
  }
}

els.refreshAllBtn.addEventListener('click', refreshAll);
els.orderForm.addEventListener('submit', onCreateOrder);
els.loadHistoryBtn.addEventListener('click', loadCustomerHistory);
els.productForm.addEventListener('submit', onSaveProduct);
els.customerForm.addEventListener('submit', onSaveCustomer);
els.resetProductFormBtn.addEventListener('click', resetProductForm);
els.resetCustomerFormBtn.addEventListener('click', resetCustomerForm);
document.body.addEventListener('click', onClickActions);

refreshAll();