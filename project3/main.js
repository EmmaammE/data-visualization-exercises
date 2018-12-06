(function() {
  const debug = true;

  var template = {
    width: 1200,
    height: 800,
    data: '水浒各章节人物出场次数.csv',
    padding: 20,
    xScaleTick: 60,
    yScaleTick: 20
  };

  var $chart = d3
    .select('#chart')
    .append('svg')
    .attr('width', template.width)
    .attr('height', template.height);

  var stack,
    series,
    area,
    keys = [];
  var xScale, xAxis, yScale, yAxis;

  function loadData(file) {
    return new Promise((resolve, reject) => {
      d3.csv(file, function(error, data) {
        if (error) {
          reject(error);
        } else {
          keys = data.columns;
          keys.shift();
          resolve(data);
        }
      });
    });
  }
  function get_colors(n) {
    var colors = [
      '#cab2d6',
      '#c19898',
      '#b2df8a',
      '#6a3d9a',
      '#33a02c',
      '#fb9a99',
      '#fdbf6f',
      '#1d5464',
      '#207e82',
      '#1f78b4',
      '#a6cee3',
      '#ff7f00',
      '#d8d860'
    ];

    return colors[n % colors.length];
  }
  function initScale(dataset) {
    const debug = false;

    //which scale to choose?
    debug && console.log(dataset);
    xScale = d3
      .scaleLinear()
      .domain([1, dataset[dataset.length - 1]['chapter']])
      .range([template.padding, template.width - template.padding]);

    var sumTemp = 0;
    dataset.map(inner => {
      let temp = 0;
      Object.values(inner).map(value => {
        // 通过后面的+转string为字符串
        // 不能直接写 value=parseInt(value)等。只会使用原始值
        parseInt(value) > 0 && (temp += +value);
      });
      sumTemp = Math.max(sumTemp, temp);
    });

    yScale = d3
      .scaleLinear()
      .domain([sumTemp, 0])
      .range([template.padding, template.height - template.padding])
      .nice();

    debug && console.log(sumTemp);
    debug && console.log(yScale.domain());
  }

  function initAxis($ele) {
    xAxis = d3
      .axisBottom()
      .scale(xScale)
      .ticks(template.xScaleTick);

    yAxis = d3
      .axisLeft()
      .scale(yScale)
      .ticks(template.yScaleTick);

    $ele
      .append('g')
      .attr('class', 'x')
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
      .attr('class', 'y')
      .attr('transform', 'translate(' + template.padding * 2 + ',0)')
      .call(yAxis);
  }

  function myStack(dataset) {
    // let value = new Array(keys.length);
    // let hi, lo = 0;
    // for (let index = 0; index < dataset.length; index++) {
    //   const element =dataset[index];
    //   for (let j = 0; j < keys.length; j++) {
    //    hi = lo + dataset[index][keys[j]];
    //    value[index][index][0] = lo;
    //    value[][index][1] = hi;
    //    lo = hi;
    //   }
    // }
  }
  function render($ele, dataset) {
    stack = d3
      .stack()
      .order(d3.stackOrderAescending)
      .keys(keys)
      .offset(d3.stackOffsetNone);
    console.log(dataset);
    series = stack(dataset);
    console.log(series);
    // area = d3
    //   .area()
    //   .x(d => {
    //     return xScale(d.data.chapter);
    //   })
    //   .y0(d => yScale(d[0]))
    //   .y1(d => yScale(d[1]))
    //   .curve(d3.curveCatmullRom.alpha(0.5));
    // for (let i = 0; i < keys.length; i++) {
    // series[]
    // let lo = 0, hi = 0;
    // for (let j = 0; j < dataset.length; j++) {
    //   hi = lo + dataset[j][keys[i]];
    //   series[i][j].height = hi;
    //   lo = hi;
    // }

    // }
    // console.log(series);
    area = d3
      .area()
      .x(d => xScale(d.data.chapter))
      .y0(d => yScale(d[0]))
      .y1(d => yScale(d[1]));
    // series.slice(0,10)
    var $path = $ele
      .selectAll('g')
      .data(series)
      .enter()
      .append('g')
      .attr('class', 'area');

    var colors = d3.scaleOrdinal(d3.schemeCategory10);
    $path
      .append('path')
      .attr('transform', 'translate(' + template.padding + ',0)')
      .attr('d', area)
      .attr('class', (d, i) => i)
      .attr('fill', function(d, i) {
        return get_colors(i);
      })
      .on('mouseover', function() {
        $path
          .select('path')
          .attr('fill', '#999')
          .attr('opacity', '0.8');

        console.log(this);
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

    var legend = d3
      .select('#legend')
      .append('div')
      .attr("class", "legend")

      // .attr('width', 400)
      // .attr('height', template.height - template.padding);

    var legends = legend
      .selectAll('div')
      .data(series)
      .enter()
      .append("span")

    legends
      .append('div')
      .attr("class","icon")
      .style('background-color', function(d, i) {
        // console.log("------",d);
        return get_colors(i);
      })
      // .style('height', 20)
      // .style('width', 20)
      // .stye('transform', (d, i) => {
      //   return (
      //     'translate(' + parseInt(i / 28) *80 + ',' + (parseInt(i % 28) * 25 + 20) + ')'
      //   );
      // });

    legends.append("text")
     .text((d)=>d.key)
     .style("font-size","12px")
      .attr('transform', (d, i) => {
        return (
          'translate(' + (parseInt(i / 28)*80 + 20) + ',' + (parseInt(i % 28) * 25 + 33) + ')'
        );
      });
  }

  loadData(template.data)
    .then(parsed_data => {
      debug && console.log(keys);
      initScale(parsed_data);
      initAxis($chart);
      render($chart, parsed_data);
    })
    .catch(error => {
      console.log(error);
    });
})();
