/**
 * DVLA Ghana Dashboard Core Logic
 * Handles tabs, themes, real-time streaming, ECharts initialization, Map-Reduce Lab, and Chat Assistant.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // Check local database is loaded
    if (typeof RAW_DATABASE === 'undefined' || typeof DASHBOARD_METRICS === 'undefined') {
        console.error("DVLA database files failed to load properly.");
        return;
    }

    // --- State Variables ---
    let isDark = document.body.classList.contains('dark-theme');
    let activeTab = 'overview';
    const chartInstances = {};
    let activeVizDatabase = RAW_DATABASE;

    // --- DOM Elements ---
    const liveTimeEl = document.getElementById('live-time');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const navItems = document.querySelectorAll('.nav-item');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const currentTabTitle = document.getElementById('current-tab-title');
    const currentTabDesc = document.getElementById('current-tab-desc');
    
    // --- Real-time Stream Elements ---
    const streamTbody = document.getElementById('stream-table-body');
    const recentVehiclesTbody = document.getElementById('recent-vehicles-tbody');

    // --- Query Engine Elements ---
    const queryInput = document.getElementById('nl-query-input');
    const runQueryBtn = document.getElementById('run-query-btn');
    const consoleTerminal = document.getElementById('console-terminal');
    const resultMessage = document.getElementById('query-result-message');
    const resultTableWrap = document.getElementById('query-result-table-wrap');
    const resultThead = document.getElementById('query-result-thead');
    const resultTbody = document.getElementById('query-result-tbody');
    const resultPlaceholder = document.getElementById('query-result-placeholder');
    const querySuggestions = document.querySelectorAll('#tab-lab .suggestion-btn');

    // --- Chat Assistant Elements ---
    const chatMessagesBox = document.getElementById('chat-messages-box');
    const chatTextarea = document.getElementById('chat-textarea');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatSuggestions = document.querySelectorAll('#tab-chat .suggestion-btn');

    // ==========================================
    // 1. UTILITY: Live Clock (Accra Timezone)
    // ==========================================
    function updateClock() {
        const accraTime = new Date().toLocaleString("en-US", {
            timeZone: "Africa/Accra",
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            year: "numeric",
            month: "short",
            day: "numeric"
        });
        liveTimeEl.textContent = accraTime;
    }
    updateClock();
    setInterval(updateClock, 1000);

    // ==========================================
    // 2. SETUP: Populate KPI Cards
    // ==========================================
    function populateKPIs() {
        document.getElementById('val-drivers').textContent = DASHBOARD_METRICS.totalDrivers.toLocaleString();
        document.getElementById('val-vehicles').textContent = DASHBOARD_METRICS.totalVehicles.toLocaleString();
        
        // Currency formatting for revenue (Cedis)
        const formattedRev = new Intl.NumberFormat('en-GH', {
            style: 'currency',
            currency: 'GHS',
            maximumFractionDigits: 0
        }).format(DASHBOARD_METRICS.totalRevenue);
        document.getElementById('val-revenue').textContent = formattedRev;
        
        document.getElementById('val-evs').textContent = DASHBOARD_METRICS.activeEVs.toLocaleString();
    }
    populateKPIs();

    // ==========================================
    // 3. TABS SWITCHING LOGIC
    // ==========================================
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');
            if (targetTab === activeTab) return;

            // Remove active classes
            navItems.forEach(i => i.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            // Set active
            item.classList.add('active');
            const targetPanel = document.getElementById(`tab-${targetTab}`);
            targetPanel.classList.add('active');
            activeTab = targetTab;

            // Update page headers
            updateTabHeaderInfo(targetTab);

            // Trigger chart resizes (ECharts requires this when container display transitions from none to block)
            setTimeout(() => {
                for (const chartId in chartInstances) {
                    if (chartInstances[chartId]) {
                        chartInstances[chartId].resize();
                    }
                }
            }, 50);
        });
    });

    function updateTabHeaderInfo(tab) {
        const titles = {
            'overview': { title: 'Overview Dashboard', desc: 'DVLA Ghana administrative registration and licence metrics aggregation portal.' },
            'drivers': { title: 'Drivers Licence Analytics', desc: 'Demographics, licence classifications, fee schedules and regulatory analysis.' },
            'vehicles': { title: 'Vehicle Registration Registry', desc: 'Breakdown of registered motor vehicles by fuel source, brand, and type.' },
            'visualisation': { title: 'Advanced Data Visualisation', desc: 'Interact with demographic distributions, EV transitions, workload metrics, and licensing revenue statistics.' },
            'lab': { title: 'Big Data Lab & Map-Reduce', desc: 'Execute queries and inspect data processing pipelines in simulated memory environments.' },
            'efficiency': { title: 'System Efficiency & Performance Auditing', desc: 'Process cycle times, backlog queues, PFM audits, and structural improvement analytics.' },
            'reports': { title: 'Reports & Data Export Portal', desc: 'Compile official administrative audits, preview document summaries, and extract datasets as CSV/JSON.' },
            'chat': { title: 'Gemini Data Assistant', desc: 'Interact with the database using natural language commands and descriptive prompts.' }
        };
        currentTabTitle.textContent = titles[tab].title;
        currentTabDesc.textContent = titles[tab].desc;
    }

    // ==========================================
    // 4. ECHARTS THEME CONFIG & INITIALISATION
    // ==========================================
    const CHART_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

    function getChartThemeOptions() {
        const textMuted = isDark ? '#64748b' : '#64748b';
        const textPrimary = isDark ? '#f8fafc' : '#0f172a';
        const splitLineColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';

        return {
            color: CHART_COLORS,
            textStyle: {
                fontFamily: "'Plus Jakarta Sans', sans-serif"
            },
            grid: {
                top: 35,
                bottom: 35,
                left: 55,
                right: 20
            },
            xAxis: {
                axisLabel: { color: textMuted, fontSize: 10 },
                axisLine: { lineStyle: { color: splitLineColor } },
                splitLine: { show: false }
            },
            yAxis: {
                axisLabel: { color: textMuted, fontSize: 10 },
                axisLine: { show: false },
                splitLine: { lineStyle: { color: splitLineColor } }
            },
            legend: {
                textStyle: { color: textMuted, fontSize: 11 },
                bottom: 0,
                itemWidth: 12,
                itemHeight: 12
            },
            tooltip: {
                backgroundColor: isDark ? '#0e1322' : '#ffffff',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.1)',
                textStyle: { color: textPrimary, fontSize: 11 }
            }
        };
    }

    function initCharts() {
        const theme = getChartThemeOptions();

        // 4.1 Overview: Annual Growth Chart
        if (document.getElementById('chart-trends')) {
            const chart = echarts.init(document.getElementById('chart-trends'));
            chartInstances['trends'] = chart;

            const years = Object.keys(DASHBOARD_METRICS.yearlyStats);
            const dlData = years.map(y => DASHBOARD_METRICS.yearlyStats[y].dl);
            const vrData = years.map(y => DASHBOARD_METRICS.yearlyStats[y].vr);

            chart.setOption({
                ...theme,
                legend: { ...theme.legend, show: true, data: ['Driver Licences', 'Vehicles Registered'] },
                xAxis: { ...theme.xAxis, type: 'category', data: years },
                yAxis: { ...theme.yAxis, type: 'value' },
                series: [
                    { name: 'Driver Licences', type: 'bar', barGap: '15%', data: dlData },
                    { name: 'Vehicles Registered', type: 'bar', data: vrData }
                ]
            });
        }

        // 4.2 Overview: Regional Distribution Chart
        if (document.getElementById('chart-regions')) {
            const chart = echarts.init(document.getElementById('chart-regions'));
            chartInstances['regions'] = chart;

            const regions = Object.keys(DASHBOARD_METRICS.regionalStats);
            const transData = regions.map(r => DASHBOARD_METRICS.regionalStats[r].total);

            chart.setOption({
                ...theme,
                tooltip: { ...theme.tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
                xAxis: { ...theme.xAxis, type: 'value' },
                yAxis: { ...theme.yAxis, type: 'category', data: regions },
                grid: { ...theme.grid, left: 100, right: 30 },
                series: [{
                    name: 'Total Transactions',
                    type: 'bar',
                    data: transData,
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                            { offset: 0, color: '#4f46e5' },
                            { offset: 1, color: '#818cf8' }
                        ])
                    }
                }]
            });
        }

        // 4.3 Drivers: Age Demographics
        if (document.getElementById('chart-driver-ages')) {
            const chart = echarts.init(document.getElementById('chart-driver-ages'));
            chartInstances['driverAges'] = chart;

            const data = Object.entries(DASHBOARD_METRICS.ageGroups).map(([group, val]) => ({
                name: `Age ${group}`,
                value: val
            }));

            chart.setOption({
                ...theme,
                tooltip: { ...theme.tooltip, trigger: 'item' },
                legend: { ...theme.legend, bottom: 0, orient: 'horizontal' },
                series: [{
                    name: 'Driver Demographics',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    avoidLabelOverlap: false,
                    itemStyle: { borderRadius: 8, borderColor: isDark ? '#080c14' : '#ffffff', borderWidth: 2 },
                    label: { show: false },
                    data: data
                }]
            });
        }

        // 4.4 Drivers: License Class Distribution
        if (document.getElementById('chart-driver-classes')) {
            const chart = echarts.init(document.getElementById('chart-driver-classes'));
            chartInstances['driverClasses'] = chart;

            const classes = Object.keys(DASHBOARD_METRICS.classStats);
            const classCounts = Object.values(DASHBOARD_METRICS.classStats);

            chart.setOption({
                ...theme,
                tooltip: { ...theme.tooltip, trigger: 'axis' },
                xAxis: { ...theme.xAxis, type: 'category', data: classes.map(c => `Class ${c}`) },
                yAxis: { ...theme.yAxis, type: 'value' },
                series: [{
                    name: 'Issued Licenses',
                    type: 'bar',
                    data: classCounts,
                    itemStyle: { color: '#10b981' }
                }]
            });
        }

        // 4.5 Vehicles: Fuel Type Distribution (EV growth highlight!)
        if (document.getElementById('chart-fuel-types')) {
            const chart = echarts.init(document.getElementById('chart-fuel-types'));
            chartInstances['fuelTypes'] = chart;

            const fuelData = Object.entries(DASHBOARD_METRICS.fuelStats).map(([type, val]) => ({
                name: type,
                value: val
            }));

            chart.setOption({
                ...theme,
                tooltip: { ...theme.tooltip, trigger: 'item' },
                legend: { ...theme.legend, show: true },
                series: [{
                    name: 'Propulsion Source',
                    type: 'pie',
                    radius: '55%',
                    center: ['50%', '45%'],
                    roseType: 'area',
                    itemStyle: { borderRadius: 8 },
                    data: fuelData
                }]
            });
        }

        // 4.6 Vehicles: Vehicle Type Distribution
        if (document.getElementById('chart-vehicle-types')) {
            const chart = echarts.init(document.getElementById('chart-vehicle-types'));
            chartInstances['vehicleTypes'] = chart;

            // Group vehicle types from database
            const types = {};
            RAW_DATABASE.forEach(r => {
                if (r.vehicleType) {
                    types[r.vehicleType] = (types[r.vehicleType] || 0) + 1;
                }
            });

            chart.setOption({
                ...theme,
                tooltip: { ...theme.tooltip, trigger: 'axis' },
                xAxis: { ...theme.xAxis, type: 'category', data: Object.keys(types) },
                yAxis: { ...theme.yAxis, type: 'value' },
                series: [{
                    name: 'Vehicle Count',
                    type: 'bar',
                    data: Object.values(types),
                    itemStyle: { color: '#f59e0b' }
                }]
            });
        }

        // 4.7 Vehicles: Top Automotive Brands
        if (document.getElementById('chart-vehicle-brands')) {
            const chart = echarts.init(document.getElementById('chart-vehicle-brands'));
            chartInstances['vehicleBrands'] = chart;

            const brands = {};
            RAW_DATABASE.forEach(r => {
                if (r.brand) {
                    brands[r.brand] = (brands[r.brand] || 0) + 1;
                }
            });
            const top5 = Object.entries(brands).sort((a,b)=>b[1]-a[1]).slice(0, 5);

            chart.setOption({
                ...theme,
                tooltip: { ...theme.tooltip, trigger: 'axis' },
                xAxis: { ...theme.xAxis, type: 'value' },
                yAxis: { ...theme.yAxis, type: 'category', data: top5.map(b => b[0]).reverse() },
                grid: { ...theme.grid, left: 100, right: 30 },
                series: [{
                    name: 'Registrations',
                    type: 'bar',
                    data: top5.map(b => b[1]).reverse(),
                    itemStyle: { color: '#a855f7' }
                }]
            });
        }

        // 4.8 System Efficiency: Processing delays by region
        if (document.getElementById('chart-processing-delays')) {
            const chart = echarts.init(document.getElementById('chart-processing-delays'));
            chartInstances['processingDelays'] = chart;

            const delayData = [
                { name: 'G. Accra', value: 3.2 },
                { name: 'Ashanti', value: 5.1 },
                { name: 'Eastern', value: 5.5 },
                { name: 'Volta', value: 6.2 },
                { name: 'Central', value: 7.0 },
                { name: 'Western', value: 8.4 },
                { name: 'Northern', value: 9.1 }
            ];

            chart.setOption({
                ...theme,
                tooltip: { ...theme.tooltip, trigger: 'axis', formatter: '{b}: {c} Days' },
                xAxis: { ...theme.xAxis, type: 'category', data: delayData.map(d => d.name) },
                yAxis: { ...theme.yAxis, type: 'value', name: 'Days' },
                grid: { ...theme.grid, left: 40, right: 20 },
                series: [{
                    name: 'Avg Days to Issue',
                    type: 'line',
                    smooth: true,
                    data: delayData.map(d => d.value),
                    itemStyle: { color: '#ef4444' },
                    lineStyle: { width: 3 },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(239, 68, 68, 0.2)' },
                            { offset: 1, color: 'rgba(239, 68, 68, 0.0)' }
                        ])
                    }
                }]
            });
        }
        
        // 4.9 Advanced Visualisation Panel Charts
        initVisualisationCharts(activeVizDatabase);
    }
    initCharts();

    // ==========================================
    // 4.99 Advanced Visualisation Dashboard Logic
    // ==========================================
    const vizStatusFilter = document.getElementById('viz-status-filter');
    
    if (vizStatusFilter) {
        vizStatusFilter.addEventListener('change', () => {
            const status = vizStatusFilter.value;
            if (status === 'all') {
                activeVizDatabase = RAW_DATABASE;
            } else {
                activeVizDatabase = RAW_DATABASE.filter(r => r.status === status);
            }
            
            // Dispose existing visualisation charts
            const vizCharts = ['vizDemographics', 'vizEcological', 'vizRevenueShare', 'vizWorkload'];
            vizCharts.forEach(c => {
                if (chartInstances[c]) {
                    chartInstances[c].dispose();
                }
            });
            
            initVisualisationCharts(activeVizDatabase);
        });
    }



    function initVisualisationCharts(db) {
        const theme = getChartThemeOptions();
        const dbSource = db || RAW_DATABASE;

        // 1. Licence Applicant Demographics
        if (document.getElementById('chart-viz-demographics')) {
            const chart = echarts.init(document.getElementById('chart-viz-demographics'));
            chartInstances['vizDemographics'] = chart;

            const cohorts = {
                '18-25': { Male: 0, Female: 0 },
                '26-35': { Male: 0, Female: 0 },
                '36-45': { Male: 0, Female: 0 },
                '46-55': { Male: 0, Female: 0 },
                '56+': { Male: 0, Female: 0 }
            };

            const drivers = dbSource.filter(r => r.type === 'Driver Licence');
            drivers.forEach(d => {
                const age = d.age || 30;
                const gender = d.gender || 'Male';
                let key = '36-45';
                if (age <= 25) key = '18-25';
                else if (age <= 35) key = '26-35';
                else if (age <= 45) key = '36-45';
                else if (age <= 55) key = '46-55';
                else key = '56+';
                
                if (cohorts[key] && cohorts[key][gender] !== undefined) {
                    cohorts[key][gender]++;
                }
            });

            const keys = Object.keys(cohorts);
            const maleData = keys.map(k => cohorts[k].Male);
            const femaleData = keys.map(k => cohorts[k].Female);

            chart.setOption({
                ...theme,
                legend: { ...theme.legend, show: true, data: ['Male', 'Female'] },
                tooltip: { ...theme.tooltip, trigger: 'axis' },
                xAxis: { ...theme.xAxis, type: 'category', data: keys },
                yAxis: { ...theme.yAxis, type: 'value' },
                series: [
                    { name: 'Male', type: 'bar', data: maleData, itemStyle: { color: 'var(--primary)' } },
                    { name: 'Female', type: 'bar', data: femaleData, itemStyle: { color: 'var(--accent)' } }
                ]
            });
        }

        // 2. Ecological Vehicles Transition Trend
        if (document.getElementById('chart-viz-ecological')) {
            const chart = echarts.init(document.getElementById('chart-viz-ecological'));
            chartInstances['vizEcological'] = chart;

            const years = [2021, 2022, 2023, 2024, 2025, 2026];
            const evData = years.map(y => {
                return dbSource.filter(r => r.year === y && r.type === 'Vehicle Registration' && r.fuelType === 'Electric').length;
            });
            const hybridData = years.map(y => {
                return dbSource.filter(r => r.year === y && r.type === 'Vehicle Registration' && r.fuelType === 'Hybrid').length;
            });

            chart.setOption({
                ...theme,
                legend: { ...theme.legend, show: true, data: ['Electric (EV)', 'Hybrid'] },
                tooltip: { ...theme.tooltip, trigger: 'axis' },
                xAxis: { ...theme.xAxis, type: 'category', data: years.map(String) },
                yAxis: { ...theme.yAxis, type: 'value' },
                series: [
                    {
                        name: 'Electric (EV)',
                        type: 'line',
                        smooth: true,
                        areaStyle: { opacity: 0.15 },
                        data: evData,
                        itemStyle: { color: 'var(--primary)' }
                    },
                    {
                        name: 'Hybrid',
                        type: 'line',
                        smooth: true,
                        areaStyle: { opacity: 0.1 },
                        data: hybridData,
                        itemStyle: { color: 'var(--accent)' }
                    }
                ]
            });
        }

        // 3. Licensing Revenue by Classification
        if (document.getElementById('chart-viz-revenue-share')) {
            const chart = echarts.init(document.getElementById('chart-viz-revenue-share'));
            chartInstances['vizRevenueShare'] = chart;

            const classes = ['A', 'B', 'C', 'D', 'E', 'F'];
            const revByClass = classes.map(c => {
                const total = dbSource
                    .filter(r => r.type === 'Driver Licence' && r.licenceClass === c && r.status === 'Approved')
                    .reduce((sum, r) => sum + r.feePaid, 0);
                return { name: `Class ${c}`, value: total };
            });

            chart.setOption({
                ...theme,
                tooltip: { ...theme.tooltip, trigger: 'item', formatter: '{b}: GHS {c} ({d}%)' },
                legend: { ...theme.legend, show: true, bottom: 0 },
                series: [{
                    name: 'Revenue Share',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    avoidLabelOverlap: false,
                    itemStyle: { borderRadius: 8, borderColor: isDark ? '#050b07' : '#ffffff', borderWidth: 2 },
                    label: { show: false },
                    emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
                    data: revByClass
                }]
            });
        }

        // 4. Regional Workload Distributions
        if (document.getElementById('chart-viz-workload')) {
            const chart = echarts.init(document.getElementById('chart-viz-workload'));
            chartInstances['vizWorkload'] = chart;

            const regions = ['Greater Accra', 'Ashanti', 'Western', 'Northern', 'Eastern', 'Volta', 'Central'];
            const dlData = regions.map(reg => {
                return dbSource.filter(r => r.region === reg && r.type === 'Driver Licence').length;
            });
            const vrData = regions.map(reg => {
                return dbSource.filter(r => r.region === reg && r.type === 'Vehicle Registration').length;
            });

            chart.setOption({
                ...theme,
                legend: { ...theme.legend, show: true, data: ['Licences', 'Vehicles'] },
                tooltip: { ...theme.tooltip, trigger: 'axis' },
                xAxis: { ...theme.xAxis, type: 'category', data: regions.map(r => r.replace('Greater ', 'G. ')) },
                yAxis: { ...theme.yAxis, type: 'value' },
                series: [
                    { name: 'Licences', type: 'bar', data: dlData, itemStyle: { color: 'var(--primary)' } },
                    { name: 'Vehicles', type: 'bar', data: vrData, itemStyle: { color: 'var(--accent)' } }
                ]
            });
        }
    }

    // ==========================================
    // 5. DATA INGESTION: Real-Time Stream Simulation
    // ==========================================
    let streamIndex = 0;
    function ingestNewRecord() {
        const record = RAW_DATABASE[streamIndex % RAW_DATABASE.length];
        streamIndex++;

        // Format row elements
        const tr = document.createElement('tr');
        tr.style.opacity = '0';
        tr.style.transition = 'opacity 0.5s ease';
        
        let detailsHtml = '';
        if (record.type === 'Driver Licence') {
            detailsHtml = `Class ${record.licenceClass} (${record.gender}, Age ${record.age})`;
        } else {
            detailsHtml = `${record.brand} (${record.vehicleType}, ${record.fuelType})`;
        }
        
        const statusClass = record.status === 'Approved' ? 'badge-approved' : (record.status === 'Pending' ? 'badge-pending' : 'badge-rejected');

        tr.innerHTML = `
            <td><span class="mono-id">${record.id}</span></td>
            <td><strong style="color: ${record.type === 'Driver Licence' ? 'var(--primary-light)' : 'var(--accent)'};">${record.type}</strong></td>
            <td>${record.date}</td>
            <td>${record.region}</td>
            <td><span style="font-size: 0.78rem; color: var(--text-secondary);">${detailsHtml}</span></td>
            <td>GHS ${record.feePaid}</td>
            <td><span class="badge ${statusClass}">${record.status}</span></td>
        `;

        // Prepend to body
        if (streamTbody.firstChild) {
            streamTbody.insertBefore(tr, streamTbody.firstChild);
        } else {
            streamTbody.appendChild(tr);
        }

        // Apply fade-in
        setTimeout(() => {
            tr.style.opacity = '1';
        }, 50);

        // Keep maximum of 7 rows to prevent overflow
        if (streamTbody.children.length > 7) {
            streamTbody.removeChild(streamTbody.lastChild);
        }
    }

    // Run first batch and start interval
    for (let i = 0; i < 5; i++) {
        ingestNewRecord();
    }
    setInterval(ingestNewRecord, 3500);

    // Populate static recent vehicle approvals table (Vehicles tab)
    function populateRecentVehicles() {
        const approvedVehicles = RAW_DATABASE.filter(r => r.type === 'Vehicle Registration' && r.status === 'Approved').slice(0, 5);
        recentVehiclesTbody.innerHTML = approvedVehicles.map(v => `
            <tr>
                <td><span class="mono-id">${v.id}</span></td>
                <td><strong>${v.brand}</strong></td>
                <td>${v.vehicleType}</td>
                <td><span class="badge badge-approved">${v.fuelType}</span></td>
                <td>${v.region}</td>
                <td>GHS ${v.feePaid}</td>
            </tr>
        `).join('');
    }
    populateRecentVehicles();

    // ==========================================
    // 6. PROCESSOR: Query Engine Terminal Loop
    // ==========================================
    function triggerQuery(text) {
        if (!text) return;

        // Clear placeholder and display result message
        resultPlaceholder.style.display = 'none';
        resultMessage.style.display = 'none';
        resultTableWrap.style.display = 'none';
        
        // Output terminal execution lines sequentially
        const responseData = processNaturalLanguageQuery(text);
        let logIndex = 0;
        consoleTerminal.innerHTML = `
            <div class="terminal-header">
                <span class="terminal-dot dot-red"></span>
                <span class="terminal-dot dot-yellow"></span>
                <span class="terminal-dot dot-green"></span>
                <span class="terminal-title">dvla-mapreduce-engine --host localhost</span>
            </div>
            <div class="console-line system">> Initializing batch pipeline...</div>
        `;

        function printLogLine() {
            if (logIndex < responseData.logs.length) {
                const line = responseData.logs[logIndex];
                const p = document.createElement('div');
                p.className = 'console-line';
                
                // Colorize logs based on map/reduce state
                if (line.includes('[BigDataEngine]')) p.classList.add('system');
                else if (line.includes('[Parse]')) p.classList.add('parse');
                else if (line.includes('[Map]')) p.classList.add('map');
                else if (line.includes('[Reduce]')) p.classList.add('reduce');
                
                p.textContent = `> ${line}`;
                consoleTerminal.appendChild(p);
                consoleTerminal.scrollTop = consoleTerminal.scrollHeight;
                
                logIndex++;
                setTimeout(printLogLine, 250); // Speed of terminal output
            } else {
                // Done. Output response
                displayQueryResult(responseData);
            }
        }
        setTimeout(printLogLine, 300);
    }

    function displayQueryResult(data) {
        // Display answer message
        resultMessage.style.display = 'block';
        resultMessage.innerHTML = data.message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Populate Table Preview of matching records
        if (data.records && data.records.length > 0) {
            resultTableWrap.style.display = 'block';
            
            // Build headers dynamically
            const sample = data.records[0];
            const headers = Object.keys(sample).filter(k => k !== 'year' && k !== 'type');
            resultThead.innerHTML = `<tr>${headers.map(h => `<th>${h.toUpperCase()}</th>`).join('')}</tr>`;
            
            // Build body
            resultTbody.innerHTML = data.records.map(r => {
                return `<tr>${headers.map(h => {
                    const val = r[h];
                    if (h === 'id') return `<td><span class="mono-id">${val}</span></td>`;
                    if (h === 'status') {
                        const sClass = val === 'Approved' ? 'badge-approved' : (val === 'Pending' ? 'badge-pending' : 'badge-rejected');
                        return `<td><span class="badge ${sClass}">${val}</span></td>`;
                    }
                    if (h === 'feePaid') return `<td>GHS ${val}</td>`;
                    return `<td>${val}</td>`;
                }).join('')}</tr>`;
            }).join('');
        }
    }

    // Input trigger event
    runQueryBtn.addEventListener('click', () => {
        triggerQuery(queryInput.value);
    });

    queryInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            triggerQuery(queryInput.value);
        }
    });

    // Quick suggestion buttons (Big Data Lab)
    querySuggestions.forEach(btn => {
        btn.addEventListener('click', () => {
            const queryText = btn.getAttribute('data-query');
            queryInput.value = queryText;
            triggerQuery(queryText);
        });
    });

    // ==========================================
    // 7. DIALOG: Client-Side NLP Chat Assistant
    // ==========================================
    function appendMessage(sender, text, thoughts = null) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${sender}`;
        
        let html = '';
        if (thoughts) {
            html += `<div class="chat-thoughts">Thought: ${thoughts}</div>`;
        }
        
        // Convert mock markdown formatting
        const cleanText = text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/-\s(.*?)(<br>|$)/g, '• $1$2');

        html += `<div>${cleanText}</div>`;
        bubble.innerHTML = html;
        
        chatMessagesBox.appendChild(bubble);
        chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
    }

    function processChatAssistantInput() {
        const prompt = chatTextarea.value.trim();
        if (!prompt) return;

        // Append User Bubble
        appendMessage('user', prompt);
        chatTextarea.value = '';
        chatTextarea.style.height = '38px'; // Reset height

        // Show Typing Indicator
        const typingEl = document.createElement('div');
        typingEl.className = 'chat-bubble assistant typing-indicator';
        typingEl.innerHTML = `<span style="font-size: 0.72rem; color: var(--text-muted); font-style: italic;">Thinking...</span>`;
        chatMessagesBox.appendChild(typingEl);
        chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;

        // Process Response
        setTimeout(() => {
            // Remove typing indicator
            chatMessagesBox.removeChild(typingEl);
            
            // Execute local search NLP
            const result = processNaturalLanguageQuery(prompt);
            
            // Generate thoughts log for the assistant
            let thought = '';
            if (prompt.toLowerCase().includes('electric') || prompt.toLowerCase().includes('ev')) {
                thought = "Resolving EV registrations search index. Running Filter (fuelType == 'Electric') -> Reduce (Sum records count).";
            } else if (prompt.toLowerCase().includes('revenue')) {
                thought = "User is requesting monetary values. Scanning approved registrations, executing fee accumulators.";
            } else if (prompt.toLowerCase().includes('age')) {
                thought = "Demographic metric requested. Pulling drivers cohort database, dividing total age sum by total headcount.";
            } else {
                thought = "Parsing query tokens. Found match filters. Executing standard record count accumulator.";
            }
            
            appendMessage('assistant', result.message, thought);
        }, 1200);
    }

    chatSendBtn.addEventListener('click', processChatAssistantInput);
    
    chatTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            processChatAssistantInput();
        }
    });

    // Auto-resize chat textarea
    chatTextarea.addEventListener('input', () => {
        chatTextarea.style.height = 'auto';
        chatTextarea.style.height = (chatTextarea.scrollHeight) + 'px';
    });

    // Suggested prompts click (Chat Assistant Tab)
    chatSuggestions.forEach(btn => {
        btn.addEventListener('click', () => {
            const promptText = btn.getAttribute('data-prompt');
            chatTextarea.value = promptText;
            processChatAssistantInput();
        });
    });

    // ==========================================
    // 8. SETUP: Theme Toggle (Dark / Light)
    // ==========================================
    themeToggleBtn.addEventListener('click', () => {
        if (isDark) {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            isDark = false;
        } else {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
            isDark = true;
        }

        // Re-initialize charts to apply light/dark styling configurations
        for (const chartId in chartInstances) {
            if (chartInstances[chartId]) {
                chartInstances[chartId].dispose();
            }
        }
        initCharts();
    });

    // ==========================================
    // 9. PROCESSOR: Report Generation & Extraction
    // ==========================================
    const generateReportBtn = document.getElementById('generate-report-btn');
    const exportDownloadBtn = document.getElementById('export-download-btn');
    const exportPrintBtn = document.getElementById('export-print-btn');
    
    const repCategorySelect = document.getElementById('rep-category');
    const repYearSelect = document.getElementById('rep-year');
    const repRegionSelect = document.getElementById('rep-region');
    const repFormatSelect = document.getElementById('rep-format');
    
    const reportEmptyPreview = document.getElementById('report-empty-preview');
    const reportPreviewDocument = document.getElementById('report-preview-document');
    const reportMetaGrid = document.getElementById('report-meta-grid');
    const reportPreviewThead = document.getElementById('report-preview-thead');
    const reportPreviewTbody = document.getElementById('report-preview-tbody');
    const reportDocTitle = document.getElementById('report-doc-title');
    const reportGenDate = document.getElementById('report-gen-date');
    
    let currentReportData = null;
    let currentReportFilename = '';

    generateReportBtn.addEventListener('click', () => {
        const cat = repCategorySelect.value;
        const year = repYearSelect.value;
        const region = repRegionSelect.value;
        
        // 1. Filter the RAW_DATABASE
        let filtered = RAW_DATABASE;
        if (cat === 'driver') {
            filtered = filtered.filter(r => r.type === 'Driver Licence');
        } else if (cat === 'vehicle') {
            filtered = filtered.filter(r => r.type === 'Vehicle Registration');
        } else if (cat === 'ev') {
            filtered = filtered.filter(r => r.type === 'Vehicle Registration' && r.fuelType === 'Electric');
        }
        
        if (year !== 'all') {
            filtered = filtered.filter(r => r.year === parseInt(year, 10));
        }
        
        if (region !== 'all') {
            filtered = filtered.filter(r => r.region === region);
        }
        
        currentReportData = filtered;
        
        // 2. Set Up Date
        reportGenDate.textContent = `DATE: ${new Date().toLocaleDateString("en-GH", { year: 'numeric', month: '2-digit', day: '2-digit' })}`;
        
        // 3. Compile Metadata Stats
        const approvedCount = filtered.filter(r => r.status === 'Approved').length;
        const pendingCount = filtered.filter(r => r.status === 'Pending').length;
        const totalRevenue = filtered.reduce((sum, r) => r.status === 'Approved' ? sum + r.feePaid : sum, 0);
        const formattedRev = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0 }).format(totalRevenue);
        
        let metaHtml = '';
        if (cat === 'driver') {
            reportDocTitle.textContent = "Driver Licensing Registry Audit Report";
            currentReportFilename = `DVLA_Drivers_Licence_Report_${year}_${region.replace(/\s+/g, '_')}`;
            const maleCount = filtered.filter(r => r.gender === 'Male').length;
            const femaleCount = filtered.filter(r => r.gender === 'Female').length;
            const sumAge = filtered.reduce((sum, r) => sum + (r.age || 0), 0);
            const avgAge = filtered.length > 0 ? Math.round(sumAge / filtered.length) : 0;
            
            metaHtml = `
                <div><strong>Total Licences:</strong> ${filtered.length}</div>
                <div><strong>Approved:</strong> ${approvedCount} (Pending: ${pendingCount})</div>
                <div><strong>Revenue Collected:</strong> ${formattedRev}</div>
                <div><strong>Avg Applicant Age:</strong> ${avgAge} Years</div>
                <div><strong>Male Applicants:</strong> ${maleCount}</div>
                <div><strong>Female Applicants:</strong> ${femaleCount}</div>
            `;
        } else if (cat === 'vehicle') {
            reportDocTitle.textContent = "Vehicle Registration Registry Audit Report";
            currentReportFilename = `DVLA_Vehicle_Registration_Report_${year}_${region.replace(/\s+/g, '_')}`;
            const privateCount = filtered.filter(r => r.vehicleType === 'Private').length;
            const commercialCount = filtered.filter(r => r.vehicleType === 'Commercial').length;
            const evCount = filtered.filter(r => r.fuelType === 'Electric').length;
            
            metaHtml = `
                <div><strong>Total Registrations:</strong> ${filtered.length}</div>
                <div><strong>Approved:</strong> ${approvedCount} (Pending: ${pendingCount})</div>
                <div><strong>Revenue Collected:</strong> ${formattedRev}</div>
                <div><strong>Private Vehicles:</strong> ${privateCount}</div>
                <div><strong>Commercial Vehicles:</strong> ${commercialCount}</div>
                <div><strong>Electric Vehicles (EV):</strong> ${evCount}</div>
            `;
        } else if (cat === 'ev') {
            reportDocTitle.textContent = "EV Integration & Ecological Transition Report";
            currentReportFilename = `DVLA_EV_Transition_Report_${year}_${region.replace(/\s+/g, '_')}`;
            const approvedEv = filtered.filter(r => r.status === 'Approved').length;
            const teslaCount = filtered.filter(r => r.brand === 'Tesla').length;
            const bydCount = filtered.filter(r => r.brand === 'BYD').length;
            
            metaHtml = `
                <div><strong>Total EV Registrations:</strong> ${filtered.length}</div>
                <div><strong>Approved EVs:</strong> ${approvedEv} (Pending: ${pendingCount})</div>
                <div><strong>Total EV Revenue:</strong> ${formattedRev}</div>
                <div><strong>Tesla Registrations:</strong> ${teslaCount}</div>
                <div><strong>BYD Registrations:</strong> ${bydCount}</div>
                <div><strong>Adoption Class:</strong> E-Mobility Standard</div>
            `;
        } else if (cat === 'efficiency') {
            reportDocTitle.textContent = "System Operations & Efficiency Assessment Report";
            currentReportFilename = `DVLA_System_Efficiency_Report_${year}_${region.replace(/\s+/g, '_')}`;
            
            metaHtml = `
                <div><strong>Total Operations Checked:</strong> ${filtered.length} Logs</div>
                <div><strong>Average Cycle Speed:</strong> 5.2 Business Days</div>
                <div><strong>Accra Backlog Count:</strong> 72 Cases (58% share)</div>
                <div><strong>Audit Receipts Leakage:</strong> GHS 18,250 Variance</div>
                <div><strong>Manual Inspection Time:</strong> 9.1 Days avg (Takoradi)</div>
                <div><strong>Test Logjam Booking Delay:</strong> 22 Days (Accra)</div>
            `;
        } else {
            // All Master
            reportDocTitle.textContent = "Comprehensive Master Administrative Audit Report";
            currentReportFilename = `DVLA_Master_Audit_Report_${year}_${region.replace(/\s+/g, '_')}`;
            const dlCount = filtered.filter(r => r.type === 'Driver Licence').length;
            const vrCount = filtered.filter(r => r.type === 'Vehicle Registration').length;
            
            metaHtml = `
                <div><strong>Total Records Analyzed:</strong> ${filtered.length} Transactions</div>
                <div><strong>Driver Licence Logs:</strong> ${dlCount}</div>
                <div><strong>Vehicle Registry Logs:</strong> ${vrCount}</div>
                <div><strong>Audit Approved count:</strong> ${approvedCount}</div>
                <div><strong>Audit Pending count:</strong> ${pendingCount}</div>
                <div><strong>Total Revenue Audited:</strong> ${formattedRev}</div>
            `;
        }
        
        reportMetaGrid.innerHTML = metaHtml;
        
        // 4. Render sample rows table (first 5 filtered records)
        const sampleRows = filtered.slice(0, 5);
        if (sampleRows.length > 0) {
            const sample = sampleRows[0];
            const headers = Object.keys(sample).filter(k => k !== 'year' && k !== 'type');
            reportPreviewThead.innerHTML = `<tr>${headers.map(h => `<th>${h.toUpperCase()}</th>`).join('')}</tr>`;
            
            reportPreviewTbody.innerHTML = sampleRows.map(r => {
                return `<tr>${headers.map(h => {
                    const val = r[h];
                    if (h === 'id') return `<td><span class="mono-id">${val}</span></td>`;
                    if (h === 'status') {
                        const sClass = val === 'Approved' ? 'badge-approved' : (val === 'Pending' ? 'badge-pending' : 'badge-rejected');
                        return `<td><span class="badge ${sClass}">${val}</span></td>`;
                    }
                    if (h === 'feePaid') return `<td>GHS ${val}</td>`;
                    return `<td>${val}</td>`;
                }).join('')}</tr>`;
            }).join('');
        } else {
            reportPreviewThead.innerHTML = `<tr><th>MESSAGE</th></tr>`;
            reportPreviewTbody.innerHTML = `<tr><td>No matching records found for the current query configuration.</td></tr>`;
        }
        
        // 5. Toggle Views
        reportEmptyPreview.style.display = 'none';
        reportPreviewDocument.style.display = 'block';
        
        // 6. Enable Action Buttons
        exportDownloadBtn.removeAttribute('disabled');
        exportPrintBtn.removeAttribute('disabled');
        
        // Apply styling feedback
        exportDownloadBtn.style.borderColor = 'var(--primary)';
        exportDownloadBtn.style.color = 'var(--primary-light)';
        exportPrintBtn.style.borderColor = 'var(--primary)';
        exportPrintBtn.style.color = 'var(--primary-light)';
    });
    
    // File download helper
    exportDownloadBtn.addEventListener('click', () => {
        if (!currentReportData) return;
        
        const format = repFormatSelect.value;
        let content = '';
        let mimeType = '';
        let ext = '';
        
        if (format === 'json') {
            content = JSON.stringify(currentReportData, null, 2);
            mimeType = 'application/json';
            ext = 'json';
        } else {
            // CSV conversion
            const sample = currentReportData[0] || {};
            const headers = Object.keys(sample);
            const csvRows = [headers.join(',')];
            
            currentReportData.forEach(row => {
                const values = headers.map(header => {
                    const escaped = ('' + row[header]).replace(/"/g, '\\"');
                    return `"${escaped}"`;
                });
                csvRows.push(values.join(','));
            });
            
            content = csvRows.join('\n');
            mimeType = 'text/csv';
            ext = 'csv';
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentReportFilename}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    
    // Printing helper
    exportPrintBtn.addEventListener('click', () => {
        if (!currentReportData) return;
        
        const printContent = reportPreviewDocument.innerHTML;
        const win = window.open('', '_blank');
        win.document.write(`
            <html>
                <head>
                    <title>DVLA Ghana - Audit Report Printing</title>
                    <style>
                        body { 
                            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
                            padding: 40px; 
                            color: #1a202c; 
                            background: #ffffff; 
                        }
                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin-top: 20px; 
                            font-size: 11px;
                        }
                        th, td { 
                            border: 1px solid #e2e8f0; 
                            padding: 10px; 
                            text-align: left; 
                        }
                        th { 
                            background-color: #f7fafc; 
                            font-weight: 600;
                            text-transform: uppercase;
                            font-size: 10px;
                        }
                        h3 { 
                            font-family: 'Outfit', sans-serif; 
                            font-weight: 700;
                            text-align: center;
                            margin-bottom: 20px;
                        }
                        .mono-id { 
                            font-family: monospace; 
                            background: #edf2f7; 
                            padding: 2px 4px; 
                            border-radius: 4px; 
                        }
                        .badge {
                            border: 1px solid #cbd5e0;
                            padding: 2px 6px;
                            border-radius: 4px;
                            font-size: 10px;
                            font-weight: 600;
                        }
                        img { 
                            width: 32px;
                            height: 32px;
                            object-fit: contain;
                        }
                        #report-meta-grid {
                            display: grid; 
                            grid-template-columns: 1fr 1fr; 
                            gap: 12px; 
                            border: 1px solid #e2e8f0; 
                            padding: 14px; 
                            border-radius: 8px; 
                            margin-bottom: 20px; 
                            background: #fcfcfc;
                        }
                    </style>
                </head>
                <body>
                    ${printContent}
                    <script>
                        window.onload = function() { 
                            setTimeout(function() {
                                window.print(); 
                                window.close(); 
                            }, 500);
                        }
                    </script>
                </body>
            </html>
        `);
        win.document.close();
    });

    // ==========================================
    // 10. DIALOG: Edit Record Modal Operations & Delegator
    // ==========================================
    const editModal = document.getElementById('edit-record-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalSaveBtn = document.getElementById('modal-save-btn');
    
    const modalRecId = document.getElementById('modal-rec-id');
    const modalRecType = document.getElementById('modal-rec-type');
    const modalStatus = document.getElementById('modal-status');
    const modalRegion = document.getElementById('modal-region');
    const modalFee = document.getElementById('modal-fee');
    const modalClass = document.getElementById('modal-class');
    const modalAge = document.getElementById('modal-age');
    const modalFuel = document.getElementById('modal-fuel');
    const modalBrand = document.getElementById('modal-brand');
    
    const modalDriverFields = document.getElementById('modal-driver-fields');
    const modalVehicleFields = document.getElementById('modal-vehicle-fields');
    
    let selectedRecordForEdit = null;

    function openEditModal(record) {
        selectedRecordForEdit = record;
        
        // Populate inputs
        modalRecId.textContent = record.id;
        modalRecType.textContent = record.type;
        modalRecType.style.color = record.type === 'Driver Licence' ? 'var(--primary-light)' : 'var(--accent)';
        modalStatus.value = record.status;
        modalRegion.value = record.region;
        modalFee.value = record.feePaid;
        
        // Display context sections
        if (record.type === 'Driver Licence') {
            modalDriverFields.style.display = 'flex';
            modalVehicleFields.style.display = 'none';
            modalClass.value = record.licenceClass;
            modalAge.value = record.age;
        } else {
            modalDriverFields.style.display = 'none';
            modalVehicleFields.style.display = 'flex';
            modalFuel.value = record.fuelType;
            modalBrand.value = record.brand;
        }
        
        // Show overlay with animations
        editModal.style.display = 'flex';
        setTimeout(() => {
            editModal.style.opacity = '1';
            editModal.querySelector('.modal-content').style.transform = 'scale(1)';
        }, 10);
    }

    function closeEditModal() {
        editModal.style.opacity = '0';
        editModal.querySelector('.modal-content').style.transform = 'scale(0.9)';
        setTimeout(() => {
            editModal.style.display = 'none';
            selectedRecordForEdit = null;
        }, 300);
    }

    // Modal Close Triggers
    modalCloseBtn.addEventListener('click', closeEditModal);
    modalCancelBtn.addEventListener('click', closeEditModal);
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) closeEditModal();
    });

    // Save Action
    modalSaveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!selectedRecordForEdit) return;
        
        // Update database item reference properties
        selectedRecordForEdit.status = modalStatus.value;
        selectedRecordForEdit.region = modalRegion.value;
        selectedRecordForEdit.feePaid = parseFloat(modalFee.value) || 0;
        
        if (selectedRecordForEdit.type === 'Driver Licence') {
            selectedRecordForEdit.licenceClass = modalClass.value;
            selectedRecordForEdit.age = parseInt(modalAge.value, 10) || 18;
        } else {
            selectedRecordForEdit.fuelType = modalFuel.value;
            selectedRecordForEdit.brand = modalBrand.value;
        }
        
        // Recalculate DASHBOARD_METRICS in-place
        if (typeof getAggregatedMetrics === 'function') {
            const fresh = getAggregatedMetrics();
            Object.assign(DASHBOARD_METRICS, fresh);
        }
        
        // Refresh UI components
        populateKPIs();
        populateRecentVehicles();
        
        // Refresh active tab charts
        for (const chartId in chartInstances) {
            if (chartInstances[chartId]) {
                chartInstances[chartId].dispose();
            }
        }
        initCharts();
        
        // Show success alert in console terminal log if on lab tab
        const p = document.createElement('div');
        p.className = 'console-line system';
        p.textContent = `> [AuditTrail] Record '${selectedRecordForEdit.id}' modified successfully. Cache flushed.`;
        consoleTerminal.appendChild(p);
        consoleTerminal.scrollTop = consoleTerminal.scrollHeight;
        
        closeEditModal();
    });

    // Event Delegator to capture row clicks across ALL tables
    document.addEventListener('click', (e) => {
        // Stop if user clicked buttons inside row
        if (e.target.closest('button') || e.target.closest('a')) return;
        
        const row = e.target.closest('tr');
        if (!row) return;
        
        const table = row.closest('table');
        if (!table || table.id === 'licence-reference-table') return;
        
        const idSpan = row.querySelector('.mono-id');
        if (!idSpan) return;
        
        const recId = idSpan.textContent.trim();
        const record = RAW_DATABASE.find(r => r.id === recId);
        if (record) {
            openEditModal(record);
        }
    });

});
