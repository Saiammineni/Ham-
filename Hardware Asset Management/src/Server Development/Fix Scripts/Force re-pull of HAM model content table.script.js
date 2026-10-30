function forceCDSrepull() {
    new global.GlideQuery('cds_client_schedule')
        .where('table.table', 'sn_hamp_hw_product_model')
        .disableWorkflow()
        .updateMultiple({
            last_updated_on: null,
        });
    gs.info('Vancouver: Hardware asset management - Set cds_client_schedule.last_updated_on for sn_hamp_hw_product_model table to empty is complete.');
}

forceCDSrepull();