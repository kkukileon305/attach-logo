import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { supportedLangsList } from '$lib/i18n.svelte';

export const load: LayoutServerLoad = ({ params, request, url }) => {
    const lang = params.lang;
    
    // Redirect if lang is missing or not supported
    if (!lang || !supportedLangsList.includes(lang as any)) {
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
