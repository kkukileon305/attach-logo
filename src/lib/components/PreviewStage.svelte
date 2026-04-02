<script lang="ts">
    import { onMount } from "svelte";
    import { i18nState } from "$lib/i18n.svelte";

    interface Props {
        imageFile: File | undefined;
        logoFile: File | undefined;
        mode: string;
        position: { x: number; y: number };
        customPos: {
            horizontal: string;
            vertical: string;
            x: number;
            y: number;
        };
        logoScale: number;
    }

    let {
        imageFile,
        logoFile,
        mode,
        position = $bindable(),
        customPos,
        logoScale,
    }: Props = $props();

    let imageSrc = $state<string>();
    let logoSrc = $state<string>();
    let containerInfo = $state({ width: 1, height: 1 });
    let containerElement = $state<HTMLDivElement>();

    let isDragging = $state(false);

    // Track interactions
    let dragStartPointer = $state({ x: 0, y: 0 });
    let dragStartPosition = $state({ x: 0, y: 0 });

    $effect(() => {
        if (imageFile) {
            const url = URL.createObjectURL(imageFile);
            imageSrc = url;
            return () => URL.revokeObjectURL(url);
        } else {
            imageSrc = undefined;
        }
    });

    $effect(() => {
        if (logoFile) {
            const url = URL.createObjectURL(logoFile);
            logoSrc = url;
            return () => URL.revokeObjectURL(url);
        } else {
            logoSrc = undefined;
        }
    });

    // 마우스와 터치 이벤트의 좌표를 가져오는 헬퍼 함수
    function getPointerPos(e: MouseEvent | TouchEvent) {
        if ("touches" in e) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }

    function handleDragStart(e: MouseEvent | TouchEvent) {
        if (mode !== "drag") return;
        isDragging = true;

        const pos = getPointerPos(e);
        dragStartPointer = { x: pos.x, y: pos.y };
        dragStartPosition = { x: position.x, y: position.y };
    }

    function handleDragMove(e: MouseEvent | TouchEvent) {
        if (isDragging && containerElement) {
            const pos = getPointerPos(e);
            const rect = containerElement.getBoundingClientRect();

            // Calculate pixel difference
            const deltaX = pos.x - dragStartPointer.x;
            const deltaY = pos.y - dragStartPointer.y;

            // Convert to relative coordinate delta
            const relativeDeltaX = deltaX / rect.width;
            const relativeDeltaY = deltaY / rect.height;

            // Apply delta to original position
            let x = dragStartPosition.x + relativeDeltaX;
            let y = dragStartPosition.y + relativeDeltaY;

            // clamp
            x = Math.max(0, Math.min(1, x));
            y = Math.max(0, Math.min(1, y));

            position = { x, y };
        }
    }

    function handleDragEnd() {
        isDragging = false;
    }

    function onResize() {
        if (containerElement) {
            const rect = containerElement.getBoundingClientRect();
            containerInfo = { width: rect.width, height: rect.height };
        }
    }

    onMount(() => {
        const resizeObserver = new ResizeObserver(onResize);
        if (containerElement) resizeObserver.observe(containerElement);
        return () => resizeObserver.disconnect();
    });

    const displayLogoWidth = $derived(containerInfo.width * logoScale);

    let logoStyles = $derived.by(() => {
        if (mode === "center") {
            return `left: 50%; top: 50%; transform: translate(-50%, -50%); width: ${displayLogoWidth}px; transition: all 0.3s ease;`;
        }
        if (mode === "drag") {
            const px = position.x * containerInfo.width;
            const py = position.y * containerInfo.height;
            return `left: ${px}px; top: ${py}px; width: ${displayLogoWidth}px; transition: none;`;
        }
        if (mode === "custom") {
            const hl =
                customPos.horizontal === "left" ? `${customPos.x}px` : "auto";
            const hr =
                customPos.horizontal === "right" ? `${customPos.x}px` : "auto";
            const vt =
                customPos.vertical === "top" ? `${customPos.y}px` : "auto";
            const vb =
                customPos.vertical === "bottom" ? `${customPos.y}px` : "auto";

            return `left: ${hl}; right: ${hr}; top: ${vt}; bottom: ${vb}; width: ${displayLogoWidth}px; transition: all 0.3s ease;`;
        }
        return "";
    });
</script>

<svelte:window
    onmouseup={handleDragEnd}
    onmousemove={handleDragMove}
    ontouchend={handleDragEnd}
    ontouchcancel={handleDragEnd}
    ontouchmove={handleDragMove}
/>

<div
    class="preview-container {mode === 'drag' ? 'is-drag-mode' : ''}"
    bind:this={containerElement}
    onmousedown={handleDragStart}
    ontouchstart={handleDragStart}
    role="presentation"
>
    {#if imageSrc}
        <img
            class="base-image"
            src={imageSrc}
            alt="Preview"
            draggable="false"
        />
    {:else}
        <div class="empty-state">{i18nState.t("empty_state")}</div>
    {/if}

    {#if logoSrc && imageSrc}
        <img
            class="logo-overlay {mode === 'drag' ? 'draggable' : ''}"
            src={logoSrc}
            alt="Logo"
            style={logoStyles}
            draggable="false"
        />
    {/if}
</div>

<style>
    .preview-container {
        position: relative;
        width: 100%;
        max-width: 800px;
        overflow: hidden;
        user-select: none;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 0px;
    }

    /* 드래그 모드일 때 모바일 화면 스크롤 방지 */
    .preview-container.is-drag-mode {
        touch-action: none;
    }

    .base-image {
        display: block;
        width: 100%;
        height: auto;
        object-fit: contain;
    }

    .empty-state {
        color: var(--text-muted);
        font-weight: 500;
    }

    .logo-overlay {
        position: absolute;
        pointer-events: none;
        z-index: 10;
    }

    .logo-overlay.draggable {
        cursor: grab;
    }

    .logo-overlay.draggable:active {
        cursor: grabbing;
    }
</style>
