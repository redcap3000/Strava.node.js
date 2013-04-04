#!/bin/env node
/*
    Strava 'Fast 50' Segment Analyser - Openshift Node.js
    
    segment node
    
    -Contains two endpoints
    
    :id - refers to a segment id
        
    /rank/:id/:athlete_id
    
    If the :athlete_id is found within the segment (:id) 
    it will return a simple indexed array with all of that segment data - 
    including some statistics, ranking, and basic segment data (dist,grade, name etc.)
    
    /crank/:id/:athlete_id/:club_id
    
    Same as above but will first check if the :athlete_id belongs to :club_id before running an efforts lookup on the club (&clubId=<int>&best=true)
    
    Ronaldo Barbachano March 2013
    http://redcapmedia.com
    
    Module Dependecies:
    Express.js, request
    
*/

require('./scripts/helper.js');

helper = new ssaHelper('segment');

/* 
 * provide helper with an idea of what this node will be doing for us with its routes...
 * allows for appropriate port selection (locally) and
 * external node url's when running in the cloud.
 */

helper.createRoutes = function() {
        var self = this;
        self.routes = { };
        // Routes for /health, /asciimo and /
        self.routes['/health'] = function(req, res) {
            res.send('1');
        };
        self.routes['/crank/:id/:athlete_id/:club_id'] = function(req,res){
            club_id = req.params.club_id;
            self.routes['/rank/:id/:athlete_id'](req,res);
        }
        self.routes['/rank/:id/:athlete_id'] =
            function(req, res) {
                var segment_id = parseInt(req.params.id),
                athlete_id = req.params.athlete_id,
                club_id = req.params.club_id,cache_check = (club_id != null && club_id != '' && typeof club_id != 'undefined'? self.cache_get(segment_id+'r'+club_id,self.getTO('club_segment',60*30)):   self.cache_get(segment_id+'r',self.getTO('segment',60*15))),
                competitionComp =
                    function(final,athlete_present){
                        /*
                            MOVE TO CLIENT SIDE!
                          var numberToSmallTime = function(seconds){
                            var absolute = Math.abs(seconds);
                            if(absolute < 90)
                                return (absolute != seconds ?'-':'+')+'00:' + (absolute<10?'0' :'')+absolute ;
                            else{
                                var fSeconds = absolute % 60, fMin = absolute/60;
                                fMin = fMin.toFixed(0);
                                return  (absolute != seconds?'-':'+')+(fMin<10?'0':'')+fMin + (fSeconds != 0?':'+ (fSeconds < 10 ? '0':'') + fSeconds:'');
                            }
                        };
                        */
                         var comp ={}, above=false,below=false,ties=0;
                        // find ties
                        final.filter(function(arr,index){
                            if(arr[0] == athlete_present[1])
                                ties++;
                            else if (arr[0] > athlete_present[1] || arr[0] < athlete_present[1])
                                if(typeof comp[arr[0]] == 'undefined'){
                                    comp[arr[0]] = {};
                                    comp[arr[0]].c = 1;
                                    comp[arr[0]].t = arr[2];
                                    comp[arr[0]].a = arr[1];
                                    }
                                else
                                    comp[arr[0]].c++;
                        });
                         var previousRank = [];
                        for(var key in comp){
                            var ranking = comp[key];
                            if(parseInt(key) > athlete_present[1] && typeof nextRank == 'undefined' && athlete_present[1] != 50)
                                var nextRank = [parseInt(key),comp[key].a,comp[key].t,comp[key].c];
                            else if (athlete_present[1] == 50)
                                nextRank= [];
                            if(parseInt(key) < athlete_present[1] && athlete_present[1] !=  1)
                                previousRank.push( [parseInt(key),comp[key].a,comp[key].t,comp[key].c]);
                            else if(athlete_present[1] == 1)
                                previousRank=[];
                        }
                         [previousRank[0],previousRank[previousRank.length-1],nextRank].filter(function(arr,index){
                            if(typeof arr != 'undefined'){
                            // don't reshow the 'king' if the athlete is placed at two, it just shows king and their competitor as the same
                                if(index == 0 && athlete_present[1] == 2)
                                    ;
                                else{
                                    var rank = arr[0],aId = arr[1],time = arr[2],count = arr[3],timeCalc = time - athlete_present[2];
                                    athlete_present.push([rank,parseInt(timeCalc),count]);
                                }
                            }
                        });
                       // add segment data
                       var segment_id = athlete_present[0],cache_check = self.cache_get('i'+segment_id);
                        if(cache_check){
                            result = cache_check;
                            athlete_present.unshift(result[3]);
                            athlete_present.unshift(result[2]);
                            athlete_present.unshift(result[1]);
                            athlete_present.unshift(result[0]);
                           res.end(res.send(athlete_present));
                        }else{
                            var url = 'http://www.strava.com/api/v1/segments/'+ segment_id;
                            self.requester(url,
                                function(body){
                                    if(body != false  && typeof body != 'undefined'){
                                        if(typeof body['segment'] != 'undefined'){
                                            body = body['segment'];
                                            body['distance'] = 0.000621371 * body['distance'];
                                            var result = [body['name'],parseFloat(body['distance'].toFixed(2)),parseFloat(body['averageGrade'].toFixed(1)), body['climbCategory']];
                                            self.cache_put('i'+segment_id,result);
                                            athlete_present.unshift(result[3]);
                                            athlete_present.unshift(result[2]);
                                            athlete_present.unshift(result[1]);
                                            athlete_present.unshift(result[0]);
                                            res.end(res.send(athlete_present));
                                        }
                                    }else
                                        console.log('Strava segment error');
                                });
                        }
                };
                if(cache_check){
                    var present = false;
                    // want to make sure the user is within the cache ???
                    for(var v =0; v < cache_check.length;v++)
                        if(cache_check[v][1] == athlete_id){
                            present = cache_check[v][0];
                            athlete_present=([segment_id,present,cache_check[v][2]]);
                            // stop looking...
                            v = cache_check.length;
                        }
                    if(!present)
                        res.send([segment_id,0]);
                    else
                        competitionComp(cache_check,athlete_present);
                }else{
                    self.calcRank=function(arr,val){
                        var sliced = arr.slice(0,arr.indexOf(val) + 1),last_val = null, counter = 1;
                        for(var zz = 0; zz < sliced.length; zz++)
                            if(last_val == null)
                                last_val = sliced[zz];
                            else if(last_val != sliced[zz])
                                    counter++;
                        return counter;
                    };
                    var cacheKey =(typeof club_id != 'undefined'? segment_id + 'r' + club_id : segment_id + 'r'), url = (typeof club_id == 'undefined' ? 'http://www.strava.com/api/v1/segments/'+ segment_id+'/efforts?best=true' :  'http://www.strava.com/api/v1/segments/'+ segment_id+'/efforts?clubId=' + club_id + '&best=true');
                    self.requester(url,
                        function(body){
                            if(body != false && typeof body['efforts'] != 'undefined' )
                            {
                                var segment_times = [],athlete_present = false;
                                if(typeof body['efforts'] != 'undefined'){
                                     body = body['efforts'];
                                    var result = [];
                                    for(var i =0 ;i<body.length;i++){
                                        var activity = body[i];
                                        if(activity['athlete']['id'] == athlete_id)
                                            athlete_present = true;
                                         // push the date too ... that might come in handy
                                        result.push([activity['athlete']['id'], activity['elapsedTime'] ]);
                                        segment_times.push(activity['elapsedTime']);
                                    }
                                    var final = [];
                                    result.filter(function(arr,index){
                                        var rank = self.calcRank(segment_times,arr[1]);
                                        if(arr[0] == athlete_id)
                                            // get previous time, and next time ,and possibly their id's..
                                            // if tied count the number of others who the athlete is tied with
                                            athlete_present = [segment_id,rank,arr[1]];
                                        final.push([rank,arr[0],arr[1]]);
                                        // clear out result array...
                                        if(index == result.length -1)
                                            self.cache_put(cacheKey,final);
                                        return false;
                                    });
                                    
                                    if(athlete_present)
                                        competitionComp(final,athlete_present);
                                    else
                                        res.send([segment_id,0]);
                                }else
                                    res.send(404,{error:'Effort not found'});
                            }
                            else
                                res.send(404,{error:"Request failed"});
                        });
                }
            };
    };
helper.initialize();
helper.start();
