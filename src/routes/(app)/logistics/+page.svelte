<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();

	let showModal = $state(false);
	
	// accordion state
	let expandedTask = $state<string | null>(null);
	let expandedExecutor = $state<string | null>(null);

	function toggleTask(id: string) {
		expandedTask = expandedTask === id ? null : id;
	}

	function toggleExecutor(id: string) {
		expandedExecutor = expandedExecutor === id ? null : id;
	}
</script>

<svelte:head>
    <title>Задачи логистики - Task Manager</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-8 pb-12">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold tracking-tight text-gray-900">Задачи логистики</h1>
		{#if data.isManager}
			<button onclick={() => showModal = true} class="bg-black text-white px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-sm">
				+ Новая задача
			</button>
		{/if}
	</div>

	{#if form?.error}
		<div class="p-4 bg-red-50 text-red-600 rounded-2xl text-sm">{form.error}</div>
	{/if}

	{#if data.isManager}
		<!-- Админ/Менеджер вид -->
		<div class="space-y-4">
			<h2 class="text-xl font-semibold text-gray-800">Исполнители ({data.executors?.length || 0})</h2>
			{#each data.executors || [] as exec}
				<div class="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
					<button onclick={() => toggleExecutor(exec.id)} class="w-full px-6 py-5 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors text-left focus:outline-none">
						<div class="flex items-center gap-3">
							<div class="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-700">
								{exec.login[0].toUpperCase()}
							</div>
							<span class="font-semibold text-gray-900">{exec.login}</span>
						</div>
						<div class="flex items-center gap-4">
							<span class="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
								Задач: {exec.logisticsTasks.length}
							</span>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 transform transition-transform {expandedExecutor === exec.id ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
						</div>
					</button>

					{#if expandedExecutor === exec.id}
						<div class="p-6 space-y-4">
							{#if exec.logisticsTasks.length === 0}
								<p class="text-gray-500 italic text-sm text-center py-4">Нет назначенных задач</p>
							{/if}
							{#each exec.logisticsTasks as task}
								<div class="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
									<button onclick={() => toggleTask(task.id)} class="w-full bg-white px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left">
										<div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
											<span class="font-bold text-gray-900 border border-gray-200 bg-gray-50 px-2 py-1 rounded text-xs">#{task.number}</span>
											<span class="text-sm font-medium text-gray-800 line-clamp-1">{task.address}</span>
											<span class="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">{task.timeStart} - {task.timeEnd}</span>
										</div>
										<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 shrink-0 transform transition-transform {expandedTask === task.id ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
									</button>
									
									{#if expandedTask === task.id}
										<div class="border-t border-gray-200 bg-gray-50 p-5 overflow-x-auto">
											<table class="w-full text-sm text-left border border-gray-200 bg-white rounded-xl overflow-hidden shadow-sm table-fixed min-w-[600px]">
												<tbody>
													<tr class="border-b border-gray-100"><th class="w-48 px-4 py-3 bg-gray-50 text-gray-700">Номер</th><td class="px-4 py-3 font-medium">{task.number}</td></tr>
													<tr class="border-b border-gray-100"><th class="px-4 py-3 bg-gray-50 text-gray-700">Дата</th><td class="px-4 py-3">{new Date(task.date).toLocaleDateString('ru-RU')}</td></tr>
													<tr class="border-b border-gray-100"><th class="px-4 py-3 bg-gray-50 text-gray-700">Время</th><td class="px-4 py-3 font-mono">{task.timeStart} — {task.timeEnd}</td></tr>
													<tr class="border-b border-gray-100"><th class="px-4 py-3 bg-gray-50 text-gray-700">Адрес</th><td class="px-4 py-3">{task.address}</td></tr>
													<tr class="border-b border-gray-100"><th class="px-4 py-3 bg-gray-50 text-gray-700">Логистика</th><td class="px-4 py-3 break-words whitespace-pre-wrap">{task.logistics}</td></tr>
													<tr class="border-b border-gray-100"><th class="px-4 py-3 bg-gray-50 text-gray-700">Наполнение сделки</th><td class="px-4 py-3 break-words whitespace-pre-wrap">{task.dealContent}</td></tr>
													<tr class="border-b border-gray-100"><th class="px-4 py-3 bg-gray-50 text-gray-700">Комментарий</th><td class="px-4 py-3 break-words whitespace-pre-wrap">{task.comment || '-'}</td></tr>
													<tr class="border-b border-gray-100"><th class="px-4 py-3 bg-gray-50 text-gray-700">Чек-лист</th><td class="px-4 py-3 break-words whitespace-pre-wrap">{task.checklist || '-'}</td></tr>
													<tr><th class="px-4 py-3 bg-gray-50 text-gray-700">Сумма к оплате</th><td class="px-4 py-3 font-bold text-gray-900">{task.amount} руб.</td></tr>
												</tbody>
											</table>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>

	{#if showModal}
		<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
			<div class="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
				<div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
					<h3 class="text-xl font-bold text-gray-900">Новая задача логистики</h3>
					<button onclick={() => showModal = false} class="text-gray-400 hover:text-gray-600">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
					</button>
				</div>
				
				<form method="POST" action="?/createTask" use:enhance class="flex-1 overflow-y-auto p-6 space-y-5">
					<div class="grid grid-cols-2 gap-5">
						<div>
							<label class="block text-sm font-semibold text-gray-700 mb-1">Номер</label>
							<input name="number" required class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:bg-white focus:border-black outline-none transition-colors" placeholder="№ 12345" />
						</div>
						<div>
							<label class="block text-sm font-semibold text-gray-700 mb-1">Дата</label>
							<input type="date" name="date" required class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:bg-white focus:border-black outline-none transition-colors" />
						</div>
						<div>
							<label class="block text-sm font-semibold text-gray-700 mb-1">Начало (HH:mm)</label>
							<input type="time" name="timeStart" required class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:bg-white focus:border-black outline-none transition-colors" />
						</div>
						<div>
							<label class="block text-sm font-semibold text-gray-700 mb-1">Конец (HH:mm)</label>
							<input type="time" name="timeEnd" required class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:bg-white focus:border-black outline-none transition-colors" />
						</div>
					</div>

					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-1">Адрес</label>
						<input name="address" required class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:bg-white focus:border-black outline-none transition-colors" placeholder="ул. Примерная, д. 1" />
					</div>
					
					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-1">Логистика</label>
						<textarea name="logistics" required rows="2" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:bg-white focus:border-black outline-none transition-colors resize-none"></textarea>
					</div>

					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-1">Наполнение сделки</label>
						<textarea name="dealContent" required rows="2" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:bg-white focus:border-black outline-none transition-colors resize-none"></textarea>
					</div>

					<div class="grid grid-cols-2 gap-5">
						<div>
							<label class="block text-sm font-semibold text-gray-700 mb-1">Комментарий</label>
							<textarea name="comment" rows="2" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:bg-white focus:border-black outline-none transition-colors resize-none"></textarea>
						</div>
						<div>
							<label class="block text-sm font-semibold text-gray-700 mb-1">Чек-лист</label>
							<textarea name="checklist" rows="2" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:bg-white focus:border-black outline-none transition-colors resize-none"></textarea>
						</div>
					</div>

					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-1">Сумма к оплате (число)</label>
						<input type="number" step="0.01" name="amount" required class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:bg-white focus:border-black outline-none transition-colors" placeholder="1000.50" />
					</div>

					<div class="pt-4 border-t border-gray-100">
						<label class="block text-sm font-semibold text-gray-900 mb-3">Назначить исполнителей</label>
						<div class="space-y-2 max-h-40 overflow-y-auto pr-2">
							{#each data.executors || [] as exec}
								<label class="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-white transition-colors">
									<input type="checkbox" name="executorIds" value={exec.id} class="w-5 h-5 rounded border-gray-300 text-black focus:ring-black" />
									<span class="font-medium text-gray-800">{exec.login}</span>
								</label>
							{/each}
						</div>
					</div>

					<div class="pt-6 shrink-0 mt-auto pb-2">
						<button type="submit" class="w-full bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-md">Опубликовать задачу</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	{:else}
		<!-- Исполнитель вид -->
		<div class="space-y-4">
			<h2 class="text-xl font-semibold text-gray-800 mb-6">Мои задачи логистики</h2>
			{#if data.tasks?.length === 0}
				<div class="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
					У вас пока нет задач
				</div>
			{/if}

			{#each data.tasks || [] as task}
				<div class="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
					<button onclick={() => toggleTask(task.id)} class="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left">
						<div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
							<span class="font-bold text-gray-900 border border-gray-200 bg-gray-50 px-2 py-1 rounded text-xs uppercase">#{task.number}</span>
							<span class="text-base font-semibold text-gray-900 line-clamp-1">{task.address}</span>
							<span class="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">{task.timeStart} &rarr; {task.timeEnd}</span>
						</div>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400 shrink-0 transform transition-transform {expandedTask === task.id ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
					</button>
					
					{#if expandedTask === task.id}
						<div class="border-t border-gray-200 bg-gray-50 p-6 overflow-x-auto">
							<table class="w-full text-sm text-left border border-gray-200 bg-white rounded-xl overflow-hidden shadow-sm table-fixed min-w-[600px]">
								<tbody>
									<tr class="border-b border-gray-100"><th class="w-48 px-5 py-4 bg-gray-50 text-gray-700">Номер</th><td class="px-5 py-4 font-bold text-gray-900">{task.number}</td></tr>
									<tr class="border-b border-gray-100"><th class="px-5 py-4 bg-gray-50 text-gray-700">Дата</th><td class="px-5 py-4">{new Date(task.date).toLocaleDateString('ru-RU')}</td></tr>
									<tr class="border-b border-gray-100"><th class="px-5 py-4 bg-gray-50 text-gray-700">Время</th><td class="px-5 py-4 font-mono font-bold">{task.timeStart} — {task.timeEnd}</td></tr>
									<tr class="border-b border-gray-100"><th class="px-5 py-4 bg-gray-50 text-gray-700">Адрес</th><td class="px-5 py-4">{task.address}</td></tr>
									<tr class="border-b border-gray-100"><th class="px-5 py-4 bg-gray-50 text-gray-700">Логистика</th><td class="px-5 py-4 break-words whitespace-pre-wrap">{task.logistics}</td></tr>
									<tr class="border-b border-gray-100"><th class="px-5 py-4 bg-gray-50 text-gray-700">Наполнение сделки</th><td class="px-5 py-4 break-words whitespace-pre-wrap">{task.dealContent}</td></tr>
									<tr class="border-b border-gray-100"><th class="px-5 py-4 bg-gray-50 text-gray-700">Комментарий</th><td class="px-5 py-4 break-words whitespace-pre-wrap">{task.comment || '-'}</td></tr>
									<tr class="border-b border-gray-100"><th class="px-5 py-4 bg-gray-50 text-gray-700">Чек-лист</th><td class="px-5 py-4 break-words whitespace-pre-wrap">{task.checklist || '-'}</td></tr>
									<tr><th class="px-5 py-4 bg-gray-50 text-gray-700">Сумма к оплате</th><td class="px-5 py-4 font-bold text-green-700">{task.amount} руб.</td></tr>
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
