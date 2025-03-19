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

#include <emscripten/val.h>
#include <map>

#include "SparseArray.hpp"
#include "Utils.hpp"

namespace nfo {
    class IndexedZipper {
      public:
        explicit IndexedZipper(const std::map<std::string, SparseArray<emscripten::val> *> &arrays) : _arrays(arrays), _max(0), _idx(0)
        {
            _max = arrays.empty() ? 0 : arrays.begin()->second->size();
            for (SparseArray<emscripten::val> *&arr : _arrays | std::views::values) {
                _max = (std::min)(arr->size(), _max);
            }
            if (_idx < _max && !all_set())
                incr();
        }

        [[nodiscard]] emscripten::val get_value() const
        {
            if (_idx >= _max)
                return emscripten::val::undefined();

            emscripten::val res = emscripten::val::object();
            for (SparseArray<emscripten::val> *const &arr : _arrays | std::views::values) {
                res.set(get_js_class_name((*arr)[_idx].value()), (*arr)[_idx].value_or(emscripten::val::undefined()));
            }
            res.set("entity", _idx);
            return res;
        }

        emscripten::val next()
        {
            incr();
            return get_value();
        }

      private:
        void incr()
        {
            if (_idx >= _max)
                return;
            do {
                _idx++;
            } while (_idx < _max && !all_set());
        }

        [[nodiscard]] bool all_set() const
        {
            if (_idx >= _max)
                return false;

            return std::ranges::all_of(_arrays | std::views::values, [this](SparseArray<emscripten::val> *const &arr) { return (*arr)[_idx].has_value(); });
        }

        std::map<std::string, SparseArray<emscripten::val> *> _arrays;
        std::size_t _max;
        std::size_t _idx;
    };
} // namespace nfo
