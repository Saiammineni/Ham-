var HAMProcurementUtils = Class.create();
HAMProcurementUtils.prototype = {
	initialize: function () { },

	PO_TYPE_LEASE_BUYOUT: 'lease_buyout',
	PO_TYPE_LEASE_EXTENSION: 'lease_extension',
	PO_TYPE_LEASE_SETTLEMENT: 'lease_settlement',
	SETTLEMENT: { action: 'return', po_type: 'lease_settlement' },
	BUYOUT: { action: 'buyout', po_type: 'lease_buyout' },
	EXTEND: { action: 'extend', po_type: 'lease_extension' },
	CONTRACT_STATE_REQUESTED: 'requested',
	CONTRACT_TYPE: '',

	// eslint-disable-next-line max-len
	PO_CREATION_ERR_MSG: gs.getMessage('Purchase order could not be created. Please contact your system administrator.'),
	// eslint-disable-next-line max-len
	POL_CREATION_ERR_MESG: gs.getMessage('Purchase order line could not be created. Please contact your system administrator.'),

	/* ******************************************************
				UI Action condition checkers
	****************************************************** */
	showCancelOnPurchaseOrder: function (po) {
		var response = { answer: true, continueProcessing: true };
		if (this._isPurchaseOrderTypeLease(po)) {
			response.answer = false;
			response.continueProcessing = false;
		}
		return response;
	},

	showReceiveInIEOnPurchaseOrder: function (po) {
		var response = { answer: true, continueProcessing: true };
		if (this._isPurchaseOrderTypeLease(po)) {
			response.answer = false;
			response.continueProcessing = false;
		}
		return response;
	},

	showReceiveOnPurchaseOrder: function (po) {
		var response = { answer: true, continueProcessing: true };
		if (this._isPurchaseOrderTypeLease(po)) {
			response.answer = false;
			response.continueProcessing = false;
		}
		return response;
	},

	showLeasePOReceiveOnPurchaseOrder: function (po) {
		var isPOTypeLease = this._isPurchaseOrderTypeLease(po);
		var isPOOrdered = (po.getValue('status') === 'ordered');
		return isPOTypeLease && isPOOrdered;
	},

	showHardwareCreationLinkOnPurchaseOrder: function (po) {
		var response = { answer: true, continueProcessing: true };
		if (this._isPurchaseOrderTypeLease(po)) {
			response.answer = false;
			response.continueProcessing = false;
		}
		return response;
	},

	showOrderOnPurchaseOrder: function (po) { // eslint-disable-line
		var response = { answer: true, continueProcessing: true };
		return response;
	},

	showDeleteOnPurchaseOrder: function (po) { // eslint-disable-line
		var response = { answer: true, continueProcessing: true };
		return response;
	},

	showCancelOnPurchaseOrderLine: function (pol) {
		var response = { answer: true, continueProcessing: true };
		if (this._isPurchaseOrderTypeLease(null, pol)) {
			response.answer = false;
			response.continueProcessing = false;
		}
		return response;
	},

	showOrderOnPurchaseOrderLine: function (pol) {
		var response = { answer: true, continueProcessing: true };
		if (this._isPurchaseOrderTypeLease(null, pol)) {
			response.answer = false;
			response.continueProcessing = false;
		}
		return response;
	},

	showHardwareCreationLinkOnPurchaseOrderLine: function (pol) {
		var response = { answer: true, continueProcessing: true };
		if (this._isPurchaseOrderTypeLease(null, pol)) {
			response.answer = false;
			response.continueProcessing = false;
		}
		return response;
	},

	shouldCreateAssetsFromRSL: function (rsl) {
		var response = { answer: true, continueProcessing: true };
		if (this._isPurchaseOrderTypeLease(null, rsl.purchase_line)) {
			response.answer = false;
			response.continueProcessing = false;
		}
		return response;
	},

	/* ******************************************************
								Utils
	****************************************************** */

	_isPurchaseOrderTypeLease: function (po, pol) {
		var poType;
		if (po) {
			poType = po.getValue('po_type');
		} else if (pol) {
			poType = String(pol.purchase_order.po_type);
		}
		if (poType === this.PO_TYPE_LEASE_BUYOUT || poType === this.PO_TYPE_LEASE_EXTENSION
			|| poType === this.PO_TYPE_LEASE_SETTLEMENT) { return true; }
		return false;
	},

	receiveLeasePO: function (po) {
		// Create receiving slip
		var rs = new global.ProcurementUtils().createReceiptSlip(po, po.ship_to.sys_id);
		if (!rs.isValidRecord()) {
			// eslint-disable-next-line max-len
			gs.addErrorMessage(gs.getMessage('Receiving slip for Purchase order {0} could not be created. Please contact your system administrator.', [po.number]));
		} else {
			// For each purchase order line item, create receiving slip line
			new global.GlideQuery('proc_po_item')
				.where('purchase_order', po.getUniqueValue())
				.select('sys_id', 'ordered_quantity', 'total_cost$CURRENCY_STRING', 'asset_task.asset', 'number')
				.forEach(function (pol) {
					// Create receiving slip line
					var rslID = new global.ProcurementUtils().createReceiptSlipLine(
						rs, pol, pol.ordered_quantity,
						pol.total_cost$CURRENCY_STRING
					);
					if (gs.nil(rslID)) {
						// eslint-disable-next-line max-len
						gs.addErrorMessage(gs.getMessage('Receiving slip line for purchase order line {0} could not be created. Please contact your system administrator.', [pol.number]));
					}
					if (pol.asset_task && pol.asset_task.asset) { // Update alm_asset record, if present
						var assetGr = new global.GlideQuery('alm_asset')
							.where('sys_id', pol.asset_task.asset)
							.toGlideRecord();
						assetGr.query();
						assetGr.next();
						if (assetGr.isValidRecord()) {
							var purchaseOrderNumber = String(po.number);
							assetGr.setValue('po_number', purchaseOrderNumber);
							assetGr.setValue('purchase_date', new GlideDateTime().getDisplayValue());

							var purchaseLineOnAsset = assetGr.purchase_line.getDisplayValue();
							if (!gs.nil(purchaseLineOnAsset)) {
								// eslint-disable-next-line max-len
								assetGr.work_notes = gs.getMessage('Purchase line updated from {0} to {1}', [purchaseLineOnAsset, pol.number]);
							}
							assetGr.setValue('purchase_line', pol.sys_id);

							if (!gs.nil(rslID)) { assetGr.setValue('receiving_line', rslID); }

							var msgParams = [assetGr.getDisplayValue(), purchaseOrderNumber];
							if (po.getValue('po_type') === 'lease_buyout') {
								// eslint-disable-next-line max-len
								assetGr.work_notes = gs.getMessage('Asset {0} received through Lease buyout purchase order {1}', msgParams);
							} else if (po.getValue('po_type') === 'lease_extension') {
								// eslint-disable-next-line max-len
								assetGr.work_notes = gs.getMessage('Asset {0} received through Lease extension purchase order {1}', msgParams);
							}
							assetGr.update();
						}
					}
				});
		}
		po.setValue('status', 'received');
		po.update();
	},
	_createPOLineItemForAsset: function(assetCoveredGR, purchaseOrderSysID, assetTaskGR) {
		var poLineAsset = assetTaskGR.asset;
		var lineItemData = {
			vendor: assetCoveredGR.contract.vendor,
			ordered_quantity: 1,
			model: poLineAsset.model,
			purchase_order: purchaseOrderSysID,
			asset_task: assetTaskGR.sys_id,
		};
		var msgParams = [poLineAsset.getDisplayValue()];
		if (this.CONTRACT_TYPE === this.BUYOUT) {
			lineItemData.short_description = gs.getMessage('Lease buyout for Asset : {0}', msgParams);
		} else if (this.CONTRACT_TYPE === this.EXTEND) {
			lineItemData.short_description = gs.getMessage('Lease extension for Asset : {0}', msgParams);
		} else if (this.CONTRACT_TYPE === this.SETTLEMENT) {
			lineItemData.short_description = gs.getMessage('Lease settlement for Asset : {0}', msgParams);
			lineItemData.cost = assetCoveredGR.lease_settlement_amount.getCurrencyString();
		}
		try {
			var poLineItem = new global.GlideQuery('proc_po_item')
				.insert(lineItemData)
				.get();
			return poLineItem;
		} catch (err) {
			return null;
		}
	},
	_createNewPurchaseOrder: function(contractRec) {
		var poData = {
			vendor: contractRec.vendor,
			contract: contractRec.sys_id,
			po_type: this.CONTRACT_TYPE.po_type,
			requested_by: contractRec.contract_administrator,
		};
		var msgParams = [contractRec.vendor_contract];
		if (this.CONTRACT_TYPE === this.BUYOUT) {
			poData.short_description = gs.getMessage('Lease buyout for Contract : {0}', msgParams);
		} else if (this.CONTRACT_TYPE === this.EXTEND) {
			poData.short_description = gs.getMessage('Lease extension for Contract : {0}', msgParams);
		} else if (this.CONTRACT_TYPE === this.SETTLEMENT) {
			poData.short_description = gs.getMessage('Lease settlement for Contract : {0}', msgParams);
		}

		try {
			var poRec = new global.GlideQuery('proc_po')
				.insert(poData)
				.get();
			return poRec.sys_id;
		} catch (error) {
			return null;
		}
	},
	_checkIfPOExists: function(contract) {
		var purchaseOrderRec = new global.GlideQuery('proc_po')
			.where('status', this.CONTRACT_STATE_REQUESTED)
			.where('po_type', this.CONTRACT_TYPE.po_type)
			.where('contract', contract)
			.selectOne('sys_id')
			.orElse(null);

		return gs.nil(purchaseOrderRec) ? null : purchaseOrderRec.sys_id;
	},
	createPOLine: function(assetCoveredGR, assetTaskGR) {
		var contract = assetCoveredGR.contract;
		var leaseAction = assetCoveredGR.lease_action.toString();
		if (leaseAction === this.BUYOUT.action) {
			this.CONTRACT_TYPE = this.BUYOUT;
		} else if (leaseAction === this.EXTEND.action) {
			this.CONTRACT_TYPE = this.EXTEND;
		} else if (leaseAction === this.SETTLEMENT.action) {
			this.CONTRACT_TYPE = this.SETTLEMENT;
		} else {
			return;
		}

		var purchaseOrderSysID = this._checkIfPOExists(contract);
		var isNewPurchaseOrder = false;
		if (gs.nil(purchaseOrderSysID)) {
			purchaseOrderSysID = this._createNewPurchaseOrder(contract);
			isNewPurchaseOrder = true;
		}
		if (gs.nil(purchaseOrderSysID)) {
			assetTaskGR.work_notes = this.PO_CREATION_ERR_MSG;
			assetTaskGR.update();
		} else {
			var poLineItem = this._createPOLineItemForAsset(assetCoveredGR, purchaseOrderSysID, assetTaskGR);
			if (gs.nil(poLineItem)) {
				assetTaskGR.work_notes = this.POL_CREATION_ERR_MESG;
				assetTaskGR.update();

				if (isNewPurchaseOrder) {
					new global.GlideQuery('proc_po')
						.where('sys_id', purchaseOrderSysID)
						.deleteMultiple();
				}
			} else {
				// Associate purchase order line to contract asset
				new global.GlideQuery('clm_m2m_contract_asset')
					.where('sys_id', assetCoveredGR.sys_id)
					.update({ po_line_item: poLineItem.sys_id });
			}
		}
	},

	type: 'HAMProcurementUtils',
};
HAMProcurementUtils.BUNDLE_TABLE = 'alm_bundle';
// eslint-disable-next-line max-len
HAMProcurementUtils.createRecSlipLineBundle = function(pol, rsl, qty, assetSysIds, reserve, assetDetails) {
	var STATUS_BUILD = 11;
	var STATUS_IN_TRANSIT = 9;
	var STATUS_ON_ORDER = 2;
	var po = new GlideRecord('proc_po');
	po.get(pol.purchase_order);

	var asset = new GlideRecord('alm_asset');
	asset.addQuery('purchase_line', pol.sys_id);
	asset.addQuery('receiving_line', '');

	asset.addQuery('install_status', STATUS_ON_ORDER).addOrCondition('install_status', STATUS_IN_TRANSIT);

	/* Incase of asset are precreated and */
	if (!gs.nil(assetSysIds) && assetSysIds.length > 0) {
		asset.addQuery('sys_id', 'IN', assetSysIds.join(','));
	}
	asset.query();
	var itemNumber = 0;

	while (qty > 0) {
		if (asset.next()) {
			asset.install_status = STATUS_BUILD;
			asset.receiving_line = rsl.sys_id;
			asset.stockroom = rsl.receiving_slip.stockroom;
			asset.cost = rsl.cost;
			// eslint-disable-next-line max-len
			asset.work_notes = gs.getMessage('Received through Purchase Order {0} by {1}', [(new global.ProcurementUtils().getHref(po, po.number)), (gs.getUser().getFullName())]);
			asset.update();
			qty -= 1; // eslint-disable-line no-param-reassign
		} else {
			HAMProcurementUtils._createBundle(po, pol, STATUS_BUILD, rsl, reserve, itemNumber, assetDetails);
			qty -= 1; // eslint-disable-line no-param-reassign
		}
		itemNumber += 1;
	}
};

HAMProcurementUtils._createBundle = function(po, pol, status, rsl, reserve, itemNumber, assetDetails) {
	// Respect "Don't create assets" option
	if (String(pol.model.asset_tracking_strategy) === 'do_not_track') {
		return;
	}

	// Avoid creating asset if there's no category
	if (!pol.model.cmdb_model_category) {
		// eslint-disable-next-line max-len
		var message = gs.getMessage('No Assets for "{0}" were created because the Product Model does not have a Model Category', pol.model.display_name);
		gs.addInfoMessage(message);
		return;
	}

	var asset = new GlideRecord('alm_bundle');
	asset.initialize();
	asset.model = pol.model;
	asset.install_status = status;
	asset.purchase_line = pol.sys_id;
	asset.request_line = pol.request_line;
	asset.model_category = sn_hamp.HAMConstants.BUNDLE_CATEGORY_ID;
	asset.vendor = po.vendor;
	asset.acquisition_method = 'purchase';
	if (!gs.nil(assetDetails) && !gs.nil(assetDetails[itemNumber])) {
		if (assetDetails[itemNumber].serial_number) {
			asset.serial_number = assetDetails[itemNumber].serial_number;
		}
		if (assetDetails[itemNumber].asset_tag) {
			asset.asset_tag = assetDetails[itemNumber].asset_tag;
		}
	}
	if (rsl) {
		asset.receiving_line = rsl.sys_id;
		asset.cost = rsl.cost;
		asset.stockroom = rsl.receiving_slip.stockroom;
		// eslint-disable-next-line max-len
		asset.work_notes = gs.getMessage('Received through Purchase Order {0} by {1}', [(new global.ProcurementUtils().getHref(po, po.number)), (gs.getUserDisplayName())]);
	}
	asset.insert();
};