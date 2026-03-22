<script lang="ts">
    import { enhance } from '$app/forms';

    let { data, form } = $props();
    let showUploadModal = $state(false);
    let uploading = $state(false);
    let selectedDoc: string | null = $state(null);

    function closeViewer() {
        selectedDoc = null;
    }
</script>

<svelte:head>
    <title>Информация - Logistics Manager</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-8 min-h-[500px]">
    <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Информация</h1>
        {#if data.user.role !== 'EXECUTOR'}
            <button onclick={() => showUploadModal = true} class="bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm">
                + Загрузить PDF
            </button>
        {/if}
    </div>

    {#if form?.error}
        <div class="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium border border-red-100 dark:border-red-800">
            {form.error}
        </div>
    {/if}

    {#if data.documents.length === 0}
        <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
            Документы пока не загружены.
        </div>
    {:else}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {#each data.documents as doc}
                <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer relative" onclick={() => selectedDoc = doc.id}>
                    <div class="aspect-[4/3] bg-gray-50 dark:bg-gray-900/50 flex flex-col items-center justify-center p-6 border-b border-gray-100 dark:border-gray-700 text-red-500 dark:text-red-400 group-hover:bg-gray-100 dark:group-hover:bg-gray-800 transition-colors duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 opacity-90 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="currentColor">
                           <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6zm5.5-5.5v3H10v-3h1.5zm2.5 0v3h-1.5v-3h1.5zm2.5 0v2h-1.5v-2h1.5zM10 11.5v1.5h1.5v-1.5H10zm2.5 0v1.5h1.5v-1.5h-1.5zm2.5 0v1.5h1.5v-1.5h-1.5z"/>
                        </svg>
                        <span class="mt-4 text-[10px] font-bold tracking-widest text-gray-400 dark:text-gray-500">PDF</span>
                    </div>
                    <div class="p-5">
                        <h3 class="font-bold text-gray-900 dark:text-gray-100 text-sm truncate pr-8" title={doc.name}>{doc.name}</h3>
                        <p class="text-[11px] text-gray-500 mt-1.5 font-medium">{new Date(doc.createdAt).toLocaleDateString('ru-RU')} • {doc.uploader.login}</p>
                        
                        {#if data.user.role !== 'EXECUTOR'}
                            <form method="POST" action="?/delete" use:enhance class="absolute top-[80%] right-3" onsubmit={(e) => { e.stopPropagation(); if(!confirm('Удалить документ?')) e.preventDefault(); }}>
                                <input type="hidden" name="id" value={doc.id} />
                                <button type="submit" class="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </form>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<!-- Upload Modal -->
{#if showUploadModal}
<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-sm overflow-hidden">
        <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">Загрузить документ</h3>
            <button onclick={() => showUploadModal = false} class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Закрыть">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        <form method="POST" action="?/upload" enctype="multipart/form-data" use:enhance={() => { uploading = true; return async ({ update }) => { await update(); uploading = false; showUploadModal = false; }; }} class="p-6 space-y-4">
            <div>
                <label for="file" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Выберите PDF файл</label>
                <input id="file" name="file" type="file" accept=".pdf,application/pdf" required class="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white dark:file:bg-white dark:file:text-black hover:file:bg-gray-800 dark:hover:file:bg-gray-100 transition-colors bg-gray-50 dark:bg-gray-700 rounded-xl" />
            </div>
            <button type="submit" disabled={uploading} class="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50">
                {uploading ? 'Загрузка...' : 'Загрузить'}
            </button>
        </form>
    </div>
</div>
{/if}

<!-- PDF Viewer Fullscreen Modal -->
{#if selectedDoc}
<div class="fixed inset-0 bg-black/95 z-50 flex flex-col">
    <div class="flex items-center justify-between p-4 bg-black border-b border-gray-800 shrink-0 shadow-lg">
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" /></svg>
            </div>
            <span class="text-white font-medium text-sm">Просмотр документа</span>
        </div>
        <button onclick={closeViewer} class="text-gray-400 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
    </div>
    <div class="flex-1 w-full bg-black/50 overflow-hidden relative p-2 md:p-6 pb-0 flex items-center justify-center">
        <!-- Uses native browser PDF viewer in modern browsers -->
        <iframe src="/api/documents/{selectedDoc}" class="w-full h-full border-0 max-w-5xl bg-white rounded-t-xl" title="PDF Viewer"></iframe>
    </div>
</div>
{/if}
