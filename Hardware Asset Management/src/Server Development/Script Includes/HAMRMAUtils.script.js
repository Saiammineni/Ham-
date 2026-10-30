var HAMRMAUtils = Class.create();
HAMRMAUtils.prototype = {
	initialize: function () { },

	/* ***************************************************
							Constants
	*************************************************** */

	ASSESSMENT_TASK: 'assessment',
	REPAIR_CONFIRMATION_TASK: 'onsite_repair',
	SHIPMENT_TASK: 'shipment',
	VENDOR_RMA_DECISION_TASK: 'vendor_rma_decision',
	RECEIVE: 'receive',

	RMA_ACTION: {
		ONSITE: 'onsite',
		OFFSITE: 'offsite',
	},

	DEFAULT_RMA_FLOWS: {
		'onsite': 'sn_hamp.asset_rma_onsite_flow', // eslint-disable-line
		'offsite': 'sn_hamp.asset_rma_offsite_flow', // eslint-disable-line
	},

	DEFAULT_RMA_DECISION_IDS: {
		'onsite': '46d3b8010f122010967863cda8767e3c', // eslint-disable-line
		'offsite': '350538410f122010967863cda8767e9e', // eslint-disable-line
	},

	/* ***************************************************
							Utilities
	*************************************************** */
	getTaskHandler: function (taskName) {
		switch (taskName) {
		case this.ASSESSMENT_TASK: return this.AssessmentTaskHandler;
		case this.REPAIR_CONFIRMATION_TASK: return this.RepairTaskHandler;
		case this.SHIPMENT_TASK: return this.ShipmentTaskHandler;
		case this.VENDOR_RMA_DECISION_TASK: return this.VendorRMADecisionTaskHandler;
		case this.RECEIVE: return this.ReceiveTaskHandler;
		default: return null;
		}
	},

	getWorkNotesMessage: function (displayName, stateValue, substateValue, stockroom, taskNumber, replacementAsset) {
		var message;
		if (!gs.nil(replacementAsset)) {
			message = {
				asset_replaced_message: gs.getMessage('This asset was replaced by the asset {0} as part of task {1}',
					[replacementAsset, taskNumber]),
				asset_replacement_message: gs.getMessage('This asset has replaced the asset {0} as part of task {1}',
					[displayName, taskNumber]),
				// eslint-disable-next-line max-len
				acquisition_method_change: gs.getMessage('Acquisition method changed to {1} on asset {0} as part of task {2}',
					[replacementAsset, gs.getMessage('RMA replacement'), taskNumber]),
			};
		} else if (gs.nil(substateValue) && gs.nil(stockroom)) {
			message = gs.getMessage('Asset {0} updated to state {1} as part of task {2}',
				[displayName, stateValue, taskNumber]);
		} else if (gs.nil(stockroom)) {
			// eslint-disable-next-line max-len
			message = gs.getMessage('Asset {0} updated to state {1} and substate {2} as part of task {3}',
				[displayName, stateValue, substateValue, taskNumber]);
		} else if (gs.nil(substateValue)) {
			// eslint-disable-next-line max-len
			message = gs.getMessage('Asset {0} updated to state {1} and stockroom updated to {2} as part of task {3}',
				[displayName, stateValue, stockroom, taskNumber]);
		} else {
			// eslint-disable-next-line max-len
			message = gs.getMessage('Asset {0} updated to state {1} and substate {2}, stockroom updated to {3} as part of task {4}',
				[displayName, stateValue, substateValue, stockroom, taskNumber]);
		}
		return message;
	},

	writeToWorkNotes: function (tableName, recordId, message) {
		if (!HAMUtils.isConsumableClass(tableName)) {
			var recordGr = new GlideRecord(tableName);
			if (recordGr.get(recordId)) {
				recordGr.work_notes = message;
				recordGr.update();
			}
		}
	},

	updateRecord: function (tableName, recordId, payload) {
		new global.GlideQuery(tableName)
			.where('sys_id', recordId)
			.update(payload);
	},

	_getFlowToExecute: function (rmaAction, requestLineId) {
		var flow = this.DEFAULT_RMA_FLOWS[rmaAction];
		var decisionID = this.DEFAULT_RMA_DECISION_IDS[rmaAction];
		var decisionInputs = {};
		decisionInputs.rma_request_line = requestLineId;
		return HAMUtils.getFlowFromDecisionTable(decisionID, decisionInputs, flow);
	},

	triggerFlowOnRMAActionChange: function (requestLineGr) {
		var requestLineId = requestLineGr.getUniqueValue();
		var rmaAction = requestLineGr.getValue('rma_action');
		var flowName = this._getFlowToExecute(rmaAction, requestLineId);
		if (gs.nil(flowName)) {
			gs.addErrorMessage(gs.getMessage('Flow is not configured in decision table'));
		} else {
			var inputs = {};
			inputs.current = requestLineGr;
			inputs.table_name = HAMRMAUtils.RMA_REQUEST_LINE_TABLE;
			var flowContextID = HAMUtils.triggerFlowAsyncronously(flowName, inputs);
			if (flowContextID) {
				var payload = { flow_context: flowContextID };
				this.updateRecord(HAMRMAUtils.RMA_REQUEST_LINE_TABLE, requestLineId, payload);
			}
		}
	},

	updateBundleAsset: function (bundleId, payload, rmaAssetGr) {
		this.updateRecord(HAMConstants.BUNDLE_ASSET_TABLE, bundleId, payload);
		if (HAMUtils.isConsumableClassAsset(rmaAssetGr)) {
			this.updateConsumableComponent(rmaAssetGr, payload);
		}
	},

	updateConsumableComponent: function (assetGr, payload) {
		this.updateRecord(assetGr.getValue('sys_class_name'), assetGr.getUniqueValue(), payload);
	},

	checkOpenRMABundleComponents: function (bundleId, assetId) {
		return new global.GlideQuery(HAMConstants.ALM_ASSET_TABLE)
			.where('parent', bundleId)
			.where('sys_id', '!=', assetId)
			.where('process_table', HAMRMAUtils.RMA_REQUEST_LINE_TABLE)
			.whereNotNull('process_id')
			.selectOne()
			.isPresent();
	},

	/* ***************************************************
						Task Handlers
	*************************************************** */
	AssessmentTaskHandler: function (taskRec, utils) {
		this.taskRec = taskRec;
		this.utils = utils;
		this.missingValues = [];
		this.message = '';
		this.checks = function () {
			// eslint-disable-next-line max-len
			if (HAMUtils.checkIfFieldsEmptyInRecord(this.taskRec, ['asset', 'stockroom', 'rma_action', 'vendor'], this.missingValues)) { return false; }
			return true;
		};
		this.updates = function () {
			var currentAssetGr = HAMUtils.getAsGlideRecord(HAMConstants.ALM_ASSET_TABLE, this.taskRec.asset);
			var isNotBundleChild = HAMUtils.isNotChildOfBundle(currentAssetGr);
			var assetPayload = {
				install_status: parseInt(HAMConstants.ASSET_STATUSES.IN_STOCK, 10),
				substatus: HAMConstants.ASSET_SUB_STATUSES.PENDING_REPAIR,
				stockroom: this.taskRec.getValue('stockroom'),
			};
			var assetWorkNotes = this.utils.getWorkNotesMessage(currentAssetGr.getDisplayValue(),
				gs.getMessage('In Stock'),
				gs.getMessage('Pending Repair'),
				this.taskRec.stockroom.getDisplayValue(),
				taskRec.getValue('number'));
			if (isNotBundleChild || new sn_hamp.HAMAssetBundleUtils().isIncompleteBundle(this.taskRec.asset.parent)) {
				// Update Asset
				this.utils.updateRecord(HAMConstants.ALM_ASSET_TABLE, this.taskRec.asset, assetPayload);
			} else {
				// Update bundle
				var bundleAssetWorkNotes = this.utils.getWorkNotesMessage(currentAssetGr.parent.getDisplayValue(),
					gs.getMessage('In Stock'),
					gs.getMessage('Pending Repair'),
					this.taskRec.stockroom.getDisplayValue(),
					taskRec.getValue('number'));
				this.utils.updateBundleAsset(this.taskRec.asset.parent, assetPayload, currentAssetGr);
				this.utils.writeToWorkNotes(currentAssetGr.parent.sys_class_name,
					currentAssetGr.parent,
					bundleAssetWorkNotes);
			}
			this.utils.writeToWorkNotes(currentAssetGr.sys_class_name,
				currentAssetGr.getUniqueValue(),
				assetWorkNotes);
			// Update RMA Request Line
			var rmaLinePayload = {
				vendor: this.taskRec.vendor,
				vendor_rma_number: this.taskRec.getValue('vendor_rma_number'),
				stockroom: this.taskRec.getValue('stockroom'),
				rma_action: this.taskRec.getValue('rma_action'),
			};
			this.utils.updateRecord(HAMRMAUtils.RMA_REQUEST_LINE_TABLE, this.taskRec.rma_request_line, rmaLinePayload);
		};
		this.messageForUser = function () {
			if (this.missingValues.length > 0) { return HAMUtils.getMandatoryFieldsMessage(this.missingValues); }
			return this.message;
		};
	},

	ShipmentTaskHandler: function (taskRec, utils) {
		this.taskRec = taskRec;
		this.utils = utils;
		this.missingValues = [];
		this.message = '';
		this.checks = function () {
			// eslint-disable-next-line max-len
			if (HAMUtils.checkIfFieldsEmptyInRecord(this.taskRec, ['asset', 'vendor_rma_number', 'ship_date'], this.missingValues)) { return false; }
			return true;
		};
		this.updates = function () {
			var currentAssetGr = HAMUtils.getAsGlideRecord(HAMConstants.ALM_ASSET_TABLE, this.taskRec.asset);
			// Update Asset and remove location when asset is moved to In transit
			var assetPayload = {
				install_status: parseInt(HAMConstants.ASSET_STATUSES.IN_TRANSIT, 10),
				location: null,
				substatus: null,
			};
			var assetWorkNotes = this.utils.getWorkNotesMessage(currentAssetGr.getDisplayValue(),
				gs.getMessage('In Transit'),
				null,
				null,
				this.taskRec.getValue('number'));
			this.utils.updateRecord(HAMConstants.ALM_ASSET_TABLE, this.taskRec.asset, assetPayload);
			this.utils.writeToWorkNotes(currentAssetGr.sys_class_name,
				currentAssetGr.getUniqueValue(),
				assetWorkNotes);

			// Update RMA Request Line
			var rmaLinePayload = {
				tracking_number: this.taskRec.tracking_number,
				carrier: this.taskRec.carrier,
				shipping_carrier: this.taskRec.shipping_carrier,
				vendor_rma_number: this.taskRec.vendor_rma_number,
			};
			if (!gs.nil(this.taskRec.ship_date)) {
				rmaLinePayload.ship_date = this.taskRec.ship_date;
			}
			this.utils.updateRecord(HAMRMAUtils.RMA_REQUEST_LINE_TABLE, this.taskRec.rma_request_line, rmaLinePayload);
		};
		this.messageForUser = function () {
			if (this.missingValues.length > 0) { return HAMUtils.getMandatoryFieldsMessage(this.missingValues); }
			return this.message;
		};
	},

	RepairTaskHandler: function (taskRec, utils) {
		this.taskRec = taskRec;
		this.utils = utils;
		this.missingValues = [];
		this.message = '';
		this.checks = function () {
			var mandatoryFields = ['asset', 'repair_confirmation'];
			var isVendorRMANumberEmpty = gs.nil(this.taskRec.getValue('vendor_rma_number'));
			var isAssetRepaired = this.taskRec.getValue('repair_confirmation') === 'Y';
			var actionChangeNotInitiated = gs.nil(this.taskRec.getValue('rma_action_change'));

			if (isAssetRepaired && isVendorRMANumberEmpty) {
				mandatoryFields.push('vendor_rma_number');
			}
			// eslint-disable-next-line max-len
			if (HAMUtils.checkIfFieldsEmptyInRecord(this.taskRec, mandatoryFields, this.missingValues)) { return false; }
			if (!isAssetRepaired && actionChangeNotInitiated) {
				// eslint-disable-next-line max-len
				this.message = gs.getMessage('Asset is not repaired, change action to off-site or cancel the RMA line if asset will not be repaired');
				return false;
			}
			return true;
		};
		this.updates = function () {
			var rmaLinePayload = {};
			// If asset is repaired
			if (this.taskRec.getValue('repair_confirmation') === 'Y') {
				var assetPayload = {};
				var payload = {};
				var currentAssetGr;
				var bundleAssetGr;
				var isNotBundleChild;
				var assetCI;
				currentAssetGr = HAMUtils.getAsGlideRecord(HAMConstants.ALM_ASSET_TABLE, this.taskRec.asset);
				isNotBundleChild = HAMUtils.isNotChildOfBundle(currentAssetGr);
				assetPayload = {
					process_id: null,
					process_table: null,
				};
				payload = {
					install_status: parseInt(HAMConstants.ASSET_STATUSES.IN_STOCK, 10),
					substatus: HAMConstants.ASSET_SUB_STATUSES.AVAILABLE,
					stockroom: this.taskRec.getValue('stockroom'),
				};
				var assetWorkNotes = this.utils.getWorkNotesMessage(currentAssetGr.getDisplayValue(),
					gs.getMessage('In Stock'),
					gs.getMessage('Available'),
					this.taskRec.stockroom.getDisplayValue(),
					this.taskRec.getValue('number'));
				if (isNotBundleChild) {
					// Update Asset
					assetPayload.install_status = parseInt(HAMConstants.ASSET_STATUSES.IN_STOCK, 10);
					assetPayload.substatus = HAMConstants.ASSET_SUB_STATUSES.AVAILABLE;
					assetPayload.stockroom = this.taskRec.getValue('stockroom');
				} else if (!this.utils.checkOpenRMABundleComponents(this.taskRec.asset.parent, this.taskRec.asset)
					&& !new sn_hamp.HAMAssetBundleUtils().isIncompleteBundle(this.taskRec.asset.parent)) {
					// Update bundle
					var bundleAssetWorkNotes = this.utils.getWorkNotesMessage(currentAssetGr.parent.getDisplayValue(),
						gs.getMessage('In Stock'),
						gs.getMessage('Available'),
						this.taskRec.stockroom.getDisplayValue(),
						this.taskRec.getValue('number'));
					this.utils.updateBundleAsset(this.taskRec.asset.parent, payload, currentAssetGr);
					this.utils.writeToWorkNotes(currentAssetGr.parent.sys_class_name,
						currentAssetGr.parent,
						bundleAssetWorkNotes);
				} else {
					/** ***********************************************
					If asset is a consumable, update the consumable
					with payload to available status.

					Else, sync the bundle status to component.
					************************************************ */
					currentAssetGr = HAMUtils.getAsGlideRecord(HAMConstants.ALM_ASSET_TABLE, this.taskRec.asset);
					if (HAMUtils.isConsumableClassAsset(currentAssetGr)) {
						this.utils.updateConsumableComponent(currentAssetGr, payload);
					} else {
						// eslint-disable-next-line max-len
						bundleAssetGr = HAMUtils.getAsGlideRecord(HAMConstants.ALM_ASSET_TABLE, this.taskRec.asset.parent);
						assetCI = new global.AssetandCI();
						assetCI.inheritInfoFromParentAsset(currentAssetGr, bundleAssetGr);
						currentAssetGr.update();
					}
				}
				this.utils.updateRecord(HAMConstants.ALM_ASSET_TABLE, this.taskRec.asset, assetPayload);
				this.utils.writeToWorkNotes(currentAssetGr.sys_class_name,
					currentAssetGr.getUniqueValue(),
					assetWorkNotes);
			} else if (this.taskRec.getValue('rma_action_change') === 'offsite') {
				// Cancel on-site flow
				HAMUtils.cancelFlowWithContextId(this.taskRec.rma_request_line.flow_context,
					'User initiated off-site repair flow');
				// Initiate off-site flow
				rmaLinePayload.rma_action = this.taskRec.getValue('rma_action_change');
			}
			// Update RMA Request Line
			rmaLinePayload.vendor_rma_number = this.taskRec.getValue('vendor_rma_number');
			this.utils.updateRecord(HAMRMAUtils.RMA_REQUEST_LINE_TABLE, this.taskRec.rma_request_line, rmaLinePayload);
		};
		this.messageForUser = function () {
			if (this.missingValues.length > 0) { return HAMUtils.getMandatoryFieldsMessage(this.missingValues); }
			return this.message;
		};
	},

	VendorRMADecisionTaskHandler: function (taskRec, utils) {
		this.taskRec = taskRec;
		this.utils = utils;
		this.missingValues = [];
		this.message = '';
		this.checks = function () {
			// eslint-disable-next-line max-len
			if (HAMUtils.checkIfFieldsEmptyInRecord(this.taskRec, ['asset', 'vendor_action'], this.missingValues)) { return false; }
			return true;
		};
		this.updates = function () {
			// Update RMA Request Line
			var rmaLinePayload = {
				vendor_action: this.taskRec.vendor_action,
				vendor_tracking_number: this.taskRec.vendor_tracking_number,
				vendor_shipping_carrier: this.taskRec.vendor_shipping_carrier,
			};
			if (!gs.nil(this.taskRec.vendor_ship_date)) {
				rmaLinePayload.vendor_ship_date = this.taskRec.vendor_ship_date;
			}
			this.utils.updateRecord(HAMRMAUtils.RMA_REQUEST_LINE_TABLE, this.taskRec.rma_request_line, rmaLinePayload);
		};
		this.messageForUser = function () {
			if (this.missingValues.length > 0) { return HAMUtils.getMandatoryFieldsMessage(this.missingValues); }
			return this.message;
		};
	},

	ReceiveTaskHandler: function (taskRec, utils) {
		this.taskRec = taskRec;
		this.utils = utils;
		this.missingValues = [];
		this.message = '';
		this.checks = function () {
			var mandatoryFields = ['asset', 'asset_received'];
			if (this.taskRec.getValue('vendor_action') === 'replace') {
				mandatoryFields.push('replacement_asset');
			}
			// eslint-disable-next-line max-len
			if (HAMUtils.checkIfFieldsEmptyInRecord(this.taskRec, mandatoryFields, this.missingValues)) {
				return false;
			} if (this.taskRec.getValue('vendor_action') === 'replace') {
				if (parseInt(this.taskRec.replacement_asset.quantity, 10) < parseInt(this.taskRec.asset.quantity, 10)) {
					// eslint-disable-next-line max-len
					this.message = gs.getMessage('Replacement asset quantity is less than asset quantity. Select a replacement asset with quantity greater than or equal to asset quantity');
					return false;
				}
			}
			return true;
		};
		this.updates = function () {
			var rmaLinePayload = {};
			var payload = {};
			var assetPayload = {};
			var replacementAssetPayload = {};
			var replacementMessages = {};
			var currentAssetGr;
			var replacementAssetGr;
			var bundleAssetGr;
			var isNotBundleChild;
			var assetCI;
			var assetWorkNotes;
			var bundleAssetWorkNotes;
			currentAssetGr = HAMUtils.getAsGlideRecord(HAMConstants.ALM_ASSET_TABLE, this.taskRec.asset);
			isNotBundleChild = HAMUtils.isNotChildOfBundle(currentAssetGr);
			if (this.taskRec.getValue('vendor_action') === 'repair') {
				assetPayload = {
					process_id: null,
					process_table: null,
				};
				payload = {
					install_status: parseInt(HAMConstants.ASSET_STATUSES.IN_STOCK, 10),
					substatus: HAMConstants.ASSET_SUB_STATUSES.AVAILABLE,
					stockroom: this.taskRec.getValue('stockroom'),
				};
				assetWorkNotes = this.utils.getWorkNotesMessage(currentAssetGr.getDisplayValue(),
					gs.getMessage('In Stock'),
					gs.getMessage('Available'),
					this.taskRec.stockroom.getDisplayValue(),
					this.taskRec.getValue('number'));
				if (isNotBundleChild) {
					assetPayload.install_status = parseInt(HAMConstants.ASSET_STATUSES.IN_STOCK, 10);
					assetPayload.substatus = HAMConstants.ASSET_SUB_STATUSES.AVAILABLE;
					assetPayload.stockroom = this.taskRec.getValue('stockroom');
				} else if (!this.utils.checkOpenRMABundleComponents(this.taskRec.asset.parent, this.taskRec.asset)
					&& !new sn_hamp.HAMAssetBundleUtils().isIncompleteBundle(this.taskRec.asset.parent)) {
					bundleAssetWorkNotes = this.utils.getWorkNotesMessage(currentAssetGr.parent.getDisplayValue(),
						gs.getMessage('In Stock'),
						gs.getMessage('Available'),
						this.taskRec.stockroom.getDisplayValue(),
						this.taskRec.getValue('number'));
					this.utils.updateBundleAsset(this.taskRec.asset.parent, payload, currentAssetGr);
					this.utils.writeToWorkNotes(currentAssetGr.parent.sys_class_name,
						currentAssetGr.parent,
						bundleAssetWorkNotes);
				} else {
					/** ***********************************************
					If asset is a consumable, update the consumable
					with payload to available status.

					Else, sync the bundle status to component.
					************************************************ */
					currentAssetGr = HAMUtils.getAsGlideRecord(HAMConstants.ALM_ASSET_TABLE, this.taskRec.asset);
					if (HAMUtils.isConsumableClassAsset(currentAssetGr)) {
						this.utils.updateConsumableComponent(currentAssetGr, payload);
					} else {
						// eslint-disable-next-line max-len
						bundleAssetGr = HAMUtils.getAsGlideRecord(HAMConstants.ALM_ASSET_TABLE, this.taskRec.asset.parent);
						assetCI = new global.AssetandCI();
						assetCI.inheritInfoFromParentAsset(currentAssetGr, bundleAssetGr);
						currentAssetGr.update();
					}
				}
				this.utils.updateRecord(HAMConstants.ALM_ASSET_TABLE, this.taskRec.asset, assetPayload);
				this.utils.writeToWorkNotes(currentAssetGr.sys_class_name,
					currentAssetGr.getUniqueValue(),
					assetWorkNotes);
				rmaLinePayload = {
					asset_received: this.taskRec.asset_received,
				};
			} else if (this.taskRec.getValue('vendor_action') === 'replace') {
				this.taskRec.replacement_model = this.taskRec.replacement_asset.model;
				// Remove location when asset is retired
				assetPayload = {
					install_status: parseInt(HAMConstants.ASSET_STATUSES.RETIRED, 10),
					substatus: HAMConstants.ASSET_SUB_STATUSES.VENDOR_CREDIT,
					location: null,
					process_id: null,
					process_table: null,
				};
				assetWorkNotes = this.utils.getWorkNotesMessage(currentAssetGr.getDisplayValue(),
					gs.getMessage('Retired'),
					gs.getMessage('Vendor Credit'),
					null,
					taskRec.getValue('number'));
				// Check if RMA asset is part of bundle
				if (!isNotBundleChild) {
					var bundleUtils = new sn_hamp.HAMAssetBundleUtils();
					var assetReplaced = false;
					// Check if bundle component can be replaced
					if (HAMRMAUtils.canReplaceAsset(this.taskRec.getValue('asset'),
						this.taskRec.getValue('replacement_asset')).canReplace === 'true') {
						if (HAMUtils.isConsumableClass(this.taskRec.asset.sys_class_name)) {
							// In case of consumable, split replacement asset based on quantity
							// and move newly created consumable to retired state
							new global.Consumables().split(
								this.taskRec.getValue('replacement_asset'),
								this.taskRec.asset.quantity,
								parseInt(HAMConstants.ASSET_STATUSES.RETIRED, 10),
								HAMConstants.ASSET_SUB_STATUSES.VENDOR_CREDIT,
								'',
								'',
								'',
								''
							);
							// Update bundle component consumable record to In stock, Available
							assetPayload.install_status = parseInt(HAMConstants.ASSET_STATUSES.IN_STOCK, 10);
							assetPayload.substatus = HAMConstants.ASSET_SUB_STATUSES.AVAILABLE;
							this.utils.updateRecord(HAMConstants.ALM_ASSET_TABLE, this.taskRec.asset, assetPayload);
							assetReplaced = true;
						} else {
							// For non-consumable, invoke replace function
							var replaceAssetHash = {};
							replaceAssetHash[this.taskRec.getValue('asset')] = {
								sysId: this.taskRec.replacement_asset,
								quantity: this.taskRec.asset.quantity,
							};
							assetReplaced = bundleUtils.replaceAssets(this.taskRec.asset.parent, replaceAssetHash);
							// Update bundle component asset record to Retired, Vendor credit
							this.utils.updateRecord(HAMConstants.ALM_ASSET_TABLE, this.taskRec.asset, assetPayload);
							this.utils.writeToWorkNotes(currentAssetGr.sys_class_name,
								currentAssetGr.getUniqueValue(),
								assetWorkNotes);
						}
					}
					// Check if asset has been replaced
					if (assetReplaced) {
						// If bundle is not incomplete and
						// does not have any component with open RMA
						if (!this.utils.checkOpenRMABundleComponents(this.taskRec.asset.parent, this.taskRec.asset)
							&& !bundleUtils.isIncompleteBundle(this.taskRec.asset.parent)) {
							// Move bundle to In stock - Available  status
							payload = {
								install_status: parseInt(HAMConstants.ASSET_STATUSES.IN_STOCK, 10),
								substatus: HAMConstants.ASSET_SUB_STATUSES.AVAILABLE,
								stockroom: this.taskRec.getValue('stockroom'),
							};
							bundleAssetWorkNotes = this.utils.getWorkNotesMessage(
								this.taskRec.asset.parent.getDisplayValue(),
								gs.getMessage('In Stock'),
								gs.getMessage('Available'),
								this.taskRec.stockroom.getDisplayValue(),
								this.taskRec.getValue('number')
							);
							this.utils.updateBundleAsset(this.taskRec.asset.parent, payload, currentAssetGr);
							this.utils.writeToWorkNotes(this.taskRec.asset.parent.sys_class_name,
								this.taskRec.asset.parent,
								bundleAssetWorkNotes);
						} else {
							/** ***********************************************
							Bundle is either incomplete or
							has components with active RMA - for non-consumable
							component sync the bundle status
							************************************************ */
							replacementAssetGr = HAMUtils.getAsGlideRecord(HAMConstants.ALM_ASSET_TABLE,
								this.taskRec.replacement_asset);
							if (!HAMUtils.isConsumableClassAsset(replacementAssetGr)) {
								bundleAssetGr = HAMUtils.getAsGlideRecord(HAMConstants.ALM_ASSET_TABLE,
									this.taskRec.asset.parent);
								assetCI = new global.AssetandCI();
								assetCI.inheritInfoFromParentAsset(replacementAssetGr, bundleAssetGr);
								replacementAssetGr.update();
							}
						}
					} else {
						// Asset not replaced - Move bundle to Build status
						payload = {
							install_status: parseInt(HAMConstants.ASSET_STATUSES.BUILD, 10),
							substatus: null,
							stockroom: this.taskRec.getValue('stockroom'),
						};
						// eslint-disable-next-line max-len
						bundleAssetWorkNotes = this.utils.getWorkNotesMessage(this.taskRec.asset.parent.getDisplayValue(),
							gs.getMessage('Build'),
							null,
							this.taskRec.stockroom.getDisplayValue(),
							this.taskRec.getValue('number'));
						this.utils.updateRecord(HAMConstants.BUNDLE_ASSET_TABLE, this.taskRec.asset.parent, payload);
						this.utils.writeToWorkNotes(this.taskRec.asset.parent.sys_class_name,
							this.taskRec.asset.parent,
							bundleAssetWorkNotes);
						// Relase asset
						sn_hamp.HAMUtils.releaseAssets(
							this.taskRec.asset.parent,
							[this.taskRec.asset],
							assetPayload,
							false
						);
						this.utils.writeToWorkNotes(this.taskRec.asset.sys_class_name,
							this.taskRec.asset,
							assetWorkNotes);
						// eslint-disable-next-line max-len
						var releaseWorkNotes = gs.getMessage('Asset {0} removed from asset bundle {1} as part of task {2}',
							[this.taskRec.asset.getDisplayValue(),
								this.taskRec.asset.parent.getDisplayValue(),
								taskRec.getValue('number')]);
						this.utils.writeToWorkNotes(this.taskRec.asset.sys_class_name,
							this.taskRec.asset,
							releaseWorkNotes);
					}
				}
				// For bundle components, we are updating state and substate during replace/release
				// Checking for non-bundle components
				if (isNotBundleChild) {
					this.utils.updateRecord(HAMConstants.ALM_ASSET_TABLE, this.taskRec.asset, assetPayload);
					this.utils.writeToWorkNotes(currentAssetGr.sys_class_name,
						currentAssetGr.getUniqueValue(),
						assetWorkNotes);
				}

				replacementAssetGr = HAMUtils.getAsGlideRecord(HAMConstants.ALM_ASSET_TABLE,
					this.taskRec.replacement_asset);

				if (!HAMUtils.isConsumableClass(this.taskRec.replacement_asset.sys_class_name)) {
					replacementAssetPayload = {
						acquisition_method: 'rma_replacement',
					};
					replacementMessages = this.utils.getWorkNotesMessage(currentAssetGr.getDisplayValue(),
						null,
						null,
						null,
						this.taskRec.getValue('number'),
						replacementAssetGr.getDisplayValue());
					// eslint-disable-next-line max-len
					this.utils.updateRecord(HAMConstants.ALM_ASSET_TABLE, this.taskRec.replacement_asset, replacementAssetPayload);
				}
				this.utils.writeToWorkNotes(this.taskRec.asset.sys_class_name,
					this.taskRec.asset,
					replacementMessages.asset_replaced_message);
				this.utils.writeToWorkNotes(this.taskRec.replacement_asset.sys_class_name,
					this.taskRec.replacement_asset,
					replacementMessages.asset_replacement_message);
				this.utils.writeToWorkNotes(this.taskRec.replacement_asset.sys_class_name,
					this.taskRec.replacement_asset,
					replacementMessages.acquisition_method_change);

				rmaLinePayload = {
					asset_received: this.taskRec.asset_received,
					replacement_asset: this.taskRec.replacement_asset,
					replacement_model: this.taskRec.replacement_asset.model,
				};
			}
			// Update RMA Request Line
			this.utils.updateRecord(HAMRMAUtils.RMA_REQUEST_LINE_TABLE, this.taskRec.rma_request_line, rmaLinePayload);
		};
		this.messageForUser = function () {
			if (this.missingValues.length > 0) { return HAMUtils.getMandatoryFieldsMessage(this.missingValues); }
			return this.message;
		};
	},

	handleTaskCompletion: function (taskRec) {
		var result = { checksPassed: false, message: '' };

		var taskName = taskRec.getValue('task_name');
		var TaskHandlerFunction = this.getTaskHandler(taskName);
		if (!TaskHandlerFunction) { return result; }

		var taskHandler = new TaskHandlerFunction(taskRec, this);
		result.checksPassed = taskHandler.checks();
		if (result.checksPassed) { taskHandler.updates(); }
		result.message = taskHandler.messageForUser();

		return result;
	},

	type: 'HAMRMAUtils',
};

HAMRMAUtils.RMA_REQUEST_TABLE = 'sn_hamp_rma_request';
HAMRMAUtils.RMA_REQUEST_LINE_TABLE = 'sn_hamp_rma_request_line';
HAMRMAUtils.ASSET_RMA_TASK_TABLE = 'sn_hamp_asset_rma_task';
HAMRMAUtils.DEFAULT_REQUEST_FLOW = 'sn_hamp.asset_rma_flow';
HAMRMAUtils.RMA_REQUEST_DECISION_ID = '292061d5537120108125ddeeff7b122d';
HAMRMAUtils.CAN_CANCEL_RMA_REQUEST_STAGES = ['open'];
HAMRMAUtils.CAN_CANCEL_RMA_LINE_STAGES = ['assess', 'repair', 'ship'];
HAMRMAUtils.CAN_CANCEL_RMA_TASK_NAMES = ['assessment', 'onsite_repair', 'shipment'];
HAMRMAUtils.RMA_REQUEST_STATES = {
	OPEN: 1,
	COMPLETED: 2,
	CANCELLED: 3,
};
// Cancel UI action ID's
HAMRMAUtils.CANCEL_TASK_BUTTON_ID = 'cancel_rma_task';
HAMRMAUtils.CANCEL_RMA_LINE_BUTTON_ID = 'cancel_rma_req_line';
HAMRMAUtils.CANCEL_RMA_REQUEST_BUTTON_ID = 'cancel_rma_request';
// Cancel function names
HAMRMAUtils.CANCEL_TASK_FUNCTION_NAME = 'cancelRMATask';
HAMRMAUtils.CANCEL_RMA_LINE_FUNCTION_NAME = 'cancelRMALine';
HAMRMAUtils.CANCEL_RMA_REQUEST_FUNCTION_NAME = 'cancelRMARequest';

HAMRMAUtils.assetRefQual = function () {
	var inValidStates = [];
	inValidStates.push(HAMConstants.ASSET_STATUSES.ON_ORDER);
	inValidStates.push(HAMConstants.ASSET_STATUSES.IN_TRANSIT);
	inValidStates.push(HAMConstants.ASSET_STATUSES.RETIRED);
	inValidStates.push(HAMConstants.ASSET_STATUSES.MISSING);

	var inValidSubStates = [];
	inValidSubStates.push(HAMConstants.ASSET_SUB_STATUSES.PENDING_TRANSFER);
	inValidSubStates.push(HAMConstants.ASSET_SUB_STATUSES.PRE_ALLOCATED);

	var inValidPrcoessTables = [];
	inValidPrcoessTables.push(HAMRMAUtils.RMA_REQUEST_LINE_TABLE);

	// Exclude EAM assets and EAM models
	var eamModelExt = HAMUtils.getEAMModelClasses();
	var eamAssetExt = HAMUtils.getEAMAssetClasses();
	var gr = new GlideRecord(HAMConstants.ALM_ASSET_TABLE);
	gr.addNullQuery('model').addOrCondition('model.sys_class_name', 'NOT IN', eamModelExt);
	gr.addQuery('sys_class_name', 'NOT IN', eamAssetExt);
	gr.addQuery('sys_class_name', '!=', 'alm_license');
	gr.addQuery('sys_class_name', '!=', HAMConstants.BUNDLE_ASSET_TABLE);
	gr.addQuery('install_status', 'NOT IN', inValidStates);
	gr.addQuery('substatus', 'NOT IN', inValidSubStates)
		.addOrCondition('substatus', '');
	gr.addQuery('process_table', 'NOT IN', inValidPrcoessTables)
		.addOrCondition('process_table', '');
	if (!HAMUtils.isConsumablesSupportedByProcess()) {
		HAMUtils.getTableExtensions(HAMConstants.ALM_CONSUMABLE_TABLE).forEach(function (tableName) {
			gr.addQuery('sys_class_name', '!=', tableName);
		});
	}
	if(HAMUtils.HAS_ONLY_TNI_ENTITLEMENT) {
		var tniModelCategories = HAMUtils.getEntitledTNIModelCategories();
		gr.addQuery('model_category', 'IN', tniModelCategories);
	}
	return gr.getEncodedQuery();
};

HAMRMAUtils.replacementAssetRefQual = function (rmaTaskGr) {
	// Exclude EAM assets and EAM models
	var eamModelExt = HAMUtils.getEAMModelClasses();
	var eamAssetExt = HAMUtils.getEAMAssetClasses();
	var gr = new GlideRecord(HAMConstants.ALM_ASSET_TABLE);
	gr.addNullQuery('model').addOrCondition('model.sys_class_name', 'NOT IN', eamModelExt);
	gr.addQuery('sys_class_name', 'NOT IN', eamAssetExt);
	gr.addQuery('sys_class_name', '!=', 'alm_license');
	gr.addQuery('sys_class_name', '!=', HAMConstants.BUNDLE_ASSET_TABLE);
	gr.addQuery('install_status', HAMConstants.ASSET_STATUSES.IN_STOCK);
	gr.addQuery('substatus', HAMConstants.ASSET_SUB_STATUSES.AVAILABLE);
	gr.addNullQuery('parent');
	if (!HAMUtils.isConsumablesSupportedByProcess()) {
		HAMUtils.getTableExtensions(HAMConstants.ALM_CONSUMABLE_TABLE).forEach(function (tableName) {
			gr.addQuery('sys_class_name', '!=', tableName);
		});
	} else {
		gr.addQuery('quantity', '>=', rmaTaskGr.asset.quantity);
	}
	var currentAssetGr = HAMUtils.getAsGlideRecord(HAMConstants.ALM_ASSET_TABLE, rmaTaskGr.asset);
	var isNotBundleChild = HAMUtils.isNotChildOfBundle(currentAssetGr);
	if (!isNotBundleChild) {
		gr.addNullQuery('asset_function')
			.addOrCondition('asset_function', '!=', sn_hamp.HAMConstants.ASSET_FUNCTION.LOANER);
	}
	if(HAMUtils.HAS_ONLY_TNI_ENTITLEMENT) {
		var tniModelCategories = HAMUtils.getEntitledTNIModelCategories();
		gr.addQuery('model_category', 'IN', tniModelCategories);
	}
	return gr.getEncodedQuery();
};

HAMRMAUtils.vendorRefQual = function () {
	var gr = new GlideRecord(HAMConstants.COMPANY_TABLE);
	gr.addQuery('vendor', true)
		.addOrCondition('manufacturer', true);
	return gr.getEncodedQuery();
};

HAMRMAUtils.updateAssetRMAProcess = function (rmaReqLineGr) {
	var message;
	var assetID = rmaReqLineGr.getValue('asset');
	var quantity = parseInt(rmaReqLineGr.getValue('quantity'), 10);
	var assetGr = HAMUtils.getAsGlideRecord(HAMConstants.ALM_ASSET_TABLE, assetID);
	var assetQuantity = parseInt(assetGr.getValue('quantity'), 10);
	var model = assetGr.getValue('model');
	rmaReqLineGr.setValue('model', model);

	if (HAMLicensingUtility.isAssetExcludedFromHAMFlows(assetGr)) {
	    	// eslint-disable-next-line max-len
		message = gs.getMessage('The request line was automatically canceled because the asset {0} is excluded from the licensed features of Hardware Asset Management.', [assetGr.getDisplayValue()]);
		rmaReqLineGr.setValue('additional_info', message);
		rmaReqLineGr.setValue('stage', 'cancelled');
		return;
		
	}
	// Cancel RMA Request Line if other RMA Request Line is present for asset
	if (assetGr.getValue('process_table') === HAMRMAUtils.RMA_REQUEST_LINE_TABLE) {
		var rmaLineGr = HAMUtils.getAsGlideRecord(HAMRMAUtils.RMA_REQUEST_LINE_TABLE, assetGr.getValue('process_id'));
		if (rmaLineGr) {
			message = gs.getMessage('Request line auto cancelled - An RMA {0} is already open for asset {1}',
				[rmaLineGr.getDisplayValue(), assetGr.getDisplayValue()]);
			rmaReqLineGr.setValue('additional_info', message);
			rmaReqLineGr.setValue('stage', 'cancelled');
			return;
		}
	}
	// Process consumable asset
	if (global.ModelUtils.isAncestor(assetGr, HAMConstants.ALM_CONSUMABLE_TABLE)
		&& quantity !== assetQuantity) {
		// Cancel RMA Request Line if selected quantity is more than asset quantity
		if (quantity > assetQuantity) {
			// eslint-disable-next-line max-len
			message = gs.getMessage('Request line auto cancelled - Selected quantity({0}) is greater than asset quantity({1})',
				[quantity.toString(), assetQuantity.toString()]);
			rmaReqLineGr.setValue('additional_info', message);
			rmaReqLineGr.setValue('stage', 'cancelled');
		} else {
			// Split consumable asset and update process values on new consumable
			var consumableID = new global.Consumables().split(
				assetID,
				quantity,
				assetGr.getValue('install_status'),
				assetGr.getValue('substatus'),
				'',
				assetGr.getValue('stockroom'),
				assetGr.getValue('location'),
				assetGr.getValue('assigned_to'),
				'', {
					process_table: rmaReqLineGr.getTableName(),
					process_id: rmaReqLineGr.getUniqueValue(),
				}
			);
			rmaReqLineGr.setValue('asset', consumableID);
		}
	} else {
		// Update process values on asset
		new global.GlideQuery(HAMConstants.ALM_ASSET_TABLE)
			.where('sys_id', assetGr.getUniqueValue())
			.update({
				process_table: rmaReqLineGr.getTableName(),
				process_id: rmaReqLineGr.getUniqueValue(),
			});
	}
};

HAMRMAUtils.createRMALines = function (rmaRequestGr, recordProducer) {
	var multiModelVar = JSON.parse(recordProducer.rma_assets);
	var selectedQuantity;
	if (multiModelVar.length === 0) {
		gs.addErrorMessage(
			gs.getMessage('Your Return Merchandise Authorization order is not submitted. No asset(s) are added.')
		);
		rmaRequestGr.setAbortAction(true);
	} else {
		for (var i = 0; i < multiModelVar.length; i++) {
			selectedQuantity = parseInt(multiModelVar[i].quantity, 10);
			if (selectedQuantity === 0) {
				selectedQuantity = 1;
			}
			new global.GlideQuery(HAMRMAUtils.RMA_REQUEST_LINE_TABLE)
				.insert({
					rma_request: rmaRequestGr.getUniqueValue(),
					asset: multiModelVar[i].asset,
					quantity: selectedQuantity,
				})
				.get();
		}
		gs.addInfoMessage(
			gs.getMessage('Your Return Merchandise Authorization order {0} is successfully submitted.',
				[rmaRequestGr.getDisplayValue()])
		);
	}
	HAMRMAUtils.setRMARequestState(rmaRequestGr);
};

HAMRMAUtils.mergeConditionCheck = function (consumableGr) {
	var canMerge = true;
	if (consumableGr.getValue('process_table') === HAMRMAUtils.RMA_REQUEST_LINE_TABLE
		&& !gs.nil(consumableGr.getValue('process_id'))) {
		canMerge = false;
	}
	return canMerge;
};

HAMRMAUtils.triggerRMARequestFlow = function (request) {
	var decisionInputs = {};
	decisionInputs.rma_request = request.sys_id;
	var flow = HAMUtils.getFlowFromDecisionTable(HAMRMAUtils.RMA_REQUEST_DECISION_ID,
		decisionInputs, HAMRMAUtils.DEFAULT_REQUEST_FLOW);
	if (gs.nil(flow)) {
		gs.addErrorMessage(gs.getMessage('Flow is not configured in decision table'));
	} else {
		var inputs = {};
		inputs.current = request;
		inputs.table_name = HAMRMAUtils.RMA_REQUEST_TABLE;
		var flowContextID = sn_hamp.HAMUtils.triggerFlowAsyncronously(flow, inputs);
		if (!gs.nil(flowContextID)) {
			new global.GlideQuery(HAMRMAUtils.RMA_REQUEST_TABLE)
				.where('sys_id', request.sys_id)
				.disableWorkflow()
				.update({
					flow_context: flowContextID,
				});
		}
	}
};

HAMRMAUtils.canReplaceAsset = function (assetId, replacementAssetId) {
	var assetGr = HAMUtils.getAsGlideRecord(HAMConstants.ALM_ASSET_TABLE, assetId);
	var replacementAssetGr = HAMUtils.getAsGlideRecord(HAMConstants.ALM_ASSET_TABLE, replacementAssetId);
	var canReplace = 'false';

	if (gs.nil(assetGr.getValue('parent'))) {
		canReplace = 'not_applicable';
	} else if (assetGr.getValue('model') === replacementAssetGr.getValue('model')) {
		canReplace = 'true';
	}

	return {
		canReplace: canReplace,
	};
};

HAMRMAUtils.canCancelRMATask = function (rmaTaskGr) {
	var state = rmaTaskGr.getValue('state');
	if (state === HAMConstants.TASK_STATES.OPEN.toString()
		|| state === HAMConstants.TASK_STATES.WORK_IN_PROGRESS.toString()) {
		var taskName = rmaTaskGr.getValue('task_name');
		if (gs.nil(taskName)) {
			return true;
		}
		return HAMRMAUtils.CAN_CANCEL_RMA_TASK_NAMES.indexOf(taskName) > -1;
	}
	return false;
};

HAMRMAUtils.canCancelRMALine = function (rmaLineGr) {
	var stage = rmaLineGr.getValue('stage');
	if (HAMRMAUtils.CAN_CANCEL_RMA_LINE_STAGES.indexOf(stage) > -1) {
		return new global.GlideQuery(HAMRMAUtils.ASSET_RMA_TASK_TABLE)
			.where('rma_request_line', rmaLineGr.getUniqueValue())
			.where('task_name', 'NOT IN', HAMRMAUtils.CAN_CANCEL_RMA_TASK_NAMES)
			.selectOne()
			.isEmpty();
	}
	return false;
};

HAMRMAUtils.canCancelRMARequest = function (rmaReqGr) {
	var stage = rmaReqGr.getValue('stage');
	var canCancel = true;
	if (HAMRMAUtils.CAN_CANCEL_RMA_REQUEST_STAGES.indexOf(stage) > -1) {
		// RMA request cannot be cancelled if assessment task
		// is closed for any one RMA Request Line
		new global.GlideQuery(HAMRMAUtils.RMA_REQUEST_LINE_TABLE)
			.where('rma_request', rmaReqGr.getUniqueValue())
			.where('stage', 'NOT IN', ['assess', 'cancelled'])
			.select()
			.some(function (record) {
				// Return if any of assessment task is not open or work in progess
				canCancel = canCancel && !new global.GlideQuery(HAMRMAUtils.ASSET_RMA_TASK_TABLE)
					.where('rma_request_line', record.sys_id)
					.where('task_name', 'assessment')
					.where('state', HAMConstants.TASK_STATES.CLOSED_COMPLETE)
					.selectOne()
					.isPresent();
				return !canCancel;
			});
	} else {
		canCancel = false;
	}
	return canCancel;
};

HAMRMAUtils.cancelRMATask = function (rmaTaskGr, cancelMessage, origin) {
	if (HAMRMAUtils.canCancelRMATask(rmaTaskGr)) {
		rmaTaskGr.state = HAMConstants.TASK_STATES.CLOSED_INCOMPLETE;
		rmaTaskGr.work_notes = cancelMessage;
		rmaTaskGr.update();

		// Cancel RMA Request Line
		if (origin !== HAMRMAUtils.CANCEL_RMA_LINE_FUNCTION_NAME) {
			HAMRMAUtils.cancelRMALine(
				HAMUtils.getAsGlideRecord(HAMRMAUtils.RMA_REQUEST_LINE_TABLE, rmaTaskGr.getValue('rma_request_line')),
				cancelMessage,
				HAMRMAUtils.CANCEL_TASK_FUNCTION_NAME
			);
		}
		if (origin === HAMRMAUtils.CANCEL_TASK_BUTTON_ID) {
			if (gs.hasRole('inventory_user')) {
				gs.setRedirect(rmaTaskGr.rma_request_line.getRefRecord().getLink(true));
			} else {
				gs.setRedirect(rmaTaskGr.getLink(true));
			}
		}
		return true;
	}
	if (origin === HAMRMAUtils.CANCEL_TASK_BUTTON_ID) {
		gs.addErrorMessage(gs.getMessage('Asset RMA Task cannot be cancelled'));
	}
	return false;
};

HAMRMAUtils.cancelRMALine = function (rmaLineGr, cancelMessage, origin) {
	if (HAMRMAUtils.canCancelRMALine(rmaLineGr)) {
		var stage = rmaLineGr.getValue('stage');

		// Close related asset RMA tasks
		new global.GlideQuery(HAMRMAUtils.ASSET_RMA_TASK_TABLE)
			.where('state', 'NOT IN', [HAMConstants.TASK_STATES.CLOSED_COMPLETE,
				HAMConstants.TASK_STATES.CLOSED_INCOMPLETE])
			.where('rma_request_line', rmaLineGr.getUniqueValue())
			.select()
			.forEach(function (record) {
				HAMRMAUtils.cancelRMATask(
					HAMUtils.getAsGlideRecord(HAMRMAUtils.ASSET_RMA_TASK_TABLE, record.sys_id),
					cancelMessage,
					HAMRMAUtils.CANCEL_RMA_LINE_FUNCTION_NAME
				);
			});

		if (gs.nil(rmaLineGr.getValue('additional_info'))) {
			rmaLineGr.additional_info = cancelMessage;
		}

		if (stage === 'assess') {
			rmaLineGr.stage = 'cancelled';
		}
		rmaLineGr.update();
		if (origin === HAMRMAUtils.CANCEL_RMA_LINE_BUTTON_ID) {
			if (gs.hasRole('inventory_user')) {
				gs.setRedirect(rmaLineGr.rma_request.getRefRecord().getLink(true));
			} else {
				gs.setRedirect(rmaLineGr.getLink(true));
			}
		}
		return true;
	}
	if (origin === HAMRMAUtils.CANCEL_RMA_LINE_BUTTON_ID) {
		gs.addErrorMessage(gs.getMessage('RMA Request Line cannot be cancelled'));
	}
	return false;
};

HAMRMAUtils.cancelRMARequest = function (rmaReqGr, cancelMessage, origin) {
	if (HAMRMAUtils.canCancelRMARequest(rmaReqGr)) {
		// Close related RMA lines
		new global.GlideQuery(HAMRMAUtils.RMA_REQUEST_LINE_TABLE)
			.where('stage', 'NOT IN', ['completed', 'cancelled'])
			.where('rma_request', rmaReqGr.getUniqueValue())
			.select()
			.forEach(function (record) {
				HAMRMAUtils.cancelRMALine(
					HAMUtils.getAsGlideRecord(HAMRMAUtils.RMA_REQUEST_LINE_TABLE, record.sys_id),
					cancelMessage,
					HAMRMAUtils.CANCEL_RMA_REQUEST_FUNCTION_NAME
				);
			});

		// Mark RMA Request cancelled
		rmaReqGr.state = 3;
		if (gs.nil(rmaReqGr.getValue('additional_info'))) {
			rmaReqGr.additional_info = cancelMessage;
		}
		if (gs.nil(rmaReqGr.getValue('flow_context'))) {
			rmaReqGr.stage = 'cancelled';
		}
		rmaReqGr.update();
		return true;
	}
	if (origin === HAMRMAUtils.CANCEL_RMA_REQUEST_BUTTON_ID) {
		gs.addErrorMessage(gs.getMessage('RMA Request cannot be cancelled'));
	}
	return false;
};

HAMRMAUtils.processRMALineCancellation = function (rmaLineGr) {
	var rmaUtils = new HAMRMAUtils();
	var assetProcessPayload = {
		process_id: null,
		process_table: null,
	};
	rmaUtils.updateRecord(HAMConstants.ALM_ASSET_TABLE, rmaLineGr.getValue('asset'), assetProcessPayload);
};

HAMRMAUtils.updateRMARequestState = function (rmaLineGr) {
	var rmaRequestGr = HAMUtils.getAsGlideRecord(HAMRMAUtils.RMA_REQUEST_TABLE,
		rmaLineGr.getValue('rma_request'));
	if (rmaRequestGr) {
		HAMRMAUtils.setRMARequestState(rmaRequestGr);
		rmaRequestGr.update();
	}
};

HAMRMAUtils.setRMARequestState = function (rmaRequestGr) {
	var state;
	var uniqueStagesArray = [];
	new global.GlideQuery(HAMRMAUtils.RMA_REQUEST_LINE_TABLE)
		.where('rma_request', rmaRequestGr.getUniqueValue())
		.select('stage')
		.forEach(function (record) {
			if (uniqueStagesArray.indexOf(record.stage) === -1) {
				uniqueStagesArray.push(record.stage);
			}
		});
	if (uniqueStagesArray.length === 0) {
		state = HAMRMAUtils.RMA_REQUEST_STATES.CANCELLED;
	} else if (uniqueStagesArray.length === 1) {
		if (uniqueStagesArray.indexOf('cancelled') > -1) {
			state = HAMRMAUtils.RMA_REQUEST_STATES.CANCELLED;
		} else if (uniqueStagesArray.indexOf('completed') > -1) {
			state = HAMRMAUtils.RMA_REQUEST_STATES.COMPLETED;
		}
	} else if (uniqueStagesArray.length === 2
	&& uniqueStagesArray.indexOf('cancelled') > -1
	&& uniqueStagesArray.indexOf('completed') > -1) {
		state = HAMRMAUtils.RMA_REQUEST_STATES.COMPLETED;
	}
	rmaRequestGr.setValue('state', state);
};