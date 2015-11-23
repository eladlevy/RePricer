define([
    'jquery',
    'underscore',
    'backbone',
    'bootstrap',
    'backgrid',
    'backbone.paginator',
    'backgrid-paginator',
    'backgrid-filter',
    'moment'
], function(
    $,
    _,
    Backbone,
    bootstrap,
    backgrid,
    backbonePaginator,
    backgridPaginator,
    backgridFilter,
    moment
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
                    pageSize: 50
                },
                mode: 'client'
            });

            var runs = new Runs();
            var columns = [{
                name: "",
                label: "",
                editable: false,
                cell: Backgrid.Cell.extend({
                    render: function () {
                        this.$el.text(this.model.collection.indexOf(this.model) + 1);
                        return this;
                    }
                })
            },{
                name: "created",
                label: "Run Date",
                direction: "descending",
                editable: false,
                cell: Backgrid.Cell.extend({
                    render: function () {
                        this.$el.text(moment(this.model.get('created')).format('MMMM Do YYYY, h:mm:ss a'));
                        return this;
                    }
                })
            },{
                name: "listings",
                label: "Listings",
                cell: "string",
                editable: false
            },{
                name: "revisions",
                label: "Revisions",
                editable: false,
                cell: Backgrid.Cell.extend({
                    render: function () {
                        var a = '<a href="revisions/' + this.model.get('_id') +'">' + this.model.get('revisions').length +'</a>';
                        this.$el.html(a);
                        return this;
                    }
                })
            },{
                name: "errors",
                label: "Errors",
                editable: false,
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

            //this.filter = new Backgrid.Extension.ClientSideFilter({
            //    collection: runs,
            //    fields: ['asin'],
            //    placeholder: 'Type asin'
            //});

            runs.fetch();
        },

        render: function() {
            this.grid.render().sort("created", "descending");
            this.$(".table-holder").append(this.grid.el);
            this.$(".table-holder").after(this.paginator.render().el);
            //this.$('.table-holder').before(this.filter.render().el);
            //$(this.filter.el).css({float: "right", margin: "20px", 'margin-top': 0});
        }
    });

    return MonitorTableView;
});