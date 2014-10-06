'use strict';

var gulp = require('gulp'),
    prefix = require('gulp-autoprefixer'),
    minifyCss = require('gulp-minify-css'),
    usemin = require('gulp-usemin'),
    uglify = require('gulp-uglify'),
    minifyHtml = require('gulp-minify-html'),
    livereload = require('gulp-livereload'),
    imagemin = require('gulp-imagemin'),
    ngAnnotate = require('gulp-ng-annotate'),
    jshint = require('gulp-jshint'),
    rev = require('gulp-rev'),
    connect = require('gulp-connect'),
    proxy = require('proxy-middleware'),
    es = require('event-stream'),
    flatten = require('gulp-flatten'),
    clean = require('gulp-clean'),
    replace = require('gulp-replace'),
    browserify = require('gulp-browserify');

var yeoman = {
    app: 'src/',
    dist: 'www/',
    tmp: '.tmp/'
};

gulp.task('clean', function () {
    return gulp.src(yeoman.dist, {read: false}).
        pipe(clean());
});

gulp.task('clean:tmp', function () {
    return gulp.src(yeoman.tmp, {read: false}).
        pipe(clean());
});

gulp.task('copy', ['clean'], function () {
    return es.merge(gulp.src(yeoman.app + 'i18n/**').
            pipe(gulp.dest(yeoman.dist + 'i18n/')),
        gulp.src(yeoman.app + '**/*.{woff,svg,ttf,eot}').
            pipe(flatten()).
            pipe(gulp.dest(yeoman.dist + 'fonts/')));
});

gulp.task('images', function () {
    return gulp.src(yeoman.app + 'img/**').
        pipe(imagemin({optimizationLevel: 5})).
        pipe(gulp.dest(yeoman.dist + 'img'));
});


gulp.task('styles', [], function () {
    return gulp.src(yeoman.app + '{,**/**}*.css').
        pipe(gulp.dest(yeoman.tmp));
});

gulp.task('server', ['watch'], function () {
    connect.server(
        {
            root: [yeoman.app, yeoman.tmp],
            port: 9000,
            livereload: true
        }
    );
});

gulp.task('watch', function () {
    gulp.watch(yeoman.app + 'scripts/**', ['browserify']);
    gulp.watch(yeoman.app + 'img/**', ['images']);
    livereload();
});

gulp.task('server:dist', ['build'], function () {
    connect.server(
        {
            root: [yeoman.dist],
            port: 9000
        }
    );
});

gulp.task('build', ['clean', 'copy'], function () {
    gulp.run('usemin');
});

gulp.task('usemin', ['images', 'styles'], function () {
    return gulp.src(yeoman.app + '{,templates/}*.html').
        pipe(usemin({
            css: [
                prefix.apply(),
                replace(/[0-9a-zA-Z\-_\s\.\/]*\/([a-zA-Z\-_\.0-9]*\.(woff|eot|ttf|svg))/g, '/fonts/$1'),
                //minifyCss(),
                'concat',
                rev()
            ],
            html: [
                minifyHtml({empty: true, conditionals: true})
            ],
            js: [
                ngAnnotate(),
                uglify(),
                'concat',
                rev()
            ]
        })).
        pipe(gulp.dest(yeoman.dist));
});

gulp.task('default', function () {
    gulp.run('build');
});