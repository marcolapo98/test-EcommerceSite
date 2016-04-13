// Built: Sat, Jun 07, 2014 11:53:19 PM
/**
 * Prepros interface for Node
 * @author Carl-Erik Kopseng <carlerik@gmail.com>
 *
 * Built using `prepros/build_prepros.sh`
 */

var prepros = require('./angular-to-requirejs-adapter')
    , _ = require('lodash')
    , dummy = function() {}
    , Backbone = { Notifier : function() {
        this.info = dummy;
        this.notify = dummy;
        this.destroyAll = dummy;
    }}
    , angular = {
        fromJson : function() {
            return {
                version : -99,
                dependencies : {},
                ruby : {
                    gems : {},
                    bourbon : '',
                    neat : '',
                    bitters : ''
                }
            }
        }        ,
        toJson : JSON.stringify
    }
    , $ = { parseJSON : JSON.parse }
    , localStorage = {};
/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true, curly: false*/
/*global prepros, $, angular, _*/

prepros.factory("compiler", [

    '$filter',
    '$rootScope',
    'projectsManager',
    'fileTypes',
    'notification',
    'log',
    'liveServer',

    function ($filter, $rootScope, projectsManager, fileTypes, notification, log, liveServer) {

        "use strict";

        var fs = require('fs-extra'),
            path = require('path');

        var compileQueue = [];

        //function to compile
        function compile(pid, fid) {

            var queueId = fid + pid;

            if (!_.contains(compileQueue, queueId)) {

                var file = projectsManager.getFileById(pid, fid);

                if (_.isEmpty(file)) {
                    return;
                }

                compileQueue.push(queueId);

                var project = projectsManager.getProjectById(pid);

                fileTypes.compile(file, project, function (err) {

                    compileQueue = _.without(compileQueue, queueId);

                    if (err) {

                        $rootScope.$apply(function () {

                            log.add({
                                type: 'error',
                                title: 'Compilation Failed',
                                message: 'Failed to compile ' + file.name,
                                details: err.message + '\n' + path.join(project.path, file.input),
                                time: new Date().toISOString()
                            });
                        });

                        return notification.error('Compilation Failed', 'Failed to compile ' + file.name, err.message);
                    }

                    $rootScope.$apply(function () {

                        log.add({
                            type: 'success',
                            title: 'Compilation Successful',
                            message: 'Successfully compiled ' + file.name,
                            details: path.join(project.path, file.input),
                            time: new Date().toISOString()
                        });
                    });

                    notification.success('Compilation Successful', 'Successfully Compiled ' + file.name);

                    if (project.config.liveRefresh) {

                        var fullPath = (file.customOutput) ? path.resolve(project.path, file.customOutput) : $filter('interpolatePath')(file.input, project);

                        liveServer.refresh(project.id, fullPath, project.config.liveRefreshDelay);
                    }

                });
            }
        }

        return{
            compile: compile
        };

    }
]);

/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true*/
/*global prepros, angular, _, $*/

prepros.factory('config', [

    function () {

        'use strict';

        var fs = require('fs-extra'),
            path = require('path'),
            os = require('os');


        //Package.json path
        var packagePath = process.cwd();

        //Base path
        var basePath = path.join(packagePath, 'app');

        //Package.json file url
        var packageFileUrl = path.join(packagePath, 'package.json');

        //Read package.json file and get data of app in prepros object
        var packageData = angular.fromJson(fs.readFileSync(packageFileUrl).toString());

        //CachePath
        var cachePath = path.join(os.tmpdir(), 'PreprosCache');

        //Node modules required by the app
        var node_modules = packageData.dependencies;

        //Ruby Gems
        var ruby_gems = packageData.ruby.gems;

        //App version
        var version = packageData.version;

        //Read user config
        var userConfig = {};
        try {

            userConfig = $.parseJSON(localStorage.PreprosConfig || '{}');

        } catch (e) {

            window.alert('Error Reading Configurations ! Reverting to defaults.');

            saveUserOptions(userConfig);
        }

        var defaultConfig = {
            cssPath: 'css/',
            jsPath: 'js/',
            htmlPath: 'html/',
            minJsPath: 'min/',
            cssPathType: 'REPLACE_TYPE', //REPLACE_TYPE, RELATIVE_FILESDIR, RELATIVE_FILEDIR
            htmlPathType: 'REPLACE_TYPE',
            jsPathType: 'REPLACE_TYPE',
            minJsPathType: 'RELATIVE_FILEDIR',
            htmlTypes: 'jade, haml, slim, markdown, md',
            cssTypes: 'less, sass, stylus, scss, styl',
            jsTypes: 'coffee, coffeescript, coffeescripts, ls, livescript, livescripts',
            cssPreprocessorPath: '',
            htmlPreprocessorPath: '',
            jsPreprocessorPath: '',
            minJsPreprocessorPath: '',
            htmlExtension: '.html',
            enableSuccessNotifications: true,
            enableErrorNotifications: true,
            filterPatterns: 'node_modules', //Filter node modules folder by default
            autoprefixerBrowsers: '',
            liveRefreshDelay: 0,
            notificationTime: 3000,
            notificationDetails: false,
            experimental: {
                fileWatcher: false,
                autoAddRemoveFile: true
            },

            customRuby: {
                use: false,
                path: '',
                sass: false,
                slim: false,
                haml: false
            },

            //Default Less Options
            less: {
                autoCompile: true,
                compress: false,
                sourcemaps: false,
                cleancss: false,
                strictMath: false,
                strictUnits: false,
                autoprefixer: false
            },

            //Default Sass options
            sass: {
                autoCompile: true,
                lineNumbers: false,
                unixNewlines: false,
                sourcemaps: false,
                debug: false,
                compass: false,
                fullCompass: false,
                outputStyle: 'expanded', //compressed, nested, expanded, compact
                autoprefixer: false
            },


            //Default Stylus Options
            stylus: {
                autoCompile: true,
                lineNumbers: false,
                nib: false,
                compress: false,
                autoprefixer: false
            },

            //Default Markdown Options
            markdown: {
                autoCompile: true,
                sanitize: false,
                gfm: true
            },

            //Default Coffeescript Options
            coffee: {
                autoCompile: true,
                bare: false,
                uglify: false,
                mangle: true,
                iced: false,
                sourcemaps: false
            },

            //Default Livescript Options
            livescript: {
                autoCompile: true,
                bare: false,
                uglify: false,
                mangle: true
            },

            //Default javascript options
            javascript: {
                autoCompile: true,
                uglify: true,
                mangle: true,
                sourcemaps: false
            },

            //Default Jade  Options
            jade: {
                autoCompile: true,
                pretty: true
            },

            //Default Haml Options
            haml: {
                autoCompile: true,
                format: 'html5', //xhtml, html5
                outputStyle: 'indented', //indented, ugly
                doubleQuotes: false
            },

            //Default Slim  Options
            slim: {
                autoCompile: true,
                pretty: true,
                indent: 'default', //default, four, tab
                fourSpaceIndent: true,
                format: ':html5' //:xhtml, :html4, :html5, :html
            }
        };

        //Fill in the undefined values from default configurations
        userConfig = _.defaults(userConfig, defaultConfig);

        if (userConfig.jsMinPath) {

            userConfig.minJsPath = userConfig.jsMinPath;
            delete userConfig.jsMinPath;
        }

        for (var configKey in userConfig) {

            if (userConfig.hasOwnProperty(configKey) && typeof userConfig[configKey] === 'object') {

                userConfig[configKey] = _.defaults(userConfig[configKey], defaultConfig[configKey]);
            }
        }

        //Do not pass by refrence
        function getUserOptions() {
            return JSON.parse(angular.toJson(userConfig, false));
        }

        function saveUserOptions(options) {
            localStorage.setItem('PreprosConfig', angular.toJson(options));
            userConfig = JSON.parse(angular.toJson(options));
        }

        //Ruby Executable
        var ruby = {
            version: packageData.ruby.version,
            bourbon: path.join(packagePath, packageData.ruby.bourbon),
            neat: path.join(packagePath, packageData.ruby.neat),
            bitters: path.join(packagePath, packageData.ruby.bitters),
            getExec: function (fileType) {

                if (userConfig.customRuby.use && userConfig.customRuby.path !== '' && userConfig.customRuby[fileType]) {

                    return path.normalize(userConfig.customRuby.path);
                }

                return path.join(packagePath, packageData.ruby.path);

            },
            getGem: function (fileType) {

                var ft = (fileType === 'compass') ? 'sass' : fileType;

                var loader = path.join(basePath, '../bin/gems.rb');

                var gemPath = path.join(packagePath, packageData.ruby.gemPath);

                if (userConfig.customRuby.use && userConfig.customRuby.path !== '' && userConfig.customRuby[ft]) {

                    return [loader, 'custom', fileType];

                } else {

                    return [loader, gemPath, fileType];

                }
            }
        };

        return {
            cachePath: cachePath,
            basePath: basePath,
            ruby: ruby,
            node_modules: node_modules,
            ruby_gems: ruby_gems,
            getUserOptions: getUserOptions,
            saveUserOptions: saveUserOptions
        };

    }
]);
/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true*/
/*global prepros, _, $, Prepros*/

//Exception handler service
prepros.factory('$exceptionHandler', [

    function () {

        'use strict';

        var fs = require('fs-extra');
        var path = require('path');
        var os = require('os');

        //Replace console.warn to hide warnings
        console.warn = function () {
        };

        var handle = function (err) {

            var errorLogPath = require('path').join(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE, 'Prepros-Error-Log.html');

            fs.appendFile(errorLogPath, ' <div class="error"> \n <b> [ ' + new Date().toDateString() + ' : ' + new Date().toTimeString() + ' ]</b> \n <pre>\n ' + err.stack.toString() + '\n </pre> \n <hr> \n </div> \n');

            console.error(err, err.stack);

            if (err.message.indexOf('watch ') >= 0 || err.code === 'ECONNRESET') {
                return;
            }

            //Show and focus window
            Prepros.Window.show();
            Prepros.Window.focus();

            //Disable actions to prevent further errors
            $('body').css({pointerEvents: 'none'});
            $('.title-bar__control__icon.icon-close').parent('div').css({pointerEvents: 'auto'});
            $('.title-bar-sidebar-overlay').hide();
            $('.wrapper').html('<div style="margin: auto; display: block; text-align: center"><h1 style="font-size: 400%; font-weight: 200">Prepros Crashed :( </h1><p>I know you are feeling bad, I am also feeling the same :( <br> Please contact ' + Prepros.urls.emali + ' with error log file. <br>' + errorLogPath + '</p></div>');
        };

        process.on('uncaughtException', handle);

        return handle;
    }
]);/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true, loopfunc: true, curly: false*/
/*global prepros, _*/

prepros.factory('coffee', [

    '$filter',
    'concat',

    function ($filter, concat) {

        'use strict';

        var path = require('path');
        var fs = require('fs-extra');
        var ugly = require('uglify-js');

        var appendRegx = /#(?:\s|)@(?:\s|)(?:prepros|codekit)-append\s+(.*)/gi;
        var prependRegx = /#(?:\s|)@(?:\s|)(?:prepros|codekit)-prepend\s+(.*)/gi;

        var compile = function (file, project, callback) {

            var input = path.resolve(project.path, file.input);

            var output = (file.customOutput) ? path.resolve(project.path, file.customOutput) : $filter('interpolatePath')(file.input, project);

            var coffee = (file.config.iced) ? require('iced-coffee-script') : require('coffee-script');

            concat.getConcatList(input, {

                appendRegx: appendRegx,
                prependRegx: prependRegx

            }, function (err, list) {

                if (err) return callback(new Error('Unable read the concatenation list \n' + err.message));

                if (list.length > 1) {

                    var total = list.length;

                    var dataArray = [];

                    //Make slots for data
                    dataArray.length = list.length;

                    var _complete = function () {

                        if (!total) {

                            fs.outputFile(output, dataArray.join("\n"), function (err) {

                                if (err) return callback(new Error('Unable to write output file ' + err.message));

                                callback(null, input);
                            });
                        }
                    };

                    _.each(list, function (filePath, i) {

                        fs.readFile(filePath, 'utf8', function (err, js) {

                            if (err) return callback(new Error('Failed to read file \n' + err.message));

                            js = js.split("\n").map(function (line) {

                                if (!line.match(appendRegx) && !line.match(prependRegx)) return line;

                            });

                            js = js.join("\n");

                            var options = {
                                bare: file.config.bare,
                                input: js
                            };

                            try {

                                js = coffee.compile(js, options);

                            } catch (e) {

                                return callback(new Error('Error on line ' + (parseInt(e.location.first_line, 10) + 1) + ' of ' + input));

                            }

                            if (file.config.uglify) {

                                try {

                                    js = ugly.minify(js, {fromString: true, mangle: file.config.mangle}).code;

                                } catch (e) {

                                    return callback(new Error('Unable to uglify \n ' + e.message + ' \n ' + filePath));
                                }
                            }

                            --total;

                            dataArray[i] = js;

                            _complete();
                        });

                    });

                    return;
                }

                //If concatination is not used proceed to sourcemaps and single file compilation
                fs.readFile(input, 'utf8', function (err, data) {

                    if (err) return callback(new Error('Unable to read source file\n' + err.message));


                    var options = {
                        bare: file.config.bare,
                        input: data
                    };

                    var js;

                    if (file.config.sourcemaps) {

                        var sourceFiles;

                        if (input.substr(0, 1) === output.substr(0, 1)) {

                            sourceFiles = path.relative(path.dirname(output), input).replace(/\\/g, '/');

                        } else {

                            sourceFiles = input;

                        }

                        options.sourceMap = true;
                        options.sourceFiles = [sourceFiles];

                        var compiled;

                        var outmapName = output + '.map';

                        try {

                            compiled = coffee.compile(data, options);

                            js = compiled.js;

                            js += '\n //# sourceMappingURL=' + path.basename(outmapName);

                        } catch (e) {

                            return callback(new Error('Error on line ' + (parseInt(e.location.first_line, 10) + 1) + ' of ' + input));

                        }

                        fs.outputFile(outmapName, compiled.v3SourceMap, function (err) {

                            if (err) return callback(new Error('Unable to write sourcemap ' + err.message));

                            if (file.config.uglify) {

                                try {

                                    var compiled = ugly.minify(js, {
                                        fromString: true,
                                        inSourceMap: outmapName,
                                        outSourceMap: path.basename(outmapName),
                                        mangle: file.config.mangle
                                    });

                                    js = compiled.code;

                                    js += '\n //# sourceMappingURL=' + path.basename(outmapName);

                                    fs.outputFile(outmapName, compiled.map, function (err) {
                                        if (err) callback(new Error('Unable to write sourcemap ' + err.message));
                                    });

                                } catch (e) {

                                    return callback(new Error('Error on line ' + e.line + ' col ' + e.col + ' ' + e.message + ' of ' + input));
                                }
                            }

                            fs.outputFile(output, js, function (err) {

                                if (err) return callback(new Error('Unable to write output file ' + err.message));

                                callback(null, input);
                            });

                        });

                    } else {

                        try {

                            js = coffee.compile(data, options);

                        } catch (e) {

                            return callback(new Error('Error on line ' + (parseInt(e.location.first_line, 10) + 1) + ' of ' + input));

                        }

                        if (file.config.uglify) {

                            try {

                                js = ugly.minify(js, {fromString: true, mangle: file.config.mangle}).code;

                            } catch (e) {

                                return callback(new Error('Unable to uglify \n' + e.message + '\n' + input));
                            }
                        }

                        fs.outputFile(output, js, function (err) {

                            if (err) return callback(new Error('Unable to write output file ' + err.message));

                            callback(null, input);
                        });
                    }

                });
            });
        };

        return {
            compile: compile
        };
    }
]);/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true, loopfunc: true, curly: false*/
/*global prepros, _*/

prepros.factory('concat', [

    function () {

        'use strict';

        var fs = require('fs');
        var path = require('path');

        var getConcatList = function (filePath, options, callback) {

            var appendRegx = options.appendRegx;
            var prependRegx = options.prependRegx;

            var imports = [];

            filePath = path.normalize(filePath);

            fs.readFile(filePath, { encoding: 'utf8' }, function (err, data) {

                if (err) return callback(err);

                var appendList = [];
                var prependList = [];

                var result;

                var basedir = path.dirname(filePath);

                do {

                    result = appendRegx.exec(data);

                    if (result) {

                        var app = result[1].replace(/"|'|\n|;/gi, '').trim();

                        appendList.push(path.resolve(basedir, app))
                    }

                } while (result);

                do {

                    result = prependRegx.exec(data);

                    if (result) {

                        var prep = result[1].replace(/"|'|\n|;/gi, '').trim();

                        prependList.push(path.resolve(basedir, prep))

                    }

                } while (result);


                //Add file itself to the list so the file comes in the middle of appends and prepends
                var list = prependList.concat([filePath], appendList);

                var i = 0;

                (function next() {

                    var file = list[i++];

                    if (!file) {

                        return callback(null, imports);
                    }

                    //Do not read the file itself but just add to imports list
                    if (filePath === file) {

                        imports.push(file);
                        return next();
                    }

                    //Read child file for imports
                    getConcatList(file, options, function (err, res) {
                        if (err) return callback(err);
                        imports = imports.concat(res);
                        next();
                    });

                })(); //Start execution
            });
        };


        return {
            getConcatList: getConcatList
        };
    }
]);/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true, curly: false*/
/*global prepros*/

prepros.factory('haml', [

    'config',
    '$filter',

    function (config, $filter) {

        'use strict';

        var fs = require('fs-extra'),
            path = require('path'),
            cp = require('child_process');


        var compile = function (file, project, callback) {

            var input = path.resolve(project.path, file.input);

            var output = (file.customOutput) ? path.resolve(project.path, file.customOutput) : $filter('interpolatePath')(file.input, project);

            var args = config.ruby.getGem('haml');

            //Input and output
            args.push(input, output);

            //Load path for @imports
            args.push('--load-path', path.dirname(input));

            //Output format
            args.push('--format', file.config.format);

            //Output style
            args.push('--style', file.config.outputStyle);

            //Double quote attributes
            if (file.config.doubleQuotes) {
                args.push('--double-quote-attributes');
            }

            fs.mkdirs(path.dirname(output), function (err) {

                if (err) return callback(err);

                //Start a child process to compile the file
                var rubyProcess = cp.spawn(config.ruby.getExec('haml'), args);

                rubyProcess.once('error', function (e) {
                    callback(new Error('Unable to execute ruby —error ' + e.message));
                });

                var compileErr = false;

                //If there is a compilation error
                rubyProcess.stderr.on('data', function (data) {

                    compileErr = true;

                    callback(new Error(data.toString() + "\n" + input));

                });

                //Success if there is no error
                rubyProcess.once('exit', function () {

                    rubyProcess.removeAllListeners();

                    if (!compileErr) callback(null, input);

                    rubyProcess = null;
                });

            });
        };

        return {
            compile: compile
        };
    }
]);/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true, curly: false*/
/*global prepros*/

prepros.factory('jade', [

    '$filter',

    function ($filter) {

        'use strict';

        var fs = require('fs-extra');
        var path = require('path');
        var jade = require('jade');

        var compile = function (file, project, callback) {

            var input = path.resolve(project.path, file.input);

            var output = (file.customOutput) ? path.resolve(project.path, file.customOutput) : $filter('interpolatePath')(file.input, project);

            var options = {
                filename: input,
                pretty: file.config.pretty
            };

            fs.readFile(input, 'utf8', function (err, data) {

                if (err) return callback(new Error('Unable to read source file\n' + err.message));

                try {

                    var html = jade.compile(data, options)({
                        prepros: {
                            input: input,
                            output: output,
                            project: project.path
                        }
                    });

                    fs.outputFile(output, html, function (err) {

                        if (err) return callback(new Error('Unable to write compiled data. ' + err.message));

                        callback(null, input);

                    });

                } catch (err) {

                    callback(new Error(err.message + '\n' + input));
                }
            });
        };


        return {
            compile: compile
        };

    }
]);
/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true, loopfunc: true, curly: false*/
/*global prepros, _*/

prepros.factory('javascript', [

    'concat',
    '$filter',

    function (concat, $filter) {

        'use strict';

        var fs = require('fs-extra');
        var path = require('path');
        var ugly = require('uglify-js');

        var appendRegx = /\/\/(?:\s|)@(?:\s|)(?:prepros|codekit)-append\s+(.*)/gi;
        var prependRegx = /\/\/(?:\s|)@(?:\s|)(?:prepros|codekit)-prepend\s+(.*)/gi;

        var compile = function (file, project, callback) {

            var input = path.resolve(project.path, file.input);

            var output = (file.customOutput) ? path.resolve(project.path, file.customOutput) : $filter('interpolatePath')(file.input, project);

            concat.getConcatList(input, {

                appendRegx: appendRegx,
                prependRegx: prependRegx

            }, function (err, list) {

                if (err) return callback(new Error('Unable read the concatenation list \n' + err.message));


                if (file.config.uglify && file.config.sourcemaps) {

                    try {

                        var result = ugly.minify(list, {
                            outSourceMap: path.basename(output) + '.map',
                            mangle: file.config.mangle
                        });

                        if (file.config.sourcemaps) {
                            result.code += '\n//# sourceMappingURL=' + path.basename(output) + '.map';
                        }

                        fs.outputFile(output, result.code, function (err) {

                            if (err) return callback(new Error('Unable to write output file ' + err.message));

                            callback(null, input);
                        });

                        if (file.config.sourcemaps) {

                            var data = JSON.parse(result.map);

                            for (var i = 0; i < data.sources.length; i++) {

                                if (input.substr(0, 1) === data.sources[i].substr(0, 1)) {

                                    data.sources[i] = path.relative(path.dirname(output), data.sources[i]).replace(/\\/g, '/');

                                }
                            }

                            fs.outputFile(output + '.map', JSON.stringify(data), function (err) {

                                if (err) return callback(new Error('Unable to write sourcemap file ' + err.message));

                                callback(null, input);
                            });
                        }

                    } catch (e) {

                        callback(new Error('Error on line ' + e.line + ' col ' + e.col + ' ' + e.message));

                    }


                    return; //Stop execution bellow this

                }

                var total = list.length;

                var dataArray = [];

                //Make slots for data
                dataArray.length = list.length;

                var _complete = function () {

                    if (!total) {

                        fs.outputFile(output, dataArray.join("\n"), function (err) {

                            if (err) return callback(new Error('Unable to write output file ' + err.message));

                            callback(null, input);
                        });
                    }
                };


                _.each(list, function (filePath, i) {

                    fs.readFile(filePath, 'utf8', function (err, js) {

                        if (err) return callback(new Error('Failed to read file \n' + err.message));

                        js = js.split("\n").map(function (line) {

                            if (!line.match(appendRegx) && !line.match(prependRegx)) return line;

                        });

                        js = js.join("\n");

                        if (file.config.uglify && !/\.min.js$/.exec(path.basename(filePath))) {

                            try {

                                js = ugly.minify(js, {fromString: true, mangle: file.config.mangle}).code;

                            } catch (e) {

                                return callback(new Error('Error on line ' + e.line + ' col ' + e.col + ' ' + e.message + ' of ' + filePath));
                            }
                        }

                        --total;

                        dataArray[i] = js;

                        _complete();
                    });

                });
            });
        };

        return {
            compile: compile
        };
    }
]);
/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */


/*jshint browser: true, node: true, curly: false*/
/*global prepros*/

prepros.factory('less', [

    '$filter',

    function ($filter) {

        'use strict';

        var less = require('less');
        var path = require('path');
        var autoprefixer = require('autoprefixer');
        var fs = require('fs-extra');
        var CleanCss = require('clean-css');

        var compile = function (file, project, callback) {

            var input = path.resolve(project.path, file.input);

            var output = (file.customOutput) ? path.resolve(project.path, file.customOutput) : $filter('interpolatePath')(file.input, project);

            var options = {
                compress: file.config.compress,
                cleancss: file.config.cleancss && !file.config.sourcemaps, //Do not run if sourcemaps are enabled
                sourceMap: file.config.sourcemaps,
                sourceMapFilename: path.basename(output) + '.map',
                sourceMapRootpath: '',
                writeSourceMap: function (map) {

                    try {

                        //Small fix to make sourcemaps relative
                        var data = JSON.parse(map);

                        for (var i = 0; i < data.sources.length; i++) {

                            if (input.substr(0, 1) === data.sources[i].substr(0, 1)) {

                                data.sources[i] = path.relative(path.dirname(output), data.sources[i]).replace(/\\/g, '/');

                            }
                        }

                        fs.outputFile(output + '.map', JSON.stringify(data), function (err) {

                            if (err) callback(err);

                        });

                    } catch (e) {
                    }
                }

            };

            var parser = new (less.Parser)({
                paths: [path.dirname(input)],
                filename: input
            });


            fs.readFile(input, 'utf8', function (err, data) {

                if (err) return callback(new Error('Unable to read source file\n' + err.message));

                parser.parse(data, function (err, tree) {

                    if (err) return callback(new Error(err.message + "\n" + err.filename + ' line ' + err.line));

                    var css;

                    try {

                        css = tree.toCSS(options); //Fuck you, can't you just gimme callback from parser

                    } catch (err) {

                        return callback(new Error(err.message + "\n" + err.filename + ' line ' + err.line));
                    }


                    if (!file.config.sourcemaps && file.config.autoprefixer) {

                        try {

                            if (project.config.autoprefixerBrowsers) {

                                var autoprefixerOptions = project.config.autoprefixerBrowsers.split(',').map(function (i) {
                                    return i.trim();
                                });

                                css = autoprefixer.apply(null, autoprefixerOptions).compile(css);

                            } else {

                                css = autoprefixer().compile(css);
                            }

                            if (file.config.compress || file.config.cleancss) {

                                css = new CleanCss({processImport: false}).minify(css);
                            }

                        } catch (err) {

                            return callback(new Error('Failed to autoprefix css' + err.message));

                        }
                    }

                    fs.outputFile(output, css, function (err) {

                        if (err) return callback(new Error('Unable to write compiled data. ' + err.message));

                        callback(null, input);

                    });

                });
            });
        };

        return {
            compile: compile
        };

    }
]);
/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true, curly: false*/
/*global prepros*/

prepros.factory('livescript', [

    '$filter',

    function ($filter) {

        'use strict';

        var fs = require('fs-extra');
        var path = require('path');
        var livescript = require('LiveScript');
        var ugly = require('uglify-js');

        var compile = function (file, project, callback) {

            var input = path.resolve(project.path, file.input);

            var output = (file.customOutput) ? path.resolve(project.path, file.customOutput) : $filter('interpolatePath')(file.input, project);

            var options = {
                bare: file.config.bare
            };

            fs.readFile(input, 'utf8', function (err, data) {

                if (err) return callback(new Error('Unable to read source file\n' + err.message));

                try {

                    var javascript = livescript.compile(data, options);

                    if (file.config.uglify) {

                        javascript = ugly.minify(javascript, {fromString: true, mangle: file.config.mangle}).code;
                    }

                    fs.outputFile(output, javascript, function (err) {

                        if (err) return callback(new Error('Unable to write compiled data. ' + err.message));

                        callback(null, input);

                    });


                } catch (e) {

                    if (err) return callback(new Error(err.message + '\n' + input));
                }
            });


        };


        return {
            compile: compile
        };
    }
]);/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true, curly: false*/
/*global prepros*/

prepros.factory('markdown', [

    '$filter',

    function ($filter) {

        'use strict';

        var fs = require('fs-extra');
        var path = require('path');
        var marked = require('marked');

        var compile = function (file, project, callback) {

            var input = path.resolve(project.path, file.input);

            var output = (file.customOutput) ? path.resolve(project.path, file.customOutput) : $filter('interpolatePath')(file.input, project);

            marked.setOptions({
                gfm: file.config.gfm,
                sanitize: file.config.sanitize
            });

            fs.readFile(input, 'utf8', function (err, data) {

                if (err) return callback(new Error('Unable to read source file\n' + err.message));

                try {

                    var html = marked(data.toString());

                    fs.outputFile(output, html, function (err) {

                        if (err) return callback(new Error('Unable to write compiled data. ' + err.message));

                        callback(null, input);

                    });

                } catch (err) {

                    if (err) return callback(new Error('Unable to write compiled data. ' + err.message));

                }
            });
        };


        return {
            compile: compile
        };
    }
]);/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */


/*jshint browser: true, node: true, curly: false*/
/*global prepros, Prepros*/

prepros.factory('sass', [

    'config',
    '$filter',

    function (config, $filter) {

        'use strict';

        var fs = require('fs-extra');
        var path = require('path');
        var cp = require('child_process');
        var autoprefixer = require('autoprefixer');
        var CleanCss = require('clean-css');

        var compile = function (file, project, callback) {

            var input = path.resolve(project.path, file.input);

            var output = (file.customOutput) ? path.resolve(project.path, file.customOutput) : $filter('interpolatePath')(file.input, project);

            var args = [];

            if (file.config.compass && file.config.fullCompass) {

                args = config.ruby.getGem('compass');

                //Compass requires relative file path
                args.push('compile', path.relative(project.path, input).replace(/\\/gi, '/'));

                //No colors
                args.push('--boring');

            } else {

                args = config.ruby.getGem('sass');

                if (file.config.unixNewlines) {

                    args.push('--unix-newlines');
                }

                //Output and input must be in same drive for sourcemaps to work
                if (project.path.substr(0, 1) === output.substr(0, 1)) {

                    //Input and output
                    args.push(path.basename(input), path.relative(path.dirname(input), output));

                } else {

                    args.push(input, output);
                }

                //Load path for @imports
                args.push('--load-path', path.dirname(input));

                //Convert backslashes to double backslashes which weirdly escapes single quotes from sass cache path fix #52
                var cacheLocation = config.cachePath.replace(/\\\\/gi, '\\\\');

                //Cache location
                args.push('--cache-location', cacheLocation);

                //Output Style
                args.push('--style', file.config.outputStyle);

                //Compass
                if (file.config.compass) {

                    args.push('--compass');
                }

                if (file.config.sourcemaps && Prepros.PLATFORM_WINDOWS) {

                    args.push('--sourcemap');
                }

                if (file.config.debug) {

                    args.push('--debug-info');
                }

                //Sass bourbon
                args.push('--load-path', config.ruby.bourbon);

                //Bourbon neat framework
                args.push('--load-path', config.ruby.neat);

                //Bourbon bitters framework
                args.push('--load-path', config.ruby.bitters);

                if (file.config.lineNumbers) {
                    args.push('--line-numbers');
                }

                //Make output dir if it doesn't exist
                fs.mkdirsSync(path.dirname(output));
            }

            var cwd = (file.config.compass && file.config.fullCompass) ? project.path : path.dirname(input);

            var rubyProcess = cp.spawn(config.ruby.getExec('sass'), args, {cwd: cwd});

            var compileErr = false;

            rubyProcess.once('error', function (e) {

                compileErr = true;
                callback(new Error('Unable to execute ruby -error: ' + e.message));

            });

            //If there is a compilation error
            rubyProcess.stderr.on('data', function (data) {

                var string = data.toString().toLowerCase();

                //Dirty workaround to check if the message is real error or not
                if (string.length > 20 && string.indexOf('deprecation warning') < 0) {

                    compileErr = true;

                    callback(new Error(data.toString()));
                }

            });

            rubyProcess.stdout.on('data', function (data) {

                var string = data.toString().toLowerCase();

                if (string.indexOf('error') >= 0 && string.indexOf('deprecation warning') < 0) {

                    compileErr = true;

                    callback(new Error(data.toString()));
                }
            });

            //Success if there is no error
            rubyProcess.once('exit', function () {

                rubyProcess.removeAllListeners();

                if (file.config.fullCompass && file.config.compass && !compileErr) return callback(null, input);

                if (!compileErr) {

                    if (file.config.autoprefixer && !file.config.sourcemaps) {

                        fs.readFile(output, 'utf8', function (err, css) {

                            if (err) return callback(new Error('Autoprefixer: Failed to read file to autoprefix. ' + err.message));

                            try {

                                if (project.config.autoprefixerBrowsers) {

                                    var autoprefixerOptions = project.config.autoprefixerBrowsers.split(',').map(function (i) {
                                        return i.trim();
                                    });

                                    css = autoprefixer.apply(null, autoprefixerOptions).compile(css);

                                } else {

                                    css = autoprefixer().compile(css);
                                }

                                if (file.config.outputStyle === "compressed") {

                                    css = new CleanCss({processImport: false}).minify(css);
                                }

                                fs.outputFile(output, css, function (err) {

                                    if (err) {

                                        callback('Autoprefixer: Failed to write file ' + output + '\n' + err.message);

                                    } else {

                                        callback(null, input);
                                    }
                                });


                            } catch (e) {

                                callback('Failed autoprefix css\n' + e.message);

                            }

                        });

                    } else {

                        callback(null, input);
                    }

                }


                rubyProcess = null;
            });
        };

        return {
            compile: compile
        };
    }
]);/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true, curly: false*/
/*global prepros*/

prepros.factory('slim', [

    'config',
    '$filter',

    function (config, $filter) {

        'use strict';

        var fs = require('fs-extra'),
            path = require('path'),
            cp = require('child_process');


        var compile = function (file, project, callback) {

            var input = path.resolve(project.path, file.input);

            var output = (file.customOutput) ? path.resolve(project.path, file.customOutput) : $filter('interpolatePath')(file.input, project);

            var args = config.ruby.getGem('slim');

            args.push('-oformat=' + file.config.format);

            if (file.config.indent === 'four') {
                args.push('-oindent="    "');

            } else if (file.config.indent === 'tab') {

                args.push('-oindent="\t"');
            }

            //Input and output
            args.push(input, output);

            //Pretty
            if (file.config.pretty) args.push('--pretty');

            fs.mkdirs(path.dirname(output), function (err) {

                if (err) return callback(err);

                //Start a child process to compile the file
                var rubyProcess = cp.spawn(config.ruby.getExec('slim'), args, {cwd: path.dirname(input)});

                rubyProcess.once('error', function (e) {
                    callback(new Error('Unable to execute ruby —error ' + e.message));
                });

                var compileErr = false;

                //If there is a compilation error
                rubyProcess.stderr.on('data', function (data) {

                    compileErr = true;

                    callback(new Error(data.toString() + "\n" + input));

                });

                //Success if there is no error
                rubyProcess.once('exit', function () {

                    rubyProcess.removeAllListeners();

                    if (!compileErr)  callback(null, input);

                    rubyProcess = null;
                });

            });
        };

        return {
            compile: compile
        };
    }
]);/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */


/*jshint browser: true, node: true, curly: false*/
/*global prepros*/

prepros.factory('stylus', [

    '$filter',

    function ($filter) {

        'use strict';

        var path = require('path');
        var autoprefixer = require('autoprefixer');
        var fs = require('fs-extra');
        var CleanCss = require('clean-css');
        var stylus = require('stylus');
        var nib = require('nib');

        var compile = function (file, project, callback) {

            var input = path.resolve(project.path, file.input);

            var output = (file.customOutput) ? path.resolve(project.path, file.customOutput) : $filter('interpolatePath')(file.input, project);

            fs.readFile(input, 'utf8', function (err, data) {

                if (err) return callback(new Error('Unable to read source file\n' + err.message));

                var importPath = path.dirname(input);

                var compiler = stylus(data).set('filename', file.input).include(importPath);

                //Stylus nib plugin
                if (file.config.nib) compiler.use(nib());

                //Compress
                compiler.set('compress', file.config.compress);

                //Line numbers
                compiler.set('linenos', file.config.lineNumbers);

                //Render
                compiler.render(function (err, css) {

                    if (err) return callback(new Error(err.message));

                    if (file.config.autoprefixer) {

                        try {

                            if (project.config.autoprefixerBrowsers) {

                                var autoprefixerOptions = project.config.autoprefixerBrowsers.split(',').map(function (i) {
                                    return i.trim();
                                });

                                css = autoprefixer.apply(null, autoprefixerOptions).compile(css);

                            } else {

                                css = autoprefixer().compile(css);
                            }

                            if (file.config.compress) {

                                css = new CleanCss({processImport: false}).minify(css);
                            }

                        } catch (err) {

                            callback(new Error('Failed to autoprefix css' + err.message));

                        }
                    }

                    fs.outputFile(output, css, function (err) {

                        if (err) return callback(new Error('Unable to write compiled data. ' + err.message));

                        callback(null, input);

                    });

                });
            });
        };


        return {
            compile: compile
        };
    }
]);/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true, curly: false*/
/*global prepros, _*/

prepros.factory('fileTypes', [

    'config',
    'coffee',
    'haml',
    'importsVisitor',
    'jade',
    'javascript',
    'less',
    'livescript',
    'markdown',
    'sass',
    'slim',
    'stylus',

    function (config, coffee, haml, importsVisitor, jade, javascript, less, livescript, markdown, sass, slim, stylus) {

        'use strict';

        var path = require('path');
        var fs = require('fs');

        //Map extension with file type
        var typeMap = {
            less: less,
            sass: sass,
            scss: sass,
            styl: stylus,
            md: markdown,
            markdown: markdown,
            coffee: coffee,
            js: javascript,
            jade: jade,
            haml: haml,
            slim: slim,
            ls: livescript
        };


        //function to format file based on it's type
        function format(pid, fid, filePath, projectPath, callback) {

            var extname = path.extname(filePath).toLowerCase().slice(1);

            var configTypes = {
                less: "less",
                sass: "sass",
                scss: "sass",
                styl: "stylus",
                md: "markdown",
                markdown: "markdown",
                coffee: "coffee",
                js: "javascript",
                jade: "jade",
                haml: "haml",
                slim: "slim",
                ls: "livescript"
            };

            var file = {
                id: fid,
                pid: pid,
                name: path.basename(filePath),
                input: path.relative(projectPath, filePath),
                customOutput: false,
                type: extname.charAt(0).toUpperCase() + extname.slice(1), //Capitalize First Letter
                config: config.getUserOptions()[configTypes[extname]]
            };

            //Some type Exceptions
            if (extname === 'markdown') file.type = 'MD';
            if (extname === 'styl') file.type = 'Stylus';

            //Use full compass if config.rb file is present
            if (extname === 'sass' || extname === 'scss') {

                fs.exists(path.join(projectPath, 'config.rb'), function (exists) {

                    if (exists) {

                        file.config.compass = true;
                        file.config.fullCompass = true;

                        callback(null, file);

                    } else {

                        callback(null, file);
                    }
                });

            } else {

                setTimeout(function () {
                    callback(null, file);
                }, 0);

            }
        }

        //Function to compile file based on it's type
        function compile(file, project, callback) {

            var extname = path.extname(file.input).toLowerCase().slice(1);

            typeMap[extname].compile(file, project, callback);

        }

        //Function to check if extension is supported
        function isExtSupported(filePath) {

            return !!getInternalType(filePath);

        }

        //Function to check if file is supported
        function isFileSupported(filePath) {

            //supported extension, Dot file, minified javascript, partial

            return isExtSupported(filePath) && !/\\\.|\/\./.test(filePath) && !/\.min.js$/.test(path.basename(filePath)) && !/^_/.test(path.basename(filePath));

        }

        //Get the default extension of compiled output
        function getCompiledExtension(filePath) {

            var internalType = getInternalType(filePath);

            switch (internalType) {

                case "JS":
                    return '.js';
                case "CSS":
                    return '.css';
                case "HTML":
                    return '.html';
                default:
                    return '';
            }
        }

        //Function return list of imports if file supports importing
        function getImports(filePath, callback) {

            var ext = path.extname(filePath).slice(1);

            var can = ['less', 'sass', 'scss', 'jade', 'styl', 'slim', 'js', 'coffee'];

            if (_.contains(can, ext)) {

                importsVisitor.getImports(filePath, callback);

            } else {

                setTimeout(function () {
                    callback(null, []);
                }, 0);
            }

        }

        //Function to get internal type like HTML, CSS, JS
        function getInternalType(filePath) {

            var ext = path.extname(filePath).slice(1);

            var css = ['scss', 'sass', 'styl', 'less'];
            var js = ['coffee', 'ls', 'js'];
            var html = ['jade', 'haml', 'md', 'markdown', 'slim'];
            var image = ['jpg', 'jpeg', 'png', 'tif', 'tiff'];

            if (_.contains(css, ext)) {

                return 'CSS';

            } else if (_.contains(html, ext)) {

                return 'HTML';

            } else if (_.contains(js, ext)) {

                return 'JS';

            } else if (_.contains(image, ext)) {

                return 'IMAGE';

            } else {

                return '';
            }
        }

        return {
            compile: compile,
            format: format,
            isExtSupported: isExtSupported,
            getImports: getImports,
            isFileSupported: isFileSupported,
            getCompiledExtension: getCompiledExtension,
            getInternalType: getInternalType
        };
    }
]);/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true, loopfunc: true, curly: false*/
/*global prepros, _*/

//Imports Visitor
prepros.factory('imageOptimization', [

    'config',
    '$rootScope',

    function (config, $rootScope) {

        'use strict';

        var fs = require('fs-extra');
        var path = require('path');
        var cp = require('child_process');

        var platform = 'win';

        if (process.platform === 'darwin') platform = 'osx';

        if (process.platform === 'linux') platform = 'linux';

        var arch = (process.arch === 'x64') ? 'x64' : 'x86';

        var binPath = path.join(config.basePath, '../bin');

        var jpegTranPath = path.join(binPath, 'jpegtran', platform, arch, 'jpegtran');

        var optipngPath = path.join(binPath, 'optipng', platform, 'optipng');

        if (platform === 'win') {
            jpegTranPath += '.exe';
            optipngPath += '.exe';
        }

        if (platform === 'osx') jpegTranPath = path.join(binPath, 'jpegtran', platform, 'jpegtran');

        if (platform === 'linux') optipngPath = path.join(binPath, 'optipng', platform, arch, 'optipng');

        var jpg = ['jpg', 'jpeg'];

        var png = ['png', 'tif', 'tiff'];


        //Function to optimize Images
        var _optimize = function (image, callback) {

            var ext = path.extname(image).slice(1);

            var executable = (_.contains(png, ext)) ? optipngPath : jpegTranPath;

            var cmd = (_.contains(png, ext)) ? [image] : ['-outfile', image, '-optimize', image];

            //Spawn child process to optimize image
            var optimizeProcess = cp.spawn(executable, cmd);

            optimizeProcess.once('error', function (err) {
                callback(err);
            });

            optimizeProcess.once('exit', function (data) {

                if (data.toString() !== '0') {

                    callback(new Error('Failed To Optimize Image'));

                } else {

                    callback(null);
                }

                optimizeProcess = null;
            });
        };

        var optimizationQueue = [];

        var optimize = function (image, project, callback) {

            if (_.contains(optimizationQueue, project.id + image.id)) return;

            if (!$rootScope.$$phase) {

                $rootScope.$apply(function () {
                    image.status = 'OPTIMIZING';
                });
            } else {

                image.status = 'OPTIMIZING';
            }

            optimizationQueue.push(project.id + image.id);

            setTimeout(function () {

                var imagePath = path.join(project.path, image.path);

                _optimize(imagePath, function (err) {

                    if (err) {

                        optimizationQueue = _.without(optimizationQueue, project.id + image.id);
                        image.status = 'FAILED';

                        setTimeout(function () {
                            callback(true, false);
                        }, 400);


                    } else {

                        fs.stat(imagePath, function (err, stat) {

                            optimizationQueue = _.without(optimizationQueue, project.id + image.id);

                            if (err) {

                                image.status = 'FAILED';
                                return setTimeout(function () {
                                    callback(true, false);
                                }, 400);
                            }

                            image.status = 'OPTIMIZED';
                            image.size = stat.size;
                            setTimeout(function () {
                                callback(null, true);
                            }, 400);

                        });
                    }
                });
            }, 100);
        };

        return {
            optimize: optimize
        };

    }
]);/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true, loopfunc: true, curly: false*/
/*global prepros, _*/

//Imports Visitor
prepros.factory('importsVisitor', [

    function () {

        'use strict';

        var fs = require('fs-extra'),
            path = require('path');


        function getImports(filePath, callback) {

            var imports = [];

            var regx = {
                less: /@import\s(?:url\(|\(|)['"]*([^\n"';\)]*)/g,
                sass: /@import\s+(.*)/g,
                scss: /@import\s['"]*([^;]+)[;"']/g,
                styl: /@import\s(?:url\(|\(|)['"]*([^\n"';\)]*)/g,
                jade: /(?:include|extends)\s+(.*)/g,
                slim: /\==\sSlim::Template.new\(['"]*([^\n"']+)['"]\).render/g,
                js: /\/\/(?:\s|)@(?:\s|)(?:prepros|codekit)-(?:append|prepend)\s+(.*)/gi,
                coffee: /#(?:\s|)@(?:\s|)(?:prepros|codekit)-(?:append|prepend)\s+(.*)/gi
            };

            var ext = path.extname(filePath).toLowerCase().slice(1);

            if (!ext || !regx[ext]) return callback(null, []);

            var importReg = regx[ext];
            var basedir = path.dirname(filePath);

            fs.readFile(filePath, 'utf8', function (err, data) {

                if (err) {
                    return callback(err);
                }

                var list = [];
                var result;

                do {

                    result = importReg.exec(data);
                    if (result) {

                        var imps = result[1].replace(/"|'|\n|;/gi, '').split(',');

                        imps = imps.map(function (imp) {

                            return path.resolve(basedir, imp.trim());

                        });

                        list = list.concat(imps);
                    }

                } while (result);

                var i = 0;
                (function next() {

                    var file = list[i++];

                    if (!file) {

                        return callback(null, _.uniq(imports));
                    }

                    //Check the path without adding extension
                    fs.stat(file, function (err, stat) {

                        if (err || stat.isDirectory()) {

                            //Add Extension if doesn't exist
                            if (path.extname(file).toLowerCase() !== ext) {
                                file = file + '.' + ext;
                            }

                            //Chcek for non partial file
                            fs.stat(file, function (err, stat) {

                                if (err) {

                                    //Check for the partial file
                                    file = path.dirname(file) + path.sep + '_' + path.basename(file);

                                    getImports(file, function (err, res) {

                                        if (!err) {

                                            imports.push(file);
                                            imports = imports.concat(res);
                                        }
                                        next();
                                    });

                                } else {

                                    getImports(file, function (err, res) {

                                        if (!err) {

                                            imports.push(file);
                                            imports = imports.concat(res);
                                        }
                                        next();
                                    });
                                }
                            });

                        } else {

                            getImports(file, function (err, res) {

                                if (!err) {

                                    imports.push(file);
                                    imports = imports.concat(res);
                                }
                                next();
                            });
                        }
                    });

                })();

            });
        }

        return {
            getImports: getImports
        };

    }
]);/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true*/
/*global prepros,  _ , angular, Prepros*/

//Storage
prepros.factory('liveServer', [

    'config',

    function (config) {

        'use strict';

        var express = require('express');
        var fs = require('fs');
        var WebSocketServer = require('websocket').server;
        var urls = [];
        var portfinder = require('portfinder');
        var url = require('url');
        var path = require('path');
        var coffeescript = require('coffee-script');
        var wsServer = {}; //Global main websocket server object

        var MAIN_SERVER_PORT = Prepros.MAIN_SERVER_PORT;

        var projectsBeingServed = {};


        /**
         * Prepros middleware; this injects prepros.js to the end of every html page
         */
        var _preprosMiddleware = function () {

            return function (req, res, next) {

                var writeHead = res.writeHead;
                var end = res.end;


                var filepath = url.parse(req.url).pathname;

                filepath = filepath.slice(-1) === '/' ? filepath + 'index.html' : filepath;

                var html = ['.html', '.htm'];

                if (!_.contains(html, path.extname(filepath))) {

                    return next();
                }

                res.push = function (chunk) {
                    res.data = (res.data || '') + chunk;
                };

                res.inject = res.write = function (string, encoding) {

                    if (string !== undefined) {

                        var body = string instanceof Buffer ? string.toString(encoding) : string;

                        var snippet = '<script src="/prepros.js"></script>';

                        if (/<\/(:?\s|)body(:?\s|)>/i.test(body)) {
                            body = body.replace(/<\/(:?\s|)body(:?\s|)>/i, (snippet + '\n</body>'));
                        } else {
                            body = body + snippet;
                        }

                        res.push(body);
                    }
                };

                res.end = function (string, encoding) {

                    res.writeHead = writeHead;
                    res.end = end;

                    var result = res.inject(string, encoding);

                    if (res.data !== undefined && !res._header) {
                        res.setHeader('content-length', Buffer.byteLength(res.data, encoding));
                    }

                    res.end(res.data, encoding);
                };

                return next();

            };
        };


        /**
         * Prepros Proxy; Proxies the incoming requests to actual servers
         * @param project
         * @returns {Function}
         * @private
         */

        var _preprosProxyMiddleware = function (project) {

            return function (req, res, next) {

                if (!Prepros.IS_PRO && project.config.useCustomServer) {

                    res.setHeader('Content-type', 'text/html');
                    res.end('<h4 style="margin: auto">Testing and refreshing custom server from network device and refreshing other browsers except Google Chrome is a Prepros Pro feature. If you are seeing this page on non network device please open your custom server url directly in Google Chrome. </h3>');

                } else {

                    next();
                }
            };
        };

        /*
         Serves project specific prepros.js file
         */
        var _preprosJsMiddleware = function (project) {

            return function (req, res, next) {


                var src = 'script.src="/livereload.js?snipver=1&host=" + window.location.hostname + "&port=" + window.location.port + "";';

                var snippet = '' +
                    '(function(){' +
                    '   try {' +
                    '    var script = document.createElement("script");' +
                    '    {{src}} ' +
                    '    document.querySelectorAll("body")[0].appendChild(script);' +
                    '} catch(e) {}' +
                    '})();';

                if (!project && 'pid' in req.query) {

                    if (req.query.pid in projectsBeingServed) {


                        var port = projectsBeingServed[req.query.pid].port;

                        src = 'script.src="http://localhost:' + MAIN_SERVER_PORT + '/livereload.js?snipver=1&host=localhost&port=' + port + '";';

                    } else {
                        return next();
                    }
                }


                res.setHeader('Content-type', 'application/x-javascript');
                res.end(snippet.replace('{{src}}', src));

            };

        };

        /*
         Livereload.js middleware
         */
        var _liveReloadMiddleware = function () {

            return function (req, res, next) {

                res.sendfile(config.basePath + '/vendor/livereload/livereload.js');

            };

        };


        /*
         Main Server
         */
        (function startMainServer() {

            var app = express();

            //Start listening
            var httpServer = app.listen(MAIN_SERVER_PORT);

            httpServer.on('error', function (err) {
                window.alert('Unable to start internal server, Please close the app that is using port ' + MAIN_SERVER_PORT + '. error: ' + err.message);
                Prepros.gui.App.quit();
            });

            //Start websocket server for automatic browser refresh
            var wsServer = new WebSocketServer({
                httpServer: httpServer,
                autoAcceptConnections: false
            });

            //Send the list of urls to refresh to extension on connect
            wsServer.on('request', function (request) {
                request.accept('', request.origin);
                wsServer.broadcast(angular.toJson({urls: urls}));
            });

            app.get('/livereload.js', _liveReloadMiddleware());

            app.get('/prepros.js', _preprosJsMiddleware());

            //Index page for projects
            app.set('views', config.basePath + '/partials/live-server');

            app.set('view engine', 'jade');

            app.get('/favicon.ico', function (req, res) {

                res.sendfile(config.basePath + '/assets/img/icons/ico.ico');

            });

            app.get('/', function (req, res) {

                res.render('index', {
                    projects: projectsBeingServed
                });

            });
        })();


        /*
         Start serving projects
         */
        function startServing(projects) {

            urls = [];

            _.each(projects, function (project) {

                if (!(project.id in projectsBeingServed)) {

                    portfinder.getPort(function (err, port) {

                        var app = express();
                        var server = app.listen(port, function () {

                            var port = server.address().port;

                            var lServer = new WebSocketServer({
                                httpServer: server,
                                autoAcceptConnections: false
                            });

                            lServer.on('request', function (request) {
                                request.accept('', request.origin);
                                lServer.broadcast("!!ver:1.6");
                            });

                            projectsBeingServed[project.id] = {
                                name: project.name,
                                port: port,
                                app: app,
                                server: server,
                                lServer: lServer,
                                project: project
                            };

                            projectsBeingServed[project.id].url = getLiveUrl(project);

                            app.get('/livereload.js', _liveReloadMiddleware());

                            app.get('/prepros.js', _preprosJsMiddleware(project));

                            app.use(express.bodyParser());

                            app.use(_preprosProxyMiddleware(project));

                            app.use(_preprosMiddleware());

                            app.use(express.static(project.path));

                            app.use(express.directory(project.path, {icons: true}));
                        });
                    });
                } else {

                    projectsBeingServed[project.id].name = project.name;
                }

                if (project.config.useCustomServer) {

                    var parsed = url.parse(project.config.customServerUrl);

                    urls.push(parsed.protocol + '//' + parsed.host + '|' + project.id);
                }
            });

            if ('broadcast' in wsServer) {

                //Send data to browser extensions
                wsServer.broadcast(angular.toJson({urls: urls}));
            }
        }


        /*
         Function to refresh
         */
        function refresh(pid, file, delay) {

            var data = JSON.stringify([
                'refresh', {
                    path: file,
                    apply_js_live: false,
                    apply_css_live: true
                }
            ]);

            if (parseInt(delay, 10)) {

                setTimeout(function () {

                    projectsBeingServed[pid].lServer.broadcast(data);

                }, parseInt(delay, 10));

            } else {

                projectsBeingServed[pid].lServer.broadcast(data);
            }
        }


        /*
         Get live preview url
         */
        function getLiveUrl(pid) {

            if (pid in projectsBeingServed) {

                var port = projectsBeingServed[pid].port;

                return 'http://localhost:' + port;

            } else {

                return 'http://localhost:' + MAIN_SERVER_PORT;
            }
        }

        //Return
        return {
            startServing: startServing,
            getLiveUrl: getLiveUrl,
            refresh: refresh
        };
    }
]);/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true, curly: false*/
/*global prepros, $, angular, _*/

prepros.factory("log", [

    function () {

        'use strict';

        var log = [];

        var add = function (details) {

            log.unshift(details);

            if (log.length > 30) {
                log.length = 30;
            }
        };

        var clear = function () {
            log.length = 0;
        };

        return {
            add: add,
            clear: clear,
            log: log
        };
    }
]);
/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true, curly: false*/
/*global prepros, Prepros*/

prepros.factory('notification', [

    '$location',
    '$rootScope',
    'config',

    function ($location, $rootScope, config) {

        'use strict';

        var path = require('path');

        var notificationWindow;

        var _createWindow = function () {

            var notificationPath = 'file:///' + path.normalize(config.basePath + '/notif.html');

            var options = {
                x: window.screen.availWidth - 325,
                y: window.screen.availHeight - 100,
                width: 320,
                height: 100,
                frame: false,
                toolbar: false,
                resizable: false,
                show: false,
                show_in_taskbar: false
            };

            if (Prepros.PLATFORM_MAC || Prepros.PLATFORM_LINUX) {
                options.y = 10;
            }

            notificationWindow = Prepros.gui.Window.open(notificationPath, options);

            notificationWindow.on('showLog', function () {

                $rootScope.$apply(function () {
                    $location.path('/log');
                });

                Prepros.Window.show();
                Prepros.Window.focus();
            });

            notificationWindow.once('closed', function () {
                notificationWindow.removeAllListeners();
                notificationWindow = null;
            });
        };

        //Create initial window
        _createWindow();

        function _showNotification(data) {

            if (notificationWindow) {

                notificationWindow.emit('updateNotification', data);

            } else {

                _createWindow();

                notificationWindow.on('loaded', function () {
                    notificationWindow.emit('updateNotification', data);
                });
            }
        }

        //Function to show error notification
        function error(name, message, details) {

            if (config.getUserOptions().enableErrorNotifications) {

                var data = {
                    name: name,
                    message: message,
                    type: 'error',
                    time: config.getUserOptions().notificationTime
                };

                if (config.getUserOptions().notificationDetails) data.details = details;

                _showNotification(data);
            }
        }

        //Function to show success notification
        var success = function (name, message, details) {

            if (config.getUserOptions().enableSuccessNotifications) {

                var data = {
                    name: name,
                    message: message,
                    type: 'success',
                    time: config.getUserOptions().notificationTime
                };

                if (config.getUserOptions().notificationDetails) data.details = details;

                _showNotification(data);
            }
        };

        return {
            error: error,
            success: success
        };
    }
]);
/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true*/
/*global prepros, Prepros*/

prepros.factory('pro', [

    'utils',

    function (utils) {

        'use strict';

        function showMessage() {

            var confirmMsg = utils.notifier.notify({
                message: "<h1 style='font-weight: 100'>That's a Prepros Pro Feature</h1>" +
                    "<p>The feature you're trying to access is a Prepros Pro feature. Please consider supporting the development to enjoy all the features.<br> Thanks :)</p>",
                type: "info",
                buttons: [
                    {'data-role': 'close', text: 'Close'},
                    {'data-role': 'ok', text: 'Buy Now'}
                ],
                destroy: true
            });

            confirmMsg.on('click:ok', function () {

                this.destroy();

                Prepros.gui.Shell.openExternal(Prepros.urls.love);
            });

            confirmMsg.on('click:close', 'destroy');
        }

        return {
            showMessage: showMessage
        };
    }
]);/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true, curly: false*/
/*global prepros,  _, angular*/

//Storage
prepros.factory('projectsManager', [

    '$location',
    '$rootScope',
    'config',
    'fileTypes',
    'notification',
    'storage',
    'utils',

    function ($location, $rootScope, config, fileTypes, notification, storage, utils) {

        'use strict';

        var fs = require('fs-extra');
        var path = require('path');
        var _id = utils.id;
        var minimatch = require('minimatch');

        var projects = storage.get();

        //Function to add new project
        function addProject(folder) {

            //Check if folder already exists in project list
            var already = false;

            _.each(projects, function (project) {

                if (!path.relative(project.path, folder)) {
                    already = true;
                }

            });

            var project_id = _id(new Date().toISOString() + folder);

            //If project doesn't exist
            if (!already) {

                //Project to push
                var project = {
                    id: project_id,
                    cfgVersion: 1, //It's internal configuration version, only change when something is drastically changed in configs
                    name: path.basename(folder),
                    path: folder,
                    files: {},
                    imports: {},
                    images: {},
                    config: {
                        watch: true,
                        liveRefresh: true,
                        liveRefreshDelay: config.getUserOptions().liveRefreshDelay,
                        filterPatterns: '',
                        useCustomServer: false,
                        customServerUrl: '',
                        cssPath: config.getUserOptions().cssPath,
                        jsPath: config.getUserOptions().jsPath,
                        htmlPath: config.getUserOptions().htmlPath,
                        minJsPath: config.getUserOptions().minJsPath,
                        htmlExtension: config.getUserOptions().htmlExtension,
                        cssPathType: config.getUserOptions().cssPathType,
                        htmlPathType: config.getUserOptions().htmlPathType,
                        jsPathType: config.getUserOptions().jsPathType,
                        minJsPathType: config.getUserOptions().minJsPathType,
                        htmlTypes: config.getUserOptions().htmlTypes,
                        cssTypes: config.getUserOptions().cssTypes,
                        jsTypes: config.getUserOptions().jsTypes,
                        cssPreprocessorPath: config.getUserOptions().cssPreprocessorPath,
                        htmlPreprocessorPath: config.getUserOptions().htmlPreprocessorPath,
                        jsPreprocessorPath: config.getUserOptions().jsPreprocessorPath,
                        minJsPreprocessorPath: config.getUserOptions().minJsPreprocessorPath,
                        autoprefixerBrowsers: config.getUserOptions().autoprefixerBrowsers,
                        ftpHost: '',
                        ftpPort: '21',
                        ftpRemotePath: '',
                        ftpUsername: '',
                        ftpPassword: '',
                        ftpIgnorePreprocessorFiles: true,
                        ftpType: 'FTP', //FTP, SFTP
                        ftpExcludePatterns: ''
                    }
                };
            }

            //Push project to projects list
            projects[project.id] = project;

            refreshProjectFiles(project.id);

            //Redirect to newly added project
            $location.path('/files/' + project.id);
        }

        //Function to get project by it's id
        function getProjectById(id) {

            if (!_.isEmpty(projects[id])) {

                return projects[id];
            }

            return {};
        }

        //function to get all project files
        function getProjectFiles(pid) {

            var project = getProjectById(pid);

            if (!_.isEmpty(project)) {

                return project.files;
            }

            return {};
        }

        //function to get all project imports
        function getProjectImports(pid) {

            var project = getProjectById(pid);

            if (!_.isEmpty(project)) {

                return project.imports;
            }

            return {};
        }

        /**
         * Function to get import By Id
         * @param pid {string} Project Id
         * @param id  {string} Import Id
         */

        function getImportById(pid, id) {

            var imps = getProjectImports(pid);

            if (!_.isEmpty(imps[id])) {

                return imps[id];
            }

            return {};
        }

        /**
         * Function to get file By Id
         * @param pid {string} Project Id
         * @param fid  {string} File Id
         */

        function getFileById(pid, fid) {

            var files = getProjectFiles(pid);

            if (!_.isEmpty(files[fid])) {

                return files[fid];
            }

            return {};
        }

        //Function to get current Project config
        function getProjectConfig(pid) {

            var project = getProjectById(pid);

            if (!_.isEmpty(project)) {

                return project.config;
            }

            return {};
        }

        //Function to get file imports in imports list
        function getFileImports(pid, fid) {

            var allImports = getProjectImports(pid);

            if (!_.isEmpty(allImports)) {

                var fileImports = {};

                _.each(allImports, function (imp) {

                    if (_.contains(imp.parents, fid)) {

                        fileImports[imp.id] = imp;

                    }

                });

                return fileImports;
            }

            return {};
        }

        //Function to match files against global and project specific filters
        function matchFileFilters(pid, file) {

            var projectFilterPatterns = '';

            var project = getProjectById(pid);

            if (_.isEmpty(project)) return true;

            if (project.config.filterPatterns) {

                projectFilterPatterns = project.config.filterPatterns;
            }

            var globalFilterPatterns = config.getUserOptions().filterPatterns.split(',');

            projectFilterPatterns = projectFilterPatterns.split(',');

            var filterPatterns = _.unique(_.union(globalFilterPatterns, projectFilterPatterns));

            var matchFilter = false;

            _.each(filterPatterns, function (pattern) {

                pattern = pattern.trim();

                if (pattern) {

                    if (file.indexOf(pattern) !== -1 || minimatch(path.relative(project.path, file), pattern) || minimatch(path.basename(file), pattern)) {

                        matchFilter = true;
                    }
                }

            });

            return matchFilter;

        }

        /**
         * Function to add a new file to project
         * @param pid {string}  Project id
         * @param filePath {string}  Path to  file
         * @param callback {function} Optional calback function to run after file addition is complete or fail.
         */
        function addFile(pid, filePath, callback) {

            fs.exists(filePath, function (exists) {

                if (exists && fileTypes.isFileSupported(filePath) && fileTypes.getInternalType(filePath) !== "IMAGE" && !matchFileFilters(pid, filePath)) {

                    var fileId = _id(path.relative(getProjectById(pid).path, filePath));

                    //Check if file already exists in files list
                    var already = _.isEmpty(_.findWhere(getProjectFiles(pid), {id: fileId})) ? false : true;

                    var inImports = false;

                    var fileExt = path.extname(filePath).toLowerCase();

                    var isSass = ( fileExt === '.scss' || fileExt === '.sass');

                    if (!isSass) {
                        inImports = _.isEmpty(_.findWhere(getProjectImports(pid), {id: fileId})) ? false : true;
                    }

                    if (!already && !inImports) {

                        fileTypes.format(pid, fileId, filePath, getProjectById(pid).path, function (err, formattedFile) {

                            if (err) return callback(false, filePath);

                            getProjectById(pid).files[fileId] = formattedFile;
                            refreshFile(pid, fileId, callback);

                        });

                    } else {

                        if (callback) {
                            callback(false, filePath);
                        }
                    }
                } else {

                    if (callback) {
                        callback(false, filePath);
                    }
                }
            });
        }

        /**
         * @param pid {String} Project ID
         * @param fileId {String} File Id
         * @param callback {Function} Optional callback to run after refresh is complete
         */

        function refreshFile(pid, fileId, callback) {

            if (!_.isEmpty(getFileById(pid, fileId))) {

                var fPath = path.join(getProjectById(pid).path, getFileById(pid, fileId).input);

                fileTypes.getImports(fPath, function (err, fileImports) {

                    if (err) {
                        fileImports = [];
                    }

                    var oldImports = getFileImports(pid, fileId);

                    _.each(fileImports, function (imp) {

                        addImport(pid, fileId, imp);

                    });

                    _.each(oldImports, function (imp) {

                        var fullImpPath = path.join(getProjectById(pid).path, imp.path);

                        if (!_.contains(fileImports, fullImpPath)) {

                            removeImportParent(imp.pid, imp.id, fileId);

                            addFile(pid, fullImpPath, callback);
                        }
                    });

                    if (callback) {
                        callback(true, fPath);
                    }

                });

            } else {

                if (callback) {

                    setTimeout(function () {
                        callback(false, fPath);
                    }, 0);
                }
            }
        }

        /**
         * Resets the settings of a file to defaults
         * @param pid {string} Project id
         * @param id {string} File id
         */

            //Function to remove a file
        function removeFile(pid, id) {

            if (!_.isEmpty(getProjectById(pid))) {

                delete getProjectFiles(pid)[id];

                //Remove file from imports parent list
                removeParentFromAllImports(pid, id);
            }

        }

        //Function to remove file from import parent
        function removeParentFromAllImports(pid, fid) {

            _.each(getProjectImports(pid), function (imp) {

                removeImportParent(pid, imp.id, fid);

            });

        }

        //Remove parent from certain import
        function removeImportParent(pid, impid, fid) {

            var project = getProjectById(pid);

            var projectImports = project.imports;

            var importedFile = _.findWhere(projectImports, {id: impid});

            importedFile.parents = _.without(importedFile.parents, fid);

            //Remove import if parent list is empty
            if (_.isEmpty(importedFile.parents)) {
                removeImport(pid, impid);
            }
        }

        //function to add imported file to import list
        function addImport(pid, fid, importedPath) {

            //If @imported file is not in imports list create new entry otherwise add the file as parent
            var projectImports = getProjectImports(pid);

            var impid = _id(path.relative(getProjectById(pid).path, importedPath));

            if (impid in projectImports) {

                if (!_.contains(projectImports[impid].parents, fid)) {

                    projectImports[impid].parents.push(fid);
                }

            } else {

                getProjectById(pid).imports[impid] = {
                    id: impid,
                    pid: pid,
                    path: path.relative(getProjectById(pid).path, importedPath),
                    parents: [fid]
                };
            }

            var fileExt = path.extname(importedPath).toLowerCase();

            var isSass = ( fileExt === '.scss' || fileExt === '.sass');

            //Remove any file that is in files list and is imported by this file
            if (!isSass) {
                removeFile(pid, impid);
            }
        }

        /**
         * Function to remove Import
         * @param pid {string} Project Id
         * @param impid {string} Import Id
         */
        function removeImport(pid, impid) {

            delete getProjectImports(pid)[impid];
        }

        //Function that refreshes files in a project folder
        function refreshProjectFiles(pid) {

            utils.showLoading();

            var folder = getProjectById(pid).path;

            fs.exists(folder, function (exists) {

                if (exists) {

                    var filesImportsImages = [];

                    _.each(getProjectFiles(pid), function (file) {

                        filesImportsImages.push(file);

                    });

                    _.each(getProjectImages(pid), function (file) {

                        filesImportsImages.push(file);

                    });

                    _.each(getProjectImports(pid), function (file) {

                        filesImportsImages.push(file);

                    });

                    //Remove file that doesn't exist or matches the filter pattern
                    _.each(filesImportsImages, function (file) {

                        var filePath;

                        if (file.input) filePath = path.join(folder, file.input);
                        if (file.path) filePath = path.join(folder, file.path);

                        //Remove if matches filter patterns or doesn't exist
                        if (matchFileFilters(pid, filePath)) {

                            if (file.input) removeFile(pid, file.id);
                            if (_.isArray(file.parents)) removeImport(pid, file.id);
                            else removeImage(pid, file.id);


                        } else {

                            fs.exists(filePath, function (exists) {

                                if (!exists) {

                                    $rootScope.$apply(function () {

                                        if (file.input) removeFile(pid, file.id);
                                        if (_.isArray(file.parents)) removeImport(pid, file.id);
                                        else removeImage(pid, file.id);
                                    });
                                }
                            });
                        }
                    });

                    utils.readDirs(folder, function (err, files) {

                        if (err) {

                            notification.error('Error ! ', 'An error occurred while scanning files', err.message);
                            utils.hideLoading();

                        } else {

                            var total = files.length;

                            //Hide loader if there are no files
                            if (!total) {
                                return utils.hideLoading();
                            }


                            var hideIfFinished = function () {

                                //Hide Loader if there are no files
                                if (!total) {
                                    setTimeout(function () {
                                        $rootScope.$apply(function () {
                                            utils.hideLoading();
                                        });
                                    }, 200);
                                }

                            };

                            _.each(files, function (file) {

                                if (fileTypes.isFileSupported(file) && !matchFileFilters(pid, file)) {

                                    //Generate unique id for file
                                    var file_id = _id(path.relative(getProjectById(pid).path, file));

                                    var already = false;

                                    if (fileTypes.getInternalType(file) === 'IMAGE') {

                                        already = !_.isEmpty(getImageById(pid, file_id));

                                        if (already) {

                                            refreshImage(pid, file_id, function () {

                                                --total;

                                                hideIfFinished();
                                            });

                                        } else {

                                            addImage(pid, file, function () {

                                                --total;

                                                hideIfFinished();
                                            });
                                        }

                                    }

                                    already = !_.isEmpty(getFileById(pid, file_id));

                                    if (already) {

                                        refreshFile(pid, file_id, function (complete, fp) {

                                            if (fp === file) --total;

                                            hideIfFinished();
                                        });

                                    } else {

                                        addFile(pid, file, function (complete, fp) {

                                            if (fp === file) --total;

                                            hideIfFinished();
                                        });
                                    }
                                } else {

                                    --total;

                                    hideIfFinished();
                                }
                            });
                        }
                    });

                } else {

                    $rootScope.$apply(function () {
                        removeProject(pid);
                    });

                    utils.hideLoading();
                }
            });
        }

        //Function to remove project
        function removeProject(pid) {

            delete projects[pid];
        }

        //Function to change file output path
        function changeFileOutput(pid, id, newPath) {

            var file = getFileById(pid, id);

            if (!_.isEmpty(file)) {

                if (path.extname(path.basename(newPath)) === '') {

                    newPath = newPath + fileTypes.getCompiledExtension(file.input);
                }

                file.customOutput = newPath;
            }
        }


        //function to get all project files
        function getProjectImages(pid) {

            var project = getProjectById(pid);

            if (!_.isEmpty(project)) {

                return project.images;
            }

            return [];
        }

        //Function to add image to project
        function addImage(pid, filePath, callback) {

            var project = getProjectById(pid);

            var id = _id(path.relative(project.path, filePath));

            if (fileTypes.getInternalType(filePath !== 'IMAGE') || getProjectImages(pid)[id]) return setTimeout(function () {
                callback(false, filePath);
            }, 0);

            var ext = path.extname(filePath).slice(1);

            fs.stat(filePath, function (err, stat) {

                if (err) return callback(false, filePath);

                project.images[id] = {

                    id: id,
                    pid: pid,
                    path: path.relative(project.path, filePath),
                    size: stat.size,
                    name: path.basename(filePath),
                    type: ext.charAt(0).toUpperCase() + ext.slice(1),
                    initialSize: stat.size,
                    status: 'NOT_OPTIMIZED' //NOT_OPTIMIZED, OPTIMIZED, OPTIMIZING, FAILED
                };

                callback(true, filePath);

            });

        }

        //Function to refresh Image
        function refreshImage(pid, imageId, callback) {

            var project = getProjectById(pid);

            if (!project.images[imageId]) return setTimeout(function () {
                callback(false);
            }, 0);

            var image = project.images[imageId];

            var imagePath = path.join(project.path, image.path);

            fs.stat(imagePath, function (err, stat) {

                if (err) {

                    removeImage(pid, imageId);
                    return callback(false, imagePath);

                }

                if (stat.size.toString() !== image.size.toString()) {

                    image.status = 'NOT_OPTIMIZED';

                }

                callback(true, imagePath);

            });
        }

        //Get image by id
        function getImageById(pid, fid) {

            var images = getProjectImages(pid);

            if (!_.isEmpty(images[fid])) {

                return images[fid];
            }

            return {};
        }

        //Funtion to remove Image
        function removeImage(pid, imageId) {

            if (!_.isEmpty(getProjectById(pid))) {

                delete getProjectImages(pid)[imageId];
            }

        }

        return {
            projects: projects,

            getProjectById: getProjectById,
            getFileById: getFileById,
            getImportById: getImportById,
            getImageById: getImageById,

            addProject: addProject,
            addFile: addFile,
            addImage: addImage,
            refreshImage: refreshImage,
            refreshFile: refreshFile,

            removeFile: removeFile,
            removeProject: removeProject,
            removeImport: removeImport,

            refreshProjectFiles: refreshProjectFiles,
            getProjectFiles: getProjectFiles,
            getProjectConfig: getProjectConfig,
            changeFileOutput: changeFileOutput,
            matchFilters: matchFileFilters
        };
    }
]);
/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true, curly: false*/
/*global prepros, angular, _*/

//Storage
prepros.factory('storage', [

    'utils',

    function (utils) {

        'use strict';

        var fs = require('fs-extra'),
            path = require('path');

        var _put = function (projects) {

            var prs = {};

            angular.copy(projects, prs);

            _.each(prs, function (pr) {

                _.each(pr.images, function (img) {
                    if (img.status === 'OPTIMIZING') {
                        img.status = 'NOT_OPTIMIZED';
                    }
                });
            });

            localStorage.PreprosData = angular.toJson(prs, false);

        };

        //Function to save project list to json
        function put(projects) {

            _put(projects);

        }

        //Get projects list from localStorage
        function get() {

            var projects = {};

            try {

                projects = angular.fromJson(localStorage.PreprosData || '{}');

                if (_.isArray(projects)) projects = utils.convertProjects(projects);

                _.each(projects, function (project) {

                    if (!project.cfgVersion) project = utils.convertProject(project);

                    projects[project.id] = project;
                });

            } catch (e) {

                window.alert('Error Reading Data ! Click ok and hit CTRL+SHIFT+X or CMD+SHIFT+X to clear data.');

            }

            return projects;
        }

        //Return projects list and files list
        return {
            get: get,
            put: put
        };
    }
]);/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true*/
/*global prepros, Prepros, $, angular, _*/

prepros.factory("update", [ "$http", function ($http) {

    "use strict";

    function checkUpdate(success, fail) {

        var params = {};
        var os = require('os');

        params.os_platform = os.platform();
        params.os_arch = os.arch();
        params.os_release = os.release();
        params.app_version = Prepros.VERSION;
        params.screenHeight = window.screen.availHeight;
        params.screenWidth = window.screen.availWidth;
        params.isPro = Prepros.IS_PRO;

        var updateFileUrl = (Prepros.IS_PRO) ? Prepros.urls.proUpdateFile : Prepros.urls.updateFile;

        var opt = {
            method: 'get',
            url: updateFileUrl,
            cache: false,
            params: params
        };

        var checker = $http(opt);

        checker.success(function (data) {

            var available = false;

            if (Prepros.VERSION !== data.version) {

                available = true;

            }

            if (available) {

                success({
                    available: true,
                    version: data.version,
                    date: data.releaseDate,
                    updateUrl: data.updateUrl
                });

            } else {

                success({
                    available: false
                });
            }
        });

        checker.error(function () {
            if (fail) {
                fail();
            }
        });
    }

    return {
        checkUpdate: checkUpdate
    };

}]);/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true*/
/*global prepros, $, _, Backbone */
prepros.factory('utils', [

    'config',

    function (config) {

        'use strict';

        var md5 = require('MD5'),
            path = require('path'),
            fs = require('fs-extra');

        function id(string) {

            return md5(string.toLowerCase().replace(/\\/gi, '/')).substr(8, 8);
        }

        //Instantiate Backbone Notifier
        var notifier = new Backbone.Notifier({
            theme: 'clean',
            types: ['warning', 'error', 'info', 'success'],
            modal: true,
            ms: false,
            offsetY: 100,
            position: 'top',
            zIndex: 10000,
            screenOpacity: 0.5
        });

        //Shows loading overlay
        function showLoading() {

            notifier.info({
                message: "Loading..... :) ",
                destroy: true,
                loader: true
            });
        }

        //Hide loading animation
        function hideLoading() {
            notifier.destroyAll();
        }


        function isFileInsideFolder(folder, file) {

            return path.normalize(file.toLowerCase()).indexOf(path.normalize(folder.toLowerCase())) === 0;
        }

        function readDirs(dir, done) {

            var results = [];

            fs.readdir(dir, function (err, list) {

                if (err) {
                    return done(err);
                }

                var i = 0;

                (function next() {

                    var file = list[i++];

                    if (!file) {

                        return done(null, results);
                    }

                    file = dir + path.sep + file;

                    fs.stat(file, function (err, stat) {

                        if (stat && stat.isDirectory()) {

                            readDirs(file, function (err, res) {

                                results = results.concat(res);
                                next();
                            });
                        } else {

                            results.push(file);
                            next();
                        }
                    });
                })();
            });
        }

        function isCrapFile(f) {

            var crapReg = /(?:thumbs\.db|desktop\.ini)/gi;

            return crapReg.test(f);

        }


        //Convert a project
        function convertProject(project) {


            var pr = {
                id: project.id,
                cfgVersion: 1,
                name: project.name,
                path: project.path,
                files: {},
                imports: {},
                images: {},
                config: {
                    watch: true,
                    liveRefresh: project.config.liveRefresh,
                    liveRefreshDelay: project.config.liveRefreshDelay,
                    filterPatterns: project.config.filterPatterns,
                    useCustomServer: project.config.useCustomServer,
                    customServerUrl: project.config.customServerUrl,
                    cssPath: config.getUserOptions().cssPath,
                    jsPath: config.getUserOptions().jsPath,
                    htmlPath: config.getUserOptions().htmlPath,
                    minJsPath: config.getUserOptions().minJsPath,
                    htmlExtension: config.getUserOptions().htmlExtension,
                    cssPathType: config.getUserOptions().cssPathType,
                    htmlPathType: config.getUserOptions().htmlPathType,
                    jsPathType: config.getUserOptions().jsPathType,
                    minJsPathType: config.getUserOptions().minJsPathType,
                    htmlTypes: config.getUserOptions().htmlTypes,
                    cssTypes: config.getUserOptions().cssTypes,
                    jsTypes: config.getUserOptions().jsTypes,
                    cssPreprocessorPath: config.getUserOptions().cssPreprocessorPath,
                    htmlPreprocessorPath: config.getUserOptions().htmlPreprocessorPath,
                    jsPreprocessorPath: config.getUserOptions().jsPreprocessorPath,
                    minJsPreprocessorPath: config.getUserOptions().minJsPreprocessorPath,
                    autoprefixerBrowsers: project.config.autoprefixerBrowsers,
                    ftpHost: project.config.ftpHost,
                    ftpPort: project.config.ftpPort,
                    ftpRemotePath: project.config.ftpRemotePath,
                    ftpUsername: project.config.ftpUsername,
                    ftpPassword: project.config.ftpPassword,
                    ftpIgnorePreprocessorFiles: project.config.ftpIgnorePreprocessorFiles,
                    ftpType: 'FTP', //FTP, SFTP
                    ftpExcludePatterns: project.config.ftpExcludePatterns
                }
            };


            if (project.config.cssPath.indexOf(':') < 0) {

                pr.config.cssPathType = 'REPLACE_TYPE';
                pr.config.cssPath = project.config.cssPath;

            }

            if (project.config.jsPath.indexOf(':') < 0) {

                pr.config.jsPathType = 'REPLACE_TYPE';
                pr.config.jsPath = project.config.jsPath;

            }

            if (project.config.htmlPath.indexOf(':') < 0) {

                pr.config.htmlPathType = 'REPLACE_TYPE';
                pr.config.htmlPath = project.config.htmlPath;

            }

            if (project.config.jsMinPath && project.config.jsMinPath.indexOf(':') < 0) {

                pr.config.minJsPathType = 'RELATIVE_FILEDIR';
                pr.config.minJsPath = project.config.jsMinPath;

            }

            _.each(project.files, function (file) {

                var _file = {};

                _file.config = {};
                _file.id = file.id;
                _file.pid = file.pid;
                _file.name = file.name;
                _file.type = file.type;

                _file.input = file.input;

                file.customOutput = false;

                if (file.output && file.output.indexOf(':') >= 0) {

                    _file.customOutput = file.output;
                }

                if (file.customOutput) {

                    _file.customOutput = file.customOutput;

                }

                _file.config = $.extend(_file.config, file.config);

                pr.files[file.id] = _file;
            });


            _.each(project.imports, function (imp) {

                pr.imports[imp.id] = imp;

            });

            if (!_.isEmpty(project.images)) {

                _.each(project.images, function (image) {

                    pr.images[image.id] = image;

                })

            }

            return JSON.parse(JSON.stringify(pr));
        }


        //Convert old projects to new projects
        function convertProjects(projects) {

            var _pr = {};

            _.each(projects, function (project) {

                _pr[project.id] = convertProject(project);

            });


            return JSON.parse(JSON.stringify(_pr));

        }

        return {
            id: id,
            showLoading: showLoading,
            hideLoading: hideLoading,
            notifier: notifier,
            isFileInsideFolder: isFileInsideFolder,
            readDirs: readDirs,
            isCrapFile: isCrapFile,
            convertProject: convertProject,
            convertProjects: convertProjects
        };
    }
]);/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */


/*jshint browser: true, node: true, curly: false*/
/*global prepros,  _*/

prepros.factory("watcher", [

    '$rootScope',
    'config',
    'compiler',
    'fileTypes',
    'liveServer',
    'notification',
    'projectsManager',
    'utils',

    function ($rootScope, config, compiler, fileTypes, liveServer, notification, projectsManager, utils) {

        "use strict";

        var fs = require("fs"),
            chokidar = require('chokidar'),
            path = require('path');

        var projectsBeingWatched = {};

        var supported = /\.(:?less|sass|scss|styl|md|markdown|coffee|js|jade|haml|slim|ls)$/gi;
        var notSupported = /\.(:?png|jpg|jpeg|gif|bmp|woff|ttf|svg|ico|eot|psd|ai|tmp|json|map|html|htm|css|rb|php|asp|aspx|cfm|chm|cms|do|erb|jsp|mhtml|mspx|pl|py|shtml|cshtml|cs|vb|vbs|tpl)$/gi;


        function _watch(project) {

            var useExperimentalWatcher = config.getUserOptions().experimental.fileWatcher;

            //Utility Function to compile file
            var _compileFile = function (file_id) {

                if (project.files[file_id]) {

                    var file = project.files[file_id];

                    if (file.config.autoCompile) {

                        //Compile File
                        compiler.compile(file.pid, file.id);
                    }

                    projectsManager.refreshFile(file.pid, file.id, function () {
                        $rootScope.$apply();
                    });
                }
            };

            var watcher = chokidar.watch(project.path, {
                ignored: function (f) {

                    //Ignore dot files or folders
                    if (/\\\.|\/\./.test(f)) {
                        return true;
                    }

                    var ext = path.extname(f);

                    if (ext.match(notSupported)) {

                        return true;

                    } else if (ext.match(supported)) {

                        return false;

                    } else if (projectsManager.matchFilters(project.id, f)) {

                        return true;

                    } else {

                        try {

                            if (fs.statSync(f).isDirectory()) {

                                return false;
                            }

                        } catch (e) {
                        }
                    }

                    return true;
                },
                interval: 400,
                ignorePermissionErrors: true,
                ignoreInitial: true,
                usePolling: !useExperimentalWatcher
            });

            var timeOutAdd = function (fpath) {

                window.setTimeout(function () {

                    fs.exists(fpath, function (exists) {

                        if (exists && config.getUserOptions().experimental.autoAddRemoveFile) {

                            projectsManager.addFile(project.id, fpath, function () {
                                $rootScope.$apply();
                            });
                        }
                    });

                }, 200);
            };

            watcher.on('add', timeOutAdd);

            var timeOutUnlink = function (fpath) {

                window.setTimeout(function () {

                    fs.exists(fpath, function (exists) {

                        if (exists && config.getUserOptions().experimental.autoAddRemoveFile) {

                            $rootScope.$apply(function () {
                                projectsManager.removeFile(project.id, utils.id(path.relative(project.path, fpath)));
                            });
                        }
                    });

                }, 200);
            };

            watcher.on('unlink', timeOutUnlink);

            var changeHandler = function (fpath) {

                if (!fs.existsSync(fpath)) return;

                //Try to add to files list. if file is not supported project manager will ignore it.
                if (config.getUserOptions().experimental.autoAddRemoveFile) {

                    projectsManager.addFile(project.id, fpath, function () {
                        $rootScope.$apply();
                    });
                }

                if (fileTypes.isExtSupported(fpath)) {

                    var id = utils.id(path.relative(project.path, fpath));

                    _compileFile(id);

                    if (project.imports[id]) {

                        var imp = project.imports[id];

                        _.each(imp.parents, function (parent) {
                            _compileFile(parent);
                        });
                    }
                }
            };

            var debounceChangeHandler = _.debounce(function (fpath) {

                changeHandler(fpath);

            }, 75);

            watcher.on('change', function (fpath) {

                if (useExperimentalWatcher) {

                    return debounceChangeHandler(fpath);

                } else {

                    return changeHandler(fpath);
                }
            });

            watcher.on('error', function (err) {
                console.log(err);
            });

            projectsBeingWatched[project.id] = {
                id: project.id,
                watcher: watcher
            };
        }

        var registerExceptionHandler = _.once(function (projects) {

            //An ugly hack to restart nodejs file watcher whenever it crashes
            process.on('uncaughtException', function (err) {

                if (err.message.indexOf('watch ') >= 0) {

                    _.each(projectsBeingWatched, function (project) {

                        project.watcher.close();

                        delete projectsBeingWatched[project.id];
                    });

                    _.each(projects, function (project) {
                        _watch(project);
                    });
                }
            });

        });

        //Function to start watching file
        function startWatching(projects) {

            registerExceptionHandler(projects);

            var ids = _.pluck(projects, 'id');

            _.each(projectsBeingWatched, function (project) {

                if (!_.contains(ids, project.id)) {

                    project.watcher.close();

                    delete projectsBeingWatched[project.id];
                }
            });

            _.each(projects, function (project) {

                if ((project.id in projectsBeingWatched) && project.config.watch === false) {

                    projectsBeingWatched[project.id].watcher.close();

                    delete projectsBeingWatched[project.id];

                } else if (!(project.id in projectsBeingWatched) && project.config.watch !== false) {

                    _watch(project);

                }
            });
        }

        return{
            startWatching: startWatching
        };

    }
]);

/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true*/
/*global prepros*/

prepros.filter('interpolatePath', [

    'utils',

    function (utils) {

        'use strict';

        var path = require('path');

        var CSS = 'CSS';
        var HTML = 'HTML';
        var JS = 'JS';
        var MINJS = 'MINJS';

        var typeMap = {};

        //Css
        typeMap.less = typeMap.sass = typeMap.scss = typeMap.styl = CSS;

        //Html
        typeMap.md = typeMap.markdown = typeMap.jade = typeMap.haml = typeMap.slim = HTML;

        //Javascript
        typeMap.ls = typeMap.coffee = JS;

        //minified javascript
        typeMap.js = MINJS;

        return function (filePath, project) {

            var ext = path.extname(filePath).slice(1).toLowerCase();

            filePath = path.join(project.path, filePath);

            //Change Output Extension
            switch (typeMap[ext]) {

                case CSS:

                    filePath = path.join(path.dirname(filePath), path.basename(filePath).replace(new RegExp('.' + ext + '$'), '.css'));
                    break;

                case HTML:

                    filePath = path.join(path.dirname(filePath), path.basename(filePath).replace(new RegExp('.' + ext + '$'), project.config.htmlExtension));
                    break;

                case JS:

                    filePath = path.join(path.dirname(filePath), path.basename(filePath).replace(new RegExp('.' + ext + '$'), '.js'));
                    break;

                case MINJS:

                    filePath = path.join(path.dirname(filePath), path.basename(filePath).replace(new RegExp('.' + ext + '$'), '.min.js'));
                    break;
            }

            var fileName = path.basename(filePath);
            var fileDir = path.dirname(filePath);

            switch (typeMap[ext]) {

                case CSS:

                    switch (project.config.cssPathType) {

                        case "REPLACE_TYPE":

                            //Conver comma sepereted string to pipe seperated regx like string and escape special regx characters
                            var cssTypes = project.config.cssTypes.split(',').map(function (type) {

                                return type.trim().replace(/[-\/\\^$*+?.()[\]{}]/g, '\\$&');

                            }).join('|');

                            var cssRegX = new RegExp('(:?\\\\|/)(:?' + cssTypes + ')(:?\\\\|/)', 'gi');

                            filePath = filePath.replace(cssRegX, path.sep + project.config.cssPath + path.sep);

                            break;

                        case "RELATIVE_FILESDIR":


                            project.config.cssPreprocessorPath.split(',').forEach(function (cPath) {

                                var cssPreprocessorDir = path.resolve(project.path, cPath);

                                if (utils.isFileInsideFolder(cssPreprocessorDir, filePath)) {
                                    filePath = path.resolve(project.path, project.config.cssPath, path.relative(cssPreprocessorDir, filePath));
                                }
                            });

                            break;

                        case "RELATIVE_FILEDIR":

                            filePath = path.resolve(fileDir, project.config.cssPath, fileName);

                            break;
                    }

                    break;

                case HTML:

                    switch (project.config.htmlPathType) {

                        case "REPLACE_TYPE":

                            var htmlTypes = project.config.htmlTypes.split(',').map(function (type) {

                                return type.trim().replace(/[-\/\\^$*+?.()[\]{}]/g, '\\$&');

                            }).join('|');

                            var htmlRegX = new RegExp('(:?\\\\|\/)(:?' + htmlTypes + ')(:?\\\\|\/)', 'gi');

                            filePath = filePath.replace(htmlRegX, path.sep + project.config.htmlPath + path.sep);

                            break;

                        case "RELATIVE_FILESDIR":

                            project.config.htmlPreprocessorPath.split(',').forEach(function (hPath) {

                                var htmlPreprocessorDir = path.resolve(project.path, hPath);

                                if (utils.isFileInsideFolder(htmlPreprocessorDir, filePath)) {
                                    filePath = path.resolve(project.path, project.config.htmlPath, path.relative(htmlPreprocessorDir, filePath));
                                }
                            });

                            break;

                        case "RELATIVE_FILEDIR":

                            filePath = path.resolve(fileDir, project.config.htmlPath, fileName);
                            break;
                    }

                    break;

                case JS:

                    switch (project.config.jsPathType) {

                        case "REPLACE_TYPE":

                            var jsTypes = project.config.jsTypes.split(',').map(function (type) {

                                return type.trim().replace(/[-\/\\^$*+?.()[\]{}]/g, '\\$&');

                            }).join('|');

                            var jsRegX = new RegExp('(:?\\\\|\/)(:?' + jsTypes + ')(:?\\\\|\/)', 'gi');

                            filePath = filePath.replace(jsRegX, path.sep + project.config.jsPath + path.sep);

                            break;

                        case "RELATIVE_FILESDIR":

                            project.config.jsPreprocessorPath.split(',').forEach(function (jPath) {

                                var jsPreprocessorDir = path.resolve(project.path, jPath);

                                if (utils.isFileInsideFolder(jsPreprocessorDir, filePath)) {
                                    filePath = path.resolve(project.path, project.config.jsPath, path.relative(jsPreprocessorDir, filePath));
                                }
                            });

                            break;

                        case "RELATIVE_FILEDIR":

                            filePath = path.resolve(fileDir, project.config.jsPath, fileName);

                            break;
                    }

                    break;

                case MINJS:

                    switch (project.config.minJsPathType) {

                        case "RELATIVE_FILESDIR":

                            project.config.minJsPreprocessorPath.split(',').forEach(function (jPath) {

                                var minJsPreprocessorDir = path.resolve(project.path, jPath);

                                if (utils.isFileInsideFolder(minJsPreprocessorDir, filePath)) {
                                    filePath = path.resolve(project.path, project.config.minJsPath, path.relative(minJsPreprocessorDir, filePath));
                                }
                            });

                            break;

                        case "RELATIVE_FILEDIR":

                            filePath = path.join(fileDir, project.config.minJsPath, fileName);

                            break;
                    }

                    break;
            }

            return path.normalize(filePath);
        };
    }
]);/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true*/
/*global prepros*/

prepros.filter('prettyPath', [ function () {

    'use strict';

    return function (string) {

        return string.replace(/\\/g, '/');

    };
}]);/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true, curly: false*/
/*global prepros*/

prepros.filter('shortPath', [

    'utils',

    function (utils) {

        'use strict';

        var path = require('path');

        return function (string, basePath) {

            if (utils.isFileInsideFolder(basePath, string)) return path.relative(basePath, string);

            return string;

        };
    }]);/**
 * Prepros
 * (c) Subash Pathak
 * sbshpthk@gmail.com
 * License: MIT
 */

/*jshint browser: true, node: true, curly: false*/
/*global prepros*/

prepros.filter('size', [

    function () {

        'use strict';

        return function (size) {

            var type = 'Bytes';

            if (isNaN(parseFloat(size))) return size + type;

            size = parseFloat(size);

            if (size > 1024) {
                size = size / 1024;
                type = 'KB';
            }

            if (size > 1024) {
                size = size / 1024;
                type = 'MB';
            }

            return size.toFixed(2) + ' ' + type;

        };
    }
]);
// Node interface

module.exports = prepros;