const cmsHelpers = {
  slugify(text) {
    return text.toString().toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/&/g, '-and-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  },
  toCamelCase(text) {
    return text.trim().toLowerCase().replace(/\s/gi, '-').replace(/-([a-z])/gi, function (g) { return g[1].toUpperCase(); });
  }
}
