// next-i18next.config.js
module.exports = {
  i18n: {
    locales: ['ja', 'ko'],
    defaultLocale: 'ja',
    localeDetection: false,
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development',
}
