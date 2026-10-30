function onLoad() {
	if (g_scratchpad.new_custom_licensing_applicable) {
		g_form.hideRelatedList('cmdb_model_category.resource_category');
	} else {
		g_form.hideRelatedList('REL:8eed2445777131106873136f1b5a99c3');	
	}
}