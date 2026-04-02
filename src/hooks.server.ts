import { supportedLangsList } from '$lib/i18n.svelte';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    let lang = 'en';
    const [, pathLang] = event.url.pathname.split('/');

    if (supportedLangsList.includes(pathLang as any)) {
        lang = pathLang;
    }

    return resolve(event, {
        transformPageChunk: ({ html }) => html.replace('%lang%', lang)
    });
};
