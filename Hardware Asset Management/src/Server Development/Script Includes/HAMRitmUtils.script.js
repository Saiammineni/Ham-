var HAMRitmUtils = Class.create();
HAMRitmUtils.ASSET_TABLE = 'alm_asset';
HAMRitmUtils.HARDWARE_TABLE = 'alm_hardware';
HAMRitmUtils.HARDWARE_MODEL_TABLE = 'cmdb_hardware_product_model';
HAMRitmUtils.CATALOG_SCRIPT_CLIENT_TABLE = 'catalog_script_client';
HAMRitmUtils.prototype = {
	initialize: function() {},

	isHAMRitmSourceable: function(gr) {
		return ((sn_hamp.StockOrderUtils.isStockOrderItem(gr.cat_item.sys_id) && !gr.variables.model.nil())
	|| (typeof (gr.variables.sn_hamp_hw_asset_process) !== 'undefined'));
	},

	isRitmWithHAMFlowNotSourceable: function(gr) {
		// Zero touch request is not sourceable
		return !gs.nil(gr.cat_item.flow_designer_flow) && (gr.cat_item.flow_designer_flow == HAMZeroTouchRequestUtils.ZERO_TOUCH_REQUEST_FLOW_SYS_ID);
	},

	hamRITMtrigger: function(requestItemRecord) {
		var trigger = false;
		if (String(requestItemRecord.operation()) === 'insert') {
			// allow BR trigger if RITM either has stock order or HAM process variable set
			trigger = ((typeof (requestItemRecord.variables.sn_stock_order_variables) !== 'undefined')
				|| (typeof (requestItemRecord.variables.sn_hamp_hw_asset_process) !== 'undefined'));
		} else if (String(requestItemRecord.operation()) === 'update') {
			// allow BR trigger if refresh RITM is in waiting for approval stage
			trigger = (String(requestItemRecord.variables.sn_hamp_hw_asset_process) === 'sn_hamp_hw_refresh'
					&& requestItemRecord.getValue('stage') === 'waiting_for_approval');
		}
		return trigger;
	},

	processHAMRitm: function(requestItemRecord) {
		// RITM which either has sourcing variable set or stock order variable set are processed
		var abort = false;
		var output = {
			abort: abort,
		};
		if (typeof (requestItemRecord.variables.sn_stock_order_variables) !== 'undefined') {
			// checks if RITM has stock order variable set
			requestItemRecord.quantity = requestItemRecord.variables.quantity;
			requestItemRecord.location = requestItemRecord.variables.stockroom.location;
			if (requestItemRecord.getValue('price') === '0') {
				requestItemRecord.price = requestItemRecord.variables.model.cost;
			}
		} else if (typeof (requestItemRecord.variables.sn_hamp_hw_asset_process) !== 'undefined') {
			// checks if RITM hardware asset management process variable
			var hamProcess = requestItemRecord.variables.sn_hamp_process.toString();
			// update Hardware Asset Management process variable with value in Process variable during insert
			if (String(requestItemRecord.operation()) === 'insert') {
				requestItemRecord.variables.sn_hamp_hw_asset_process = hamProcess;
			}
			switch (hamProcess) {
			case 'sn_hamp_hw_refresh':
				var assetRefreshUtils = new HAMAssetRefreshUtils();
				output = assetRefreshUtils.processRefreshRitm(requestItemRecord);
				break;

			default:
			}
		}
		return output;
	},

	updateSourcingSet: function(requestItemRecord) {
		var assetRefreshUtils = new HAMAssetRefreshUtils();
		var hamProcess = requestItemRecord.variables.sn_hamp_hw_asset_process.toString();
		switch (hamProcess) {
		case 'sn_hamp_hw_refresh':
			assetRefreshUtils.updateRefreshSourcingSet(requestItemRecord);
			break;

		default:
		}
	},

	/** Method to determine whether to update Assigned to on CI when PO is received
	Called from 'Assign from Stock' BR
	Excluding the update for Stock order and Refresh orders */
	canUpdateCIAssignedTo: function(gr) {
		return this.isHAMRitmSourceable(gr);
	},

	/** Method to determine whether to update CI on Req Item when PO is received
	Called from 'Update Request Item CI' BR
	Excluding the update for Stock order and Refresh orders */
	canUpdateReqItemCI: function(reqItem) {
		return this.isHAMRitmSourceable(reqItem);
	},

	addLocationVariable: function(catItemSysId) {
		// Add location variable to Catalog item
		var variable = new GlideRecord('item_option_new');
		variable.name = 'location';
		variable.question_text = gs.getMessage('Location');
		variable.cat_item = catItemSysId;

		// Variable type and reference
		variable.type = 8;
		variable.order = 200;
		variable.reference = 'cmn_location';
		variable.use_reference_qualifier = 'simple';
		// help text
		variable.show_help_on_load = true;
		variable.help_text = gs.getMessage('Please select the location where this asset will be deployed.');
		variable.help_tag = '';
		variable.tooltip = gs.getMessage('Location where asset will be deployed');
		variable.insert();

		this.createCatalogScriptsForLocationVariable(catItemSysId);
	},

	createCatalogScriptsForLocationVariable: function(catItemSysId) {
		
		// Create onLoad catalog client script to default location variable to logged in user's location 
		var catScriptGrOnLoad = new GlideRecord(HAMRitmUtils.CATALOG_SCRIPT_CLIENT_TABLE);
		catScriptGrOnLoad.addQuery('name', 'Default to logged in user location');
		catScriptGrOnLoad.addQuery('cat_item', catItemSysId);
		catScriptGrOnLoad.query();
		var onLoadCatalogscript = [];
		onLoadCatalogscript.push('function onLoad() {');
		onLoadCatalogscript.push('var ga = new GlideAjax(\'sn_itam_common.ITAMCommonClientUtil\');');
		onLoadCatalogscript.push('ga.addParam(\'sysparm_name\', \'getCurrentUserLocation\');');
		onLoadCatalogscript.push('ga.getXML(parseResponse);');
		onLoadCatalogscript.push('function parseResponse(response) {');
		onLoadCatalogscript.push('var answer = response.responseXML.documentElement.getAttribute(\'answer\');');
		onLoadCatalogscript.push('var result = JSON.parse(answer);');
		onLoadCatalogscript.push('g_form.setValue(\'location\', result.location);');
		onLoadCatalogscript.push('}');
		onLoadCatalogscript.push('}');
		var onLoadCatalogscriptString = onLoadCatalogscript.join('\n');
		if (!catScriptGrOnLoad.next()) {
			new global.GlideQuery(HAMRitmUtils.CATALOG_SCRIPT_CLIENT_TABLE)
				.insert({
					name: 'Default to logged in user location',
					type: 'onLoad',
					active: true,
					ui_type: 10,
					cat_item: catItemSysId,
					applies_to: 'item',
					applies_sc_task: false,
					applies_catalog: true,
					applies_req_item: false,
					script: onLoadCatalogscriptString,
				});
		}

		// Create onLoad catalog client script to make location variable read only after RITM is sourced
		var catScriptGr = new GlideRecord(HAMRitmUtils.CATALOG_SCRIPT_CLIENT_TABLE);
		catScriptGr.addQuery('name', 'Make location readonly');
		catScriptGr.addQuery('cat_item', catItemSysId);
		catScriptGr.query();
		var script = [];
		script.push('function onLoad() {');
		script.push("var request = g_form.getValue('request');");
		script.push("var gr = new GlideRecord('sc_request');");
		script.push("gr.get(request);");
		script.push('if (gr.sourced === "true") { g_form.setVariablesReadOnly(true); }');
		script.push('}');
		var scriptString = script.join('\n');
		if (!catScriptGr.next()) {
			new global.GlideQuery(HAMRitmUtils.CATALOG_SCRIPT_CLIENT_TABLE)
				.insert({
					name: 'Make location readonly',
					type: 'onLoad',
					active: true,
					ui_type: 10,
					cat_item: catItemSysId,
					applies_to: 'item',
					applies_sc_task: true,
					applies_catalog: false,
					applies_req_item: true,
					script: scriptString,
				});
		}
	},

	type: 'HAMRitmUtils',
};