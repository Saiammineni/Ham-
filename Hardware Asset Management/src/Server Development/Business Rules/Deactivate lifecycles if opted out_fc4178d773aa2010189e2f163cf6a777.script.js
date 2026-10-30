(function executeRule(current, previous) {
	var lifecyclesApi = new sn_hamp.HAMHWModelLifecycleAPI();
	lifecyclesApi.deactivatePrebuiltLifecycles(current);
}(current, previous));