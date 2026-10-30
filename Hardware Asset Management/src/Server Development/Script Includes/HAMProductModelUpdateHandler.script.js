var HAMProductModelUpdateHandler = Class.create();

HAMProductModelUpdateHandler.prototype = {
    initialize: function() {},

    process: function(gr) {
        // check if mandatory fields are empty
        if (gs.nil(gr.getValue('stage_model_number'))) {
            throw new Error('Model number of hardware product model is blank');
        }

        if (gs.nil(gr.getValue('stage_name'))) {
            throw new Error('Name of hardware product model is blank');
        }

        if (gs.nil(gr.getValue('stage_hw_product'))) {
            throw new Error('Product of hardware product model is blank');
        }

        if (gr.getValue('name') !== gr.getValue('stage_name')) {
            sn_hamp.HAMProductModelUpdateHandler.nameChangeHandler(gr, 'name', 'stage_name');
        }

        var colAndTypeArr = [{
                name: 'model_number',
                stageName: 'stage_model_number',
                isReference: false
            },
            {
                name: 'hw_product',
                stageName: 'stage_hw_product',
                isReference: true
            },
            {
                name: 'description',
                stageName: 'stage_description',
                isReference: false
            },
            {
                name: 'active',
                stageName: 'stage_active',
                isReference: false
            },
            {
                name: 'height',
                stageName: 'stage_height',
                isReference: false
            },
            {
                name: 'width',
                stageName: 'stage_width',
                isReference: false
            },
            {
                name: 'depth',
                stageName: 'stage_depth',
                isReference: false
            },
            {
                name: 'weight',
                stageName: 'stage_weight',
                isReference: false
            },
            {
                name: 'power',
                stageName: 'stage_power',
                isReference: false
            },
            {
                name: 'energy_star',
                stageName: 'stage_energy_star',
                isReference: false
            },
            {
                name: 'epeat_compliant',
                stageName: 'stage_epeat_compliant',
                isReference: false
            },
            {
                name: 'epeat_level',
                stageName: 'stage_epeat_level',
                isReference: false
            },
            {
                name: 'manufacturer_warranty',
                stageName: 'stage_manufacturer_warranty',
                isReference: false
            },
            {
                name: 'features',
                stageName: 'stage_features',
                isReference: false
            }
        ];

        colAndTypeArr.forEach(function(colAttrs) {
            if (gr.getValue(colAttrs['name']) !== gr.getValue(colAttrs['stageName'])) {
                sn_hamp.HAMUpdateHandler.noChangeHandler(gr, colAttrs['name'], colAttrs['stageName'], colAttrs['isReference']);
            }
        });
    },

    type: 'HAMProductModelUpdateHandler',
};

HAMProductModelUpdateHandler.nameChangeHandler = function(gr, column, stagingColumn) {
    var comments = '';
    var params = {
        hwProductModelSysId: gr.getUniqueValue(),
        oldName: gr.getValue(column),
        newName: gr.getValue(stagingColumn),
        companyDisplayValue: gr.hw_product.hw_manufacturer.company.getDisplayValue(),
    };

    // update model record
    var result = HAMProductModelUpdateHandler.processNameChange(params);
    gs.info(JSON.stringify(result));
    if (result.status === 'SUCCESS') {
        comments = result.message.map(function(msg) {
            return msg.table + ' : ' + msg.recordCount + ' : ' + msg.time;
        }).join('\n');
    }

    // Auditing and Update
    global.ContentAuditUtil.addAuditEntry(gr.getTableName(), gr.getValue('sys_id'), column,
        gr.getDisplayValue(column), gr.getDisplayValue(stagingColumn), comments,
        sn_hamp.HAMUpdateHandler.AUDIT_TABLE, gr.getValue(column), gr.getValue(stagingColumn));
    sn_hamp.HAMUpdateHandler.updateRecord(gr, column, stagingColumn);
};

HAMProductModelUpdateHandler.processNameChange = function(params) {
    var outputResult = {};
    if ((!gs.nil(params.hwProductModelSysId)) && (params.newName !== params.oldName)) {
        var stopWatch;
        var messageList = [];
        var values = [params.companyDisplayValue, params.newName];
        var displayName = global.ModelUtils.generateDisplayName(values);
        // hwnorm2hamp sn_hamp.HAMConstants.MODEL_TYPES.forEach(function(table) {
        sn_hamp.HAMConstants.MODEL_TYPES.forEach(function(table) {
            var message = {};
            // hwnorm2hamp stopWatch = new GlideStopWatch();
            stopWatch = global.ModelUtils.getStopWatch();

            var gr = new GlideRecord(table);
            gr.addQuery('normalized_model', params.hwProductModelSysId);
            gr.setValue('display_name', displayName);
            // hwnorm2hamp gr.setWorkflow(false);
            // hwnorm2hamp gr.updateMultiple();
            global.ModelUtils.updateMultipleDisableBR(gr);

            message.table = table;
            message.recordCount = gr.getRowCount();
            // hwnorm2hamp message.time = stopWatch.toString();
            message.time = global.ModelUtils.getStopWatchTime(stopWatch);
            messageList.push(message);
        });

        outputResult.message = messageList;
        outputResult.status = global.ContentUpdateAPI.STATUS_SUCCESS;
    } else {
        outputResult.status = global.ContentUpdateAPI.STATUS_FAILURE;
    }

    return outputResult;
};