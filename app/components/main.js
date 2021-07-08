import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import echarts from 'echarts';

export default class MainComponent extends Component {
  constructor(...args) {
    super(...args);
    console.log('Constructor is loading...', ...args);

    this.initEcharts = this.initEcharts.bind(this);
  }

  @tracked totalStarLinkCount = 0;
  @tracked tooltipRepresentativeContent = '';

  @tracked skipDuplicates = true;
  @tracked fixedTooltip = true;

  @action async refreshTooltipRepresentative() {
    this.tooltipRepresentativeContent = this.tooltipRepresentative.content;
    console.log(this.tooltipRepresentative);
    setTimeout(() => this.chart.resize());
  }

  @action async clearTooltipRepresentative() {
    this.tooltipRepresentativeContent = '';
    setTimeout(() => this.chart.resize());
  }

  @action toggleDuplicates() {
    console.log('toggleDuplicates');
    const newValue = !this.skipDuplicates;
    this.tooltipRepresentativeContent = '';
    this.skipDuplicates = newValue;
    setTimeout(async () => {
      await this.initEcharts({ skipDuplicates: newValue, fixedTooltip: this.fixedTooltip, });
    });
  }

  @action toggleDynamicTooltip() {
    console.log('toggleDynamicTooltip');
    const newValue = !this.fixedTooltip;
    this.tooltipRepresentativeContent = '';
    this.fixedTooltip = newValue;
    setTimeout(async () => {
      await this.initEcharts({ fixedTooltip: newValue, skipDuplicates: this.skipDuplicates });
    });
  }

  async initEcharts({ skipDuplicates = this.skipDuplicates, fixedTooltip = this.fixedTooltip, } = {}) {
    console.log('Init echarts!');

    if (this.chart) {
      this.chart.dispose();
    }

    const { chart, totalCount, tooltipRepresentative, } = await renderChart({ skipDuplicates, fixedTooltip, });

    this.chart = chart;
    this.totalStarLinkCount = totalCount;
    this.tooltipRepresentative = tooltipRepresentative;
    this.tooltipRepresentativeContent = tooltipRepresentative.content;
    console.log(this.tooltipRepresentative);

    return chart;
  }
}

async function renderChart({ skipDuplicates = true, fixedTooltip = false, } = {}) {
  const chartDom = document.getElementById('starlinks-overtime-chart');
  const chart = echarts.init(chartDom);


  const result = await fetch('https://api.spacexdata.com/v4/starlink');

  const starlinkFormatted = await result.json();


  const sortedDataArray = starlinkFormatted.sort((a, b) => {
    const firstDate = new Date(a.spaceTrack.CREATION_DATE);
    const secondDate = new Date(b.spaceTrack.CREATION_DATE);
    if (firstDate.valueOf() > secondDate.valueOf()) {
      return 1;
    }
    if (firstDate.valueOf() === secondDate.valueOf()) {
      return 0;
    }
    if (firstDate.valueOf() < secondDate.valueOf()) {
      return -1;
    }
  });

  console.log(sortedDataArray);

  const dataMap = {};


  let count = 0;

  for (let i = 0; i < sortedDataArray.length; i++) {
    const item = sortedDataArray[i];
    const dateString = item.spaceTrack.CREATION_DATE;
    const now = new Date(dateString);

    if (dataMap[dateString]) {
      if (skipDuplicates) {
        continue; //loop
      } else {
        count += 1;

        dataMap[dateString].value[1] = count + 1;
        dataMap[dateString].count = dataMap[dateString].value[1];
      }
    } else {
      count += 1;

      let obj = {
        name: dateString,
        count,
        value: [
            [now.getFullYear(), now.getMonth() + 1, now.getDate()].join('/'),
            count,
        ]
      };

      dataMap[dateString] = obj;
    }
  }

  console.log(dataMap);


  const mapToDataArray = Object.keys(dataMap).map(key => {
    return dataMap[key];
  });


  const tooltipRepresentative = {}

  const option = {
      tooltip: {
        trigger: 'axis',
        position: function (pt, params, dom, tooltip, chartSize) {
          if (chartSize) {
            const { viewSize } = chartSize;

            if (fixedTooltip) {
              let x = pt[0];

              if (x > viewSize[0] - 425) {
                x -= 250;
              } else {
                x += 50;
              }

              return [x, '10%'];
            } else {
              return undefined;
            }
          }
          return [pt[0], pt[1]];
        },
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#111111'
          }
        },
        formatter: (data, ...args) => {
          const listItems = data.reduce((a, { data: { name, count }}) => {
            return a += `<li>${name} Count: ${count}</li>`;
          }, '');

          const tooltipContent = `
            <ul style='padding:0; margin:0;'>
              ${listItems}
            </ul>
          `;

          tooltipRepresentative.content = tooltipContent;

          return tooltipContent;
        },
      },
      xAxis: {
          type: 'time',
          splitLine: {
              show: false
          },
      },
      yAxis: {
          type: 'value',
          //boundaryGap: [0, 2],
      },
      series: [{
        itemStyle: {
          color: 'red'
        },
        areaStyle: {
          opacity: 0.8,
          color: 'red',
        },
        data: mapToDataArray,
        type: 'line'
      }]
  };

  option && chart.setOption(option);

  return { chart, totalCount: count, tooltipRepresentative, };
}
