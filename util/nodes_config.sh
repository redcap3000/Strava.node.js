#!/bin/bash

##
##  Strava.node.js Nodes Configuration (Bash) Installer
##  This will overwrite an existing nodes.json
##  Ronaldo Barbachano April 2013
filename=$1

if [ "$filename" == '' ]; then
    echo 'Missing argument (filename)'
    exit
fi


if [ -f "$filename" ]; then
    echo 'File exists'
    exit
fi

ip=
while [ -z $ip ]
    do
        echo -n 'Your local Ip address ( 192.168.0.1 ) ?
'
        read ip
    done
    
while [ -z $port_ipaddress ]
    do
        echo -n 'Your local port for master node? ( 8080 ) ?
'
        read port_ipaddress
    done
port_segment=
while [ -z $port_segment ]
    do
        echo -n 'Your local port for segment node? ( 8081 ) ?
'
        read port_segment
    done
## ensure port segment and ip address are not the same (as strings)
if [ "$port_ipaddress" == "$port_segment" ]; then
    echo 'Segment port is already in use for the master node.'
    exit
fi

port_rides=
while [ -z $port_rides ]
    do
        echo -n 'Your local port for rides node? ( 8082 ) ?
'
        read port_rides
    done

if [ "$port_rides" == "$port_segment" ] || [ "$port_rides" == "$port_ipaddress" ]; then
    echo 'Rides port is already in use'
    exit
fi

## TIMEOUTS (in seconds)
echo '*****
Timeouts
*****

Values are in seconds.

'
to_rides=
while [ -z $to_rides ]
    do
        echo -n 'Timeout (seconds) for rides (9600) 
'
        read to_rides
    done
to_effort=
while [ -z $to_effort ]
    do
        echo -n 'Timeout (seconds) for ride efforts (25200)
'
        read to_effort
    done
to_segment_best=
while [ -z $to_segment_best ]
    do
        echo -n 'Timeout (seconds) for segment efforts best (9600)
'
        read to_segment_best
    done
to_club_best=
while [ -z $to_club_best ]
    do
        echo -n 'Timeout (seconds) for segment efforts best by club (9600)
'
        read to_club_best
    done
    
    rhc_domain=
    while [ -z $rhc_domain ]
    do
        echo -n 'Redhat openshift namespace (optional)?
'
        read rhc_domain
    done

        
echo '{ "local":{
"ipaddress" : "'$ip'",
"segment" : "'$ip':'$port_segment'",
"rides" : "'$ip':'$port_rides'",
"_ports" : {"ipaddress" : '$port_ipaddress', "segment": '$port_segment',"rides":'$port_rides'},
"_timeouts" : {"athlete+rides_offset":'$to_rides',"efforts_timeout":'$to_effort',"club_segment":'$to_club_best',"segment":'$to_segment_best'}
},
"openshift":
{
"_oDomain" : "'$rhc_domain'",
"_cDomain" : "rhcloud.com"
}
}
'> "$filename"

echo '
********
Success nodes.json created!
Move the new nodes.json file into the appropriate repo
git add nodes.json && git commit -m "Configured Nodes" && git push
********
'


