#!/bin/env node
/*
    Strava 'Fast 50' Segment Analyser - Openshift Node.js
    
    
    Ronaldo Barbachano March 2013
    http://redcapmedia.com
    
    Module Dependecies:
    Express.js, request
    
    
    nodes.json contains basic configuration, and allows you to define the urls of the helper nodes, and
    local enviornment settings for running the nodes locally without any modifications. By providing ports
    and urls corresponding to these ports a user is easily able to launch each node script to emulate the 'cloud'
    locally.
    
    Each node handles and caches a specific task needed for the calculations. All caching happens in memory inside of each node independently.
    don't worry; I've attempted to remove all of the 'extra' data for all API calls and only store very bare bones structures. Various points
    of the api are refreshed at various intervals that make the most sense; a segments best efforts and a users' rides are what are updated 
    most frequently.
    
    The main app, or 'ssaApp', (this script) calls on the other two nodes (which return json) to return another json feed to an ajax call.

*/


require('./scripts/helper.js'),
// make new node, and assign it the port associated with 'ipaddress' in nodes.json (for running locally)
helper = new ssaHelper('ipaddress');

helper.createRoutes = function() {
    var self = this;
    self.routes = { };
    self.routes['/health'] = function(req, res) {
        res.send('1');
    };
   /*
    *
    * Begin a lookup for a :club_name filter on an :athlete
    * Simply determines if club name is valid and if its unambigious (if its ambigious,
    * or the search term returns more than 1 match, then we provide a prompt to select another)
    * If only one is returned, we then determine if the athlete id exists within that club's members.
    *
    */
    self.routes['/club_segments/:athlete/:club_name'] = function(req,res){
        var base_url = 'http://www.strava.com/api/v1/clubs?name=', club_name = req.params.club_name;
        athlete = req.params.athlete;
        club_id = undefined;
        self.requester(base_url +club_name,function(body){
                if(typeof body['clubs'] != 'undefined'){
                    body = body['clubs'];
                    if(body.length == 1){
                        club_id = body[0].id;
                        self.routes['/segments/:athlete'](req,res);
                    }else{
                        // ask user to 'be more specific' ?
                        var result = [];
                        //body.filter(function(arr,index){result.push( arr.name);});
                        club_id = undefined;
                        res.send({error:"Club name ambigious"});
                    }
            }else{
                club_id = undefined;
                res.send({error:"No Matching teams"});
            }
        });

    }
   /*
    *
    *    Do a basic lookup of an athlete's segments, this function is reused in the route above.
    *
    */
    self.routes['/segments/:athlete'] = function(req, res) {
        var athlete_vanity = req.params.athlete;
        if(typeof req.params.club_name != 'undefined' && req.params.club_name != null  && req.params.club_name != '' && req.params.club_name != false && typeof club_id != undefined){
            ;
        }else{
            club_id = undefined;
            club_name = undefined;
        }
        if(athlete_vanity == '' || typeof athlete_vanity == 'undefined'){
            res.send({error:"Please provide Athlete Vanity"});
        }else{
            var base_url = nodes.rides + '/ride', total_time= 0, rides_offset = 0, r = [], bLength = 0, bCounter = 0, aCounter = 0, aCounterStop = 0,final = false,timeout = false,
            render = false,
            client_disconnect = false;
            req.on("open",function(){client_disconnect = false;});
            var segment_count = [];
            self.segmentRequest =
                function(body){
                    if(client_disconnect == false && body != false){
                        if(typeof body[0] == 'number')
                        // pop this to not mess with length
                        var number_of_rides = body.shift();
                        aCounterStop += body.length;
                        segment_count = segment_count.concat(body);
                        // put segments in the right places..
                        // stop fetching more rides of a segment limit is hit ... limit segments to 10,000 ?
                        if( !render && client_disconnect == false){
                            var seg_history = {};
                            segment_count.filter(function(arr,index){
                                if(typeof seg_history[arr] == 'undefined')
                                    seg_history[arr] = 1;
                                else
                                    seg_history[arr]++;
                            });
                            // do another filter to lookup values that have been traversed more than a few times?
                            final = true;
                            var minAttempts = 1, segCheck = [], segment_keys = Object.keys(seg_history);
                            for(var z = 0;z < segment_keys.length;z++){
                                var segment_id = segment_keys[z];
                                if(typeof seg_history[segment_id] == 'number' && seg_history[segment_id] > minAttempts)
                                    segCheck.push(segment_id);
                                
                            }
                            var segCount = 0, segRanks = [];
                            /*
                            
                                Use the seg check keys to begin looking up ranks on those segments and then look up info
                                the ranking call goes to another node server .. and isn't cached locally (yet)
                                
                            */
                            for(var i =0; i < segCheck.length ; i++){
                                var segUrl = (typeof club_id != 'undefined'?nodes.segment+'/crank/' + segCheck[i] +'/' + athleteId + '/' + club_id: nodes.segment+'/rank/' + segCheck[i] +'/' + athleteId);
                                self.requester(segUrl, function(body){
                                    segCount++;
                                    //console.log(body);
                                    if(body != false && (typeof body['error'] == 'undefined' && typeof body == 'object' && typeof body[2] != 'undefined'))
                                        segRanks.push(body);
                                    if(segCount == segCheck.length || client_disconnect){
                                    // might want to avoid sending back a blank strava segments response by checking length ...
                                        finalOutput = [];
                                       segRanks.filter(function(arr,index){
                                        /*
                                       0 [ 'Amgen/Rigel to Costco Bridge by bay trail',
                                       1   4.17,
                                       2   0,
                                       3   'NC',
                                       4   '3248725',
                                       5   4,
                                       6   874,
                                          [ 1, '-02:31', 1 ],   [ 3, '-00:05', 1 ], [ 5, '+00:34', 1 ] ]
                                        */
                                        var name = arr[0], dist = arr[1], grade = arr[2], cat = arr[3],segment_id = arr[4],rank = arr[5],best_time = arr[6];
                                        
                                        finalOutput.push([segment_id,rank,seg_history[segment_id],name,dist,grade,cat,best_time,arr[7],arr[8],arr[9]]);
                                       });
                                        var segRanksLength = segRanks.length;
                                        res.send('strava={segments:' + JSON.stringify(finalOutput) + '}');
                                    }
                                });
                            }
                        }
                    }else if(typeof finalOutput != 'undefined'){
                        // do different....
                        console.log('in finalOutput != undefined');
                        res.send('strava={segments:' + JSON.stringify(finalOutput) + '}');
                    }else{
                        res.send({error:"Problem with athlete vanity lookup"});
                    }
            }
        };
        if(client_disconnect != false){
        ;
        }else{
            /*
                This is the basic flow - first we determine the athlete's ID, then 
                determine if we are doing a club lookup, if so then we determine wether the club term only matches
                one, if not we provide the user with a list of matching clubs, once a club term
                only returns one entry then we determine if the athlete id exists within those club members,
                if not we (ideally) send them an alert telling them they do not belong to the club.
                
                Otherwise after the athlete id is determined we then begin to query the 'rides' server which returns 
                a list of ride efforts which is used to determine and count the segments the athlete is competing on.
                
                Next we query the  'segments' server which handles ranking and segment info lookup, it will determine
                if the athlete ID exists within a segment's best 50 efforts and return that segment data if it does (rank,
                best time, segment details and other calculated information).
            
            */
            var athleteId = 0;
            var athleteIdCheck = self.cache_get(athlete_vanity);
            if(athleteIdCheck == false || typeof athleteIdCheck == 'undefined'){
                var athleteIdLookupURL= nodes.rides+'/athlete/' + athlete_vanity;
                console.log(athleteIdLookupURL);
                    if(client_disconnect == false)
                        self.requester(athleteIdLookupURL,
                            function(body){
                                if(body != false){
                                    if(typeof body['id'] != 'undefined' && body['id'] != 0){
                                        self.zcache[athlete_vanity]= body['id'];
                                        athleteId = body['id'];
                                        if(typeof club_id != 'undefined'){
                                            // update every 8 hours?
                                            var clubMemberCheck = self.cache_get('m_'+club_id,self.getTO('club_members',60*60*8));
                                            if(clubMemberCheck == false)
                                                self.requester('http://www.strava.com/api/v1/clubs/'+ club_id + '/members',
                                                    function(body){
                                                        if(body != false){
                                                            var clubMembers = [];
                                                            body.members.filter(function(arr,index){
                                                                clubMembers.push(arr.id);
                                                            });
                                                            // return list of other members to do a 'voyer view'
                                                            self.cache_put('m_' + club_id, clubMembers);
                                                            if(clubMembers.indexOf(athleteId) == -1)
                                                                res.send({error:'Athlete is not a member of team'});
                                                            else
                                                            // build links to go to other athletes, in team?
                                                                self.requester(base_url +'s/'+athlete_vanity+'/'+rides_offset,self.segmentRequest);
                                                        }else
                                                            res.send({error:'Cannot Communicate with strava'});
                                                    }
                                                );
                                            else if(clubMemberCheck.indexOf(athleteId) == -1){
                                                //console.log('athlete does not belong to club');
                                                club_id = undefined;
                                                res.send({error:'Athlete is not a member of team'});
                                            }else{
                                                if(typeof req.params.club_name == 'undefined')
                                                    club_id = undefined;
                                                self.requester(base_url +'s/'+athlete_vanity+'/'+rides_offset,self.segmentRequest);
                                            }
                                        }else
                                            self.requester(base_url +'s/'+athlete_vanity+'/'+rides_offset,self.segmentRequest);
                                    }else
                                        console.log('\n\n\t***\terror\t***\n\n - body did not have an ID athleteIdCheck');
                                }
                            else{
                            console.log(nodes);
                                res.send({error:'Athlete Not Found'});
                            }
                        });
            }else{
                athleteId = athleteIdCheck;
                self.requester(base_url +'s/'+athlete_vanity+'/'+rides_offset,self.segmentRequest);
            }
        }
        req.on("close",function(){
            client_disconnect = true;
        });
};
}
helper.initialize();
helper.start();
