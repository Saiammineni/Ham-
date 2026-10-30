(function executeRule(current, previous) {
    var shouldAbort = false;
    var hasEntitlement = sn_hamp.HAMLicensingUtility.hasEntitlement(current.getValue('resource_category'));

	if (hasEntitlement == false) {
		shouldAbort = true;
	}
	
	if (shouldAbort) {
		// eslint-disable-next-line max-len
		gs.addErrorMessage(gs.getMessage('Resource category cannot be opted for under the current entitlement. Please contact your account team regarding HAM product licensing.'));
		current.setAbortAction(true);
	}
}(current, previous));