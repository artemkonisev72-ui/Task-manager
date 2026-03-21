<script lang="ts">
	import type { LayoutData } from './$types';
	import { onMount, onDestroy } from 'svelte';
	import { PUBLIC_VAPID_KEY } from '$env/static/public';
	import { invalidateAll } from '$app/navigation';
	let { data, children }: { data: LayoutData, children: any } = $props();

	let isDark = $state(false);
	let showPasswordModal = $state(false);
	let pwError = $state('');
	let pwSuccess = $state(false);
	let changingPassword = $state(false);

	let showNotifications = $state(false);
	let rejectActionLoading = $state(false);
	let timerInterval: any;
	let pollInterval: any;
	let now = $state(Date.now());

	let notifications = $state(data.notifications || []);
	let pendingAssignments = $state(data.pendingAssignments || []);

	$effect(() => {
		notifications = data.notifications || [];
		pendingAssignments = data.pendingAssignments || [];
	});

	function urlBase64ToUint8Array(base64String: string) {
		const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
		const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
		const rawData = window.atob(base64);
		const outputArray = new Uint8Array(rawData.length);
		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray;
	}

	async function backgroundPoll() {
		try {
			const res = await fetch('/api/ping');
			if (res.ok) {
				const json = await res.json();
				if (json.notifications) notifications = json.notifications;
				if (json.pendingAssignments) pendingAssignments = json.pendingAssignments;
			}
		} catch (e) {}
	}

	async function subscribeToPush() {
		if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
		try {
			const registration = await navigator.serviceWorker.ready;
			const subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
			});
			await fetch('/api/push/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(subscription)
			});
		} catch (e) { console.error('Push subscription failed:', e); }
	}

	onMount(() => {
		isDark = localStorage.getItem('theme') === 'dark' ||
			(!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
		applyTheme();

		if (Notification.permission === 'default') {
			Notification.requestPermission().then(p => {
				if (p === 'granted') subscribeToPush();
			});
		} else if (Notification.permission === 'granted') {
			subscribeToPush();
		}

		timerInterval = setInterval(() => { now = Date.now(); }, 1000);
		pollInterval = setInterval(backgroundPoll, 30000);
	});

	onDestroy(() => {
		if (timerInterval) clearInterval(timerInterval);
		if (pollInterval) clearInterval(pollInterval);
	});

	function applyTheme() {
		if (isDark) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
		localStorage.setItem('theme', isDark ? 'dark' : 'light');
	}

	function toggleTheme() {
		isDark = !isDark;
		applyTheme();
	}

	async function handlePasswordChange(e: SubmitEvent) {
		e.preventDefault();
		pwError = '';
		pwSuccess = false;
		changingPassword = true;
		const form = e.target as HTMLFormElement;
		const formData = new FormData(form);
		try {
			const res = await fetch('/change-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					oldPassword: formData.get('oldPassword'),
					newPassword: formData.get('newPassword')
				})
			});
			const result = await res.json();
			if (res.ok && result.success) {
				pwSuccess = true;
				form.reset();
				setTimeout(() => { showPasswordModal = false; pwSuccess = false; }, 1500);
			} else {
				pwError = result.error || 'Произошла ошибка';
			}
		} catch {
			pwError = 'Ошибка сети';
		} finally {
			changingPassword = false;
		}
	}

	async function respondToAssignment(taskId: string, action: 'ACCEPT' | 'REJECT') {
		if (!confirm('Вы уверены?')) return;
		rejectActionLoading = true;
		try {
			const res = await fetch('/api/assignments', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ taskId, action })
			});
			if (res.ok) {
				await invalidateAll();
			} else {
				alert('Ошибка при выполнении действия');
			}
		} catch (e) {
			alert('Ошибка связи с сервером');
		} finally {
			rejectActionLoading = false;
		}
	}

	function formatTimeRemaining(rejectAtMs: number) {
		const diff = Math.max(0, rejectAtMs - now);
		if (diff === 0) return '00:00:00';
		
		const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
		const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
		const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
		return `${h}:${m}:${s}`;
	}
	async function toggleNotifications() {
		showNotifications = !showNotifications;
		if (showNotifications && notifications.some(n => !n.read)) {
			notifications = notifications.map(n => ({...n, read: true}));
			fetch('/api/notifications/read', { method: 'POST' }).catch(() => {});
		}
	}
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col md:flex-row font-sans transition-colors duration-200">
	<!-- Sidebar -->
	<aside class="w-full md:w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 flex flex-col p-6 shadow-sm z-10 transition-colors duration-200">
		<div class="mb-10 w-full flex items-center justify-between">
			<div class="w-12 h-12 bg-black dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center shadow-md">
				<span class="font-bold text-2xl tracking-tighter">LM</span>
			</div>
			
			{#if data.user.role === 'ADMIN' || data.user.role === 'MANAGER'}
				<div class="relative">
					<button onclick={toggleNotifications} class="relative p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors bg-gray-50 dark:bg-gray-700 rounded-xl" aria-label="Уведомления">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
						{#if notifications?.filter(n => !n.read).length > 0}
							<span class="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
						{/if}
					</button>

					{#if showNotifications}
						<div class="absolute top-12 left-0 md:-left-2 w-72 md:w-80 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl rounded-2xl z-50 overflow-hidden">
							<div class="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
								<h3 class="font-bold text-gray-900 dark:text-gray-100">Уведомления</h3>
								<button onclick={() => showNotifications = false} class="text-xs font-semibold text-gray-500 hover:text-black dark:hover:text-white">Закрыть</button>
							</div>
							<div class="max-h-[290px] overflow-y-auto w-full divide-y divide-gray-50 dark:divide-gray-700/50 custom-scrollbar">
								{#if notifications?.length === 0}
									<p class="p-6 text-center text-sm text-gray-500 dark:text-gray-400">Нет уведомлений</p>
								{:else}
									{#each notifications || [] as notif}
										<div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 block">
											<p class="text-xs font-bold text-gray-900 dark:text-gray-100 mb-1">{notif.title}</p>
											<p class="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{notif.message}</p>
											<p class="text-[10px] text-gray-400 mt-2 font-mono">{new Date(notif.createdAt).toLocaleString('ru-RU')}</p>
										</div>
									{/each}
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<nav class="flex-1 space-y-2">
			<a href="/logistics" class="block px-4 py-3 rounded-2xl font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
				{data.user.role === 'EXECUTOR' ? 'Мои заявки' : 'Исполнители'}
			</a>
			<a href="/requests" class="block px-4 py-3 rounded-2xl font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
				Заявки
			</a>
			{#if data.user.role === 'ADMIN' || data.user.role === 'MANAGER'}
			<a href="/users" class="block px-4 py-3 rounded-2xl font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
				Пользователи
			</a>
			{/if}
		</nav>

		<div class="pt-6 border-t border-gray-100 dark:border-gray-700 mt-auto">
			<div class="flex items-center gap-3 mb-4">
				<div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold border border-gray-200 dark:border-gray-600 shadow-inner">
					{data.user.login[0].toUpperCase()}
				</div>
				<div class="overflow-hidden">
					<p class="text-sm font-semibold truncate text-gray-800 dark:text-gray-100">{data.user.login}</p>
					<p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{data.user.role === 'ADMIN' ? 'Администратор' : data.user.role === 'MANAGER' ? 'Менеджер' : 'Исполнитель'}</p>
				</div>
			</div>
			<div class="space-y-2">
				<!-- Theme toggle -->
				<button
					onclick={toggleTheme}
					class="w-full py-2.5 text-sm text-center font-medium bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600 flex items-center justify-center gap-2"
					aria-label="Переключить тему"
				>
					{#if isDark}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M18.364 18.364l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
						Светлая тема
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
						Тёмная тема
					{/if}
				</button>
				<button onclick={() => { showPasswordModal = true; pwError = ''; pwSuccess = false; }} class="w-full py-2.5 text-sm text-center font-medium bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600">Сменить пароль</button>
				<form method="POST" action="/logout">
					<button class="w-full py-2.5 text-sm text-center font-medium bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors shadow-sm">Выйти</button>
				</form>
			</div>
		</div>
	</aside>

	<!-- Main Content -->
	<main class="flex-1 p-6 md:p-10 overflow-auto h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
		{@render children()}
	</main>
</div>

{#if showPasswordModal}
<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
	<div class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-sm overflow-hidden">
		<div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
			<h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">Смена пароля</h3>
			<button onclick={() => showPasswordModal = false} class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Закрыть">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
			</button>
		</div>
		<form onsubmit={handlePasswordChange} class="p-6 space-y-4">
			<div>
				<label for="old-pw" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Текущий пароль</label>
				<input id="old-pw" name="oldPassword" type="password" required class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-gray-600 focus:border-black dark:focus:border-gray-400 outline-none transition-colors" />
			</div>
			<div>
				<label for="new-pw" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Новый пароль (мин. 6)</label>
				<input id="new-pw" name="newPassword" type="password" required minlength="6" class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 focus:bg-white dark:focus:bg-gray-600 focus:border-black dark:focus:border-gray-400 outline-none transition-colors" />
			</div>
			{#if pwError}<p class="text-red-500 dark:text-red-400 text-sm">{pwError}</p>{/if}
			{#if pwSuccess}<p class="text-green-600 dark:text-green-400 text-sm font-medium">Пароль успешно изменён!</p>{/if}
			<button type="submit" disabled={changingPassword} class="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50">
				{changingPassword ? 'Сохранение...' : 'Сменить'}
			</button>
		</form>
	</div>
</div>
{/if}

<!-- Executor Pending Assignment Modal -->
{#if data.user.role === 'EXECUTOR' && pendingAssignments?.length > 0}
	{@const currentAssignment = pendingAssignments[0]}
	{@const task = currentAssignment.task}
	<div class="fixed inset-0 z-100 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
		<div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
			
			<div class="p-6 md:p-8 text-center bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30 shrink-0">
				<div class="w-16 h-16 bg-blue-500 text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
				</div>
				<h2 class="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Вам назначена новая заявка!</h2>
				<p class="text-gray-600 dark:text-gray-300 font-medium">Пожалуйста, ознакомьтесь с деталями и примите решение.</p>
			</div>

			<div class="p-6 md:p-8 overflow-y-auto">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm text-gray-900 dark:text-white">
					<div><p class="text-gray-500 dark:text-gray-400 font-semibold mb-1">Номер:</p><p class="font-bold">#{task.number}</p></div>
					<div><p class="text-gray-500 dark:text-gray-400 font-semibold mb-1">Время:</p><p class="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded inline-block">{new Date(task.date).toLocaleDateString('ru-RU')} {task.timeStart} - {task.timeEnd}</p></div>
					<div class="md:col-span-2"><p class="text-gray-500 dark:text-gray-400 font-semibold mb-1">Адрес:</p><p class="font-medium bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700 wrap-break-word whitespace-pre-wrap">{task.address}</p></div>
					<div class="md:col-span-2"><p class="text-gray-500 dark:text-gray-400 font-semibold mb-1">Логистика:</p><p class="bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700 wrap-break-word whitespace-pre-wrap">{task.logistics}</p></div>
					<div class="md:col-span-2"><p class="text-gray-500 dark:text-gray-400 font-semibold mb-1">Наполнение:</p><p class="bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700 wrap-break-word whitespace-pre-wrap">{task.dealContent}</p></div>
					{#if task.comment}<div class="md:col-span-2"><p class="text-gray-500 dark:text-gray-400 font-semibold mb-1">Комментарий:</p><p class="bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700 wrap-break-word whitespace-pre-wrap">{task.comment}</p></div>{/if}
					{#if task.checklist}<div class="md:col-span-2"><p class="text-gray-500 dark:text-gray-400 font-semibold mb-1">Чек-лист:</p><p class="bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700 wrap-break-word whitespace-pre-wrap">{task.checklist}</p></div>{/if}
				</div>
			</div>

			<div class="p-6 md:p-8 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center gap-4 justify-between shrink-0">
					
					<div class="flex items-center gap-2.5 w-full md:w-auto bg-red-50 dark:bg-red-900/10 px-4 py-3 rounded-2xl border border-red-100 dark:border-red-900/30">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500 animate-pulse shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
						<div class="flex flex-col">
							<span class="text-[10px] font-bold text-red-500 uppercase tracking-wider">До автоотклонения</span>
							<span class="text-lg font-black font-mono text-red-600 dark:text-red-400">{formatTimeRemaining(new Date(currentAssignment.autoRejectAt).getTime())}</span>
						</div>
					</div>

					<div class="flex items-center gap-3 w-full md:w-auto">
						<button 
							disabled={rejectActionLoading}
							onclick={() => respondToAssignment(task.id, 'REJECT')}
							class="flex-1 md:flex-none px-6 py-3.5 bg-white dark:bg-gray-700 border-2 border-red-500 dark:border-red-400 text-red-600 dark:text-red-400 font-bold rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95 transition-all text-sm uppercase tracking-wide disabled:opacity-50"
						>ОТКЛОНИТЬ</button>
						
						<button 
							disabled={rejectActionLoading}
							onclick={() => respondToAssignment(task.id, 'ACCEPT')}
							class="flex-1 md:flex-none px-8 py-3.5 bg-green-500 dark:bg-green-600 text-white font-bold rounded-2xl border-2 border-green-500 dark:border-green-600 hover:bg-green-600 dark:hover:bg-green-700 shadow-xl shadow-green-500/20 active:scale-95 transition-all text-sm uppercase tracking-wide disabled:opacity-50"
						>ПРИНЯТЬ</button>
					</div>

				</div>
			
		</div>
	</div>
{/if}
