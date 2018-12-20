(function () {
    var template = {
        padding: 20,
        padding_v: 20, //vertical
        width: 920, //960 - 20*2
        height: 460, //500 - 20*2
        file: 'top1000.csv', //  name num
        graph: '#cloud'
    }

    function getScaleValues(data) {
        var debug = false;
        var domain = d3.extent(data,d=>d.num);
        var range = [20, 70]
        debug && console.log(range);
        return {
            domain: domain,
            range: range
        }
    }

    function createWordCloud(data) {
        console.log(data);
        console.log(data);
        var color = d3.scaleOrdinal(d3.schemeCategory20);
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
        }

    }

    function initGraph(graph) {
        var svg = d3.select(graph).append("svg")
            .attr("width", template.width)
            .attr("height", template.height)
            .attr("transform", "translate(" + template.padding + "," + template.padding_v + ")");
        var g = svg.append("g").attr("transform", "translate(" + template.width / 2 + "," + template.height / 2 + ")");
        return g;
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

    loadData(template.file)
        .then(parsed_data => {
            var debug = true;
            debug && console.log(parsed_data);
            // select words
            words = [];
            for (let index = 1; index < 40; index++) {
                words.push(parsed_data[index])

            }
            createWordCloud(words);
        })
        .catch(error => {
            console.log(error);
        });
})()