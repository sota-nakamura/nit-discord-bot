const { defineConfig } = require("eslint/config");
const stylistic = require("@stylistic/eslint-plugin");

module.exports = defineConfig([
    {
        plugins: {
            "@stylistic": stylistic,
        },
        rules: {
            semi: "error",
            "prefer-const": "error",
            "@stylistic/semi": ["error", "always"],
            "@stylistic/quotes": ["error", "double"],
            "@stylistic/indent": ["error", 4, { SwitchCase: 1 }],
        },
    },
]);
