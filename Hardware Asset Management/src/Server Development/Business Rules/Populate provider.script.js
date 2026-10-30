(function executeRule(current, previous /*null when async*/) {

	// Add your code here
	
	var provider = HAMZeroTouchAssetRefreshUtils.getProviderFromReplacementModel(current.getValue('asset'), current.getValue('requested_for'), current.getValue('replacement_model'));
	current.setValue('provider', provider);
})(current, previous);