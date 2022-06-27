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
  } = parsedData;
  const widthRatio = LocalizationScale / 100;
  const chartTypes = [];
  const charts = [
    {
      id: "VersineVerticalRight",
      columnName: "Versine Vertical Right",
    },
    {
      id: "VersineVerticalLeft",
      columnName: "Versine Vertical Left",
    },
    {
      id: "VersineHorizontalRight",
      columnName: "Versine Horizontal Right",
    },
    {
      id: "VersineHorizontalLeft",
      columnName: "Versine Horizontal Left",
    },
    {
      id: "LongitudinalLevelD2Right",
      columnName: "Longitudinal Level D2 Right",
    },
    {
      id: "LongitudinalLevelD2Left",
      columnName: "Longitudinal Level D2 Left",
    },
    {
      id: "LongitudinalLevelD1Right",
      columnName: "Longitudinal Level D1 Right",
    },
    {
      id: "LongitudinalLevelD1Left",
      columnName: "Longitudinal Level D1 Left",
    },
    {
      id: "AlignmentD2Right",
      columnName: "Alignment D2 Right",
    },
    {
      id: "AlignmentD2Left",
      columnName: "Alignment D2 Left",
    },
    {
      id: "AlignmentD1Right",
      columnName: "Alignment D1 Right",
    },
    {
      id: "AlignmentD1Left",
      columnName: "Alignment D1 Left",
    },
    // {
    //   id: "CantDefect",
    //   columnName: "Cant Defect",
    // },
    {
      id: "Cant",
      columnName: "Cant",
    },
    {
      id: "GaugeDefect",
      columnName: "Gauge",
    },
    ...(GaugeChangeBaseLengths.length
      ? GaugeChangeBaseLengths.map((value, index) => {
          return {
            id: `GaugeChange${index + 1}`,
            columnName: `Gauge Change ${value}m`,
          };
        })
      : []),
    ...(TwistBaseLengths.length
      ? TwistBaseLengths.map((value, index) => {
          return {
            id: `TwistBase${index + 1}`,
            columnName: `Twist Base ${value}m`,
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
    columnName: "Localization Information",
  });
  const chartContainerNode = document.createElement("div");
  chartContainerNode.classList.add("chartContainer");
  document
    .querySelector("#measurement-chart-container")
    .appendChild(chartContainerNode);

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
        labelBackgroundColor: "#fff",
        color: "#000",
        label:
          chartListLength === paramCount
            ? `${event.MappedStationingStart}, ${event.Abbr.toUpperCase()}${
                event.IsRange ? "\u25BC" : ""
              }`
            : "",
        showOnTop: true,
        labelFontColor: "#000",
        labelFontFamily: "Roboto",
        labelWrap: true,
        labelAlign: "near",
        labelAngle: 270,
        labelFontSize: 14, //19
        labelMaxWidth: 130,
      });
      if (event.IsRange) {
        eventStripLines.push({
          value: event.MeasuredStationingEnd,
          labelPlacement: "outside",
          lineDashType: "longDash",
          color: "#000",
          labelBackgroundColor: "#fff",
          label:
            chartListLength === paramCount
              ? `${event.MappedStationingEnd.toString()}, ${event.Abbr.toLowerCase()}\u25B2`
              : "",
          showOnTop: true,
          labelFontColor: "#000",
          labelFontFamily: "Roboto",
          labelWrap: true,
          labelAlign: "near",
          labelAngle: 270,
          labelFontSize: 14, //10
          labelMaxWidth: 130,
        });
      }
    });
    return eventStripLines;
  };

  const generateSpeedZoneStriplines = (speedZones, chartListLength) => {
    return speedZones.map((limit) => ({
      value: limit.value,
      labelPlacement: "outside",
      lineDashType: "longDashDot",
      color: "#000",
      label:
        chartListLength === paramCount
          ? `${limit.MinSpeed.toFixed(1)}<V<=${limit.MaxSpeed.toFixed(
              1
            )} \u25BC`
          : "",
      showOnTop: true,
      labelBackgroundColor: "#fff",
      labelFontColor: "#5a5a5a",
      labelFontFamily: "Roboto",
      labelWrap: false,
      labelAlign: "near",
      labelAngle: 270,
      labelFontSize: 14, //10
      labelMaxWidth: 130,
      labelWrap: true,
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
    document.querySelector(".chartContainer:last-of-type").appendChild(rowNode);
  };

  const addLabels = (index, columnName, scale) => {
    const node = document.querySelector(
      `.chartContainer:last-of-type .row:nth-of-type(${index + 1}) p`
    );
    if (index === paramCount) {
      node.innerHTML = "Localisation Info [m]";
      return;
    }
    node.innerHTML = `${columnName} <br> 1:${scale.toFixed(0)} [mm]`;
  };

  const newChartData = {};
  let chartData = {}; //change to {}
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
      value: speedElement.StationingEnd,
      MinSpeed: speedElement.MinSpeedLimit,
      MaxSpeed: speedElement.MaxSpeedLimit,
    }));
    for (const [key, value] of Object.entries(chartData)) {
      const param = chartTypes.find((paramItem) => paramItem.id === key);
      if (param) {
        const [lineChartDataPoints, minY, maxY] = dataPointGenerator(value);
        const eventStripLines = generateEventStriplines(chartList.length);
        const speedZoneStripLines = generateSpeedZoneStriplines(
          speedZones,
          chartList.length
        );
        let referenceLine = 0;
        if (
          param.id.toLowerCase().indexOf("versine") !== -1 ||
          param.id.toLowerCase().indexOf("cant") !== -1
        ) {
          referenceLine = Math.round((maxY - minY) / 2 + minY);
        } else if (param.id.toLowerCase().indexOf("gaugedefect") !== -1) {
          referenceLine = NominalGauge;
        }

        let height =
          ((Math.abs(maxY - minY) / param.scale) * 3.7795275591) / 1.17;
        if (height < 10) {
          height = 10;
        }
        if (chartList.length === paramCount) {
          height = 132;
        }
        chartList.push({
          height: height * 2, //ratio = 1.17 for consistent heights
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
            interval: 5 * widthRatio,
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
            labelFontSize: 14, //10
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
                labelFontFamily: "Roboto",
                labelWrap: false,
                labelAlign: "near",
                labelBackgroundColor: "transparent",
                labelFontSize: 14,
                labelMaxWidth: 30,
              },
            ],
          },
          axisX: {
            minimum: StationingStart - 1 * widthRatio,
            maximum: StationingEnd + 1 * widthRatio,
            tickLength: 2,
            labelAutoFit: true,
            labelWrap: false,
            labelFontWeight: "lighter",
            labelFontSize: 13, //9
            interval: 5 * widthRatio,
            labelFormatter:
              chartList.length === paramCount
                ? (e) =>
                    Number(e.value) > StationingEnd &&
                    Number(e.value) < StationingStart
                      ? ""
                      : StationingLabels.find(
                          (label) => label.MeasuredStationingPoint === e.value
                        )?.MappedStationingPoint || ""
                : () => "",
            labelAngle: 270,
            stripLines: [...eventStripLines, ...speedZoneStripLines],
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
          PageWidth * 2
        }px`;
        document.querySelector(`#${chartParameterIdAttr}`).style.height = `${
          height * 2
        }px`;
        const stockChart = new CanvasJS.StockChart(
          `${chartParameterIdAttr}`,
          options
        );
        stockChart.render();
        // stockChart.charts[0].axisY[0].set(
        //   "margin",
        //   35 -
        //     stockChart.charts[0].axisY[0].bounds.x2 -
        //     stockChart.charts[0].axisY[0].bounds.x1
        // );
        index++;
      }
    }
    if (ParameterPerPage > paramCount) {
      document
        .querySelector(".chartContainer:last-of-type .row:first-of-type")
        .classList.add("add-top-border");
    }
    document.querySelector(".canvasjsChart").style.width = `${
      (PageWidth + 36) * 2
    }px`;
    var canvas = await html2canvas(document.querySelector(".canvasjsChart"));
    return canvas.toDataURL();
  }
};
