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
    var ListingsTableView = Backbone.View.extend({
        events: {

        },

        initialize: function() {
            var Listing = Backbone.Model.extend({});

            var Listings = Backbone.PageableCollection.extend({
                model: Listing,
                url: "api/listings",
                state: {
                    pageSize: 50
                },
                mode: 'client'
            });

            var listings = new Listings();
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
                name: "data.Title",
                label: "Name",
                editable: false,
                cell: Backgrid.Cell.extend({
                    render: function(){
                        this.$el.text(this.model.get('data').Title);
                        return this;
                    }
                })
            },{
                name: "status",
                label: "Status",
                editable: false,
                cell: "string"
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
                })
            }, {
                name: "itemId",
                label: "Ebay Id",
                editable: false,
                cell: Backgrid.Cell.extend({
                    render: function () {
                        if (!this.model.get('itemId')) {
                            this.$el.text('N/A');
                            return this;
                        }
                        var ebayUrl = 'https://www.ebay.com/itm/' + this.model.get('itemId');
                        var anchor = '<a href="' + ebayUrl + '" target="_blank">' + this.model.get('itemId') +'</a>';
                        this.$el.html(anchor);
                        return this;
                    }
                })
            },{
                name: "data.Quantity",
                label: "Quantity",
                editable: false,
                cell: Backgrid.Cell.extend({
                    render: function(){
                        this.$el.text(this.model.get('data').Quantity);
                        return this;
                    }
                })
            },{
                name: "",
                label: "Actions",
                editable: false,
                cell: Backgrid.Cell.extend({
                    render: function () {
                        var html = '<a href="/listings/' + this.model.get('_id') + '" class="btn btn-sm btn-default">Settings</a>';
                        if (this.model.get('status') !== 'LISTED') {
                            html += '<form class="relist-form" role="form" method="POST"><input class="hide" name="listingId" id="listingId" value="' + this.model.get('_id') +'">' +
                                '<button type="submit" class="btn btn-sm btn-default">Re-list</button>' +
                                '</form>'
                        }
                        this.$el.html(html);
                        return this;
                    }
                })
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
                fields: ['asin', 'itemId'],
                placeholder: 'Asin or item id'
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

    return ListingsTableView;
});