(function executeRule(current, previous) {
	// RITM which either has sourcing variable set or stock order variable set are processed
	var hamRitmUtils = new HAMRitmUtils();
	var output = hamRitmUtils.processHAMRitm(current);
	if (output.abort) {
		gs.addErrorMessage(output.message);
	}
}(current, previous));