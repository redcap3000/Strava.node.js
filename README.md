#Strava.node.js


###**[Ronaldo Barbachano](http://redcapmedia.com)**

####**March. 2013**

> Distributed Node.js implementation of Strava.com api for personalized segment analytics using express.js deployable with Openshift.

##**Intention**
=================

I wanted to allow this to be a **turn key** solution to interacting with the strava API in a distributed manner. 


##**What This Does**
=================
Each major endpoint in the strava API (v1) is covered, and some endpoints have been combined into one (ex: the rides call returns the efforts_ids contained within the rides (instead of the ride ID's)). This just happened to fit into my flow better. Also I've removed all of the key value names and use enumerated arrays whenever possible to take advantage of array filters. 

This script will provide you with a way to walk a users' all of a users rides, efforts, and potentially segment data.

###Ranking

Only the top 50 ranks in a given segment are calculated, but users may filter their rankings by club name. It will also perform some calculations based on the deltas in time that exist between rankings dependent on the athlete's rank.

###BYO Database

This repo does not come with a database store, but instead keeps all values in memory using helper functions **cache_get**(key,timeout-optional) and **cache_put**(key,value). In the future I may add support for at least **Mongo using Mongoose and possibly Redis**, but this will more than likely be implemented in a 'plugin' type of setup that will simply modify cache_get/put to use any desired data store.

###Strava API/Endpoint Modifications

This repo will modify the way the Strava API data streams appear and generally function. Specifically the athlete's rides and efforts API endpoints have been combined, as well as the segments best efforts (including a clubs segments' best efforts) and segment data endpoints have been combined. In addition some calls concerning athlete lookup, and athlete club lookup (to check if that athlete belongs) have been combined.

=================

#**Deployment**
=================

###Dependencies - npm modules

*  	Express
*  	Request

###Quickstart
=================

>***assumes you've modified nodes.json to reflect your ip address, read below for more information***
	
	node server.js 
	node rides.js 
	node segment.js
	curl http://192.168.0.198:8080/segments/rbarbachano
	curl http://192.168.0.198:8080/club_segments/rbarbachano/sffixed


###**redhat openshift**
=================

If you don't have a redhat openshift account I highly recommmend you get one, they're free, and this repository is designed to run all nodes with very little configuration. 

Once you have your redhat openshift account, you can fill in your details in nodes.json, and make modifications to the package.json to specify the 'runtime' script (normally server.js). Each keyname inside of 'local' (associated with a URL) will be used to assemble as a url when deploying to openshift.

In addition modification of the nodes.json file can allow you to specify ports to run the node scripts in your local environment quickly. Launch each script and begin using the api. Each script has detail instructions for use.


##**Testing**
=================
Testing is somewhat simple, for the time being and is dependent on the assert module. Run the scripts  inside of 'tests' ending with _test while the associated scripts are running (locally). They test API endpoints with http requests for appropriate reponses and inappropriate responses; mostly dependent on returned status codes.
	
	## Start servers
	node server.js
	node rides.js
	node segment.js
	
	## Switch to test directory
	cd tests/
	
	## Run tests
	node rides_test.js
	node segment_test.js
	

##**Configuration**
=================
>**Local Configuration vs. 'Remotes'**

nodes.json tells the various scripts what URLs to use based on what is available. If the openshift enviornment variables (which change quite frequently) are not available it will load whatever is contained within 'local'. This was intended to be quickly deployed locally and on openshift without having to ignore or modify files. When loading from local it will refer to port numbers to instansate the current node; as most local installations only have access to one ipaddress (typically). Any combination of local/remote urls and port numbers could potentially be used to defined a number of distributed setups. The URL's in local are used as api endpoints inside the nodes. 

>**Deploying to Openshift**

Once you provide your openshift's account domain (nodes.openshift._oDomain), you can upload the entire repo, modify the package.json file to run a specified script to point to the script that you want your node to be (rides.js,segment.js or server.js) and away you go! When the scripts are run inside of the openshift enviornment it will automatically change the url references to point to openshift servers based on the keys inside of "local" (excluding ipaddress and _ports). 

>**Breakdown of Openshift node configuration**
	
	/* 
	 *  Main server that talks to segment.js and rides.js
	 *
	 */
	 
	server.js		- 	http://<you pick>-<myappDomain>.rhcloud.com/
	
					package.json	-
	
									{ ..
										"main": "server.js" 
									}	
					
	/* 
	 *  Supporting servers that talk to strava and server.js
	 *
	 */
	
	segment.js		-	http://segment-<myappDomain>.rhcloud.com/
	
					package.json	-
									{ ..
										"main": "segment.js" 
									}	
	
	
	rides.js		-	http://rides-<myappDomain>.rhcloud.com/
	
					package.json	-
									{ ..
										"main": "rides.js" 
									}	
	
	

>**Managing timeout values**

While currently most api calls have default values, I've implemented some options inside of nodes.json to let users override these values. These values are represented in seconds, based on the beginning of the unix time epoch (i.e. I toss around unix timestamp representations of javascript data objects). The keyname of the 'timeout' is used to refer to the key value when calling cache_get and are named for organizational purposes and code readabilty.

>***Default configuration***

	{	
		"local":{
	            "ipaddress" : "192.168.0.198",
	            "segment" : "http://192.168.0.198:8081",
	            "rides" : "http://192.168.0.198:8082",
	            "_ports" : {
	            	"ipaddress" : 8080,
	            	"segment": 8081,
	            	"rides":8082
	            },
	            "_timeouts" : {
	            	"athlete+rides_offset":3600,
	            	"efforts_timeout":25200,
	            	"club_segment":3600,
	            	"segment":1800
	            }
	        },
	    "openshift":{
	            "_oDomain" : "<your rhcloud domain>",
	            "_cDomain" : "rhcloud.com"
	        }
	}

