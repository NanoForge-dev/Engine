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

#include "Registry.hpp"

namespace nfo {
    EMSCRIPTEN_BINDINGS(Registry)
    {
        emscripten::class_<Registry>("Registry")
            .constructor()
            .function("register_component", &Registry::register_component)
            .function(
                "get_components_const",
                emscripten::select_overload<SparseArray<emscripten::val> const &(const emscripten::val &) const, Registry>(&Registry::get_components)
            )
            .function("get_components", emscripten::select_overload<SparseArray<emscripten::val> &(const emscripten::val &), Registry>(&Registry::get_components))
            .function(
                "get_entity_component_const",
                emscripten::select_overload<std::optional<emscripten::val> const &(Entity, const emscripten::val &) const, Registry>(&Registry::get_entity_component)
            )
            .function(
                "get_entity_component",
                emscripten::select_overload<std::optional<emscripten::val> &(Entity, const emscripten::val &), Registry>(&Registry::get_entity_component)
            )
            .function("spawn_entity", &Registry::spawn_entity)
            .function("entity_from_index", &Registry::entity_from_index)
            .function("kill_entity", &Registry::kill_entity)
            .function("clear_entities", &Registry::clear_entities)
            .function(
                "add_component",
                emscripten::select_overload<
                    SparseArray<emscripten::val>::reference_type &(const Entity &, emscripten::val &&),
                    Registry>(&Registry::add_component)
            )
            .function("remove_component", emscripten::select_overload<void(const Entity &, emscripten::val &&), Registry>(&Registry::remove_component))
            .function("add_system", emscripten::select_overload<void(emscripten::val &&), Registry>(&Registry::add_system))
            .function("remove_system", &Registry::remove_system)
            .function("clear_systems", &Registry::clear_systems)
            .function("max_entities", &Registry::max_entities);
    }
} // namespace nfo
