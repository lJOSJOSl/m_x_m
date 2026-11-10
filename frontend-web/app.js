'use strict';

/* ============================================================
   ¿Cuál conviene? — comparación de precio por unidad
   ============================================================ */

/* ---------- Unidades y familias ---------- */

// factor: cuánto vale 1 de esta medida en la unidad base de su familia.
const UNITS = {
  ml:  { family: 'volumen', factor: 0.001, label: 'ml' },
  l:   { family: 'volumen', factor: 1,     label: 'L' },
  g:   { family: 'peso',    factor: 0.001, label: 'g' },
  kg:  { family: 'peso',    factor: 1,     label: 'kg' },
  u:   { family: 'unidad', factor: 1,      label: 'u' },
};

// Solo se comparan productos de la misma familia.
const FAMILIES = {
  volumen: { title: 'Líquidos', base: 'L',  per: 'precio por litro' },
  peso:    { title: 'Peso',     base: 'kg', per: 'precio por kilo' },
  unidad:  { title: 'Unidades', base: 'u',  per: 'precio por unidad' },
};

/* ---------- Estado ---------- */

/** @type {{ id: number, name: string, price: number, quantity: number, unit: string }[]} */
let products = [];
let nextId = 1;

/* ---------- Persistencia (localStorage) ---------- */

const STORAGE_KEY = 'cual-conviene:v1';

/** Guarda el estado actual. Silencioso si localStorage no está disponible. */
function saveToStorage() {
  try {
    const payload = {
      version: 1,
      savedAt: Date.now(),
      products: products.map(({ name, price, quantity, unit }) => ({ name, price, quantity, unit })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch { /* modo privado, cuota llena, etc. */ }
}

/**
 * Devuelve una lista válida de productos o null si no hay nada guardado.
 * Filtra entradas corruptas (por ejemplo, si el usuario editó el localStorage a mano).
 */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);
    if (!data || data.version !== 1 || !Array.isArray(data.products)) return null;

    const valid = data.products.filter((p) =>
      p && typeof p === 'object'
      && typeof p.name === 'string'
      && Number.isFinite(p.price) && p.price > 0
      && Number.isFinite(p.quantity) && p.quantity > 0
      && Object.prototype.hasOwnProperty.call(UNITS, p.unit),
    ).map((p) => ({ ...p, price: Number(p.price), quantity: Number(p.quantity) }));

    return valid;
  } catch { /* JSON inválido o acceso bloqueado */ }
}

/* ---------- DOM ---------- */

const $ = (id) => document.getElementById(id);

const form = $('product-form');
const resultsEl = $('results');
const countEl = $('product-count');
const clearBtn = $('clear-all');
const nameInput = $('name');
const priceInput = $('price');
const quantityInput = $('quantity');
const unitSelect = $('unit');

/* ---------- Formateo y utilidades ---------- */

const fmtMoney = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 2 });
const fmtQty = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 3 });

/** Acepta "1.35" y "1,35" (separador decimal con coma). */
function parseNumber(value) {
  const n = Number(String(value).replace(',', '.').trim());
  return Number.isFinite(n) ? n : NaN;
}

/** Escapa texto para insertarlo de forma segura en el HTML. */
function esc(text) {
  return String(text).replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

/** Precio por unidad base: $ por litro, kilo o unidad. */
function pricePerBase(product) {
  const { factor } = UNITS[product.unit];
  return product.price / (product.quantity * factor);
}

/* ---------- Acciones ---------- */

function addProduct({ name, price, quantity, unit }) {
  const fallback = `Producto ${products.length + 1}`;
  products.push({
    id: nextId++,
    name: name.trim() || fallback,
    price,
    quantity,
    unit,
  });
  render();
}

function removeProduct(id) {
  products = products.filter((p) => p.id !== id);
  render();
}

function clearProducts() {
  products = [];
  render();
}

/* ---------- Renderizado ---------- */

function render() {
  // Persistir siempre el estado actual: es el único punto por el que pasa toda mutación.
  saveToStorage();
  countEl.textContent = products.length === 1 ? '1 producto' : `${products.length} productos`;
  clearBtn.classList.toggle('hidden', products.length === 0);

  if (products.length === 0) {
    resultsEl.innerHTML = `
      <div class="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
        Todavía no hay productos. Agregá al menos dos para ver cuál conviene.
      </div>`;
    return;
  }

  // Agrupar por familia (líquidos / peso / unidades).
  const groups = new Map();
  for (const p of products) {
    const family = UNITS[p.unit].family;
    if (!groups.has(family)) groups.set(family, []);
    groups.get(family).push(p);
  }

  resultsEl.replaceChildren(
    ...[...groups.entries()].map(([family, items]) => renderFamily(family, items)),
  );
}

function renderFamily(familyKey, items) {
  const family = FAMILIES[familyKey];

  // De más barato a más caro por unidad base.
  const sorted = [...items].sort((a, b) => pricePerBase(a) - pricePerBase(b));
  const winnerPer = pricePerBase(sorted[0]);
  const hasWinner = sorted.length > 1;
  const maxPerBase = pricePerBase(sorted[sorted.length - 1]);

  const cards = sorted.map((p) => {
    const per = pricePerBase(p);
    const isWinner = hasWinner && per === winnerPer;
    const barWidth = Math.max(4, (per / maxPerBase) * 100);
    const savings = isWinner ? Math.round((1 - per / maxPerBase) * 100) : 0;

    return `
    <article class="card-enter rounded-2xl bg-white p-5 shadow-sm ring-1 ${isWinner ? 'ring-2 ring-emerald-500' : 'ring-slate-200'}">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h3 class="truncate font-semibold text-slate-900">${esc(p.name)}</h3>
          <p class="mt-0.5 text-sm text-slate-500">
            ${fmtMoney.format(p.price)} · ${fmtQty.format(p.quantity)} ${UNITS[p.unit].label}
          </p>
        </div>

        <div class="shrink-0 text-right">
          <p class="text-lg font-bold leading-tight ${isWinner ? 'text-emerald-600' : 'text-slate-900'}">
            ${fmtMoney.format(per)}<span class="text-xs font-medium text-slate-400"> /${family.base}</span>
          </p>
          ${isWinner ? `
          <span class="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="m5 13 4 4L19 7"/>
            </svg>
            Mejor opción${savings > 0 ? ` · ${savings}% más barata` : ''}
          </span>` : ''}
        </div>

        <button type="button" data-remove="${p.id}" title="Quitar producto" aria-label="Quitar ${esc(p.name)}"
                class="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M10 11v6M14 11v6M6 7l.9 12.1a2 2 0 0 0 2 1.9h6.2a2 2 0 0 0 2-1.9L18 7M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/>
          </svg>
        </button>
      </div>

      <div class="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div class="h-full rounded-full ${isWinner ? 'bg-emerald-500' : 'bg-slate-300'}" style="width: ${barWidth}%"></div>
      </div>
    </article>`;
  }).join('');

  const section = document.createElement('div');
  section.innerHTML = `
    <div class="flex items-baseline justify-between">
      <h3 class="text-xs font-semibold uppercase tracking-widest text-slate-400">${family.title}</h3>
      <span class="text-xs text-slate-400">${family.per}</span>
    </div>
    <div class="mt-3 space-y-3">${cards}</div>`;
  return section;
}

/* ---------- Eventos ---------- */

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const price = parseNumber(priceInput.value);
  const quantity = parseNumber(quantityInput.value);
  const unit = unitSelect.value;

  const priceOk = Number.isFinite(price) && price > 0;
  const quantityOk = Number.isFinite(quantity) && quantity > 0;

  priceInput.classList.toggle('field-invalid', !priceOk);
  quantityInput.classList.toggle('field-invalid', !quantityOk);

  if (!priceOk || !quantityOk) return;

  addProduct({ name: nameInput.value, price, quantity, unit });

  // Limpiar el formulario pero conservar la última unidad elegida (útil para comparar).
  form.reset();
  unitSelect.value = unit;
  nameInput.focus();
});

// Quitar el resaltado de error apenas el usuario corrige el valor.
for (const input of [priceInput, quantityInput]) {
  input.addEventListener('input', () => input.classList.remove('field-invalid'));
}

// Delegación de eventos: botones "quitar" de cada tarjeta.
resultsEl.addEventListener('click', (event) => {
  const button = event.target.closest('[data-remove]');
  if (button) removeProduct(Number(button.dataset.remove));
});

clearBtn.addEventListener('click', clearProducts);

/* ---------- Inicialización ---------- */

const saved = loadFromStorage();

if (saved) {
  // Restaurar la última consulta del usuario (se reasignan ids 1..n y render se persiste igual).
  saved.forEach((p, i) => { p.id = i + 1; });
  products = saved;
  nextId = saved.length + 1;
  render();
} else {
  // Primera visita (o localStorage vacío/borrado): cargar ejemplos.
  addProduct({ name: 'Coca-Cola 1,35 L', price: 46, quantity: 1.35, unit: 'l' });
  addProduct({ name: 'Coca-Cola 1 L', price: 28, quantity: 1, unit: 'l' });
}
