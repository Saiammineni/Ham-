(function() {
    if (input && input.action == "fetchAssets") {
        var loggedInUserId = gs.getUserID();
        if (!loggedInUserId) {
            return;
        }
        var fetchedAssets = sn_itam_common.AssetWidgetUtils.getAssetDetails(loggedInUserId, "hardware");
        data.assets = fetchedAssets;
    }
    if (input && input.action == "updateAsset") {
        var params = {};
        params.sysId = input.sysId;
        params.type = input.type;
        if (input.type == sn_itam_common.AssetReceivingUtils.HARDWARE_TYPE) {
            if (!gs.nil(input.assetTag)) {
                params.assetTag = GlideSecurityUtils.escapeScript(input.assetTag);
            }
            else {
                params.assetTag = "";
            }
            if (!gs.nil(input.serialNumber)) {
                params.serialNumber = GlideSecurityUtils.escapeScript(input.serialNumber);
            }
            else {
                params.serialNumber = "";
            }
            params.isAssetTagUpdated = input.isAssetTagUpdated;
            params.isSerialNumberUpdated = input.isSerialNumberUpdated;
        } else {
            params.quantity = input.quantity;
        }
        data.isAssetValid = sn_itam_common.AssetReceivingUtils.validateAndUpdateAsset(params);
    }

    if (!input) {
        //get Assets from AssetwidgetUtils
        var currentUserId = gs.getUserID();
        if (!currentUserId) {
            return;
        }
        var currentPageId = $sp.getParameter('id');
        var assets = sn_itam_common.AssetWidgetUtils.getAssetDetails(currentUserId, String(options.key));
        if (assets.length > 0) {
            data.assets = assets;
            data.modelImageAlt = gs.getMessage('Model Image');
            data.issue = gs.getMessage('Raise issue');
            data.heading = gs.getMessage('Hardware');
            data.paginationLabel = gs.getMessage("Showing {0}-{1} of {2} Assets");
            data.ariaRightLabel = gs.getMessage('Click to swipe the cards to right');
            data.ariaLeftLabel = gs.getMessage('Click to swipe the cards to left');
            data.pageId = currentPageId;
        } else {
            data.noassetheader = gs.getMessage('No asset');
            data.noassetsmessage = gs.getMessage("You don't have any asset assigned yet");
        }
        // Receiving asset popup details
        var receivePopUpDetails = JSON.parse(sn_itam_common.AssetReceivingUtils.getReceiveAssetPopUpDetails());
        Object.assign(data, receivePopUpDetails);
        // Use the action below to either update or fetch assets
        data.action = "";
    }
})();