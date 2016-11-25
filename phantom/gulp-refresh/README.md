# gulp-refresh

[![Build Status](https://travis-ci.org/leo/gulp-refresh.svg?branch=master)](https://travis-ci.org/leo/gulp-refresh)
[![License](https://img.shields.io/npm/l/gulp-refresh.svg)](LICENSE.md)

A lightweight [gulp](https://github.com/gulpjs/gulp) plugin for livereload to be used with a livereload middleware of your choice:

- [Connect](https://www.npmjs.com/package/connect-livereload)
- [Koa](https://www.npmjs.com/package/koa-livereload)
- [Express](https://www.npmjs.com/package/express-livereload)

This repo is based on a fork of Cyrus David's [gulp-livereload](https://github.com/vohof/gulp-livereload). Since he hasn't been active since a long time, it seemed like a good idea to fork it. I'm also using it in a lot of my upcoming projects and I didn't want it to just die. Please keep in mind that `v1.0.0` of this plugin is equal to `v3.8.1` (the latest version) of the original plugin. So no extra effort. Just replace `gulp-livereload` with the latest version of `gulp-refresh` in your dependencies.

## Install

```
npm install --save-dev gulp-refresh
```

## Usage

```js
const gulp = require('gulp'),
      sass = require('gulp-sass'),
      refresh = require('gulp-refresh')

gulp.task('scss', () => {
  gulp
    .src('src/*.scss')
    .pipe(sass().on('error', sass.logError)))
    .pipe(gulp.dest('dist'))
    .pipe(refresh())
})

gulp.task('watch', () => {
  refresh.listen()
  gulp.watch('src/*.scss', ['scss'])
})
```

**Take a look at other examples [here](examples)**.

## Options

Can either be set through `livereload.listen(options)` or `livereload(options)`.

| Property name | Description                                               | Default value |
| ------------- | --------------------------------------------------------- | ------------- |
| port          | The server's port                                         |               |
| host          | The server's host                                         |               |
| basePath      | Path to prepend all given paths                           |               |
| start         | If the server should be started automatically             |               |
| quiet         | Disable console logging                                   | false         |
| reloadPage    | Path to the browser's current page for a full page reload | index.html    |

## API

### livereload([options])

Creates a stream which notifies the livereload server on what changed.

### .listen([options])

Starts a livereload server. It takes an optional options parameter that is the same as the one noted above. Also you dont need to worry with multiple instances as this function will end immediately if the server is already runing.

### .changed(path)

Alternatively, you can call this function to send changes to the livereload server. You should provide either a simple string or an object, if an object is given it expects the object to have a `path` property.

> NOTE: Calling this function without providing a `path` will do nothing.

### .reload([file])

You can also tell the browser to refresh the entire page. This assumes the page is called `index.html`, you can change it by providing an **optional** `file` path or change it globally with the options `reloadPage`.

### .middleware

You can also directly access the middleware of the underlying server instance (mini-lr.middleware) for hookup through express, connect, or some other middleware app

### .server

gulp-livereload also reveals the underlying server instance for direct access if needed. The instance is a "mini-lr" instance that this wraps around. If the server is not running then this will be `undefined`.

## Debugging

Set the `DEBUG` environment variables to `*` to see what's going on.

```
$ DEBUG=* gulp <task>
```
