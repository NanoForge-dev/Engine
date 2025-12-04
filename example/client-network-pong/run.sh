#!/bin/bash

./build.sh ${1} && cd ../../../${1}/apps && bun run dev
