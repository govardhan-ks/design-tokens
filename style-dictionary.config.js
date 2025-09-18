const StyleDictionary = require("style-dictionary");

/**
 * Custom transform group for CSS with external token support
 */
StyleDictionary.registerTransformGroup({
  name: 'css-with-externals',
  transforms: [
    'attribute/cti',
    'name/cti/kebab',
    'time/seconds',
    'content/icon',
    'size/rem',
    'color/css'
  ]
});

/**
 * Custom transform group for JS with external token support
 */
StyleDictionary.registerTransformGroup({
  name: 'js-with-externals',
  transforms: [
    'attribute/cti',
    'name/cti/camel',
    'size/rem',
    'color/hex'
  ]
});

/**
 * Helper to format value with external token fallback support
 */
function formatValueWithFallback(prop, dictionary) {
  // Check if token has external property for fallback chain
  if (prop.original.external) {
    const externalVar = prop.original.external.replace(/\./g, "-");
    const finalFallback = prop.value; // Use the resolved internal token value
    
    // Get the referenced internal token name for middle fallback
    if (typeof prop.original.value === "string" && prop.original.value.startsWith("{")) {
      const referencedToken = prop.original.value.replace(/[{}]/g, "").replace(/\./g, "-");
      return `var(--${externalVar}, var(--${referencedToken}, ${finalFallback}))`;
    }
    
    return `var(--${externalVar}, ${finalFallback})`;
  }

  // Handle single reference values with fallbacks
  if (typeof prop.original.value === "string" && prop.original.value.startsWith("{")) {
    const refs = dictionary.getReferences(prop.original.value);
    if (refs.length > 0) {
      return `var(--${refs[0].name}, ${refs[0].value})`;
    }
  }

  // Return literal value
  return prop.value;
}

/**
 * CSS Format with external token fallbacks
 */
StyleDictionary.registerFormat({
  name: "css/variables-with-fallback",
  formatter: ({ dictionary }) => {
    return `:root {\n${dictionary.allProperties
      .map(
        (prop) =>
          `  --${prop.name}: ${formatValueWithFallback(prop, dictionary)};`
      )
      .join("\n")}\n}`;
  },
});

/**
 * JS Format with external token fallbacks
 */
StyleDictionary.registerFormat({
  name: "javascript/es6-with-fallback",
  formatter: ({ dictionary }) => {
    return `export default {\n${dictionary.allProperties
      .map(
        (prop) =>
          `  "${prop.name}": "${formatValueWithFallback(prop, dictionary)}"`
      )
      .join(",\n")}\n};`;
  },
});

module.exports = {
  source: ["src/tokens/**/*.json"],
  platforms: {
    css: {
      transformGroup: "css-with-externals",
      buildPath: "build/css/",
      files: [
        {
          destination: "tokens.css",
          format: "css/variables-with-fallback",
        },
      ],
    },
    js: {
      transformGroup: "js-with-externals",
      buildPath: "build/js/",
      files: [
        {
          destination: "tokens.js",
          format: "javascript/es6-with-fallback",
        },
      ],
    },
  },
};