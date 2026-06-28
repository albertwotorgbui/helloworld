/**
 * DVLA Ghana Big Data Mock Dataset and NLP Processor
 * Part of the DVLA Drivers Licence and Vehicle Registration Dashboard.
 */

// Regional Map for spelling variations
const REGIONS = {
    'greater accra': 'Greater Accra',
    'accra': 'Greater Accra',
    'ashanti': 'Ashanti',
    'kumasi': 'Ashanti',
    'western': 'Western',
    'takoradi': 'Western',
    'northern': 'Northern',
    'tamale': 'Northern',
    'eastern': 'Eastern',
    'koforidua': 'Eastern',
    'volta': 'Volta',
    'ho': 'Volta',
    'central': 'Central',
    'cape coast': 'Central',
    'brong ahafo': 'Brong Ahafo',
    'sunyani': 'Brong Ahafo',
    'upper east': 'Upper East',
    'bolgatanga': 'Upper East',
    'upper west': 'Upper West',
    'wa': 'Upper West'
};

// Available licence classes & descriptions
const LICENCE_CLASSES = {
    'A': 'Motorcycles & light engines',
    'B': 'Private vehicles (up to 8 passengers)',
    'C': 'Commercial vehicles / Taxis',
    'D': 'Heavy duty trucks',
    'E': 'Agricultural / Industrial tractors',
    'F': 'Specialized transport / Articulated'
};

// Generating a large-scale set of simulated records (~2,500 records) to represent DVLA Big Data
function generateBigData() {
    const records = [];
    const brands = ['Toyota', 'Hyundai', 'Kia', 'Honda', 'Mercedes-Benz', 'Nissan', 'BYD', 'Tesla', 'Suzuki', 'Ford'];
    const regionsList = ['Greater Accra', 'Ashanti', 'Western', 'Northern', 'Eastern', 'Volta', 'Central', 'Brong Ahafo', 'Upper East', 'Upper West'];
    const fuelTypes = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
    const vehicleTypes = ['Private', 'Commercial', 'Motorbike', 'Heavy Duty', 'Agricultural'];
    const statuses = ['Approved', 'Approved', 'Approved', 'Approved', 'Pending', 'Rejected'];
    const genders = ['Male', 'Female'];
    const classes = ['A', 'B', 'B', 'C', 'C', 'D', 'E', 'F'];
    
    // Seeded random helper for deterministic mock data
    let seed = 12345;
    function random() {
        let x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }
    
    function randomChoice(arr) {
        return arr[Math.floor(random() * arr.length)];
    }
    
    function randomRange(min, max) {
        return Math.floor(random() * (max - min + 1)) + min;
    }

    // Generate 2,500 records
    for (let i = 1; i <= 2500; i++) {
        const isDriver = random() > 0.45; // 55% driver licences, 45% vehicle registrations
        const date = new Date(
            randomRange(2021, 2026), // 2021 to 2026
            randomRange(0, 11),
            randomRange(1, 28)
        );
        const dateString = date.toISOString().split('T')[0];
        const region = randomChoice(regionsList);
        const status = randomChoice(statuses);
        
        if (isDriver) {
            const gender = randomChoice(genders);
            const age = randomRange(18, 75);
            const licenceClass = randomChoice(classes);
            const feePaid = licenceClass === 'A' ? 120 : (licenceClass === 'B' ? 250 : 380);
            
            records.push({
                id: `DVLA-DL-${date.getFullYear()}-${10000 + i}`,
                type: 'Driver Licence',
                date: dateString,
                year: date.getFullYear(),
                region: region,
                gender: gender,
                age: age,
                licenceClass: licenceClass,
                feePaid: feePaid,
                status: status
            });
        } else {
            const vehicleType = randomChoice(vehicleTypes);
            const fuelType = fuelTypeDistribution(vehicleType);
            const brand = randomChoice(brands);
            const feePaid = vehicleType === 'Private' ? 350 : (vehicleType === 'Commercial' ? 500 : 750);
            
            // Fuel type generator weighted towards hybrid/electric for newer private cars
            function fuelTypeDistribution(vType) {
                const r = random();
                if (vType === 'Private') {
                    if (r < 0.12) return 'Electric'; // 12% EV private
                    if (r < 0.35) return 'Hybrid';   // 23% Hybrid private
                    return 'Petrol';
                } else if (vType === 'Commercial') {
                    if (r < 0.05) return 'Electric';
                    if (r < 0.15) return 'Hybrid';
                    if (r < 0.65) return 'Diesel';
                    return 'Petrol';
                } else if (vType === 'Motorbike') {
                    return r < 0.15 ? 'Electric' : 'Petrol'; // Electric scooters!
                }
                return r < 0.8 ? 'Diesel' : 'Petrol'; // Heavy Duty & Agricultural mostly Diesel
            }

            records.push({
                id: `DVLA-VR-${date.getFullYear()}-${10000 + i}`,
                type: 'Vehicle Registration',
                date: dateString,
                year: date.getFullYear(),
                region: region,
                vehicleType: vehicleType,
                fuelType: fuelType,
                brand: brand,
                feePaid: feePaid,
                status: status
            });
        }
    }
    return records;
}

// Instantiate database
const RAW_DATABASE = generateBigData();

// Pre-aggregated Dashboard Summary Metrics (compiled from our 2,500 records)
function getAggregatedMetrics() {
    let dlCount = 0;
    let vrCount = 0;
    let totalRevenue = 0;
    let pendingRegistrations = 0;
    let activeEVs = 0;

    const regionalStats = {};
    const yearlyStats = {
        2021: { dl: 0, vr: 0, revenue: 0 },
        2022: { dl: 0, vr: 0, revenue: 0 },
        2023: { dl: 0, vr: 0, revenue: 0 },
        2024: { dl: 0, vr: 0, revenue: 0 },
        2025: { dl: 0, vr: 0, revenue: 0 },
        2026: { dl: 0, vr: 0, revenue: 0 }
    };
    const fuelStats = { Petrol: 0, Diesel: 0, Hybrid: 0, Electric: 0 };
    const classStats = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    const ageGroups = { '18-25': 0, '26-35': 0, '36-45': 0, '46-60': 0, '61+': 0 };

    RAW_DATABASE.forEach(r => {
        // Core metrics
        if (r.type === 'Driver Licence') {
            dlCount++;
            classStats[r.licenceClass]++;
            if (r.age <= 25) ageGroups['18-25']++;
            else if (r.age <= 35) ageGroups['26-35']++;
            else if (r.age <= 45) ageGroups['36-45']++;
            else if (r.age <= 60) ageGroups['46-60']++;
            else ageGroups['61+']++;
        } else {
            vrCount++;
            fuelStats[r.fuelType]++;
            if (r.fuelType === 'Electric' && r.status === 'Approved') {
                activeEVs++;
            }
        }

        if (r.status === 'Approved') {
            totalRevenue += r.feePaid;
        } else if (r.status === 'Pending') {
            pendingRegistrations++;
        }

        // Regional rollup
        if (!regionalStats[r.region]) {
            regionalStats[r.region] = { total: 0, dl: 0, vr: 0, revenue: 0 };
        }
        regionalStats[r.region].total++;
        if (r.type === 'Driver Licence') regionalStats[r.region].dl++;
        else regionalStats[r.region].vr++;
        if (r.status === 'Approved') {
            regionalStats[r.region].revenue += r.feePaid;
        }

        // Yearly rollup
        if (yearlyStats[r.year]) {
            if (r.type === 'Driver Licence') yearlyStats[r.year].dl++;
            else yearlyStats[r.year].vr++;
            if (r.status === 'Approved') {
                yearlyStats[r.year].revenue += r.feePaid;
            }
        }
    });

    return {
        totalDrivers: dlCount,
        totalVehicles: vrCount,
        totalRevenue: Math.round(totalRevenue),
        pendingApprovals: pendingRegistrations,
        activeEVs: activeEVs,
        regionalStats,
        yearlyStats,
        fuelStats,
        classStats,
        ageGroups
    };
}

const DASHBOARD_METRICS = getAggregatedMetrics();

/**
 * NLP Query Engine - Translates human queries into JavaScript aggregations.
 * Returns results and detailed map-reduce processing logs to simulate big data processing.
 */
function processNaturalLanguageQuery(queryString) {
    const query = queryString.toLowerCase().trim();
    const logs = [];
    let results = null;
    let message = "";
    
    logs.push(`[BigDataEngine] Initializing query parser at ${new Date().toLocaleTimeString()}`);
    logs.push(`[BigDataEngine] Loading dataset memory partitions... Found ${RAW_DATABASE.length} master records.`);
    
    // 1. Identify Target Dataset
    let targetType = null;
    if (query.includes('driver') || query.includes('licence') || query.includes('license') || query.includes('age') || query.includes('gender')) {
        targetType = 'Driver Licence';
        logs.push(`[Parse] Identified target record schema: 'Driver Licence'`);
    } else if (query.includes('vehicle') || query.includes('car') || query.includes('truck') || query.includes('brand') || query.includes('fuel') || query.includes('ev') || query.includes('electric') || query.includes('hybrid')) {
        targetType = 'Vehicle Registration';
        logs.push(`[Parse] Identified target record schema: 'Vehicle Registration'`);
    }
    
    // 2. Identify Target Region
    let targetRegion = null;
    for (const key in REGIONS) {
        if (query.includes(key)) {
            targetRegion = REGIONS[key];
            logs.push(`[Parse] Identified regional filter context: Region == '${targetRegion}'`);
            break;
        }
    }
    
    // 3. Identify Target Year
    let targetYear = null;
    const yearMatch = query.match(/\b(202[1-6])\b/);
    if (yearMatch) {
        targetYear = parseInt(yearMatch[1], 10);
        logs.push(`[Parse] Identified temporal filter context: Year == ${targetYear}`);
    }

    // 4. Identify Specific Indicators
    let fuelType = null;
    if (query.includes('electric') || query.includes('ev')) fuelType = 'Electric';
    else if (query.includes('hybrid')) fuelType = 'Hybrid';
    else if (query.includes('diesel')) fuelType = 'Diesel';
    else if (query.includes('petrol')) fuelType = 'Petrol';
    if (fuelType) logs.push(`[Parse] Identified fuel type attribute context: fuelType == '${fuelType}'`);

    let licenseClass = null;
    const classMatch = query.match(/\bclass\s+([a-f])\b/i);
    if (classMatch) {
        licenseClass = classMatch[1].toUpperCase();
        logs.push(`[Parse] Identified license classification: licenceClass == '${licenseClass}'`);
    }

    let status = null;
    if (query.includes('approved')) status = 'Approved';
    else if (query.includes('pending')) status = 'Pending';
    else if (query.includes('rejected')) status = 'Rejected';
    if (status) logs.push(`[Parse] Identified transaction status filter: status == '${status}'`);

    // 5. Map Phase (Filter data based on context)
    logs.push(`[Map] Spawning parallel filter map nodes across memory partitions...`);
    
    let filteredData = RAW_DATABASE;
    if (targetType) {
        filteredData = filteredData.filter(r => r.type === targetType);
    }
    if (targetRegion) {
        filteredData = filteredData.filter(r => r.region === targetRegion);
    }
    if (targetYear) {
        filteredData = filteredData.filter(r => r.year === targetYear);
    }
    if (fuelType) {
        filteredData = filteredData.filter(r => r.fuelType === fuelType);
    }
    if (licenseClass) {
        filteredData = filteredData.filter(r => r.licenceClass === licenseClass);
    }
    if (status) {
        filteredData = filteredData.filter(r => r.status === status);
    }

    logs.push(`[Map] Map phase complete. Output partition: ${filteredData.length} matching rows.`);
    
    // 6. Reduce / Aggregate Phase
    logs.push(`[Reduce] Allocating reducers for aggregation functions...`);
    
    if (query.includes('revenue') || query.includes('income') || query.includes('fee') || query.includes('cost') || query.includes('money')) {
        // Sum revenue
        const total = filteredData.reduce((sum, r) => r.status === 'Approved' ? sum + r.feePaid : sum, 0);
        const formatTotal = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', maximumFractionDigits: 0 }).format(total);
        message = `The total revenue collected for standard approved registrations matching your criteria is **${formatTotal}**.`;
        results = [{ Indicator: 'Total Revenue', Value: formatTotal, RecordsCount: filteredData.length }];
        logs.push(`[Reduce] Revenue reducer completed. Summarized value: GHS ${total}`);
    } 
    else if (query.includes('average age') || query.includes('mean age') || query.includes('how old')) {
        // Average Age
        const drivers = filteredData.filter(r => r.type === 'Driver Licence');
        if (drivers.length > 0) {
            const sumAge = drivers.reduce((sum, r) => sum + r.age, 0);
            const avg = Math.round(sumAge / drivers.length);
            message = `The average age of drivers matching your query is **${avg} years old** (based on ${drivers.length} drivers).`;
            results = [{ Indicator: 'Average Age', Value: `${avg} Years`, RecordsCount: drivers.length }];
            logs.push(`[Reduce] Age reducer completed. Calculated mean age: ${avg}`);
        } else {
            message = `Could not calculate average age. No driver licence records found for the requested filters.`;
            logs.push(`[Reduce] Age reducer failed. Reason: Division by zero (no driver records).`);
        }
    }
    else if (query.includes('gender') || query.includes('sex') || query.includes('male') || query.includes('female')) {
        // Gender distribution
        const maleCount = filteredData.filter(r => r.gender === 'Male').length;
        const femaleCount = filteredData.filter(r => r.gender === 'Female').length;
        const total = maleCount + femaleCount;
        if (total > 0) {
            const malePct = Math.round((maleCount / total) * 100);
            const femalePct = Math.round((femaleCount / total) * 100);
            message = `Gender distribution for drivers matching query:\n- **Male**: ${maleCount} (${malePct}%)\n- **Female**: ${femaleCount} (${femalePct}%)`;
            results = [
                { Gender: 'Male', Count: maleCount, Percentage: `${malePct}%` },
                { Gender: 'Female', Count: femaleCount, Percentage: `${femalePct}%` }
            ];
            logs.push(`[Reduce] Gender aggregation reducer completed.`);
        } else {
            message = `No gender data available. Filter yielded 0 driver records.`;
            logs.push(`[Reduce] Gender reducer skipped. Rowcount: 0.`);
        }
    }
    else if (query.includes('brand') || query.includes('make') || query.includes('toyota') || query.includes('tesla') || query.includes('byd')) {
        // Brand distribution
        const brandCounts = {};
        filteredData.forEach(r => {
            if (r.brand) {
                brandCounts[r.brand] = (brandCounts[r.brand] || 0) + 1;
            }
        });
        const sortedBrands = Object.entries(brandCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        if (sortedBrands.length > 0) {
            message = `Top vehicle brands registered matching query:\n` + 
                sortedBrands.map(([brand, count], idx) => `${idx + 1}. **${brand}**: ${count} registrations`).join('\n');
            results = sortedBrands.map(([brand, count]) => ({ Brand: brand, Registrations: count }));
            logs.push(`[Reduce] Vehicle brand frequency sorting completed.`);
        } else {
            message = `No vehicle brand distribution available. Filter yielded 0 vehicle records.`;
            logs.push(`[Reduce] Brand frequency reducer skipped.`);
        }
    }
    else if (query.includes('fuel') || query.includes('ev') || query.includes('electric') || query.includes('hybrid')) {
        // Fuel distribution
        const fuelCounts = { Petrol: 0, Diesel: 0, Hybrid: 0, Electric: 0 };
        filteredData.forEach(r => {
            if (r.fuelType) {
                fuelCounts[r.fuelType]++;
            }
        });
        message = `Vehicle Fuel Type distribution matching query:\n` +
            `- **Petrol**: ${fuelCounts.Petrol} registrations\n` +
            `- **Diesel**: ${fuelCounts.Diesel} registrations\n` +
            `- **Hybrid**: ${fuelCounts.Hybrid} registrations\n` +
            `- **Electric (EV)**: ${fuelCounts.Electric} registrations`;
            
        results = Object.entries(fuelCounts).map(([fuel, count]) => ({ 'Fuel Type': fuel, Registrations: count }));
        logs.push(`[Reduce] Fuel Type classification reducer completed.`);
    }
    else {
        // Default Count query
        const count = filteredData.length;
        const dl = filteredData.filter(r => r.type === 'Driver Licence').length;
        const vr = filteredData.filter(r => r.type === 'Vehicle Registration').length;
        
        let desc = "records";
        if (targetRegion) desc += ` in the **${targetRegion}** region`;
        if (targetYear) desc += ` for the year **${targetYear}**`;
        
        message = `Found a total of **${count}** active DVLA ${desc}:\n- **Driver Licences**: ${dl} registrations\n- **Vehicle Registrations**: ${vr} registrations`;
        results = [
            { Metric: 'Driver Licences', Count: dl },
            { Metric: 'Vehicle Registrations', Count: vr },
            { Metric: 'Total Records', Count: count }
        ];
        logs.push(`[Reduce] Rowcount accumulator reducer completed.`);
    }
    
    logs.push(`[BigDataEngine] Output batch formatted. Stream closed.`);
    return {
        query: queryString,
        message: message,
        logs: logs,
        results: results,
        records: filteredData.slice(0, 10) // Return first 10 rows for previews
    };
}
