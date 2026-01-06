Writing Web Assembly
====================

Code Splitting
--------------

When writing Web Assembly modules, it's important to consider code
splitting for readability and maintainability. We try to split binding
and code logic into separate files where possible. This helps keep the
codebase organized and makes it easier to navigate.

For example, in the ECS package, the binding logic is in ``.cpp`` files,
while the core logic resides in ``.hpp`` files. This separation allows
developers to focus on either the binding or the logic without being
overwhelmed by both at the same time.

Documentation
-------------

When documenting Web Assembly modules, we follow a similar approach to
C++ documentation. We use Doxygen-style comments to provide clear and
concise explanations of classes, methods, and parameters. This
documentation is crucial for developers who will be using or maintaining
the Web Assembly modules, as it provides necessary context and usage
information.

Logging
-------

Logging in Web Assembly is costly memory-wise due to the interaction
between C++ and JavaScript. Therefore, we recommend to log from the
JavaScript side whenever possible. If logging from C++ is necessary, be
aware of the potential performance implications and memory leaks. Web
assembly vm is memory limited, so excessive logging will lead to
out-of-memory errors.
