/*** to define the style */
var template = {
  width: '1000',
  height: '520',
  json: 'gdp_data_source.csv',
  // json: 'gdp_data.csv',
  padding: 20
};

const debug = true;
// const debug = false;

(function(data) {
  var xScale;
  var yScale;
  var xAxis;
  var yAxis;
  var stack;
  var keys;
  var allSum = [];
  var area;
  var series;
  /**
   * to create the basic chart
   */
  var $chart = d3
    .select('#chart-1')
    .append('svg')
    .attr('width', template.width)
    .attr('height', template.height);

  /**
   *
   * load data
   * @param {string} file
   */
  function loadData(file) {
    return new Promise((resolve, reject) => {
      d3.csv(file, function(error, data) {
        if (error) {
          reject(error);
        } else {
          resolve(handleData(data));
        }
      });
    });
  }

  function sum$2(series) {
    var s = 0,
      i = -1,
      n = series.length - 1,
      v;
    // while (++i < n)
    if ((v = series[n][1] - series[n][0])) s = v;
    // console.log("000",series);
    return s;
  }

  var none$2 = function(series) {
    var n = series.length,
      o = new Array(n);
    while (--n >= 0) o[n] = n;
    return o;
  };

  var order = function(data) {
    console.log(data);
    var sums = data.map(sum$2);
    console.log('yaofengle', sums);

    var hh = none$2(data).sort((a, b) => {
      return sums[a] - sums[b];
    });
    console.log('myorder', hh);
    return hh;
  };

  function handleData(data) {
    // console.log(data);
    keys = data.columns;
    keys.shift();

    for (let index = 0; index < data.length; index++) {
      let element = data[index];
      element.year = parseInt(element.year);
      let sumTemp = 0;
      for (let i = 0; i < keys.length; i++) {
        if (element[keys[i]]) {
          element[keys[i]] = +element[keys[i]];
          sumTemp += element[keys[i]];
        } else {
          element[keys[i]] = 0;
        }
      }
      allSum.push(sumTemp);
    }

    // console.log('data\n', data);
    return data;
  }

  function myStack(data, keys) {
    console.log(data);
    let value = new Array(keys.length);

    for (let index = 0; index < data.length; index++) {
      // 按年份（x轴对应点)循环
      let key_ = [...keys];
      let lo = 0;
      let hi = 0;

      //将这一年的数据填入 按键为外层索引的第一个元素的data属性
      for (let i = 0; i < keys.length; i++) {
        if (value[i]) {
          value[i].push({
            data: data[index]
          });
        } else {
          value[i] = [];
          value[i].push({
            data: data[index]
          });
          value[i].key = keys[i];
        }
      }

      // 根据每年GDP总量排序
      key_.sort((a, b) => {
        return data[index][a] - data[index][b];
      });

      for (let j = 0; j < keys.length; j++) {
        //按顺序遍历绘制的国家，设置hi lo
        hi = lo + data[index][key_[j]];

        // 遍历value数组，寻找到对应key的
        for (let k = 0; k < value.length; k++) {
          if (key_[j] == value[k].key) {
            value[k][index][0] = lo;
            value[k][index][1] = hi;
            // 保存最后的次序
            if (index === data.length - 1) {
              value[k].index = j;
            }
          }
        }

        lo = hi;
      }
    }

    debug && console.log(value);
    return value;
  }

  function render($ele, data) {
    // console.log(data);
    stack = d3
      .stack()
      // .order(d3.stackOrderAscending)
      // .order(order)
      .keys(keys);

    series = myStack(data, keys);
    area = d3
      .area()
      // .curve()
      .x(function(d) {
        return xScale(new Date(d.data.year, 0, 1));
      })
      .y0(function(d) {
        return yScale(d[0]);
      })
      .y1(function(d) {
        return yScale(d[1]);
      })
      .curve(d3.curveCatmullRom.alpha(0.5));

    var $path = $ele
      .selectAll('g')
      .data(series)
      .enter()
      .append('g')
      .attr('class', 'area');

    $path
      .append('path')
      .attr('transform', 'translate(' + template.padding + ',0)')
      .attr('d', area)
      .attr('fill', function(d, i) {
        return get_colors(i);
      })
      .on('mouseover', function() {
        $path
          .select('path')
          .attr('fill', '#999')
          .attr('opacity', '0.8');

        $path.select('text').attr('fill', '#999');

        d3.select(this)
          .attr('fill', '#d8d860')
          .attr('opacity', '1')
          .select(() => {
            return this.nextElementSibling;
          })
          .attr('fill', '#a8a800');
      })
      .on('mouseout', function() {
        // $ele
        //   .selectAll('.area')
        $path
          .select('path')
          .attr('fill', function(d, i) {
            return get_colors(i);
          })
          .attr('opacity', '1');
        $path.select('text').attr('fill', function(d, i) {
          return get_colors(i);
        });
      });

    $path
      .append('text')
      .attr('x', template.width - template.padding * 1.8)
      .attr('y', d => {
        return (
          yScale(d[57][1]) -
          (yScale(d[57][1]) - yScale(d[57][0]) - template.padding) / 2
        );
      })
      .attr('fill', function(d, i) {
        return get_colors(i);
      })
      .text(d => {
        if (d.index + 12 > series.length) {
          return d.key;
        }
      });

    $ele
      .append('g')
      .attr('class', 'x axis')
      .attr(
        'transform',
        'translate( ' +
          template.padding +
          ',' +
          (template.height - template.padding) +
          ')'
      )
      .call(xAxis);

    $ele
      .append('g')
      .attr('class', 'y axis')
      .attr('transform', 'translate(' + template.padding * 2 + ',0)')
      .call(yAxis);

    $ele
      .append('text')
	  .attr('class', 'legend')
	//   .attr('x',0)
      .attr('transform', 'translate(60,10)')
      .text('万亿(美元)');
  }

  function get_colors(n) {
    var colors = [
      '#cab2d6', '#c19898', '#b2df8a', '#6a3d9a', '#33a02c',
      '#fb9a99', '#fdbf6f', '#1d5464', '#207e82','#1f78b4',
      '#a6cee3' //   '#ff7f00', // ('#ebf0f6'); //   '#d8d860',
    ];

    return colors[n % colors.length];
  }

  function initScale(dataset) {
    let min = d3.min(dataset, d => d.year);
    let max = d3.max(dataset, d => d.year);
    xScale = d3
      .scaleTime()
      .domain([new Date(min, 0, 1), new Date(max, 0, 1)])
      .range([template.padding, template.width - template.padding * 3]);

    yScale = d3
      .scaleLinear()
      .domain([0, d3.max(allSum)])
      .range([template.height - template.padding, template.padding / 2])
      .nice();

    debug && console.log(yScale.domain());
  }

  function initAxis() {
    xAxis = d3
      .axisBottom()
      .scale(xScale)
      .ticks(12)
      .tickFormat(d3.timeFormat('%Y'));

    yAxis = d3
      .axisLeft()
      .scale(yScale)
      .ticks(8)
      .tickFormat(d => parseInt(d / 1000000000000));
  }

  loadData(data)
    .then(parsed_data => {
      initScale(parsed_data);
      initAxis();
      render($chart, parsed_data);
    })
    .catch(error => {
      console.log(error);
    });
})(template.json);
