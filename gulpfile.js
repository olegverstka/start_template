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
    runSequence = require('run-sequence');

handleError = function(err) {
    gutil.log(err);
    gutil.beep();
};

// Ftp
gulp.task('ftp', function () {
    return gulp.src('dist/**/*')
        .pipe(ftp({
            host: 'olegverstka.myjino.ru',
            user: 'olegverstka_test',
            pass: 'balyu1357oleg123',
            remotePath: '/'
        }))
        // you need to have some kind of stream after gulp-ftp to make sure it's flushed 
        // this can be a gulp plugin, gulp.dest, or any kind of stream 
        // here we use a passthrough stream 
        .pipe(gutil.noop());
});

// Минификация изображений
gulp.task('imgmin:build', function() {
    return gulp.src('app/img/*')
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

// // build css
// gulp.task('css:build', function() {
//     var assets = useref.assets();

//     return gulp.src('app/*.html')
//         .pipe(assets)
//         .pipe(gulpif('*.css', minifyCss()))
//         .pipe(assets.restore())
//         .pipe(useref())
//         .pipe(gulp.dest('dist'))
// });

// // build js
// gulp.task('js:build', function() {
//     var assets = useref.assets();

//     return gulp.src('app/*.html')
//         .pipe(assets)
//         .pipe(gulpif('*.js', uglify()))
//         .pipe(assets.restore())
//         .pipe(useref())
//         .pipe(gulp.dest('dist'))
// });

// Optimizing CSS and JavaScript 
gulp.task('useref', function() {
  var assets = useref.assets();

  return gulp.src('app/*.html')
    .pipe(assets)
    // Minifies only if it's a CSS file
    .pipe(gulpif('*.css', minifyCss()))
    // Uglifies only if it's a Javascript file
    .pipe(gulpif('*.js', uglify()))
    .pipe(assets.restore())
    .pipe(useref())
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

// gulp.task('build', ['clean', 'imgmin:build', 'fonts:build'], function() {
//     var assets = useref.assets();

//     return gulp.src('app/*.html')
//         .pipe(assets)
//         .pipe(useref())
//         .pipe(gulpif('app/*.js', uglify()))
//         .pipe(gulpif('app/*.css', minifyCss()))
//         .pipe(assets.restore())
//         .pipe(gulp.dest('dist'));
// });

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

// Compile sass into CSS & auto-inject into browsers
// gulp.task('sass', function() {
//     return gulp.src("app/scss/*.scss")
//         .pipe(sass())
//         .pipe(minifyCss())
//         .pipe(gulp.dest("app/css"))
//         .pipe(browserSync.stream());

// });

// Compile sass, compass
gulp.task('compass', function() {
  gulp.src('app/scss/**/*.scss')
    .pipe(compass({
      css: 'app/css',
      sass: 'app/scss',
    }))
    .pipe(minifyCss())
    .on('error', handleError)
    .pipe(gulp.dest('app/css'))
    .pipe(browserSync.stream());
});

gulp.task('default', ['serve']);