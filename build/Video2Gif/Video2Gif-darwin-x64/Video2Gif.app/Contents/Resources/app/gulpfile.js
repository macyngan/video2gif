const gulp = require('gulp')
const concatCss = require('gulp-concat-css')
const run = require('gulp-run')
const babel = require('babelify')
const browserify = require('browserify')
const buffer = require('vinyl-buffer')
const uglify = require('gulp-uglify')
const tap = require('gulp-tap')
const sourcemaps = require('gulp-sourcemaps')
const watchify = require('watchify')

const src = './process'
const app = './app'

gulp.task("js", function () {
    return gulp.src(src + '/js/render.js' )
        .pipe(tap((file) => {
            file.contents = browserify(file.path, {
                debug: true
            }).transform(babel).bundle()
        }))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(app + '/js'))
})

gulp.task('html', function() {
    gulp.src( src + '/**/*.html')
})

gulp.task('css', function() {
    gulp.src( src + '/css/*.css')
        .pipe(concatCss('app.css'))
        .pipe(gulp.dest(app + '/css'))
})

gulp.task('fonts', function() {
    gulp.src('node_modules/bootstrap/dist/fonts/**/*')
        .pipe(gulp.dest(app + '/fonts'))
})

gulp.task('watch', ['serve'], function() {
    gulp.watch( src + '/js/**/*', ['js'])
    gulp.watch( src + '/css/**/*.css', ['css'])
    gulp.watch([ app + '/**/*.html'], ['html'])
})

gulp.task('serve', ['html', 'js', 'css'], function() {
    run('electron app/main.js').exec()
})

gulp.task('default', ['watch', 'fonts', 'serve'])
