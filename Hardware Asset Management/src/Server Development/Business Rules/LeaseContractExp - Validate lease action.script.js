(function executeRule(current, previous) {
	/* ******************************************************
	Valid lease action changes:
	1. -- None -- to Return/ Buyout/ Extend
	2. Return to Buyout/ Extend
	****************************************************** */
	var previousAction = previous.getValue('lease_action');
	var newAction = current.getValue('lease_action');
	if (newAction !== 'excluded') {
		if (!new sn_hamp.HAMLeaseContractExpirationUtils().isValidLeaseActionChange(
			previousAction,
			newAction,
			current.contract
		)) {
			global.ModelUtils.setAbortAction(current, true);
			gs.addErrorMessage(gs.getMessage('Invalid lease action change'));
		}
	}
}(current, previous));