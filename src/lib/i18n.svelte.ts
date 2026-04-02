import { en } from './locales/en';
import { ko } from './locales/ko';

type Locale = keyof typeof en;
type SupportedLangs = 'en' | 'ko';

export const i18nState = $state({
    locale: 'en' as SupportedLangs,
    t: (key: Locale): string => {
        const dict = i18nState.locale === 'ko' ? ko : en;
        return dict[key] || key;
    }
});
