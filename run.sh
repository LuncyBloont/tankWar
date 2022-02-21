#! /usr/bin/bash
cd $(dirname $0)
if [ ! -f "./config/multiplay.json" ]; then
    touch "./config/multiplay.json"
    echo "{}" > "./config/multiplay.json"
fi
node game.js
exit
