Strava.node.js
=================
**Ronaldo Barbachano (redcapmedia.com) March. 2013**

Distributed Node.js implementation of Strava.com api for personalized segment analytics using express.js deployable with Openshift.

## **Dependencies - npm modules**

***Express.js***

***Request***

## **Intention**

I wanted to allow this to be a **turn key** solution to interacting with the strava API in a distributed manner. 

##**Deployment**

If you don't have a redhat openshift account I highly recommmend you get one, they're free, and this repository is designed to run all nodes with very little configuration. 

Once you have your redhat openshift account, you can fill in your details in nodes.json, and make modifications to the package.json to specify the 'runtime' script (normally server.js).

In addition modification of the nodes.json file can allow you to specify ports to run the node scripts in your local environment quickly. Launch each script and begin using the api. Each script has detail instructions for use. Every script returns a json response, except for 'server.js', more details are contained in each file.

##**What This Does**

Each major endpoint in the strava API (v1) is covered, and some endpoints have been combined into one (ex: the rides call returns the efforts_ids contained within the rides (instead of the ride ID's)). This just happened to fit into my flow better. Also I've removed all of the key value names and use enumerated arrays whenever possible to take advantage of array filters. 

This script will provide you with a way to walk a users' all of a users rides, efforts, and potentially segment data. It also provides an interactive club name selector.

**Ranking**

Only the top 50 ranks in a given segment are calculated, but users may filter their rankings by club name. It will also perform some calculations based on the deltas in time that exist between rankings dependent on the athlete's rank.