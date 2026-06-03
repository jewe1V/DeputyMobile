module.exports = function(api) {
  api.cache(true);
  return {
      presets: [
          ['babel-preset-expo', {
              unstable_transformImportMeta: true
          }]
      ],
    plugins: [
        ['@babel/plugin-transform-export-namespace-from'],
        ['react-native-reanimated/plugin'],
        // Добавляем плагин для обработки import.meta
        ['@babel/plugin-syntax-import-meta']
    ],
  };
};
