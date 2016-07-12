'use strict';

const gulp = require('gulp');
const clean = require('gulp-clean');
const runSequence = require('run-sequence');
const exec = require('child_process').exec;
const fs = require('fs');
const watch = require('gulp-watch');
const path = require('path');
const helpers = require('../lib/helpers.js');

const nunjucks = require('nunjucks');
const nedb = require('nedb');
const jimp = require('jimp');
const marked = require('marked');

const projectPath = process.cwd();

function fileExists(p) {
  try {
    fs.statSync(p);
    return true;
  }catch(e) {
    return false;
  }
}

gulp.task('clean', () => {
  return gulp.src(`${projectPath}/build`, {read: false})
    .pipe(clean());
});
gulp.task('build', () => {
  console.log("Ducky::Building project - " + new Date());
  return runSequence('clean', 'assets', 'templates');
});

gulp.task('assets', () => {
  return gulp.src(`${projectPath}/assets/**/*`)
    .pipe(gulp.dest(`${projectPath}/build/assets`));
});
gulp.task('templates', (done) => {
  const nun = nunjucks.configure(`${projectPath}/templates`);
  const db = new nedb({
    filename: `${projectPath}/.duckycms/content.db`,
    autoload: true
  });

  nun.addGlobal('asset', function(name) {
    return '/assets/' + name;
  });
  nun.addGlobal('image', function(name, o) {
    var options = o || {};
    var imgPath = `${projectPath}/assets/img/${name}`;
    var imgExt = path.extname(imgPath);
    var imgName = path.basename(imgPath, imgExt);

    var modifiers = {
      width: options.width ? options.width : -1,
      height: options.height ? options.height : -1,
      fit: options.fit ? options.fit : 'contain'
    }

    var modifiersString = `-${modifiers.width == -1 ? "0" : modifiers.width}x${modifiers.height == -1 ? "0" : modifiers.height}_${modifiers.fit}`;
    var modifiedName = imgName + (o ? modifiersString : "") + imgExt;

    jimp.read(`${projectPath}/assets/img/${name}`, function(err, img) {
      if (err) return console.log(err.stack);

      if (o) {
        if (modifiers.fit == "contain") img.contain(modifiers.width, modifiers.height);
        if (modifiers.fit == "cover") img.cover(modifiers.width, modifiers.height);
        if (modifiers.fit == "resize") img.resize(modifiers.width, modifiers.height);
      }

      img.write(`${projectPath}/build/assets/img/${modifiedName}`);
    });

    return '/assets/img/' + modifiedName;
  });

  nun.addGlobal('slugify', helpers.slugify);
  nun.addFilter('markdown', (text) => {
    if (!text) return "";
    return marked(text);
  });

  const contentTypes = null;
  const docs = null;
  const assets = null;

  db.find({ _type: 'doc' }, (err, d) => {

    d.forEach((doc) => {
      var contentTypeSlug = doc._contentType;
      var nameSlug = doc._slug;

      if (!fileExists(`${projectPath}/build/${contentTypeSlug}`)) fs.mkdirSync(`${projectPath}/build/${contentTypeSlug}`);

      var html = nun.render(`views/${doc._template}.njk`, doc);
      fs.mkdirSync(`${projectPath}/build/${contentTypeSlug}/${nameSlug}`);
      fs.writeFileSync(`${projectPath}/build/${contentTypeSlug}/${nameSlug}/index.html`, html);
      if (doc._index) fs.writeFileSync(`${projectPath}/build/index.html`, html);
    })

    done();

  });

});

gulp.task('watch', ['build'], () => {
  watch(projectPath + '/templates/**/*', function() {
    gulp.start('build');
  });
  watch(projectPath + '/assets/**/*', function() {
    gulp.start('build');
  });
});

module.exports = gulp;
