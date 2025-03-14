/*⠀                                                         ⠀⠀ ⠀⠀⠀⠀⢀⣀⣀⣀⣀⡀⠀⠀⠀⠀⠀⠀⠀
**⠀⠀                                                          ⠀⢀⣠⣾⡿⠿⠛⠛⠛⠛⠿⢿⣷⣄⡀⠀⠀⠀
**     _   __                  ______ ⠀                     ⠀ ⣰⣿⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠈⠛⣿⣆⠀⠀
**    / | / /___ _____  ____  / ____/___  _________ ____ ⠀   ⣾⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⣷⠀
**   /  |/ / __ `/ __ \/ __ \/ /_  / __ \/ ___/ __ `/ _ \   ⢰⣿⠃⠀⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⠤⠀⠀⠘⣿⡆
**  / /|  / /_/ / / / / /_/ / __/ / /_/ / /  / /_/ /  __/   ⢸⣿⠀⠀⠀⠉⠛⠛⢻⣿⣿⣿⠉⠀⠀⠀⠀⠀⣿⡇
** /_/ |_/\__,_/_/ /_/\____/_/    \____/_/   \__, /\___/    ⠸⣿⡄⠀⠀⠀⠀⣠⣾⣿⣿⣿⣤⠀⠀⠀⠀⢠⣿⠇
**                                          /____/ ⠀         ⢿⣷⡀⠀⠀⠀⠉⠁⠀⠀⠈⠉⠀⠀⠀⢀⣾⡿⠀
**                                                          ⠀⠀⠹⣿⣤⡀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣿⠏⠀⠀
**                      2025                                ⠀⠀⠀⠈⠙⢿⣷⣶⣤⣤⣤⣤⣶⣾⡿⠋⠁⠀⠀⠀
**⠀                                                          ⠀⠀⠀⠀⠀⠀⠈⠉⠉⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀
*/

#pragma once

#include <optional>
#include <utility>

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

        SparseArray &setByCopy(SparseArray const &other)
        {
            return *this = other;
        }

        SparseArray &setByMove(SparseArray &&other)
        {
            return *this = std::move(other);
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

        [[nodiscard]] const_iterator begin() const
        {
            return _data.begin();
        }

        [[nodiscard]] const_iterator cbegin() const
        {
            return _data.cbegin();
        }

        iterator end()
        {
            return _data.end();
        }

        [[nodiscard]] const_iterator end() const
        {
            return _data.end();
        }

        [[nodiscard]] const_iterator cend() const
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

        [[nodiscard]] const_reference_type get(size_type idx) const
        {
            return (*this)[idx];
        }

        void set(size_type idx, value_type value)
        {
            (*this)[idx] = std::move(value);
        }

        [[nodiscard]] size_type size() const
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

        [[nodiscard]] bool empty() const
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

        [[nodiscard]] size_type get_index(const_reference_type value) const
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
} // namespace nfo
