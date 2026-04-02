import { redirect, error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { supportedLangsList } from '$lib/i18n.svelte';

export const load: LayoutServerLoad = ({ params, request, url }) => {
    const lang = params.lang;

    // 1. 언어 파라미터가 명시되었지만 지원하지 않는 언어인 경우 (예: /fr, /abc)
    // 리다이렉트하지 않고 404 Not Found를 던져 구글봇이 잘못된 URL을 색인하는 것을 방지합니다.
    if (lang && !supportedLangsList.includes(lang as any)) {
        error(404, 'Not found');
    }

    // 2. 언어 파라미터가 없는 루트 경로 (예: /) 접속 시
    // 사용자의 브라우저 언어(Accept-Language)를 감지하여 적절한 언어 경로로 302 리다이렉트
    if (!lang) {
        const acceptLanguage = request.headers.get('accept-language') || 'en';
        let defaultLang = 'en';

        const userLangs = acceptLanguage.split(',').map(s => s.split(';')[0].trim().toLowerCase());

        for (const userLang of userLangs) {
            const match = supportedLangsList.find(supported =>
                userLang === supported.toLowerCase() || userLang.startsWith(supported.split('-')[0].toLowerCase())
            );
            if (match) {
                defaultLang = match;
                break;
            }
        }

        const targetPath = `/${defaultLang}${url.pathname === '/' ? '' : url.pathname}`;
        throw redirect(302, targetPath);
    }

    return {
        lang
    };
};