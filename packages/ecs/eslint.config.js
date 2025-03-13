import pluginJs from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals, { jest } from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    files: ["src/**/*.{ts}", "tests/**/*"],
    env: {jest: true},
  },
  { languageOptions: { globals: globals.node } },


  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.strict,
  eslintConfigPrettier,
  { ignores: ['**/*.js'] },
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
];
