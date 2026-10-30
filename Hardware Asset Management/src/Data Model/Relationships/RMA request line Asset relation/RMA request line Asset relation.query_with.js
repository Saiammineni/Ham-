(function refineQuery(current, parent) {
    if (parent.getValue('sys_class_name') === HAMConstants.BUNDLE_ASSET_TABLE) {
        var componentIds = [];
        new global.GlideQuery(HAMConstants.ALM_ASSET_TABLE)
            .where('parent', parent.getUniqueValue())
            .where('asset_function', 'asset_bundle')
            .select('sys_id')
            .forEach(function(rec) {
                componentIds.push(rec.sys_id);
            });
        if (componentIds.length > 0) {
            current.addQuery('asset', 'IN', componentIds);
        } else {
            current.addNullQuery('sys_id');
        }
    } else {
        var reqLineIDs = [];
        new global.GlideQuery(HAMRMAUtils.ASSET_RMA_TASK_TABLE)
            .where('vendor_action', 'replace')
            .where('replacement_asset', parent.getUniqueValue())
            .select('rma_request_line')
            .forEach(function(rec) {
                reqLineIDs.push(rec.rma_request_line);
            });
        var queryBuilder = new global.GlideQuery(HAMRMAUtils.RMA_REQUEST_LINE_TABLE)
            .where('asset', parent.getUniqueValue());
        if (reqLineIDs.length > 0) {
            queryBuilder = queryBuilder.orWhere('sys_id', 'IN', reqLineIDs);
        }
        var query = queryBuilder.toGlideRecord().getEncodedQuery();
        current.addEncodedQuery(query);
    }

})(current, parent);