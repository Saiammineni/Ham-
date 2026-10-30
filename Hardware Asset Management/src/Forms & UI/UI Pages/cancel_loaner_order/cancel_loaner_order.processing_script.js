if ('false' == cancelled) {
	var hampLoanerUtils = new sn_hamp.HampLoanerUtils();
	if (hampLoanerUtils.canOrderBeCancelled(loanerOrder)) {
		hampLoanerUtils.cancelLoanerOrder(loanerOrder);
	} else {
		gs.addErrorMessage(gs.getMessage('Invalid loaner order cancellation'));
	}
	response.sendRedirect('sn_hamp_loaner_asset_order.do?sys_id=' + loanerOrder);
}