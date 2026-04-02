<script lang="ts">
	import '../../app.css';
	import { pwaInfo } from 'virtual:pwa-info';
    import { i18nState } from '$lib/i18n.svelte';

	let { children, data } = $props();

    $effect(() => {
        if (data.lang && (data.lang === 'en' || data.lang === 'ko')) {
            i18nState.locale = data.lang;
            document.documentElement.lang = data.lang;
        }
    });

</script>

<svelte:head>
	<meta name="description" content={i18nState.t('app_desc')} />
	<title>{i18nState.t('app_title')}</title>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
	<link rel="apple-touch-icon" href="/favicon.svg" />
	{#if pwaInfo}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html pwaInfo.webManifest.linkTag}
	{/if}
</svelte:head>

{@render children()}
