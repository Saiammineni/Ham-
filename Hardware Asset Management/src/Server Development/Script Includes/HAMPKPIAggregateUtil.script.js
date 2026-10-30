var HAMPKPIAggregateUtil = Class.create();
HAMPKPIAggregateUtil.prototype = {
	initialize: function() {
	},
	PRODUCT: 'hardware',
	AGGREGATION_DETAILS: {
		total_spend: {
			table: 'alm_hardware',
			query: 'install_statusIN6,9,1,3',
			field: 'cost',
			fieldType: 'currency',
			aggregate: 'SUM',
		},
		asset_fulfillment_time: {
			table: 'sc_req_item',
			query: 'cat_item.sys_class_name=pc_hardware_cat_item^ORcat_item=57be3d29b7121010189e22b5de11a937^state=3',
			fieldType: 'integer',
			aggregate: 'COUNT',
		},
		pool_v_purchase: {
			pulled_from_pool: {
				table: 'consume_asset_task',
				query: 'state=3',
				fieldType: 'integer',
				aggregate: 'COUNT',
			},
			net_new_purchase: {
				table: 'proc_po_item',
				query: 'model.sys_class_name=cmdb_hardware_product_model^ORmodel.sys_class_name=cmdb_consumable_product_model^status=received',
				fieldType: 'integer',
				aggregate: 'COUNT',
			},
		},
		end_of_life_models: {
			end_of_life: {
				table: 'cmdb_hardware_model_lifecycle',
				query: 'lifecycle_phase=end_of_life^model.statusNOT INRetired,Sold^lifecycle_type=publisher^active=true^start_dateBETWEENjavascript:gs.beginningOfToday()@javascript:gs.monthsAgo(-3)',
				fieldType: 'integer',
				aggregate: 'COUNT',
			},
			end_of_support: {
				table: 'cmdb_hardware_model_lifecycle',
				query: 'lifecycle_phase=end_of_support^model.statusNOT INRetired,Sold^lifecycle_type=publisher^active=true^start_dateBETWEENjavascript:gs.beginningOfToday()@javascript:gs.monthsAgo(-3)',
				fieldType: 'integer',
				aggregate: 'COUNT',
			},
			end_of_extended_support: {
				table: 'cmdb_hardware_model_lifecycle',
				query: 'lifecycle_phase=end_of_extended_support^model.statusNOT INRetired,Sold^lifecycle_type=publisher^active=true^start_dateBETWEENjavascript:gs.beginningOfToday()@javascript:gs.monthsAgo(-3)',
				fieldType: 'integer',
				aggregate: 'COUNT',
			},
		},
		missing_assets: {
			table: 'alm_hardware',
			query: 'install_status=8^substatus=lost^ORsubstatus=stolen^EQ',
			fieldType: 'integer',
			aggregate: 'COUNT',
		}
	},

	computeMetricsForHAM: function() {
		var kpiAggregateUtil = new sn_itam_common.AssetKPIAggregateUtil(); // eslint-disable-line
		kpiAggregateUtil.calculateAndInsertAggregateFromQuery(this.AGGREGATION_DETAILS.total_spend, 'total_spend', this.PRODUCT, '');

		kpiAggregateUtil.calculateAndInsertAggregateFromQuery(this.AGGREGATION_DETAILS.pool_v_purchase.pulled_from_pool, 'pool_v_purchase', this.PRODUCT, 'pulled_from_pool');
		kpiAggregateUtil.calculateAndInsertAggregateFromQuery(this.AGGREGATION_DETAILS.pool_v_purchase.net_new_purchase, 'pool_v_purchase', this.PRODUCT, 'net_new_purchase');

		kpiAggregateUtil.calculateAssetFulfillmentTime(this.AGGREGATION_DETAILS.asset_fulfillment_time, this.PRODUCT);

		kpiAggregateUtil.calculateAndInsertAggregateFromQuery(this.AGGREGATION_DETAILS.end_of_life_models.end_of_life, 'end_of_life_models', this.PRODUCT, 'end_of_life');
		kpiAggregateUtil.calculateAndInsertAggregateFromQuery(this.AGGREGATION_DETAILS.end_of_life_models.end_of_support, 'end_of_life_models', this.PRODUCT, 'end_of_support');
		kpiAggregateUtil.calculateAndInsertAggregateFromQuery(this.AGGREGATION_DETAILS.end_of_life_models.end_of_extended_support, 'end_of_life_models', this.PRODUCT, 'end_of_extended_support');
		kpiAggregateUtil.calculateAndInsertAggregateFromQuery(this.AGGREGATION_DETAILS.missing_assets, 'missing_assets', this.PRODUCT, '');
	},

	type: 'HAMPKPIAggregateUtil',
};