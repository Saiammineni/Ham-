/* global sn_itam_common */
var HAMContractManagementUtils = Class.create();
HAMContractManagementUtils.prototype = {
	initialize: function () { },

	CONTRACT_PRODUCT_MODEL_LEASE: '1881a836c3102000b959fd251eba8fc9',
	CONTRACT_PRODUCT_MODEL_MAINTENANCE: 'a581e836c3102000b959fd251eba8fba',
	CONTRACT_PRODUCT_MODEL_WARRANTY: 'a781e836c3102000b959fd251eba8f80',
	LEASE_CONTRACT_EXPIRATION_FLOW: 'sn_hamp.lease_contract_expiration',
	LEASE_CONTRACT_EXPIRATION_VIEW: 'leased_contract_expiration',
	DEFAULT_VIEW: 'Default',

	_isContractModelLease: function (contractRec) {
		return (String(contractRec.contract_model) === this.CONTRACT_PRODUCT_MODEL_LEASE);
	},

	_contractHasAssets: function (contractID) {
		var hasNoAssets = new global.GlideQuery('clm_m2m_contract_asset')
			.where('contract', contractID)
			.selectOne()
			.isEmpty();

		return !hasNoAssets;
	},

	canUseNewRenewalFlowForHAMP: function(contractModel) {
		var validModels = [this.CONTRACT_PRODUCT_MODEL_MAINTENANCE,
			this.CONTRACT_PRODUCT_MODEL_WARRANTY];
		return (validModels.indexOf(contractModel) !== -1);
	},

	isLeaseContractExpiring: function (contractRec) {
		var isStateActive = (String(contractRec.state) === 'active');
		var isSubstateExpiring = (String(contractRec.substate) === 'expiring');
		var isLeaseContract = this._isContractModelLease(contractRec);

		if (isStateActive && isSubstateExpiring && isLeaseContract) { return true; }
		return false;
	},

	leaseContractUnderwentExpiration: function (contractRec) {
		var isLeaseContract = this._isContractModelLease(contractRec);
		if (!isLeaseContract) { return false; }
		// Check for planning task on contract assets
		var contractHasPlanningTask = new global.GlideQuery('sn_hamp_contract_asset_task')
			.where('contract_asset.contract', contractRec.sys_id)
			.where('task_name', 'lease_planning')
			.selectOne()
			.isPresent();
		return contractHasPlanningTask;
	},

	_isLeaseContractExpired: function (contractRec) {
		var isStateExpired = (String(contractRec.state) === 'expired');
		var isSubstateRetired = (String(contractRec.substate) === 'retired');
		var isLeaseContract = this._isContractModelLease(contractRec);

		if (isStateExpired && isSubstateRetired && isLeaseContract) { return true; }
		return false;
	},

	_getFlowNameFromDecisionTable: function (originalName, contractId) {
		var LEASE_CONTRACT_DECISION_ID = 'b514e5fd0f531010967863cda8767ebb';
		var decisionInputs = {};
		decisionInputs.contract = contractId;
		return HAMUtils.getFlowFromDecisionTable(LEASE_CONTRACT_DECISION_ID, decisionInputs, originalName);
	},

	_getContractAsGlideRecord: function (contractID) {
		var contractGr = new global.GlideQuery('ast_contract')
			.where('sys_id', contractID)
			.toGlideRecord();
		contractGr.query();

		contractGr.next();
		return (contractGr.isValidRecord() ? contractGr : null);
	},

	_triggerLeaseContractExpirationFlow: function (contractID) {
		var contractGr = this._getContractAsGlideRecord(contractID);
		if (!contractGr) { return; }

		if (this.isLeaseContractExpiring(contractGr)) {
			var flowName = this._getFlowNameFromDecisionTable(this.LEASE_CONTRACT_EXPIRATION_FLOW,
				contractGr.getUniqueValue());
			if (gs.nil(flowName)) {
				gs.addErrorMessage(gs.getMessage('Flow is not configured in decision table'));
			} else {
				var inputs = {};
				inputs.current = contractGr;
				inputs.table_name = 'ast_contract';
				var flowContextID = HAMUtils.triggerFlowAsyncronously(flowName, inputs);
				if (flowContextID) {
					new global.GlideQuery('ast_contract')
						.where('sys_id', contractGr.getUniqueValue())
						.update({ flow_context: flowContextID });
				}
			}
		}
	},

	isRenewAllowed: function (contractRec) {
		var response = { continueProcessing: true, isRenewAllowed: true };

		// With HAM, lease contracts follow lease asset expiration process
		// if they have assets covered
		if (this._isContractModelLease(contractRec) && this._contractHasAssets(contractRec.sys_id)) {
			response.continueProcessing = false;
			response.isRenewAllowed = false;
		}

		return response;
	},

	canBeginLeaseExpirationProcess: function (contractRec) {
		var isStateActive = (String(contractRec.state) === 'active');
		var isSubstateExpiring = (String(contractRec.substate) === 'expiring');
		var isLeaseContract = this._isContractModelLease(contractRec);
		var contractHasAssets = this._contractHasAssets(contractRec.sys_id);
		var leaseContractUnderExp = this.leaseContractUnderwentExpiration(contractRec);
		if (!this.checkEAMContract(contractRec) && isStateActive && !isSubstateExpiring && isLeaseContract
			&& contractHasAssets && !leaseContractUnderExp && !this.contractHasEAMConsumables(contractRec.sys_id)) { return true; }
		return false;
	},
	// check if contract has asset_type of EAM
	checkEAMContract: function(contractRec) {
		var isEAMContract = false;
		if (sn_hamp.HAMUtils.IS_ITAM_COMMON_ACTIVE() && sn_itam_common.AssetCommonContractManagementUtils
		&& sn_itam_common.AssetCommonContractManagementUtils.prototype.isEAMContractWithEAMInstalled) {
			var commonContractUtils = new sn_itam_common.AssetCommonContractManagementUtils();
			isEAMContract = commonContractUtils.isEAMContractWithEAMInstalled(contractRec);
		}
		return isEAMContract;
	},

	beginLeaseExpirationProcess: function (contractRec) {
		if (!this.canBeginLeaseExpirationProcess(contractRec)) { return; }

		var contractAdministrator = String(contractRec.contract_administrator);
		if (gs.nil(contractAdministrator)) {
			var msg = gs.getMessage('Contract administrator needs to be specified to begin lease expiration process.');
			gs.addErrorMessage(msg);
			return;
		}

		var contractID = contractRec.getUniqueValue();

		new global.GlideQuery('ast_contract')
			.where('sys_id', contractID)
			.update({ substate: 'expiring', contract_administrator: contractAdministrator });

		this._triggerLeaseContractExpirationFlow(contractID);
	},

	isContractExpirationActivated: function (contractRec) {
		if (!contractRec) { return false; }
		return !this.checkEAMContract(contractRec)
			&& (this.isLeaseContractExpiring(contractRec) || this.leaseContractUnderwentExpiration(contractRec));
	},

	contractNotificationCondition: function (current) {
		var LEASE_CONTRACT_MODEL = '1881a836c3102000b959fd251eba8fc9';
		if (String(current.contract_model) !== LEASE_CONTRACT_MODEL) {
			return true;
		}
		return false;
	},

	leaseContractHasAsset: function (contract, asset) {
		var isContractAssetPresent = new global.GlideQuery('clm_m2m_contract_asset')
			.where('contract', contract.sys_id)
			.where('asset', asset.sys_id)
			.selectOne()
			.isPresent();
		return isContractAssetPresent;
	},

	syncLeaseContractAndAsset: function (contract, asset) {
		var leaseContractID = null;
		var leaseTermMonths = null;
		var leaseExpirationDate = null;
		if (!gs.nil(contract)) {
			leaseContractID = contract.sys_id;
			if (String(contract.lease_term_months) !== '') {
				leaseTermMonths = parseInt(contract.lease_term_months, 10);
			}
			if (String(contract.lease_expiration_date) !== '') {
				leaseExpirationDate = String(contract.lease_expiration_date);
			}
		}
		new global.GlideQuery('alm_asset')
			.where('sys_id', asset.sys_id)
			.update({
				lease_contract: leaseContractID,
				lease_term_months: leaseTermMonths,
				lease_expiration_date: leaseExpirationDate,
			});
	},

	getContractAssetView: function (contractAssetID) {
		var view = this.DEFAULT_VIEW;
		var contractAsset = new global.GlideQuery('clm_m2m_contract_asset')
			.get(contractAssetID, ['contract'])
			.orElse({ contract: null });
		if (!contractAsset.contract) { return view; }
		var contractRec = this._getContractAsGlideRecord(contractAsset.contract);
		if (!contractRec) { return view; }
		if (this.isContractExpirationActivated(contractRec)) { view = this.LEASE_CONTRACT_EXPIRATION_VIEW; }
		return view;
	},

	runLeaseContractDataFixScript: function () {
		var CONTRACT_PRODUCT_MODEL_LEASE = this.CONTRACT_PRODUCT_MODEL_LEASE;

		function attachLeaseContractToAsset(assetID) {
			var assetGr = new GlideRecord('alm_asset');
			assetGr.addQuery('sys_id', assetID);
			assetGr.addNullQuery('lease_contract');
			assetGr.query();
			if (!assetGr.next()) { return; }

			var contractAssetGr = new GlideRecord('clm_m2m_contract_asset');
			contractAssetGr.addQuery('asset', assetID);
			contractAssetGr.addQuery('contract.contract_model', CONTRACT_PRODUCT_MODEL_LEASE);
			contractAssetGr.addQuery('contract.state', 'active');
			contractAssetGr.setLimit(1);
			contractAssetGr.query();
			if (!contractAssetGr.next()) { return; }

			// Update lease contract information on asset
			var contractGr = contractAssetGr.contract;
			assetGr.setValue('lease_contract', contractAssetGr.getValue('contract'));
			assetGr.setValue('lease_expiration_date', contractGr.ends);
			assetGr.setValue('lease_term_months', contractGr.lease_term_months);
			if (
				gs.nil(assetGr.getValue('like_kind_exchange'))
				&& (!gs.nil(contractAssetGr.getValue('like_kind_returned_asset')))
			) {
				assetGr.setValue('like_kind_exchange', contractAssetGr.getValue('like_kind_returned_asset'));
			}
			global.ModelUtils.updateDisableBR(assetGr);
		}

		function populateLeaseExpirationDateOnLeaseContracts() {
			var contractGr = new GlideRecord('ast_contract');
			contractGr.addQuery('contract_model', CONTRACT_PRODUCT_MODEL_LEASE);
			contractGr.addNotNullQuery('ends');
			contractGr.addNullQuery('lease_expiration_date');
			contractGr.query();
			while (contractGr.next()) {
				contractGr.setValue('lease_expiration_date', contractGr.getValue('ends'));
				global.ModelUtils.updateDisableBR(contractGr);
			}
		}

		// Update lease expiration date on lease contacts
		populateLeaseExpirationDateOnLeaseContracts();

		// Iterate over active lease contract's contract assets in batches
		// and update lease information on asset records
		var LIMIT = 100000;
		var startOffset = 0;
		var endOffset = LIMIT;

		var contractsPresentToUpdate = true;
		while (contractsPresentToUpdate) {
			// Check for assets in contract assets attached to only a single active lease contract
			var contractAssetGr = new GlideAggregate('clm_m2m_contract_asset');
			contractAssetGr.addNotNullQuery('asset');
			contractAssetGr.addNotNullQuery('contract');
			contractAssetGr.addQuery('contract.contract_model', CONTRACT_PRODUCT_MODEL_LEASE);
			contractAssetGr.addQuery('contract.state', 'active');
			contractAssetGr.addAggregate('COUNT');
			contractAssetGr.chooseWindow(startOffset, endOffset - 1);
			contractAssetGr.orderBy('asset');
			contractAssetGr.query();

			contractsPresentToUpdate = contractAssetGr.hasNext();

			// Populate lease contract information on assets
			while (contractAssetGr.next()) {
				if (parseInt(contractAssetGr.getAggregate('COUNT'), 10) === 1) {
					attachLeaseContractToAsset(contractAssetGr.getValue('asset'));
				}
			}

			startOffset += LIMIT;
			endOffset += LIMIT;
		}
	},

	copyExistingAssetstoRenewalContract: function(oldContractGr, renewalContractGr) {
		var endDate = oldContractGr.getValue('ends');
		var assetRecords = 0;
		var outputMessage = {};
		// eslint-disable-next-line
		var result = sn_itam_common.ContractRenewalUtils.getValidHardwareAssetState();
		var insertedCount = new global.GlideQuery('clm_m2m_contract_asset')
			.where('contract', oldContractGr.getValue('sys_id'))
			.whereNotNull('asset')
			.where('asset.sys_class_name', 'IN', result.validAssetClasses)
			.where('asset.install_status', 'IN', result.validAssetStates)
			.where(new global.GlideQuery().whereNull('asset.substatus').orWhere('asset.substatus', 'IN', result.validAssetSubstates))
			.where(new global.GlideQuery().whereNull('removed').orWhere('removed', '>=', endDate));
		if(!gs.nil(result.validModelCategoryClasses))
		{
			var modelCategoryQuery = new global.GlideQuery().where('asset.model_category', 'IN', result.validModelCategoryClasses);
			insertedCount = insertedCount.where(modelCategoryQuery);
		}
		insertedCount.select('asset')
			.map(function(contractAsset) {
				assetRecords += 1;
				var newRecord = {};
				newRecord.contract = renewalContractGr.getValue('sys_id');
				newRecord.asset = contractAsset.asset;
				newRecord.added = renewalContractGr.getValue('starts');
				// Assets covered end date can be later than the original contract end date
				// newRecord.removed = renewalContractGr.getValue('ends');

				// check for duplicate
				if (new global.GlideQuery('clm_m2m_contract_asset')
					.where('contract', newRecord.contract)
					.where('asset', newRecord.asset)
					.selectOne('asset')
					.isPresent()) {
						return false;
				}
				return new global.GlideQuery('clm_m2m_contract_asset')
					.insert(newRecord)
					.isPresent();
			})
			.reduce(function(prevValue, currValue) {
				if (currValue) {
					return prevValue + 1;
				}
				return prevValue;
			}, 0);

		if (assetRecords === 0 || assetRecords === insertedCount) {
			outputMessage.sucess = true;
			outputMessage.message = gs.getMessage('{0} records inserted.', [assetRecords + '']);
		} else {
			outputMessage.sucess = false;
			outputMessage.message = gs.getMessage('Inserted only {0} of {1} records.', [insertedCount + '', assetRecords + '']);
		}

		return outputMessage;
	},

	contractHasEAMConsumables: function (contractID) {
		if (sn_hamp.HAMUtils.isEAMDataModelInstalled()) {
			var hasEAMConsumableAssets = new global.GlideQuery('clm_m2m_contract_asset')
				.where('contract', contractID)
				.where('asset.sys_class_name', HAMConstants.ALM_CONSUMABLE_TABLE)
				.where('asset.model.sys_class_name', 'IN', HAMUtils.getEAMModelClasses())
				.selectOne()
				.isPresent();

			return hasEAMConsumableAssets;
		}
		return false;
	},

	type: 'HAMContractManagementUtils',
};