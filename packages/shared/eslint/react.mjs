import react from "eslint-plugin-react";

export default [
  {
    files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
    plugins: { react },
    rules: {
      "react/boolean-prop-naming": ["error", {"propTypeNames": ["bool", "mutuallyExclusiveTrueProps"]}],
      "react/button-has-type": ["warn", {"button": true, "submit": true, "reset": true}],
      "react/checked-requires-onchange-or-readonly": ["warn", { "ignoreMissingProperties": false, "ignoreExclusiveCheckedAttribute": false}],
      "react/hook-use-state": ["warn", { "allowDestructuredState": false }],
      "react/no-array-index-key": "warn",
      "react/no-danger-with-children": "error",
      "react/no-danger": "error",
      "react/no-deprecated": "warn",
      "react/no-children-prop": "warn",
      "react/no-render-return-value": "warn",
      "react/no-string-refs": "warn",
      "react/no-unescaped-entities": "warn",
      "react/no-unknown-property": "error",
      "react/no-unsafe": "warn",
      "react/no-unused-prop-types": "warn",
      "react/no-unused-state": "error",
      "react/prefer-exact-props": "warn",
      "react/self-closing-comp": "warn",
      "react/sort-comp": "warn",
      "react/sort-prop-types": "warn",
      "react/sort-default-props": "warn",
    }
  },
];