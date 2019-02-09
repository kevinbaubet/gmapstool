const plugins = require('gulp-load-plugins')({
    pattern: ['*'],
    scope: ['devDependencies']
});

// Minify
function minify(pumpCallback) {
    return plugins.pump([
        plugins.gulp.src('./src/**/*.js'),
        plugins.uglify(),
        plugins.rename(function (path) {
            path.extname = '.min.js'
        }),
        plugins.gulp.dest('./dist/')
    ], pumpCallback);
}

// Alias
exports.prod = plugins.gulp.parallel(minify);