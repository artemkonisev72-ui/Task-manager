<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { enhance } from '$app/forms';
	let { data, form } = $props();
	
	let showModal = $state(false);

	let editingTask = $state<any>(null);
	let editExecutorIds = $state<string[]>([]);

	let searchQuery = $state('');
	
	let searchResults = $derived(
		searchQuery.trim().length > 0 
        ? data.tasks.filter((t: any) => {
            const q = searchQuery.toLowerCase();
            return (t.number && t.number.toLowerCase().includes(q)) ||
                   (t.address && t.address.toLowerCase().includes(q)) ||
                   (t.comment && t.comment.toLowerCase().includes(q));
        })
        : []
	);

	function openEdit(task: any, currentExecutorIds: string[]) {
		editingTask = task;
		editExecutorIds = [...currentExecutorIds];
	}
	function closeEdit() {
		editingTask = null;
		editExecutorIds = [];
	}

	function formatDateForInput(date: Date | string) {
		return new Date(date).toISOString().split('T')[0];
	}

	// Build set of dates that have tasks
	function getTaskDates(): Set<string> {
		const s = new Set<string>();
		for (const task of data.tasks) {
			s.add(new Date(task.date).toISOString().split('T')[0]);
		}
		return s;
	}

	// Build continuous date range from today - 3 to today + 30
	function buildDateRange(): string[] {
		const start = new Date();
		start.setDate(start.getDate() - 3);
		
		const end = new Date();
		end.setDate(end.getDate() + 30);
		
		const result: string[] = [];
		const cur = new Date(start);
		const pad = (n: number) => n.toString().padStart(2, '0');
		
		while (cur <= end) {
			result.push(`${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`);
			cur.setDate(cur.getDate() + 1);
		}
		return result;
	}

	let taskDatesSet = $derived(getTaskDates());
	let dates = $derived(buildDateRange());
	let selectedDate = $state('');
	let dateSlider: HTMLDivElement | undefined = $state(undefined);

	// Accordion
	let expandedTask = $state<string | null>(null);
	function toggleTask(id: string) {
		expandedTask = expandedTask === id ? null : id;
	}

	// Tasks for the selected date
	let tasksForDate = $derived(
		data.tasks.filter((t: any) => new Date(t.date).toISOString().split('T')[0] === selectedDate)
	);

	function hasTasks(iso: string): boolean {
		return taskDatesSet.has(iso);
	}

	// Format helpers
	function formatDateShort(iso: string) {
		const d = new Date(iso + 'T00:00:00');
		return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
	}
	function formatWeekday(iso: string) {
		const d = new Date(iso + 'T00:00:00');
		return d.toLocaleDateString('ru-RU', { weekday: 'short' });
	}
	function formatDateFull(iso: string) {
		const d = new Date(iso + 'T00:00:00');
		return d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
	}
	function todayISO() {
		const d = new Date();
		const pad = (n: number) => n.toString().padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
	}
	function isToday(iso: string) {
		return iso === todayISO();
	}
	function isPast(iso: string) {
		return iso < todayISO();
	}

	onMount(async () => {
		const today = todayISO();
		if (dates.includes(today)) {
			selectedDate = today;
		} else {
			const future = dates.find(d => d >= today);
			selectedDate = future || dates[dates.length - 1] || '';
		}

		await tick();
		scrollToSelected();
	});

	function scrollToSelected() {
		if (!dateSlider) return;
		const activeEl = dateSlider.querySelector('[data-active="true"]') as HTMLElement | null;
		if (activeEl) {
			activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
		}
	}

	function selectDate(iso: string) {
		selectedDate = iso;
		expandedTask = null;
		tick().then(scrollToSelected);
	}
</script>

<svelte:head>
    <title>Заявки - Logistics Manager</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-6 pb-12">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Заявки</h1>
		{#if data.isManager}
			<button onclick={() => showModal = true} class="bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm shrink-0">
				+ Новая заявка
			</button>
		{/if}
	</div>

	{#if data.isManager}
		<div class="relative">
			<svg xmlns="http://www.w3.org/2000/svg" class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
			<input type="text" bind:value={searchQuery} placeholder="Поиск заявок по номеру, адресу или комментарию..." class="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow text-sm shadow-sm" />
		</div>
	{/if}

	{#if form?.error}
		<div class="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl text-sm">{form.error}</div>
	{/if}

	{#if dates.length === 0}
		<div class="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
			Нет созданных заявок
		</div>
	{:else if searchQuery.trim().length > 0}
		<!-- Search Results Header -->
		<div class="flex items-center gap-3 w-full">
			<h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Результаты поиска</h2>
			<span class="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 rounded-full font-medium">
				{searchResults.length} {searchResults.length === 1 ? 'совпадение' : searchResults.length >= 2 && searchResults.length <= 4 ? 'совпадения' : 'совпадений'}
			</span>
		</div>

		{#if searchResults.length === 0}
			<div class="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
				Ничего не найдено по вашему запросу
			</div>
		{:else}
			<div class="space-y-4">
				{#each searchResults as task}
					{@render taskCard(task)}
				{/each}
			</div>
		{/if}
	{:else}
		<!-- Date slider -->
		<div
			bind:this={dateSlider}
			class="flex gap-2 overflow-x-auto pb-3 pt-1 px-2 -mx-2"
			style="scroll-behavior: smooth;"
		>
			{#each dates as d}
				<button
					data-active={selectedDate === d ? 'true' : 'false'}
					onclick={() => selectDate(d)}
					class="shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border min-w-[54px]
						{selectedDate === d
							? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-md'
							: isPast(d)
								? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
								: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}
						{isToday(d) && selectedDate !== d ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''}"
				>
					<span class="text-[10px] uppercase opacity-70">{formatWeekday(d)}</span>
					<span class="text-sm">{formatDateShort(d)}</span>
					{#if isToday(d)}
						<span class="text-[9px] opacity-60 mt-0.5">сегодня</span>
					{:else if hasTasks(d)}
						<span class="w-1.5 h-1.5 rounded-full mt-1 {selectedDate === d ? 'bg-white dark:bg-black' : 'bg-blue-500 dark:bg-blue-400'}"></span>
					{/if}
				</button>
			{/each}
		</div>

		<!-- Selected date heading -->
		<div class="flex items-center gap-3">
			<h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200 capitalize">{formatDateFull(selectedDate)}</h2>
			<span class="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 rounded-full font-medium">
				{tasksForDate.length} {tasksForDate.length === 1 ? 'заявка' : tasksForDate.length >= 2 && tasksForDate.length <= 4 ? 'заявки' : 'заявок'}
			</span>
		</div>

		<!-- Tasks -->
		{#if tasksForDate.length === 0}
			<div class="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
				Нет заявок на эту дату
			</div>
		{:else}
			<div class="space-y-4">
				{#each tasksForDate as task}
					{@render taskCard(task)}
				{/each}
			</div>
		{/if}
	{/if}
</div>

{#snippet taskCard(task)}
	<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
		<!-- Header -->
		<button onclick={() => toggleTask(task.id)} class="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left">
			<div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 flex-1 min-w-0">
				<span class="font-bold text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-2.5 py-1 rounded text-xs shrink-0">#{task.number}</span>
				<span class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{task.address}</span>
				<span class="text-sm text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded shrink-0">{task.timeStart} — {task.timeEnd}</span>
			</div>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 dark:text-gray-500 shrink-0 ml-3 transform transition-transform {expandedTask === task.id ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
		</button>

		<!-- Executors bar -->
		<div class="px-6 pb-4 flex flex-wrap gap-2">
			{#each task.executors as exec}
				<span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full border border-blue-200 dark:border-blue-800">
					<span class="w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-700 flex items-center justify-center text-[9px] font-bold text-blue-800 dark:text-blue-200">{exec.login[0].toUpperCase()}</span>
					{exec.login}
				</span>
			{/each}
		</div>

		<!-- Expanded details -->
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
				{#if data.isManager}
					<div class="mt-4 flex justify-end gap-3">
						<button
							onclick={() => openEdit(task, task.executors.map((e: any) => e.id))}
							class="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors"
						>
							Редактировать
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/snippet}

<!-- Create task modal -->
{#if showModal}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
			<div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 shrink-0">
				<h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Новая заявка</h3>
				<button onclick={() => showModal = false} class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Закрыть">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
				</button>
			</div>
			<form method="POST" action="/logistics?/createTask" use:enhance class="flex-1 overflow-y-auto p-6 space-y-5">
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
					<button type="submit" class="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md">Создать заявку</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Edit request modal -->
{#if editingTask}
<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
	<div class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
		<div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 shrink-0">
			<h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Редактировать заявку #{editingTask.number}</h3>
			<button onclick={closeEdit} class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Закрыть">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
			</button>
		</div>
		<form method="POST" action="/logistics?/updateTask" use:enhance={() => { return async ({ result, update }) => { await update(); if (result.type !== 'failure') closeEdit(); }; }} class="flex-1 overflow-y-auto p-6 space-y-5">
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
