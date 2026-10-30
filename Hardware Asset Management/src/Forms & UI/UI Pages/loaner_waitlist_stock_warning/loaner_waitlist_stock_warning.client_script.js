function cancel() {
	g_form.setValue('is_waitlisted', true);
	g_form.modified = false;
	GlideDialogWindow.get().destroy();
	return false;
}

function actionOK() {
	g_scratchpad.ignore_insufficient_stock_warning = true;
	GlideDialogWindow.get().destroy();
	g_form.save();
}