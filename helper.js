#!/bin/env node
/**
 *  ssaHelper Functions (the important ones)
 *  
 *  cache_get(key <string> , timeout <int, unix timestamp>)
 *  
 *  will compare current time against time of last
 *  self.ztime entry for key, returns false if condition is met.
 *
 *  cache_put(key<string>,value<mixed>)
 *
 *  Adds value to self.zcache[key] and adds 
 *  a unix timestamp representation of Date().getTime() to self.ztime[key]
 *
 *  getTO(key<string>,toDefault<integer>)
 *
 *  Refers to nodes.json to get an timeout (integer) for a provided key contained within nodes._timeouts.<key>
 *  If toDefault is defined and the value is not found within nodes it will return that value.
 *
 *  requester(url<string>,callback<function>)
 *
 *  A helper function for request npm module to assist with error control, 
 *  specifically designed to interface with JSON API's.
 *  callback is a function designed as such -
 *
 *  Ex:
 *
    self.requester(
        'http://website/json_feed/',
        function(body){
            if(body != false)
            {
                // do what you want with the response... but probably call another callback function
            }else{
                // specifically handle errors with the response here
            }
        });
 */
ssaHelper = function(kind){
    var express = require('express'),request = require('request')
    , self = this;
    nodes = require('./nodes.json');
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
        	self.zcache = {};
            self.ztime = {};
		}
    };
    self.cache_get = function(key,timeout) {
        return (typeof self.zcache[key] != 'undefined'? (typeof timeout != 'undefined' ? ( (self.ztime[key] +timeout)  < Math.round((new Date()).getTime() / 1000)  ?false : self.zcache[key]) : self.zcache[key]) : false);
    };
    self.cache_put = function(key,value){
        self.ztime[key] = parseInt(Math.round((new Date()).getTime() / 1000));
        self.zcache[key] = value;
        return true;
    };
    
    self.getTO= function(key,toDefault){
    // looks inside of nodes for the timeout value if it exists, otherwise returns the passed default
    // zero value should be ok to use.. disables cache. allow to specify different timeouts per each env.
        if(typeof toDefault == 'undefined') toDefault = 0;
        return (typeof nodes['_timeouts'] != 'undefined' && typeof nodes['_timeouts'][key] != 'undefined' ? nodes['_timeouts'][key] : toDefault);
    }
    self.requester = function (url,callback){
        request(url,function(error,response,body){
            return (typeof response != 'undefined' && response.statusCode == 200?(typeof body != 'undefined' ? callback(JSON.parse(body)) : (typeof error != 'undefined'?callback(error) : callback(false))) :callback(false));
                });
    }
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_INTERNAL_IP;
        
        if(typeof nodes['local']['_ports'][kind] != 'undefined'){
            self.port      = process.env.OPENSHIFT_INTERNAL_PORT || nodes['local']['_ports'][kind];
        }else{
            console.log('The kind passed to this server does not exist in nodes.json, please check your ssaHelper() construction call');
            // exit
        }
        if (typeof self.ipaddress === "undefined") {
            console.warn('No OPENSHIFT_INTERNAL_IP var, using ' + nodes['local']['ipaddress']);
            self.ipaddress = nodes['local']['ipaddress'];
            nodes = nodes['local'];
        }else{
            // assemble openshift variables...
            var segmentUrl = 'http://segment-' + nodes['openshift']['oDomain'] +'.'+ nodes['_cDomain'] ;
            var ridesUrl = 'http://rides-' + nodes['openshift']['oDomain'] +'.'+ nodes['_cDomain'];
            nodes["segment"] = segmentUrl;
            nodes["rides"] =  ridesUrl;
        }
    };
    self.terminator = function(sig){
        if (typeof sig === "string") {
           
           ('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };
    self.setupTerminationHandlers = function(){
        process.on('exit', function() { self.terminator(); });
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };
    self.initializeServer = function() {
        self.createRoutes();
        self.app = express();
        for (var r in self.routes)
            self.app.get(r, self.routes[r]);
    };
    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();
        self.initializeServer();
    };
    self.start = function() {
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };
}