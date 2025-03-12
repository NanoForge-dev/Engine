#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <optional>

namespace nfo {

    template <typename Component>
    class SparseArray {
      public:
        using value_type = std::optional<Component>;
        using reference_type = value_type &;
        using const_reference_type = value_type const &;
        using container = std::vector<value_type>;
        using size_type = typename container::size_type;
        using iterator = typename container::iterator;
        using const_iterator = typename container::const_iterator;

        SparseArray() {}

        SparseArray(SparseArray const &other) : _data(other._data) {}

        SparseArray(SparseArray &&other) noexcept : _data(std::move(other._data)) {}

        SparseArray &operator=(SparseArray const &other)
        {
            if (this != &other) {
                _data = other._data;
            }
            return *this;
        }

        SparseArray &operator=(SparseArray &&other) noexcept
        {
            if (this != &other) {
                _data = std::move(other._data);
            }
            return *this;
        }

        void erase(const std::size_t &idx)
        {
            if (idx < _data.size()) {
                _data[idx].reset();
            }
        }

        iterator begin()
        {
            return _data.begin();
        }

        const_iterator begin() const
        {
            return _data.begin();
        }

        const_iterator cbegin() const
        {
            return _data.cbegin();
        }

        iterator end()
        {
            return _data.end();
        }

        const_iterator end() const
        {
            return _data.end();
        }

        const_iterator cend() const
        {
            return _data.cend();
        }

        reference_type operator[](size_t idx)
        {
            if (idx >= _data.size()) {
                _data.resize(idx + 1);
            }
            return _data[idx];
        }

        std::size_t size() const
        {
            return _data.size();
        }

        container _data;
    };

    template <typename Component>
    SparseArray<Component> copySparseArray(SparseArray<Component> const &other)
    {
        return SparseArray<Component>(other);
    }

    template <typename Component>
    SparseArray<Component> moveSparseArray(SparseArray<Component> &&other)
    {
        return SparseArray<Component>(std::move(other));
    }

    template <typename Component>
    typename SparseArray<Component>::reference_type getSparseArrayElement(
        SparseArray<Component> &array,
        size_t idx
    )
    {
        return array[idx];
    }

    template <typename Component>
    void setSparseArrayElement(SparseArray<Component> &array, size_t idx, Component const &value)
    {
        array[idx] = value;
    }

    template <typename Component>
    SparseArray<Component> &setSparseArrayCopy(
        SparseArray<Component> &array,
        SparseArray<Component> const &other
    )
    {
        array = other;
        return array;
    }

    template <typename Component>
    SparseArray<Component> &setSparseArrayMove(
        SparseArray<Component> &array,
        SparseArray<Component> &&other
    )
    {
        array = std::move(other);
        return array;
    }

    EMSCRIPTEN_BINDINGS(SparseArray)
    {
        emscripten::function("copySparseArray", &copySparseArray<emscripten::val>);
        emscripten::function("moveSparseArray", &moveSparseArray<emscripten::val>);
        emscripten::function("setSparseArrayCopy", &setSparseArrayCopy<emscripten::val>);
        emscripten::function("setSparseArrayMove", &setSparseArrayMove<emscripten::val>);
        emscripten::function("getSparseArrayElement", &getSparseArrayElement<emscripten::val>);
        emscripten::function("setSparseArrayElement", &setSparseArrayElement<emscripten::val>);

        emscripten::class_<SparseArray<emscripten::val>>("SparseArray")
            .constructor<>()
            .function("erase", &SparseArray<emscripten::val>::erase)
            .function("size", &SparseArray<emscripten::val>::size)
            .function(
                "end",
                emscripten::select_overload<SparseArray<emscripten::val>::iterator()>(
                    &SparseArray<emscripten::val>::end
                )
            )
            .function(
                "end",
                emscripten::select_overload<SparseArray<emscripten::val>::const_iterator() const>(
                    &SparseArray<emscripten::val>::end
                )
            )
            .function("cbegin", emscripten::select_const(&SparseArray<emscripten::val>::cbegin))
            .function("cend", emscripten::select_const(&SparseArray<emscripten::val>::cend))
            .function(
                "begin",
                emscripten::select_overload<SparseArray<emscripten::val>::iterator()>(
                    &SparseArray<emscripten::val>::begin
                )
            )
            .function(
                "begin",
                emscripten::select_overload<SparseArray<emscripten::val>::const_iterator() const>(
                    &SparseArray<emscripten::val>::begin
                )
            )
            .property("_data", &SparseArray<emscripten::val>::_data);

        emscripten::register_optional<emscripten::val>();
        emscripten::register_vector<std::optional<emscripten::val>>("container");
    }
} // namespace nfo
