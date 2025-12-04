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

#include <any>
#include <functional>
#include <iostream>
#include <map>
#include <ranges>
#include <stdexcept>
#include <unordered_map>

#include "Entity.hpp"
#include "SparseArray.hpp"
#include "Utils.hpp"

namespace nfo {
    /**
    ** @brief The main registry class for managing entities and components.
    **
    ** This class provides methods to register components, manage entities,
    ** add and remove components from entities, and run systems.
    */
    class Registry {
      public:
        /**
         * Register a component type in the registry.
         *
         * @param conponent An instance of the component to register.
         * @return A reference to the SparseArray that will hold all components of this type.
         * @throws std::runtime_error if the component type is "entity", "id",
         *         or UNKNOWN_COMPONENT_TYPE.
         */
        SparseArray<emscripten::val> &register_component(const Component &component)
        {
            std::string component_type(get_js_class_name(component));
            if (component_type == "entity" || component_type == "id")
                throw std::runtime_error("Component type '" + component_type + "' not supported : you can't use : id, entity, " + UNKNOWN_COMPONENT_TYPE);
            if (!_components_arrays.contains(component_type))
                _components_arrays.emplace(component_type, SparseArray<emscripten::val>());
            if (!_remove_functions.contains(component_type)) {
                _remove_functions.emplace(component_type, [component](Registry &reg, Entity const &ent) {
                    SparseArray<emscripten::val> &array = reg.get_components(component);
                    array.erase(ent);
                });
            }
            // TODO: rework logger https://github.com/NanoForge-dev/Engine/issues/104
            // if (!_loggers.contains(component_type)) {
            //     _loggers.emplace(component_type, [](Registry const &reg, Entity const &ent) {
            //         const auto &array = reg.get_components<emscripten::val>();
            //         const std::optional<emscripten::val> &comp = array[ent];
            //         if (comp.has_value())
            //             comp.value().log();
            //         return comp.has_value();
            //     });
            // }
            return std::any_cast<SparseArray<emscripten::val> &>(_components_arrays[component_type]);
        }

        /**
         * Get the SparseArray of a given component type.
         *
         * @param component An instance of the component type to get.
         * @return A reference to the SparseArray holding all components of this type.
         * @throws std::runtime_error if the component type is not registered.
         */
        SparseArray<emscripten::val> &get_components(const Component &component)
        {
            const std::string component_type(get_js_class_name(component));
            if (!_components_arrays.contains(component_type))
                register_component(component);
            std::any &components = _components_arrays[component_type];
            return std::any_cast<SparseArray<emscripten::val> &>(components);
        }

        /**
         * Get the SparseArray of a given component type (const version).
         *
         * @param component An instance of the component type to get.
         * @return A const reference to the SparseArray holding all components of this type.
         * @throws std::runtime_error if the component type is not registered.
         */
        [[nodiscard]] SparseArray<emscripten::val> const &get_components(const Component &component) const
        {
            const std::string component_type(get_js_class_name(component));
            if (!_components_arrays.contains(component_type))
                throw std::runtime_error(component_type + " array not registered");
            const std::any &components = _components_arrays.find(component_type)->second;
            return std::any_cast<const SparseArray<emscripten::val> &>(components);
        }

        /**
         * Get the component of a given entity.
         *
         * @param entity The entity to get the component from.
         * @param component An instance of the component type to get.
         * @return A reference to an optional containing the component if it exists, or std::nullopt otherwise.
         * @throws std::runtime_error if the component type is not registered.
         */
        std::optional<emscripten::val> &get_entity_component(const Entity entity, const Component &component)
        {
            const std::string component_type(get_js_class_name(component));
            if (!_components_arrays.contains(component_type))
                register_component(component);
            std::any &components = _components_arrays[component_type];
            return std::any_cast<SparseArray<emscripten::val> &>(components)[entity];
        }

        /**
         * Get the component of a given entity (const version).
         *
         * @param entity The entity to get the component from.
         * @param component An instance of the component type to get.
         * @return A const reference to an optional containing the component if it exists, or std::nullopt otherwise.
         * @throws std::runtime_error if the component type is not registered.
         */
        [[nodiscard]] std::optional<emscripten::val> const &get_entity_component(const Entity entity, const Component &component) const
        {
            const std::string component_type(get_js_class_name(component));
            if (!_components_arrays.contains(component_type))
                throw std::runtime_error(component_type + " array not registered");
            const std::any &components = _components_arrays.find(component_type)->second;
            return std::any_cast<const SparseArray<emscripten::val> &>(components)[entity];
        }

        /**
         * Spawn a new entity.
         *
         * @return The newly spawned entity.
         */
        [[nodiscard]] Entity spawn_entity()
        {
            if (!_dead_entities.empty()) {
                const Entity entity = _dead_entities.back();
                _dead_entities.pop_back();
                return entity;
            }
            _next_entity += 1;
            return Entity(_next_entity - 1);
        }

        /**
         * Get an entity from its index.
         *
         * @param entity_id The index of the entity.
         * @return The entity corresponding to the given index.
         * @throws std::runtime_error if the index is out of range.
         */
        Entity entity_from_index(const std::size_t entity_id)
        {
            if (std::ranges::find(_dead_entities, id) != _dead_entities.end() || id >= _next_entity)
                throw std::runtime_error("Entity index out of range.");
            return Entity(id);
        }

        /**
         * Kill an entity, marking it for removal.
         *
         * @param entity The entity to kill.
         */
        void kill_entity(Entity const &entity)
        {
            _dead_entities.push_back(entity);
            for (const std::function<void(Registry &, const Entity &)> &remove_function : std::views::values(_remove_functions))
                remove_function(*this, entity);
        }

        /**
         * Clear all entities and reset the registry.
         */
        void clear_entities()
        {
            _next_entity = 0;
            _remove_functions.clear();
            _dead_entities.clear();
            _loggers.clear();
            _components_arrays.clear();
        }

        /**
         * Add a component to an entity.
         *
         * @param entity The entity to add the component to.
         * @param component The component to add.
         * @return A reference to the added component.
         */
        SparseArray<emscripten::val>::reference_type add_component(Entity const &entity, Component &&component)
        {
            const std::string component_type(get_js_class_name(component));
            if (!_components_arrays.contains(component_type)) {
                register_component(component);
            }
            return get_components(component).insert_at(entity, component);
        }

        /**
         * Remove a component from an entity.
         *
         * @param entity The entity to remove the component from.
         * @param component The component to remove.
         */
        void remove_component(Entity const &entity, Component &&component)
        {
            const std::string component_type(get_js_class_name(component));
            if (!_components_arrays.contains(component_type))
                register_component(component);
            if (_remove_functions.contains(component_type))
                _remove_functions[component_type](*this, entity);
        }

        /**
         * Add a system to the registry.
         *
         * @param f The system function to add.
         */
        template <typename Function>
        void add_system(Function &&f)
        {
            _systems.emplace_back(emscripten::val(std::forward<Function>(f)));
        }

        /**
         * Remove a system from the registry by its index.
         *
         * @param system_idx The index of the system to remove.
         */
        void remove_system(const std::size_t system_idx)
        {
            if (system_idx >= _systems.size())
                return;
            _systems.erase(_systems.begin() + static_cast<long>(system_idx));
        }

        /**
         * Clear all systems from the registry.
         */
        void clear_systems()
        {
            _systems.clear();
        }

        /**
         * Run all systems with the given context.
         *
         * @param ctx The context to pass to each system.
         */
        void run_systems(const emscripten::val &ctx)
        {
            emscripten::val registry = ctx["libs"].call<emscripten::val>("getComponentSystem")["registry"];
            std::vector<emscripten::val> systems_copy = _systems;
            for (emscripten::val &system : systems_copy)
                system(registry, ctx);
        }

        /**
         * Log information about an entity. (Costly operation as logging in JS is not memory safe)
         *
         * @param entity The entity to log information about.
         */
        void log(const Entity &entity) const
        {
            for (const auto &logger : std::views::values(_loggers)) {
                if (logger(*this, entity))
                    std::cout << ", ";
            }
        }

        /**
         * Get the maximum number of entities that have been spawned.
         *
         * @return The maximum number of entities.
         */
        [[nodiscard]] std::size_t max_entities() const
        {
            return _next_entity;
        }

        /**
         * Get the zipper output for the given components.
         *
         * @param comps An array of component types to zip.
         * @return A ZipperOutput containing the zipped components.
         * @throws std::runtime_error if the input is not an array.
         */
        ZipperOutput get_zipper(const ZipperInput &comps)
        {
            if (!comps.isArray())
                throw std::runtime_error("getZipper: need an array of comps as parameter");

            std::size_t max = SIZE_MAX;
            std::map<std::string, SparseArray<emscripten::val> *> arrays;
            for (int i = 0; i < comps["length"].as<unsigned int>(); i++) {
                SparseArray<emscripten::val> &components = get_components(Component(comps[i]));
                arrays[get_js_class_name(comps[i])] = &components;
                max = (std::min)(components.size(), max);
            }

            emscripten::val arr = emscripten::val::array();
            std:size_t zipper_idx = 0;
            for (std::size_t idx = 0; idx < max; idx++) {
                emscripten::val obj = emscripten::val::object();
                bool need_to_add = true;
                for (const auto &[name, sparse_array] : arrays) {
                    if (!(*sparse_array)[idx].has_value()) {
                        need_to_add = false;
                        break;
                    }
                    obj.set(name, (*sparse_array)[idx].value());
                }
                if (need_to_add)
                    arr.set(zipper_idx++, obj);
            }
            return ZipperOutput(arr);
        }

      private:
        std::unordered_map<std::string, std::any> _components_arrays;

        std::unordered_map<std::string, std::function<void(Registry &, Entity const &)>> _remove_functions;
        std::unordered_map<std::string, std::function<bool(const Registry &, const Entity &)>> _loggers;
        std::vector<emscripten::val> _systems;

        std::vector<Entity> _dead_entities;
        std::size_t _next_entity{0};
    };
} // namespace nfo
