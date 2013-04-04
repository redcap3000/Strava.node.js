#!/bin/bash
## MAKE SURE A DIRECTORY NAMED 'segment' doesn't already exist!

function exitStatus {
    if [ "$1" != 0 ]; then
        exit
    fi
}

function createApp {
    ## createApp name
    rhc app create "$1" nodejs-0.6
    exitStatus $?
}

## openshift NODE_TYPE
rhc_name=$1
echo $rhc_name
##clear

echo -n '**********
Welcome to the Strava.nodes.js Openshift Helper Script
*********
assumes you have rhc client tools installed


'

if [ "$1" == '' ]; then
    rhc_name=
    while [ -z $rhc_name ]
    do
        echo -n 'What node server would you like to create? (master/rides/segment)?
    '
        read rhc_name
    done
elif [ "$1" == 'master' ] || [ "$1" == 'rides' ] || [ "$1" == 'segment' ]; then
    echo -n 'Creating node ' $1 '
'
fi
## could glean this from rhc stuff..


if [ "$rhc_name" == 'master' ] || [ "$rhc_name" == 'segment' ] || [ "$rhc_name" == 'rides' ]; then
    if [ "$rhc_name" == 'master' ]; then
        ## configure nodes.json
        ## should probably ALWAYS configure nodes.json for each .. to define the timeout values for each
        ## segment? or add a remote to the nodes.json that updates itself ?

        ## ask for a name for the master node?
        custom_app_name=
        while [ -z $custom_app_name ]
        do
            echo 'Pick a name for the master app
            '
            read custom_app_name
        done
        ## Needed to do it this way to properly fetch the data from Strava.node.js without too much modification
        echo 'You will be calling this app ' $custom_app_name
        
        createApp $custom_app_name
        
        rhc_domain=
        while [ -z $rhc_domain ]
        do
            echo -n 'Redhat account name? <http://'$rhc_name'-<AccountName>.rhcloud.com>
        '
            read rhc_domain
        done
        
        cd $custom_app_name
        echo '{   "local":{
                "ipaddress" : "192.168.0.198",
                "segment" : "http://192.168.0.198:8081",
                "rides" : "http://192.168.0.198:8082",
                "_ports" : {"ipaddress" : 8080, "segment": 8081,"rides":8082},
                "_timeouts" : {"athlete+rides_offset":3600,"efforts_timeout":25200,"club_segment":3600,"segment":1800}
            },
            "openshift":
            {
                "_oDomain" : "'$rhc_domain'",
                "_cDomain" : "rhcloud.com"
            }
        }
        '> $custom_app_name/nodes.json
        git add "$custom_app_name"'/nodes.json'
        exitStatus $? 
        
    else
        createApp $rhc_name
        cd $rhc_name

    fi

    ## get success code from here and continue the app...

    custom_nodejs=
    while [ -z $custom_nodejs ]
    do
        echo -n 'Would you like to install a custom version of Node.js? 
     This will increase your next push time
    (y/n)'
        read custom_nodejs
    done

    if [ "$custom_nodejs" == 'y' ] || [ "$custom_nodejs" == 'Y' ]  ; then
        node_version=
        while [ -z $node_version ]
        do
            echo -n 'Please enter a valid version of node (0.10.3)
    '
            read node_version
        done
        ## probably change this branch name to something other than 'upstream'
        git remote add upstream -m master git://github.com/openshift/nodejs-custom-version-openshift.git
        git pull -s recursive -X theirs upstream master
        echo "$node_version" >> .openshift/markers/NODEJS_VERSION
        ## not working???
        ## echo .openshift/markers/NODEJS_VERSION
        git add .openshift/markers/NODEJS_VERSION
        git commit -m 'use custom Node version '
    fi



    ## Add Strava.node.js Repo (not sure about the -m flag)
    git remote add Strava.node.js -m $rhc_name https://github.com/redcap3000/Strava.node.js.git
    ## do exit status here too ???
    ## Get 'app' branch from Strava.node.js
    git pull -s recursive -X theirs Strava.node.js $rhc_name

    ## Done??
    echo '
    ********
    Success! Change directories and run git push
    ********
    '
    
    
    
fi