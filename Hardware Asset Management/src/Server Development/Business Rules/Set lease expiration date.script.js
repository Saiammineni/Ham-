(function executeRule(current, previous) {
	current.lease_expiration_date = current.ends;
}(current, previous));