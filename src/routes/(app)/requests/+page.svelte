<script lang="ts">
	import { onMount, tick } from 'svelte';
	let { data } = $props();

	// Build set of dates that have tasks
	function getTaskDates(): Set<string> {
		const s = new Set<string>();
		for (const task of data.tasks) {
			s.add(new Date(task.date).toISOString().split('T')[0]);
		}
		return s;
	}

	// Build continuous date range from earliest to latest task date
	function buildDateRange(): string[] {
		if (data.tasks.length === 0) return [];
		const taskDates = getTaskDates();
		const sorted = [...taskDates].sort();
		const start = new Date(sorted[0] + 'T00:00:00');
		const end = new Date(sorted[sorted.length - 1] + 'T00:00:00');
		const result: string[] = [];
		const cur = new Date(start);
		while (cur <= end) {
			result.push(cur.toISOString().split('T')[0]);
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
		return new Date().toISOString().split('T')[0];
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
    <title>Заявки - Task Manager</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-6 pb-12">
	<h1 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Заявки</h1>

	{#if dates.length === 0}
		<div class="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
			Нет созданных задач
		</div>
	{:else}
		<!-- Date slider -->
		<div
			bind:this={dateSlider}
			class="flex gap-2 overflow-x-auto pb-3 px-1 -mx-1"
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
				{tasksForDate.length} {tasksForDate.length === 1 ? 'задача' : tasksForDate.length >= 2 && tasksForDate.length <= 4 ? 'задачи' : 'задач'}
			</span>
		</div>

		<!-- Tasks -->
		{#if tasksForDate.length === 0}
			<div class="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
				Нет задач на эту дату
			</div>
		{:else}
			<div class="space-y-4">
				{#each tasksForDate as task}
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
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
