requirejs.config({
    baseUrl: '/js/',
    waitSeconds: 60,
    paths: {
        'jquery': 'jquery',
        'underscore': 'underscore',
        'backbone': 'lib/backbone-min-1.2.3',
        'bootstrap': 'lib/bootstrap.min',
        'backgrid': 'lib/backgrid.min',
        'backbone.paginator': 'lib/backbone.paginator.min',
        'backgrid-paginator': 'lib/backgrid-paginator.min',
        'backgrid-filter': 'lib/backgrid-filter.min'
    },
    shim: {
        'backgrid': {
            deps: ['jquery', 'underscore', 'backbone'],
            exports: 'Backgrid'
        },
        'backgrid-paginator': {
            deps: ['backgrid']
        },
        'backgrid-filter': {
            deps: ['backgrid']
        },
        'bootstrap': {
            deps: ['jquery']
        }
    }
});