var HAMAjaxProcessor = Class.create();
HAMAjaxProcessor.CONFIG_TABLE = 'sn_hamp_configuration';
HAMAjaxProcessor.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {
	getProductRecord: function(productModelSysId) {
		var gr = new GlideRecord(sn_hamp.HAMConstants.CONTENT_TABLES.HW_PRODUCT);
		gr.get(productModelSysId);
		if (gr.isValid()) {
			return gr;
		}
		return '';
	},
	getmanufacturerForProduct: function(productRecord) {
		var companySysId = '';
		var coreCompanyUtil = new sn_hamp.HAMCoreCompanyUtil();
		if (productRecord.isValid()) {
			companySysId = productRecord.hw_manufacturer.company;
			if (gs.nil(companySysId)) { companySysId = coreCompanyUtil.resolveForCoreCompanyByManufacturer(productRecord.hw_manufacturer); }
		}
		return companySysId;
	},
	getProductForProductModel: function(productModelSysId) {
		var gr = new GlideRecord(sn_hamp.HAMConstants.CONTENT_TABLES.HW_PRODUCT_MODEL);
		gr.get(productModelSysId);
		if (gr.isValid()) {
			return gr.getValue('hw_product');
		}
	},
	getRelatedReferencesForProductModel: function() {
		var productModelSysId = this.getParameter('sysparm_product_model_id');
		var result = this.newItem('result');
		var productSysId = this.getProductForProductModel(productModelSysId);
		var productRecordGr = this.getProductRecord(productSysId);
		var deviceTypeSysId = productRecordGr.getValue('device_type');
		var companySysId = this.getmanufacturerForProduct(productRecordGr);
		result.setAttribute('hw_product', productSysId);
		result.setAttribute('device_type', deviceTypeSysId);
		result.setAttribute('company', companySysId);
		return result;
	},
	getRelatedReferencesForProduct: function() {
		var productSysId = this.getParameter('sysparm_product_id');
		var result = this.newItem('result');
		var productRecordGr = this.getProductRecord(productSysId);
		var deviceTypeSysId = productRecordGr.getValue('device_type');
		var companySysId = this.getmanufacturerForProduct(productRecordGr);
		result.setAttribute('device_type', deviceTypeSysId);
		result.setAttribute('company', companySysId);
		return result;
	},
	hasCustomerOptedIn: function () {
		var optinConfig = new global.GlideQuery(HAMAjaxProcessor.CONFIG_TABLE)
			.where('value', 'true')
			.select('sys_id')
			.limit(1)
			.toArray(1);
		if (optinConfig.length === 1) { return true; }
		return false;
	},
	releaseAssets: function () {
		var bundledAsset = this.getParameter('sysparm_bundled_asset');
		if (!gs.nil(bundledAsset)) {
			sn_hamp.HAMUtils.releaseAssets(bundledAsset);
		}
	},
	cancelLoanerAsset: function () {
		var loanerAssetId = this.getParameter('sysparm_loaner_asset');
		if (!gs.nil(loanerAssetId)) {
			new sn_hamp.HampLoanerUtils().cancelLoanerOrder(loanerAssetId);
		}
	},
	type: 'HAMAjaxProcessor',
});