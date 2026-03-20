<script lang="ts">
	import type { LayoutData } from './$types';
	let { data, children }: { data: LayoutData, children: any } = $props();

	let showPasswordModal = $state(false);
	let pwError = $state('');
	let pwSuccess = $state(false);
	let changingPassword = $state(false);

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

<div class="min-h-screen bg-gray-50 text-gray-900 flex flex-col md:flex-row font-sans">
	<!-- Sidebar -->
	<aside class="w-full md:w-64 bg-white border-r border-gray-100 flex flex-col p-6 shadow-sm z-10">
		<div class="mb-10 w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-md">
			<span class="font-bold text-2xl tracking-tighter">TM</span>
		</div>

		<nav class="flex-1 space-y-2">
            <a href="/logistics" class="block px-4 py-3 rounded-2xl font-medium transition-all hover:bg-gray-50 hover:text-gray-900 text-gray-600">
                Задачи логистики
            </a>
            {#if data.user.role === 'ADMIN' || data.user.role === 'MANAGER'}
            <a href="/users" class="block px-4 py-3 rounded-2xl font-medium transition-all hover:bg-gray-50 hover:text-gray-900 text-gray-600">
                Пользователи
            </a>
            {/if}
		</nav>

		<div class="pt-6 border-t border-gray-100 mt-auto">
			<div class="flex items-center gap-3 mb-4">
				<div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold border border-gray-200 shadow-inner">
					{data.user.login[0].toUpperCase()}
				</div>
				<div class="overflow-hidden">
					<p class="text-sm font-semibold truncate text-gray-800">{data.user.login}</p>
					<p class="text-xs text-gray-500 mt-0.5">{data.user.role === 'ADMIN' ? 'Администратор' : data.user.role === 'MANAGER' ? 'Менеджер' : 'Исполнитель'}</p>
				</div>
			</div>
			<div class="space-y-2">
				<button onclick={() => { showPasswordModal = true; pwError = ''; pwSuccess = false; }} class="w-full py-2.5 text-sm text-center font-medium bg-gray-50 text-gray-700 rounded-2xl hover:bg-gray-100 transition-colors border border-gray-200">Сменить пароль</button>
				<form method="POST" action="/logout">
					<button class="w-full py-2.5 text-sm text-center font-medium bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors shadow-sm">Выйти</button>
				</form>
			</div>
		</div>
	</aside>

	<!-- Main Content -->
	<main class="flex-1 p-6 md:p-10 overflow-auto h-screen bg-gray-50">
		{@render children()}
	</main>
</div>

{#if showPasswordModal}
<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
	<div class="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden">
		<div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
			<h3 class="text-lg font-bold text-gray-900">Смена пароля</h3>
			<button onclick={() => showPasswordModal = false} class="text-gray-400 hover:text-gray-600" aria-label="Закрыть">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
			</button>
		</div>

		<form onsubmit={handlePasswordChange} class="p-6 space-y-4">
			<div>
				<label for="old-pw" class="block text-sm font-semibold text-gray-700 mb-1">Текущий пароль</label>
				<input id="old-pw" name="oldPassword" type="password" required class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:bg-white focus:border-black outline-none transition-colors" />
			</div>
			<div>
				<label for="new-pw" class="block text-sm font-semibold text-gray-700 mb-1">Новый пароль (мин. 6)</label>
				<input id="new-pw" name="newPassword" type="password" required minlength="6" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:bg-white focus:border-black outline-none transition-colors" />
			</div>
			{#if pwError}
				<p class="text-red-500 text-sm">{pwError}</p>
			{/if}
			{#if pwSuccess}
				<p class="text-green-600 text-sm font-medium">Пароль успешно изменён!</p>
			{/if}
			<button type="submit" disabled={changingPassword} class="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors disabled:opacity-50">
				{changingPassword ? 'Сохранение...' : 'Сменить'}
			</button>
		</form>
	</div>
</div>
{/if}
