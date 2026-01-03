Registry
========

.. toctree::
    :maxdepth: 2

    writing_web_assembly.rst

The registry class is written in C++ and exposed to WebAssembly using
Emscripten. This choice was made to leverage the performance benefits of
C++ for managing entities and components in an ECS architecture.
Emscripten allows us to compile C++ code into WebAssembly, which can
then be used in web applications, providing a bridge between
high-performance C++ code and JavaScript.

Design Choices
--------------

This design makes some trade-offs between performance and ease of use. A
pure C++ ECS would have been easier to use but having to bind it as us
make choices that impact usability.

Const Correctness
~~~~~~~~~~~~~~~~~

In a regular C++ ECS, const correctness is a given, but when exposing
C++ to WebAssembly, as in C++ we can force constant of return values.
But in WebAssembly, the concept of const correctness does not directly
translate to JavaScript. Therefore, methods that would typically return
const references in C++ may return non-const references or copies when
exposed to WebAssembly. We deciced to keep the const correctness in the
C++ code to maintain clarity and intent within the C++ domain, even if
it doesn't fully carry over to the WebAssembly interface.

Error Handling
~~~~~~~~~~~~~~

Any thrown exceptions in C++ will result in a runtime error in
JavaScript. The problem with this approach is that the error messages
may not be as descriptive or user-friendly as native JavaScript errors.
As every error thrown in C++ will be caught as a generic runtime error
in JavaScript, it can make debugging more challenging. To mitigate this,
we recommend thorough testing and validation within the C++ code to
catch potential issues before they propagate to the WebAssembly layer.
