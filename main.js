async (dataString) => {
  const parsedData = JSON.parse(dataString);
  if (!parsedData) return;
  const {
    VisualTrackDatas,
    EventInformations: events,
    MeasuredStationingStart: StationingStart,
    MeasuredStationingEnd: StationingEnd,
    PageWidth,
    ChartIndex,
    ModifiedSpeedElements,
    ParameterBlockIndex,
    ParameterPerPage,
    ChartParameters,
    LocalizationScale,
    BaseLengths: { GaugeChangeBaseLengths, TwistBaseLengths },
    TotalParameterCount,
    ConvertedNominalGauge,
    StationingLabels,
    LocalizedAttributes,
    HeaderTableUnitAttributes,
  } = parsedData;
  const widthRatio = LocalizationScale / 100;
  const mToPixel = 3.78 * 1000;
  const minDistanceForOverlapForLines = 20;
  const chartTypes = [];
  const { ChartTableAttributes } = LocalizedAttributes;
  const charts = [
    {
      id: "VersineVerticalRight",
      columnName: ChartTableAttributes.VersineVerticalRight,
      unit: HeaderTableUnitAttributes["VersineVerticalRight"],
    },
    {
      id: "VersineVerticalLeft",
      columnName: ChartTableAttributes.VersineVerticalLeft,
      unit: HeaderTableUnitAttributes["VersineVerticalLeft"],
    },
    {
      id: "VersineHorizontalRight",
      columnName: ChartTableAttributes.VersineHorizontalRight,
      unit: HeaderTableUnitAttributes["VersineHorizontalRight"],
    },
    {
      id: "VersineHorizontalLeft",
      columnName: ChartTableAttributes.VersineHorizontalLeft,
      unit: HeaderTableUnitAttributes["VersineHorizontalLeft"],
    },
    {
      id: "LongitudinalLevelD2Right",
      columnName: ChartTableAttributes.LongitudinalLevelD2Right,
      unit: HeaderTableUnitAttributes["LongitudinalLevelD2Right"],
    },
    {
      id: "LongitudinalLevelD2Left",
      columnName: ChartTableAttributes.LongitudinalLevelD2Left,
      unit: HeaderTableUnitAttributes["LongitudinalLevelD2Left"],
    },
    {
      id: "LongitudinalLevelD1Right",
      columnName: ChartTableAttributes.LongitudinalLevelD1Right,
      unit: HeaderTableUnitAttributes["LongitudinalLevelD1Right"],
    },
    {
      id: "LongitudinalLevelD1Left",
      columnName: ChartTableAttributes.LongitudinalLevelD1Left,
      unit: HeaderTableUnitAttributes["LongitudinalLevelD1Left"],
    },
    {
      id: "AlignmentD2Right",
      columnName: ChartTableAttributes.AlignmentD2Right,
      unit: HeaderTableUnitAttributes["AlignmentD2Right"],
    },
    {
      id: "AlignmentD2Left",
      columnName: ChartTableAttributes.AlignmentD2Left,
      unit: HeaderTableUnitAttributes["AlignmentD2Left"],
    },
    {
      id: "AlignmentD1Right",
      columnName: ChartTableAttributes.AlignmentD1Right,
      unit: HeaderTableUnitAttributes["AlignmentD1Right"],
    },
    {
      id: "AlignmentD1Left",
      columnName: ChartTableAttributes.AlignmentD1Left,
      unit: HeaderTableUnitAttributes["AlignmentD1Left"],
    },
    {
      id: "Cant",
      columnName: ChartTableAttributes.Cant,
      unit: HeaderTableUnitAttributes["Cant"],
    },
    {
      id: "GaugeDefect",
      columnName: ChartTableAttributes.Gauge,
      unit: HeaderTableUnitAttributes["GaugeDefect"],
    },
    ...(GaugeChangeBaseLengths.length
      ? GaugeChangeBaseLengths.map((value, index) => {
          return {
            id: `GaugeChange${index + 1}`,
            columnName: `${ChartTableAttributes.GaugeChange} ${value}${HeaderTableUnitAttributes["BaseLength"]}`,
            unit: HeaderTableUnitAttributes["GaugeDefect"],
          };
        })
      : []),
    ...(TwistBaseLengths.length
      ? TwistBaseLengths.map((value, index) => {
          return {
            id: `TwistBase${index + 1}`,
            columnName: `${ChartTableAttributes.Twist} ${value}${HeaderTableUnitAttributes["BaseLength"]}`,
            unit: HeaderTableUnitAttributes["Twist"],
          };
        })
      : []),
  ];
  const endingIndex = ParameterBlockIndex * ParameterPerPage;
  const startingIndex =
    (ParameterBlockIndex + 1) * ParameterPerPage > TotalParameterCount
      ? TotalParameterCount
      : (ParameterBlockIndex + 1) * ParameterPerPage;
  const paramCount = Math.abs(endingIndex - startingIndex);
  for (let i = startingIndex - 1; i >= endingIndex; i--) {
    let chart = charts.find(
      (chart) => chart.id === ChartParameters[i].ParameterName
    );
    if (chart) {
      chart = {
        ...chart,
        scale: Number(ChartParameters[i].Scale),
      };
      chartTypes.push(chart);
    }
  }
  chartTypes.push({
    id: "Localizations",
    columnName: `${ChartTableAttributes.Localization} ${ChartTableAttributes.Information}`,
    unit: HeaderTableUnitAttributes["LocalizationInformation"],
  });
  const chartContainerNode = document.createElement("div");
  chartContainerNode.classList.add("chartContainer");
  const chartContainerClass = "chartContainer" + StationingStart.toFixed(0);
  chartContainerNode.classList.add(chartContainerClass);
  const chartContainerWrapper = document.createElement("div");
  chartContainerWrapper.classList.add("chartContainerWrapper");
  chartContainerWrapper.append(chartContainerNode);
  document
    .querySelector("#measurement-chart-container")
    .appendChild(chartContainerWrapper);

  const dataPointGenerator = (values) => {
    const lineChartDataPoints = [];
    let minY = values?.[0]?.y;
    let maxY = values?.[0]?.y;
    values?.forEach((value) => {
      if (
        (value.x == null && Number.isNaN(value.x)) ||
        (value.y == null && Number.isNaN(value.y))
      ) {
        return;
      }
      lineChartDataPoints.push({ ...value });
      if (minY > value.y) {
        minY = value.y;
      }
      if (maxY < value.y) {
        maxY = value.y;
      }
    });
    return [lineChartDataPoints, minY, maxY];
  };

  const generateEventStriplines = (speedZones) => {
    const speedZoneLocalizations = speedZones.map(
      (speedZone) => speedZone.value
    );
    const eventStripLines = [];
    const checkEventSpeedZoneOverlap = (currentEventVal) => {
      let overlaps = false;
      speedZoneLocalizations.forEach((speedZone) => {
        if (
          getDistanceInPixel(Math.abs(currentEventVal - speedZone)) <
          minDistanceForOverlapForLines
        ) {
          overlaps = true;
        }
      });
      return overlaps;
    };
    events?.forEach((event) => {
      if (!checkEventSpeedZoneOverlap(event.MeasuredStationingStart)) {
        eventStripLines.push({
          value: event.MeasuredStationingStart,
          labelPlacement: "outside",
          lineDashType: "longDash",
          labelBackgroundColor: "transparent",
          color: "#000",
          label: `${
            event.ConvertedMappedStationingStart
          }, ${event.Abbr.toUpperCase()}${event.IsRange ? "\u25BC" : ""}`,
          showOnTop: true,
          labelFontColor: "#000",
          labelFontFamily: "Calibri",
          labelWrap: true,
          labelAlign: "near",
          labelAngle: 270,
          labelFontSize: 10,
          labelMaxWidth: 95,
        });
      }
      if (
        event.IsRange &&
        !checkEventSpeedZoneOverlap(event.MeasuredStationingEnd)
      ) {
        eventStripLines.push({
          value: event.MeasuredStationingEnd,
          labelPlacement: "outside",
          lineDashType: "longDash",
          color: "#000",
          labelBackgroundColor: "transparent",
          label: `${
            event.ConvertedMappedStationingEnd
          }, ${event.Abbr.toLowerCase()}\u25B2`,
          showOnTop: true,
          labelFontColor: "#000",
          labelFontFamily: "Calibri",
          labelWrap: true,
          labelAlign: "near",
          labelAngle: 270,
          labelFontSize: 10,
          labelMaxWidth: 90,
        });
      }
    });
    return eventStripLines;
  };

  const generateSpeedZoneStripLines = (speedZones) => {
    return speedZones.map((limit) => ({
      value: limit.value,
      labelPlacement: "outside",
      lineDashType: "longDashDot",
      color: "#000",
      label: `${limit.ConvertedMinSpeedLimit}<V<=${limit.ConvertedMaxSpeedLimit} \u25BC`,
      showOnTop: true,
      labelBackgroundColor: "transparent",
      labelFontColor: "#5a5a5a",
      labelFontFamily: "Calibri",
      labelAlign: "near",
      labelAngle: 270,
      labelFontSize: 10,
      labelMaxWidth: 75,
      labelWrap: true,
    }));
  };

  const getDistanceInPixel = (diff) => {
    return (diff / LocalizationScale) * mToPixel;
  };

  const generateLabelStripLines = (chartListLength, speedZones) => {
    const speedZoneLocalizations = speedZones.map(
      (speedZone) => speedZone.value
    );
    const eventLocalizations = [];
    let filteredStationingLabels = [...StationingLabels];
    events.forEach((event) => {
      eventLocalizations.push(event.MeasuredStationingStart);
      if (event.IsRange) {
        eventLocalizations.push(event.MeasuredStationingEnd);
      }
    });
    filteredStationingLabels = StationingLabels.filter((label) => {
      let overlapsWithEvent = false;
      let overlapsWithSpeedZone = false;
      eventLocalizations.forEach((event) => {
        if (
          getDistanceInPixel(Math.abs(event - label.MeasuredStationingPoint)) <
          minDistanceForOverlapForLines
        ) {
          overlapsWithEvent = true;
        }
      });
      speedZoneLocalizations.forEach((speedZone) => {
        if (
          getDistanceInPixel(
            Math.abs(speedZone - label.MeasuredStationingPoint)
          ) < minDistanceForOverlapForLines
        ) {
          overlapsWithSpeedZone = true;
        }
      });
      return !(overlapsWithEvent || overlapsWithSpeedZone);
    });
    return filteredStationingLabels.map((label) => ({
      value: label.MeasuredStationingPoint,
      labelPlacement: "outside",
      lineDashType: "dot",
      color: "#000",
      label:
        chartListLength === paramCount
          ? `${label.ConvertedMappedStationingPoint}`
          : "",
      showOnTop: true,
      labelBackgroundColor: "transparent",
      labelFontColor: "#000",
      labelFontFamily: "Calibri",
      labelWrap: false,
      labelAlign: "near",
      labelAngle: 270,
      labelMaxWidth: 90,
      labelWrap: true,
      labelAutoFit: true,
      labelFontWeight: "lighter",
      labelFontSize: 10,
    }));
  };

  const createNewParameterNode = (chartParameterIdAttr) => {
    const rowNode = document.createElement("div");
    rowNode.classList.add("row");
    const headerColumnNode = document.createElement("div");
    headerColumnNode.classList.add("chartColumnName");
    const columnParagraph = document.createElement("p");
    headerColumnNode.appendChild(columnParagraph);
    const chartColumnNode = document.createElement("div");
    chartColumnNode.classList.add("chart");
    chartColumnNode.id = chartParameterIdAttr;
    rowNode.appendChild(headerColumnNode);
    rowNode.appendChild(chartColumnNode);
    document.querySelector(`.${chartContainerClass}`).append(rowNode);
  };

  const addLabels = (index, param) => {
    const node = document.querySelector(
      `.${chartContainerClass} .row:nth-of-type(${index + 1}) p`
    );
    if (index === paramCount) {
      node.innerHTML = `${ChartTableAttributes.Localization} ${ChartTableAttributes.Information} [${param.unit}]`;
      return;
    }
    node.innerHTML = `${param.columnName} <br> 1:${param.scale.toFixed(0)} [${
      param.unit
    }]`;
  };

  const generateContinuousRow = (rowNum, className) => {
    const contChartParameterIdAttr = `chart-${ChartIndex}${rowNum + 1}`;
    createNewParameterNode(contChartParameterIdAttr);
    const row = document.querySelector(`.row:last-of-type`);
    row.classList.add("row-continuous");
    row.classList.add(className);
    document.querySelector(`#${contChartParameterIdAttr}`).style.width = `${
      PageWidth - 1
    }px`;
    document.querySelector(`#${contChartParameterIdAttr}`).style.maxHeight = `${
      (1072 / 6) * (paramCount + 1)
    }px`;
    document.querySelector(`#${contChartParameterIdAttr}`).style.height = `${
      (1072 / 6) * (paramCount + 1)
    }px`;
    document.querySelector(
      `#${contChartParameterIdAttr}`
    ).parentNode.style.minHeight = `${(1072 / 6) * (paramCount + 1)}px`;
    return contChartParameterIdAttr;
  };

  const createNodeWithContinuousLines = (
    index,
    labelStripLines,
    continuousLocalizationPoints,
    speedZones
  ) => {
    const eventIndex = index;
    const speedZoneIndex = index + 1;
    const localizationLabelIndex = index + 2;
    const contChartParameterIdAttrEvent = generateContinuousRow(
      eventIndex,
      "event"
    );
    const contChartParameterIdAttrSpeedZone = generateContinuousRow(
      speedZoneIndex,
      "speed-zone"
    );
    const contChartParameterIdAttrLocalizationLabel = generateContinuousRow(
      localizationLabelIndex,
      "localization-label"
    );
    const eventStripLines = generateEventStriplines(speedZones);
    const speedZoneStripLines = generateSpeedZoneStripLines(speedZones);
    const contChartData = {
      height: (1072 / 6) * (paramCount + 1),
      backgroundColor: "transparent",
      axisX2: {
        minimum: StationingStart - 0.2 * widthRatio,
        maximum: StationingEnd + 0.2 * widthRatio,
        lineThickness: 0,
        gridThickness: 0,
        tickLength: 0,
        tickPlacement: "inside",
        labelPlacement: "inside",
        labelAutoFit: true,
        labelWrap: false,
        labelFontWeight: "lighter",
        labelFormatter: () => "",
        crosshair: {
          enabled: true,
          snapToDataPoint: true,
          lineDashType: "solid",
          labelFormatter: () => "",
        },
      },
      axisY: {
        titleWrap: false,
        lineThickness: 0,
        gridThickness: 0,
        tickLength: 0,
        labelFormatter: () => "",
        labelAutoFit: true,
        labelFontSize: 11,
      },
      axisX: {
        minimum: StationingStart - 0.2 * widthRatio,
        maximum: StationingEnd + 0.2 * widthRatio,
        tickLength: 0,
        labelAutoFit: true,
        labelWrap: false,
        labelFontWeight: "lighter",
        labelFontSize: 10,
        labelFormatter: () => "",
        labelAngle: 270,
        gridThickness: 0,
        lineThickness: 0,
      },
      data: [
        {
          type: "line",
          lineDashType: "solid",
          axisXType: "primary",
          markerSize: 0,
          dataPoints: continuousLocalizationPoints,
          lineColor: "transparent",
          lineThickness: 0.8,
        },
      ],
    };
    const continuousChartWithSpeedZones = {
      ...contChartData,
      axisX: {
        ...contChartData.axisX,
        stripLines: [...speedZoneStripLines],
      },
    };
    const continuousChartWithEvents = {
      ...contChartData,
      axisX: {
        ...contChartData.axisX,
        stripLines: [...eventStripLines],
      },
    };
    const continuousChartWithLocalizationLabels = {
      ...contChartData,
      axisX: {
        ...contChartData.axisX,
        stripLines: [...labelStripLines],
      },
    };
    const commonOptions = {
      backgroundColor: "transparent",
      animationEnabled: false,
      rangeSelector: {
        enabled: false,
      },
      navigator: {
        enabled: false,
      },
    };
    const continuousChartOptionsWithEvents = {
      ...commonOptions,
      charts: [continuousChartWithEvents],
    };
    const continuousChartOptionsWithSpeedZones = {
      ...commonOptions,
      charts: [continuousChartWithSpeedZones],
    };
    const continuousChartOptionsWithLocalizationLabels = {
      ...commonOptions,
      charts: [continuousChartWithLocalizationLabels],
    };
    //render events stockchart
    const contStockChartEvents = new CanvasJS.StockChart(
      `${contChartParameterIdAttrEvent}`,
      continuousChartOptionsWithEvents
    );
    contStockChartEvents.render();
    contStockChartEvents.charts[0].axisY[0].set(
      "margin",
      35 -
        contStockChartEvents.charts[0].axisY[0].bounds.x2 -
        contStockChartEvents.charts[0].axisY[0].bounds.x1
    );
    //render speedZones stockchart
    const contStockChartSpeedZones = new CanvasJS.StockChart(
      `${contChartParameterIdAttrSpeedZone}`,
      continuousChartOptionsWithSpeedZones
    );
    contStockChartSpeedZones.render();
    //render localization labels stock chart
    const contStockChartLocalizationLabels = new CanvasJS.StockChart(
      `${contChartParameterIdAttrLocalizationLabel}`,
      continuousChartOptionsWithLocalizationLabels
    );
    contStockChartLocalizationLabels.render();
  };

  const newChartData = {};
  let chartData = {};
  if (VisualTrackDatas?.length) {
    VisualTrackDatas.forEach((row) => {
      row.ParameterValues.forEach((cell) => {
        if (!newChartData[cell.Id]) newChartData[cell.Id] = [];
        newChartData[cell.Id].push({
          x: row.Stationing.Value,
          y: cell.Value,
        });
      });
    });
    chartData = chartTypes.reduce(
      (prev, current) => ({
        ...prev,
        [current.id]: newChartData[current.id],
      }),
      {}
    );
    const withLocalization = { ...chartData, Localizations: [] };
    chartData = withLocalization;
  }
  if (chartData) {
    let index = 0;
    const chartList = [];
    const speedZones = ModifiedSpeedElements.map((speedElement) => ({
      value: speedElement.MeasuredStationingStart,
      MinSpeed: speedElement.MinSpeedDisplayValue,
      MaxSpeed: speedElement.MaxSpeedDisplayValue,
      ConvertedMinSpeedLimit: speedElement.ConvertedMinSpeedLimit,
      ConvertedMaxSpeedLimit: speedElement.ConvertedMaxSpeedLimit,
    }));
    let labelStripLines = [];
    let continuousLocalizationPoints = [];
    for (const [key, value] of Object.entries(chartData)) {
      const param = chartTypes.find((paramItem) => paramItem.id === key);
      if (param) {
        let [lineChartDataPoints, minY, maxY] = dataPointGenerator(value);
        if (!continuousLocalizationPoints.length) {
          continuousLocalizationPoints = lineChartDataPoints.map((point) => ({
            x: point.x,
            y: 0,
          }));
        }
        labelStripLines = generateLabelStripLines(chartList.length, speedZones);
        let referenceLine = 0;
        if (
          param.id.toLowerCase().indexOf("versine") !== -1 ||
          param.id.toLowerCase().indexOf("cant") !== -1
        ) {
          referenceLine = Math.round((maxY - minY) / 2 + minY);
        }
        maxY = Math.max(maxY, 0);
        minY = Math.min(minY, 0);
        if (minY === 0) {
          minY = -0.002;
        }
        if (maxY === 0) {
          maxY = 0.002;
        }
        const amplitude =
          (Math.abs(maxY - referenceLine) / param.scale) * mToPixel;
        let height = Math.round(
          (Math.abs(maxY - minY) / param.scale) * mToPixel + 13
        );
        if (height < 20 || height === Infinity) {
          height = 20;
        }
        if (chartList.length === paramCount) {
          height = 1072 / 6 - 1; //full available height for row
        }
        chartList.push({
          height: height,
          backgroundColor:
            chartList.length % 2 === 0 ? "#efefef" : "transparent",
          axisX2: {
            minimum: StationingStart - 0.2 * widthRatio,
            maximum: StationingEnd + 0.2 * widthRatio,
            lineThickness: 0,
            gridThickness: 0,
            tickLength: 0,
            tickPlacement: "inside",
            labelPlacement: "inside",
            labelAutoFit: true,
            labelWrap: false,
            labelFontWeight: "lighter",
            labelFormatter: () => "",
            crosshair: {
              enabled: true,
              snapToDataPoint: true,
              lineDashType: "solid",
              labelFormatter: () => "",
            },
          },
          axisY: {
            titleWrap: false,
            lineThickness: 0,
            gridThickness: 0,
            tickLength: 0,
            maximum: maxY + 0.001,
            minimum: minY - 0.001,
            labelFormatter: () => "",
            labelAutoFit: true,
            labelFontSize: 11,
            stripLines: [
              {
                value: referenceLine,
                labelAutoFit: true,
                labelPlacement: "outside",
                lineDashType: "solid",
                color: "#000",
                label:
                  param.id.toLowerCase().indexOf("gaugedefect") !== -1
                    ? ConvertedNominalGauge
                    : referenceLine.toFixed(0),
                showOnTop: true,
                labelFontColor: "#000",
                labelFontFamily: "Calibri",
                labelWrap: false,
                labelAlign: "near",
                labelBackgroundColor: "transparent",
                labelFontSize: 11,
                labelMaxWidth: 30,
              },
            ],
          },
          axisX: {
            minimum: StationingStart - 0.2 * widthRatio,
            maximum: StationingEnd + 0.2 * widthRatio,
            tickLength: 0,
            labelAutoFit: true,
            labelWrap: false,
            labelFontWeight: "lighter",
            labelFontSize: 10,
            labelFormatter: () => "",
            labelAngle: 270,
            ...(index === paramCount
              ? {
                  gridThickness: 0,
                  lineThickness: 0,
                }
              : null),
          },
          data: [
            {
              type: "line",
              lineDashType: "solid",
              axisXType:
                chartList.length === paramCount ? "primary" : "secondary",
              markerSize: 0,
              dataPoints: lineChartDataPoints,
              lineColor: "black",
              lineThickness: 0.8,
            },
          ],
        });
        const options = {
          animationEnabled: false,
          charts: [chartList[chartList.length - 1]],
          rangeSelector: {
            enabled: false,
          },
          navigator: {
            enabled: false,
          },
        };
        const chartParameterIdAttr = `chart-${ChartIndex}${index + 1}`;
        createNewParameterNode(chartParameterIdAttr);
        addLabels(index, param);
        document.querySelector(`#${chartParameterIdAttr}`).style.width = `${
          PageWidth - 1
        }px`;
        document.querySelector(
          `#${chartParameterIdAttr}`
        ).style.height = `${height}px`;
        const stockChart = new CanvasJS.StockChart(
          `${chartParameterIdAttr}`,
          options
        );
        stockChart.render();
        stockChart.charts[0].axisY[0].set(
          "margin",
          35 -
            stockChart.charts[0].axisY[0].bounds.x2 -
            stockChart.charts[0].axisY[0].bounds.x1
        );
        const referenceLineInTopHalf = (halfOfColumnHeight) => {
          return amplitude < halfOfColumnHeight;
        };
        if (chartList.length <= paramCount) {
          const columnHeight = 1071 / 6;
          let shift = columnHeight / 2 - amplitude;
          let amplitudeToPixelAdjustment = -10;
          if (!referenceLineInTopHalf(columnHeight / 2)) {
            if (Math.abs(shift) > columnHeight / 2) {
              amplitudeToPixelAdjustment = 0;
            } else {
              amplitudeToPixelAdjustment = -4;
            }
            if (shift > 0) {
              shift = shift * -1;
            }
          }
          shift = shift + amplitudeToPixelAdjustment;
          document.querySelector(
            `#${chartParameterIdAttr}`
          ).style.transform = `translate(0, ${shift}px)`;
        }
        index++;
      }
    }
    createNodeWithContinuousLines(
      index,
      labelStripLines,
      continuousLocalizationPoints,
      speedZones
    );
    if (ParameterPerPage > paramCount) {
      document
        .querySelector(".chartContainer:last-of-type .row:first-of-type")
        .classList.add("add-top-border");
    }
    document.querySelector(`.${chartContainerClass}`).style.width = `${
      PageWidth + 38
    }px`;
    document.querySelector(
      `.${chartContainerClass}`
    ).parentNode.style.maxHeight = `${PageWidth + 38 + 4}px`;
  }
};
