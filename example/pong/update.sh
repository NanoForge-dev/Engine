#!/bin/bash

cd ../..
pnpm build
cd -
mkdir -p node_modules/@nanoforge
cp -rf ../../packages/* node_modules/@nanoforge

## Copy custom RedGPU library
rm -rf node_modules/@nanoforge/graphics-2d/node_modules/redgpu
cp -rf ../../libs/RedGPU/ node_modules/@nanoforge/graphics-2d/node_modules/redgpu/
