import pluginJs from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginJest from "eslint-plugin-jest";
import globals from "globals";
import tseslint from "typescript-eslint";

const eslintConfig = [
  { files: ["src/**/*.{ts}"] },
  { languageOptions: { globals: globals.node } },

  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.strict,
  eslintConfigPrettier,
  { ignores: ["**/*.js", "**/*.d.ts"] },
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          disallowTypeAnnotations: true,
          fixStyle: "inline-type-imports",
          prefer: "type-imports",
        },
      ],
      "@typescript-eslint/no-extraneous-class": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/member-ordering": [
        "error",
        {
          default: [
            "static-field",
            "field",
            "public-static-method",
            "constructor",
            "method",
            "protected-method",
            "private-method",
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.spec.ts"],
    plugins: { jest: pluginJest },
    languageOptions: {
      globals: pluginJest.environments.globals.globals,
    },
    rules: {
      "jest/no-disabled-tests": "warn",
      "jest/no-focused-tests": "error",
      "jest/no-identical-title": "error",
      "jest/prefer-to-have-length": "warn",
      "jest/valid-expect": "error",
    },
  },
];

export default eslintConfig;
