var template = {
    width: '1000',
    height: '1000',
    padding: 20,
    xScaleTick: 50,
    yScaleTick: 20
};

d3.csv('../data/event.csv', function (err, response) {
    var svg, scenes, charactersMap, width, height, sceneWidth;

    var data = {
        "characters": [],
        "scenes": []
    };

    d3.csv('../data/relation.csv', function (err, res) {

        let groups = {
            "无党派": []
        };
        res.forEach(ele => {
            let _group = ele.group;
            if (_group === "无党派") {
                groups["无党派"].push(ele);
            } else if (groups.hasOwnProperty(_group)) {
                groups[_group].push(ele);
            } else {
                groups[_group] = [ele];
            }
        });

        // let bigGroups = new Map();
        let groupMaps = new Map();
        Object.keys(groups).forEach( key => {
            groups[key].forEach(item => {
                // console.log(item);
                if (key == "关胜" || key ==  "呼延灼" ||
                   key ==  "张清" || key == "戴宗" ||
                   key ==  "李逵" || key == "穆弘" ||
                   key ==  "李俊" || key == "欧鹏" || key == "燕顺") {
                    groupMaps.set(item.name,'宋江')
                } else if ( key == '史进') {
                    groupMaps.set(item.name,'鲁智深')
                } else {
                    groupMaps.set(item.name, key);
                }
            })
        });

        console.log(groupMaps);
        const colorThemes = {
            '宋江':'song',
            '鲁智深':'lu',
            '林冲':'lin',
            '卢俊义':'yi',
            '无党派':'wu',
            '李应':'li',
            '孙立':'sun',
        }
        // bigGroup.set('宋江',groups['宋江'].concat(groups["关胜"],groups["呼延灼"],
        //                                         groups["张清"],groups["戴宗"],
        //                                         groups["李逵"],groups["穆弘"],
        //                                         groups["李俊"],groups["欧鹏"],groups["燕顺"]));
        // bigGroups.set('鲁智深',groups["史进"]);

        var peopleSet = new Set();
        response.forEach(ele => {
            let arr = ele["人物"].split('、')
            arr.forEach(k => {
                peopleSet.add(k)
            })
            data.scenes.push({
                'people': arr,
                'chapter': ele['章回'],
                'loc': ele['地点（可确定）'],
                'event': ele["事件"]
            });
        })
        peopleSet.forEach(ele => {
            // console.log('theme',colorThemes[groupMaps.get(ele)],ele);
            data.characters.push({
                'id': ele,
                'name': ele,
                'affiliation': colorThemes[groupMaps.get(ele)] ? colorThemes[groupMaps.get(ele)]:'light'
            })
        })
        console.log(peopleSet);
        // Get the data in the format we need to feed to d3.layout.narrative().scenes
        scenes = wrangle(data);
        // console.log(response);
        console.log(scenes);

        // Some defaults
        sceneWidth = 5;
        width = scenes.length * sceneWidth * 20;
        height = 600;
        labelSize = [150, 15];

        // The container element (this is the HTML fragment);
        svg = d3.select("#story").append('svg')
            .attr('id', 'narrative-chart')
            .attr('width', width)
            .attr('height', height);

        // Calculate the actual width of every character label.
        scenes.forEach(function (scene) {
            scene.characters.forEach(function (character) {
                character.width = svg.append('text')
                    .attr('opacity', 0)
                    .attr('class', 'temp')
                    .text(character.name)
                    .node().getComputedTextLength() + 10;
            });
        });

        // Remove all the temporary labels.
        svg.selectAll('text.temp').remove();

        // console.log(typeof d3.layout.narrative);
        // Do the layout
        narrative =
            d3.layout.narrative()
            // narrativeUtil()
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
        svg.selectAll('.scene').data(narrative.scenes()).enter()
            .append('g').attr('class', 'scene')
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
        svg.selectAll('.scene').selectAll('.appearance').data(function (d) {
                return d.appearances;
            }).enter().append('circle')
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
        svg.selectAll('.link').data(narrative.links()).enter()
            .append('path')
            .attr('class', function (d) {
                return 'link ' + d.character.affiliation.toLowerCase();
            })
            .attr('d', narrative.link());

        // Draw intro nodes
        svg.selectAll('.intro').data(narrative.introductions())
            .enter().call(function (s) {
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

                g.select('.color')
                    .attr('class', function (d) {
                        return 'color ' + d.character.affiliation;
                    });

                g.select('rect')
                    .attr('class', function (d) {
                        return d.character.affiliation;
                    });

            });

        makeSlider();

    })

    /**
     * chapterLine:
     *      peopleSet
     */
    function renderChapterLine() {
        var xScale_ = d3
            .scaleLinear()
            .domain([1, 71])
            .range([template.padding, template.width - 2 * template.padding]);

        var xAxis_ = d3
            .axisBottom()
            .scale(xScale_)
            .ticks(template.xScaleTick);

        var yScale_ = d3
            .scaleLinear()
            .domain([0, 20])
            .range([template.height - template.padding, template.padding]);

        // var setIter = peopleSet.entries();
        var yAxis_ = d3
            .axisLeft()
            .scale(yScale_)
            .ticks(140)
        //  .tickFormat(function (d, i) {
        //    return setIter.next().value[0];
        //  });

        var $timeline = d3.select('#chapterLine').append('svg')
            .attr('width', template.width)
            .attr('height', template.height);

        $timeline
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
            .call(xAxis_);

        $timeline
            .append('g')
            .attr('class', 'y axis')
            .attr('transform', 'translate(' + template.padding * 2 + ',0)')
            .call(yAxis_);

    }

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
            console.log(x(h));
            if (scenes) {
                document.getElementById("story").scrollLeft = x(h) / 800 * scenes.length * sceneWidth * 20;;
            }
        }
    }
    // renderChapterLine();
});

function wrangle(data) {

    var charactersMap = {};

    return data.scenes.map(function (scene) {
        return {
            characters: scene['people'].map(function (id) {
                return characterById(id);
            }).filter(function (d) {
                return (d);
            }),
            'chapter': scene.chapter,
            'loc': scene.loc,
            'event': scene.event
        };
    });

    // Helper to get characters by ID from the raw data
    function characterById(id) {
        charactersMap = charactersMap || {};
        charactersMap[id] = charactersMap[id] || data.characters.find(function (character) {
            return character.id === id;
        });
        return charactersMap[id];
    }

}