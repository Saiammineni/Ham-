var PlannedAssetRelatedListItemCandidateFilter = Class.create();
PlannedAssetRelatedListItemCandidateFilter.prototype = {
	initialize: function (tableName, parentFieldName, parentRecordSysId, referencedFieldName) {
		this.tableName = GlideStringUtil.escapeQueryTermSeparator(tableName);
		this.parentFieldName = GlideStringUtil.escapeQueryTermSeparator(parentFieldName);
		this.parentRecordSysId = GlideStringUtil.escapeQueryTermSeparator(parentRecordSysId);
		this.referencedFieldName = GlideStringUtil.escapeQueryTermSeparator(referencedFieldName);
	},
	getFilterQuery: function () {
		var selectedRecord = new GlideRecord(this.tableName);
		selectedRecord.addQuery(this.parentFieldName, this.parentRecordSysId);
		selectedRecord.query();
		var result = [];
		while (selectedRecord.next()) {
			result.push(selectedRecord.getValue(this.referencedFieldName));
		}
		var query = '';
		if (result.length) {
			query = 'sys_idNOT IN' + result.join(',');
		}
		query += '^';
		query += new sn_hamp.HampHWDisposalUtils().plannedAssetsfilter();
		return query;
	},
	handles: function (thing) {
		return thing === 'PLANNED_ASSETS_EXTENSION_POINT';
	},
	type: 'PlannedAssetRelatedListItemCandidateFilter',
};