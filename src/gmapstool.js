/**
 * GmapsTool
 *
 * Permet de simplifier l'utilisation des cartes GoogleMaps
 *
 * @param jQuery object element     Conteneur GoogleMaps
 * @param object        gmapOptions Options GoogleMaps
 * @param object        options     Options GmapsTool
 *
 * @version 1.3.1 (24/07/2017)
 */
(function ($) {
    'use strict';

    $.GmapsTool = function (element, gmapOptions, options) {
        // Éléments
        this.elements = {
            gmapId: element // Google maps Identifier
        };

        // Config
        $.extend((this.gmapOptions = {}), $.GmapsTool.defaults.gmapOptions, gmapOptions);
        $.extend((this.settings = {}), $.GmapsTool.defaults, options);
        delete this.settings.gmapOptions;

        // Variables
        this.markers = [];
        this.layers = [];

        return this;
    };

    $.GmapsTool.defaults = {
        gmapOptions: {
            center: undefined,
            zoom: 10,
            minZoom: 7,
            maxZoom: 17
        },
        fullscreen: false,
        richMarkerOptions: {
            draggable: false,
            shadow: 'none'
        },
        cluster: false,
        clusterOptions: {
            svg: {
                color: '#303748',
                colors: [],
                sizes: [36, 46, 56, 66, 76],
                textColor: '#fff',
                borderWidth: 1,
                borderColor: '#fff'
            }
        }
    };

    $.GmapsTool.prototype = {
        /**
         * Préparation des options utilisateur
         *
         * @return bool
         */
        prepareOptions: function () {
            // Élément
            if (this.elements.gmapId.length === 0) {
                this.setLog('error', 'Selector not found');
                return false;
            }

            // Center
            if (this.gmapOptions.center !== undefined) {
                this.gmapOptions.center = this.getLatLng(this.gmapOptions.center);
            } else {
                this.setLog('error', 'Missing center parameter');
                return false;
            }

            // Fullscreen
            if (this.settings.fullscreen) {
                this.gmapOptions.scrollwheel = false;
            }

            return true;
        },

        /**
         * Init map
         */
        init: function () {
            if (this.prepareOptions()) {
                this.gmap = new google.maps.Map(this.elements.gmapId[0], this.gmapOptions);
            }

            return this;
        },

        /**
         * Ajout des options à la carte
         *
         * @param object options Options à ajouter
         */
        setMapOptions: function (options) {
            this.gmap.setOptions(options);

            return this;
        },

        /**
         * Ajout des marqueurs
         *
         * @param array  markers Liste des marqueurs avec position et contenu : {position, content}
         * @param object options Options utilisateur
         * @param object
         */
        setMarkers: function (markers, options) {
            var self = this;
            self.bounds = new google.maps.LatLngBounds();

            // Prevent options
            options = options || {};
            if (options.centerBounds === undefined) {
                options.centerBounds = true;
            }

            if (self.prepareMarkersOptions(markers)) {
                if (markers.length) {
                    $.each(markers, function (i, marker) {
                        self.setMarker(marker, options);
                    });
                }

                // Mise à jour de la position en fonction des markers
                if (options.centerBounds) {
                    self.setCenter();
                }

                // Ajout des clusters
                if (options.cluster !== undefined && options.cluster === true) {
                    self.addMarkersClusters(options);
                }

                // Fonction utilisateur
                if (options.onComplete !== undefined) {
                    options.onComplete.call({
                        GmapsTool: self,
                        markers  : self.getMarkers(),
                        bounds   : self.bounds
                    });
                }
            }

            return self;
        },

        /**
         * Préparation des options pour ajouter des marqueurs
         *
         * @param markers
         * @returns bool
         */
        prepareMarkersOptions: function (markers) {
            if (markers === undefined) {
                this.setLog('error', 'Missing markers parameter');
                return false;
            }

            // Dépendence RichMarker ?
            if (typeof RichMarker === 'undefined') {
                this.setLog('error', 'Missing "RichMarker" dependency');
                return false;
            }

            return true;
        },

        /**
         * Récupération de tous les marqueurs
         * 
         * @return array
         */
        getMarkers: function () {
            return this.markers;
        },

        /**
         * Ajout des clusters aux marqueurs
         *
         * @param object options Options utilisateur
         */
        addMarkersClusters: function (options) {
            var self = this;

            // Dépendence MarkerClusterer ?
            if (typeof MarkerClusterer === 'undefined') {
                self.setLog('error', 'Missing "MarkerClusterer" dependency');
                return false;
            }

            // Options
            var clusterOptions = {
                maxZoom: self.gmapOptions.maxZoom - 1
            };

            // Cluster svg?
            if (self.settings.clusterOptions.svg !== false && Object.keys(self.settings.clusterOptions.svg).length && Object.keys(self.settings.clusterOptions.svg.sizes).length) {
                clusterOptions.styles = [];

                $.each(self.settings.clusterOptions.svg.sizes, function (index, size) {
                    var color = (self.settings.clusterOptions.svg.colors.length) ? self.settings.clusterOptions.svg.colors[index] : self.settings.clusterOptions.svg.color;
                    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">' +
                        '<circle cx="25" cy="25" r="25" stroke="' + self.settings.clusterOptions.svg.borderColor + '" stroke-width="' + self.settings.clusterOptions.svg.borderWidth + '" fill="' + color + '" />' +
                        '</svg>';

                    clusterOptions.styles.push({
                        textColor: self.settings.clusterOptions.svg.textColor,
                        url: 'data:image/svg+xml;base64,' + window.btoa(svg),
                        width: size,
                        height: size
                    });
                });
            }

            // Set options
            $.extend(true, self.settings.clusterOptions, clusterOptions, options.clusterOptions);

            // Liste des marqueurs
            var markers = [];
            $.each(self.getMarkers(), function (i, marker) {
                markers.push(marker.richMarker);
            });

            // Init clusters
            return new MarkerClusterer(self.gmap, markers, self.settings.clusterOptions);
        },

        /**
         * Ajout d'un marqueur
         *
         * @param  object marker
         * @param  object options
         * @return object marker
         */
        setMarker: function (marker, options) {
            var self = this;

            // Get LatLng
            marker.position = self.getLatLng(marker.position);

            // RichMarker
            $.extend((marker.richMarkerOptions = {}), self.settings.richMarkerOptions, {
                map: self.gmap,
                content: ((typeof marker.content === 'object') ? marker.content[0] : marker.content),
                position: marker.position
            }, marker.options);
            marker.richMarker = new RichMarker(marker.richMarkerOptions);

            // Événements Gmap
            var markerEvents = ['click', 'dblclick', 'mouseover', 'mouseout'];
            $.each(markerEvents, function (i, eventName) {
                var eventOptName = self.formatEventName(eventName);

                if (options[eventOptName] !== undefined) {
                    google.maps.event.addListener(marker.richMarker, eventName, function () {
                        options[eventOptName].call({
                            GmapsTool: self,
                            marker: marker,
                            event: this
                        });
                    });
                }
            });

            // Mise à jour des données
            self.bounds.extend(marker.position);
            self.markers.push(marker);

            // Fonction utilisateur
            if (options.onAdd !== undefined) {
                options.onAdd.call({
                    GmapsTool: self,
                    marker: marker
                });
            }

            return marker;
        },

        /**
         * Centre la carte
         * Si this.bounds est présent, le centre se fait en fonction de ses positions
         */
        setCenter: function () {
            if (this.bounds !== undefined) {
                if (this.getMarkers().length > 1) {
                    this.gmap.fitBounds(this.bounds);
                }

                this.gmap.setCenter(this.bounds.getCenter());
            } else {
                this.gmap.setCenter(this.gmapOptions.center);
            }

            return this;
        },

        /**
         * Ajout des calques
         *
         * @param  array  layers  Tableau des calques à charger
         * @param  object options Options pour tous les calques
         */
        setLayers: function (layers, options) {
            var self = this;
            self.layers = [];

            // Prevent options
            if (options === undefined) {
                options = {};
            }

            if (layers !== undefined && layers.length > 0) {
                $.each(layers, function (i, layer) {
                    if (self.prepareLayerOptions(layer)) {
                        self.setLayer(layer, options);
                    }
                });
            }

            // Fonction utilisateur
            if (options.onComplete !== undefined) {
                options.onComplete.call({
                    GmapsTool: self,
                    layers: self.getLayers()
                });
            }

            return self;
        },

        /**
         * Récupération de tous les calques
         * 
         * @return array
         */
        getLayers: function () {
            return this.layers;
        },

        /**
         * Préparation des options du calque
         *
         * @param  object layer
         * @return bool
         */
        prepareLayerOptions: function (layer) {
            if (layer.path !== undefined && layer.path.substring(0, 4) !== 'http') {
                this.setLog('error', 'The ' + layer.type + ' file must be online');
                return false;
            }

            return true;
        },

        /**
         * Ajout d'un calque
         *
         * @param  object layer
         * @param  object options
         * @return object layer
         */
        setLayer: function (layer, options) {
            var self = this;
            $.extend(options, {
                url: layer.path,
                preserveViewport: true,
                map: self.gmap
            });
            layer.layer = new google.maps.KmlLayer(options);

            // Événements Layer
            var layerEvents = ['click', 'defaultviewport_changed', 'status_changed'];
            $.each(layerEvents, function (i, eventName) {
                var eventOptName = self.formatEventName(eventName);

                if (options[eventOptName] !== undefined) {
                   layer.layer.addListener(eventName, function () {
                        options[eventOptName].call({
                            GmapsTool: self,
                            layer: layer,
                            event: this
                        });
                    });
                }
            });

            // Mise à jour des données
            self.layers.push(layer);

            // Fonction utilisateur
            if (options.onAdd !== undefined) {
                options.onAdd.call({
                    GmapsTool: self,
                    layer: layer
                });
            }

            return layer;
        },

        /**
         * Ajout d'un style personnalisé
         *
         * @param string path Chemin du fichier JSON contenant les styles
         */
        setStyles: function (path) {
            var self = this;

            $.getJSON(path)
                .fail(function () {
                    self.setLog('error', 'Json file not found');
                })
                .done(function (style) {
                    self.gmap.set('styles', style);
                });

            return self;
        },

        /**
         * Ajout de controles personnalisés
         *
         * @param object options Options utilisateur
         */
        setControls: function (options) {
            var self = this;

            // Paramètre manquant ?
            if (options === undefined) {
                options = {};
            }

            // Options de la map avec surcharge possible
            var mapOptions = {};
            $.extend(mapOptions, {
                mapTypeControl: false,
                streetViewControl: false,
                zoomControl: false
            }, options.mapOptions);
            this.setMapOptions(mapOptions);

            // Zoom
            if (options.zoom !== undefined) {
                var zooms = ['in', 'out'];
                $.each(zooms, function (i, type) {
                    if (options.zoom[type] !== undefined && options.zoom[type].length) {
                        google.maps.event.addDomListener(options.zoom[type][0], 'click', function (event) {
                            var level = self.gmap.getZoom();
                            self.gmap.setZoom((type === 'in') ? ++level : --level);

                            if (options.zoom.onClick !== undefined) {
                                options.zoom.onClick.call({
                                    GmapsTool: self,
                                    zoom: {type: type, level: level},
                                    event: event
                                });
                            }
                        });
                    }
                });
            }

            return self;
        },

        /**
         * Ajout de logs dans la console
         */
        setLog: function (type, log) {
            console[type]('GmapsTool: ' + log);
        },

        /**
         * Récupération de la position en LatLng par GoogleMaps
         *
         * @param  mixed position Position GPS : [Lat,Lng]
         * @return object si parsable sinon false
         */
        getLatLng: function (position) {
            if (typeof position === 'string' && position.indexOf(',') !== -1) {
                position = position.split(',');
            }

            if (typeof position === 'object' && position.length === 2) {
                return new google.maps.LatLng(position[0], position[1]);
            }

            return false;
        },

        /**
         * Format le nom d'un événement dans les options utilisateur
         *
         * @param  string event Nom de l'événement Google Maps
         * @return string
         */
        formatEventName: function (event) {
            return 'on' + event.substr(0, 1).toUpperCase() + event.substr(1);
        }
    };

    $.fn.gmapsTool = function (gmapOptions, options) {
        return new $.GmapsTool($(this), gmapOptions, options);
    };
})(jQuery);