<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();

	let showCreateModal = $state(false);
</script>

<svelte:head>
    <title>Пользователи - Task Manager</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-8">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold tracking-tight text-gray-900">Управление пользователями</h1>
		<button onclick={() => showCreateModal = true} class="bg-black text-white px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-sm">
			+ Новый пользователь
		</button>
	</div>

	{#if form?.error}
		<div class="p-4 bg-red-50 text-red-600 rounded-2xl text-sm">{form.error}</div>
	{/if}

	<div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-left border-collapse">
				<thead>
					<tr class="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
						<th class="px-6 py-4">Логин</th>
						<th class="px-6 py-4">Дата регистрации</th>
						<th class="px-6 py-4">Текущая роль</th>
						<th class="px-6 py-4 text-right">Действия</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-50">
					{#each data.users as u}
						<tr class="hover:bg-gray-50 transition-colors group">
							<td class="px-6 py-4">
								<div class="flex items-center gap-3">
									<div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold border border-gray-200 text-gray-700">
										{u.login[0].toUpperCase()}
									</div>
									<span class="font-medium text-gray-900">{u.login}</span>
								</div>
							</td>
							<td class="px-6 py-4 text-sm text-gray-500">
								{new Date(u.createdAt).toLocaleDateString('ru-RU')}
							</td>
							<td class="px-6 py-4">
								<span class="inline-flex items-center px-2.5 py-1 text-xs font-medium
									{u.role === 'ADMIN' ? 'text-black' : 
									u.role === 'MANAGER' ? 'text-blue-600' : 'text-gray-500'}">
									{u.role === 'ADMIN' ? 'Администратор' : u.role === 'MANAGER' ? 'Менеджер' : 'Исполнитель'}
								</span>
							</td>
							<td class="px-6 py-4 text-right">
								{#if u.id !== data.user.id && u.role !== 'ADMIN' && data.user.role === 'ADMIN'}
									<form method="POST" action="?/toggleRole" use:enhance class="inline-block">
										<input type="hidden" name="userId" value={u.id} />
										{#if u.role === 'MANAGER'}
											<button class="text-sm font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors text-nowrap">
												Снять права
											</button>
										{:else}
											<button class="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors text-nowrap">
												Сделать менеджером
											</button>
										{/if}
									</form>
								{:else if u.role === 'ADMIN'}
									<span class="text-sm text-gray-400 italic">Полный доступ</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

{#if showCreateModal}
<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
	<div class="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden">
		<div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
			<h3 class="text-xl font-bold text-gray-900">Новый пользователь</h3>
			<button onclick={() => showCreateModal = false} class="text-gray-400 hover:text-gray-600" aria-label="Закрыть">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
			</button>
		</div>
		
		<form method="POST" action="?/createUser" use:enhance class="p-6 space-y-5">
			<div>
				<label for="new-login" class="block text-sm font-semibold text-gray-700 mb-1">Логин</label>
				<input id="new-login" name="login" required class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:bg-white focus:border-black outline-none transition-colors" placeholder="ivanov" />
			</div>
			<div>
				<label for="new-password" class="block text-sm font-semibold text-gray-700 mb-1">Пароль (мин. 6 символов)</label>
				<input id="new-password" name="password" type="password" required minlength="6" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:bg-white focus:border-black outline-none transition-colors" placeholder="••••••" />
			</div>
			<div>
				<label for="new-role" class="block text-sm font-semibold text-gray-700 mb-1">Роль</label>
				{#if data.user.role === 'ADMIN'}
					<select id="new-role" name="role" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:bg-white focus:border-black outline-none transition-colors">
						<option value="EXECUTOR">Исполнитель</option>
						<option value="MANAGER">Менеджер</option>
					</select>
				{:else}
					<input type="hidden" name="role" value="EXECUTOR" />
					<p class="text-sm text-gray-500">Исполнитель (менеджеры могут создавать только исполнителей)</p>
				{/if}
			</div>
			<button type="submit" class="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-md mt-2">Создать</button>
		</form>
	</div>
</div>
{/if}
