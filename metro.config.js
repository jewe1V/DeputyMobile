const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Добавляем поддержку .mjs файлов и расширений
config.resolver.sourceExts.push('mjs');

// Настраиваем Metro на использование CJS версий библиотек, если ESM вызывает проблемы
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
