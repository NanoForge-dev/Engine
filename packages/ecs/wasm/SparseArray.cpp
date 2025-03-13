#include <cstddef>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <optional>

namespace nfo {

    template <typename Component>
    class SparseArray {
      public:
        using value_type = std::optional<Component>;
        using reference_type = value_type &;
        using move_reference_type = value_type &&;
        using const_reference_type = value_type const &;
        using container = std::vector<value_type>;
        using size_type = typename container::size_type;
        using iterator = typename container::iterator;
        using const_iterator = typename container::const_iterator;

        SparseArray() = default;

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

        void erase(const size_type &idx)
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

        reference_type operator[](size_type idx)
        {
            if (idx >= _data.size()) {
                _data.resize(idx + 1);
            }
            return _data[idx];
        }

        const_reference_type operator[](size_type idx) const
        {
            if (idx >= _data.size()) {
                return _opt_null;
            }
            return _data[idx];
        }

        reference_type get(size_type idx)
        {
            return (*this)[idx];
        }

        const_reference_type get(size_type idx) const
        {
            return (*this)[idx];
        }

        void set(size_type idx, value_type value)
        {
            (*this)[idx] = value;
        }

        size_type size() const
        {
            return _data.size();
        }

        void resize(size_type size)
        {
            _data.resize(size);
        }

        void clear()
        {
            _data.clear();
        }

        bool empty() const
        {
            return _data.empty() || std::all_of(_data.begin(), _data.end(), [](const auto &v) {
                       return !v.has_value();
                   });
        }

        reference_type insert_at(size_type idx, const_reference_type value)
        {
            if (idx >= _data.size()) {
                _data.resize(idx + 1);
            }
            _data[idx] = value;
            return _data[idx];
        }

        reference_type insert_at(size_type idx, move_reference_type value)
        {
            if (idx >= _data.size()) {
                _data.resize(idx + 1);
            }
            _data[idx] = std::move(value);
            return _data[idx];
        }

        template <class... Params>
        reference_type emplace_at(size_type idx, Params &&...params)
        {
            if (idx >= _data.size()) {
                _data.resize(idx + 1);
            }
            _data[idx] = value_type(std::forward<Params>(params)...);
            return _data[idx];
        }

        size_type get_index(const_reference_type value) const
        {
            auto it = std::find(_data.begin(), _data.end(), value);
            if (it != _data.end()) {
                return static_cast<size_type>(std::distance(_data.begin(), it));
            }
            return _data.size();
        }

      private:
        const value_type _opt_null = std::nullopt;
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
        return SparseArray<Component>(other);
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
        array = other;
        return array;
    }

    EMSCRIPTEN_BINDINGS(SparseArray)
    {
        emscripten::register_optional<emscripten::val>();
        emscripten::register_vector<std::optional<emscripten::val>>("container");

        emscripten::function("copySparseArray", &copySparseArray<emscripten::val>);
        emscripten::function("moveSparseArray", &moveSparseArray<emscripten::val>);
        emscripten::function("setSparseArrayCopy", &setSparseArrayCopy<emscripten::val>);
        emscripten::function("setSparseArrayMove", &setSparseArrayMove<emscripten::val>);

        emscripten::class_<SparseArray<emscripten::val>>("SparseArray")
            .constructor<>()
            .function("size", &SparseArray<emscripten::val>::size)
            .function(
                "get_index",
                emscripten::select_overload<SparseArray<emscripten::val>::size_type(
                    SparseArray<emscripten::val>::const_reference_type
                ) const>(&SparseArray<emscripten::val>::get_index)

            )
            .function(
                "get_const",
                emscripten::select_overload<SparseArray<emscripten::val>::const_reference_type(
                    SparseArray<emscripten::val>::size_type
                ) const>(&SparseArray<emscripten::val>::get)
            )
            .function(
                "get",
                emscripten::select_overload<SparseArray<emscripten::val>::reference_type(
                    SparseArray<emscripten::val>::size_type
                )>(&SparseArray<emscripten::val>::get)
            )
            .function(
                "insert_at",
                emscripten::select_overload<SparseArray<emscripten::val>::reference_type(
                    SparseArray<emscripten::val>::size_type,
                    SparseArray<emscripten::val>::const_reference_type
                )>(&SparseArray<emscripten::val>::insert_at)
            )
            .function(
                "insert_at",
                emscripten::select_overload<
                    SparseArray<emscripten::val>::
                        reference_type(SparseArray<emscripten::val>::size_type, SparseArray<emscripten::val>::value_type &&)>(
                    &SparseArray<emscripten::val>::insert_at
                )
            )
            .function("clear", &SparseArray<emscripten::val>::clear)
            .function("empty", &SparseArray<emscripten::val>::empty)
            .function("resize", &SparseArray<emscripten::val>::resize)
            .function("set", &SparseArray<emscripten::val>::set);
    }
} // namespace nfo
