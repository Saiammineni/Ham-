(function refineQuery(current, parent) {
	if (new sn_hamp.HAMContractManagementUtils().isContractExpirationActivated(parent)) {
		current.addQuery('contract', parent.getUniqueValue());
	} else {
		current.addNullQuery('sys_id');
	}
})(current, parent);