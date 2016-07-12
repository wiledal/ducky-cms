'use strict';

const koa = require('koa');
const koaRouter = require('koa-router');
const koaStatic = require('koa-static');
const koaMount = require('koa-mount');
const koaBody = require('koa-body');
const helpers = require(`${__dirname}/../lib/helpers.js`);

const marked = require('marked');
const nedb = require('nedb-promise');
const clientGulp = require('./client-gulpfile.js');
const nunjucks = require('nunjucks');
const glob = require('glob-promise');
const path = require('path');

const exec = require('child_process').exec;
function execp(command, args) {
  return new Promise((resolve, reject) => {
    exec(command, args, (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        resolve(err);
        return;
      }
      if (stdout) {
        console.log(stdout);
        resolve(stdout);
      }
      if (stderr) {
        console.log(stderr.red);
        resolve(stderr);
      }
    });
  });
}

module.exports = (options) => {
  const port = options.port | 3000;
  const projectPath = process.cwd();

  // Run app
  const app = koa();
  const router = koaRouter(app);
  const db = new nedb({
    filename: `${projectPath}/.duckycms/content.db`,
    autoload: true
  });

  const nun = nunjucks.configure(`${__dirname}/templates`, {
    watch: true
  });

  nun.addGlobal('slugify', helpers.slugify);
  nun.addFilter('slugify', helpers.slugify);

  // Nunjucks middleware
  app.context.render = function(file, options) {
    this.body = nun.render(`${file}.njk`, options);
  }

  // MIDDLEWARE INITS
  app.use(koaMount('/', koaStatic(`${projectPath}/build`)));
  app.use(koaMount('/admin/assets', koaStatic(__dirname + '/assets')));
  app.use(koaBody());
  app.use(router.routes());

  // Routes
  router.get('/admin', function*() {
    var contentTypes = yield db.find({ _type: 'content-type' });
    return this.render('views/index', {
      contentTypes: contentTypes
    });
  });
  router.get('/admin/content/:slug', function*() {
    var contentTypes = yield db.find({ _type: 'content-type' });
    var contentType = yield db.findOne({ _slug: this.params.slug });
    var docs = yield db.find({ _contentType: contentType._slug });
    this.render('views/content', {
      contentTypes: contentTypes,
      contentType: contentType,
      docs: docs
    });
  });
  router.get('/admin/content/:id/edit', function*() {
    var doc = yield db.findOne({ _id: this.params.id });
    var contentTypes = yield db.find({ _type: 'content-type' });
    var contentType = yield db.findOne({ _slug: doc._contentType });

    var templates = yield glob(`${projectPath}/templates/views/**/*.njk`);
    templates = templates.map((t) => {
      return path.basename(t, path.extname(t));
    });

    this.render('views/content-edit', {
      templates: templates,
      contentType: contentType,
      contentTypes: contentTypes,
      doc: doc,
      selectedTemplate: doc._template
    });
  });
  router.get('/admin/content/:slug/new', function*() {
    var contentTypes = yield db.find({ _type: 'content-type' });
    var contentType = yield db.findOne({ _slug: this.params.slug });
    var templates = yield glob(`${projectPath}/templates/views/**/*.njk`);
    templates = templates.map((t) => {
      return path.basename(t, path.extname(t));
    });

    this.render('views/content-edit', {
      contentTypes: contentTypes,
      contentType: contentType,
      templates: templates,
      selectedTemplate: contentType._defaultTemplate
    });
  });

  router.get('/admin/content-types', function*() {
    var contentTypes = yield db.find({ _type: 'content-type' });
    this.render('views/content-types', {
      contentTypes: contentTypes
    });
  });
  router.get('/admin/content-types/:id/edit', function*() {
    var contentTypes = yield db.find({ _type: 'content-type' });
    var contentType = yield db.findOne({ _id: this.params.id });
    var templates = yield glob(`${projectPath}/templates/views/**/*.njk`);
    templates = templates.map((t) => {
      return path.basename(t, path.extname(t));
    });

    this.render('views/content-type-edit', {
      contentTypes: contentTypes,
      contentType: contentType,
      templates: templates,
      selectedTemplate: contentType._defaultTemplate
    });
  });
  router.get('/admin/content-types/new', function*() {
    var contentTypes = yield db.find({ _type: 'content-type' });
    var templates = yield glob(`${projectPath}/templates/views/**/*.njk`);
    templates = templates.map((t) => {
      return path.basename(t, path.extname(t));
    });

    this.render('views/content-type-edit', {
      contentTypes: contentTypes,
      templates: templates
    });
  });

  router.get('/admin/deploy', function*() {
    var contentTypes = yield db.find({ _type: 'content-type' });
    this.render('views/deploy', {
      contentTypes: contentTypes
    });
  });

  // Create new
  router.post('/admin/doc/', function*() {
    var doc = this.request.body;
    doc._slug = helpers.slugify(doc._name);
    doc._type = 'doc';
    doc._createdAt = +new Date();
    doc._updatedAt = +new Date();

    db.insert(doc);
    clientGulp.start('build');
  });
  router.put('/admin/doc/:id', function*() {
    var id = this.params.id;
    var doc = this.request.body;
    doc._slug = helpers.slugify(doc._name);
    doc._updatedAt = +new Date();

    db.update({ _id: id }, { $set: doc });

    this.body = {success: true};
    clientGulp.start('build');
  });
  router.delete('/admin/doc/:id', function*() {
    var id = this.params.id;
    db.remove({ _id: id });

    clientGulp.start('build');
  });

  router.post('/admin/content-type/', function*() {
    var doc = this.request.body;
    doc._slug = helpers.slugify(doc._name);
    doc._type = 'content-type';

    db.insert(doc)

    clientGulp.start('build');;
  });
  router.put('/admin/content-type/:id', function*() {
    var id = this.params.id;
    var doc = this.request.body;

    db.update({ _id: id }, { $set: doc });

    clientGulp.start('build');
  });
  router.delete('/admin/content-type/:id', function*() {
    var id = this.params.id;
    db.remove({ _id: id });

    clientGulp.start('build');
  });

  // deploy
  router.post('/admin/deploy', function*() {
    var method = this.request.body.method;

    if (method == 'surge') {
      var result = yield execp(`surge ./build --domain ${this.request.body.surge_url}`, {
        cwd: projectPath
      });
    }

    this.body = {
      success: true,
      message: result
    }
  });

  app.listen(port);
  console.log(`DuckyCMS is listening on ${port}. QUACK QUACK!`);

  clientGulp.start('watch');
};
