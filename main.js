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
    NominalGauge,
    StationingLabels,
    LocalizedAttributes,
  } = parsedData;
  const widthRatio = LocalizationScale / 100;
  const chartTypes = [];
  const { ChartTableAttributes } = LocalizedAttributes;
  const charts = [
    {
      id: "VersineVerticalRight",
      columnName: ChartTableAttributes.VersineVerticalRight,
    },
    {
      id: "VersineVerticalLeft",
      columnName: ChartTableAttributes.VersineVerticalLeft,
    },
    {
      id: "VersineHorizontalRight",
      columnName: ChartTableAttributes.VersineHorizontalRight,
    },
    {
      id: "VersineHorizontalLeft",
      columnName: ChartTableAttributes.VersineHorizontalLeft,
    },
    {
      id: "LongitudinalLevelD2Right",
      columnName: ChartTableAttributes.LongitudinalLevelD2Right,
    },
    {
      id: "LongitudinalLevelD2Left",
      columnName: ChartTableAttributes.LongitudinalLevelD2Left,
    },
    {
      id: "LongitudinalLevelD1Right",
      columnName: ChartTableAttributes.LongitudinalLevelD1Right,
    },
    {
      id: "LongitudinalLevelD1Left",
      columnName: ChartTableAttributes.LongitudinalLevelD1Left,
    },
    {
      id: "AlignmentD2Right",
      columnName: ChartTableAttributes.AlignmentD2Right,
    },
    {
      id: "AlignmentD2Left",
      columnName: ChartTableAttributes.AlignmentD2Left,
    },
    {
      id: "AlignmentD1Right",
      columnName: ChartTableAttributes.AlignmentD1Right,
    },
    {
      id: "AlignmentD1Left",
      columnName: ChartTableAttributes.AlignmentD1Left,
    },
    {
      id: "Cant",
      columnName: ChartTableAttributes.Cant,
    },
    {
      id: "GaugeDefect",
      columnName: ChartTableAttributes.Gauge,
    },
    ...(GaugeChangeBaseLengths.length
      ? GaugeChangeBaseLengths.map((value, index) => {
          return {
            id: `GaugeChange${index + 1}`,
            columnName: `${ChartTableAttributes.GaugeChange} ${value}m`,
          };
        })
      : []),
    ...(TwistBaseLengths.length
      ? TwistBaseLengths.map((value, index) => {
          return {
            id: `TwistBase${index + 1}`,
            columnName: `${ChartTableAttributes.Twist} ${value}m`,
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

  const generateEventStriplines = (chartListLength) => {
    const eventStripLines = [];
    events?.forEach((event) => {
      eventStripLines.push({
        value: event.MeasuredStationingStart,
        labelPlacement: "outside",
        lineDashType: "longDash",
        labelBackgroundColor: "transparent",
        color: "#000",
        label:
          chartListLength === paramCount
            ? `${event.MappedStationingStart.toFixed(
                2
              )}, ${event.Abbr.toUpperCase()}${event.IsRange ? "\u25BC" : ""}`
            : "",
        showOnTop: true,
        labelFontColor: "#000",
        labelFontFamily: "Calibri",
        labelWrap: true,
        labelAlign: "near",
        labelAngle: 270,
        labelFontSize: 11,
        labelMaxWidth: 130,
      });
      if (event.IsRange) {
        eventStripLines.push({
          value: event.MeasuredStationingEnd,
          labelPlacement: "outside",
          lineDashType: "longDash",
          color: "#000",
          labelBackgroundColor: "transparent",
          label:
            chartListLength === paramCount
              ? `${event.MappedStationingEnd.toFixed(
                  2
                )}, ${event.Abbr.toLowerCase()}\u25B2`
              : "",
          showOnTop: true,
          labelFontColor: "#000",
          labelFontFamily: "Calibri",
          labelWrap: true,
          labelAlign: "near",
          labelAngle: 270,
          labelFontSize: 11,
          labelMaxWidth: 130,
        });
      }
    });
    return eventStripLines;
  };

  const generateSpeedZoneStripLines = (speedZones, chartListLength) => {
    return speedZones.map((limit) => ({
      value: limit.value,
      labelPlacement: "outside",
      lineDashType: "longDashDot",
      color: "#000",
      label:
        chartListLength === paramCount
          ? `${limit.MinSpeed}<V<=${limit.MaxSpeed} \u25BC`
          : "",
      showOnTop: true,
      labelBackgroundColor: "transparent",
      labelFontColor: "#5a5a5a",
      labelFontFamily: "Calibri",
      labelWrap: false,
      labelAlign: "near",
      labelAngle: 270,
      labelFontSize: 11,
      labelMaxWidth: 130,
      labelWrap: true,
    }));
  };

  const generateLabelStripLines = (chartListLength) => {
    return StationingLabels.map((label) => ({
      value: label.MeasuredStationingPoint,
      labelPlacement: "outside",
      lineDashType: "solid",
      color: "transparent",
      label:
        chartListLength === paramCount ? `${label.MappedStationingPoint}` : "",
      showOnTop: true,
      labelBackgroundColor: "transparent",
      labelFontColor: "#000",
      labelFontFamily: "Calibri",
      labelWrap: false,
      labelAlign: "near",
      labelAngle: 270,
      labelMaxWidth: 130,
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

  const addLabels = (index, columnName, scale) => {
    const node = document.querySelector(
      `.${chartContainerClass} .row:nth-of-type(${index + 1}) p`
    );
    if (index === paramCount) {
      node.innerHTML = "Localisation Information [m]";
      return;
    }
    node.innerHTML = `${columnName} <br> 1:${scale.toFixed(0)} [mm]`;
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
    }));
    for (const [key, value] of Object.entries(chartData)) {
      const param = chartTypes.find((paramItem) => paramItem.id === key);
      if (param) {
        const [lineChartDataPoints, minY, maxY] = dataPointGenerator(value);
        const eventStripLines = generateEventStriplines(chartList.length);
        const speedZoneStripLines = generateSpeedZoneStripLines(
          speedZones,
          chartList.length
        );
        const labelStripLines = generateLabelStripLines(chartList.length);
        let referenceLine = 0;
        if (
          param.id.toLowerCase().indexOf("versine") !== -1 ||
          param.id.toLowerCase().indexOf("cant") !== -1
        ) {
          referenceLine = Math.round((maxY - minY) / 2 + minY);
        } else if (param.id.toLowerCase().indexOf("gaugedefect") !== -1) {
          referenceLine = NominalGauge;
        }
        let height = Math.round(
          (Math.abs(maxY - minY) / param.scale) * 3.78 + 13
        );
        if (height < 10 || height === Infinity) {
          height = 10;
        }
        if (chartList.length === paramCount) {
          height = 133;
        }
        chartList.push({
          height: height,
          backgroundColor:
            chartList.length % 2 === 0
              ? "rgb(220, 220, 220, 0.5)"
              : "transparent",
          axisX2: {
            minimum: StationingStart - 1 * widthRatio,
            maximum: StationingEnd + 1 * widthRatio,
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
            stripLines: [...eventStripLines, ...speedZoneStripLines],
          },
          axisY: {
            titleWrap: false,
            lineThickness: 0,
            gridThickness: 0,
            tickLength: 0,
            maximum: maxY + 1,
            minimum: minY - 1,
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
                label: referenceLine.toFixed(0),
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
            minimum: StationingStart - 1 * widthRatio,
            maximum: StationingEnd + 1 * widthRatio,
            tickLength: 0,
            labelAutoFit: true,
            labelWrap: false,
            labelFontWeight: "lighter",
            labelFontSize: 10,
            labelFormatter: () => "",
            labelAngle: 270,
            stripLines: [
              ...eventStripLines,
              ...speedZoneStripLines,
              ...labelStripLines,
            ],
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
        addLabels(index, param.columnName, param.scale);
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
        index++;
      }
    }
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
