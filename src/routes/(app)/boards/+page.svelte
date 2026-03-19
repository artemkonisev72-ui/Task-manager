<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();
</script>

<div class="max-w-6xl mx-auto space-y-8">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold tracking-tight text-gray-900">Проекты и доски</h1>
	</div>

	{#if data.user.role !== 'EXECUTOR'}
		<form method="POST" action="?/createBoard" class="flex flex-col sm:flex-row gap-3 p-4 bg-white rounded-3xl shadow-sm border border-gray-100">
			<input 
				name="title" 
				placeholder="Название новой доски" 
				required 
				class="flex-1 px-4 py-3 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:border-black focus:ring-0 transition-colors"
			/>
			<button class="px-6 py-3 bg-black text-white font-medium rounded-2xl hover:bg-gray-800 transition-colors shadow-sm shrink-0">Создать доску</button>
		</form>
		{#if form?.error}
			<p class="text-red-500 text-sm">{form.error}</p>
		{/if}
	{/if}

	<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
		{#each data.boards as board}
			<div class="group relative block p-6 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-300 transition-all duration-300">
				{#if data.user.role === 'ADMIN' || data.user.role === 'MANAGER'}
				<form method="POST" action="?/deleteBoard" use:enhance class="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
					<input type="hidden" name="boardId" value={board.id} />
					<button class="text-gray-300 hover:text-red-500 rounded p-1" title="Удалить доску" onclick={(e) => {
						if(!confirm('Вы уверены, что хотите удалить эту доску? Все задачи будут удалены навсегда.')) e.preventDefault();
					}}>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
					</button>
				</form>
				{/if}

				<a href="/boards/{board.id}" class="h-full flex flex-col">
					<h2 class="text-xl font-semibold mb-2 group-hover:text-black text-gray-800 pr-8">{board.title}</h2>
					<p class="text-gray-500 text-sm mb-6 line-clamp-2">{board.description || 'Описание отсутствует'}</p>
					
					<div class="flex items-center justify-between text-xs font-semibold text-gray-400 mt-auto pt-4 border-t border-gray-50">
						<span>{board._count.columns} колонки</span>
						<span class="group-hover:translate-x-1 transition-transform">&rarr; Открыть</span>
					</div>
				</a>
			</div>
		{/each}
		{#if data.boards.length === 0}
			<div class="col-span-full p-12 text-center text-gray-500 bg-white rounded-3xl shadow-sm border border-gray-200 border-dashed">
				Нет доступных досок.
				{#if data.user.role !== 'EXECUTOR'} <br/><span class="text-sm mt-2 block">Создайте свою первую доску выше!</span> {/if}
			</div>
		{/if}
	</div>
</div>
