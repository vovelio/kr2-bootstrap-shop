'use strict';

// Общие данные связывают каталог, страницу товара и обе формы заявки.
const formatPrice = (price) => `${new Intl.NumberFormat('ru-RU').format(price)} ₽`;
const findProduct = (id) => products.find((product) => product.id === id);
const requestedId = new URLSearchParams(window.location.search).get('product');
const requestedProduct = findProduct(requestedId);

// Статическая страница содержит рюкзак; параметр product выбирает другой товар.
if (document.getElementById('product-name')) {
  const product = requestedProduct || products[0];
  document.getElementById('unknown-product').hidden = !requestedId || Boolean(requestedProduct);
  document.title = `${product.name} — ShopProject`;
  document.querySelector('meta[name="description"]').content = product.description;
  document.getElementById('product-name').textContent = product.name;
  document.getElementById('product-crumb').textContent = product.name;
  document.getElementById('product-description').textContent = product.detail;
  document.getElementById('product-price').textContent = formatPrice(product.price);
  const image = document.getElementById('product-image');
  image.src = `images/${product.id}.png`;
  image.alt = product.alt;
  const badge = document.getElementById('product-badge');
  badge.textContent = product.badge;
  badge.className = `badge text-bg-${product.color} mb-3`;
  document.getElementById('product-order').href = `order.html?product=${product.id}`;
  document.getElementById('product-quick').dataset.product = product.id;
  document.querySelectorAll('[data-spec]').forEach((cell) => {
    const key = cell.dataset.spec;
    cell.textContent = key === 'price' ? formatPrice(product.price)
      : key === 'stock' ? 'В наличии' : product[key];
  });
}

// Фильтруем готовые HTML-карточки; сеткой по-прежнему управляет Bootstrap.
const filters = document.getElementById('catalog-filters');
if (filters) {
  const grid = document.getElementById('catalog-grid');
  const items = [...grid.querySelectorAll('[data-catalog-item]')];
  const applyFilters = () => {
    const query = filters.elements.search.value.trim().toLocaleLowerCase('ru');
    const category = filters.elements.category.value;
    const maxPrice = filters.elements.maxPrice.value;
    const sort = filters.elements.sort.value;
    const sorted = [...items];
    if (sort !== 'default') {
      sorted.sort((a, b) => (Number(a.dataset.price) - Number(b.dataset.price)) * (sort === 'asc' ? 1 : -1));
    }
    let count = 0;
    sorted.forEach((item) => {
      item.hidden = !(item.dataset.name.includes(query)
        && (category === 'all' || category === item.dataset.category)
        && (maxPrice === '' || Number(item.dataset.price) <= Number(maxPrice)));
      if (!item.hidden) count += 1;
      grid.append(item);
    });
    document.getElementById('catalog-count').textContent = `Найдено товаров: ${count}`;
    document.getElementById('catalog-empty').hidden = count !== 0;
  };
  filters.addEventListener('submit', (event) => {
    event.preventDefault();
    applyFilters();
  });
  filters.addEventListener('reset', () => setTimeout(applyFilters, 0));
}

const orderForm = document.getElementById('order-form');
if (orderForm) {
  const select = orderForm.elements.product;
  if (requestedProduct) {
    select.value = requestedProduct.id;
    // «Очистить» восстанавливает и товар, с которым открыли страницу.
    [...select.options].forEach((option) => { option.defaultSelected = option.value === requestedProduct.id; });
  }
  const updateTotal = () => {
    const product = findProduct(select.value);
    const quantity = orderForm.elements.quantity;
    document.getElementById('order-total').textContent = !product
      ? 'Выберите товар для расчёта суммы.'
      : !quantity.validity.valid
        ? 'Укажите целое количество от 1 до 10.'
        : `Итого: ${formatPrice(product.price * Number(quantity.value))} за ${quantity.value} шт.`;
  };
  orderForm.addEventListener('input', updateTotal);
  orderForm.addEventListener('reset', () => setTimeout(updateTotal, 0));
  updateTotal();
}

// Bootstrap сам открывает окно, удерживает фокус и обрабатывает Escape.
const modalElement = document.getElementById('orderModal');
if (modalElement) {
  modalElement.addEventListener('show.bs.modal', (event) => {
    const form = document.getElementById('quick-form');
    form.reset();
    const product = findProduct(event.relatedTarget?.dataset.product);
    form.elements.product.value = product?.id || '';
  });
  modalElement.addEventListener('shown.bs.modal', () => {
    document.getElementById('quick-name').focus();
  });
}

// Нативная HTML-валидация проверяет required/type/pattern/min/max.
// Проверка заявки локальная: backend и сохранение контактов здесь не нужны.
const success = document.getElementById('success-message');
document.querySelectorAll('.demo-form').forEach((form) => {
  form.addEventListener('invalid', (event) => {
    event.target.setAttribute('aria-invalid', 'true');
    event.target.classList.add('is-invalid');
    success.hidden = true;
  }, true);
  form.addEventListener('input', (event) => {
    if (event.target.validity?.valid) {
      event.target.removeAttribute('aria-invalid');
      event.target.classList.remove('is-invalid');
    }
    success.hidden = true;
  });
  form.addEventListener('reset', () => {
    form.querySelectorAll('[aria-invalid]').forEach((field) => {
      field.removeAttribute('aria-invalid');
      field.classList.remove('is-invalid');
    });
    success.hidden = true;
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const product = findProduct(form.elements.product?.value);
    const quantity = Number(form.elements.quantity?.value || 1);
    const message = product
      ? `Учебная заявка на товар «${product.name}» (${quantity} шт., ${formatPrice(product.price * quantity)}) успешно проверена.`
      : 'Учебное сообщение успешно проверено.';
    const showSuccess = () => {
      success.textContent = `${message} Данные никуда не отправлены.`;
      success.hidden = false;
      success.focus();
    };
    if (modalElement?.contains(form)) {
      // Дожидаемся возврата фокуса из модального окна, затем показываем результат.
      modalElement.addEventListener('hidden.bs.modal', showSuccess, { once: true });
      bootstrap.Modal.getInstance(modalElement).hide();
    } else {
      showSuccess();
    }
  });
});
