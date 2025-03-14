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

#include "Utils.hpp"

#include <iostream>

std::optional<std::string> json_to_str(const emscripten::val &c)
{
    if (!c.isString())
        return std::nullopt;
    return c.as<std::string>();
}

std::optional<emscripten::val> get_js_member(const emscripten::val &c, const std::string &member)
{
    if (c.isUndefined() || c.isNull())
        return std::nullopt;
    return c[member];
}

std::string get_js_class_name(const emscripten::val &c)
{
    return get_js_class_type_name(c).value_or(get_js_class_var_name(c).value_or(UNKNOWN_COMPONENT_TYPE));
}

std::optional<std::string> get_js_class_type_name(const emscripten::val &c)
{
    const std::optional<emscripten::val> name = get_js_member(c, "name");
    if (name.has_value()) {
        return json_to_str(name.value());
    }
    return std::nullopt;
}

std::optional<std::string> get_js_class_var_name(const emscripten::val &c)
{
    const std::optional<emscripten::val> constructor = get_js_member(c, "constructor");
    if (constructor.has_value()) {
        const std::optional<emscripten::val> name = get_js_member(constructor.value(), "name");
        if (name.has_value()) {
            return json_to_str(name.value());
        }
    }
    return std::nullopt;
}
