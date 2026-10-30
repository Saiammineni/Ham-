answer = (function transformEntry(source,target) {
	if (gs.nil(target.sys_class_name)) {
		var getCategory = new GlideRecord("cmdb_model");
		getCategory.addQuery('model_number', source.model_id);
		getCategory.query();

		var setClass = "alm_asset"; // setting default value to hardware
		if (getCategory.next()) {
			var category = getCategory.cmdb_model_category;
			if (!gs.nil(category)) {
				category = category.split(",")[0];
				var getCategoryName = new GlideRecord("cmdb_model_category");
				getCategoryName.addQuery("sys_id", category);
				getCategoryName.query();
				if (getCategoryName.next()) {
					var table = new GlideTableHierarchy("alm_asset");
					var getTables = table.getAllExtensions();
					for (var i = 0; i < getTables.length; i++) {
						if (getCategoryName.getValue('asset_class') === getTables[i].toString()) {
							setClass = getTables[i];
							break;
						}
					}
				}
			}
		}
		return setClass;
	} else { return target.sys_class_name; }
})(source);