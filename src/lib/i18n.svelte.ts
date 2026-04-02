import { en } from './locales/en';
import { ko } from './locales/ko';
import { zhtw } from './locales/zh-tw';
import { ja } from './locales/ja';

export type SupportedLangs = 'en' | 'ko' | 'zh-tw' | 'ja';

const dictionaries: Record<SupportedLangs, Record<string, string>> = {
    'en': en,
    'ko': ko,
    'zh-tw': zhtw,
    'ja': ja,
};

export const languageMetadata: Record<SupportedLangs, { char: string, name: string }> = {
    'en': { char: 'A', name: 'English (EN)' },
    'ko': { char: '가', name: '한국어 (KO)' },
    'zh-tw': { char: '繁', name: '繁體中文 (ZH-TW)' },
    'ja': { char: '日', name: '日本語 (JA)' },
};

export const supportedLangsList = Object.keys(dictionaries) as SupportedLangs[];

export const i18nState = $state({
    locale: 'en' as SupportedLangs,
    t: (key: keyof typeof en): string => {
        const dict = dictionaries[i18nState.locale] || dictionaries['en'];
        return dict[key as string] || (key as string);
    }
});
