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

#include <iostream>
#include <optional>
#include <ranges>
#include <utility>

namespace nfo {
    /**
    ** @brief A sparse array implementation that allows for optional components.
    ** @tparam Component The type of component to be stored in the sparse array.
    **
    ** This class provides a way to store components in a sparse manner, allowing for efficient
    ** storage and retrieval of components by their indices. It uses std::optional to represent
    ** the presence or absence of a component at a given index.
    */
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

        /**
         * @brief Default constructor for SparseArray.
         */
        SparseArray() = default;

        /**
         * @brief Copy constructor for SparseArray.
         * @param other The SparseArray to copy from.
         */
        SparseArray(SparseArray const &other) : _data(other._data) {}

        /**
         * @brief Move constructor for SparseArray.
         * @param other The SparseArray to move from.
         */
        SparseArray(SparseArray &&other) noexcept : _data(std::move(other._data)) {}

        /**
         * @brief Copy assignment operator for SparseArray.
         * @param other The SparseArray to copy from.
         * @return Reference to this SparseArray.
         */
        SparseArray &operator=(SparseArray const &other)
        {
            if (this != &other) {
                _data = other._data;
            }
            return *this;
        }

        /**
         * @brief Move assignment operator for SparseArray.
         * @param other The SparseArray to move from.
         * @return Reference to this SparseArray.
         */
        SparseArray &operator=(SparseArray &&other) noexcept
        {
            if (this != &other) {
                _data = std::move(other._data);
            }
            return *this;
        }

        /**
         * @brief Erase the component at the given index.
         *
         * @param idx The index of the component to erase.
         */
        void erase(const size_type &idx)
        {
            if (idx < _data.size()) {
                _data[idx].reset();
            }
        }

        /**
         * @brief Get an iterator to the beginning of the sparse array.
         * @return An iterator to the beginning of the sparse array.
         */
        iterator begin()
        {
            return _data.begin();
        }

        /**
         * @brief Get a const iterator to the beginning of the sparse array.
         * @return A const iterator to the beginning of the sparse array.
         */
        [[nodiscard]] const_iterator begin() const
        {
            return _data.begin();
        }

        /**
         * @brief Get a const iterator to the beginning of the sparse array.
         * @return A const iterator to the beginning of the sparse array.
         */
        [[nodiscard]] const_iterator cbegin() const
        {
            return _data.cbegin();
        }

        /**
         * @brief Get an iterator to the end of the sparse array.
         * @return An iterator to the end of the sparse array.
         */
        iterator end()
        {
            return _data.end();
        }

        /**
         * @brief Get a const iterator to the end of the sparse array.
         * @return A const iterator to the end of the sparse array.
         */
        [[nodiscard]] const_iterator end() const
        {
            return _data.end();
        }

        /**
         * @brief Get a const iterator to the end of the sparse array.
         * @return A const iterator to the end of the sparse array.
         */
        [[nodiscard]] const_iterator cend() const
        {
            return _data.cend();
        }

        /**
         * @brief Access the component at the given index.
         *
         * If the index is out of bounds, the sparse array is resized to accommodate the index.
         *
         * @param idx The index of the component to access.
         * @return A reference to the optional component at the given index.
         */
        reference_type operator[](size_type idx)
        {
            if (idx >= _data.size()) {
                _data.resize(idx + 1);
            }
            return _data[idx];
        }

        /**
         * @brief Access the component at the given index (const version).
         *
         * If the index is out of bounds, returns a reference to a null optional.
         *
         * @param idx The index of the component to access.
         * @return A const reference to the optional component at the given index.
         */
        const_reference_type operator[](size_type idx) const
        {
            if (idx >= _data.size()) {
                return _opt_null;
            }
            return _data[idx];
        }

        /**
         * @brief Set the component at the given index.
         *
         * @param idx The index of the component to set.
         * @param value The component value to set.
         */
        void set(size_type idx, value_type value)
        {
            (*this)[idx] = std::move(value);
        }

        /**
         * @brief Get the size of the sparse array.
         *
         * @return The size of the sparse array.
         */
        [[nodiscard]] size_type size() const
        {
            return _data.size();
        }

        /**
         * @brief Resize the sparse array to the given size.
         *
         * @param size The new size of the sparse array.
         */
        void resize(size_type size)
        {
            _data.resize(size);
        }

        /**
         * @brief Clear the sparse array.
         */
        void clear()
        {
            _data.clear();
        }

        /**
         * @brief Check if the sparse array is empty.
         *
         * @return True if the sparse array is empty, false otherwise.
         */
        [[nodiscard]] bool empty() const
        {
            return _data.empty() || std::ranges::all_of(_data, [](const auto &v) { return !v.has_value(); });
        }

        /**
         * @brief Insert a component at the given index.
         *
         * If the index is out of bounds, the sparse array is resized to accommodate the index.
         *
         * @param idx The index at which to insert the component.
         * @param value The component value to insert.
         * @return A reference to the inserted optional component.
         */
        reference_type insert_at(size_type idx, const_reference_type value)
        {
            if (idx >= _data.size()) {
                _data.resize(idx + 1);
            }
            _data[idx] = value;
            return _data[idx];
        }

        /**
         * @brief Insert a component at the given index (move version).
         *
         * If the index is out of bounds, the sparse array is resized to accommodate the index.
         *
         * @param idx The index at which to insert the component.
         * @param value The component value to insert.
         * @return A reference to the inserted optional component.
         */
        reference_type insert_at(size_type idx, move_reference_type value)
        {
            if (idx >= _data.size()) {
                _data.resize(idx + 1);
            }
            _data[idx] = std::move(value);
            return _data[idx];
        }

        /**
         * @brief Emplace a component at the given index.
         *
         * If the index is out of bounds, the sparse array is resized to accommodate the index.
         *
         * @tparam Params The types of the parameters to construct the component.
         * @param idx The index at which to emplace the component.
         * @param params The parameters to construct the component.
         * @return A reference to the emplaced optional component.
         */
        template <class... Params>
        reference_type emplace_at(size_type idx, Params &&...params)
        {
            if (idx >= _data.size()) {
                _data.resize(idx + 1);
            }
            _data[idx] = value_type(std::forward<Params>(params)...);
            return _data[idx];
        }

        /**
         * @brief Get the index of the given component value.
         *
         * @param value The component value to find.
         * @return The index of the component value, or size() if not found.
         */
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
