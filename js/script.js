document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map', {
        center: [-14.235, -51.925],
        zoom: window.innerWidth < 600 ? 3 : 4
    });

    let kmlLayer = null;
    let locationMarker = null;
    let currentStateLayer = null;

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    });
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri'
    });
    const hybridLayer = L.layerGroup([satelliteLayer, streetLayer]);

    streetLayer.addTo(map);
    const baseMaps = {
        'Mapa de Ruas': streetLayer,
        'Imagem de Satélite': satelliteLayer,
        'Híbrido': hybridLayer
    };

    const markerClusterGroup = L.markerClusterGroup({
        disableClusteringAtZoom: 15
    }).addTo(map);

    const layerControl = L.control.layers(baseMaps, null, {
        position: 'topright'
    }).addTo(map);

    $.getJSON('/sitegeo/GeoJson/br_states.json', (data) => {
        const statesLayer = L.geoJSON(data, {
            style: {
                color: '#B3DF72',
                weight: 1,
                fillOpacity: 0
            },
            onEachFeature: (feature, layer) => layer.bindPopup(feature.properties.name || 'Sem nome')
        }).addTo(map);
        layerControl.addOverlay(statesLayer, 'Estados do Brasil');
    });

    const estadoCenters = {
        "AC": [-8.77, -70.55], "AL": [-9.62, -36.82], "AM": [-3.47, -65.10],
        "AP": [1.41, -51.77], "BA": [-12.97, -38.50], "CE": [-3.71, -38.54],
        "DF": [-15.83, -47.86], "ES": [-19.19, -40.34], "GO": [-16.64, -49.31],
        "MA": [-2.55, -44.30], "MG": [-18.10, -44.38], "MS": [-20.51, -54.54],
        "MT": [-12.64, -55.42], "PA": [-5.53, -52.29], "PB": [-7.06, -35.55],
        "PE": [-8.28, -35.07], "PI": [-8.28, -43.68], "PR": [-24.89, -51.55],
        "RJ": [-22.84, -43.15], "RN": [-5.22, -36.52], "RO": [-11.22, -62.80],
        "RR": [1.89, -61.22], "RS": [-30.01, -51.22], "SC": [-27.33, -49.44],
        "SE": [-10.90, -37.07], "SP": [-23.55, -46.64], "TO": [-10.25, -48.25]
    };

    const cache = {};

    function loadImoveis(estado) {
        $('#loading').show();
        markerClusterGroup.clearLayers();

        if (cache[estado]) {
            markerClusterGroup.addLayer(cache[estado]);
            currentStateLayer = cache[estado];
            $('#loading').hide();
            return;
        }

        const urls = [
            `/sitegeo/GeoJson/sigef/Imóvel certificado SNCI Brasil_${estado}.geojson`,
            `/sitegeo/GeoJson/sigef/Sigef Brasil_${estado}.geojson`
        ];

        const requests = urls.map(url => 
            $.getJSON(url)
                .then(data => {
                    if (data) {
                        console.log(`Dados carregados de: ${url}`);
                        return data;
                    } else {
                        console.warn(`Nenhum dado encontrado em: ${url}`);
                        return null;
                    }
                })
                .catch(error => {
                    console.error(`Erro ao carregar ${url}: ${error}`);
                    return null;
                })
        );

        Promise.all(requests)
            .then((responses) => {
                const layers = responses.filter(data => data).map((data, index) => {
                    const source = index === 0 ? 'SNCI' : 'SIGEF';
                    return L.geoJSON(data, {
                        style: {
                            color: '#38414A',
                            weight: 2,
                            fillOpacity: .1
                        },
                        onEachFeature: (feature, layer) => {
                            const popupContent = Object.entries(feature.properties)
                                .map(([key, value]) => `<strong>${key}:</strong> ${value}<br>`)
                                .join('');
                            layer.bindPopup(`<h4>Detalhes do Imóvel (${source})</h4>${popupContent}`);
                        },
                        pointToLayer: (feature, latlng) => L.marker(latlng)
                    });
                });

                const layerGroup = L.layerGroup(layers);
                cache[estado] = layerGroup;
                markerClusterGroup.addLayer(layerGroup);
                currentStateLayer = layerGroup;
            })
            .finally(() => $('#loading').hide());
    }

    function locateUser() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                ({ coords }) => {
                    if (locationMarker) {
                        map.removeLayer(locationMarker);
                    }
                    map.setView([coords.latitude, coords.longitude], 12);
                    locationMarker = L.marker([coords.latitude, coords.longitude]).addTo(map)
                        .bindPopup('Você está aqui!').openPopup();
                },
                (error) => Swal.fire('Erro', `Erro ao obter localização: ${error.message}`, 'error'),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            Swal.fire('Erro', 'Geolocalização não suportada pelo navegador.', 'error');
        }
    }

    function clearLocation() {
        if (locationMarker) {
            map.removeLayer(locationMarker);
            locationMarker = null;
            Swal.fire('Sucesso', 'Sua localização foi removida.', 'success');
        }
    }

    const geolocalizacaoLayer = L.layerGroup();
    geolocalizacaoLayer.on('add', locateUser);
    geolocalizacaoLayer.on('remove', clearLocation);
    layerControl.addOverlay(geolocalizacaoLayer, 'Minha Localização');

    function loadKML(file) {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (kmlLayer) {
                    map.removeLayer(kmlLayer);
                }
                kmlLayer = omnivore.kml(e.target.result)
                    .on('ready', (layer) => {
                        map.fitBounds(layer.getBounds());
                        Swal.fire({
                            icon: 'success',
                            title: 'KML carregado com sucesso!',
                            showConfirmButton: false,
                            timer: 1500
                        });
                    })
                    .addTo(map);
            };
            reader.readAsDataURL(file);
        }
    }

    function clearKML() {
        if (kmlLayer) {
            map.removeLayer(kmlLayer);
            kmlLayer = null;
            document.getElementById('file-info').textContent = '';
            Swal.fire({
                icon: 'success',
                title: 'KML removido com sucesso!',
                showConfirmButton: false,
                timer: 1500
            });
        }
    }

    function clearState() {
        if (currentStateLayer) {
            markerClusterGroup.removeLayer(currentStateLayer);
            currentStateLayer = null;
            document.getElementById('estado-select').value = '';
            Swal.fire({
                icon: 'success',
                title: 'Estado removido com sucesso!',
                showConfirmButton: false,
                timer: 1500
            });
        }
    }

    // Controle personalizado para as funcionalidades
    const customControl = L.Control.extend({
        options: { position: 'bottomleft' },
        onAdd: function () {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            container.innerHTML = `
                <input type="file" id="kml-file" accept=".kml" style="display:none;">
                <label for="kml-file" class="custom-kml-btn">Carregar KML</label>
                <button id="clear-kml">Limpar KML</button>
                <select id="estado-select">
                    <option value="">Selecione um estado</option>
                    ${Object.keys(estadoCenters).map(estado => `<option value="${estado}">${estado}</option>`).join('')}
                </select>
                <button id="clear-state">Limpar Estado</button>
                
            `;

            container.querySelector('#kml-file').addEventListener('change', (e) => loadKML(e.target.files[0]));
            container.querySelector('#clear-kml').addEventListener('click', clearKML);
            container.querySelector('#estado-select').addEventListener('change', (e) => {
                const estado = e.target.value;
                if (estado && estadoCenters[estado]) {
                    map.setView(estadoCenters[estado], 12);
                    loadImoveis(estado);
                }
            });
            container.querySelector('#clear-state').addEventListener('click', clearState);
            

            return container;
        }
    });

    map.addControl(new customControl());
});