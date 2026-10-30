function setLoanerReportingField() {
	var loanerOrderGr = new GlideRecord('sn_hamp_loaner_asset_order');
	loanerOrderGr.addNullQuery('loaner_order_status');
	loanerOrderGr.query();
	while (loanerOrderGr.next()) {
		new sn_hamp.HAMFixScripts().setLoanerOrderStatusValue(loanerOrderGr);
		loanerOrderGr.update();
	}
}

setLoanerReportingField();