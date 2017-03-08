/**
 * GmapsTool
 *
 * Permet de simplifier l'utilisation des cartes GoogleMaps
 *
 * @param jQuery object element     Conteneur GoogleMaps
 * @param object        gmapOptions Options GoogleMaps
 * @param object        options     Options GmapsTool
 *
 * @version 1.1 (08/03/2017)
 */
(function($) {
    'use strict';

    $.GmapsTool = function(element, gmapOptions, options) {
        // Éléments
        this.elements = {
            gmapId: element // Google maps Identifier
        };

        // Config
        $.extend((this.gmapOptions = {}), $.GmapsTool.defaults.gmapOptions, gmapOptions);
        $.extend((this.settings = {}), $.GmapsTool.defaults, options);
        delete this.settings.gmapOptions;

        return this;
    };

    $.GmapsTool.defaults = {
        gmapOptions: {
            center: undefined,
            zoom: 10,
            minZoom: 7,
            maxZoom: 17
        },
        richMarkerOptions: {
            draggable: false,
            shadow: 'none'
        },
        fullscreen: false
    };

    $.GmapsTool.prototype = {
        /**
         * Préparation des options utilisateur
         *
         * @return bool
         */
        prepareGmapOptions: function() {
            // Center
            if (this.gmapOptions.center !== undefined && this.gmapOptions.center.length === 2) {
                this.gmapOptions.center = this.getLatLng(this.gmapOptions.center);
            } else {
                this.setLog('error', 'Please set "center" options');
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
        init: function() {
            if (this.prepareGmapOptions()) {
                this.gmap = new google.maps.Map(this.elements.gmapId[0], this.gmapOptions);
            }

            return this;
        },

        /**
         * Ajout des options à la carte
         *
         * @param object options Options à ajouter
         */
        setMapOptions: function(options) {
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
        setMarkers: function(markers, options) {
            var self = this;
            self.bounds = new google.maps.LatLngBounds();
            self.markers = [];

            // Prevent options
            if (options === undefined) {
                options = {};
            }

            // Dépendence RichMarker ?
            if (typeof RichMarker === 'undefined') {
                self.setLog('error', 'Missing "RichMarker" dependency');
                return false;
            }

            if (markers.length) {
                $.each(markers, function(i, marker) {
                    self.setMarker(marker, options);
                });
            }

            // Mise à jour de la position en fonction des markers
            self.setCenter();

            // Ajout des clusters
            if (options.cluster !== undefined && options.cluster === true) {
                self.addMarkersClusters(options);
            }

            // Fonction utilisateur
            if (options.onComplete !== undefined) {
                options.onComplete.call({
                    GmapsTool: self,
                    markers: self.markers,
                    bounds: self.bounds
                });
            }

            return self;
        },

        /**
         * Ajout des clusters aux marqueurs
         *
         * @param object options Options utilisateur
         */
        addMarkersClusters: function(options) {
            // Dépendence MarkerClusterer ?
            if (typeof MarkerClusterer === 'undefined') {
                this.setLog('error', 'Missing "MarkerClusterer" dependency');
                return false;
            }

            // Options
            $.extend({
                maxZoom: this.gmapOptions.maxZoom
            }, (options.clusterOptions = (options.clusterOptions === undefined) ? {} : options.clusterOptions));

            // Liste des marqueurs
            var markers = [];
            $.each(this.markers, function(i, marker) {
                markers.push(marker.richMarker);
            });

            // Init clusters
            return new MarkerClusterer(this.gmap, markers, options.clusterOptions);
        },

        /**
         * Ajout d'un marqueur
         *
         * @param  object marker
         * @param  object options
         * @return object marker
         */
        setMarker: function(marker, options) {
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
            $.each(markerEvents, function(i, eventName) {
                var eventOptName = self.formatEventName(eventName);

                if (options[eventOptName] !== undefined) {
                    google.maps.event.addListener(marker.richMarker, eventName, function(event) {
                        options[eventOptName].call({
                            GmapsTool: self,
                            marker: marker,
                            event: event
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
        setCenter: function() {
            if (this.bounds !== undefined) {
                if (this.markers.length > 1) {
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
        setLayers: function(layers, options) {
            var self = this;
            self.layers = [];

            // Prevent options
            if (options === undefined) {
                options = {};
            }

            if (layers !== undefined && layers.length > 0) {
                $.each(layers, function(i, layer) {
                    if (self.prepareLayerOptions(layer)) {
                        self.setLayer(layer, options);
                    }
                });
            }

            // Fonction utilisateur
            if (options.onComplete !== undefined) {
                options.onComplete.call({
                    GmapsTool: self,
                    layers: self.layers
                });
            }

            return self;
        },

        /**
         * Préparation des options du calque
         *
         * @param  object layer
         * @return bool
         */
        prepareLayerOptions: function(layer) {
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
        setLayer: function(layer, options) {
            var self = this;
            $.extend(options, {
                url: layer.path,
                preserveViewport: true,
                map: self.gmap
            });
            layer.layer = new google.maps.KmlLayer(options);

            // Événements Layer
            var layerEvents = ['click', 'defaultviewport_changed', 'status_changed'];
            $.each(layerEvents, function(i, eventName) {
                var eventOptName = self.formatEventName(eventName);

                if (options[eventOptName] !== undefined) {
                   layer.layer.addListener(eventName, function(event) {
                        options[eventOptName].call({
                            GmapsTool: self,
                            layer: layer,
                            event: event
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
        setStyles: function(path) {
            var self = this;

            $.getJSON(path)
                .fail(function() {
                    self.setLog('error', 'Json file not found');
                })
                .done(function(style) {
                    self.gmap.set('styles', style);
                });

            return self;
        },

        /**
         * Ajout de controles personnalisés
         *
         * @param object options Options utilisateur
         */
        setControls: function(options) {
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
                $.each(zooms, function(i, type) {
                    if (options.zoom[type] !== undefined && options.zoom[type].length) {
                        google.maps.event.addDomListener(options.zoom[type][0], 'click', function(event) {
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
        },

        /**
         * Ajout de logs dans la console
         */
        setLog: function(type, log) {
            console[type]('GmapsTool: ' + log);
        },

        /**
         * Récupération de la position en LatLng par GoogleMaps
         *
         * @param  mixed position Position GPS : [Lat,Lng]
         * @return object si parsable sinon false
         */
        getLatLng: function(position) {
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
        formatEventName: function(event) {
            return 'on' + event.substr(0, 1).toUpperCase() + event.substr(1);
        }
    };

    $.fn.gmapsTool = function(gmapOptions, options) {
        return new $.GmapsTool($(this), gmapOptions, options);
    };
})(jQuery);