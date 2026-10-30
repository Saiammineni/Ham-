var HamMaturityUtility = Class.create();

HamMaturityUtility.NEW = '1';
HamMaturityUtility.WIP = '2';
HamMaturityUtility.CLOSED_COMPLETE = '3';
HamMaturityUtility.CLOSED_SKIPPED = '7';
HamMaturityUtility.MATURITY_ITEM = 'sn_hamp_maturity_item';

HamMaturityUtility.prototype = {
    initialize: function() {
        this.crawlStates = {};
        this.walkStates = {};
        this.runStates = {};
    },

    getMaturityCards: function(domainSysId, maturityLevel) {
        var response = {};
        response.title = gs.getMessage('HAM maturity');
        response.totalMaturityItems = 0;
        response.crawlItemCount = 0;
        response.walkItemCount = 0;
        response.runItemCount = 0;
        response.crawlstatus = gs.getMessage('New');
        response.walkstatus = gs.getMessage('New');
        response.runstatus = gs.getMessage('New');
        response.crawlColour = 'gray';
        response.walkColour = 'gray';
        response.runColour = 'gray';
        response.activeMaturityItems = [];
        response.walkActivityItems = [];
        response.runActivityItems = [];
        response.crawlActivityItems = [];
        response.crawlHeading=gs.getMessage('Crawl maturity items');
        response.walkHeading=gs.getMessage('Walk maturity items');
        response.runHeading=gs.getMessage('Run maturity items');
        response.nullHeading=gs.getMessage('Maturity items');
        response.currentMaturityItem = maturityLevel;

        var maturityItemsGr = new GlideRecord(HamMaturityUtility.MATURITY_ITEM);
        maturityItemsGr.addQuery('state', 'IN', [HamMaturityUtility.NEW , HamMaturityUtility.WIP, HamMaturityUtility.CLOSED_COMPLETE]);
        maturityItemsGr.orderBy('maturity_level');
        maturityItemsGr.orderBy('order');

        if (!gs.nil(domainSysId)) {
            maturityItemsGr.addQuery('sys_domain', domainSysId);
        }
        maturityItemsGr.query();
        if (maturityItemsGr.hasNext()) {
            response.totalMaturityItems = maturityItemsGr.getRowCount();
            while (maturityItemsGr.next()) {
                var cardDetails = {};
                cardDetails = this.addCardDetails(maturityItemsGr, maturityLevel);
                if (cardDetails.active === true) {
                    response.activeMaturityItems.push(cardDetails);
                }
                var maturityItemLevel = maturityItemsGr.maturity_level.toString();
                if (maturityItemLevel === 'crawl') {
                    response.crawlItemCount += 1;
                    response.crawlActivityItems.push(cardDetails);
                    if (!this.crawlStates[cardDetails.stateValue]) {
                        this.crawlStates[cardDetails.stateValue] = true;
                    }
                } else if (maturityItemLevel === 'walk') {
                    response.walkItemCount += 1;
                    response.walkActivityItems.push(cardDetails);
                    if (!this.walkStates[cardDetails.stateValue]) {
                        this.walkStates[cardDetails.stateValue] = true;
                    }
                } else if (maturityItemLevel === 'run') {
                    response.runItemCount += 1;
                    response.runActivityItems.push(cardDetails);
                    if (!this.runStates[cardDetails.stateValue]) {
                        this.runStates[cardDetails.stateValue] = true;
                    }
                }
            }
            if (response.activeMaturityItems.length < 1) {
                response.activeMaturityItems = response.crawlActivityItems;
            }
            var crawlProperty = this.getStatus(this.crawlStates);
            var walkProperty = this.getStatus(this.walkStates);
            var runProperty = this.getStatus(this.runStates);
            response.crawlstatus = crawlProperty[0];
            response.walkstatus = walkProperty[0];
            response.runstatus = runProperty[0];
            response.crawlColour = crawlProperty[1];
            response.walkColour = walkProperty[1];
            response.runColour = runProperty[1];
            response.crawlItemCount = response.crawlItemCount < 1 ? 0.1 : response.crawlItemCount;
            response.walkItemCount = response.walkItemCount < 1 ? 0.1 : response.walkItemCount;
            response.runItemCount = response.runItemCount < 1 ? 0.1 : response.runItemCount;
        } else {
            response.crawlItemCount = 0.1;
            response.walkItemCount = 0.1;
            response.runItemCount = 0.1;
        }
        return response;
    },

    addCardDetails: function(maturityItemsGr, maturityLevel) {
        var customerMaturityLevels = ['crawl', 'walk', 'run'];
        var colours = {
            1: 'gray',
            2: 'purple',
            3: 'green'
        };
        var icons = {
            1: 'presence-offline-outline',
            2: 'circle-semi-check-outline',
            3: 'circle-check-outline'
        };
        var stageIcon = {
            crawl: 'configuration-item-outline',
            walk: 'stairs-outline',
            run: 'walk-outline'
        };

        var cardDetail = {};
        cardDetail.sysId = maturityItemsGr.getValue('sys_id');
        cardDetail.state = maturityItemsGr.getDisplayValue('state');
        cardDetail.stateValue = maturityItemsGr.getValue('state');
        cardDetail.stateColour = colours[cardDetail.stateValue];
        cardDetail.stateIcon = icons[cardDetail.stateValue];
        cardDetail.maturity_level = maturityItemsGr.getValue('maturity_level');
        cardDetail.short_description = maturityItemsGr.getValue('short_description');
        cardDetail.type = maturityItemsGr.getDisplayValue('type');
        cardDetail.name = maturityItemsGr.getValue('name');
        cardDetail.required = maturityItemsGr.getValue('required');
        cardDetail.categories = [];

        var category = {};
        category.id = gs.getMessage('Actions');

        if (parseInt(cardDetail.required, 10) === 1) {
            category.icon = 'asterisk-fill';
            category.label = 'required';
        } else {
            category.icon = 'ellipsis-v-outline';
            category.label = gs.getMessage('Actions');
            category.items = [];

            var index = customerMaturityLevels.indexOf(cardDetail.maturity_level);
            customerMaturityLevels.splice(index, 1);
            customerMaturityLevels.forEach(function(customermaturityLevel) {
                var item = {};
                item.id = customermaturityLevel;
                item.icon = stageIcon[customermaturityLevel];
                item.label = gs.getMessage('Move to {0}{1} maturity stage', [customermaturityLevel.charAt(0).toUpperCase(), customermaturityLevel.slice(1)]);
                category.items.push(item);
            });
            var item = {};
            item.id = 'dismiss';
            item.icon = 'circle-half-outline';
            item.label = gs.getMessage('Mark as "Closed Skipped"');
            category.items.push(item);
        }
        if (cardDetail.stateValue !== HamMaturityUtility.CLOSED_COMPLETE &&
            cardDetail.stateValue !== HamMaturityUtility.CLOSED_SKIPPED) {
            cardDetail.categories.push(category);
        }

        if (cardDetail.maturity_level.toString() === maturityLevel) {
            cardDetail.active = true;
        }
        return cardDetail;
    },

    dismissCard: function(cardData) {
        var taskSysId = cardData.cardSysId;
        new global.GlideQuery(HamMaturityUtility.MATURITY_ITEM)
            .where('sys_id', taskSysId)
            .update({
                state: HamMaturityUtility.CLOSED_SKIPPED,
            });
    },

    moveCardsToAnotherCategory: function(cardData) {
        var taskSysId = cardData.cardSysId;
        var action = cardData.cardActionId;
        new global.GlideQuery(HamMaturityUtility.MATURITY_ITEM)
            .where('sys_id', taskSysId)
            .update({
                maturity_level: action,
            });
    },

    getStatus: function(maturityItemStates) {
        if (maturityItemStates[HamMaturityUtility.WIP] || (maturityItemStates[HamMaturityUtility.NEW] && maturityItemStates[HamMaturityUtility.CLOSED_COMPLETE])) {
            return [gs.getMessage('Work in Progress'), 'purple'];
        }
        if (maturityItemStates[HamMaturityUtility.NEW ]) {
            return [gs.getMessage('New'), 'gray'];
        }
        if (maturityItemStates[HamMaturityUtility.CLOSED_COMPLETE]) {
            return [gs.getMessage('Complete'), 'green'];
        }
        return [gs.getMessage('New'), 'gray'];
    },

    type: 'HamMaturityUtility'
};