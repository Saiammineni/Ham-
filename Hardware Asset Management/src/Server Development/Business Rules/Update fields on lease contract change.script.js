(function executeRule(current, previous) {
	new sn_hamp.HAMContractManagementUtils().syncLeaseContractAndAsset(current.lease_contract, current);
}(current, previous));