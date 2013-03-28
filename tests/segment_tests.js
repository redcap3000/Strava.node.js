#!/bin/env node
/*
    Basic tests for segment.js, please ensure segment.js is running before launching this script.
    If you get through the tests without an exception you pass!
    
    
    **NOTE** Figuring out a athlete_id isn't always apparent, use your own - you can easily glean it via your profile page... but I'm including my own athlete Id for simplicity.
    
    Testing Two API Points :
    
    /rank/:id/:athlete_id
    
    /crank/:id/:athlete_id/:club_id
    
    
    Mostly tests for proper status codes and valid (true) responses inside of request().
    Also tests for missing parameters/invalid athlete name. Could use a tad bit more...
    
    
    Tests 'locally' by default! Change line 22 if you want to test in openshift... probabably
    going to just do a cl option prompt to switch enviornments or detect openshift vars..
    
*/

require('./assertions.js');

var
    validAthleteId = '200159',
    invalidAthleteId = 'alsdjlkj',
    validClub = 'sffixed',
    invalidClub = 'alskjbjjvjvjv';
    validSegmentId = '610649',
        invalidSegmentId = 'vvvasgts',

    rank_endpoint = '/rank/',
    crank_endpoint = '/crank/',
    invalid_endpoint = '/mah/';


// check if server is running
request(nodes['segment'] + '/health/',okAssert);

// test rides endpoint
request(nodes['segment'] + rank_endpoint + validSegmentId + '/' + validAthleteId + '/',okAssert);

// doesnt have all the parameters
request(nodes['segment'] + rank_endpoint + validSegmentId ,failAssert);

// test missing params
request(nodes['segment'] + rank_endpoint,failAssert);

// invalid athlete id (or an id that doesnt match in a given segment)
request(nodes['segment'] + rank_endpoint + validSegmentId + '/' + invalidAthleteId + '/',notContainedAssert);

// invalid segment
request(nodes['segment'] + rank_endpoint + invalidSegmentId + '/' + validAthleteId ,failAssert);

// missing params
request(nodes['segment'] + rank_endpoint + validSegmentId + '/' ,failAssert);

request(nodes['segment'] + crank_endpoint + validSegmentId + '/' + invalidAthleteId + '/' + validClub,failAssert);


request(nodes['segment'],failAssert);