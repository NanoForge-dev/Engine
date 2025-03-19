#!/bin/bash

bun run build
mkdir -p ../../../${1}/apps/server/public/game
cp dist/* ../../../${1}/apps/server/public/game
