var HAMProcSourceRequestManager = Class.create();
HAMProcSourceRequestManager.MODEL_TABLE = 'cmdb_model';
HAMProcSourceRequestManager.HARDWARE_MODEL_TABLE = 'cmdb_hardware_product_model';
HAMProcSourceRequestManager.C_STOCK_ORDER_CAT_SYS_ID = '4109aa5fdb22001015a8ffefbf961984';
HAMProcSourceRequestManager.prototype = Object.extendsObject(global.ProcSourceRequestManager, {

	_HAMgetRequestData: function(scReqSysid) {
		// get stock order and request items with Hardware Asset Management process variable not null
		var reqItems = this._getRecordObject('sc_req_item',
			[{
				key: 'request',
				value: scReqSysid,
			},
			{
				key: 'sourced',
				value: 'false',
			},
			[{
				key: 'variables.dbccd3f2b7621010189e22b5de11a90e',
				value: 'null',
				operator: '!=',
			},
			{
				key: 'variables.6189629fdb22001015a8ffefbf96197f',
				value: 'null',
				operator: '!=',
			}],
			],
			['sys_id', 'number', 'quantity', 'quantity_sourced', 'request', 'price',
				'state', 'received', 'sourced', 'requested_for', 'variables',
			], {
				cat_item: {
					table: 'sc_cat_item',
					fields: ['cost', 'sys_id', 'model', 'name', 'category'],
				},
				request: {
					table: 'sc_request',
					fields: ['sys_id', 'requested_for'],
				},
			});
		for (var i = 0; i < reqItems.length; i++) {
			var item = reqItems[i];
			this._setInitialUIProperties(item);
			this._populateUserInfo(item);
			if (StockOrderUtils.isStockOrderItem(item.cat_item.sys_id)) {
				item.remain_quantity = parseInt(item.quantity, 10) - parseInt(item.quantity_sourced, 10);
				item.cat_item.displayName = item.cat_item.name;
				this._populateStockOrderItemInfo(item);
				if (item.cat_item.model) {
					this._getSourceableData(item, item.dest_stockroom.value);
				}
			} else {
				var dupItem;
				var repModel;
				var reqItemGR = new global.GlideQuery('sc_req_item')
					.where('sys_id', item.sys_id)
					.toGlideRecord();
				reqItemGR.query();
				if (reqItemGR.next()) {
					var sourcingSet = JSON.parse(reqItemGR.variables.sn_hamp_sourcing_set);
					var unsourcedCount = 0;
					var modelGQ = new global.GlideQuery(HAMProcSourceRequestManager.MODEL_TABLE);
					var modelRecord;
					for (var j = 0; j < sourcingSet.length; j++) {
						repModel = sourcingSet[j].sn_hamp_model;
						dupItem = JSON.parse(JSON.stringify(item));
						this._setInitialUIProperties(dupItem);
						dupItem.cat_item.model = repModel.toString();
						modelRecord = modelGQ.get(repModel.toString(), ['display_name']);
						dupItem.cat_item.displayName = modelRecord._value.display_name;
						dupItem.quantity = parseInt(sourcingSet[j].sn_hamp_quantity, 10);
						dupItem.remain_quantity = parseInt(sourcingSet[j].sn_hamp_quantity, 10)
						- parseInt(sourcingSet[j].sn_hamp_quantity_sourced, 10);
						// autopopulate the source stockroom for local order
						// autopopulate the destination stockroom for transfer and purchase order
						if (dupItem.showCard.local
						&& dupItem.requested_user.location) {
							this._populateLocalOrderInfo(dupItem);
						}
						if (dupItem.remain_quantity > 0) {
							this._getSourceableData(dupItem);
							reqItems.splice(i + unsourcedCount, 0, dupItem);
							unsourcedCount += 1;
						}
					}
					reqItems.splice(i + unsourcedCount, 1);
					i += (unsourcedCount - 1);
				}
			}
		}
		return reqItems;
	},

	_HAMupdateRequestItemForRemainQuantity: function(item, model, transAmount) {
		// Iterate through the sourcing set to update the corresponding model's quantity sourced
		var sourcingSet = JSON.parse(item.variables.sn_hamp_sourcing_set);
		var sourced = true;
		for (var i = 0; i < sourcingSet.length; i++) {
			if (sourcingSet[i].sn_hamp_model === model) {
				// update the sourced quantity of row whose model matches with the current model
				sourcingSet[i].sn_hamp_quantity_sourced = parseInt(sourcingSet[i].sn_hamp_quantity_sourced, 10)
				+ parseInt(transAmount, 10);
			}
			// mark the sourced false if atleast one model in the sourcing set has remaining quantity
			if (parseInt(sourcingSet[i].sn_hamp_quantity, 10)
			- parseInt(sourcingSet[i].sn_hamp_quantity_sourced, 10) > 0) {
				sourced = false;
			}
		}
		if (sourced) {
			// update the RITM as sourced
			item.quantity_sourced = 1;
			item.sourced = true;
		}
		item.variables.sn_hamp_sourcing_set = sourcingSet;
	},

	_addHAMRITMFilter: function (gr) {
		var qc = gr.addNotNullQuery('cat_item.model');
		qc.addOrCondition('cat_item.sys_id', HAMProcSourceRequestManager.C_STOCK_ORDER_CAT_SYS_ID);
		// Checking if HAM process variable is not null
		qc.addOrCondition('variables.dbccd3f2b7621010189e22b5de11a90e', '!=', '');
	},

	_populateStockOrderItemInfo: function (item) {
		item.stock_order = true;
		// Local stock option is not available for 'Stock Order'
		item.showCard.local = false;

		var stockItem = new global.GlideQuery('sc_req_item')
			.where('sys_id', item.sys_id)
			.toGlideRecord();
		stockItem.query();
		if (stockItem.next()) {
			var model = stockItem.variables.model;
			item.cat_item.model = model.toString();
			item.cat_item.displayName = model.display_name.toString();

			var stockroom = stockItem.variables.stockroom;
			var stock = {};
			var stockroomColumns = ['sys_id'];
			var stockroomSearchField = 'name';
			if (item.stockroomSearchField) {
				stockroomSearchField = item.stockroomSearchField;
			}
			stockroomColumns.push(stockroomSearchField);
			stock = this._getRecordObject('alm_stockroom',
				[{ key: 'sys_id', value: stockroom }],
				stockroomColumns);

			if (!gs.nil(stock)) {
				var destStock = {};
				destStock.value = stock[0].sys_id;
				destStock.displayValue = stock[0][stockroomSearchField];
				item.dest_stockroom = destStock;
				// Destination stockroom should be equal to 'Replenishing Stockroom'
				this._setObjectDefaultValue(JSON.stringify(destStock), ['transfer', 'purchase'], item.destDefault);
				this._setObjectDefaultValue(true, ['transfer', 'purchase'], item.destReadOnly);
				// Source stockroom should not contain 'Replenishing Stockroom'
				item.sourceExclude.transfer = [destStock.value].toString();
			}
		}
		return item;
	},

	type: 'HAMProcSourceRequestManager',
});