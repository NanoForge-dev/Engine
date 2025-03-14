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

#include <emscripten/bind.h>
#include <emscripten/val.h>

#include "SparseArray.hpp"

namespace nfo {
    EMSCRIPTEN_BINDINGS(SparseArray)
    {
        emscripten::register_optional<emscripten::val>();
        emscripten::register_vector<std::optional<emscripten::val>>("container");

        emscripten::class_<SparseArray<emscripten::val>>("SparseArray")
            .constructor<>()
            .function("erase", &SparseArray<emscripten::val>::erase)
            .function("size", &SparseArray<emscripten::val>::size)
            .function(
                "get_index",
                emscripten::select_overload<SparseArray<emscripten::val>::size_type(SparseArray<emscripten::val>::const_reference_type) const>(
                    &SparseArray<emscripten::val>::get_index
                )
            )
            .function(
                "get_const",
                emscripten::select_overload<SparseArray<emscripten::val>::const_reference_type(SparseArray<emscripten::val>::size_type) const>(
                    &SparseArray<emscripten::val>::operator[]
                )
            )
            .function(
                "get",
                emscripten::select_overload<SparseArray<emscripten::val>::reference_type(SparseArray<emscripten::val>::size_type)>(
                    &SparseArray<emscripten::val>::operator[]
                )
            )
            .function(
                "insert_at",
                emscripten::select_overload<
                    SparseArray<emscripten::val>::reference_type(SparseArray<emscripten::val>::size_type, SparseArray<emscripten::val>::const_reference_type)>(
                    &SparseArray<emscripten::val>::insert_at
                )
            )
            .function(
                "insert_at",
                emscripten::select_overload<
                    SparseArray<emscripten::val>::reference_type(SparseArray<emscripten::val>::size_type, SparseArray<emscripten::val>::value_type &&)>(
                    &SparseArray<emscripten::val>::insert_at
                )
            )
            .function("clear", &SparseArray<emscripten::val>::clear)
            .function("empty", &SparseArray<emscripten::val>::empty)
            .function("resize", &SparseArray<emscripten::val>::resize)
            .function("set", &SparseArray<emscripten::val>::set)
            .function("setByCopy", emscripten::select_overload<SparseArray<emscripten::val> &(SparseArray<emscripten::val> const &)>(&SparseArray<emscripten::val>::operator=))
            .function("setByMove", emscripten::select_overload<SparseArray<emscripten::val> &(SparseArray<emscripten::val> &&)>(&SparseArray<emscripten::val>::operator=));
    }
} // namespace nfo
