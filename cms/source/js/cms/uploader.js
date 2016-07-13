var uploader = document.querySelector('.modal-uploader');
var uploaderButton = document.querySelector('.js-upload-asset-button');
var uploaderModalButtons = [].slice.call(document.querySelectorAll('.js-upload-asset'));
var uploaderFile = document.querySelector('.js-uploader-file');

window.uploaderFile = uploaderFile;

uploaderModalButtons.forEach(function(b) {
  b.addEventListener('click', function() {
    uploader.style.display = 'block';
  })
});
uploaderButton.addEventListener('click', function() {
  var file = uploaderFile.files[0];
  var formData = new FormData();

  formData.append("file", file);

  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/admin/assets/upload", true);
  xhr.send(formData);

  xhr.onload = function() {
    setTimeout(function() {
      location.reload();
    }, 500);
  }
});
