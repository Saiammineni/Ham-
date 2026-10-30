(function refineQuery(current, parent) {
    current.addQuery('ref_sn_hamp_hw_refresh_line_task.refresh_line', parent.getUniqueValue())
        .addOrCondition('asset_orderline', parent.getUniqueValue());
})(current, parent);