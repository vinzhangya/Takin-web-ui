import React, { useState, useEffect, useCallback } from 'react';
import { Spin } from 'antd';
import ReactEcharts from 'echarts-for-react';
import service from '../service';
import LegendSelect, {
  getSeryColorByNameOrIndex,
} from '../../TrendChart/components/LegendSelect';

interface Props {
  defaultQuery: any;
}

const TimeCostChart: React.FC<Props> = (props) => {
  const [echartRef, setEchartRef] = useState();
  const [loading, setLoading] = useState(false);
  const [allSeries, setAllSeries] = useState([]);
  const [seriesShowed, setSeriesShowed] = useState([]);

  const [chartData, setChartData] = useState({
    time: [
      '2022-03-11',
      '2022-03-12',
      '2022-03-13',
      '2022-03-14',
      '2022-03-15',
    ],
    list: [
      {
        name: '/provider/co',
        data: [1, 2, 3, 4, 5],
      },
      {
        name: '/provider/ao',
        data: [3, 2, 1, 7, 5],
      },
      {
        name: '/prov1ider/bo',
        data: [2, 4, 6, 3, 2],
      },
    ],
  });

  const getNodes = async () => {
    const {
      data: { success, data = [] },
      // TODO:更换接口
    } = await service.getApplicationNodes(props.defaultQuery);
    if (success) {
      setAllSeries((data || []).slice(0, 5).map((item) => item.name));
    }
  };

  const getChartData = async () => {
    setLoading(true);
    // TODO:更换接口
    const {
      data: { success, data = [] },
    } = await service.getTendencyChart({
      ...props.defaultQuery,
      nodes: seriesShowed,
    });
    setLoading(false);
    if (success) {
      setChartData(data);
    }
  };

  useEffect(() => {
    getNodes();
  }, []);

  useEffect(() => {
    getChartData();
  }, [JSON.stringify(seriesShowed)]);

  return (
    <Spin spinning={loading}>
      <div
        style={{
          color: 'var(--Netural-600, #90959A)',
          fontSize: 12,
          padding: '16px 0',
        }}
      >
        默认展示耗时占比前五项数据 ，可在图例中进行切换
      </div>
      <LegendSelect
        label="接口"
        searchPlaceholder="搜索接口"
        allSeries={chartData.list}
        echartRef={echartRef}
        seriesShowed={seriesShowed}
        onChangeShowedSeries={setSeriesShowed}
        overlayStyle={{
          width: 400,
        }}
        extraColumns={[
          {
            title: '耗时',
            align: 'right',
            render: (text, record) => {
              return (
                <span
                  style={{
                    color: 'var(--Netural-500, #AEB2B7)',
                  }}
                >
                  3000/100
                </span>
              );
            },
          },
        ]}
      />
      <ReactEcharts
        ref={useCallback((echarts) => setEchartRef(echarts), [])}
        style={{ width: '100%', height: 400 }}
        option={{
          grid: {
            top: 40,
            left: 50,
            right: 50,
          },

          xAxis: {
            type: 'category',
            boundaryGap: false,
            axisLine: {
              onZero: true,
              lineStyle: {
                color: '#00BCD4',
              },
            },
            // axisTick: {
            //   show: false,
            // },
            axisLabel: {
              color: '#98A1B3',
            },
            data: chartData.time,
          },
          yAxis: {
            type: 'value',
            axisLine: {
              show: false,
            },
            axisTick: {
              show: false,
            },
            axisLabel: {
              color: '#98A1B3',
              width: 20,
              overflow: 'truncate',
              formatter: (val, index) => {
                return val > 9999 ? `${val / 10000}万` : val;
              },
            },
            splitLine: {
              show: true,
              lineStyle: {
                type: 'dashed',
                color: ['#E6EAF0', '#fff'],
              },
            },
          },
          series: (chartData?.list || []).map((item, index) => {
            return {
              type: 'line',
              stack: true, // 堆叠效果
              showSymbol: true,
              hoverAnimation: false,
              smooth: true,
              name: item.name,
              data: item.data,
              areaStyle: {
                opacity: 0.25,
              },
              color: getSeryColorByNameOrIndex({ index }),
            };
          }),
          legend: {
            show: false,
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              animation: false,
            },
          }
        }}
      />
    </Spin>
  );
};

export default TimeCostChart;
