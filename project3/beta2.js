(function () {
  var template = {
    width: '1200',
    height: '520',
    json: '水浒各章节人物出场次数.csv',
    padding: 20,
    xScaleTick: 50,
    yScaleTick: 20
  };

  var timeline = {
    width: '1200',
    height: '220',
    padding: 20
  };
  const debug = true;

  var xScale, yScale;
  var xAxis, yAxis;
  var xScale_, yScale_;
  var xAxis_, yAxis_;
  var stack,
    keys,
    keys_ = [];
  var area, $path;
  var series;
  var brush;
  var _scale = 1;
  var toUpdate = false;
  var updateIndex ;//存储area显示的颜色的次序

  var showLegend, legends;
  var $chart = d3
    .select('#chart')
    .append('svg')
    .attr('width', template.width)
    .attr('height', template.height);

  function loadData(file) {
    return new Promise((resolve, reject) => {
      d3.csv(file, function (error, data) {
        if (error) {
          reject(error);
        } else {
          keys = data.columns;
          keys.shift();

          showLegend = new Array(keys.length);
          showLegend.fill(1, 0, 10);
          showLegend.fill(0, 10);
          updateIndex =[];
          for (let index = 0; index < 10; index++) {
            updateIndex.push(index)
          }
          // showLegend.fill(1)
          // console.log(showLegend);
          resolve(data);
        }
      });
    });
  }

  function get_colors(n) {
    var colors = [
      '#cab2d6',
      // '#c19898',
      '#a57a7a',
      '#b2df8a',
      '#6a3d9a',
      '#33a02c',
      '#fb9a99',
      '#fdbf6f',
      '#1d5464',
      '#207e82',
      '#1f78b4',
      // '#a6cee3',
      // '#ff7f00',
      // '#ebff66',
      // '#d8d860'
    ];

    return colors[n % colors.length];
  }

  function update(data) {
    // update yScale:
    inityScale(data);

    $chart
      .select('.y')
      .transition()
      .call(yAxis);

    //update series
    stack = d3
      .stack()
      .order(d3.stackOrderAescending)
      .keys(keys_);
    series = stack(data);

    toUpdate = true;
  }

  function inityScale(dataset) {
    const debug = false;

    var sumTemp = 0;
    dataset.map(inner => {
      let temp = 0;
      let innerArray = Object.entries(inner);
      for (let index = 1; index < innerArray.length; index++) {
        const value = innerArray[index][1];
        if (showLegend[index - 1]) {
          parseInt(value) > 0 && (temp += +value);
        }
      }
      sumTemp = Math.max(sumTemp, temp);
    });
    yScale = d3
      .scaleLinear()
      .domain([0, sumTemp])
      .range([template.height - template.padding, template.padding])
      .nice();

    debug && console.log(sumTemp);
    debug && console.log(yScale.domain());

    yAxis = d3
      .axisLeft()
      .scale(yScale)
      .ticks(yScale.domain()[1] / template.yScaleTick);
  }

  function initScale(dataset) {
    xScale = d3
      .scaleLinear()
      .domain([1, dataset[dataset.length - 1]['chapter']])
      .range([template.padding, template.width - 2 * template.padding]);

    xAxis = d3
      .axisBottom()
      .scale(xScale)
      .ticks(template.xScaleTick);

    inityScale(dataset);
  }

  function render($ele, data) {
    console.log(data);

    for (let index = 0; index < showLegend.length; index++) {
      if (showLegend[index]) {
        keys_.push(keys[index]);
      }
    }
    stack = d3
      .stack()
      .order(d3.stackOrderAescending)
      .keys(keys_);
    series = stack(data);

    area = d3
      .area()
      .x(function (d) {
        return xScale(d.data.chapter);
      })
      .y0(function (d) {
        return yScale(d[0]);
      })
      .y1(function (d) {
        return yScale(d[1]);
      })
      .curve(d3.curveBasis)
      // .curve(d3.curveCatmullRom.alpha(0.5));

    renderAllAreas(data);
    renderAllLegends();

    $chart.append("rect").attr("width", 2 * template.padding).attr('height', template.height + 2 - template.padding)
      .attr('fill', '#fff')
    $chart.append("rect").attr("width", template.padding).attr('height', template.height + 2 - template.padding)
      .attr('transform', 'translate(' + (template.width - template.padding) + ', 0)')
      .attr('fill', '#fff')
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

  function renderAllAreas(data) {
    if ($path === undefined) {
      // $chart.append("g")
      //   .attr("class","areas");
      $path = $chart.append("g")
        .attr("class", "areas")
        .selectAll('g')
        .data(series)
        .enter()
        .append('g')
        .attr('class', 'area');

      renderArea($path, data);
    } else {
      var $path_ = $chart.selectAll('g.area').data([]);
      $path_.exit().remove();
      console.log("---",$path);
      $path =
      // $path_
      $path.select('g.areas')
      // $path_
        .data(series)
        .enter()
        .append('g')
        .attr('class', 'area');

      renderArea($path, data);
    }
  }

  function renderArea($ele, data) {
    console.log(updateIndex);
    let t = d3
      .transition()
      .duration(1000)
      .delay((d, i) => 200 * i)
      .ease();

      console.log(showLegend);
    $ele
      .append('path')
      .transition(t)
      .attr('d', area)
      .attr('fill', function (d, i) {
        if (toUpdate===true) {
          return get_colors(updateIndex[i])
        }
        return get_colors(i);
      });

    $ele
      .selectAll('path')
      .attr('class', (d, i) => i)
      .attr('transform', 'translate(' + template.padding + ',0)')
      .attr('title', d => d.key)
      .on('mouseover', function (d, i) {
        // 修改颜色
        $ele
          .select('path')
          .attr('fill', '#999')
          .attr('opacity', '0.8');

        d3.select(this)
          .attr('fill', () => {
             if (toUpdate===true) {
               return get_colors(updateIndex[i])
             }
             return get_colors(i);
          })
          .attr('opacity', '1');

        // 展示章节
        let cor = d3.mouse(this);
        console.log(_scale);
        let chapter_ = Math.round(
          xScale.domain()[0] + cor[0] / ( (template.width - template.padding) / (xScale.domain()[1] - xScale.domain()[0]))
        );
        showLegendChapter(chapter_, data);
      })
      .on('mouseout', function () {
        $ele
          .select('path')
          .attr('fill', function (d, i) {
             if (toUpdate===true) {
               return get_colors(updateIndex[i])
             }
             return get_colors(i);
          })
          .attr('opacity', '1');
      })
      .append('svg:title')
      .text(d => d.key);
  }

  function showLegendChapter(chapter, data) {
    let ele = document.getElementById('chapter');
    if (chapter !== -1) {
      ele.classList.remove('hide');
      ele.innerText = '第' + chapter + '回';
      if (data === undefined) {
        console.log('error');
      }
      let people = data[chapter - 1];
      let show = [];
      let index = 0;
      for (const key in people) {
        if (key != 'chapter' && people[key] != 0) {
          show.push([key, people[key], index, showLegend[index]]);
        }
        index++;
      }

      show.sort((a, b) => b[1] - a[1]);
      renderAllLegends(show, data);
    } else {
      ele.classList.add('hide');
    }
  }

  function renderAllLegends(chapterLegend, data) {
    if (chapterLegend !== undefined) {

      var legend;

      legend = d3
        .select('.legend')
        .data([])
        .exit()
        .remove();

      setTimeout(() => {
        legend = d3
          .select('#legend')
          .append('div')
          .attr('class', 'legend');

        legends = legend
          .selectAll('div')
          .data(chapterLegend)
          .enter()
          .append('span')
          .attr('id', (d, i) => d[2]);

        legends
          .append('p')
          .attr('class', 'number')
          .text(d => d[1]);
        console.log('-------\n', chapterLegend);
        legends
          .append('div')
          .attr('class', 'icon')
          .style('background-color', function (d) {
            if (d[3] === true || d[3] === 1) {
              console.log(d[3]);
              return get_colors(d[2]-1);
            } else {
              return '#999';
            }
          });

        legends.append('p').text(d => d[0]);
        onClickLegends(data, 2);
      }, 0);
    }

    if (legends === undefined) {
      var legend = d3
        .select('#legend')
        .append('div')
        .attr('class', 'legend');

      legends = legend
        .selectAll('div')
        .data(keys)
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
      // console.log('show undefined');
    } else {
      let showOrder = 0;
      legends.selectAll('.icon').style('background-color', function () {
        if (showLegend[showOrder]) {
          let temp = showOrder;
          showOrder++;
          return get_colors(temp);
        } else {
          showOrder++;
          return '#999';
        }
      });
      console.log('click');
    }
  }

  function onClickLegends(data, type) {
    document.getElementsByClassName('legend')[0].addEventListener(
      'click',
      event => {
        let target = event.target || event.srcElement;
        let index = target.parentNode.getAttribute('id');
        if (index) {
          // console.log(showLegend);
          showLegend[index] = !showLegend[index];
          // console.log(showLegend)
          let icon = document.getElementById(index).firstChild;
          if (icon) {
            if (showLegend[index]) {
              if (type == 2) {
                icon.nextSibling.style.backgroundColor = get_colors(index);
              } else {
                icon.style.backgroundColor = get_colors(index);
              }
            } else {
              if (type == 2) {
                icon.nextSibling.style.backgroundColor = '#999';
              } else {
                icon.style.backgroundColor = '#999';
              }
            }

            let i = keys_.indexOf(keys[index]);
            if (i === -1) {
              console.log(keys_);
              keys_.push(keys[index]);
              updateIndex.push(+index);
            } else {
              keys_.splice(i, 1);
              updateIndex.splice(i,1)
            }
            update(data);
            renderAllAreas(data);
          }
        }
      },
      true
    );
  }

  function onClickAll(data) {
    document.getElementById('all').addEventListener('click', () => {
      var legend = d3
        .select('#legend')
        .select('.legend')
        .data([])
        .exit()
        .remove();

      legends = d3
        .select('#legend')
        .append('div')
        .attr('class', 'legend')
        .selectAll('div')
        .data(keys)
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

      onClickLegends(data);
      showLegendChapter(-1);
    });
  }

  function renderTimeline(dataset) {
    //    handle data
    var sum = [];
    dataset.map(inner => {
      let temp = 0;
      let innerArray = Object.entries(inner);
      for (let index = 1; index < innerArray.length; index++) {
      //  if (showLegend[index-1]) {
          const value = innerArray[index][1];
          parseInt(value) > 0 && (temp += +value);
      //  }
      }
      // console.log(inner);
      sum.push({
        chapter: parseInt(inner.chapter),
        value: temp
      });
    });
    console.log(sum);
    // define scale & axis
    xScale_ = d3
      .scaleLinear()
      .domain([1, dataset[dataset.length - 1]['chapter']])
      .range([template.padding, template.width - 2 * template.padding]);

    xAxis_ = d3
      .axisBottom()
      .scale(xScale_)
      .ticks(template.xScaleTick);

    yScale_ = d3
      .scaleLinear()
      .domain([d3.min(sum, d => d.chapter), d3.max(sum, d => d.value)])
      .range([timeline.height - template.padding, template.padding]);
    yAxis_ = d3
      .axisLeft()
      .scale(yScale_)
      .ticks(8);

    var $timeline = d3
      .select('#timeline')
      .append('svg')
      .attr('width', timeline.width)
      .attr('height', timeline.height);

    $timeline
      .append('g')
      .attr('class', 'x axis')
      .attr(
        'transform',
        'translate( ' +
        timeline.padding +
        ',' +
        (timeline.height - timeline.padding) +
        ')'
      )
      .call(xAxis_);

    $timeline
      .append('g')
      .attr('class', 'y axis')
      .attr('transform', 'translate(' + timeline.padding * 2 + ',0)')
      .call(yAxis_);

    let areaT = d3
      .area()
      .x(function (d, i) {
        // console.log(d);
        return xScale_(d.chapter);
      })
      .y1(function (d) {
        return yScale_(d.value);
      })
      .y0(yScale_(0))
      // .curve(d3.curveCatmullRom.alpha(0.1));
      .curve(d3.curveNatural)

    var line = d3
      .line()
      .x(d => xScale_(d.chapter))
      .y(d => yScale_(d.value));

    $timeline
      .append('path')
      .datum(sum)
      .attr('class', 'area')
      .attr('d', areaT)
      .attr('transform', 'translate(' + template.padding + ',0)');
    // $timeline.append("g").append("path")
    //     .datum(sum)
    //     .enter()
    //     .attr('d', area);
    //brush

    brush = d3
      .brushX()
      .extent([
        [xScale_(1), 0],
        [timeline.width, timeline.height]
      ])
      .on('brush', brushed);

    // $timeline.append("g")
    //     .attr("class", "brush")
    //     .call(d3.brush().extent([timeline.padding, timeline.padding], [timeline.width / 2, timeline.height / 2]).on("brush", brushed));
    $timeline
      .append('g')
      .attr('class', 'brush')
      .call(brush)
      .call(brush.move, xScale_.range().map(value => value / 2));
    // console.log(xScale_.range());
  }

  // function renderbrush() {

  // }

  function brushed() {
    var debug = false;
    debug && console.log('brush');
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return; // ignore brush-by-zoom
    var s = d3.event.selection || xScale_.range();
    debug && console.log(s.map(xScale_.invert, xScale_));
    var smap = s.map(xScale_.invert, xScale_);
    if (smap[0] < 0) {
      let helper = 0 - smap[0];
      smap[0] = 0;
      smap[1] += helper;
    }
    if (smap[1] > 120) {
      smap[0] -= (smap[1] - 120);
      smap[1] = 120;
    }
    let t = d3.transition().ease(d3.easePolyOut)
    $chart.select('.x').transition(t);
    xScale.domain(smap).nice();
    debug && console.log(xScale.domain());

    // console.log(brush.extent());
    _scale = 2;
    xAxis = d3
      .axisBottom()
      .scale(xScale)
      .ticks(template.xScaleTick);
      // let t = d3.transition
    $chart
      .selectAll('g.area')
      .select('path')
      .transition(t)
      .attr('d', area)
      .attr('transform', 'translate(' + template.padding + ',0)');


    $chart.select('g.x').call(xAxis);
  }

  loadData(template.json)
    .then(parsed_data => {
      initScale(parsed_data);
      render($chart, parsed_data);
      onClickLegends(parsed_data);
      onClickAll(parsed_data);
      renderTimeline(parsed_data);
    })
    .catch(error => {
      console.log(error);
    });
})();
