import { Chart, registerables } from 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/+esm';
Chart.register(...registerables);

document.addEventListener('DOMContentLoaded', async () => {
  const feedContainer = document.getElementById('feed-container');
  const journalistsFeedContainer = document.getElementById('journalists-feed-container');
  const leafletsFeedContainer = document.getElementById('leaflets-feed-container');
  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-img');
  const closeModal = document.querySelector('.close-modal');

  const tabMaps = document.getElementById('tab-maps');
  const tabJournalists = document.getElementById('tab-journalists');
  const tabLeaflets = document.getElementById('tab-leaflets');
  const tabIncitement = document.getElementById('tab-incitement');
  const tabQuotes = document.getElementById('tab-quotes');
  const tabIdfMovement = document.getElementById('tab-idf-movement');
  const tabExplore = document.getElementById('tab-explore');
  const feedTitle = document.getElementById('feed-title');

  const mapsStatsContainer = document.getElementById('maps-stats-container');
  const journalistsStatsContainer = document.getElementById('journalists-stats-container');
  const leafletsStatsContainer = document.getElementById('leaflets-stats-container');
  const incitementStatsContainer = document.getElementById('incitement-stats-container');
  const quotesStatsContainer = document.getElementById('quotes-stats-container');
  const quotesFeedContainer = document.getElementById('quotes-feed-container');
  const exploreStatsContainer = document.getElementById('explore-stats-container');
  const exploreFeedContainer = document.getElementById('explore-feed-container');
  const exploreResults = document.getElementById('explore-results');
  const exploreSearchInput = document.getElementById('explore-search');
  const idfMovementFeedContainer = document.getElementById('idf-movement-feed-container');
  const idfMovementStatsContainer = document.getElementById('idf-movement-stats-container');

  // Tab Switching Logic
  const allTabs = [tabMaps, tabJournalists, tabLeaflets, tabIncitement, tabQuotes, tabIdfMovement, tabExplore];
  const allFeeds = [feedContainer, journalistsFeedContainer, leafletsFeedContainer, document.getElementById('incitement-feed-container'), quotesFeedContainer, idfMovementFeedContainer, exploreFeedContainer];
  const allStats = [mapsStatsContainer, journalistsStatsContainer, leafletsStatsContainer, incitementStatsContainer, quotesStatsContainer, idfMovementStatsContainer, exploreStatsContainer];
  const tabConfig = {
    maps: { index: 0, title: 'Maps Timeline' },
    journalists: { index: 1, title: 'Martyred Journalists' },
    leaflets: { index: 2, title: 'IDF Leaflets' },
    incitement: { index: 3, title: 'Incitement' },
    quotes: { index: 4, title: 'Zionist Quotes' },
    idfMovement: { index: 5, title: 'IDF Ground Operations' },
    explore: { index: 6, title: 'Explore' }
  };

  function switchTab(tab) {
    const cfg = tabConfig[tab];
    allTabs.forEach((t, i) => i === cfg.index ? t.classList.add('active') : t.classList.remove('active'));
    allFeeds.forEach((f, i) => i === cfg.index ? f.classList.remove('hidden') : f.classList.add('hidden'));
    allStats.forEach((s, i) => i === cfg.index ? s.classList.remove('hidden') : s.classList.add('hidden'));
    feedTitle.textContent = cfg.title;
  }

  tabMaps.addEventListener('click', (e) => { e.preventDefault(); switchTab('maps'); });
  tabJournalists.addEventListener('click', (e) => { e.preventDefault(); switchTab('journalists'); });
  tabLeaflets.addEventListener('click', (e) => { e.preventDefault(); switchTab('leaflets'); });
  tabIncitement.addEventListener('click', (e) => { e.preventDefault(); switchTab('incitement'); });
  tabQuotes.addEventListener('click', (e) => { e.preventDefault(); switchTab('quotes'); });
  tabIdfMovement.addEventListener('click', (e) => { e.preventDefault(); switchTab('idfMovement'); });
  tabExplore.addEventListener('click', (e) => { e.preventDefault(); switchTab('explore'); exploreSearchInput.focus(); });

  let incitementData = null;
  let zoData = null;
  // Incitement Sub-tabs
  const incTabs = ['feed', 'people', 'orgs', 'targets'];
  
  function activateIncBtn(t) {
    document.querySelectorAll('.incitement-nav .brand-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`inc-btn-${t}`).classList.add('active');
  }

  incTabs.forEach(t => {
    document.getElementById(`inc-btn-${t}`).addEventListener('click', () => {
      activateIncBtn(t);
      renderIncitementUI(t);
    });
  });

  // Close Modal Events
  closeModal.onclick = () => modal.style.display = 'none';
  window.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
  };

  try {
    const [mapsRes, journalistsRes, weaponsRes, leafletsRes, locationRes, incitementRes, zoRes, idfMovementRes] = await Promise.all([
      fetch('/gaza-maps.jsonl'),
      fetch('/martyrs-ungrouped.json'),
      fetch('/martyrs-grouped-by-weapons.json'),
      fetch('/idf-leaflets.json'),
      fetch('/martyrs-grouped-by-location.json'),
      fetch('/incitement.json'),
      fetch('/zionism-quotes.json'),
      fetch('/idf-movement.jsonl')
    ]);
    if (!mapsRes.ok || !journalistsRes.ok || !weaponsRes.ok || !leafletsRes.ok || !locationRes.ok) throw new Error('Failed to fetch data');
    
    const mapsData = await mapsRes.json();
    const journalistsData = await journalistsRes.json();
    const weaponsData = await weaponsRes.json();
    const leafletsData = await leafletsRes.json();
    const locationData = await locationRes.json();
    incitementData = await incitementRes.json();
    if (zoRes.ok) zoData = await zoRes.json();
    
    let idfMovementData = [];
    if (idfMovementRes.ok) {
      const rawMovement = await idfMovementRes.json();
      idfMovementData = (Array.isArray(rawMovement) ? rawMovement : []).flatMap(page => page.data || []);
      // Sort newest first
      idfMovementData.sort((a, b) => new Date(b.date_entered_sql || 0) - new Date(a.date_entered_sql || 0));
    }
    
    // Sort maps data from newest to oldest based on date
    mapsData.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Render Maps Feed
    feedContainer.innerHTML = '';
    mapsData.forEach(item => {
      feedContainer.appendChild(createTweetCard(item));
    });

    // Handle Chart & Stats
    renderAnalytics(mapsData);
    
    // Process Journalists
    journalistsData.sort((a, b) => new Date(b.date_of_martyrdom_sql) - new Date(a.date_of_martyrdom_sql));
    journalistsFeedContainer.innerHTML = '';
    journalistsData.forEach(item => {
      journalistsFeedContainer.appendChild(createJournalistCard(item));
    });

    renderJournalistsAnalytics(journalistsData, weaponsData, locationData);

    // Process Leaflets (newest first by id)
    const sortedLeaflets = [...leafletsData].sort((a, b) => b.id - a.id);
    leafletsFeedContainer.innerHTML = '';
    sortedLeaflets.forEach(item => {
      leafletsFeedContainer.appendChild(createLeafletCard(item));
    });

    renderLeafletsAnalytics(leafletsData);

    // Initial render for Incitement
    if (incitementData) {
      renderIncitementUI('feed');
      renderIncitementAnalytics(incitementData);
    }
    
    // Quotes (zoData handled during render due to its structure logic, see original code setup)
    
    // IDF Movement
    idfMovementFeedContainer.innerHTML = '';
    idfMovementData.forEach(item => {
      idfMovementFeedContainer.appendChild(createIdfMovementCard(item));
    });
    if (idfMovementData.length > 0) {
      renderMovementAnalytics(idfMovementData);
    }

    // Explore: init stats and wire search
    document.getElementById('explore-total-maps').textContent = mapsData.length;
    document.getElementById('explore-total-journalists').textContent = journalistsData.length;
    document.getElementById('explore-total-leaflets').textContent = leafletsData.length;
    document.getElementById('explore-total-incitement').textContent = incitementData ? (incitementData.all_incitements || []).length : 0;
    document.getElementById('explore-total-quotes').textContent = zoData ? zoData.total_quotes : 0;
    document.getElementById('explore-total-movements').textContent = idfMovementData.length;

    // Show trending by default in Explore
    showExploreTrending(mapsData, journalistsData, leafletsData, incitementData, idfMovementData);

    let searchTimeout;
    exploreSearchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const q = exploreSearchInput.value.trim().toLowerCase();
        if (q.length === 0) {
          showExploreTrending(mapsData, journalistsData, leafletsData, incitementData, idfMovementData);
          document.getElementById('explore-search-count').textContent = '0';
        } else {
          performExploreSearch(q, mapsData, journalistsData, leafletsData, incitementData, idfMovementData);
        }
      }, 250);
    });

  } catch (error) {
    feedContainer.innerHTML = `<div class="loading-state">Error loading data: ${error.message}</div>`;
    journalistsFeedContainer.innerHTML = `<div class="loading-state">Error loading data: ${error.message}</div>`;
    leafletsFeedContainer.innerHTML = `<div class="loading-state">Error loading data: ${error.message}</div>`;
  }

  function createTweetCard(item) {
    const card = document.createElement('div');
    card.className = 'zo-quote-card';
    
    // Create badges
    let badgesHtml = '';
    if (item.displacement_blocks) {
      badgesHtml += '<span class="zo-cat-pill">Displacement Blocks: ' + item.displacement_blocks.split(',').length + '</span>';
    }
    if (item.labeled_safe_blocks) {
      badgesHtml += '<span class="zo-cat-pill" style="background:rgba(34,197,94,0.15);color:#22c55e;border-color:rgba(34,197,94,0.25);">Safe Blocks: ' + item.labeled_safe_blocks.split(',').length + '</span>';
    }

    // Prepare images
    const images = [];
    if (item.map_full) images.push(item.map_full);
    if (item.map_idf) images.push(item.map_idf);
    if (item.map_zoom) images.push(item.map_zoom);
    
    let gridClass = 'grid-' + images.length;
    if (images.length === 0) gridClass = '';
    
    let imagesHtml = '';
    if (images.length > 0) {
      imagesHtml = '<div class="image-grid ' + gridClass + '" style="margin-top:12px;">';
      imagesHtml += images.map(src => '<img src="' + src + '" alt="Map View" onclick="openModal(\'' + src + '\')" loading="lazy" style="border-radius:12px;border:1px solid rgba(255,255,255,0.1);" />').join('');
      imagesHtml += '</div>';
    }

    const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const formattedDate = new Date(item.date).toLocaleDateString(undefined, dateOptions);

    // Build meta line
    let metaLine = '@idf_update · Maps · ' + formattedDate;

    // Avatar
    const avatarHtml = '<div class="zo-avatar-ring"><img src="/idf-logo.jpeg" alt="IDF Logo" class="zo-avatar" style="background:var(--bg-primary);"></div>';

    let html = '<div class="zo-card-layout">';
    html += avatarHtml;
    html += '<div class="zo-card-body">';
    html += '<div class="zo-name-row"><span class="zo-name">IDF Update</span><span class="zo-verified" title="Verified source">&#10003;</span></div>';
    html += '<div class="zo-meta">' + metaLine + '</div>';
    
    html += '<div class="zo-quote" style="font-style:normal;font-size:0.95rem;">';
    html += 'Update reported regarding designated blocks.<br>';
    html += 'Displaced Area: <strong>' + item.area_sq_km_displacement + ' sq km</strong>.<br>';
    html += 'Safe Area: <strong>' + item.area_sq_km_labeled_safe + ' sq km</strong>.';
    html += '</div>';

    if (badgesHtml) html += '<div class="zo-cats">' + badgesHtml + '</div>';
    
    html += imagesHtml;
    
    html += '<div class="zo-source-line" style="margin-top:12px;">';
    html += '<a href="' + item.source + '" target="_blank" class="zo-source-link">gazamaps.com &#8599;</a>';
    html += '</div>';

    const views = Math.floor(Math.random() * 40000 + 2000);
    const shares = Math.floor(Math.random() * 500 + 10);
    html += '<div class="zo-actions">';
    html += '<span class="zo-action"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.25-.893 4.306-2.394 5.798l-5.662 5.312a.5.5 0 0 1-.796-.397v-3.846H9.756c-4.42 0-8.005-3.58-8.005-8z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg> Reply</span>';
    html += '<span class="zo-action zo-retweet"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M4.75 3.79l4.603 4.3-1.706 1.82L6 8.38v7.37c0 .97.784 1.75 1.75 1.75H13v2.5H7.75c-2.347 0-4.25-1.9-4.25-4.25V8.38L1.853 9.91.147 8.09l4.603-4.3zm11.5 16.42l4.603-4.3-1.706-1.82L17.5 15.62V8.25c0-.97-.784-1.75-1.75-1.75H11V4h4.75c2.347 0 4.25 1.9 4.25 4.25v7.37l1.647-1.53 1.706 1.82-4.603 4.3z" fill="currentColor"/></svg> ' + shares.toLocaleString() + '</span>';
    html += '<span class="zo-action zo-heart"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C10.085 6.01 8.628 5.44 7.407 5.5 3.96 5.68 2.24 8.69 3.2 12.17c1.378 5 8.97 9.83 8.97 9.83s7.59-4.83 8.97-9.83c.95-3.48-.77-6.49-4.443-6.67z" fill="#f91880"/></svg></span>';
    html += '<span class="zo-action zo-views"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M8.75 21V3h2v18h-2zM18.75 21V8.5h2V21h-2zM13.75 21v-9h2v9h-2zM3.75 21v-4h2v4h-2z" fill="currentColor"/></svg> ' + views.toLocaleString() + '</span>';
    html += '</div>';

    html += '</div></div>';
    card.innerHTML = html;
    
    return card;
  }

  window.openModal = function(src) {
    modal.style.display = 'block';
    modalImg.src = src;
  };

  function renderAnalytics(data) {
    const dates = [];
    const displacementAreas = [];
    
    // For chart, we want chronological order (oldest to newest)
    const chartData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let maxDisplacement = 0;
    
    chartData.forEach(item => {
      const area = parseFloat(item.area_sq_km_displacement) || 0;
      dates.push(item.date);
      displacementAreas.push(area);
      if (area > maxDisplacement) maxDisplacement = area;
    });
    
    // Update summary texts
    document.getElementById('total-displacement').textContent = maxDisplacement.toFixed(1);
    document.getElementById('total-events').textContent = data.length;

    const ctx = document.getElementById('displacementChart').getContext('2d');
    
    Chart.defaults.color = '#71767b';
    Chart.defaults.font.family = 'Inter';

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Displaced Area (sq km)',
          data: displacementAreas,
          borderColor: '#f4212e',
          backgroundColor: 'rgba(244, 33, 46, 0.1)',
          borderWidth: 2,
          pointRadius: 1,
          pointHoverRadius: 4,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#e7e9ea',
            bodyColor: '#e7e9ea',
            borderColor: '#2f3336',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxTicksLimit: 6 }
          },
          y: {
            grid: { color: '#2f3336' },
            beginAtZero: true
          }
        }
      }
    });
  }

  function createJournalistCard(item) {
    const card = document.createElement('div');
    card.className = 'journalist-card';
    
    let avatarSrc = item.image_working || 'https://via.placeholder.com/60x60/16181c/e7e9ea?text=NA';

    card.innerHTML = `
      <img src="${avatarSrc}" alt="Avatar" class="journalist-avatar" onerror="this.src='https://via.placeholder.com/60x60/16181c/e7e9ea?text=NA'" onclick="openModal('${avatarSrc}')" style="cursor:zoom-in;">
      <div class="journalist-content">
        <div class="journalist-header">
          <span class="journalist-name">${item.name_english || 'Unknown'}</span>
          <span class="journalist-name-ar">${item.name_arabic || ''}</span>
        </div>
        <div class="journalist-meta">
          Martyred: ${item.date_of_martyrdom_display} • ${item.location}
        </div>
        <div class="journalist-details">
          <span class="badge danger">Method: ${item.method_of_martyrdom}</span>
          ${item.murdered_at_home ? '<span class="badge danger">Targeted At Home</span>' : ''}
          ${item.number_family_members > 0 ? `<span class="badge">Family Martyred: ${item.number_family_members}</span>` : ''}
        </div>
        ${item.url ? `<div style="margin-top: 10px;"><a href="${item.url}" target="_blank" class="tweet-source" onclick="event.stopPropagation()">View Profile</a></div>` : ''}
      </div>
    `;
    return card;
  }

  function renderJournalistsAnalytics(journalistsData, weaponsData, locationData) {
    document.getElementById('total-journalists').textContent = journalistsData.length;
    
    // Killed at home and family members
    const killedAtHome = journalistsData.filter(j => j.murdered_at_home).length;
    const familyMembers = journalistsData.reduce((sum, j) => sum + (j.number_family_members || 0), 0);
    document.getElementById('killed-at-home-count').textContent = killedAtHome;
    document.getElementById('family-members-killed').textContent = familyMembers;

    // Find most affected location from locationData
    const locEntries = Object.entries(locationData)
      .map(([loc, arr]) => ({ loc, count: arr.length }))
      .sort((a, b) => b.count - a.count);
    document.getElementById('most-affected-location').textContent = locEntries.length > 0 ? locEntries[0].loc : '--';

    // Populate location breakdown table
    const tbody = document.querySelector('#location-table tbody');
    tbody.innerHTML = '';
    const total = journalistsData.length;
    locEntries.forEach(({ loc, count }) => {
      const pct = ((count / total) * 100).toFixed(1);
      const row = document.createElement('tr');
      row.innerHTML = `<td>${loc}</td><td>${count}</td><td>${pct}%</td>`;
      tbody.appendChild(row);
    });

    // Chart logic for weapons
    const weaponLabels = Object.keys(weaponsData).filter(k => weaponsData[k].length > 0);
    const weaponCounts = weaponLabels.map(w => weaponsData[w].length);

    // Sort to show top 5
    const combined = weaponLabels.map((l, i) => ({ label: l, count: weaponCounts[i] }));
    combined.sort((a, b) => b.count - a.count);
    
    const topLabels = combined.slice(0, 5).map(c => c.label);
    const topCounts = combined.slice(0, 5).map(c => c.count);

    const ctx = document.getElementById('journalistsChart').getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: topLabels,
        datasets: [{
          data: topCounts,
          backgroundColor: [
            'rgba(244, 33, 46, 0.8)',
            'rgba(29, 155, 240, 0.8)',
            'rgba(0, 186, 124, 0.8)',
            'rgba(255, 212, 0, 0.8)',
            'rgba(249, 24, 128, 0.8)'
          ],
          borderColor: '#16181c',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            position: 'right',
            labels: { color: '#e7e9ea', font: { size: 10 } }
          }
        }
      }
    });
  }

  function createLeafletCard(item) {
    const card = document.createElement('div');
    card.className = 'leaflet-card';

    const imgSrc = item.image || '';
    const flagsHtml = (item.flags || []).map(f => `<span class="badge flag">${f}</span>`).join('');

    card.innerHTML = `
      ${imgSrc ? `<img src="${imgSrc}" alt="${item.title}" class="leaflet-thumb" onclick="openModal('${imgSrc}')" loading="lazy">` : ''}
      <div class="leaflet-content">
        <div class="leaflet-title">${item.title || 'Untitled Leaflet'}</div>
        <div class="leaflet-meta">First seen: ${item.date_display || 'Unknown'}</div>
        <div class="leaflet-flags">${flagsHtml}</div>
        ${item.url ? `<div style="margin-top: 10px;"><a href="${item.url}" target="_blank" class="tweet-source" onclick="event.stopPropagation()">View on idfleaflets.com</a></div>` : ''}
      </div>
    `;
    return card;
  }

  function renderLeafletsAnalytics(leafletsData) {
    document.getElementById('total-leaflets').textContent = leafletsData.length;

    // Date range
    const dates = leafletsData
      .map(l => l.date_display)
      .filter(Boolean)
      .map(d => new Date(d))
      .filter(d => !isNaN(d));
    if (dates.length > 0) {
      dates.sort((a, b) => a - b);
      const fmt = d => d.toLocaleDateString(undefined, { year: '2-digit', month: 'short' });
      document.getElementById('leaflet-date-range').textContent = `${fmt(dates[0])} - ${fmt(dates[dates.length - 1])}`;
    }

    // Count flags
    const flagCounts = {};
    leafletsData.forEach(l => {
      (l.flags || []).forEach(f => {
        flagCounts[f] = (flagCounts[f] || 0) + 1;
      });
    });
    const sorted = Object.entries(flagCounts).sort((a, b) => b[1] - a[1]);
    const topLabels = sorted.slice(0, 6).map(s => s[0]);
    const topCounts = sorted.slice(0, 6).map(s => s[1]);

    const ctx = document.getElementById('leafletsChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: topLabels,
        datasets: [{
          label: 'Count',
          data: topCounts,
          backgroundColor: [
            'rgba(255, 212, 0, 0.8)',
            'rgba(244, 33, 46, 0.8)',
            'rgba(29, 155, 240, 0.8)',
            'rgba(0, 186, 124, 0.8)',
            'rgba(249, 24, 128, 0.8)',
            'rgba(120, 86, 255, 0.8)'
          ],
          borderColor: '#16181c',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { color: '#2f3336' }, ticks: { color: '#71767b' } },
          y: { grid: { display: false }, ticks: { color: '#e7e9ea', font: { size: 10 } } }
        }
      }
    });
  }

  /* =================================================================================
     INCITEMENT TAB LOGIC
  ================================================================================= */
  function renderIncitementUI(subTab, filterObj = null) {
    if (!incitementData) return;
    const container = document.getElementById('incitement-content-area');
    container.innerHTML = '';

    if (subTab === 'feed') {
      let quotes = incitementData.all_incitements || [];
      
      if (filterObj) {
        if (filterObj.type === 'inciter') {
          quotes = quotes.filter(q => q.inciter_name === filterObj.value);
        } else if (filterObj.type === 'target') {
          quotes = quotes.filter(q => (q.targets || []).includes(filterObj.value));
        }
        
        const filterHeader = document.createElement('div');
        filterHeader.className = 'explore-section-label';
        filterHeader.style.display = 'flex';
        filterHeader.style.justifyContent = 'space-between';
        filterHeader.style.alignItems = 'center';
        filterHeader.style.marginBottom = '16px';
        filterHeader.innerHTML = `
          <span>Showing quotes ${filterObj.type === 'inciter' ? 'by' : 'targeting'}: <span style="color:var(--text-primary);">${filterObj.value}</span></span>
          <button class="brand-btn" id="clear-inc-filter" style="font-size:0.8rem; padding: 4px 10px; border: 1px solid var(--border-color);">Clear Filter</button>
        `;
        container.appendChild(filterHeader);
        
        filterHeader.querySelector('#clear-inc-filter').addEventListener('click', () => {
          renderIncitementUI('feed');
        });
      }

      if (!quotes.length) {
        container.innerHTML += '<div class="empty-state" style="padding:40px;text-align:center;color:var(--text-secondary)">No incitement quotes found for this filter.</div>';
        return;
      }
      
      quotes.forEach(quote => {
        const card = document.createElement('div');
        card.className = 'zo-quote-card';
        const avatarSrc = quote.inciter_image || '';
        const role = quote.inciter_role || 'Inciter';
        const date = quote.date || 'Unknown Date';
        const handle = '@' + quote.inciter_name.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
        const targetsHtml = (quote.targets || []).map(t => '<span class="zo-cat-pill">' + t + '</span>').join('');

        // Build meta line
        let metaParts = [handle];
        if (role) metaParts.push(role);
        if (date) metaParts.push(date);
        const metaLine = metaParts.join(' · ');

        // Avatar
        const avatarHtml = avatarSrc
          ? '<div class="zo-avatar-ring"><img src="' + avatarSrc + '" alt="" class="zo-avatar" onerror="this.parentElement.style.display=\'none\'"></div>'
          : '<div class="zo-avatar-ring"><div class="zo-avatar zo-avatar-placeholder"></div></div>';

        // Screenshot / source
        let mediaHtml = '';
        if (quote.screenshot_url) {
          mediaHtml = '<div class="tweet-media-container">'
            + '<img src="' + quote.screenshot_url + '" class="tweet-media-img" alt="Incitement Screenshot" loading="lazy" onclick="openModal(\'' + quote.screenshot_url + '\')">'
            + '</div>';
        }

        let sourceLine = '';
        if (quote.source_url) {
          sourceLine = '<div class="zo-source-line">Source: <a href="' + quote.source_url + '" target="_blank" class="zo-source-link">stopmurderingjournalists.com &#8599;</a></div>';
        }

        const views = Math.floor(Math.random() * 40000 + 2000);
        const shares = Math.floor(Math.random() * 500 + 10);

        let html = '<div class="zo-card-layout">';
        html += avatarHtml;
        html += '<div class="zo-card-body">';
        html += '<div class="zo-name-row"><span class="zo-name">' + quote.inciter_name + '</span><span class="zo-verified" title="Verified inciter">&#10003;</span></div>';
        html += '<div class="zo-meta">' + metaLine + '</div>';
        html += '<div class="zo-quote">\u201c' + (quote.quote || '') + '\u201d</div>';
        if (targetsHtml) html += '<div class="zo-cats">' + targetsHtml + '</div>';
        html += mediaHtml;
        html += sourceLine;
        // Actions
        html += '<div class="zo-actions">';
        html += '<span class="zo-action"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.25-.893 4.306-2.394 5.798l-5.662 5.312a.5.5 0 0 1-.796-.397v-3.846H9.756c-4.42 0-8.005-3.58-8.005-8z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg> Reply</span>';
        html += '<span class="zo-action zo-retweet"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M4.75 3.79l4.603 4.3-1.706 1.82L6 8.38v7.37c0 .97.784 1.75 1.75 1.75H13v2.5H7.75c-2.347 0-4.25-1.9-4.25-4.25V8.38L1.853 9.91.147 8.09l4.603-4.3zm11.5 16.42l4.603-4.3-1.706-1.82L17.5 15.62V8.25c0-.97-.784-1.75-1.75-1.75H11V4h4.75c2.347 0 4.25 1.9 4.25 4.25v7.37l1.647-1.53 1.706 1.82-4.603 4.3z" fill="currentColor"/></svg> ' + shares.toLocaleString() + '</span>';
        html += '<span class="zo-action zo-heart"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C10.085 6.01 8.628 5.44 7.407 5.5 3.96 5.68 2.24 8.69 3.2 12.17c1.378 5 8.97 9.83 8.97 9.83s7.59-4.83 8.97-9.83c.95-3.48-.77-6.49-4.443-6.67z" fill="#f91880"/></svg></span>';
        html += '<span class="zo-action zo-views"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M8.75 21V3h2v18h-2zM18.75 21V8.5h2V21h-2zM13.75 21v-9h2v9h-2zM3.75 21v-4h2v4h-2z" fill="currentColor"/></svg> ' + views.toLocaleString() + '</span>';
        html += '</div>';
        html += '</div></div>';
        card.innerHTML = html;
        container.appendChild(card);
      });
    } else if (subTab === 'people' || subTab === 'orgs') {
      const list = subTab === 'people' ? incitementData.people : incitementData.organizations;
      const grid = document.createElement('div');
      grid.className = 'inciter-grid';
      
      list.forEach(item => {
        const card = document.createElement('div');
        card.className = 'inciter-card interactable';
        card.style.cursor = 'pointer';
        const img = item.image || 'https://via.placeholder.com/80/16181c/e7e9ea?text=NA';
        const count = item.incitement_count !== undefined ? item.incitement_count : (item.incitements || []).length;
        
        card.innerHTML = `
          <img src="${img}" alt="${item.name}" class="inciter-img" onerror="this.src='https://via.placeholder.com/80/16181c/e7e9ea?text=NA'">
          <h4>${item.name}</h4>
          <p class="inciter-role">${item.role || item.type || ''}</p>
          <span class="inciter-count">${count} Quotes</span>
        `;
        
        card.addEventListener('click', () => {
          activateIncBtn('feed');
          renderIncitementUI('feed', { type: 'inciter', value: item.name });
        });

        grid.appendChild(card);
      });
      container.appendChild(grid);
    } else if (subTab === 'targets') {
      const grid = document.createElement('div');
      grid.className = 'target-grid';
      
      incitementData.targets.forEach(t => {
        const card = document.createElement('div');
        card.className = 'target-card interactable';
        card.style.cursor = 'pointer';
        const count = t.incitements ? t.incitements.length : 0;
        card.innerHTML = `
          <h4>${t.name}</h4>
          ${t.killed ? `<span class="target-killed-badge animate-pulse">Killed ${t.killed_date || ''}</span>` : ''}
          <span class="target-count">${count} Incitements</span>
        `;
        
        card.addEventListener('click', () => {
          activateIncBtn('feed');
          renderIncitementUI('feed', { type: 'target', value: t.name });
        });

        grid.appendChild(card);
      });
      container.appendChild(grid);
    }
  }

  function renderIncitementAnalytics(data) {
    document.getElementById('inc-total-quotes').textContent = (data.all_incitements || []).length;
    document.getElementById('inc-total-people').textContent = (data.people || []).length;
    document.getElementById('inc-total-orgs').textContent = (data.organizations || []).length;
    document.getElementById('inc-total-targets').textContent = (data.targets || []).length;
  }

  function createExploreQuoteCard(q, type) {
    const card = document.createElement('div');
    card.className = 'zo-quote-card';
    const name = type === 'zo' ? (q.person_name || 'Unknown') : q.inciter_name;
    const slug = type === 'zo' ? (q.person_slug || '') : q.inciter_name.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    const role = type === 'zo' ? (q.person_role || '') : (q.inciter_role || '');
    const img = type === 'zo' ? (q.person_image || '') : (q.inciter_image || '');
    const date = q.date || '';
    const quote = q.quote || '';
    const handle = '@' + slug.replace(/-/g, '_');
    let metaParts = [handle];
    if (role) metaParts.push(role);
    if (date) metaParts.push(date);
    const avatarHtml = img
      ? '<div class="zo-avatar-ring"><img src="' + img + '" alt="" class="zo-avatar" onerror="this.parentElement.style.display=\'none\'"></div>'
      : '<div class="zo-avatar-ring"><div class="zo-avatar zo-avatar-placeholder"></div></div>';
    // pills
    let pills = '';
    if (type === 'zo') {
      pills = (q.categories || []).map(c => '<span class="zo-cat-pill">' + c + '</span>').join('');
    } else {
      pills = (q.targets || []).map(t => '<span class="zo-cat-pill">' + t + '</span>').join('');
    }
    const views = Math.floor(Math.random() * 40000 + 2000);
    const shares = Math.floor(Math.random() * 500 + 10);
    let html = '<div class="zo-card-layout">' + avatarHtml + '<div class="zo-card-body">';
    html += '<div class="zo-name-row"><span class="zo-name">' + name + '</span><span class="zo-verified">&#10003;</span></div>';
    html += '<div class="zo-meta">' + metaParts.join(' · ') + '</div>';
    html += '<div class="zo-quote">\u201c' + quote + '\u201d</div>';
    if (pills) html += '<div class="zo-cats">' + pills + '</div>';
    html += '<div class="zo-actions">';
    html += '<span class="zo-action"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.25-.893 4.306-2.394 5.798l-5.662 5.312a.5.5 0 0 1-.796-.397v-3.846H9.756c-4.42 0-8.005-3.58-8.005-8z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg> Reply</span>';
    html += '<span class="zo-action zo-retweet"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M4.75 3.79l4.603 4.3-1.706 1.82L6 8.38v7.37c0 .97.784 1.75 1.75 1.75H13v2.5H7.75c-2.347 0-4.25-1.9-4.25-4.25V8.38L1.853 9.91.147 8.09l4.603-4.3zm11.5 16.42l4.603-4.3-1.706-1.82L17.5 15.62V8.25c0-.97-.784-1.75-1.75-1.75H11V4h4.75c2.347 0 4.25 1.9 4.25 4.25v7.37l1.647-1.53 1.706 1.82-4.603 4.3z" fill="currentColor"/></svg> ' + shares.toLocaleString() + '</span>';
    html += '<span class="zo-action zo-heart"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C10.085 6.01 8.628 5.44 7.407 5.5 3.96 5.68 2.24 8.69 3.2 12.17c1.378 5 8.97 9.83 8.97 9.83s7.59-4.83 8.97-9.83c.95-3.48-.77-6.49-4.443-6.67z" fill="#f91880"/></svg></span>';
    html += '<span class="zo-action zo-views"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M8.75 21V3h2v18h-2zM18.75 21V8.5h2V21h-2zM13.75 21v-9h2v9h-2zM3.75 21v-4h2v4h-2z" fill="currentColor"/></svg> ' + views.toLocaleString() + '</span>';
    html += '</div></div></div>';
    card.innerHTML = html;
    return card;
  }

  function showExploreTrending(mapsData, journalistsData, leafletsData, incitementData, idfMovementData) {
    exploreResults.innerHTML = '';

    // Quick-filter chips
    let chipHtml = '<div class="explore-chips">';
    chipHtml += '<span class="explore-chip active" data-filter="all">All</span>';
    chipHtml += '<span class="explore-chip" data-filter="quotes">Zionist Quotes</span>';
    chipHtml += '<span class="explore-chip" data-filter="incitement">Incitement</span>';
    chipHtml += '<span class="explore-chip" data-filter="journalists">Journalists</span>';
    chipHtml += '<span class="explore-chip" data-filter="leaflets">Leaflets</span>';
    chipHtml += '<span class="explore-chip" data-filter="maps">Maps</span>';
    chipHtml += '<span class="explore-chip" data-filter="movements">Movements</span>';
    chipHtml += '</div>';
    exploreResults.innerHTML = chipHtml;

    const contentDiv = document.createElement('div');
    contentDiv.id = 'explore-trending-content';
    exploreResults.appendChild(contentDiv);

    function renderTrending(filter) {
      contentDiv.innerHTML = '';

      // Zionism Quotes
      if (filter === 'all' || filter === 'quotes') {
        const recentZo = zoData ? (zoData.all_quotes || []).slice(0, filter === 'quotes' ? 20 : 3) : [];
        if (recentZo.length > 0) {
          contentDiv.innerHTML += '<div class="explore-section-label">Zionist Quotes (' + (zoData ? zoData.total_quotes : 0) + ' total)</div>';
          recentZo.forEach(q => contentDiv.appendChild(createExploreQuoteCard(q, 'zo')));
        }
      }

      // Incitement
      if (filter === 'all' || filter === 'incitement') {
        const recentInc = incitementData ? (incitementData.all_incitements || []).slice(0, filter === 'incitement' ? 20 : 3) : [];
        if (recentInc.length > 0) {
          contentDiv.innerHTML += '<div class="explore-section-label">Incitement (' + (incitementData ? (incitementData.all_incitements || []).length : 0) + ' total)</div>';
          recentInc.forEach(q => contentDiv.appendChild(createExploreQuoteCard(q, 'inc')));
        }
      }

      // Journalists
      if (filter === 'all' || filter === 'journalists') {
        const recentJ = journalistsData.slice(0, filter === 'journalists' ? 40 : 3);
        if (recentJ.length > 0) {
          contentDiv.innerHTML += '<div class="explore-section-label">Journalists (' + journalistsData.length + ' total)</div>';
          recentJ.forEach(j => contentDiv.appendChild(createJournalistCard(j)));
        }
      }

      // Leaflets
      if (filter === 'all' || filter === 'leaflets') {
        const recentL = [...leafletsData].sort((a, b) => b.id - a.id).slice(0, filter === 'leaflets' ? 40 : 3);
        if (recentL.length > 0) {
          contentDiv.innerHTML += '<div class="explore-section-label">Leaflets (' + leafletsData.length + ' total)</div>';
          recentL.forEach(l => contentDiv.appendChild(createLeafletCard(l)));
        }
      }

      // Maps
      if (filter === 'all' || filter === 'maps') {
        const recentM = mapsData.slice(0, filter === 'maps' ? 40 : 3);
        if (recentM.length > 0) {
          contentDiv.innerHTML += '<div class="explore-section-label">Maps (' + mapsData.length + ' total)</div>';
          recentM.forEach(m => contentDiv.appendChild(createTweetCard(m)));
        }
      }

      // IDF Movement
      if (filter === 'all' || filter === 'movements') {
        const recentMov = idfMovementData.slice(0, filter === 'movements' ? 40 : 3);
        if (recentMov.length > 0) {
          contentDiv.innerHTML += '<div class="explore-section-label">IDF Movements (' + idfMovementData.length + ' total)</div>';
          recentMov.forEach(m => contentDiv.appendChild(createIdfMovementCard(m)));
        }
      }
    }

    renderTrending('all');

    // Wire up chips
    exploreResults.querySelectorAll('.explore-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        exploreResults.querySelectorAll('.explore-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        renderTrending(chip.dataset.filter);
      });
    });
  }

  function performExploreSearch(query, mapsData, journalistsData, leafletsData, incitementData, idfMovementData) {
    exploreResults.innerHTML = '';
    let totalResults = 0;

    // Search zionism quotes
    const zoQuotes = zoData ? (zoData.all_quotes || []) : [];
    const matchedZo = zoQuotes.filter(q => {
      const haystack = [
        q.person_name, q.person_role, q.quote, ...(q.categories || [])
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(query);
    });

    // Search incitements
    const validIncitements = incitementData ? (incitementData.all_incitements || []) : [];
    const matchedIncitements = validIncitements.filter(i => {
       const haystack = [
         i.inciter_name, i.inciter_role, i.quote, ...(i.targets || [])
       ].filter(Boolean).join(' ').toLowerCase();
       return haystack.includes(query);
    });

    // Search journalists
    const matchedJournalists = journalistsData.filter(j => {
      const haystack = [
        j.name_english, j.name_arabic, j.location,
        j.method_of_martyrdom, j.date_of_martyrdom_display
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(query);
    });

    // Search leaflets
    const matchedLeaflets = leafletsData.filter(l => {
      const haystack = [
        l.title, l.date_display, ...(l.flags || [])
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    });

    // Search maps
    const matchedMaps = mapsData.filter(m => {
      const haystack = [
        m.date, m.displacement_blocks, m.labeled_safe_blocks,
        m.area_sq_km_displacement
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(query);
    });

    // Search IDF movements
    const matchedMovements = (idfMovementData || []).filter(m => {
      const unitName = m.unit && m.unit.name ? m.unit.name : '';
      const divName = m.unit && m.unit.division && m.unit.division.name ? m.unit.division.name : '';
      const areaName = m.area && m.area.name ? m.area.name : '';
      const battalions = m.unit && m.unit.unit_includes ? m.unit.unit_includes.map(b => b.name).join(' ') : '';
      const haystack = [
        m.date_entered_display, m.date_exited_display, unitName, divName, areaName, battalions
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(query);
    });

    if (matchedZo.length > 0) {
      exploreResults.innerHTML += '<div class="explore-section-label">Zionist Quotes (' + matchedZo.length + ')</div>';
      matchedZo.slice(0, 20).forEach(q => exploreResults.appendChild(createExploreQuoteCard(q, 'zo')));
      totalResults += matchedZo.length;
    }
    if (matchedIncitements.length > 0) {
      exploreResults.innerHTML += '<div class="explore-section-label">Incitement Quotes (' + matchedIncitements.length + ')</div>';
      matchedIncitements.slice(0, 20).forEach(q => exploreResults.appendChild(createExploreQuoteCard(q, 'inc')));
      totalResults += matchedIncitements.length;
    }
    if (matchedJournalists.length > 0) {
      exploreResults.innerHTML += '<div class="explore-section-label">Journalists (' + matchedJournalists.length + ')</div>';
      matchedJournalists.slice(0, 20).forEach(j => exploreResults.appendChild(createJournalistCard(j)));
      totalResults += matchedJournalists.length;
    }
    if (matchedLeaflets.length > 0) {
      exploreResults.innerHTML += '<div class="explore-section-label">Leaflets (' + matchedLeaflets.length + ')</div>';
      matchedLeaflets.slice(0, 20).forEach(l => exploreResults.appendChild(createLeafletCard(l)));
      totalResults += matchedLeaflets.length;
    }
    if (matchedMaps.length > 0) {
      exploreResults.innerHTML += '<div class="explore-section-label">Maps (' + matchedMaps.length + ')</div>';
      matchedMaps.slice(0, 20).forEach(m => exploreResults.appendChild(createTweetCard(m)));
      totalResults += matchedMaps.length;
    }
    if (matchedMovements.length > 0) {
      exploreResults.innerHTML += '<div class="explore-section-label">IDF Movements (' + matchedMovements.length + ')</div>';
      matchedMovements.slice(0, 20).forEach(m => exploreResults.appendChild(createIdfMovementCard(m)));
      totalResults += matchedMovements.length;
    }

    if (totalResults === 0) {
      exploreResults.innerHTML = '<div class="explore-empty">No results found. Try a different search term.</div>';
    }

    document.getElementById('explore-search-count').textContent = totalResults;
  }

  // =========== ZIONISM OBSERVER QUOTES TAB ===========
  const zoTabs = ['feed', 'people', 'categories'];

  function activateZoBtn(t) {
    document.querySelectorAll('#quotes-feed-container .incitement-nav .brand-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('zo-btn-' + t).classList.add('active');
  }

  zoTabs.forEach(t => {
    document.getElementById('zo-btn-' + t).addEventListener('click', () => {
      activateZoBtn(t);
      renderZoUI(t);
    });
  });

  function renderZoUI(view, filterPerson, filterCategory) {
    if (!zoData) return;
    const area = document.getElementById('quotes-content-area');
    area.innerHTML = '';

    if (view === 'feed') {
      let quotes = zoData.all_quotes || [];
      let headerHtml = '';
      if (filterPerson) {
        quotes = quotes.filter(q => q.person_slug === filterPerson);
        const personName = quotes.length > 0 ? quotes[0].person_name : filterPerson;
        headerHtml = '<div class="incitement-filter-header">Showing quotes by <strong>' + personName + '</strong> <button class="brand-btn zo-clear-btn" style="margin-left:12px; padding:4px 12px; font-size:0.75rem;">Clear Filter</button></div>';
      }
      if (filterCategory) {
        quotes = quotes.filter(q => (q.categories || []).includes(filterCategory));
        headerHtml = '<div class="incitement-filter-header">Showing <strong>' + filterCategory + '</strong> quotes <button class="brand-btn zo-clear-btn" style="margin-left:12px; padding:4px 12px; font-size:0.75rem;">Clear Filter</button></div>';
      }
      if (headerHtml) {
        area.innerHTML = headerHtml;
        const clearBtn = area.querySelector('.zo-clear-btn');
        if (clearBtn) clearBtn.addEventListener('click', () => { activateZoBtn('feed'); renderZoUI('feed'); });
      }
      quotes.forEach(q => area.appendChild(createZoQuoteCard(q)));
      if (quotes.length === 0) area.innerHTML += '<div class="explore-empty">No quotes found.</div>';
    } else if (view === 'people') {
      renderZoPeopleGrid(area);
    } else if (view === 'categories') {
      renderZoCategoriesGrid(area);
    }
  }

  function createZoQuoteCard(q) {
    const card = document.createElement('div');
    card.className = 'zo-quote-card';
    const cats = (q.categories || []).map(c => '<span class="zo-cat-pill">' + c + '</span>').join('');
    const views = Math.floor(Math.random() * 40000 + 2000);
    const shares = Math.floor(Math.random() * 500 + 10);
    const handle = '@' + (q.person_slug || '').replace(/-/g, '_');
    const role = q.person_role || '';
    const date = q.date || '';

    // Build meta line: @handle · Role · Date
    let metaParts = [handle];
    if (role) metaParts.push(role);
    if (date) metaParts.push(date);
    const metaLine = metaParts.join(' · ');

    // Avatar with red ring
    const avatarHtml = q.person_image
      ? '<div class="zo-avatar-ring"><img src="' + q.person_image + '" alt="" class="zo-avatar" onerror="this.parentElement.style.display=\'none\'"></div>'
      : '<div class="zo-avatar-ring"><div class="zo-avatar zo-avatar-placeholder"></div></div>';

    // Source line
    let sourceLine = '';
    if (q.source_url || q.source_name) {
      sourceLine += '<div class="zo-source-line">';
      if (q.source_url) {
        sourceLine += 'Video from <a href="' + q.source_url + '" target="_blank" class="zo-source-link">' + (q.source_name || 'Source') + ' &#8599;</a>';
      } else if (q.source_name) {
        sourceLine += 'Source: ' + q.source_name;
      }
      if (q.permalink) {
        sourceLine += '<a href="' + q.permalink + '" target="_blank" class="zo-permalink">Permalink &#8599;</a>';
      }
      sourceLine += '</div>';
    }

    let html = '<div class="zo-card-layout">';
    html += avatarHtml;
    html += '<div class="zo-card-body">';
    // Name + badge
    html += '<div class="zo-name-row"><span class="zo-name">' + (q.person_name || 'Unknown') + '</span><span class="zo-verified" title="Verified quote">&#10003;</span></div>';
    // Meta line
    html += '<div class="zo-meta">' + metaLine + '</div>';
    // Quote
    html += '<div class="zo-quote">\u201c' + q.quote + '\u201d</div>';
    // Categories
    if (cats) html += '<div class="zo-cats">' + cats + '</div>';
    // Source
    html += sourceLine;
    // Actions
    html += '<div class="zo-actions">';
    html += '<span class="zo-action"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.25-.893 4.306-2.394 5.798l-5.662 5.312a.5.5 0 0 1-.796-.397v-3.846H9.756c-4.42 0-8.005-3.58-8.005-8z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg> Reply</span>';
    html += '<span class="zo-action zo-retweet"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M4.75 3.79l4.603 4.3-1.706 1.82L6 8.38v7.37c0 .97.784 1.75 1.75 1.75H13v2.5H7.75c-2.347 0-4.25-1.9-4.25-4.25V8.38L1.853 9.91.147 8.09l4.603-4.3zm11.5 16.42l4.603-4.3-1.706-1.82L17.5 15.62V8.25c0-.97-.784-1.75-1.75-1.75H11V4h4.75c2.347 0 4.25 1.9 4.25 4.25v7.37l1.647-1.53 1.706 1.82-4.603 4.3z" fill="currentColor"/></svg> ' + shares.toLocaleString() + '</span>';
    html += '<span class="zo-action zo-heart"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C10.085 6.01 8.628 5.44 7.407 5.5 3.96 5.68 2.24 8.69 3.2 12.17c1.378 5 8.97 9.83 8.97 9.83s7.59-4.83 8.97-9.83c.95-3.48-.77-6.49-4.443-6.67z" fill="#f91880"/></svg></span>';
    html += '<span class="zo-action zo-views"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M8.75 21V3h2v18h-2zM18.75 21V8.5h2V21h-2zM13.75 21v-9h2v9h-2zM3.75 21v-4h2v4h-2z" fill="currentColor"/></svg> ' + views.toLocaleString() + '</span>';
    html += '</div>';
    html += '</div></div>';
    card.innerHTML = html;
    return card;
  }

  function renderZoPeopleGrid(area) {
    if (!zoData) return;
    const people = (zoData.people || []).slice().sort((a, b) => (b.quote_count || 0) - (a.quote_count || 0));
    let html = '<div class="inciter-grid">';
    people.forEach(p => {
      const imgHtml = p.image ? '<img src="' + p.image + '" alt="" style="width:48px;height:48px;border-radius:50%;object-fit:cover;" onerror="this.style.display=\'none\'">' : '<div style="width:48px;height:48px;border-radius:50%;background:#2a2a2a;"></div>';
      html += '<div class="inciter-card" data-slug="' + p.slug + '" style="cursor:pointer;">';
      html += imgHtml;
      html += '<div class="inciter-name">' + (p.name || p.slug) + '</div>';
      html += '<div style="font-size:0.7rem;color:#71767b;">' + (p.role || '') + '</div>';
      html += '<span class="inciter-count">' + (p.quote_count || 0) + '</span>';
      html += '</div>';
    });
    html += '</div>';
    area.innerHTML = html;
    area.querySelectorAll('.inciter-card').forEach(c => {
      c.addEventListener('click', () => {
        activateZoBtn('feed');
        renderZoUI('feed', c.dataset.slug);
      });
    });
  }

  function renderZoCategoriesGrid(area) {
    if (!zoData) return;
    const cats = zoData.categories || {};
    let html = '<div class="inciter-grid">';
    Object.entries(cats).sort((a, b) => b[1] - a[1]).forEach(function(entry) {
      const name = entry[0];
      const count = entry[1];
      html += '<div class="inciter-card" data-cat="' + name + '" style="cursor:pointer;">';
      html += '<div class="inciter-name">' + name + '</div>';
      html += '<span class="inciter-count">' + count + '</span>';
      html += '</div>';
    });
    html += '</div>';
    area.innerHTML = html;
    area.querySelectorAll('.inciter-card').forEach(c => {
      c.addEventListener('click', () => {
        activateZoBtn('feed');
        renderZoUI('feed', null, c.dataset.cat);
      });
    });
  }

  function renderZoAnalytics() {
    if (!zoData) return;
    document.getElementById('zo-total-quotes').textContent = zoData.total_quotes || 0;
    document.getElementById('zo-total-people').textContent = zoData.total_people || 0;
    document.getElementById('zo-total-categories').textContent = Object.keys(zoData.categories || {}).length;

    const cats = zoData.categories || {};
    const sortedCats = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const ctx = document.getElementById('quotesChart');
    if (ctx) {
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: sortedCats.map(c => c[0]),
          datasets: [{
            data: sortedCats.map(c => c[1]),
            backgroundColor: [
              '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
              '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'
            ],
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#71767b' } },
            y: { grid: { display: false }, ticks: { color: '#e7e9ea', font: { size: 10 } } }
          }
        }
      });
    }
  }
  function createIdfMovementCard(item) {
    const card = document.createElement('div');
    card.className = 'zo-quote-card';

    const unitName = item.unit?.name || 'Unknown Unit';
    const divName = item.unit?.division?.name || 'Unknown Division';
    const areaName = item.area?.name || 'Unknown Area';
    const imgSrc = item.area?.map_display || '';
    const insigniaSrc = item.unit?.insignia || '/c4p-logo.png';
    const dateRange = (item.date_entered_display || '?') + ' \u2014 ' + (item.date_exited_display || 'Present');

    const flagsHtml = (item.unit?.unit_includes || []).map(b => '<span class="zo-cat-pill">' + b.name + '</span>').join('');

    // Avatar
    const avatarHtml = '<div class="zo-avatar-ring"><img src="' + insigniaSrc + '" alt="" class="zo-avatar" style="background:#fff;object-fit:contain;padding:2px;"></div>';

    // Meta line
    let metaLine = '@idf_movement · Ops · ' + dateRange;

    let html = '<div class="zo-card-layout">';
    html += avatarHtml;
    html += '<div class="zo-card-body">';
    html += '<div class="zo-name-row"><span class="zo-name" style="color:var(--text-primary);"><span style="color:#ef4444;">\u2694\ufe0f</span> ' + unitName + '</span><span class="zo-verified" title="Verified record">&#10003;</span></div>';
    html += '<div class="zo-meta">' + metaLine + '</div>';
    
    html += '<div class="zo-quote" style="font-style:normal;font-size:1rem;color:var(--text-primary);margin-bottom:8px;">';
    html += 'Deployed to <strong style="color:#ef4444;">' + areaName + '</strong> under the command of <strong>' + divName + '</strong>.';
    html += '</div>';

    if (flagsHtml) html += '<div class="zo-cats" style="margin-top:10px;">' + flagsHtml + '</div>';
    
    // Image
    if (imgSrc) {
      html += '<div class="image-grid grid-1" style="margin-top:12px;">';
      html += '<img src="' + imgSrc + '" alt="' + areaName + ' map" onclick="openModal(\'' + imgSrc + '\')" loading="lazy" style="border-radius:12px;border:1px solid rgba(255,255,255,0.1);" />';
      html += '</div>';
    }
    
    if (item.enter_source) {
      html += '<div class="zo-source-line" style="margin-top:12px;">';
      html += '<a href="' + item.enter_source + '" target="_blank" class="zo-source-link">Source Link &#8599;</a>';
      html += '</div>';
    }

    const views = Math.floor(Math.random() * 40000 + 2000);
    const shares = Math.floor(Math.random() * 500 + 10);
    html += '<div class="zo-actions" style="margin-top:12px;">';
    html += '<span class="zo-action"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.25-.893 4.306-2.394 5.798l-5.662 5.312a.5.5 0 0 1-.796-.397v-3.846H9.756c-4.42 0-8.005-3.58-8.005-8z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg> Reply</span>';
    html += '<span class="zo-action zo-retweet"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M4.75 3.79l4.603 4.3-1.706 1.82L6 8.38v7.37c0 .97.784 1.75 1.75 1.75H13v2.5H7.75c-2.347 0-4.25-1.9-4.25-4.25V8.38L1.853 9.91.147 8.09l4.603-4.3zm11.5 16.42l4.603-4.3-1.706-1.82L17.5 15.62V8.25c0-.97-.784-1.75-1.75-1.75H11V4h4.75c2.347 0 4.25 1.9 4.25 4.25v7.37l1.647-1.53 1.706 1.82-4.603 4.3z" fill="currentColor"/></svg> ' + shares.toLocaleString() + '</span>';
    html += '<span class="zo-action zo-heart"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C10.085 6.01 8.628 5.44 7.407 5.5 3.96 5.68 2.24 8.69 3.2 12.17c1.378 5 8.97 9.83 8.97 9.83s7.59-4.83 8.97-9.83c.95-3.48-.77-6.49-4.443-6.67z" fill="#f91880"/></svg></span>';
    html += '<span class="zo-action zo-views"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M8.75 21V3h2v18h-2zM18.75 21V8.5h2V21h-2zM13.75 21v-9h2v9h-2zM3.75 21v-4h2v4h-2z" fill="currentColor"/></svg> ' + views.toLocaleString() + '</span>';
    html += '</div>';

    html += '</div></div>';
    card.innerHTML = html;
    
    return card;
  }

  function renderMovementAnalytics(data) {
    if (!data || data.length === 0) return;
    document.getElementById('movement-total-records').textContent = data.length;

    const divCounts = {};
    const areaCounts = {};
    data.forEach(m => {
      const d = m.unit?.division?.name || 'Unknown';
      const a = m.area?.name || 'Unknown';
      divCounts[d] = (divCounts[d] || 0) + 1;
      areaCounts[a] = (areaCounts[a] || 0) + 1;
    });

    const topDiv = Object.entries(divCounts).sort((a,b) => b[1]-a[1])[0];
    const topArea = Object.entries(areaCounts).sort((a,b) => b[1]-a[1])[0];

    document.getElementById('movement-most-active-div').textContent = topDiv ? topDiv[0] : '--';
    document.getElementById('movement-most-active-div').title = topDiv ? topDiv[0] : '';
    document.getElementById('movement-most-targeted').textContent = topArea ? topArea[0] : '--';

    const topAreasData = Object.entries(areaCounts).sort((a,b) => b[1]-a[1]).slice(0, 5);
    const ctx = document.getElementById('movementChart');
    if (ctx) {
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: topAreasData.map(d => d[0]),
          datasets: [{
            data: topAreasData.map(d => d[1]),
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: '#ef4444',
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: {
            legend: { display: false },
            title: { display: true, text: 'Top Targeted Areas', color: '#e7e9ea' }
          },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#71767b' } },
            y: { grid: { display: false }, ticks: { color: '#e7e9ea', font: { size: 11 } } }
          }
        }
      });
    }
  }
  // Initialize quotes tab
  if (zoData) {
    renderZoUI('feed');
    renderZoAnalytics();
  }

});
