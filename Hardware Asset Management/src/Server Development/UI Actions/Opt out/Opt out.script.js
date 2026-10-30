function optOut() {
	var DialogClass = (typeof GlideModal !== 'undefined') ? GlideModal : GlideDialogWindow;
	var dd = new DialogClass('sn_hamp_resource_category_opt_in');
	dd.setTitle(new GwtMessage().getMessage('Opt out : {0}', g_form.getDisplayValue('resource_category')));
	dd.setPreference('sysparm_sys_id', g_form.getUniqueValue());
	dd.setPreference('sysparm_opt_in', false);
	/* eslint-disable no-undef */
	assetSetDomainParameters(dd);
	dd.setWidth(400);
	dd.render();
}