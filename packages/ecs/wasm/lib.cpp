#include <emscripten/bind.h>
#include <emscripten/val.h>

template <typename T>
class TestClass {
  public:
    TestClass(T value) : value(value) {}

    T getValue()
    {
        return value;
    }

  private:
    T value;
};

EMSCRIPTEN_BINDINGS(test)
{
    emscripten::class_<TestClass<emscripten::val>>("TestClass")
        .constructor<emscripten::val>()
        .function("getValue", &TestClass<emscripten::val>::getValue);
}
