var prepros = require('./lib/prepros.js')
    , _ = require('lodash')
    , defaultProjectConfig = prepros.factory('config').getUserOptions()
    , javascriptBuilder;

javascriptBuilder = prepros.factory('javascript');

function compileJs(fileOptions, projectOptions, callback) {
    // use default values if not overridden in config
    _.extend(defaultProjectConfig, projectOptions.config);
    projectOptions.config = defaultProjectConfig;

    // make fileoptions.config not mandatory
    fileOptions.config = fileOptions.config || {};

    javascriptBuilder.compile(fileOptions, projectOptions, callback);
}

module.exports = {
    javascript : compileJs
};

