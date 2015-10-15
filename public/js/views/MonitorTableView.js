define([
    'jquery',
    'underscore',
    'backbone',
    'bootstrap',
    'backgrid',
    'backbone.paginator',
    'backgrid-paginator',
    'backgrid-filter'
], function(
    $,
    _,
    Backbone,
    bootstrap,
    backgrid,
    backbonePaginator,
    backgridFilter
) {
    var MonitorTableView = Backbone.View.extend({
        events: {

        },

        initialize: function() {
            var Listing = Backbone.Model.extend({});

            var Runs = Backbone.PageableCollection.extend({
                model: Listing,
                url: "/api/runs",
                state: {
                    pageSize: 15
                },
                mode: 'client'
            });

            var runs = new Runs();
            var columns = [{
                name: "",
                label: "",
                cell: Backgrid.Cell.extend({
                    render: function () {
                        this.$el.text(this.model.collection.indexOf(this.model) + 1);
                        return this;
                    }
                })
            },{
                name: "created",
                label: "Run Date",
                cell: 'string'
            },{
                name: "listings",
                label: "Listings",
                cell: "string"
            },{
                name: "revisions",
                label: "Revisions",
                cell: Backgrid.Cell.extend({
                    render: function () {
                        this.$el.text(this.model.get('revisions').length);
                        return this;
                    }
                })
            },{
                name: "errors",
                label: "Errors",
                cell: Backgrid.Cell.extend({
                    render: function () {
                        this.$el.text(this.model.get('ebayErrors').length);
                        return this;
                    }
                })
            }];

            // Initialize a new Grid instance
            this.grid = new Backgrid.Grid({
                columns: columns,
                collection: runs
            });

            this.paginator = new Backgrid.Extension.Paginator({
                collection: runs
            });

            this.filter = new Backgrid.Extension.ClientSideFilter({
                collection: runs,
                fields: ['asin'],
                placeholder: 'Type asin'
            });

            runs.fetch();
        },

        render: function() {
            this.$(".table-holder").append(this.grid.render().el);
            this.$(".table-holder").after(this.paginator.render().el);
            this.$('.table-holder').before(this.filter.render().el);
            $(this.filter.el).css({float: "right", margin: "20px", 'margin-top': 0});
        }
    });

    return MonitorTableView;
});