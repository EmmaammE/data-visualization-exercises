var template = {
    width: '1000',
    height: '1000',
    padding: 20,
    xScaleTick: 50,
    yScaleTick: 20
};

var margin = {
    top: 30,
    right: 50,
    bottom: 60,
    left: 40
};

var scatterWidth = 1400 - margin.left - margin.right;
var scatterHeight = 1100 - margin.top - margin.bottom;

d3.csv('../data/event.csv', function (err, response) {
    var svg, scenes, charactersMap, width, height, sceneWidth;

    var data = {
        characters: [],
        scenes: []
    };


    response.sort((a,b) => a['年份']-b['年份']);
    console.log(response);

    d3.csv('../data/relation.csv', function (err, res) {
        // 108将中每个人的党派关系
        let groups = {
            无党派: []
        };
        res.forEach(ele => {
            let _group = ele.group;
            if (_group === '无党派') {
                groups['无党派'].push(ele);
            } else if (groups.hasOwnProperty(_group)) {
                groups[_group].push(ele);
            } else {
                groups[_group] = [ele];
            }
        });

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

        response.forEach(ele => {
            let arr = ele['人物'].split('、');
            if (!eventYearMap.has(+ele['年份'])) {
                eventYearMap.set(+ele['年份'], +ele['编号'])
            }
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
                event: ele['事件']
            });
        });
        peopleSet.forEach(ele => {
            // console.log('theme',colorThemes[groupMaps.get(ele)],ele);
            data.characters.push({
                id: ele,
                name: ele,
                affiliation: colorThemes[groupMaps.get(ele)]
                    ? colorThemes[groupMaps.get(ele)]
                    : 'light'
            });
        });
        console.log(peopleSet);
        // Get the data in the format we need to feed to d3.layout.narrative().scenes
        scenes = wrangle(data);
        // console.log(response);
        // console.log(scenes);

        // Some defaults
        sceneWidth = 5;
        width = scenes.length * sceneWidth * 20;
        height = 600;
        labelSize = [150, 15];

        // The container element (this is the HTML fragment);
        svg = d3
            .select('#story')
            .append('svg')
            .attr('id', 'narrative-chart')
            .attr('width', width)
            .attr('height', height);

        // Calculate the actual width of every character label.
        scenes.forEach(function (scene) {
            scene.characters.forEach(function (character) {
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
            // .orientation('vertical')
            .scenes(scenes)
            .size([width, height])
            .pathSpace(10)
            .groupMargin(10)
            .labelSize([250, 15])
            .scenePadding([5, sceneWidth / 2, 5, sceneWidth / 2])
            .labelPosition('left')
            .layout();

        // Get the extent so we can re-size the SVG appropriately.
        svg.attr('height', narrative.extent()[1]);

        // Draw the scenes
        svg
            .selectAll('.scene')
            .data(narrative.scenes())
            .enter()
            .append('g')
            .attr('class', 'scene')
            .attr('transform', function (d) {
                var x, y;
                x = Math.round(d.x) + 0.5;
                y = Math.round(d.y) + 0.5;
                return 'translate(' + [x, y] + ')';
            })
            .append('rect')
            .attr('width', sceneWidth)
            .attr('height', function (d) {
                return d.height;
            })
            .attr('y', 0)
            .attr('x', 0)
            .attr('rx', 3)
            .attr('ry', 3);

        // Draw appearances
        svg
            .selectAll('.scene')
            .selectAll('.appearance')
            .data(function (d) {
                return d.appearances;
            })
            .enter()
            .append('circle')
            .attr('cx', function (d) {
                return d.x;
            })
            .attr('cy', function (d) {
                return d.y;
            })
            .attr('r', function () {
                return 2;
            })
            .attr('class', function (d) {
                return 'appearance ' + d.character.affiliation;
            });
        //  return {
        //      appearance: d.appearances,
        //      event: d.event
        //  };
        //  }).enter().append('circle')
        //      .attr('cx', function (d) {
        //          return d.appearance.x;
        //      })
        //      .attr('cy', function (d) {
        //          return d.appearance.y;
        //      })
        //      .attr('r', function () {
        //          return 2;
        //      })
        //      .attr('class', function (d) {
        //          return 'appearance ' + d.appearance.character.affiliation;
        //      });

        // Draw links
        svg
            .selectAll('.link')
            .data(narrative.links())
            .enter()
            .append('path')
            .attr('class', function (d) {
                return 'link ' + d.character.affiliation.toLowerCase();
            })
            .attr('d', narrative.link());

        // Draw intro nodes
        svg
            .selectAll('.intro')
            .data(narrative.introductions())
            .enter()
            .call(function (s) {
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

                g.attr('transform', function (d) {
                    var x, y;
                    x = Math.round(d.x);
                    y = Math.round(d.y);
                    return 'translate(' + [x, y] + ')';
                });

                g.selectAll('text')
                    .attr('text-anchor', 'end')
                    .attr('y', '4px')
                    .attr('x', '-8px')
                    .text(function (d) {
                        return d.character.name;
                    });

                g.select('.color').attr('class', function (d) {
                    return 'color ' + d.character.affiliation;
                });

                g.select('rect').attr('class', function (d) {
                    return d.character.affiliation;
                });
            });

        makeSlider();
        drawScatter();

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
            var yScale_ = d3.scaleLinear().range([scatterHeight, 0]).nice();

            var xAxis = d3.axisBottom().scale(xScale_).tickPadding([20]);
            var yAxis = d3.axisLeft().scale(yScale_).ticks(71);
            var color = d3.scaleOrdinal(d3.schemeCategory20);

            //data setting
            // yScale.domain([...peopleSet.keys()]);

            xScale_.domain([...peopleSet.keys()]);
            yScale_.domain([0, 258]);
            // radius.domain(d3.)

            $scatter
                .append('g')
                .attr('transform', 'translate(0,' + scatterHeight + ')')
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
            var rect = $scatter
                // .append('g')
                .selectAll('.bubble')
                .data(scatterData)
                .enter()
                .append('rect')
                .attr('class', 'bubble')
                    .attr('y', d => yScale_(d.eventId))
                    .attr('x', d => xScale_(d.person))
                    .attr('width', scatterWidth / peopleSet.size)
                    .attr('height', 4)
                    .attr('transform', 'translate(2,-2)')
                    .attr('data-event', d => d.eventId)
                    .style('fill', d => color(d.eventId))
                .on('mouseover', d => {
                        rect.style('opacity',e => {
                                if(e.person == d.person || e.eventId == d.eventId) {
                                    return 1
                                } else {
                                    return 0.5
                                }
                            })
                        d3.select('#legends')
                            .select('text')
                            // .data([d])
                            // .enter()
                            // .append('text')
                            .text(response[d.eventId - 1]['事件'])
                            console.log(response[d.eventId - 1]);
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
                        rect.style('opacity', 1)
                    });

            var yearTexts = $scatter
                .append('g')
                .selectAll('text')
                .data([...eventYearMap.entries()])
                .enter()
                .append('text')
                .attr('x', scatterWidth)
                .text(d => d[0])
                .attr('y', d => yScale_(d[1]))

            // .tickPadding([12])
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
            .select(function () {
                return this.parentNode.appendChild(this.cloneNode(true));
            })
            .attr('class', 'track-inset')
            .select(function () {
                return this.parentNode.appendChild(this.cloneNode(true));
            })
            .attr('class', 'track-overlay')
            .call(
                d3
                    .drag()
                    .on('start.interrupt', function () {
                        slider.interrupt();
                    })
                    .on('start drag', function () {
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
            .text(function (d) {
                return d;
            });

        var handle = slider
            .insert('circle', '.track-overlay')
            .attr('class', 'handle')
            .attr('r', 9);

        slider
            .transition()
            .duration(750)
            .tween('hue', function () {
                var i = d3.interpolate(0, 70);
                return function (t) {
                    hue(i(t));
                };
            });

        function hue(h) {
            handle.attr('cx', x(h));
            //   console.log(x(h));
            if (scenes) {
                document.getElementById('story').scrollLeft =
                    (x(h) / 800) * scenes.length * sceneWidth * 20;
            }
        }
    }
});

function wrangle(data) {
    var charactersMap = {};

    return data.scenes.map(function (scene) {
        return {
            characters: scene['people']
                .map(function (id) {
                    return characterById(id);
                })
                .filter(function (d) {
                    return d;
                }),
            chapter: scene.chapter,
            loc: scene.loc,
            event: scene.event
        };
    });

    // Helper to get characters by ID from the raw data
    function characterById(id) {
        charactersMap = charactersMap || {};
        charactersMap[id] =
            charactersMap[id] ||
            data.characters.find(function (character) {
                return character.id === id;
            });
        return charactersMap[id];
    }
}
