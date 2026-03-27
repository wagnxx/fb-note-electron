/* eslint-disable no-undef */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import HttpBackend from 'i18next-http-backend'
import store from '@/store/store'

const publicBase =
  process.env.PUBLIC_URL && process.env.PUBLIC_URL !== '' ? process.env.PUBLIC_URL.replace(/\/$/, '') : ''

const loadPath = `${publicBase}/i18n/{{lng}}.json`.replace(/\/\/+/g, '/')

i18n
  .use(HttpBackend) // 用于加载语言文件
  .use(LanguageDetector) // 自动检测用户语言
  .use(initReactI18next) // 初始化 React 插件
  .init({
    fallbackLng: 'en', // 默认语言
    debug: true, // 开发模式下启用 debug
    interpolation: {
      escapeValue: false, // 避免 XSS 攻击
    },
    backend: {
      loadPath, // 语言文件路径
    },
  })
// 监听 Redux 的语言状态变化
store.subscribe(() => {
  const state = store.getState()
  const currentLanguage = state.language.lang
  if (i18n.language !== currentLanguage) {
    i18n.changeLanguage(currentLanguage)
  }
})
export default i18n
