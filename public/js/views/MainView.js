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
    var MainView = Backbone.View.extend({
        events: {

        },

        initialize: function() {
            var Listing = Backbone.Model.extend({});

            var Listings = Backbone.PageableCollection.extend({
                model: Listing,
                url: "api/listings",
                state: {
                    pageSize: 15
                },
                mode: 'client'
            });

            var listings = new Listings();
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
                name: "data.Title",
                label: "Name",
                cell: Backgrid.Cell.extend({
                    render: function(){
                        this.$el.text(this.model.get('data').Title);
                        return this;
                    }
                })
            },{
                name: "status",
                label: "Status",
                cell: "string"
            },{
                name: "asin",
                label: "ASIN",
                cell: "string"
            }, {
                name: "itemId",
                label: "Ebay Id",
                cell: "string" // A cell type for floating point value, defaults to have a precision 2 decimal numbers
            }];

            // Initialize a new Grid instance
            this.grid = new Backgrid.Grid({
                columns: columns,
                collection: listings
            });

            this.paginator = new Backgrid.Extension.Paginator({
                collection: listings
            });

            this.filter = new Backgrid.Extension.ClientSideFilter({
                collection: listings,
                fields: ['asin'],
                placeholder: 'Type asin'
            });

            listings.fetch();
        },

        render: function() {
            this.$(".table-holder").append(this.grid.render().el);
            this.$(".table-holder").after(this.paginator.render().el);
            this.$('.table-holder').before(this.filter.render().el);
            $(this.filter.el).css({float: "right", margin: "20px", 'margin-top': 0});
        }
    });

    return MainView;
});