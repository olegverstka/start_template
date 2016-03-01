const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV == 'development';

var gulp        = require('gulp'),
    browserSync = require('browser-sync').create(),
    sass        = require('gulp-sass'),
    compass     = require('gulp-compass'),
    minifyCss   = require('gulp-minify-css'),
    useref      = require('gulp-useref'),
    gulpif      = require('gulp-if'),
    uglify      = require('gulp-uglify'),
    clean       = require('gulp-clean'),
    gutil       = require('gulp-util'),
    ftp         = require('gulp-ftp'),
    spritesmith = require('gulp.spritesmith'),
    imagemin    = require('gulp-imagemin'),
    pngquant    = require('imagemin-pngquant'),
    wiredep     = require('wiredep').stream,
    runSequence = require('run-sequence'),
    notify      = require("gulp-notify"),
    sourcemaps  = require('gulp-sourcemaps'),
    debug       = require('gulp-debug');

// Ftp
gulp.task('ftp', function () {
    return gulp.src('dist/**/*')
        .pipe(ftp({
            host: 'olegverstka.myjino.ru',
            user: 'olegverstka_test',
            pass: 'balyu1357oleg123',
            remotePath: '/'
        }))
        .pipe(debug({title: 'ftp'}))
        // you need to have some kind of stream after gulp-ftp to make sure it's flushed 
        // this can be a gulp plugin, gulp.dest, or any kind of stream 
        // here we use a passthrough stream 
        .pipe(gutil.noop());
});

// Подключаем ссылки на bower components
gulp.task('wiredep', function () {
    gulp.src('app/*.html')
        .pipe(wiredep())
        .pipe(debug({title: 'wiredep'}))
        .pipe(gulp.dest('app/'))
});

// Минификация изображений
gulp.task('imgmin:build', function() {
    return gulp.src('app/img/*')
        .pipe(debug({title: 'imgmin:build src'}))
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        }))
        .pipe(gulp.dest('dist/img'));
});

// Clean
gulp.task('clean', function() {
    return gulp.src('dist', {read: false})
        .pipe(clean());
});

// Optimizing CSS and JavaScript 
gulp.task('useref', function() {

  return gulp.src('app/*.html')
    .pipe(useref())
    // Minifies only if it's a CSS file
    .pipe(gulpif('css/*.css', minifyCss()))
    .pipe(debug({title: 'minify css'}))
    // Uglifies only if it's a Javascript file
    .pipe(gulpif('js/*.js', uglify()))
    .pipe(debug({title: 'uglify js'}))
    .pipe(gulp.dest('dist'))
});

// Переместим шрифты из папки src
gulp.task('fonts:build', function() {
    gulp.src('app/fonts/**/*.*')
        .pipe(gulp.dest('dist/fonts/'))
});

// Build
gulp.task('build', function (callback) {
  runSequence('clean', 'useref', ['imgmin:build', 'fonts:build'], callback);
});

// Static Server + watching scss/html files
gulp.task('serve', ['compass'], function() {

    browserSync.init({
        server: "./app"
    });

    gulp.watch("app/scss/**/*.scss", ['compass']);
    gulp.watch("app/js/**/*.js").on('change', browserSync.reload);
    gulp.watch("app/*.html").on('change', browserSync.reload);
});

// Минификация css
gulp.task('minify-css', function() {
  return gulp.src('css/*.css')
    .pipe(minifyCss())
    .pipe(gulp.dest('dist'));
});

// Создание спрайтов
gulp.task('sprite', function () {
    var spriteData =
        gulp.src('app/img/icons/*.png')
            .pipe(spritesmith({
                imgName: 'sprite.png',
                cssName: '_sprite.scss',
                cssFormat: 'scss',
                algorithm: 'binary-tree',
                padding: 20,
                cssVarMap: function(sprite) {
                    sprite.name = 's-' + sprite.name
                }
            }));

    spriteData.img.pipe(gulp.dest('app/img/'));
    spriteData.css.pipe(gulp.dest('app/scss/'));
});

// Compile sass, compass
gulp.task('compass', function() {
  gulp.src('app/scss/**/*.scss')
    .pipe(compass({
      css: 'app/css',
      sass: 'app/scss',
    }))
    .on('error', notify.onError(function(err) {
        return {
            title: 'compass',
            message: err.message
        };
    }))
    .pipe(minifyCss())
    .pipe(gulp.dest('app/css'))
    .pipe(browserSync.stream());
});

gulp.task('default', ['serve']);