<script lang="ts">
	import type { LayoutData } from './$types';
	import { onMount } from 'svelte';
	let { data, children }: { data: LayoutData, children: any } = $props();

	let isDark = $state(false);
	let showPasswordModal = $state(false);
	let pwError = $state('');
	let pwSuccess = $state(false);
	let changingPassword = $state(false);

	onMount(() => {
		isDark = localStorage.getItem('theme') === 'dark' ||
			(!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
		applyTheme();
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
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col md:flex-row font-sans transition-colors duration-200">
	<!-- Sidebar -->
	<aside class="w-full md:w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 flex flex-col p-6 shadow-sm z-10 transition-colors duration-200">
		<div class="mb-10 w-12 h-12 bg-black dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center shadow-md">
			<span class="font-bold text-2xl tracking-tighter">TM</span>
		</div>

		<nav class="flex-1 space-y-2">
			<a href="/logistics" class="block px-4 py-3 rounded-2xl font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
				Исполнители
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
