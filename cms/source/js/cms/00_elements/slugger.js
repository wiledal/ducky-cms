mikrom.component('.slugger', (el, attr) => {
  var slugField = document.querySelector('.field[cms-name="_name"] input');
  slugField.addEventListener('input', function() {
    el.value = cmsHelpers.slugify(slugField.value);
  });
})
