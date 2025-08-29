// === Initialization ===

const tip = document.createElement('p');
tip.id = 'sidebar-tip';
tip.textContent = '3. Klicken Sie auf eine Stadt auf dem Globus, um den Zoonamen und Infos am rechts zu sehen';
document.getElementById('tipsPanel').insertBefore(tip, document.getElementById('tipsPanel').firstChild);

const tip2 = document.createElement('p');
tip2.id = 'sidebar-tip-2';
tip2.textContent = '2. Der Globus kann mit dem Mausrad oder den Fingern vergrößert oder verkleinert werden';
document.getElementById('tipsPanel').insertBefore(tip2, document.getElementById('tipsPanel').firstChild);

const tip3 = document.createElement('p');
tip3.id = 'sidebar-tip-3';
tip3.textContent = '1. Klicke auf eine Dekade am links, um ein Jahr der Vereinsreisen auszuwählen';
document.getElementById('tipsPanel').insertBefore(tip3, document.getElementById('tipsPanel').firstChild);



const yearBox = document.getElementById('info-year');
const countryBox = document.getElementById('info-country');
const zooBox = document.getElementById('info-zoo');
const reiseBox = document.getElementById('info-reise');

const globe = Globe()
  .globeImageUrl('./map-texture.jpg')
  .backgroundColor('rgba(0,0,0,0)')
  .width(1120)
  .height(900)
  .atmosphereColor('rgba(255,255,255,0)')
  .atmosphereAltitude(0.15)
  (document.getElementById('globeViz'));

globe.showAtmosphere(true);
globe.enablePointerInteraction(true);
globe.lineHoverPrecision(0.1);
globe.polygonsTransitionDuration(0);

let fullData = [];
let currentSelectedYear = 'all';
let geoDDR, geoBRD;

let hoveredLabel = null;
let selectedLabel = null;

// === Data Loading ===
fetch('./dataset-leipzig-zoo-reise-final.csv')
  .then(res => res.text())
  .then(csv => {
    const parsed = Papa.parse(csv, { header: true });
    fullData = parsed.data.filter(d => d.fin_lat && d.fin_lon);

    buildSidebar(fullData);
    renderPoints('all');
  });

Promise.all([
  fetch('./deutschland.json').then(res => res.json()),
  fetch('./ddr.geojson').then(res => res.json())
]).then(([brdData, ddrData]) => {
  geoBRD = brdData;
  geoDDR = ddrData;
  updateMap(currentSelectedYear);
});

// === Sidebar Building ===
function buildSidebar(data) {
  const sidebar = document.getElementById('yearSidebar');
  sidebar.innerHTML = '';

  const allItem = document.createElement('div');
  allItem.className = 'year-item active';
  allItem.textContent = `Alle Orte (${data.length})`;
  allItem.dataset.year = 'all';
  sidebar.appendChild(allItem);

  const decadeMap = {};
  data.forEach(d => {
    const year = d.jahr;
    const decade = Math.floor(+year / 10) * 10;
    if (!decadeMap[decade]) decadeMap[decade] = [];
    decadeMap[decade].push(d);
  });

  Object.keys(decadeMap).sort().forEach(decade => {
    const group = decadeMap[decade];
    const wrapper = document.createElement('div');
    wrapper.className = 'decade-group';

    const header = document.createElement('div');
    header.className = 'decade-header';
    header.textContent = `${decade}er`;
    wrapper.appendChild(header);

    const list = document.createElement('div');
    list.className = 'year-list hidden';

    const yearCounts = {};
    group.forEach(d => {
      if (!yearCounts[d.jahr]) yearCounts[d.jahr] = 0;
      yearCounts[d.jahr]++;
    });

    Object.keys(yearCounts).sort().forEach(year => {
      const item = document.createElement('div');
      item.className = 'year-item';
      item.textContent = `${year} (${yearCounts[year]})`;
      item.dataset.year = year;
      list.appendChild(item);
    });

    wrapper.appendChild(list);
    sidebar.appendChild(wrapper);
  });

  sidebar.addEventListener('click', e => {
    const header = e.target.closest('.decade-header');
    if (header) {
      document.querySelectorAll('.year-list').forEach(list => list.classList.add('hidden'));
      header.nextElementSibling.classList.remove('hidden');
      return;
    }

    const target = e.target.closest('.year-item');
    if (!target) return;
    sidebar.querySelectorAll('.year-item').forEach(el => el.classList.remove('active'));
    target.classList.add('active');
    renderPoints(target.dataset.year);
  });
}

// === Map DDR / Germany Update Function ===
function updateMap(selectedYear) {
  let polygons = [];
  let isDDR = false;

  if (selectedYear === 'all') {
    polygons = geoBRD.features || [];
  } else {
    const year = parseInt(selectedYear);
    if (year < 1989) {
      polygons = geoDDR.features || [];
      isDDR = true;
    } else {
      polygons = geoBRD.features || [];
    }
  }

  globe
    .polygonsData(polygons)
    .polygonAltitude(() => 0.0005)
    .polygonCapColor(() => 'rgba(0, 100, 0, 0.33)')
    .polygonSideColor(() => 'rgba(0, 0, 0, 0)')
    .polygonStrokeColor(() => '#ffffff');
}

// === Leipzig Marker ===
const leipzigMarker = [{
  lat: 51.33408756923266,
  lng: 12.379851431478888,
  size: 65,
  title: "Zoo Leipzig"
}];

globe
  .htmlElementsData(leipzigMarker)
  .htmlElement(d => {
    const el = document.createElement('div');
    el.innerHTML = `<img src="./zoo_leipzig_logo.svg" title="${d.title}" style="width: ${d.size}px;">`;
    el.style.pointerEvents = 'none';
    return el;
  })
  .htmlElementVisibilityModifier((el, visible) => {
    el.style.opacity = visible ? 0.85 : 1;
  });

  // === Autoupdate on altitude ===
globe.controls().addEventListener('change', () => {
  globe.labelsData(globe.labelsData());
});

// === RENDER POINTS ===
function renderPoints(selectedYear) {
  currentSelectedYear = selectedYear;

  selectedLabel = null;
  yearBox.textContent = '-';
  countryBox.textContent = '-';
  zooBox.textContent = '-';
  reiseBox.textContent = '-';

  const filtered = selectedYear === 'all'
    ? fullData
    : fullData.filter(d => d.jahr === selectedYear);

  if (selectedYear === 'all') {
    globe.pointOfView({ lat: -130.0, lng: 10.0, altitude: -4.2 }, 1000);
  } else if (filtered.length > 0) {
    const latitudes = filtered.map(d => parseFloat(d.fin_lat)).filter(Number.isFinite);
    const longitudes = filtered.map(d => parseFloat(d.fin_lon)).filter(Number.isFinite);

    if (latitudes.length === 0 || longitudes.length === 0) return;

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLon = Math.min(...longitudes);
    const maxLon = Math.max(...longitudes);

    const centerLat = (minLat + maxLat) / 2 - 2;
    const centerLon = (minLon + maxLon) / 2;

    const latSpan = maxLat - minLat;
    const lonSpan = maxLon - minLon;
    const maxSpan = Math.max(latSpan, lonSpan);

    let altitude = maxSpan / 20;
    altitude = Math.max(0.3, Math.min(altitude, 2.2));

    globe.pointOfView({ lat: centerLat, lng: centerLon, altitude }, 1000);
  }


    globe
      .labelsData(filtered)
      .labelLat(d => +d.fin_lat)
      .labelLng(d => +d.fin_lon)
      .labelText(d => selectedYear === 'all' ? '' : (d.stadt || ''))
      .labelDotOrientation(d => d.label_orientation || 'bottom')
        .labelColor(f => {
    if (f === selectedLabel) return '#F28A00'; // кликнутый остаётся оранжевым
    if (f === hoveredLabel) return '#F28A00';  // наведённый временно оранжевый
    return '#285d18';                          // дефолт зелёный
})
      .labelAltitude(0.004)
       .labelSize(() => {
   const altitude = globe.pointOfView().altitude || 1;
    return 0.44 * (altitude + 0.33);
})

  .labelDotRadius(() => {
    const altitude = globe.pointOfView().altitude || 1;
    return 0.3 / Math.log(altitude + 3.8);
  })
      .labelResolution(1);


// === Hover ===
globe.onLabelHover(d => {
  hoveredLabel = d || null;
  globe.labelColor(globe.labelColor()); // форсируем перерисовку
});

// === Click ===
globe.onLabelClick(d => {
  // если нажали на уже выбранный город → сбросить
  if (selectedLabel === d) {
    selectedLabel = null;
    yearBox.textContent = '-';
    countryBox.textContent = '-';
    zooBox.textContent = '-';
    reiseBox.textContent = '-';
  } else {
    selectedLabel = d || null;
    if (d) {
      yearBox.textContent = d.jahr || '-';
      countryBox.textContent = d.land || '-';
      zooBox.textContent = d.zoo_name || '-';
      reiseBox.textContent = d.reise || '-';

      // центрируем карту на выбранный город
      globe.pointOfView({ 
        lat: +d.fin_lat, 
        lng: +d.fin_lon, 
        altitude: 0.24 
      }, 1000);
    }
  }

  globe.labelColor(globe.labelColor()); // обновляем цвета
});

    const arcsData = filtered.map(d => ({
      startLat: d.start_lat,
      startLng: d.start_lon,
      endLat: +d.fin_lat,
      endLng: +d.fin_lon,
      color: ['rgba(100, 100, 0, 0.7)', 'rgba(0, 100, 0, 0.7)']
    }));

    globe.arcsData(arcsData)
      .arcAltitudeAutoScale(0.3)
      .arcColor('color')
      .arcDashLength(() => 0.5)
      .arcDashGap(() => 0.05)
      .arcDashInitialGap(() => Math.random())
      .arcDashAnimateTime(() => 5000)
      .arcStroke(0.07);

       updateMap(selectedYear);


}
