function onLoad() {
	var PO_ASSETS_RELATED_LIST = 'REL:4061d69c37613000158bbfc8bcbe5d33';
	if (g_scratchpad.HIDE_ASSETS && g_scratchpad.HIDE_ASSETS === true) {
		g_form.hideRelatedList(PO_ASSETS_RELATED_LIST);
	}
}