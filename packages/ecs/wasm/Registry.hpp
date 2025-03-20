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
#include <ranges>
#include <stdexcept>
#include <unordered_map>

#include "Entity.hpp"
#include "SparseArray.hpp"
#include "Utils.hpp"

namespace nfo {
    class Registry {
      public:
        SparseArray<emscripten::val> &register_component(const Component &c)
        {
            std::string component_type(get_js_class_name(c));
            if (component_type == "entity" || component_type == "id")
                throw std::runtime_error("Component type '" + component_type + "' not supported : you can't use : id, entity, " + UNKNOWN_COMPONENT_TYPE);
            if (!_components_arrays.contains(component_type))
                _components_arrays.emplace(component_type, SparseArray<emscripten::val>());
            if (!_remove_functions.contains(component_type)) {
                _remove_functions.emplace(component_type, [c](Registry &reg, Entity const &ent) {
                    SparseArray<emscripten::val> &array = reg.get_components(c);
                    array.erase(ent);
                });
            }
            // TODO: rework logger
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

        SparseArray<emscripten::val> &get_components(const Component &c)
        {
            const std::string component_type(get_js_class_name(c));
            if (!_components_arrays.contains(component_type))
                register_component(c);
            std::any &components = _components_arrays[component_type];
            return std::any_cast<SparseArray<emscripten::val> &>(components);
        }

        [[nodiscard]] SparseArray<emscripten::val> const &get_components(const Component &c) const
        {
            const std::string component_type(get_js_class_name(c));
            if (!_components_arrays.contains(component_type))
                throw std::runtime_error(component_type + " array not registered");
            const std::any &components = _components_arrays.find(component_type)->second;
            return std::any_cast<const SparseArray<emscripten::val> &>(components);
        }

        std::optional<emscripten::val> &get_entity_component(const Entity e, const Component &c)
        {
            const std::string component_type(get_js_class_name(c));
            if (!_components_arrays.contains(component_type))
                register_component(c);
            std::any &components = _components_arrays[component_type];
            return std::any_cast<SparseArray<emscripten::val> &>(components)[e];
        }

        [[nodiscard]] std::optional<emscripten::val> const &get_entity_component(const Entity e, const Component &c) const
        {
            const std::string component_type(get_js_class_name(c));
            if (!_components_arrays.contains(component_type))
                throw std::runtime_error(component_type + " array not registered");
            const std::any &components = _components_arrays.find(component_type)->second;
            return std::any_cast<const SparseArray<emscripten::val> &>(components)[e];
        }

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

        Entity entity_from_index(const std::size_t component_type)
        {
            if (std::ranges::find(_dead_entities, component_type) != _dead_entities.end() || component_type >= _next_entity)
                throw std::runtime_error("Entity index out of range.");
            return Entity(component_type);
        }

        void kill_entity(Entity const &e)
        {
            _dead_entities.push_back(e);
            for (const std::function<void(Registry &, const Entity &)> &remove_function : std::views::values(_remove_functions))
                remove_function(*this, e);
        }

        void clear_entities()
        {
            _next_entity = 0;
            _remove_functions.clear();
            _dead_entities.clear();
            _loggers.clear();
            _components_arrays.clear();
        }

        SparseArray<emscripten::val>::reference_type add_component(Entity const &to, Component &&c)
        {
            const std::string component_type(get_js_class_name(c));
            if (!_components_arrays.contains(component_type)) {
                register_component(c);
            }
            return get_components(c).insert_at(to, c);
        }

        void remove_component(Entity const &from, Component &&c)
        {
            const std::string component_type(get_js_class_name(c));
            if (!_components_arrays.contains(component_type))
                register_component(c);
            if (_remove_functions.contains(component_type))
                _remove_functions[component_type](*this, from);
        }

        template <typename Function>
        void add_system(Function &&f)
        {
            _systems.emplace_back(std::forward<Function>(f));
        }

        void remove_system(const std::size_t system_idx)
        {
            if (system_idx >= _systems.size())
                return;
            _systems.erase(_systems.begin() + static_cast<long>(system_idx));
        }

        void clear_systems()
        {
            _systems.clear();
        }

        void run_systems()
        {
            std::vector<std::function<void(Registry &)>> systems_copy = _systems;
            for (std::function<void(Registry &)> &system : systems_copy)
                system(*this);
        }

        void log(const Entity &entity) const
        {
            for (const auto &logger : std::views::values(_loggers)) {
                if (logger(*this, entity))
                    std::cout << ", ";
            }
        }

        [[nodiscard]] std::size_t max_entities() const
        {
            return _next_entity;
        }

        emscripten::val get_zipper(const emscripten::val &comps)
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
                    arr.set(idx, obj);
            }
            return arr;
        }

      private:
        std::unordered_map<std::string, std::any> _components_arrays;

        std::unordered_map<std::string, std::function<void(Registry &, Entity const &)>> _remove_functions;
        std::unordered_map<std::string, std::function<bool(const Registry &, const Entity &)>> _loggers;
        std::vector<std::function<void(Registry &)>> _systems;

        std::vector<Entity> _dead_entities;
        std::size_t _next_entity{0};
    };
} // namespace nfo
