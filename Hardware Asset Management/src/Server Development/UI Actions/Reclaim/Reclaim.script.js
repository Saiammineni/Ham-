function earlyReturnModal(response) {
	var loanerOrder = JSON.parse(response.responseXML.documentElement.getAttribute('answer'));
	var DialogClass = (typeof GlideModal !== 'undefined') ? GlideModal : GlideDialogWindow;
	var dd = new DialogClass('sn_hamp_early_return_loaner_asset');
	dd.setTitle(new GwtMessage().getMessage('Reclaim Asset : {0}', loanerOrder.asset.display_name));
	dd.setPreference('sysparm_sys_id', g_form.getUniqueValue());
	dd.setPreference('sysparm_asset_id', loanerOrder.asset.sys_id.toString());
	dd.setPreference('sysparm_actual_stockroom', loanerOrder.asset_stockroom);
	/* eslint-disable no-undef */
	assetSetDomainParameters(dd);
	dd.setWidth(500);
	dd.render();
}
function earlyReturn() {
	var ga = new GlideAjax('sn_hamp.HampLoanerAjaxUtils');
	ga.addParam('sysparm_name', 'getLoanerOrder');
	ga.addParam('sysparm_table', g_form.getTableName());
	ga.addParam('sysparm_loaner', g_form.getUniqueValue());
	ga.getXML(earlyReturnModal);
}