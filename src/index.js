/*
 * LightningChartJS example that showcases usage of Dashboard for trading.
 */
// Import LightningChartJS
const lcjs = require('@arction/lcjs')

// Extract required parts from LightningChartJS.
const {
    lightningChart,
    AxisTickStrategies,
    LegendBoxBuilders,
    SolidFill,
    SolidLine,
    emptyLine,
    ColorRGBA,
    UIOrigins
} = lcjs

// Import data-generator from 'xydata'-library.
const {
    createOHLCGenerator,
    createProgressiveTraceGenerator
} = require('@arction/xydata')

// Create dashboard to house two charts
const db = lightningChart().Dashboard({
    numberOfRows: 2,
    numberOfColumns: 1
})

// Decide on an origin for DateTime axis.
const dateOrigin = new Date(2018, 0, 1)
// Chart that contains the OHLC candle stick series and Bollinger band
const chartOHLC = db.createChartXY({
    columnIndex: 0,
    rowIndex: 0, 
    columnSpan: 1, 
    rowSpan: 1, 
    chartXYOptions: { defaultAxisXTickStrategy: AxisTickStrategies.DateTime(dateOrigin) }
})
    .setTitle('Trading dashboard')
    // Style AutoCursor using preset.
    .setAutoCursor(cursor => {
        cursor.disposeTickMarkerY()
        cursor.setGridStrokeYStyle(emptyLine)
    })
    .setPadding({ right: 40 })

// The top chart should have 66% of view height allocated to it. By giving the first row a height of 2, the relative
// height of the row becomes 2/3 of the whole view (default value for row height / column width is 1)
db.setRowHeight(0, 2)

// Create a LegendBox for Candle-Stick and Bollinger Band
const legendBoxOHLC = chartOHLC.addLegendBox(LegendBoxBuilders.HorizontalLegendBox)
    .setPosition({ x: 100, y: 100 })
    .setOrigin(UIOrigins.RightTop)

// Define function which sets Y axis intervals nicely.
let setViewNicely

// Create OHLC Figures and Area-range.
//#region

// Get Y-axis for series (view is set manually).
const stockAxisY = chartOHLC.getDefaultAxisY()
    .setScrollStrategy(undefined)
    .setTitle('USD')
// Add series.
const areaRangeFill = new SolidFill().setColor(ColorRGBA(100, 149, 237, 50))
const areaRangeStroke = new SolidLine()
    .setFillStyle(new SolidFill().setColor(ColorRGBA(100, 149, 237)))
    .setThickness(1)
const areaRange = chartOHLC.addAreaRangeSeries({ yAxis: stockAxisY })
    .setName('Bollinger band')
    .setHighFillStyle(areaRangeFill)
    .setLowFillStyle(areaRangeFill)
    .setHighStrokeStyle(areaRangeStroke)
    .setLowStrokeStyle(areaRangeStroke)
    .setMouseInteractions(false)
    .setCursorEnabled(false)

const stockFigureWidth = 5.0
const borderBlack = new SolidLine().setFillStyle(new SolidFill().setColor(ColorRGBA(0, 0, 0))).setThickness(1.0)
const fillBrightRed = new SolidFill().setColor(ColorRGBA(255, 0, 0))
const fillDimRed = new SolidFill().setColor(ColorRGBA(128, 0, 0))
const fillBrightGreen = new SolidFill().setColor(ColorRGBA(0, 255, 0))
const fillDimGreen = new SolidFill().setColor(ColorRGBA(0, 128, 0))
const stock = chartOHLC.addOHLCSeries({ yAxis: stockAxisY })
    .setName('Candle-Sticks')
    // Setting width of figures
    .setFigureWidth(stockFigureWidth)
    // Styling positive candlestick
    .setPositiveStyle(candlestick => candlestick
        // Candlestick body fill style
        .setBodyFillStyle(fillBrightGreen)
        // Candlestick body fill style
        .setBodyStrokeStyle(borderBlack)
        // Candlestick stroke style
        .setStrokeStyle((strokeStyle) => strokeStyle.setFillStyle(fillDimGreen))
    )
    .setNegativeStyle(candlestick => candlestick
        .setBodyFillStyle(fillBrightRed)
        .setBodyStrokeStyle(borderBlack)
        .setStrokeStyle((strokeStyle) => strokeStyle.setFillStyle(fillDimRed))
    )

// Make function that handles adding OHLC segments to series.
const add = (ohlc) => {
    // ohlc is equal to [x, open, high, low, close]
    stock.add(ohlc)
    // AreaRange looks better if it extends a bit further than the actual OHLC values.
    const areaOffset = 0.2
    areaRange.add(
        {
            position: ohlc[0],
            high: ohlc[2] - areaOffset,
            low: ohlc[3] + areaOffset,

        }
    )
}

// Generate some static data.
createOHLCGenerator()
    .setNumberOfPoints(100)
    .setDataFrequency(24 * 60 * 60 * 1000)
    .generate()
    .toPromise()
    .then(data => {
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
    chartXYOptions: { defaultAxisXTickStrategy: AxisTickStrategies.DateTime(dateOrigin) }
})

    .setTitle('Volume')
    .setPadding({ right: 40 })
// Create a LegendBox as part of the chart.
const legendBoxVolume = chartVolume.addLegendBox(LegendBoxBuilders.HorizontalLegendBox)
    .setPosition({ x: 100, y: 100 })
    .setOrigin(UIOrigins.RightTop)

// Create Y-axis for series (view is set manually).
const volumeAxisY = chartVolume.getDefaultAxisY()
    .setTitle('USD')
    // Modify TickStyle to hide gridstrokes.
    .setTickStyle(visibleTicks => visibleTicks
        .setGridStrokeStyle(emptyLine)
    )

const volumeFillStyle = new SolidFill().setColor(ColorRGBA(0, 128, 128, 60))
const volumeStrokeStyle = new SolidLine()
    .setFillStyle(volumeFillStyle.setA(255))
    .setThickness(1)
const volume = chartVolume.addAreaSeries({ yAxis: volumeAxisY })
    .setName('Volume')
    .setFillStyle(volumeFillStyle)
    .setStrokeStyle(volumeStrokeStyle)

createProgressiveTraceGenerator()
    .setNumberOfPoints(990)
    .generate()
    .toPromise()
    .then(data => {
        volume.add(data.map(point => ({ x: point.x * 2.4 * 60 * 60 * 1000, y: Math.abs(point.y) * 10 })))
        setViewNicely()
    })

//#endregion


// Add series to LegendBox and style entries.
const entries1 = legendBoxOHLC.add(chartOHLC)
entries1[0]
    .setButtonOnFillStyle(areaRangeStroke.getFillStyle())
    .setButtonOnStrokeStyle(emptyLine)

const entries2 = legendBoxVolume.add(chartVolume)
entries2[0]
    .setButtonOnFillStyle(volumeStrokeStyle.getFillStyle())
    .setButtonOnStrokeStyle(emptyLine)

setViewNicely = () => {
    const yBoundsStock = { min: areaRange.getYMin(), max: areaRange.getYMax(), range: areaRange.getYMax() - areaRange.getYMin() }
    const yBoundsVolume = { min: volume.getYMin(), max: volume.getYMax(), range: volume.getYMax() - volume.getYMin() }
    // Set Y axis intervals so that series don't overlap and volume is under stocks.
    volumeAxisY.setInterval(yBoundsVolume.min, yBoundsVolume.max)
    stockAxisY.setInterval(yBoundsStock.min - yBoundsStock.range * .33, yBoundsStock.max)
}

stock.setResultTableFormatter((builder, series, segment) => {
    return builder
        .addRow(series.getName())
        .addRow(series.axisX.formatValue(segment.getPosition()))
        .addRow('Open ' + segment.getOpen().toFixed(2))
        .addRow('High ' + segment.getHigh().toFixed(2))
        .addRow('Low ' + segment.getLow().toFixed(2))
        .addRow('Close ' + segment.getClose().toFixed(2))
})

volume.setResultTableFormatter((builder, series, position, high, low) => {
    return builder
        .addRow(series.getName())
        .addRow(series.axisX.formatValue(position))
        .addRow('Value ' + Math.round(high))
        .addRow('Base ' + Math.round(low))
})
