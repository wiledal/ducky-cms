'use strict';

module.exports = {
  slugify: (s) => {
    return s.toString().toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/&/g, '-and-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }
}
