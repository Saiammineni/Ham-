function cancelLoanerOrder() {
	var DialogClass = (typeof GlideModal !== 'undefined') ? GlideModal : GlideDialogWindow;
	var dd = new DialogClass('sn_hamp_cancel_loaner_order');
	dd.setTitle(new GwtMessage().getMessage('Cancel Order : {0}', g_form.getValue('number')));
	dd.setPreference('sysparm_sys_id', g_form.getUniqueValue());
	/* eslint-disable no-undef */
	assetSetDomainParameters(dd);
	dd.setWidth(400);
	dd.render();
}