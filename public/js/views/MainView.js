define([
    'jquery',
    'underscore',
    'backbone',
    'bootstrap',
    'views/ListingsTableView',
    'views/MonitorTableView'
], function(
    $,
    _,
    Backbone,
    bootstrap,
    ListingsTableView,
    MonitorTableView
) {
    var MainView = Backbone.View.extend({
        events: {

        },

        initialize: function() {

        },

        render: function() {
            if ($('.listings-table-holder').length > 0) {
                this.listingsTableView = new ListingsTableView({el: $('.listings-table-holder')});
                this.listingsTableView.render();
            }
            if ($('.monitor-table-holder').length > 0) {
                this.monitorTableView = new MonitorTableView({el: $('.monitor-table-holder')});
                this.monitorTableView.render();
            }
        }
    });

    return MainView;
});