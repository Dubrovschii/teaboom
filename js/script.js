(function () {
  'use strict';

  /** Форматирует число в цену вида "1 432 ₽" (пробел между разрядами, без копеек, если их нет) */
  function formatPrice(value) {
    const hasKopecks = Math.round(value * 100) % 100 !== 0;
    const formatted = value.toLocaleString('ru-RU', {
      minimumFractionDigits: hasKopecks ? 2 : 0,
      maximumFractionDigits: 2,
    });
    return formatted + ' ₽';
  }

  function calcDiscountPercent(price, oldPrice) {
    if (!oldPrice || oldPrice <= price) return 0;
    return Math.round((1 - price / oldPrice) * 100);
  }

  const variantsRoot = document.getElementById('variants');
  const priceEl = document.getElementById('product-price');
  const oldPriceEl = document.getElementById('product-price-old');
  const discountEl = document.getElementById('product-discount');
  const skuEl = document.getElementById('product-sku');
  const badgeEl = document.querySelector('.product__badge');

  const totalRow = document.getElementById('product-total');
  const totalQtyEl = document.getElementById('product-total-qty');
  const totalSumEl = document.getElementById('product-total-sum');

  let activeIndex = DEFAULT_VARIANT_INDEX;

  /** Пересчитывает и показывает "Итого за N шт" — сумму цены выбранной фасовки на количество */
  function updateTotal() {
    const variant = PRODUCT_VARIANTS[activeIndex];
    const qty = clampQty(qtyInput.value);
    const sum = variant.price * qty;

    totalQtyEl.textContent = String(qty);
    totalSumEl.textContent = formatPrice(sum);

    // Показываем строку "Итого" только когда она реально что-то добавляет к цене за штуку
    totalRow.hidden = qty <= 1;
  }

  function renderVariants() {
    variantsRoot.innerHTML = '';

    PRODUCT_VARIANTS.forEach((variant, index) => {
      const discount = calcDiscountPercent(variant.price, variant.oldPrice);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'variant';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', index === activeIndex ? 'true' : 'false');
      btn.dataset.index = String(index);
      if (index === activeIndex) btn.classList.add('is-active');

      btn.innerHTML =
        '<span class="variant__weight">' + variant.weight + '</span>' +
        '<span class="variant__price">' + formatPrice(variant.price) + '</span>' +
        (discount ? '<span class="variant__discount">−' + discount + '%</span>' : '');

      btn.addEventListener('click', () => selectVariant(index));
      variantsRoot.appendChild(btn);
    });
  }

  function selectVariant(index) {
    if (index === activeIndex) return;
    activeIndex = index;
    const variant = PRODUCT_VARIANTS[index];
    const discount = calcDiscountPercent(variant.price, variant.oldPrice);

    // Обновляем состояние кнопок фасовки
    variantsRoot.querySelectorAll('.variant').forEach((btn) => {
      const isActive = Number(btn.dataset.index) === index;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
    });

    // Обновляем цену, артикул и скидку с лёгкой анимацией смены значения
    [priceEl, oldPriceEl, skuEl].forEach((el) => el.classList.add('is-updating'));

    priceEl.textContent = formatPrice(variant.price);
    skuEl.textContent = variant.sku;

    if (variant.oldPrice && variant.oldPrice > variant.price) {
      oldPriceEl.textContent = formatPrice(variant.oldPrice);
      oldPriceEl.hidden = false;
    } else {
      oldPriceEl.hidden = true;
    }

    if (discount) {
      discountEl.textContent = '−' + discount + '%';
      discountEl.hidden = false;
      if (badgeEl) badgeEl.textContent = '−' + discount + '%';
    } else {
      discountEl.hidden = true;
      if (badgeEl) badgeEl.textContent = '';
    }

    requestAnimationFrame(() => {
      [priceEl, oldPriceEl, skuEl].forEach((el) => el.classList.remove('is-updating'));
    });

    updateTotal();
  }

  // ===== Количество =====
  const qtyInput = document.getElementById('qty-input');
  const qtyMinus = document.getElementById('qty-minus');
  const qtyPlus = document.getElementById('qty-plus');

  function clampQty(value) {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 1) return 1;
    if (n > 99) return 99;
    return n;
  }

  qtyMinus.addEventListener('click', () => {
    qtyInput.value = clampQty(Number(qtyInput.value) - 1);
    updateTotal();
  });
  qtyPlus.addEventListener('click', () => {
    qtyInput.value = clampQty(Number(qtyInput.value) + 1);
    updateTotal();
  });
  // 'input' — пересчитываем сразу по мере ввода с клавиатуры
  qtyInput.addEventListener('input', () => {
    updateTotal();
  });
  // 'change' — приводим значение в допустимые границы, когда поле теряет фокус
  qtyInput.addEventListener('change', () => {
    qtyInput.value = clampQty(qtyInput.value);
    updateTotal();
  });

  renderVariants();
  updateTotal();

  // ===== Кнопка «В корзину» (без реальной корзины) =====
  const addToCartBtn = document.getElementById('add-to-cart');
  const cartMsg = document.getElementById('cart-msg');
  let cartMsgTimer = null;

  addToCartBtn.addEventListener('click', () => {
    const variant = PRODUCT_VARIANTS[activeIndex];
    const qty = clampQty(qtyInput.value);

    addToCartBtn.classList.add('is-added');
    cartMsg.textContent =
      'Добавлено в корзину: Ананасовый улун, ' + variant.weight + ' × ' + qty;

    clearTimeout(cartMsgTimer);
    cartMsgTimer = setTimeout(() => {
      addToCartBtn.classList.remove('is-added');
    }, 1400);
  });
})();
