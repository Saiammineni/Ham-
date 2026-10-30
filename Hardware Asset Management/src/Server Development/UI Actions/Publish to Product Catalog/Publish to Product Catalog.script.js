function publishBundle() {
	var DialogClass = GlideModal || GlideDialogWindow;
	var gDialog = new DialogClass('publish_to_product_catalog');
	gDialog.setTitle('Publish to Product Catalog');
	gDialog.setPreference('sysparm_display_name', g_form.getValue('display_name'));
	gDialog.setPreference('sysparm_sys_id', g_form.getUniqueValue());
	gDialog.setPreference('sysparm_type', 'model');
	gDialog.render();
}