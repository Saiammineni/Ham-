var HAMUpdateModelCategoryCount = Class.create();
HAMUpdateModelCategoryCount.prototype = {
	initialize: function() {},

	_calculateModelCategoryCount: function(tableName, modelCategorySysId) {
		var n_count = 0;
		var t_count = 0;
		var total_count = new GlideAggregate(tableName);
		total_count.addQuery(HAMConstants.MODEL_CATEGORY_TABLE, 'CONTAINS', modelCategorySysId);
		total_count.addAggregate('COUNT');
		total_count.groupBy('normalized_status');
		total_count.query();

		while (total_count.next()) {
			if (total_count.getValue('normalized_status') === sn_hamp.HAMConstants.NORM_STATUSES.NORMALIZED) { n_count = parseInt(total_count.getAggregate('COUNT')); }

			t_count += parseInt(total_count.getAggregate('COUNT'));
		}

		if (t_count == 0) {
			new global.GlideQuery(HAMConstants.MODEL_CATEGORY_NORM_SUMMARY_TABLE)
				.where('product_table', tableName)
				.where('model_category', modelCategorySysId)
				.del();
		} else {
			var record = new global.GlideQuery(HAMConstants.MODEL_CATEGORY_NORM_SUMMARY_TABLE)
				.where('product_table', tableName)
				.where('model_category', modelCategorySysId)
				.select('sys_id')
				.limit(1)
				.toArray(1);
			if (record.length == 0) {
				new global.GlideQuery(HAMConstants.MODEL_CATEGORY_NORM_SUMMARY_TABLE)
					.insert({
						model_category: modelCategorySysId, product_table: tableName, total_count: t_count, norm_count: n_count,
					});
			} else {
				new global.GlideQuery(HAMConstants.MODEL_CATEGORY_NORM_SUMMARY_TABLE)
					.where('product_table', tableName)
					.where('model_category', modelCategorySysId)
					.updateMultiple({ total_count: t_count, norm_count: n_count });
				// using updateMultiple as update requires record's sys_id
			}
		}
	},

	updateModelCategoryCount: function() {
		new global.GlideQuery(HAMConstants.MODEL_CATEGORY_TABLE)
			.select('sys_id')
			.forEach(function (modelCategory) {
				this._calculateModelCategoryCount(sn_hamp.HAMConstants.MODEL_TYPES[0], modelCategory.sys_id);
				this._calculateModelCategoryCount(sn_hamp.HAMConstants.MODEL_TYPES[1], modelCategory.sys_id);
			}.bind(this));
	},


	type: 'HAMUpdateModelCategoryCount',
};