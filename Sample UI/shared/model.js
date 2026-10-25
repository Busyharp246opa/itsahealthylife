(function () {
const dailyWorkbench = location.pathname.includes('01-daily-workbench');
const nav = {
  member: [
    ['home', 'Home'], ['plan', 'Plan'], ...(dailyWorkbench ? [['train', 'Train']] : []), ['track', 'Track'], ['community', 'Community'], ['profile', 'Profile'],
  ],
  expert: [
    ['overview', 'Overview'], ['clients', 'My clients'], ...(dailyWorkbench ? [['shared-training', 'Shared training']] : []), ['calendar', 'Calendar'], ['messages', 'Messages'], ['earnings', 'Earnings'],
  ],
};

const roleName = { member: 'Member', expert: 'Expert' };
const initials = { member: 'MC', expert: 'AM' };
const identity = { member: 'Maya Chen', expert: 'Alex Morgan' };
const homeView = { member: 'track', expert: 'overview' };

const fmt = number => new Intl.NumberFormat('en-US').format(number);
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function createState() {
  const params = new URLSearchParams(location.search);
  const role = nav[params.get('role')] ? params.get('role') : 'member';
  const view = nav[role].some(([id]) => id === params.get('view')) ? params.get('view') : homeView[role];
  return {
    role, view, modal: '', toast: '', query: '',
    meals: [
      { id: 'meal-1', name: 'Greek yogurt & berries', slot: 'Breakfast', calories: 280, protein: 22, carbs: 34, fat: 6 },
      { id: 'meal-2', name: 'Chicken grain bowl', slot: 'Lunch', calories: 540, protein: 38, carbs: 62, fat: 14 },
    ],
    activities: [],
    slots: ['Tomorrow · 09:30', 'Tomorrow · 11:30', 'Tomorrow · 16:30'],
    challengeDone: false,
    savedPlan: false,
    programs: [{ id: 'sample-program', name: 'Strength & balance', active: true, sharedExpertId: '', days: { 1: [{ id: 'sample-squat', exerciseId: '0043', name: 'barbell full squat', sets: 3, reps: 8 }], 3: [{ id: 'sample-row', exerciseId: '0027', name: 'barbell bent over row', sets: 3, reps: 10 }] } }],
    selectedProgramId: 'sample-program', selectedDay: (new Date().getDay() + 6) % 7, trainingScreen: 'programs', trainingLogs: [], exerciseQuery: '', exerciseCategory: 'All', exerciseEquipment: 'All', exerciseTarget: 'All', exercisePage: 0, selectedExerciseId: '', exerciseSets: 3, exerciseReps: 10,
  };
}

function totals(state) {
  return state.meals.reduce((sum, meal) => ({
    calories: sum.calories + Number(meal.calories),
    protein: sum.protein + Number(meal.protein),
    carbs: sum.carbs + Number(meal.carbs),
    fat: sum.fat + Number(meal.fat),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

function model(state) {
  const t = totals(state);
  if (state.role === 'member') {
    if (state.view === 'home') return {
      title: 'A little progress, every day', eyebrow: 'Member home', lead: 'Start with one useful action, then keep your rhythm.',
      number: fmt(t.calories), unit: 'kcal logged today', action: ['Log a meal', 'open-meal'],
      rows: [
        { label: 'Today’s nutrition', note: `${fmt(t.calories)} kcal · ${t.protein}g protein`, tag: 'Today', target: 'track' },
        { label: 'Move every day', note: state.challengeDone ? 'One step complete' : 'Seven gentle steps to try', tag: state.challengeDone ? 'In progress' : 'Challenge', target: 'plan' },
        { label: 'Find an expert', note: 'Three approved coaches available', tag: 'Coaching', target: 'plan' },
      ],
      asideTitle: 'Your next step', asideText: 'Add a meal or a short activity to keep your day in view.', asideAction: ['Track your day', 'track'],
    };
    if (state.view === 'plan') return {
      title: 'Your plan', eyebrow: 'Member plan', lead: 'Coaching, movement, and meals that fit real life.',
      number: '04', unit: 'reviewed ideas', action: [state.savedPlan ? 'Saved to your plan' : 'Save a plan', 'toggle-plan'],
      rows: [
        { label: 'A balanced morning', note: 'Meal plan · Everyday nutrition · 7 days', tag: state.savedPlan ? 'Saved' : 'Plan' },
        ...(dailyWorkbench ? [{ label: 'My training programs', note: 'Build a seven-day schedule and count every set', tag: 'Training', target: 'train' }] : []),
        { label: '15-minute strength basics', note: 'Workout · Alex Morgan', tag: '15 min' },
        { label: 'Rainbow lunch bowl', note: 'Recipe · Healthy Life', tag: '25 min' },
        { label: 'Mindful mobility reset', note: 'Workout · Morgan Ellis', tag: '10 min' },
      ],
      asideTitle: 'Coaching directory', asideText: 'Alex Morgan · Strength & conditioning · From $55 per session', asideAction: ['Explore experts', 'toast:Expert discovery is in the current app'],
    };
    if (state.view === 'train') return {
      title: state.trainingScreen === 'program' ? state.programs.find(p => p.id === state.selectedProgramId)?.name || 'Your program' : state.trainingScreen === 'browse-home' ? 'Browse exercises' : state.trainingScreen === 'browse-results' ? 'Exercise catalog' : state.trainingScreen === 'exercise-detail' ? 'Movement details' : 'Your training studio',
      eyebrow: 'Member training', lead: state.trainingScreen === 'programs' ? 'Create a program, then open it to build each day.' : state.trainingScreen === 'program' ? 'Shape your week, one session at a time.' : 'Find the right movement and add it to your selected day.',
      number: String(state.programs.length).padStart(2, '0'), unit: 'training programs', action: state.trainingScreen === 'programs' ? ['Create a program', 'training:create-program'] : state.trainingScreen === 'program' ? ['Add exercises', 'training:open-browser'] : ['Back to program', 'training:back-program'], rows: [],
      asideTitle: 'Your training, your choice', asideText: 'One program is active. Saved programs are ready whenever you want to switch. Share a program only with a booked expert.', asideAction: ['Explore your week', 'training:today'],
    };
    if (state.view === 'track') return {
      title: 'Track your day', eyebrow: 'Member track', lead: 'Notice your progress, one entry at a time.',
      number: fmt(t.calories), unit: 'kcal logged today', action: ['Add a meal', 'open-meal'],
      rows: state.meals.map(meal => ({ id: meal.id, label: meal.name, note: `${meal.slot} · ${meal.calories} kcal · P ${meal.protein}g / C ${meal.carbs}g / F ${meal.fat}g`, tag: meal.slot, remove: true })),
      asideTitle: 'Macronutrients', asideText: `Protein ${t.protein}g · Carbs ${t.carbs}g · Fat ${t.fat}g`, asideAction: ['Log activity', 'add-activity'],
    };
    if (state.view === 'community') return {
      title: 'The community', eyebrow: 'Member community', lead: 'Good habits are easier to keep together.',
      number: '01', unit: 'open conversation', action: ['Start a conversation', 'toast:Community posting opens in the current app'],
      rows: [{ label: 'What helps you stay consistent?', note: 'Jordan Lee · Movement · Maya Chen replied', tag: 'Conversation' }],
      asideTitle: 'A gentle reminder', asideText: 'Share what worked for you. Advice here is personal experience, not medical guidance.', asideAction: ['View guidelines', 'toast:Guidelines preview'],
    };
    return {
      title: 'Your profile', eyebrow: 'Member profile', lead: 'Your goals and preferences, in one place.',
      number: 'MC', unit: 'Maya Chen', action: ['Edit profile', 'toast:Profile editing opens in the current app'],
      rows: [
        { label: 'Goal', note: 'Build strength', tag: 'Fitness' },
        { label: 'Dietary preferences', note: 'No preferences', tag: 'Nutrition' },
        { label: 'Share health details', note: 'Off until you choose an expert', tag: 'Privacy' },
      ],
      asideTitle: 'Privacy first', asideText: 'Your health details stay private until you choose to share them with a booked expert.', asideAction: ['Manage sharing', 'toast:Sharing control opens in the current app'],
    };
  }
  if (state.role === 'expert') {
    if (state.view === 'overview') return {
      title: 'Your coaching day', eyebrow: 'Expert overview', lead: 'A clear view of sessions, clients, and the work ahead.',
      number: '00', unit: 'sessions booked', action: ['Set availability', 'calendar'],
      rows: [
        { label: 'Your schedule is clear', note: 'Add available times so members can book you.', tag: 'Calendar', target: 'calendar' },
        { label: '15-minute strength basics', note: 'Workout · Published in the library', tag: 'Content' },
        { label: 'Eligible earnings', note: '$0.00 · No completed sessions', tag: 'Earnings', target: 'earnings' },
      ],
      asideTitle: 'Verification', asideText: 'Alex Morgan · Approved expert · Strength & conditioning', asideAction: ['View calendar', 'calendar'],
    };
    if (state.view === 'clients') return {
      title: 'My clients', eyebrow: 'Expert clients', lead: 'Only members with a linked booking appear here.',
      number: '00', unit: 'assigned clients', action: ['Open calendar', 'calendar'],
      rows: [{ label: 'No clients yet', note: 'Your client list starts after a confirmed booking.', tag: 'Private' }],
      asideTitle: 'Client safety', asideText: 'Health details are shown only when a booked member chooses to share them.', asideAction: ['See availability', 'calendar'],
    };
    if (state.view === 'shared-training') return {
      title: 'Shared training', eyebrow: 'Expert clients', lead: 'Review programs a booked member has chosen to share.',
      number: '01', unit: 'shared program', action: ['View clients', 'clients'], rows: [],
      asideTitle: 'Member controlled', asideText: 'A member can withdraw access at any time. Access also ends when the booking link ends.', asideAction: ['My clients', 'clients'],
    };
    if (state.view === 'calendar') return {
      title: 'Calendar & availability', eyebrow: 'Expert calendar', lead: 'Keep your open times easy to review and adjust.',
      number: String(state.slots.length).padStart(2, '0'), unit: 'open times', action: ['Add availability', 'add-slot'],
      rows: state.slots.map((slot, index) => ({ label: slot, note: '45-minute virtual session', tag: index === 0 ? 'Next' : 'Open' })),
      asideTitle: 'Next session', asideText: 'No confirmed bookings yet. Members see only approved, unbooked slots.', asideAction: ['Refresh schedule', 'toast:Schedule is up to date'],
    };
    if (state.view === 'messages') return {
      title: 'Messages', eyebrow: 'Expert messages', lead: 'Conversations open with confirmed bookings.',
      number: '00', unit: 'active conversations', action: ['View bookings', 'calendar'],
      rows: [{ label: 'Your inbox is clear', note: 'Booking-linked messages will appear here.', tag: 'Inbox' }],
      asideTitle: 'Private by design', asideText: 'Only booking participants can view their session conversation.', asideAction: ['See calendar', 'calendar'],
    };
    return {
      title: 'Earnings', eyebrow: 'Expert earnings', lead: 'Payment and payout stages stay separate.',
      number: '$0', unit: 'eligible payout', action: ['View calendar', 'calendar'],
      rows: [
        { label: 'Pending', note: 'No sessions awaiting completion', tag: '$0.00' },
        { label: 'Eligible', note: 'No member-confirmed sessions', tag: '$0.00' },
        { label: 'Transferred', note: 'No payouts in this sample', tag: '$0.00' },
      ],
      asideTitle: 'How payouts work', asideText: 'The member confirms a completed session before a simulated payout becomes eligible.', asideAction: ['View policy', 'toast:Policy detail opens in the current app'],
    };
  }

}

function actionLabel(action) {
  return action?.split(':')[0] === 'toast' ? action.slice(6) : action;
}

function attachEvents(state, render) {
  const root = document.querySelector('#app');
  let modalWasOpen = false;
  const sync = () => {
    const closingModal = modalWasOpen && !state.modal;
    const url = new URL(location.href);
    url.searchParams.set('role', state.role);
    url.searchParams.set('view', state.view);
    if (location.protocol !== 'file:') history.replaceState(null, '', url);
    root.innerHTML = render(state, model(state));
    window.HealthyLifeTraining?.afterRender?.(root);
    modalWasOpen = Boolean(state.modal);
    if (state.modal) root.querySelector('.modal input')?.focus();
    if (closingModal) root.querySelector('[data-action="open-meal"]')?.focus();
  };
  const notify = message => {
    state.toast = message;
    sync();
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => { state.toast = ''; sync(); }, 3300);
  };
  if (window.HealthyLifeTraining) { window.HealthyLifeTraining.state = () => state; window.HealthyLifeTraining.sync = sync; }
  const navigate = view => {
    if (nav[state.role].some(([id]) => id === view)) state.view = view;
    state.modal = '';
    sync();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  root.addEventListener('click', event => {
    const roleButton = event.target.closest('[data-role]');
    if (roleButton) {
      state.role = roleButton.dataset.role;
      state.view = homeView[state.role];
      state.modal = '';
      sync();
      return;
    }
    const viewButton = event.target.closest('[data-view]');
    if (viewButton) { navigate(viewButton.dataset.view); return; }
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) return;
    const action = actionButton.dataset.action;
    if (action === 'open-meal') { state.modal = 'meal'; sync(); return; }
    if (action?.startsWith('training:') && window.HealthyLifeTraining?.handleClick(actionButton, state, sync, notify)) return;
    if (action === 'close-modal') { state.modal = ''; sync(); return; }
    if (action === 'add-activity') { state.activities.push({ name: 'Movement break', minutes: 10 }); notify('10-minute movement break logged in this preview'); return; }
    if (action === 'add-slot') { state.slots.push('Next week · 10:30'); notify('Sample availability added'); return; }
    if (action === 'toggle-plan') { state.savedPlan = !state.savedPlan; notify(state.savedPlan ? 'Plan saved in this preview' : 'Plan removed from saved'); return; }
    if (action === 'toggle-challenge') { state.challengeDone = !state.challengeDone; notify(state.challengeDone ? 'Challenge step completed' : 'Challenge step reopened'); return; }
    if (action === 'remove-meal') {
      state.meals = state.meals.filter(meal => meal.id !== actionButton.dataset.id);
      notify('Meal removed from this preview');
      return;
    }
    if (action?.startsWith('toast:')) { notify(action.slice(6)); return; }
    navigate(action);
  });
  root.addEventListener('submit', event => {
    if (window.HealthyLifeTraining?.handleSubmit(event, state, sync, notify)) return;
    if (!event.target.matches('[data-form="meal"]')) return;
    event.preventDefault();
    const form = new FormData(event.target);
    const name = String(form.get('name') || '').trim();
    const calories = Number(form.get('calories'));
    if (!name || !Number.isFinite(calories) || calories < 0) return;
    state.meals.push({ id: globalThis.crypto?.randomUUID?.() || `meal-${Date.now()}`, name, slot: String(form.get('slot') || 'Snack'), calories, protein: Number(form.get('protein')) || 0, carbs: Number(form.get('carbs')) || 0, fat: Number(form.get('fat')) || 0 });
    state.modal = '';
    notify('Meal added to this preview');
  });
  document.addEventListener('keydown', event => {
    if (!state.modal) return;
    if (event.key === 'Escape') { state.modal = ''; sync(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [...root.querySelectorAll('.modal button, .modal input, .modal select')];
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  sync();
}

function mealForm() {
  return `<form data-form="meal" class="meal-form">
    <label>Food or meal<input name="name" required maxlength="80" placeholder="e.g. Afternoon snack" /></label>
    <label>Meal slot<select name="slot"><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option selected>Snack</option></select></label>
    <div class="form-grid"><label>Calories<input name="calories" type="number" min="0" required placeholder="0" /></label><label>Protein, g<input name="protein" type="number" min="0" placeholder="0" /></label><label>Carbs, g<input name="carbs" type="number" min="0" placeholder="0" /></label><label>Fat, g<input name="fat" type="number" min="0" placeholder="0" /></label></div>
    <button class="primary" type="submit">Save meal <span aria-hidden="true">↗</span></button>
  </form>`;
}
window.HealthyLife = { nav, roleName, initials, identity, homeView, fmt, escapeHtml, createState, totals, model, actionLabel, attachEvents, mealForm };
})();
