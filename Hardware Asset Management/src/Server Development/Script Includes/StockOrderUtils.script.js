/* global sn_sc */
var StockOrderUtils = Class.create();
StockOrderUtils.prototype = {
	initialize: function() {
	},
	type: 'StockOrderUtils',
};
StockOrderUtils.isStockOrderItem = function(reqItemSysId) {
	var C_STOCK_ORDER_SYS_ID = '4109aa5fdb22001015a8ffefbf961984';
	if (reqItemSysId.toString() === C_STOCK_ORDER_SYS_ID) {
		return true;
	}
	return false;
};
StockOrderUtils.createStockOrderReq = function(stockRule, availableStock, orderQuantity) {
	var errorMsg = 'Unable to create Catalog item as Catalog item is not specified';
	var stockroom = stockRule.stockroom;
	var model = stockRule.model;
	var quantity = orderQuantity;
	var stockroomManager = stockRule.stockroom.manager;
	var stockRuleSysId = stockRule.sys_id;
	// Sys Id of Stock order catalog item
	var STOCK_ORDER_CAT_ITEM_SYS_ID = '4109aa5fdb22001015a8ffefbf961984';
	var isItemEmpty = new global.GlideQuery('sc_cat_item')
		.where('sys_id', STOCK_ORDER_CAT_ITEM_SYS_ID)
		.selectOne()
		.isEmpty();

	// Create request using CartJS API
	if (!isItemEmpty) {
		var cart = new sn_sc.CartJS('hamp_stockorder_' + stockRuleSysId);
		cart.setRequestedFor(stockroomManager);
		var commentsParm = [];
		commentsParm.push(model.name);
		commentsParm.push(stockroom.name);
		commentsParm.push(stockRule.threshold);
		commentsParm.push(availableStock);
		var commentsMsg = gs.getMessage('Auto-Generated from stock rule\nModel: {0}\n'
			+ 'Stockroom: {1}\nThreshold: {2}\nAvailable stock: {3}', commentsParm);
		cart.addToCart({
			sysparm_id: STOCK_ORDER_CAT_ITEM_SYS_ID,
			sysparm_quantity: quantity.toString(),
			variables: {
				model: model.toString(),
				quantity: quantity.toString(),
				stockroom: stockroom.toString(),
				comments: commentsMsg,
				stock_rule_id: stockRuleSysId.toString(),
			},
		});
		cart.checkoutCart();
	} else {
		gs.error(errorMsg);
	}
};
StockOrderUtils.modelRefQual = function() {
	var sysClassFilter = 'sys_class_name=cmdb_hardware_product_model^ORsys_class_name=cmdb_consumable_product_model';
	var legacyFilter = 'status=In Production';
	var CSDMFilter = 'life_cycle_stage=Operational^life_cycle_stage_status=In Use';
	var filter = null;
	var stateFilter = '';
	if (global.CSDMUtil && global.CSDMUtil.isCSDMSupportActivationInstalled()) {
		filter = sysClassFilter + '^' + CSDMFilter;
		stateFilter = CSDMFilter;
	} else {
		filter = sysClassFilter + '^' + legacyFilter;
		stateFilter = legacyFilter;
	}
	if(HAMUtils.HAS_TNI_ENTITLEMENT) {
		filter = HAMUtils.alterFilterBasedOnTNIEntitlement(filter, stateFilter, 'STOCK_ORDER');
	}
	return filter;
};