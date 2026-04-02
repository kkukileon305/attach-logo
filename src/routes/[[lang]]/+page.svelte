<script lang="ts">
    import { onMount } from "svelte";
    import PreviewStage from "$lib/components/PreviewStage.svelte";
    import { processImage } from "$lib/imageProcessor";
    import JSZip from "jszip";
    import saveAs from "file-saver";
    import {
        i18nState,
        languageMetadata,
        supportedLangsList,
        type SupportedLangs,
    } from "$lib/i18n.svelte";
    import { Download } from "lucide-svelte";

    let images = $state<File[]>([]);
    let currentPreviewIndex = $state(0);
    let logoFile = $state<File | undefined>(undefined);
    let logoScale = $state(0.2);
    let mode = $state("center"); // 'drag', 'center', 'custom'
    let position = $state({ x: 0.5, y: 0.5 });
    let customPos = $state({
        horizontal: "right",
        vertical: "bottom",
        x: 20,
        y: 20,
    });
    let isProcessing = $state(false);

    $effect(() => {
        fetch("/logo.svg")
            .then((res) => res.blob())
            .then((blob) => {
                logoFile = new File([blob], "logo.svg", {
                    type: "image/svg+xml",
                });
            });
    });

    const currentImage = $derived(images[currentPreviewIndex]);

    function onImageUpload(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            const files = Array.from(target.files);
            images = [...images, ...files];
            currentPreviewIndex = images.length - files.length;
        }
    }

    function onLogoUpload(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files[0]) {
            logoFile = target.files[0];
        }
    }

    async function processAndDownloadAll() {
        if (!logoFile || images.length === 0) return;
        isProcessing = true;
        const zip = new JSZip();
        for (let i = 0; i < images.length; i++) {
            const blob = await processImage(images[i], logoFile, {
                mode,
                position,
                custom: customPos,
                logoScale,
            });
            if (blob) zip.file(`with_logo_${images[i].name}`, blob);
        }
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "images_with_logo.zip");
        isProcessing = false;
    }

    async function processAndDownloadSingle() {
        if (!logoFile || !currentImage) return;
        isProcessing = true;
        const blob = await processImage(currentImage, logoFile, {
            mode,
            position,
            custom: customPos,
            logoScale,
        });
        if (blob) saveAs(blob, `with_logo_${currentImage.name}`);
        isProcessing = false;
    }

    function removeImage(index: number) {
        images = images.filter((_, i) => i !== index);
        if (currentPreviewIndex >= images.length) {
            currentPreviewIndex = Math.max(0, images.length - 1);
        }
    }

    let isLangModalOpen = $state(false);

    function setLanguage(targetLang: string) {
        window.location.href = `/${targetLang}`;
    }

    let deferredPrompt: any = $state(null);

    onMount(() => {
        window.addEventListener("beforeinstallprompt", (e) => {
            console.log(123);
            e.preventDefault();
            deferredPrompt = e;
        });
    });

    async function installPwa() {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            deferredPrompt = null;
        }
    }
</script>

<div class="layout">
    <header>
        <div class="header-top">
            {#if deferredPrompt}
                <button
                    class="install-btn"
                    onclick={installPwa}
                    title="Install App"
                >
                    <Download />
                </button>
            {/if}
            <button
                class="lang-switcher"
                onclick={() => (isLangModalOpen = true)}
                title="Select Language"
            >
                {i18nState.t("select_language")}
            </button>
        </div>
        <h1>{i18nState.t("app_title")}</h1>
        <p>{i18nState.t("app_desc")}</p>
    </header>

    <main>
        <div class="sidebar">
            <div class="panel">
                <h2>{i18nState.t("step_1")}</h2>
                <div class="upload-group">
                    <label class="file-label">
                        <span class="icon">🖼️</span>
                        <span>{i18nState.t("select_images")}</span>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onchange={onImageUpload}
                        />
                    </label>
                    <label class="file-label" style="padding: 16px;">
                        <span class="icon">🏷️</span>
                        <span>{i18nState.t("change_logo")}</span>
                        <input
                            type="file"
                            accept="image/*"
                            onchange={onLogoUpload}
                        />
                    </label>
                </div>

                {#if images.length > 0}
                    <div class="image-list">
                        {#each images as img, i}
                            <div
                                class="image-item {currentPreviewIndex === i
                                    ? 'active'
                                    : ''}"
                            >
                                <button
                                    class="select-btn"
                                    onclick={() => (currentPreviewIndex = i)}
                                    title={img.name}
                                >
                                    {img.name.length > 15
                                        ? img.name.substring(0, 15) + "..."
                                        : img.name}
                                </button>
                                <button
                                    class="delete-btn"
                                    onclick={() => removeImage(i)}>✖</button
                                >
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>

            <div class="panel">
                <h2>{i18nState.t("step_2")}</h2>

                <div class="setting-group">
                    <span class="label-title">{i18nState.t("mode")}</span>
                    <div class="radio-group">
                        <label>
                            <input
                                type="radio"
                                bind:group={mode}
                                value="center"
                            />
                            {i18nState.t("center")}
                        </label>
                        <label>
                            <input
                                type="radio"
                                bind:group={mode}
                                value="drag"
                            />
                            {i18nState.t("drag")}
                        </label>
                        <label>
                            <input
                                type="radio"
                                bind:group={mode}
                                value="custom"
                            />
                            {i18nState.t("custom")}
                        </label>
                    </div>
                </div>

                <div class="setting-group">
                    <span class="label-title">{i18nState.t("logo_scale")}</span>
                    <input
                        type="range"
                        min="0.05"
                        max="1.0"
                        step="0.01"
                        bind:value={logoScale}
                    />
                    <span>{(logoScale * 100).toFixed(0)}%</span>
                </div>

                {#if mode === "custom"}
                    <div class="custom-settings">
                        <div class="setting-row">
                            <select bind:value={customPos.vertical}>
                                <option value="top">{i18nState.t("top")}</option
                                >
                                <option value="bottom"
                                    >{i18nState.t("bottom")}</option
                                >
                            </select>
                            <input
                                type="number"
                                bind:value={customPos.y}
                                placeholder="Y px"
                            />
                            <span>px</span>
                        </div>
                        <div class="setting-row">
                            <select bind:value={customPos.horizontal}>
                                <option value="left"
                                    >{i18nState.t("left")}</option
                                >
                                <option value="right"
                                    >{i18nState.t("right")}</option
                                >
                            </select>
                            <input
                                type="number"
                                bind:value={customPos.x}
                                placeholder="X px"
                            />
                            <span>px</span>
                        </div>
                    </div>
                {/if}

                {#if mode === "drag"}
                    <p class="help-text">{i18nState.t("drag_help")}</p>
                {/if}
            </div>

            <div class="panel actions">
                <h2>{i18nState.t("step_3")}</h2>
                <button
                    class="btn btn-secondary"
                    onclick={processAndDownloadSingle}
                    disabled={isProcessing || !currentImage}
                >
                    {isProcessing
                        ? i18nState.t("processing")
                        : i18nState.t("download_current")}
                </button>
                <button
                    class="btn"
                    onclick={processAndDownloadAll}
                    disabled={isProcessing || images.length === 0}
                >
                    {isProcessing
                        ? i18nState.t("processing")
                        : `${i18nState.t("download_all")} (${images.length})`}
                </button>
            </div>
        </div>

        <div class="stage">
            <div class="panel preview-panel">
                <PreviewStage
                    imageFile={currentImage}
                    {logoFile}
                    {mode}
                    bind:position
                    {customPos}
                    {logoScale}
                />
            </div>
        </div>
    </main>
</div>

{#if isLangModalOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-backdrop" onclick={() => (isLangModalOpen = false)}>
        <div class="modal-content" onclick={(e) => e.stopPropagation()}>
            <h3>Select Language</h3>
            <div class="lang-options">
                {#each supportedLangsList as langKey}
                    <button
                        class="lang-btn {i18nState.locale === langKey
                            ? 'active'
                            : ''}"
                        onclick={() => setLanguage(langKey)}
                    >
                        <span class="lang-char"
                            >{languageMetadata[langKey].char}</span
                        >
                        {languageMetadata[langKey].name}
                    </button>
                {/each}
            </div>
            <button class="close-btn" onclick={() => (isLangModalOpen = false)}
                >Close</button
            >
        </div>
    </div>
{/if}

<style>
    .layout {
        max-width: 1280px;
        margin: 0 auto;
        padding: 40px 20px;
    }

    .header-top {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-bottom: 20px;
    }

    .lang-switcher {
        background: var(--bg-panel);
        border: 1px solid var(--border);
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .install-btn {
        background: var(--bg-panel);
        border: 1px solid var(--border);
        padding: 8px 12px;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
    }

    .install-btn:hover {
        border-color: var(--primary);
        box-shadow: 0 2px 4px rgba(14, 165, 233, 0.1);
        transform: translateY(-1px);
    }

    .lang-switcher:hover {
        border-color: var(--primary);
        color: var(--primary);
        box-shadow: 0 2px 4px rgba(14, 165, 233, 0.1);
    }

    header {
        margin-bottom: 40px;
        text-align: center;
    }

    header h1 {
        font-size: 2.5rem;
        color: var(--primary);
        margin-bottom: 8px;
    }

    header p {
        color: var(--text-muted);
        font-size: 1.1rem;
    }

    main {
        display: grid;
        grid-template-columns: 1fr 350px;
        gap: 24px;
    }

    .sidebar {
        order: 2;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .stage {
        order: 1;
    }

    .upload-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 16px;
    }

    .icon {
        font-size: 24px;
        margin-bottom: 8px;
    }

    .image-list {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid var(--border);
        border-radius: 8px;
        margin-top: 16px;
    }

    .image-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        border-bottom: 1px solid var(--border);
        background: #fff;
    }

    .image-item.active {
        background: #f0f9ff;
        border-left: 3px solid var(--primary);
    }

    .image-item:last-child {
        border-bottom: none;
    }

    .select-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-family: inherit;
        text-align: left;
        flex: 1;
        font-size: 14px;
    }

    .delete-btn {
        background: none;
        border: none;
        color: #ef4444;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
    }

    .delete-btn:hover {
        background: #fee2e2;
    }

    .setting-group {
        margin-bottom: 20px;
    }

    .setting-group > .label-title {
        display: block;
        font-weight: 500;
        margin-bottom: 8px;
    }

    .radio-group {
        display: flex;
        gap: 16px;
    }

    .custom-settings {
        background: var(--bg);
        padding: 16px;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .setting-row {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .setting-row input[type="number"] {
        width: 80px;
    }

    select,
    input[type="number"] {
        padding: 8px;
        border: 1px solid var(--border);
        border-radius: 6px;
        font-family: inherit;
    }

    input[type="range"] {
        width: 100%;
        margin-right: 12px;
    }

    .actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .help-text {
        font-size: 13px;
        color: var(--primary);
        background: #e0f2fe;
        padding: 8px 12px;
        border-radius: 6px;
        margin-top: 12px;
    }

    .preview-panel {
        height: 100%;
        min-height: 500px;
        display: flex;
        flex-direction: column;
    }

    @media (max-width: 900px) {
        main {
            grid-template-columns: 1fr;
        }

        .sidebar {
            order: 1;
        }

        .stage {
            order: 2;
        }
    }

    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(2px);
    }

    .modal-content {
        background: var(--bg-panel);
        padding: 24px;
        border-radius: var(--radius);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        width: 320px;
        max-width: 90vw;
        text-align: center;
    }

    .modal-content h3 {
        margin-bottom: 20px;
        font-size: 1.25rem;
    }

    .lang-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 24px;
    }

    .lang-btn {
        display: flex;
        align-items: center;
        width: 100%;
        padding: 12px;
        background: var(--bg);
        border: 2px solid var(--border);
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 500;
        transition: all 0.2s;
    }

    .lang-btn:hover {
        border-color: var(--primary);
        background: #f0f9ff;
    }

    .lang-btn.active {
        border-color: var(--primary);
        background: #e0f2fe;
        color: var(--primary);
    }

    .lang-char {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        width: 32px;
        height: 32px;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 50%;
        margin-right: 12px;
        font-size: 1.1rem;
        font-weight: bold;
    }

    .close-btn {
        padding: 8px 16px;
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 0.9rem;
    }

    .close-btn:hover {
        color: var(--text);
        text-decoration: underline;
    }
</style>
