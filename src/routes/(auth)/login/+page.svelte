<script lang="ts">
	let { form } = $props();
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-200">
	<div class="w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
		<div class="text-center mb-8">
			<h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">С возвращением</h1>
			<p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Войдите в свой аккаунт</p>
		</div>

		<form method="POST" class="space-y-4">
			<div>
				<label for="login" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Логин</label>
				<input
					id="login"
					name="login"
					type="text"
					required
					value={form?.login ?? ''}
					class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-transparent dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-2xl focus:border-black dark:focus:border-gray-400 focus:ring-0 focus:bg-white dark:focus:bg-gray-600 transition-colors"
					placeholder="Ваш логин"
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Пароль</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-transparent dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-2xl focus:border-black dark:focus:border-gray-400 focus:ring-0 focus:bg-white dark:focus:bg-gray-600 transition-colors"
					placeholder="Ваш пароль"
				/>
				{#if form?.missing}
					<p class="text-red-500 dark:text-red-400 text-xs mt-2">Заполните все поля.</p>
				{/if}
				{#if form?.incorrect}
					<p class="text-red-500 dark:text-red-400 text-xs mt-2">Неверный логин или пароль.</p>
				{/if}
				{#if form?.error}
					<p class="text-red-500 dark:text-red-400 text-xs mt-2">Ошибка сервера: {form.error}</p>
				{/if}
			</div>

			<button
				type="submit"
				class="w-full py-3 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-black font-medium rounded-2xl transition-colors mt-6"
			>
				Войти
			</button>
		</form>
	</div>
</div>
