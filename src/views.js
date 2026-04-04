export function initViews() {
  const app     = document.getElementById('app');
  const tabBtns = document.querySelectorAll('.tab-btn');

  function switchView(name) {
    app.classList.remove('view-map', 'view-build', 'view-charts');
    app.classList.add('view-' + name);
    tabBtns.forEach(btn =>
      btn.classList.toggle('active', btn.dataset.view === name)
    );
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  switchView('build');
}
