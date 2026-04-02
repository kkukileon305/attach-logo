<script lang="ts">
	import '../../app.css';
	import { pwaInfo } from 'virtual:pwa-info';
    import { i18nState, supportedLangsList } from '$lib/i18n.svelte';
    import { page } from '$app/stores';
    import { untrack } from 'svelte';

	let { children, data } = $props();

    const initialLang = untrack(() => data.lang);
    if (initialLang && supportedLangsList.includes(initialLang as any)) {
        i18nState.locale = initialLang as any;
    }

    $effect(() => {
        if (data.lang && supportedLangsList.includes(data.lang as any)) {
            i18nState.locale = data.lang as any;
        }
        if (data.lang) {
            document.documentElement.lang = data.lang;
        }
    });

</script>

<svelte:head>
	<meta name="description" content={i18nState.t('app_desc')} />
	<title>{i18nState.t('app_title')}</title>
    
    {#each supportedLangsList as langKey}
        <link rel="alternate" hreflang={langKey} href="{$page.url.origin}/{langKey}" />
    {/each}
    <link rel="alternate" hreflang="x-default" href="{$page.url.origin}/" />

	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
	<link rel="apple-touch-icon" href="/favicon.svg" />
	{#if pwaInfo}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html pwaInfo.webManifest.linkTag}
	{/if}
</svelte:head>

{@render children()}
