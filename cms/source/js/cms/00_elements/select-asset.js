mikrom.component('.js-select-asset', (el) => {
  el.addEventListener('click', () => {
    var selectAssetModal = document.querySelector('.modal-select-asset');
    selectAssetModal.style.display = 'block';
    cms.currentAssetSelect = el;
  })
});
