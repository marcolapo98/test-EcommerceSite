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
