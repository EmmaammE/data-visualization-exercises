/**
 * to define the style
 */
var template = {
	width: '800',
	height: '420',
	json: 'data.json',
	top: 20, //可以用来垫高
	left: 120
};

// const debug = true;
const debug = false;

(function (data) {

	var xScale;
	var yScale;
	var xAxis;
	var yAxis;

	/**
	 * to create the basic chart
	 */
	var $chart = d3
		.select('#chart-1')
		.append('svg')
		.attr('width', template.width)
		.attr('height', parseInt(template.height) + parseInt(template.top));
	// .attr('x',template.padding)
	// .append('g');
	/**
	 *
	 * load data
	 * @param {string} jsonFile
	 */
	function loadData(jsonFile, year) {
		return new Promise((resolve, reject) => {
			d3.json(jsonFile, function (error, data) {
				if (error) {
					reject(error);
				} else {
					resolve(handleData(data, year));
				}
			});
		});
	}

	function handleData(data, year) {
		let parsed_data = {};
		let currentMonth = 1;
		let sum = 0;

		for (let index = 0; index < data.length; index++) {
			const ele = data[index];

			if (ele.year === year) {
				// 下一个月的第一个数据
				if (ele.month !== currentMonth) {
					if (!parsed_data[year]) {
						// 初始化年份属性
						parsed_data[year] = [];
					}
					parsed_data[year].push({
						month: currentMonth,
						average: sum / data[index - 1].day / 10
					});

					sum = 0;
					currentMonth = ele.month; //Number
				}

				sum += ele.temperature;

				if (index === data.length - 1) {
					parsed_data[year].push({
						month: currentMonth,
						average: sum / data[index - 1].day / 10
					});
				}
			}
		}

		// console.log(parsed_data);
		return parsed_data[year];
	}

	function render($ele, data) {
		// console.log(data);

		//add the bars
		$ele
			.append('g')
			.selectAll('rect')
			.data(data)
			.enter()
			.append('rect')
			.attr('x', function (d, i) {
				debug && console.log('x:', d, ' ', i, ' ', xScale(i));
				//set the value of the axis center of the bar
				return xScale(i - 1) + template.width / (data.length + 1) / 2;
			})
			.attr('fill', '#222')
			.attr('width', (template.width - template.left) / (data.length + 1))
			.attr('y', yScale(-1))


			.attr('height', 0)
			// define hover
			.on('mouseover', function (d) {
				// showLabels(d);
			})
			.on('mouseout', function (d) {
				// hideLabels(d);
			})
			.transition()
			.delay(function (d, i) {
				return i * 150;
			})
			.ease(d3.easeSinIn)
			.attr('height', function (d, i) {
				debug && console.log('height:', i, ' ', yScale(d.average));
				return parseInt(template.height) - yScale(d.average);
			})
			.attr('y', function (d) {
				debug && console.log('y:', d, ' ', yScale(d.average));
				return yScale(d.average);
			})
			.attr('fill', 'rgb(255, 69, 0)');

		$ele
			.append('g')
			.attr('class', 'x axis')
			.attr('transform', 'translate( 3 ' + ',' + template.height + ')')
			.call(xAxis);

		$ele
			.append('g')
			.attr('class', 'y axis')
			// translate: adjust the position
			.attr('transform', 'translate(' + template.width / data.length + ',20)')
			.call(yAxis);

		// add the labels
		$ele
			.selectAll('.bar-label')
			.data(data)
			.enter()
			.append('text')
			.attr('class', 'bar-label')
			.attr('text-anchor', 'middle')
			.attr('opacity', 0)
			.attr('fill', '#222')
			.attr('stroke', '#222')
			.attr('x', function (d) {
				return xScale(d.month - 1) + 1;
			})
			.attr('y', function (d) {
				return yScale(d.average) + 20;
			})
			.text(function (d) {
				return Math.round(d.average * 100) / 100 + ' °C';
			})
			.transition()
			.delay(function (d, i) {
				return i * 150;
			})
			.duration(350)
			.ease(d3.easeElasticOut)
			.attr('opacity', 1)
			.attr('y', function (d) {
				return yScale(d.average) + 20;
			});
	}

	function initScale(dataset) {
		xScale = d3
			.scaleTime()
			.domain([-1, 12])
			.range([
				template.width / data.length / 2,
				template.width - template.width / data.length / 2
			]);

		// .range([template.left/2 + template.width / data.length /2, template.width - template.left  - template.width / data.length / 2]);

		yScale = d3
			.scaleLinear()
			.domain([0, d3.max(dataset, function (d) {
				return d.average;
			})
			])
			// output: from max value to min
			.range([template.height - template.top, template.top]);
	}

	function initAxis($ele) {
		xAxis = d3
			.axisBottom()
			.scale(xScale)
			.tickFormat(function (d, i) {
				if (i === 0 || i === 13) {
					return null;
				}
				var date = new Date(1, d, 1);
				return date.toLocaleDateString('en-us', {
					month: 'short'
				});
			});

		yAxis = d3
			.axisLeft()
			.scale(yScale)
			.ticks(10)
			.tickFormat(function (d) {
				// console.log("yAxis" , d); //value of the Axis
				return d.toFixed(2) + '℃';
			});
	}

	loadData(data, 2015)
		.then(parsed_data => {
			initScale(parsed_data);
			initAxis($chart);
			render($chart, parsed_data);
		})
		.catch(error => {
			console.log(error);
		});
})(template.json);
