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
    var RevisionsTableView = Backbone.View.extend({
        events: {

        },

        initialize: function() {
            var Listing = Backbone.Model.extend({});
            var path = window.location.pathname.split('/');
            var runId = (path.length > 2) ? path[path.length -1] : '';
            var Revisions = Backbone.PageableCollection.extend({
                model: Listing,
                url: "/api/revisions/" + runId,
                state: {
                    pageSize: 50
                },
                mode: 'client'
            });

            var revisions = new Revisions();
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
                name: "itemId",
                label: "Ebay Id",
                cell: Backgrid.Cell.extend({
                    render: function () {
                        var ebayUrl = 'https://www.ebay.com/itm/' + this.model.get('itemId');
                        var anchor = '<a href="' + ebayUrl + '" target="_blank">' + this.model.get('itemId') +'</a>';
                        this.$el.html(anchor);
                        return this;
                    }
                }),
                editable: false
            },{
                name: "asin",
                label: "ASIN",
                editable: false,
                cell: Backgrid.Cell.extend({
                    render: function () {
                        var amazonUrl = 'https://www.amzn.com/' + this.model.get('asin');
                        var anchor = '<a href="' + amazonUrl + '" target="_blank">' + this.model.get('asin') +'</a>';
                        this.$el.html(anchor);
                        return this;
                    }
                }),
            },{
                name: "oldPrice",
                label: "Old Price",
                editable: false,
                cell: 'string'
            },{
                name: "newPrice",
                label: "New Price",
                editable: false,
                cell: 'string'
            },
                {
                name: "quantity",
                label: "Quantity",
                editable: false,
                cell: 'string'
            },
            {
                name: "action",
                label: "Action",
                editable: false,
                cell: 'string'
            }
            ];

            // Initialize a new Grid instance
            this.grid = new Backgrid.Grid({
                columns: columns,
                collection: revisions
            });

            this.paginator = new Backgrid.Extension.Paginator({
                collection: revisions
            });

            //this.filter = new Backgrid.Extension.ClientSideFilter({
            //    collection: runs,
            //    fields: ['asin'],
            //    placeholder: 'Type asin'
            //});

            revisions.fetch();
        },

        render: function() {
            this.grid.render();
            this.$(".table-holder").append(this.grid.el);
            this.$(".table-holder").after(this.paginator.render().el);
        }
    });

    return RevisionsTableView;
});