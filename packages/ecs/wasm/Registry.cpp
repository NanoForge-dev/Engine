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
#include "Utils.hpp"

#include "Registry.hpp"

namespace nfo {
    EMSCRIPTEN_DECLARE_VAL_TYPE(System);

    EMSCRIPTEN_BINDINGS(Registry)
    {
        emscripten::register_type<Component>("{name: string, [key: string]: any}");
        emscripten::register_type<System>("(registry: Registry) => void");

        emscripten::class_<Registry>("Registry")
            .constructor()
            .function("registerComponent", &Registry::register_component)
            .function(
                "getComponentsConst",
                emscripten::select_overload<SparseArray<emscripten::val> const &(const Component &) const, Registry>(&Registry::get_components)
            )
            .function("getComponents", emscripten::select_overload<SparseArray<emscripten::val> &(const Component &), Registry>(&Registry::get_components))
            .function(
                "getEntityComponentConst",
                emscripten::select_overload<std::optional<emscripten::val> const &(Entity, const Component &) const, Registry>(&Registry::get_entity_component)
            )
            .function(
                "getEntityComponent",
                emscripten::select_overload<std::optional<emscripten::val> &(Entity, const Component &), Registry>(&Registry::get_entity_component)
            )
            .function("spawnEntity", &Registry::spawn_entity)
            .function("entityFromIndex", &Registry::entity_from_index)
            .function("killEntity", &Registry::kill_entity)
            .function("clearEntities", &Registry::clear_entities)
            .function(
                "addComponent",
                emscripten::select_overload<SparseArray<emscripten::val>::reference_type &(const Entity &, Component &&), Registry>(&Registry::add_component)
            )
            .function("removeComponent", emscripten::select_overload<void(const Entity &, Component &&), Registry>(&Registry::remove_component))
            .function("addSystem", emscripten::select_overload<void(System &&), Registry>(&Registry::add_system))
            .function("runSystems", &Registry::run_systems)
            .function("removeSystem", &Registry::remove_system)
            .function("clearSystems", &Registry::clear_systems)
            .function("getZipper", &Registry::get_zipper)
            .function("getIndexedZipper", &Registry::get_indexed_zipper)
            .function("maxEntities", &Registry::max_entities);
    }
} // namespace nfo
