function onCondition() {
	g_form.setReadOnly('number',true);
	g_form.setReadOnly('hardware_disposal',true);
	if (g_form.getValue('task_name') === 'confirm' || g_form.getValue('task_name') === 'documentation')
		g_form.removeOption('state', 4);
}