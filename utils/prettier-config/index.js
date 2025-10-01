const prettierConfig = {
  plugins: ["@trivago/prettier-plugin-sort-imports"],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderParserPlugins: ["typescript", "decorators-legacy"],
  importOrder: ["^~/(.*)$", "^[./]"],
  useTabs: false,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
};

export default prettierConfig;
