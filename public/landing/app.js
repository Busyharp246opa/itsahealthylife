(() => {
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  if (menu && nav) {
    const closeMenu = () => { menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); };
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  }

  const dayTabs = [...document.querySelectorAll('.day-choice')];
  const dayPanel = document.getElementById('day-panel');
  const dayStory = document.querySelector('.day-story');
  const dayImages = [...document.querySelectorAll('[data-step-image]')];
  const dayVisualLabel = document.querySelector('.day-visual-label');
  const stories = [
    { index: '01 / 04 · MOVEMENT', title: 'Make movement your own.', body: 'Build a weekly training plan, discover exercises and record the reps you actually do.', action: 'Start your plan' },
    { index: '02 / 04 · NOURISHMENT', title: 'Notice what fuels you.', body: 'Log a meal and see the everyday patterns that help you feel good.', action: 'Track your day' },
    { index: '03 / 04 · CONNECTION', title: 'Find your people.', body: 'Meet trainers, request a session and share your training plan when you want guidance.', action: 'Meet the experts' },
    { index: '04 / 04 · MOMENTUM', title: 'Keep going together.', body: 'Celebrate your progress, join a challenge and share encouragement in the Circle.', action: 'Find your circle' },
  ];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const gsap = window.gsap;
  let activeStep = 0;
  function selectStep(index, focus = false) {
    if (!dayTabs.length || !dayStory || !dayPanel) return;
    const step = stories[index];
    const update = () => {
      dayTabs.forEach((tab, tabIndex) => {
        const selected = tabIndex === index;
        tab.classList.toggle('is-active', selected);
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      dayPanel.setAttribute('aria-labelledby', dayTabs[index].id);
      dayImages.forEach((image, imageIndex) => {
        const selected = imageIndex === index;
        image.classList.toggle('is-active', selected);
        if (selected) image.removeAttribute('aria-hidden');
        else image.setAttribute('aria-hidden', 'true');
      });
      if (dayVisualLabel) dayVisualLabel.textContent = `${String(index + 1).padStart(2, '0')} / ${dayTabs[index].querySelector('.choice-name').textContent.toUpperCase()}`;
      dayStory.querySelector('.story-index').textContent = step.index;
      dayStory.querySelector('h3').textContent = step.title;
      dayStory.querySelector('p:not(.story-index)').textContent = step.body;
      dayStory.querySelector('a').firstChild.textContent = `${step.action} `;
      if (focus) dayTabs[index].focus();
    };
    if (gsap && !reducedMotion.matches && index !== activeStep) {
      gsap.to(dayStory, { opacity: 0, y: 10, duration: .17, onComplete: () => {
        update();
        gsap.fromTo(dayStory, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .34, ease: 'power2.out' });
      }});
    } else {
      update();
    }
    activeStep = index;
  }
  dayTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectStep(index));
    tab.addEventListener('keydown', event => {
      const next = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? (index + 1) % dayTabs.length
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? (index + dayTabs.length - 1) % dayTabs.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? dayTabs.length - 1 : -1;
      if (next !== -1) { event.preventDefault(); selectStep(next, true); }
    });
  });

  if (gsap && !reducedMotion.matches && document.body.dataset.page === 'home') {
    gsap.to('.ticker>div', { x: -450, duration: 30, ease: 'none', repeat: -1 });
  }

  document.querySelectorAll('.faq-list details').forEach(detail => {
    detail.addEventListener('toggle', () => {
      if (detail.open) document.querySelectorAll('.faq-list details').forEach(other => { if (other !== detail) other.open = false; });
    });
  });
})();
