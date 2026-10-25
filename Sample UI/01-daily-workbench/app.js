const { attachEvents, createState, escapeHtml: e, identity, mealForm, model, nav, roleName, totals } = window.HealthyLife;

const state = createState();

function roleTabs(current) {
  return Object.keys(nav).map(role => `<button type="button" class="role-tab ${current === role ? 'selected' : ''}" data-role="${role}" aria-pressed="${current === role}">${roleName[role]}</button>`).join('');
}

function navItems(current, active) {
  return nav[current].map(([id, label], index) => `<button type="button" class="nav-item ${active === id ? 'active' : ''}" data-view="${id}" aria-current="${active === id ? 'page' : 'false'}"><span class="nav-index">${String(index + 1).padStart(2, '0')}</span><span>${e(label)}</span><span class="nav-arrow" aria-hidden="true">↗</span></button>`).join('');
}

function row(item) {
  const label = `<span class="row-copy"><strong>${e(item.label)}</strong><small>${e(item.note)}</small></span>`;
  const tag = `<span class="row-tag">${e(item.tag)}</span>`;
  if (item.remove) return `<div class="ledger-row">${label}${tag}<button type="button" class="remove" data-action="remove-meal" data-id="${e(item.id)}" aria-label="Remove ${e(item.label)}">×</button></div>`;
  if (item.target) return `<button type="button" class="ledger-row row-button" data-view="${item.target}">${label}${tag}<span class="row-end" aria-hidden="true">↗</span></button>`;
  return `<div class="ledger-row">${label}${tag}</div>`;
}

function metric(state, m) {
  if (state.role === 'member' && state.view === 'track') {
    const t = totals(state);
    const total = Math.max(t.protein + t.carbs + t.fat, 1);
    return `<section class="metric-stage" aria-label="Today's nutrition summary"><div class="metric-top"><span>Today’s nutrition</span><span>Member-entered estimate</span></div><div class="metric-main"><div><strong>${e(m.number)}</strong><span>kcal<br/>logged</span></div><p>One entry at a time is enough. Your log is ready when you are.</p></div><div class="macro-grid">${[['Protein', t.protein, 'protein'], ['Carbs', t.carbs, 'carbs'], ['Fat', t.fat, 'fat']].map(([label, value, cls]) => `<div class="macro"><div class="macro-heading"><span>${label}</span><strong>${value}g</strong></div><div class="macro-track"><span class="${cls}" style="width:${Math.max(8, Math.round(value / total * 100))}%"></span></div></div>`).join('')}</div></section>`;
  }
  return `<section class="metric-stage metric-generic"><div class="metric-top"><span>${e(m.eyebrow)}</span><span>Sample workspace</span></div><div class="metric-main"><div><strong>${e(m.number)}</strong><span>${e(m.unit)}</span></div><p>${e(m.lead)}</p></div><div class="metric-rule"></div></section>`;
}

function render(state, m) {
  const training = state.role === 'member' && state.view === 'train' || state.role === 'expert' && state.view === 'shared-training';
  const listTitle = state.role === 'member' && state.view === 'track' ? 'Food log' : state.role === 'expert' ? 'Your workspace' : 'In your day';
  const action = m.action[1];
  const actionAttr = nav[state.role].some(([id]) => id === action) ? `data-view="${e(action)}"` : `data-action="${e(action)}"`;
  const asideAttr = nav[state.role].some(([id]) => id === m.asideAction[1]) ? `data-view="${e(m.asideAction[1])}"` : `data-action="${e(m.asideAction[1])}"`;
  const t = totals(state);
  return `<div class="shell">
    <aside class="side" aria-label="Primary navigation"><a class="brand" href="../index.html"><img src="../assets/Frame.png" alt="" /><span>IT’S A<br/>HEALTHY LIFE</span></a><div class="role-caption">Explore as</div><div class="role-switch" aria-label="Preview role">${roleTabs(state.role)}</div><div class="side-label">${e(roleName[state.role])} workspace</div><nav aria-label="${e(roleName[state.role])} sections">${navItems(state.role, state.view)}</nav><div class="side-foot"><span class="tiny-mark">HL</span><p>Better days start with one useful action.</p><a href="../index.html">All three concepts <span aria-hidden="true">↗</span></a></div></aside>
    <div class="page"><header class="topbar"><div class="crumb">HEALTHY LIFE <span>/</span> ${e(roleName[state.role])} <span>/</span> ${e(m.title)}</div><div class="top-right"><span class="sample-dot"></span><span>Interactive concept preview</span><span class="avatar" aria-label="${e(identity[state.role])}">${e(identity[state.role].split(' ').map(part => part[0]).join('').slice(0, 2))}</span></div></header>
      <div class="page-grid ${training ? 'training-page-grid' : ''}"><main id="main" tabindex="-1"><header class="page-intro"><div><p class="eyebrow">${e(m.eyebrow)}</p><h1>${e(m.title)}</h1><p class="lead">${e(m.lead)}</p></div><button type="button" class="primary action-button" ${actionAttr}><span>${e(m.action[0])}</span><span class="button-arrow" aria-hidden="true">↗</span></button></header>${training ? state.role === 'member' ? window.HealthyLifeTraining.member(state) : window.HealthyLifeTraining.expert(state) : `${metric(state, m)}<section class="list-section"><div class="section-head"><h2>${listTitle}</h2><span>${String(m.rows.length).padStart(2, '0')} items</span></div><div class="ledger">${m.rows.map(row).join('')}</div>${state.role === 'member' && state.view === 'track' ? `<button type="button" class="add-inline" data-action="open-meal"><span aria-hidden="true">＋</span> Add another meal</button>` : ''}</section>`}</main>
      <aside class="context" aria-label="Context and next action"><div class="context-top"><span class="context-label">AT A GLANCE</span><span class="context-date">TODAY</span></div><div class="context-feature"><div class="context-number">${state.role === 'member' && state.view === 'track' ? `${t.protein}<small>g</small>` : e(m.number)}</div><span>${state.role === 'member' && state.view === 'track' ? 'Protein logged' : e(m.unit)}</span></div><div class="context-rule"></div><div class="context-block"><span class="context-overline">NEXT USEFUL STEP</span><h2>${e(m.asideTitle)}</h2><p>${e(m.asideText)}</p><button type="button" class="context-action" ${asideAttr}>${e(m.asideAction[0])} <span aria-hidden="true">↗</span></button></div><div class="context-bottom"><strong>Keep your rhythm.</strong><p>This concept keeps the main task and its next step visible together.</p></div></aside></div></div>
    ${state.modal === 'meal' ? `<div class="overlay"><div class="modal-scrim" data-action="close-modal"></div><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button type="button" class="modal-close" data-action="close-modal" aria-label="Close">×</button><span class="eyebrow">MEMBER TRACK</span><h2 id="modal-title">Add a meal</h2><p>Enter your own estimate. This preview saves it only until you leave the page.</p>${mealForm()}</section></div>` : ''}
    ${state.toast ? `<div class="toast" role="status">${e(state.toast)}</div>` : ''}
  </div>`;
}

attachEvents(state, render);
