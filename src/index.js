/*
 * LightningChartJS example that showcases usage of Dashboard for trading.
 */
// Import LightningChartJS
const lcjs = require('@lightningchart/lcjs')

// Import xydata
const xydata = require('@lightningchart/xydata')

// Extract required parts from LightningChartJS.
const { lightningChart, AxisTickStrategies, LegendBoxBuilders, emptyLine, SolidFill, SolidLine, Themes } = lcjs

// Import data-generator from 'xydata'-library.
const { createOHLCGenerator, createProgressiveTraceGenerator } = xydata

// Create dashboard to house two charts
// NOTE: Using `Dashboard` is no longer recommended for new applications. Find latest recommendations here: https://lightningchart.com/js-charts/docs/basic-topics/grouping-charts/
const db = lightningChart({
            resourcesBaseUrl: new URL(document.head.baseURI).origin + new URL(document.head.baseURI).pathname + 'resources/',
        }).Dashboard({
    theme: Themes[new URLSearchParams(window.location.search).get('theme') || 'darkGold'] || undefined,
    numberOfRows: 2,
    numberOfColumns: 1,
})
const theme = db.getTheme()

// Decide on an origin for DateTime axis.
const dateOrigin = new Date(2018, 0, 1)
const dateOriginTime = dateOrigin.getTime()

// Chart that contains the OHLC candle stick series and Bollinger band
const chartOHLC = db.createChartXY({
    columnIndex: 0,
    rowIndex: 0,
    columnSpan: 1,
    rowSpan: 1,
})
// Use DateTime TickStrategy with custom date origin for X Axis.
chartOHLC.getDefaultAxisX().setTickStrategy(AxisTickStrategies.DateTime, (tickStrategy) => tickStrategy.setDateOrigin(dateOrigin))
// Modify Chart.
chartOHLC
    .setTitle('Trading dashboard')
    //Style AutoCursor.
    .setCursor((cursor) => {
        cursor.setTickMarkerYVisible(false)
        cursor.setGridStrokeYStyle(emptyLine)
    })
    .setPadding({ right: 40 })

// The top chart should have 66% of view height allocated to it. By giving the first row a height of 2, the relative
// height of the row becomes 2/3 of the whole view (default value for row height / column width is 1)
db.setRowHeight(0, 2)

// Create a LegendBox for Candle-Stick and Bollinger Band
const legendBoxOHLC = chartOHLC
    .addLegendBox(LegendBoxBuilders.VerticalLegendBox)
    // Dispose example UI elements automatically if they take too much space. This is to avoid bad UI on mobile / etc. devices.
    .setAutoDispose({
        type: 'max-width',
        maxWidth: 0.3,
    })

// Define function which sets Y axis intervals nicely.
let setViewNicely

// Create OHLC Figures and Area-range.
//#region

// Get Y-axis for series (view is set manually).
const stockAxisY = chartOHLC
    .getDefaultAxisY()
    .setScrollStrategy(undefined)
    .setTitle('USD')
    // Synchronize left margins of the stacked charts by assigning a static Y Axis thickness for both.
    .setThickness(80)

// Add series.
const areaRange = chartOHLC
    .addAreaRangeSeries({ yAxis: stockAxisY })
    .setLowFillStyle(theme.examples.bollingerFillStyle)
    .setHighFillStyle(theme.examples.bollingerFillStyle)
    .setLowStrokeStyle(new SolidLine({ thickness: 1, fillStyle: theme.examples.bollingerBorderFillStyle }))
    .setHighStrokeStyle(new SolidLine({ thickness: 1, fillStyle: theme.examples.bollingerBorderFillStyle }))
    .setName('Bollinger band')
    .setCursorEnabled(false)

const stockFigureWidth = 5.0
const stock = chartOHLC
    .addOHLCSeries({ yAxis: stockAxisY })
    .setName('Candle-Sticks')
    // Setting width of figures
    .setFigureWidth(stockFigureWidth)

// Make function that handles adding OHLC segments to series.
const add = (ohlc) => {
    // ohlc is equal to [x, open, high, low, close]
    stock.add(ohlc)
    // AreaRange looks better if it extends a bit further than the actual OHLC values.
    const areaOffset = 0.2
    areaRange.add({
        position: ohlc[0],
        high: ohlc[2] - areaOffset,
        low: ohlc[3] + areaOffset,
    })
}

const dataFrequency = 2.4 * 60 * 60 * 1000

// Generate some static data.
createOHLCGenerator()
    .setNumberOfPoints(100)
    .generate()
    .toPromise()
    // Map x datapoints to start from date origin with the frequency of dataFrequency
    .then((data) =>
        data.map((innerArray) => {
            innerArray[0] = dateOriginTime + innerArray[0] * dataFrequency
            return innerArray
        }),
    )
    // Shift the data by dateOriginTime
    .then((data) =>
        data.map((innerArray) => {
            innerArray[0] = innerArray[0] - dateOriginTime
            return innerArray
        }),
    )
    .then((data) => {
        data.forEach(add)
        setViewNicely()
    })

//#endregion

// Create volume.
//#region
const chartVolume = db.createChartXY({
    columnIndex: 0,
    rowIndex: 1,
    columnSpan: 1,
    rowSpan: 1,
})
// Use DateTime TickStrategy with custom date origin for X Axis.
chartVolume.getDefaultAxisX().setTickStrategy(AxisTickStrategies.DateTime, (tickStrategy) => tickStrategy.setDateOrigin(dateOrigin))
// Modify Chart.
chartVolume.setTitle('Volume').setPadding({ right: 40 })
// Create a LegendBox as part of the chart.
const legendBoxVolume = chartVolume
    .addLegendBox(LegendBoxBuilders.VerticalLegendBox)
    // Dispose example UI elements automatically if they take too much space. This is to avoid bad UI on mobile / etc. devices.
    .setAutoDispose({
        type: 'max-width',
        maxWidth: 0.3,
    })

// Create Y-axis for series (view is set manually).
const volumeAxisY = chartVolume
    .getDefaultAxisY()
    .setTitle('USD')
    // Synchronize left margins of the stacked charts by assigning a static Y Axis thickness for both.
    .setThickness(80)
const volume = chartVolume.addAreaSeries({ yAxis: volumeAxisY }).setName('Volume')

createProgressiveTraceGenerator()
    .setNumberOfPoints(990)
    .generate()
    .toPromise()
    // Map random generated data to start from a particular datewith the frequency of dataFrequency
    .then((data) =>
        data.map((point) => ({
            x: dateOriginTime + point.x * dataFrequency,
            y: Math.abs(point.y) * 10,
        })),
    )
    // shift the data by dateOriginTime
    .then((data) =>
        data.map((p) => ({
            x: p.x - dateOriginTime,
            y: p.y,
        })),
    )
    .then((data) => {
        volume.add(data)
        setViewNicely()
    })

//#endregion

// Add series to LegendBox.
legendBoxOHLC.add(chartOHLC)
legendBoxVolume.add(chartVolume)

setViewNicely = () => {
    const yBoundsStock = { min: areaRange.getYMin(), max: areaRange.getYMax(), range: areaRange.getYMax() - areaRange.getYMin() }
    const yBoundsVolume = { min: volume.getYMin(), max: volume.getYMax(), range: volume.getYMax() - volume.getYMin() }
    // Set Y axis intervals so that series don't overlap and volume is under stocks.
    volumeAxisY.setInterval({ start: yBoundsVolume.min, end: yBoundsVolume.max, stopAxisAfter: false })
    stockAxisY.setInterval({ start: yBoundsStock.min - yBoundsStock.range * 0.33, end: yBoundsStock.max, stopAxisAfter: false })
}