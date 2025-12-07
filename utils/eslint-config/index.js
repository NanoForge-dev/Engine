import pluginJs from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
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
];

export default eslintConfig;
