function checkReturnStockroom(response) {
	var loanerOrder = JSON.parse(response.responseXML.documentElement.getAttribute('answer'));
	if (g_form.getValue('return_stockroom') !== loanerOrder.asset_stockroom) {
		getMessage('HAM: Asset Reservations Stockroom Warning', function(msg) {
			g_form.showFieldMsg('return_stockroom', msg, 'warning', true);
		});
	} else {
		g_form.hideFieldMsg('return_stockroom');
	}
}

function onChange(control, oldValue, newValue, isLoading, isTemplate) {
	if (isLoading || newValue === '') {
		return;
	}
	var ga = new GlideAjax('sn_hamp.HampLoanerAjaxUtils');
	ga.addParam('sysparm_name', 'getLoanerOrder');
	ga.addParam('sysparm_table', g_form.getTableName());
	ga.addParam('sysparm_loaner', g_form.getUniqueValue());
	ga.getXML(checkReturnStockroom);
}