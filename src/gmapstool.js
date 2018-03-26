/**
 * GmapsTool
 *
 * Permet de simplifier l'utilisation des cartes GoogleMaps
 *
 * @param jQuery object element     Conteneur de la carte
 * @param object        options     Options utilisateur
 */
(function ($) {
    'use strict';

    $.GmapsTool = function (element, options) {
        // Éléments
        this.elements = {
            container: element
        };

        // Config
        $.extend(true, (this.settings = {}), $.GmapsTool.defaults, options);

        // Variables
        this.center;
        this.gmap;
        this.markers = [];
        this.markersOptions = {};
        this.infoWindow;
        this.layers  = [];
        this.pathAPI = 'https://maps.googleapis.com/maps/api';
        this.style   = false;

        return this;
    };

    $.GmapsTool.defaults = {
        map: {
            center : undefined,
            zoom   : 10,
            minZoom: 7,
            maxZoom: 17
        },
        apiKey    : undefined,
        fullscreen: false,
        type      : 'js',
        staticOptions: {
            size   : '300x300',
            scale  : 2,
            maptype: 'roadmap'
        },
        markersOptions: {
            centerBounds: true,
            cluster: false,
            clusterOptions: {
                svg: {
                    color      : '#303748',
                    colors     : [],
                    sizes      : [36, 46, 56, 66, 76],
                    textColor  : '#fff',
                    borderWidth: 1,
                    borderColor: '#fff'
                }
            },
            infoWindowOptions: {
                pixelOffset: [0, -30]
            },
            richMarkerOptions: {
                draggable: false,
                shadow   : 'none'
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
            if (this.elements.container.length === 0) {
                this.setLog('error', 'Selector not found');
                return false;
            }

            // Center
            if (this.settings.map.center !== undefined) {
                this.center = this.settings.map.center;
                this.settings.map.center = this.getLatLng();
            } else {
                this.setLog('error', 'Missing center parameter');
                return false;
            }

            // Fullscreen
            if (this.settings.fullscreen) {
                this.settings.map.scrollwheel = false;
            }

            // Static
            if (this.settings.type === 'staticmap' && (this.settings.apiKey === undefined || this.settings.apiKey === '')) {
                this.setLog('error', 'Missing "apiKey" parameter');
                return false;
            }

            return true;
        },

        /**
         * Init map
         */
        init: function () {
            if (this.prepareOptions()) {
                if (this.settings.type === 'staticmap') {
                    // @see setStyles
                    if (this.style === false) {
                        this.initStatic();
                    }

                } else {
                    this.gmap = new google.maps.Map(this.elements.container[0], this.settings.map);
                }
            }

            return this;
        },

        /**
         * Options pour une carte en type statique
         *
         * @param options
         */
        setStatic: function (options) {
            this.settings.type = 'staticmap';

            $.extend(true, this.settings.staticOptions, options);

            return this;
        },

        /**
         * Init map static
         */
        initStatic: function () {
            var self = this;

            // Options
            var options = {};
            $.extend(true, options, self.settings.map, self.settings.staticOptions);
            options.key = self.settings.apiKey;
            delete options.minZoom;
            delete options.maxZoom;

            // Format path
            var path = self.pathAPI + '/' + self.settings.type + '?';
            var optionIndex = 0;
            $.each(options, function (key, value) {
                if (optionIndex > 0) {
                    path += '&';
                }
                path += key + '=' + value;

                optionIndex++;
            });
            
            // Render
            $.ajax(path)
                .done(function () {
                    var sizeParts = self.settings.staticOptions.size.split('x');

                    $('<img>', {
                        src   : path,
                        width : sizeParts[0],
                        height: sizeParts[1],
                        alt   : ''
                    }).appendTo(self.elements.container);
                })
                .fail(function (response) {
                    self.setLog('error', response.responseText);
                });

            return self;
        },

        /**
         * Ajout des options à GmapsTool
         *
         * @param object options Options à ajouter
         */
        setOptions: function (options) {
            $.extend(true, this.settings, options);

            return this;
        },

        /**
         * Ajout des options à la carte
         *
         * @param object options Options provenant de l'API Google maps
         */
        setMapOptions: function (options) {
            this.getMap().setOptions(options);

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

            if (self.settings.type === 'staticmap' && markers.length) {
                self.settings.staticOptions.markers = '';

                $.each(markers, function (i, marker) {
                    if (typeof marker.content !== 'string' || (typeof marker.content === 'string' && marker.content.indexOf('http') === -1)) {
                        self.setLog('error', 'Marker content must be online and must be an PNG image (64x64). E.g: http://site.com/image.png');
                        return;
                    }

                    self.settings.staticOptions.markers += 'icon:' + encodeURIComponent(marker.content) + '|' + ((typeof marker.position === 'array') ? marker.position.join(',') : marker.position);
                });

            } else {
                self.bounds = new google.maps.LatLngBounds();

                if (self.prepareMarkersOptions(markers, options)) {
                    if (markers.length) {
                        $.each(markers, function (i, marker) {
                            self.setMarker(marker);
                        });
                    }

                    // Mise à jour de la position en fonction des markers
                    if (self.settings.markersOptions.centerBounds) {
                        self.setCenter();
                    }

                    // Ajout des clusters
                    if (self.settings.markersOptions.cluster) {
                        self.addMarkersClusters();
                    }

                    // Fonction utilisateur
                    if (self.settings.markersOptions.onComplete !== undefined) {
                        self.settings.markersOptions.onComplete.call({
                            gmapsTool: self,
                            markers  : self.getMarkers(),
                            bounds   : self.bounds
                        });
                    }
                }
            }

            return self;
        },

        /**
         * Préparation des options pour ajouter des marqueurs
         *
         * @param array  markers
         * @param object options
         * @returns bool
         */
        prepareMarkersOptions: function (markers, options) {
            if (markers === undefined) {
                this.setLog('error', 'Missing markers parameter');
                return false;
            }

            $.extend(true, this.settings.markersOptions, options);

            // Dépendence RichMarker ?
            if (typeof RichMarker === 'undefined') {
                this.setLog('error', 'Missing "RichMarker" dependency');
                return false;
            }

            // InfoWindow ?
            var infoWindow = false;
            $.each(markers, function (i, marker) {
                if (marker.hasOwnProperty('infoWindow')) {
                    infoWindow = true;
                    return;
                }
            });

            if (infoWindow) {
                // Conversion du pixelOffset en Gmaps Size
                this.settings.markersOptions.infoWindowOptions.pixelOffset = new google.maps.Size(this.settings.markersOptions.infoWindowOptions.pixelOffset[0], this.settings.markersOptions.infoWindowOptions.pixelOffset[1]);

                // Init infoWindow
                this.infoWindow = new google.maps.InfoWindow(this.settings.markersOptions.infoWindowOptions);
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
         */
        addMarkersClusters: function () {
            var self = this;

            // Dépendence MarkerClusterer ?
            if (typeof MarkerClusterer === 'undefined') {
                self.setLog('error', 'Missing "MarkerClusterer" dependency');
                return false;
            }

            // Options
            var clusterOptions = {
                maxZoom: self.settings.map.maxZoom - 1
            };

            // Cluster svg?
            if (self.settings.markersOptions.clusterOptions.svg !== false && Object.keys(self.settings.markersOptions.clusterOptions.svg).length && Object.keys(self.settings.markersOptions.clusterOptions.svg.sizes).length) {
                clusterOptions.styles = [];

                $.each(self.settings.markersOptions.clusterOptions.svg.sizes, function (index, size) {
                    var color = (self.settings.markersOptions.clusterOptions.svg.colors.length) ? self.settings.markersOptions.clusterOptions.svg.colors[index] : self.settings.markersOptions.clusterOptions.svg.color;
                    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">' +
                        '<circle cx="25" cy="25" r="25" stroke="' + self.settings.markersOptions.clusterOptions.svg.borderColor + '" stroke-width="' + self.settings.markersOptions.clusterOptions.svg.borderWidth + '" fill="' + color + '" />' +
                    '</svg>';

                    clusterOptions.styles.push({
                        textColor: self.settings.markersOptions.clusterOptions.svg.textColor,
                        url: 'data:image/svg+xml;base64,' + window.btoa(svg),
                        width: size,
                        height: size
                    });
                });
            }

            // Set options
            $.extend(true, self.settings.markersOptions.clusterOptions, clusterOptions, self.settings.markersOptions.clusterOptions);

            // Liste des marqueurs
            var markers = [];
            $.each(self.getMarkers(), function (i, marker) {
                markers.push(marker.richMarker);
            });

            // Init clusters
            return new MarkerClusterer(self.getMap(), markers, self.settings.markersOptions.clusterOptions);
        },

        /**
         * Ajout d'un marqueur
         *
         * @param  object marker
         * @return object
         */
        setMarker: function (marker) {
            var self = this;

            // Get LatLng
            marker.position = self.getLatLng(marker.position);

            // RichMarker
            $.extend(true, (marker.richMarkerOptions = {}), self.settings.markersOptions.richMarkerOptions, {
                map: self.getMap(),
                content: ((typeof marker.content === 'object') ? marker.content[0] : marker.content),
                position: marker.position
            });
            marker.richMarker = new RichMarker(marker.richMarkerOptions);
            
            // InfoWindow
            if (marker.hasOwnProperty('infoWindow') && !self.settings.markersOptions.hasOwnProperty('onClick')) {
                self.settings.markersOptions.onClick = function () {
                    self.openInfoWindow(this);
                };
            }

            // Événements Gmap
            $.each(['click', 'dblclick', 'mouseover', 'mouseout'], function (i, eventName) {
                var eventOptName = self.formatEventName(eventName);

                if (self.settings.markersOptions[eventOptName] !== undefined) {
                    google.maps.event.addListener(marker.richMarker, eventName, function () {
                        self.settings.markersOptions[eventOptName].call({
                            gmapsTool: self,
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
            if (self.settings.markersOptions.onAdd !== undefined) {
                self.settings.markersOptions.onAdd.call({
                    gmapsTool: self,
                    marker: marker
                });
            }

            return marker;
        },

        /**
         * InfoWindow open/close
         */
        openInfoWindow: function (event) {
            var self = event.gmapsTool || this;

            self.closeInfoWindow();

            if (event.marker.infoWindow.length) {
                self.getInfoWindow().setContent((typeof event.marker.infoWindow === 'object') ? event.marker.infoWindow[0].outerHTML : event.marker.infoWindow);
                self.getInfoWindow().setPosition(event.marker.position);
                self.getInfoWindow().open(self.getMap());
                self.getInfoWindow().gmapsTool = self;
                self.getInfoWindow().elements = {
                    infowindow: $(self.getMap().getDiv()).find('.gm-style-iw')
                };

                // Add classes
                if (self.getInfoWindow().elements.infowindow.length) {
                    // Wrapper
                    self.getInfoWindow().elements.wrapper = self.getInfoWindow().elements.infowindow.parent();
                    if (self.getInfoWindow().elements.wrapper.length) {
                        self.getInfoWindow().elements.wrapper.addClass('gm-style-iw-wrapper');
                    }

                    // Background
                    self.getInfoWindow().elements.background = self.getInfoWindow().elements.infowindow.prev();
                    if (self.getInfoWindow().elements.background.length) {
                        self.getInfoWindow().elements.background.addClass('gm-style-iw-background');
                    }

                    // Close
                    self.getInfoWindow().elements.close = self.getInfoWindow().elements.infowindow.next();
                    if (self.getInfoWindow().elements.close.length) {
                        self.getInfoWindow().elements.close.addClass('gm-style-iw-close');
                    }
                }

                // Events
                event.marker.content.addClass('is-open');
                google.maps.event.addListener(self.getInfoWindow(), 'closeclick', self.closeInfoWindow);

                // User callback
                if (self.settings.markersOptions.onInfoWindowOpen !== undefined) {
                    self.settings.markersOptions.onInfoWindowOpen.call({
                        gmapsTool: self,
                        event: event.event,
                        marker: event.marker,
                        infoWindow: self.getInfoWindow()
                    });
                }
            }

            return self;
        },
        closeInfoWindow: function() {
            var self = this.gmapsTool || this;

            if (self.markers.length) {
                $.each(self.markers, function () {
                    this.content.removeClass('is-open');
                });
            }

            // User callback
            if (self.settings.markersOptions.onInfoWindowClose !== undefined) {
                self.settings.markersOptions.onInfoWindowClose.call({
                    gmapsTool: self,
                    infoWindow: self.getInfoWindow()
                });
            }

            return self;
        },

        /**
         * Récupération de l'infoWindow courante
         */
        getInfoWindow: function () {
            return this.infoWindow;
        },

        /**
         * Centre la carte
         * Si this.bounds est présent, le centre se fait en fonction de ses positions
         */
        setCenter: function () {
            if (this.bounds !== undefined) {
                if (this.getMarkers().length > 1) {
                    this.getMap().fitBounds(this.bounds);
                }

                this.getMap().setCenter(this.bounds.getCenter());

            } else {
                this.getMap().setCenter(this.getCenter(true));
            }

            return this;
        },

        /**
         * Retourne la position du centre
         *
         * @param bool latlng Récupérer la valeur {lat, lng} de Google Maps ? False par défaut.
         * @return mixed
         */
        getCenter: function (latlng) {
            latlng = latlng || false;

            return (latlng) ? this.settings.map.center : this.center;
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
                    gmapsTool: self,
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
                map: self.getMap()
            });
            layer.layer = new google.maps.KmlLayer(options);

            // Événements Layer
            $.each(['click', 'dblclick', 'mouseover', 'mouseout'], function (i, eventName) {
                var eventOptName = self.formatEventName(eventName);

                if (options[eventOptName] !== undefined) {
                   layer.layer.addListener(eventName, function () {
                        options[eventOptName].call({
                            gmapsTool: self,
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
                    gmapsTool: self,
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
            self.style = true;

            $.getJSON(path)
                .fail(function () {
                    self.setLog('error', 'Json file not found.');
                })
                .done(function (style) {
                    if (self.settings.type === 'staticmap') {
                        self.settings.staticOptions.style = self.staticFormatStyles(style);
                        self.initStatic();

                    } else {
                        self.getMap().set('styles', style);
                    }
                });

            return self;
        },

        /**
         * Formatage des styles pour une map statique
         *
         * @param data données décodées depuis le JSON
         * @return string
         */
        staticFormatStyles: function (data) {
            var items     = [];
            var separator = '|';
            var isColor   = function (value) {
                return /^#[0-9a-f]{6}$/i.test(value.toString());
            };
            var toColor   = function (value) {
                return '0x' + value.slice(1);
            };
            var i         = 0;
            items.length  = 0;

            for (i; i < data.length; i++) {
                var item       = data[i],
                    hasFeature = item.hasOwnProperty('featureType'),
                    hasElement = item.hasOwnProperty('elementType'),
                    stylers    = item.stylers,
                    target     = '',
                    style      = '';

                if (!hasFeature && !hasElement) {
                    target = 'feature:all';
                } else {
                    if (hasFeature) {
                        target = 'feature:' + item.featureType;
                    }
                    if (hasElement) {
                        target = target ? target + separator : '';
                        target += 'element:' + item.elementType;
                    }
                }

                var s = 0;
                for (s; s < stylers.length; s++) {
                    var styleItem = stylers[s],
                        key       = Object.keys(styleItem)[0];

                    style = style ? style + separator : '';
                    style += key + ':' + (isColor(styleItem[key]) ? toColor(styleItem[key]) : styleItem[key]);
                }

                items.push(target + separator + style);
            }

            return items.join('&style=');
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
                            var level = self.getMap().getZoom();
                            self.getMap().setZoom((type === 'in') ? ++level : --level);

                            if (options.zoom.onClick !== undefined) {
                                options.zoom.onClick.call({
                                    gmapsTool: self,
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
            position = position || this.getCenter();

            if (typeof position === 'string' && position.indexOf(',') !== -1) {
                position = position.split(',');
            }

            if (typeof position === 'object' && position.length === 2) {
                if (this.settings.type === 'staticmap') {
                    return position[0] + ',' + position[1];

                } else {
                    return new google.maps.LatLng(position[0], position[1]);
                }
            }

            return false;
        },

        /**
         * Alias pour récupérer la carte GoogleMaps
         *
         * @returns {google.maps.Map}
         */
        getMap: function () {
            return this.gmap;
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

    $.fn.gmapsTool = function (options) {
        return new $.GmapsTool($(this), options);
    };
})(jQuery);