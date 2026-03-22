<script lang="ts">
    import { onMount, onDestroy, tick } from 'svelte';
    import { enhance } from '$app/forms';

    let { data, form } = $props();
    let messages = $state(data.messages);
    let messagesEnd: HTMLElement;
    let pollInterval: ReturnType<typeof setInterval>;
    let content = $state('');
    let sending = $state(false);

    async function scrollToBottom() {
        await tick();
        messagesEnd?.scrollIntoView({ behavior: 'smooth' });
    }

    onMount(() => {
        scrollToBottom();
        pollInterval = setInterval(async () => {
            const lastMsg = messages[messages.length - 1];
            const ts = lastMsg ? new Date(lastMsg.createdAt).toISOString() : new Date(0).toISOString();
            try {
                const res = await fetch(`/api/chat?partnerId=${data.partner.id}&since=${ts}`);
                if (res.ok) {
                    const json = await res.json();
                    if (json.messages && json.messages.length > 0) {
                        messages = [...messages, ...json.messages];
                        scrollToBottom();
                    }
                }
            } catch (e) {}
        }, 3000);
    });

    onDestroy(() => {
        if (pollInterval) clearInterval(pollInterval);
    });
</script>

<svelte:head>
    <title>Чат с {data.partner.login} - Logistics Manager</title>
</svelte:head>

<div class="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 shrink-0">
        <div class="flex items-center gap-4">
            <a href="/chat" class="p-2 -ml-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </a>
            <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-300">
                {data.partner.login[0].toUpperCase()}
            </div>
            <div>
                <h2 class="font-bold text-gray-900 dark:text-gray-100">{data.partner.login}</h2>
                <p class="text-xs text-gray-500 font-medium">{data.partner.role === 'ADMIN' ? 'Администратор' : data.partner.role === 'MANAGER' ? 'Менеджер' : 'Исполнитель'}</p>
            </div>
        </div>
    </div>

    <!-- Messages -->
    <div class="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar bg-gray-50/50 dark:bg-gray-900/20">
        {#if messages.length === 0}
            <div class="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 italic text-sm">
                Нет сообщений. Напишите первым!
            </div>
        {/if}
        {#each messages as msg}
            <div class="flex {msg.senderId === data.user.id ? 'justify-end' : 'justify-start'}">
                <div class="max-w-[75%] rounded-2xl px-5 py-3 shadow-sm {msg.senderId === data.user.id ? 'bg-black text-white dark:bg-white dark:text-black rounded-tr-sm' : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-600 rounded-tl-sm'}">
                    <p class="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <p class="text-[10px] mt-1 text-right {msg.senderId === data.user.id ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400 dark:text-gray-400'} font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>
        {/each}
        <div bind:this={messagesEnd}></div>
    </div>

    <!-- Input -->
    <div class="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shrink-0">
        <form 
            method="POST" 
            action="?/sendMessage" 
            use:enhance={() => {
                sending = true;
                return async ({ result, update }) => {
                    await update({ reset: false });
                    if (result.type === 'success') {
                        content = '';
                        const lastMsg = messages[messages.length - 1];
                        const ts = lastMsg ? new Date(lastMsg.createdAt).toISOString() : new Date(0).toISOString();
                        fetch(`/api/chat?partnerId=${data.partner.id}&since=${ts}`)
                            .then(r => r.json())
                            .then(j => {
                                if (j.messages && j.messages.length > 0) {
                                    messages = [...messages, ...j.messages];
                                    scrollToBottom();
                                }
                            });
                    }
                    sending = false;
                    scrollToBottom();
                };
            }} 
            class="flex items-center gap-3 relative"
        >
            <input 
                type="text" 
                name="content" 
                bind:value={content}
                placeholder="Сообщение..." 
                class="flex-1 bg-gray-100 dark:bg-gray-700 border-0 text-gray-900 dark:text-gray-100 rounded-2xl pl-5 pr-14 py-3.5 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-shadow text-sm"
                required
                autocomplete="off"
            />
            <button 
                type="submit" 
                disabled={sending || !content.trim()}
                class="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center shrink-0 shadow-sm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
            </button>
        </form>
    </div>
</div>
