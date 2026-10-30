function onCondition() {
	if(g_form.getValue('task_name') === 'prepare') {
		g_form.removeOption('state', 7);
	}
}