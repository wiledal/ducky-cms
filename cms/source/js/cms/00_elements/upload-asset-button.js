mikrom.component('.js-upload-asset-button', (el) => {
  el.addEventListener('click', () => {
    var uploaderFile = document.querySelector('.js-uploader-file');
    var file = uploaderFile.files[0];
    var formData = new FormData();

    formData.append("file", file);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/admin/assets/upload", true);
    xhr.send(formData);

    xhr.onload = () => {
      setTimeout(() => {
        location.reload();
      });
    };
  })
})
