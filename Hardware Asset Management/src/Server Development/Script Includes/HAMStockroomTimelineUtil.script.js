var HAMStockroomTimelineUtil = Class.create();

HAMStockroomTimelineUtil.prototype = {
    initialize: function(stockroom, timelineTransform, eventSections) {
        this.timelineTransform = timelineTransform;
        this.stockroom = stockroom;
        this.eventSections = eventSections;
        this.hasEvents = false;
        this.COLOUR_GREEN = 'rgb(var(--now-color_grouped--green-yellow-2, 154, 173, 94))';
    },
    getHAMStockroomOrdersData: function() {
        var timelineUtils = this;

        this.getDisposalTasks(timelineUtils);
        this.getLoanerTasks(timelineUtils);
        this.getAssetAuditsData(timelineUtils);
        this.getReclamationTasksData(timelineUtils);
        this.getRMATasks(timelineUtils);

        if (GlidePluginManager.isActive('com.snc.procurement')) {
            this.getAssetTasksData(timelineUtils);
        }

    },
    getDisposalTasks: function(timelineUtils) {
        this.hasEvents = false;

        new global.GlideQuery('sn_hamp_hw_asset_disposal_task')
            .where('hardware_disposal.stockroom', this.stockroom)
            .where('task_name', 'IN', ['verify', 'schedule', 'depart'])
            .where('active', true)
            .select('hardware_disposal.scheduled_date', 'sys_id', 'number', 'task_name', 'sys_created_on', 'short_description')
            .forEach(function(disposalTask) {
                var scheduledDate = disposalTask.task_name === 'depart' ? disposalTask.hardware_disposal.scheduled_date : disposalTask.sys_created_on;
                timelineUtils.addEventDetails(
                    disposalTask.sys_id,
                    disposalTask.number,
                    disposalTask.short_description,
                    scheduledDate,
                    timelineUtils.COLOUR_GREEN,
                    'DISPOSAL_ORDERS',
                    'sn_hamp_hw_asset_disposal_task',
                    true
                );

            });
        if (this.hasEvents && gs.nil(this.eventSections["DISPOSAL_ORDERS"])) {
            var val = {};
            val['id'] = "DISPOSAL_ORDERS";
            val['title'] = gs.getMessage('Disposal orders');
            val['isCollapsed'] = false;
            val['showHeader'] = true;
            this.eventSections["DISPOSAL_ORDERS"] = val;
        }
    },
    getLoanerTasks: function(timelineUtils) {
        this.hasEvents = false;

        new global.GlideQuery('sn_hamp_loaner_asset_task')
            .where(new global.GlideQuery()
                .where('task_name', 'IN', ['prepare', 'deploy'])
                .where('loaner_order.asset_stockroom', this.stockroom))
            .orWhere(new global.GlideQuery()
                .where('task_name', 'reclaim')
                .where('return_stockroom', this.stockroom))
            .select('loaner_order.start_date', 'loaner_order.return_date', 'task_name', 'sys_created_on', 'sys_id', 'number', 'short_description', 'active')
            .forEach(function(loanerTask) {

                var scheduledDate;
                var isDateTimeObj;
                if (loanerTask.task_name === 'prepare') {
                    scheduledDate = loanerTask.sys_created_on;
                    isDateTimeObj = true;
                } else if (loanerTask.task_name === 'deploy') {
                    scheduledDate = loanerTask.loaner_order.start_date;
                    isDateTimeObj = false;
                } else if (loanerTask.task_name === 'reclaim') {
                    scheduledDate = loanerTask.loaner_order.return_date;
                    isDateTimeObj = false;
                }
                if (loanerTask.active) {
                    timelineUtils.addEventDetails(
                        loanerTask.sys_id,
                        loanerTask.number,
                        loanerTask.short_description,
                        scheduledDate,
                        timelineUtils.COLOUR_GREEN,
                        'LOANER_ORDERS',
                        'sn_hamp_loaner_asset_task',
                        isDateTimeObj
                    );
                }
            });
        if (this.hasEvents && gs.nil(this.eventSections.LOANER_ORDERS)) {
            var val = {};
            val['id'] = 'LOANER_ORDERS';
            val['title'] = gs.getMessage('Loaner orders');
            val['isCollapsed'] = false;
            val['showHeader'] = true;
            this.eventSections['LOANER_ORDERS'] = val;
        }
    },
    getAssetAuditsData: function(timelineUtils) {
        this.hasEvents = false;

        new global.GlideQuery('sn_hamp_asset_audit')
            .where('stockroom', this.stockroom)
            .whereNotNull('scheduled_date')
            .where('status', 'NOT IN', ['complete'])
            .select('scheduled_date', 'sys_id', 'audit_number', 'sys_created_on')
            .forEach(function(audit) {
                timelineUtils.addEventDetails(
                    audit.sys_id,
                    audit.audit_number,
                    gs.getMessage('Asset audit'),
                    audit.scheduled_date,
                    timelineUtils.COLOUR_GREEN,
                    'AUDITS',
                    'sn_hamp_asset_audit',
                    false
                );
            });

        if (this.hasEvents && gs.nil(this.eventSections["AUDITS"])) {
            var val = {};
            val['id'] = "AUDITS";
            val['title'] = gs.getMessage('Asset audits');
            val['isCollapsed'] = false;
            val['showHeader'] = true;
            this.eventSections["AUDITS"] = val;
        }
    },
    getAssetTasksData: function(timelineUtils) {
        this.hasEvents = false;
        new global.GlideQuery('consume_asset_task')
            .where('stockroom', this.stockroom)
            .where('active', true)
            .select('sys_created_on', 'sys_id', 'number', 'short_description')
            .forEach(function(assetTask) {
                timelineUtils.addEventDetails(
                    assetTask.sys_id,
                    assetTask.number,
                    assetTask.short_description,
                    assetTask.sys_created_on,
                    timelineUtils.COLOUR_GREEN,
                    'ASSET_REQUESTS',
                    'consume_asset_task',
                    true
                );
            });

        if (this.hasEvents && gs.nil(this.eventSections["ASSET_REQUESTS"])) {
            var val = {};
            val['id'] = "ASSET_REQUESTS";
            val['title'] = gs.getMessage('Asset requests');
            val['isCollapsed'] = false;
            val['showHeader'] = true;
            this.eventSections["ASSET_REQUESTS"] = val;
        }
    },
    getReclamationTasksData: function(timelineUtils) {
        this.hasEvents = false;
        new global.GlideQuery('sn_hamp_asset_reclaim_task')
            .where('return_stockroom', this.stockroom)
            .where('active', true)
            .select('sys_created_on', 'sys_id', 'number', 'short_description')
            .forEach(function(reclamationTask) {
                timelineUtils.addEventDetails(
                    reclamationTask.sys_id,
                    reclamationTask.number,
                    reclamationTask.short_description,
                    reclamationTask.sys_created_on,
                    timelineUtils.COLOUR_GREEN,
                    'RECLAMATION_LINES',
                    'sn_hamp_asset_reclaim_task',
                    true
                );
            });

        if (this.hasEvents && gs.nil(this.eventSections["RECLAMATION_LINES"])) {
            var val = {};
            val['id'] = "RECLAMATION_LINES";
            val['title'] = gs.getMessage('Reclamation lines');
            val['isCollapsed'] = false;
            val['showHeader'] = true;
            this.eventSections["RECLAMATION_LINES"] = val;
        }
    },
    getRMATasks: function(timelineUtils) {
        this.hasEvents = false;
        new global.GlideQuery('sn_hamp_asset_rma_task')
            .where('stockroom', this.stockroom)
            .where('active', true)
            .select('sys_created_on', 'sys_id', 'number', 'short_description', 'task_name', 'ship_date')
            .forEach(function(rmaTask) {
                var scheduledDate = (rmaTask.task_name == 'shipment' && !gs.nil(rmaTask.ship_date)) ? rmaTask.ship_date : rmaTask.sys_created_on;
                var isDateTimeObj = (scheduledDate == rmaTask.ship_date) ? false : true;
                    timelineUtils.addEventDetails(
                        rmaTask.sys_id,
                        rmaTask.number,
                        rmaTask.short_description,
                        scheduledDate,
                        timelineUtils.COLOUR_GREEN,
                        'RMA_REQUEST_LINES',
                        'sn_hamp_asset_rma_task',
                        isDateTimeObj
                    );
            });

        if (this.hasEvents && gs.nil(this.eventSections["RMA_REQUEST_LINES"])) {
            var val = {};
            val['id'] = 'RMA_REQUEST_LINES';
            val['title'] = gs.getMessage('RMA request lines');
            val['isCollapsed'] = false;
            val['showHeader'] = true;
            this.eventSections['RMA_REQUEST_LINES'] = val;
        }

    },
    addEventDetails: function(taskId, taskNumber, description, scheduledDate, colour, group, tableName, isDateTime) {
        if (!gs.nil(scheduledDate)) {
            var timelineObj = {};
            timelineObj.id = taskId;
            timelineObj.title = taskNumber;
            timelineObj.description = description;
            timelineObj.ariaLabel = taskNumber;
            timelineObj.bgColor = colour;
            timelineObj.group = group;
            timelineObj.start = scheduledDate;
            timelineObj.end = scheduledDate;
            var gdt = new GlideDateTime(scheduledDate);
            if (isDateTime) {
                gdt = new GlideDateTime(gdt.getDisplayValue());
            }
            timelineObj.startMS = gdt.getDate().getNumericValue() - gdt.getTZOffset();
            gdt.addDaysUTC(1);
            timelineObj.endMS = gdt.getDate().getNumericValue() - gdt.getTZOffset();
            timelineObj.navigationDetails = {
                taskType: 'hardware',
                tableName: tableName,
            };
            this.timelineTransform.push(timelineObj);
            this.hasEvents = true;
        }
    },


    type: 'HAMStockroomTimelineUtil'
};