const package = require('./package.json');
const plugins = require('gulp-load-plugins')({
    pattern: ['*'],
    scope: ['devDependencies']
});

// Minify
plugins.gulp.task('minify', function() {
    return plugins.gulp.src('./src/**/*.js')
        .pipe(plugins.uglify()).on('error', function (error) {
            console.error(error);
        })
        .pipe(plugins.rename(function (path) {
            path.extname = '.min.js'
        }))
        .pipe(plugins.gulp.dest('./dist/'));
});

// Alias
plugins.gulp.task('default', []);
plugins.gulp.task('prod', ['minify']);