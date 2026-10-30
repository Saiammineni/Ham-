function onClick(g_form) {
    getMessages(['Warning', 'Release assets', 'Cancel', 'This action will release the assets from the asset bundle. Do you want to continue?'], releaseAssets);

    function releaseAssets(messages) {
        var bundleId = g_form.getUniqueValue();

        function doRelease() {
            var ga = new GlideAjax('sn_hamp.HAMAjaxProcessor');
            ga.addParam('sysparm_name', 'releaseAssets');
            ga.addParam('sysparm_bundled_asset', bundleId);
            ga.setScope('sn_hamp');
            ga.getXML(parseResponse);
        }

        function parseResponse() {
            g_form.reload();
        }

        var title = messages['Warning'];
        var msg = messages['This action will release the assets from the asset bundle. Do you want to continue?'];
        var cancelLabel = messages['Cancel'];
        var releaseConfirmationLabel = messages['Release assets'];
        g_modal.confirm(
            title,
            msg,
            function(response) {
                if (response) {
                    doRelease();
                }
            }, {
                cancelTitle: cancelLabel,
                confirmTitle: releaseConfirmationLabel,
            }
        );
    }
}