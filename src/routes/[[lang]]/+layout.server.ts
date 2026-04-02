import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ params, request, url }) => {
    const lang = params.lang;
    const supportedLangs = ['en', 'ko'];
    
    // Redirect if lang is missing or not supported
    if (!lang || !supportedLangs.includes(lang)) {
        const acceptLanguage = request.headers.get('accept-language') || 'en';
        let defaultLang = 'en';
        if (acceptLanguage.includes('ko')) {
            defaultLang = 'ko';
        }
        
        // Exclude paths that might be assets just in case, but basic ones are ignored by sveltekit layout anyway
        let targetPath = url.pathname.replace(/^\/[^/]+/, `/${defaultLang}`);
        if (!lang) {
            targetPath = `/${defaultLang}${url.pathname === '/' ? '' : url.pathname}`;
        }
        throw redirect(302, targetPath);
    }
    
    return {
        lang
    };
};
