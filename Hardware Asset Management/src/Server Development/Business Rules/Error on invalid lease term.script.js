(function executeRule(current, previous /*null when async*/) {
	current.setValue('lease_term_months','');
	gs.addErrorMessage(gs.getMessage('Lease term (months) must be a positive integer'));
})(current, previous);