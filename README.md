# Documentation GmapsTool

Simplifie l'utilisation des cartes GoogleMaps.

## Initialisation

    var gmapsTool = $('#gmap').gmapsTool([object options]);

## Options

| Option                                              | Type         | Valeur par défaut | Description                                                           |
|-----------------------------------------------------|--------------|-------------------|-----------------------------------------------------------------------|
| map                                                 | object       | Voir ci-dessous   | Options à passer à la librarie Gmap                                   |
| &nbsp;&nbsp;&nbsp;&nbsp;center*                     | string/array | undefined         | Positions Lat,Lng pour centrer la carte                               |
| &nbsp;&nbsp;&nbsp;&nbsp;zoom                        | integer      | 10                | Niveau de zoom par défaut                                             |
| &nbsp;&nbsp;&nbsp;&nbsp;minZoom                     | integer      | 7                 | Niveau de zomm minimum                                                |
| &nbsp;&nbsp;&nbsp;&nbsp;maxZoom                     | integer      | 17                | Niveau de zomm maximum                                                |
| richMarkerOptions                                   | object       | Voir ci-dessous   | Options à passer à la librarie RichMarker                             |
| &nbsp;&nbsp;&nbsp;&nbsp;draggable                   | boolean      | false             | Option du drag&drop                                                   |
| &nbsp;&nbsp;&nbsp;&nbsp;shadow                      | string       | 'none'            | Option des ombres                                                     |
| apiKey                                              | string       | undefined         | Ajouter la clé API google maps (utilisé pour les cartes statiques)    |
| fullscreen                                          | boolean      | false             | Permet de désactiver le zoom au scroll quand la map est en fullscreen |

* Options obligatoires.

## Méthodes classiques

| Méthode       | Arguments                                     | Description                                              |
|---------------|-----------------------------------------------|----------------------------------------------------------|
| init          | -                                             | Initialise la carte                                      |
| setOptions    | **options** *object* Options à ajouter        | Ajoute des options à GmapsTool                           |
| setMapOptions | **options** *object* Options à ajouter        | Ajoute des options provenant de la librairie Google Maps |
| setCenter     | -                                             | Centre la carte                                          |
| setStyles     | **path** *string* Chemin vers le fichier json | Ajoute un style personnalisé                             |
| getMap        | -                                             | Récupère l'objet GoogleMaps                              |
| getLatLng     | **position** *mixed* Positions 'Lat, Lng'     | Récupère la position en LatLng par GoogleMaps            |
| getMarkers    | -                                             | Récupère tous les marqueurs                              |
| getInfoWindow | -                                             | Récupère l'infoWindow courante                           |
| getLayers     | -                                             | Récupère tous les calques                                |

### Exemple

    var map = $('#gmap').gmapsTool({
        map: {center: [46.1620606, -1.1765508]}
    });
    
    map.init();
    
    map.setStyles('style.json');


## Gestion des marqueurs et clusters

### Méthode

    setMarkers(array markers, [object options])

### Markers

| Option     | Type  | Description                                                                                                                                      |
|------------|-------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| position   | mixed | Position du marqueur : [Lat, Lng] ou 'lat,lng'                                                                                                   |
| content    | mixed | Affichage du marqueur : Objet jQuery ou chaine html (si carte statique, il faut que le marqueur soit une image PNG et accessible en url aboslue) |
| infoWindow | mixed | Permet d'ajouter une infoWindow : Objet jQuery ou chaine html (optionnel)                                                                        |

### Options

| Option                                                      | Type     | Valeur par défaut    | Description                                                                  |
|-------------------------------------------------------------|----------|----------------------|------------------------------------------------------------------------------|
| cluster                                                     | boolean  | false                | Activation des clusters (necessite la librairie MarkerClusterer)             |
| clusterOptions                                              | object   | Voir ci-dessous      | Permet de définir les options de la librairie MarkerClusterer                |
| &nbsp;&nbsp;&nbsp;&nbsp;svg                                 | object   | Voir ci-dessous      | Si spécifié, les clusters seront affichés en SVG                             |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;color       | string   | '#303748'            | Couleur unique pour tous les clusters                                        |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;colors      | array    | []                   | Surcharge la couleur principale pour en définir une par niveau (5 niveaux)   |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;sizes       | array    | [36, 46, 56, 66, 76] | Taille du cluster en px pour chaque niveau                                   |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;textColor   | string   | '#fff'               | Couleur du texte                                                             |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;borderWidth | integer  | 1                    | Taille de la bordure                                                         |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;borderColor | string   | '#fff'               | Couleur de la bordure                                                        |
| centerBounds                                                | boolean  | true                 | Centre la carte aux limites des positions des marqueurs                      |                                                  | object   | Voir ci-dessous      | Options pour les infoWindows                                                 |
| onClick, onDblclick, onMouseover, onMouseout                | function | undefined            | Callback GoogleMaps                                                          |
| infoWindowOptions                                           | object   | Voir ci-dessous      | Permet de définir les options pour créer une infoWindow                      |
| &nbsp;&nbsp;&nbsp;&nbsp;pixelOffset                         | array    | [0, -30]             | Position de l'infoWindow par rapport au marqueur                             |
| onInfoWindowOpen                                            | function | undefined            | Callback une fois l'infoWindow ouverte                                       |
| onInfoWindowClose                                           | function | undefined            | Callback une fois l'infoWindow fermée                                        |
| onAdd                                                       | function | undefined            | Callback une fois un marqueur ajouté                                         |
| onComplete                                                  | function | undefined            | Callback une fois tous les marqueurs ajoutés                                 |

### Exemple

    var map = $('#gmap').gmapsTool({
        map: {center: [46.1620606, -1.1765508]}
    });
    
    map.setMarkers([
        {position: [46.1620606, -1.1765508], content: $('span', {html: '<svg/>'}) },
        {position: '46.021044,-0.8681477', content: '<span class="icon icon--map"></span>'},
        {position: [46.1620606, -1.1765508], content: $('span', {html: '<svg/>'}), infoWindow: 'Contenu de la popup' },
    ]);


## Gestion des calques KML

### Méthode

    setLayers(array layers, [object options])

### Layers

| Option | Type   | Description                           |
|--------|--------|---------------------------------------|
| path   | string | URL absolue d'un calque au format KML |

### Options

| Option                                               | Type     | Valeur par défaut | Description                                |
|------------------------------------------------------|----------|-------------------|--------------------------------------------|
| onClick, onDefaultviewport_changed, onStatus_changed | function | undefined         | Callback GoogleMaps                        |
| onAdd                                                | function | undefined         | Callback une fois le calque ajouté         |
| onComplete                                           | function | undefined         | Callback une fois tous les calques ajoutés |

### Exemple

    var map = $('#gmap').gmapsTool({
        map: {center: [46.1620606, -1.1765508]}
    });
    
    map.setLayers([
        {path: 'http://site.com/example.kml'}
    ]);


## Contrôles personnalisés

### Méthode

    setControls() // désactive tous les contrôles
    setControls(object options)

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

### Exemple

    var map = $('#gmap').gmapsTool({
        map: {center: [46.1620606, -1.1765508]}
    });
    
    map.setControls({
        'zoom': {
            'in': $('#zoom-in'),
            'out': $('#zoom-out')
        }
    });


## Carte statique (en image)

### Méthode

    setStatic([object options])

### Options

| Option                             | Type    | Valeur par défaut | Description                                   |
|------------------------------------|---------|-------------------|-----------------------------------------------|
| size                               | string  | '300x300'         | Taille de l'image                             |
| scale                              | integer | 2                 | Indice multiplicateur de la taille de l'image |
| maptype                            | string  | 'roadmap'         | Type de rendu                                 |

### Particularité

La carte statique fonctionne à l'inverse de la carte js. On doit d'abord définir les options avant de l'initialiser.
Si on veut personaliser la carte, il faut appeler *setStyles()* en dernier. Cette dernière s'occupera d'initialiser la carte une fois les styles récupérés.
Pour que la carte fonctionne, il faut obligatoirement définir l'option *apiKey*.

### Exemple

    var map = $('#gmap').gmapsTool({
        map: {center: [46.1620606, -1.1765508]}
    });
    
    map.setStatic({
        size: '600x300'
    });
    
    map.init();