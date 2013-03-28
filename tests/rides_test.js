#!/bin/env node
/*
    Basic tests for rides.js, please ensure rides.js is running before launching this script.
    If you get through the tests without an exception you pass!
    
    Mostly tests for proper status codes and valid (true) responses inside of request().
    Also tests for missing parameters/invalid athlete name. Could use a tad bit more...
    
    
    Tests 'locally' by default! Change line 22 if you want to test in openshift... probabably
    going to just do a cl option prompt to switch enviornments or detect openshift vars..
    
*/

var assert = require('assert'),request = require('request'),nodes = require('./nodes.json')
    validAthlete = 'rbarbachano',
    invalidAthlete = 'alsdjlkj',
    validOffset = 0,
    athlete_endpoint = '/athlete/',
    rides_endpoint = '/rides/',
    invalid_endpoint = '/mah/';

nodes = nodes['local'];

var okAssert = function(error,response,body){
// error should be null?
    assert.notEqual(error,true,'\n\n **FAIL Error encountered in returned request');
    assert.equal(response.statusCode,200,'\n\n **FAIL \n\n response.statusCode is not 200 \n\n');
    assert.ok(body,'\n\n **FAIL \n\n Returned invalid BODY from request');
    
    
    if(typeof response == 'object'){
        console.log('\n**okAssert Passed**\t length:' + Object.keys(response).length);

    }else if(response == 'array'){
        console.log('\n**okAssert Passed**\t length:' + response.length);

    }else{
        console.log('\n**okAssert Passed**');
    }
}

// make sure specific values (invalid) return 404
var failAssert = function(error,response,body){
    //assert.ok(error,'\n\n **FAIL in failAssert - error was NOT encountered.')
    assert.notEqual(response.statusCode,200,'\n\n **FAIL in failAssert - response.statusCode was equal to 200.');
    console.log('\n**failAssert Passed**')
}
// check if server is running
request(nodes['rides'] + '/health/',okAssert);

// test rides endpoint
request(nodes['rides'] + rides_endpoint + validAthlete + '/' + validOffset,okAssert);

// doesnt have all the parameters
request(nodes['rides'] + rides_endpoint + validAthlete ,failAssert);

// test missing params
request(nodes['rides'] + rides_endpoint,failAssert);

// invalid athlete id
request(nodes['rides'] + rides_endpoint + invalidAthlete + '/' + validOffset,failAssert);

// missing offset
request(nodes['rides'] + rides_endpoint + invalidAthlete,failAssert);

// test athlete id lookup
request(nodes['rides'] + athlete_endpoint + validAthlete ,okAssert);

// test invalid athlete id
request(nodes['rides'] + athlete_endpoint + invalidAthlete ,failAssert);

// missing params
request(nodes['rides'] + athlete_endpoint,failAssert);

request(nodes['rides'],failAssert);