#!/bin/bash
#test_fullscreen.sh

# based on and inspired by https://jamcnaughton.com/2015/10/07/stop-xscreensaver-interrupting-full-screen-videos-on-multiple-monitors/
# https://github.com/jamcnaughton/useful-linux-scripts/tree/master/xscreensaver
# xscreensaverstopperany.sh / xscreensaverstopper.sh

#reworked for node.js module using, no wmctrl required;
#checks once on-run if any windows are full screen, returns JSON value {"isFullscreen": 0|true|false}

# This script is licensed under GNU GPL version 2.0 or above

# Uses elements from lightsOn.sh
# Copyright (c) 2011 iye.cba at gmail com
# url: https://github.com/iye/lightsOn
# This script is licensed under GNU GPL version 2.0 or above


IS_FULLSCREEN_RES=0
CURRENT_DISPLAY=$DISPLAY

# enumerate all the attached screens
displays=""
while read id
do
    displays="$displays $id"
done< <(xvinfo | sed -n 's/^screen #\([0-9]\+\)$/\1/p')

checkFullscreen()
{
	IS_FULLSCREEN=false

    # loop through every display looking for a fullscreen window
    for display in $displays
    do

		NET_CLIENT_LIST=$(xprop -root _NET_CLIENT_LIST | awk '$3 != "N/A" {print $0}')

		if [[ $NET_CLIENT_LIST = *"_NET_CLIENT_LIST(WINDOW): window id #"* ]]; then

			TEST_WIN_IDs=${NET_CLIENT_LIST//"_NET_CLIENT_LIST(WINDOW): window id #"/""};

		fi

		for i in $TEST_WIN_IDs; do

			isWinFullscreen=`DISPLAY=${CURRENT_DISPLAY}.${display} xprop -id "$i" | grep _NET_WM_STATE_FULLSCREEN`
#			isWinFullscreen=`DISPLAY=${CURRENT_DISPLAY}.2 xprop -id "$i" | grep _NET_WM_STATE_FULLSCREEN`

			if [[ "$isWinFullscreen" == *NET_WM_STATE_FULLSCREEN* ]];then

				IS_FULLSCREEN=true

			fi

		done
    done

  IS_FULLSCREEN_RES=$IS_FULLSCREEN;

}

checkFullscreen

printf '{"isFullscreen": %s}' $IS_FULLSCREEN_RES;
