<script lang="ts">
	import { enhance } from '$app/forms';
	let { data } = $props();

	let draggedTaskId: string | null = $state(null);

	function handleDragStart(e: DragEvent, taskId: string) {
		draggedTaskId = taskId;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', taskId);
		}
	}

	function handleDrop(e: DragEvent, columnId: string, formElement: HTMLFormElement) {
		e.preventDefault();
		if (draggedTaskId) {
			const inputTaskId = formElement.querySelector('[name=taskId]') as HTMLInputElement;
			const inputColId = formElement.querySelector('[name=columnId]') as HTMLInputElement;
			inputTaskId.value = draggedTaskId;
			inputColId.value = columnId;
			formElement.requestSubmit();
		}
		draggedTaskId = null;
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
	}
</script>

<svelte:head>
    <title>{data.board.title} - Task Manager</title>
</svelte:head>

<div class="max-w-[100vw] h-[calc(100vh-80px)] overflow-hidden flex flex-col">
	<div class="flex items-center justify-between mb-8 shrink-0 px-1">
		<h1 class="text-3xl font-bold tracking-tight text-gray-900">{data.board.title}</h1>
        <a href="/boards" class="text-gray-500 hover:text-black font-medium text-sm transition-colors">&larr; Вернуться к доскам</a>
	</div>

	<!-- Kanban Board -->
	<div class="flex-1 overflow-x-auto flex gap-6 pb-6 items-start">
		{#each data.board.columns as column}
			<div class="w-80 shrink-0 bg-gray-100 rounded-3xl p-4 flex flex-col max-h-full border border-gray-200 shadow-sm">
				<h3 class="font-semibold text-gray-800 px-2 mb-4 flex justify-between items-center tracking-tight">
                    {column.title}
                    <span class="text-xs font-bold text-gray-400 bg-gray-200 py-1 px-2 rounded-full">{column.tasks.length}</span>
                </h3>

				<div 
					role="list"
					class="flex-1 overflow-y-auto space-y-3 min-h-[150px] transition-colors rounded-2xl"
					ondrop={(e) => {
						const form = document.getElementById(`move-form-${column.id}`) as HTMLFormElement;
						handleDrop(e, column.id, form);
					}}
					ondragover={handleDragOver}
				>
					{#each column.tasks as task}
						<div 
							role="listitem"
							draggable="true"
							ondragstart={(e) => handleDragStart(e, task.id)}
							class="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group relative"
						>
							<h4 class="font-medium text-gray-900 text-sm leading-snug break-words pr-4">{task.title}</h4>
                            
                            {#if task.assignee}
							    <div class="mt-4 text-xs text-gray-400 flex items-center gap-2">
                                    <div class="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 border border-gray-200">
                                        {task.assignee.email[0].toUpperCase()}
                                    </div>
                                    <span class="truncate">{task.assignee.email}</span>
                                </div>
                            {/if}

                            <!-- Delete button (visible on hover) -->
                            {#if data.user.role !== 'EXECUTOR'}
                            <form method="POST" action="?/deleteTask" use:enhance class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <input type="hidden" name="taskId" value={task.id} />
                                <button class="text-gray-300 hover:text-red-500 rounded p-1" title="Удалить задачу">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </form>
                            {/if}
						</div>
					{/each}
				</div>

				{#if data.user.role !== 'EXECUTOR'}
					<form method="POST" action="?/createTask" use:enhance class="mt-3 pt-3 px-1 border-t border-gray-200">
						<input type="hidden" name="columnId" value={column.id} />
						<input 
							name="title" 
							placeholder="+ Добавить задачу" 
							required 
							class="w-full bg-transparent border-transparent text-sm font-medium placeholder-gray-500 focus:bg-white focus:border-gray-300 focus:ring-0 rounded-xl px-3 py-2.5 transition-colors cursor-pointer hover:bg-white focus:cursor-text shadow-sm"
						/>
					</form>
				{/if}

				<!-- Hidden form for drag drop -->
				<form id="move-form-{column.id}" method="POST" action="?/moveTask" use:enhance class="hidden">
					<input type="hidden" name="taskId" />
					<input type="hidden" name="columnId" />
				</form>
			</div>
		{/each}
	</div>
</div>
