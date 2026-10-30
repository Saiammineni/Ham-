function onLoad() {
    setTimeout(setDefaultFilter, 0);
}

function setDefaultFilter() {
    var listCollector = 'assets';
    var dynamicQuery = 'eligible_for_refresh=true';
    try {
        // Service portal method
        var assetsListCollector = g_list.get(listCollector);
        assetsListCollector.reset();
        assetsListCollector.setQuery(dynamicQuery);
    } catch (e) {
        // Service catalog method
        eval(listCollector + 'g_filter.reset()');
        eval(listCollector + 'g_filter.setQuery("' + dynamicQuery + '")');
        eval(listCollector + 'acRequest(null)');
    }
}