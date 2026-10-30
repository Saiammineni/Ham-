var RMAAssetLifecycleExtPoint = Class.create();
RMAAssetLifecycleExtPoint.prototype = {
	initialize: function() {
	},
	hasAccess: function(table) {
		return new GlideRecordSecure(table).canRead();
	},
	getAssetCI: function(table, assetId) {
		var assetCI = new global.GlideQuery(table).where('sys_id', assetId).selectOne('ci').get();
		return assetCI.ci;
	},
	isEventAllowed: function(table) {
		var supportedTables = ['alm_hardware'];
		return supportedTables.indexOf(table) !== -1;
	},
	getJSON: function(assetTable, assetId) {
		if (!this.isEventAllowed(assetTable)) {
			return null;
		}
		var tableName = 'sn_hamp_rma_request_line';
		var attrName = 'asset';
		var attrSysId = assetId;
		var recordCount = new global.GlideQuery(tableName)
			.where(attrName, attrSysId)
			.orWhere('replacement_asset', attrSysId)
			.count();
		var disableButton = !this.hasAccess(tableName) || recordCount === 0;
		return {
			table: tableName,
			title: gs.getMessage('RMA'),
			count: recordCount,
			query: 'asset=' + assetId,
			order: 500,
			disable: disableButton,
		};
	},

	type: 'RMAAssetLifecycleExtPoint',
};