var template = {
  width: '1000',
  height: '1000',
  padding: 20,
  xScaleTick: 50,
  yScaleTick: 20
};
const debug = true;
// scatter
var margin = {
  top: 30,
  right: 50,
  bottom: 60,
  left: 40
};

var treeMargin = {
  top: 30,
  right: 5,
  bottom: 60,
  left: 0
};
var scatterWidth = 1200 - margin.left - margin.right;
var scatterHeight = 960 - margin.top - margin.bottom;

d3.csv('../data/event.csv', function(err, response) {
  var svg, scenes, charactersMap, width, height, sceneWidth;
  console.log(err);

  var data = {
    characters: [],
    scenes: []
  };

  response.sort((a, b) => a['年份'] - b['年份']);

  d3.csv('../data/relation.csv', function(err, res) {
    err && console.log(err);

    /**108 将中每个人的党派关系 */
    let groups = {
      无党派: []
    };

    /**
     * 修改relation的数据为符合要求的单节点数据：
     *      如果是"relation"是自己,则将group定为相关根节点
     *
     */
    let hierarchyData = res.slice();
    res.forEach((ele, index) => {
      let _group = ele.group;
      if (_group === '无党派') {
        groups['无党派'].push(ele);
      } else if (groups.hasOwnProperty(_group)) {
        groups[_group].push(ele);
      } else {
        groups[_group] = [ele];
      }

      if (ele['relation'] === '自己') {
        hierarchyData[index]['group'] = 'root';
      }
    });
    console.log(hierarchyData);
    hierarchyData.push(
      {
        id: 109,
        star: '',
        nickname: '',
        name: 'root',
        group: '',
        relation: ''
      },
      {
        id: 110,
        star: '',
        nickname: '',
        name: '无党派',
        group: 'root',
        relation: ''
      }
    );

    // 每个人对应的大党派关系
    let groupMaps = new Map();
    Object.keys(groups).forEach(key => {
      groups[key].forEach(item => {
        // console.log(item);
        if (
          key == '关胜' ||
          key == '呼延灼' ||
          key == '张清' ||
          key == '戴宗' ||
          key == '李逵' ||
          key == '穆弘' ||
          key == '李俊' ||
          key == '欧鹏' ||
          key == '燕顺'
        ) {
          groupMaps.set(item.name, '宋江');
        } else if (key == '史进') {
          groupMaps.set(item.name, '鲁智深');
        } else {
          groupMaps.set(item.name, key);
        }
      });
    });

    // console.log(groupMaps);
    const colorThemes = {
      宋江: 'song',
      鲁智深: 'lu',
      林冲: 'lin',
      卢俊义: 'yi',
      无党派: 'wu',
      李应: 'li',
      孙立: 'sun'
    };
    // bigGroup.set('宋江',groups['宋江'].concat(groups["关胜"],groups["呼延灼"],
    //                                         groups["张清"],groups["戴宗"],
    //                                         groups["李逵"],groups["穆弘"],
    //                                         groups["李俊"],groups["欧鹏"],groups["燕顺"]));
    // bigGroups.set('鲁智深',groups["史进"]);

    /** 在event.csv中出现的所有人*/
    var peopleSet = new Set();
    // /** 在event.csv中出现的所有地点 */
    /**
     *      记录每一年最早出现的事件Id
     */
    var eventYearMap = new Map();
    /** 对每个事件的人物展开 ;同一事件用同样的颜色
                 * scatterData = [{
                    'person':'高俅',
                    'chapter':'2',
                    'eventId':'编号'//可以对应到response[eventId-1]
                }]
            */
    var scatterData = [];

    response.forEach((ele,index) => {
      ele['编号']= index+1;//编号修改成按照事件发生顺序
      let arr = ele['人物'].split('、');
      if (!eventYearMap.has(+ele['年份'])) {
        eventYearMap.set(+ele['年份'], +ele['编号']);
      }
      // 为event.csv中每一项增加一个属性，保存人物数组
      ele.personArr = arr;

      arr.forEach(k => {
        peopleSet.add(k);

        scatterData.push({
          person: k,
          chapter: ele['章回'],
          eventId: ele['编号']
        });
      });
      data.scenes.push({
        people: arr,
        chapter: ele['章回'],
        loc: ele['地点（可确定）'],
        event: ele['事件'],
        index: index + 1,
      });
    });
    // peopleSet.forEach(ele => {
    //   // console.log('theme',colorThemes[groupMaps.get(ele)],ele);
    //   data.characters.push({
    //     id: ele,
    //     name: ele,
    //     affiliation: colorThemes[groupMaps.get(ele)]
    //       ? colorThemes[groupMaps.get(ele)]
    //       : 'light'
    //   });
    // });
    console.log(peopleSet);
    console.log(response);

    makeSlider();
    drawScatter();
    drawTree();

    function drawStoryLine(data,sceneSpan = 10) {
      // Get the data in the format we need to feed to d3.layout.narrative().scenes
      scenes = wrangle(data);
      console.log(scenes);
      // Some defaults
      sceneWidth = 5;
      width = scenes.length * sceneWidth * sceneSpan;
      height = 600;

      // The container element (this is the HTML fragment);
      if (document.getElementById('narrative-chart')) {
        document.getElementById('narrative-chart').remove();
      }
      svg = d3
        .select('#story')
        .append('svg')
        .attr('id', 'narrative-chart')
        .attr('width', width)
        .attr('height', height)
        .attr('transform','translate(0,10)');

      // Calculate the actual width of every character label.
      scenes.forEach(function(scene) {
        scene.characters.forEach(function(character) {
          character.width =
            svg
              .append('text')
              .attr('opacity', 0)
              .attr('class', 'temp')
              .text(character.name)
              .node()
              .getComputedTextLength() + 10;
        });
      });

      // Remove all the temporary labels.
      svg.selectAll('text.temp').remove();

      // console.log(typeof d3.layout.narrative);
      // Do the layout
      narrative = d3.layout
        .narrative()
        .scenes(scenes)
        .size([width, height])
        .pathSpace(8)
        .groupMargin(1)
        .labelSize([10, 10])
        .scenePadding([5, sceneWidth / 2, 5, sceneWidth / 2])
        .labelPosition('left')
        .layout();

      // Get the extent so we can re-size the SVG appropriately.
      svg.attr('height', narrative.extent()[1]);

       const tooltip = d3.select('#story').append("div")
         .classed("tooltip", true)
         .style("opacity", 0);

      // Draw links
      var links = svg
        .selectAll('.link')
        .data(narrative.links())
        .enter()
        .append('path')
        .attr('class', function(d) {
          return 'link ' + d.character.affiliation.toLowerCase();
        })
        .attr('d', narrative.link());

        links.on('mouseover',d=>{
          console.log(d);
          tooltip.transition()
            .duration(300)
            .style("opacity", 1) // show the tooltip
          tooltip.html(() => {
              return d.character.id;
            })
            .style("left", (d3.event.pageX - d3.select('.tooltip').node().offsetWidth - 5) + "px")
            .style("top", (d3.event.pageY - d3.select('.tooltip').node().offsetHeight) + "px");
        }).on('mouseout',d=>{
         tooltip.transition()
           .duration(300)
           .style("opacity", 0) // show the tooltip
        });

      // Draw the scenes
      var $scenes = svg
        .selectAll('.scene')
        .data(narrative.scenes())
        .enter()
        .append('g')
        .attr('class', 'scene')
        .attr('transform', function(d) {
          var x, y;
          x = Math.round(d.x) + 0.5;
          y = Math.round(d.y) + 0.5;
          return 'translate(' + [x, y] + ')';
        });

      var index = 0;//当前显示的事件详情的编号。以免多次添加元素
      createDetailELe(narrative.scenes()[0]);
      $scenes
        .append('rect')
        .attr('width', sceneWidth)
        .attr('height', function(d) {
          return d.height;
        })
        .attr('y', 0)
        .attr('x', 0)
        .attr('rx', 3)
        .attr('ry', 3);


      $scenes.on('mouseover', d => {
        // console.log(d);

        if (index!= d.index) {
          createDetailELe(d);
        }
      });

      function createDetailELe(d) {
        if (d) {
          var $detail = document.getElementById('event-detail');
          document.getElementsByTagName('ul')[0].remove();
          var $ul = document.createElement('ul');
          var _characters = '';
          d.characters.forEach(ele => {
            _characters += ele.id + '、';
          });
          $ul.innerHTML = `
                    <li>
                        <p>事件详情</p>
                        <div class="item">
                            <div><span>序号</span><h3>${d.index}</h3><span>章节</span><h3>${d.chapter}</h3></div>
                            <span class="details">${d.event}</span>
                        </div>
                    </li>
                    <li>
                        <p>人物</p>
                        <p class="people">${_characters}</p>
                    </li>
                    <li>
                        <p>地点</p>
                        <span>${d.loc}</span>
                    </li>`;
          $detail.appendChild($ul);
        }

      }

      // Draw appearances
      svg
        .selectAll('.scene')
        .selectAll('.appearance')
        .data(function(d) {
          return d.appearances;
        })
        .enter()
        .append('circle')
        .attr('cx', function(d) {
          return d.x;
        })
        .attr('cy', function(d) {
          return d.y;
        })
        .attr('r', function() {
          return 2;
        })
        .attr('class', function(d) {
          return 'appearance ' + d.character.affiliation;
        });

      // Draw intro nodes
      svg
        .selectAll('.intro')
        .data(narrative.introductions())
        .enter()
        .call(function(s) {
          var g, text;

          g = s.append('g').attr('class', 'intro');

          g.append('rect')
            .attr('y', -4)
            .attr('x', -4)
            .attr('width', 4)
            .attr('height', 8);

          text = g.append('g').attr('class', 'text');

          // Apppend two actual 'text' nodes to fake an 'outside' outline.
          text.append('text');
          text.append('text').attr('class', 'color');

          g.attr('transform', function(d) {
            var x, y;
            x = Math.round(d.x);
            y = Math.round(d.y);
            return 'translate(' + [x, y] + ')';
          });

          g.selectAll('text')
            .attr('text-anchor', 'end')
            .attr('y', '4px')
            .attr('x', '-8px')
            .text(function(d) {
              return d.character.name;
            });

          g.select('.color').attr('class', function(d) {
            return 'color ' + d.character.affiliation;
          });

          g.select('rect').attr('class', function(d) {
            return d.character.affiliation;
          });
        });
    }

    function drawTree() {
      var width = 450 - treeMargin.left - treeMargin.right;
      var height = 960 - treeMargin.top - treeMargin.bottom;

      /**
       * d3.select('#treeNodes').append('svg')
       * */
      var $treeSvg = d3
        .select('#treeNodes')
        .append('svg')
        .attr('width', width + treeMargin.left + treeMargin.right)
        .attr('height', height + treeMargin.top + treeMargin.bottom)
        .append('g')
        .attr(
          'transform',
          'translate(' + treeMargin.left + ',' + treeMargin.top + ')'
        );

      //转换派系关系数据
      var root = d3
        .stratify()
        .id(d => d['name'])
        .parentId(d => d['group'])(hierarchyData);
      console.log('root', root);

      var i = 0,
        duration = 750;
      var treemap = d3
        .tree()
        .size([height, width])
        .separation((a, b) => (a.parent === b.parent ? 20: 22));

      root.x0 = height / 2;
      root.y0 = 0;

      // treemap(root);
      // Collapse after the second level
      // root.children.forEach(collapse);

      update(root);

      // Collapse the node and all it's children
      // function collapse(d) {
      //     console.log(d);
      //     if (d.children) {
      //         d._children = d.children
      //         d._children.forEach(collapse)
      //         d.children = null
      //     }
      // }
      var toStop = false;
      var index = 0;
      document.getElementById('toggle').addEventListener('click', function(e) {
        if (toStop) {
          toStop = false;
        } else {
          toStop = true;
          animateEvents();
        }
      });

      function animateEvents() {
        if (index == 258) {
          index = 0;
        }
        //动画
        function action(index) {
          var $node = $treeSvg.selectAll('g.node').select('circle.node');
          var ele = response[index];
          $node.classed('node-selected', false).attr('class', d => {
            let flag = false;
            ele.personArr.forEach(p => {
              if (p == d.id) {
                flag = true;
              }
            });
            return flag ? 'node node-selected' : 'node';
          });

          return ++index;
        }

        var timerId = setTimeout(function tick() {
          index = action(index);
          // console.log(index);
          clearTimeout(timerId);

          if (index < 258 && toStop) {
            timerId = setTimeout(tick, 500);
          }
        }, 500);
      }

      function update(source) {
        // Assigns the x and y position for the nodes
        var treeData = treemap(root);

        // Compute the new tree layout.
        var nodes = treeData.descendants(),
          links = treeData.descendants().slice(1);

        // Normalize for fixed-depth.
        nodes.forEach(function(d) {
          d.y = d.depth * 100;
        });

        // Update the nodes...
        var node = $treeSvg.selectAll('g.node').data(nodes, function(d) {
          return d.id || (d.id = ++i);
        });

        // Enter any new modes at the parent's previous position.
        var nodeEnter = node
          .enter()
          .append('g')
          .attr('class', 'node')
          .attr('transform', function(d) {
            return 'translate(' + source.y0 + ',' + source.x0 + ')';
          })
          .on('click', click);

        // Add Circle for the nodes
        nodeEnter
          .append('circle')
          .attr('class', 'node')
          .attr('r', 1e-6)
          .style('fill', function(d) {
            return d._children ? 'lightsteelblue' : '#fff';
          });

        // Add labels for the nodes
        nodeEnter
          .append('text')
          .attr('dy', '.35em')
          .attr('x', function(d) {
            return d.children || d._children ? -13 : 13;
          })
          .attr('text-anchor', function(d) {
            return d.children || d._children ? 'end' : 'start';
          })
          .text(function(d) {
            return d.data.name;
          });

        // UPDATE
        var nodeUpdate = nodeEnter.merge(node);

        // Transition to the proper position for the node
        nodeUpdate
          .transition()
          .duration(duration)
          .attr('transform', function(d) {
            return 'translate(' + d.y + ',' + d.x + ')';
          });

        // Update the node attributes and style
        nodeUpdate
          .select('circle.node')
          .attr('r', 3)
          .style('fill', function(d) {
            return d._children ? 'lightsteelblue' : '#fff';
          })
          .attr('cursor', 'pointer');

        // Remove any exiting nodes
        var nodeExit = node
          .exit()
          .transition()
          .duration(duration)
          .attr('transform', function(d) {
            return 'translate(' + source.y + ',' + source.x + ')';
          })
          .remove();

        // On exit reduce the node circles size to 0
        nodeExit.select('circle').attr('r', 1e-6);

        // On exit reduce the opacity of text labels
        nodeExit.select('text').style('fill-opacity', 1e-6);

        // ****************** links section ***************************

        // Update the links...
        var link = $treeSvg.selectAll('path.link').data(links, function(d) {
          return d.id;
        });

        // Enter any new links at the parent's previous position.
        var linkEnter = link
          .enter()
          .insert('path', 'g')
          .attr('class', 'link')
          .attr('d', function(d) {
            var o = { x: source.x0, y: source.y0 };
            return diagonal(o, o);
          });

        // UPDATE
        var linkUpdate = linkEnter.merge(link);

        // Transition back to the parent element position
        linkUpdate
          .transition()
          .duration(duration)
          .attr('d', function(d) {
            return diagonal(d, d.parent);
          });

        // Remove any exiting links
        var linkExit = link
          .exit()
          .transition()
          .duration(duration)
          .attr('d', function(d) {
            var o = { x: source.x, y: source.y };
            return diagonal(o, o);
          })
          .remove();

        // Store the old positions for transition.
        nodes.forEach(function(d) {
          d.x0 = d.x;
          d.y0 = d.y;
        });

        // Creates a curved (diagonal) path from parent to the child nodes
        function diagonal(s, d) {
          path = `M ${s.y} ${s.x}
                            C ${(s.y + d.y) / 2} ${s.x},
                            ${(s.y + d.y) / 2} ${d.x},
                            ${d.y} ${d.x}`;
          return path;
        }

        // Toggle children on click.
        function click(d) {
          if (d.children) {
            d._children = d.children;
            d.children = null;
          } else {
            d.children = d._children;
            d._children = null;
          }
          update(d);
        }
      }
    }
    function drawScatter() {
      //setting
      var $scatter = d3
        .select('#scatter')
        .append('svg')
        .attr('width', scatterWidth + margin.left + margin.right)
        .attr('height', scatterHeight + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
      // var yScale = d3.scaleLinear().range([scatterHeight, 0]);

      var xScale_ = d3.scaleBand().range([0, scatterWidth]);
      var yScale_ = d3
        .scaleLinear()
        .range([scatterHeight, 0])
        .nice();

      var xAxis = d3
        .axisBottom()
        .scale(xScale_)
        .tickPadding([20]);
      var yAxis = d3
        .axisLeft()
        .scale(yScale_)
        .ticks(71);
      var color = d3.scaleOrdinal(d3.schemeCategory20);
      // gridlines in x axis function
      function make_x_gridlines() {
        return d3.axisBottom(xScale_).ticks(20);
      }

      // gridlines in y axis function
      function make_y_gridlines() {
        return d3.axisLeft(yScale_).ticks(258);
      }

      // add the X gridlines
      // $scatter.append("g")
      //   .attr("class", "grid")
      //   .attr("transform", "translate(0," + scatterHeight + ")")
      //   .call(make_x_gridlines()
      //     .tickSize(-scatterHeight)
      //     .tickFormat("")
      //   )

      // add the Y gridlines
      // $scatter.append("g")
      //   .attr("class", "grid")
      //   .call(make_y_gridlines()
      //     .tickSize(-scatterWidth)
      //     .tickFormat("")
      //   )

      //data setting
      xScale_.domain([...peopleSet.keys()]);
      yScale_.domain([0, 258]);
      // radius.domain(d3.)

      $scatter
        .append('g') //1 -> 让rect正对刻度
        .attr('transform', 'translate(1,' + scatterHeight + ')')
        .attr('class', 'x axis')
        .call(xAxis);
      $scatter
        .append('g')
        .attr('transform', 'translate(0,0)')
        .attr('class', 'y axis')
        .call(yAxis);

      var years = $scatter
        .append('g')
        .selectAll('.year')
        .data([...eventYearMap.entries()])
        .enter()
        .append('rect')
        .attr('class', 'year')
        .attr('x', 0)
        .attr('y', d => yScale_(d[1]))
        .attr('width', scatterWidth)
        .attr('height', 0.1)
        .style('stroke-width', 0.25);

      var xBlock;
      var yBlock;

      const colorThemes_ = {
        宋江: '#3c6da8',
        鲁智深: '#df2929',
        林冲: '#cab2d6',
        卢俊义: '#b2df8a',
        李应: '#a6cee3',
        孙立: ' #fdbf6f',
        无党派: ' #1d5464',
        非108将: '#ccc'
      };

      // var legends = $scatter
      //     .selectAll('.legends')
      //     .data(colorThemes_)
      //     .enter()
      //     .append('g')
      //     .append('rect')
      //     .attr()
      console.log(scatterData);
      var rect = $scatter
        // .append('g')
        .selectAll('.bubble')
        .data(scatterData)
        .enter()
        .append('rect')
        .attr('class', 'bubble')
        .attr('y', d => yScale_(d.eventId))
        .attr('x', d => xScale_(d.person))
        .attr('width', scatterWidth / peopleSet.size - 1)
        .attr('height', scatterHeight / response.length)
        .attr('transform', 'translate(2,-2)')
        .attr('data-event', d => d.eventId)
        .style('fill', d => {
          // color(d.eventId)
          return colorThemes_[groupMaps.get(d.person)]
            ? colorThemes_[groupMaps.get(d.person)]
            : color(7);
        })
        .on('mouseover', d => {
          rect.style('opacity', e => {
            if (e.person == d.person || e.eventId == d.eventId) {
              return 1;
            } else {
              return 0.5;
            }
          });
          // d3.select('#legends')
          //   .select('text')
          //   // .data([d])
          //   // .enter()
          //   // .append('text')
          //   .text(response[d.eventId -2]['事件']);
            // !!!eventId与yScale_的数值对应（0是无效数值），对应导response需要-2

            console.log(response);
          console.log(response[d.eventId - 1]);
          console.log(d.eventId);
          // xBlock = rect.append('rect')
          //             .attr('y',0)
          //             .attr('x',xScale_(d.person))
          //             .attr('width', scatterWidth / peopleSet.size)
          //             .attr('height',scatterHeight)
          //             .style('fill','rgba(255,255,255,0.3)')
          //             .style('stroke','#000')
          // yBlock = rect.append('rect')
          //             .attr('x', 0)
          //             .attr('y', d => yScale_(d.eventId))
          //             .attr('width', scatterWidth)
          //             .attr('height', 0.1)
          //             .style('stroke-width', 0.25)
          //             .attr('stroke','#000');
          //             console.log(yBlock);
        })
        .on('mouseout', d => {
          rect.style('opacity', 1);
        });

      var yearTexts = $scatter
        .append('g')
        .selectAll('text')
        .data([...eventYearMap.entries()])
        .enter()
        .append('text')
        .attr('x', scatterWidth)
        .text(d => d[0])
        .attr('y', d => yScale_(d[1]));

      // .tickPadding([12])

      debug && drawBrush();

      document.querySelector('.field').addEventListener('input',function(event){
        let value = event.target.value;
        if (peopleSet.has(value)) {
          rect.style('opacity', e => {
            if (e.person == value) {
              return 1;
            } else {
              return 0.5;
            }
          });
        }
        console.log(event.target.value);
      })

      document.querySelector('.field').addEventListener('blur', function (event) {
        document.querySelector('.field').value = '';
        rect.style('opacity', e => {
          return 1;
        });
      })

      document.querySelector('.icon-close').addEventListener('click',function () {
        document.querySelector('.field').value = '';
        rect.style('opacity', e => {
            return 1;
        });
      })

      function drawBrush() {
        var _brush = d3
          .brush()
          .extent([[0,0], [scatterWidth+20, scatterHeight+10]])
          // .on('start brush', brushmoved)
          .on('end', brushend);

        var $brush = $scatter
          .append('g')
          .attr('class', 'brush')
          .call(_brush);
        console.log('brush');

        // function brushmoved() {
        //   var s = d3.event.selection;
        //   if (s == null) {
        //     // handle.attr("display", "none");
        //     // circle.classed("active", false);
        //   } else {
        //     console.log(s,'brushmoved');
        //     // var sx = s.map(x.invert);
        //     // circle.classed("active", function (d) { return sx[0] <= d && d <= sx[1]; });
        //   }
        // }

        function brushend() {
          var s = d3.event.selection;
          var brushedEvent = new Set();
          var brushedPeople = new Set();
          // console.log(s,xScale_('高俅'),xScale_('王进'),yScale_(1),yScale_(0));
          // var _x0 = s[0][0] < 0 ?  0 : s[0][0],
          //   _x1 = s[1][0],
          //   _y0 = s[0][1],
          //   _y1 = s[1][1];
          //   console.log(xScale_(_x0),xScale_(_x1),yScale_(_y0),yScale_(_y1));
          rect.each((p, j) => {
            if (isBrushed(s, xScale_(p.person) + 4, yScale_(p.eventId))) {
              //获得选中的元素
              console.log(p, j); //p是元素，j是小矩形方块的序号
              brushedEvent.add(p.eventId);
              // console.log(response);
              response[p.eventId - 1].personArr.forEach(ele => {
                brushedPeople.add(ele);
              });
            }
          });
          console.log(brushedEvent, brushedPeople);
          var temp = [...brushedEvent],_scenes;
          console.log(temp);
          if (temp.length === 1) {
            _scenes = data.scenes.slice(temp[0]-1,temp[0]);
          } else {
            _scenes = data.scenes.slice(
              temp.shift() -1,
              temp.pop()
            );
          }
          // draw storyline
          // var

          // var _characters = data.characters.filter(e => {
          //   brushedPeople.has(e.name);
          // });

          // console.log(data.characters);
          let _data = { scenes: _scenes, characters: [] };
          console.log(_data.scenes);
          brushedPeople.forEach(ele => {
            // console.log('theme',colorThemes[groupMaps.get(ele)],ele);
            _data.characters.push({
              id: ele,
              name: ele,
              affiliation: colorThemes[groupMaps.get(ele)]
                ? colorThemes[groupMaps.get(ele)]
                : 'light'
            });
          });

          drawStoryLine(_data);
          // drawStoryLine(data);
          // console.log(data);
          d3.select('.container').classed('brushed', true);
          var _containerHeight = document.querySelector('.container')
            .offsetHeight;
          if (_containerHeight < 327) {
            _containerHeight = 350;
          } else {
            _containerHeight += 20
          }
          // console.log(_containerHeight);
          document.querySelector('.scatter-container').style.transform =
            'translate(0,' + _containerHeight + 'px)';

          if (!d3.event.selection) {
            console.log('There is no selection');
          }
        }
        // 判断是否被刷子选择
        function isBrushed(brush_coords, cx, cy) {
          var x0 = brush_coords[0][0],
            x1 = brush_coords[1][0],
            y0 = brush_coords[0][1],
            y1 = brush_coords[1][1];
          return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
          // This return TRUE or FALSE depending on if the points is in the selected area
        }
      }
    }
  });

  function makeSlider() {
    let svg = d3
      .select('#slider')
      .append('svg')
      .attr('width', 1200)
      .attr('height', 50)
      .attr('transform', 'translate(-10,0)');
    var tooltip = d3
      .select('#slider')
      .append('div')
      .attr('id', 'slidertip')
      .classed('tooltip', true)
      .style('opacity', 0);
    var x = d3
      .scaleLinear()
      .domain([0, 71])
      .range([0, template.width])
      .clamp(true);

    var slider = svg
      .append('g')
      .attr('class', 'slider')
      .attr('transform', 'translate(10' + ',' + 20 + ')');

    slider
      .append('line')
      .attr('class', 'track')
      .attr('x1', x.range()[0])
      .attr('x2', x.range()[1])
      .select(function() {
        return this.parentNode.appendChild(this.cloneNode(true));
      })
      .attr('class', 'track-inset')
      .select(function() {
        return this.parentNode.appendChild(this.cloneNode(true));
      })
      .attr('class', 'track-overlay')
      .call(
        d3
          .drag()
          .on('start.interrupt', function() {
            slider.interrupt();
          })
          .on('start drag', function() {
            hue(x.invert(d3.event.x));
          })
      );

    slider
      .insert('g', '.track-overlay')
      .attr('class', 'ticks')
      .attr('transform', 'translate(0,' + 18 + ')')
      .selectAll('text')
      .data(x.ticks(30))
      .enter()
      .append('text')
      .attr('x', x)
      .attr('text-anchor', 'middle')
      .text(function(d) {
        return d;
      });

    var handle = slider
      .insert('circle', '.track-overlay')
      .attr('class', 'slider-handle')
      .attr('r', 9);

    slider
      .transition()
      .duration(750)
      .tween('hue', function() {
        var i = d3.interpolate(0, 70);
        return function(t) {
          hue(i(t));
        };
      });

    function hue(h) {
      handle.attr('cx', x(h));
      //   console.log(x(h));
      if (scenes) {
        document.getElementById('story').scrollLeft =
          (x(h) / 800) * scenes.length * sceneWidth * 60;
      }
    }
  }
});

function wrangle(data) {
  var charactersMap = {};

  return data.scenes.map(function(scene) {
    return {
      characters: scene['people']
        .map(function(id) {
          return characterById(id);
        })
        .filter(function(d) {
          return d;
        }),
      chapter: scene.chapter,
      loc: scene.loc,
      event: scene.event,
      index: scene.index,
    };
  });

  // Helper to get characters by ID from the raw data
  function characterById(id) {
    charactersMap = charactersMap || {};
    charactersMap[id] =
      charactersMap[id] ||
      data.characters.find(function(character) {
        return character.id === id;
      });
    return charactersMap[id];
  }
}