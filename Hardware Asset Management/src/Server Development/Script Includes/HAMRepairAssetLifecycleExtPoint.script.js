var HAMRepairAssetLifecycleExtPoint = Class.create();
HAMRepairAssetLifecycleExtPoint.prototype = {
    initialize: function() {},

    hasAccess: function(table) {
        return new GlideRecordSecure(table).canRead();
    },

    isEventAllowed: function(table) {
        var supportedTables = [sn_hamp.HAMConstants.HARDWARE_ASSET_TABLE];
        return supportedTables.indexOf(table) !== -1;
    },

    getJSON: function(assetTable, assetId) {
        if (!this.isEventAllowed(assetTable)) {
            return null;
        }

        var gr = new GlideRecord(assetTable);
        gr.get(assetId);

        var tableName = sn_itam_common.CommonConstants.REPAIR_ORDER_LINE_TABLE;
        var attrName = 'asset';
        var attrSysId = assetId;
        var recordCount = new global.GlideQuery(tableName)
            .where(attrName, attrSysId)
            .count();
        var disableButton = !this.hasAccess(tableName) || recordCount === 0;

        return {
            table: tableName,
            title: gs.getMessage('Repair'),
            listTitle: gs.getMessage('Repair requests'),
            listView: 'default',
            count: recordCount,
            query: 'asset=' + assetId,
            order: 1000,
            disable: disableButton,
        };
    },

    type: 'HAMRepairAssetLifecycleExtPoint'
};