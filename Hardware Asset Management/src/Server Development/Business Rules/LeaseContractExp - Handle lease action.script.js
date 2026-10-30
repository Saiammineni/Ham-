(function executeRule(current, previous) {
	// Close open Planning task
	new sn_hamp.HAMLeaseContractExpirationUtils().closePlanningTask(current.getUniqueValue());

	// Trigger flow for lease action
	var leaseAction = current.getValue('lease_action');
	new sn_hamp.HAMLeaseContractExpirationUtils().triggerFlowOnLeaseActionChange(current, leaseAction);
}(current, previous));