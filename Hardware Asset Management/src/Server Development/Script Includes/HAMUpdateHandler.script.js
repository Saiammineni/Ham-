var HAMUpdateHandler = Class.create();

HAMUpdateHandler.AUDIT_TABLE = 'sn_hamp_content_audit';

HAMUpdateHandler.JOB_PARAMS = {
	propertyTableName: 'asset_property',
	keyLastRunDate: 'com.sn_hamp.content.update.lastRunDate',
	jobLogMessage: 'HAM - Apply latest content changes',
	onPremTracker: 'sn_hamp_manage_hw_library',
	contentTables: [
		'sn_hamp_hw_device_type',
		'sn_hamp_hw_manufacturer',
		'sn_hamp_hw_product',
		'sn_hamp_hw_product_model',
		'sn_hamp_maturity_content'
	],
	contentTablesHandlers: {
		sn_hamp_hw_device_type: 'HAMDeviceTypeUpdateHandler',
		sn_hamp_hw_manufacturer: 'HAMManufacturerUpdateHandler',
		sn_hamp_hw_product: 'HAMProductUpdateHandler',
		sn_hamp_hw_product_model: 'HAMProductModelUpdateHandler',
		sn_hamp_maturity_content: 'HAMMaturityItemContentHandler',
	},
	runPostProcessing: [
		'sn_hamp_maturity_content'
	],
};
// DEV NOTE: Whenever modifying/adding to content tables list above,
// modify TABLES_MAP below as per need, it will be used in on-prem script include
HAMUpdateHandler.TABLES_MAP = {
	sn_hamp_hw_device_type: {
		mandatoryColumns: ['name'],
		mapping: {
			name: 'stage_name',
			description: 'stage_description',
			unspsc_commodity_id: 'stage_unspsc_commodity_id',
			active: 'stage_active',
		},
	},
	sn_hamp_hw_manufacturer: {
		mandatoryColumns: ['name'],
		mapping: {
			name: 'stage_name',
			description: 'stage_description',
			webpage: 'stage_webpage',
			active: 'stage_active',
		},
	},
	sn_hamp_hw_product: {
		mandatoryColumns: ['name'],
		mapping: {
			name: 'stage_name',
			description: 'stage_description',
			device_type: 'stage_device_type',
			hw_manufacturer: 'stage_hw_manufacturer',
			active: 'stage_active',
		},
	},
	sn_hamp_hw_product_model: {
		mandatoryColumns: ['name', 'model_number'],
		mapping: {
			name: 'stage_name',
			description: 'stage_description',
			model_number: 'stage_model_number',
			hw_product: 'stage_hw_product',
			active: 'stage_active',
			height: 'stage_height',
			width: 'stage_width',
			depth: 'stage_depth',
			weight: 'stage_weight',
			power: 'stage_power',
			energy_star: 'stage_energy_star',
			epeat_compliant: 'stage_epeat_compliant',
			epeat_level: 'stage_epeat_level',
			manufacturer_warranty: 'stage_manufacturer_warranty',
			features: 'stage_features',
		},
	},

	sn_hamp_maturity_content : {
			mandatoryColumns: ['name', 'recomm_maturity_level'],
			mapping: {
				name: 'stage_name',
				short_description: 'stage_short_description',
				available_family_release_version: 'stage_available_family_release_version',
				type: 'stage_type',
				recomm_maturity_level: 'stage_recomm_maturity_level',
				purpose: 'stage_purpose',
				steps: 'stage_steps',
				order: 'stage_order',
				required: 'stage_required',
			},
		},
};

/**
** Used when no changes are required in other tables.
** Comments will be empty in this case.
** noChangeHandler will update the column based on staging value.
* */
HAMUpdateHandler.noChangeHandler = function(gr, column, stagingColumn, isTypeReference) {
	var comments = '';
	if (isTypeReference) {
		global.ContentAuditUtil.addAuditEntry(gr.getTableName(), gr.getValue('sys_id'), column,
			gr.getDisplayValue(column), gr.getDisplayValue(stagingColumn), comments,
			HAMUpdateHandler.AUDIT_TABLE, gr.getValue(column), gr.getValue(stagingColumn));
	} else {
		global.ContentAuditUtil.addAuditEntry(gr.getTableName(), gr.getValue('sys_id'), column,
			gr.getValue(column), gr.getValue(stagingColumn), comments, HAMUpdateHandler.AUDIT_TABLE,
			gr.getValue(column), gr.getValue(stagingColumn));
	}
	sn_hamp.HAMUpdateHandler.updateRecord(gr, column, stagingColumn);
};

HAMUpdateHandler.updateRecord = function(gr, column, stagingColumn) {
	gr[column] = gr[stagingColumn];
	// hwnorm2hamp gr.setWorkflow(false);
	// hwnorm2hamp gr.update();
	global.ModelUtils.updateDisableBR(gr);
};

HAMUpdateHandler.prototype = {
	initialize: function() {
	},

	type: 'HAMUpdateHandler',
};