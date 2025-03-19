#!/bin/bash

cd ../..
pnpm build
cd -
mkdir -p node_modules/@nanoforge
cp -rf ../../packages/* node_modules/@nanoforge
