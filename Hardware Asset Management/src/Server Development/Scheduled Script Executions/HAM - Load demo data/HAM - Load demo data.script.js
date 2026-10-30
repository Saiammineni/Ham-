loadDemoData();

function loadDemoData() {
    if (current && current.sys_scope.demo_data == 'demo_data_loaded') {
        try {
            new sn_hamp.HAMPDemoData().loadDemoDataFromHAM();
        } catch (e) {
            gs.error(e);
        }
        current.active = false;
        current.update();
    }
}