// ═══════════════════════════════════════════════════════════
//  Jujutsu Kaisen Character Gallery — script.js
// ═══════════════════════════════════════════════════════════

const API_URL = 'https://data.jujutsukaisenapi.site/api/v1/characters';
const PAGE_SIZE = 12;

// ── State ──────────────────────────────────────────────────
let allCharacters = [];
let filteredCharacters = [];
let currentPage = 1;
let searchQuery = '';
let activeFilter = 'all';
let sortBy = 'id';

// ── DOM refs ───────────────────────────────────────────────
const grid = document.getElementById('characters-grid');
const pagination = document.getElementById('pagination');
const stateContainer = document.getElementById('state-container');
const stateMessage = document.getElementById('state-message');
const statsTotal = document.getElementById('stats-total');
const statsShown = document.getElementById('stats-shown');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalContent = document.getElementById('modal-content');

// ── Fetch ──────────────────────────────────────────────────
async function fetchCharacters() {
  showSkeleton();
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    allCharacters = json.data || [];
    applyFilters();
  } catch (err) {
    showError('No se pudo cargar la API. Intenta recargar la página.');
    console.error(err);
  }
}

// ── Filtering / Sorting ────────────────────────────────────
function applyFilters() {
  let list = [...allCharacters];

  // Search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.alias || []).some(a => a.toLowerCase().includes(q))
    );
  }

  // Gender filter
  if (activeFilter !== 'all') {
    list = list.filter(c => c.gender?.name === activeFilter);
  }

  // Sort
  if (sortBy === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'age') {
    list.sort((a, b) => parseInt(a.age || 0) - parseInt(b.age || 0));
  }

  filteredCharacters = list;
  currentPage = 1;
  updateStats();
  renderGrid();
  renderPagination();
}

function updateStats() {
  statsTotal.textContent = `Total: ${allCharacters.length} personajes`;
  statsShown.textContent = filteredCharacters.length !== allCharacters.length
    ? `· Mostrando: ${filteredCharacters.length}`
    : '';
}

// ── Grade helper ────────────────────────────────────────────
function gradeClass(gradeName) {
  if (!gradeName) return 'grade-default';
  const n = gradeName.toLowerCase();
  if (n.includes('special')) return 'grade-special';
  if (n.includes('grade 1') || n.includes('semi-grade 1')) return 'grade-1';
  if (n.includes('grade 2') || n.includes('semi-grade 2')) return 'grade-2';
  if (n.includes('grade 3') || n.includes('grade 4')) return 'grade-3';
  if (n.includes('semi')) return 'grade-semi';
  return 'grade-default';
}

function statusClass(statusName) {
  if (!statusName) return 'status-unknown';
  const s = statusName.toLowerCase();
  if (s === 'alive') return 'status-alive';
  if (s === 'dead') return 'status-dead';
  return 'status-unknown';
}

function statusLabel(statusName) {
  if (!statusName) return 'Desconocido';
  const map = { alive: '● Vivo', dead: '✕ Muerto' };
  return map[statusName.toLowerCase()] || statusName;
}

// ── Card builder ────────────────────────────────────────────
function buildCard(char) {
  const grade = char.grade?.name || '';
  const status = char.status?.name || '';
  const affiliations = (char.affiliations || []).map(a => a.affiliation_name).join(', ') || '—';
  const techniques = (char.cursedTechniques || []).slice(0, 3).map(t => t.technique_name);

  const card = document.createElement('article');
  card.className = 'char-card bg-jjk-card border border-jjk-border rounded-2xl overflow-hidden cursor-pointer flex flex-col';
  card.setAttribute('data-id', char.id);
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `Ver detalles de ${char.name}`);

  card.innerHTML = `
    <!-- Image -->
    <div class="relative h-56 bg-gradient-to-br from-[#0d0d1f] to-[#1a0a2e] overflow-hidden">
      ${char.image
        ? `<img
            src="${char.image}"
            alt="${char.name}"
            class="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
            loading="lazy"
            onerror="this.parentElement.innerHTML='<div class=\\'flex items-center justify-center h-full\\'><svg class=\\'w-16 h-16 text-jjk-border\\' fill=\\'none\\' stroke=\\'currentColor\\' viewBox=\\'0 0 24 24\\'><path stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' stroke-width=\\'1\\' d=\\'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z\\'/></svg></div>'"
          />`
        : `<div class="flex items-center justify-center h-full">
            <svg class="w-16 h-16 text-jjk-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>`
      }
      <!-- Grade overlay -->
      <div class="absolute top-3 left-3">
        <span class="tag ${gradeClass(grade)}">${grade || 'Sin rango'}</span>
      </div>
      <!-- Status -->
      <div class="absolute top-3 right-3">
        <span class="tag ${statusClass(status)}">${statusLabel(status)}</span>
      </div>
      <!-- Bottom fade -->
      <div class="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-jjk-card to-transparent"></div>
    </div>

    <!-- Info -->
    <div class="flex flex-col flex-1 p-4 gap-3">
      <!-- Name + alias -->
      <div>
        <h2 class="font-semibold text-white text-base leading-snug">${char.name}</h2>
        ${char.alias?.length
          ? `<p class="text-xs text-jjk-muted mt-0.5 truncate">${char.alias.slice(0,2).join(' · ')}</p>`
          : ''}
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-3 gap-2 text-center">
        <div class="bg-[#0a0a18] rounded-lg py-1.5 px-2">
          <p class="text-[10px] text-jjk-muted uppercase tracking-wide">Edad</p>
          <p class="text-sm font-semibold text-white">${char.age || '?'}</p>
        </div>
        <div class="bg-[#0a0a18] rounded-lg py-1.5 px-2">
          <p class="text-[10px] text-jjk-muted uppercase tracking-wide">Altura</p>
          <p class="text-sm font-semibold text-white">${char.height || '?'}</p>
        </div>
        <div class="bg-[#0a0a18] rounded-lg py-1.5 px-2">
          <p class="text-[10px] text-jjk-muted uppercase tracking-wide">Género</p>
          <p class="text-sm font-semibold text-white">${char.gender?.name === 'Male' ? '♂' : char.gender?.name === 'Female' ? '♀' : '?'}</p>
        </div>
      </div>

      <!-- Affiliation -->
      <p class="text-xs text-jjk-muted truncate">
        <span class="text-jjk-sub font-medium">Afiliación:</span> ${affiliations}
      </p>

      <!-- Techniques pills -->
      ${techniques.length
        ? `<div class="flex flex-wrap gap-1.5 mt-auto">
            ${techniques.map(t => `<span class="tag bg-[#1e1e35] text-jjk-sub border border-jjk-border" style="text-transform:none;font-weight:500;">${t}</span>`).join('')}
            ${char.cursedTechniques.length > 3 ? `<span class="tag bg-transparent text-jjk-muted" style="text-transform:none;">+${char.cursedTechniques.length - 3}</span>` : ''}
          </div>`
        : '<p class="text-xs text-jjk-muted mt-auto">Sin técnicas registradas</p>'}
    </div>

    <!-- Footer hint -->
    <div class="px-4 py-2.5 border-t border-jjk-border flex items-center justify-between">
      <span class="text-[10px] text-jjk-muted uppercase tracking-widest">Ver detalles</span>
      <svg class="w-3.5 h-3.5 text-jjk-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
      </svg>
    </div>
  `;

  card.addEventListener('click', () => openModal(char));
  card.addEventListener('keydown', e => { if (e.key === 'Enter') openModal(char); });

  return card;
}

// ── Render grid ─────────────────────────────────────────────
function renderGrid() {
  grid.innerHTML = '';
  stateContainer.classList.add('hidden');

  if (filteredCharacters.length === 0) {
    stateContainer.classList.remove('hidden');
    stateMessage.textContent = 'No se encontraron personajes con ese criterio.';
    return;
  }

  const start = (currentPage - 1) * PAGE_SIZE;
  const page  = filteredCharacters.slice(start, start + PAGE_SIZE);
  page.forEach(char => grid.appendChild(buildCard(char)));

  // Scroll to top of grid smoothly
  grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Skeleton loader ─────────────────────────────────────────
function showSkeleton() {
  grid.innerHTML = '';
  stateContainer.classList.add('hidden');
  for (let i = 0; i < PAGE_SIZE; i++) {
    const sk = document.createElement('div');
    sk.className = 'bg-jjk-card border border-jjk-border rounded-2xl overflow-hidden';
    sk.innerHTML = `
      <div class="skeleton h-56 w-full"></div>
      <div class="p-4 space-y-3">
        <div class="skeleton h-4 w-2/3"></div>
        <div class="skeleton h-3 w-1/2"></div>
        <div class="skeleton h-16 w-full rounded-lg"></div>
        <div class="skeleton h-3 w-3/4"></div>
      </div>`;
    grid.appendChild(sk);
  }
}

function showError(msg) {
  grid.innerHTML = '';
  stateContainer.classList.remove('hidden');
  stateMessage.innerHTML = `<span class="text-red-400">${msg}</span>`;
}

// ── Pagination ──────────────────────────────────────────────
function renderPagination() {
  pagination.innerHTML = '';
  const totalPages = Math.ceil(filteredCharacters.length / PAGE_SIZE);
  if (totalPages <= 1) return;

  const createBtn = (label, page, disabled = false, active = false) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.className = `page-btn px-4 py-2 rounded-lg border border-jjk-border text-sm font-medium text-jjk-sub ${active ? 'active-page' : ''} ${disabled ? '' : ''}`;
    btn.disabled = disabled;
    if (!disabled) btn.addEventListener('click', () => { currentPage = page; renderGrid(); renderPagination(); });
    return btn;
  };

  pagination.appendChild(createBtn('← Anterior', currentPage - 1, currentPage === 1));

  // Page numbers (show a window of 5)
  let start = Math.max(1, currentPage - 2);
  let end   = Math.min(totalPages, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);

  if (start > 1) {
    pagination.appendChild(createBtn('1', 1));
    if (start > 2) {
      const dots = document.createElement('span');
      dots.textContent = '…';
      dots.className = 'text-jjk-muted px-1';
      pagination.appendChild(dots);
    }
  }

  for (let p = start; p <= end; p++) {
    pagination.appendChild(createBtn(p, p, false, p === currentPage));
  }

  if (end < totalPages) {
    if (end < totalPages - 1) {
      const dots = document.createElement('span');
      dots.textContent = '…';
      dots.className = 'text-jjk-muted px-1';
      pagination.appendChild(dots);
    }
    pagination.appendChild(createBtn(totalPages, totalPages));
  }

  pagination.appendChild(createBtn('Siguiente →', currentPage + 1, currentPage === totalPages));
}

// ── Modal ───────────────────────────────────────────────────
function openModal(char) {
  const techniques = char.cursedTechniques || [];
  const battles    = char.battles || [];
  const tools      = char.cursedTools || [];
  const relatives  = char.relatives || [];
  const occ        = (char.occupations || []).map(o => o.occupation_name).join(', ') || '—';

  modalContent.innerHTML = `
    <!-- Close btn -->
    <button
      id="modal-close"
      class="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-jjk-darker border border-jjk-border text-jjk-muted hover:text-white hover:border-jjk-purple transition-all"
      aria-label="Cerrar"
    >✕</button>

    <!-- Header -->
    <div class="flex gap-5 p-6 border-b border-jjk-border">
      <div class="flex-shrink-0 w-28 h-36 rounded-xl overflow-hidden bg-gradient-to-br from-[#0d0d1f] to-[#1a0a2e] border border-jjk-border">
        ${char.image
          ? `<img src="${char.image}" alt="${char.name}" class="w-full h-full object-cover object-top" />`
          : `<div class="flex items-center justify-center h-full">
              <svg class="w-12 h-12 text-jjk-border" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>`}
      </div>

      <div class="flex-1 min-w-0">
        <h2 class="font-cinzel text-2xl font-bold text-white leading-snug">${char.name}</h2>
        ${char.alias?.length ? `<p class="text-sm text-jjk-muted mt-1">${char.alias.join(' · ')}</p>` : ''}

        <div class="flex flex-wrap gap-2 mt-3">
          <span class="tag ${gradeClass(char.grade?.name)}">${char.grade?.name || 'Sin rango'}</span>
          <span class="tag ${statusClass(char.status?.name)}">${statusLabel(char.status?.name)}</span>
          <span class="tag bg-[#1e1e35] text-jjk-sub" style="text-transform:none;">${char.species?.species_name || '?'}</span>
        </div>

        <div class="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-4 text-xs">
          ${[
            ['Cumpleaños', char.birthday],
            ['Altura', char.height],
            ['Edad', char.age ? char.age + ' años' : '?'],
            ['Género', char.gender?.name],
            ['Debut anime', char.animeDebut],
            ['Debut manga', char.mangaDebut],
          ].map(([k,v]) => v ? `<div><span class="text-jjk-muted">${k}:</span> <span class="text-jjk-text font-medium">${v}</span></div>` : '').join('')}
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="p-6 space-y-6">

      <!-- Ocupaciones / Afiliaciones -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        ${infoBlock('Ocupaciones', occ)}
        ${infoBlock('Afiliaciones', (char.affiliations || []).map(a => a.affiliation_name).join(', ') || '—')}
      </div>

      <!-- Domain Expansion -->
      ${char.domainExpansion ? `
        <div>
          <h3 class="section-line text-xs font-semibold text-jjk-purple uppercase tracking-widest mb-3">Domain Expansion</h3>
          <div class="bg-[#0a0a18] rounded-xl p-4 border border-jjk-border flex gap-4">
            ${char.domainExpansion.image
              ? `<img src="${char.domainExpansion.image}" alt="${char.domainExpansion.name}" class="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-jjk-border" />`
              : ''}
            <div>
              <p class="font-semibold text-white text-sm">${char.domainExpansion.name}</p>
              <p class="text-xs text-jjk-muted mt-1 leading-relaxed">${char.domainExpansion.description || ''}</p>
            </div>
          </div>
        </div>` : ''}

      <!-- Técnicas malditas -->
      ${techniques.length ? `
        <div>
          <h3 class="section-line text-xs font-semibold text-jjk-purple uppercase tracking-widest mb-3">Técnicas Malditas (${techniques.length})</h3>
          <div class="space-y-2">
            ${techniques.map(t => `
              <div class="flex items-start gap-3 bg-[#0a0a18] rounded-lg p-3 border border-jjk-border">
                ${t.image ? `<img src="${t.image}" alt="${t.technique_name}" class="w-10 h-10 rounded-md object-cover flex-shrink-0 border border-jjk-border" />` : ''}
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-white">${t.technique_name}</p>
                  <div class="flex flex-wrap gap-1.5 mt-1">
                    ${t.type?.name ? `<span class="tag bg-[#1e1e35] text-jjk-sub" style="text-transform:none;">${t.type.name}</span>` : ''}
                    ${t.range?.name ? `<span class="tag bg-transparent border border-jjk-border text-jjk-muted" style="text-transform:none;">${t.range.name}</span>` : ''}
                  </div>
                  ${t.description ? `<p class="text-xs text-jjk-muted mt-1.5 leading-relaxed">${t.description}</p>` : ''}
                </div>
              </div>`).join('')}
          </div>
        </div>` : ''}

      <!-- Herramientas malditas -->
      ${tools.length ? `
        <div>
          <h3 class="section-line text-xs font-semibold text-jjk-cyan uppercase tracking-widest mb-3">Herramientas Malditas</h3>
          <div class="flex flex-wrap gap-2">
            ${tools.map(t => `
              <div class="flex items-center gap-2 bg-[#0a0a18] rounded-lg p-2.5 border border-jjk-border">
                ${t.image ? `<img src="${t.image}" alt="${t.name}" class="w-8 h-8 rounded object-cover border border-jjk-border" />` : ''}
                <div>
                  <p class="text-xs font-semibold text-white">${t.name}</p>
                  <p class="text-[10px] text-jjk-muted">${t.type}</p>
                </div>
              </div>`).join('')}
          </div>
        </div>` : ''}

      <!-- Familiares -->
      ${relatives.length ? `
        <div>
          <h3 class="section-line text-xs font-semibold text-jjk-gold uppercase tracking-widest mb-3">Familiares</h3>
          <div class="flex flex-wrap gap-1.5">
            ${relatives.map(r => `<span class="tag bg-[#1e1e35] text-jjk-sub border border-jjk-border" style="text-transform:none;font-weight:400;">${r}</span>`).join('')}
          </div>
        </div>` : ''}

      <!-- Batallas -->
      ${battles.length ? `
        <div>
          <h3 class="section-line text-xs font-semibold text-jjk-pink uppercase tracking-widest mb-3">Batallas (${battles.length})</h3>
          <div class="space-y-2 max-h-52 overflow-y-auto pr-1">
            ${battles.map(b => `
              <div class="bg-[#0a0a18] rounded-lg p-3 border border-jjk-border text-xs">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <p class="font-medium text-jjk-text leading-snug">${b.event}</p>
                  <span class="flex-shrink-0 tag bg-transparent border border-jjk-border text-jjk-muted" style="text-transform:none;">${b.arc}</span>
                </div>
                <p class="text-jjk-muted mt-1">${b.result}</p>
              </div>`).join('')}
          </div>
        </div>` : ''}
    </div>
  `;

  modalBackdrop.classList.remove('hidden');
  modalBackdrop.classList.add('flex');
  document.body.style.overflow = 'hidden';

  document.getElementById('modal-close').addEventListener('click', closeModal);
}

function infoBlock(label, value) {
  return `
    <div class="bg-[#0a0a18] rounded-xl p-3 border border-jjk-border">
      <p class="text-[10px] text-jjk-muted uppercase tracking-widest mb-1">${label}</p>
      <p class="text-sm text-jjk-text font-medium leading-snug">${value}</p>
    </div>`;
}

function closeModal() {
  modalBackdrop.classList.add('hidden');
  modalBackdrop.classList.remove('flex');
  document.body.style.overflow = '';
}

// ── Event listeners ─────────────────────────────────────────
searchInput.addEventListener('input', e => {
  searchQuery = e.target.value.trim();
  applyFilters();
});

sortSelect.addEventListener('change', e => {
  sortBy = e.target.value;
  applyFilters();
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    applyFilters();
  });
});

// Close modal on backdrop click
modalBackdrop.addEventListener('click', e => {
  if (e.target === modalBackdrop) closeModal();
});

// Close modal on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// ── Init ────────────────────────────────────────────────────
fetchCharacters();
