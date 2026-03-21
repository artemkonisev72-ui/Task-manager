<script lang="ts">
	let { form } = $props();
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
	<div class="w-full max-w-sm bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
		<div class="text-center mb-8">
			<h1 class="text-2xl font-semibold tracking-tight text-gray-900">Создать аккаунт</h1>
			<p class="text-sm text-gray-500 mt-2">Заявка за заявкой</p>
		</div>

		<form method="POST" class="space-y-4">
			<div>
				<label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					required
					value={form?.email ?? ''}
					class="w-full px-4 py-3 bg-gray-50 border-transparent rounded-2xl focus:border-black focus:ring-0 focus:bg-white transition-colors"
					placeholder="вы@пример.com"
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					class="w-full px-4 py-3 bg-gray-50 border-transparent rounded-2xl focus:border-black focus:ring-0 focus:bg-white transition-colors"
					placeholder="Минимум 6 символов"
				/>
				{#if form?.missing}
					<p class="text-red-500 text-xs mt-2">Пожалуйста, проверьте введённые данные.</p>
				{/if}
				{#if form?.exists}
					<p class="text-red-500 text-xs mt-2">Пользователь с таким email уже существует.</p>
				{/if}
				{#if form?.error}
					<p class="text-red-500 text-xs mt-2">Server Error: {form.error}</p>
				{/if}
			</div>

			<button
				type="submit"
				class="w-full py-3 bg-black hover:bg-gray-800 text-white font-medium rounded-2xl transition-colors mt-6"
			>
				Зарегистрироваться
			</button>
		</form>

		<p class="text-center text-sm text-gray-500 mt-6">
			Уже есть аккаунт? <a href="/login" class="text-black font-medium hover:underline">Войти</a>
		</p>
	</div>
</div>
