var StockroomUtils = Class.create();
StockroomUtils.prototype = {
    initialize: function(stockroom, reportsArray) {
        this.stockroom = stockroom;
        this.reportsArray = reportsArray;
        var stockroomGr = new GlideRecord(HAMConstants.STOCKROOM);
        stockroomGr.get(stockroom);
        this.stockroomLocation = stockroomGr.getValue('location');
    },

    getHAMReportsData: function() {
        this.hardwareAssetRequests();
        this.hardwareStockOrders();
        this.hardwareDisposalOrder();
        this.hardwareAssetAudit();
        this.hardwareRMARequest();
        this.hardwareLoanerOrders();
        this.hardwareReclamationTasks();
    },

    hardwareAssetRequests: function() {
        var locations = [];
        locations.push(this.stockroomLocation);
        var serviceLocationGr = new GlideRecord(HAMConstants.SERVICE_LOCATION_TABLE);
        serviceLocationGr.addQuery('stockroom', this.stockroom);
        serviceLocationGr.addQuery('active', true);
        serviceLocationGr.query();
        while (serviceLocationGr.next()) {
            locations.push(serviceLocationGr.getValue('location'));
        }

        // Get count of Asset requests in stockroom location and its service locations
        var queryTable = HAMConstants.SOURCE_REQUEST_ITEM_TABLE;
        var ga = new GlideAggregate(queryTable);
        ga.addQuery('state', 'IN', ['-5', '1', '2']);
        ga.addQuery('location', 'IN', locations);
        ga.addQuery('cat_item.model.sys_class_name', 'IN', ['cmdb_hardware_product_model', 'cmdb_consumable_product_model', 'cmdb_model']);
        ga.addAggregate('COUNT');
        ga.query();
        var query = ga.getEncodedQuery();
        ga.next();
        var count = ga.getAggregate('COUNT');
        if (count > 0) {
            var reportDetails = {};
            reportDetails.title = gs.getEscapedMessage("Hardware asset requests");
            reportDetails.count = count;
            reportDetails.table = queryTable;
            reportDetails.query = query;
            reportDetails.listView = '';
			reportDetails.reportType= 'HAM';
            this.reportsArray.push(reportDetails);
        }
    },

    hardwareStockOrders: function() {
        var queryTable = HAMConstants.SOURCE_REQUEST_ITEM_TABLE;
        var ga = new GlideAggregate(queryTable);
        ga.addQuery('state', 'IN', ['-5', '1', '2']);
        ga.addQuery('cat_item', HAMConstants.HARDWARE_INVENTORY_STOCK_ORDER);
        ga.addQuery('variables.853c6adfdb22001015a8ffefbf961900', this.stockroom); // Stockroom variable
        ga.addAggregate('COUNT');
        ga.query();
        var query = ga.getEncodedQuery();
        ga.next();
        var count = ga.getAggregate('COUNT');
        if (count > 0) {
            var reportDetails = {};
            reportDetails.title = gs.getEscapedMessage("Hardware stock orders");
            reportDetails.count = count;
            reportDetails.table = queryTable;
            reportDetails.query = query;
            reportDetails.listView = '';
			reportDetails.reportType= 'HAM';
            this.reportsArray.push(reportDetails);
        }
    },

    hardwareDisposalOrder: function() {

        this.getReportDetailsForStockroom(
            HAMConstants.DISPOSAL_ORDER_TABLE,
            'stage',
            'NOT IN',
            ['completed', 'cancelled'],
            'stockroom',
            this.stockroom,
            gs.getEscapedMessage("Hardware disposal orders")
        );
    },

    hardwareAssetAudit: function() {

        this.getReportDetailsForStockroom(
            HAMConstants.ASSET_AUDIT_TABLE,
            'status',
            '!=',
            'complete',
            'stockroom',
            this.stockroom,
            gs.getEscapedMessage("Hardware asset audits")
        );
    },

    hardwareRMARequest: function() {
        this.getReportDetailsForStockroom(
            HAMConstants.RMA_REQUEST_LINE_TABLE,
            'stage',
            'NOT IN',
            ['completed', 'cancelled'],
            'stockroom',
            this.stockroom,
            gs.getEscapedMessage("Hardware RMA request lines")
        );
    },

    hardwareLoanerOrders: function() {

        this.getReportDetailsForStockroom(
            HAMConstants.LOANER_ASSET_TASK_TABLE,
            'state',
            'NOT IN',
            ['3', '4'],
            'loaner_order.asset.stockroom',
            this.stockroom,
            gs.getEscapedMessage("Hardware loaner orders")
        );
    },

    hardwareReclamationTasks: function() {

        this.getReportDetailsForStockroom(
            HAMConstants.RECLAIMATION_TASK_TABLE,
            'state',
            '!=',
            '3',
            'return_stockroom',
            this.stockroom,
            gs.getEscapedMessage("Hardware reclamation tasks")
        );
    },

    getReportDetailsForStockroom: function(queryTable, stateField, stateOperator, stateValues,
        stockroomField, stockroomId, reportTitle) {
        var ga = new GlideAggregate(queryTable);
        ga.addQuery(stateField, stateOperator, stateValues);
        ga.addQuery(stockroomField, stockroomId);
        ga.addAggregate('COUNT');
        ga.query();
        var query = stateField + stateOperator + stateValues + '^' + stockroomField + '=' + stockroomId;
        ga.next();
        var count = ga.getAggregate('COUNT');
        if (count > 0) {
            var reportDetails = {};
            reportDetails.title = reportTitle;
            reportDetails.count = count;
            reportDetails.table = queryTable;
            reportDetails.query = query;
            reportDetails.listView = '';
			reportDetails.reportType= 'HAM';
            this.reportsArray.push(reportDetails);
        }
    },


    type: 'StockroomUtils'
};