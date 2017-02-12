# Documentation GmapsTool

Ce script permet de simplifier l'utilisation des cartes GoogleMaps.

## Initialisation

    var GmapsTool = $('#gmap').gmapsTool([gmapOptions], [options]);


## Options

| Option                            | Type    | Valeur par défaut | Description                                                           |
|-----------------------------------|---------|-------------------|-----------------------------------------------------------------------|
| gmapOptions                       | object  | Voir ci-dessous   | Options à passer à la librarie Gmap                                   |
| &nbsp;&nbsp;&nbsp;&nbsp;center*   | mixed   | undefined         | Positions Lat,Lng pour centrer la carte                               |
| &nbsp;&nbsp;&nbsp;&nbsp;zoom      | integer | 10                | Niveau de zoom par défaut                                             |
| &nbsp;&nbsp;&nbsp;&nbsp;minZoom   | integer | 7                 | Niveau de zomm minimum                                                |
| &nbsp;&nbsp;&nbsp;&nbsp;maxZoom   | integer | 17                | Niveau de zomm maximum                                                |
| richMarkerOptions                 | object  | Voir ci-dessous   | Options à passer à la librarie RichMarker                             |
| &nbsp;&nbsp;&nbsp;&nbsp;draggable | boolean | false             | Option du drag&drop                                                   |
| &nbsp;&nbsp;&nbsp;&nbsp;shadow    | string  | 'none'            | Option des ombres                                                     |
| fullscreen                        | boolean | false             | Permet de désactiver le zoom au scroll quand la map est en fullscreen |

* Options obligatoires.


## Méthodes classiques

| Méthode       | Arguments                                     | Description                                                        |
|---------------|-----------------------------------------------|--------------------------------------------------------------------|
| init          | -                                             | Permet d'initialiser la carte                                      |
| setMapOptions | **options** *object* Options à ajouter        | Permet d'ajouter des options provenant de la librairie Google Maps |
| setCenter     | -                                             | Centre la carte                                                    |
| setStyles     | **path** *string* Chemin vers le fichier json | Permet d'ajouter un style personnalisé                             |
| getLatLng     | **position** *mixed* Positions 'Lat, Lng'     | Récupération de la position en LatLng par GoogleMaps               |


## Gestion des marqueurs et clusters

### Méthode

    setMarkers(markers, [options])

### Markers

**markers** *array* Liste des marqueurs à ajouter

Chaque marqueur doit à avoir au moins 2 options :
**position**: [Lat, Lng]
**content**: Objet jQuery ou chaine html

    var markers = [
        {position: [46.1620606, -1.1765508], content: $('span', {html: '<svg/>'}) },
        {position: [46.021044, -0.8681477], content: '<span class="icon icon--map"></span>'}
    ];

### Options

| Option                                       | Type     | Valeur par défaut | Description                                                      |
|----------------------------------------------|----------|-------------------|------------------------------------------------------------------|
| cluster                                      | boolean  | false             | Activation des clusters (necessite la librairie MarkerClusterer) |
| clusterOptions                               | object   | {}                | Permet de définir les options de la librairie MarkerClusterer    |
| onClick, onDblclick, onMouseover, onMouseout | function | undefined         | Callback GoogleMaps                                              |
| onAdd                                        | function | undefined         | Callback une fois un marqueur ajouté                             |
| onComplete                                   | function | undefined         | Callback une fois tous les marqueurs ajoutés                     |


## Gestion des calques KML

### Méthode

    setLayers(layers, [options])

### Layers

**layers** *array* Liste des calques à ajouter

Chaque calque doit avoir au moins l'option **path**

    var layers = [
        {path: 'http://site.com/example.kml'}
    ];

### Options

| Option                                               | Type     | Valeur par défaut | Description                                |
|------------------------------------------------------|----------|-------------------|--------------------------------------------|
| onClick, onDefaultviewport_changed, onStatus_changed | function | undefined         | Callback GoogleMaps                        |
| onAdd                                                | function | undefined         | Callback une fois le calque ajouté         |
| onComplete                                           | function | undefined         | Callback une fois tous les calques ajoutés |


## Contrôles personnalisés

### Méthode

    setControls(options)

### Options

| Option                                    | Type     | Valeur par défaut | Description                                                |
|-------------------------------------------|----------|-------------------|------------------------------------------------------------|
| mapOptions                                | object   | Voir ci-dessous   | Liste les options GoogleMaps pour désactiver les controles |
| &nbsp;&nbsp;&nbsp;&nbsp;mapTypeControl    | boolean  | false             | Option pour mapTypeControl                                 |
| &nbsp;&nbsp;&nbsp;&nbsp;streetViewControl | boolean  | false             | Option pour streetViewControl                              |
| &nbsp;&nbsp;&nbsp;&nbsp;zoomControl       | boolean  | false             | Option pour zoomControl                                    |
| zoom                                      | object   | Voir ci-dessous   | Liste les options pour les controles de zoom               |
| &nbsp;&nbsp;&nbsp;&nbsp;in                | object   | undefined         | Élément jQuery pour zommer                                 |
| &nbsp;&nbsp;&nbsp;&nbsp;out               | object   | undefined         | Élément jQuery pour dézommer                               |
| &nbsp;&nbsp;&nbsp;&nbsp;onClick           | function | undefined         | Callback lors du clique sur un zoom                        |