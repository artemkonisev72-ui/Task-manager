<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();

	let showModal = $state(false);
	
	// Edit modal state
	type TaskType = typeof data.executors extends Array<infer E> ? (E extends { logisticsTasks: Array<infer T> } ? T : never) : never;
	let editingTask = $state<TaskType | null>(null);
	let editExecutorIds = $state<string[]>([]);

	function openEdit(task: any, currentExecutorIds: string[]) {
		editingTask = task;
		editExecutorIds = [...currentExecutorIds];
	}
	function closeEdit() {
		editingTask = null;
		editExecutorIds = [];
	}

	// accordion state
	let expandedTask = $state<string | null>(null);
	let expandedExecutor = $state<string | null>(null);

	function toggleTask(id: string) {
		expandedTask = expandedTask === id ? null : id;
	}

	function toggleExecutor(id: string) {
		expandedExecutor = expandedExecutor === id ? null : id;
	}

	function formatDateForInput(date: Date | string) {
		return new Date(date).toISOString().split('T')[0];
	}
</script>

<svelte:head>
    <title>Задачи логистики - Task Manager</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-8 pb-12">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Задачи логистики</h1>
		{#if data.isManager}
			<button onclick={() => showModal = true} class="bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm">
				+ Новая задача
			</button>
		{/if}
	</div>

	{#if form?.error}
		<div class="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl text-sm">{form.error}</div>
	{/if}

	{#if data.isManager}
		<!-- Админ/Менеджер вид -->
		<div class="space-y-4">
			<h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Исполнители ({data.executors?.length || 0})</h2>
			{#each data.executors || [] as exec}
				<div class="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
					<button onclick={() => toggleExecutor(exec.id)} class="w-full px-6 py-5 flex items-center justify-between bg-gray-50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-left focus:outline-none">
						<div class="flex items-center gap-3">
							<div class="w-8 h-8 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300">
								{exec.login[0].toUpperCase()}
							</div>
							<span class="font-semibold text-gray-900 dark:text-gray-100">{exec.login}</span>
						</div>
						<div class="flex items-center gap-4">
							<span class="text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">
								Задач: {exec.logisticsTasks.length}
							</span>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 dark:text-gray-500 transform transition-transform {expandedExecutor === exec.id ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
						</div>
					</button>

					{#if expandedExecutor === exec.id}
						<div class="p-6 space-y-4">
							{#if exec.logisticsTasks.length === 0}
								<p class="text-gray-500 dark:text-gray-400 italic text-sm text-center py-4">Нет назначенных задач</p>
							{/if}
							{#each exec.logisticsTasks as task}
								<div class="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
									<button onclick={() => toggleTask(task.id)} class="w-full bg-white dark:bg-gray-800 px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left">
										<div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
											<span class="font-bold text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded text-xs">#{task.number}</span>
											<span class="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{task.address}</span>
											<span class="text-sm text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{task.timeStart} - {task.timeEnd}</span>
										</div>
										<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 dark:text-gray-500 shrink-0 transform transition-transform {expandedTask === task.id ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
									</button>
									
									{#if expandedTask === task.id}
										<div class="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-5 overflow-x-auto">
											<table class="w-full text-sm text-left border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm table-fixed min-w-[600px]">
												<tbody>
													<tr class="border-b border-gray-100 dark:border-gray-700"><th class="w-48 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Номер</th><td class="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{task.number}</td></tr>
													<tr class="border-b border-gray-100 dark:border-gray-700"><th class="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Дата</th><td class="px-4 py-3 text-gray-900 dark:text-gray-100">{new Date(task.date).toLocaleDateString('ru-RU')}</td></tr>
													<tr class="border-b border-gray-100 dark:border-gray-700"><th class="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Время</th><td class="px-4 py-3 font-mono text-gray-900 dark:text-gray-100">{task.timeStart} — {task.timeEnd}</td></tr>
													<tr class="border-b border-gray-100 dark:border-gray-700"><th class="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Адрес</th><td class="px-4 py-3 text-gray-900 dark:text-gray-100">{task.address}</td></tr>
													<tr class="border-b border-gray-100 dark:border-gray-700"><th class="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Логистика</th><td class="px-4 py-3 break-words whitespace-pre-wrap text-gray-900 dark:text-gray-100">{task.logistics}</td></tr>
													<tr class="border-b border-gray-100 dark:border-gray-700"><th class="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Наполнение сделки</th><td class="px-4 py-3 break-words whitespace-pre-wrap text-gray-900 dark:text-gray-100">{task.dealContent}</td></tr>
													<tr class="border-b border-gray-100 dark:border-gray-700"><th class="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Комментарий</th><td class="px-4 py-3 break-words whitespace-pre-wrap text-gray-900 dark:text-gray-100">{task.comment || '-'}</td></tr>
													<tr class="border-b border-gray-100 dark:border-gray-700"><th class="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Чек-лист</th><td class="px-4 py-3 break-words whitespace-pre-wrap text-gray-900 dark:text-gray-100">{task.checklist || '-'}</td></tr>
													<tr><th class="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Сумма к оплате</th><td class="px-4 py-3 font-bold text-gray-900 dark:text-gray-100">{task.amount} руб.</td></tr>
												</tbody>
											</table>
											<div class="mt-4 flex justify-end gap-3">
												<button
													onclick={() => openEdit(task, [exec.id])}
													class="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors"
												>
													Редактировать
												</button>
												<form
													method="POST"
													action="?/deleteTask"
													use:enhance
													onsubmit={(e) => { if (!confirm(`Удалить задачу №${task.number}? Это действие необратимо.`)) e.preventDefault(); }}
												>
													<input type="hidden" name="taskId" value={task.id} />
													<button type="submit" class="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl transition-colors">
														Удалить
													</button>
												</form>
											</div>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>

	<!-- Create task modal -->
	{#if showModal}
		<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
			<div class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
				<div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 shrink-0">
					<h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Новая задача логистики</h3>
					<button onclick={() => showModal = false} class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Закрыть">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
					</button>
				</div>
				<form method="POST" action="?/createTask" use:enhance class="flex-1 overflow-y-auto p-6 space-y-5">
					<div class="grid grid-cols-2 gap-5">
						<div><label for="c-number" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Номер</label><input id="c-number" name="number" required class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-gray-600 focus:border-black dark:focus:border-gray-400 outline-none transition-colors" placeholder="№ 12345" /></div>
						<div><label for="c-date" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Дата</label><input id="c-date" type="date" name="date" required class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-gray-600 focus:border-black dark:focus:border-gray-400 outline-none transition-colors" /></div>
						<div><label for="c-start" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Начало (HH:mm)</label><input id="c-start" type="time" name="timeStart" required class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-gray-600 focus:border-black dark:focus:border-gray-400 outline-none transition-colors" /></div>
						<div><label for="c-end" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Конец (HH:mm)</label><input id="c-end" type="time" name="timeEnd" required class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-gray-600 focus:border-black dark:focus:border-gray-400 outline-none transition-colors" /></div>
					</div>
					<div><label for="c-address" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Адрес</label><input id="c-address" name="address" required class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-gray-600 focus:border-black dark:focus:border-gray-400 outline-none transition-colors" /></div>
					<div><label for="c-logistics" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Логистика</label><textarea id="c-logistics" name="logistics" required rows="2" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-gray-600 focus:border-black dark:focus:border-gray-400 outline-none transition-colors resize-none"></textarea></div>
					<div><label for="c-deal" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Наполнение сделки</label><textarea id="c-deal" name="dealContent" required rows="2" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-gray-600 focus:border-black dark:focus:border-gray-400 outline-none transition-colors resize-none"></textarea></div>
					<div class="grid grid-cols-2 gap-5">
						<div><label for="c-comment" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Комментарий</label><textarea id="c-comment" name="comment" rows="2" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-gray-600 focus:border-black dark:focus:border-gray-400 outline-none transition-colors resize-none"></textarea></div>
						<div><label for="c-checklist" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Чек-лист</label><textarea id="c-checklist" name="checklist" rows="2" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-gray-600 focus:border-black dark:focus:border-gray-400 outline-none transition-colors resize-none"></textarea></div>
					</div>
					<div><label for="c-amount" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Сумма к оплате</label><input id="c-amount" type="number" step="0.01" name="amount" required class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-gray-600 focus:border-black dark:focus:border-gray-400 outline-none transition-colors" placeholder="1000.50" /></div>
					<div class="pt-4 border-t border-gray-100 dark:border-gray-700">
						<label class="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Назначить исполнителей</label>
						<div class="space-y-2 max-h-40 overflow-y-auto pr-2">
							{#each data.executors || [] as exec}
								<label class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-white dark:hover:bg-gray-600 transition-colors">
									<input type="checkbox" name="executorIds" value={exec.id} class="w-5 h-5 rounded border-gray-300 dark:border-gray-500 text-black focus:ring-black" />
									<span class="font-medium text-gray-800 dark:text-gray-200">{exec.login}</span>
								</label>
							{/each}
						</div>
					</div>
					<div class="pt-6 shrink-0 pb-2">
						<button type="submit" class="w-full bg-black dark:bg-white text-white dark:text-black py-3.5 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-md">Опубликовать задачу</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	{:else}
		<!-- Исполнитель вид -->
		<div class="space-y-4">
			<h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Мои задачи логистики</h2>
			{#if data.tasks?.length === 0}
				<div class="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
					У вас пока нет задач
				</div>
			{/if}
			{#each data.tasks || [] as task}
				<div class="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-gray-800">
					<button onclick={() => toggleTask(task.id)} class="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left">
						<div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
							<span class="font-bold text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded text-xs uppercase">#{task.number}</span>
							<span class="text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{task.address}</span>
							<span class="text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">{task.timeStart} &rarr; {task.timeEnd}</span>
						</div>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400 dark:text-gray-500 shrink-0 transform transition-transform {expandedTask === task.id ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
					</button>
					{#if expandedTask === task.id}
						<div class="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-6 overflow-x-auto">
							<table class="w-full text-sm text-left border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm table-fixed min-w-[600px]">
								<tbody>
									<tr class="border-b border-gray-100 dark:border-gray-700"><th class="w-48 px-5 py-4 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Номер</th><td class="px-5 py-4 font-bold text-gray-900 dark:text-gray-100">{task.number}</td></tr>
									<tr class="border-b border-gray-100 dark:border-gray-700"><th class="px-5 py-4 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Дата</th><td class="px-5 py-4 text-gray-900 dark:text-gray-100">{new Date(task.date).toLocaleDateString('ru-RU')}</td></tr>
									<tr class="border-b border-gray-100 dark:border-gray-700"><th class="px-5 py-4 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Время</th><td class="px-5 py-4 font-mono font-bold text-gray-900 dark:text-gray-100">{task.timeStart} — {task.timeEnd}</td></tr>
									<tr class="border-b border-gray-100 dark:border-gray-700"><th class="px-5 py-4 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Адрес</th><td class="px-5 py-4 text-gray-900 dark:text-gray-100">{task.address}</td></tr>
									<tr class="border-b border-gray-100 dark:border-gray-700"><th class="px-5 py-4 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Логистика</th><td class="px-5 py-4 break-words whitespace-pre-wrap text-gray-900 dark:text-gray-100">{task.logistics}</td></tr>
									<tr class="border-b border-gray-100 dark:border-gray-700"><th class="px-5 py-4 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Наполнение сделки</th><td class="px-5 py-4 break-words whitespace-pre-wrap text-gray-900 dark:text-gray-100">{task.dealContent}</td></tr>
									<tr class="border-b border-gray-100 dark:border-gray-700"><th class="px-5 py-4 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Комментарий</th><td class="px-5 py-4 break-words whitespace-pre-wrap text-gray-900 dark:text-gray-100">{task.comment || '-'}</td></tr>
									<tr class="border-b border-gray-100 dark:border-gray-700"><th class="px-5 py-4 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Чек-лист</th><td class="px-5 py-4 break-words whitespace-pre-wrap text-gray-900 dark:text-gray-100">{task.checklist || '-'}</td></tr>
									<tr><th class="px-5 py-4 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Сумма к оплате</th><td class="px-5 py-4 font-bold text-green-700 dark:text-green-400">{task.amount} руб.</td></tr>
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Edit task modal -->
{#if editingTask}
<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
	<div class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
		<div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 shrink-0">
			<h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Редактировать задачу #{editingTask.number}</h3>
			<button onclick={closeEdit} class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Закрыть">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
			</button>
		</div>
		<form method="POST" action="?/updateTask" use:enhance={() => { return async ({ result, update }) => { await update(); if (result.type !== 'failure') closeEdit(); }; }} class="flex-1 overflow-y-auto p-6 space-y-5">
			<input type="hidden" name="taskId" value={editingTask.id} />
			<div class="grid grid-cols-2 gap-5">
				<div><label for="e-number" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Номер</label><input id="e-number" name="number" required value={editingTask.number} class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-gray-600 focus:border-black dark:focus:border-gray-400 outline-none transition-colors" /></div>
				<div><label for="e-date" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Дата</label><input id="e-date" type="date" name="date" required value={formatDateForInput(editingTask.date)} class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-gray-600 focus:border-black dark:focus:border-gray-400 outline-none transition-colors" /></div>
				<div><label for="e-start" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Начало (HH:mm)</label><input id="e-start" type="time" name="timeStart" required value={editingTask.timeStart} class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-gray-600 focus:border-black dark:focus:border-gray-400 outline-none transition-colors" /></div>
				<div><label for="e-end" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Конец (HH:mm)</label><input id="e-end" type="time" name="timeEnd" required value={editingTask.timeEnd} class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-gray-600 focus:border-black dark:focus:border-gray-400 outline-none transition-colors" /></div>
			</div>
			<div><label for="e-address" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Адрес</label><input id="e-address" name="address" required value={editingTask.address} class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-gray-600 focus:border-black dark:focus:border-gray-400 outline-none transition-colors" /></div>
			<div><label for="e-logistics" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Логистика</label><textarea id="e-logistics" name="logistics" required rows="2" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-gray-600 focus:border-black dark:focus:border-gray-400 outline-none transition-colors resize-none">{editingTask.logistics}</textarea></div>
			<div><label for="e-deal" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Наполнение сделки</label><textarea id="e-deal" name="dealContent" required rows="2" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-gray-600 focus:border-black dark:focus:border-gray-400 outline-none transition-colors resize-none">{editingTask.dealContent}</textarea></div>
			<div class="grid grid-cols-2 gap-5">
				<div><label for="e-comment" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Комментарий</label><textarea id="e-comment" name="comment" rows="2" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-gray-600 focus:border-black dark:focus:border-gray-400 outline-none transition-colors resize-none">{editingTask.comment || ''}</textarea></div>
				<div><label for="e-checklist" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Чек-лист</label><textarea id="e-checklist" name="checklist" rows="2" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-gray-600 focus:border-black dark:focus:border-gray-400 outline-none transition-colors resize-none">{editingTask.checklist || ''}</textarea></div>
			</div>
			<div><label for="e-amount" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Сумма к оплате</label><input id="e-amount" type="number" step="0.01" name="amount" required value={editingTask.amount} class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-gray-600 focus:border-black dark:focus:border-gray-400 outline-none transition-colors" /></div>
			<div class="pt-4 border-t border-gray-100 dark:border-gray-700">
				<label class="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Исполнители</label>
				<div class="space-y-2 max-h-40 overflow-y-auto pr-2">
					{#each data.executors || [] as exec}
						<label class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-white dark:hover:bg-gray-600 transition-colors">
							<input type="checkbox" name="executorIds" value={exec.id} checked={editExecutorIds.includes(exec.id)} class="w-5 h-5 rounded border-gray-300 dark:border-gray-500 text-black focus:ring-black" />
							<span class="font-medium text-gray-800 dark:text-gray-200">{exec.login}</span>
						</label>
					{/each}
				</div>
			</div>
			<div class="pt-6 pb-2">
				<button type="submit" class="w-full bg-black dark:bg-white text-white dark:text-black py-3.5 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-md">Сохранить изменения</button>
			</div>
		</form>
	</div>
</div>
{/if}
