# ECS

## What is an ECS

"Entity–component–system (ECS) is a software architectural pattern mostly used in video game development for the representation of game world objects. An ECS comprises entities composed from components of data, with systems which operate on the components."
[Wikipedia](https://en.wikipedia.org/wiki/Entity_component_system)

## How to build

In order to build this ECS we need to first install a wasm compiler. For this project we gonna use `emsdk`.
You will also need `make` and `pnpm`

### Installing dependencies

To install dependencies run:

```sh
pnpm i
```

#### How to install the emsdk compiler:

To install emsdk the WASM compiler we are using run :

```sh
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk/
./emsdk install latest
./emsdk activate latest
source "$PWD/emsdk_env.sh"
echo -ne "export EMSDK_QUIET=1\nsource \"$PWD/emsdk_env.sh\"\n" >> ~/.bashrc
cd ..
```

### Building

Now that you have the dependencies you can build by running:

```sh
pnpm build
```

This will produce 2 files in the `lib/` directory.
- `libecs.js`, which is the file containg the javascript binding permitting the javascript to interract with the wasm.
- `libecs.wasm`, the compile code library

If you only wanna build the c++ part just use:

```sh
make
```

## Tests

To run tests use:

```sh
pnpm test
```

