(function () {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const fallback = [
    {id:'0001',name:'3/4 sit-up',category:'waist',equipment:'body weight',target:'abs',instructions:'Curl your torso up and lower with control.',steps:['Lie on your back with knees bent.','Curl your torso toward your knees.','Lower with control.']},
    {id:'0043',name:'barbell full squat',category:'upper legs',equipment:'barbell',target:'glutes',instructions:'Squat with a barbell and stand tall.',steps:['Set the bar securely.','Lower with control.','Stand tall.']},
    {id:'0027',name:'barbell bent over row',category:'back',equipment:'barbell',target:'lats',instructions:'Hinge at the hips and row the bar toward your torso.',steps:['Hinge at the hips.','Pull the bar toward your torso.','Lower with control.']},
  ];
  let catalog = fallback;
  for (const exercise of fallback) exercise.animation = { frames: [0,1,2].map(index => `assets/${exercise.id}/frame-0${index}.svg`), sequence: [0,1,2,1], frameDurationMs: 180 };
  const flowBase = location.protocol === 'file:' ? '../../public/data/flow/' : '/data/flow/';
  let previewObserver;
  let previewTimer;
  const pausedPreviews = new Set();
  const previewPath = (exercise, index) => `${flowBase}${exercise.animation.frames[index]}`;
  const preview = (exercise, compact = false) => {
    if (!exercise.animation) return `<div class="training-flow-preview training-flow-empty ${compact ? 'compact' : ''}" role="img" aria-label="No animation available for ${e(exercise.name)}"><span aria-hidden="true">↗</span><small>Instructions only</small></div>`;
    return `<div class="training-flow-preview ${compact ? 'compact' : ''}" data-flow-preview data-id="${e(exercise.id)}"><img src="${e(previewPath(exercise,0))}" alt="Illustrative movement preview of ${e(exercise.name)}" loading="lazy"/><div class="training-flow-overlay"><small>${compact ? 'ILLUSTRATIVE' : 'Illustrative · motion is not exercise tempo'}</small><button type="button" data-action="training:toggle-preview" data-id="${e(exercise.id)}" aria-pressed="${!pausedPreviews.has(exercise.id)}" aria-label="${pausedPreviews.has(exercise.id) ? 'Play' : 'Pause'} preview of ${e(exercise.name)}">${pausedPreviews.has(exercise.id) ? 'Play' : 'Pause'}</button></div></div>`;
  };
  function afterRender(root) {
    previewObserver?.disconnect();
    clearInterval(previewTimer);
    const nodes = [...root.querySelectorAll('[data-flow-preview]')];
    if (!nodes.length) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const visible = new Set();
    const loaded = new Set();
    const ready = new Set();
    const load = node => {
      const exercise = catalog.find(item => item.id === node.dataset.id);
      if (!exercise?.animation || loaded.has(node)) return;
      loaded.add(node);
      Promise.all(exercise.animation.frames.map(frame => new Promise(resolve => {
        const image = new Image();
        image.onload = () => resolve(true);
        image.onerror = () => resolve(false);
        image.src = `${flowBase}${frame}`;
      }))).then(results => {
        if (results.every(Boolean)) ready.add(node);
        else if (node.isConnected) {
          node.classList.add('unavailable');
          node.querySelector('img')?.remove();
          node.insertAdjacentHTML('afterbegin','<span class="training-preview-unavailable">Preview unavailable</span>');
          node.querySelector('button')?.remove();
        }
      });
    };
    if ('IntersectionObserver' in window) {
      previewObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { visible.add(entry.target); load(entry.target); }
        else visible.delete(entry.target);
      }), { rootMargin: '120px' });
      nodes.forEach(node => previewObserver.observe(node));
    } else nodes.forEach(node => { visible.add(node); load(node); });
    let tick = 0;
    previewTimer = setInterval(() => {
      if (document.hidden) return;
      for (const node of visible) {
        const exercise = catalog.find(item => item.id === node.dataset.id);
        if (!exercise?.animation || !ready.has(node) || pausedPreviews.has(exercise.id) || (reduced && !node.dataset.manualPlay)) continue;
        const image = node.querySelector('img');
        if (image) image.src = previewPath(exercise, exercise.animation.sequence[tick % exercise.animation.sequence.length]);
      }
      tick++;
    }, 180);
  }
  const e = window.HealthyLife.escapeHtml;
  const id = () => globalThis.crypto?.randomUUID?.() || `sample-${Date.now()}-${Math.random()}`;
  const current = state => state.programs.find(p => p.id === state.selectedProgramId) || state.programs[0];
  const todayDay = () => (new Date().getDay() + 6) % 7;
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const logKey = (program, item, set) => `${today()}:${program.id}:${item.id}:${set}`;
  const logged = (state, program, item, set) => state.trainingLogs.find(x => x.key === logKey(program,item,set));
  const counts = values => [...new Set(values)].sort((a,b) => a.localeCompare(b));
  const categories = () => counts(catalog.map(x => x.category).filter(Boolean));
  const equipment = () => counts(catalog.map(x => x.equipment).filter(Boolean));
  const targets = () => counts(catalog.map(x => x.target).filter(Boolean));
  const optionList = (values, selected, all) => `<option value="All">${e(all)}</option>${values.map(x => `<option value="${e(x)}" ${selected === x ? 'selected' : ''}>${e(x)}</option>`).join('')}`;
  const back = (label, action) => `<button type="button" class="training-back" data-action="training:${action}">← ${e(label)}</button>`;

  function programs(state) {
    return `<section class="training-studio training-index">
      <div class="training-toolbar"><div><span class="training-kicker">YOUR PROGRAMS</span><h2>Make a week that works</h2><p>Create a program, open it, and choose exercises for each day.</p></div><form data-training-form="program" class="training-create"><label class="sr-only" for="new-program">Program name</label><input id="new-program" name="name" maxlength="80" required placeholder="New program name"/><button type="submit">Create program <span aria-hidden="true">↗</span></button></form></div>
      <div class="training-index-heading"><div><span class="training-kicker">YOUR LIBRARY</span><h2>${state.programs.length} ${state.programs.length === 1 ? 'program' : 'programs'} ready to shape</h2></div><p>Open a program to plan its week.</p></div>
      <div class="training-program-grid">${state.programs.map(program => { const dayCount = Object.values(program.days).filter(items => items.length).length; const exerciseCount = Object.values(program.days).reduce((sum,items) => sum+items.length,0); return `<button type="button" class="training-program-card" data-action="training:open-program" data-id="${e(program.id)}"><span class="training-program-card-top"><small>${program.active ? 'ACTIVE PROGRAM' : 'SAVED PROGRAM'}</small><span aria-hidden="true">↗</span></span><strong>${e(program.name)}</strong><span>${dayCount} training ${dayCount === 1 ? 'day' : 'days'} · ${exerciseCount} ${exerciseCount === 1 ? 'exercise' : 'exercises'}</span><span class="training-program-card-foot">Open program <span aria-hidden="true">→</span></span></button>`; }).join('')}</div>
      <p class="training-index-note">One program is active for today’s logging. Your other programs stay saved until you switch.</p>
    </section>`;
  }

  function programView(state) {
    const program = current(state);
    if (!program) return programs(state);
    const day = state.selectedDay;
    const items = program.days[day] || [];
    const planned = items.reduce((sum,item) => sum+item.sets,0);
    const done = items.reduce((sum,item) => sum+Array.from({length:item.sets},(_,n)=>Boolean(logged(state,program,item,n+1))).filter(Boolean).length,0);
    return `<section class="training-studio training-program-view">
      ${back('All programs','back-programs')}
      <div class="training-program-hero"><div><span class="training-kicker">${program.active ? 'ACTIVE PROGRAM' : 'SAVED PROGRAM'}</span><h2>${e(program.name)}</h2><p>Choose a day, see its session, then add movements from the complete exercise library.</p></div><div class="training-program-hero-actions">${!program.active ? '<button type="button" data-action="training:activate">Set active</button>' : ''}<button type="button" class="quiet-danger" data-action="training:delete-program" ${state.programs.length === 1 ? 'disabled' : ''}>Delete program</button></div></div>
      <div class="weekday-picker" role="group" aria-label="Training day">${days.map((label,n)=>`<button type="button" data-action="training:day" data-day="${n}" class="${day === n ? 'selected' : ''}"><span>${label.slice(0,3)}</span><strong>${(program.days[n]||[]).length}</strong>${n === todayDay() ? '<i>TODAY</i>' : ''}</button>`).join('')}</div>
      <div class="training-day-head"><div><span class="training-kicker">${e(days[day].toUpperCase())} · ${items.length ? `${items.length} ${items.length === 1 ? 'EXERCISE' : 'EXERCISES'}` : 'REST OR OPEN DAY'}</span><h2>${items.length ? 'Your session' : 'Build this day'}</h2></div><div class="training-progress"><strong>${done} / ${planned}</strong><span>sets logged today</span></div></div>
      <div class="training-exercises">${items.length ? items.map((item,index)=>`<article class="training-exercise"><div class="training-exercise-head"><span class="training-order">${String(index+1).padStart(2,'0')}</span><div><h3>${e(item.name)}</h3><p>${item.sets} sets · target ${item.reps} reps</p></div><button type="button" data-action="training:remove-exercise" data-id="${e(item.id)}" aria-label="Remove ${e(item.name)}">×</button></div>${program.active && day === todayDay() ? `<div class="training-set-grid">${Array.from({length:item.sets},(_,n)=>{const log=logged(state,program,item,n+1);return `<div class="training-set ${log?'done':''}"><span>SET ${n+1}</span><div><button type="button" data-action="training:decrement" data-id="${e(item.id)}" data-set="${n+1}" aria-label="Decrease reps">−</button><strong>${log?.reps ?? 0}</strong><button type="button" data-action="training:increment" data-id="${e(item.id)}" data-set="${n+1}" aria-label="Increase reps">＋</button></div><small>${log?'logged':`aim ${item.reps}`}</small></div>`}).join('')}</div>`:''}</article>`).join('') : '<div class="training-empty">Leave this day open for rest, or add your first exercise.</div>'}</div>
      <button type="button" class="training-add-day" data-action="training:open-browser"><span>＋</span><strong>Add exercises to ${e(days[day])}</strong><span aria-hidden="true">↗</span></button>
      <section class="training-share"><div><span class="training-kicker">SHARE WITH YOUR EXPERT</span><h2>Keep your coach in the loop</h2><p>Only an expert you’ve booked can review a program you choose to share. You can stop sharing at any time.</p></div><div class="training-share-action">${state.previewBookedExpert ? `<button type="button" data-action="training:share">${program.sharedExpertId ? 'Stop sharing with Alex Morgan' : 'Share with Alex Morgan'}</button><small>${program.sharedExpertId ? 'Alex can review this program in the expert preview.' : 'Booked expert · preview session'}</small>` : `<button type="button" data-action="training:book-preview">Add a sample booking</button><small>A booking is required before sharing.</small>`}</div></section>
    </section>`;
  }

  function browseHome(state) {
    const program = current(state);
    const byCategory = categories().map(category => ({category,count:catalog.filter(x=>x.category===category).length}));
    return `<section class="training-studio training-browser">${back(`${program?.name || 'Program'} · ${days[state.selectedDay]}`,'back-program')}
      <div class="training-browser-hero"><div><span class="training-kicker">EXERCISE LIBRARY</span><h2>Browse exercises</h2><p>${catalog.length.toLocaleString()} movements with category, target, equipment, and step-by-step technique data.</p></div><form data-training-form="search" class="training-browser-search"><label>Search by exercise name<input name="query" placeholder="e.g. barbell squat"/></label><button type="submit">Search exercises</button></form></div>
      <div class="training-category-grid" role="group" aria-label="Browse exercise categories">${byCategory.map(({category,count})=>`<button type="button" data-action="training:category" data-category="${e(category)}"><span>${e(category)}</span><strong>${count}</strong></button>`).join('')}</div>
      <button type="button" class="training-all" data-action="training:all-exercises">Browse all exercises <span aria-hidden="true">↗</span></button>
      <p class="training-credit">Exercise text: Hasan Emir Yıldırım / exercises-dataset (MIT). Illustrative SVG previews: Flow Exercise Dataset (CC0 dedication).</p>
    </section>`;
  }

  function browseResults(state) {
    const matches = catalog.filter(x => (state.exerciseCategory === 'All' || x.category === state.exerciseCategory) && (state.exerciseEquipment === 'All' || x.equipment === state.exerciseEquipment) && (state.exerciseTarget === 'All' || x.target === state.exerciseTarget) && `${x.name} ${x.target} ${x.equipment}`.toLowerCase().includes(state.exerciseQuery.toLowerCase()));
    const pageSize = 20;
    const pages = Math.max(1,Math.ceil(matches.length/pageSize));
    const page = Math.min(state.exercisePage,pages-1);
    const visible = matches.slice(page*pageSize,(page+1)*pageSize);
    return `<section class="training-studio training-browser">${back('Browse exercises','browse-home')}
      <div class="training-browser-results-head"><div><span class="training-kicker">${e(current(state)?.name || 'PROGRAM')} · ${e(days[state.selectedDay].toUpperCase())}</span><h2>Exercise catalog</h2><p>Filter the library, open a movement, then add it to this day.</p></div></div>
      <form data-training-form="filters" class="training-filter-bar"><label>Exercise name<input name="query" value="${e(state.exerciseQuery)}" placeholder="e.g. dumbbell curl"/></label><label>Category<select name="category">${optionList(categories(),state.exerciseCategory,'All categories')}</select></label><label>Equipment<select name="equipment">${optionList(equipment(),state.exerciseEquipment,'All equipment')}</select></label><label>Target muscle<select name="target">${optionList(targets(),state.exerciseTarget,'All targets')}</select></label><button type="submit">Apply filters</button><button type="button" data-action="training:clear-filters">Clear</button></form>
      <div class="training-results-bar"><span><strong>${matches.length.toLocaleString()}</strong> results</span><small>Page ${page+1} of ${pages}</small></div>
      ${visible.length ? `<div class="training-result-grid">${visible.map(x=>`<article class="training-result-card">${preview(x,true)}<button type="button" class="training-result-copy" data-action="training:exercise" data-id="${e(x.id)}"><small>${e(x.category)}</small><strong>${e(x.name)}</strong><span>${e(x.target)} · ${e(x.equipment)}</span><span class="training-result-open">View movement <span aria-hidden="true">↗</span></span></button></article>`).join('')}</div>` : '<div class="training-empty">No exercises match these filters. Clear a filter or try a shorter name.</div>'}
      <nav class="training-pagination" aria-label="Exercise result pages"><button type="button" data-action="training:page" data-page="${page-1}" ${page===0?'disabled':''}>← Previous</button><span>${page+1} / ${pages}</span><button type="button" data-action="training:page" data-page="${page+1}" ${page+1>=pages?'disabled':''}>Next →</button></nav>
      <p class="training-credit">Exercise text: Hasan Emir Yıldırım / exercises-dataset (MIT). Illustrative SVG previews: Flow Exercise Dataset (CC0 dedication).</p>
    </section>`;
  }

  function exerciseDetail(state) {
    const exercise = catalog.find(x=>x.id===state.selectedExerciseId);
    if (!exercise) return browseResults(state);
    const steps = Array.isArray(exercise.steps) ? exercise.steps : [];
    return `<section class="training-studio training-browser">${back('Exercise results','back-results')}
      <div class="training-detail-header"><span class="training-kicker">${e(exercise.category.toUpperCase())} · EXERCISE ${e(exercise.id)}</span><h2>${e(exercise.name)}</h2><p>${e(exercise.instructions || 'Follow the technique steps and train with control.')}</p></div>
      <div class="training-detail-grid"><section class="training-detail-profile"><h3>Movement profile</h3><dl><div><dt>Target muscle</dt><dd>${e(exercise.target)}</dd></div><div><dt>Equipment</dt><dd>${e(exercise.equipment)}</dd></div><div><dt>Category</dt><dd>${e(exercise.category)}</dd></div></dl>${preview(exercise)}</section><section class="training-detail-steps"><h3>Technique sequence</h3>${steps.length ? `<ol>${steps.map((step,index)=>`<li><span>${String(index+1).padStart(2,'0')}</span><p>${e(step)}</p></li>`).join('')}</ol>` : `<p>${e(exercise.instructions || '')}</p>`}</section></div>
      <form data-training-form="add-exercise" class="training-detail-add"><div><span class="training-kicker">ADD TO ${e(days[state.selectedDay].toUpperCase())}</span><h3>Set your target</h3><p>You can change these targets later in your program.</p></div><label>Sets<input name="sets" type="number" min="1" max="30" value="${state.exerciseSets}" required/></label><label>Target reps<input name="reps" type="number" min="1" max="1000" value="${state.exerciseReps}" required/></label><button type="submit">Add to ${e(days[state.selectedDay])} ↗</button></form>
    </section>`;
  }

  function expert(state) {
    const shared = state.programs.filter(p => p.sharedExpertId === 'alex' && state.previewBookedExpert);
    return `<section class="training-studio"><div class="training-toolbar"><div><span class="training-kicker">MEMBER-CHOSEN ACCESS</span><h2>Programs shared with you</h2><p>These schedules are read only. Ask the member before suggesting changes.</p></div></div>${shared.length ? shared.map(program=>`<article class="shared-program"><div class="training-day-head"><div><span class="training-kicker">MAYA CHEN · BOOKED MEMBER</span><h2>${e(program.name)}</h2></div><span class="shared-badge">SHARED WITH YOU</span></div><div class="shared-week">${days.map((label,day)=>`<div><strong>${e(label)}</strong><span>${(program.days[day]||[]).map(item=>`${e(item.name)} · ${item.sets} × ${item.reps}`).join('<br/>')||'Rest day'}</span></div>`).join('')}</div></article>`).join('') : '<div class="training-empty">No programs are shared yet. Switch to Member, add a sample booking, and share a program to preview this view.</div>'}</section>`;
  }

  function member(state) {
    if (state.trainingScreen === 'program') return programView(state);
    if (state.trainingScreen === 'browse-home') return browseHome(state);
    if (state.trainingScreen === 'browse-results') return browseResults(state);
    if (state.trainingScreen === 'exercise-detail') return exerciseDetail(state);
    return programs(state);
  }

  function handleClick(button,state,sync,notify) {
    const action=button.dataset.action;
    if (!action?.startsWith('training:')) return false;
    const program=current(state);
    const go=screen=>{state.trainingScreen=screen;sync();window.scrollTo({top:0,behavior:'smooth'});};
    if (action==='training:create-program') { state.trainingScreen='programs';sync();document.querySelector('#new-program')?.focus();return true; }
    if (action==='training:open-program') { state.selectedProgramId=button.dataset.id;go('program');return true; }
    if (action==='training:back-programs') { go('programs');return true; }
    if (action==='training:back-program') { go('program');return true; }
    if (action==='training:open-browser') { go('browse-home');return true; }
    if (action==='training:browse-home') { go('browse-home');return true; }
    if (action==='training:all-exercises') { state.exerciseCategory='All';state.exerciseEquipment='All';state.exerciseTarget='All';state.exerciseQuery='';state.exercisePage=0;go('browse-results');return true; }
    if (action==='training:category') { state.exerciseCategory=button.dataset.category;state.exerciseEquipment='All';state.exerciseTarget='All';state.exerciseQuery='';state.exercisePage=0;go('browse-results');return true; }
    if (action==='training:clear-filters') { state.exerciseCategory='All';state.exerciseEquipment='All';state.exerciseTarget='All';state.exerciseQuery='';state.exercisePage=0;sync();return true; }
    if (action==='training:page') { state.exercisePage=Math.max(0,Number(button.dataset.page));sync();window.scrollTo({top:0,behavior:'smooth'});return true; }
    if (action==='training:exercise') { state.selectedExerciseId=button.dataset.id;go('exercise-detail');return true; }
    if (action==='training:toggle-preview') {
      const exercise = catalog.find(item => item.id === button.dataset.id);
      if (!exercise) return true;
      const node = button.closest('[data-flow-preview]');
      if (pausedPreviews.has(exercise.id)) { pausedPreviews.delete(exercise.id); node.dataset.manualPlay = 'true'; }
      else { pausedPreviews.add(exercise.id); node.dataset.manualPlay = ''; node.querySelector('img').src = previewPath(exercise,0); }
      const playing = !pausedPreviews.has(exercise.id);
      button.textContent = playing ? 'Pause' : 'Play';
      button.setAttribute('aria-pressed', String(playing));
      button.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} preview of ${exercise.name}`);
      return true;
    }
    if (action==='training:back-results') { go('browse-results');return true; }
    if (action==='training:day') { state.selectedDay=Number(button.dataset.day);sync();return true; }
    if (action==='training:today') { state.selectedDay=todayDay();go('program');return true; }
    if (action==='training:activate') { state.programs.forEach(p=>{p.active=p.id===program.id});notify(`${program.name} is now active`);return true; }
    if (action==='training:delete-program') { if(state.programs.length>1&&confirm(`Delete ${program.name}?`)){state.programs=state.programs.filter(p=>p.id!==program.id);state.selectedProgramId=state.programs[0].id;if(!state.programs.some(p=>p.active))state.programs[0].active=true;state.trainingScreen='programs';notify('Program deleted')}return true; }
    if (action==='training:remove-exercise') {program.days[state.selectedDay]=(program.days[state.selectedDay]||[]).filter(item=>item.id!==button.dataset.id);notify('Exercise removed');return true;}
    if (action==='training:increment'||action==='training:decrement') {if(!program.active||state.selectedDay!==todayDay()){notify('Activate this program and choose today to log reps');return true}const item=(program.days[state.selectedDay]||[]).find(x=>x.id===button.dataset.id);if(!item)return true;const key=logKey(program,item,Number(button.dataset.set));const old=state.trainingLogs.find(x=>x.key===key);const next=Math.max(0,Math.min(1000,(old?.reps||0)+(action==='training:increment'?1:-1)));state.trainingLogs=state.trainingLogs.filter(x=>x.key!==key);if(next)state.trainingLogs.push({key,reps:next});sync();return true;}
    if (action==='training:book-preview') {state.previewBookedExpert=true;notify('Sample booking with Alex Morgan added');return true;}
    if (action==='training:share') {if(!state.previewBookedExpert)return true;program.sharedExpertId=program.sharedExpertId?'':'alex';notify(program.sharedExpertId?'Program shared with Alex Morgan':'Program sharing stopped');return true;}
    return true;
  }

  function handleSubmit(event,state,sync,notify) {
    const type=event.target.dataset.trainingForm;
    if (!type) return false;
    event.preventDefault();
    const data=new FormData(event.target);
    if(type==='program'){const name=String(data.get('name')||'').trim();if(!name)return true;const program={id:id(),name,active:state.programs.length===0,sharedExpertId:'',days:{}};state.programs.push(program);state.selectedProgramId=program.id;notify(`${name} created. Open its card to build the week.`);return true;}
    if(type==='search'){state.exerciseQuery=String(data.get('query')||'').trim();state.exerciseCategory='All';state.exerciseEquipment='All';state.exerciseTarget='All';state.exercisePage=0;state.trainingScreen='browse-results';sync();window.scrollTo({top:0,behavior:'smooth'});return true;}
    if(type==='filters'){state.exerciseQuery=String(data.get('query')||'').trim();state.exerciseCategory=String(data.get('category')||'All');state.exerciseEquipment=String(data.get('equipment')||'All');state.exerciseTarget=String(data.get('target')||'All');state.exercisePage=0;sync();return true;}
    if(type==='add-exercise'){const program=current(state),item=catalog.find(x=>x.id===state.selectedExerciseId);const sets=Number(data.get('sets')),reps=Number(data.get('reps'));if(!program||!item||!Number.isInteger(sets)||sets<1||sets>30||!Number.isInteger(reps)||reps<1||reps>1000)return true;(program.days[state.selectedDay]||=([])).push({id:id(),exerciseId:item.id,name:item.name,sets,reps});state.exerciseSets=sets;state.exerciseReps=reps;state.trainingScreen='program';state.selectedExerciseId='';notify(`${item.name} added to ${days[state.selectedDay]}`);window.scrollTo({top:0,behavior:'smooth'});return true;}
    return true;
  }

  window.HealthyLifeTraining={member,expert,handleClick,handleSubmit,afterRender,state:()=>null,sync:()=>{}};
  fetch('../shared/exercises.json').then(r=>r.ok?r.json():fallback).then(items=>{catalog=items;window.HealthyLifeTraining.sync()}).catch(()=>{});
})();
