async (dataString) => {
  const parsedData = JSON.parse(dataString);
  if (!parsedData) return;
  const {
    VisualTrackDatas,
    Events: events,
    StationingStartDisplayValue: StationingStart,
    StationingEndDisplayValue: StationingEnd,
    PageWidth,
    DefectScale = 1,
    ChartIndex,
    TwistBaseLength,
    ModifiedSpeedElements,
    ParametersScale,
    ParameterBlockIndex,
    ParameterPerPage,
    ChartParameters,
  } = parsedData;

  const chartTypes = [];
  const charts = [
    {
      id: "VersineVerticalRight",
      shortName: "VVR",
      shouldShow: true,
      scaleName: "VersineVerticalRightScale",
      limitType: "VersineLimits",
      columnName: "Versine Vertical Right",
    },
    {
      id: "VersineVerticalLeft",
      shortName: "VVL",
      shouldShow: true,
      scaleName: "VersineVerticalLeftScale",
      limitType: "VersineLimits",
      columnName: "Versine Vertical Left",
    },
    {
      id: "VersineHorizontalRight",
      shortName: "VHR",
      shouldShow: true,
      scaleName: "VersineHorizontalRightScale",
      limitType: "VersineLimits",
      columnName: "Versine Horizontal Right",
    },
    {
      id: "VersineHorizontalLeft",
      shortName: "VHL",
      shouldShow: true,
      scaleName: "VersineHorizontalLeftScale",
      limitType: "VersineLimits",
      columnName: "Versine Horizontal Left",
    },
    {
      id: "LongitudinalLevelD2Right",
      shortName: "LLD2R",
      shouldShow: true,
      scaleName: "LongitudinalLevelD2RightScale",
      limitType: "D2Limits",
      columnName: "Longitudinal Level Right",
    },
    {
      id: "LongitudinalLevelD2Left",
      shortName: "LLD2L",
      shouldShow: true,
      scaleName: "LongitudinalLevelD2LeftScale",
      limitType: "D2Limits",
      columnName: "Longitudinal Level Left",
    },
    {
      id: "LongitudinalLevelD1Right",
      shortName: "LLD1R",
      shouldShow: true,
      scaleName: "LongitudinalLevelD1RightScale",
      limitType: "D1Limits",
      columnName: "Longitudinal Level Right",
    },
    {
      id: "LongitudinalLevelD1Left",
      shortName: "LLD1L",
      shouldShow: false,
      scaleName: "LongitudinalLevelD1LeftScale",
      limitType: "D1Limits",
      columnName: "Longitudinal Level Left",
    },
    {
      id: "AlignmentD2Right",
      shortName: "AD2R",
      shouldShow: false,
      scaleName: "AlignmentD2RightScale",
      limitType: "D2Limits",
      columnName: "Alignment Right",
    },
    {
      id: "AlignmentD2Left",
      shortName: "AD2L",
      shouldShow: false,
      scaleName: "AlignmentD2LeftScale",
      limitType: "D2Limits",
      columnName: "Alignment Left",
    },
    {
      id: "AlignmentD1Right",
      shortName: "AD1R",
      shouldShow: false,
      scaleName: "AlignmentD1RightScale",
      limitType: "D1Limits",
      columnName: "Alignment Left",
    },
    {
      id: "AlignmentD1Left",
      shortName: "AD1L",
      shouldShow: false,
      scaleName: "AlignmentD1LeftScale",
      limitType: "D1Limits",
      columnName: "Alignment Right",
    },
    {
      id: "TwistBase1",
      shortName: "Twist",
      shouldShow: true,
      scaleName: "TwistBase1Scale",
      limitType: "",
      columnName: `Twist ${TwistBaseLength}m`,
    },
    {
      id: "CantDefect",
      shortName: "CantDefect",
      shouldShow: true,
      scaleName: "CantScale",
      limitType: "",
      columnName: "Cant Defect",
    },
    {
      id: "Cant",
      shortName: "Cant",
      shouldShow: false,
      scaleName: "CantScale",
      limitType: "",
      columnName: "Cant",
    },
    {
      id: "GaugeDefect",
      shortName: "Gauge",
      shouldShow: true,
      scaleName: "GaugeDefectScale",
      limitType: "",
      columnName: "Gauge Defect",
    },
    {
      id: "GaugeChange1",
      shortName: "Gauge1",
      shouldShow: true,
      scaleName: "GaugeChange1Scale",
      limitType: "",
      columnName: "Gauge  1",
    },
    {
      id: "GaugeChange2",
      shortName: "Gauge2",
      shouldShow: true,
      scaleName: "GaugeChange2Scale",
      limitType: "",
      columnName: "Gauge Defect 2",
    },
    {
      id: "GaugeChange3",
      shortName: "Gauge3",
      shouldShow: true,
      scaleName: "GaugeChange3Scale",
      limitType: "",
      columnName: "Gauge Defect 3",
    },
    {
      id: "TwistBase2",
      shortName: "TwistBase2",
      shouldShow: true,
      scaleName: "TwistBase2Scale",
      limitType: "",
      columnName: "TwistBase2",
    },
    {
      id: "TwistBase3",
      shortName: "TwistBase2",
      shouldShow: true,
      scaleName: "TwistBase3Scale",
      limitType: "",
      columnName: "TwistBase2",
    },
  ];
  const startingIndex = ParameterBlockIndex * ParameterPerPage;
  const endingIndex = (ParameterBlockIndex + 1) * ParameterPerPage;
  for (let i = startingIndex; i < endingIndex; i++) {
    const chart = charts.find((chart) => chart.id === ChartParameters[i]);
    chartTypes.push(chart);
  }
  chartTypes.push({
    id: "Localizations",
    shortName: "Localizations",
    shouldShow: true,
    columnName: "Localization Info",
  });

  const chartContainerNode = document.createElement("div");
  chartContainerNode.classList.add("chartContainer");
  document
    .querySelector("#measurement-chart-container")
    .appendChild(chartContainerNode);

  const dataPointGenerator = (values, key = "") => {
    // if (!limits.length) {
    //   return [values, [], null, null];
    // }
    const lineChartDataPoints = [];
    // const areaChartData = [];
    let minY = values?.[0]?.y;
    let maxY = values?.[0]?.y;
    // console.log("values: ", values);
    // console.log(minY, maxY);
    values?.forEach((value) => {
      if (
        (value.x == null && Number.isNaN(value.x)) ||
        (value.y == null && Number.isNaN(value.y))
      ) {
        return;
      }
      // let currentChartThreshold = limits[currentThresholdIndex];
      // if (value.x > currentChartThreshold.StationingEnd) {
      //   if (currentThresholdIndex + 1 < limits.length) {
      //     currentThresholdIndex += 1;
      //     currentChartThreshold = limits[currentThresholdIndex];
      //     minY = Math.min(
      //       minY,
      //       currentChartThreshold.LimitsBySeverity[2].Lower
      //     );
      //     maxY = Math.max(
      //       maxY,
      //       currentChartThreshold.LimitsBySeverity[2].Upper
      //     );
      //   } else {
      //     lineChartDataPoints.push({ ...value });
      //     addAreaCharDataPoint(value, areaChartData, "transparent");
      //     if (minY > value.y) {
      //       minY = value.y;
      //     }
      //     if (maxY < value.y) {
      //       maxY = value.y;
      //     }
      //     return;
      //   }
      // }
      // if (value.y > currentChartThreshold.LimitsBySeverity[2].Upper) {
      //   lineChartDataPoints.push({ ...value });
      //   // addAreaCharDataPoint(value, areaChartData, "#E40D3B", "IAL");
      // } else if (
      //   value.y > currentChartThreshold.LimitsBySeverity[1].Upper &&
      //   value.y < currentChartThreshold.LimitsBySeverity[2].Upper
      // ) {
      //   lineChartDataPoints.push({ ...value });
      //   // addAreaCharDataPoint(value, areaChartData, "#FF9B31", "IL");
      // } else if (
      //   value.y > currentChartThreshold.LimitsBySeverity[0].Upper &&
      //   value.y < currentChartThreshold.LimitsBySeverity[1].Upper
      // ) {
      //   lineChartDataPoints.push({ ...value });
      //   // addAreaCharDataPoint(value, areaChartData, "#FFEF35", "AL");
      // } else if (
      //   value.y < currentChartThreshold.LimitsBySeverity[0].Upper &&
      //   value.y > currentChartThreshold.LimitsBySeverity[0].Lower
      // ) {
      //   lineChartDataPoints.push({ ...value });
      //   // addAreaCharDataPoint(value, areaChartData, "transparent");
      // } else if (
      //   value.y < currentChartThreshold.LimitsBySeverity[0].Lower &&
      //   value.y > currentChartThreshold.LimitsBySeverity[1].Lower
      // ) {
      //   lineChartDataPoints.push({ ...value });
      //   // addAreaCharDataPoint(value, areaChartData, "#FFEF35", "AL");
      // } else if (
      //   value.y < currentChartThreshold.LimitsBySeverity[1].Lower &&
      //   value.y > currentChartThreshold.LimitsBySeverity[2].Lower
      // ) {
      //   lineChartDataPoints.push({ ...value });
      //   // addAreaCharDataPoint(value, areaChartData, "#FF9B31", "IL");
      // } else if (value.y < currentChartThreshold.LimitsBySeverity[2].Lower) {
      //   lineChartDataPoints.push({ ...value });
      //   // addAreaCharDataPoint(value, areaChartData, "#E40D3B", "IAL");
      // } else {
      //   lineChartDataPoints.push({ ...value });
      //   // addAreaCharDataPoint(value, areaChartData, "transparent");
      // }
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

  // const getLineColor = (index) => {
  //   switch (index) {
  //     case 0:
  //       return "#FFEF35";
  //     case 1:
  //       return "#FF9B31";
  //     case 2:
  //       return "#E40D3B";
  //     default:
  //       return "#FFEF35";
  //   }
  // };

  // const configureThresholdLimits = (currentChartType) => {
  //   if (currentChartType.id === "Localizations") return [];
  //   let limits = [];
  //   if (!currentChartType?.limitType) {
  //     limits = chartThresholds[currentChartType.limitName].Limits;
  //   } else {
  //     limits =
  //       chartThresholds[currentChartType.limitName][currentChartType.limitType];
  //   }
  //   return limits;
  // };

  // const generateThresholdStriplines = (limits) => {
  //   const thresholdDataSet = [];
  //   const addToThresholdData = (start, end, yCoordinate, lineColor) => {
  //     const commonProps = {
  //       y: yCoordinate,
  //       lineColor,
  //     };
  //     thresholdDataSet.push({
  //       type: "line",
  //       axisXType: "secondary",
  //       markerSize: 0,
  //       lineDashType: "dash",
  //       lineThickness: 1,
  //       dataPoints: [
  //         {
  //           x: start,
  //           ...commonProps,
  //         },
  //         {
  //           x: end,
  //           ...commonProps,
  //         },
  //       ],
  //     });
  //   };
  //   for (const limit of limits) {
  //     if (limit.StationingStart > StationingEnd) break;
  //     if (
  //       limit.StationingStart <= StationingEnd &&
  //       limit.StationingEnd > StationingStart
  //     ) {
  //       limit.LimitsBySeverity.forEach((element, index) => {
  //         const lineColor = getLineColor(index);
  //         addToThresholdData(
  //           limit.StationingStart,
  //           limit.StationingEnd,
  //           element.Lower,
  //           lineColor
  //         );
  //         addToThresholdData(
  //           limit.StationingStart,
  //           limit.StationingEnd,
  //           element.Upper,
  //           lineColor
  //         );
  //       });
  //     }
  //   }
  //   return thresholdDataSet;
  // };

  const generateEventStriplines = (chartListLength) => {
    const eventStripLines = [];
    events?.forEach((event) => {
      eventStripLines.push({
        value: event.StationingStart,
        labelPlacement: "outside",
        lineDashType: "longDash",
        labelBackgroundColor: "#fff",
        color: "#000",
        label:
          chartListLength === 5
            ? `${event.StationingStart}, ${event.Abbr.toUpperCase()}${
                event.IsRange ? "\u25BC" : ""
              }`
            : "",
        showOnTop: true,
        labelFontColor: "#000",
        labelFontFamily: "Roboto",
        labelWrap: true,
        labelAlign: "near",
        labelAngle: 270,
        labelFontSize: 10,
        labelMaxWidth: 130,
      });
      if (event.IsRange) {
        eventStripLines.push({
          value: event.StationingEnd,
          labelPlacement: "outside",
          lineDashType: "longDash",
          color: "#000",
          labelBackgroundColor: "#fff",
          label:
            chartListLength === 5
              ? `${event.StationingEnd.toString()}, ${event.Abbr.toLowerCase()}\u25B2`
              : "",
          showOnTop: true,
          labelFontColor: "#000",
          labelFontFamily: "Roboto",
          labelWrap: true,
          labelAlign: "near",
          labelAngle: 270,
          labelFontSize: 10,
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
        chartListLength === 5
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
      labelFontSize: 10,
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
    chartColumnNode;
    rowNode.appendChild(headerColumnNode);
    rowNode.appendChild(chartColumnNode);
    document.querySelector(".chartContainer").appendChild(rowNode);
  };

  const addLabels = (index, columnName, scale) => {
    const node = document.querySelector(`.row:nth-of-type(${index + 1}) p`);
    if (index === 5) {
      node.innerHTML = "Localisation Info [m]";
      return;
    }
    node.innerHTML = `${columnName} <br> 1:${scale.toFixed(0)} [mm]`;
  };

  // const generateYAxisLabels = (limits) => {
  //   let labels = [];
  //   limits?.[0]?.LimitsBySeverity.forEach((limit) => {
  //     labels = [...labels, limit.Upper, limit.Lower];
  //   });
  //   return labels;
  // };

  const newChartData = {};

  // updateChartTypes("HorizontalAlignment");
  // updateChartTypes("VerticalAlignment");

  let chartData = []; //change to {}
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
    console.log("chartData: ", chartData);
    const withLocalization = { ...chartData, Localizations: [] };
    chartData = withLocalization;
  } else {
    chartData = {
      VersineVerticalRight: [],
      VersineVerticalLeft: [],
      VersineHorizontalRight: [],
      VersineHorizontalLeft: [],
      LongitudinalLevelD2Right: [],
      LongitudinalLevelD2Left: [],
      LongitudinalLevelD1Right: [],
      LongitudinalLevelD1Left: [],
      AlignmentD2Right: [],
      AlignmentD2Left: [],
      AlignmentD1Right: [],
      AlignmentD1Left: [],
      TwistBase1: [],
      CantDefect: [],
      Cant: [],
      GaugeDeviation: [],
      Localizations: [],
    };
  }
  if (chartData) {
    let index = 0;
    const chartList = [];
    // const speedZones = chartThresholds.Gauge.Limits.map((limit) => ({
    //   value: limit.StationingEnd,
    //   MinSpeed: limit.MinSpeed,
    //   MaxSpeed: limit.MaxSpeed,
    // }));
    const speedZones = ModifiedSpeedElements.map((speedElement) => ({
      value: speedElement.StationingEnd,
      MinSpeed: speedElement.MinSpeedLimit,
      MaxSpeed: speedElement.MaxSpeedLimit,
    }));
    for (const [key, value] of Object.entries(chartData)) {
      const param = chartTypes.find((paramItem) => paramItem.id === key);
      if (param) {
        // const limits = configureThresholdLimits(param);
        // const yAxisLabels = generateYAxisLabels(limits);
        const [lineChartDataPoints, minY, maxY] = dataPointGenerator(value);

        // let thresholdDataSet = [];
        // thresholdDataSet = generateThresholdStriplines(limits);
        const eventStripLines = generateEventStriplines(chartList.length);
        const speedZoneStripLines = generateSpeedZoneStriplines(
          speedZones,
          chartList.length
        );
        let height = (Math.abs(maxY - minY) / DefectScale) * 3.7795275591 + 8;
        if (chartList.length === 5) {
          height = 132;
        }
        console.log("height: ", height, " ", minY, " ", maxY);
        // height = height * 2;
        chartList.push({
          height: height,
          backgroundColor:
            chartList.length % 2 === 0
              ? "rgb(220, 220, 220, 0.5)"
              : "transparent",
          axisX2: {
            minimum: StationingStart,
            maximum: StationingEnd + 1,
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
            interval:
              Math.abs(StationingEnd - StationingStart) < 200
                ? +Math.floor(
                    Math.abs(StationingEnd - StationingStart) / 2
                  ).toFixed()
                : null,
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
            labelFontSize: 10,
            // stripLines: yAxisLabels.map((yAxisLabel, index) => ({
            //   value: yAxisLabel,
            //   labelAutoFit: true,
            //   labelPlacement: "outside",
            //   lineDashType: "solid",
            //   color: "transparent",
            //   label: yAxisLabel.toString(),
            //   showOnTop: true,
            //   labelFontColor: "#000",
            //   labelFontFamily: "Roboto",
            //   labelWrap: false,
            //   labelAlign: "near",
            //   labelBackgroundColor: "transparent",
            //   labelFontSize: 14,
            //   labelMaxWidth: 30,
            // })),
          },
          axisX: {
            minimum: StationingStart,
            maximum: StationingEnd + 1,
            tickLength: 2,
            labelAutoFit: true,
            labelWrap: false,
            labelFontWeight: "lighter",
            labelFontSize: 9,
            interval:
              Math.abs(StationingEnd - StationingStart) < 200
                ? +Math.floor(
                    Math.abs(StationingEnd - StationingStart) / 2
                  ).toFixed()
                : null,
            labelFormatter:
              chartList.length === 5
                ? function (e) {
                    return e.value;
                  }
                : () => "",
            labelAngle: 270,
            stripLines: [...eventStripLines, ...speedZoneStripLines],
          },
          data: [
            {
              type: "line",
              lineDashType: "solid",
              axisXType: chartList.length === 5 ? "primary" : "secondary",
              markerSize: 0,
              dataPoints: lineChartDataPoints,
              lineColor: "black",
            },
            // ...areaChartData,
            // ...thresholdDataSet,
          ],
        });
        if (param.shortName === "CantDefect") {
          const cantData = dataPointGenerator(chartData.Cant, "Cant");
          chartList[chartList.length - 1].data.push({
            type: "line",
            lineDashType: "dash",
            axisXType: "secondary",
            markerSize: 0,
            dataPoints: cantData[0],
            lineColor: "black",
          });
          const cantDataMax = cantData[2] + 1;
          const cantDataMin = cantData[1] - 1;
          const prevMax = chartList[chartList.length - 1].axisY.maximum;
          const prevMin = chartList[chartList.length - 1].axisY.minimum;
          const newMax = Math.max(prevMax, cantDataMax);
          const newMin = Math.min(prevMin, cantDataMin);
          height =
            // ((Math.abs(newMax - newMin) / DefectScale) * 3.7795275591 + 8) * 2;
            (Math.abs(newMax - newMin) / DefectScale) * 3.7795275591 + 8;
          chartList[chartList.length - 1].axisY.maximum = newMax;
          chartList[chartList.length - 1].axisY.minimum = newMin;
          chartList[chartList.length - 1].height = height;
        }
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
        addLabels(index, param.columnName, ParametersScale[param.scaleName]);
        document.querySelector(`#${chartParameterIdAttr}`).style.width = `${
          // PageWidth * 2
          PageWidth
        }px`;
        document.querySelector(
          `#${chartParameterIdAttr}`
        ).style.height = `${height}px`;
        const stockChart = new CanvasJS.StockChart(
          `${chartParameterIdAttr}`,
          options
        );
        stockChart.render();
        // stockChart.charts[0].axisY[0].set(
        //   "margin",
        //   35 -
        //     (stockChart.charts[0].axisY[0].bounds.x2 -
        //       stockChart.charts[0].axisY[0].bounds.x1)
        // );
        index++;
      }
    }
    // document.querySelector("#canvasjsChart").style.width = `${
    //   (PageWidth + 21) * 2
    // }px`;
    // var canvas = await html2canvas(document.querySelector("#canvasjsChart"));
    // return canvas.toDataURL();
  }
};
