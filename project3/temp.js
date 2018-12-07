/*** to define the style */
var template = {
  width: '1200',
  height: '520',
  json: '水浒各章节人物出场次数.csv',
  padding: 20,
  xScaleTick: 60,
  yScaleTick: 20
};

const debug = true;
(function(data) {
  var xScale;
  var yScale;
  var xAxis;
  var yAxis;
  var stack;
  var keys,keysAll;
  var area,$path;
  var series;

  var showLegend, legends;
  var $chart = d3
    .select('#chart')
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
          keys = data.columns;
          keys.shift();

          showLegend = new Array(keys.length);
          showLegend.fill(1, 0, 10);
          showLegend.fill(0, 10);
            // showLegend.fill(1, 0, 2);
            // showLegend.fill(0, 2);
          console.log(showLegend);
          keysAll = [...keys];
        //   keys = keys.slice(0,10) ;
          resolve(data);
        }
      });
    });
  }

  function render($ele, data) {
    console.log(data);
    stack = d3
      .stack()
      .order(d3.stackOrderDescending)
      .keys(keys);
    series = stack(data);
    area = d3
      .area()
      .x(function(d) {
        return xScale(d.data.chapter);
      })
      .y0(function(d) {
        return yScale(d[0]);
      })
      .y1(function(d) {
        return yScale(d[1]);
      })
      .curve(d3.curveCatmullRom.alpha(0.5));

    renderAllAreas();
    renderAllLegends();

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
      '#ebff66',
      '#d8d860'
    ];

    return colors[n % colors.length];
  }

  function initScale(dataset) {
      console.log(dataset);
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

    xScale = d3
      .scaleLinear()
      .domain([1, dataset[dataset.length - 1]['chapter']])
      .range([template.padding, template.width - 2 * template.padding]);
    yScale = d3
      .scaleLinear()
      .domain([0, sumTemp])
      .range([template.height - template.padding, template.padding / 2])
      .nice();

    debug && console.log(yScale.domain());
  }

  function initAxis() {
    xAxis = d3
      .axisBottom()
      .scale(xScale)
      .ticks(template.xScaleTick);

    yAxis = d3
      .axisLeft()
      .scale(yScale)
      .ticks(template.yScaleTick);
  }

  function renderAllLegends() {
      if(legends === undefined) {
          var legend = d3
              .select('#legend')
              .append('div')
              .attr('class', 'legend');

          legends = legend
              .selectAll('div')
              .data(keysAll)
              .enter()
              .append('span')
              .attr('id', (d, i) => i);

          legends
              .append('div')
              .attr('class', 'icon')
              .style('background-color', function (d, i) {
                  if (showLegend[i]) {
                      return get_colors(i);
                  } else {
                      return '#999';
                  }
              });

          legends.append('p').text(d => d);
          console.log('show undefined');
      } else {
          let showOrder = 0;
          legends.selectAll(".icon")
              .style('background-color', function (){

                  if (showLegend[showOrder]) {
                      return get_colors(showOrder++);
                  } else {
                    showOrder++;
                    return '#999';
                  }
              });
        console.log("again")
      }
    // .attr('transform', (d, i) => {
    //     return (
    //         'translate(' + (parseInt(i / 28) * 80 + 20) + ',' + (parseInt(i % 28) * 25 + 33) + ')'
    //     );
    // });
  }

  function onClickLegends() {
    document.getElementsByClassName('legend')[0].addEventListener('click', e => {
        let target = event.target || event.srcElement;
        let index = target.parentNode.getAttribute('id');
        if(index){
            showLegend[index] = !showLegend[index];

            let icon = document.getElementById(index);
            if (icon) {
                if (showLegend[index]) {
                    icon.firstChild.style.backgroundColor = get_colors(index);
                } else {
                    icon.firstChild.style.backgroundColor = '#999';
                }

                let j = document.getElementsByClassName(index)[0];
                // console.log(j);
                j.classList.toggle('hide');
            }
        }
      },true);
  }

  function renderAllAreas() {
      if ($path === undefined) {

          $path = $chart
              .selectAll('g')
              .data(series)
              .enter()
              .append('g')
              .attr('class', 'area');

          $path
              .append('path')
              .attr('transform', 'translate(' + template.padding + ',0)')
              .attr('d', area)
              .attr('class', (d, i) => {
                  if (showLegend[i]) {
                      return i;
                  } else {
                      return i + ' hide';
                  }
              })
              .attr('fill', function (d, i) {
                  return get_colors(i);
              })
              .on('mouseover', function () {
                  $path
                      .select('path')
                      .attr('fill', '#999')
                      .attr('opacity', '0.8');

                //   console.log(xScale(d3.mouse(this)[0]));
                    var cor = d3.mouse(this);
                    console.log(xScale((cor[0] + template.padding) / (template.width-template.padding)));
                  d3.select(this)
                      .attr('fill', '#d8d860')
                      .attr('opacity', '1')
                      .attr('title',(d)=>d.key);

                console.log(this)
              })
              .on('mouseout', function () {
                  $path
                      .select('path')
                      .attr('fill', function (d, i) {
                          return get_colors(i);
                      })
                      .attr('opacity', '1');
                  $path.select('text').attr('fill', function (d, i) {
                      return get_colors(i);
                  });
              });
      } else {
          let areaOrder = 0;
          $path.selectAll("path").attr('class', () => {
              if (showLegend[areaOrder]) {
                  return (areaOrder++);
              } else {
                  return (areaOrder++) + ' hide';
              }
          })
      }
  }

  function onClickAll() {
      document.getElementById("all").addEventListener('click',()=>{
          showLegend.fill(1, 0, 10);
          showLegend.fill(0, 10);
          renderAllLegends();
          renderAllAreas()
      })
  }
  loadData(data)
    .then(parsed_data => {
      initScale(parsed_data);
      initAxis();
      render($chart, parsed_data,keys);
      onClickLegends();
      onClickAll();
    })
    .catch(error => {
      console.log(error);
    });
})(template.json);
