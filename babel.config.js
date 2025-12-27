module.exports = function (api) {
  api.cache(true);

  const isTest = process.env.NODE_ENV === 'test';

  const plugins = [
    // Transform import.meta to process.env for web compatibility
    // This fixes issues with zustand and other packages that use import.meta.env
    [
      'babel-plugin-transform-import-meta',
      {
        // Replace import.meta.env with process.env
        replaceImportMetaEnv: true,
      },
    ],
    [
      '@tamagui/babel-plugin',
      {
        components: ['tamagui'],
        config: './tamagui.config.ts',
      },
    ],
  ];

  // Only include reanimated plugin in non-test environments
  if (!isTest) {
    plugins.push('react-native-reanimated/plugin');
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
    // Transform specific node_modules that use import.meta
    overrides: [
      {
        test: /node_modules\/(zustand|@redux-devtools)/,
        plugins: ['babel-plugin-transform-import-meta'],
      },
    ],
  };
};
