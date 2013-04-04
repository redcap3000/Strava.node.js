#!/bin/env node
/*
    Strava 'Fast 50' Segment Analyser - Openshift Node.js
    
    rides node
    
    -Contains two endpoints
    
    :athlete - refers to an athletes vanity name
        
    /athlete/:athlete
   
       Returns an athlete's name and ID based on their vanity name and only returns efforts from 50 rides
       
    /rides/:athlete/:offset
    
       Returns an array athlete's efforts based on a offset divisible by 50 (0,50,100,150).
                          
    
    Ronaldo Barbachano March 2013
    http://redcapmedia.com
    
    
*/

require('./scripts/helper.js');

helper = new ssaHelper('rides');

helper.createRoutes = function() {
        var self = this;
        self.routes = { };
        self.routes['/health'] = function(req, res) {
            res.send('1');
        };
       /*
        *
        * RETURNS SEGMENT ID'S (as STRING) for :athlete based on :offset -
        * looks up 50 rides and then gets all of their efforts combines them and sends them back
        *
        */
        self.routes['/athlete/:athlete'] = function (req,res){
            var athlete_vanity = req.params.athlete, url = 'http://www.strava.com/api/v1/rides?athleteName=' + athlete_vanity, cacheCheck = self.cache_get(athlete_vanity);
            if(cacheCheck){
                res.send(cacheCheck);
            }else{
                self.requester(url,
                    function(body){
                        if(typeof body != 'undefined' && body != false){
                            // response may NOT be an array.. but i'm pretty sure it is...
                            if(typeof body['rides'] != 'undefined'){
                            // cache this???
                              var url = 'http://www.strava.com/api/v1/rides/' + body['rides'][0]['id'];
                                self.requester(url,function(body){
                                    if(typeof body != 'undefined' && body != false && typeof body['ride']['athlete']['id'] != 'undefined'){
                                        var athlete_id = body['ride']['athlete']['id'],athlete_name = body['ride']['athlete']['name'];
                                        self.zcache[athlete_vanity] ={id:athlete_id,name:athlete_name};
                                        res.send(self.zcache[athlete_vanity]);
                                    }else
                                        res.send(404,{error:'Could not lookup ride'});
                                });
                            }
                            else
                                res.send(404,{error:'Athlete vanity not found; or athlete does not have any efforts.'});
                        }
                        else
                            res.send(404,{error:'Invalid html response',"url": url});
                    });
                };
                
        }
        
        self.routes['/rides/:athlete/:offset'] = function(req, res) {
            // step one get the club id then use another request/api call to get the club data
            var athlete_vanity = req.params.athlete, rides_offset = req.params.offset,cache_check = self.cache_get(athlete_vanity+rides_offset,self.getTO( 'athlete+rides_offset',60*60*1));
            if(cache_check){
                res.send(cache_check);
                }
            else{
                var url = 'http://www.strava.com/api/v1/rides?athleteName=' + athlete_vanity + '&offset=' + rides_offset;
                self.requester(url,
                    function(body){
                        if(typeof body['rides'] != 'undefined'){
                            body = body['rides'];
                            var rides_count = body.length;
                            var r = [];
                            for(var i = 0;i<body.length;i++)
                                r.push(body[i]['id']);
                                /* start looking up ride efforts.. probably NOT internally to avoid the connection implication
                                 * calls them directly from strava ... probably need to depreciate the ride/:id
                                 */
                                var ride_efforts = [];
                                for(var i = 0; i< r.length;i++){
                                    // check for new ride efforts every week ... maybe do something to compare the old ones (notify which are new ?)
                                    // ONE WEEK
                                    var ride_cache_check = self.cache_get('e'+r[i],self.getTO('efforts_timeout', 275200  ));
                                    if(!ride_cache_check || typeof ride_cache_check == 'undefined'){
                                        var url = 'http://www.strava.com/api/v1/rides/' +r[i] + '/efforts';
                                        self.requester(url,
                                        function(body){
                                            if(typeof body != 'undefined' && body != false && typeof body['efforts'] == 'undefined')
                                                res.send(404,{"error":"Ride not found"});
                                            else if(body['efforts'] != "no efforts"){
                                                var result = {},ride_id = body['ride']['id'];
                                                body = body['efforts'];
                                                if(typeof body != 'undefined'){
                                                    if(body.length > 0)
                                                        for(var i=0;i<body.length;i++){
                                                            var effort = body[i],segment_effort = effort['segment'];
                                                            result[segment_effort['id']]= effort['elapsed_time'];
                                                        }
                                                    else
                                                    // add this for loop reporting ... ride had no efforts
                                                        result = {"efforts":"no efforts"};
                                                    self.cache_put('e'+ride_id,result);
                                                }else
                                                    res.send(404,{"error":"Ride not found"});
                                            }
                                            ride_efforts.push((typeof result != 'undefined'?result:0));
                                            // combine a 'blank' entry for final processing call counts to match
                                            if(ride_efforts.length == r.length){
                                                var segments_list = [];
                                                ride_efforts.filter(function(arr,index){
                                                    if(typeof arr == 'object'){
                                                        var segment_ids = Object.keys(arr);
                                                        if(segment_ids.length > 0){
                                                            segment_ids.filter(function(arr2){
                                                                segments_list.push(parseInt(arr2));
                                                            });
                                                           // segments_list = segments_list.concat(Object.keys(arr));
                                                            }
                                                    }
                                                });
                                                segments_list.unshift(rides_count);
                                                self.cache_put(athlete_vanity+rides_offset,segments_list);
                                                res.send(segments_list);
                                            }
                                        });
                                    }else{
                                        var result = ride_cache_check;
                                        ride_efforts.push((typeof result != 'undefined'?result:0));
                                            // combine a 'blank' entry for final processing call counts to match
                                            if(ride_efforts.length == r.length){
                                                var segments_list = [];
                                                ride_efforts.filter(function(arr,index){
                                                    if(typeof arr == 'object'){
                                                        var segment_ids = Object.keys(arr);
                                                        if(segment_ids.length > 0)
                                                            segments_list = segments_list.concat(Object.keys(arr));
                                                    }
                                                });
                                                segments_list.unshift(rides_count);
                                                res.send(segments_list);
                                            }
                                    }
                                }
                        }
                        else
                            res.send(404,{"error":"Athlete or athlete rides not found"});
                    });
            }
        };
    };
helper.initialize();
helper.start();
