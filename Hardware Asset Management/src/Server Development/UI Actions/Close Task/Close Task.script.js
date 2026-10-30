function closeTask() {
	g_form.setValue('state', 3);
	gsftSubmit(null, g_form.getFormElement(), 'sysverb_update');
}