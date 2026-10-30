(function executeRule(current, previous /* null when async */) {
	var loanerOrder = current.loaner_order;
	new sn_hamp.HampLoanerUtils().setAssetStatusOnRemoval(loanerOrder, loanerOrder.asset);
}(current, previous));