(function () {
    var template = {
        padding: 20,
        padding_v: 20, //vertical
        width: 460, //960 - 20*2
        height: 300, //500 - 20*2
        width_: 500, //960 - 20*2 barchat
        height_: 300, //500 - 20*2
        file: 'top1000.csv', //  name num
        graph: '#cloud',
        barchart:'#barchart'
    }

    function setColor() {
        return d3.scaleOrdinal(d3.schemeCategory20);
    }
    function createWordCloud(init__,data) {
        var color = setColor();
        const {
            domain,
            range
        } = getScaleValues(data);
        var wordScale = d3.scaleLinear().domain(domain).range(range);

        var fontSize = d3.scalePow().exponent(5).domain([0, 1]).range([40, 80]);
        d3.layout.cloud()
            .size([template.width, template.height])
            .timeInterval(20)
            .words(data)
            .padding(2)
            .rotate(function (d) {
                return 0;
            })
            .fontSize(d => wordScale(d.num))
            .fontWeight(["bold"])
            .text(d => d.name)
            .spiral("archimedean") // "archimedean" or "rectangular"
            .on("end", draw)
            .start();

        function draw(words) {
            var $word = initGraph(template.graph);
            console.log(words);
            $word.selectAll("text")
                .data(words)
                .enter()
                .append("text")
                .style("font-size", d => d.size + "px")
                .style("fill", (d,i)=>color(i))
                .style("font-family", function (d) {
                    return d.font;
                })
                .attr("transform", function (d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                })
                .text(d => d.text)
                .on('mouseover',(d)=>{
                    console.log();
                    var barWords = findWords(init__, d.content);
                    console.log(barWords)
                    createBarchart(barWords,2)
                })
        }

        function initGraph(graph) {
            var svg = d3.select(graph).append("svg")
                .attr("width", template.width)
                .attr("height", template.height)
                .attr("transform", "translate(" + template.padding + "," + template.padding_v + ")");
            var g = svg.append("g").attr("transform", "translate(" + template.width / 2 + "," + template.height / 2 + ")");
            return g;
        }

        function getScaleValues(data) {
            var debug = false;
            var domain = d3.extent(data, d => d.num);
            var range = [20, 70]
            debug && console.log(range);
            return {
                domain: domain,
                range: range
            }
        }

    }

    // @test
    function loadData(file) {
        return new Promise((resolve, reject) => {
            d3.csv(file, function (error, data) {
                if (error) {
                    reject(error);
                } else {
                    // change "num" to Number
                    data.map(value => {
                        value.num = +value.num;
                    })
                    resolve(data);
                }
            });
        });
    }

    function createBarchart(data,type){

        if (type === 2) {
            var $barchart = d3.select(template.barchart)
                .select('svg')
            $barchart.select('.bars').data([]).exit().remove();
            $barchart.append('g').attr('class', 'bars')
        } else {
            var $barchart = d3.select(template.barchart)
                .append('svg')
                .attr('class', 'barchart')
                .attr("width", template.width_ + template.padding)
                .attr("height", template.height_ + template.padding_v)

            $barchart.append('g').attr('class','bars')

            $barchart
                .append('g')
                .attr('class', 'x axis');
            $barchart
                .append('g')
                .attr('class', 'y axis')
        }
        var xScale,yScale,xAxis,yAxis;
        var color = setColor();
        var data_extent = d3.extent(data, d => d.num);
        render();
        function render() {
            initScale(data);
            $barchart.select('.bars')
                .selectAll('rect')
                .data(data)
                .enter()
                .append('rect')
                .attr('x',(d,i)=>{
                    console.log(xScale(i));
                    return xScale(i) + (template.width_-150) / (data.length + 1);
                })
                .attr('fill',(d,i)=>color(i))
                .attr('width', (template.width_ - 150) / (data.length + 1))
                .attr('y', yScale(data_extent[0]))
                .attr('height', 0)
                // define hover
                .on('mouseover', function (d) {
                    // showLabels(d);
                })
                .on('mouseout', function (d) {
                    // hideLabels(d);
                })
                .transition()
                // .delay(function (d, i) {
                //     return i * 150;
                // })
                .ease(d3.easeSinIn)
                .attr('height', d => (template.height_  - yScale(d.num)))
                .attr('y', d => (yScale(d.num) ));

                $barchart
                    .select('.x')
                    .attr('transform', 'translate(' + template.padding + ',' + (template.height_) + ')')
                    .transition()
                    .call(xAxis);

                $barchart
                    .select('.y')
                    .attr('transform', 'translate(' + 2*template.padding + ',0)')
                    .transition()
                    .call(yAxis);
        }

        function initScale(data) {
            xScale = d3.scaleLinear()
                .domain([0,data.length+1])
                .range([
                    template.padding,
                    template.width
                ]);

            yScale = d3.scaleLinear()
                // .domain([0,d3.max(data,d=>d.num)])
                .domain(data_extent)
                .range([template.height,template.padding_v])
                .nice();

            xAxis = d3
                .axisBottom()
                .scale(xScale)
                .tickFormat((d,i)=>{
                    if(i===0||i===data.length+1) {
                        return null;
                    }
                    return data[i-1].name;
                })
                .ticks(data.length);

            yAxis = d3
                .axisLeft()
                .scale(yScale)
                .ticks(10);
        }
    }

    function findWords(words,content) {
        var result = [];
        words.map(value => {
            content.map(key => {
                if (value.name === key) {
                    result.push(value)
                }
            })
        })

        return result;
    }
    loadData(template.file)
        .then(parsed_data => {
            var debug = true;
            debug && console.log(parsed_data);
            // select words
            words = [];
            for (let index = 1; index < 40; index++) {
                words.push(parsed_data[index])

            }

            fakeGroup = [{
                name:'游子',
                content:["归","还","客"],
                num:4000
            }, {
                name: 'Test',
                content: ["君", "春", "秋"],
                num: 3000
            }];
            createWordCloud(words,fakeGroup);
            var barWords = findWords(words,fakeGroup[0].content);
            createBarchart(barWords)
        })
        .catch(error => {
            console.log(error);
        });
})()