(function refineQuery(current, parent) {
	var categoryIds = [];
        categoryIds = new sn_hamp.HAMLicensingUtility()._getAllModelCategories(parent.getUniqueValue());
        current.addQuery('sys_id', 'IN', categoryIds);
})(current, parent);