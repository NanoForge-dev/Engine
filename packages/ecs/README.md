# Engine Core

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
