// next-i18next.config.js
module.exports = {
  i18n: {
    locales: ['ko', 'ja'],
    defaultLocale: 'ja',
    localeDetection: true,
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development',
}
