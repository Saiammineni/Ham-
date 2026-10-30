(function executeRule(current, previous) {
	var message = gs.getMessage('Contract administrator cannot be cleared while lease expiration is in progress.');
	gs.addErrorMessage(message);
	current.contract_administrator = previous.contract_administrator;
}(current, previous));