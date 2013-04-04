#!/bin/bash

##
##  Strava.node.js Openshift (Bash) Installer
##
##  Ronaldo Barbachano (April 2013)
##  This requires that you have rhc client tools and git
##  installed and your client configured.
##  Refer to redhat's openshift documentation to do this.
##
##  This script will create an redhat cloud app, and will install the
##  appropriate Strava.node.js branch. It also allows
##  for installation of any version of node (optional) through onscreen prompts.
##  In addition it'll push the changes to your repo so if its
##  completely sucessful it'll be online by the time the script exits.
##
##  Basic Use
##
##  (make sure script has execute permissions 755 or better)
##  Place/launch from folder where you don't mind a repo being created!
##  ./openshift_installer
##  (Follow onscreen instructions)
##
##  Use With Arguments
##
##  ./openshift_installer.sh master
##  ./openshift_installer.sh rides
##  ./openshift_installer.sh segment
##
##  Notes
##
##  The 'master' node has an few extra options and does
##  not have to have the same rhcloud namespace as the others,
##  but should refer to a single namespace that rides and segment exist in.
##
##  Each node reads from an independent nodes.json file but only the master
##  server really 'uses' this information - to communicate with
##  rides/segment nodes otherwise its only used for cache settings which
##  need to be configured individually.
##
function exitStatus {
## used to end program flow if specific tasks (commands) fail
    if [ "$1" != 0 ]; then
        exit
    fi
}

function createApp {
    ## createApp name
    rhc app create "$1" nodejs-0.6
    exitStatus $?
}

function dirCheck {
    if [ -d "$1" ]; then
        echo 'A directory with the same name as the app already exists, please remove it.'
        exit
    fi

}

## openshift NODE_TYPE
rhc_name=$1

clear

echo -n '**********
Welcome to the Strava.nodes.js Openshift Helper Script
*********



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
else
    echo 'Invalid argument.
    Did you mean?
    openshift.sh master
    openshift.sh master <name>
    openshift.sh rides
    openshift.sh segment
    '
fi
## could glean this from rhc stuff..
if [ "$rhc_name" == 'master' ] || [ "$rhc_name" == 'segment' ] || [ "$rhc_name" == 'rides' ]; then
    ## run rhc server and hope exit status returns false if the server isn't running fine? but this should be
    ## more of a installation check than anything else
    rhc server
    exitStatus $?

    if [ "$rhc_name" == 'master' ]; then

        custom_app_name_arg=$2

        if [ "$custom_app_name_arg" == '' ]; then
            custom_app_name=
            while [ -z $custom_app_name ]
            do
                echo 'Pick a name for the master app
                '
                read custom_app_name
            done
        else
            custom_app_name="$2"
        fi
        ## Needed to do it this way to properly fetch the data from Strava.node.js without too much modification
        
        dirCheck "$custom_app_name"
        createApp $custom_app_name
        cd $custom_app_name
    else
        dirCheck $rhc_name
        createApp $rhc_name
        cd $rhc_name

    fi

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
        exitStatus $?
        git pull -s recursive -X theirs upstream master
        exitStatus $?
        echo "$node_version" >> .openshift/markers/NODEJS_VERSION
        exitStatus $?
        git add .openshift/markers/NODEJS_VERSION
        exitStatus $?
        git commit -m 'use custom Node version '
        exitStatus $?
    fi

    ## Add Strava.node.js Repo (not sure about the -m flag)
    git remote add Strava.node.js -m $rhc_name https://github.com/redcap3000/Strava.node.js.git
    exitStatus $?
    ## Get 'app' branch from Strava.node.js
    git pull -s recursive -X theirs Strava.node.js $rhc_name
    exitStatus $?

    ## Done
    echo '
    ********
    Success!
    Next generate the nodes.json with nodes_config.sh or edit nodes.json
    You only need to make one nodes.json - which may be deployed across all nodes
    
    git add nodes.json && git commit -m "Configured Nodes" && git push
    ********
    '
fi