var ContractAssetsRenewalExtPoint = Class.create();
ContractAssetsRenewalExtPoint.prototype = {
	initialize: function() {
		this.hamContractMgmtUtils = new sn_hamp.HAMContractManagementUtils();
	},

	// eslint-disable-next-line no-unused-vars
	isApplicable: function(currentContractGr, renewalContractGr) {
		// eslint-disable-next-line max-len
		return new sn_hamp.HAMContractManagementUtils().canUseNewRenewalFlowForHAMP(currentContractGr.getValue('contract_model'));
	},

	createRelatedDataForRenewal: function(currentContractGr, renewalContractGr) {
		// eslint-disable-next-line max-len
		return new sn_hamp.HAMContractManagementUtils().copyExistingAssetstoRenewalContract(currentContractGr, renewalContractGr);
	},

	type: 'ContractAssetsRenewalExtPoint',
};