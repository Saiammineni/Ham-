function onLoad() {
	if (g_scratchpad.assetExclusion !== undefined) {
		if (g_scratchpad.assetExclusion.excluded_from_ham) {
			var message = g_scratchpad.assetExclusion.message;
			g_form.showFieldMsg('display_name', message, 'info');
			g_form.removeOption('asset_function','loaner');
		}
		if (!g_scratchpad.assetExclusion.show_exclusion_field) {
			g_form.setDisplay('excluded_from_ham',false);
		}
	}
}