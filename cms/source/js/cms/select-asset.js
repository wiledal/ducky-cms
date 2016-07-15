var selectAssetModal = document.querySelector('.modal-select-asset');

var assets = [].slice.call(selectAssetModal.querySelectorAll('.asset'));
var currentAssetSelect = null;

assets.forEach(function(asset) {
  asset.addEventListener('click', function() {
    currentAssetSelect.parentNode.querySelector('input').value = asset.getAttribute('asset-src');
    currentAssetSelect.parentNode.querySelector('img').src = "/assets/uploads/" + asset.getAttribute('asset-src');
    selectAssetModal.style.display = '';
  })
})

function clickSelectAssetButton() {

    var target = this;
    currentAssetSelect = this;
    selectAssetModal.style.display = 'block';

}

function initSelectAssetButtons() {
  var selectAssetButtons = [].slice.call(document.querySelectorAll('.js-select-asset'));

  selectAssetButtons.forEach(function(b) {
    b.removeEventListener('click', clickSelectAssetButton);
    b.addEventListener('click', clickSelectAssetButton);
  });
}
