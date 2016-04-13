#!/bin/sh
# Fetch prepros source

function log {
	if [[ x$DEBUG != x ]]; then
        echo "$@"
	fi
}

function abspath {
	if [[ -d "$1" ]]
	then
		pushd "$1" >/dev/null
		pwd
		popd >/dev/null
	elif [[ -e $1 ]]
	then
		f=$1
		#${var%/*}   # <== dirname
		#${var##*/}  # <== basename

		#enter directory containing the file
		pushd ${f%/*} >/dev/null
		#pushd $(dirname $1) >/dev/null

		# echo the full path
		echo $(pwd)/${f##*/}

		# return to original location
		popd >/dev/null
	else
		echo $1 does not exist! >&2
		return 127
	fi
}

SCRIPT=$(abspath $0)
SCRIPT_DIR=$(dirname $0)
TMP_DIR="${SCRIPT_DIR}/.tmp"

log Create working directory : $TMP_DIR
[ -e "$TMP_DIR" ] || mkdir "$TMP_DIR"

log go to directory
pushd "$TMP_DIR" > /dev/null

if [[ ! -e Prepros ]]; then
	log Cloning Prepros repo
	git clone git@github.com:subash/Prepros.git
else
	log Found existing Prepros repo
fi

if [[ ! -e Prepros ]]; then
	log Det skjedde en feil
	exit 1
fi


# Build prepros module that can be used from NodeJS
echo // Built: $(date) > prepros.js
cat ../prepros-pre.js  >> prepros.js
find Prepros/application/app/scripts/services  \
	 Prepros/application/app/scripts/filters   \
	-name '*.js' \
| xargs cat >> prepros.js
cat ../prepros-post.js  >> prepros.js

mv prepros.js  ../../lib/prepros.js

popd > /dev/null
