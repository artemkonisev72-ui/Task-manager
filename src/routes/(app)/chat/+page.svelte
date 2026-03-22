<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
    <title>Чат - Logistics Manager</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Чат</h1>
	</div>

	<div class="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-50 dark:divide-gray-700">
		{#if data.contacts.length === 0}
			<div class="p-12 text-center text-gray-500 dark:text-gray-400">
				Нет доступных контактов для чата
			</div>
		{/if}
		{#each data.contacts as contact}
			<a href="/chat/{contact.id}" class="flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
				<div class="flex items-center gap-4">
					<div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg font-semibold border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
						{contact.login[0].toUpperCase()}
					</div>
					<div>
						<h3 class="font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{contact.login}</h3>
						<p class="text-xs text-gray-500 dark:text-gray-400 font-medium">
							{contact.role === 'ADMIN' ? 'Администратор' : contact.role === 'MANAGER' ? 'Менеджер' : 'Исполнитель'}
						</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					{#if contact.unreadCount > 0}
						<span class="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{contact.unreadCount}</span>
					{/if}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</div>
			</a>
		{/each}
	</div>
</div>
