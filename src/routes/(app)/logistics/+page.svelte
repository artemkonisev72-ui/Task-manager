<script lang="ts">
	import { enhance } from '$app/forms';
	interface Task {
		id: string;
		number: string;
		date: string | Date;
		timeStart: string;
		timeEnd: string;
		address: string;
		logistics: string;
		dealContent: string;
		comment?: string | null;
		checklist?: string | null;
		amount: number;
		assignmentStatus?: string;
		paymentText?: string;
	}

	interface Executor {
		id: string;
		login: string;
		role: string;
		level: string;
		activeTasksCount: number;
		logisticsTasks: Task[];
	}

	let { data, form } = $props();

	// Edit modal state
	let editingTask = $state<Task | null>(null);
	let editExecutorIds = $state<string[]>([]);
	let editPayments = $state<Record<string, string>>({});

	let executors = $derived((data.executors as any as Executor[]) || []);
	let tasks = $derived((data.tasks as any as Task[]) || []);
	let unassignedTasks = $derived((data.unassignedTasks as any as Task[]) || []);

	function openEdit(task: Task, currentExecutorIds: string[]) {
		editingTask = task;
		editExecutorIds = [...currentExecutorIds];
		editPayments = {};
		// We need to find the paymentText for each executor assigned to this task
		// In logistics page, task is inside exec.logisticsTasks, so task.paymentText is available
		if ((task as any).paymentText !== undefined) {
			// This is a bit tricky since one task object here corresponds to one assignment
			// If we are editing from an executor's list, we populate for that executor
			for (const eid of currentExecutorIds) {
				editPayments[eid] = (task as any).paymentText || '';
			}
		}
	}
	function closeEdit() {
		editingTask = null;
		editExecutorIds = [];
		editPayments = {};
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
    <title>Логистика - Logistics Manager</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-8 pb-12">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
			{data.isManager ? 'Исполнители' : 'Мои заявки'}
		</h1>
	</div>

	{#if form?.error}
		<div class="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl text-sm">{form.error}</div>
	{/if}

	{#if data.isManager}
		<!-- Админ/Менеджер вид -->
		<div class="space-y-8">
			<!-- Заявки без исполнителей -->
			{#if unassignedTasks.length > 0}
				<div class="space-y-4">
					<h2 class="text-xl font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
						Без исполнителя ({unassignedTasks.length})
					</h2>
					<div class="space-y-4 bg-amber-50/50 dark:bg-amber-900/10 p-6 rounded-3xl border border-amber-100 dark:border-amber-900/30">
						{#each unassignedTasks as task}
							{@render taskItem(task, [])}
						{/each}
					</div>
				</div>
			{/if}

			<div class="space-y-4">
				<h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Исполнители ({executors.length})</h2>
				{#each executors as exec, i}
					<div class="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<div aria-expanded={expandedExecutor === exec.id} role="button" tabindex="0" onclick={() => toggleExecutor(exec.id)} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleExecutor(exec.id); }} class="w-full px-6 py-5 flex items-center justify-between bg-gray-50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors text-left focus:outline-none cursor-pointer">
							<div class="flex items-center gap-3">
								<div class="text-sm font-mono text-gray-400 w-4">{i + 1}</div>
								<div class="w-8 h-8 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300">
									{exec.login[0].toUpperCase()}
								</div>
								<span class="font-semibold text-gray-900 dark:text-gray-100">{exec.login}</span>

								<form method="POST" action="?/updateExecutorLevel" use:enhance onclick={(e) => e.stopPropagation()} class="ml-2 relative">
									<input type="hidden" name="userId" value={exec.id} />
									<select name="level" onchange={(e) => e.currentTarget.form?.requestSubmit()} class="appearance-none text-xs font-bold rounded-lg pl-3 pr-7 py-1.5 border hover:border-black dark:hover:border-white transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-black dark:focus:ring-white 
										{exec.level === 'TOP' ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-400' :
										 exec.level === 'PRO' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-400' :
										 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400'}"
									>
										<option value="TOP" selected={exec.level === 'TOP'}>★ ТОП</option>
										<option value="PRO" selected={exec.level === 'PRO'}>● ПРО</option>
										<option value="BEGINNER" selected={exec.level === 'BEGINNER'}>НОВИЧОК</option>
									</select>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
								</form>
							</div>
							<div class="flex items-center gap-4">
								<span class="text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600" title="Активные заявки">
									Заявок: {exec.activeTasksCount}
								</span>
								<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 dark:text-gray-500 transform transition-transform {expandedExecutor === exec.id ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
							</div>
						</div>

						{#if expandedExecutor === exec.id}
							<div class="p-6 space-y-4">
								{#if exec.logisticsTasks.length === 0}
									<p class="text-gray-500 dark:text-gray-400 italic text-sm text-center py-4">Нет назначенных заявок</p>
								{/if}
								{#each exec.logisticsTasks as task}
									{@render taskItem(task, [exec.id])}
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

	{:else}
		<!-- Исполнитель вид -->
		<div class="space-y-4">
			{#if tasks.length === 0}
				<div class="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
					У вас пока нет заявок
				</div>
			{/if}
			{#each tasks as task}
				{@render taskItem(task, [data.user.id])}
			{/each}
		</div>
	{/if}
</div>

{#snippet taskItem(task: Task, currentExecutorIds: string[])}
	<div class="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-gray-800">
		<button onclick={() => toggleTask(task.id)} class="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left">
			<div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
				<span class="font-bold text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded text-xs shrink-0">#{task.number}</span>
				<span class="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{task.address}</span>
				<span class="text-sm text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded shrink-0">{task.timeStart || '??:??'} - {task.timeEnd || '??:??'}</span>
			</div>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 dark:text-gray-500 shrink-0 transform transition-transform {expandedTask === task.id ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
		</button>
		
		{#if expandedTask === task.id}
			<div class="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-5 overflow-x-auto">
				<table class="w-full text-sm text-left border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm table-fixed min-w-[600px]">
					<tbody>
						<tr class="border-b border-gray-100 dark:border-gray-700"><th class="w-48 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Номер</th><td class="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{task.number}</td></tr>
						<tr class="border-b border-gray-100 dark:border-gray-700"><th class="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Дата</th><td class="px-4 py-3 text-gray-900 dark:text-gray-100">{new Date(task.date).toLocaleDateString('ru-RU')}</td></tr>
						<tr class="border-b border-gray-100 dark:border-gray-700"><th class="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Время</th><td class="px-4 py-3 font-mono text-gray-900 dark:text-gray-100">{task.timeStart || '-'} — {task.timeEnd || '-'}</td></tr>
						<tr class="border-b border-gray-100 dark:border-gray-700"><th class="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Адрес</th><td class="px-4 py-3 text-gray-900 dark:text-gray-100">{task.address}</td></tr>
						<tr class="border-b border-gray-100 dark:border-gray-700"><th class="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Логистика</th><td class="px-4 py-3 break-words whitespace-pre-wrap text-gray-900 dark:text-gray-100">{task.logistics || '-'}</td></tr>
						<tr class="border-b border-gray-100 dark:border-gray-700"><th class="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Наполнение сделки</th><td class="px-4 py-3 break-words whitespace-pre-wrap text-gray-900 dark:text-gray-100">{task.dealContent || '-'}</td></tr>
						<tr class="border-b border-gray-100 dark:border-gray-700"><th class="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Комментарий</th><td class="px-4 py-3 break-words whitespace-pre-wrap text-gray-900 dark:text-gray-100">{task.comment || '-'}</td></tr>
						<tr class="border-b border-gray-100 dark:border-gray-700"><th class="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Чек-лист</th><td class="px-4 py-3 break-words whitespace-pre-wrap text-gray-900 dark:text-gray-100">{task.checklist || '-'}</td></tr>
						<tr><th class="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300">Сумма к оплате</th><td class="px-4 py-3 font-bold text-gray-900 dark:text-gray-100">{task.amount} руб.</td></tr>
					</tbody>
				</table>
				{#if data.isManager}
					<div class="mt-4 flex justify-end gap-3">
						<button
							onclick={() => openEdit(task, currentExecutorIds)}
							class="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors"
						>
							Редактировать
						</button>
						<form
							method="POST"
							action="?/deleteTask"
							use:enhance
							onsubmit={(e) => { if (!confirm(`Удалить заявку №${task.number}? Это действие необратимо.`)) e.preventDefault(); }}
						>
							<input type="hidden" name="taskId" value={task.id} />
							<button type="submit" class="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl transition-colors">
								Удалить
							</button>
						</form>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/snippet}

<!-- Edit task modal -->
{#if editingTask}
<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
	<div class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
		<div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 shrink-0">
			<h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Редактировать заявку #{editingTask.number}</h3>
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
				<label class="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Исполнители (с указанием оплаты)</label>
				<div class="space-y-3 max-h-60 overflow-y-auto pr-2">
					{#each executors as exec}
						<div class="space-y-2 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl">
							<label class="flex items-center gap-3 cursor-pointer">
								<input 
									type="checkbox" 
									name="executorIds" 
									value={exec.id} 
									checked={editExecutorIds.includes(exec.id)} 
									onchange={(e) => {
										if (e.currentTarget.checked) {
											editExecutorIds.push(exec.id);
										} else {
											editExecutorIds = editExecutorIds.filter(id => id !== exec.id);
										}
									}}
									class="w-5 h-5 rounded border-gray-300 dark:border-gray-500 text-black focus:ring-black" 
								/>
								<div class="flex items-center gap-2">
									{#if exec.level === 'TOP'}
										<span class="text-[10px] font-bold text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-700">ТОП</span>
									{:else if exec.level === 'PRO'}
										<span class="text-[10px] font-bold text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-700">ПРО</span>
									{/if}
									<span class="font-medium text-gray-800 dark:text-gray-200">{exec.login}</span>
									<span class="text-xs text-gray-500 dark:text-gray-400 ml-1">({exec.activeTasksCount} заявок)</span>
								</div>
							</label>
							{#if editExecutorIds.includes(exec.id)}
								<input 
									type="text" 
									name="payment_{exec.id}" 
									placeholder="Оплата для {exec.login} (обязательно)"
									required
									bind:value={editPayments[exec.id]}
									class="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all shadow-sm"
								/>
							{/if}
						</div>
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
