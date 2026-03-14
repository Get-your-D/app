import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import nextAppConfig from "../shared/eslint/next-app.mjs";

export default nextAppConfig(import.meta.dirname, [...nextVitals, ...nextTs]);
