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

#include "IndexedZipper.hpp"

namespace nfo {
    EMSCRIPTEN_BINDINGS(IndexedZipper)
    {
        emscripten::class_<IndexedZipper>("IndexedZipper")
            .constructor<const std::map<std::string, SparseArray<emscripten::val> *> &>()
            .function("next", &IndexedZipper::next)
            .function("getValue", &IndexedZipper::get_value);
    }
} // namespace nfo
