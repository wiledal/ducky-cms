const gulp = require('gulp');
const sass = require('gulp-sass');
const include = require('gulp-include');
const watch = require('gulp-watch');
const sassGlob = require('gulp-sass-glob')
const babel = require('gulp-babel');
const mergeStream = require('merge-stream');

gulp.task('js', () => {
  const vendor = gulp.src('source/js/vendor.js')
    .pipe(include())
    .pipe(gulp.dest('assets/js'));

  const cms = gulp.src('source/js/cms.js')
    .pipe(include())
    .pipe(babel({
      presets: [
        'es2015'
      ]
    }))
      .pipe(gulp.dest('assets/js'))
});

gulp.task('css', () => {
  return gulp.src('source/css/cms.scss')
    .pipe(sassGlob())
    .pipe(sass())
    .pipe(gulp.dest('assets/css'));
});

gulp.task('static', () => {
  return gulp.src('source/static/**/*')
    .pipe(gulp.dest('assets'));
});

gulp.task('build', ['js', 'css', 'static']);
gulp.task('watch', ['build'], () => {
  watch('source/js/**/*.js', () => {
    gulp.start('js');
  });
  watch('source/css/**/*.scss', () => {
    gulp.start('css');
  });
  watch('source/static/**/*', () => {
    gulp.start('static');
  });
});
