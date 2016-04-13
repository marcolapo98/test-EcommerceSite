/**
 * Adapts the Angular convention (name, [dep1, dep2, function() {} ])
 * for DI to the AMD format (name, dependencies, function() {} )
 *
 * @param name the name of the module
 * @param list a list of dependencies, where the last item is the module
 * @returns {*} the module
 */

var requirejs = require('requirejs');

requirejs.define('$filter', function (filterName) {
    return requirejs(filterName);
});

function adapter(name, list) {

    var define = requirejs.define
        , args = [name]
        , len
        , indexOfFunction
        , closureReturningAModule
        , dependencies;

    if (list === undefined) {
        return requirejs(name);
    }

    if (typeof list !== 'function') {
        len = list.length;
        indexOfFunction = len - 1;
        closureReturningAModule = list[indexOfFunction];
        dependencies = list.slice(0, indexOfFunction);

        if (dependencies.length !== 0) {
            args.push(dependencies)
        }
    } else {
        closureReturningAModule = list;
    }

    args.push(closureReturningAModule);

    return define.apply(define, args);
}

module.exports = {
    filter: adapter,
    factory: adapter
};

