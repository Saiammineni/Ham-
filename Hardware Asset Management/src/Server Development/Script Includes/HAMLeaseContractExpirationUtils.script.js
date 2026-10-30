var HAMLeaseContractExpirationUtils = Class.create();
HAMLeaseContractExpirationUtils.prototype = {
	initialize: function () { },

	/* ***************************************************
							Utilities
	*************************************************** */
	DEFAULT_LEASED_ASSET_FLOWS: {
		'return': 'sn_hamp.leased_asset_return', // eslint-disable-line
		'buyout': 'sn_hamp.leased_asset_buyout', // eslint-disable-line
		'extend': 'sn_hamp.leased_asset_extension', // eslint-disable-line
	},

	DEFAULT_LEASED_ASSET_DECISION_IDS: {
		'return': '6d19e5b10f931010967863cda8767e9d', // eslint-disable-line
		'buyout': 'bf0561310f931010967863cda8767e89', // eslint-disable-line
		'extend': 'b1286d710f931010967863cda8767ec2', // eslint-disable-line
	},

	PLANNING_TASK: 'lease_planning',
	COLLECTION_TASK: 'lease_collection',
	PREPARATION_TASK: 'lease_preparation',
	SHIPMENT_TASK: 'lease_shipment',
	RETURN_CONFIRMATION_TASK: 'lease_return_confirmation',
	LEASE_RETURN_SETTLEMENT_TASK: 'lease_return_settlement',
	BUYOUT_TASK: 'lease_buyout',
	BUYOUT_CONFIRMATION_TASK: 'lease_buyout_confirmation',
	EXTENSION_TASK: 'lease_extension',
	EXTENSION_CONFIRMATION_TASK: 'lease_extension_confirmation',

	RETURN_LEASE_ACTION: 'return',
	BUYOUT_LEASE_ACTION: 'buyout',
	EXTEND_LEASE_ACTION: 'extend',

	CONTRACT_STATE_ACTIVE: 'active',
	CONTRACT_STATE_DRAFT: 'draft',
	CONTRACT_SUBSTATE_APPROVED: 'approved',

	getTaskHandlerFunction: function (taskName) {
		switch (taskName) {
		case this.PLANNING_TASK: return this.PlanningTaskHandler;
		case this.COLLECTION_TASK: return this.CollectionTaskHandler;
		case this.PREPARATION_TASK: return this.PreparationTaskHandler;
		case this.SHIPMENT_TASK: return this.ShipmentTaskHandler;
		case this.RETURN_CONFIRMATION_TASK: return this.ReturnConfirmationTaskHandler;
		case this.LEASE_RETURN_SETTLEMENT_TASK: return this.LeaseReturnSettlementTaskHandler;
		case this.BUYOUT_TASK: return this.BuyoutTaskHandler;
		case this.BUYOUT_CONFIRMATION_TASK: return this.BuyoutConfirmationTaskHandler;
		case this.EXTENSION_TASK: return this.ExtensionTaskHandler;
		case this.EXTENSION_CONFIRMATION_TASK: return this.ExtensionConfirmationTaskHandler;
		default: return null;
		}
	},

	getAsGlideRecord: function (table, sysID) {
		var recordGr = new global.GlideQuery(table)
			.where('sys_id', sysID)
			.toGlideRecord();
		recordGr.query();
		recordGr.next();
		return (recordGr.isValidRecord() ? recordGr : null);
	},

	isFieldEmpty: function(taskRec, taskFields, contractAssetFields, missingFields) {
		var i;
		var field;
		if (taskFields && taskFields.length > 0) {
			for (i = 0; i < taskFields.length; i++) {
				field = taskFields[i];
				if (gs.nil(taskRec[field])) { missingFields.push(taskRec[field].getLabel()); }
			}
		}
		if (contractAssetFields && contractAssetFields.length > 0) {
			for (i = 0; i < contractAssetFields.length; i++) {
				field = contractAssetFields[i];
				if (gs.nil(taskRec['contract_asset'][field])) { // eslint-disable-line
					missingFields.push(taskRec['contract_asset'][field].getLabel()); // eslint-disable-line
				}
			}
		}
		if (missingFields.length > 0) { return true; }
		return false;
	},

	getMandatoryFieldsMessage: function(mandatoryFields) {
		return gs.getMessage('The following mandatory fields are not filled in: {0}', mandatoryFields.join(', '));
	},

	isValidExtensionDates: function(contractAsset) {
		if (!contractAsset) { return false; }
		var op = HAMUtils.compareDates(contractAsset.extension_start_date, contractAsset.extension_end_date);
		if (op !== '>') {
			gs.addErrorMessage(gs.getMessage('Extension start date must be before extension end date'));
			return false;
		}
		return true;
	},

	isValidBuyoutDate: function(contractAsset) {
		if (!contractAsset) { return false; }
		var op = HAMUtils.compareDates(contractAsset.contract.starts, contractAsset.buyout_date);
		if (op !== '>') {
			gs.addErrorMessage(gs.getMessage('Buyout date must be after Contract start date'));
			return false;
		}
		return true;
	},

	getLeaseExpirationFlowContextID: function(contractAssetID) {
		var contractAsset = new global.GlideQuery('clm_m2m_contract_asset')
			.get(contractAssetID, ['flow_context'])
			.orElse({ flow_context: null });
		return contractAsset.flow_context;
	},

	setLeaseExpirationFlowContextID: function(contextID, contractAssetID) {
		new global.GlideQuery('clm_m2m_contract_asset')
			.where('sys_id', contractAssetID)
			.update({ flow_context: contextID });
	},

	/* ***************************************************
						Task Handlers
	*************************************************** */
	PlanningTaskHandler: function (taskRec, utils) {
		this.taskRec = taskRec;
		this.utils = utils;
		this.missingValues = [];
		this.message = '';
		this.leaseAction = '';
		this.checks = function () {
			// eslint-disable-next-line max-len
			if (this.utils.isFieldEmpty(this.taskRec, ['asset', 'lease_action'], null, this.missingValues)) { return false; }
			this.leaseAction = this.taskRec.getValue('lease_action');
			return true;
		};
		this.updates = function () {
			new global.GlideQuery('clm_m2m_contract_asset')
				.where('sys_id', this.taskRec.contract_asset.sys_id)
				.update({ lease_action: this.leaseAction });
		};
		this.messageForUser = function () {
			if (this.missingValues.length > 0) { return this.utils.getMandatoryFieldsMessage(this.missingValues); }
			return this.message;
		};
	},

	CollectionTaskHandler: function (taskRec, utils) {
		this.taskRec = taskRec;
		this.utils = utils;
		this.missingValues = [];
		this.message = '';
		this.assetCollected = '';
		this.stockroom = '';
		this.allowedActionChanges = ['lease_buyout', 'lease_extend', 'lease_like_kind_return'];
		this.actionChange = '';
		this.isLikeKindReturn = false;
		this.checks = function () {
			// eslint-disable-next-line max-len
			if (this.utils.isFieldEmpty(this.taskRec, ['asset', 'leased_asset_collected'], null, this.missingValues)) { return false; }
			this.assetCollected = this.taskRec.getValue('leased_asset_collected');
			if (this.assetCollected === 'Y') {
				if (this.utils.isFieldEmpty(this.taskRec, ['stockroom'], null, this.missingValues)) { return false; }
				this.stockroom = this.taskRec.getValue('stockroom');
			}
			if (this.assetCollected === 'N') {
				if (this.utils.isFieldEmpty(this.taskRec, ['lease_action_change'], null, this.missingValues)) { return false; } // eslint-disable-line max-len
				this.actionChange = this.taskRec.getValue('lease_action_change');
				if (this.allowedActionChanges.indexOf(this.actionChange) === -1) {
					this.message = gs.getMessage('Invalid Action change');
					return false;
				}
				if (this.actionChange === this.allowedActionChanges[2]) { // Like-kind return
					if (this.utils.isFieldEmpty(this.taskRec, ['stockroom'], ['like_kind_returned_asset'], this.missingValues)) { return false; } // eslint-disable-line max-len
					this.stockroom = this.taskRec.getValue('stockroom');
				}
			}
			return true;
		};
		this.updates = function () {
			var originalAssetID = this.taskRec.contract_asset.asset.sys_id;
			var likeKindReturnAssetID = this.taskRec.contract_asset.like_kind_returned_asset.sys_id;
			if (this.assetCollected === 'Y') { // Move asset to In Stock and Pending Transfer
				this.updateCollectedAssetAttributes(originalAssetID, false /* isLikeKindReturn */);
			}
			if (this.assetCollected === 'N') {
				if (this.actionChange === 'lease_like_kind_return') {
					this.isLikeKindReturn = true;
					// Move like-kind return asset to In Stock and Pending Transfer
					this.updateCollectedAssetAttributes(likeKindReturnAssetID, true /* isLikeKindReturn */);
					// Move contract asset to Missing. Set like kind exchange on original asset.
					this.updateContractAssetAttributesOnLikeKindReturn(
						this.taskRec.contract_asset.asset.sys_id,
						likeKindReturnAssetID
					);
				} else {
					// Action changed to buyout/extend,
					var flowChangedTo;
					var contractAssetID = this.taskRec.contract_asset.sys_id;
					if (this.actionChange === 'lease_buyout') { flowChangedTo = 'buyout'; }
					if (this.actionChange === 'lease_extend') { flowChangedTo = 'extend'; }
					// Cancel current flow
					var currentFlowID = this.utils.getLeaseExpirationFlowContextID(contractAssetID);
					if (currentFlowID) {
						sn_fd.FlowAPI.cancel(currentFlowID, ' Due to Lease action change to ' + flowChangedTo);
					}
					// Change lease action on contract asset. This will trigger new flow.
					new global.GlideQuery('clm_m2m_contract_asset')
						.where('sys_id', contractAssetID)
						.update({ lease_action: flowChangedTo });
				}
			}
			if (!this.isLikeKindReturn) {
				new global.GlideQuery('clm_m2m_contract_asset')
					.where('sys_id', this.taskRec.contract_asset.sys_id)
					.update({ like_kind_returned_asset: null });
			}
		};
		this.updateCollectedAssetAttributes = function (assetID, isLikeKindReturn) {
			var assetCollectedGr = this.utils.getAsGlideRecord('alm_asset', assetID);
			assetCollectedGr.setValue('install_status', sn_hamp.HAMConstants.ASSET_STATUSES.IN_STOCK);
			assetCollectedGr.setValue('substatus', sn_hamp.HAMConstants.ASSET_SUB_STATUSES.PENDING_TRANSFER);
			assetCollectedGr.setValue('stockroom', this.stockroom);

			var msgParams = [assetCollectedGr.getDisplayValue(), this.taskRec.number];
			// eslint-disable-next-line max-len
			assetCollectedGr.work_notes = gs.getMessage('Asset {0} updated to state In stock and substate Pending transfer as part of task {1}', msgParams);
			if (!isLikeKindReturn) {
				// eslint-disable-next-line max-len
				assetCollectedGr.work_notes = gs.getMessage('Expiring leased asset {0} as part of task {1}', msgParams);
			} else {
				// eslint-disable-next-line max-len
				assetCollectedGr.work_notes = gs.getMessage('Asset {0} being returned in like-kind exchange as part of task {1}', msgParams);
			}
			assetCollectedGr.update();
		};
		this.updateContractAssetAttributesOnLikeKindReturn = function (assetID, likeKindReturnAssetID) {
			var assetNotCollectedGr = this.utils.getAsGlideRecord('alm_asset', assetID);
			assetNotCollectedGr.setValue('install_status', sn_hamp.HAMConstants.ASSET_STATUSES.MISSING);
			assetNotCollectedGr.setValue('substatus', sn_hamp.HAMConstants.ASSET_SUB_STATUSES.NONE);
			assetNotCollectedGr.setValue('like_kind_exchange', likeKindReturnAssetID);

			var msgParams = [assetNotCollectedGr.getDisplayValue(), this.taskRec.number];
			// eslint-disable-next-line max-len
			assetNotCollectedGr.work_notes = gs.getMessage('Asset {0} updated to state Missing as part of task {1}', msgParams);
			assetNotCollectedGr.update();
		};
		this.messageForUser = function () {
			if (this.missingValues.length > 0) { return this.utils.getMandatoryFieldsMessage(this.missingValues); }
			return this.message;
		};
	},

	PreparationTaskHandler: function (taskRec, utils) {
		this.taskRec = taskRec;
		this.utils = utils;
		this.message = '';
		this.missingValues = [];
		this.assetToPrepareID = '';
		this.checks = function () {
			if (this.utils.isFieldEmpty(this.taskRec, ['asset'], null, this.missingValues)) { return false; }
			this.assetToPrepareID = this.taskRec.asset.sys_id;
			return true;
		};
		this.updates = function () {
			// If CI present, remove any device allocations
			var assetPreparedGr = this.utils.getAsGlideRecord('alm_asset', this.assetToPrepareID);
			var ciID = assetPreparedGr.getValue('ci');
			if (gs.nil(ciID)) { return; }

			var deviceAllocations = new global.GlideQuery('alm_entitlement_asset')
				.where('allocated_to', ciID)
				.selectOne('sys_id')
				.orElse(null);
			if (!deviceAllocations) { return; }

			new AssetAutomationAPI().removeDeviceAlloc(ciID);

			var msgParams = [assetPreparedGr.getDisplayValue(), this.taskRec.number];
			// eslint-disable-next-line max-len
			assetPreparedGr.work_notes = gs.getMessage('Device allocations for asset {0} removed as part of task {1}', msgParams);
			assetPreparedGr.update();
		};
		this.messageForUser = function () {
			if (this.missingValues.length > 0) { return this.utils.getMandatoryFieldsMessage(this.missingValues); }
			return this.message;
		};
	},

	ShipmentTaskHandler: function (taskRec, utils) {
		this.taskRec = taskRec;
		this.utils = utils;
		this.message = '';
		this.missingValues = [];
		this.assetToShipID = '';
		this.checks = function () {
			if (this.utils.isFieldEmpty(this.taskRec, ['asset'], null, this.missingValues)) { return false; }
			this.assetToShipID = this.taskRec.asset.sys_id;
			return true;
		};
		this.updates = function () {
			// Move asset to In Transit
			var assetShippedGr = this.utils.getAsGlideRecord('alm_asset', this.assetToShipID);
			assetShippedGr.setValue('install_status', sn_hamp.HAMConstants.ASSET_STATUSES.IN_TRANSIT);
			assetShippedGr.setValue('substatus', sn_hamp.HAMConstants.ASSET_SUB_STATUSES.NONE);

			var msgParams = [assetShippedGr.getDisplayValue(), this.taskRec.number];
			// eslint-disable-next-line max-len
			assetShippedGr.work_notes = gs.getMessage('Asset {0} updated to state In transit as part of task {1}', msgParams);
			assetShippedGr.update();
		};
		this.messageForUser = function () {
			if (this.missingValues.length > 0) { return this.utils.getMandatoryFieldsMessage(this.missingValues); }
			return this.message;
		};
	},

	ReturnConfirmationTaskHandler: function (taskRec, utils) {
		this.taskRec = taskRec;
		this.utils = utils;
		this.message = '';
		this.missingValues = [];
		this.message = '';
		this.assetReturnedID = '';
		this.checks = function () {
			if (this.utils.isFieldEmpty(this.taskRec, ['asset'], null, this.missingValues)) { return false; }
			this.assetReturnedID = this.taskRec.asset.sys_id;
			if (this.taskRec.contract_asset.return_confirmation.toString() !== 'Y') {
				// eslint-disable-next-line max-len
				this.message = gs.getMessage('To complete the task, please update Return confirmation attribute value to Yes.');
				return false;
			}
			if (this.taskRec.contract_asset.lease_settlement.toString() === 'Y') {
				var settlementCost = parseFloat(this.taskRec.contract_asset.lease_settlement_amount.getCurrencyValue());
				if (settlementCost <= 0) {
					this.message = gs.getMessage('Settlement amount should be greater than zero.');
					return false;
				}
			}
			return true;
		};
		this.updates = function () {
			// Move asset to Retired and Lease Return
			var assetReturnedGr = this.utils.getAsGlideRecord('alm_asset', this.assetReturnedID);
			assetReturnedGr.setValue('install_status', sn_hamp.HAMConstants.ASSET_STATUSES.RETIRED);
			assetReturnedGr.setValue('substatus', sn_hamp.HAMConstants.ASSET_SUB_STATUSES.LEASE_RETURN);

			var msgParams = [assetReturnedGr.getDisplayValue(), this.taskRec.number];
			// eslint-disable-next-line max-len
			assetReturnedGr.work_notes = gs.getMessage('Asset {0} updated to state Retired and substate Lease return as part of task {1}', msgParams);
			assetReturnedGr.update();
			// Update Date Removed on the contract asset
			new global.GlideQuery('clm_m2m_contract_asset')
				.where('sys_id', this.taskRec.contract_asset.sys_id)
				.update({ removed: new GlideDate() });
		};
		this.messageForUser = function () {
			if (this.missingValues.length > 0) { return this.utils.getMandatoryFieldsMessage(this.missingValues); }
			return this.message;
		};
	},

	LeaseReturnSettlementTaskHandler: function(taskRec, utils) {
		this.taskRec = taskRec;
		this.utils = utils;
		this.message = '';
		this.checks = function () {
			var purchaseOrder = this.taskRec.contract_asset.po_line_item.purchase_order;
			var purchaseOrderNumber = String(purchaseOrder.number);
			var purchaseOrderStatus = String(purchaseOrder.status);
			if (purchaseOrderStatus !== 'received') {
				// eslint-disable-next-line max-len
				this.message = gs.getMessage('To complete the task, please ensure that the purchase order {0} has a state of Received.', [purchaseOrderNumber]);
				return false;
			}
			return true;
		};
		this.updates = function () { };
		this.messageForUser = function () {
			return this.message;
		};
	},

	BuyoutTaskHandler: function (taskRec, utils) {
		this.taskRec = taskRec;
		this.utils = utils;
		this.message = '';
		this.missingValues = [];
		this.contractAsset = '';
		this.checks = function () {
			// eslint-disable-next-line max-len
			if (this.utils.isFieldEmpty(this.taskRec, ['asset'], ['buyout_date'], this.missingValues)) { return false; }

			this.contractAsset = this.taskRec.contract_asset;
			if (!this.utils.isValidBuyoutDate(this.contractAsset)) { return false; }

			return true;
		};
		this.updates = function () {
			var buyoutAmount = this.contractAsset.buyout_amount.getCurrencyString();
			var poStatus = String(this.contractAsset.po_line_item.purchase_order.status);
			if (!gs.nil(poStatus) && poStatus === 'requested') {
				new global.GlideQuery('proc_po_item')
					.where('sys_id', this.contractAsset.po_line_item)
					.update({ cost: buyoutAmount });
			} else {
				gs.addInfoMessage(gs.getMessage('Buyout amount not copied to purchase order line.'));
			}
		};
		this.messageForUser = function () {
			if (this.missingValues.length > 0) { return this.utils.getMandatoryFieldsMessage(this.missingValues); }
			return this.message;
		};
	},

	BuyoutConfirmationTaskHandler: function (taskRec, utils) {
		this.taskRec = taskRec;
		this.utils = utils;
		this.message = '';
		this.missingValues = [];
		this.contractAsset = '';
		this.checks = function () {
			// eslint-disable-next-line max-len
			if (this.utils.isFieldEmpty(this.taskRec, ['asset'], ['buyout_date'], this.missingValues)) { return false; }

			this.contractAsset = this.taskRec.contract_asset;
			if (!this.utils.isValidBuyoutDate(this.contractAsset)) { return false; }

			var purchaseOrder = this.contractAsset.po_line_item.purchase_order;
			var purchaseOrderNumber = String(purchaseOrder.number);
			var purchaseOrderStatus = String(purchaseOrder.status);
			if (purchaseOrderStatus !== 'received') {
				// eslint-disable-next-line max-len
				this.message = gs.getMessage('To complete the task, please ensure that the purchase order {0} has a state of Received.', [purchaseOrderNumber]);
				return false;
			}
			if (this.contractAsset.buyout_confirmation.toString() !== 'Y') {
				// eslint-disable-next-line max-len
				this.message = gs.getMessage('To complete the task, please update Buyout confirmation attribute value to Yes.');
				return false;
			}
			return true;
		};
		this.updates = function () {
			// Update Acquisition method on asset to Purchase. Update cost.
			var assetBoughtOutGr = new global.GlideQuery('alm_asset')
				.where('sys_id', this.contractAsset.asset.sys_id)
				.toGlideRecord();
			assetBoughtOutGr.query();
			assetBoughtOutGr.next();
			assetBoughtOutGr.setValue('acquisition_method', 'purchase');

			var costOnAsset = assetBoughtOutGr.cost.getCurrencyString();
			var buyoutAmount = this.contractAsset.buyout_amount.getCurrencyString();
			assetBoughtOutGr.setValue('cost', buyoutAmount);

			var msgParams = [assetBoughtOutGr.getDisplayValue(), buyoutAmount, costOnAsset, this.taskRec.number];
			// eslint-disable-next-line max-len
			assetBoughtOutGr.work_notes = gs.getMessage('Asset {0} cost updated to {1} from {2} and Acquisition method was updated as part of task {3}', msgParams);

			msgParams = [assetBoughtOutGr.getDisplayValue(), this.taskRec.number];
			// eslint-disable-next-line max-len
			assetBoughtOutGr.work_notes = gs.getMessage('Asset {0} is bought out as part of task {1}', msgParams);
			assetBoughtOutGr.update();

			// Update Date Removed on the contract asset
			new global.GlideQuery('clm_m2m_contract_asset')
				.where('sys_id', this.contractAsset.sys_id)
				.update({ removed: new GlideDate() });
		};
		this.messageForUser = function () {
			if (this.missingValues.length > 0) { return this.utils.getMandatoryFieldsMessage(this.missingValues); }
			return this.message;
		};
	},

	ExtensionTaskHandler: function(taskRec, utils) {
		this.taskRec = taskRec;
		this.utils = utils;
		this.message = '';
		this.missingValues = [];
		this.contractAsset = '';
		this.checks = function () {
			// eslint-disable-next-line max-len
			if (this.utils.isFieldEmpty(this.taskRec, ['asset'], ['extension_start_date', 'extension_end_date'], this.missingValues)) { return false; }

			this.contractAsset = this.taskRec.contract_asset;
			if (!this.utils.isValidExtensionDates(this.contractAsset)) { return false; }

			return true;
		};
		this.updates = function () {
			var extensionCost = this.contractAsset.extension_cost.getCurrencyString();
			var poStatus = String(this.contractAsset.po_line_item.purchase_order.status);
			if (!gs.nil(poStatus) && poStatus === 'requested') {
				new global.GlideQuery('proc_po_item')
					.where('sys_id', this.contractAsset.po_line_item)
					.update({ cost: extensionCost });
			} else {
				gs.addInfoMessage(gs.getMessage('Extension cost not copied to purchase order line.'));
			}
		};
		this.messageForUser = function () {
			if (this.missingValues.length > 0) { return this.utils.getMandatoryFieldsMessage(this.missingValues); }
			return this.message;
		};
	},

	ExtensionConfirmationTaskHandler: function (taskRec, utils) {
		this.taskRec = taskRec;
		this.utils = utils;
		this.message = '';
		this.missingValues = [];
		this.contractAsset = '';
		this.checks = function () {
			// eslint-disable-next-line max-len
			if (this.utils.isFieldEmpty(this.taskRec, ['asset'], ['extension_start_date', 'extension_end_date'], this.missingValues)) { return false; }

			this.contractAsset = this.taskRec.contract_asset;
			if (!this.utils.isValidExtensionDates(this.contractAsset)) { return false; }

			var purchaseOrder = this.contractAsset.po_line_item.purchase_order;
			var purchaseOrderNumber = String(purchaseOrder.number);
			var purchaseOrderStatus = String(purchaseOrder.status);
			if (purchaseOrderStatus !== 'received') {
				// eslint-disable-next-line max-len
				this.message = gs.getMessage('To complete the task, please ensure that the purchase order {0} has a state of Received.', [purchaseOrderNumber]);
				return false;
			}
			if (this.contractAsset.extension_confirmation.toString() !== 'Y') {
				// eslint-disable-next-line max-len
				this.message = gs.getMessage('To complete the task, please update Extension confirmation attribute value to Yes.');
				return false;
			}
			return true;
		};
		this.updates = function () {
			// Extend the contract asset under a new contract
			// Check if an extension contract with required dates was previously created
			var extensionContract = {};
			var contractAssetWithExtensionContract = new global.GlideQuery('clm_m2m_contract_asset')
				.where('contract', this.contractAsset.contract.sys_id)
				.where('lease_action', utils.EXTEND_LEASE_ACTION)
				.whereNotNull('lease_extension_contract')
				.where('lease_extension_contract.starts', this.contractAsset.extension_start_date)
				.where('lease_extension_contract.ends', this.contractAsset.extension_end_date)
				.where('lease_extension_contract.state', 'IN', ['draft', 'active'])
				.selectOne('lease_extension_contract')
				.orElse({ lease_extension_contract: null });

			// If contract asset with matching conditions found, set extension contract ID
			if (!gs.nil(contractAssetWithExtensionContract.lease_extension_contract)) {
				extensionContract.sys_id = contractAssetWithExtensionContract.lease_extension_contract;
			}

			// If contract asset with matching conditions not found, create new contract
			if (gs.nil(contractAssetWithExtensionContract.lease_extension_contract)) {
				var newContractAttr = new global.GlideQuery('ast_contract')
					.where('sys_id', this.contractAsset.contract)
					.selectOne('contract_model', 'vendor', 'vendor_contract', 'approver',
						'short_description', 'contract_administrator', 'business_owner')
					.get();
				delete newContractAttr.sys_id;

				newContractAttr.vendor_contract = 'EXT_' + newContractAttr.vendor_contract;
				if (!gs.nil(newContractAttr.short_description)) {
					var msgParam = [newContractAttr.short_description];
					newContractAttr.short_description = gs.getMessage('{0} extension', msgParam);
				}
				newContractAttr.starts = this.contractAsset.extension_start_date;
				newContractAttr.ends = this.contractAsset.extension_end_date;
				newContractAttr.lease_expiration_date = this.contractAsset.extension_end_date;
				newContractAttr.state = utils.CONTRACT_STATE_DRAFT;
				newContractAttr.substate = utils.CONTRACT_SUBSTATE_APPROVED;
				newContractAttr.renewable = false;

				extensionContract = new global.GlideQuery('ast_contract')
					.insert(newContractAttr)
					.get();
			}

			// Create contract asset under the extension contract
			new global.GlideQuery('clm_m2m_contract_asset')
				.insert({
					contract: extensionContract.sys_id,
					asset: this.contractAsset.asset,
					added: this.contractAsset.extension_start_date,
				})
				.get();

			// Set current contract asset removed to extension contract start date
			new global.GlideQuery('clm_m2m_contract_asset')
				.where('sys_id', this.contractAsset.sys_id)
				.update({
					lease_extension_contract: extensionContract.sys_id,
					removed: this.contractAsset.extension_start_date,
				});
		};
		this.messageForUser = function () {
			if (this.missingValues.length > 0) { return this.utils.getMandatoryFieldsMessage(this.missingValues); }
			return this.message;
		};
	},

	handleTaskCompletion: function (taskRec) {
		var result = { checksPassed: false, message: '' };

		var taskName = taskRec.getValue('task_name');
		var TaskHandlerFunction = this.getTaskHandlerFunction(taskName);
		if (!TaskHandlerFunction) { return result; }

		var taskHandler = new TaskHandlerFunction(taskRec, this);
		result.checksPassed = taskHandler.checks();
		if (result.checksPassed) { taskHandler.updates(); }
		result.message = taskHandler.messageForUser();

		return result;
	},

	/* ***************************************************
			Trigger Return, Buyout or Extend Flows
	*************************************************** */
	_getFlowToExecute: function (leaseAction, assetCoveredID) {
		var flow = this.DEFAULT_LEASED_ASSET_FLOWS[leaseAction];
		var decisionID = this.DEFAULT_LEASED_ASSET_DECISION_IDS[leaseAction];
		var decisionInputs = {};
		decisionInputs.asset_covered = assetCoveredID;
		return HAMUtils.getFlowFromDecisionTable(decisionID, decisionInputs, flow);
	},

	closePlanningTask: function(contractAssetID) {
		var planningTaskGr = new global.GlideQuery('sn_hamp_contract_asset_task')
			.where('contract_asset', contractAssetID)
			.where('task_name', 'lease_planning')
			.toGlideRecord();
		planningTaskGr.query();
		while (planningTaskGr.next()) {
			planningTaskGr.state = 3;
			planningTaskGr.work_notes = gs.getMessage('Task closed due to selection of lease action in parent record');
			planningTaskGr.setWorkflow(false);
			planningTaskGr.update();
		}
	},

	closeLeaseReturnSettlementTask: function(taskID, poNum) {
		var settlementTaskGr = new global.GlideQuery('sn_hamp_contract_asset_task')
			.where('sys_id', taskID)
			.toGlideRecord();
		settlementTaskGr.query();
		if (settlementTaskGr.next()) {
			settlementTaskGr.state = 3;
			settlementTaskGr.work_notes = gs.getMessage('Task closed due to receiving of purchase order {0}', [poNum]);
			settlementTaskGr.update();
		}
	},

	closeLeaseReturnSettlementTasks: function(po) {
		var settlementTasks = [];
		var poNumber = po.getValue('number');
		new global.GlideQuery('proc_po_item')
			.where('purchase_order', po.getUniqueValue())
			.whereNotNull('asset_task')
			.select('asset_task')
			.forEach(function(pol) { settlementTasks.push(pol.asset_task); });
		for (var i = 0; i < settlementTasks.length; i++) {
			this.closeLeaseReturnSettlementTask(settlementTasks[i], poNumber);
		}
	},

	isValidLeaseActionChange: function(previousAction, currentAction, contract) {
		var isExpirationActivated = new sn_hamp.HAMContractManagementUtils().isContractExpirationActivated(contract);
		if (!isExpirationActivated) { return false; }

		var validActionsFromNone = ['return', 'buyout', 'extend'];
		var validActionsFromReturn = ['buyout', 'extend'];

		if (((previousAction === null) && (validActionsFromNone.indexOf(currentAction) !== -1))
			|| ((previousAction === 'return') && (validActionsFromReturn.indexOf(currentAction) !== -1))) {
			return true;
		}
		return false;
	},

	triggerFlowOnLeaseActionChange: function (contractAssetRec, leaseAction) {
		var contractAssetID = contractAssetRec.getUniqueValue();
		var flowName = this._getFlowToExecute(leaseAction, contractAssetID);
		if (gs.nil(flowName)) {
			gs.addErrorMessage(gs.getMessage('Flow is not configured in decision table'));
		} else {
			var inputs = {};
			inputs.current = contractAssetRec;
			inputs.table_name = 'clm_m2m_contract_asset';
			var flowContextID = HAMUtils.triggerFlowAsyncronously(flowName, inputs);
			if (flowContextID) { this.setLeaseExpirationFlowContextID(flowContextID, contractAssetID); }
		}
	},

	getMaxResultsForLookupInLeaseContractExpFlow: function () {
		var DEFAULT_MAX_RESULTS = 1000;
		var maxResults = DEFAULT_MAX_RESULTS;
		var maxResultsAssetProperty = new global.GlideQuery('asset_property')
			.where('key', 'com.sn_hamp.flow.lease_contract_expiration.max_results')
			.selectOne('value')
			.orElse({ value: null });
		if (maxResultsAssetProperty.value
			&& !isNaN(maxResultsAssetProperty.value)) { maxResults = maxResultsAssetProperty.value; }
		return maxResults;
	},

	type: 'HAMLeaseContractExpirationUtils',
};

HAMLeaseContractExpirationUtils.canCloseLeaseContractTask = function(LeaseContractTask) {
	var roles = ['itil', 'inventory_admin', 'contract_manager'];
	var hasAccess = gs.getUser().hasRole(roles);
	return (hasAccess && (LeaseContractTask.getValue('state') === '1'
	|| LeaseContractTask.getValue('state') === '2'));
};

HAMLeaseContractExpirationUtils.getLikeKindReturnedAssetRefQualifier = function(contractAssetGr){
		return "model_category=" + contractAssetGr.asset.model_category.toString();
};

HAMLeaseContractExpirationUtils.validateFieldsForContractTask = function(LeaseContractTask) {
	LeaseContractTask.state = 3;
	LeaseContractTask.update();
	return '';
};