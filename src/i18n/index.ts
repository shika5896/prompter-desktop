import { createMemo } from 'solid-js'
import { ja } from './ja'
import { en } from './en'
import settingsStore from '../stores/settingsStore'

export type TranslationKey = keyof typeof ja

const dictionaries = { ja, en } as const

export function useI18n() {
  const t = createMemo(() => {
    const lang = settingsStore.settings.general.language
    return dictionaries[lang] ?? dictionaries.ja
  })

  return (key: TranslationKey) => t()[key]
}
