/**
 * CloudKitchen — frontend
 * For Scenario 3, update API_BASE to your Function App URL:
 *   const API_BASE = 'https://cloudkitchen-fn-xxxx.azurewebsites.net/api';
 */
const API_BASE = '/api';

// ── State ──────────────────────────────────────────────────────────────────
const cookbook = [];   // [{ recipe }]

// ── DOM refs ───────────────────────────────────────────────────────────────
const recipeGrid     = document.getElementById('recipeGrid');
const errorBanner    = document.getElementById('errorBanner');
const cookbookBtn    = document.getElementById('cookbookBtn');
const cookbookBadge  = document.getElementById('cookbookBadge');
const sidebar        = document.getElementById('sidebar');
const overlay        = document.getElementById('overlay');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const sidebarItems   = document.getElementById('sidebarItems');
const sidebarFooter  = document.getElementById('sidebarFooter');
const mealPlanBtn    = document.getElementById('mealPlanBtn');
const modalBackdrop  = document.getElementById('modalBackdrop');
const closeModalBtn  = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const emailInput     = document.getElementById('emailInput');
const weekInput      = document.getElementById('weekInput');
const planSummary    = document.getElementById('planSummary');
const savePlanBtn    = document.getElementById('savePlanBtn');
const toast          = document.getElementById('toast');

// ── Cookbook helpers ───────────────────────────────────────────────────────
function isInCookbook(recipeId) {
  return cookbook.some(r => r.id === recipeId);
}

function addToCookbook(recipe) {
  if (isInCookbook(recipe.id)) return;
  cookbook.push(recipe);
  updateCookbookUI();
  updateSaveButtons();
  showToast(`${recipe.name} added to cookbook!`, 'success');
}

function removeFromCookbook(recipeId) {
  const idx = cookbook.findIndex(r => r.id === recipeId);
  if (idx > -1) cookbook.splice(idx, 1);
  updateCookbookUI();
  updateSaveButtons();
}

// ── Cookbook UI ────────────────────────────────────────────────────────────
function updateCookbookUI() {
  cookbookBadge.textContent = cookbook.length;

  if (!cookbook.length) {
    sidebarItems.innerHTML = '<p class="empty-msg">No recipes saved yet.</p>';
    sidebarFooter.hidden = true;
    return;
  }

  sidebarItems.innerHTML = cookbook.map(r => `
    <div class="cookbook-item">
      ${r.imageUrl
        ? `<img class="cookbook-item-img" src="${r.imageUrl}" alt="${r.name}" onerror="this.style.display='none'">`
        : `<div class="cookbook-item-img" style="display:flex;align-items:center;justify-content:center;font-size:1.5rem;">🍽️</div>`}
      <div class="cookbook-item-info">
        <div class="cookbook-item-name">${r.name}</div>
        <div class="cookbook-item-meta">⏱ ${r.prepTime} min &nbsp;·&nbsp; 🍽 ${r.servings} servings</div>
      </div>
      <button class="remove-btn" onclick="removeFromCookbook('${r.id}')" title="Remove">🗑</button>
    </div>
  `).join('');

  sidebarFooter.hidden = false;
}

function updateSaveButtons() {
  document.querySelectorAll('[data-recipe-id]').forEach(btn => {
    const id = btn.dataset.recipeId;
    if (isInCookbook(id)) {
      btn.textContent = '✓ Saved';
      btn.classList.add('saved');
    } else {
      btn.textContent = 'Save to Cookbook';
      btn.classList.remove('saved');
    }
  });
}

// ── Sidebar open/close ─────────────────────────────────────────────────────
function openSidebar()  { sidebar.classList.add('open'); overlay.classList.add('open'); }
function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('open'); }

cookbookBtn.addEventListener('click', openSidebar);
closeSidebarBtn.addEventListener('click', closeSidebar);
overlay.addEventListener('click', closeSidebar);

// ── Meal plan modal ────────────────────────────────────────────────────────
function openModal() {
  closeSidebar();
  planSummary.innerHTML = cookbook.map(r => `
    <div class="plan-row">
      <span>${r.name}</span>
      <strong>${r.cuisine}</strong>
    </div>
  `).join('');
  // Default week to next Monday
  const d = new Date();
  d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
  weekInput.value = d.toISOString().split('T')[0];
  modalBackdrop.hidden = false;
  emailInput.focus();
}

function closeModal() { modalBackdrop.hidden = true; }

mealPlanBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);

// ── Save meal plan ─────────────────────────────────────────────────────────
savePlanBtn.addEventListener('click', async () => {
  const email  = emailInput.value.trim();
  const weekOf = weekInput.value;

  if (!email || !email.includes('@')) {
    showToast('Please enter a valid email address', 'error');
    return;
  }

  const payload = {
    recipes: cookbook.map(r => ({
      recipeId: r.id,
      name:     r.name,
      cuisine:  r.cuisine,
      prepTime: r.prepTime,
    })),
    customerEmail: email,
    weekOf,
  };

  savePlanBtn.disabled    = true;
  savePlanBtn.textContent = 'Saving…';

  try {
    const res  = await fetch(`${API_BASE}/mealplans`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Save failed');

    closeModal();
    cookbook.length = 0;
    updateCookbookUI();
    updateSaveButtons();
    showToast(`✅ Meal plan #${data.planId} saved!`, 'success', 5000);
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  } finally {
    savePlanBtn.disabled    = false;
    savePlanBtn.textContent = 'Save Meal Plan';
  }
});

// ── Toast ──────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(message, type = '', duration = 3000) {
  toast.textContent = message;
  toast.className   = `toast${type ? ' ' + type : ''}`;
  toast.hidden      = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, duration);
}

// ── Cuisine emoji ──────────────────────────────────────────────────────────
const cuisineEmoji = {
  Italian:       '🍝',
  Indian:        '🍛',
  Mexican:       '🌮',
  Asian:         '🍜',
  Mediterranean: '🥗',
  Dessert:       '🍫',
  default:       '🍽️',
};

// ── Load recipes ───────────────────────────────────────────────────────────
async function loadRecipes() {
  try {
    const res     = await fetch(`${API_BASE}/recipes`);
    if (!res.ok)  throw new Error(`HTTP ${res.status}`);
    const recipes = await res.json();

    if (!recipes.length) {
      recipeGrid.innerHTML = '<p style="color:var(--text-muted)">No recipes found. Add some in Cosmos DB Data Explorer.</p>';
      return;
    }

    recipeGrid.innerHTML = recipes.map(r => `
      <article class="recipe-card">
        ${r.imageUrl
          ? `<img src="${r.imageUrl}" alt="${r.name}" loading="lazy"
               onerror="this.outerHTML='<div class=\\'recipe-img-placeholder\\'>${cuisineEmoji[r.cuisine] || cuisineEmoji.default}</div>'">`
          : `<div class="recipe-img-placeholder">${cuisineEmoji[r.cuisine] || cuisineEmoji.default}</div>`}
        <div class="recipe-info">
          <div class="recipe-cuisine">${r.cuisine}</div>
          <div class="recipe-name">${r.name}</div>
          <div class="recipe-desc">${r.description}</div>
          <div class="recipe-meta">
            <span>⏱ ${r.prepTime} min</span>
            <span>🍽 ${r.servings} servings</span>
          </div>
          <button
            class="btn-save${isInCookbook(r.id) ? ' saved' : ''}"
            data-recipe-id="${r.id}"
            onclick='addToCookbook(${JSON.stringify(r)})'
          >
            ${isInCookbook(r.id) ? '✓ Saved' : 'Save to Cookbook'}
          </button>
        </div>
      </article>
    `).join('');
  } catch (err) {
    console.error('Failed to load recipes:', err);
    recipeGrid.innerHTML = '';
    errorBanner.hidden   = false;
  }
}

loadRecipes();
updateCookbookUI();
