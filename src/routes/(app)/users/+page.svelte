<script lang="ts">
	import { enhance } from '$app/forms';
	let { data, form } = $props();
</script>

<svelte:head>
    <title>Пользователи - Task Manager</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-8">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold tracking-tight text-gray-900">Управление пользователями</h1>
	</div>

	{#if form?.error}
		<div class="p-4 bg-red-50 text-red-600 rounded-2xl mb-6 text-sm">{form.error}</div>
	{/if}

	<div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-left border-collapse">
				<thead>
					<tr class="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
						<th class="px-6 py-4">Пользователь (Email)</th>
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
										{u.email[0].toUpperCase()}
									</div>
									<span class="font-medium text-gray-900">{u.email}</span>
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
								{#if u.id !== data.user.id && u.role !== 'ADMIN'}
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
