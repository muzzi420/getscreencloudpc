// Renders the ready-made pattern catalog from products.js into #shop-grid.

function renderShop() {
  const wrap = document.getElementById('shop-grid');
  if (!wrap) return;
  wrap.innerHTML = '';

  for (const p of window.PRODUCTS || []) {
    const card = document.createElement('div');
    card.className = 'product-card';

    const imageEl = document.createElement('div');
    imageEl.className = 'product-image';
    if (p.image) {
      const img = document.createElement('img');
      img.src = p.image;
      img.alt = p.name;
      imageEl.appendChild(img);
    } else {
      imageEl.classList.add('placeholder');
      imageEl.textContent = (p.name || '?').trim().charAt(0).toUpperCase();
    }
    card.appendChild(imageEl);

    const title = document.createElement('h3');
    title.textContent = p.name;
    card.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'product-desc';
    desc.textContent = p.description || '';
    card.appendChild(desc);

    const footer = document.createElement('div');
    footer.className = 'product-footer';

    const price = document.createElement('span');
    price.className = 'product-price';
    price.textContent = p.price || '';
    footer.appendChild(price);

    const buy = document.createElement('a');
    buy.className = 'btn primary small';
    buy.href = `https://gumroad.com/l/${p.gumroadPermalink}`;
    buy.target = '_blank';
    buy.rel = 'noopener';
    buy.textContent = 'Buy';
    footer.appendChild(buy);

    card.appendChild(footer);
    wrap.appendChild(card);
  }
}

document.addEventListener('DOMContentLoaded', renderShop);

window.renderShop = renderShop;
