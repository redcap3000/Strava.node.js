#!/bin/env node
/*
    Basic tests for rides.js, please ensure rides.js is running before launching this script.
    If you get through the tests without an exception you pass!
    
    Mostly tests for proper status codes and valid (true) responses inside of request().
    Also tests for missing parameters/invalid athlete name. Could use a tad bit more...
    
    
    Tests 'locally' by default! Change line 22 if you want to test in openshift... probabably
    going to just do a cl option prompt to switch enviornments or detect openshift vars..
    
*/

require('./assertions.js');
var validAthlete = 'rbarbachano',
    invalidAthlete = 'alsdjlkj',
    validOffset = 0,
    athlete_endpoint = '/athlete/',
    rides_endpoint = '/rides/',
    invalid_endpoint = '/mah/';

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

// invalid endpoint
request(nodes['rides'],failAssert);

// invalid endpoint
request(nodes['rides'] + invalid_endpoint,failAssert);