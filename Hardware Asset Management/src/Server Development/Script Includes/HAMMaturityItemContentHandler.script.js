var HAMMaturityItemContentHandler = Class.create();

HAMMaturityItemContentHandler.NEW = '1';
HAMMaturityItemContentHandler.WIP = '2';
HAMMaturityItemContentHandler.CLOSED_COMPLETE = '3';
HAMMaturityItemContentHandler.CLOSED_SKIPPED = '7';

HAMMaturityItemContentHandler.prototype = Object.extendsObject(
    global.AssetManagementPerDomainAssetProcessSettingBaseJob, {

        initialize: function() {},

        columns: {
            name: 'name',
            order: 'order',
            purpose: 'purpose',
            suggested_maturity_level: 'suggested_maturity_level',
            maturity_level: 'suggested_maturity_level',
            required: 'required',
            short_description: 'short_description',
            steps: 'steps',
            type: 'type',
        },
        postProcessing: function() {
            this.startJob();
        },

        startJob: function() {
            global.AssetManagementPerDomainAssetProcessSettingBaseJob.prototype.process.call(this);
        },

        runJob: function() {
            var contentGr = new GlideRecord('sn_hamp_maturity_content');
            contentGr.addQuery('active', true);
            contentGr.query();
            while (contentGr.next()) {
                try {
                    this._checkCreateRecord(contentGr);
                } catch (e) {
                    gs.info('HAMMaturityItemContentHandler check/create content failed for content Id ' +
                        contentGr.getUniqueValue() + ' ' + e);
                }
            }

            contentGr = new GlideRecord('sn_hamp_maturity_content');
            contentGr.addQuery('active', false);
            contentGr.query();
            while (contentGr.next()) {
                try {
                    this._deleteContentRelated(contentGr.getUniqueValue());
                } catch (e) {
                    gs.info('HAMMaturityItemContentHandler delete content failed for content Id ' +
                        contentGr.getUniqueValue() + ' ' + e);
                }
            }
        },

        _deleteContentRelated: function(contentId) {
            var recGr = new GlideRecord('sn_hamp_maturity_item');
            recGr.addQuery('content', contentId);
            recGr.query();
            if (recGr.next()) {
                if (recGr.getValue('state') === HAMMaturityItemContentHandler.NEW || recGr.getValue('state') === HAMMaturityItemContentHandler.CLOSED_SKIPPED) {
                    recGr.deleteRecord();
                }
            }
        },


        _checkCreateRecord: function(content) {
            var contentId = content.getUniqueValue();

            var buildGr = new GlideRecord('sys_store_app');
            buildGr.addQuery('scope', 'sn_hamp');
            buildGr.query();

            if (buildGr.next()) {
                var familyRelease = content.getValue('available_family_release_version');
                var isValid = this.compareVersions(buildGr.version, familyRelease); // if buildGr.version < family release it will return -1;
                // dont process future releases
                if (isValid == -1) {
                    return;
                }
            }

            var recGr = new GlideRecord('sn_hamp_maturity_item');
            recGr.addQuery('content', contentId);
            recGr.query();
            if (recGr.next()) {
                if (recGr.getValue('state') === HAMMaturityItemContentHandler.NEW || recGr.getValue('state') === HAMMaturityItemContentHandler.CLOSED_SKIPPED) {
                    this.updateMaturityItem(recGr, content);
                    return;
                } else {
                    return;
                }
            }

            // create new record if not exists
            this.createMaturityItem(content);
        },

        compareVersions: function(a, b) {
            if (a === b) {
                return 0;
            }
            var a_components = a.split(".");
            var b_components = b.split(".");
            var len = Math.min(a_components.length, b_components.length);

            // loop while the components are equal
            for (var i = 0; i < len; i++) {
                if (parseInt(a_components[i]) > parseInt(b_components[i])) {
                    return 1;
                }
                if (parseInt(a_components[i]) < parseInt(b_components[i])) {
                    return -1;
                }
            }

            if (a_components.length > b_components.length) {
                return 1;
            }
            if (a_components.length < b_components.length) {
                return -1;
            }
            return 0;
        },

        updateMaturityItem: function(itemGr, content) {

            var columns = this.columns;
            var hasUpdate = false;
            for (var col in columns) {
                if (itemGr.getValue(col) !== content.getValue(columns[col])) {
                    itemGr.setValue(col, content.getValue(columns[col]));
                    hasUpdate = true;
                }
            }
            if (hasUpdate) {
                itemGr.update();
            }
        },

        createMaturityItem: function(content) {
            var columns = this.columns;
            var itemGr = new GlideRecord('sn_hamp_maturity_item');
            for (var column in columns) {
                itemGr.setValue(column, content.getValue(columns[column]));
            }
            itemGr.setValue('content', content.getUniqueValue());
            itemGr.setValue('state', '1');
            var id = itemGr.insert();
        },

        process: function(gr) {
            var hasUpdate = false;
            if (gr.getValue('purpose') !== gr.getValue('stage_purpose')) {
                this.updateColumn(gr, 'purpose', 'stage_purpose');
                hasUpdate = true;
            }

            if (gr.getValue('suggested_maturity_level') !== gr.getValue('stage_suggested_maturity_level')) {
                this.updateColumn(gr, 'suggested_maturity_level', 'stage_suggested_maturity_level');
                hasUpdate = true;
            }

            if (gr.getValue('required') !== gr.getValue('stage_required')) {
                this.updateColumn(gr, 'required', 'stage_required');
                hasUpdate = true;
            }

            if (gr.getValue('short_description') !== gr.getValue('stage_short_description')) {
                this.updateColumn(gr, 'short_description', 'stage_short_description');
                hasUpdate = true;
            }

            if (gr.getValue('steps') !== gr.getValue('stage_steps')) {
                this.updateColumn(gr, 'steps', 'stage_steps');
                hasUpdate = true;
            }

            if (gr.getValue('type') !== gr.getValue('stage_type')) {
                this.updateColumn(gr, 'type', 'stage_type');
                hasUpdate = true;
            }

            if (gr.getValue('order') !== gr.getValue('stage_order')) {
                this.updateColumn(gr, 'order', 'stage_order');
                hasUpdate = true;
            }

            if (hasUpdate) {
                gr.update();
            }

        },

        updateColumn: function(gr, column, stageColumn) {
            global.ContentAuditUtil.addAuditEntry('sn_hamp_maturity_content', gr.getValue('sys_id'),
                column, gr.getDisplayValue(column), gr.getDisplayValue(stageColumn),
                '', sn_hamp.HAMUpdateHandler.AUDIT_TABLE, gr.getValue(column), gr.getValue(stageColumn));

            if (gs.nil(gr.getValue(stageColumn))) {
                gr.setValue(column, '');
            } else {
                gr.setValue(column, gr.getValue(stageColumn));
            }
        },

        type: 'HAMMaturityItemContentHandler',
    }
);