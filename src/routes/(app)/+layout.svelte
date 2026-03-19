<script lang="ts">
	import type { LayoutData } from './$types';
	let { data, children }: { data: LayoutData, children: any } = $props();
</script>

<div class="min-h-screen bg-gray-50 text-gray-900 flex flex-col md:flex-row font-sans">
	<!-- Sidebar -->
	<aside class="w-full md:w-64 bg-white border-r border-gray-100 flex flex-col p-6 shadow-sm z-10">
		<div class="mb-10 w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-md">
			<span class="font-bold text-2xl tracking-tighter">TM</span>
		</div>

		<nav class="flex-1 space-y-2">
			<a href="/boards" class="block px-4 py-3 rounded-2xl font-medium transition-all hover:bg-gray-50 hover:text-gray-900 text-gray-600">
				Мои доски
			</a>
            <a href="/logistics" class="block px-4 py-3 rounded-2xl font-medium transition-all hover:bg-gray-50 hover:text-gray-900 text-gray-600">
                Задачи логистики
            </a>
            {#if data.user.role === 'ADMIN'}
            <a href="/users" class="block px-4 py-3 rounded-2xl font-medium transition-all hover:bg-gray-50 hover:text-gray-900 text-gray-600">
                Пользователи
            </a>
            {/if}
		</nav>

		<div class="pt-6 border-t border-gray-100 mt-auto">
			<div class="flex items-center gap-3 mb-6">
				<div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold border border-gray-200 shadow-inner">
					{data.user.email[0].toUpperCase()}
				</div>
				<div class="overflow-hidden">
					<p class="text-sm font-semibold truncate text-gray-800">{data.user.email}</p>
					<p class="text-xs text-gray-500 mt-0.5">{data.user.role === 'ADMIN' ? 'Администратор' : data.user.role === 'MANAGER' ? 'Менеджер' : 'Исполнитель'}</p>
				</div>
			</div>
			<form method="POST" action="/logout">
				<button class="w-full py-3 text-sm text-center font-medium bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors shadow-sm">Выйти</button>
			</form>
		</div>
	</aside>

	<!-- Main Content -->
	<main class="flex-1 p-6 md:p-10 overflow-auto h-screen bg-gray-50">
		{@render children()}
	</main>
</div>
