mikrom.component('.js-upload-asset', (el) => {
  const uploader = document.querySelector('.modal-uploader');

  el.addEventListener('click', () => {
    uploader.style.display = 'block';
  })
})
