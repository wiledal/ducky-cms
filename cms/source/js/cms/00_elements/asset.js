mikrom.component('.asset', (el, attr) => {
  var selectAssetModal = document.querySelector('.modal-select-asset');

  el.addEventListener('click', () => {
    cms.currentAssetSelect.parentNode.querySelector('input').value = attr.assetSrc;
    cms.currentAssetSelect.parentNode.querySelector('img').src = "/assets/uploads/" + attr.assetSrc;
    selectAssetModal.style.display = '';
  })
});
