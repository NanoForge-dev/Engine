#! /bin/sh

if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0"
    echo "Build the documentation using Sphinx."
    echo "--build    Build the documentation."
    exit 0
fi

PNPM=$(which pnpm)
SPHINX=$(which sphinx-build)

if [ -z "$PNPM" ]; then
    echo "pnpm is not installed. Please install pnpm to proceed."
    exit 1
fi

run_typedoc() {
    $PNPM typedoc --options typedoc.json
}

clean_typedoc() {
    rm -rf docs_markdown
}

run_sphinx() {
    $SPHINX docs docs_build
}

setup_api_docs() {
    for dir in packages/*; do
        mkdir -p docs/$(basename $dir)/api
        cp -r docs_markdown/@nanoforge-dev/$(basename $dir).md docs/$(basename $dir)/api/index.md
    done
}

doxygen_doc() {
    doxygen packages/ecs-lib/docs/Doxyfile

    cp -r xml docs/ecs-lib/api/xml
    cp -r packages/ecs-lib/docs/index.rst docs/ecs-lib/index.rst
    cp -r packages/ecs-lib/docs/wasm.rst docs/ecs-lib/wasm.rst
    mv docs/ecs-lib/api/index.md docs/ecs-lib/api/typescript.md
}

clean_typedoc
run_typedoc
setup_api_docs
doxygen_doc

if [ "$1" = "--build" ]; then
    run_sphinx
    echo "Documentation built successfully."
fi