#Strava.node.js


###**[Ronaldo Barbachano](http://redcapmedia.com)**

####**March. 2013**

> Distributed Node.js implementation of [Strava.com](http://strava.com) api for personalized segment analytics using express.js deployable with [Openshift](http://www.openshift.com).

##**Intention**
=================

I wanted to allow this to be a **turn key** solution to interacting with the strava API in a distributed manner. 


##**What This Does**
=================
Each major endpoint in the [Strava API (v1)](https://stravasite-main.pbworks.com/w/page/51754105/Strava%20API%20Overview) related to rides, segments, and segment efforts (including clubs) is covered, and some endpoints have been combined into one (ex: the rides call returns the efforts_ids contained within the rides (instead of the ride ID's)). This just happened to fit into my flow better. Also I've removed all of the key value names and use enumerated arrays whenever possible to take advantage of array filters. 

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

If you don't have a **[redhat openshift](https://www.openshift.com)** account I highly recommmend you get one, they're free, and this repository is designed to run all nodes with very little configuration. 



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
##**Helper bash Scripts**
=================

Inside the util/ directory are two scripts, one to generate a nodes.json configuration file and openshift_installer that will walk you through the process of creating an rhc cloud application using rhc client tools, and allow you to specify the version of node you'd like to use. More information is contained within the installer scripts.

If a step fails along the way the script will exit. Sometimes openshifts servers don't behave properly so merely start over (or reboot the application you are deploying to).

**Basic use openshift_installer.sh**

	## prompts for all information
	./openshift_installer.sh

	## creates a master 'node' and prompts for application name
	./openshift_installer.sh master

	## creates a master 'node' as application name 'ssa'
	./openshift_installer.sh master ssa

	## creates a 'rides' node
	./openshift_installer.sh rides
	
>These will put the new application repo inside of the same folder these are launched from

**Basic use for nodes_config.sh**

	## prompts you for local IP/port settings and cache timeout values
	./nodes_config.sh nodes.json
	## copy this file into your new node
	cp nodes.json ssa/
	## commit and push change
	git add nodes.json
	git commit -m 'Set nodes.json values' 
	git push
	
>Creates a nodes.json in the same path as script
