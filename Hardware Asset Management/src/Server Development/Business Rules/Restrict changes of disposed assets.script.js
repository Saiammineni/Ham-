(function executeRule(current, previous /* null when async */) {
	// Allowing the change of state and substate to (In transit and Pending disposal) or (Retired and disposed)
	// when updated through disposal flow
	if (!(current.getValue('install_status') === '9' && current.getValue('substatus') === 'pending_disposal')
	&& !(current.getValue('install_status') === '7' && current.getValue('substatus') === 'disposed')) {
		current.install_status = previous.install_status;
		current.substatus = previous.substatus;
		gs.addErrorMessage(gs.getMessage('Cannot change state and substate of disposed assets'));
	}
}(current, previous));