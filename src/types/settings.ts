export interface FontSettings {
  family: string
  default_size: number
  default_color: string
}

export interface RubySettings {
  family: string
  default_size: number
  default_color: string
}

export interface GeneralSettings {
  encoding: string
  language: 'ja' | 'en'
  theme: 'dark' | 'light'
  auto_open_last_file: boolean
  auto_save: boolean
  last_file_path: string | null
}

export interface DisplaySettings {
  mirror: boolean
  resolution_width: number
  resolution_height: number
}

export interface AppSettings {
  font: FontSettings
  ruby: RubySettings
  general: GeneralSettings
  display: DisplaySettings
}

export const defaultSettings: AppSettings = {
  font: {
    family: 'Noto Sans JP',
    default_size: 48,
    default_color: '#FFFFFF',
  },
  ruby: {
    family: 'Noto Sans JP',
    default_size: 24,
    default_color: '#FFFFFF',
  },
  general: {
    encoding: 'UTF-8',
    language: 'ja',
    theme: 'dark',
    auto_open_last_file: false,
    auto_save: false,
    last_file_path: null,
  },
  display: {
    mirror: true,
    resolution_width: 1920,
    resolution_height: 1080,
  },
}
